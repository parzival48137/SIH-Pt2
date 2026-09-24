import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatInr, formatNumber } from "@/lib/format";
import { configKey } from "@/lib/pareto";
import type { ParetoPoint } from "@/types/domain";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

interface ParetoChartProps {
  points: ParetoPoint[];
  selectedKey: string | null;
  onSelect: (point: ParetoPoint) => void;
}

const chartConfig = {
  front: { label: "Pareto front", color: "oklch(var(--primary))" },
  dominated: { label: "Dominated", color: "oklch(var(--muted-foreground))" },
} satisfies ChartConfig;

interface ChartDatum {
  key: string;
  cost: number;
  fuel: number;
  onFront: boolean;
  point: ParetoPoint;
}

/** Cost-versus-fuel scatter with the non-dominated front traced as a line. */
export function ParetoChart({
  points,
  selectedKey,
  onSelect,
}: ParetoChartProps) {
  const data = useMemo<ChartDatum[]>(
    () =>
      points.map((point) => ({
        key: configKey(point.config),
        cost: point.capitalCostInr,
        fuel: point.keroseneLitresPer24h,
        onFront: point.onFront,
        point,
      })),
    [points],
  );

  const frontData = useMemo(
    () => data.filter((datum) => datum.onFront).sort((a, b) => a.cost - b.cost),
    [data],
  );

  const selected = useMemo(
    () => data.find((datum) => datum.key === selectedKey) ?? null,
    [data, selectedKey],
  );

  if (points.length === 0) {
    return (
      <div
        data-ocid="optimize.chart.empty_state"
        className="surface-inset flex h-56 items-center justify-center rounded-sm"
      >
        <p className="label-tech">No configurations evaluated</p>
      </div>
    );
  }

  return (
    <div data-ocid="optimize.chart" className="w-full">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-64 w-full [&_.recharts-dot]:cursor-pointer"
      >
        <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="oklch(var(--border))" />
          <XAxis
            type="number"
            dataKey="cost"
            name="Capital cost"
            tickFormatter={(value: number) => formatInr(value)}
            tick={{ fontSize: 10 }}
            stroke="oklch(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="number"
            dataKey="fuel"
            name="Kerosene"
            tickFormatter={(value: number) => formatNumber(value, 0)}
            tick={{ fontSize: 10 }}
            stroke="oklch(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <ZAxis range={[36, 36]} />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(_value, _name, item) => {
                  const datum = item.payload as ChartDatum;
                  return (
                    <div className="grid gap-1">
                      <span className="font-mono text-[0.6875rem] text-foreground">
                        {formatInr(datum.cost)} · {formatNumber(datum.fuel, 1)}{" "}
                        L
                      </span>
                      <span className="text-[0.625rem] text-muted-foreground">
                        {datum.onFront ? "On Pareto front" : "Dominated"}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Scatter
            name="Dominated"
            data={data.filter((datum) => !datum.onFront)}
            fill="oklch(var(--muted-foreground))"
            fillOpacity={0.45}
            onClick={(entry) => {
              const datum = entry as unknown as ChartDatum;
              if (datum?.point) onSelect(datum.point);
            }}
          />
          <Scatter
            name="Pareto front"
            data={data.filter((datum) => datum.onFront)}
            fill="oklch(var(--primary))"
            onClick={(entry) => {
              const datum = entry as unknown as ChartDatum;
              if (datum?.point) onSelect(datum.point);
            }}
          />
          <Line
            data={frontData}
            dataKey="fuel"
            type="monotone"
            stroke="oklch(var(--primary))"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          />
          {selected ? (
            <Scatter
              name="Selected"
              data={[selected]}
              fill="oklch(var(--accent))"
              shape="diamond"
            />
          ) : null}
        </ScatterChart>
      </ChartContainer>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="label-tech">Capital cost →</span>
        <span className="label-tech">Kerosene L/24h ↑</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-primary"
            aria-hidden="true"
          />
          <span className="label-tech">Pareto front</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/50"
            aria-hidden="true"
          />
          <span className="label-tech">Dominated</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rotate-45 bg-accent" aria-hidden="true" />
          <span className="label-tech">Selected</span>
        </span>
      </div>
    </div>
  );
}
