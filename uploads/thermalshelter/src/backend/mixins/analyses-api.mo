import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/analyses";
import Common "../types/common";
import AnalysesLib "../lib/analyses";

mixin (
  analyses : Map.Map<Common.RecordId, Types.Analysis>,
  ids : Common.IdState,
) {
  /// List the caller's saved analyses.
  public shared ({ caller }) func listAnalyses() : async [Types.Analysis] {
    AnalysesLib.listAnalyses(analyses, caller);
  };

  /// Read one of the caller's saved analyses.
  public shared ({ caller }) func getAnalysis(id : Common.RecordId) : async ?Types.Analysis {
    AnalysesLib.getAnalysis(analyses, caller, id);
  };

  /// Create a saved analysis for the caller.
  public shared ({ caller }) func createAnalysis(input : Types.AnalysisInput) : async Types.Analysis {
    AnalysesLib.createAnalysis(analyses, ids, caller, input, Time.now());
  };

  /// Update one of the caller's saved analyses.
  public shared ({ caller }) func updateAnalysis(id : Common.RecordId, input : Types.AnalysisUpdate) : async ?Types.Analysis {
    AnalysesLib.updateAnalysis(analyses, caller, id, input);
  };

  /// Delete one of the caller's saved analyses.
  public shared ({ caller }) func deleteAnalysis(id : Common.RecordId) : async Bool {
    AnalysesLib.deleteAnalysis(analyses, caller, id);
  };
};
