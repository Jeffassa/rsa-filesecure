import { Component, lazy, type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { FieldState } from "./ByteField3D";

const ByteField3D = lazy(() => import("./ByteField3D"));

export interface ByteFieldProps {
  plain: Uint8Array | null;
  cipher: Uint8Array | null;
  target: FieldState;
  progress: number;
  tone?: "violet" | "green";
  className?: string;
  caption?: ReactNode;
}

class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Version plate, utilisée pendant le chargement de Three.js ou sans WebGL. */
function FlatField({ plain, cipher, target }: Pick<ByteFieldProps, "plain" | "cipher" | "target">) {
  const source = target === "cipher" ? cipher : target === "plain" ? plain : null;
  return (
    <div aria-hidden className="grid h-full grid-cols-[repeat(32,minmax(0,1fr))] content-center gap-[3px] px-2">
      {Array.from({ length: 384 }, (_, i) => {
        const b = source?.[i];
        const bg =
          b === undefined
            ? "#e6e8f3"
            : target === "cipher"
              ? ["#6f59dc", "#997def", "#4a3ba8", "#c3b6f5"][b & 3]
              : b === 0x20 || b === 0x0a
                ? "#e6e8f3"
                : b < 0x80
                  ? "#1f2b40"
                  : "#a3a9bd";
        return <span className="aspect-square rounded-[2px]" key={i} style={{ background: bg }} />;
      })}
    </div>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function ByteField({ plain, cipher, target, progress, tone = "violet", className, caption }: ByteFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [webgl] = useState(supportsWebGL);
  const reducedMotion = useReducedMotion() ?? false;

  // La scène ne calcule d'images que lorsqu'elle est à l'écran.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const flat = <FlatField cipher={cipher} plain={plain} target={target} />;

  return (
    <figure className={cn("relative overflow-hidden rounded-xl border border-line bg-[#f7f8fc]", className)}>
      <div className="h-[190px] w-full sm:h-[220px]" ref={ref}>
        {webgl ? (
          <WebGLBoundary fallback={flat}>
            <Suspense fallback={flat}>
              <ByteField3D
                active={visible}
                cipher={cipher}
                plain={plain}
                progress={progress}
                reducedMotion={reducedMotion}
                target={target}
                tone={tone}
              />
            </Suspense>
          </WebGLBoundary>
        ) : (
          flat
        )}
      </div>
      {caption && (
        <figcaption className="flex items-center justify-between gap-3 border-line border-t bg-white/70 px-3 py-2 text-[11px] text-ink-3">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
