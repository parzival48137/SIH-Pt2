import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

const alice = createIdentity("alice");
const bob = createIdentity("bob");

/** A complete SiteInput, so every create call is explicit about its payload. */
function siteInput(caption: string) {
  return {
    caption,
    sector: { westernLadakh: null } as const,
    latitude: 34.1526,
    longitude: 77.5771,
    altitudeM: 3500,
    airDensityKgM3: 0.8123,
    climateProfile: { extremeWinter: null } as const,
    climateStartNs: 1_700_000_000_000_000_000n,
    climateEndNs: 1_700_100_000_000_000_000n,
  };
}

/** A complete ShelterInput with a non-zero envelope. */
function shelterInput(name: string) {
  return {
    name,
    sourcePreset: [] as [] | [string],
    sourceFileName: [] as [] | [string],
    floorAreaM2: 18,
    roofAreaM2: 19.2,
    wallAreaNorthM2: 10.8,
    wallAreaSouthM2: 10.8,
    wallAreaEastM2: 7.2,
    wallAreaWestM2: 7.2,
    interiorVolumeM3: 46.8,
    orientationAzimuthDeg: 90,
    foundationMode: { slabOnGrade: null } as const,
  };
}

/** A complete AnalysisInput referencing the given site and shelter. */
function analysisInput(caption: string, siteId: bigint, shelterId: bigint) {
  return {
    caption,
    siteId,
    shelterId,
    config: {
      insulationThicknessMm: 100n,
      windowToWallRatioPct: 15n,
      thermalMassCore: { puf: null } as const,
    },
    verdict: {
      keroseneLitresPer24h: 12.5,
      pmv: -0.4,
      ppd: 8.2,
      structuralWeightKg: 1450,
      airliftSorties: 6n,
      sapperManHours: 21.4,
    },
  };
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
    return;
  }
  // `[baseline, current]`, the same install contract the hosted deploy uses for
  // a converted project. The upgrade replays the chain from the legacy schema.
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BASELINE_WASM,
  });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  ({ actor, canisterId } = installed);
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  actor.setIdentity(alice);
  await expect(actor.listSites()).resolves.toEqual([]);
  await expect(actor.listShelters()).resolves.toEqual([]);
  await expect(actor.listAnalyses()).resolves.toEqual([]);
});

it("round-trips a site through the real canister", async () => {
  actor.setIdentity(alice);
  const created = await actor.createSite(siteInput("Leh ridge"));
  expect(created.id).toBeGreaterThanOrEqual(0n);
  expect(created.caption).toBe("Leh ridge");
  expect(created.altitudeM).toBeCloseTo(3500, 3);

  const listed = await actor.listSites();
  expect(listed).toHaveLength(1);
  expect(listed[0]).toMatchObject({ caption: "Leh ridge" });

  const fetched = await actor.getSite(created.id);
  expect(fetched).toHaveLength(1);
  expect(fetched[0]?.caption).toBe("Leh ridge");
});

it("round-trips a shelter through the real canister", async () => {
  actor.setIdentity(alice);
  const created = await actor.createShelter(shelterInput("Panel hut"));
  expect(created.name).toBe("Panel hut");
  expect(created.floorAreaM2).toBeCloseTo(18, 3);
  expect(created.interiorVolumeM3).toBeCloseTo(46.8, 3);

  const fetched = await actor.getShelter(created.id);
  expect(fetched).toHaveLength(1);
  expect(fetched[0]?.orientationAzimuthDeg).toBeCloseTo(90, 3);
});

it("round-trips an analysis through the real canister", async () => {
  actor.setIdentity(alice);
  const site = await actor.createSite(siteInput("Analysis site"));
  const shelter = await actor.createShelter(shelterInput("Analysis shelter"));
  const created = await actor.createAnalysis(
    analysisInput("Winter baseline", site.id, shelter.id),
  );
  expect(created.caption).toBe("Winter baseline");
  expect(created.verdict.keroseneLitresPer24h).toBeCloseTo(12.5, 3);
  expect(created.verdict.airliftSorties).toBe(6n);

  const listed = await actor.listAnalyses();
  expect(listed).toHaveLength(1);
  expect(listed[0]?.config.insulationThicknessMm).toBe(100n);
});

it("updates and deletes a site through the real canister", async () => {
  actor.setIdentity(alice);
  const created = await actor.createSite(siteInput("Before update"));
  const updated = await actor.updateSite(created.id, {
    ...siteInput("After update"),
    altitudeM: 4200,
  });
  expect(updated).toHaveLength(1);
  expect(updated[0]?.caption).toBe("After update");
  expect(updated[0]?.altitudeM).toBeCloseTo(4200, 3);

  await expect(actor.deleteSite(created.id)).resolves.toBe(true);
  await expect(actor.getSite(created.id)).resolves.toEqual([]);
});

it("does not show one caller's records to another", async () => {
  actor.setIdentity(alice);
  const created = await actor.createSite(siteInput("Alice private site"));

  actor.setIdentity(bob);
  expect(await actor.listSites()).toEqual([]);
  await expect(actor.getSite(created.id)).resolves.toEqual([]);
  await expect(actor.deleteSite(created.id)).resolves.toBe(false);

  // Alice's record is untouched by Bob's failed delete.
  actor.setIdentity(alice);
  const stillThere = await actor.getSite(created.id);
  expect(stillThere).toHaveLength(1);
});

it("scopes an anonymous caller's records to the anonymous principal", async () => {
  // A freshly created actor calls as the anonymous principal until an identity
  // is set. Writes are owner-scoped rather than auth-gated, so the anonymous
  // caller gets its own namespace and cannot see Alice's records.
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  const created = await guest.createSite(siteInput("Anonymous site"));
  expect(created.caption).toBe("Anonymous site");

  const guestSites = await guest.listSites();
  expect(guestSites.map((site) => site.caption)).toContain("Anonymous site");

  actor.setIdentity(alice);
  const aliceSites = await actor.listSites();
  expect(aliceSites.map((site) => site.caption)).not.toContain("Anonymous site");
});
