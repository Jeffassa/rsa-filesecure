import { KeyRound, LockKeyhole } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface KeyNumbers {
  n: string;
  e: string;
  d: string;
  p: string;
  q: string;
}

const HEX = "0123456789abcdef";
const randomHex = (len: number) => Array.from({ length: len }, () => HEX[Math.floor(Math.random() * 16)]).join("");

/** Valeur secrète : on n'en montre que les 8 premiers chiffres. */
const masked = (hex: string) => `${hex.slice(0, 8)} ${"•".repeat(10)}`;
const pub = (hex: string) => `${hex.slice(0, 12)}...${hex.slice(-8)}`;

function Scramble({ active, final, length = 30 }: { active: boolean; final: string | null; length?: number }) {
  const reduced = useReducedMotion();
  const [text, setText] = useState(() => randomHex(length));
  useEffect(() => {
    if (!active || reduced) return;
    const id = setInterval(() => setText(randomHex(length)), 70);
    return () => clearInterval(id);
  }, [active, length, reduced]);
  return <span className="mono-tight">{final ?? text}</span>;
}

/**
 * Génération d'une paire de clés, montrée en deux temps :
 *   1. pendant le calcul réel, le navigateur cherche p et q (chiffres qui défilent) ;
 *   2. une fois la clé créée, les vraies valeurs se figent, puis n, e et d apparaissent
 *      et la paire se sépare en clé publique et clé privée.
 */
export function KeyGenAnimation({ bits, numbers }: { bits: number; numbers: KeyNumbers | null }) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!numbers) {
      setStage(0);
      return;
    }
    if (reduced) {
      setStage(5);
      return;
    }
    const timers = [1, 2, 3, 4, 5].map((s, i) => setTimeout(() => setStage(s), 450 + i * 650));
    return () => timers.forEach(clearTimeout);
  }, [numbers, reduced]);

  const half = bits / 2;
  const rows = [
    { k: "p", label: "p, nombre premier", value: numbers ? masked(numbers.p) : null, note: `${half} bits, secret`, show: true, secret: true },
    { k: "q", label: "q, nombre premier", value: numbers ? masked(numbers.q) : null, note: `${half} bits, secret`, show: true, secret: true },
    { k: "n", label: "n = p × q", value: numbers ? pub(numbers.n) : null, note: `${bits} bits, public`, show: stage >= 1, secret: false },
    { k: "e", label: "e, exposant public", value: "65537", note: "valeur standard", show: stage >= 2, secret: false },
    { k: "d", label: "d = e⁻¹ mod φ(n)", value: numbers ? masked(numbers.d) : null, note: "secret", show: stage >= 3, secret: true },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-[#f7f8fc] p-4">
        <p className="mb-3 text-xs font-semibold text-ink-2">
          {numbers ? "Ce que le navigateur vient de calculer" : "Le navigateur tire de grands nombres au hasard et teste s'ils sont premiers (Miller-Rabin)"}
        </p>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {rows
              .filter((r) => r.show)
              .map((r) => (
                <motion.li
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-[130px_1fr] items-baseline gap-3 sm:grid-cols-[150px_1fr_auto]"
                  initial={{ opacity: 0, x: -10 }}
                  key={r.k}
                  layout
                >
                  <span className="text-xs font-semibold text-ink">{r.label}</span>
                  <span className={cn("truncate text-[13px]", r.secret ? "text-violet-deep" : "text-blue-text")}>
                    {r.k === "p" || r.k === "q" ? <Scramble active={!numbers} final={r.value} /> : <span className="mono-tight">{r.value}</span>}
                  </span>
                  <span className="hidden text-[11px] text-ink-3 sm:block">{r.note}</span>
                </motion.li>
              ))}
          </AnimatePresence>
        </ul>
        {!numbers && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
            <motion.div
              animate={{ x: ["-100%", "250%"] }}
              className="h-full w-1/3 rounded-full bg-violet"
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {stage >= 4 && numbers && (
          <motion.div animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3" initial={{ opacity: 0 }}>
            <motion.div
              animate={{ x: 0, opacity: 1 }}
              className="rounded-xl border border-[#d5daf6] bg-blue-soft p-3.5"
              initial={{ x: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <p className="flex items-center gap-1.5 text-sm font-bold text-blue-text">
                <KeyRound className="size-4" /> Clé publique
              </p>
              <p className="mono-tight mt-1 text-[12px] text-ink-2">(n, e)</p>
              <p className="mt-1 text-[11px] text-ink-3">À partager avec votre binôme</p>
            </motion.div>
            <motion.div
              animate={{ x: 0, opacity: 1 }}
              className="rounded-xl border border-[#dcd8f7] bg-violet-soft p-3.5"
              initial={{ x: -60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <p className="flex items-center gap-1.5 text-sm font-bold text-violet-deep">
                <LockKeyhole className="size-4" /> Clé privée
              </p>
              <p className="mono-tight mt-1 text-[12px] text-ink-2">(n, d, p, q)</p>
              <p className="mt-1 text-[11px] text-ink-3">À ne jamais partager</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
