import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { navigate } from "@/lib/router";

/** En-tête « < Titre » de la maquette, avec retour à l'accueil. */
export function BackHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.header
      animate={{ opacity: 1, x: 0 }}
      className="mb-6 flex items-start gap-3"
      initial={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      <motion.button
        aria-label="Retour à l'accueil"
        className="mt-1 rounded-xl p-1.5 text-ink transition-colors hover:bg-chip"
        onClick={() => navigate("accueil")}
        type="button"
        whileHover={{ x: -3 }}
      >
        <ChevronLeft className="size-7" strokeWidth={2.4} />
      </motion.button>
      <div>
        <h1 className="text-[30px] font-bold leading-tight tracking-tight text-ink sm:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-ink-2">{subtitle}</p>}
      </div>
    </motion.header>
  );
}
