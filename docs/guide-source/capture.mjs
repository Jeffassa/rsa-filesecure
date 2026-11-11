// Capture les écrans du site pour le guide : scénario réel à deux personnes,
// chacune dans sa propre session de navigateur (Koffi et Awa).
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const BASE = "http://localhost:5174/";
const OUT = process.argv[2];
const SHOTS = join(OUT, "shots");
const FILES = join(OUT, "files");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(FILES, { recursive: true });
const PASSWORD = "Bin0me-TP-crypto-2026";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--lang=fr-FR"],
});

async function newPage(width = 1440, height = 960) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  // Garde les fichiers produits par le site (clés, .rsaenc) au lieu de les télécharger.
  await page.evaluateOnNewDocument(() => {
    window.__blobs = [];
    const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => {
      window.__blobs.push(b);
      return orig(b);
    };
    HTMLAnchorElement.prototype.click = function () {};
  });
  page.on("pageerror", (e) => console.error("Erreur de page :", e.message));
  return page;
}

async function go(page, route) {
  await page.evaluate((r) => (location.hash = "/" + r), route);
  await sleep(1400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
}

async function click(page, text) {
  await page.evaluate((t) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(t));
    if (!b) throw new Error("Bouton introuvable : " + t);
    b.scrollIntoView({ block: "center" });
    b.click();
  }, text);
}

const waitText = (page, text, timeout = 30000) =>
  page.waitForFunction((t) => document.body.textContent.includes(t), { timeout }, text);

async function find(page, fn, arg) {
  const h = await page.evaluateHandle(fn, arg);
  const el = h.asElement();
  if (!el) throw new Error("Élément introuvable pour " + String(arg ?? fn));
  return el;
}

const sectionWith = (text) => (t) => {
  const all = [...document.querySelectorAll("section, aside, .card")];
  return all.filter((s) => s.innerText.includes(t)).sort((a, b) => a.innerText.length - b.innerText.length)[0] ?? null;
};

async function shotEl(page, name, el, wait = 400) {
  await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await sleep(wait);
  await el.screenshot({ path: join(SHOTS, name + ".png") });
  console.log("capture", name);
}

async function shotView(page, name) {
  await page.screenshot({ path: join(SHOTS, name + ".png") });
  console.log("capture", name);
}

async function lastBlob(page, kind) {
  return page.evaluate(async (k) => {
    const b = window.__blobs.at(-1);
    if (k === "text") return b.text();
    const bytes = new Uint8Array(await b.arrayBuffer());
    let s = "";
    for (const x of bytes) s += String.fromCharCode(x);
    return btoa(s);
  }, kind);
}

async function upload(page, accept, path) {
  const input = await page.$(`input[type=file][accept="${accept}"]`);
  if (!input) throw new Error("Champ de fichier introuvable : " + accept);
  await input.uploadFile(path);
  await sleep(1200);
}

const DOC = [
  "Rapport de TP : cryptographie RSA",
  "",
  "Objet : resultats de la seance du jeudi.",
  "Les mesures sont confidentielles jusqu'a la soutenance.",
  "",
  "1. Generation des cles : RSA 3072 bits, 1,4 s en moyenne.",
  "2. Chiffrement hybride : AES-256-GCM et RSA-OAEP.",
  "3. Tests : 22 cas reussis, dont la compatibilite OpenSSL.",
  "",
  "Rendez-vous jeudi a 14 h en salle B12 pour la repetition.",
  "Ne pas diffuser ce document en dehors du binome.",
  "",
].join("\n").repeat(6);
const docPath = join(FILES, "rapport_tp.txt");
writeFileSync(docPath, DOC);

// ------------------------------------------------------------- Koffi : accueil et clés
const koffi = await newPage();
await koffi.goto(BASE + "#/accueil", { waitUntil: "networkidle0" });
await sleep(2600);
await shotView(koffi, "01-accueil");

await click(koffi, "4. Awa envoie le fichier .rsaenc");
await sleep(1050);
await shotEl(koffi, "02-schema", await find(koffi, () => [...document.querySelectorAll("h2")].find((h) => h.textContent.includes("Comment ça marche"))?.nextElementSibling ?? null), 0);

await go(koffi, "cles");
await shotEl(koffi, "03-cles-vide", await find(koffi, () => document.querySelector("main .grid")));
await koffi.type("#owner", "Koffi");
await click(koffi, "Générer ma paire de clés");
await sleep(350);
await shotEl(koffi, "04-cles-generation", await find(koffi, sectionWith("Créer ma paire de clés"), "Créer ma paire de clés"), 0);
await waitText(koffi, "Clé active");
await sleep(3900);
await shotEl(koffi, "05-cles-calcul", await find(koffi, sectionWith("Ce que le navigateur vient de calculer"), "Ce que le navigateur vient de calculer"));
await shotEl(koffi, "06-cles-identite", await find(koffi, sectionWith("Empreinte à lire à voix haute"), "Empreinte à lire à voix haute"), 1200);

const pubCard = await find(koffi, sectionWith("Clé publique, à partager"), "Clé publique, à partager");
const pem = await pubCard.evaluate((s) => s.querySelector("pre").textContent);
writeFileSync(join(FILES, "cle_publique_koffi.pem"), pem);
await shotEl(koffi, "07-cles-publique", pubCard);

const privCard = await find(koffi, sectionWith("Clé privée, à garder"), "Clé privée, à garder");
const pw = await privCard.$$("input[type=password]");
await pw[0].type(PASSWORD);
await pw[1].type(PASSWORD);
await sleep(600);
await shotEl(koffi, "08-cles-privee", privCard);
await click(koffi, "Télécharger la clé privée protégée");
await waitText(koffi, "Fichier .rsakey téléchargé");
writeFileSync(join(FILES, "cle_privee_koffi.rsakey"), await lastBlob(koffi, "text"));

// ------------------------------------------------------------- Awa : clé de Koffi et chiffrement
const awa = await newPage();
await awa.goto(BASE + "#/cles", { waitUntil: "networkidle0" });
await sleep(1500);
await upload(awa, ".pem,.pub,.txt", join(FILES, "cle_publique_koffi.pem"));
await sleep(1200);
await shotEl(awa, "09-binome-ajoute", await find(awa, sectionWith("Clés publiques de vos binômes"), "Clés publiques de vos binômes"));

await go(awa, "chiffrer");
await upload(awa, "", docPath);
await sleep(800);
await shotView(awa, "10-chiffrer-pret");
await awa.click("input[type=checkbox]");
await sleep(500);
await shotEl(awa, "11-chiffrer-empreinte", await find(awa, () => [...document.querySelectorAll("h2")].find((h) => h.textContent.includes("Clé publique du destinataire"))?.closest("section") ?? null));
await awa.evaluate(() => window.scrollTo(0, 0));
await click(awa, "Chiffrer pour Koffi");
await sleep(2350);
await awa.evaluate(() => window.scrollTo(0, 0));
await sleep(100);
await shotView(awa, "12-chiffrer-en-cours");
await waitText(awa, "Premiers octets");
await sleep(1800);
await shotEl(awa, "13-chiffrer-termine", await find(awa, () => document.querySelector("main aside")));
await click(awa, "Télécharger");
const sealed = Buffer.from(await lastBlob(awa, "bytes"), "base64");
writeFileSync(join(FILES, "rapport_tp.txt.rsaenc"), sealed);
const tampered = Buffer.from(sealed);
tampered[tampered.length - 200] ^= 0x01;
writeFileSync(join(FILES, "rapport_modifie.rsaenc"), tampered);

// ------------------------------------------------------------- Koffi : déchiffrement
await go(koffi, "dechiffrer");
await upload(koffi, "", join(FILES, "rapport_tp.txt.rsaenc"));
await sleep(1200);
await shotView(koffi, "14-dechiffrer-pret");
await click(koffi, "Déchiffrer le fichier");
await sleep(2350);
await koffi.evaluate(() => window.scrollTo(0, 0));
await sleep(100);
await shotView(koffi, "15-dechiffrer-en-cours");
await waitText(koffi, "Identique à l'original");
await sleep(1500);
await shotEl(koffi, "16-dechiffrer-termine", await find(koffi, () => document.querySelector("main aside")));

await click(koffi, "Autre fichier");
await sleep(800);
await upload(koffi, "", join(FILES, "rapport_modifie.rsaenc"));
await click(koffi, "Déchiffrer le fichier");
await waitText(koffi, "Déchiffrement refusé");
await sleep(1200);
await shotEl(koffi, "17-dechiffrer-refus", await find(koffi, () => document.querySelector("main aside")));

// ------------------------------------------------------------- Koffi, nouvelle session : recharger sa clé
const koffi2 = await newPage();
await koffi2.goto(BASE + "#/dechiffrer", { waitUntil: "networkidle0" });
await sleep(1500);
await upload(koffi2, ".rsakey,.json", join(FILES, "cle_privee_koffi.rsakey"));
await sleep(900);
const step2 = await find(koffi2, () => [...document.querySelectorAll("h2")].find((h) => h.textContent.trim() === "Clé privée")?.closest("section") ?? null);
const pwField = await step2.$("input[type=password]");
await pwField.type(PASSWORD);
await sleep(300);
await shotEl(koffi2, "18-cle-recharger", step2);

// ------------------------------------------------------------- Comprendre RSA et Tests
await go(koffi, "comprendre");
await shotEl(koffi, "19-comprendre-rsa", await find(koffi, sectionWith("RSA pas à pas"), "RSA pas à pas"), 6500);
await koffi.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "64")?.click());
await sleep(300);
await click(koffi, "Créer une clé de 64 bits");
await sleep(500);
await click(koffi, "Attaquer : factoriser n");
await waitText(koffi, "Message retrouvé", 60000);
await sleep(1600);
await shotEl(koffi, "20-attaque", await find(koffi, sectionWith("Attaque d'une clé trop petite"), "Attaque d'une clé trop petite"));

await go(koffi, "tests");
await click(koffi, "Tout lancer");
await waitText(koffi, "Tous les tests réussissent", 90000);
await sleep(800);
await koffi.evaluate(() => window.scrollTo(0, 0));
await shotView(koffi, "21-tests");

// ------------------------------------------------------------- Téléphone
const phone = await newPage(390, 844);
await phone.goto(BASE + "#/accueil", { waitUntil: "networkidle0" });
await sleep(2500);
await shotView(phone, "22-telephone");

await browser.close();
console.log("Terminé");
