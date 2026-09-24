import { describe, expect, it } from "vitest";

import { buildAnalysisReport, reportFileName } from "@/lib/report";
import {
  ClimateProfile,
  FoundationMode,
  Sector,
  ThermalMassCore,
} from "@/types/domain";
import type { Analysis, Shelter, Site } from "@/types/domain";

const site: Site = {
  id: 1n,
  owner: undefined as never,
  caption: "Leh ridge",
  sector: Sector.westernLadakh,
  latitude: 34.1526,
  longitude: 77.5771,
  altitudeM: 3500,
  airDensityKgM3: 0.8123,
  climateProfile: ClimateProfile.extremeWinter,
  climateStartNs: 1_700_000_000_000_000_000n,
  climateEndNs: 1_700_100_000_000_000_000n,
  createdAt: 1_700_000_000_000_000_000n,
};

const shelter: Shelter = {
  id: 2n,
  owner: undefined as never,
  name: "Panel hut",
  floorAreaM2: 18,
  roofAreaM2: 19.2,
  wallAreaNorthM2: 10.8,
  wallAreaSouthM2: 10.8,
  wallAreaEastM2: 7.2,
  wallAreaWestM2: 7.2,
  interiorVolumeM3: 46.8,
  orientationAzimuthDeg: 90,
  foundationMode: FoundationMode.slabOnGrade,
  createdAt: 1_700_000_000_000_000_000n,
};

const analysis: Analysis = {
  id: 7n,
  owner: undefined as never,
  caption: "Winter baseline",
  siteId: 1n,
  shelterId: 2n,
  config: {
    insulationThicknessMm: 100n,
    windowToWallRatioPct: 15n,
    thermalMassCore: ThermalMassCore.puf,
  },
  verdict: {
    keroseneLitresPer24h: 12.5,
    pmv: -0.4,
    ppd: 8.2,
    structuralWeightKg: 1450,
    airliftSorties: 6n,
    sapperManHours: 21.4,
  },
  createdAt: 1_700_000_000_000_000_000n,
};

describe("buildAnalysisReport", () => {
  it("includes the site, geometry, configuration and verdict sections", () => {
    const report = buildAnalysisReport({ analysis, site, shelter });
    expect(report).toContain("# SITREP — Winter baseline");
    expect(report).toContain("## Site");
    expect(report).toContain("Western Ladakh");
    expect(report).toContain("## Shelter geometry");
    expect(report).toContain("Panel hut");
    expect(report).toContain("## Design configuration");
    expect(report).toContain("PUF");
    expect(report).toContain("## Verdict");
    expect(report).toContain("12.50 L / 24 h");
    expect(report).toContain("6");
  });

  it("degrades gracefully when the site or shelter record is missing", () => {
    const report = buildAnalysisReport({ analysis, site: null, shelter: null });
    expect(report).toContain("Site record unavailable");
    expect(report).toContain("Shelter record unavailable");
  });

  it("falls back to an untitled heading for a blank caption", () => {
    const report = buildAnalysisReport({
      analysis: { ...analysis, caption: "   " },
      site,
      shelter,
    });
    expect(report).toContain("# SITREP — Untitled analysis");
  });
});

describe("reportFileName", () => {
  it("slugifies the caption into a markdown filename", () => {
    expect(reportFileName("Winter baseline")).toBe("sitrep-winter-baseline.md");
  });

  it("falls back to a generic stem for an empty caption", () => {
    expect(reportFileName("   ")).toBe("sitrep-analysis.md");
  });
});
