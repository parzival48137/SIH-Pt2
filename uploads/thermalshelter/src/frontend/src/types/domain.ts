import type {
  Analysis,
  AnalysisInput,
  DesignConfig,
  Shelter,
  ShelterInput,
  Site,
  SiteInput,
  Verdict,
} from "@/backend";
import {
  ClimateProfile,
  FoundationMode,
  Sector,
  ThermalMassCore,
} from "@/backend";

export { ClimateProfile, FoundationMode, Sector, ThermalMassCore };
export type {
  Analysis,
  AnalysisInput,
  DesignConfig,
  Shelter,
  ShelterInput,
  Site,
  SiteInput,
  Verdict,
};

/** A single day of site climate, one value per hour (24 entries). */
export interface ClimateDay {
  /** Ambient dry-bulb temperature, degrees Celsius. */
  temperatureC: number[];
  /** All-sky shortwave downwelling irradiance, W/m^2. */
  solarWm2: number[];
  /** Wind speed at 10 m, m/s. */
  windSpeedMs: number[];
  /** Wind direction, degrees clockwise from north. */
  windDirectionDeg: number[];
}

/** A pre-compiled seasonal climate profile used when the network is offline. */
export interface ClimateProfileData {
  profile: ClimateProfile;
  sector: Sector;
  label: string;
  description: string;
  /** Representative day used for the offline fallback run. */
  day: ClimateDay;
}

/** Result of one 24-hour transient energy-balance run. */
export interface SimulationResult {
  /** Interior air temperature per hour, degrees Celsius. */
  interiorC: number[];
  /** Outdoor ambient temperature per hour, degrees Celsius. */
  ambientC: number[];
  /** Interior relative humidity per hour, percent. */
  interiorRhPct: number[];
  /** Interior surface temperature per hour, degrees Celsius. */
  surfaceC: number[];
  /** Dew point per hour, degrees Celsius. */
  dewPointC: number[];
  /** True when any hour breaches the dew point on an interior surface. */
  dewPointBreach: boolean;
  /** Hour index of the first breach, or null. */
  breachHour: number | null;
  /** Peak interior temperature, degrees Celsius. */
  peakInteriorC: number;
  /** Minimum interior temperature, degrees Celsius. */
  minInteriorC: number;
  /** Thermal energy deficit against the +15C target, kWh. */
  deficitKwh: number;
  /** Kerosene required to cover the deficit, litres per 24 h. */
  keroseneLitresPer24h: number;
}

/** One point on the design-space Pareto front. */
export interface ParetoPoint {
  config: DesignConfig;
  capitalCostInr: number;
  keroseneLitresPer24h: number;
  structuralWeightKg: number;
  airliftSorties: number;
  sapperManHours: number;
  pmv: number;
  ppd: number;
  /** True when no other configuration dominates this one. */
  onFront: boolean;
}

/** A saved analysis joined with its site and shelter for display. */
export interface AnalysisRecord {
  analysis: Analysis;
  site: Site | null;
  shelter: Shelter | null;
}
