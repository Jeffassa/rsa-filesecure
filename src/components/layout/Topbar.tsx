import { Sparkles, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedLock } from "@/components/kit/AnimatedLock";
import { initials } from "@/lib/format";
import type { Route } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useApp } from "@/state/app-state";
import { NAV } from "./nav";

export function Topbar({ route, go }: { route: Route; go: (r: Route) => void }) {
  const { identity, demoMode, setDemoMode } = useApp();
  const title = NAV.find((n) => n.route === route)?.title ?? "";

  return (
    <header className="sticky top-0 z-30 border-line border-b bg-page-top/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-4 px-5 sm:px-8">
        <button className="flex items-center gap-2 text-violet lg:hidden" onClick={() => go("accueil")} type="button">
          <AnimatedLock locked size={26} />
          <span className="text-[15px] font-bold text-ink">RSA FileSecure</span>
        </button>

        <div className="relative hidden h-8 flex-1 overflow-hidden lg:block">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.h2
              animate={{ y: 0, opacity: 1 }}
              className="absolute text-[24px] font-bold tracking-tight text-ink"
              exit={{ y: -26, opacity: 0 }}
              initial={{ y: 26, opacity: 0 }}
              key={title}
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
            >
              {title}
            </motion.h2>
          </AnimatePresence>
        </div>
        <div className="flex-1 lg:hidden" />

        <button
          aria-pressed={demoMode}
          className="group flex items-center gap-2.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-line-strong"
          onClick={() => setDemoMode(!demoMode)}
          title="En mode démonstration, chaque étape reste visible assez longtemps pour être expliquée."
          type="button"
        >
          <Sparkles className={cn("size-3.5 transition-colors", demoMode ? "text-violet" : "text-ink-3")} />
          <span className="hidden sm:inline">Animations détaillées</span>
          <span className={cn("relative h-5 w-9 rounded-full transition-colors duration-300", demoMode ? "bg-violet" : "bg-line-strong")}>
            <motion.span
              animate={{ x: demoMode ? 16 : 0 }}
              className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow"
              initial={false}
              transition={{ type: "spring", stiffness: 600, damping: 32 }}
            />
          </span>
        </button>

        <motion.button
          aria-label={identity ? `Votre clé : ${identity.name}` : "Gérer vos clés"}
          className={cn(
            "flex size-11 items-center justify-center rounded-full border text-sm font-bold transition-colors",
            identity ? "border-transparent bg-violet text-white" : "border-[#c9cedf] bg-[#eceef5] text-[#2b3550] hover:bg-chip",
          )}
          onClick={() => go("cles")}
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          {identity ? initials(identity.name) : <User className="size-5" />}
        </motion.button>
      </div>
    </header>
  );
}
