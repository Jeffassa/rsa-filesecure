import type { Bytes } from "@/crypto/encoding";

const SLICE = 4 * 1024 * 1024;

/** Lit un fichier par tranches de 4 Mo, en signalant l'avancement réel. */
export async function readFileBytes(
  file: File,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<Bytes> {
  const out = new Uint8Array(file.size);
  let offset = 0;
  onProgress?.(file.size === 0 ? 1 : 0);
  while (offset < file.size) {
    if (signal?.aborted) throw new DOMException("Lecture annulée", "AbortError");
    const chunk = new Uint8Array(await file.slice(offset, offset + SLICE).arrayBuffer());
    out.set(chunk, offset);
    offset += chunk.length;
    onProgress?.(offset / file.size);
  }
  return out;
}

export async function readFileText(file: File, maxBytes = 1024 * 1024): Promise<string> {
  if (file.size > maxBytes) throw new Error("Fichier trop volumineux pour une clé.");
  return file.text();
}

/** Enregistre un Blob sur le disque de l'utilisateur, sans passer par un serveur. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFileName(filename);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadText(text: string, filename: string, type = "text/plain") {
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename);
}

/** Nom de fichier sans chemin ni caractère interdit sous Windows. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[<>:"|?*\u0000-\u001f]/g, "_").replace(/^\.+/, "").trim();
  return clean.slice(0, 180) || "fichier";
}

export function slug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "cle"
  );
}

export type FileKind = "pdf" | "image" | "text" | "archive" | "sheet" | "doc" | "audio" | "video" | "other";

export function fileKind(name: string, type: string): FileKind {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (type === "application/pdf" || ext === "pdf") return "pdf";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("video/")) return "video";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "sheet";
  if (["doc", "docx", "odt", "rtf", "ppt", "pptx"].includes(ext)) return "doc";
  if (type.startsWith("text/") || ["txt", "md", "json", "js", "ts", "py", "html", "css", "xml"].includes(ext)) return "text";
  return "other";
}
