import {
  type ClimateProfile,
  type FoundationMode,
  ThermalMassCore,
} from "@/backend";
import type {
  ClimateDay,
  DesignConfig,
  SimulationResult,
} from "@/types/domain";
import { create } from "zustand";

/** The default design configuration loaded into the simulation. */
export const DEFAULT_CONFIG: DesignConfig = {
  insulationThicknessMm: 100n,
  windowToWallRatioPct: 15n,
  thermalMassCore: ThermalMassCore.puf,
};

export interface ActiveSite {
  id: bigint | null;
  caption: string;
  sector: import("@/backend").Sector;
  latitude: number;
  longitude: number;
  altitudeM: number;
  airDensityKgM3: number;
  climateProfile: ClimateProfile;
  climateStartNs: bigint;
  climateEndNs: bigint;
  /** True when the climate window came from the offline fallback profiles. */
  usingFallback: boolean;
}

export interface ActiveShelter {
  id: bigint | null;
  name: string;
  floorAreaM2: number;
  roofAreaM2: number;
  wallAreaNorthM2: number;
  wallAreaSouthM2: number;
  wallAreaEastM2: number;
  wallAreaWestM2: number;
  interiorVolumeM3: number;
  orientationAzimuthDeg: number;
  foundationMode: FoundationMode;
  sourcePreset?: string;
  sourceFileName?: string;
}

interface AnalysisState {
  activeSite: ActiveSite | null;
  activeShelter: ActiveShelter | null;
  config: DesignConfig;
  /** Live NASA POWER climate day for the active site, or null when offline. */
  liveClimateDay: ClimateDay | null;
  latestResult: SimulationResult | null;
  /** True when the latest run used offline fallback climate data. */
  latestUsedFallback: boolean;
  setActiveSite: (site: ActiveSite | null) => void;
  setActiveShelter: (shelter: ActiveShelter | null) => void;
  setConfig: (config: DesignConfig) => void;
  patchConfig: (patch: Partial<DesignConfig>) => void;
  setLiveClimateDay: (day: ClimateDay | null) => void;
  setLatestResult: (
    result: SimulationResult | null,
    usedFallback: boolean,
  ) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  activeSite: null,
  activeShelter: null,
  config: DEFAULT_CONFIG,
  liveClimateDay: null,
  latestResult: null,
  latestUsedFallback: false,
  setActiveSite: (site) => set({ activeSite: site }),
  setActiveShelter: (shelter) => set({ activeShelter: shelter }),
  setConfig: (config) => set({ config }),
  patchConfig: (patch) =>
    set((state) => ({ config: { ...state.config, ...patch } })),
  setLiveClimateDay: (day) => set({ liveClimateDay: day }),
  setLatestResult: (result, usedFallback) =>
    set({ latestResult: result, latestUsedFallback: usedFallback }),
  reset: () =>
    set({
      activeSite: null,
      activeShelter: null,
      config: DEFAULT_CONFIG,
      liveClimateDay: null,
      latestResult: null,
      latestUsedFallback: false,
    }),
}));
