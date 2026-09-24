mixin () {
  /// Static Markdown documentation of the backend's public API.
  public query func getApiDoc() : async Text {
    "# Cold-Region Shelter Analysis Backend\n\n" #
    "This canister persists the user's saved **sites**, **shelters**, and **analyses**\n" #
    "for a high-altitude cold-region shelter design tool. All three record types are\n" #
    "owner-scoped: every record carries an `owner` principal, and every read or write\n" #
    "is filtered by the caller's principal.\n\n" #
    "## Authentication and authorization\n\n" #
    "- Every endpoint below is a `shared` function that reads the caller's principal\n" #
    "  from the message context. There is no anonymous read path: a caller that is not\n" #
    "  signed in with Internet Identity is treated as an anonymous principal and owns\n" #
    "  no records, so list endpoints return an empty array and get/update/delete\n" #
    "  return no result or `false`.\n" #
    "- Ownership is derived from the caller principal at write time: `create*` stamps\n" #
    "  `owner = caller`. There is no way to create a record owned by another\n" #
    "  principal, and no endpoint accepts an owner as input.\n" #
    "- `list*` returns only the caller's own records. `get*`, `update*`, and\n" #
    "  `delete*` operate only on records whose `owner` equals the caller; a record\n" #
    "  that exists but belongs to someone else is indistinguishable from a missing\n" #
    "  record (see *Error behaviour*).\n" #
    "- The canister also exposes the standard authorization mixin\n" #
    "  (`assignCallerUserRole`, `getCallerUserRole`, `isCallerAdmin`). The first\n" #
    "  caller to initialize access control becomes the admin; subsequent callers\n" #
    "  receive the default role. Admin status does **not** widen access to the\n" #
    "  owner-scoped CRUD endpoints above — those remain strictly per-owner.\n" #
    "- The app's frontend pins an Internet Identity derivation origin, published at\n" #
    "  `/.well-known/ii-derivation-origin` when available. An agent already holding\n" #
    "  the user's Internet Identity authorization derives the correct per-app\n" #
    "  principal against that origin (for example\n" #
    "  `icp identity link web <name> --app <host>`). Such a delegation acts with the\n" #
    "  user's full authority in this app until it expires.\n" #
    "- Registration is a prerequisite for any role-guarded call: a direct API caller\n" #
    "  must call `_initialize_access_control` once as a signed-in caller before any\n" #
    "  role-guarded call, including guarded queries. The first initializer receives\n" #
    "  the admin role; every subsequent caller receives the default role. An\n" #
    "  unregistered or anonymous caller on a guarded endpoint is rejected with the\n" #
    "  authorization mixin's trap message. A caller can be unregistered while\n" #
    "  assuming the app already knows it, because registration happens only when a\n" #
    "  caller signs in through the app's own frontend — a principal that never did so\n" #
    "  is unregistered even when it belongs to the app's owner, and a signed-in\n" #
    "  caller derived against a different origin is a different principal than the\n" #
    "  one the frontend registered.\n\n" #
    "## Endpoint groups\n\n" #
    "### Saved sites\n\n" #
    "| Method | Signature | Notes |\n" #
    "| --- | --- | --- |\n" #
    "| `listSites` | `() -> [Site]` | Caller's sites, newest first. |\n" #
    "| `getSite` | `(id : Nat) -> ?Site` | `null` if missing or not owned. |\n" #
    "| `createSite` | `(input : SiteInput) -> Site` | Assigns `id` and `createdAt`. |\n" #
    "| `updateSite` | `(id : Nat, input : SiteUpdate) -> ?Site` | `null` if missing or not owned. |\n" #
    "| `deleteSite` | `(id : Nat) -> Bool` | `false` if missing or not owned. |\n\n" #
    "A `Site` records the ingested climate and topography for one location:\n" #
    "`caption`, `sector`, `latitude`, `longitude`, `altitudeM`, `airDensityKgM3`,\n" #
    "`climateProfile`, `climateStartNs`, `climateEndNs`, plus server-assigned `id`,\n" #
    "`owner`, and `createdAt`.\n\n" #
    "### Saved shelters\n\n" #
    "| Method | Signature | Notes |\n" #
    "| --- | --- | --- |\n" #
    "| `listShelters` | `() -> [Shelter]` | Caller's shelters, newest first. |\n" #
    "| `getShelter` | `(id : Nat) -> ?Shelter` | `null` if missing or not owned. |\n" #
    "| `createShelter` | `(input : ShelterInput) -> Shelter` | Assigns `id` and `createdAt`. |\n" #
    "| `updateShelter` | `(id : Nat, input : ShelterUpdate) -> ?Shelter` | `null` if missing or not owned. |\n" #
    "| `deleteShelter` | `(id : Nat) -> Bool` | `false` if missing or not owned. |\n\n" #
    "A `Shelter` records the decomposed geometry of one structure: `name`,\n" #
    "optional `sourcePreset` and `sourceFileName`, `floorAreaM2`, `roofAreaM2`,\n" #
    "`wallAreaNorthM2`, `wallAreaSouthM2`, `wallAreaEastM2`, `wallAreaWestM2`,\n" #
    "`interiorVolumeM3`, `orientationAzimuthDeg`, `foundationMode`, plus\n" #
    "server-assigned `id`, `owner`, and `createdAt`.\n\n" #
    "### Saved analyses\n\n" #
    "| Method | Signature | Notes |\n" #
    "| --- | --- | --- |\n" #
    "| `listAnalyses` | `() -> [Analysis]` | Caller's analyses, newest first. |\n" #
    "| `getAnalysis` | `(id : Nat) -> ?Analysis` | `null` if missing or not owned. |\n" #
    "| `createAnalysis` | `(input : AnalysisInput) -> Analysis` | Assigns `id` and `createdAt`. |\n" #
    "| `updateAnalysis` | `(id : Nat, input : AnalysisUpdate) -> ?Analysis` | `null` if missing or not owned. |\n" #
    "| `deleteAnalysis` | `(id : Nat) -> Bool` | `false` if missing or not owned. |\n\n" #
    "An `Analysis` links a site and a shelter to a design configuration and its\n" #
    "computed verdict: `caption`, `siteId`, `shelterId`, `config`\n" #
    "(`insulationThicknessMm`, `windowToWallRatioPct`, `thermalMassCore`), `verdict`\n" #
    "(`keroseneLitresPer24h`, `pmv`, `ppd`, `structuralWeightKg`, `airliftSorties`,\n" #
    "`sapperManHours`), plus server-assigned `id`, `owner`, and `createdAt`.\n\n" #
    "`siteId` and `shelterId` are plain references. The backend does not verify that\n" #
    "the referenced site or shelter exists or is owned by the caller, and deleting a\n" #
    "site or shelter does not cascade to analyses that reference it.\n\n" #
    "## Units and encodings\n\n" #
    "- **Identifiers** — `id`, `siteId`, `shelterId` are `Nat` values drawn from a\n" #
    "  single shared counter, so ids are unique across all three collections but not\n" #
    "  contiguous within any one of them.\n" #
    "- **Timestamps** — `createdAt`, `climateStartNs`, and `climateEndNs` are\n" #
    "  `Int` nanoseconds since the Unix epoch. `createdAt` is stamped server-side\n" #
    "  from the canister clock at creation; it is not accepted as input.\n" #
    "- **Lengths and areas** — `altitudeM`, `floorAreaM2`, `roofAreaM2`,\n" #
    "  `wallArea*M2`, `interiorVolumeM3` are metres, square metres, and cubic metres.\n" #
    "- **Angles** — `latitude` and `longitude` are decimal degrees;\n" #
    "  `orientationAzimuthDeg` is a compass azimuth in degrees.\n" #
    "- **Air density** — `airDensityKgM3` is kilograms per cubic metre, corrected\n" #
    "  for site altitude.\n" #
    "- **Cost and fuel** — procurement cost is in INR; `keroseneLitresPer24h` is\n" #
    "  litres of kerosene per 24 hours.\n" #
    "- **Comfort** — `pmv` is the ASHRAE-55 Predicted Mean Vote and `ppd` the\n" #
    "  Predicted Percentage of Dissatisfied.\n" #
    "- **Logistics** — `structuralWeightKg` is kilograms, `airliftSorties` a count\n" #
    "  of sorties, `sapperManHours` man-hours.\n" #
    "- **Variant encodings** — `sector` is one of `westernLadakh`, `spitiKinnaur`,\n" #
    "  `northernSikkim`, `tawang`; `climateProfile` is one of `extremeWinter`,\n" #
    "  `compositeSummer`, `monsoonalTransition`; `foundationMode` is one of\n" #
    "  `slabOnGrade`, `elevatedSkids`; `thermalMassCore` is one of `puf`, `aerogel`,\n" #
    "  `adobe`, `pcm28`, `vip`.\n" #
    "- **Optional fields** — `sourcePreset` and `sourceFileName` are `?Text` and may\n" #
    "  be `null`.\n\n" #
    "## Lifecycle and persistence\n\n" #
    "- Records persist across canister upgrades through the enhanced migration\n" #
    "  chain; no endpoint is required to flush or save state.\n" #
    "- `create*` returns the fully populated record, including its server-assigned\n" #
    "  `id` and `createdAt`. Use that returned `id` for subsequent `get*`, `update*`,\n" #
    "  and `delete*` calls.\n" #
    "- `list*` returns the caller's records sorted by `createdAt` descending, so the\n" #
    "  newest record is first. There is no pagination, filtering, or search\n" #
    "  parameter; the full owned set is returned.\n" #
    "- `update*` replaces the caller-supplied fields wholesale; it does not merge\n" #
    "  partial input. Fields omitted from the update input are not preserved — send\n" #
    "  the complete desired state. `id`, `owner`, and `createdAt` are never changed\n" #
    "  by an update.\n\n" #
    "## Mutation retry safety\n\n" #
    "- `create*` is **not** idempotent: each successful call allocates a new `id`\n" #
    "  and inserts a new record. Retrying a create after a timeout that actually\n" #
    "  succeeded produces a duplicate record. When a create's outcome is unknown,\n" #
    "  call `list*` and check for the record before retrying.\n" #
    "- `update*` is idempotent: applying the same full input twice yields the same\n" #
    "  record state.\n" #
    "- `delete*` is idempotent in effect: the first call removes the record and\n" #
    "  returns `true`; a retry returns `false` because the record is already gone.\n" #
    "  Treat `false` on a retry as success, not as a new failure.\n" #
    "- All mutations are single-message and atomic; a failed call leaves no partial\n" #
    "  state.\n\n" #
    "## Error behaviour\n\n" #
    "- `get*` and `update*` return `null` when the id does not exist **or** when the\n" #
    "  record exists but is owned by a different principal. The two cases are\n" #
    "  deliberately indistinguishable, so a caller cannot probe for the existence of\n" #
    "  another user's records.\n" #
    "- `delete*` returns `false` in both of those cases.\n" #
    "- `list*` never fails for a signed-in caller; it returns an empty array when the\n" #
    "  caller owns nothing.\n" #
    "- There are no error variants or trap messages on the CRUD endpoints — absence\n" #
    "  and non-ownership are reported through `null` / `false` / empty array.\n\n" #
    "## Gotchas\n\n" #
    "- The site and analysis display name field is **`caption`**, not `label`\n" #
    "  (`label` is a reserved word in Motoko).\n" #
    "- List endpoints return **only the caller's own records**, sorted newest first.\n" #
    "  There is no cross-user or global listing.\n" #
    "- `create*` accepts no `owner` and no `createdAt`; both are assigned by the\n" #
    "  canister. Passing an owner is impossible by construction.\n" #
    "- `update*` is a full replace, not a patch.\n" #
    "- `siteId` / `shelterId` are not validated against existing records and are not\n" #
    "  cascaded on delete.\n" #
    "- Ids are shared across the three collections, so a site id and a shelter id can\n" #
    "  never collide, but ids are not sequential within a collection.\n";
  };
};
