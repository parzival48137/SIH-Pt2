import { formatNumber } from "@/lib/format";
import { TARGET_INTERIOR_C } from "@/lib/physics";
import type { SimulationResult } from "@/types/domain";
import { CheckCircle2, TrendingDown, XCircle } from "lucide-react";

interface SimulationReadoutsProps {
  result: SimulationResult;
  /** Interior volume used for the run, m^3. */
  interiorVolumeM3: number;
}

interface ReadoutProps {
  ocid: string;
  label: string;
  value: string;
  unit: string;
  tone?: "primary" | "accent" | "muted";
}

function Readout({ ocid, label, value, unit, tone = "primary" }: ReadoutProps) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-primary";
  return (
    <div data-ocid={ocid} className="surface-inset rounded-sm px-2.5 py-2">
      <p className="label-tech">{label}</p>
      <p className={`readout mt-1 text-base ${toneClass}`}>
        {value}
        <span className="ml-1 text-[0.625rem] text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  );
}

/** Key simulation readouts: min/mean interior, heat loss, target verdict. */
export function SimulationReadouts({
  result,
  interiorVolumeM3,
}: SimulationReadoutsProps) {
  const meanInterior =
    result.interiorC.reduce((total, value) => total + value, 0) /
    result.interiorC.length;
  const targetMet = result.minInteriorC >= TARGET_INTERIOR_C;
  const shortfall = TARGET_INTERIOR_C - result.minInteriorC;

  return (
    <section
      data-ocid="simulate.readouts"
      className="panel rounded-sm p-3"
      aria-label="Simulation readouts"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-foreground">
          Run readouts
        </h2>
        <span className="label-tech">24 h window</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout
          ocid="simulate.min_interior"
          label="Min interior"
          value={formatNumber(result.minInteriorC, 1)}
          unit="°C"
        />
        <Readout
          ocid="simulate.mean_interior"
          label="Mean interior"
          value={formatNumber(meanInterior, 1)}
          unit="°C"
        />
        <Readout
          ocid="simulate.peak_interior"
          label="Peak interior"
          value={formatNumber(result.peakInteriorC, 1)}
          unit="°C"
          tone="muted"
        />
        <Readout
          ocid="simulate.heat_loss"
          label="Heat loss"
          value={formatNumber(result.deficitKwh, 1)}
          unit="kWh"
          tone="accent"
        />
      </div>

      <div
        data-ocid="simulate.target_verdict"
        className={`mt-2 flex items-center gap-2.5 rounded-sm border p-2.5 ${
          targetMet
            ? "border-success/50 bg-success/10"
            : "border-accent/50 bg-accent/10"
        }`}
      >
        {targetMet ? (
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-success"
            aria-hidden="true"
          />
        ) : (
          <XCircle
            className="h-4 w-4 shrink-0 text-accent"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`font-display text-[0.8125rem] font-semibold ${
              targetMet ? "text-success" : "text-accent"
            }`}
          >
            {targetMet
              ? `+${TARGET_INTERIOR_C} °C target met`
              : `+${TARGET_INTERIOR_C} °C target missed`}
          </p>
          <p className="text-[0.6875rem] leading-tight text-muted-foreground">
            {targetMet
              ? "Interior stays above the target for the full 24 hours."
              : `Shortfall of ${formatNumber(shortfall, 1)} K at the coldest hour.`}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <TrendingDown
          className="h-3.5 w-3.5 shrink-0 text-accent"
          aria-hidden="true"
        />
        <p className="readout text-[0.6875rem] text-muted-foreground">
          Kerosene {formatNumber(result.keroseneLitresPer24h, 1)} L/24 h ·{" "}
          {formatNumber(interiorVolumeM3, 0)} m³ interior
        </p>
      </div>
    </section>
  );
}
