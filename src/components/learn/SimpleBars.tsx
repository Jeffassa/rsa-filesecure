import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";

/** Graphique en barres Bklit, avec les valeurs exactes rappelées sous le graphique. */
export function SimpleBars({
  data,
  color,
  format,
  signature,
}: {
  data: { name: string; value: number }[];
  color: string;
  format: (v: number) => string;
  signature?: string;
}) {
  return (
    <div>
      <BarChart
        aspectRatio="2.4 / 1"
        data={data}
        margin={{ top: 24, right: 12, bottom: 34, left: 12 }}
        revealSignature={signature}
        xDataKey="name"
      >
        <Grid horizontal numTicksRows={4} />
        <Bar dataKey="value" fill={color} lineCap={6} />
        <BarXAxis showAllLabels />
        <ChartTooltip showCrosshair={false} showDatePill={false} />
      </BarChart>
      <ul className="mt-2 flex flex-wrap justify-around gap-2 text-center text-xs text-ink-2">
        {data.map((d) => (
          <li key={d.name}>
            <span className="block font-mono text-sm font-semibold text-ink">{format(d.value)}</span>
            {d.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
