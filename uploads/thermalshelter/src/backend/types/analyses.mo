import Principal "mo:core/Principal";
import Common "common";

module {
  /// The design configuration evaluated by the surrogate optimizer.
  public type DesignConfig = {
    insulationThicknessMm : Nat;
    windowToWallRatioPct : Nat;
    thermalMassCore : Common.ThermalMassCore;
  };

  /// Computed operational verdict for a saved analysis.
  public type Verdict = {
    keroseneLitresPer24h : Float;
    pmv : Float;
    ppd : Float;
    structuralWeightKg : Float;
    airliftSorties : Nat;
    sapperManHours : Float;
  };

  /// A user-owned saved analysis linking a site and a shelter to a verdict.
  public type Analysis = {
    id : Common.RecordId;
    owner : Principal;
    caption : Text;
    siteId : Common.RecordId;
    shelterId : Common.RecordId;
    config : DesignConfig;
    verdict : Verdict;
    createdAt : Common.Timestamp;
  };

  /// Caller-supplied fields for creating an analysis.
  public type AnalysisInput = {
    caption : Text;
    siteId : Common.RecordId;
    shelterId : Common.RecordId;
    config : DesignConfig;
    verdict : Verdict;
  };

  /// Caller-supplied fields for updating an analysis.
  public type AnalysisUpdate = {
    caption : Text;
    siteId : Common.RecordId;
    shelterId : Common.RecordId;
    config : DesignConfig;
    verdict : Verdict;
  };
};
