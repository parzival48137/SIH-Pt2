import { formatNumber } from "@/lib/format";
import { FoundationMode } from "@/types/domain";
import { Box, Layers, Ruler } from "lucide-react";

export interface GeometrySummary {
  floorAreaM2: number;
  roofAreaM2: number;
  wallAreaNorthM2: number;
  wallAreaSouthM2: number;
  wallAreaEastM2: number;
  wallAreaWestM2: number;
  interiorVolumeM3: number;
  orientationAzimuthDeg: number;
  foundationMode: FoundationMode;
}

interface GeometrySummaryCardProps {
  geometry: GeometrySummary;
  /** Source label — preset name or uploaded file name. */
  sourceLabel: string;
}

interface ReadoutProps {
  label: string;
  value: string;
  unit: string;
  ocid: string;
}

function Readout({ label, value, unit, ocid }: ReadoutProps) {
  return (
    <div className="surface-inset rounded-sm px-2.5 py-2">
      <span className="label-tech block">{label}</span>
      <span className="mt-1 flex items-baseline gap-1">
        <span data-ocid={ocid} className="readout text-base text-primary">
          {value}
        </span>
        <span className="font-mono text-[0.625rem] text-muted-foreground">
          {unit}
        </span>
      </span>
    </div>
  );
}

/** Scalar geometry envelope of the active shelter definition. */
export function GeometrySummaryCard({
  geometry,
  sourceLabel,
}: GeometrySummaryCardProps) {
  const wallTotal =
    geometry.wallAreaNorthM2 +
    geometry.wallAreaSouthM2 +
    geometry.wallAreaEastM2 +
    geometry.wallAreaWestM2;
  const envelopeArea = geometry.floorAreaM2 + geometry.roofAreaM2 + wallTotal;

  return (
    <section
      data-ocid="shelter.geometry_summary"
      className="panel rounded-sm p-3"
      aria-label="Geometry summary"
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold text-foreground">
            <Box className="h-4 w-4 text-primary" aria-hidden="true" />
            Geometry envelope
          </h2>
          <p className="label-tech mt-0.5 truncate">{sourceLabel}</p>
        </div>
        <span className="surface-inset shrink-0 rounded-sm px-2 py-1">
          <span className="label-tech block">Envelope</span>
          <span className="readout text-[0.6875rem] text-foreground">
            {formatNumber(envelopeArea, 1)} m²
          </span>
        </span>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Readout
          label="Floor"
          value={formatNumber(geometry.floorAreaM2, 1)}
          unit="m²"
          ocid="shelter.summary.floor"
        />
        <Readout
          label="Roof"
          value={formatNumber(geometry.roofAreaM2, 1)}
          unit="m²"
          ocid="shelter.summary.roof"
        />
        <Readout
          label="Wall N"
          value={formatNumber(geometry.wallAreaNorthM2, 1)}
          unit="m²"
          ocid="shelter.summary.wall_north"
        />
        <Readout
          label="Wall S"
          value={formatNumber(geometry.wallAreaSouthM2, 1)}
          unit="m²"
          ocid="shelter.summary.wall_south"
        />
        <Readout
          label="Wall E"
          value={formatNumber(geometry.wallAreaEastM2, 1)}
          unit="m²"
          ocid="shelter.summary.wall_east"
        />
        <Readout
          label="Wall W"
          value={formatNumber(geometry.wallAreaWestM2, 1)}
          unit="m²"
          ocid="shelter.summary.wall_west"
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="surface-inset rounded-sm px-2.5 py-2">
          <span className="label-tech flex items-center gap-1.5">
            <Layers className="h-3 w-3" aria-hidden="true" />
            Interior volume
          </span>
          <span className="mt-1 flex items-baseline gap-1">
            <span
              data-ocid="shelter.summary.volume"
              className="readout text-base text-primary"
            >
              {formatNumber(geometry.interiorVolumeM3, 1)}
            </span>
            <span className="font-mono text-[0.625rem] text-muted-foreground">
              m³
            </span>
          </span>
        </div>
        <div className="surface-inset rounded-sm px-2.5 py-2">
          <span className="label-tech flex items-center gap-1.5">
            <Ruler className="h-3 w-3" aria-hidden="true" />
            Orientation
          </span>
          <span className="mt-1 flex items-baseline gap-1">
            <span
              data-ocid="shelter.summary.orientation"
              className="readout text-base text-primary"
            >
              {formatNumber(geometry.orientationAzimuthDeg, 0)}
            </span>
            <span className="font-mono text-[0.625rem] text-muted-foreground">
              ° az
            </span>
          </span>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-2">
        <span className="label-tech">Foundation</span>
        <span className="readout text-[0.6875rem] text-foreground">
          {geometry.foundationMode === FoundationMode.slabOnGrade
            ? "Slab-on-grade · permafrost sink"
            : "Elevated skids · ventilated"}
        </span>
      </p>
    </section>
  );
}
