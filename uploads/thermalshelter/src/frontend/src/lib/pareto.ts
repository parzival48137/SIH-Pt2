import { ThermalMassCore } from "@/backend";
import { type SimulationInputs, runSimulation } from "@/lib/climate";
import {
  airliftSorties,
  capitalCostInr,
  keroseneFromDeficit,
  pmv,
  ppd,
  sapperManHours,
  structuralWeightKg,
  thermalDeficitKwh,
} from "@/lib/physics";
import type { ClimateDay, DesignConfig, ParetoPoint } from "@/types/domain";

/** Insulation thickness options, millimetres. */
export const INSULATION_OPTIONS_MM = [25, 50, 75, 100, 150] as const;
/** Window-to-wall ratio options, percent. */
export const WWR_OPTIONS_PCT = [0, 5, 10, 15, 20] as const;
/** Thermal-mass core options. */
export const CORE_OPTIONS: ThermalMassCore[] = [
  ThermalMassCore.puf,
  ThermalMassCore.aerogel,
  ThermalMassCore.adobe,
  ThermalMassCore.pcm28,
  ThermalMassCore.vip,
];

/** Human-readable label for a thermal-mass core. */
export const CORE_LABELS: Record<ThermalMassCore, string> = {
  [ThermalMassCore.puf]: "PUF",
  [ThermalMassCore.aerogel]: "Aerogel",
  [ThermalMassCore.adobe]: "Adobe",
  [ThermalMassCore.pcm28]: "PCM 28 °C",
  [ThermalMassCore.vip]: "VIP",
};

/** Short technical descriptor for a thermal-mass core. */
export const CORE_DESCRIPTORS: Record<ThermalMassCore, string> = {
  [ThermalMassCore.puf]: "Rigid foam, low cost",
  [ThermalMassCore.aerogel]: "Highest R per mm",
  [ThermalMassCore.adobe]: "Local earth, high mass",
  [ThermalMassCore.pcm28]: "Phase change at 28 °C",
  [ThermalMassCore.vip]: "Vacuum panel, thin wall",
};

/** The full 125-configuration design space. */
export function buildDesignSpace(): DesignConfig[] {
  const configs: DesignConfig[] = [];
  for (const insulationThicknessMm of INSULATION_OPTIONS_MM) {
    for (const windowToWallRatioPct of WWR_OPTIONS_PCT) {
      for (const thermalMassCore of CORE_OPTIONS) {
        configs.push({
          insulationThicknessMm: BigInt(insulationThicknessMm),
          windowToWallRatioPct: BigInt(windowToWallRatioPct),
          thermalMassCore,
        });
      }
    }
  }
  return configs;
}

/** Geometry and climate context shared by every configuration in a sweep. */
export interface SweepContext {
  day: ClimateDay;
  latitude: number;
  altitudeM: number;
  floorAreaM2: number;
  roofAreaM2: number;
  wallAreaNorthM2: number;
  wallAreaSouthM2: number;
  wallAreaEastM2: number;
  wallAreaWestM2: number;
  interiorVolumeM3: number;
  orientationAzimuthDeg: number;
  foundationMode: SimulationInputs["foundationMode"];
  ach: number;
  occupants: number;
  equipmentLoadW: number;
  heatingKw: number;
}

/** Total shell area, m^2, from the decomposed geometry. */
export function shellAreaM2(context: SweepContext): number {
  return (
    context.floorAreaM2 +
    context.roofAreaM2 +
    context.wallAreaNorthM2 +
    context.wallAreaSouthM2 +
    context.wallAreaEastM2 +
    context.wallAreaWestM2
  );
}

/**
 * Evaluate one configuration: run the 24-hour transient simulation, then
 * derive cost, fuel, comfort and logistics metrics from the result.
 */
export function evaluateConfig(
  config: DesignConfig,
  context: SweepContext,
): ParetoPoint {
  const shell = shellAreaM2(context);
  const result = runSimulation({
    day: context.day,
    latitude: context.latitude,
    altitudeM: context.altitudeM,
    floorAreaM2: context.floorAreaM2,
    roofAreaM2: context.roofAreaM2,
    wallAreaNorthM2: context.wallAreaNorthM2,
    wallAreaSouthM2: context.wallAreaSouthM2,
    wallAreaEastM2: context.wallAreaEastM2,
    wallAreaWestM2: context.wallAreaWestM2,
    interiorVolumeM3: context.interiorVolumeM3,
    orientationAzimuthDeg: context.orientationAzimuthDeg,
    foundationMode: context.foundationMode,
    insulationThicknessMm: Number(config.insulationThicknessMm),
    ach: context.ach,
    occupants: context.occupants,
    equipmentLoadW: context.equipmentLoadW,
    heatingKw: context.heatingKw,
  });

  const weight = structuralWeightKg(
    context.floorAreaM2,
    context.roofAreaM2,
    context.wallAreaNorthM2 +
      context.wallAreaSouthM2 +
      context.wallAreaEastM2 +
      context.wallAreaWestM2,
    Number(config.insulationThicknessMm),
  );
  const pmvValue = pmv(result.peakInteriorC, result.peakInteriorC, 45, 0.15);

  return {
    config,
    capitalCostInr: capitalCostInr(shell, config),
    keroseneLitresPer24h: keroseneFromDeficit(
      thermalDeficitKwh(
        result.interiorC,
        context.interiorVolumeM3,
        airDensityFromAltitude(context.altitudeM),
      ),
    ),
    structuralWeightKg: weight,
    airliftSorties: airliftSorties(weight),
    sapperManHours: sapperManHours(shell, context.foundationMode),
    pmv: pmvValue,
    ppd: ppd(pmvValue),
    onFront: false,
  };
}

function airDensityFromAltitude(altitudeM: number): number {
  return 1.225 * Math.exp(-altitudeM / 8500);
}

/**
 * Mark the non-dominated Pareto front trading capital cost (INR) against
 * 24-hour kerosene deficit (litres). A point is dominated when another point
 * is no worse on both objectives and strictly better on at least one.
 */
export function markParetoFront(points: ParetoPoint[]): ParetoPoint[] {
  return points.map((point) => {
    const dominated = points.some(
      (other) =>
        other !== point &&
        other.capitalCostInr <= point.capitalCostInr &&
        other.keroseneLitresPer24h <= point.keroseneLitresPer24h &&
        (other.capitalCostInr < point.capitalCostInr ||
          other.keroseneLitresPer24h < point.keroseneLitresPer24h),
    );
    return { ...point, onFront: !dominated };
  });
}

/** Evaluate the full design space and return every point with front flags. */
export function evaluateDesignSpace(context: SweepContext): ParetoPoint[] {
  const points = buildDesignSpace().map((config) =>
    evaluateConfig(config, context),
  );
  return markParetoFront(points);
}

/** Stable identity key for a configuration, used for selection and keys. */
export function configKey(config: DesignConfig): string {
  return `${config.insulationThicknessMm}-${config.windowToWallRatioPct}-${config.thermalMassCore}`;
}
