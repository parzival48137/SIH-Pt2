import { Button } from "@/components/ui/button";
import { formatCoordinates, formatNumber, formatTimestamp } from "@/lib/format";
import { CORE_LABELS } from "@/lib/pareto";
import { comfortVerdict } from "@/lib/physics";
import { climateProfileLabel, sectorLabel } from "@/lib/sectors";
import type { AnalysisRecord } from "@/types/domain";
import { FoundationMode } from "@/types/domain";
import {
  ClipboardCopy,
  Download,
  Gauge,
  Package,
  RotateCcw,
  Thermometer,
  Users,
} from "lucide-react";

interface AnalysisDetailCardProps {
  record: AnalysisRecord;
  /** Reopen this analysis into the shared store. */
  onReopen: () => void;
  /** Download the Markdown report. */
  onDownload: () => void;
  /** Copy the Markdown report to the clipboard. */
  onCopy: () => void;
  copied: boolean;
}

function Readout({
  label,
  value,
  unit,
  tone = "primary",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "primary" | "accent" | "muted";
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-primary";
  return (
    <div className="surface-inset rounded-sm px-2.5 py-2">
      <p className="label-tech">{label}</p>
      <p className={`readout mt-1 text-sm ${toneClass}`}>
        {value}
        {unit ? (
          <span className="ml-1 text-[0.625rem] text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}

/** Full detail for one saved analysis: site, geometry, config and verdict. */
export function AnalysisDetailCard({
  record,
  onReopen,
  onDownload,
  onCopy,
  copied,
}: AnalysisDetailCardProps) {
  const { analysis, site, shelter } = record;
  const { verdict, config } = analysis;
  const foundation =
    shelter?.foundationMode === FoundationMode.slabOnGrade
      ? "Slab on grade"
      : "Elevated skids";

  return (
    <section
      data-ocid="saved.detail_card"
      className="panel rounded-sm p-3"
      aria-label="Analysis detail"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="label-tech">Selected analysis</p>
          <h2 className="truncate font-display text-sm font-semibold text-foreground">
            {analysis.caption || "Untitled analysis"}
          </h2>
          <p className="readout mt-0.5 text-[0.625rem] text-muted-foreground">
            Recorded {formatTimestamp(analysis.createdAt)}
          </p>
        </div>
        <span className="readout shrink-0 rounded-sm border border-border bg-secondary px-2 py-1 text-[0.625rem] text-muted-foreground">
          #{analysis.id.toString()}
        </span>
      </div>

      <div className="mt-3">
        <p className="label-tech">Site</p>
        {site ? (
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <Readout
              label="Sector"
              value={sectorLabel(site.sector)}
              tone="muted"
            />
            <Readout
              label="Coordinates"
              value={formatCoordinates(site.latitude, site.longitude)}
              tone="muted"
            />
            <Readout
              label="Altitude"
              value={formatNumber(site.altitudeM, 0)}
              unit="m"
            />
            <Readout
              label="Air density"
              value={formatNumber(site.airDensityKgM3, 4)}
              unit="kg/m³"
            />
            <Readout
              label="Climate profile"
              value={climateProfileLabel(site.climateProfile)}
              tone="accent"
            />
            <Readout
              label="Climate window"
              value={`${formatTimestamp(site.climateStartNs)} → ${formatTimestamp(site.climateEndNs)}`}
              tone="muted"
            />
          </div>
        ) : (
          <p className="mt-1.5 rounded-sm border border-dashed border-border px-2.5 py-2 text-[0.6875rem] text-muted-foreground">
            The site record for this analysis is no longer available.
          </p>
        )}
      </div>

      <div className="mt-3">
        <p className="label-tech">Shelter geometry</p>
        {shelter ? (
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <Readout label="Shelter" value={shelter.name} tone="muted" />
            <Readout
              label="Floor area"
              value={formatNumber(shelter.floorAreaM2, 1)}
              unit="m²"
            />
            <Readout
              label="Roof area"
              value={formatNumber(shelter.roofAreaM2, 1)}
              unit="m²"
            />
            <Readout
              label="Interior volume"
              value={formatNumber(shelter.interiorVolumeM3, 1)}
              unit="m³"
            />
            <Readout
              label="Orientation"
              value={formatNumber(shelter.orientationAzimuthDeg, 0)}
              unit="°"
            />
            <Readout label="Foundation" value={foundation} tone="muted" />
            <div className="surface-inset col-span-2 rounded-sm px-2.5 py-2">
              <p className="label-tech">Wall areas N / S / E / W</p>
              <p className="readout mt-1 text-[0.6875rem] text-primary">
                {formatNumber(shelter.wallAreaNorthM2, 1)} /{" "}
                {formatNumber(shelter.wallAreaSouthM2, 1)} /{" "}
                {formatNumber(shelter.wallAreaEastM2, 1)} /{" "}
                {formatNumber(shelter.wallAreaWestM2, 1)}
                <span className="ml-1 text-[0.625rem] text-muted-foreground">
                  m²
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-1.5 rounded-sm border border-dashed border-border px-2.5 py-2 text-[0.6875rem] text-muted-foreground">
            The shelter record for this analysis is no longer available.
          </p>
        )}
      </div>

      <div className="mt-3">
        <p className="label-tech">Design configuration</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          <Readout
            label="Insulation"
            value={formatNumber(Number(config.insulationThicknessMm), 0)}
            unit="mm"
          />
          <Readout
            label="WWR"
            value={formatNumber(Number(config.windowToWallRatioPct), 0)}
            unit="%"
          />
          <Readout
            label="Core"
            value={CORE_LABELS[config.thermalMassCore]}
            tone="accent"
          />
        </div>
      </div>

      <div className="mt-3">
        <p className="label-tech">Verdict</p>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <div className="surface-inset col-span-2 flex items-center gap-2.5 rounded-sm px-2.5 py-2">
            <Thermometer
              className="h-4 w-4 shrink-0 text-accent"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="label-tech">Kerosene demand</p>
              <p className="readout text-base text-accent">
                {formatNumber(verdict.keroseneLitresPer24h, 2)}
                <span className="ml-1 text-[0.625rem] text-muted-foreground">
                  L / 24 h
                </span>
              </p>
            </div>
          </div>
          <div className="surface-inset flex items-center gap-2.5 rounded-sm px-2.5 py-2">
            <Gauge
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="label-tech">PMV</p>
              <p className="readout text-sm text-primary">
                {formatNumber(verdict.pmv, 2)}
              </p>
              <p className="text-[0.625rem] leading-tight text-muted-foreground">
                {comfortVerdict(verdict.pmv)}
              </p>
            </div>
          </div>
          <div className="surface-inset flex items-center gap-2.5 rounded-sm px-2.5 py-2">
            <Users
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="label-tech">PPD</p>
              <p className="readout text-sm text-primary">
                {formatNumber(verdict.ppd, 1)}
                <span className="ml-1 text-[0.625rem] text-muted-foreground">
                  %
                </span>
              </p>
            </div>
          </div>
          <div className="surface-inset flex items-center gap-2.5 rounded-sm px-2.5 py-2">
            <Package
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="label-tech">Structural weight</p>
              <p className="readout text-sm text-primary">
                {formatNumber(verdict.structuralWeightKg, 0)}
                <span className="ml-1 text-[0.625rem] text-muted-foreground">
                  kg
                </span>
              </p>
            </div>
          </div>
          <div className="surface-inset rounded-sm px-2.5 py-2">
            <p className="label-tech">Airlift sorties</p>
            <p className="readout mt-1 text-sm text-primary">
              {verdict.airliftSorties.toString()}
              <span className="ml-1 text-[0.625rem] text-muted-foreground">
                @ 250 kg
              </span>
            </p>
          </div>
          <div className="surface-inset col-span-2 rounded-sm px-2.5 py-2">
            <p className="label-tech">Sapper man-hours</p>
            <p className="readout mt-1 text-sm text-primary">
              {formatNumber(verdict.sapperManHours, 1)}
              <span className="ml-1 text-[0.625rem] text-muted-foreground">
                h
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
        <Button
          type="button"
          data-ocid="saved.reopen_button"
          onClick={onReopen}
          className="min-h-[44px] w-full rounded-sm"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reopen in simulation
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="saved.download_button"
            onClick={onDownload}
            className="min-h-[44px] rounded-sm"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </Button>
          <Button
            type="button"
            variant="outline"
            data-ocid="saved.copy_button"
            onClick={onCopy}
            className="min-h-[44px] rounded-sm"
          >
            <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
            {copied ? "Copied" : "Copy report"}
          </Button>
        </div>
      </div>
    </section>
  );
}
