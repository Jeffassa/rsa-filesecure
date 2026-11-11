// Tests partagés : les mêmes cas tournent sous Node (npm test) et dans la
// page Tests du site, pour pouvoir les montrer en direct à l'enseignant.

import { encodePrefix, parseContainer } from "./container";
import { type Bytes, concatBytes, randomBytes, toPem, utf8 } from "./encoding";
import { type ErrorCode, isFileSecureError } from "./errors";
import { decryptFile, encryptFile, joinParts, MAX_FILE_SIZE } from "./hybrid";
import {
  exportProtectedPrivateKey,
  generateIdentity,
  type Identity,
  importProtectedPrivateKey,
  importPublicKey,
  publicKeyToPem,
  rsaParams,
} from "./keys";
import { decryptNumber, encryptNumber, factorize, randomPrime, toyKey } from "./textbook";

export interface SelfTest {
  id: string;
  title: string;
  expected: string;
  run: () => Promise<string>;
}

// Itérations PBKDF2 réduites pour que les tests restent rapides ;
// le site utilise 600 000 itérations.
const TEST_ITERATIONS = 10_000;

let fixtures: Promise<{ alice: Identity; bob: Identity }> | null = null;
function keys() {
  fixtures ??= Promise.all([generateIdentity("Awa", 2048), generateIdentity("Koffi", 2048)]).then(
    ([alice, bob]) => ({ alice, bob }),
  );
  return fixtures;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectError(action: () => Promise<unknown>, ...codes: ErrorCode[]): Promise<string> {
  try {
    await action();
  } catch (e) {
    if (isFileSecureError(e) && codes.includes(e.code)) return e.code;
    throw new Error(`Erreur inattendue : ${e instanceof Error ? e.message : String(e)}`);
  }
  throw new Error(`L'opération aurait dû échouer (${codes.join(" ou ")}).`);
}

function same(a: Uint8Array, b: Uint8Array) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return i;
  }
  throw new Error("Motif introuvable dans l'en-tête.");
}

async function seal(data: Bytes, to: Identity, chunkSize?: number) {
  const r = await encryptFile({ data, name: "essai.bin", type: "application/octet-stream" }, to, { chunkSize });
  return joinParts(r.parts);
}

export const SELF_TESTS: SelfTest[] = [
  {
    id: "generate",
    title: "Génération d'une paire RSA",
    expected: "Deux clés RSA-OAEP 2048 bits, empreinte SHA-256 de 64 caractères",
    async run() {
      const { alice } = await keys();
      assert(alice.bits === 2048, "Taille de clé inattendue.");
      assert(/^[0-9a-f]{64}$/.test(alice.kid), "Identifiant de clé invalide.");
      assert(alice.publicKey.type === "public" && alice.privateKey.type === "private", "Types de clés inattendus.");
      return `Empreinte ${alice.fingerprint}`;
    },
  },
  {
    id: "pem",
    title: "Clé publique : export puis import PEM",
    expected: "Même empreinte et même nom après l'aller-retour",
    async run() {
      const { alice } = await keys();
      const imported = await importPublicKey(publicKeyToPem(alice));
      assert(imported.kid === alice.kid, "L'empreinte a changé.");
      assert(imported.name === "Awa", "Le nom n'a pas été relu.");
      return `${imported.bits} bits, empreinte identique`;
    },
  },
  {
    id: "private-ok",
    title: "Clé privée protégée : bon mot de passe",
    expected: "La clé relue déchiffre ce qui a été chiffré pour elle",
    async run() {
      const { bob } = await keys();
      const file = await exportProtectedPrivateKey(bob, "correct horse battery", TEST_ITERATIONS);
      assert(!file.includes("PRIVATE KEY-----"), "Clé privée en clair dans le fichier.");
      const reloaded = await importProtectedPrivateKey(file, "correct horse battery");
      const message = utf8.encode("Bonjour binôme");
      const sealed = await seal(message, bob);
      const opened = await decryptFile(sealed, reloaded);
      assert(same(opened.data, message), "Contenu différent.");
      return "Clé relue et utilisable";
    },
  },
  {
    id: "private-wrong",
    title: "Clé privée protégée : mauvais mot de passe",
    expected: "Refus",
    async run() {
      const { bob } = await keys();
      const file = await exportProtectedPrivateKey(bob, "correct horse battery", TEST_ITERATIONS);
      return expectError(() => importProtectedPrivateKey(file, "mauvais mot de passe"), "WRONG_PASSWORD");
    },
  },
  {
    id: "roundtrip-text",
    title: "Chiffrer puis déchiffrer un texte",
    expected: "Contenu et SHA-256 identiques",
    async run() {
      const { bob } = await keys();
      const message = utf8.encode("Rapport confidentiel : rendez-vous à 14 h.");
      const opened = await decryptFile(await seal(message, bob), bob);
      assert(same(opened.data, message), "Contenu différent.");
      return `SHA-256 ${opened.sha256.slice(0, 16)}...`;
    },
  },
  {
    id: "roundtrip-binary",
    title: "Fichier binaire de 300 Ko en plusieurs morceaux",
    expected: "Fichier identique octet par octet",
    async run() {
      const { bob } = await keys();
      const data = new Uint8Array(300 * 1024);
      for (let i = 0; i < data.length; i += 65536) data.set(randomBytes(Math.min(65536, data.length - i)), i);
      const sealed = await seal(data, bob, 64 * 1024);
      const opened = await decryptFile(sealed, bob);
      assert(same(opened.data, data), "Contenu différent.");
      return `${parseContainer(sealed).header.chunks} morceaux, identique`;
    },
  },
  {
    id: "empty",
    title: "Fichier vide",
    expected: "Chiffré et restauré sans erreur",
    async run() {
      const { bob } = await keys();
      const opened = await decryptFile(await seal(new Uint8Array(0), bob), bob);
      assert(opened.data.length === 0, "Le fichier restauré n'est pas vide.");
      return "0 octet restauré";
    },
  },
  {
    id: "tamper",
    title: "Un octet modifié n'importe où",
    expected: "Refus dans l'en-tête, la clé scellée, le contenu et l'étiquette",
    async run() {
      const { bob } = await keys();
      const sealed = await seal(utf8.encode("Ne pas modifier ce document."), bob);
      const { prefix } = parseContainer(sealed);
      const wrappedAt = indexOfBytes(prefix, utf8.encode('"wrappedKey":"')) + 20;
      const positions = { "en-tête": 20, "clé scellée": wrappedAt, contenu: prefix.length + 2, étiquette: sealed.length - 1 };
      for (const [where, at] of Object.entries(positions)) {
        const copy = sealed.slice();
        copy[at] ^= 0x01;
        await expectError(() => decryptFile(copy, bob), "TAMPERED", "CORRUPTED", "WRONG_KEY").catch((e) => {
          throw new Error(`${where} : ${e.message}`);
        });
      }
      return "4 modifications sur 4 refusées";
    },
  },
  {
    id: "wrong-key",
    title: "Déchiffrer avec la clé d'une autre personne",
    expected: "Refus",
    async run() {
      const { alice, bob } = await keys();
      const sealed = await seal(utf8.encode("Pour Koffi seulement"), bob);
      return expectError(() => decryptFile(sealed, alice), "WRONG_KEY");
    },
  },
  {
    id: "forged-kid",
    title: "Mauvaise clé, même en falsifiant l'en-tête",
    expected: "Refus : la clé de session ne s'ouvre pas",
    async run() {
      const { alice, bob } = await keys();
      const sealed = await seal(utf8.encode("Pour Koffi seulement"), bob);
      const { header, body } = parseContainer(sealed);
      const forged = concatBytes(encodePrefix({ ...header, kid: alice.kid }), body);
      return expectError(() => decryptFile(forged, alice), "TAMPERED");
    },
  },
  {
    id: "not-rsaenc",
    title: "Fichier qui n'est pas un .rsaenc",
    expected: "Message « fichier non reconnu »",
    async run() {
      const { bob } = await keys();
      return expectError(() => decryptFile(utf8.encode("%PDF-1.7 bonjour"), bob), "NOT_RSAENC");
    },
  },
  {
    id: "truncated",
    title: "Fichier tronqué",
    expected: "Refus",
    async run() {
      const { bob } = await keys();
      const sealed = await seal(randomBytes(5000), bob, 1024);
      return expectError(() => decryptFile(sealed.slice(0, sealed.length - 1040), bob), "TAMPERED");
    },
  },
  {
    id: "reordered",
    title: "Morceaux chiffrés intervertis",
    expected: "Refus",
    async run() {
      const { bob } = await keys();
      const sealed = await seal(randomBytes(5000), bob, 1024);
      const { prefix, body } = parseContainer(sealed);
      const full = 1024 + 16;
      const swapped = concatBytes(prefix, body.subarray(full, 2 * full), body.subarray(0, full), body.subarray(2 * full));
      return expectError(() => decryptFile(swapped, bob), "TAMPERED");
    },
  },
  {
    id: "unique",
    title: "Deux chiffrements du même fichier",
    expected: "Résultats différents (clé de session et IV neufs)",
    async run() {
      const { bob } = await keys();
      const data = utf8.encode("Même contenu");
      const [a, b] = [await seal(data, bob), await seal(data, bob)];
      assert(!same(a, b), "Les deux fichiers chiffrés sont identiques.");
      const [ha, hb] = [parseContainer(a).header, parseContainer(b).header];
      assert(ha.wrappedKey !== hb.wrappedKey && ha.ivPrefix !== hb.ivPrefix, "Clé ou IV réutilisé.");
      return "Clés de session et IV différents";
    },
  },
  {
    id: "private-as-public",
    title: "Clé privée importée à la place d'une clé publique",
    expected: "Refus avec avertissement",
    async run() {
      const { alice } = await keys();
      const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", alice.privateKey));
      return expectError(() => importPublicKey(toPem("PRIVATE KEY", pkcs8)), "PRIVATE_KEY_SHARED");
    },
  },
  {
    id: "weak-key",
    title: "Clé de 1024 bits",
    expected: "Refus : trop faible",
    async run() {
      const pair = (await crypto.subtle.generateKey(rsaParams(1024), true, ["encrypt", "decrypt"])) as CryptoKeyPair;
      const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
      return expectError(() => importPublicKey(toPem("PUBLIC KEY", spki)), "KEY_TOO_WEAK");
    },
  },
  {
    id: "too-large",
    title: "Fichier au-delà de 100 Mo",
    expected: "Refus clair, sans plantage",
    async run() {
      const { bob } = await keys();
      const big = new Uint8Array(MAX_FILE_SIZE + 1);
      return expectError(() => encryptFile({ data: big, name: "gros.bin", type: "" }, bob), "TOO_LARGE");
    },
  },
  {
    id: "textbook",
    title: "RSA à la main : p = 61, q = 53",
    expected: "n = 3233, d = 2753, 65 chiffré en 2790 puis retrouvé",
    async run() {
      const k = toyKey(61n, 53n, 17n);
      assert(k.n === 3233n && k.d === 2753n, "Clé inattendue.");
      const c = encryptNumber(65n, k);
      assert(c === 2790n && decryptNumber(c, k) === 65n, "Chiffrement inattendu.");
      return "n = 3233, e = 17, d = 2753";
    },
  },
  {
    id: "factor",
    title: "Attaque d'une clé de 48 bits",
    expected: "n factorisé, clé privée retrouvée",
    async run() {
      const k = toyKey(randomPrime(24), randomPrime(24));
      const f = factorize(k.n);
      assert(f.p * f.q === k.n, "Factorisation fausse.");
      const d = toyKey(f.p, f.q, k.e).d;
      assert(d === k.d, "Clé privée non retrouvée.");
      return `Cassée en ${Math.max(1, Math.round(f.ms))} ms`;
    },
  },
];
