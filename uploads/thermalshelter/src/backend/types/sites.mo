import Principal "mo:core/Principal";
import Common "common";

module {
  /// A user-owned saved site with its ingested climate and topography.
  public type Site = {
    id : Common.RecordId;
    owner : Principal;
    caption : Text;
    sector : Common.Sector;
    latitude : Float;
    longitude : Float;
    altitudeM : Float;
    airDensityKgM3 : Float;
    climateProfile : Common.ClimateProfile;
    climateStartNs : Common.Timestamp;
    climateEndNs : Common.Timestamp;
    createdAt : Common.Timestamp;
  };

  /// Caller-supplied fields for creating a site.
  public type SiteInput = {
    caption : Text;
    sector : Common.Sector;
    latitude : Float;
    longitude : Float;
    altitudeM : Float;
    airDensityKgM3 : Float;
    climateProfile : Common.ClimateProfile;
    climateStartNs : Common.Timestamp;
    climateEndNs : Common.Timestamp;
  };

  /// Caller-supplied fields for updating a site.
  public type SiteUpdate = {
    caption : Text;
    sector : Common.Sector;
    latitude : Float;
    longitude : Float;
    altitudeM : Float;
    airDensityKgM3 : Float;
    climateProfile : Common.ClimateProfile;
    climateStartNs : Common.Timestamp;
    climateEndNs : Common.Timestamp;
  };
};
