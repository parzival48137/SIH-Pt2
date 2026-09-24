import Map "mo:core/Map";
import Principal "mo:core/Principal";

import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";

import Common "types/common";
import SiteTypes "types/sites";
import ShelterTypes "types/shelters";
import AnalysisTypes "types/analyses";

import SitesApi "mixins/sites-api";
import SheltersApi "mixins/shelters-api";
import AnalysesApi "mixins/analyses-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let sites : Map.Map<Common.RecordId, SiteTypes.Site>;
  let shelters : Map.Map<Common.RecordId, ShelterTypes.Shelter>;
  let analyses : Map.Map<Common.RecordId, AnalysisTypes.Analysis>;
  let ids : Common.IdState;

  include SitesApi(sites, ids);
  include SheltersApi(shelters, ids);
  include AnalysesApi(analyses, ids);
  include ApiDocMixin();

  transient let samplePrincipal = Principal.fromText("aaaaa-aa");

  // OQL auto-derivation only resolves flat scalar fields: nested records
  // (DesignConfig, Verdict) and variants (Sector, ClimateProfile,
  // FoundationMode, ThermalMassCore) have no `_toRow` instance. Declare the
  // payload columns explicitly and flatten the two nested records so every
  // column is a scalar with a `_toRow` instance.
  include Expose({
    entities = [
      sites.toEntityManual("site", "Site", "id")
        .payload("id", func (s : SiteTypes.Site) : Nat = s.id)
        .payload("owner", func (s : SiteTypes.Site) : Principal = s.owner)
        .payload("caption", func (s : SiteTypes.Site) : Text = s.caption)
        .payload("sector", func (s : SiteTypes.Site) : Text = switch (s.sector) {
          case (#westernLadakh) "westernLadakh";
          case (#spitiKinnaur) "spitiKinnaur";
          case (#northernSikkim) "northernSikkim";
          case (#tawang) "tawang";
        })
        .payload("latitude", func (s : SiteTypes.Site) : Float = s.latitude)
        .payload("longitude", func (s : SiteTypes.Site) : Float = s.longitude)
        .payload("altitudeM", func (s : SiteTypes.Site) : Float = s.altitudeM)
        .payload("airDensityKgM3", func (s : SiteTypes.Site) : Float = s.airDensityKgM3)
        .payload("climateProfile", func (s : SiteTypes.Site) : Text = switch (s.climateProfile) {
          case (#extremeWinter) "extremeWinter";
          case (#compositeSummer) "compositeSummer";
          case (#monsoonalTransition) "monsoonalTransition";
        })
        .payload("climateStartNs", func (s : SiteTypes.Site) : Int = s.climateStartNs)
        .payload("climateEndNs", func (s : SiteTypes.Site) : Int = s.climateEndNs)
        .payload("createdAt", func (s : SiteTypes.Site) : Int = s.createdAt)
        .sample({
          id = 0;
          owner = samplePrincipal;
          caption = "";
          sector = #westernLadakh;
          latitude = 0.0;
          longitude = 0.0;
          altitudeM = 0.0;
          airDensityKgM3 = 0.0;
          climateProfile = #extremeWinter;
          climateStartNs = 0;
          climateEndNs = 0;
          createdAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      shelters.toEntityManual("shelter", "Shelter", "id")
        .payload("id", func (s : ShelterTypes.Shelter) : Nat = s.id)
        .payload("owner", func (s : ShelterTypes.Shelter) : Principal = s.owner)
        .payload("name", func (s : ShelterTypes.Shelter) : Text = s.name)
        .payload("sourcePreset", func (s : ShelterTypes.Shelter) : Text = s.sourcePreset ?? "")
        .payload("sourceFileName", func (s : ShelterTypes.Shelter) : Text = s.sourceFileName ?? "")
        .payload("floorAreaM2", func (s : ShelterTypes.Shelter) : Float = s.floorAreaM2)
        .payload("roofAreaM2", func (s : ShelterTypes.Shelter) : Float = s.roofAreaM2)
        .payload("wallAreaNorthM2", func (s : ShelterTypes.Shelter) : Float = s.wallAreaNorthM2)
        .payload("wallAreaSouthM2", func (s : ShelterTypes.Shelter) : Float = s.wallAreaSouthM2)
        .payload("wallAreaEastM2", func (s : ShelterTypes.Shelter) : Float = s.wallAreaEastM2)
        .payload("wallAreaWestM2", func (s : ShelterTypes.Shelter) : Float = s.wallAreaWestM2)
        .payload("interiorVolumeM3", func (s : ShelterTypes.Shelter) : Float = s.interiorVolumeM3)
        .payload("orientationAzimuthDeg", func (s : ShelterTypes.Shelter) : Float = s.orientationAzimuthDeg)
        .payload("foundationMode", func (s : ShelterTypes.Shelter) : Text = switch (s.foundationMode) {
          case (#slabOnGrade) "slabOnGrade";
          case (#elevatedSkids) "elevatedSkids";
        })
        .payload("createdAt", func (s : ShelterTypes.Shelter) : Int = s.createdAt)
        .sample({
          id = 0;
          owner = samplePrincipal;
          name = "";
          sourcePreset = null;
          sourceFileName = null;
          floorAreaM2 = 0.0;
          roofAreaM2 = 0.0;
          wallAreaNorthM2 = 0.0;
          wallAreaSouthM2 = 0.0;
          wallAreaEastM2 = 0.0;
          wallAreaWestM2 = 0.0;
          interiorVolumeM3 = 0.0;
          orientationAzimuthDeg = 0.0;
          foundationMode = #slabOnGrade;
          createdAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      analyses.toEntityManual("analysis", "Analysis", "id")
        .payload("id", func (a : AnalysisTypes.Analysis) : Nat = a.id)
        .payload("owner", func (a : AnalysisTypes.Analysis) : Principal = a.owner)
        .payload("caption", func (a : AnalysisTypes.Analysis) : Text = a.caption)
        .payload("siteId", func (a : AnalysisTypes.Analysis) : Nat = a.siteId)
        .payload("shelterId", func (a : AnalysisTypes.Analysis) : Nat = a.shelterId)
        .payload("insulationThicknessMm", func (a : AnalysisTypes.Analysis) : Nat = a.config.insulationThicknessMm)
        .payload("windowToWallRatioPct", func (a : AnalysisTypes.Analysis) : Nat = a.config.windowToWallRatioPct)
        .payload("thermalMassCore", func (a : AnalysisTypes.Analysis) : Text = switch (a.config.thermalMassCore) {
          case (#puf) "puf";
          case (#aerogel) "aerogel";
          case (#adobe) "adobe";
          case (#pcm28) "pcm28";
          case (#vip) "vip";
        })
        .payload("keroseneLitresPer24h", func (a : AnalysisTypes.Analysis) : Float = a.verdict.keroseneLitresPer24h)
        .payload("pmv", func (a : AnalysisTypes.Analysis) : Float = a.verdict.pmv)
        .payload("ppd", func (a : AnalysisTypes.Analysis) : Float = a.verdict.ppd)
        .payload("structuralWeightKg", func (a : AnalysisTypes.Analysis) : Float = a.verdict.structuralWeightKg)
        .payload("airliftSorties", func (a : AnalysisTypes.Analysis) : Nat = a.verdict.airliftSorties)
        .payload("sapperManHours", func (a : AnalysisTypes.Analysis) : Float = a.verdict.sapperManHours)
        .payload("createdAt", func (a : AnalysisTypes.Analysis) : Int = a.createdAt)
        .sample({
          id = 0;
          owner = samplePrincipal;
          caption = "";
          siteId = 0;
          shelterId = 0;
          config = {
            insulationThicknessMm = 0;
            windowToWallRatioPct = 0;
            thermalMassCore = #puf;
          };
          verdict = {
            keroseneLitresPer24h = 0.0;
            pmv = 0.0;
            ppd = 0.0;
            structuralWeightKg = 0.0;
            airliftSorties = 0;
            sapperManHours = 0.0;
          };
          createdAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
