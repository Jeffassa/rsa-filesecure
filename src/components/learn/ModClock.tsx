import { Pause, Play, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

interface Step {
  label: string;
  value: bigint;
}

/** Étapes de l'exponentiation rapide (carré et multiplication) de m^e mod n. */
function squareAndMultiply(m: bigint, e: bigint, n: bigint): Step[] {
  const steps: Step[] = [{ label: "départ : m", value: m % n }];
  const bits = e.toString(2);
  let acc = m % n;
  for (let i = 1; i < bits.length; i++) {
    acc = (acc * acc) % n;
    steps.push({ label: "au carré", value: acc });
    if (bits[i] === "1") {
      acc = (acc * m) % n;
      steps.push({ label: "fois m", value: acc });
    }
  }
  return steps;
}

/**
 * Horloge modulo n : le calcul de m^e mod n « tourne » sur un cadran de n
 * positions. Chaque saut est une étape réelle de l'exponentiation rapide.
 */
export function ModClock({ m, e, n, label }: { m: bigint; e: bigint; n: bigint; label: string }) {
  const reduced = useReducedMotion();
  const steps = useMemo(() => squareAndMultiply(m, e, n), [m, e, n]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    setI(reduced ? steps.length - 1 : 0);
    setPlaying(!reduced);
  }, [steps, reduced]);

  useEffect(() => {
    if (!playing || i >= steps.length - 1) return;
    const id = setTimeout(() => setI((x) => x + 1), 700);
    return () => clearTimeout(id);
  }, [i, playing, steps.length]);

  const R = 92;
  const angle = (v: bigint) => (Number(v) / Number(n)) * Math.PI * 2 - Math.PI / 2;
  const pos = (v: bigint, r = R) => ({ x: 120 + r * Math.cos(angle(v)), y: 120 + r * Math.sin(angle(v)) });
  const current = steps[i];
  const p = pos(current.value);
  const trail = steps.slice(0, i + 1).map((s) => pos(s.value, R - 14));

  return (
    <div className="grid items-center gap-5 sm:grid-cols-[240px_1fr]">
      <svg aria-label={`Cadran modulo ${n}`} className="mx-auto w-full max-w-[240px]" role="img" viewBox="0 0 240 240">
        <circle cx="120" cy="120" fill="#f7f8fc" r={R + 16} stroke="#e1e3f0" />
        {Array.from({ length: 48 }, (_, k) => {
          const a = (k / 48) * Math.PI * 2 - Math.PI / 2;
          const long = k % 12 === 0;
          return (
            <line
              key={k}
              stroke={long ? "#8a8fa3" : "#d3d7e6"}
              strokeWidth={long ? 2 : 1}
              x1={120 + (R + 4) * Math.cos(a)}
              x2={120 + (R + (long ? 14 : 9)) * Math.cos(a)}
              y1={120 + (R + 4) * Math.sin(a)}
              y2={120 + (R + (long ? 14 : 9)) * Math.sin(a)}
            />
          );
        })}
        <text className="fill-ink-3 text-[9px]" textAnchor="middle" x="120" y="22">
          0
        </text>
        <polyline fill="none" points={trail.map((t) => `${t.x},${t.y}`).join(" ")} stroke="#c3b6f5" strokeLinejoin="round" strokeWidth="1.5" />
        <motion.line animate={{ x2: p.x, y2: p.y }} stroke="#6f59dc" strokeLinecap="round" strokeWidth="3" transition={{ type: "spring", stiffness: 120, damping: 14 }} x1="120" y1="120" />
        <motion.circle animate={{ cx: p.x, cy: p.y }} fill="#6f59dc" r="7" transition={{ type: "spring", stiffness: 120, damping: 14 }} />
        <circle cx="120" cy="120" fill="#1f2b40" r="5" />
        <text className="fill-ink font-mono text-[15px] font-semibold" textAnchor="middle" x="120" y="152">
          {current.value.toString()}
        </text>
        <text className="fill-ink-3 text-[9px]" textAnchor="middle" x="120" y="166">
          mod {n.toString()}
        </text>
      </svg>
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-1 text-xs text-ink-2">
          On ne calcule jamais {m.toString()}<sup>{e.toString()}</sup> en entier : on élève au carré et on multiplie, en revenant sur le cadran à chaque fois.
        </p>
        <ol className="mt-3 flex flex-wrap gap-1.5">
          {steps.map((s, k) => (
            <motion.li
              animate={{ opacity: k <= i ? 1 : 0.35, scale: k === i ? 1.06 : 1 }}
              className={`rounded-lg px-2 py-1 font-mono text-[11px] ${k === i ? "bg-violet text-white" : "bg-zone text-ink-2"}`}
              key={k}
              title={s.label}
            >
              {s.value.toString()}
            </motion.li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-ink-3">
          Étape {i + 1} sur {steps.length} : {current.label}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            className="flex items-center gap-1.5 rounded-lg bg-chip px-3 py-1.5 text-xs font-semibold text-chip-text hover:bg-blue-btn"
            onClick={() => (i >= steps.length - 1 ? (setI(0), setPlaying(true)) : setPlaying((x) => !x))}
            type="button"
          >
            {i >= steps.length - 1 ? <RotateCcw className="size-3.5" /> : playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {i >= steps.length - 1 ? "Rejouer" : playing ? "Pause" : "Lecture"}
          </button>
        </div>
      </div>
    </div>
  );
}
