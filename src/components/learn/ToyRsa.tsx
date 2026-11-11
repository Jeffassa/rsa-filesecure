import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Notice } from "@/components/kit/misc";
import { decryptNumber, encryptNumber, gcd, toyKey } from "@/crypto/textbook";
import { cn } from "@/lib/utils";
import { ModClock } from "./ModClock";

const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const E_CHOICES = [3, 5, 7, 11, 13, 17, 257];

function PrimePicker({ label, value, other, onChange }: { label: string; value: number; other: number; onChange: (p: number) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-ink-2">{label}</p>
      <div className="flex flex-wrap gap-1">
        {PRIMES.map((p) => (
          <button
            className={cn(
              "relative h-8 min-w-9 rounded-lg px-1.5 font-mono text-xs font-medium transition-colors",
              p === value ? "text-white" : p === other ? "cursor-not-allowed text-ink-3 line-through" : "bg-zone text-ink-2 hover:bg-chip",
            )}
            disabled={p === other}
            key={p}
            onClick={() => onChange(p)}
            type="button"
          >
            {p === value && <motion.span className="btn-violet absolute inset-0 rounded-lg" layoutId={`prime-${label}`} transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
            <span className="relative">{p}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Formula({ i, title, expr, value, note }: { i: number; title: string; expr: string; value: number; note?: string }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-line bg-white p-3.5"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: i * 0.12 }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{title}</p>
      <p className="mt-1 font-mono text-[13px] text-ink-2">{expr}</p>
      <p className="mt-0.5 text-2xl font-bold text-ink">
        <NumberFlow format={{ useGrouping: false }} value={value} />
      </p>
      {note && <p className="mt-0.5 text-[11px] text-ink-3">{note}</p>}
    </motion.div>
  );
}

export function ToyRsa() {
  const [p, setP] = useState(61);
  const [q, setQ] = useState(53);
  const [ePick, setEPick] = useState(17);
  const [message, setMessage] = useState("BINOME");

  const phi = (p - 1) * (q - 1);
  const eValid = gcd(BigInt(ePick), BigInt(phi)) === 1n && ePick < phi;
  const key = useMemo(() => (eValid ? toyKey(BigInt(p), BigInt(q), BigInt(ePick)) : null), [p, q, ePick, eValid]);
  const n = p * q;
  const tooSmall = n <= 255;

  const rows = useMemo(() => {
    if (!key || tooSmall) return [];
    return Array.from(message.slice(0, 10)).map((ch) => {
      const m = BigInt(Math.min(ch.charCodeAt(0), 255));
      const c = encryptNumber(m, key);
      return { ch, m, c, back: decryptNumber(c, key) };
    });
  }, [key, message, tooSmall]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <PrimePicker label="Premier nombre premier p" onChange={setP} other={q} value={p} />
        <PrimePicker label="Second nombre premier q" onChange={setQ} other={p} value={q} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" key={`${p}-${q}`}>
        <Formula expr={`${p} × ${q}`} i={0} note="public" title="1. Module n = p × q" value={n} />
        <Formula expr={`(${p} − 1) × (${q} − 1)`} i={1} note="secret : il faut p et q" title="2. Indicatrice φ(n)" value={phi} />
        <div className="rounded-xl border border-line bg-white p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">3. Exposant public e</p>
          <p className="mt-1 text-[12px] text-ink-2">premier avec φ(n)</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {E_CHOICES.map((e) => {
              const ok = gcd(BigInt(e), BigInt(phi)) === 1n && e < phi;
              return (
                <button
                  className={cn(
                    "rounded-md px-2 py-1 font-mono text-xs",
                    e === ePick ? "bg-violet text-white" : ok ? "bg-zone text-ink-2 hover:bg-chip" : "text-ink-3 line-through",
                  )}
                  disabled={!ok}
                  key={e}
                  onClick={() => setEPick(e)}
                  title={ok ? undefined : `pgcd(${e}, ${phi}) ≠ 1`}
                  type="button"
                >
                  {e}
                </button>
              );
            })}
          </div>
        </div>
        {key ? (
          <Formula expr={`${ePick}⁻¹ mod ${phi}`} i={3} note={`vérification : ${ePick} × ${key.d} mod ${phi} = 1`} title="4. Exposant privé d" value={Number(key.d)} />
        ) : (
          <Notice tone="warning">e = {ePick} n'est pas premier avec φ(n). Choisissez un autre e.</Notice>
        )}
      </div>

      {key && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#d5daf6] bg-blue-soft p-3.5">
            <p className="text-sm font-bold text-blue-text">Clé publique (n, e)</p>
            <p className="mt-0.5 font-mono text-lg text-ink">
              ({n}, {ePick})
            </p>
          </div>
          <div className="rounded-xl border border-[#dcd8f7] bg-violet-soft p-3.5">
            <p className="text-sm font-bold text-violet-deep">Clé privée (n, d)</p>
            <p className="mt-0.5 font-mono text-lg text-ink">
              ({n}, {key.d.toString()})
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-[#f7f8fc] p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-ink-2" htmlFor="toy-msg">
              Message à chiffrer, lettre par lettre (10 caractères au plus)
            </label>
            <input
              className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 font-mono text-sm uppercase text-ink outline-none focus:border-step"
              id="toy-msg"
              maxLength={10}
              onChange={(e) => setMessage(e.target.value.toUpperCase())}
              value={message}
            />
          </div>
          <p className="pb-2 text-xs text-ink-3">Chaque lettre devient son code (A = 65), puis c = m^e mod n.</p>
        </div>
        {tooSmall && <Notice className="mt-3" tone="warning">n = {n} est trop petit pour coder un caractère (il faut n &gt; 255).</Notice>}
        {rows.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-center font-mono text-sm">
              <thead>
                <tr className="text-[11px] text-ink-3">
                  <th className="pb-2 text-left font-sans font-semibold">Étape</th>
                  {rows.map((r, i) => (
                    <th className="pb-2 font-semibold" key={i}>
                      {r.ch === " " ? "espace" : r.ch}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "m (code)", get: (r: (typeof rows)[0]) => r.m.toString(), cls: "text-ink" },
                  { label: "c = m^e mod n", get: (r: (typeof rows)[0]) => r.c.toString(), cls: "text-violet font-semibold" },
                  { label: "c^d mod n", get: (r: (typeof rows)[0]) => r.back.toString(), cls: "text-green font-semibold" },
                ].map((line, li) => (
                  <tr className="border-line border-t" key={line.label}>
                    <td className="py-2 text-left font-sans text-[11px] text-ink-2">{line.label}</td>
                    {rows.map((r, i) => (
                      <td className={cn("py-2", line.cls)} key={`${i}-${r.c}`}>
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block"
                            initial={{ opacity: 0, y: 8 }}
                            key={`${message}-${p}-${q}-${ePick}`}
                            transition={{ delay: li * 0.25 + i * 0.05 }}
                          >
                            {line.get(r)}
                          </motion.span>
                        </AnimatePresence>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {key && rows[0] && (
          <div className="mt-6 border-line border-t pt-5">
            <ModClock
              e={key.e}
              label={`Chiffrement de « ${rows[0].ch} » : ${rows[0].m}^${ePick} mod ${n} = ${rows[0].c}`}
              m={rows[0].m}
              n={key.n}
            />
          </div>
        )}
      </div>
    </div>
  );
}
