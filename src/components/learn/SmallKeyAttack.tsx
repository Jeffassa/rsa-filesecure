import NumberFlow from "@number-flow/react";
import { Skull, Swords } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Notice } from "@/components/kit/misc";
import { decryptNumber, encryptNumber, factorize, modInverse, randomPrime, type ToyKey, toyKey } from "@/crypto/textbook";
import { formatDuration, formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SimpleBars } from "./SimpleBars";

const SIZES = [32, 40, 48, 56, 64] as const;
const SECRET = "SECRET!";

function encodeText(text: string): bigint {
  let n = 0n;
  for (const ch of text) n = (n << 8n) | BigInt(ch.charCodeAt(0) & 0xff);
  return n;
}

function decodeText(n: bigint): string {
  let s = "";
  let x = n;
  while (x > 0n) {
    s = String.fromCharCode(Number(x & 0xffn)) + s;
    x >>= 8n;
  }
  return s;
}

interface Target {
  bits: number;
  key: ToyKey;
  plain: string;
  cipher: bigint;
}

interface Attack {
  p: bigint;
  q: bigint;
  d: bigint;
  iterations: number;
  ms: number;
  recovered: string;
}

export function SmallKeyAttack() {
  const [bits, setBits] = useState<number>(48);
  const [target, setTarget] = useState<Target | null>(null);
  const [attack, setAttack] = useState<Attack | null>(null);
  const [running, setRunning] = useState(false);
  const [timings, setTimings] = useState<Record<number, number>>({});

  function newTarget() {
    const key = toyKey(randomPrime(bits / 2), randomPrime(bits / 2));
    const chars = Math.max(1, Math.floor((bits - 2) / 8));
    const plain = SECRET.slice(0, chars);
    setTarget({ bits, key, plain, cipher: encryptNumber(encodeText(plain), key) });
    setAttack(null);
  }

  function run() {
    if (!target) return;
    setRunning(true);
    setAttack(null);
    // Laisse le temps au bouton d'afficher son état avant le calcul.
    setTimeout(() => {
      const f = factorize(target.key.n);
      const phi = (f.p - 1n) * (f.q - 1n);
      const d = modInverse(target.key.e, phi);
      const recovered = decodeText(decryptNumber(target.cipher, { d, n: target.key.n }));
      setAttack({ p: f.p, q: f.q, d, iterations: f.iterations, ms: f.ms, recovered });
      setTimings((t) => ({ ...t, [target.bits]: Math.max(f.ms, 0.05) }));
      setRunning(false);
    }, 350);
  }

  const chart = SIZES.filter((s) => timings[s] !== undefined).map((s) => ({ name: `${s} bits`, value: timings[s] }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-2">Taille du module n de la victime</p>
          <div className="grid grid-cols-5 gap-1 rounded-xl bg-zone p-1">
            {SIZES.map((s) => (
              <button
                className={cn("relative rounded-lg py-2 text-sm font-semibold", bits === s ? "text-white" : "text-ink-2 hover:text-ink")}
                key={s}
                onClick={() => {
                  setBits(s);
                  setTarget(null);
                  setAttack(null);
                }}
                type="button"
              >
                {bits === s && <motion.span className="absolute inset-0 rounded-lg bg-danger" layoutId="attack-size" />}
                <span className="relative">{s}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="w-full rounded-xl bg-chip py-2.5 text-sm font-semibold text-chip-text transition-colors hover:bg-blue-btn" onClick={newTarget} type="button">
          Créer une clé de {bits} bits et chiffrer un secret
        </button>

        <AnimatePresence mode="wait">
          {target && (
            <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-3" exit={{ opacity: 0 }} initial={{ opacity: 0, y: 8 }} key={target.key.n.toString()}>
              <div className="rounded-xl border border-line bg-white p-3.5 font-mono text-[12px] leading-relaxed text-ink-2">
                <p>
                  <span className="font-sans font-semibold text-ink">Ce que l'attaquant voit :</span>
                </p>
                <p className="break-all">n = {target.key.n.toString()}</p>
                <p>e = {target.key.e.toString()}</p>
                <p className="break-all">message chiffré c = {target.cipher.toString()}</p>
              </div>
              <motion.button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(194_69_69/0.8)] disabled:opacity-70"
                disabled={running}
                onClick={run}
                type="button"
                whileTap={{ scale: 0.98 }}
              >
                <Swords className="size-4" />
                {running ? "Factorisation de n en cours..." : "Attaquer : factoriser n"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {attack && target && (
            <motion.div animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[#f0c9c9] bg-danger-soft p-4" initial={{ opacity: 0, y: 10 }}>
              <p className="flex items-center gap-2 text-sm font-bold text-danger-deep">
                <Skull className="size-4" /> Clé cassée en {formatDuration(attack.ms)}
              </p>
              <ul className="mt-2 space-y-1 font-mono text-[12px] text-ink-2">
                <motion.li animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ delay: 0.1 }}>
                  méthode rho de Pollard : <NumberFlow value={attack.iterations} /> itérations
                </motion.li>
                <motion.li animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ delay: 0.35 }}>
                  p = {attack.p.toString()}, q = {attack.q.toString()}
                </motion.li>
                <motion.li animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ delay: 0.6 }}>
                  d = e⁻¹ mod (p − 1)(q − 1) = {attack.d.toString()}
                </motion.li>
              </ul>
              <motion.p
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-ink"
                initial={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: 0.9 }}
              >
                Message retrouvé sans la clé privée : <span className="font-mono font-bold text-danger">« {attack.recovered} »</span>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm font-bold text-ink">Temps mesurés sur votre machine</p>
          <p className="mb-2 text-xs text-ink-3">Lancez l'attaque pour plusieurs tailles pour remplir le graphique.</p>
          {chart.length > 0 ? (
            <SimpleBars color="#c24545" data={chart} format={(v) => formatDuration(v)} signature={chart.map((c) => c.name).join()} />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-line-strong border-dashed text-xs text-ink-3">Aucune mesure pour l'instant</div>
          )}
        </div>
        <Notice tone="info" title="Et pour une vraie clé ?">
          Chaque bit ajouté à n double à peu près le travail de cette méthode. Une clé de 2048 bits a un module {formatInteger(2048 / 64)} fois plus long que 64 bits :
          même les meilleurs algorithmes connus ne la factorisent pas avec les moyens actuels.
        </Notice>
      </div>
    </div>
  );
}
