import { Badge } from "@/components/ui/badge";
import { formatCount, formatNumber } from "@/lib/format";
import {
  CLO_VALUE,
  MET_RATE,
  SLING_LOAD_KG,
  TARGET_INTERIOR_C,
  comfortVerdict,
} from "@/lib/physics";
import type { ParetoPoint } from "@/types/domain";
import { Flame, Package, Thermometer, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface VerdictPanelProps {
  point: ParetoPoint;
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  tone = "primary",
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  tone?: "primary" | "accent" | "muted";
  hint?: string;
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-primary";
  return (
    <div className="surface-inset rounded-sm px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <Icon
          className="h-3.5 w-3.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="label-tech truncate">{label}</p>
      </div>
      <p className={`readout mt-1 text-base ${toneClass}`}>
        {value}
        {unit ? (
          <span className="ml-1 text-[0.625rem] text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      {hint ? (
        <p className="mt-1 text-[0.625rem] leading-tight text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Operational verdict: fuel payload, ASHRAE-55 comfort and CPWD logistics. */
export function VerdictPanel({ point }: VerdictPanelProps) {
  const verdict = comfortVerdict(point.pmv);
  const comfortable = point.pmv >= -0.5 && point.pmv <= 0.5;

  return (
    <section
      data-ocid="optimize.verdict_panel"
      className="panel rounded-sm p-3"
      aria-label="Operational verdict"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-foreground">
          Operational verdict
        </h2>
        <span className="label-tech">+{TARGET_INTERIOR_C} °C target</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric
          icon={Flame}
          label="Bukhari payload"
          value={formatNumber(point.keroseneLitresPer24h, 1)}
          unit="L/24h"
          tone="accent"
          hint="Kerosene to hold the +15 °C target"
        />
        <Metric
          icon={Thermometer}
          label="PMV"
          value={formatNumber(point.pmv, 2)}
          tone={comfortable ? "primary" : "accent"}
          hint={`${formatNumber(MET_RATE, 1)} met · ${formatNumber(CLO_VALUE, 1)} clo`}
        />
        <Metric
          icon={Users}
          label="PPD"
          value={formatNumber(point.ppd, 1)}
          unit="%"
          tone="muted"
          hint="Predicted dissatisfied"
        />
        <Metric
          icon={Package}
          label="Structural weight"
          value={formatNumber(point.structuralWeightKg, 0)}
          unit="kg"
          tone="muted"
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Metric
          icon={Package}
          label="Airlift sorties"
          value={formatCount(BigInt(point.airliftSorties))}
          unit="lifts"
          hint={`${SLING_LOAD_KG} kg sling load`}
        />
        <Metric
          icon={Users}
          label="Sapper effort"
          value={formatNumber(point.sapperManHours, 1)}
          unit="man-h"
          tone="muted"
          hint="Erection man-hours"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span className="label-tech">ASHRAE-55 comfort</span>
        <Badge
          data-ocid="optimize.comfort_verdict"
          variant="outline"
          className={`shrink-0 rounded-sm ${
            comfortable
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-accent/50 bg-accent/10 text-accent"
          }`}
        >
          {verdict}
        </Badge>
      </div>
    </section>
  );
}
