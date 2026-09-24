import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/shelters";
import Common "../types/common";
import SheltersLib "../lib/shelters";

mixin (
  shelters : Map.Map<Common.RecordId, Types.Shelter>,
  ids : Common.IdState,
) {
  /// List the caller's saved shelters.
  public shared ({ caller }) func listShelters() : async [Types.Shelter] {
    SheltersLib.listShelters(shelters, caller);
  };

  /// Read one of the caller's saved shelters.
  public shared ({ caller }) func getShelter(id : Common.RecordId) : async ?Types.Shelter {
    SheltersLib.getShelter(shelters, caller, id);
  };

  /// Create a saved shelter for the caller.
  public shared ({ caller }) func createShelter(input : Types.ShelterInput) : async Types.Shelter {
    SheltersLib.createShelter(shelters, ids, caller, input, Time.now());
  };

  /// Update one of the caller's saved shelters.
  public shared ({ caller }) func updateShelter(id : Common.RecordId, input : Types.ShelterUpdate) : async ?Types.Shelter {
    SheltersLib.updateShelter(shelters, caller, id, input);
  };

  /// Delete one of the caller's saved shelters.
  public shared ({ caller }) func deleteShelter(id : Common.RecordId) : async Bool {
    SheltersLib.deleteShelter(shelters, caller, id);
  };
};
