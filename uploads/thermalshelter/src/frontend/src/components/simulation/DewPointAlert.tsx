import { formatHour, formatNumber } from "@/lib/format";
import type { SimulationResult } from "@/types/domain";
import { AlertTriangle, Droplets, ShieldCheck } from "lucide-react";

interface DewPointAlertProps {
  result: SimulationResult;
}

/** Dew-point breach alert: fires when an interior surface reaches the dew point. */
export function DewPointAlert({ result }: DewPointAlertProps) {
  if (!result.dewPointBreach || result.breachHour === null) {
    return (
      <section
        data-ocid="simulate.dewpoint_ok"
        className="panel flex items-center gap-2.5 rounded-sm p-3"
        aria-label="Dew-point status"
      >
        <ShieldCheck
          className="h-4 w-4 shrink-0 text-success"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-display text-[0.8125rem] font-semibold text-foreground">
            No condensation risk
          </p>
          <p className="text-[0.6875rem] leading-tight text-muted-foreground">
            Interior surfaces stay above the dew point across all 24 hours.
          </p>
        </div>
      </section>
    );
  }

  const hour = result.breachHour;
  const surface = result.surfaceC[hour];
  const dew = result.dewPointC[hour];
  const margin = surface - dew;

  return (
    <section
      data-ocid="simulate.dewpoint_alert"
      role="alert"
      className="rounded-sm border border-destructive/60 bg-destructive/10 p-3"
      aria-label="Dew-point breach alert"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.8125rem] font-semibold text-destructive">
            Dew-point breach at {formatHour(hour)}
          </p>
          <p className="mt-0.5 text-[0.6875rem] leading-tight text-muted-foreground">
            Interior surface temperature has fallen to or below the dew point —
            condensation and frost will form on the envelope.
          </p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <div className="surface-inset rounded-sm px-2.5 py-2">
          <p className="label-tech">Surface</p>
          <p className="readout mt-1 text-sm text-destructive">
            {formatNumber(surface, 1)}
            <span className="ml-1 text-[0.625rem] text-muted-foreground">
              °C
            </span>
          </p>
        </div>
        <div className="surface-inset rounded-sm px-2.5 py-2">
          <p className="label-tech">Dew point</p>
          <p className="readout mt-1 text-sm text-destructive">
            {formatNumber(dew, 1)}
            <span className="ml-1 text-[0.625rem] text-muted-foreground">
              °C
            </span>
          </p>
        </div>
        <div className="surface-inset rounded-sm px-2.5 py-2">
          <p className="label-tech">Margin</p>
          <p className="readout mt-1 text-sm text-destructive">
            {formatNumber(margin, 1)}
            <span className="ml-1 text-[0.625rem] text-muted-foreground">
              K
            </span>
          </p>
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[0.625rem] text-muted-foreground">
        <Droplets className="h-3 w-3 shrink-0" aria-hidden="true" />
        Raise insulation or reduce air changes to lift the surface temperature.
      </p>
    </section>
  );
}
