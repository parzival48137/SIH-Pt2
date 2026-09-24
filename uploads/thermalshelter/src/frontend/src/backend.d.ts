import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Analysis {
    id: RecordId;
    owner: Principal;
    createdAt: Timestamp;
    verdict: Verdict;
    shelterId: RecordId;
    caption: string;
    siteId: RecordId;
    config: DesignConfig;
}
export interface AnalysisInput {
    verdict: Verdict;
    shelterId: RecordId;
    caption: string;
    siteId: RecordId;
    config: DesignConfig;
}
export interface AnalysisUpdate {
    verdict: Verdict;
    shelterId: RecordId;
    caption: string;
    siteId: RecordId;
    config: DesignConfig;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface DesignConfig {
    thermalMassCore: ThermalMassCore;
    insulationThicknessMm: bigint;
    windowToWallRatioPct: bigint;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type RecordId = bigint;
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Shelter {
    id: RecordId;
    floorAreaM2: number;
    foundationMode: FoundationMode;
    owner: Principal;
    name: string;
    createdAt: Timestamp;
    wallAreaWestM2: number;
    roofAreaM2: number;
    wallAreaNorthM2: number;
    orientationAzimuthDeg: number;
    sourcePreset?: string;
    wallAreaEastM2: number;
    sourceFileName?: string;
    wallAreaSouthM2: number;
    interiorVolumeM3: number;
}
export interface ShelterInput {
    floorAreaM2: number;
    foundationMode: FoundationMode;
    name: string;
    wallAreaWestM2: number;
    roofAreaM2: number;
    wallAreaNorthM2: number;
    orientationAzimuthDeg: number;
    sourcePreset?: string;
    wallAreaEastM2: number;
    sourceFileName?: string;
    wallAreaSouthM2: number;
    interiorVolumeM3: number;
}
export interface ShelterUpdate {
    floorAreaM2: number;
    foundationMode: FoundationMode;
    name: string;
    wallAreaWestM2: number;
    roofAreaM2: number;
    wallAreaNorthM2: number;
    orientationAzimuthDeg: number;
    sourcePreset?: string;
    wallAreaEastM2: number;
    sourceFileName?: string;
    wallAreaSouthM2: number;
    interiorVolumeM3: number;
}
export interface Site {
    id: RecordId;
    latitude: number;
    owner: Principal;
    createdAt: Timestamp;
    climateProfile: ClimateProfile;
    airDensityKgM3: number;
    climateEndNs: Timestamp;
    sector: Sector;
    climateStartNs: Timestamp;
    longitude: number;
    caption: string;
    altitudeM: number;
}
export interface SiteInput {
    latitude: number;
    climateProfile: ClimateProfile;
    airDensityKgM3: number;
    climateEndNs: Timestamp;
    sector: Sector;
    climateStartNs: Timestamp;
    longitude: number;
    caption: string;
    altitudeM: number;
}
export interface SiteUpdate {
    latitude: number;
    climateProfile: ClimateProfile;
    airDensityKgM3: number;
    climateEndNs: Timestamp;
    sector: Sector;
    climateStartNs: Timestamp;
    longitude: number;
    caption: string;
    altitudeM: number;
}
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface Verdict {
    pmv: number;
    ppd: number;
    keroseneLitresPer24h: number;
    sapperManHours: number;
    airliftSorties: bigint;
    structuralWeightKg: number;
}
export enum ClimateProfile {
    compositeSummer = "compositeSummer",
    monsoonalTransition = "monsoonalTransition",
    extremeWinter = "extremeWinter"
}
export enum FoundationMode {
    elevatedSkids = "elevatedSkids",
    slabOnGrade = "slabOnGrade"
}
export enum Sector {
    northernSikkim = "northernSikkim",
    westernLadakh = "westernLadakh",
    tawang = "tawang",
    spitiKinnaur = "spitiKinnaur"
}
export enum ThermalMassCore {
    puf = "puf",
    vip = "vip",
    aerogel = "aerogel",
    adobe = "adobe",
    pcm28 = "pcm28"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a saved analysis for the caller.
     */
    createAnalysis(input: AnalysisInput): Promise<Analysis>;
    /**
     * / Create a saved shelter for the caller.
     */
    createShelter(input: ShelterInput): Promise<Shelter>;
    /**
     * / Create a saved site for the caller.
     */
    createSite(input: SiteInput): Promise<Site>;
    /**
     * / Delete one of the caller's saved analyses.
     */
    deleteAnalysis(id: RecordId): Promise<boolean>;
    /**
     * / Delete one of the caller's saved shelters.
     */
    deleteShelter(id: RecordId): Promise<boolean>;
    /**
     * / Delete one of the caller's saved sites.
     */
    deleteSite(id: RecordId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Read one of the caller's saved analyses.
     */
    getAnalysis(id: RecordId): Promise<Analysis | null>;
    /**
     * / Static Markdown documentation of the backend's public API.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Read one of the caller's saved shelters.
     */
    getShelter(id: RecordId): Promise<Shelter | null>;
    /**
     * / Read one of the caller's saved sites.
     */
    getSite(id: RecordId): Promise<Site | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the caller's saved analyses.
     */
    listAnalyses(): Promise<Array<Analysis>>;
    /**
     * / List the caller's saved shelters.
     */
    listShelters(): Promise<Array<Shelter>>;
    /**
     * / List the caller's saved sites.
     */
    listSites(): Promise<Array<Site>>;
    schema(): Promise<string>;
    /**
     * / Update one of the caller's saved analyses.
     */
    updateAnalysis(id: RecordId, input: AnalysisUpdate): Promise<Analysis | null>;
    /**
     * / Update one of the caller's saved shelters.
     */
    updateShelter(id: RecordId, input: ShelterUpdate): Promise<Shelter | null>;
    /**
     * / Update one of the caller's saved sites.
     */
    updateSite(id: RecordId, input: SiteUpdate): Promise<Site | null>;
}
