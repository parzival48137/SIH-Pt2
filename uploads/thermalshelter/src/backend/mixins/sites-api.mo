import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/sites";
import Common "../types/common";
import SitesLib "../lib/sites";

mixin (
  sites : Map.Map<Common.RecordId, Types.Site>,
  ids : Common.IdState,
) {
  /// List the caller's saved sites.
  public shared ({ caller }) func listSites() : async [Types.Site] {
    SitesLib.listSites(sites, caller);
  };

  /// Read one of the caller's saved sites.
  public shared ({ caller }) func getSite(id : Common.RecordId) : async ?Types.Site {
    SitesLib.getSite(sites, caller, id);
  };

  /// Create a saved site for the caller.
  public shared ({ caller }) func createSite(input : Types.SiteInput) : async Types.Site {
    SitesLib.createSite(sites, ids, caller, input, Time.now());
  };

  /// Update one of the caller's saved sites.
  public shared ({ caller }) func updateSite(id : Common.RecordId, input : Types.SiteUpdate) : async ?Types.Site {
    SitesLib.updateSite(sites, caller, id, input);
  };

  /// Delete one of the caller's saved sites.
  public shared ({ caller }) func deleteSite(id : Common.RecordId) : async Bool {
    SitesLib.deleteSite(sites, caller, id);
  };
};
