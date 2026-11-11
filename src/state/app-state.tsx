import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Bytes } from "@/crypto/encoding";
import { type Identity, importPublicKey, type PublicKeyInfo, publicKeyToPem } from "@/crypto/keys";

// État partagé de l'application, en mémoire uniquement.
// Seules les clés PUBLIQUES des binômes sont mémorisées dans le navigateur
// (localStorage), avec la mention « empreinte vérifiée ». La clé privée n'est
// jamais enregistrée : elle disparaît à la fermeture de l'onglet.

export interface Contact extends PublicKeyInfo {
  pem: string;
  verified: boolean;
  addedAt: string;
}

interface StoredContact {
  pem: string;
  verified: boolean;
  addedAt: string;
}

export interface Handoff {
  bytes: Bytes;
  name: string;
}

interface AppState {
  identity: Identity | null;
  setIdentity: (identity: Identity | null) => void;
  contacts: Contact[];
  addContact: (pem: string) => Promise<Contact>;
  removeContact: (kid: string) => void;
  setVerified: (kid: string, verified: boolean) => void;
  demoMode: boolean;
  setDemoMode: (on: boolean) => void;
  /** Fichier chiffré transmis de l'écran Chiffrer à l'écran Déchiffrer (essai sur une seule machine). */
  handoff: Handoff | null;
  setHandoff: (h: Handoff | null) => void;
}

const CONTACTS_KEY = "rsa-filesecure.contacts.v1";
const DEMO_KEY = "rsa-filesecure.demo.v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage indisponible (navigation privée) : l'application fonctionne sans.
  }
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [demoMode, setDemoModeState] = useState<boolean>(() => load(DEMO_KEY, true));
  const [handoff, setHandoff] = useState<Handoff | null>(null);

  useEffect(() => {
    const stored = load<StoredContact[]>(CONTACTS_KEY, []);
    Promise.all(
      stored.map(async (s) => {
        try {
          return { ...(await importPublicKey(s.pem)), pem: s.pem, verified: s.verified, addedAt: s.addedAt };
        } catch {
          return null;
        }
      }),
    ).then((list) => setContacts(list.filter((c): c is Contact => c !== null)));
  }, []);

  const persist = useCallback((list: Contact[]) => {
    save(
      CONTACTS_KEY,
      list.map(({ pem, verified, addedAt }) => ({ pem, verified, addedAt })),
    );
  }, []);

  const addContact = useCallback(
    async (pem: string) => {
      const info = await importPublicKey(pem);
      const contact: Contact = {
        ...info,
        pem: publicKeyToPem(info),
        verified: false,
        addedAt: new Date().toISOString(),
      };
      setContacts((prev) => {
        const existing = prev.find((c) => c.kid === info.kid);
        const next = existing ? prev.map((c) => (c.kid === info.kid ? { ...contact, verified: c.verified } : c)) : [...prev, contact];
        persist(next);
        return next;
      });
      return contact;
    },
    [persist],
  );

  const removeContact = useCallback(
    (kid: string) =>
      setContacts((prev) => {
        const next = prev.filter((c) => c.kid !== kid);
        persist(next);
        return next;
      }),
    [persist],
  );

  const setVerified = useCallback(
    (kid: string, verified: boolean) =>
      setContacts((prev) => {
        const next = prev.map((c) => (c.kid === kid ? { ...c, verified } : c));
        persist(next);
        return next;
      }),
    [persist],
  );

  const setDemoMode = useCallback((on: boolean) => {
    setDemoModeState(on);
    save(DEMO_KEY, on);
  }, []);

  const value = useMemo(
    () => ({
      identity,
      setIdentity,
      contacts,
      addContact,
      removeContact,
      setVerified,
      demoMode,
      setDemoMode,
      handoff,
      setHandoff,
    }),
    [identity, contacts, addContact, removeContact, setVerified, demoMode, setDemoMode, handoff],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp doit être utilisé dans AppStateProvider");
  return ctx;
}

/** Durée minimale d'une étape animée selon le mode choisi. */
export function useStageDuration(): number {
  const { demoMode } = useApp();
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return 0;
  return demoMode ? 950 : 160;
}
