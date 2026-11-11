import { CheckCircle2, Eye, FileText, KeyRound, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedLock } from "@/components/kit/AnimatedLock";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Koffi crée sa paire de clés", text: "Une clé publique à partager, une clé privée qu'il garde pour lui." },
  { title: "Koffi envoie sa clé publique", text: "Elle peut voyager sans protection : elle sert seulement à chiffrer." },
  { title: "Awa chiffre le fichier", text: "AES-256-GCM chiffre le contenu, RSA-OAEP scelle la clé AES." },
  { title: "Awa envoie le fichier .rsaenc", text: "Par e-mail ou clé USB : intercepté, il reste illisible." },
  { title: "Koffi déchiffre", text: "Sa clé privée ouvre la clé AES, qui restaure le fichier original." },
];

const STEP_MS = 3000;

const INTERCEPT = [
  "Le canal est surveillé par un tiers.",
  "Le tiers voit la clé publique : sans danger.",
  "Le tiers ne voit rien : tout se passe chez Awa.",
  "Le tiers voit le fichier chiffré : illisible.",
  "Le tiers n'a pas la clé privée : il ne peut rien ouvrir.",
];

export function ExchangeDiagram() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(!reduced);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(id);
  }, [step, playing]);

  const fileLocked = step >= 2;
  const fileAtKoffi = step >= 4;

  return (
    <div className="card overflow-hidden">
      <div className="relative h-[250px] bg-[radial-gradient(circle_at_50%_0%,#eef0fb,transparent_70%)] px-4 sm:px-8">
        {/* Canal */}
        <svg aria-hidden className="absolute top-[86px] right-[27%] left-[27%] h-4 w-[46%]" preserveAspectRatio="none" viewBox="0 0 100 4">
          <line className="animate-dash" stroke="#b9bfd6" strokeDasharray="3 3" strokeWidth="1.2" vectorEffect="non-scaling-stroke" x1="0" x2="100" y1="2" y2="2" />
        </svg>
        <p className="absolute top-[60px] right-[27%] left-[27%] text-center text-[11px] font-medium text-ink-3">Canal non sûr : e-mail, clé USB</p>

        {/* Intercepteur */}
        <div className="absolute top-[124px] right-[27%] left-[27%] flex flex-col items-center text-center">
          <span className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink-2 shadow-sm">
            <Eye className="size-4" />
          </span>
          <AnimatePresence mode="wait">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 max-w-[220px] text-[12px] leading-snug text-ink-2"
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: 4 }}
              key={step}
            >
              {INTERCEPT[step]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Awa */}
        <Person initial="A" label="Awa" role="expéditrice" side="left" tone="violet">
          <AnimatePresence mode="popLayout">
            {!fileAtKoffi && step !== 3 && (
              <motion.span
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-xl transition-colors duration-500",
                  fileLocked ? "bg-violet text-white" : "bg-zone text-ink",
                )}
                exit={{ scale: 0.6, opacity: 0 }}
                initial={{ scale: 0.6, opacity: 0 }}
                key="file"
              >
                <FileText className="size-6" />
                <AnimatePresence>
                  {fileLocked && (
                    <motion.span
                      animate={{ scale: 1 }}
                      className="absolute -right-2 -bottom-2 flex size-6 items-center justify-center rounded-full bg-white text-violet shadow"
                      initial={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    >
                      <AnimatedLock locked={step >= 2} size={14} strokeWidth={2.5} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {step >= 2 && step < 4 && (
              <motion.span animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 rounded-full bg-blue-soft px-2 py-1 text-[10px] font-semibold text-blue-text" exit={{ opacity: 0 }} initial={{ opacity: 0, scale: 0.7 }}>
                <KeyRound className="size-3" /> publique de Koffi
              </motion.span>
            )}
          </AnimatePresence>
        </Person>

        {/* Koffi */}
        <Person initial="K" label="Koffi" role="destinataire" side="right" tone="green">
          <div className="flex gap-1.5">
            {[
              { k: "pub", label: "publique", cls: "bg-blue-soft text-blue-text", hide: step >= 1 && step < 2 },
              { k: "priv", label: "privée", cls: "bg-violet-soft text-violet-deep", hide: false },
            ].map((key, i) => (
              <motion.span
                animate={{ opacity: key.hide ? 0.25 : 1, scale: 1, y: 0 }}
                className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold", key.cls)}
                initial={{ opacity: 0, scale: 0.5, y: 6 }}
                key={key.k}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 400, damping: 20 }}
              >
                <KeyRound className="size-3" />
                {key.label}
              </motion.span>
            ))}
          </div>
          <AnimatePresence>
            {fileAtKoffi && (
              <motion.span
                animate={{ scale: 1, opacity: 1 }}
                className="relative flex size-12 items-center justify-center rounded-xl bg-green-soft text-green"
                exit={{ opacity: 0 }}
                initial={{ scale: 0.6, opacity: 0 }}
              >
                <FileText className="size-6" />
                <motion.span
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -bottom-2 rounded-full bg-white text-green shadow"
                  initial={{ scale: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 16 }}
                >
                  <CheckCircle2 className="size-6" />
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </Person>

        {/* Jetons qui traversent le canal */}
        <AnimatePresence>
          {step === 1 && (
            <motion.span
              animate={{ left: "27%", opacity: 1 }}
              className="absolute top-[76px] flex -translate-x-1/2 items-center gap-1 rounded-full bg-blue px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg"
              exit={{ opacity: 0 }}
              initial={{ left: "73%", opacity: 0 }}
              key="pub"
              transition={{ duration: reduced ? 0 : 2, ease: [0.45, 0, 0.2, 1] }}
            >
              <KeyRound className="size-3.5" /> clé publique
            </motion.span>
          )}
          {step === 3 && (
            <motion.span
              animate={{ left: "73%", opacity: 1 }}
              className="absolute top-[74px] flex -translate-x-1/2 items-center gap-1.5 rounded-xl bg-violet px-2.5 py-1.5 font-mono text-[11px] font-medium text-white shadow-lg"
              exit={{ opacity: 0 }}
              initial={{ left: "27%", opacity: 0 }}
              key="file"
              transition={{ duration: reduced ? 0 : 2, ease: [0.45, 0, 0.2, 1] }}
            >
              <AnimatedLock locked size={13} strokeWidth={2.5} /> rapport.pdf.rsaenc
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 border-line border-t px-4 py-3 sm:px-6">
        <button
          aria-label={playing ? "Mettre en pause" : "Lire l'animation"}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chip text-chip-text transition-colors hover:bg-blue-btn"
          onClick={() => setPlaying((p) => !p)}
          type="button"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <ol className="grid flex-1 grid-cols-5 gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                className="group w-full text-left"
                onClick={() => {
                  setStep(i);
                  setPlaying(false);
                }}
                title={s.title}
                type="button"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-line">
                  {i < step && <span className="block h-full w-full bg-step" />}
                  {i === step && (
                    <motion.span
                      animate={{ width: playing ? "100%" : "100%" }}
                      className="block h-full bg-step"
                      initial={{ width: playing ? "0%" : "100%" }}
                      key={`${step}-${playing}`}
                      transition={{ duration: playing ? STEP_MS / 1000 : 0, ease: "linear" }}
                    />
                  )}
                </span>
                <span className={cn("mt-1.5 hidden text-[11px] leading-tight sm:block", i === step ? "font-semibold text-ink" : "text-ink-3 group-hover:text-ink-2")}>
                  {i + 1}. {s.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          animate={{ opacity: 1 }}
          className="px-4 pb-4 text-[13px] text-ink-2 sm:px-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key={step}
        >
          <span className="font-semibold text-ink sm:hidden">{STEPS[step].title}. </span>
          {STEPS[step].text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function Person({
  initial,
  label,
  role,
  side,
  tone,
  children,
}: {
  initial: string;
  label: string;
  role: string;
  side: "left" | "right";
  tone: "violet" | "green";
  children: React.ReactNode;
}) {
  return (
    <div className={cn("absolute top-6 flex w-[26%] flex-col items-center gap-3 text-center", side === "left" ? "left-0" : "right-0")}>
      <div className="flex flex-col items-center">
        <span className={cn("flex size-12 items-center justify-center rounded-full text-lg font-bold text-white", tone === "violet" ? "bg-violet-icon" : "bg-green-2")}>
          {initial}
        </span>
        <p className="mt-1.5 text-sm font-semibold text-ink">{label}</p>
        <p className="text-[11px] text-ink-3">{role}</p>
      </div>
      <div className="flex min-h-[52px] flex-col items-center gap-1.5">{children}</div>
    </div>
  );
}
