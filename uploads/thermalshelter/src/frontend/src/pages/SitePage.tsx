import {
  CoordinateInput,
  parseCoordinate,
} from "@/components/site/CoordinateInput";
import { SavedSiteList } from "@/components/site/SavedSiteList";
import { SectorPicker } from "@/components/site/SectorPicker";
import { SiteSummaryCard } from "@/components/site/SiteSummaryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateSite, useDeleteSite, useSites } from "@/hooks/use-sites";
import { fetchElevation, fetchSiteClimate } from "@/lib/climate";
import { toDateInputValue } from "@/lib/format";
import { airDensityAtAltitude } from "@/lib/physics";
import { SECTOR_PRESETS, getSectorPreset } from "@/lib/sectors";
import { useAnalysisStore } from "@/store/analysis-store";
import type { ClimateProfile, Sector, Site } from "@/types/domain";
import { ClimateProfile as ClimateProfileEnum } from "@/types/domain";
import { CloudOff, Loader2, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PROFILE_OPTIONS: ClimateProfile[] = [
  ClimateProfileEnum.extremeWinter,
  ClimateProfileEnum.compositeSummer,
  ClimateProfileEnum.monsoonalTransition,
];

const PROFILE_LABELS: Record<ClimateProfile, string> = {
  [ClimateProfileEnum.extremeWinter]: "Extreme Winter",
  [ClimateProfileEnum.compositeSummer]: "Composite Summer",
  [ClimateProfileEnum.monsoonalTransition]: "Monsoonal Transition",
};

function defaultWindow(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 14);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

export function SitePage() {
  const setActiveSite = useAnalysisStore((state) => state.setActiveSite);
  const activeSite = useAnalysisStore((state) => state.activeSite);
  const setLiveClimateDay = useAnalysisStore(
    (state) => state.setLiveClimateDay,
  );

  const initialWindow = useMemo(defaultWindow, []);
  const [sector, setSector] = useState<Sector>(SECTOR_PRESETS[0].sector);
  const [latitude, setLatitude] = useState(
    SECTOR_PRESETS[0].latitude.toFixed(4),
  );
  const [longitude, setLongitude] = useState(
    SECTOR_PRESETS[0].longitude.toFixed(4),
  );
  const [caption, setCaption] = useState("");
  const [profile, setProfile] = useState<ClimateProfile>(
    ClimateProfileEnum.extremeWinter,
  );
  const [startDate, setStartDate] = useState(initialWindow.start);
  const [endDate, setEndDate] = useState(initialWindow.end);

  const [altitudeM, setAltitudeM] = useState<number | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const sitesQuery = useSites();
  const createSite = useCreateSite();
  const deleteSite = useDeleteSite();

  const preset = getSectorPreset(sector);
  const latValue = parseCoordinate(latitude, 90);
  const lonValue = parseCoordinate(longitude, 180);
  const coordinatesValid = latValue !== null && lonValue !== null;
  const isCustom =
    latValue !== null &&
    lonValue !== null &&
    (Math.abs(latValue - preset.latitude) > 0.0005 ||
      Math.abs(lonValue - preset.longitude) > 0.0005);

  const airDensityKgM3 = airDensityAtAltitude(altitudeM ?? preset.altitudeM);

  const applyPreset = useCallback((next: Sector) => {
    const nextPreset = getSectorPreset(next);
    setSector(next);
    setLatitude(nextPreset.latitude.toFixed(4));
    setLongitude(nextPreset.longitude.toFixed(4));
  }, []);

  const resetToPreset = useCallback(() => {
    setLatitude(preset.latitude.toFixed(4));
    setLongitude(preset.longitude.toFixed(4));
  }, [preset.latitude, preset.longitude]);

  const runFetch = useCallback(async () => {
    if (latValue === null || lonValue === null) return;
    setFetching(true);
    setFetchError(null);
    setSavedNotice(null);
    try {
      const [elevation, climate] = await Promise.all([
        fetchElevation(latValue, lonValue),
        fetchSiteClimate(
          {
            latitude: latValue,
            longitude: lonValue,
            startDate,
            endDate,
          },
          sector,
          profile,
        ),
      ]);
      const resolvedAltitude = elevation ?? preset.altitudeM;
      setAltitudeM(resolvedAltitude);
      setUsingFallback(climate.fallback);
      setLiveClimateDay(climate.fallback ? null : climate.day);
      setActiveSite({
        id: null,
        caption: caption.trim() || `${preset.name} site`,
        sector,
        latitude: latValue,
        longitude: lonValue,
        altitudeM: resolvedAltitude,
        airDensityKgM3: airDensityAtAltitude(resolvedAltitude),
        climateProfile: profile,
        climateStartNs: BigInt(new Date(startDate).getTime()) * 1_000_000n,
        climateEndNs: BigInt(new Date(endDate).getTime()) * 1_000_000n,
        usingFallback: climate.fallback,
      });
    } catch {
      setFetchError(
        "Climate fetch failed. The offline seasonal profile is available.",
      );
      setUsingFallback(true);
      setLiveClimateDay(null);
    } finally {
      setFetching(false);
    }
  }, [
    latValue,
    lonValue,
    startDate,
    endDate,
    sector,
    profile,
    preset.name,
    preset.altitudeM,
    caption,
    setActiveSite,
    setLiveClimateDay,
  ]);

  // Resolve elevation and climate whenever the site definition changes.
  useEffect(() => {
    void runFetch();
  }, [runFetch]);

  const handleSave = () => {
    if (latValue === null || lonValue === null) return;
    const resolvedAltitude = altitudeM ?? preset.altitudeM;
    const resolvedCaption = caption.trim() || `${preset.name} site`;
    createSite.mutate(
      {
        caption: resolvedCaption,
        sector,
        latitude: latValue,
        longitude: lonValue,
        altitudeM: resolvedAltitude,
        airDensityKgM3: airDensityAtAltitude(resolvedAltitude),
        climateProfile: profile,
        climateStartNs: BigInt(new Date(startDate).getTime()) * 1_000_000n,
        climateEndNs: BigInt(new Date(endDate).getTime()) * 1_000_000n,
      },
      {
        onSuccess: () => {
          setSavedNotice(`Saved “${resolvedCaption}”.`);
          setCaption("");
        },
      },
    );
  };

  const handleSelectSaved = (site: Site) => {
    setSector(site.sector);
    setLatitude(site.latitude.toFixed(4));
    setLongitude(site.longitude.toFixed(4));
    setCaption(site.caption);
    setProfile(site.climateProfile);
    setAltitudeM(site.altitudeM);
    setUsingFallback(false);
    setLiveClimateDay(null);
    setActiveSite({
      id: site.id,
      caption: site.caption,
      sector: site.sector,
      latitude: site.latitude,
      longitude: site.longitude,
      altitudeM: site.altitudeM,
      airDensityKgM3: site.airDensityKgM3,
      climateProfile: site.climateProfile,
      climateStartNs: site.climateStartNs,
      climateEndNs: site.climateEndNs,
      usingFallback: false,
    });
    setSavedNotice(`Loaded “${site.caption}”.`);
  };

  const handleDelete = (id: bigint) => {
    deleteSite.mutate(id);
  };

  return (
    <div data-ocid="site.page" className="space-y-3">
      <section className="panel rounded-sm p-3" aria-label="Sector preset">
        <div className="flex items-center justify-between">
          <p className="label-tech">Operational sector</p>
          <span className="readout text-[0.625rem] text-muted-foreground">
            {preset.altitudeM} m nominal
          </span>
        </div>
        <div className="mt-2">
          <SectorPicker value={sector} onChange={applyPreset} />
        </div>
      </section>

      <section className="panel rounded-sm p-3" aria-label="Site coordinates">
        <p className="label-tech">Coordinates</p>
        <div className="mt-2">
          <CoordinateInput
            latitude={latitude}
            longitude={longitude}
            onLatitudeChange={setLatitude}
            onLongitudeChange={setLongitude}
            isCustom={isCustom}
            onResetToPreset={resetToPreset}
          />
        </div>
      </section>

      <section className="panel rounded-sm p-3" aria-label="Climate window">
        <p className="label-tech">Climate window</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="site-start-date" className="label-tech">
              Start
            </Label>
            <Input
              id="site-start-date"
              data-ocid="site.start_date_input"
              type="date"
              value={startDate}
              max={endDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="readout h-11 rounded-sm border-input bg-background text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site-end-date" className="label-tech">
              End
            </Label>
            <Input
              id="site-end-date"
              data-ocid="site.end_date_input"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="readout h-11 rounded-sm border-input bg-background text-sm"
            />
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="site-profile" className="label-tech">
            Fallback profile
          </Label>
          <select
            id="site-profile"
            data-ocid="site.profile_select"
            value={profile}
            onChange={(event) =>
              setProfile(event.target.value as ClimateProfile)
            }
            className="readout h-11 w-full rounded-sm border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PROFILE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PROFILE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            data-ocid="site.fetch_button"
            onClick={() => void runFetch()}
            disabled={fetching || !coordinatesValid}
            className="h-11 flex-1 rounded-sm"
          >
            {fetching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            {fetching ? "Fetching…" : "Fetch climate"}
          </Button>
        </div>
        {fetchError ? (
          <p
            data-ocid="site.fetch_error_state"
            className="mt-2 rounded-sm border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-[0.6875rem] text-destructive"
          >
            {fetchError}
          </p>
        ) : null}
        {usingFallback && !fetching ? (
          <p
            data-ocid="site.fallback_notice"
            className="mt-2 flex items-center gap-1.5 rounded-sm border border-accent/40 bg-accent/10 px-2.5 py-2 text-[0.6875rem] text-accent"
          >
            <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Using fallback climate data — {PROFILE_LABELS[profile]} profile for{" "}
            {preset.name}.
          </p>
        ) : null}
      </section>

      {fetching && altitudeM === null ? (
        <div
          data-ocid="site.summary.loading_state"
          className="panel flex items-center gap-2 rounded-sm p-3"
        >
          <Loader2
            className="h-4 w-4 animate-spin text-primary"
            aria-hidden="true"
          />
          <span className="label-tech">Resolving site climate…</span>
        </div>
      ) : (
        <SiteSummaryCard
          caption={caption.trim() || `${preset.name} site`}
          sector={sector}
          latitude={latValue ?? preset.latitude}
          longitude={lonValue ?? preset.longitude}
          altitudeM={altitudeM ?? preset.altitudeM}
          airDensityKgM3={airDensityKgM3}
          climateProfile={profile}
          climateStartNs={BigInt(new Date(startDate).getTime()) * 1_000_000n}
          climateEndNs={BigInt(new Date(endDate).getTime()) * 1_000_000n}
          usingFallback={usingFallback}
          loading={fetching}
        />
      )}

      <section className="panel rounded-sm p-3" aria-label="Save site">
        <p className="label-tech">Save to account</p>
        <div className="mt-2 space-y-1.5">
          <Label htmlFor="site-caption" className="label-tech">
            Site caption
          </Label>
          <Input
            id="site-caption"
            data-ocid="site.caption_input"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder={`${preset.name} site`}
            className="h-11 rounded-sm border-input bg-background text-sm"
          />
        </div>
        <Button
          type="button"
          data-ocid="site.save_button"
          onClick={handleSave}
          disabled={createSite.isPending || !coordinatesValid}
          className="mt-3 h-11 w-full rounded-sm"
        >
          {createSite.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {createSite.isPending ? "Saving…" : "Save site"}
        </Button>
        {createSite.isError ? (
          <p
            data-ocid="site.save_error_state"
            className="mt-2 rounded-sm border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-[0.6875rem] text-destructive"
          >
            Could not save the site. Sign in and try again.
          </p>
        ) : null}
        {savedNotice ? (
          <p
            data-ocid="site.save_success_state"
            className="mt-2 rounded-sm border border-primary/40 bg-primary/10 px-2.5 py-2 text-[0.6875rem] text-primary"
          >
            {savedNotice}
          </p>
        ) : null}
      </section>

      <SavedSiteList
        sites={sitesQuery.data ?? []}
        loading={sitesQuery.isLoading}
        error={sitesQuery.isError}
        activeId={activeSite?.id ?? null}
        onSelect={handleSelectSaved}
        onDelete={handleDelete}
        deletingId={
          deleteSite.isPending ? (deleteSite.variables ?? null) : null
        }
      />
    </div>
  );
}
