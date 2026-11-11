import { CheckCircle2, Circle, FlaskConical, Gauge as GaugeIcon, Loader2, Play, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Notice, PageHeader } from "@/components/kit/misc";
import { SimpleBars } from "@/components/learn/SimpleBars";
import { KEY_SIZES, rsaParams } from "@/crypto/keys";
import { SELF_TESTS } from "@/crypto/selftest";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = "idle" | "running" | "pass" | "fail";
interface Row {
  status: Status;
  detail?: string;
  ms?: number;
}

export function TestsPage() {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [running, setRunning] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  async function runAll() {
    setRunning(true);
    setRows({});
    setTotal(null);
    const start = performance.now();
    for (const t of SELF_TESTS) {
      setRows((r) => ({ ...r, [t.id]: { status: "running" } }));
      const s = performance.now();
      try {
        const detail = await t.run();
        setRows((r) => ({ ...r, [t.id]: { status: "pass", detail, ms: performance.now() - s } }));
      } catch (e) {
        setRows((r) => ({ ...r, [t.id]: { status: "fail", detail: e instanceof Error ? e.message : String(e), ms: performance.now() - s } }));
      }
      await new Promise((r) => setTimeout(r, 90));
    }
    setTotal(performance.now() - start);
    setRunning(false);
  }

  const passed = Object.values(rows).filter((r) => r.status === "pass").length;
  const failed = Object.values(rows).filter((r) => r.status === "fail").length;
  const done = passed + failed;

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Les mêmes cas que les tests automatiques du projet (npm test), exécutés ici dans votre navigateur."
        title="Tests"
      />

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative size-20">
            <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" fill="none" r="34" stroke="#e1e3f0" strokeWidth="7" />
              <motion.circle
                animate={{ pathLength: done / SELF_TESTS.length }}
                cx="40"
                cy="40"
                fill="none"
                initial={{ pathLength: 0 }}
                r="34"
                stroke={failed ? "#c24545" : "#039f7a"}
                strokeLinecap="round"
                strokeWidth="7"
              />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-ink">{passed}</span>
              <span className="text-[10px] text-ink-3">sur {SELF_TESTS.length}</span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-ink">
              {done === 0 ? "Prêt à lancer" : running ? "Tests en cours..." : failed ? `${failed} test${failed > 1 ? "s" : ""} en échec` : "Tous les tests réussissent"}
            </p>
            <p className="text-sm text-ink-2">
              {total !== null ? `Terminé en ${formatDuration(total)}.` : "Génération de clés, chiffrement, modifications, mauvaises clés, cas limites."}
            </p>
          </div>
          <motion.button
            className="btn-violet flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-70"
            disabled={running}
            onClick={runAll}
            type="button"
            whileTap={{ scale: 0.97 }}
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {running ? "En cours" : done ? "Relancer" : "Tout lancer"}
          </motion.button>
        </div>

        <ol className="mt-6 divide-y divide-line">
          {SELF_TESTS.map((t, i) => {
            const r = rows[t.id] ?? { status: "idle" as Status };
            return (
              <motion.li
                animate={{ opacity: 1 }}
                className={cn("flex items-start gap-3 py-3 transition-colors", r.status === "running" && "bg-violet-soft/40")}
                initial={{ opacity: 0 }}
                key={t.id}
                transition={{ delay: i * 0.02 }}
              >
                <span className="mt-0.5">
                  <AnimatePresence mode="popLayout">
                    <motion.span animate={{ scale: 1 }} className="inline-flex" initial={{ scale: 0.4 }} key={r.status} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                      {r.status === "idle" && <Circle className="size-5 text-line-strong" />}
                      {r.status === "running" && <Loader2 className="size-5 animate-spin text-violet" />}
                      {r.status === "pass" && <CheckCircle2 className="size-5 text-green" />}
                      {r.status === "fail" && <XCircle className="size-5 text-danger" />}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    <span className="mr-2 font-mono text-xs text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                    {t.title}
                  </p>
                  <p className="text-xs text-ink-3">Attendu : {t.expected}</p>
                  {r.detail && (
                    <motion.p animate={{ opacity: 1 }} className={cn("mt-0.5 text-xs", r.status === "fail" ? "text-danger" : "text-green-deep")} initial={{ opacity: 0 }}>
                      {r.status === "pass" ? "Obtenu : " : "Échec : "}
                      {r.detail}
                    </motion.p>
                  )}
                </div>
                {r.ms !== undefined && <span className="font-mono text-xs text-ink-3">{formatDuration(r.ms)}</span>}
              </motion.li>
            );
          })}
        </ol>
      </section>

      <KeyGenBenchmark />
    </div>
  );
}

function KeyGenBenchmark() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  async function measure() {
    const id = ++runId.current;
    setData([]);
    setError(null);
    try {
      for (const bits of KEY_SIZES) {
        setCurrent(bits);
        const s = performance.now();
        await crypto.subtle.generateKey(rsaParams(bits), false, ["encrypt", "decrypt"]);
        if (runId.current !== id) return;
        const ms = performance.now() - s;
        setData((d) => [...d, { name: `${bits} bits`, value: Math.round(ms) }]);
      }
    } catch {
      setError("La mesure a échoué dans ce navigateur.");
    } finally {
      if (runId.current === id) setCurrent(null);
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-11 items-center justify-center rounded-xl bg-blue-soft text-blue">
          <GaugeIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-ink">Temps de génération des clés</h2>
          <p className="text-sm text-ink-2">Mesuré sur cette machine. Le temps varie d'un essai à l'autre : la recherche de nombres premiers est aléatoire.</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl bg-chip px-4 py-2.5 text-sm font-semibold text-chip-text transition-colors hover:bg-blue-btn disabled:opacity-60"
          disabled={current !== null}
          onClick={measure}
          type="button"
        >
          {current ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
          {current ? `RSA ${current} en cours...` : "Mesurer"}
        </button>
      </div>
      {error && <Notice className="mt-4" tone="error">{error}</Notice>}
      {data.length > 0 && (
        <div className="mt-5">
          <SimpleBars color="#4a6be2" data={data} format={(v) => formatDuration(v)} signature={String(data.length)} />
        </div>
      )}
    </section>
  );
}
