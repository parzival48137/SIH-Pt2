import { formatHour, formatNumber } from "@/lib/format";
import { TARGET_INTERIOR_C } from "@/lib/physics";
import type { SimulationResult } from "@/types/domain";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TemperatureChartProps {
  result: SimulationResult;
}

interface ChartPoint {
  hour: number;
  label: string;
  ambient: number;
  interior: number;
}

interface TooltipPayloadEntry {
  dataKey?: string | number;
  value?: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadEntry[];
}

const SERIES = [
  { key: "interior", name: "Interior", color: "var(--chart-1)" },
  { key: "ambient", name: "Ambient", color: "var(--chart-3)" },
] as const;

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="panel rounded-sm px-2.5 py-2">
      <p className="label-tech">{typeof label === "string" ? label : ""}</p>
      <div className="mt-1 space-y-0.5">
        {SERIES.map((series) => {
          const entry = payload.find((item) => item.dataKey === series.key);
          if (!entry || typeof entry.value !== "number") return null;
          return (
            <p
              key={series.key}
              className="readout flex items-center gap-1.5 text-[0.6875rem]"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: series.color }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{series.name}</span>
              <span className="text-foreground">
                {formatNumber(entry.value, 1)} °C
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

/** Interactive 24-hour temperature chart: ambient, interior, +15 °C target. */
export function TemperatureChart({ result }: TemperatureChartProps) {
  const data: ChartPoint[] = result.interiorC.map((interior, hour) => ({
    hour,
    label: formatHour(hour),
    ambient: result.ambientC[hour],
    interior,
  }));

  const values = [...result.interiorC, ...result.ambientC, TARGET_INTERIOR_C];
  const min = Math.floor(Math.min(...values) - 4);
  const max = Math.ceil(Math.max(...values) + 4);

  return (
    <section
      data-ocid="simulate.chart_panel"
      className="panel rounded-sm p-3"
      aria-label="24-hour interior temperature chart"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold text-foreground">
            24-hour thermal trace
          </h2>
          <p className="label-tech mt-0.5">Interior vs ambient vs target</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-3 rounded-full"
              style={{ backgroundColor: "var(--chart-1)" }}
              aria-hidden="true"
            />
            <span className="label-tech">Interior</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-3 rounded-full"
              style={{ backgroundColor: "var(--chart-3)" }}
              aria-hidden="true"
            />
            <span className="label-tech">Ambient</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-3 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
              aria-hidden="true"
            />
            <span className="label-tech text-accent">+15 °C target</span>
          </span>
        </div>
      </div>

      <div data-ocid="simulate.temperature_chart" className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="2 4"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              interval={3}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              domain={[min, max]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={44}
              unit="°"
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--border)" }}
            />
            <ReferenceLine
              y={TARGET_INTERIOR_C}
              stroke="var(--accent)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: "+15 °C",
                position: "insideTopRight",
                fill: "var(--accent)",
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="ambient"
              stroke="var(--chart-3)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="interior"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="label-tech shrink-0">Thermal ramp</span>
        <span
          className="thermal-ramp h-1.5 flex-1 rounded-full"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
