import { ClimateProfile, Sector } from "@/backend";
import type { ClimateProfileData } from "@/types/domain";

export interface SectorPreset {
  sector: Sector;
  name: string;
  /** Short operational descriptor for the preset chip. */
  descriptor: string;
  latitude: number;
  longitude: number;
  /** Nominal ground elevation, metres above sea level. */
  altitudeM: number;
}

/** The four operational sectors with their reference coordinates. */
export const SECTOR_PRESETS: SectorPreset[] = [
  {
    sector: Sector.westernLadakh,
    name: "Western Ladakh",
    descriptor: "Leh · Indus valley",
    latitude: 34.1526,
    longitude: 77.5771,
    altitudeM: 3500,
  },
  {
    sector: Sector.spitiKinnaur,
    name: "Spiti–Kinnaur",
    descriptor: "Kaza · Sutlej gorge",
    latitude: 32.2263,
    longitude: 78.0715,
    altitudeM: 3800,
  },
  {
    sector: Sector.northernSikkim,
    name: "Northern Sikkim",
    descriptor: "Lachen · Teesta head",
    latitude: 27.7167,
    longitude: 88.55,
    altitudeM: 3400,
  },
  {
    sector: Sector.tawang,
    name: "Tawang",
    descriptor: "Tawang chu · 4,500 m pass",
    latitude: 27.5859,
    longitude: 91.8594,
    altitudeM: 3000,
  },
];

export function getSectorPreset(sector: Sector): SectorPreset {
  return (
    SECTOR_PRESETS.find((preset) => preset.sector === sector) ??
    SECTOR_PRESETS[0]
  );
}

export function sectorLabel(sector: Sector): string {
  return getSectorPreset(sector).name;
}

export function climateProfileLabel(profile: ClimateProfile): string {
  switch (profile) {
    case ClimateProfile.extremeWinter:
      return "Extreme Winter";
    case ClimateProfile.compositeSummer:
      return "Composite Summer";
    case ClimateProfile.monsoonalTransition:
      return "Monsoonal Transition";
  }
}

/**
 * Build a smooth 24-hour diurnal curve from a daily mean, amplitude and
 * solar peak. Used to compile the offline fallback profiles.
 */
function diurnalCurve(
  mean: number,
  amplitude: number,
  peakHour: number,
): number[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const phase = ((hour - peakHour) / 24) * Math.PI * 2;
    return mean + amplitude * Math.cos(phase);
  });
}

/** Solar irradiance curve peaking at local solar noon. */
function solarCurve(peakWm2: number): number[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    return peakWm2 * daylight;
  });
}

function constantCurve(value: number): number[] {
  return Array.from({ length: 24 }, () => value);
}

interface ProfileSeed {
  profile: ClimateProfile;
  label: string;
  description: string;
  meanC: number;
  amplitudeC: number;
  peakSolarWm2: number;
  windMs: number;
  windDirDeg: number;
}

const PROFILE_SEEDS: ProfileSeed[] = [
  {
    profile: ClimateProfile.extremeWinter,
    label: "Extreme Winter",
    description: "Clear, still, deep cold. Strong radiative loss after dusk.",
    meanC: -18,
    amplitudeC: 9,
    peakSolarWm2: 520,
    windMs: 3.2,
    windDirDeg: 300,
  },
  {
    profile: ClimateProfile.compositeSummer,
    label: "Composite Summer",
    description: "High insolation, wide diurnal swing, dry air.",
    meanC: 6,
    amplitudeC: 11,
    peakSolarWm2: 980,
    windMs: 5.4,
    windDirDeg: 240,
  },
  {
    profile: ClimateProfile.monsoonalTransition,
    label: "Monsoonal Transition",
    description: "Overcast, humid, moderate wind with frequent cloud cover.",
    meanC: 2,
    amplitudeC: 5,
    peakSolarWm2: 420,
    windMs: 6.8,
    windDirDeg: 180,
  },
];

/** Pre-compiled seasonal profiles for every sector, for offline runs. */
export const CLIMATE_PROFILES: ClimateProfileData[] = SECTOR_PRESETS.flatMap(
  (preset) =>
    PROFILE_SEEDS.map((seed) => ({
      profile: seed.profile,
      sector: preset.sector,
      label: seed.label,
      description: seed.description,
      day: {
        temperatureC: diurnalCurve(seed.meanC, seed.amplitudeC, 14),
        solarWm2: solarCurve(seed.peakSolarWm2),
        windSpeedMs: constantCurve(seed.windMs),
        windDirectionDeg: constantCurve(seed.windDirDeg),
      },
    })),
);

export function getClimateProfile(
  sector: Sector,
  profile: ClimateProfile,
): ClimateProfileData {
  return (
    CLIMATE_PROFILES.find(
      (entry) => entry.sector === sector && entry.profile === profile,
    ) ?? CLIMATE_PROFILES[0]
  );
}
