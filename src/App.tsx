import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useLayoutEffect } from "react";
import { Toaster } from "sonner";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { type Route, useRoute } from "@/lib/router";
import { AboutPage } from "@/pages/About";
import { DecryptPage } from "@/pages/Decrypt";
import { EncryptPage } from "@/pages/Encrypt";
import { HomePage } from "@/pages/Home";
import { KeysPage } from "@/pages/Keys";
import { LearnPage } from "@/pages/Learn";
import { TestsPage } from "@/pages/Tests";
import { AppStateProvider } from "@/state/app-state";

function Page({ route }: { route: Route }) {
  // La nouvelle page s'affiche après la sortie de l'ancienne : on remonte en haut à ce moment-là.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  switch (route) {
    case "chiffrer":
      return <EncryptPage />;
    case "dechiffrer":
      return <DecryptPage />;
    case "cles":
      return <KeysPage />;
    case "comprendre":
      return <LearnPage />;
    case "tests":
      return <TestsPage />;
    case "apropos":
      return <AboutPage />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  const [route, go] = useRoute();

  return (
    <AppStateProvider>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-dvh">
          <Sidebar go={go} route={route} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar go={go} route={route} />
            <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 pt-7 pb-28 sm:px-8 lg:pb-10">
              <AnimatePresence mode="wait">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                  initial={{ opacity: 0, y: 14 }}
                  key={route}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Page route={route} />
                </motion.div>
              </AnimatePresence>
            </main>
            <footer className="pb-24 text-center text-[13px] text-[#6f7180] lg:pb-6">© 2026, RSA FileSecure, projet de cryptographie</footer>
          </div>
          <MobileNav go={go} route={route} />
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!rounded-xl !border !border-line !bg-white !text-ink !shadow-lg !font-sans",
              description: "!text-ink-2",
            },
          }}
        />
      </MotionConfig>
    </AppStateProvider>
  );
}
