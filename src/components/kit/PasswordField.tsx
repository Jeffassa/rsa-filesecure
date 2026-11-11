import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useId, useState } from "react";
import { Gauge } from "@/components/charts/gauge";
import { cn } from "@/lib/utils";

/** Estimation simple de l'entropie : longueur et variété des caractères. */
export function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "#d3d7e6" };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  const unique = new Set(pw).size;
  const bits = Math.log2(Math.max(pool, 2)) * Math.min(pw.length, unique * 2);
  const score = Math.min(100, Math.round((bits / 80) * 100));
  if (score < 35) return { score, label: "Faible", color: "#c24545" };
  if (score < 60) return { score, label: "Moyen", color: "#a8670f" };
  if (score < 85) return { score, label: "Bon", color: "#4a6be2" };
  return { score, label: "Excellent", color: "#039f7a" };
}

export function PasswordField({
  label,
  value,
  onChange,
  showStrength = false,
  error,
  autoComplete = "new-password",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  showStrength?: boolean;
  error?: string | null;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const s = passwordStrength(value);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-2" htmlFor={id}>
        {label}
      </label>
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] focus-within:border-step focus-within:shadow-[0_0_0_4px_rgb(108_127_237/0.12)]",
          error ? "border-danger" : "border-line-strong",
        )}
      >
        <LockKeyhole className="ml-3.5 size-4 text-ink-3" />
        <input
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-3"
          id={id}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="px-3.5 text-ink-3 hover:text-ink"
          onClick={() => setVisible((v) => !v)}
          type="button"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showStrength && (
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1">
            <Gauge
              activeFill={s.color}
              inactiveFill="#e1e3f0"
              inactiveFillOpacity={1}
              linearHeight={8}
              orientation="linear"
              spacing={18}
              totalNotches={20}
              value={s.score}
            />
          </div>
          <span className="w-16 text-right text-xs font-semibold" style={{ color: s.color }}>
            {s.label}
          </span>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}
