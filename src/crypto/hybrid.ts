// Chiffrement hybride RSA-OAEP + AES-256-GCM.
//
// RSA ne peut chiffrer que quelques centaines d'octets (190 avec une clé de
// 2048 bits et OAEP SHA-256). On chiffre donc le fichier avec une clé AES
// aléatoire, la « clé de session », et c'est cette clé que RSA protège.
//
// Chiffrement, dans l'ordre réel des opérations :
//   1. clé de session  : AES-256 aléatoire et préfixe d'IV de 8 octets ;
//   2. scellement      : clé de session chiffrée par RSA-OAEP avec la clé publique du destinataire ;
//   3. contenu         : métadonnées et fichier chiffrés par AES-GCM, morceau par morceau ;
//   4. assemblage      : en-tête suivi des morceaux, voir container.ts.
//
// Chaque morceau a son IV (préfixe et numéro) et authentifie l'en-tête, son
// numéro et un drapeau « dernier morceau » : on ne peut ni modifier, ni
// réordonner, ni tronquer le fichier sans que le déchiffrement échoue.

import {
  type ContainerHeader,
  encodePrefix,
  parseContainer,
  TAG_BYTES,
} from "./container";
import {
  type Bytes,
  concatBytes,
  fromBase64,
  fromUtf8,
  randomBytes,
  readU32,
  sha256,
  toBase64,
  toHex,
  u32,
  utf8,
} from "./encoding";
import { FileSecureError } from "./errors";

export const MAX_FILE_SIZE = 100 * 1024 * 1024;
export const DEFAULT_CHUNK_SIZE = 1024 * 1024;
/** Nombre d'octets transmis à la visualisation (grille de 32 x 12). */
export const PREVIEW_BYTES = 384;

export type EncryptStage = "session-key" | "wrap-key" | "encrypt-content" | "assemble";
export type DecryptStage = "read-header" | "unwrap-key" | "decrypt-content" | "verify";

export interface ProgressEvent<S extends string> {
  stage: S;
  /** Avancement de l'étape, de 0 à 1. */
  progress: number;
}

export interface FileMeta {
  name: string;
  type: string;
  size: number;
  sha256: string;
}

export interface Recipient {
  publicKey: CryptoKey;
  kid: string;
  bits: number;
}

export interface EncryptResult {
  parts: Bytes[];
  size: number;
  header: ContainerHeader;
  meta: FileMeta;
  /** Répartition des octets du fichier produit, pour l'affichage. */
  layout: { header: number; wrappedKey: number; content: number };
}

export interface DecryptResult {
  data: Bytes;
  meta: FileMeta;
  sha256: string;
  header: ContainerHeader;
}

function chunkIv(ivPrefix: Bytes, index: number): Bytes {
  return concatBytes(ivPrefix, u32(index));
}

function chunkAad(prefix: Bytes, index: number, last: boolean): Bytes {
  return concatBytes(prefix, u32(index), Uint8Array.of(last ? 1 : 0));
}

/** Morceau [start, end) de la suite « métadonnées puis fichier », sans copier le fichier. */
function slicePayload(head: Bytes, data: Bytes, start: number, end: number): Bytes {
  if (start >= head.length) return data.subarray(start - head.length, end - head.length);
  return concatBytes(head.subarray(start, Math.min(end, head.length)), data.subarray(0, Math.max(0, end - head.length)));
}

export async function encryptFile(
  input: { data: Bytes; name: string; type: string },
  recipient: Recipient,
  options: {
    chunkSize?: number;
    onProgress?: (e: ProgressEvent<EncryptStage>) => void;
    /** Reçoit les premiers octets chiffrés dès qu'ils existent (pour la visualisation). */
    onPreview?: (cipherSample: Bytes) => void;
  } = {},
): Promise<EncryptResult> {
  const { data } = input;
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const report = (stage: EncryptStage, progress: number) => options.onProgress?.({ stage, progress });

  if (data.length > MAX_FILE_SIZE) {
    throw new FileSecureError("TOO_LARGE", `Fichier trop volumineux : la limite est de ${MAX_FILE_SIZE / 1024 / 1024} Mo.`);
  }

  // 1. Clé de session
  report("session-key", 0);
  const sessionKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", sessionKey));
  const ivPrefix = randomBytes(8);
  report("session-key", 1);

  // 2. Scellement de la clé de session par RSA-OAEP
  report("wrap-key", 0);
  const wrappedKey = new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, recipient.publicKey, rawKey));
  rawKey.fill(0);
  report("wrap-key", 1);

  // 3. Contenu : les métadonnées (dont le nom) sont chiffrées avec le fichier.
  report("encrypt-content", 0);
  const meta: FileMeta = { name: input.name, type: input.type, size: data.length, sha256: toHex(await sha256(data)) };
  const metaBytes = utf8.encode(JSON.stringify(meta));
  const head = concatBytes(u32(metaBytes.length), metaBytes);
  const total = head.length + data.length;
  const chunks = Math.max(1, Math.ceil(total / chunkSize));

  const header: ContainerHeader = {
    alg: { key: "RSA-OAEP-256", data: "AES-256-GCM" },
    kid: recipient.kid,
    bits: recipient.bits,
    wrappedKey: toBase64(wrappedKey),
    ivPrefix: toBase64(ivPrefix),
    chunkSize,
    chunks,
  };
  const prefix = encodePrefix(header);
  const parts: Bytes[] = [prefix];

  for (let i = 0; i < chunks; i++) {
    const plain = slicePayload(head, data, i * chunkSize, Math.min(total, (i + 1) * chunkSize));
    const sealed = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: chunkIv(ivPrefix, i), additionalData: chunkAad(prefix, i, i === chunks - 1) },
      sessionKey,
      plain,
    );
    parts.push(new Uint8Array(sealed));
    if (i === 0) options.onPreview?.(parts[1].slice(0, PREVIEW_BYTES));
    report("encrypt-content", (i + 1) / chunks);
  }

  // 4. Assemblage
  report("assemble", 0);
  const size = parts.reduce((n, p) => n + p.length, 0);
  const content = size - prefix.length;
  report("assemble", 1);

  return {
    parts,
    size,
    header,
    meta,
    layout: { header: prefix.length - header.wrappedKey.length, wrappedKey: header.wrappedKey.length, content },
  };
}

/** Lit l'en-tête sans rien déchiffrer : à qui le fichier est-il destiné ? */
export function inspectContainer(bytes: Bytes): ContainerHeader {
  return parseContainer(bytes).header;
}

function tampered(message: string): FileSecureError {
  return new FileSecureError("TAMPERED", message);
}

export async function decryptFile(
  bytes: Bytes,
  identity: { privateKey: CryptoKey; kid: string },
  options: {
    onProgress?: (e: ProgressEvent<DecryptStage>) => void;
    /** Reçoit les premiers octets du fichier restauré dès le premier morceau ouvert. */
    onPreview?: (plainSample: Bytes) => void;
  } = {},
): Promise<DecryptResult> {
  const report = (stage: DecryptStage, progress: number) => options.onProgress?.({ stage, progress });

  // 1. En-tête
  report("read-header", 0);
  const { header, prefix, body } = parseContainer(bytes);
  if (header.kid !== identity.kid) {
    throw new FileSecureError(
      "WRONG_KEY",
      "Ce fichier n'a pas été chiffré pour votre clé : il est destiné à une autre personne.",
    );
  }
  const n = header.chunks;
  const full = header.chunkSize + TAG_BYTES;
  if (body.length < (n - 1) * full + TAG_BYTES + 1 || body.length > n * full) {
    throw tampered("Le fichier chiffré est incomplet ou a été modifié.");
  }
  report("read-header", 1);

  // 2. Clé de session, ouverte avec la clé privée RSA
  report("unwrap-key", 0);
  let rawKey: Bytes;
  try {
    rawKey = new Uint8Array(
      await crypto.subtle.decrypt({ name: "RSA-OAEP" }, identity.privateKey, fromBase64(header.wrappedKey)),
    );
  } catch {
    throw tampered("Impossible d'ouvrir la clé de session : le fichier a été modifié ou ne correspond pas à votre clé.");
  }
  if (rawKey.length !== 32) throw tampered("La clé de session récupérée est invalide.");
  const sessionKey = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
  rawKey.fill(0);
  report("unwrap-key", 1);

  // 3. Contenu
  report("decrypt-content", 0);
  const ivPrefix = fromBase64(header.ivPrefix);
  const plain = new Uint8Array(body.length - n * TAG_BYTES);
  for (let i = 0; i < n; i++) {
    const sealed = body.subarray(i * full, Math.min(body.length, (i + 1) * full));
    let opened: ArrayBuffer;
    try {
      opened = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: chunkIv(ivPrefix, i), additionalData: chunkAad(prefix, i, i === n - 1) },
        sessionKey,
        sealed,
      );
    } catch {
      throw tampered("Le fichier a été modifié : l'étiquette d'intégrité AES-GCM ne correspond pas. Déchiffrement refusé.");
    }
    plain.set(new Uint8Array(opened), i * header.chunkSize);
    if (i === 0 && options.onPreview && opened.byteLength >= 4) {
      const metaEnd = 4 + readU32(plain, 0);
      if (metaEnd <= opened.byteLength) options.onPreview(plain.slice(metaEnd, Math.min(opened.byteLength, metaEnd + PREVIEW_BYTES)));
    }
    report("decrypt-content", (i + 1) / n);
  }

  // 4. Vérification : métadonnées, taille et SHA-256 du fichier restauré
  report("verify", 0);
  const integrity = () => new FileSecureError("INTEGRITY", "Le fichier restauré ne correspond pas à l'original.");
  if (plain.length < 4) throw integrity();
  const metaLength = readU32(plain, 0);
  if (4 + metaLength > plain.length) throw integrity();
  let meta: FileMeta;
  try {
    meta = JSON.parse(fromUtf8.decode(plain.subarray(4, 4 + metaLength)));
  } catch {
    throw integrity();
  }
  const data = plain.subarray(4 + metaLength);
  if (data.length !== meta.size) throw integrity();
  const digest = toHex(await sha256(data));
  if (digest !== meta.sha256) throw integrity();
  report("verify", 1);

  return { data, meta, sha256: digest, header };
}

/** Rassemble les morceaux d'un résultat de chiffrement en un seul tableau d'octets. */
export function joinParts(parts: Bytes[]): Bytes {
  return concatBytes(...parts);
}
