import { motion } from "motion/react";

/** Cadenas dont l'anse se lève ou se referme avec un ressort. */
export function AnimatedLock({
  locked,
  size = 24,
  strokeWidth = 2,
  className,
}: {
  locked: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      <motion.path
        animate={locked ? { y: 0, rotate: 0 } : { y: -3, rotate: 0 }}
        d={locked ? "M7 11V7a5 5 0 0 1 10 0v4" : "M7 11V7a5 5 0 0 1 9.9-1"}
        initial={false}
        style={{ originX: "7px", originY: "11px" }}
        transition={{ type: "spring", stiffness: 420, damping: 18 }}
      />
      <rect height="11" rx="2" width="18" x="3" y="11" />
      <motion.circle
        animate={{ scale: locked ? 1 : 0.6 }}
        cx="12"
        cy="16.5"
        initial={false}
        r="1.3"
      />
    </svg>
  );
}
