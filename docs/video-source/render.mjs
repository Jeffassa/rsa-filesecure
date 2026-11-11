// Rendu de la vidéo : chronologie calée sur la narration, images rendues une à une
// par Chrome, encodage H.264 par ffmpeg, puis piste audio et sous-titres.
//   node render.mjs <dossier> preview      images témoins
//   node render.mjs <dossier> full <sortie>
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { SEGMENTS } from "./segments.mjs";

const DIR = process.argv[2];
const MODE = process.argv[3] || "preview";
const OUT = process.argv[4];
const FPS = 30;

const duration = (wav) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).toString());

// ------------------------------------------------------------ chronologie
let cursor = 0;
const TL = {};
const audio = [];
for (const s of SEGMENTS) {
  const wav = join(DIR, "voix", `${s.id}.wav`);
  const len = duration(wav);
  const lead = s.id === "title" ? 1.6 : 0.35;
  const d = Math.max(s.min, lead + len + 0.55);
  TL[s.id] = { start: cursor, dur: d };
  audio.push({ id: s.id, wav, at: cursor + lead, len });
  cursor += d;
}
const TOTAL = cursor + 1.2;
writeFileSync(join(DIR, "timeline.json"), JSON.stringify({ TL, TOTAL, audio }, null, 1));
console.log(`Durée totale : ${TOTAL.toFixed(1)} s, ${Math.ceil(TOTAL * FPS)} images`);

// ------------------------------------------------------------ navigateur
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--allow-file-access-from-files", "--force-color-profile=srgb", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("Erreur de page :", e.message));
await page.goto(pathToFileURL(join(DIR, "video.html")).href, { waitUntil: "networkidle0" });
await page.evaluate(
  (tl, segs, total) => window.init(tl, segs, total),
  TL,
  SEGMENTS.map(({ id, caption }) => ({ id, caption })),
  TOTAL,
);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), { timeout: 20000 });

if (MODE === "preview") {
  const dir = join(DIR, "preview");
  mkdirSync(dir, { recursive: true });
  for (const s of SEGMENTS) {
    const { start, dur } = TL[s.id];
    for (const f of [0.35, 0.85]) {
      await page.evaluate((t) => window.renderAt(t), start + dur * f);
      await page.screenshot({ path: join(dir, `${String(Object.keys(TL).indexOf(s.id)).padStart(2, "0")}-${s.id}-${f}.jpg`), type: "jpeg", quality: 80 });
    }
  }
  await browser.close();
  console.log("Aperçus écrits");
  process.exit(0);
}

// ------------------------------------------------------------ vidéo muette
const silent = join(DIR, "video_muette.mp4");
const ff = spawn("ffmpeg", [
  "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(FPS), "-movflags", "+faststart", silent,
], { stdio: ["pipe", "inherit", "inherit"] });
const frames = Math.ceil(TOTAL * FPS);
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.renderAt(t), i / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 94, optimizeForSpeed: true });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % 300 === 0) console.log(`image ${i}/${frames}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();

// ------------------------------------------------------------ narration
const inputs = audio.flatMap((a) => ["-i", a.wav]);
const chains = audio.map((a, i) => `[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${Math.round(a.at * 1000)}|${Math.round(a.at * 1000)}[a${i}]`);
const mix = `${audio.map((_, i) => `[a${i}]`).join("")}amix=inputs=${audio.length}:normalize=0,apad=whole_dur=${TOTAL.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11[out]`;
const voice = join(DIR, "narration.wav");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", [...chains, mix].join(";"), "-map", "[out]", "-ar", "48000", voice]);

mkdirSync(OUT, { recursive: true });
const final = join(OUT, "RSA_FileSecure_presentation.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-i", voice, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", final]);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-c", "copy", "-movflags", "+faststart", join(OUT, "RSA_FileSecure_presentation_sans_voix.mp4")]);

// ------------------------------------------------------------ sous-titres
const ts = (s) => {
  const ms = Math.round(s * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, "0")}`;
};
const srt = SEGMENTS.map((s, i) => `${i + 1}\n${ts(TL[s.id].start + 0.1)} --> ${ts(TL[s.id].start + TL[s.id].dur - 0.05)}\n${s.caption}\n`).join("\n");
writeFileSync(join(OUT, "RSA_FileSecure_presentation.srt"), "\ufeff" + srt);
console.log(`Terminé en ${((Date.now() - t0) / 1000).toFixed(0)} s : ${final}`);
