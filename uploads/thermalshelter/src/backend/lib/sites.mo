import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/sites";
import Common "../types/common";

module {
  /// List every site owned by the caller, newest first.
  public func listSites(sites : Map.Map<Common.RecordId, Types.Site>, caller : Principal) : [Types.Site] {
    let owned = sites.values().filter(func (site) = Principal.equal(site.owner, caller)).toArray();
    owned.sort(func (a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
  };

  /// Read one site owned by the caller.
  public func getSite(sites : Map.Map<Common.RecordId, Types.Site>, caller : Principal, id : Common.RecordId) : ?Types.Site {
    switch (sites.get(id)) {
      case (?site) {
        if (Principal.equal(site.owner, caller)) { ?site } else { null };
      };
      case null { null };
    };
  };

  /// Create a site owned by the caller and return it.
  public func createSite(
    sites : Map.Map<Common.RecordId, Types.Site>,
    ids : Common.IdState,
    caller : Principal,
    input : Types.SiteInput,
    now : Common.Timestamp,
  ) : Types.Site {
    let id = ids.nextId;
    ids.nextId := id + 1;
    let site : Types.Site = {
      id;
      owner = caller;
      caption = input.caption;
      sector = input.sector;
      latitude = input.latitude;
      longitude = input.longitude;
      altitudeM = input.altitudeM;
      airDensityKgM3 = input.airDensityKgM3;
      climateProfile = input.climateProfile;
      climateStartNs = input.climateStartNs;
      climateEndNs = input.climateEndNs;
      createdAt = now;
    };
    sites.add(id, site);
    site;
  };

  /// Update a site owned by the caller.
  public func updateSite(
    sites : Map.Map<Common.RecordId, Types.Site>,
    caller : Principal,
    id : Common.RecordId,
    input : Types.SiteUpdate,
  ) : ?Types.Site {
    switch (sites.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) {
          return null;
        };
        let updated : Types.Site = {
          id = existing.id;
          owner = existing.owner;
          caption = input.caption;
          sector = input.sector;
          latitude = input.latitude;
          longitude = input.longitude;
          altitudeM = input.altitudeM;
          airDensityKgM3 = input.airDensityKgM3;
          climateProfile = input.climateProfile;
          climateStartNs = input.climateStartNs;
          climateEndNs = input.climateEndNs;
          createdAt = existing.createdAt;
        };
        sites.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  /// Delete a site owned by the caller.
  public func deleteSite(sites : Map.Map<Common.RecordId, Types.Site>, caller : Principal, id : Common.RecordId) : Bool {
    switch (sites.get(id)) {
      case (?existing) {
        if (Principal.equal(existing.owner, caller)) {
          sites.remove(id);
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };
};
