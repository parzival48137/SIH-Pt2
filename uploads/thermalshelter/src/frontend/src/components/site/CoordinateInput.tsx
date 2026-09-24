import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clamp } from "@/lib/format";
import { Crosshair } from "lucide-react";

interface CoordinateInputProps {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  /** True when the current coordinates differ from the selected preset. */
  isCustom: boolean;
  onResetToPreset: () => void;
}

/**
 * Manual latitude / longitude entry. Values are held as strings so the user
 * can type freely; the page parses and clamps them on apply.
 */
export function CoordinateInput({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  isCustom,
  onResetToPreset,
}: CoordinateInputProps) {
  const latValue = Number.parseFloat(latitude);
  const lonValue = Number.parseFloat(longitude);
  const latValid = Number.isFinite(latValue) && Math.abs(latValue) <= 90;
  const lonValid = Number.isFinite(lonValue) && Math.abs(lonValue) <= 180;

  return (
    <div data-ocid="site.coordinate_input" className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="site-latitude" className="label-tech">
            Latitude °N
          </Label>
          <Input
            id="site-latitude"
            data-ocid="site.latitude_input"
            inputMode="decimal"
            autoComplete="off"
            value={latitude}
            onChange={(event) => onLatitudeChange(event.target.value)}
            aria-invalid={!latValid}
            className="readout h-11 rounded-sm border-input bg-background text-sm"
            placeholder="34.1526"
          />
          {!latValid ? (
            <p
              data-ocid="site.latitude_error"
              className="text-[0.6875rem] text-destructive"
            >
              Enter a latitude between −90 and 90.
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="site-longitude" className="label-tech">
            Longitude °E
          </Label>
          <Input
            id="site-longitude"
            data-ocid="site.longitude_input"
            inputMode="decimal"
            autoComplete="off"
            value={longitude}
            onChange={(event) => onLongitudeChange(event.target.value)}
            aria-invalid={!lonValid}
            className="readout h-11 rounded-sm border-input bg-background text-sm"
            placeholder="77.5771"
          />
          {!lonValid ? (
            <p
              data-ocid="site.longitude_error"
              className="text-[0.6875rem] text-destructive"
            >
              Enter a longitude between −180 and 180.
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="label-tech">
          {isCustom ? "Custom pin — off preset" : "Matches sector preset"}
        </p>
        {isCustom ? (
          <button
            type="button"
            data-ocid="site.reset_preset_button"
            onClick={onResetToPreset}
            className="transition-smooth flex min-h-[32px] items-center gap-1.5 rounded-sm border border-border bg-secondary px-2.5 py-1 text-muted-foreground hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="label-tech">Snap to preset</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Parse and clamp a coordinate string, returning null when unusable. */
export function parseCoordinate(value: string, limit: number): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return clamp(parsed, -limit, limit);
}
