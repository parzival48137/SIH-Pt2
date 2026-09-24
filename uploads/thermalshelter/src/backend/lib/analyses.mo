import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/analyses";
import Common "../types/common";

module {
  /// List every analysis owned by the caller, newest first.
  public func listAnalyses(analyses : Map.Map<Common.RecordId, Types.Analysis>, caller : Principal) : [Types.Analysis] {
    let owned = analyses.values().filter(func (analysis) = Principal.equal(analysis.owner, caller)).toArray();
    owned.sort(func (a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
  };

  /// Read one analysis owned by the caller.
  public func getAnalysis(analyses : Map.Map<Common.RecordId, Types.Analysis>, caller : Principal, id : Common.RecordId) : ?Types.Analysis {
    switch (analyses.get(id)) {
      case (?analysis) {
        if (Principal.equal(analysis.owner, caller)) { ?analysis } else { null };
      };
      case null { null };
    };
  };

  /// Create an analysis owned by the caller and return it.
  public func createAnalysis(
    analyses : Map.Map<Common.RecordId, Types.Analysis>,
    ids : Common.IdState,
    caller : Principal,
    input : Types.AnalysisInput,
    now : Common.Timestamp,
  ) : Types.Analysis {
    let id = ids.nextId;
    ids.nextId := id + 1;
    let analysis : Types.Analysis = {
      id;
      owner = caller;
      caption = input.caption;
      siteId = input.siteId;
      shelterId = input.shelterId;
      config = input.config;
      verdict = input.verdict;
      createdAt = now;
    };
    analyses.add(id, analysis);
    analysis;
  };

  /// Update an analysis owned by the caller.
  public func updateAnalysis(
    analyses : Map.Map<Common.RecordId, Types.Analysis>,
    caller : Principal,
    id : Common.RecordId,
    input : Types.AnalysisUpdate,
  ) : ?Types.Analysis {
    switch (analyses.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) {
          return null;
        };
        let updated : Types.Analysis = {
          id = existing.id;
          owner = existing.owner;
          caption = input.caption;
          siteId = input.siteId;
          shelterId = input.shelterId;
          config = input.config;
          verdict = input.verdict;
          createdAt = existing.createdAt;
        };
        analyses.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  /// Delete an analysis owned by the caller.
  public func deleteAnalysis(analyses : Map.Map<Common.RecordId, Types.Analysis>, caller : Principal, id : Common.RecordId) : Bool {
    switch (analyses.get(id)) {
      case (?existing) {
        if (Principal.equal(existing.owner, caller)) {
          analyses.remove(id);
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };
};
