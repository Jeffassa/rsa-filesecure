import { CheckCircle2, Download, KeyRound, LockKeyhole, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ByteField } from "@/components/fx/ByteField";
import FileUpload from "@/components/kokonutui/file-upload";
import { AnimatedLock } from "@/components/kit/AnimatedLock";
import { Fingerprint } from "@/components/kit/Fingerprint";
import { BackHeader } from "@/components/kit/Header";
import { KeyField } from "@/components/kit/KeyField";
import { FileIcon, FileRow, Notice } from "@/components/kit/misc";
import { PasswordField } from "@/components/kit/PasswordField";
import { SessionKeyChips } from "@/components/kit/SessionKeyChips";
import { type StageDef, StageList } from "@/components/kit/StageList";
import { StepCard } from "@/components/kit/StepCard";
import { type ContainerHeader, parseContainer } from "@/crypto/container";
import { type Bytes, groupFingerprint } from "@/crypto/encoding";
import { errorMessage } from "@/crypto/errors";
import { type DecryptResult, type DecryptStage, decryptFile, MAX_FILE_SIZE, PREVIEW_BYTES } from "@/crypto/hybrid";
import { importProtectedPrivateKey, peekPrivateKeyFile } from "@/crypto/keys";
import { downloadBlob, fileKind, readFileBytes, safeFileName } from "@/lib/files";
import { formatBytes, formatDuration } from "@/lib/format";
import { runPaced, type StageView } from "@/lib/pacer";
import { cn } from "@/lib/utils";
import { useApp, useStageDuration } from "@/state/app-state";

const STAGES: DecryptStage[] = ["read-header", "unwrap-key", "decrypt-content", "verify"];
const IDLE: StageView[] = STAGES.map(() => ({ status: "waiting", progress: 0 }));

type Phase = "idle" | "running" | "done" | "error";

interface Loaded {
  name: string;
  size: number;
  bytes: Bytes;
  header: ContainerHeader | null;
  cipherSample: Bytes | null;
  problem: string | null;
}

function inspect(name: string, bytes: Bytes): Loaded {
  try {
    const { header, body } = parseContainer(bytes);
    return { name, size: bytes.length, bytes, header, cipherSample: body.slice(0, PREVIEW_BYTES), problem: null };
  } catch (e) {
    return { name, size: bytes.length, bytes, header: null, cipherSample: bytes.slice(0, PREVIEW_BYTES), problem: errorMessage(e) };
  }
}

export function DecryptPage() {
  const { identity, handoff, setHandoff } = useApp();
  const minStageMs = useStageDuration();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const pending = useRef<Bytes | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [views, setViews] = useState<StageView[]>(IDLE);
  const [result, setResult] = useState<DecryptResult | null>(null);
  const [plainSample, setPlainSample] = useState<Bytes | null>(null);
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

  // Fichier transmis depuis l'écran Chiffrer (essai sur une seule machine).
  useEffect(() => {
    if (handoff) {
      setLoaded(inspect(handoff.name, handoff.bytes));
      setHandoff(null);
    }
  }, [handoff, setHandoff]);

  const fileFp = loaded?.header ? groupFingerprint(loaded.header.kid) : null;
  const matches = Boolean(identity && loaded?.header && identity.kid === loaded.header.kid);

  const stageDefs: StageDef[] = [
    { title: "En-tête lu, destinataire reconnu", detail: "Format RSAENC version 1, empreinte comparée à votre clé" },
    { title: "Clé de session ouverte avec RSA-OAEP", detail: "Votre clé privée déchiffre la clé AES scellée" },
    { title: "Contenu déchiffré, étiquettes GCM valides", detail: "Un seul octet modifié et tout serait refusé", showPercent: true },
    { title: "Intégrité vérifiée", detail: "SHA-256 du fichier restauré comparé à celui d'origine" },
  ];

  const content = views[2];
  const fieldTarget = !loaded ? "empty" : content.status === "running" || content.status === "done" ? "plain" : "cipher";
  const fieldProgress = fieldTarget === "plain" ? (content.status === "done" ? 1 : content.progress) : 1;

  function reset(keepFile = true) {
    setPhase("idle");
    setViews(IDLE);
    setResult(null);
    setPlainSample(null);
    setError(null);
    if (!keepFile) setLoaded(null);
  }

  async function decrypt() {
    if (phase === "running") return;
    const missingFile = !loaded;
    const missingKey = !identity;
    if (missingFile || missingKey) {
      setShake((s) => ({ file: s.file + (missingFile ? 1 : 0), key: s.key + (missingKey ? 1 : 0) }));
      setFormError(
        missingFile && missingKey
          ? "Choisissez d'abord le fichier chiffré et chargez votre clé privée."
          : missingFile
            ? "Choisissez d'abord le fichier chiffré (.rsaenc)."
            : "Chargez d'abord votre clé privée.",
      );
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
          decryptFile(loaded.bytes, identity, {
            onProgress: report,
            onPreview: (s) => alive.current && setPlainSample(s),
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

  const outName = result ? safeFileName(result.meta.name) : "";
  const blob = useMemo(() => (result ? new Blob([result.data], { type: result.meta.type || "application/octet-stream" }) : null), [result]);

  return (
    <div>
      <BackHeader subtitle="Retrouvez le fichier original avec votre clé privée." title="Déchiffrer un fichier" />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-5">
          <StepCard done={Boolean(loaded?.header)} n={1} shake={shake.file} title="Fichier chiffré">
            <AnimatePresence mode="wait">
              {loaded ? (
                <motion.div animate={{ opacity: 1 }} className="space-y-3" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="file">
                  <FileRow name={loaded.name} onRemove={phase === "running" ? undefined : () => reset(false)} size={loaded.size} tone="green" type="" />
                  {loaded.problem && <Notice tone="error">{loaded.problem}</Notice>}
                  {loaded.header && (
                    <motion.div animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-zone p-3.5" initial={{ opacity: 0, y: 6 }}>
                      <p className="text-xs font-semibold text-ink-2">
                        Destiné à la clé d'empreinte ({loaded.header.bits} bits, {loaded.header.chunks} morceau{loaded.header.chunks > 1 ? "x" : ""})
                      </p>
                      <Fingerprint className="mt-1 text-[15px] font-medium text-ink" compareWith={identity ? identity.fingerprint : undefined} value={fileFp!} />
                      {identity && (
                        <p className={cn("mt-1.5 text-xs font-semibold", matches ? "text-green" : "text-danger")}>
                          {matches ? "C'est bien votre clé." : "Ce n'est pas votre clé : le déchiffrement sera refusé."}
                        </p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="drop">
                  <FileUpload
                    className="max-w-none"
                    maxFileSize={MAX_FILE_SIZE + 1024 * 1024}
                    onUpload={async (f, { onProgress, signal }) => {
                      pending.current = await readFileBytes(f, (p) => onProgress(p * 100), signal);
                    }}
                    onUploadSuccess={(f) => {
                      if (pending.current) setLoaded(inspect(f.name, pending.current));
                      setFormError(null);
                      reset();
                    }}
                    tone="green"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </StepCard>

          <StepCard done={Boolean(identity)} n={2} shake={shake.key} title="Clé privée">
            <PrivateKeyStep />
          </StepCard>

          <motion.button
            className="btn-green flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-[17px] font-semibold disabled:opacity-80"
            disabled={phase === "running"}
            onClick={decrypt}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatedLock locked={phase !== "done"} size={20} strokeWidth={2.4} />
            {phase === "running" ? "Déchiffrement en cours..." : "Déchiffrer le fichier"}
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
                <span>Les {PREVIEW_BYTES} premiers octets</span>
                <span className="font-medium text-ink-2">
                  {fieldTarget === "empty" ? "aucun fichier" : fieldTarget === "cipher" ? "chiffrés : illisibles" : content.status === "done" ? "restaurés : la structure revient" : "déchiffrement..."}
                </span>
              </>
            }
            cipher={loaded?.cipherSample ?? null}
            plain={plainSample}
            progress={fieldProgress}
            target={fieldTarget}
            tone="green"
          />
          <div className="mt-5">
            <StageList
              extras={{
                0: loaded?.header && identity && (
                  <div className="space-y-0.5 text-[12px]">
                    <p className="text-ink-3">
                      fichier{" "}<Fingerprint className="text-ink" compareWith={identity.fingerprint} value={fileFp!} />
                    </p>
                    <p className="text-ink-3">
                      clé{"     "}<Fingerprint className="text-ink" value={identity.fingerprint} />
                    </p>
                  </div>
                ),
                1: (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-green-soft text-green">
                        <AnimatedLock locked={views[1].status !== "done"} size={16} strokeWidth={2.5} />
                      </span>
                      <span className="font-mono text-[11px] text-ink-2">clé privée RSA appliquée</span>
                    </div>
                    {views[1].status === "done" && <SessionKeyChips color="#039f7a" />}
                  </div>
                ),
                3: result && <HashCompare hash={result.sha256} />,
              }}
              stages={stageDefs}
              tone="green"
              views={views}
            />
          </div>

          <AnimatePresence>
            {phase === "error" && error && (
              <motion.div animate={{ opacity: 1 }} className="mt-4" exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
                <Notice tone="error" title="Déchiffrement refusé">
                  {error}
                </Notice>
              </motion.div>
            )}
            {phase === "done" && result && blob && (
              <ResultCard blob={blob} duration={duration} name={outName} onReset={() => reset(false)} result={result} />
            )}
          </AnimatePresence>
        </motion.aside>
      </div>
    </div>
  );
}

const PHASE_LABEL: Record<Phase, string> = { idle: "En attente", running: "En cours", done: "Terminé", error: "Refusé" };
const PHASE_STYLE: Record<Phase, string> = {
  idle: "bg-zone text-ink-3",
  running: "bg-green-soft text-green",
  done: "bg-green-soft text-green-deep",
  error: "bg-danger-soft text-danger",
};

function PrivateKeyStep() {
  const { identity, setIdentity } = useApp();
  const [changing, setChanging] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [peek, setPeek] = useState<{ name: string; fingerprint: string; bits: number } | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onText(t: string, name: string) {
    setText(t);
    setFileName(name);
    setError(null);
    setPeek(null);
    try {
      setPeek(await peekPrivateKeyFile(t));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function unlock() {
    if (!text || !peek) {
      setError("Choisissez votre fichier de clé privée (.rsakey).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setIdentity(await importProtectedPrivateKey(text, password));
      setChanging(false);
      setPassword("");
      toast.success("Clé privée déverrouillée");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (identity && !changing) {
    return (
      <motion.div animate={{ opacity: 1 }} className="flex items-center gap-3 rounded-xl border border-[#c7e6dc] bg-green-soft p-3.5" initial={{ opacity: 0 }}>
        <span className="flex size-10 items-center justify-center rounded-full bg-green text-white">
          <KeyRound className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-green-deep">Clé de {identity.name}, prête</p>
          <p className="mono-tight truncate text-[12px] text-ink-2">{identity.fingerprint}</p>
        </div>
        <button className="text-xs font-semibold text-chip-text hover:text-ink" onClick={() => setChanging(true)} type="button">
          Changer
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <KeyField accept=".rsakey,.json" allowPaste={false} fileName={fileName} onText={onText} placeholder="Sélectionner la clé privée (.rsakey)" tone="green" />
      <AnimatePresence>
        {peek && (
          <motion.div animate={{ opacity: 1, height: "auto" }} className="space-y-3 overflow-hidden" exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }}>
            <p className="text-xs text-ink-2">
              Clé de <span className="font-semibold text-ink">{peek.name}</span>, {peek.bits} bits
            </p>
            <PasswordField autoComplete="current-password" label="Mot de passe de la clé" onChange={setPassword} value={password} />
            <motion.button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-btn py-3 text-sm font-semibold text-blue-text transition-colors hover:bg-[#b9c3ef] disabled:opacity-60"
              disabled={busy}
              onClick={unlock}
              type="button"
              whileTap={{ scale: 0.98 }}
            >
              <LockKeyhole className="size-4" />
              {busy ? "Vérification..." : "Déverrouiller la clé"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <Notice tone="error">{error}</Notice>}
      {identity && (
        <button className="text-xs font-semibold text-ink-2 hover:text-ink" onClick={() => setChanging(false)} type="button">
          Garder la clé de {identity.name}
        </button>
      )}
      <Notice tone="info">Votre clé privée ne quitte jamais ce navigateur et n'est enregistrée nulle part.</Notice>
    </div>
  );
}

function HashCompare({ hash }: { hash: string }) {
  const short = groupFingerprint(hash);
  return (
    <div className="space-y-0.5 text-[12px]">
      <p className="text-ink-3">
        original{" "}<Fingerprint className="text-ink" speed={16} value={short} />
      </p>
      <p className="text-ink-3">
        obtenu{"   "}<Fingerprint className="text-ink" compareWith={short} speed={16} value={short} />
      </p>
    </div>
  );
}

function ResultCard({
  result,
  blob,
  name,
  duration,
  onReset,
}: {
  result: DecryptResult;
  blob: Blob;
  name: string;
  duration: number;
  onReset: () => void;
}) {
  const kind = fileKind(result.meta.name, result.meta.type);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (kind !== "image") return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob, kind]);
  const textPreview = useMemo(() => {
    if (kind !== "text") return null;
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(result.data.subarray(0, 600));
    } catch {
      return null;
    }
  }, [kind, result]);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-2xl border border-[#c7e6dc] bg-green-soft p-4"
      initial={{ opacity: 0, y: 12 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <div className="flex items-center gap-3">
        <span className="relative flex size-11 items-center justify-center rounded-xl bg-green text-white">
          <FileIcon className="size-5" name={result.meta.name} type={result.meta.type} />
          <motion.span
            animate={{ scale: 1 }}
            className="absolute -right-1.5 -bottom-1.5 rounded-full bg-white text-green"
            initial={{ scale: 0 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 500, damping: 15 }}
          >
            <CheckCircle2 className="size-5" />
          </motion.span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="text-xs text-green-deep">
            Identique à l'original, {formatBytes(result.meta.size)}, en {formatDuration(duration)}
          </p>
        </div>
      </div>
      {url && (
        <motion.img
          alt={`Aperçu de ${name}`}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 max-h-48 w-full rounded-lg bg-white object-contain"
          initial={{ opacity: 0, scale: 0.96 }}
          src={url}
        />
      )}
      {textPreview && (
        <pre className="mono-tight mt-3 max-h-40 overflow-hidden whitespace-pre-wrap rounded-lg bg-white p-3 text-[11px] leading-relaxed text-ink-2 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
          {textPreview}
        </pre>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <motion.button
          animate={{ scale: [1, 1.05, 1] }}
          className="btn-green flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          onClick={() => {
            downloadBlob(blob, name);
            toast.success("Fichier restauré téléchargé");
          }}
          transition={{ delay: 0.6, duration: 0.5 }}
          type="button"
          whileTap={{ scale: 0.97 }}
        >
          <Download className="size-4" /> Télécharger {name.length > 28 ? "" : name}
        </motion.button>
        <button
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-chip-text transition-colors hover:bg-chip"
          onClick={onReset}
          type="button"
        >
          <RotateCcw className="size-4" /> Autre fichier
        </button>
      </div>
    </motion.div>
  );
}
