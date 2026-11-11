// Interopérabilité avec OpenSSL (via node:crypto) : nos clés et notre
// RSA-OAEP sont standards, pas une construction maison.

import { constants, createPrivateKey, createPublicKey, generateKeyPairSync, privateDecrypt, publicEncrypt } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseContainer } from "../src/crypto/container";
import { fromBase64, toPem } from "../src/crypto/encoding";
import { decryptFile, encryptFile, joinParts } from "../src/crypto/hybrid";
import { generateIdentity, importPublicKey, keyIdOf, publicKeyToPem } from "../src/crypto/keys";

const OAEP = { padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" };

describe("Interopérabilité OpenSSL", () => {
  it("OpenSSL lit notre clé publique PEM et chiffre pour nous en RSA-OAEP SHA-256", async () => {
    const me = await generateIdentity("Koffi", 2048);
    const pub = createPublicKey(publicKeyToPem(me));
    expect(pub.asymmetricKeyDetails?.modulusLength).toBe(2048);

    const secret = Buffer.from("clé de session de démonstration");
    const sealed = publicEncrypt({ key: pub, ...OAEP }, secret);
    const opened = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, me.privateKey, sealed);
    expect(Buffer.from(opened).toString()).toBe(secret.toString());
  });

  it("OpenSSL ouvre la clé de session scellée dans un fichier .rsaenc", async () => {
    const me = await generateIdentity("Koffi", 2048);
    const r = await encryptFile({ data: new TextEncoder().encode("bonjour"), name: "a.txt", type: "text/plain" }, me);
    const { header } = parseContainer(joinParts(r.parts));
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", me.privateKey));
    const priv = createPrivateKey(toPem("PRIVATE KEY", pkcs8));
    const sessionKey = privateDecrypt({ key: priv, ...OAEP }, fromBase64(header.wrappedKey));
    expect(sessionKey.length).toBe(32);
  });

  it("Une paire générée par OpenSSL fonctionne de bout en bout dans le site", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 3072 });
    const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
    const info = await importPublicKey(pem);
    expect(info.bits).toBe(3072);

    const pkcs8 = privateKey.export({ type: "pkcs8", format: "der" });
    const priv = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
    const data = new TextEncoder().encode("fichier chiffré pour une clé OpenSSL");
    const r = await encryptFile({ data, name: "b.txt", type: "text/plain" }, info);
    const opened = await decryptFile(joinParts(r.parts), { privateKey: priv, kid: (await keyIdOf(info.spki)).kid });
    expect(new TextDecoder().decode(opened.data)).toBe("fichier chiffré pour une clé OpenSSL");
  });
});
