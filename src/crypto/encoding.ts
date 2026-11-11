// Conversions d'octets : Base64, hexadécimal, PEM, entiers 32 bits.
// Aucune dépendance : ces fonctions tournent dans le navigateur et sous Node.

import { FileSecureError } from "./errors";

/** Octets adossés à un ArrayBuffer ordinaire, ce qu'attend l'API Web Crypto. */
export type Bytes = Uint8Array<ArrayBuffer>;

export const utf8 = new TextEncoder();
export const fromUtf8 = new TextDecoder("utf-8", { fatal: true });

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const STEP = 0x8000;
  for (let i = 0; i < bytes.length; i += STEP) {
    binary += String.fromCharCode(...bytes.subarray(i, i + STEP));
  }
  return btoa(binary);
}

export function fromBase64(text: string): Bytes {
  const binary = atob(text.replace(/\s+/g, ""));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function toHex(bytes: Uint8Array): string {
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

export function concatBytes(...parts: Uint8Array[]): Bytes {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function u32(n: number): Bytes {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, n, false);
  return out;
}

export function readU32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, false);
}

export function randomBytes(n: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(n));
}

export async function sha256(data: Bytes): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

/** Encode un DER en PEM, lignes de 64 caractères. */
export function toPem(label: string, der: Uint8Array): string {
  const body = toBase64(der).match(/.{1,64}/g)?.join("\n") ?? "";
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----\n`;
}

export interface PemBlock {
  label: string;
  der: Bytes;
  /** Lignes de texte placées avant le bloc (commentaires). */
  preamble: string;
}

/** Lit le premier bloc PEM d'un texte, quel que soit son libellé. */
export function parsePem(text: string): PemBlock {
  const match = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/.exec(text);
  if (!match) {
    throw new FileSecureError("PEM_INVALID", "Ce fichier ne contient pas de clé au format PEM.");
  }
  const body = match[2].replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(body)) {
    throw new FileSecureError("PEM_INVALID", "Le contenu de la clé PEM est endommagé.");
  }
  return { label: match[1], der: fromBase64(body), preamble: text.slice(0, match.index) };
}

/** Empreinte lisible : 32 caractères hexadécimaux en groupes de 4. */
export function groupFingerprint(hex: string): string {
  return hex
    .slice(0, 32)
    .toUpperCase()
    .match(/.{4}/g)!
    .join(" ");
}
