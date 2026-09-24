import { FoundationMode, ThermalMassCore } from "@/backend";
import type { DesignConfig, SimulationResult, Verdict } from "@/types/domain";

/** Standard sea-level air density, kg/m^3. */
export const SEA_LEVEL_AIR_DENSITY = 1.225;
/** Standard sea-level pressure, Pa. */
export const SEA_LEVEL_PRESSURE = 101325;
/** Scale height of the exponential atmosphere, metres. */
export const SCALE_HEIGHT_M = 8500;
/** Target interior temperature for fuel sizing, degrees Celsius. */
export const TARGET_INTERIOR_C = 15;
/** Sling load per airlift sortie, kg (Cheetah / ALH Dhruv). */
export const SLING_LOAD_KG = 250;
/** Lower heating value of kerosene, kWh per litre. */
export const KEROSENE_KWH_PER_LITRE = 9.6;
/** Metabolic rate for heavy winter gear, met. */
export const MET_RATE = 1.2;
/** Clothing insulation for heavy winter gear, clo. */
export const CLO_VALUE = 2.5;

/**
 * Barometric air density from the exponential altitude model.
 * rho = rho0 * exp(-h / H)
 */
export function airDensityAtAltitude(altitudeM: number): number {
  return SEA_LEVEL_AIR_DENSITY * Math.exp(-altitudeM / SCALE_HEIGHT_M);
}

/** Barometric pressure at altitude, Pa. */
export function pressureAtAltitude(altitudeM: number): number {
  return SEA_LEVEL_PRESSURE * Math.exp(-altitudeM / SCALE_HEIGHT_M);
}

/**
 * McAdams wind-driven external convection coefficient, W/(m^2 K).
 * h = 5.7 + 3.8 v  for v in m/s.
 */
export function mcadamsConvection(windSpeedMs: number): number {
  return 5.7 + 3.8 * Math.max(0, windSpeedMs);
}

/** Solar incidence factor on a surface of given tilt and azimuth. */
export function solarIncidence(
  solarZenithDeg: number,
  solarAzimuthDeg: number,
  surfaceTiltDeg: number,
  surfaceAzimuthDeg: number,
): number {
  const zenith = (solarZenithDeg * Math.PI) / 180;
  const azimuth = (solarAzimuthDeg * Math.PI) / 180;
  const tilt = (surfaceTiltDeg * Math.PI) / 180;
  const surfaceAzimuth = (surfaceAzimuthDeg * Math.PI) / 180;

  const cosIncidence =
    Math.cos(zenith) * Math.cos(tilt) +
    Math.sin(zenith) * Math.sin(tilt) * Math.cos(azimuth - surfaceAzimuth);

  return Math.max(0, cosIncidence);
}

/** Solar declination angle for a day of year, degrees. */
export function solarDeclination(dayOfYear: number): number {
  return 23.45 * Math.sin(((2 * Math.PI) / 365) * (284 + dayOfYear));
}

/** Solar zenith angle for latitude, declination and hour angle, degrees. */
export function solarZenith(
  latitudeDeg: number,
  declinationDeg: number,
  hourAngleDeg: number,
): number {
  const lat = (latitudeDeg * Math.PI) / 180;
  const dec = (declinationDeg * Math.PI) / 180;
  const ha = (hourAngleDeg * Math.PI) / 180;
  const cosZenith =
    Math.sin(lat) * Math.sin(dec) +
    Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
  return (Math.acos(Math.min(1, Math.max(-1, cosZenith))) * 180) / Math.PI;
}

/** Solar azimuth angle, degrees clockwise from north. */
export function solarAzimuth(
  latitudeDeg: number,
  declinationDeg: number,
  hourAngleDeg: number,
): number {
  const lat = (latitudeDeg * Math.PI) / 180;
  const dec = (declinationDeg * Math.PI) / 180;
  const ha = (hourAngleDeg * Math.PI) / 180;
  const sinAz =
    (Math.cos(dec) * Math.sin(ha)) /
    Math.max(
      1e-6,
      Math.cos(
        (solarZenith(latitudeDeg, declinationDeg, hourAngleDeg) * Math.PI) /
          180,
      ),
    );
  const cosAz =
    (Math.sin(dec) -
      Math.sin(lat) *
        Math.cos(
          (solarZenith(latitudeDeg, declinationDeg, hourAngleDeg) * Math.PI) /
            180,
        )) /
    Math.max(
      1e-6,
      Math.cos(lat) *
        Math.sin(
          (solarZenith(latitudeDeg, declinationDeg, hourAngleDeg) * Math.PI) /
            180,
        ),
    );
  const azimuth = (Math.atan2(sinAz, cosAz) * 180) / Math.PI;
  return (azimuth + 360) % 360;
}

/**
 * Magnus-formula dew point from temperature and relative humidity.
 * Returns degrees Celsius.
 */
export function dewPoint(
  temperatureC: number,
  relativeHumidityPct: number,
): number {
  const rh = Math.min(100, Math.max(1, relativeHumidityPct));
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * temperatureC) / (b + temperatureC) + Math.log(rh / 100);
  return (b * alpha) / (a - alpha);
}

/** Saturation vapour pressure, Pa, from the Magnus formula. */
export function saturationVapourPressure(temperatureC: number): number {
  return 610.94 * Math.exp((17.625 * temperatureC) / (temperatureC + 243.04));
}

/**
 * ASHRAE-55 PMV (predicted mean vote) for heavy winter gear.
 * Simplified steady-state formulation at the given met and clo values.
 */
export function pmv(
  airTemperatureC: number,
  meanRadiantTemperatureC: number,
  relativeHumidityPct: number,
  airSpeedMs: number,
  met: number = MET_RATE,
  clo: number = CLO_VALUE,
): number {
  const metabolicRate = met * 58.15;
  const clothingInsulation = clo * 0.155;
  const meanRadiantK = meanRadiantTemperatureC + 273.15;

  const vapourPressure =
    (relativeHumidityPct / 100) * saturationVapourPressure(airTemperatureC);

  const clothingFactor = 1 + 0.155 * 0.6 * clothingInsulation;
  const clothingSurfaceTemperature =
    (35.7 - 0.028 * metabolicRate) / clothingFactor;

  const convectionCoefficient = Math.max(
    2.38 * Math.abs(clothingSurfaceTemperature - airTemperatureC) ** 0.25,
    12.1 * Math.sqrt(Math.max(0.1, airSpeedMs)),
  );

  const heatLossSkin =
    3.05e-3 * (5733 - 6.99 * metabolicRate - vapourPressure) +
    0.42 * (metabolicRate - 58.15) +
    1.7e-5 * metabolicRate * (5867 - vapourPressure) +
    0.0014 * metabolicRate * (34 - airTemperatureC);

  const heatLossRespiration =
    3.96e-8 *
      clothingFactor *
      (clothingSurfaceTemperature ** 4 - meanRadiantK ** 4) +
    clothingFactor *
      convectionCoefficient *
      (clothingSurfaceTemperature - airTemperatureC);

  const thermalLoad = metabolicRate - heatLossSkin - heatLossRespiration;

  const sensitivity = 0.303 * Math.exp(-0.036 * metabolicRate) + 0.028;

  return sensitivity * thermalLoad;
}

/** Predicted percentage of dissatisfied from PMV, percent. */
export function ppd(pmvValue: number): number {
  return 100 - 95 * Math.exp(-0.03353 * pmvValue ** 4 - 0.2179 * pmvValue ** 2);
}

/** Comfort verdict band for a PMV value. */
export function comfortVerdict(pmvValue: number): string {
  if (pmvValue >= -0.5 && pmvValue <= 0.5) return "Comfortable";
  if (pmvValue > 0.5 && pmvValue <= 1.5) return "Slightly warm";
  if (pmvValue < -0.5 && pmvValue >= -1.5) return "Slightly cool";
  if (pmvValue > 1.5) return "Warm — reduce heating";
  return "Cold — increase heating";
}

/** Kerosene litres per 24 h from a thermal deficit in kWh. */
export function keroseneFromDeficit(deficitKwh: number): number {
  return Math.max(0, deficitKwh) / KEROSENE_KWH_PER_LITRE;
}

/** Thermal energy deficit against the +15C target, kWh. */
export function thermalDeficitKwh(
  interiorC: number[],
  interiorVolumeM3: number,
  airDensityKgM3: number,
): number {
  const specificHeat = 1005; // J/(kg K)
  const deficitJoules = interiorC.reduce((total, temperature) => {
    const gap = TARGET_INTERIOR_C - temperature;
    if (gap <= 0) return total;
    return total + gap * interiorVolumeM3 * airDensityKgM3 * specificHeat;
  }, 0);
  return deficitJoules / 3.6e6;
}

/** Structural mass of a shelter, kg, from its surface areas. */
export function structuralWeightKg(
  floorAreaM2: number,
  roofAreaM2: number,
  wallAreaM2: number,
  insulationThicknessMm: number,
): number {
  const shellArea = floorAreaM2 + roofAreaM2 + wallAreaM2;
  const panelMassPerM2 = 18 + insulationThicknessMm * 0.42;
  const frameMass = shellArea * 6.5;
  return shellArea * panelMassPerM2 + frameMass;
}

/** Airlift sortie count at the 250 kg sling load. */
export function airliftSorties(weightKg: number): number {
  return Math.max(1, Math.ceil(weightKg / SLING_LOAD_KG));
}

/** Sapper man-hours to erect a shelter of the given shell area. */
export function sapperManHours(
  shellAreaM2: number,
  foundationMode: FoundationMode,
): number {
  const base = shellAreaM2 * 0.55;
  const foundationFactor =
    foundationMode === FoundationMode.slabOnGrade ? 1.35 : 1;
  return base * foundationFactor;
}

/** Capital cost in INR for a design configuration. */
export function capitalCostInr(
  shellAreaM2: number,
  config: DesignConfig,
): number {
  const insulationCostPerMm = 340;
  const coreCost: Record<ThermalMassCore, number> = {
    [ThermalMassCore.puf]: 4200,
    [ThermalMassCore.vip]: 9800,
    [ThermalMassCore.aerogel]: 14500,
    [ThermalMassCore.adobe]: 2600,
    [ThermalMassCore.pcm28]: 11200,
  };
  const insulation = Number(config.insulationThicknessMm) * insulationCostPerMm;
  const glazing =
    (Number(config.windowToWallRatioPct) / 100) * shellAreaM2 * 5200;
  const core = coreCost[config.thermalMassCore] ?? 0;
  const shell = shellAreaM2 * 3100;
  return Math.round(shell + insulation * (shellAreaM2 / 20) + glazing + core);
}

/** Build a Verdict record from a simulation result and geometry. */
export function buildVerdict(
  result: SimulationResult,
  shellAreaM2: number,
  config: DesignConfig,
  foundationMode: FoundationMode,
): Verdict {
  const weight = structuralWeightKg(
    shellAreaM2 * 0.4,
    shellAreaM2 * 0.3,
    shellAreaM2 * 0.3,
    Number(config.insulationThicknessMm),
  );
  const pmvValue = pmv(result.peakInteriorC, result.peakInteriorC, 45, 0.15);
  return {
    pmv: pmvValue,
    ppd: ppd(pmvValue),
    keroseneLitresPer24h: result.keroseneLitresPer24h,
    sapperManHours: sapperManHours(shellAreaM2, foundationMode),
    airliftSorties: BigInt(airliftSorties(weight)),
    structuralWeightKg: weight,
  };
}
