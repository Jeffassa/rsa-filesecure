import { Download, FileKey2, KeyRound, LockKeyhole, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import HoldButton from "@/components/kokonutui/hold-button";
import { CopyButton } from "@/components/kit/CopyButton";
import { Fingerprint } from "@/components/kit/Fingerprint";
import { KeyField } from "@/components/kit/KeyField";
import { Notice, PageHeader } from "@/components/kit/misc";
import { PasswordField } from "@/components/kit/PasswordField";
import { KeyGenAnimation, type KeyNumbers } from "@/components/keys/KeyGenAnimation";
import { errorMessage } from "@/crypto/errors";
import {
  DEFAULT_KEY_SIZE,
  exportProtectedPrivateKey,
  generateIdentity,
  importProtectedPrivateKey,
  KEY_SIZES,
  type KeySize,
  keyComponents,
  MIN_PASSWORD_LENGTH,
  peekPrivateKeyFile,
  publicKeyToPem,
} from "@/crypto/keys";
import { downloadText, slug } from "@/lib/files";
import { formatDate, formatDuration, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type Contact, useApp } from "@/state/app-state";

const SIZE_HINT: Record<KeySize, string> = {
  2048: "minimum, rapide",
  3072: "recommandé",
  4096: "très robuste, plus lent",
};

export function KeysPage() {
  const { identity } = useApp();
  const [numbers, setNumbers] = useState<KeyNumbers | null>(null);
  const [privateSaved, setPrivateSaved] = useState(false);

  return (
    <div>
      <PageHeader subtitle="Votre paire de clés et les clés publiques de vos binômes." title="Clés RSA" />
      <AnimatePresence mode="wait">
        {identity ? (
          <motion.div animate={{ opacity: 1 }} className="space-y-6" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="identity">
            {numbers && (
              <section className="card p-6">
                <KeyGenAnimation bits={identity.bits} numbers={numbers} />
              </section>
            )}
            <IdentityCard onPrivateSaved={() => setPrivateSaved(true)} />
            <ForgetKey
              onForget={() => {
                setNumbers(null);
                setPrivateSaved(false);
              }}
              privateSaved={privateSaved || !identity.exportable}
            />
          </motion.div>
        ) : (
          <motion.div animate={{ opacity: 1 }} className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="none">
            <GenerateCard onNumbers={setNumbers} />
            <LoadKeyCard />
          </motion.div>
        )}
      </AnimatePresence>
      <ContactsSection />
    </div>
  );
}

function GenerateCard({ onNumbers }: { onNumbers: (n: KeyNumbers | null) => void }) {
  const { setIdentity } = useApp();
  const [name, setName] = useState("");
  const [bits, setBits] = useState<KeySize>(DEFAULT_KEY_SIZE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!name.trim()) {
      setError("Indiquez votre prénom : il apparaîtra sur votre clé publique.");
      return;
    }
    setError(null);
    setBusy(true);
    const start = performance.now();
    try {
      const id = await generateIdentity(name, bits);
      const ms = performance.now() - start;
      onNumbers(await keyComponents(id));
      setIdentity(id);
      toast.success("Paire de clés créée", { description: `RSA ${bits} bits en ${formatDuration(ms)}.` });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-violet-soft text-violet">
          <KeyRound className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">Créer ma paire de clés</h2>
          <p className="text-sm text-ink-2">À faire une seule fois, par la personne qui recevra les fichiers.</p>
        </div>
      </div>

      <label className="mb-1.5 block text-xs font-semibold text-ink-2" htmlFor="owner">
        Votre prénom
      </label>
      <input
        className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-3 text-sm text-ink outline-none transition-shadow placeholder:text-ink-3 focus:border-step focus:shadow-[0_0_0_4px_rgb(108_127_237/0.12)]"
        disabled={busy}
        id="owner"
        maxLength={40}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        placeholder="Koffi"
        value={name}
      />

      <p className="mt-5 mb-1.5 text-xs font-semibold text-ink-2">Taille de la clé</p>
      <div className="relative grid grid-cols-3 gap-1 rounded-xl bg-zone p-1">
        {KEY_SIZES.map((s) => (
          <button
            className={cn("relative rounded-lg px-2 py-2.5 text-center transition-colors", bits === s ? "text-white" : "text-ink-2 hover:text-ink")}
            disabled={busy}
            key={s}
            onClick={() => setBits(s)}
            type="button"
          >
            {bits === s && <motion.span className="btn-violet absolute inset-0 rounded-lg" layoutId="size-pill" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            <span className="relative block text-sm font-bold">{s} bits</span>
            <span className={cn("relative block text-[10px]", bits === s ? "text-white/80" : "text-ink-3")}>{SIZE_HINT[s]}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {busy && (
          <motion.div animate={{ height: "auto", opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }}>
            <div className="pt-5">
              <KeyGenAnimation bits={bits} numbers={null} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <Notice className="mt-4" tone="error">{error}</Notice>}

      <motion.button
        className="btn-violet-wide mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-[15px] font-semibold disabled:opacity-70"
        disabled={busy}
        onClick={generate}
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        <KeyRound className="size-4.5" />
        {busy ? "Génération en cours..." : "Générer ma paire de clés"}
      </motion.button>
    </section>
  );
}

function LoadKeyCard() {
  const { setIdentity } = useApp();
  const [text, setText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [peek, setPeek] = useState<{ name: string; fingerprint: string; bits: number } | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onText(t: string, name: string) {
    setFileName(name);
    setText(t);
    setError(null);
    setPeek(null);
    try {
      setPeek(await peekPrivateKeyFile(t));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function load() {
    if (!text || !peek) {
      setError("Choisissez d'abord votre fichier de clé privée (.rsakey).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await importProtectedPrivateKey(text, password);
      setIdentity(id);
      toast.success("Clé privée chargée", { description: `Bonjour ${id.name}. Elle restera en mémoire jusqu'à la fermeture de l'onglet.` });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-blue-soft text-blue">
          <FileKey2 className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">J'ai déjà une clé</h2>
          <p className="text-sm text-ink-2">Chargez votre fichier .rsakey et son mot de passe.</p>
        </div>
      </div>
      <KeyField accept=".rsakey,.json" allowPaste={false} fileName={fileName} onText={onText} placeholder="Sélectionner la clé privée (.rsakey)" />
      <AnimatePresence>
        {peek && (
          <motion.div animate={{ opacity: 1, height: "auto" }} className="overflow-hidden" exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }}>
            <div className="mt-4 rounded-xl bg-zone p-3.5 text-sm">
              <p className="font-semibold text-ink">
                Clé de {peek.name}, {peek.bits} bits
              </p>
              <Fingerprint className="mt-1 text-[13px] text-ink-2" value={peek.fingerprint} />
            </div>
            <div className="mt-4">
              <PasswordField autoComplete="current-password" label="Mot de passe de la clé" onChange={setPassword} value={password} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <Notice className="mt-4" tone="error">{error}</Notice>}
      <motion.button
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-btn py-3.5 text-[15px] font-semibold text-blue-text transition-colors hover:bg-[#b9c3ef] disabled:opacity-60"
        disabled={busy}
        onClick={load}
        type="button"
        whileTap={{ scale: 0.98 }}
      >
        <LockKeyhole className="size-4" />
        {busy ? "Vérification du mot de passe..." : "Charger ma clé"}
      </motion.button>
    </section>
  );
}

function IdentityCard({ onPrivateSaved }: { onPrivateSaved: () => void }) {
  const { identity, contacts, addContact, setVerified } = useApp();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  if (!identity) return null;
  const pem = publicKeyToPem(identity);

  async function savePrivate() {
    if (!identity) return;
    if (pw.length < MIN_PASSWORD_LENGTH) {
      setError(`Choisissez un mot de passe d'au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (pw !== pw2) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const file = await exportProtectedPrivateKey(identity, pw);
      downloadText(file, `cle_privee_${slug(identity.name)}.rsakey`, "application/json");
      setSaved(true);
      onPrivateSaved();
      setPw("");
      setPw2("");
      toast.success("Clé privée enregistrée", { description: "Gardez ce fichier et son mot de passe en lieu sûr." });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
      <motion.section animate={{ opacity: 1, y: 0 }} className="card p-6 lg:col-span-2" initial={{ opacity: 0, y: 12 }}>
        <div className="flex flex-wrap items-center gap-5">
          <motion.span
            animate={{ scale: 1, rotate: 0 }}
            className="flex size-16 items-center justify-center rounded-2xl bg-violet text-2xl font-bold text-white"
            initial={{ scale: 0.5, rotate: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {initials(identity.name)}
          </motion.span>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-ink">{identity.name}</p>
            <p className="text-sm text-ink-2">
              RSA-OAEP {identity.bits} bits, SHA-256
              {identity.createdAt && `, créée le ${formatDate(identity.createdAt)}`}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-green-soft px-3 py-1 text-xs font-semibold text-green-deep">
            <ShieldCheck className="size-3.5" /> Clé active
          </span>
        </div>
        <div className="mt-5 rounded-xl border border-line bg-zone p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-ink-2">Empreinte à lire à voix haute à votre binôme</p>
            <CopyButton label="Copier" text={identity.fingerprint} />
          </div>
          <Fingerprint className="mt-1.5 text-[19px] font-medium tracking-wide text-ink sm:text-[22px]" value={identity.fingerprint} />
        </div>
      </motion.section>

      <motion.section animate={{ opacity: 1, y: 0 }} className="card p-6" initial={{ opacity: 0, y: 12 }} transition={{ delay: 0.1 }}>
        <h3 className="flex items-center gap-2 text-base font-bold text-blue-text">
          <KeyRound className="size-4.5" /> Clé publique, à partager
        </h3>
        <p className="mt-1 text-sm text-ink-2">Envoyez ce fichier à votre binôme : il s'en servira pour chiffrer des fichiers que personne d'autre que vous ne pourra ouvrir.</p>
        <pre className="mono-tight mt-4 max-h-36 overflow-hidden rounded-xl bg-zone p-3 text-[10.5px] leading-relaxed text-ink-2 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">{pem}</pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <motion.button
            className="flex items-center gap-2 rounded-xl bg-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(74_107_226/0.8)]"
            onClick={() => {
              downloadText(pem, `cle_publique_${slug(identity.name)}.pem`, "application/x-pem-file");
              toast.success("Clé publique téléchargée");
            }}
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <Download className="size-4" /> Télécharger (.pem)
          </motion.button>
          <CopyButton className="px-3 py-2.5 text-sm" label="Copier le texte" text={pem} />
        </div>
        {!contacts.some((c) => c.kid === identity.kid) && (
          <button
            className="mt-3 text-xs font-semibold text-blue-text underline-offset-2 hover:underline"
            onClick={async () => {
              const me = await addContact(pem);
              setVerified(me.kid, true);
              toast.success("Vous êtes dans vos destinataires", { description: "Pratique pour essayer le chiffrement puis le déchiffrement sur une seule machine." });
            }}
            type="button"
          >
            M'ajouter comme destinataire, pour un essai sur cette machine
          </button>
        )}
      </motion.section>

      <motion.section animate={{ opacity: 1, y: 0 }} className="card p-6" initial={{ opacity: 0, y: 12 }} transition={{ delay: 0.18 }}>
        <h3 className="flex items-center gap-2 text-base font-bold text-violet-deep">
          <LockKeyhole className="size-4.5" /> Clé privée, à garder
        </h3>
        {identity.exportable ? (
          <>
            <p className="mt-1 text-sm text-ink-2">
              Elle sera chiffrée par un mot de passe (PBKDF2, 600 000 itérations, puis AES-256-GCM). Ne l'envoyez jamais, pas même à votre binôme.
            </p>
            <div className="mt-4 space-y-3">
              <PasswordField label="Mot de passe" onChange={(v) => { setPw(v); setError(null); }} showStrength value={pw} />
              <PasswordField label="Confirmation" onChange={(v) => { setPw2(v); setError(null); }} value={pw2} />
            </div>
            {error && <Notice className="mt-3" tone="error">{error}</Notice>}
            {saved && !error && <Notice className="mt-3" tone="success">Fichier .rsakey téléchargé.</Notice>}
            <motion.button
              className="mt-4 flex items-center gap-2 rounded-xl bg-[linear-gradient(90deg,#4a3ba8,#6f59dc)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              disabled={saving}
              onClick={savePrivate}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Download className="size-4" /> {saving ? "Chiffrement de la clé..." : "Télécharger la clé privée protégée"}
            </motion.button>
          </>
        ) : (
          <Notice className="mt-3" tone="info">
            Cette clé vient de votre fichier .rsakey : elle y reste protégée par votre mot de passe. Le site ne peut plus l'exporter.
          </Notice>
        )}
      </motion.section>
    </div>
  );
}

function ForgetKey({ privateSaved, onForget }: { privateSaved: boolean; onForget: () => void }) {
  const { setIdentity } = useApp();
  return (
    <section className="card flex flex-wrap items-center gap-4 p-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">Retirer cette clé du navigateur</p>
        <p className="text-sm text-ink-2">
          {privateSaved
            ? "Vous pourrez la recharger avec votre fichier .rsakey et son mot de passe."
            : "Attention : vous n'avez pas encore téléchargé la clé privée. Sans elle, les fichiers chiffrés pour vous deviendront illisibles."}
        </p>
      </div>
      <HoldButton
        className="min-w-56 rounded-xl py-2.5"
        holdDuration={1600}
        onHoldComplete={() => {
          setIdentity(null);
          onForget();
          toast("Clé retirée de la mémoire");
        }}
        variant="red"
      >
        <Trash2 className="size-4" /> Maintenir pour retirer
      </HoldButton>
    </section>
  );
}

function ContactsSection() {
  const { contacts, addContact, identity } = useApp();
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onText(text: string, name: string) {
    setFileName(name);
    setError(null);
    try {
      const c = await addContact(text);
      toast.success(`Clé de ${c.name} ajoutée`, { description: "Comparez maintenant son empreinte avec votre binôme." });
      setFileName(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Clés publiques de vos binômes</h2>
          <p className="text-sm text-ink-2">Mémorisées dans ce navigateur. Une clé publique n'est pas secrète.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="card p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
            <UserPlus className="size-4 text-blue" /> Ajouter une clé publique
          </p>
          <KeyField accept=".pem,.pub,.txt" fileName={fileName} onText={onText} placeholder="Sélectionner la clé publique (.pem)" />
          {error && <Notice className="mt-3" tone="error">{error}</Notice>}
        </div>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {contacts.length === 0 && (
              <motion.div animate={{ opacity: 1 }} className="rounded-2xl border border-line-strong border-dashed p-6 text-center text-sm text-ink-3" exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
                Aucune clé de binôme pour l'instant.
              </motion.div>
            )}
            {contacts.map((c) => (
              <ContactRow contact={c} isMe={c.kid === identity?.kid} key={c.kid} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ContactRow({ contact, isMe }: { contact: Contact; isMe: boolean }) {
  const { setVerified, removeContact } = useApp();
  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="card flex flex-wrap items-center gap-4 p-4"
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      layout
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-green-2 font-bold text-white">{initials(contact.name)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">
          {contact.name}
          {isMe && <span className="ml-2 rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-semibold text-violet">vous</span>}
          <span className="ml-2 text-xs font-normal text-ink-3">{contact.bits} bits</span>
        </p>
        <Fingerprint className="text-[12px] text-ink-2" value={contact.fingerprint} />
      </div>
      <button
        aria-pressed={contact.verified}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
          contact.verified ? "border-transparent bg-green-soft text-green-deep" : "border-line-strong text-ink-2 hover:border-step",
        )}
        onClick={() => setVerified(contact.kid, !contact.verified)}
        type="button"
      >
        <motion.span animate={{ scale: contact.verified ? [1.4, 1] : 1 }} className="inline-flex">
          <ShieldCheck className="size-3.5" />
        </motion.span>
        {contact.verified ? "Empreinte vérifiée" : "Marquer comme vérifiée"}
      </button>
      <button
        aria-label={`Supprimer la clé de ${contact.name}`}
        className="rounded-lg p-2 text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger"
        onClick={() => removeContact(contact.kid)}
        type="button"
      >
        <Trash2 className="size-4" />
      </button>
    </motion.div>
  );
}
