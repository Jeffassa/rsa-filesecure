"use strict";
// Vidéo de présentation de RSA FileSecure.
// Chaque image est une fonction pure du temps : renderAt(t) place tous les éléments.

let TL = null;
let TOTAL = 0;
const S = (id) => TL[id].start;
const D = (id) => TL[id].dur;
const E = (id) => TL[id].start + TL[id].dur;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const eo = (x) => 1 - Math.pow(1 - x, 3);
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const P = (t, a, d = 0.5, e = eo) => e(clamp((t - a) / d));
const vis = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(clamp((t - a) / fi), clamp((b - t) / fo));
const rnd = (i) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const SHOTS = "file:///C:/Users/hp/TP-RSA/docs/guide-source/shots/";
const FP = "3971 2C25 33BA 29E1 85FE 3451 79A6 B945";
const HASH = "a3f1 9c04 7be2 51d8";

// ------------------------------------------------------------------ icônes
const ICONS = {
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  lockOpen: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  key: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  server: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  shieldX: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/>',
  dice: '<rect width="12" height="12" x="2" y="10" rx="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>',
  audio: '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
  hash: '<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="m16 3-2 18"/>',
};
const ic = (n, size = 24, sw = 2.2) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" stroke-width="${sw}">${ICONS[n]}</svg>`;

// ------------------------------------------------------------------ DOM
let stage;
const tickers = [];
function div(parent, cls = "", html = "", css = {}) {
  const e = document.createElement("div");
  if (cls) e.className = cls;
  e.innerHTML = html;
  Object.assign(e.style, css);
  parent.appendChild(e);
  return e;
}
function at(parent, x, y, w, h, cls = "", html = "") {
  return div(parent, "abs " + cls, html, {
    left: x - w / 2 + "px",
    top: y - h / 2 + "px",
    width: w + "px",
    height: h + "px",
  });
}
function put(e, o = 1, x = 0, y = 0, s = 1) {
  const op = clamp(o);
  e.style.opacity = op.toFixed(3);
  e.style.visibility = op <= 0.002 ? "hidden" : "visible";
  e.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
}
const popS = (p) => 0.8 + 0.2 * back(clamp(p));
function setHTML(e, html) {
  if (e.__h !== html) {
    e.innerHTML = html;
    e.__h = html;
  }
}

// ------------------------------------------------------------------ grilles d'octets
const PLAIN = { L: "#3f4d6b", S: "#8a8fa3", " ": "#e3e6f2" };
const CIPH = ["#6f59dc", "#997def", "#4a3ba8", "#c3b6f5"];
function docPattern(cols, rows, seed) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    const blank = r === 1 || r === 4;
    const len = r === 0 ? Math.floor(cols * 0.55) : cols - Math.floor(rnd(seed + r) * 4);
    let k = 0;
    let w = 2 + Math.floor(rnd(seed + r * 7) * 4);
    for (let c = 0; c < cols; c++) {
      let v = " ";
      if (!blank && c < len) {
        k++;
        if (k > w) {
          k = 0;
          w = 2 + Math.floor(rnd(seed + r * 13 + c) * 4);
        } else v = rnd(seed + r * 31 + c) < 0.15 ? "S" : "L";
      }
      out.push(v);
    }
  }
  return out;
}
function gridEl(cols, rows, cell = 14, gap = 4) {
  const el = document.createElement("div");
  el.className = "grid";
  el.style.gridTemplateColumns = `repeat(${cols}, ${cell}px)`;
  const cells = [];
  for (let i = 0; i < cols * rows; i++) {
    const c = document.createElement("i");
    c.style.width = c.style.height = cell + "px";
    el.appendChild(c);
    cells.push(c);
  }
  return { el, cells, cols, pat: docPattern(cols, rows, cols * 7 + rows) };
}
function colorOf(state, i, pat) {
  if (state === "p") return PLAIN[pat[i]];
  if (state === "r") return "#c24545";
  return CIPH[Math.floor(rnd(i * 7 + 3) * 4)];
}
/** Bascule colonne par colonne de l'état `from` vers `to`. */
function sweep(g, t, t0, dur, from, to, red = -1) {
  g.cells.forEach((c, i) => {
    const col = i % g.cols;
    const tc = t0 + (col / g.cols) * dur + rnd(i + 5) * 0.12;
    const p = clamp((t - tc) / 0.28);
    let st = p < 0.5 ? from : to;
    if (i === red) st = "r";
    c.style.background = colorOf(st, i, g.pat);
    c.style.transform = `scaleY(${Math.abs(Math.cos(Math.PI * p)).toFixed(3)})`;
  });
}
function barsEl(n, color) {
  const el = document.createElement("div");
  el.className = "bars";
  const bars = [];
  for (let i = 0; i < n; i++) {
    const b = document.createElement("i");
    b.style.background = color;
    el.appendChild(b);
    bars.push(b);
  }
  return { el, bars };
}
function growBars(b, t, a) {
  b.bars.forEach((x, i) => {
    const p = clamp((t - (a + i * 0.03)) / 0.18);
    x.style.opacity = ((0.45 + 0.55 * rnd(i * 3 + 1)) * p).toFixed(3);
    x.style.transform = `scaleY(${(0.3 + 0.7 * eo(p)).toFixed(3)})`;
  });
}
/** Texte tapé, avec les caractères déjà vérifiés en vert. */
function typed(str, p, green = 0, color = "#039f7a") {
  const n = Math.round(str.length * clamp(p));
  const g = Math.round(str.length * clamp(green));
  let h = "";
  for (let i = 0; i < n; i++) h += i < g && str[i] !== " " ? `<span style="color:${color}">${str[i]}</span>` : str[i];
  return h + (n < str.length ? `<span style="opacity:0">${str.slice(n)}</span>` : "");
}
const HEX = "0123456789abcdef";
const scramble = (len, seed) => Array.from({ length: len }, (_, i) => HEX[Math.floor(rnd(seed * 37 + i * 11) * 16)]).join("");

// ------------------------------------------------------------------ caméra
const FULL = { s: 1.08, tx: -76.8, ty: 80 };
const FA = { s: 1.25, tx: 260, ty: -110 };
const FK = { s: 1.25, tx: -740, ty: -110 };
let CAM = [];
function cam(t) {
  let i = 0;
  while (i + 1 < CAM.length && CAM[i + 1].t <= t) i++;
  const cur = CAM[i];
  const prev = CAM[Math.max(0, i - 1)].p;
  const p = i === 0 ? 1 : P(t, cur.t - 0.2, 1.3, eio);
  return { s: lerp(prev.s, cur.p.s, p), tx: lerp(prev.tx, cur.p.tx, p), ty: lerp(prev.ty, cur.p.ty, p) };
}

// ------------------------------------------------------------------ étapes d'atelier
const BA = { L: [250, 600], M: [560, 600], R: [870, 600], label: [560, 452] };
const BK = { L: [1050, 600], M: [1360, 600], R: [1670, 600], label: [1360, 452] };

function arrowEl(parent, x, y, color) {
  return at(
    parent, x, y, 64, 26, "",
    `<svg width="64" height="26" viewBox="0 0 64 26" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
       <path class="dash" d="M4 13H54" stroke-dasharray="7 7"/><path d="M48 6l8 7-8 7"/></svg>`,
  );
}

/**
 * Une étape : entrée (L), opération (M), sortie (R).
 * `fromPrev` : l'entrée arrive en glissant depuis la sortie de l'étape précédente.
 */
function makeStep(world, B, seg, cfg) {
  const tone = cfg.tone || "violet";
  const color = tone === "green" ? "#039f7a" : "#6f59dc";
  const lbl = at(world, B.label[0], B.label[1], 1000, 40, "steplbl " + tone, cfg.label);
  const op = at(
    world, B.M[0], B.M[1], 236, 136, "op " + tone,
    `<div class="t">${cfg.op}</div><div class="s">${cfg.opSub || ""}</div><div class="bar"><i></i></div><div class="ok abs">${ic("check", 22, 3.2)}</div>`,
  );
  const bar = op.querySelector(".bar i");
  const ok = op.querySelector(".ok");
  const a1 = arrowEl(world, (B.L[0] + B.M[0]) / 2 + 3, B.M[1], color);
  const a2 = arrowEl(world, (B.M[0] + B.R[0]) / 2 + 3, B.M[1], color);
  const dashes = [a1, a2].map((a) => a.querySelector(".dash"));
  const L = cfg.L;
  const R = cfg.R;
  const lpos = cfg.Lpos || B.L;
  const rpos = cfg.Rpos || B.R;
  const prevR = cfg.prevRpos || B.R;

  tickers.push((t) => {
    const a = S(seg);
    const d = D(seg);
    const end = cfg.until ? cfg.until() : E(seg);
    const rAt = cfg.rAt ?? Math.min(2.0, d * 0.34);
    const out = clamp((end - t) / 0.35);
    const lt = t - a;

    put(lbl, vis(t, a + 0.05, end, 0.4, 0.3), 0, (1 - P(t, a + 0.05, 0.5)) * 14);

    if (cfg.fromPrev) {
      const p = P(t, a - 0.05, 0.85, eio);
      put(L, (t >= a - 0.05 ? 1 : 0) * out, (prevR[0] - lpos[0]) * (1 - p), (prevR[1] - lpos[1]) * (1 - p), 1 - 0.06 * Math.sin(Math.PI * p));
    } else {
      const p = clamp((t - (a + 0.25)) / 0.55);
      put(L, clamp(p * 2) * out, 0, 0, popS(p));
    }

    put(a1, vis(t, a + 0.55, end, 0.3, 0.3));
    const pOp = clamp((t - (a + 0.7)) / 0.55);
    put(op, clamp(pOp * 2) * out, 0, 0, popS(pOp));
    const busy = t > a + 0.9 && t < a + rAt + 0.3;
    bar.parentElement.style.opacity = busy ? "1" : "0.25";
    bar.style.left = busy ? `${(((lt * 1.15) % 1) * 155 - 70).toFixed(1)}px` : "0px";
    bar.style.width = busy ? "45%" : "100%";
    const pOk = clamp((t - (a + rAt + 0.3)) / 0.45);
    put(ok, clamp(pOk * 3), 0, 0, popS(pOk));
    put(a2, vis(t, a + rAt - 0.35, end, 0.3, 0.3));
    dashes.forEach((dsh) => dsh.setAttribute("stroke-dashoffset", String(-(t * 28) % 14)));

    const pR = clamp((t - (a + rAt)) / 0.6);
    const hand = cfg.handoff && t >= E(seg) - 0.05;
    put(R, hand ? 0 : clamp(pR * 2) * out, 0, 0, popS(pR));

    if (cfg.tick) cfg.tick(t, lt, d, rAt);
  });
  return { lbl, op };
}

function card(parent, x, y, w, h, cls, title, sub = "", extra = "") {
  return at(parent, x, y, w, h, "card " + cls, `<div class="t">${title}</div>${extra}${sub ? `<div class="s">${sub}</div>` : ""}`);
}

// ------------------------------------------------------------------ scènes
function buildTitle() {
  const L = div(stage, "layer navy");
  div(L, "glow abs", "", { width: "900px", height: "900px", right: "-260px", top: "-380px", background: "radial-gradient(circle, rgba(111,89,220,.55), rgba(111,89,220,0) 65%)" });
  div(L, "glow abs", "", { width: "760px", height: "760px", left: "-320px", bottom: "-260px", background: "radial-gradient(circle, rgba(3,159,122,.32), rgba(3,159,122,0) 65%)" });
  const lock = at(L, 960, 300, 150, 150, "", `<svg class="i" width="150" height="150" viewBox="0 0 24 24" stroke-width="1.8" style="color:#a9b8ff"><path class="sh" d="M7 11V7a5 5 0 0 1 10 0v4"/><rect width="18" height="11" x="3" y="11" rx="2"/><circle cx="12" cy="16.5" r="1.2"/></svg>`);
  const sh = lock.querySelector(".sh");
  const kick = at(L, 960, 440, 800, 30, "kick", "TP de cryptographie");
  kick.style.textAlign = "center";
  const title = at(L, 960, 535, 1400, 130, "title-xl", "RSA FileSecure");
  title.style.textAlign = "center";
  const sub = at(L, 960, 640, 1400, 50, "sub-xl", "Comment un fichier chiffré circule entre deux binômes");
  const pills = at(L, 960, 735, 1000, 50, "", ["RSA-OAEP 3072 bits", "AES-256-GCM", "SHA-256"].map((p) => `<span class="pill" style="background:rgba(255,255,255,.1);color:#d5dae6;box-shadow:none;margin:0 8px">${p}</span>`).join(""));
  pills.style.textAlign = "center";
  tickers.push((t) => {
    const o = vis(t, -1, E("title"), 0.1, 0.6);
    put(L, o);
    const pl = clamp((t - 0.3) / 0.6);
    put(lock, clamp(pl * 2), 0, 0, popS(pl));
    sh.setAttribute("transform", `translate(0 ${(-3 * (1 - P(t, 1.3, 0.35, back))).toFixed(2)})`);
    put(kick, P(t, 0.8, 0.6), 0, (1 - P(t, 0.8, 0.6)) * 14);
    put(title, P(t, 1.0, 0.7), 0, (1 - P(t, 1.0, 0.7)) * 26);
    put(sub, P(t, 1.5, 0.7), 0, (1 - P(t, 1.5, 0.7)) * 18);
    put(pills, P(t, 2.1, 0.7), 0, (1 - P(t, 2.1, 0.7)) * 12);
  });
}

function buildWorld() {
  const W = div(stage, "layer");
  W.id = "world";
  const nodeHTML = (init, name, role, color) =>
    `<div class="node"><div class="av" style="background:${color}">${init}</div><div class="nm">${name}</div><div class="rl">${role}</div></div>`;
  const nA = at(W, 330, 258, 260, 210, "", nodeHTML("A", "Awa", "expéditrice", "#997def"));
  const nK = at(W, 1590, 258, 260, 210, "", nodeHTML("K", "Koffi", "destinataire", "#09a582"));
  const chan = at(W, 960, 210, 960, 4, "chan", "<i></i>");
  const chanLbl = at(W, 960, 176, 700, 30, "lbl", "Canal non sûr : e-mail, clé USB, messagerie");
  const eye = at(W, 960, 330, 90, 90, "eye", ic("eye", 42, 2));
  const eyeLbl = at(W, 960, 402, 520, 30, "lbl", "Un tiers peut tout intercepter");
  const server = at(W, 960, 70, 640, 50, "", `<span class="pill p-white">${ic("server", 22)} Serveur du site : ne reçoit aucune donnée</span>`);
  server.style.textAlign = "center";
  const kPub = at(W, 1500, 372, 190, 44, "", `<span class="pill p-blue">${ic("key", 20)} clé publique</span>`);
  const kPriv = at(W, 1685, 372, 170, 44, "", `<span class="pill p-violet">${ic("lock", 20)} clé privée</span>`);
  const aPub = at(W, 330, 372, 300, 44, "", `<span class="pill p-blue">${ic("key", 20)} clé publique de Koffi</span>`);
  [kPub, kPriv, aPub].forEach((e) => (e.style.textAlign = "center"));

  tickers.push((t) => {
    const c = cam(t);
    W.style.transform = `translate(${c.tx.toFixed(2)}px,${c.ty.toFixed(2)}px) scale(${c.s.toFixed(4)})`;
    W.style.opacity = vis(t, S("roles") - 0.4, E("dec5") + 0.2, 0.6, 0.6).toFixed(3);
    const focus = clamp((c.s - 1.08) / 0.17);
    const r = S("roles");
    const pa = clamp((t - (r + 0.2)) / 0.6);
    put(nA, clamp(pa * 2), 0, 0, popS(pa));
    const pk = clamp((t - (r + 0.8)) / 0.6);
    put(nK, clamp(pk * 2), 0, 0, popS(pk));
    const cs = S("canal");
    chan.style.width = `${(960 * P(t, cs + 0.1, 1.1, eio)).toFixed(1)}px`;
    chan.style.left = `${480}px`;
    put(chanLbl, P(t, cs + 0.7, 0.5));
    const pe = clamp((t - (cs + 1.3)) / 0.6);
    put(eye, clamp(pe * 2) * (1 - 0.6 * focus), 0, 0, popS(pe));
    put(eyeLbl, P(t, cs + 1.6, 0.5) * (1 - 0.7 * focus));
    const sv = S("canal") + D("canal") * 0.55;
    put(server, vis(t, sv, S("keys1") + 0.6, 0.5, 0.6), 0, (1 - P(t, sv, 0.5)) * 10);
    const kp = S("keys3") + D("keys3") * 0.72;
    put(kPub, P(t, kp, 0.5), 0, 0, popS(clamp((t - kp) / 0.5)));
    put(kPriv, P(t, kp + 0.2, 0.5), 0, 0, popS(clamp((t - kp - 0.2) / 0.5)));
    const ap = S("pub1") + 3.5;
    put(aPub, P(t, ap, 0.5), 0, 0, popS(clamp((t - ap) / 0.5)));
  });

  buildKeys(W);
  buildPublicKey(W);
  buildEncrypt(W);
  buildTransmit(W);
  buildDecrypt(W);
}

function buildKeys(W) {
  // Étape 1 : nombres premiers
  const L1 = card(W, ...BK.L, 250, 150, "", `${ic("dice", 26)} Aléa`, "crypto.getRandomValues");
  const R1 = card(W, ...BK.R, 270, 160, "violet", "p et q", "1 536 bits chacun, secrets", `<div class="row"><b>p</b><span class="mono pv"></span></div><div class="row"><b>q</b><span class="mono qv"></span></div>`);
  const pv = R1.querySelector(".pv"), qv = R1.querySelector(".qv");
  const fin = (s) => `${s} ••••`;
  makeStep(W, BK, "keys1", {
    label: "Génération de la paire de clés <span>RSA 3072 bits</span>", op: "Miller-Rabin", opSub: "test de primalité", L: L1, R: R1, handoff: true,
    tick: (t, lt, d) => {
      const settle = lt > d * 0.8;
      const f = Math.floor(t * 15);
      setHTML(pv, settle ? fin("c3f1a92b") : scramble(12, f));
      setHTML(qv, settle ? fin("fd86dc6a") : scramble(12, f + 999));
    },
  });

  // Étape 2 : n, e, d
  const L2 = card(W, ...BK.L, 270, 160, "violet", "p et q", "1 536 bits chacun, secrets", `<div class="row"><b>p</b><span class="mono">${fin("c3f1a92b")}</span></div><div class="row"><b>q</b><span class="mono">${fin("fd86dc6a")}</span></div>`);
  const R2 = card(W, ...BK.R, 280, 170, "", "Les nombres de la clé", "", `<div class="row r1"><b>n</b><span class="mono">ce6a279a…3b9</span></div><div class="row r2"><b>e</b><span class="mono">65537</span></div><div class="row r3"><b>d</b><span class="mono">521541c1 ••••</span></div>`);
  const rows2 = [".r1", ".r2", ".r3"].map((s) => R2.querySelector(s));
  makeStep(W, BK, "keys2", {
    label: "Calcul de <span>n, e et d</span>", op: "n = p × q", opSub: "d = e⁻¹ mod φ(n)", L: L2, R: R2, fromPrev: true, handoff: true,
    tick: (t, lt, d, rAt) => rows2.forEach((r, i) => (r.style.opacity = P(t, S("keys2") + rAt + 0.3 + i * 0.35, 0.4).toFixed(3))),
  });

  // Étape 3 : séparation
  const L3 = card(W, ...BK.L, 280, 170, "", "Les nombres de la clé", "", `<div class="row"><b>n</b><span class="mono">ce6a279a…3b9</span></div><div class="row"><b>e</b><span class="mono">65537</span></div><div class="row"><b>d</b><span class="mono">521541c1 ••••</span></div>`);
  const R3 = at(W, ...BK.R, 290, 190, "", `<div class="card blue" style="height:84px;padding:12px 16px"><div class="t">${ic("key", 22)} Clé publique</div><div class="s">(n, e) : à partager</div></div><div class="card violet" style="height:84px;padding:12px 16px;margin-top:14px"><div class="t">${ic("lock", 22)} Clé privée</div><div class="s">(n, d) : à garder</div></div>`);
  const [pubC, privC] = R3.querySelectorAll(".card");
  makeStep(W, BK, "keys3", {
    label: "La paire se <span>sépare</span>", op: "Séparation", opSub: "publique et privée", L: L3, R: R3, fromPrev: true,
    tick: (t, lt, d, rAt) => {
      const p = P(t, S("keys3") + rAt + 0.2, 0.7, eio);
      pubC.style.transform = `translateY(${(-10 * p).toFixed(1)}px)`;
      privC.style.transform = `translateY(${(10 * p).toFixed(1)}px)`;
    },
  });

  // Étape 4 : protection par mot de passe
  const L4 = card(W, ...BK.L, 260, 150, "violet", `${ic("lock", 24)} Clé privée`, "", `<div class="row" style="margin-top:8px"><span>Mot de passe</span><span class="mono pw"></span></div>`);
  const pw = L4.querySelector(".pw");
  const R4 = card(W, ...BK.R, 290, 150, "", `<span class="lk">${ic("lockOpen", 26)}</span> cle_privee.rsakey`, "chiffrée par mot de passe");
  const lk = R4.querySelector(".lk");
  makeStep(W, BK, "keys4", {
    label: "Enregistrement <span>protégé</span>", op: "PBKDF2", opSub: "600 000 itérations, AES-GCM", L: L4, R: R4,
    until: () => E("keys4") + 0.6,
    tick: (t, lt, d, rAt) => {
      setHTML(pw, typed("••••••••••", P(t, S("keys4") + 0.6, 1.2, (x) => x)));
      setHTML(lk, ic(t > S("keys4") + rAt + 0.7 ? "lock" : "lockOpen", 26));
      lk.style.color = t > S("keys4") + rAt + 0.7 ? "#6f59dc" : "#8a8fa3";
    },
  });
}

function buildPublicKey(W) {
  const token = at(W, 0, 210, 290, 50, "", `<span class="pill p-blue-s">${ic("key", 20)} clé publique (.pem)</span>`);
  token.style.textAlign = "center";
  const ghost = at(W, 0, 0, 180, 40, "", `<span class="pill p-blue" style="font-size:16px;padding:6px 12px">${ic("key", 18)} copie</span>`);
  ghost.style.textAlign = "center";
  const ghostLbl = at(W, 1180, 360, 300, 26, "lbl", "sans danger : elle ne sert qu'à chiffrer");
  ghostLbl.style.fontSize = "17px";

  const plA = card(W, 330, 590, 380, 150, "", "Empreinte chez Awa", "", `<div class="mono fpa" style="font-size:24px;margin-top:8px;line-height:1.35"></div>`);
  const plK = card(W, 1590, 590, 380, 150, "", "Empreinte chez Koffi", "", `<div class="mono fpk" style="font-size:24px;margin-top:8px;line-height:1.35"></div>`);
  const fa = plA.querySelector(".fpa"), fk = plK.querySelector(".fpk");
  const voice = at(W, 960, 600, 300, 120, "", `<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><div class="eye" style="width:74px;height:74px;color:#6c7fed">${ic("audio", 34)}</div><div class="lbl">lue à voix haute</div></div>`);
  const voiceIc = voice.querySelector("svg");
  const badge = at(W, 960, 740, 360, 54, "", `<span class="pill p-green-s" style="font-size:21px">${ic("shield", 22)} Empreinte vérifiée</span>`);
  badge.style.textAlign = "center";

  tickers.push((t) => {
    const a = S("pub1");
    const p = P(t, a + 0.5, 2.9, eio);
    put(token, vis(t, a + 0.3, a + 3.7, 0.3, 0.3), lerp(1440, 480, p), 0, 1);
    const pg = P(t, a + 1.8, 0.8, eio);
    put(ghost, vis(t, a + 1.8, E("pub1") + 0.2, 0.3, 0.5), lerp(960, 1180, pg), lerp(210, 322, pg));
    put(ghostLbl, vis(t, a + 2.4, E("pub1") + 0.2, 0.4, 0.5));

    const b = S("pub2");
    const end = E("pub3");
    const g = P(t, S("pub3") + 0.1, 1.3, (x) => x);
    put(plK, vis(t, b + 0.2, end, 0.5, 0.4), 0, (1 - P(t, b + 0.2, 0.5)) * 16);
    put(plA, vis(t, b + 0.8, end, 0.5, 0.4), 0, (1 - P(t, b + 0.8, 0.5)) * 16);
    const half = (p, gg) => {
      const l1 = typed(FP.slice(0, 19), p * 2, gg * 2);
      const l2 = typed(FP.slice(20), p * 2 - 1, gg * 2 - 1);
      return l1 + "<br>" + l2;
    };
    setHTML(fk, half(P(t, b + 0.4, 1.6, (x) => x), g));
    setHTML(fa, half(P(t, b + 1.0, 1.6, (x) => x), g));
    put(voice, vis(t, b + 0.7, end, 0.4, 0.4), 0, 0, popS(clamp((t - b - 0.7) / 0.5)));
    voiceIc.style.transform = `scaleY(${(0.75 + 0.25 * Math.abs(Math.sin(t * 7))).toFixed(3)})`;
    const pb = clamp((t - (S("pub3") + 1.3)) / 0.5);
    put(badge, clamp(pb * 2) * clamp((end - t) / 0.4), 0, 0, popS(pb));
  });
}

function buildEncrypt(W) {
  // Étape 1 : clé de session
  const L1 = card(W, ...BA.L, 250, 150, "", `${ic("dice", 26)} Aléa`, "crypto.getRandomValues");
  const kb = barsEl(32, "#6f59dc");
  const R1 = card(W, ...BA.R, 280, 150, "violet", `${ic("key", 24)} Clé de session`, "AES-256, jamais affichée");
  R1.insertBefore(kb.el, R1.querySelector(".s"));
  kb.el.style.margin = "10px 0 2px";
  makeStep(W, BA, "enc1", {
    label: "Étape 1 sur 4 : <span>la clé de session</span>", op: "Générateur", opSub: "256 bits aléatoires", L: L1, R: R1, handoff: true,
    tick: (t, lt, d, rAt) => growBars(kb, t, S("enc1") + rAt + 0.15),
  });

  // Étape 2 : scellement RSA-OAEP
  const kb2 = barsEl(32, "#6f59dc");
  const L2 = card(W, 250, 560, 280, 150, "violet", `${ic("key", 24)} Clé de session`, "AES-256, jamais affichée");
  L2.insertBefore(kb2.el, L2.querySelector(".s"));
  kb2.el.style.margin = "10px 0 2px";
  growBars(kb2, 1e9, 0);
  const pubChip = at(W, 0, 0, 280, 44, "", `<span class="pill p-blue-s">${ic("key", 20)} clé publique de Koffi</span>`);
  pubChip.style.textAlign = "center";
  const R2 = card(W, ...BA.R, 280, 150, "violet", `<span class="lk2">${ic("lockOpen", 26)}</span> Clé scellée`, "384 octets, illisibles");
  const lk2 = R2.querySelector(".lk2");
  makeStep(W, BA, "enc2", {
    label: "Étape 2 sur 4 : <span>sceller la clé</span>", op: "RSA-OAEP", opSub: "SHA-256", L: L2, R: R2, fromPrev: true, Lpos: [250, 560], handoff: true,
    tick: (t, lt, d, rAt) => {
      const a = S("enc2");
      const p = P(t, a + 0.4, 1.0, eio);
      put(pubChip, vis(t, a + 0.35, E("enc2"), 0.3, 0.35), lerp(330, 250, p), lerp(372, 690, p));
      const closed = t > a + rAt + 0.75;
      setHTML(lk2, ic(closed ? "lock" : "lockOpen", 26));
    },
  });

  // Étape 3 : AES-256-GCM
  const gL = gridEl(12, 7, 13, 4);
  const L3 = card(W, ...BA.L, 250, 220, "", `${ic("file", 24)} rapport.pdf`, "en clair");
  L3.insertBefore(gL.el, L3.querySelector(".s"));
  gL.el.style.margin = "10px 0 4px";
  const gR = gridEl(12, 7, 13, 4);
  const R3 = card(W, ...BA.R, 250, 250, "", "Contenu chiffré", "", "");
  R3.appendChild(gR.el);
  gR.el.style.margin = "10px 0 8px";
  const tags = div(R3, "", [1, 2, 3].map(() => `<span class="pill p-violet" style="font-size:13px;padding:3px 9px;box-shadow:none;margin-right:5px">étiquette</span>`).join(""));
  const tagEls = [...tags.children];
  makeStep(W, BA, "enc3", {
    label: "Étape 3 sur 4 : <span>chiffrer le contenu</span>", op: "AES-256-GCM", opSub: "morceaux d'1 Mo", L: L3, R: R3, handoff: false, rAt: 1.6,
    tick: (t, lt, d, rAt) => {
      const a = S("enc3");
      sweep(gL, t, -1, 0.1, "p", "p");
      sweep(gR, t, a + rAt + 0.5, d * 0.42, "p", "c");
      tagEls.forEach((e, i) => (e.style.opacity = P(t, a + rAt + 0.6 + d * 0.42 + i * 0.25, 0.3).toFixed(3)));
    },
  });

  // Étape 4 : assemblage
  const L4 = at(W, ...BA.L, 250, 200, "", `<div style="display:flex;flex-direction:column;gap:12px;align-items:center">
      <span class="pill p-navy">En-tête</span><span class="pill p-violet-s">${ic("lock", 18)} Clé scellée</span><span class="pill p-violet">Contenu chiffré</span></div>`);
  const R4 = card(W, ...BA.R, 300, 170, "violet", `${ic("lock", 24)} rapport.pdf.rsaenc`, "", `<div style="display:flex;height:12px;gap:3px;margin:12px 0 10px"><i style="flex:1;background:#1f2b40;border-radius:6px"></i><i style="flex:1.4;background:#6f59dc;border-radius:6px"></i><i style="flex:5;background:#c3b6f5;border-radius:6px"></i></div><div class="mono hx" style="font-size:17px;color:#4a3ba8"></div>`);
  const hx = R4.querySelector(".hx");
  makeStep(W, BA, "enc4", {
    label: "Étape 4 sur 4 : <span>assembler le fichier</span>", op: "Assemblage", opSub: "format .rsaenc", L: L4, R: R4, fromPrev: false,
    until: () => E("enc4") + 0.6,
    tick: (t, lt, d, rAt) => setHTML(hx, typed("52 53 41 45 4E 43 01 …", P(t, S("enc4") + rAt + 0.4, 1.4, (x) => x))),
  });
}

function buildTransmit(W) {
  const file = at(W, 0, 210, 320, 50, "", `<span class="pill p-violet-s">${ic("lock", 20)} rapport.pdf.rsaenc</span>`);
  file.style.textAlign = "center";
  const recv = at(W, 1590, 430, 320, 46, "", `<span class="pill p-violet">${ic("lock", 18)} rapport.pdf.rsaenc reçu</span>`);
  recv.style.textAlign = "center";
  const copy = at(W, 0, 0, 160, 40, "", `<span class="pill p-violet" style="font-size:16px;padding:6px 12px">${ic("lock", 16)} copie</span>`);
  copy.style.textAlign = "center";
  const g = gridEl(16, 6, 15, 4);
  const panel = card(W, 960, 620, 420, 250, "", `${ic("eye", 24)} Ce que voit le tiers`, "illisible sans la clé privée");
  panel.insertBefore(g.el, panel.querySelector(".s"));
  g.el.style.margin = "12px 0 6px";
  const mod = at(W, 1300, 690, 300, 44, "", `<span class="pill p-red">${ic("x", 18, 3)} 1 octet modifié</span>`);
  mod.style.textAlign = "center";
  const det = at(W, 1590, 495, 360, 46, "", `<span class="pill p-red">${ic("shieldX", 20)} modification détectée</span>`);
  det.style.textAlign = "center";

  tickers.push((t) => {
    const a = S("tx1");
    const p = P(t, a + 0.4, Math.min(3.2, D("tx1") - 0.2), eio);
    put(file, vis(t, a + 0.2, a + 0.4 + Math.min(3.2, D("tx1") - 0.2) + 0.25, 0.3, 0.3), lerp(480, 1440, p));
    put(recv, vis(t, a + 3.4, S("dec1") + 0.5, 0.4, 0.5), 0, 0, popS(clamp((t - a - 3.4) / 0.5)));
    const b = S("tx2");
    const pc = P(t, b + 0.2, 0.8, eio);
    put(copy, vis(t, b + 0.15, b + 1.2, 0.2, 0.3), 960, lerp(210, 520, pc), 1);
    const end = E("tx3");
    put(panel, vis(t, b + 0.8, end, 0.4, 0.4), 0, 0, popS(clamp((t - b - 0.8) / 0.5)));
    const c = S("tx3");
    const red = t > c + 0.5 ? 16 * 2 + 9 : -1;
    sweep(g, t, -1, 0.1, "c", "c", red);
    put(mod, vis(t, c + 0.6, end, 0.4, 0.4), 0, 0, popS(clamp((t - c - 0.6) / 0.5)));
    put(det, vis(t, c + 1.6, end + 0.3, 0.4, 0.4), 0, 0, popS(clamp((t - c - 1.6) / 0.5)));
  });
}

function buildDecrypt(W) {
  // Étape 1 : en-tête
  const L1 = card(W, ...BK.L, 270, 140, "violet", `${ic("lock", 24)} rapport.pdf.rsaenc`, "fichier reçu");
  const R1 = card(W, ...BK.R, 300, 170, "", "Destinataire", "", `<div class="row"><span>fichier</span><span class="mono f1"></span></div><div class="row"><span>votre clé</span><span class="mono f2"></span></div><div class="ok1" style="color:#039f7a;font-weight:800;font-size:17px;margin-top:6px;display:flex;align-items:center;gap:6px">${ic("check", 18, 3)} C'est votre clé</div>`);
  const f1 = R1.querySelector(".f1"), f2 = R1.querySelector(".f2"), ok1 = R1.querySelector(".ok1");
  makeStep(W, BK, "dec1", {
    label: "Étape 1 sur 4 : <span>lire l'en-tête</span>", tone: "green", op: "En-tête", opSub: "format RSAENC v1", L: L1, R: R1, handoff: false,
    tick: (t, lt, d, rAt) => {
      const a = S("dec1") + rAt + 0.3;
      const g = P(t, a + 1.2, 0.9, (x) => x);
      setHTML(f1, typed(FP.slice(0, 14), P(t, a, 0.7, (x) => x), g));
      setHTML(f2, typed(FP.slice(0, 14), P(t, a + 0.4, 0.7, (x) => x), g));
      ok1.style.opacity = P(t, a + 2.1, 0.4).toFixed(3);
    },
  });

  // Étape 2 : ouverture de la clé de session
  const L2 = at(W, ...BK.L, 280, 220, "", `<div class="card violet" style="height:86px;padding:12px 16px"><div class="t">${ic("lock", 22)} Clé scellée</div><div class="s">384 octets</div></div>
      <div class="card" style="height:104px;padding:12px 16px;margin-top:12px"><div class="t"><span class="lk3">${ic("lock", 22)}</span> Clé privée</div><div class="row"><span>Mot de passe</span><span class="mono pw3"></span></div></div>`);
  const lk3 = L2.querySelector(".lk3"), pw3 = L2.querySelector(".pw3");
  const kb = barsEl(32, "#039f7a");
  const R2 = card(W, ...BK.R, 280, 150, "green", `${ic("key", 24)} Clé de session`, "retrouvée");
  R2.insertBefore(kb.el, R2.querySelector(".s"));
  kb.el.style.margin = "10px 0 2px";
  makeStep(W, BK, "dec2", {
    label: "Étape 2 sur 4 : <span>ouvrir la clé de session</span>", tone: "green", op: "RSA-OAEP", opSub: "clé privée de Koffi", L: L2, R: R2, handoff: false, rAt: 2.0,
    tick: (t, lt, d, rAt) => {
      const a = S("dec2");
      setHTML(pw3, typed("••••••••", P(t, a + 0.5, 1.0, (x) => x)));
      const open = t > a + 1.6;
      setHTML(lk3, ic(open ? "lockOpen" : "lock", 22));
      lk3.style.color = open ? "#039f7a" : "#4a3ba8";
      growBars(kb, t, a + rAt + 0.15);
    },
  });

  // Étape 3 : AES-GCM
  const gL = gridEl(12, 7, 13, 4);
  const L3 = card(W, ...BK.L, 250, 220, "violet", `${ic("lock", 22)} Contenu chiffré`, "");
  L3.appendChild(gL.el);
  gL.el.style.margin = "10px 0 4px";
  const gR = gridEl(12, 7, 13, 4);
  const R3 = card(W, ...BK.R, 260, 250, "", "Contenu restauré", "", "");
  R3.appendChild(gR.el);
  gR.el.style.margin = "10px 0 8px";
  const tags = div(R3, "", [1, 2, 3].map(() => `<span class="pill p-green" style="font-size:13px;padding:3px 8px;box-shadow:none;margin-right:4px">${ic("check", 12, 3.4)} valide</span>`).join(""));
  const tagEls = [...tags.children];
  makeStep(W, BK, "dec3", {
    label: "Étape 3 sur 4 : <span>déchiffrer le contenu</span>", tone: "green", op: "AES-256-GCM", opSub: "étiquettes vérifiées", L: L3, R: R3, handoff: false, rAt: 1.6,
    tick: (t, lt, d, rAt) => {
      const a = S("dec3");
      sweep(gL, t, -1, 0.1, "c", "c");
      sweep(gR, t, a + rAt + 0.5, d * 0.45, "c", "p");
      tagEls.forEach((e, i) => (e.style.opacity = P(t, a + rAt + 0.7 + i * (d * 0.15), 0.3).toFixed(3)));
    },
  });

  // Étape 4 : SHA-256
  const gD = gridEl(12, 7, 13, 4);
  const L4 = card(W, ...BK.L, 250, 220, "", `${ic("file", 24)} rapport.pdf`, "restauré");
  L4.insertBefore(gD.el, L4.querySelector(".s"));
  gD.el.style.margin = "10px 0 4px";
  const R4 = card(W, ...BK.R, 320, 180, "", `${ic("hash", 22)} SHA-256`, "", `<div class="row"><span>original</span><span class="mono h1"></span></div><div class="row"><span>obtenu</span><span class="mono h2"></span></div><div class="same" style="margin-top:8px"><span class="pill p-green-s" style="font-size:16px;padding:6px 12px;box-shadow:none">${ic("check", 16, 3)} Identique à l'original</span></div>`);
  const h1 = R4.querySelector(".h1"), h2 = R4.querySelector(".h2"), same = R4.querySelector(".same");
  makeStep(W, BK, "dec4", {
    label: "Étape 4 sur 4 : <span>vérifier l'intégrité</span>", tone: "green", op: "SHA-256", opSub: "empreinte du fichier", L: L4, R: R4,
    until: () => E("dec4") + 0.6,
    tick: (t, lt, d, rAt) => {
      const a = S("dec4") + rAt + 0.3;
      sweep(gD, t, -1, 0.1, "p", "p");
      const g = P(t, a + 1.6, 0.9, (x) => x);
      setHTML(h1, typed(HASH, P(t, a, 0.8, (x) => x), g));
      setHTML(h2, typed(HASH, P(t, a + 0.6, 0.8, (x) => x), g));
      same.style.opacity = P(t, a + 2.5, 0.4).toFixed(3);
      same.style.transform = `scale(${popS(clamp((t - a - 2.5) / 0.5)).toFixed(3)})`;
    },
  });
}

// ------------------------------------------------------------------ captures du site
function buildOverlay({ from, to, url, w, vh, img, iw, ih, mode, focus = [0.5, 0.5], zoom = 1.3, x = 960, y = 470, dim = true, extra }) {
  const L = div(stage, "layer");
  const bd = div(L, "abs backdrop", "", { inset: "0" });
  const win = at(L, x, y, w, vh + 40, "win", `<div class="bar"><span class="url">${url}</span></div><div class="vp" style="height:${vh}px"></div>`);
  const vp = win.querySelector(".vp");
  const imgs = (Array.isArray(img) ? img : [img]).map((src) => {
    const im = document.createElement("img");
    im.src = SHOTS + src;
    vp.appendChild(im);
    return im;
  });
  if (mode === "stack") {
    vp.style.padding = "26px 30px";
    imgs.forEach((im, i) => {
      im.style.position = "static";
      im.style.width = "100%";
      im.style.borderRadius = "14px";
      im.style.border = "1px solid #e1e3f0";
      if (i) im.style.marginTop = "18px";
    });
  } else {
    imgs[0].style.width = iw + "px";
    imgs[0].style.height = ih + "px";
  }
  const ex = extra ? extra(L) : null;
  tickers.push((t) => {
    const a = from(), b = to();
    const o = vis(t, a, b, 0.5, 0.5);
    put(L, o);
    put(bd, dim ? 1 : 0);
    const p = clamp((t - a) / 0.6);
    put(win, 1, 0, (1 - eo(p)) * 30, 0.96 + 0.04 * eo(p));
    const q = P(t, a + 0.6, b - a - 1.2, eio);
    if (mode === "zoom") {
      const s = lerp(1, zoom, q);
      const fx = focus[0] * iw, fy = focus[1] * ih;
      const tx = lerp(0, w / 2 - fx * s, q), ty = lerp(0, vh / 2 - fy * s, q);
      const cx = clamp(tx, w - iw * s, 0), cy = clamp(ty, vh - ih * s, 0);
      imgs[0].style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) scale(${s.toFixed(4)})`;
    } else if (mode === "scroll") {
      imgs[0].style.transform = `translateY(${(-Math.max(0, ih - vh) * q).toFixed(1)}px)`;
    } else {
      vp.style.transform = `scale(${lerp(1, 1.03, q).toFixed(4)})`;
    }
    if (ex) ex(t, a, b);
  });
}

function buildOverlays() {
  buildOverlay({ from: () => S("keys5"), to: () => E("keys5"), url: "localhost:5173/#/cles", w: 1200, vh: 668, img: ["05-cles-calcul.png", "06-cles-identite.png"], mode: "stack" });
  buildOverlay({ from: () => S("enc5"), to: () => E("enc5"), url: "localhost:5173/#/chiffrer", w: 1230, vh: 820, img: "12-chiffrer-en-cours.png", iw: 1230, ih: 820, mode: "zoom", focus: [0.78, 0.5], zoom: 1.55 });
  buildOverlay({ from: () => S("dec5"), to: () => E("dec5"), url: "localhost:5173/#/dechiffrer", w: 600, vh: 800, img: "16-dechiffrer-termine.png", iw: 600, ih: 1153, mode: "scroll" });
  buildOverlay({
    from: () => S("bad1"), to: () => E("bad2"), url: "localhost:5173/#/dechiffrer", w: 600, vh: 800, img: "17-dechiffrer-refus.png", iw: 600, ih: 864, mode: "scroll", x: 700, dim: false,
    extra: (L) => {
      const items = [
        ["p-red", "x", "1 octet modifié"],
        ["p-red", "shieldX", "étiquette AES-GCM invalide"],
        ["p-red", "x", "rien n'est restitué"],
      ].map(([c, i, txt], k) => at(L, 1390, 300 + k * 90, 560, 56, "", `<span class="pill ${c}" style="font-size:22px;padding:10px 20px">${ic(i, 22, 3)} ${txt}</span>`));
      const also = at(L, 1390, 600, 560, 36, "lbl", "Refusés de la même façon :");
      also.style.fontSize = "22px";
      const more = ["mauvaise clé", "fichier tronqué", "morceaux intervertis"].map((txt, k) =>
        at(L, 1390, 660 + k * 66, 560, 50, "", `<span class="pill p-white" style="font-size:20px">${ic("x", 18, 3)} ${txt}</span>`));
      return (t) => {
        items.forEach((e, k) => put(e, P(t, S("bad1") + 0.9 + k * 0.7, 0.4), (1 - P(t, S("bad1") + 0.9 + k * 0.7, 0.5)) * 30));
        put(also, P(t, S("bad2") + 0.3, 0.4));
        more.forEach((e, k) => put(e, P(t, S("bad2") + 0.6 + k * 0.4, 0.4), 0, 0, popS(clamp((t - S("bad2") - 0.6 - k * 0.4) / 0.5))));
      };
    },
  });
}

// ------------------------------------------------------------------ résumé
function buildSummary() {
  const L = div(stage, "layer");
  const zA = at(L, 445, 455, 720, 600, "zone a");
  const zC = at(L, 960, 455, 250, 600, "zone c");
  const zK = at(L, 1475, 455, 720, 600, "zone k");
  const hA = at(L, 445, 200, 600, 40, "zh", `<span style="color:#4a3ba8">Chez Awa</span>`);
  const hC = at(L, 960, 200, 240, 40, "zh", `<span style="color:#5b6178;font-size:22px">Canal non sûr</span>`);
  const hK = at(L, 1475, 200, 600, 40, "zh", `<span style="color:#05664f">Chez Koffi</span>`);
  const tA = at(L, 445, 262, 600, 40, "", `<span class="pill p-blue">${ic("key", 18)} clé publique de Koffi, vérifiée</span>`);
  const tK = at(L, 1475, 262, 600, 40, "", `<span class="pill p-violet">${ic("lock", 18)} clé privée et mot de passe</span>`);
  [tA, tK].forEach((e) => (e.style.textAlign = "center"));
  const sb = [];
  const mk = (x, y, t, small, bg, color, border) => {
    const e = at(L, x, y, 196, 78, "sbox", `${t}${small ? `<small>${small}</small>` : ""}`);
    e.style.background = bg;
    e.style.color = color;
    e.style.border = `3px solid ${border || bg}`;
    sb.push(e);
    return e;
  };
  const V = "#6f59dc", G = "#039f7a";
  const a1 = mk(215, 440, "Fichier", "en clair", "#fff", "#141b33", "#e1e3f0");
  const a2 = mk(445, 440, "AES-256-GCM", "contenu", "#fff", "#4a3ba8", V);
  const a3 = mk(675, 440, "Contenu chiffré", "", "#e7e6fb", "#4a3ba8");
  const a4 = mk(215, 640, "Clé AES", "aléatoire", "#e7e6fb", "#4a3ba8");
  const a5 = mk(445, 640, "RSA-OAEP", "clé publique", "#fff", "#4a3ba8", V);
  const a6 = mk(675, 640, "Clé scellée", "384 octets", "#e7e6fb", "#4a3ba8");
  const f = mk(960, 540, `${ic("lock", 22)}`, ".rsaenc", "#6f59dc", "#fff");
  f.style.height = "96px";
  const k3 = mk(1245, 440, "Contenu chiffré", "", "#e7e6fb", "#4a3ba8");
  const k2 = mk(1475, 440, "AES-256-GCM", "étiquettes", "#fff", "#05664f", G);
  const k1 = mk(1705, 440, "Fichier", "SHA-256 vérifié", "#e1f1f2", "#05664f", G);
  const k6 = mk(1245, 640, "Clé scellée", "", "#e7e6fb", "#4a3ba8");
  const k5 = mk(1475, 640, "RSA-OAEP", "clé privée", "#fff", "#05664f", G);
  const k4 = mk(1705, 640, "Clé AES", "retrouvée", "#e1f1f2", "#05664f");

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "1920");
  svg.setAttribute("height", "1080");
  svg.setAttribute("class", "abs");
  svg.style.left = "0";
  svg.style.top = "0";
  L.insertBefore(svg, sb[0]);
  const path = (d, color) => {
    const p = document.createElementNS(svgNS, "path");
    p.setAttribute("d", d);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", color);
    p.setAttribute("stroke-width", "4");
    p.setAttribute("stroke-linecap", "round");
    svg.appendChild(p);
    return p;
  };
  const lines = [
    [path("M313 440 H347", V), "sum1", 1.0],
    [path("M543 440 H577", V), "sum1", 1.6],
    [path("M313 640 H347", V), "sum1", 1.3],
    [path("M543 640 H577", V), "sum1", 1.9],
    [path("M290 610 L370 470", V), "sum1", 1.45],
    [path("M773 440 C 830 440, 840 520, 862 528", V), "sum1", 2.5],
    [path("M773 640 C 830 640, 840 560, 862 552", V), "sum1", 2.6],
    [path("M1058 528 C 1080 520, 1090 440, 1147 440", G), "sum2", 0.3],
    [path("M1058 552 C 1080 560, 1090 640, 1147 640", G), "sum2", 0.4],
    [path("M1343 640 H1377", G), "sum2", 0.9],
    [path("M1573 640 H1607", G), "sum2", 1.4],
    [path("M1630 610 L1550 470", G), "sum2", 1.9],
    [path("M1343 440 H1377", G), "sum2", 2.2],
    [path("M1573 440 H1607", G), "sum2", 2.6],
  ].map(([p, seg, at0]) => {
    const len = p.getTotalLength();
    p.setAttribute("stroke-dasharray", `${len} ${len}`);
    return { p, len, seg, at0 };
  });
  const order = [
    [a1, "sum1", 0.6], [a4, "sum1", 0.8], [a2, "sum1", 1.2], [a5, "sum1", 1.5], [a3, "sum1", 1.9], [a6, "sum1", 2.1], [f, "sum1", 2.9],
    [k3, "sum2", 0.5], [k6, "sum2", 0.6], [k5, "sum2", 1.1], [k4, "sum2", 1.6], [k2, "sum2", 2.3], [k1, "sum2", 2.8],
  ];
  const legL = at(L, 520, 840, 900, 50, "", `<span class="lbl" style="margin-right:12px">Voyage sur le canal :</span><span class="pill p-blue">${ic("key", 18)} clé publique</span> <span class="pill p-violet-s" style="margin-left:6px">${ic("lock", 18)} fichier .rsaenc</span>`);
  const legR = at(L, 1400, 840, 900, 50, "", `<span class="lbl" style="margin-right:12px">Reste secret :</span><span class="pill p-green">clé privée</span> <span class="pill p-green" style="margin-left:6px">mot de passe</span> <span class="pill p-green" style="margin-left:6px">clé de session</span>`);
  [legL, legR].forEach((e) => (e.style.textAlign = "center"));

  tickers.push((t) => {
    const o = vis(t, S("sum1") - 0.3, E("sum2"), 0.6, 0.5);
    put(L, o);
    const z = (e, d) => put(e, P(t, S("sum1") + d, 0.5), 0, 0, 0.97 + 0.03 * P(t, S("sum1") + d, 0.5));
    z(zA, 0); z(zC, 0.1); z(zK, 0.2); z(hA, 0.15); z(hC, 0.25); z(hK, 0.35);
    put(tA, P(t, S("sum1") + 0.4, 0.5));
    put(tK, P(t, S("sum2") + 0.2, 0.5));
    order.forEach(([e, seg, d]) => {
      const p = clamp((t - (S(seg) + d)) / 0.5);
      put(e, clamp(p * 2), 0, 0, popS(p));
    });
    lines.forEach(({ p, len, seg, at0 }) => p.setAttribute("stroke-dashoffset", String(len * (1 - P(t, S(seg) + at0, 0.45, eio)))));
    const lg = S("sum2") + D("sum2") * 0.35;
    put(legL, P(t, lg, 0.5), 0, (1 - P(t, lg, 0.5)) * 12);
    put(legR, P(t, lg + D("sum2") * 0.25, 0.5), 0, (1 - P(t, lg + D("sum2") * 0.25, 0.5)) * 12);
  });
}

function buildEnd() {
  const L = div(stage, "layer navy");
  div(L, "glow abs", "", { width: "900px", height: "900px", left: "-300px", top: "-360px", background: "radial-gradient(circle, rgba(111,89,220,.5), rgba(111,89,220,0) 65%)" });
  div(L, "glow abs", "", { width: "800px", height: "800px", right: "-300px", bottom: "-300px", background: "radial-gradient(circle, rgba(3,159,122,.3), rgba(3,159,122,0) 65%)" });
  const lock = at(L, 960, 280, 120, 120, "", `<svg class="i" width="120" height="120" viewBox="0 0 24 24" stroke-width="1.8" style="color:#a9b8ff">${ICONS.lock}<circle cx="12" cy="16.5" r="1.2"/></svg>`);
  const title = at(L, 960, 420, 1400, 130, "title-xl", "RSA FileSecure");
  title.style.textAlign = "center";
  const pills = at(L, 960, 540, 1400, 56, "", ["RSA-OAEP 3072 bits", "AES-256-GCM", "SHA-256", "PBKDF2"].map((p) => `<span class="pill" style="background:rgba(255,255,255,.1);color:#fff;box-shadow:none;margin:0 8px;font-size:22px">${p}</span>`).join(""));
  pills.style.textAlign = "center";
  const line = at(L, 960, 640, 1400, 50, "sub-xl", "Tout se passe dans le navigateur.");
  const tp = at(L, 960, 720, 1000, 30, "kick", "TP de cryptographie, 2026");
  tp.style.textAlign = "center";
  tickers.push((t) => {
    const a = S("end");
    put(L, vis(t, a - 0.2, TOTAL + 5, 0.6, 0.1));
    const pl = clamp((t - (a + 0.3)) / 0.6);
    put(lock, clamp(pl * 2), 0, 0, popS(pl));
    put(title, P(t, a + 0.5, 0.7), 0, (1 - P(t, a + 0.5, 0.7)) * 20);
    put(pills, P(t, a + 1.0, 0.7));
    put(line, P(t, a + 1.5, 0.7));
    put(tp, P(t, a + 2.0, 0.7));
  });
}

function buildHud() {
  const brand = div(stage, "", `${ic("lock", 30, 2.4)} RSA FileSecure`);
  brand.id = "brand";
  brand.querySelector("svg").style.color = "#6f59dc";
  const chap = div(stage, "", `<span class="pill p-white"></span>`);
  chap.id = "chapter";
  const chapPill = chap.firstChild;
  const prog = div(stage, "");
  prog.id = "progress";
  const cap = div(stage, "");
  cap.id = "caption";
  const CH = [
    ["roles", "1. Les acteurs"], ["keys1", "2. Les clés de Koffi"], ["pub1", "3. La clé publique"], ["enc1", "4. Le chiffrement"],
    ["tx1", "5. La transmission"], ["dec1", "6. Le déchiffrement"], ["bad1", "7. Un fichier modifié"], ["sum1", "8. Résumé"],
  ];
  tickers.push((t) => {
    const show = vis(t, S("roles"), S("end"), 0.5, 0.5);
    put(brand, show);
    let cur = null;
    for (const [id, txt] of CH) if (t >= S(id) - 0.2) cur = [id, txt];
    put(chap, cur ? show : 0, 0, 0, cur ? popS(clamp((t - S(cur[0]) + 0.2) / 0.5)) : 1);
    if (cur) setHTML(chapPill, cur[1]);
    prog.style.width = `${((t / TOTAL) * 100).toFixed(3)}%`;
    const seg = window.__SEGS.find((s) => t >= TL[s.id].start && t < TL[s.id].start + TL[s.id].dur);
    if (seg) {
      setHTML(cap, seg.caption);
      const co = vis(t, S(seg.id) + 0.1, E(seg.id) - 0.02, 0.25, 0.2);
      cap.style.opacity = co.toFixed(3);
      cap.style.visibility = co > 0.002 ? "visible" : "hidden";
      cap.style.transform = `translateX(-50%) translateY(${((1 - P(t, S(seg.id) + 0.1, 0.3)) * 8).toFixed(1)}px)`;
    } else cap.style.visibility = "hidden";
  });
}

// ------------------------------------------------------------------ démarrage
window.init = (tl, segs, total) => {
  TL = tl;
  TOTAL = total;
  window.__SEGS = segs;
  stage = document.getElementById("stage");
  CAM = [
    { t: 0, p: FULL },
    { t: S("keys1"), p: FK },
    { t: S("pub1"), p: FULL },
    { t: S("enc1"), p: FA },
    { t: S("tx1"), p: FULL },
    { t: S("dec1"), p: FK },
  ];
  buildWorld();
  buildOverlays();
  buildSummary();
  buildTitle();
  buildEnd();
  buildHud();
  window.renderAt(0);
};
window.renderAt = (t) => {
  for (const f of tickers) f(t);
};
