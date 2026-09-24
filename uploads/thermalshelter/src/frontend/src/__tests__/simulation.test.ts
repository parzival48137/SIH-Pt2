import { describe, expect, it } from "vitest";

import { type SimulationInputs, runSimulation } from "@/lib/climate";
import {
  type SweepContext,
  buildDesignSpace,
  configKey,
  evaluateDesignSpace,
  markParetoFront,
} from "@/lib/pareto";
import {
  SECTOR_PRESETS,
  getClimateProfile,
  getSectorPreset,
} from "@/lib/sectors";
import {
  ClimateProfile,
  FoundationMode,
  Sector,
  ThermalMassCore,
} from "@/types/domain";
import type { ParetoPoint } from "@/types/domain";

function baseInputs(
  overrides: Partial<SimulationInputs> = {},
): SimulationInputs {
  const day = getClimateProfile(
    Sector.westernLadakh,
    ClimateProfile.extremeWinter,
  ).day;
  return {
    day,
    latitude: 34.1526,
    altitudeM: 3500,
    floorAreaM2: 18,
    roofAreaM2: 19.2,
    wallAreaNorthM2: 10.8,
    wallAreaSouthM2: 10.8,
    wallAreaEastM2: 7.2,
    wallAreaWestM2: 7.2,
    interiorVolumeM3: 46.8,
    orientationAzimuthDeg: 0,
    foundationMode: FoundationMode.slabOnGrade,
    insulationThicknessMm: 100,
    ach: 1.2,
    occupants: 4,
    equipmentLoadW: 250,
    heatingKw: 2,
    ...overrides,
  };
}

function sweepContext(overrides: Partial<SweepContext> = {}): SweepContext {
  const inputs = baseInputs();
  return {
    day: inputs.day,
    latitude: inputs.latitude,
    altitudeM: inputs.altitudeM,
    floorAreaM2: inputs.floorAreaM2,
    roofAreaM2: inputs.roofAreaM2,
    wallAreaNorthM2: inputs.wallAreaNorthM2,
    wallAreaSouthM2: inputs.wallAreaSouthM2,
    wallAreaEastM2: inputs.wallAreaEastM2,
    wallAreaWestM2: inputs.wallAreaWestM2,
    interiorVolumeM3: inputs.interiorVolumeM3,
    orientationAzimuthDeg: inputs.orientationAzimuthDeg,
    foundationMode: inputs.foundationMode,
    ach: inputs.ach,
    occupants: inputs.occupants,
    equipmentLoadW: inputs.equipmentLoadW,
    heatingKw: inputs.heatingKw,
    ...overrides,
  };
}

describe("sector presets", () => {
  it("defines the four operational sectors with reference coordinates", () => {
    expect(SECTOR_PRESETS).toHaveLength(4);
    const ladakh = getSectorPreset(Sector.westernLadakh);
    expect(ladakh.name).toBe("Western Ladakh");
    expect(ladakh.latitude).toBeCloseTo(34.1526, 3);
    expect(ladakh.longitude).toBeCloseTo(77.5771, 3);
    expect(ladakh.altitudeM).toBe(3500);
  });

  it("compiles an offline profile for every sector and season", () => {
    for (const preset of SECTOR_PRESETS) {
      for (const profile of Object.values(ClimateProfile)) {
        const data = getClimateProfile(preset.sector, profile);
        expect(data.sector).toBe(preset.sector);
        expect(data.day.temperatureC).toHaveLength(24);
        expect(data.day.solarWm2).toHaveLength(24);
        expect(data.day.windSpeedMs).toHaveLength(24);
        expect(data.day.windDirectionDeg).toHaveLength(24);
      }
    }
  });
});

describe("runSimulation", () => {
  it("produces a 24-hour interior and ambient trace", () => {
    const result = runSimulation(baseInputs());
    expect(result.interiorC).toHaveLength(24);
    expect(result.ambientC).toHaveLength(24);
    expect(result.surfaceC).toHaveLength(24);
    expect(result.dewPointC).toHaveLength(24);
    expect(result.peakInteriorC).toBe(Math.max(...result.interiorC));
    expect(result.minInteriorC).toBe(Math.min(...result.interiorC));
    expect(result.keroseneLitresPer24h).toBeGreaterThanOrEqual(0);
  });

  it("changes the interior temperature when the foundation mode changes", () => {
    const slab = runSimulation(
      baseInputs({ foundationMode: FoundationMode.slabOnGrade }),
    );
    const skids = runSimulation(
      baseInputs({ foundationMode: FoundationMode.elevatedSkids }),
    );
    expect(slab.interiorC).not.toEqual(skids.interiorC);
  });

  it("raises the interior temperature with more active heating", () => {
    const cold = runSimulation(baseInputs({ heatingKw: 0 }));
    const warm = runSimulation(baseInputs({ heatingKw: 6 }));
    expect(warm.peakInteriorC).toBeGreaterThan(cold.peakInteriorC);
  });

  it("reduces the kerosene deficit with thicker insulation", () => {
    const thin = runSimulation(baseInputs({ insulationThicknessMm: 25 }));
    const thick = runSimulation(baseInputs({ insulationThicknessMm: 200 }));
    expect(thick.deficitKwh).toBeLessThan(thin.deficitKwh);
  });

  it("flags a dew-point breach with a breach hour when one occurs", () => {
    const result = runSimulation(
      baseInputs({ occupants: 12, ach: 0.5, heatingKw: 0 }),
    );
    if (result.dewPointBreach) {
      expect(result.breachHour).not.toBeNull();
      const hour = result.breachHour as number;
      expect(result.surfaceC[hour]).toBeLessThanOrEqual(result.dewPointC[hour]);
    } else {
      expect(result.breachHour).toBeNull();
    }
  });
});

describe("Pareto optimization", () => {
  it("builds the full 125-configuration design space", () => {
    const space = buildDesignSpace();
    expect(space).toHaveLength(125);
    const keys = new Set(space.map(configKey));
    expect(keys.size).toBe(125);
  });

  it("returns a non-dominated front with cost and kerosene axes", () => {
    const points = evaluateDesignSpace(sweepContext());
    expect(points).toHaveLength(125);
    const front = points.filter((point) => point.onFront);
    expect(front.length).toBeGreaterThan(0);
    expect(front.length).toBeLessThan(points.length);
    for (const point of front) {
      expect(Number.isFinite(point.capitalCostInr)).toBe(true);
      expect(Number.isFinite(point.keroseneLitresPer24h)).toBe(true);
    }
  });

  it("marks a point dominated when another is no worse on both objectives", () => {
    const make = (
      cost: number,
      fuel: number,
      onFront = false,
    ): ParetoPoint => ({
      config: {
        insulationThicknessMm: 100n,
        windowToWallRatioPct: 10n,
        thermalMassCore: ThermalMassCore.puf,
      },
      capitalCostInr: cost,
      keroseneLitresPer24h: fuel,
      structuralWeightKg: 1000,
      airliftSorties: 4,
      sapperManHours: 20,
      pmv: 0,
      ppd: 5,
      onFront,
    });
    const marked = markParetoFront([
      make(100, 10),
      make(200, 20), // dominated by (100, 10)
      make(50, 30), // trade-off, stays on the front
    ]);
    expect(marked[0].onFront).toBe(true);
    expect(marked[1].onFront).toBe(false);
    expect(marked[2].onFront).toBe(true);
  });

  it("derives per-configuration detail from a selected point", () => {
    const points = evaluateDesignSpace(sweepContext());
    const selected = points.find((point) => point.onFront) ?? points[0];
    expect(selected.config.insulationThicknessMm).toBeGreaterThan(0n);
    expect(selected.structuralWeightKg).toBeGreaterThan(0);
    expect(selected.airliftSorties).toBeGreaterThanOrEqual(1);
    expect(selected.sapperManHours).toBeGreaterThan(0);
    expect(Number.isFinite(selected.pmv)).toBe(true);
    expect(selected.ppd).toBeGreaterThanOrEqual(0);
  });
});
