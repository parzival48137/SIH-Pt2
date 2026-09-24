import { Badge } from "@/components/ui/badge";
import { formatInr, formatNumber } from "@/lib/format";
import { CORE_DESCRIPTORS, CORE_LABELS } from "@/lib/pareto";
import type { ParetoPoint } from "@/types/domain";
import { Check, Layers, Ruler, Square } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ConfigDetailCardProps {
  point: ParetoPoint;
  /** Loads this configuration into the shared store for the simulation. */
  onLoad: () => void;
  loaded: boolean;
}

function SpecRow({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="surface-inset flex items-center gap-2 rounded-sm px-2.5 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="label-tech">{label}</p>
        <p className="readout mt-0.5 truncate text-sm text-foreground">
          {value}
          {unit ? (
            <span className="ml-1 text-[0.625rem] text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

/** Detail for the selected design point: geometry, cost and daily fuel. */
export function ConfigDetailCard({
  point,
  onLoad,
  loaded,
}: ConfigDetailCardProps) {
  const { config } = point;

  return (
    <section
      data-ocid="optimize.config_detail"
      className="panel rounded-sm p-3"
      aria-label="Selected configuration detail"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="label-tech">Selected configuration</p>
          <h2 className="truncate font-display text-sm font-semibold text-foreground">
            {CORE_LABELS[config.thermalMassCore]} core
          </h2>
        </div>
        {point.onFront ? (
          <Badge
            data-ocid="optimize.config_detail.front_badge"
            variant="outline"
            className="shrink-0 gap-1 rounded-sm border-primary/50 bg-primary/10 text-primary"
          >
            <Check className="h-3 w-3" aria-hidden="true" />
            On front
          </Badge>
        ) : (
          <Badge
            data-ocid="optimize.config_detail.dominated_badge"
            variant="outline"
            className="shrink-0 rounded-sm border-border bg-secondary text-muted-foreground"
          >
            Dominated
          </Badge>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SpecRow
          icon={Layers}
          label="Insulation"
          value={formatNumber(Number(config.insulationThicknessMm), 0)}
          unit="mm"
        />
        <SpecRow
          icon={Square}
          label="Window / wall"
          value={formatNumber(Number(config.windowToWallRatioPct), 0)}
          unit="%"
        />
        <SpecRow
          icon={Ruler}
          label="Thermal-mass core"
          value={CORE_LABELS[config.thermalMassCore]}
        />
        <SpecRow
          icon={Ruler}
          label="Capital cost"
          value={formatInr(point.capitalCostInr)}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="surface-inset rounded-sm px-2.5 py-2">
          <p className="label-tech">Daily fuel burn</p>
          <p className="readout mt-1 text-base text-accent">
            {formatNumber(point.keroseneLitresPer24h, 1)}
            <span className="ml-1 text-[0.625rem] text-muted-foreground">
              L/24h
            </span>
          </p>
        </div>
        <div className="surface-inset rounded-sm px-2.5 py-2">
          <p className="label-tech">Structural weight</p>
          <p className="readout mt-1 text-base text-primary">
            {formatNumber(point.structuralWeightKg, 0)}
            <span className="ml-1 text-[0.625rem] text-muted-foreground">
              kg
            </span>
          </p>
        </div>
      </div>

      <p className="mt-2 text-[0.625rem] leading-tight text-muted-foreground">
        {CORE_DESCRIPTORS[config.thermalMassCore]}
      </p>

      <button
        type="button"
        data-ocid="optimize.load_config_button"
        onClick={onLoad}
        disabled={loaded}
        className="transition-smooth mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm border border-primary/60 bg-primary/10 px-3 py-2 font-display text-sm font-semibold text-primary hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground"
      >
        {loaded ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Loaded into simulation
          </>
        ) : (
          "Load into simulation"
        )}
      </button>
    </section>
  );
}
