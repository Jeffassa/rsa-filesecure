import { Check, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import type { StageView } from "@/lib/pacer";
import { cn } from "@/lib/utils";

export interface StageDef {
  title: string;
  detail: string;
  /** Affiche le pourcentage pendant l'étape (contenu chiffré par morceaux). */
  showPercent?: boolean;
}

const TONE = {
  violet: { fill: "bg-violet", text: "text-violet", ring: "border-violet" },
  green: { fill: "bg-green", text: "text-green", ring: "border-green" },
};

export function StageList({
  stages,
  views,
  tone,
  extras = {},
}: {
  stages: StageDef[];
  views: StageView[];
  tone: "violet" | "green";
  extras?: Record<number, ReactNode>;
}) {
  const t = TONE[tone];
  return (
    <ol className="relative space-y-1">
      {stages.map((s, i) => {
        const v = views[i] ?? { status: "waiting", progress: 0 };
        const active = v.status !== "waiting";
        return (
          <li className="relative flex gap-3 py-2" key={s.title}>
            {i < stages.length - 1 && (
              <span aria-hidden className="absolute top-9 bottom-[-6px] left-[13px] w-px bg-line">
                <motion.span
                  animate={{ scaleY: v.status === "done" ? 1 : 0 }}
                  className={cn("absolute inset-0 origin-top", t.fill)}
                  initial={false}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                />
              </span>
            )}
            <motion.span
              animate={v.status === "error" ? { x: [0, -5, 5, -3, 0] } : { x: 0 }}
              className={cn(
                "relative z-10 mt-0.5 flex size-[27px] shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors duration-300",
                v.status === "waiting" && "border-line text-ink-3",
                v.status === "running" && cn(t.ring, t.text),
                v.status === "done" && cn(t.ring, t.fill, "text-white"),
                v.status === "error" && "border-danger bg-danger text-white",
              )}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {v.status === "running" && (
                  <motion.span animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="run">
                    <Loader2 className="size-3.5 animate-spin" />
                  </motion.span>
                )}
                {v.status === "done" && (
                  <motion.span
                    animate={{ scale: 1, rotate: 0 }}
                    initial={{ scale: 0, rotate: -45 }}
                    key="done"
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </motion.span>
                )}
                {v.status === "error" && (
                  <motion.span animate={{ scale: 1 }} initial={{ scale: 0 }} key="err">
                    <X className="size-3.5" strokeWidth={3} />
                  </motion.span>
                )}
                {v.status === "waiting" && (
                  <motion.span className="text-[11px] font-semibold" key="num">
                    {i + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.span>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={cn(
                    "text-sm font-semibold transition-colors duration-300",
                    active ? "text-ink" : "text-ink-3",
                    v.status === "error" && "text-danger",
                  )}
                >
                  {s.title}
                </p>
                {s.showPercent && v.status === "running" && (
                  <span className={cn("font-mono text-xs tabular-nums", t.text)}>{Math.round(v.progress * 100)} %</span>
                )}
              </div>
              <p className="text-xs text-ink-3">{s.detail}</p>
              {s.showPercent && v.status === "running" && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                  <div className={cn("h-full rounded-full", t.fill)} style={{ width: `${v.progress * 100}%` }} />
                </div>
              )}
              <AnimatePresence initial={false}>
                {active && extras[i] && (
                  <motion.div
                    animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden"
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="pt-2">{extras[i]}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
