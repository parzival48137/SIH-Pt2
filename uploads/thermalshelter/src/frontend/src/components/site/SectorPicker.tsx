import { SECTOR_PRESETS } from "@/lib/sectors";
import type { Sector } from "@/types/domain";
import { Check } from "lucide-react";

interface SectorPickerProps {
  value: Sector;
  onChange: (sector: Sector) => void;
}

/**
 * Four operational sector presets. Selecting one sets the active site's
 * reference coordinates and nominal ground elevation.
 */
export function SectorPicker({ value, onChange }: SectorPickerProps) {
  return (
    <fieldset data-ocid="site.sector_picker" className="grid grid-cols-2 gap-2">
      <legend className="sr-only">Operational sector preset</legend>
      {SECTOR_PRESETS.map((preset) => {
        const selected = preset.sector === value;
        return (
          <label
            key={preset.sector}
            data-ocid={`site.sector.${preset.sector}`}
            className={`transition-smooth relative flex min-h-[64px] cursor-pointer flex-col items-start justify-between gap-1 rounded-sm border p-2.5 text-left focus-within:ring-2 focus-within:ring-ring ${
              selected
                ? "border-primary/70 bg-primary/10"
                : "border-border bg-secondary/60 hover:border-primary/40 hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              name="site-sector"
              value={preset.sector}
              checked={selected}
              onChange={() => onChange(preset.sector)}
              className="sr-only"
            />
            <span className="flex w-full items-start justify-between gap-1">
              <span
                className={`font-display text-[0.8125rem] font-semibold leading-tight ${
                  selected ? "text-primary" : "text-foreground"
                }`}
              >
                {preset.name}
              </span>
              {selected ? (
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
              ) : null}
            </span>
            <span className="label-tech leading-tight">
              {preset.descriptor}
            </span>
            <span className="readout text-[0.625rem] text-muted-foreground">
              {preset.latitude.toFixed(2)}°N · {preset.longitude.toFixed(2)}°E ·{" "}
              {preset.altitudeM} m
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
