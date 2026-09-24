import { FoundationMode } from "@/backend";
import { formatCoordinates, formatNumber, formatTimestamp } from "@/lib/format";
import { CORE_LABELS } from "@/lib/pareto";
import { comfortVerdict } from "@/lib/physics";
import { climateProfileLabel, sectorLabel } from "@/lib/sectors";
import type {
  Analysis,
  DesignConfig,
  Shelter,
  Site,
  Verdict,
} from "@/types/domain";

/** Everything the report needs, already resolved from the backend records. */
export interface ReportInput {
  analysis: Analysis;
  site: Site | null;
  shelter: Shelter | null;
}

function foundationLabel(mode: FoundationMode): string {
  return mode === FoundationMode.slabOnGrade
    ? "Slab on grade (permafrost sink)"
    : "Elevated skids (underfloor convection)";
}

function configLines(config: DesignConfig): string[] {
  return [
    `- Insulation thickness: ${formatNumber(Number(config.insulationThicknessMm), 0)} mm`,
    `- Window-to-wall ratio: ${formatNumber(Number(config.windowToWallRatioPct), 0)} %`,
    `- Thermal-mass core: ${CORE_LABELS[config.thermalMassCore]}`,
  ];
}

function siteLines(site: Site | null): string[] {
  if (!site) return ["- Site record unavailable"];
  return [
    `- Caption: ${site.caption}`,
    `- Sector: ${sectorLabel(site.sector)}`,
    `- Coordinates: ${formatCoordinates(site.latitude, site.longitude)}`,
    `- Altitude: ${formatNumber(site.altitudeM, 0)} m`,
    `- Air density: ${formatNumber(site.airDensityKgM3, 4)} kg/m³`,
    `- Climate profile: ${climateProfileLabel(site.climateProfile)}`,
    `- Climate window: ${formatTimestamp(site.climateStartNs)} → ${formatTimestamp(site.climateEndNs)}`,
  ];
}

function shelterLines(shelter: Shelter | null): string[] {
  if (!shelter) return ["- Shelter record unavailable"];
  return [
    `- Name: ${shelter.name}`,
    `- Floor area: ${formatNumber(shelter.floorAreaM2, 1)} m²`,
    `- Roof area: ${formatNumber(shelter.roofAreaM2, 1)} m²`,
    `- Wall area (N/S/E/W): ${formatNumber(shelter.wallAreaNorthM2, 1)} / ${formatNumber(shelter.wallAreaSouthM2, 1)} / ${formatNumber(shelter.wallAreaEastM2, 1)} / ${formatNumber(shelter.wallAreaWestM2, 1)} m²`,
    `- Interior volume: ${formatNumber(shelter.interiorVolumeM3, 1)} m³`,
    `- Orientation azimuth: ${formatNumber(shelter.orientationAzimuthDeg, 0)}°`,
    `- Foundation mode: ${foundationLabel(shelter.foundationMode)}`,
  ];
}

function verdictLines(verdict: Verdict): string[] {
  return [
    `- Kerosene demand: ${formatNumber(verdict.keroseneLitresPer24h, 2)} L / 24 h`,
    `- PMV: ${formatNumber(verdict.pmv, 2)} (${comfortVerdict(verdict.pmv)})`,
    `- PPD: ${formatNumber(verdict.ppd, 1)} %`,
    `- Structural weight: ${formatNumber(verdict.structuralWeightKg, 0)} kg`,
    `- Airlift sorties (250 kg sling): ${verdict.airliftSorties.toString()}`,
    `- Sapper man-hours: ${formatNumber(verdict.sapperManHours, 1)} h`,
  ];
}

/** Build a self-contained Markdown report for one saved analysis. */
export function buildAnalysisReport({
  analysis,
  site,
  shelter,
}: ReportInput): string {
  const title = analysis.caption.trim() || "Untitled analysis";
  return [
    `# SITREP — ${title}`,
    "",
    `Generated: ${formatTimestamp(BigInt(Date.now()) * 1_000_000n)}`,
    `Analysis ID: ${analysis.id.toString()}`,
    `Recorded: ${formatTimestamp(analysis.createdAt)}`,
    "",
    "## Site",
    ...siteLines(site),
    "",
    "## Shelter geometry",
    ...shelterLines(shelter),
    "",
    "## Design configuration",
    ...configLines(analysis.config),
    "",
    "## Verdict",
    ...verdictLines(analysis.verdict),
    "",
    "---",
    "Target interior temperature +15 °C · Cost objective INR · Fuel objective L kerosene / 24 h",
    "ASHRAE-55 comfort at 2.5 clo / 1.2 met · Airlift sizing at 250 kg sling load",
    "",
  ].join("\n");
}

/** A filesystem-safe filename stem for the report download. */
export function reportFileName(caption: string): string {
  const slug = caption
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `sitrep-${slug || "analysis"}.md`;
}

/** Trigger a browser download of the report text as a Markdown file. */
export function downloadReport(caption: string, report: string): void {
  const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = reportFileName(caption);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
