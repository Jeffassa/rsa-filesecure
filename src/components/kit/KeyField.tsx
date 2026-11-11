import { ClipboardPaste, FolderOpen, KeyRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type DragEvent, useId, useRef, useState } from "react";
import { readFileText } from "@/lib/files";
import { cn } from "@/lib/utils";

/**
 * Champ de clé en trois parties (icône de clé, nom du fichier, dossier),
 * comme sur la maquette. Accepte aussi le glisser-déposer et le collage.
 */
export function KeyField({
  placeholder,
  accept,
  fileName,
  onText,
  allowPaste = true,
  tone = "violet",
  disabled,
}: {
  placeholder: string;
  accept: string;
  fileName: string | null;
  onText: (text: string, fileName: string) => void;
  allowPaste?: boolean;
  tone?: "violet" | "green";
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const [inserted, setInserted] = useState(0);
  const id = useId();

  async function take(file: File | undefined) {
    if (!file) return;
    try {
      onText(await readFileText(file), file.name);
      setInserted((n) => n + 1);
    } catch {
      onText("", file.name);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    if (!disabled) take(e.dataTransfer.files?.[0]);
  }

  const accent = tone === "violet" ? "text-violet" : "text-green";

  return (
    <div>
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] duration-200",
          over ? "border-step shadow-[0_0_0_4px_rgb(108_127_237/0.15)]" : "border-line-strong",
          disabled && "opacity-60",
        )}
        onDragLeave={() => setOver(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDrop={onDrop}
      >
        <span className="flex items-center border-line-strong border-r px-3.5">
          <motion.span
            animate={inserted ? { x: [-22, 0], rotate: [-35, 0], opacity: [0, 1] } : {}}
            className="inline-flex text-ink"
            key={inserted}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
          >
            <KeyRound className="size-5" />
          </motion.span>
        </span>
        <button
          className="min-w-0 flex-1 truncate px-3.5 py-3 text-left text-sm"
          disabled={disabled}
          onClick={() => input.current?.click()}
          type="button"
        >
          {fileName ? <span className="font-medium text-ink">{fileName}</span> : <span className="text-ink-2">{placeholder}</span>}
        </button>
        <button
          aria-label="Parcourir"
          className={cn("flex items-center px-3.5 transition-transform hover:scale-110", accent)}
          disabled={disabled}
          onClick={() => input.current?.click()}
          type="button"
        >
          <FolderOpen className="size-5" />
        </button>
        <input
          accept={accept}
          className="hidden"
          id={id}
          onChange={(e) => {
            take(e.target.files?.[0]);
            e.target.value = "";
          }}
          ref={input}
          type="file"
        />
      </div>

      {allowPaste && (
        <div className="mt-2">
          <button
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink"
            onClick={() => setPasting((p) => !p)}
            type="button"
          >
            <ClipboardPaste className="size-3.5" />
            {pasting ? "Masquer le collage" : "Ou coller le texte de la clé"}
          </button>
          <AnimatePresence initial={false}>
            {pasting && (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
              >
                <div className="pt-2">
                  <textarea
                    className="mono-tight h-28 w-full resize-none rounded-xl border border-line-strong bg-zone p-3 text-[11px] leading-relaxed text-ink outline-none focus:border-step"
                    onChange={(e) => setPasted(e.target.value)}
                    placeholder={"-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOC...\n-----END PUBLIC KEY-----"}
                    spellCheck={false}
                    value={pasted}
                  />
                  <button
                    className="mt-2 rounded-lg bg-chip px-3 py-1.5 text-xs font-semibold text-chip-text transition-colors hover:bg-blue-btn disabled:opacity-50"
                    disabled={!pasted.trim()}
                    onClick={() => {
                      onText(pasted, "Clé collée");
                      setInserted((n) => n + 1);
                      setPasting(false);
                      setPasted("");
                    }}
                    type="button"
                  >
                    Utiliser ce texte
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
