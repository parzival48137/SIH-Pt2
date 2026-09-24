import { Badge } from "@/components/ui/badge";
import { formatCoordinates, formatNumber, formatTimestamp } from "@/lib/format";
import { SEA_LEVEL_AIR_DENSITY } from "@/lib/physics";
import { climateProfileLabel, sectorLabel } from "@/lib/sectors";
import type { ClimateProfile, Sector } from "@/types/domain";
import { CloudOff, Mountain, Wind } from "lucide-react";

interface SiteSummaryCardProps {
  caption: string;
  sector: Sector;
  latitude: number;
  longitude: number;
  altitudeM: number;
  airDensityKgM3: number;
  climateProfile: ClimateProfile;
  climateStartNs: bigint;
  climateEndNs: bigint;
  usingFallback: boolean;
  /** True while elevation / climate are still resolving. */
  loading: boolean;
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
      <p className={`readout mt-1 text-base ${toneClass}`}>
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

/** Site summary: sector, coordinates, altitude, air density, climate window. */
export function SiteSummaryCard({
  caption,
  sector,
  latitude,
  longitude,
  altitudeM,
  airDensityKgM3,
  climateProfile,
  climateStartNs,
  climateEndNs,
  usingFallback,
  loading,
}: SiteSummaryCardProps) {
  const densityRatio = airDensityKgM3 / SEA_LEVEL_AIR_DENSITY;

  return (
    <section
      data-ocid="site.summary_card"
      className="panel rounded-sm p-3"
      aria-label="Active site summary"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="label-tech">Active site</p>
          <h2 className="truncate font-display text-sm font-semibold text-foreground">
            {caption || "Untitled site"}
          </h2>
        </div>
        {usingFallback ? (
          <Badge
            data-ocid="site.fallback_badge"
            variant="outline"
            className="shrink-0 gap-1 rounded-sm border-accent/50 bg-accent/10 text-accent"
          >
            <CloudOff className="h-3 w-3" aria-hidden="true" />
            Offline profile
          </Badge>
        ) : (
          <Badge
            data-ocid="site.live_badge"
            variant="outline"
            className="shrink-0 rounded-sm border-primary/50 bg-primary/10 text-primary"
          >
            Live NASA POWER
          </Badge>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout label="Sector" value={sectorLabel(sector)} tone="muted" />
        <Readout
          label="Coordinates"
          value={formatCoordinates(latitude, longitude)}
          tone="muted"
        />
        <Readout
          label="Altitude"
          value={loading ? "…" : formatNumber(altitudeM, 0)}
          unit="m"
        />
        <Readout
          label="Air density"
          value={loading ? "…" : formatNumber(airDensityKgM3, 4)}
          unit="kg/m³"
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="surface-inset flex flex-1 items-center gap-2 rounded-sm px-2.5 py-2">
          <Wind
            className="h-3.5 w-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="label-tech">Sea-level reference</p>
            <p className="readout text-[0.6875rem] text-muted-foreground">
              {formatNumber(SEA_LEVEL_AIR_DENSITY, 3)} kg/m³ ·{" "}
              {formatNumber(densityRatio * 100, 1)}% of sea level
            </p>
          </div>
        </div>
        <div className="surface-inset flex flex-1 items-center gap-2 rounded-sm px-2.5 py-2">
          <Mountain
            className="h-3.5 w-3.5 shrink-0 text-accent"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="label-tech">Climate profile</p>
            <p className="readout truncate text-[0.6875rem] text-accent">
              {climateProfileLabel(climateProfile)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 border-t border-border pt-2">
        <p className="label-tech">Climate window</p>
        <p className="readout mt-0.5 text-[0.6875rem] text-muted-foreground">
          {formatTimestamp(climateStartNs)} → {formatTimestamp(climateEndNs)}
        </p>
      </div>
    </section>
  );
}
