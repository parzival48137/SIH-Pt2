import Principal "mo:core/Principal";

module {
  /// Identifier for a persisted record, unique within its collection.
  public type RecordId = Nat;

  /// Unix timestamp in nanoseconds.
  public type Timestamp = Int;

  /// Operational sector preset for the offline climate fallback.
  public type Sector = {
    #westernLadakh;
    #spitiKinnaur;
    #northernSikkim;
    #tawang;
  };

  /// Seasonal climate profile used when live meteorological data is unavailable.
  public type ClimateProfile = {
    #extremeWinter;
    #compositeSummer;
    #monsoonalTransition;
  };

  /// Foundation boundary condition for the thermal solver.
  public type FoundationMode = {
    #slabOnGrade;
    #elevatedSkids;
  };

  /// Thermal-mass core material of the design configuration.
  public type ThermalMassCore = {
    #puf;
    #aerogel;
    #adobe;
    #pcm28;
    #vip;
  };

  /// Shared mutable id counter, passed by reference to each domain mixin.
  public type IdState = {
    var nextId : RecordId;
  };
};
