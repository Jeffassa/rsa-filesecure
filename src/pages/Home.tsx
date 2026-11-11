import { KeyRound, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ExchangeDiagram } from "@/components/home/ExchangeDiagram";
import { AnimatedLock } from "@/components/kit/AnimatedLock";
import { navigate } from "@/lib/router";
import { useApp } from "@/state/app-state";

const TITLE = "RSA FileSecure";

export function HomePage() {
  const { identity, contacts } = useApp();

  return (
    <div className="mx-auto max-w-[920px]">
      <section className="pt-4 pb-10 text-center">
        <h1 aria-label={TITLE} className="text-[40px] font-bold tracking-tight text-ink sm:text-[52px]">
          {TITLE.split("").map((ch, i) => (
            <motion.span
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              aria-hidden
              className="inline-block"
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
              key={i}
              transition={{ delay: 0.15 + i * 0.035, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </h1>
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-[17px] text-ink-2 sm:text-lg"
          initial={{ opacity: 0, y: 8 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Chiffrement et déchiffrement de fichiers avec RSA
        </motion.p>
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs text-ink-2"
          initial={{ opacity: 0, scale: 0.9 }}
          transition={{ delay: 0.95 }}
        >
          <ShieldCheck className="size-3.5 text-green" />
          RSA-OAEP 3072 bits et AES-256-GCM, entièrement dans votre navigateur
        </motion.div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <ActionCard
          button="Chiffrer"
          delay={0.25}
          description="Protéger un fichier avec la clé publique de votre binôme"
          lockedAtRest
          onClick={() => navigate("chiffrer")}
          title="Chiffrer un fichier"
          tone="violet"
        />
        <ActionCard
          button="Déchiffrer"
          delay={0.35}
          description="Récupérer le fichier original avec votre clé privée"
          lockedAtRest={false}
          onClick={() => navigate("dechiffrer")}
          title="Déchiffrer un fichier"
          tone="green"
        />
      </div>

      <motion.button
        animate={{ opacity: 1, y: 0 }}
        className="group mt-5 flex w-full items-center gap-5 rounded-2xl border border-[#dfe2f8] bg-blue-soft px-6 py-5 text-left transition-shadow hover:shadow-[0_12px_30px_-16px_rgb(74_107_226/0.5)]"
        initial={{ opacity: 0, y: 16 }}
        onClick={() => navigate("cles")}
        transition={{ delay: 0.45, duration: 0.45 }}
        type="button"
      >
        <span className="flex size-14 items-center justify-center text-blue transition-transform duration-500 group-hover:-rotate-[25deg]">
          <KeyRound className="size-10" strokeWidth={2.2} />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-bold text-ink">Clés RSA</span>
          <span className="block text-sm text-ink-2">
            {identity
              ? `Clé active : ${identity.name}, ${contacts.length} clé${contacts.length > 1 ? "s" : ""} de binôme enregistrée${contacts.length > 1 ? "s" : ""}`
              : "Générer ou consulter vos clés"}
          </span>
        </span>
        <span className="rounded-xl bg-blue-btn px-5 py-2.5 text-sm font-semibold text-blue-text transition-transform group-hover:scale-105">Gérer</span>
      </motion.button>

      <section className="mt-12">
        <motion.h2
          animate={{ opacity: 1 }}
          className="mb-4 text-xl font-bold text-ink"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.6 }}
        >
          Comment ça marche
        </motion.h2>
        <ExchangeDiagram />
      </section>
    </div>
  );
}

function ActionCard({
  title,
  description,
  button,
  tone,
  lockedAtRest,
  onClick,
  delay,
}: {
  title: string;
  description: string;
  button: string;
  tone: "violet" | "green";
  lockedAtRest: boolean;
  onClick: () => void;
  delay: number;
}) {
  // Au survol, le cadenas rejoue l'action : il part de l'état opposé puis revient à son état de repos.
  const [replaying, setReplaying] = useState(false);
  const [hover, setHover] = useState(false);
  function onHoverStart() {
    setHover(true);
    setReplaying(true);
    setTimeout(() => setReplaying(false), 380);
  }
  const violet = tone === "violet";
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={
        violet
          ? "rounded-2xl border border-[#dcd8f7] bg-violet-soft p-7 text-center"
          : "rounded-2xl border border-[#cfe9e3] bg-green-soft p-7 text-center"
      }
      initial={{ opacity: 0, y: 20 }}
      onHoverEnd={() => setHover(false)}
      onHoverStart={onHoverStart}
      transition={{ delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4 }}
    >
      <motion.span
        animate={{ scale: hover ? 1.06 : 1 }}
        className={`mx-auto flex size-[88px] items-center justify-center rounded-full text-white ${violet ? "bg-violet-icon" : "bg-green-2"}`}
      >
        <AnimatedLock locked={replaying ? !lockedAtRest : lockedAtRest} size={40} strokeWidth={2.4} />
      </motion.span>
      <h3 className={`mt-5 text-xl font-bold ${violet ? "text-[#1e2a6b]" : "text-green-deep"}`}>{title}</h3>
      <p className={`mx-auto mt-2 max-w-[240px] text-[15px] ${violet ? "text-[#4a4f7a]" : "text-[#2f6a58]"}`}>{description}</p>
      <motion.button
        className={`mt-6 inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl px-7 py-3 text-base font-semibold ${violet ? "btn-violet" : "btn-green"}`}
        onClick={onClick}
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        {button}
      </motion.button>
    </motion.div>
  );
}
