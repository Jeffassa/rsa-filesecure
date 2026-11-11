import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Empreinte de clé écrite caractère par caractère.
 * Avec `compareWith`, chaque caractère passe au vert s'il correspond, au rouge sinon.
 */
export function Fingerprint({
  value,
  compareWith,
  className,
  speed = 22,
}: {
  value: string;
  compareWith?: string;
  className?: string;
  speed?: number;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value.length : 0);

  useEffect(() => {
    if (reduced) {
      setShown(value.length);
      return;
    }
    setShown(0);
    let n = 0;
    const id = setInterval(() => {
      n++;
      setShown(n);
      if (n >= value.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [value, speed, reduced]);

  const typed = shown >= value.length;
  return (
    <span aria-label={value} className={cn("mono-tight inline-block max-w-full whitespace-pre-wrap", className)} role="text">
      {value.split("").map((ch, i) => {
        const visible = i < shown;
        const match = compareWith === undefined ? undefined : compareWith[i] === ch;
        return (
          <span
            aria-hidden
            className={cn(
              "transition-colors duration-500",
              !visible && "opacity-0",
              typed && match === true && ch !== " " && "text-green",
              typed && match === false && ch !== " " && "text-danger",
            )}
            key={i}
            style={{ transitionDelay: typed && match !== undefined ? `${i * 12}ms` : "0ms" }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}
