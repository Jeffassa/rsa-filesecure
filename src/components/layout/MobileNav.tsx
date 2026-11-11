import { motion } from "motion/react";
import type { Route } from "@/lib/router";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";

export function MobileNav({ route, go }: { route: Route; go: (r: Route) => void }) {
  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-white/10 border-t bg-nav px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="flex justify-around">
        {NAV.filter((n) => n.mobile).map((item) => {
          const active = item.route === route;
          const Icon = item.icon;
          return (
            <li key={item.route}>
              <button
                aria-current={active ? "page" : undefined}
                className={cn("relative flex w-16 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium", active ? "text-white" : "text-nav-text")}
                onClick={() => go(item.route)}
                type="button"
              >
                {active && <motion.span className="nav-active absolute inset-0 rounded-xl" layoutId="mobile-pill" />}
                <Icon className="relative size-5" />
                <span className="relative truncate">{item.label.replace(" RSA", "")}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
