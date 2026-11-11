// Cadence des animations d'étapes.
//
// Le calcul cryptographique réel s'exécute à sa vitesse et signale son
// avancement. L'affichage suit ces signaux sans jamais les dépasser : une étape
// n'apparaît terminée que si elle l'est vraiment. En mode démonstration, chaque
// étape reste en plus affichée un temps minimal, pour qu'on puisse la suivre à l'oral.

export type StageStatus = "waiting" | "running" | "done" | "error";

export interface StageView {
  status: StageStatus;
  progress: number;
}

export interface PacedOptions {
  minStageMs: number;
  onUpdate: (views: StageView[]) => void;
  isActive?: () => boolean;
}

export function runPaced<S extends string, R>(
  stages: readonly S[],
  task: (report: (e: { stage: S; progress: number }) => void) => Promise<R>,
  { minStageMs, onUpdate, isActive = () => true }: PacedOptions,
): Promise<R> {
  const real = stages.map(() => 0);
  let current = 0;
  let finished = false;
  let failed = false;
  let error: unknown;
  let result: R;

  task(({ stage, progress }) => {
    const i = stages.indexOf(stage);
    if (i < 0) return;
    current = Math.max(current, i);
    for (let j = 0; j < i; j++) real[j] = 1;
    real[i] = Math.max(real[i], Math.min(1, progress));
  }).then(
    (r) => {
      result = r;
      real.fill(1);
      finished = true;
    },
    (e) => {
      error = e;
      failed = true;
      finished = true;
    },
  );

  return new Promise<R>((resolve, reject) => {
    let i = 0;
    let stageStart = performance.now();
    const shown = stages.map(() => 0);

    const emit = (errorAt = -1) =>
      onUpdate(
        stages.map((_, j) => ({
          status: j === errorAt ? "error" : j < i ? "done" : j === i ? "running" : "waiting",
          progress: j < i ? 1 : j === i ? shown[j] : 0,
        })),
      );

    // Image suivante, ou minuterie de secours : requestAnimationFrame s'arrête
    // quand la fenêtre est masquée, et le calcul ne doit pas rester bloqué.
    let token = 0;
    const schedule = () => {
      const mine = ++token;
      const run = () => {
        if (mine !== token) return;
        token++;
        tick();
      };
      requestAnimationFrame(run);
      setTimeout(run, 120);
    };

    const tick = () => {
      if (!isActive()) return;
      const now = performance.now();
      const elapsed = now - stageStart;

      if (i < stages.length) {
        const timeCap = minStageMs > 0 ? Math.min(1, elapsed / minStageMs) : 1;
        shown[i] = Math.min(real[i], timeCap);

        if (failed && i >= current && elapsed >= minStageMs * 0.6) {
          emit(i);
          reject(error);
          return;
        }
        if (shown[i] >= 1) {
          i++;
          stageStart = now;
        }
      }

      emit();
      if (i >= stages.length && finished && !failed) {
        resolve(result);
        return;
      }
      schedule();
    };
    schedule();
  });
}
