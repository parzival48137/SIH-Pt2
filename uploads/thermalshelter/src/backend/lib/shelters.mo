import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/shelters";
import Common "../types/common";

module {
  /// List every shelter owned by the caller, newest first.
  public func listShelters(shelters : Map.Map<Common.RecordId, Types.Shelter>, caller : Principal) : [Types.Shelter] {
    let owned = shelters.values().filter(func (shelter) = Principal.equal(shelter.owner, caller)).toArray();
    owned.sort(func (a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
  };

  /// Read one shelter owned by the caller.
  public func getShelter(shelters : Map.Map<Common.RecordId, Types.Shelter>, caller : Principal, id : Common.RecordId) : ?Types.Shelter {
    switch (shelters.get(id)) {
      case (?shelter) {
        if (Principal.equal(shelter.owner, caller)) { ?shelter } else { null };
      };
      case null { null };
    };
  };

  /// Create a shelter owned by the caller and return it.
  public func createShelter(
    shelters : Map.Map<Common.RecordId, Types.Shelter>,
    ids : Common.IdState,
    caller : Principal,
    input : Types.ShelterInput,
    now : Common.Timestamp,
  ) : Types.Shelter {
    let id = ids.nextId;
    ids.nextId := id + 1;
    let shelter : Types.Shelter = {
      id;
      owner = caller;
      name = input.name;
      sourcePreset = input.sourcePreset;
      sourceFileName = input.sourceFileName;
      floorAreaM2 = input.floorAreaM2;
      roofAreaM2 = input.roofAreaM2;
      wallAreaNorthM2 = input.wallAreaNorthM2;
      wallAreaSouthM2 = input.wallAreaSouthM2;
      wallAreaEastM2 = input.wallAreaEastM2;
      wallAreaWestM2 = input.wallAreaWestM2;
      interiorVolumeM3 = input.interiorVolumeM3;
      orientationAzimuthDeg = input.orientationAzimuthDeg;
      foundationMode = input.foundationMode;
      createdAt = now;
    };
    shelters.add(id, shelter);
    shelter;
  };

  /// Update a shelter owned by the caller.
  public func updateShelter(
    shelters : Map.Map<Common.RecordId, Types.Shelter>,
    caller : Principal,
    id : Common.RecordId,
    input : Types.ShelterUpdate,
  ) : ?Types.Shelter {
    switch (shelters.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) {
          return null;
        };
        let updated : Types.Shelter = {
          id = existing.id;
          owner = existing.owner;
          name = input.name;
          sourcePreset = input.sourcePreset;
          sourceFileName = input.sourceFileName;
          floorAreaM2 = input.floorAreaM2;
          roofAreaM2 = input.roofAreaM2;
          wallAreaNorthM2 = input.wallAreaNorthM2;
          wallAreaSouthM2 = input.wallAreaSouthM2;
          wallAreaEastM2 = input.wallAreaEastM2;
          wallAreaWestM2 = input.wallAreaWestM2;
          interiorVolumeM3 = input.interiorVolumeM3;
          orientationAzimuthDeg = input.orientationAzimuthDeg;
          foundationMode = input.foundationMode;
          createdAt = existing.createdAt;
        };
        shelters.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  /// Delete a shelter owned by the caller.
  public func deleteShelter(shelters : Map.Map<Common.RecordId, Types.Shelter>, caller : Principal, id : Common.RecordId) : Bool {
    switch (shelters.get(id)) {
      case (?existing) {
        if (Principal.equal(existing.owner, caller)) {
          shelters.remove(id);
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };
};
