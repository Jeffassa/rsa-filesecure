// Format du fichier chiffré .rsaenc (version 1)
//
//   octets 0 à 5    "RSAENC"                  préfixe magique
//   octet  6        0x01                      version du format
//   octets 7 à 10   longueur L de l'en-tête   entier 32 bits, gros-boutiste
//   L octets        en-tête JSON (UTF-8)      voir ContainerHeader
//   reste           morceaux chiffrés         chacun : AES-GCM(morceau) suivi de son étiquette de 16 octets
//
// Les 11 + L premiers octets (le « préfixe ») sont authentifiés par chaque
// morceau AES-GCM : modifier un seul octet de l'en-tête fait échouer le déchiffrement.

import { type Bytes, bytesEqual, concatBytes, fromBase64, fromUtf8, readU32, u32, utf8 } from "./encoding";
import { FileSecureError } from "./errors";

export const MAGIC = utf8.encode("RSAENC");
export const FORMAT_VERSION = 1;
export const TAG_BYTES = 16;
export const FIXED_PREFIX_BYTES = MAGIC.length + 1 + 4;

export interface ContainerHeader {
  alg: { key: "RSA-OAEP-256"; data: "AES-256-GCM" };
  /** Identifiant (SHA-256 de la clé publique) du destinataire. */
  kid: string;
  bits: number;
  /** Clé de session AES chiffrée avec la clé publique RSA du destinataire. */
  wrappedKey: string;
  /** 8 octets aléatoires ; l'IV de chaque morceau vaut ivPrefix suivi du numéro du morceau. */
  ivPrefix: string;
  chunkSize: number;
  chunks: number;
}

export function encodePrefix(header: ContainerHeader): Bytes {
  const json = utf8.encode(JSON.stringify(header));
  return concatBytes(MAGIC, Uint8Array.of(FORMAT_VERSION), u32(json.length), json);
}

export interface ParsedContainer {
  header: ContainerHeader;
  /** Octets exacts de l'en-tête, utilisés comme données authentifiées. */
  prefix: Bytes;
  body: Bytes;
}

function corrupted(): FileSecureError {
  return new FileSecureError("CORRUPTED", "L'en-tête du fichier chiffré est endommagé.");
}

export function parseContainer(bytes: Bytes): ParsedContainer {
  if (bytes.length < FIXED_PREFIX_BYTES || !bytesEqual(bytes.subarray(0, MAGIC.length), MAGIC)) {
    throw new FileSecureError("NOT_RSAENC", "Ce fichier n'est pas un fichier chiffré RSA FileSecure (.rsaenc).");
  }
  const version = bytes[MAGIC.length];
  if (version !== FORMAT_VERSION) {
    throw new FileSecureError("UNSUPPORTED_VERSION", `La version ${version} du format n'est pas prise en charge.`);
  }
  const length = readU32(bytes, MAGIC.length + 1);
  if (length < 2 || length > 65_536 || FIXED_PREFIX_BYTES + length > bytes.length) throw corrupted();

  let h: ContainerHeader;
  try {
    h = JSON.parse(fromUtf8.decode(bytes.subarray(FIXED_PREFIX_BYTES, FIXED_PREFIX_BYTES + length)));
  } catch {
    throw corrupted();
  }
  const valid =
    h &&
    h.alg?.key === "RSA-OAEP-256" &&
    h.alg?.data === "AES-256-GCM" &&
    typeof h.kid === "string" &&
    /^[0-9a-f]{64}$/.test(h.kid) &&
    Number.isInteger(h.bits) &&
    h.bits >= 1024 &&
    h.bits <= 16_384 &&
    typeof h.wrappedKey === "string" &&
    typeof h.ivPrefix === "string" &&
    Number.isInteger(h.chunkSize) &&
    h.chunkSize >= 16 &&
    h.chunkSize <= 64 * 1024 * 1024 &&
    Number.isInteger(h.chunks) &&
    h.chunks >= 1;
  if (!valid) throw corrupted();
  try {
    if (fromBase64(h.ivPrefix).length !== 8) throw corrupted();
    fromBase64(h.wrappedKey);
  } catch {
    throw corrupted();
  }
  const end = FIXED_PREFIX_BYTES + length;
  return { header: h, prefix: bytes.subarray(0, end), body: bytes.subarray(end) };
}
