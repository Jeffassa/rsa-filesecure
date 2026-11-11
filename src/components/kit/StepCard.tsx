import { Check } from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

/** Carte d'étape numérotée, comme sur la maquette ; la pastille devient une coche une fois l'étape faite. */
export function StepCard({
  n,
  title,
  done = false,
  shake = 0,
  aside,
  children,
  className,
}: {
  n: number;
  title: string;
  done?: boolean;
  /** Incrémenter cette valeur fait trembler la carte (champ manquant). */
  shake?: number;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [scope, animate] = useAnimate();
  useEffect(() => {
    if (shake && scope.current) animate(scope.current, { x: [0, -8, 7, -4, 0] }, { duration: 0.4 });
  }, [shake, animate, scope]);

  return (
    <section className={cn("card p-5 sm:p-6", className)} ref={scope}>
      <header className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white transition-colors duration-300",
            done ? "bg-green" : "bg-step",
          )}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {done ? (
              <motion.span animate={{ scale: 1, rotate: 0 }} initial={{ scale: 0, rotate: -60 }} key="ok" transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                <Check className="size-4" strokeWidth={3} />
              </motion.span>
            ) : (
              <motion.span animate={{ scale: 1 }} initial={{ scale: 0 }} key="n">
                {n}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <h2 className="flex-1 text-[17px] font-semibold text-ink">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
