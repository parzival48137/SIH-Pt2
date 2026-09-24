import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/lib/format";
import { FoundationMode } from "@/types/domain";
import { Flame, Layers, Snowflake, Users, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SimulationControlValues {
  insulationThicknessMm: number;
  ach: number;
  occupants: number;
  heatingKw: number;
  foundationMode: FoundationMode;
}

interface SimulationControlsProps {
  values: SimulationControlValues;
  onChange: (patch: Partial<SimulationControlValues>) => void;
}

interface SliderRowProps {
  ocid: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals: number;
  onChange: (value: number) => void;
}

function SliderRow({
  ocid,
  label,
  hint,
  icon: Icon,
  value,
  min,
  max,
  step,
  unit,
  decimals,
  onChange,
}: SliderRowProps) {
  return (
    <div className="surface-inset rounded-sm px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span className="label-tech truncate">{label}</span>
        </span>
        <span className="readout shrink-0 text-sm text-primary">
          {formatNumber(value, decimals)}
          <span className="ml-1 text-[0.625rem] text-muted-foreground">
            {unit}
          </span>
        </span>
      </div>
      <Slider
        data-ocid={ocid}
        className="mt-2.5"
        value={[value]}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        onValueChange={(next) => onChange(next[0])}
      />
      <p className="mt-1.5 text-[0.625rem] leading-tight text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

const FOUNDATION_OPTIONS: {
  mode: FoundationMode;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    mode: FoundationMode.slabOnGrade,
    label: "Slab on grade",
    hint: "2 °C permafrost sink",
    icon: Snowflake,
  },
  {
    mode: FoundationMode.elevatedSkids,
    label: "Elevated skids",
    hint: "Underfloor wind convection",
    icon: Wind,
  },
];

/** Adjustable simulation inputs: insulation, ACH, occupants, heating, foundation. */
export function SimulationControls({
  values,
  onChange,
}: SimulationControlsProps) {
  return (
    <section
      data-ocid="simulate.controls"
      className="panel rounded-sm p-3"
      aria-label="Simulation inputs"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-foreground">
          Run inputs
        </h2>
        <span className="label-tech">Re-runs on change</span>
      </div>

      <div className="mt-3 space-y-2">
        <SliderRow
          ocid="simulate.insulation_slider"
          label="Insulation"
          hint="Panel thickness — drives the envelope U-value."
          icon={Layers}
          value={values.insulationThicknessMm}
          min={20}
          max={300}
          step={5}
          unit="mm"
          decimals={0}
          onChange={(insulationThicknessMm) =>
            onChange({ insulationThicknessMm })
          }
        />
        <SliderRow
          ocid="simulate.ach_slider"
          label="Air changes"
          hint="0.5 sealed panels → 3.0 drafty canvas."
          icon={Wind}
          value={values.ach}
          min={0.5}
          max={3}
          step={0.1}
          unit="ACH"
          decimals={1}
          onChange={(ach) => onChange({ ach })}
        />
        <SliderRow
          ocid="simulate.occupants_slider"
          label="Occupants"
          hint="Sensible heat and vapour exhalation per person."
          icon={Users}
          value={values.occupants}
          min={0}
          max={12}
          step={1}
          unit="pax"
          decimals={0}
          onChange={(occupants) => onChange({ occupants })}
        />
        <SliderRow
          ocid="simulate.heating_slider"
          label="Active heating"
          hint="Kerosene heater output held through the 24 h run."
          icon={Flame}
          value={values.heatingKw}
          min={0}
          max={8}
          step={0.25}
          unit="kW"
          decimals={2}
          onChange={(heatingKw) => onChange({ heatingKw })}
        />
      </div>

      <div className="mt-3">
        <p className="label-tech">Foundation mode</p>
        <div
          data-ocid="simulate.foundation_toggle"
          className="mt-1.5 grid grid-cols-2 gap-2"
          aria-label="Foundation mode"
        >
          {FOUNDATION_OPTIONS.map((option) => {
            const selected = values.foundationMode === option.mode;
            const Icon = option.icon;
            return (
              <button
                key={option.mode}
                type="button"
                aria-pressed={selected}
                data-ocid={`simulate.foundation.${option.mode}`}
                onClick={() => onChange({ foundationMode: option.mode })}
                className={`transition-smooth flex min-h-[56px] flex-col items-start gap-1 rounded-sm border p-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected
                    ? "border-primary/70 bg-primary/10"
                    : "border-border bg-secondary/60 hover:border-primary/40 hover:bg-secondary"
                }`}
              >
                <span className="flex w-full items-center gap-1.5">
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      selected ? "text-primary" : "text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`font-display text-[0.8125rem] font-semibold leading-tight ${
                      selected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </span>
                </span>
                <span className="label-tech leading-tight">{option.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
