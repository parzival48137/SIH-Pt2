import { type ClimateProfile, FoundationMode, type Sector } from "@/backend";
import {
  airDensityAtAltitude,
  dewPoint,
  keroseneFromDeficit,
  mcadamsConvection,
  solarAzimuth,
  solarDeclination,
  solarIncidence,
  solarZenith,
  thermalDeficitKwh,
} from "@/lib/physics";
import { getClimateProfile } from "@/lib/sectors";
import type {
  ClimateDay,
  ClimateProfileData,
  SimulationResult,
} from "@/types/domain";

const NASA_POWER_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point";
const OPEN_METEO_ELEVATION = "https://api.open-meteo.com/v1/elevation";

export interface ClimateFetchParams {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
}

export interface ClimateFetchResult {
  day: ClimateDay;
  /** True when the values came from the bundled offline profiles. */
  fallback: boolean;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Fetch a representative daily climate day from the NASA POWER point API.
 * Falls back to the bundled seasonal profile when the network is unavailable.
 */
export async function fetchSiteClimate(
  params: ClimateFetchParams,
  sector: Sector,
  profile: ClimateProfile,
): Promise<ClimateFetchResult> {
  const fallback = getClimateProfile(sector, profile);
  try {
    const url = new URL(NASA_POWER_BASE);
    url.searchParams.set("parameters", "T2M,ALLSKY_SFC_SW_DWN,WS10M,WD10M");
    url.searchParams.set("community", "RE");
    url.searchParams.set("longitude", String(params.longitude));
    url.searchParams.set("latitude", String(params.latitude));
    url.searchParams.set("start", toDateString(new Date(params.startDate)));
    url.searchParams.set("end", toDateString(new Date(params.endDate)));
    url.searchParams.set("format", "JSON");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`NASA POWER ${response.status}`);
    const payload = (await response.json()) as {
      properties?: {
        parameter?: Record<string, Record<string, number>>;
      };
    };
    const parameter = payload.properties?.parameter;
    if (!parameter) throw new Error("NASA POWER payload missing parameters");

    const keys = Object.keys(parameter.T2M ?? {}).sort();
    if (keys.length === 0) throw new Error("NASA POWER returned no days");

    const temperatureC = keys.map((key) => parameter.T2M[key]);
    const solarWm2 = keys.map((key) => parameter.ALLSKY_SFC_SW_DWN[key]);
    const windSpeedMs = keys.map((key) => parameter.WS10M[key]);
    const windDirectionDeg = keys.map((key) => parameter.WD10M[key]);

    return {
      day: {
        temperatureC: expandTo24(temperatureC),
        solarWm2: expandTo24(solarWm2),
        windSpeedMs: expandTo24(windSpeedMs),
        windDirectionDeg: expandTo24(windDirectionDeg),
      },
      fallback: false,
    };
  } catch {
    return { day: fallback.day, fallback: true };
  }
}

/** Spread a daily series across 24 hours by linear interpolation. */
function expandTo24(daily: number[]): number[] {
  if (daily.length === 0) return Array.from({ length: 24 }, () => 0);
  if (daily.length === 1) return Array.from({ length: 24 }, () => daily[0]);
  return Array.from({ length: 24 }, (_, hour) => {
    const position = (hour / 24) * (daily.length - 1);
    const lower = Math.floor(position);
    const upper = Math.min(daily.length - 1, lower + 1);
    const fraction = position - lower;
    return daily[lower] * (1 - fraction) + daily[upper] * fraction;
  });
}

/** Fetch site elevation in metres from the Open-Meteo elevation API. */
export async function fetchElevation(
  latitude: number,
  longitude: number,
): Promise<number | null> {
  try {
    const url = new URL(OPEN_METEO_ELEVATION);
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const payload = (await response.json()) as { elevation?: number[] };
    const elevation = payload.elevation?.[0];
    return typeof elevation === "number" ? elevation : null;
  } catch {
    return null;
  }
}

export interface SimulationInputs {
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
  foundationMode: FoundationMode;
  insulationThicknessMm: number;
  ach: number;
  occupants: number;
  equipmentLoadW: number;
  heatingKw: number;
}

const U_VALUE_BASE = 0.42; // W/(m^2 K) at 50 mm reference insulation
const OCCUPANT_VAPOUR_G_PER_H = 55;
const OCCUPANT_SENSIBLE_W = 120;

/**
 * Run a 24-hour transient energy-balance simulation with explicit
 * time-stepping. Pure function: no React, no side effects.
 */
export function runSimulation(inputs: SimulationInputs): SimulationResult {
  const {
    day,
    latitude,
    altitudeM,
    floorAreaM2,
    roofAreaM2,
    wallAreaNorthM2,
    wallAreaSouthM2,
    wallAreaEastM2,
    wallAreaWestM2,
    interiorVolumeM3,
    orientationAzimuthDeg,
    foundationMode,
    insulationThicknessMm,
    ach,
    occupants,
    equipmentLoadW,
    heatingKw,
  } = inputs;

  const airDensity = airDensityAtAltitude(altitudeM);
  const insulationM = Math.max(0.02, Number(insulationThicknessMm) / 1000);
  const uValue = U_VALUE_BASE * (0.05 / insulationM);
  const shellArea =
    floorAreaM2 +
    roofAreaM2 +
    wallAreaNorthM2 +
    wallAreaSouthM2 +
    wallAreaEastM2 +
    wallAreaWestM2;
  const thermalMassJ =
    shellArea * 0.12 * 1_000_000 + interiorVolumeM3 * airDensity * 1005;
  const dtSeconds = 3600;

  const declination = solarDeclination(172);
  const interiorC: number[] = [];
  const ambientC: number[] = [];
  const interiorRhPct: number[] = [];
  const surfaceC: number[] = [];
  const dewPointC: number[] = [];

  let temperature = day.temperatureC[0] + 4;
  let humidityRatio = 0.004;

  for (let hour = 0; hour < 24; hour += 1) {
    const ambient = day.temperatureC[hour];
    const wind = day.windSpeedMs[hour];
    const hourAngle = (hour - 12) * 15;
    const zenith = solarZenith(latitude, declination, hourAngle);
    const azimuth = solarAzimuth(latitude, declination, hourAngle);
    const irradiance = day.solarWm2[hour];

    const roofGain =
      irradiance * solarIncidence(zenith, azimuth, 0, 0) * roofAreaM2 * 0.85;
    const wallGain =
      irradiance *
      (solarIncidence(zenith, azimuth, 90, orientationAzimuthDeg) *
        wallAreaNorthM2 +
        solarIncidence(
          zenith,
          azimuth,
          90,
          (orientationAzimuthDeg + 90) % 360,
        ) *
          wallAreaEastM2 +
        solarIncidence(
          zenith,
          azimuth,
          90,
          (orientationAzimuthDeg + 180) % 360,
        ) *
          wallAreaSouthM2 +
        solarIncidence(
          zenith,
          azimuth,
          90,
          (orientationAzimuthDeg + 270) % 360,
        ) *
          wallAreaWestM2) *
      0.72;

    const convection = mcadamsConvection(wind);
    const externalFilm = 1 / (1 / uValue + 1 / convection);
    const envelopeLoss = externalFilm * shellArea * (temperature - ambient);

    const foundationLoss =
      foundationMode === FoundationMode.slabOnGrade
        ? 0.9 * floorAreaM2 * (temperature - -2)
        : 0.35 * floorAreaM2 * (temperature - ambient);

    const infiltration =
      (ach * interiorVolumeM3 * airDensity * 1005 * (temperature - ambient)) /
      3600;

    const internalGain =
      occupants * OCCUPANT_SENSIBLE_W + equipmentLoadW + heatingKw * 1000;

    const netWatts =
      roofGain +
      wallGain +
      internalGain -
      envelopeLoss -
      foundationLoss -
      infiltration;

    temperature += (netWatts * dtSeconds) / thermalMassJ;
    temperature = Math.max(-45, Math.min(45, temperature));

    const vapourGain = (occupants * OCCUPANT_VAPOUR_G_PER_H) / 1000 / 3600;
    const ventilationLoss =
      (ach * interiorVolumeM3 * airDensity * humidityRatio) / 3600;
    humidityRatio = Math.max(
      0.0005,
      humidityRatio +
        (vapourGain - ventilationLoss) / (interiorVolumeM3 * airDensity),
    );

    const saturationPressure =
      610.94 * Math.exp((17.625 * temperature) / (temperature + 243.04));
    const vapourPressure = (humidityRatio * 101325) / (0.622 + humidityRatio);
    const rh = Math.min(
      100,
      Math.max(5, (vapourPressure / saturationPressure) * 100),
    );

    const surfaceTemperature =
      temperature - (uValue * (temperature - ambient)) / 8.5;

    interiorC.push(temperature);
    ambientC.push(ambient);
    interiorRhPct.push(rh);
    surfaceC.push(surfaceTemperature);
    dewPointC.push(dewPoint(temperature, rh));
  }

  let breachHour: number | null = null;
  for (let hour = 0; hour < 24; hour += 1) {
    if (surfaceC[hour] <= dewPointC[hour]) {
      breachHour = hour;
      break;
    }
  }

  const deficitKwh = thermalDeficitKwh(interiorC, interiorVolumeM3, airDensity);

  return {
    interiorC,
    ambientC,
    interiorRhPct,
    surfaceC,
    dewPointC,
    dewPointBreach: breachHour !== null,
    breachHour,
    peakInteriorC: Math.max(...interiorC),
    minInteriorC: Math.min(...interiorC),
    deficitKwh,
    keroseneLitresPer24h: keroseneFromDeficit(deficitKwh),
  };
}

/** Convenience: run the offline fallback profile for a sector. */
export function runFallbackSimulation(
  sector: Sector,
  profile: ClimateProfile,
  inputs: Omit<SimulationInputs, "day">,
): SimulationResult {
  const data: ClimateProfileData = getClimateProfile(sector, profile);
  return runSimulation({ ...inputs, day: data.day });
}

export { toIsoDate };
