import { ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedLock } from "@/components/kit/AnimatedLock";
import type { Route } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useApp } from "@/state/app-state";
import { NAV } from "./nav";

export function Sidebar({ route, go }: { route: Route; go: (r: Route) => void }) {
  const { identity } = useApp();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col bg-nav text-white lg:flex">
      <button
        className="group flex items-center gap-3 px-7 pt-8 pb-10 text-left"
        onClick={() => go("accueil")}
        type="button"
      >
        <motion.span
          animate={{ y: [0, -2, 0] }}
          className="text-nav-logo"
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <AnimatedLock locked size={34} strokeWidth={2.2} />
        </motion.span>
        <span className="text-[19px] font-semibold leading-tight tracking-tight">RSA FileSecure</span>
      </button>

      <nav aria-label="Navigation principale" className="flex flex-col gap-1.5 px-4">
        {NAV.map((item, i) => {
          const active = item.route === route;
          const Icon = item.icon;
          return (
            <motion.button
              animate={{ opacity: 1, x: 0 }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-4 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors",
                active ? "text-white" : "text-nav-text hover:bg-nav-hover hover:text-white",
              )}
              initial={{ opacity: 0, x: -14 }}
              key={item.route}
              onClick={() => go(item.route)}
              transition={{ delay: 0.05 + i * 0.05, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              type="button"
            >
              {active && (
                <motion.span
                  className="nav-active absolute inset-0 rounded-xl shadow-[0_8px_20px_-10px_rgb(74_80_196/0.9)]"
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative size-[22px] transition-transform duration-200 group-hover:scale-110" strokeWidth={1.9} />
              <span className="relative">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 px-5 pb-6">
        <motion.div
          animate={{ opacity: 1 }}
          className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5"
          initial={{ opacity: 0 }}
          layout
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-nav-muted">Votre clé</p>
          {identity ? (
            <>
              <p className="mt-1 truncate text-sm font-semibold">{identity.name}</p>
              <p className="mono-tight mt-0.5 text-[11px] text-nav-logo">{identity.fingerprint.slice(0, 19)}</p>
            </>
          ) : (
            <button className="mt-1 text-left text-sm text-nav-text hover:text-white" onClick={() => go("cles")} type="button">
              Aucune clé chargée
            </button>
          )}
        </motion.div>
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-nav-muted">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          Tout se passe dans votre navigateur. Aucun fichier n'est envoyé.
        </p>
      </div>
    </aside>
  );
}
