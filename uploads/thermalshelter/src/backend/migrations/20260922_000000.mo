import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type RecordId = Nat;
  type Timestamp = Int;

  type Sector = {
    #westernLadakh;
    #spitiKinnaur;
    #northernSikkim;
    #tawang;
  };

  type ClimateProfile = {
    #extremeWinter;
    #compositeSummer;
    #monsoonalTransition;
  };

  type FoundationMode = {
    #slabOnGrade;
    #elevatedSkids;
  };

  type ThermalMassCore = {
    #puf;
    #aerogel;
    #adobe;
    #pcm28;
    #vip;
  };

  type Site = {
    id : RecordId;
    owner : Principal;
    caption : Text;
    sector : Sector;
    latitude : Float;
    longitude : Float;
    altitudeM : Float;
    airDensityKgM3 : Float;
    climateProfile : ClimateProfile;
    climateStartNs : Timestamp;
    climateEndNs : Timestamp;
    createdAt : Timestamp;
  };

  type Shelter = {
    id : RecordId;
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
    foundationMode : FoundationMode;
    createdAt : Timestamp;
  };

  type DesignConfig = {
    insulationThicknessMm : Nat;
    windowToWallRatioPct : Nat;
    thermalMassCore : ThermalMassCore;
  };

  type Verdict = {
    keroseneLitresPer24h : Float;
    pmv : Float;
    ppd : Float;
    structuralWeightKg : Float;
    airliftSorties : Nat;
    sapperManHours : Float;
  };

  type Analysis = {
    id : RecordId;
    owner : Principal;
    caption : Text;
    siteId : RecordId;
    shelterId : RecordId;
    config : DesignConfig;
    verdict : Verdict;
    createdAt : Timestamp;
  };

  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type NewActor = {
    accessControlState : AccessControlState;
    sites : Map.Map<RecordId, Site>;
    shelters : Map.Map<RecordId, Shelter>;
    analyses : Map.Map<RecordId, Analysis>;
    ids : { var nextId : RecordId };
  };

  public func migration(_old : {}) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      sites = Map.empty();
      shelters = Map.empty();
      analyses = Map.empty();
      ids = { var nextId = 0 };
    };
  };
};
