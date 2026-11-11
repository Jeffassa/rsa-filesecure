// Paires de clés RSA : génération, empreintes, export et import.
//
// Toutes les opérations passent par l'API Web Crypto du navigateur :
// on ne fabrique jamais les nombres premiers à la main pour de vraies clés.
//   - clé publique : PEM au format SPKI, partageable ;
//   - clé privée   : PKCS#8 chiffré par mot de passe (PBKDF2 puis AES-256-GCM).

import {
  type Bytes,
  fromBase64,
  groupFingerprint,
  parsePem,
  randomBytes,
  sha256,
  toBase64,
  toHex,
  toPem,
  utf8,
} from "./encoding";
import { FileSecureError } from "./errors";

export const KEY_SIZES = [2048, 3072, 4096] as const;
export type KeySize = (typeof KEY_SIZES)[number];
export const DEFAULT_KEY_SIZE: KeySize = 3072;
export const MIN_KEY_BITS = 2048;
export const PBKDF2_ITERATIONS = 600_000;
export const MIN_PASSWORD_LENGTH = 8;

const KEY_FILE_FORMAT = "rsa-filesecure-private-key";
const PUBLIC_EXPONENT = new Uint8Array([1, 0, 1]); // 65537
const RSA_IMPORT: RsaHashedImportParams = { name: "RSA-OAEP", hash: "SHA-256" };

export function rsaParams(bits: number): RsaHashedKeyGenParams {
  return { name: "RSA-OAEP", modulusLength: bits, publicExponent: PUBLIC_EXPONENT, hash: "SHA-256" };
}

export interface KeyId {
  /** SHA-256 complet de la clé publique (SPKI), en hexadécimal. */
  kid: string;
  /** Les 32 premiers caractères, groupés par 4, à comparer à voix haute. */
  fingerprint: string;
}

export interface PublicKeyInfo extends KeyId {
  name: string;
  bits: number;
  spki: Bytes;
  publicKey: CryptoKey;
}

export interface Identity extends PublicKeyInfo {
  privateKey: CryptoKey;
  createdAt: string;
  /** Faux quand la clé privée vient d'un fichier : elle n'est plus exportable. */
  exportable: boolean;
}

export async function keyIdOf(spki: Bytes): Promise<KeyId> {
  const kid = toHex(await sha256(spki));
  return { kid, fingerprint: groupFingerprint(kid) };
}

function modulusBits(key: CryptoKey): number {
  return (key.algorithm as RsaHashedKeyAlgorithm).modulusLength;
}

function cleanName(name: string): string {
  return name.replace(/[\r\n]+/g, " ").trim().slice(0, 60) || "Sans nom";
}

export async function generateIdentity(name: string, bits: KeySize = DEFAULT_KEY_SIZE): Promise<Identity> {
  const pair = (await crypto.subtle.generateKey(rsaParams(bits), true, ["encrypt", "decrypt"])) as CryptoKeyPair;
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
  return {
    name: cleanName(name),
    bits,
    spki,
    publicKey: pair.publicKey,
    privateKey: pair.privateKey,
    createdAt: new Date().toISOString(),
    exportable: true,
    ...(await keyIdOf(spki)),
  };
}

/** Composantes de la clé (n, e, d, p, q) en hexadécimal, pour l'affichage pédagogique. */
export async function keyComponents(identity: Identity) {
  if (!identity.exportable) return null;
  const jwk = await crypto.subtle.exportKey("jwk", identity.privateKey);
  const hex = (b64url?: string) =>
    b64url ? toHex(fromBase64(b64url.replace(/-/g, "+").replace(/_/g, "/"))) : "";
  return { n: hex(jwk.n), e: hex(jwk.e), d: hex(jwk.d), p: hex(jwk.p), q: hex(jwk.q) };
}

// ---------------------------------------------------------------- clé publique

export function publicKeyToPem(info: Pick<PublicKeyInfo, "name" | "bits" | "fingerprint" | "spki">): string {
  return [
    "RSA FileSecure, clé publique",
    `Nom : ${cleanName(info.name)}`,
    `Taille : ${info.bits} bits`,
    `Empreinte : ${info.fingerprint}`,
    "",
    toPem("PUBLIC KEY", info.spki),
  ].join("\n");
}

export async function importPublicKey(text: string): Promise<PublicKeyInfo> {
  const block = parsePem(text);
  if (block.label.includes("PRIVATE")) {
    throw new FileSecureError(
      "PRIVATE_KEY_SHARED",
      "Ce fichier est une clé privée. Elle ne doit jamais être partagée : demandez à votre binôme sa clé publique.",
    );
  }
  if (block.label !== "PUBLIC KEY") {
    throw new FileSecureError("NOT_PUBLIC_KEY", "Ce fichier n'est pas une clé publique RSA au format SPKI.");
  }
  let publicKey: CryptoKey;
  try {
    publicKey = await crypto.subtle.importKey("spki", block.der, RSA_IMPORT, true, ["encrypt"]);
  } catch {
    throw new FileSecureError("NOT_PUBLIC_KEY", "Ce fichier n'est pas une clé publique RSA valide.");
  }
  const bits = modulusBits(publicKey);
  if (bits < MIN_KEY_BITS) {
    throw new FileSecureError(
      "KEY_TOO_WEAK",
      `Cette clé ne fait que ${bits} bits. Le minimum accepté est ${MIN_KEY_BITS} bits.`,
    );
  }
  const name = /^Nom\s*:\s*(.+)$/m.exec(block.preamble)?.[1].trim() ?? "Binôme";
  return { name: cleanName(name), bits, spki: block.der, publicKey, ...(await keyIdOf(block.der)) };
}

// ------------------------------------------------------------------ clé privée

interface PrivateKeyFile {
  format: typeof KEY_FILE_FORMAT;
  version: 1;
  avertissement: string;
  name: string;
  bits: number;
  kid: string;
  createdAt: string;
  publicKey: string;
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: number; salt: string };
  cipher: { name: "AES-GCM"; iv: string };
  data: string;
}

async function passwordKey(password: string, salt: Bytes, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", utf8.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Fichier .rsakey : la clé privée PKCS#8, chiffrée par un mot de passe. */
export async function exportProtectedPrivateKey(
  identity: Identity,
  password: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new FileSecureError(
      "PASSWORD_TOO_SHORT",
      `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    );
  }
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", identity.privateKey));
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await passwordKey(password, salt, iterations);
  // L'identifiant de clé est authentifié : on ne peut pas recoller ce bloc sur une autre clé publique.
  const data = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: utf8.encode(identity.kid) }, key, pkcs8),
  );
  pkcs8.fill(0);
  const file: PrivateKeyFile = {
    format: KEY_FILE_FORMAT,
    version: 1,
    avertissement: "Clé privée chiffrée par mot de passe. Ne la partagez jamais, pas même avec votre binôme.",
    name: identity.name,
    bits: identity.bits,
    kid: identity.kid,
    createdAt: identity.createdAt,
    publicKey: toBase64(identity.spki),
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations, salt: toBase64(salt) },
    cipher: { name: "AES-GCM", iv: toBase64(iv) },
    data: toBase64(data),
  };
  return JSON.stringify(file, null, 2);
}

function invalidKeyFile(): FileSecureError {
  return new FileSecureError("KEY_FILE_INVALID", "Ce fichier n'est pas une clé privée RSA FileSecure (.rsakey).");
}

function parseKeyFile(text: string): PrivateKeyFile {
  let f: PrivateKeyFile;
  try {
    f = JSON.parse(text);
  } catch {
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) {
      throw new FileSecureError(
        "KEY_FILE_INVALID",
        "Cette clé privée n'est pas protégée par mot de passe. Utilisez le fichier .rsakey créé par le site.",
      );
    }
    throw invalidKeyFile();
  }
  const ok =
    f &&
    f.format === KEY_FILE_FORMAT &&
    f.version === 1 &&
    typeof f.kid === "string" &&
    typeof f.publicKey === "string" &&
    typeof f.data === "string" &&
    f.kdf?.name === "PBKDF2" &&
    Number.isInteger(f.kdf.iterations) &&
    f.kdf.iterations >= 1000 &&
    f.kdf.iterations <= 10_000_000 &&
    typeof f.kdf.salt === "string" &&
    f.cipher?.name === "AES-GCM" &&
    typeof f.cipher.iv === "string";
  if (!ok) throw invalidKeyFile();
  return f;
}

/** Lit un fichier .rsakey sans le mot de passe : nom, taille, empreinte. */
export async function peekPrivateKeyFile(text: string): Promise<KeyId & { name: string; bits: number }> {
  const f = parseKeyFile(text);
  const ids = await keyIdOf(fromBase64(f.publicKey));
  if (ids.kid !== f.kid) throw invalidKeyFile();
  return { ...ids, name: String(f.name ?? "Sans nom"), bits: Number(f.bits) };
}

export async function importProtectedPrivateKey(text: string, password: string): Promise<Identity> {
  const f = parseKeyFile(text);
  let spki: Bytes, salt: Bytes, iv: Bytes, data: Bytes;
  try {
    spki = fromBase64(f.publicKey);
    salt = fromBase64(f.kdf.salt);
    iv = fromBase64(f.cipher.iv);
    data = fromBase64(f.data);
  } catch {
    throw invalidKeyFile();
  }
  const ids = await keyIdOf(spki);
  if (ids.kid !== f.kid) throw new FileSecureError("KEY_FILE_INVALID", "Le fichier de clé a été modifié.");

  const key = await passwordKey(password, salt, f.kdf.iterations);
  let pkcs8: Bytes;
  try {
    pkcs8 = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: utf8.encode(f.kid) }, key, data),
    );
  } catch {
    throw new FileSecureError("WRONG_PASSWORD", "Mot de passe incorrect, ou fichier de clé endommagé.");
  }
  // Non exportable : une fois chargée, la clé privée ne peut plus sortir du navigateur.
  const privateKey = await crypto.subtle.importKey("pkcs8", pkcs8, RSA_IMPORT, false, ["decrypt"]);
  pkcs8.fill(0);
  const publicKey = await crypto.subtle.importKey("spki", spki, RSA_IMPORT, true, ["encrypt"]);
  return {
    name: cleanName(String(f.name ?? "")),
    bits: modulusBits(publicKey),
    spki,
    publicKey,
    privateKey,
    createdAt: String(f.createdAt ?? ""),
    exportable: false,
    ...ids,
  };
}
