import { BookOpenText, FlaskConical, Home, Info, KeyRound, Lock, LockOpen } from "lucide-react";
import type { Route } from "@/lib/router";

export const NAV: { route: Route; label: string; title: string; icon: typeof Home; mobile?: boolean }[] = [
  { route: "accueil", label: "Accueil", title: "Accueil", icon: Home, mobile: true },
  { route: "chiffrer", label: "Chiffrer", title: "Chiffrer", icon: Lock, mobile: true },
  { route: "dechiffrer", label: "Déchiffrer", title: "Déchiffrer", icon: LockOpen, mobile: true },
  { route: "cles", label: "Clés RSA", title: "Clés RSA", icon: KeyRound, mobile: true },
  { route: "comprendre", label: "Comprendre RSA", title: "Comprendre RSA", icon: BookOpenText, mobile: true },
  { route: "tests", label: "Tests", title: "Tests", icon: FlaskConical },
  { route: "apropos", label: "À propos", title: "À propos", icon: Info },
];
