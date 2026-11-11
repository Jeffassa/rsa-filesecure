import { motion } from "motion/react";

/** 32 briques : la forme de la clé de session de 32 octets, sans jamais montrer sa valeur. */
export function SessionKeyChips({ color = "#6f59dc", fading = false }: { color?: string; fading?: boolean }) {
  return (
    <motion.div
      animate={fading ? { opacity: 0.25, scale: 0.92 } : { opacity: 1, scale: 1 }}
      className="flex flex-wrap items-center gap-[3px]"
      style={{ originX: 0 }}
      transition={{ duration: 0.4 }}
    >
      {Array.from({ length: 32 }, (_, i) => (
        <motion.span
          animate={{ opacity: 0.55 + ((i * 37) % 45) / 100, y: 0 }}
          className="h-3.5 w-[7px] rounded-[2px]"
          initial={{ opacity: 0, y: -6 }}
          key={i}
          style={{ background: color }}
          transition={{ delay: i * 0.022, duration: 0.25 }}
        />
      ))}
      <span className="ml-2 text-[11px] text-ink-3">32 octets, masqués</span>
    </motion.div>
  );
}
