import { FoundationMode } from "@/types/domain";
import { Check } from "lucide-react";

/** A built-in shelter geometry preset. */
export interface ShelterPreset {
  id: string;
  name: string;
  descriptor: string;
  floorAreaM2: number;
  roofAreaM2: number;
  wallAreaNorthM2: number;
  wallAreaSouthM2: number;
  wallAreaEastM2: number;
  wallAreaWestM2: number;
  interiorVolumeM3: number;
  foundationMode: FoundationMode;
}

/** Built-in shelter geometries for the three standard field structures. */
export const SHELTER_PRESETS: ShelterPreset[] = [
  {
    id: "insulated-panel-hut",
    name: "Insulated panel hut",
    descriptor: "PUF sandwich panel · rigid shell",
    floorAreaM2: 18,
    roofAreaM2: 19.2,
    wallAreaNorthM2: 10.8,
    wallAreaSouthM2: 10.8,
    wallAreaEastM2: 7.2,
    wallAreaWestM2: 7.2,
    interiorVolumeM3: 46.8,
    foundationMode: FoundationMode.slabOnGrade,
  },
  {
    id: "canvas-tent",
    name: "Canvas tent",
    descriptor: "Ridge tent · light frame",
    floorAreaM2: 12,
    roofAreaM2: 15.6,
    wallAreaNorthM2: 4.2,
    wallAreaSouthM2: 4.2,
    wallAreaEastM2: 3.6,
    wallAreaWestM2: 3.6,
    interiorVolumeM3: 21.6,
    foundationMode: FoundationMode.elevatedSkids,
  },
  {
    id: "pcm-core-cabin",
    name: "PCM-core cabin",
    descriptor: "Phase-change core · high mass",
    floorAreaM2: 24,
    roofAreaM2: 25.6,
    wallAreaNorthM2: 13.2,
    wallAreaSouthM2: 13.2,
    wallAreaEastM2: 9.6,
    wallAreaWestM2: 9.6,
    interiorVolumeM3: 69.6,
    foundationMode: FoundationMode.slabOnGrade,
  },
];

interface PresetPickerProps {
  /** Preset id currently applied, or null when the geometry came from a file. */
  selectedId: string | null;
  onSelect: (preset: ShelterPreset) => void;
}

/** Three built-in shelter geometries that populate the geometry fields. */
export function PresetPicker({ selectedId, onSelect }: PresetPickerProps) {
  return (
    <div
      data-ocid="shelter.preset_picker"
      className="grid grid-cols-1 gap-2"
      role="radiogroup"
      aria-label="Shelter geometry preset"
    >
      {SHELTER_PRESETS.map((preset) => {
        const selected = preset.id === selectedId;
        return (
          <label
            key={preset.id}
            data-ocid={`shelter.preset.${preset.id}`}
            className={`transition-smooth flex min-h-[56px] cursor-pointer items-center justify-between gap-3 rounded-sm border p-3 text-left focus-within:ring-2 focus-within:ring-ring ${
              selected
                ? "border-primary/70 bg-primary/10"
                : "border-border bg-secondary/60 hover:border-primary/40 hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              name="shelter-preset"
              className="sr-only"
              checked={selected}
              onChange={() => onSelect(preset)}
            />
            <span className="min-w-0">
              <span
                className={`block truncate font-display text-sm font-semibold ${
                  selected ? "text-primary" : "text-foreground"
                }`}
              >
                {preset.name}
              </span>
              <span className="label-tech block truncate">
                {preset.descriptor}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="readout text-[0.6875rem] text-muted-foreground">
                {preset.floorAreaM2.toFixed(0)} m²
              </span>
              {selected ? (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
