import Principal "mo:core/Principal";
import Common "common";

module {
  /// A user-owned shelter geometry definition.
  public type Shelter = {
    id : Common.RecordId;
    owner : Principal;
    name : Text;
    sourcePreset : ?Text;
    sourceFileName : ?Text;
    floorAreaM2 : Float;
    roofAreaM2 : Float;
    wallAreaNorthM2 : Float;
    wallAreaSouthM2 : Float;
    wallAreaEastM2 : Float;
    wallAreaWestM2 : Float;
    interiorVolumeM3 : Float;
    orientationAzimuthDeg : Float;
    foundationMode : Common.FoundationMode;
    createdAt : Common.Timestamp;
  };

  /// Caller-supplied fields for creating a shelter.
  public type ShelterInput = {
    name : Text;
    sourcePreset : ?Text;
    sourceFileName : ?Text;
    floorAreaM2 : Float;
    roofAreaM2 : Float;
    wallAreaNorthM2 : Float;
    wallAreaSouthM2 : Float;
    wallAreaEastM2 : Float;
    wallAreaWestM2 : Float;
    interiorVolumeM3 : Float;
    orientationAzimuthDeg : Float;
    foundationMode : Common.FoundationMode;
  };

  /// Caller-supplied fields for updating a shelter.
  public type ShelterUpdate = {
    name : Text;
    sourcePreset : ?Text;
    sourceFileName : ?Text;
    floorAreaM2 : Float;
    roofAreaM2 : Float;
    wallAreaNorthM2 : Float;
    wallAreaSouthM2 : Float;
    wallAreaEastM2 : Float;
    wallAreaWestM2 : Float;
    interiorVolumeM3 : Float;
    orientationAzimuthDeg : Float;
    foundationMode : Common.FoundationMode;
  };
};
