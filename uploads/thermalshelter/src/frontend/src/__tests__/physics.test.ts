import { describe, expect, it } from "vitest";

import {
  SEA_LEVEL_AIR_DENSITY,
  TARGET_INTERIOR_C,
  airDensityAtAltitude,
  airliftSorties,
  comfortVerdict,
  dewPoint,
  keroseneFromDeficit,
  mcadamsConvection,
  pmv,
  ppd,
  pressureAtAltitude,
  sapperManHours,
  solarDeclination,
  solarIncidence,
  structuralWeightKg,
  thermalDeficitKwh,
} from "@/lib/physics";
import { FoundationMode } from "@/types/domain";

describe("barometric air density", () => {
  it("matches the sea-level reference at zero altitude", () => {
    expect(airDensityAtAltitude(0)).toBeCloseTo(SEA_LEVEL_AIR_DENSITY, 6);
    expect(pressureAtAltitude(0)).toBeCloseTo(101325, 3);
  });

  it("falls below the sea-level reference at a high-altitude site", () => {
    const density = airDensityAtAltitude(3500);
    expect(density).toBeLessThan(SEA_LEVEL_AIR_DENSITY);
    // Exponential atmosphere: rho0 * exp(-3500 / 8500).
    expect(density).toBeCloseTo(
      SEA_LEVEL_AIR_DENSITY * Math.exp(-3500 / 8500),
      6,
    );
  });

  it("decreases monotonically with altitude", () => {
    expect(airDensityAtAltitude(4000)).toBeLessThan(airDensityAtAltitude(3000));
  });
});

describe("McAdams wind-driven convection", () => {
  it("returns the still-air coefficient at zero wind", () => {
    expect(mcadamsConvection(0)).toBeCloseTo(5.7, 6);
  });

  it("increases with wind speed", () => {
    expect(mcadamsConvection(10)).toBeGreaterThan(mcadamsConvection(2));
    expect(mcadamsConvection(5)).toBeCloseTo(5.7 + 3.8 * 5, 6);
  });

  it("never goes below the still-air value for negative wind", () => {
    expect(mcadamsConvection(-4)).toBeCloseTo(5.7, 6);
  });
});

describe("solar geometry", () => {
  it("clamps incidence to zero when the surface faces away", () => {
    // Sun at zenith 0 (overhead) on a vertical wall: cos(zenith)=1, cos(tilt)=0.
    expect(solarIncidence(0, 180, 90, 0)).toBeCloseTo(0, 6);
  });

  it("gives full incidence for a horizontal surface under an overhead sun", () => {
    expect(solarIncidence(0, 0, 0, 0)).toBeCloseTo(1, 6);
  });

  it("produces a declination within the obliquity band", () => {
    for (const day of [1, 80, 172, 266, 355]) {
      const declination = solarDeclination(day);
      expect(declination).toBeGreaterThanOrEqual(-23.45);
      expect(declination).toBeLessThanOrEqual(23.45);
    }
  });
});

describe("dew point", () => {
  it("equals the air temperature at saturation", () => {
    expect(dewPoint(10, 100)).toBeCloseTo(10, 1);
  });

  it("sits below the air temperature in dry air", () => {
    expect(dewPoint(10, 40)).toBeLessThan(10);
  });
});

describe("ASHRAE-55 comfort", () => {
  it("reports a comfortable verdict inside the PMV band", () => {
    expect(comfortVerdict(0)).toBe("Comfortable");
    expect(comfortVerdict(-0.5)).toBe("Comfortable");
    expect(comfortVerdict(0.5)).toBe("Comfortable");
  });

  it("reports cold and warm verdicts outside the band", () => {
    expect(comfortVerdict(-2)).toBe("Cold — increase heating");
    expect(comfortVerdict(2)).toBe("Warm — reduce heating");
  });

  it("keeps PPD within 0..100 and minimal near neutral", () => {
    const neutral = ppd(0);
    expect(neutral).toBeGreaterThanOrEqual(0);
    expect(neutral).toBeLessThanOrEqual(100);
    expect(ppd(0)).toBeLessThan(ppd(2));
  });

  it("returns a finite PMV for heavy winter gear", () => {
    expect(Number.isFinite(pmv(15, 15, 45, 0.15))).toBe(true);
  });
});

describe("fuel and logistics", () => {
  it("converts a thermal deficit to kerosene litres", () => {
    expect(keroseneFromDeficit(9.6)).toBeCloseTo(1, 6);
    expect(keroseneFromDeficit(-5)).toBe(0);
  });

  it("accumulates deficit only for hours below the +15C target", () => {
    const volume = 46.8;
    const density = airDensityAtAltitude(3500);
    const below = thermalDeficitKwh([10, 10], volume, density);
    const above = thermalDeficitKwh([20, 20], volume, density);
    expect(below).toBeGreaterThan(0);
    expect(above).toBe(0);
    // Two hours of a 5 K gap: 2 * 5 * V * rho * 1005 J / 3.6e6.
    expect(below).toBeCloseTo((2 * 5 * volume * density * 1005) / 3.6e6, 6);
    expect(TARGET_INTERIOR_C).toBe(15);
  });

  it("sizes airlift sorties at the 250 kg sling load", () => {
    expect(airliftSorties(250)).toBe(1);
    expect(airliftSorties(251)).toBe(2);
    expect(airliftSorties(0)).toBe(1);
  });

  it("increases structural weight with insulation thickness", () => {
    const thin = structuralWeightKg(18, 19.2, 36, 50);
    const thick = structuralWeightKg(18, 19.2, 36, 150);
    expect(thick).toBeGreaterThan(thin);
  });

  it("charges more sapper hours for a slab-on-grade foundation", () => {
    const slab = sapperManHours(73.2, FoundationMode.slabOnGrade);
    const skids = sapperManHours(73.2, FoundationMode.elevatedSkids);
    expect(slab).toBeGreaterThan(skids);
  });
});
