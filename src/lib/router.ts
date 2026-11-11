import { useCallback, useEffect, useState } from "react";

// Routage par le fragment d'URL (#/chiffrer) : fonctionne sur un hébergement
// statique comme GitHub Pages, sans configuration côté serveur.

export const ROUTES = ["accueil", "chiffrer", "dechiffrer", "cles", "comprendre", "tests", "apropos"] as const;
export type Route = (typeof ROUTES)[number];

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "") as Route;
  return ROUTES.includes(hash) ? hash : "accueil";
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onChange = () => {
      setRoute(readRoute());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const go = useCallback((r: Route) => {
    window.location.hash = `/${r}`;
  }, []);

  return [route, go];
}

export function navigate(r: Route) {
  window.location.hash = `/${r}`;
}
