import { Download, Lock, LockOpen, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ByteField } from "@/components/fx/ByteField";
import FileUpload from "@/components/kokonutui/file-upload";
import MatrixText from "@/components/kokonutui/matrix-text";
import { AnimatedLock } from "@/components/kit/AnimatedLock";
import { Fingerprint } from "@/components/kit/Fingerprint";
import { BackHeader } from "@/components/kit/Header";
import { KeyField } from "@/components/kit/KeyField";
import { FileRow, LayoutBar, Notice } from "@/components/kit/misc";
import { SessionKeyChips } from "@/components/kit/SessionKeyChips";
import { type StageDef, StageList } from "@/components/kit/StageList";
import { StepCard } from "@/components/kit/StepCard";
import type { Bytes } from "@/crypto/encoding";
import { errorMessage } from "@/crypto/errors";
import { type EncryptResult, type EncryptStage, encryptFile, MAX_FILE_SIZE, PREVIEW_BYTES } from "@/crypto/hybrid";
import { downloadBlob, readFileBytes } from "@/lib/files";
import { formatBytes, formatDuration } from "@/lib/format";
import { runPaced, type StageView } from "@/lib/pacer";
import { navigate } from "@/lib/router";
import { cn } from "@/lib/utils";
import { type Contact, useApp, useStageDuration } from "@/state/app-state";

const STAGES: EncryptStage[] = ["session-key", "wrap-key", "encrypt-content", "assemble"];
const IDLE: StageView[] = STAGES.map(() => ({ status: "waiting", progress: 0 }));

type Phase = "idle" | "running" | "done" | "error";

export function EncryptPage() {
  const { contacts, identity, setVerified, setHandoff } = useApp();
  const minStageMs = useStageDuration();

  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Bytes | null>(null);
  const pending = useRef<Bytes | null>(null);
  const [recipientKid, setRecipientKid] = useState<string | null>(null);
  const recipient = contacts.find((c) => c.kid === recipientKid) ?? null;

  const [phase, setPhase] = useState<Phase>("idle");
  const [views, setViews] = useState<StageView[]>(IDLE);
  const [result, setResult] = useState<EncryptResult | null>(null);
  const [cipherSample, setCipherSample] = useState<Bytes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [shake, setShake] = useState({ file: 0, key: 0 });
  const [duration, setDuration] = useState(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Choisit automatiquement la seule clé disponible.
  useEffect(() => {
    if (!recipientKid && contacts.length === 1) setRecipientKid(contacts[0].kid);
  }, [contacts, recipientKid]);

  const plainSample = useMemo(() => bytes?.subarray(0, PREVIEW_BYTES) ?? null, [bytes]);
  const stageDefs: StageDef[] = [
    { title: "Clé de session AES-256 générée", detail: "Aléatoire, neuve pour ce fichier, jamais affichée" },
    {
      title: "Clé de session scellée avec RSA-OAEP",
      detail: recipient ? `Avec la clé publique de ${recipient.name} (${recipient.bits} bits, SHA-256)` : "Avec la clé publique du destinataire",
    },
    { title: "Contenu chiffré avec AES-256-GCM", detail: "Nom et contenu du fichier, par morceaux d'1 Mo authentifiés", showPercent: true },
    { title: "Fichier .rsaenc assemblé", detail: "En-tête, clé scellée et contenu chiffré" },
  ];

  const content = views[2];
  const fieldTarget = !bytes ? "empty" : content.status === "running" || content.status === "done" ? "cipher" : "plain";
  const fieldProgress = !bytes ? 1 : fieldTarget === "cipher" ? (content.status === "done" ? 1 : content.progress) : 1;

  function reset(keepFile = true) {
    setPhase("idle");
    setViews(IDLE);
    setResult(null);
    setCipherSample(null);
    setError(null);
    if (!keepFile) {
      setFile(null);
      setBytes(null);
    }
  }

  async function encrypt() {
    if (phase === "running") return;
    const missingFile = !file || !bytes;
    const missingKey = !recipient;
    if (missingFile || missingKey) {
      setShake((s) => ({ file: s.file + (missingFile ? 1 : 0), key: s.key + (missingKey ? 1 : 0) }));
      setFormError(
        missingFile && missingKey
          ? "Choisissez d'abord un fichier et la clé publique du destinataire."
          : missingFile
            ? "Choisissez d'abord un fichier."
            : "Choisissez la clé publique du destinataire.",
      );
      return;
    }
    if (!recipient.verified) {
      setShake((s) => ({ ...s, key: s.key + 1 }));
      setFormError(`Comparez d'abord l'empreinte avec ${recipient.name}, puis cochez la case : c'est la seule protection contre une clé substituée.`);
      return;
    }
    setFormError(null);
    reset();
    setPhase("running");
    const start = performance.now();
    try {
      const r = await runPaced(
        STAGES,
        (report) =>
          encryptFile({ data: bytes, name: file.name, type: file.type }, recipient, {
            onProgress: report,
            onPreview: (s) => alive.current && setCipherSample(s),
          }),
        { minStageMs, onUpdate: (v) => alive.current && setViews(v), isActive: () => alive.current },
      );
      if (!alive.current) return;
      setDuration(performance.now() - start);
      setResult(r);
      setPhase("done");
    } catch (e) {
      if (!alive.current) return;
      setError(errorMessage(e));
      setPhase("error");
    }
  }

  const blob = useMemo(() => (result ? new Blob(result.parts, { type: "application/octet-stream" }) : null), [result]);
  const outName = file ? `${file.name}.rsaenc` : "fichier.rsaenc";
  const headHex = useMemo(() => {
    if (!result) return "";
    return Array.from(result.parts[0].subarray(0, 12), (b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  }, [result]);

  return (
    <div>
      <BackHeader subtitle="Seul le destinataire pourra l'ouvrir, avec sa clé privée." title="Chiffrer un fichier" />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-5">
          <StepCard done={Boolean(file)} n={1} shake={shake.file} title="Sélectionner le fichier">
            <AnimatePresence mode="wait">
              {file && bytes ? (
                <motion.div animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="file">
                  <FileRow
                    name={file.name}
                    onRemove={phase === "running" ? undefined : () => reset(false)}
                    size={file.size}
                    type={file.type}
                  />
                </motion.div>
              ) : (
                <motion.div animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="drop">
                  <FileUpload
                    className="max-w-none"
                    maxFileSize={MAX_FILE_SIZE}
                    onUpload={async (f, { onProgress, signal }) => {
                      pending.current = await readFileBytes(f, (p) => onProgress(p * 100), signal);
                    }}
                    onUploadSuccess={(f) => {
                      setFile(f);
                      setBytes(pending.current);
                      setFormError(null);
                      reset();
                    }}
                    tone="violet"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </StepCard>

          <StepCard done={Boolean(recipient?.verified)} n={2} shake={shake.key} title="Clé publique du destinataire">
            <RecipientPicker
              disabled={phase === "running"}
              onPick={(kid) => {
                setRecipientKid(kid);
                setFormError(null);
                reset();
              }}
              selected={recipient}
            />
            {recipient && (
              <motion.label
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors",
                  recipient.verified ? "border-[#c7e6dc] bg-green-soft text-green-deep" : "border-[#f1dfbd] bg-warning-soft text-[#7a4c0b]",
                )}
                initial={{ opacity: 0, y: 6 }}
              >
                <input
                  checked={recipient.verified}
                  className="mt-0.5 size-4 accent-green"
                  onChange={(e) => {
                    setVerified(recipient.kid, e.target.checked);
                    setFormError(null);
                  }}
                  type="checkbox"
                />
                <span>
                  J'ai comparé cette empreinte avec {recipient.name}, de vive voix ou par un autre canal, et elle est identique.
                </span>
              </motion.label>
            )}
          </StepCard>

          <motion.button
            className="btn-violet-wide flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-[17px] font-semibold disabled:opacity-80"
            disabled={phase === "running"}
            onClick={encrypt}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatedLock locked={phase === "running" || phase === "done"} size={20} strokeWidth={2.4} />
            {phase === "running" ? "Chiffrement en cours..." : recipient ? `Chiffrer pour ${recipient.name}` : "Chiffrer le fichier"}
          </motion.button>
          <AnimatePresence>{formError && <Notice tone="error">{formError}</Notice>}</AnimatePresence>
        </div>

        <motion.aside
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 sm:p-6 lg:sticky lg:top-24"
          initial={{ opacity: 0, y: 16 }}
          transition={{ delay: 0.15 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-ink">Ce qui se passe</h2>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", PHASE_STYLE[phase])}>{PHASE_LABEL[phase]}</span>
          </div>
          <ByteField
            caption={
              <>
                <span>Les {PREVIEW_BYTES} premiers octets du fichier</span>
                <span className="font-medium text-ink-2">
                  {fieldTarget === "empty" ? "aucun fichier" : fieldTarget === "plain" ? "en clair : la structure se voit" : content.status === "done" ? "chiffrés : plus aucune structure" : "chiffrement..."}
                </span>
              </>
            }
            cipher={cipherSample}
            plain={plainSample}
            progress={fieldProgress}
            target={fieldTarget}
            tone="violet"
          />
          <div className="mt-5">
            <StageList
              extras={{
                0: <SessionKeyChips fading={views[1].status !== "waiting"} />,
                1: views[1].status !== "waiting" && (
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-violet-soft text-violet">
                      <AnimatedLock locked={views[1].status === "done"} size={16} strokeWidth={2.5} />
                    </span>
                    <span className="font-mono text-[11px] text-ink-2">
                      clé scellée : {recipient ? recipient.bits / 8 : 384} octets
                    </span>
                  </div>
                ),
                3: result && (
                  <LayoutBar
                    segments={[
                      { label: "en-tête et IV", bytes: result.layout.header, color: "#1f2b40" },
                      { label: "clé scellée (Base64)", bytes: result.layout.wrappedKey, color: "#6f59dc" },
                      { label: "contenu chiffré", bytes: result.layout.content, color: "#c3b6f5" },
                    ]}
                  />
                ),
              }}
              stages={stageDefs}
              tone="violet"
              views={views}
            />
          </div>

          <AnimatePresence>
            {phase === "error" && error && (
              <motion.div animate={{ opacity: 1 }} className="mt-4" exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
                <Notice tone="error">{error}</Notice>
              </motion.div>
            )}
            {phase === "done" && result && blob && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-2xl border border-[#dcd8f7] bg-violet-soft p-4"
                initial={{ opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    animate={{ rotate: [0, -8, 8, 0] }}
                    className="flex size-11 items-center justify-center rounded-xl bg-violet text-white"
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Lock className="size-5" />
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-medium text-ink">{outName}</p>
                    <p className="text-xs text-ink-2">
                      {formatBytes(result.size)}, chiffré en {formatDuration(duration)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 overflow-hidden rounded-lg bg-white/70 px-3 py-2" title="Les 6 premiers octets valent RSAENC en ASCII">
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-3">Premiers octets</p>
                  <MatrixText className="justify-start" letterClassName="text-[12px] text-violet-deep" letterInterval={28} letterAnimationDuration={260} text={headHex} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <motion.button
                    animate={{ scale: [1, 1.05, 1] }}
                    className="btn-violet flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                    onClick={() => {
                      downloadBlob(blob, outName);
                      toast.success("Fichier chiffré téléchargé", { description: `Envoyez ${outName} à ${recipient?.name ?? "votre binôme"}.` });
                    }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                  >
                    <Download className="size-4" /> Télécharger
                  </motion.button>
                  {identity && recipient?.kid === identity.kid && (
                    <button
                      className="flex items-center gap-2 rounded-xl bg-green-soft px-4 py-3 text-sm font-semibold text-green-deep transition-colors hover:bg-[#cdeae1]"
                      onClick={async () => {
                        setHandoff({ bytes: new Uint8Array(await blob.arrayBuffer()), name: outName });
                        navigate("dechiffrer");
                      }}
                      type="button"
                    >
                      <LockOpen className="size-4" /> Le déchiffrer
                    </button>
                  )}
                  <button
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-chip-text transition-colors hover:bg-chip"
                    onClick={() => reset(false)}
                    type="button"
                  >
                    <RotateCcw className="size-4" /> Autre fichier
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>
      </div>
    </div>
  );
}

const PHASE_LABEL: Record<Phase, string> = { idle: "En attente", running: "En cours", done: "Terminé", error: "Échec" };
const PHASE_STYLE: Record<Phase, string> = {
  idle: "bg-zone text-ink-3",
  running: "bg-violet-soft text-violet",
  done: "bg-green-soft text-green-deep",
  error: "bg-danger-soft text-danger",
};

function RecipientPicker({
  selected,
  onPick,
  disabled,
}: {
  selected: Contact | null;
  onPick: (kid: string) => void;
  disabled: boolean;
}) {
  const { contacts, addContact, identity } = useApp();
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onText(text: string, name: string) {
    setFileName(name);
    setError(null);
    try {
      const c = await addContact(text);
      onPick(c.kid);
      setFileName(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div>
      {contacts.length > 0 && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {contacts.map((c) => {
            const active = selected?.kid === c.kid;
            return (
              <motion.button
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  active ? "border-violet bg-violet-soft" : "border-line hover:border-line-strong",
                )}
                disabled={disabled}
                key={c.kid}
                layout
                onClick={() => onPick(c.kid)}
                type="button"
                whileTap={{ scale: 0.98 }}
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-white", active ? "bg-violet" : "bg-ink-3")}>
                  <UserRound className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {c.name}
                    {c.kid === identity?.kid && <span className="ml-1.5 text-[10px] font-semibold text-violet">vous</span>}
                  </span>
                  <span className="mono-tight block truncate text-[11px] text-ink-3">{c.fingerprint.slice(0, 14)}</span>
                </span>
                {c.verified && <ShieldCheck className="absolute top-2 right-2 size-3.5 text-green" />}
              </motion.button>
            );
          })}
        </div>
      )}
      <KeyField
        accept=".pem,.pub,.txt"
        disabled={disabled}
        fileName={fileName}
        onText={onText}
        placeholder={contacts.length ? "Importer une autre clé publique (.pem)" : "Sélectionner la clé publique (.pem)"}
      />
      {error && <Notice className="mt-3" tone="error">{error}</Notice>}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl bg-zone p-3.5"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, y: 6 }}
            key={selected.kid}
          >
            <p className="text-xs font-semibold text-ink-2">
              Empreinte de la clé de {selected.name} ({selected.bits} bits)
            </p>
            <Fingerprint className="mt-1 text-[15px] font-medium text-ink" value={selected.fingerprint} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
