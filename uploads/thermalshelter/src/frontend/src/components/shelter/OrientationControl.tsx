import { Slider } from "@/components/ui/slider";
import { clamp } from "@/lib/format";
import { Compass } from "lucide-react";

interface OrientationControlProps {
  /** Compass azimuth in degrees clockwise from true north. */
  value: number;
  onChange: (value: number) => void;
}

const CARDINALS = [
  { label: "N", azimuth: 0 },
  { label: "E", azimuth: 90 },
  { label: "S", azimuth: 180 },
  { label: "W", azimuth: 270 },
];

function compassLabel(azimuth: number): string {
  const normalized = ((azimuth % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][index];
}

/**
 * Compass azimuth for the shelter's long axis. Rotating the shelter aligns its
 * wall solar exposure to true north.
 */
export function OrientationControl({
  value,
  onChange,
}: OrientationControlProps) {
  const normalized = ((value % 360) + 360) % 360;

  return (
    <div data-ocid="shelter.orientation_control" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <span className="label-tech flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          Orientation
        </span>
        <span className="flex items-baseline gap-1.5">
          <span
            data-ocid="shelter.orientation_readout"
            className="readout text-xl text-primary"
          >
            {normalized.toFixed(0)}°
          </span>
          <span className="label-tech">{compassLabel(normalized)}</span>
        </span>
      </div>

      <Slider
        data-ocid="shelter.orientation_slider"
        value={[normalized]}
        min={0}
        max={359}
        step={1}
        aria-label="Shelter orientation azimuth in degrees"
        onValueChange={(next) => onChange(clamp(next[0] ?? 0, 0, 359))}
      />

      <div className="grid grid-cols-4 gap-1.5">
        {CARDINALS.map((cardinal) => {
          const active = Math.abs(normalized - cardinal.azimuth) < 1;
          return (
            <button
              key={cardinal.label}
              type="button"
              data-ocid={`shelter.orientation.${cardinal.label.toLowerCase()}`}
              onClick={() => onChange(cardinal.azimuth)}
              className={`transition-smooth min-h-[36px] rounded-sm border font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "border-primary/70 bg-primary/10 text-primary"
                  : "border-border bg-secondary/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {cardinal.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
