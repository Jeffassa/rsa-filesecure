import {
  AlertTriangle,
  CheckCircle2,
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  FileVideo,
  Info,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { type FileKind, fileKind } from "@/lib/files";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<FileKind, typeof File> = {
  pdf: FileType2,
  image: FileImage,
  text: FileText,
  archive: FileArchive,
  sheet: FileSpreadsheet,
  doc: FileText,
  audio: FileAudio,
  video: FileVideo,
  other: File,
};

export function FileIcon({ name, type, className }: { name: string; type: string; className?: string }) {
  const Icon = KIND_ICON[fileKind(name, type)];
  return <Icon className={className} />;
}

/** En-tête de page, avec le titre qui glisse à l'arrivée. */
export function PageHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <motion.header
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-start gap-4"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      {icon}
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-ink-2">{subtitle}</p>}
      </div>
    </motion.header>
  );
}

const NOTICE = {
  info: { box: "bg-blue-soft text-blue-text border-[#d5daf6]", Icon: Info },
  success: { box: "bg-green-soft text-green-deep border-[#c7e6dc]", Icon: CheckCircle2 },
  warning: { box: "bg-warning-soft text-warning border-[#f1dfbd]", Icon: AlertTriangle },
  error: { box: "bg-danger-soft text-danger-deep border-[#f0c9c9]", Icon: XCircle },
};

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof NOTICE;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { box, Icon } = NOTICE[tone];
  return (
    <motion.div
      animate={tone === "error" ? { opacity: 1, y: 0, x: [0, -6, 5, -3, 0] } : { opacity: 1, y: 0 }}
      className={cn("flex gap-3 rounded-xl border px-4 py-3 text-[13px] leading-relaxed", box, className)}
      initial={{ opacity: 0, y: 6 }}
      role={tone === "error" ? "alert" : undefined}
      transition={{ duration: 0.35 }}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : undefined}>{children}</div>}
      </div>
    </motion.div>
  );
}

export interface LayoutSegment {
  label: string;
  bytes: number;
  color: string;
}

/** Barre empilée : composition du fichier .rsaenc, segments qui poussent l'un après l'autre. */
export function LayoutBar({ segments, delay = 0 }: { segments: LayoutSegment[]; delay?: number }) {
  const total = segments.reduce((n, s) => n + s.bytes, 0) || 1;
  // Échelle avec un plancher : sinon l'en-tête et la clé seraient invisibles à côté du contenu.
  const widths = segments.map((s) => Math.max(8, (s.bytes / total) * 100));
  const sum = widths.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="flex h-3 gap-[3px] overflow-hidden rounded-full">
        {segments.map((s, i) => (
          <motion.div
            animate={{ width: `${(widths[i] / sum) * 100}%` }}
            className="h-full rounded-full"
            initial={{ width: 0 }}
            key={s.label}
            style={{ background: s.color }}
            transition={{ delay: delay + i * 0.28, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {segments.map((s, i) => (
          <motion.li
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            key={s.label}
            transition={{ delay: delay + i * 0.28 + 0.2 }}
          >
            <span className="size-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
            <span className="font-mono text-ink-3">{formatBytes(s.bytes)}</span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-1 text-[11px] text-ink-3">Largeurs non proportionnelles : la clé et l'en-tête sont minuscules à côté du contenu.</p>
    </div>
  );
}

/** Ligne de fichier sélectionné, comme « document.pdf (245 Ko) » suivi d'une croix sur la maquette. */
export function FileRow({
  name,
  type,
  size,
  onRemove,
  tone = "violet",
}: {
  name: string;
  type: string;
  size: number;
  onRemove?: () => void;
  tone?: "violet" | "green";
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-line bg-zone px-4 py-3"
      initial={{ opacity: 0, y: -6 }}
    >
      <motion.span
        animate={{ y: 0, opacity: 1 }}
        className={cn("flex size-10 items-center justify-center rounded-lg", tone === "violet" ? "bg-violet-soft text-violet" : "bg-green-soft text-green")}
        initial={{ y: -14, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
      >
        <FileIcon className="size-5" name={name} type={type} />
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        <p className="text-xs text-ink-3">{formatBytes(size)}</p>
      </div>
      {onRemove && (
        <button
          aria-label="Retirer le fichier"
          className="rounded-lg p-1.5 text-remove transition-colors hover:bg-danger-soft hover:text-danger"
          onClick={onRemove}
          type="button"
        >
          <XCircle className="size-5" />
        </button>
      )}
    </motion.div>
  );
}
