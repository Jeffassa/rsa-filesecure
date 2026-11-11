import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({ text, label = "Copier", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      aria-label={copied ? "Copié" : label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-chip-text transition-colors hover:bg-chip",
        className,
      )}
      onClick={copy}
      title={label}
      type="button"
    >
      <span className="relative size-3.5">
        <AnimatePresence initial={false} mode="popLayout">
          {copied ? (
            <motion.span animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 text-green" exit={{ scale: 0, opacity: 0 }} initial={{ scale: 0, opacity: 0 }} key="ok">
              <Check className="size-3.5" strokeWidth={3} />
            </motion.span>
          ) : (
            <motion.span animate={{ scale: 1, opacity: 1 }} className="absolute inset-0" exit={{ scale: 0, opacity: 0 }} initial={{ scale: 0, opacity: 0 }} key="copy">
              <Copy className="size-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {copied ? "Copié" : label}
    </button>
  );
}
