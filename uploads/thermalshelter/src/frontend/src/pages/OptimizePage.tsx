import { ConfigDetailCard } from "@/components/optimize/ConfigDetailCard";
import { ParetoChart } from "@/components/optimize/ParetoChart";
import { VerdictPanel } from "@/components/optimize/VerdictPanel";
import { Input } from "@/components/ui/input";
import { useCreateAnalysis } from "@/hooks/use-analyses";
import { formatNumber } from "@/lib/format";
import {
  type SweepContext,
  configKey,
  evaluateDesignSpace,
  shellAreaM2,
} from "@/lib/pareto";
import { TARGET_INTERIOR_C } from "@/lib/physics";
import { getClimateProfile } from "@/lib/sectors";
import { useAnalysisStore } from "@/store/analysis-store";
import type { AnalysisInput, ClimateDay, ParetoPoint } from "@/types/domain";
import { AlertTriangle, Check, Loader2, Save, Target } from "lucide-react";
import { useMemo, useState } from "react";

const DEFAULT_ACH = 1.2;
const DEFAULT_OCCUPANTS = 6;
const DEFAULT_EQUIPMENT_W = 400;
const DEFAULT_HEATING_KW = 0;

function buildSweepContext(
  site: NonNullable<ReturnType<typeof useAnalysisStore.getState>["activeSite"]>,
  shelter: NonNullable<
    ReturnType<typeof useAnalysisStore.getState>["activeShelter"]
  >,
  liveClimateDay: ClimateDay | null,
): SweepContext {
  const profile = getClimateProfile(site.sector, site.climateProfile);
  return {
    day: liveClimateDay ?? profile.day,
    latitude: site.latitude,
    altitudeM: site.altitudeM,
    floorAreaM2: shelter.floorAreaM2,
    roofAreaM2: shelter.roofAreaM2,
    wallAreaNorthM2: shelter.wallAreaNorthM2,
    wallAreaSouthM2: shelter.wallAreaSouthM2,
    wallAreaEastM2: shelter.wallAreaEastM2,
    wallAreaWestM2: shelter.wallAreaWestM2,
    interiorVolumeM3: shelter.interiorVolumeM3,
    orientationAzimuthDeg: shelter.orientationAzimuthDeg,
    foundationMode: shelter.foundationMode,
    ach: DEFAULT_ACH,
    occupants: DEFAULT_OCCUPANTS,
    equipmentLoadW: DEFAULT_EQUIPMENT_W,
    heatingKw: DEFAULT_HEATING_KW,
  };
}

function OptimizeBody() {
  const activeSite = useAnalysisStore((state) => state.activeSite);
  const activeShelter = useAnalysisStore((state) => state.activeShelter);
  const config = useAnalysisStore((state) => state.config);
  const liveClimateDay = useAnalysisStore((state) => state.liveClimateDay);
  const setConfig = useAnalysisStore((state) => state.setConfig);
  const createAnalysis = useCreateAnalysis();

  const [caption, setCaption] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const ready = activeSite !== null && activeShelter !== null;

  const context = useMemo<SweepContext | null>(() => {
    if (!activeSite || !activeShelter) return null;
    return buildSweepContext(activeSite, activeShelter, liveClimateDay);
  }, [activeSite, activeShelter, liveClimateDay]);

  const points = useMemo<ParetoPoint[]>(
    () => (context ? evaluateDesignSpace(context) : []),
    [context],
  );

  const selectedKey = configKey(config);
  const selected = useMemo(
    () =>
      points.find((point) => configKey(point.config) === selectedKey) ?? null,
    [points, selectedKey],
  );

  const front = useMemo(
    () => points.filter((point) => point.onFront),
    [points],
  );

  const persisted = activeSite?.id != null && activeShelter?.id != null;

  function handleSave() {
    if (!activeSite || !activeShelter || !selected) return;
    if (activeSite.id == null || activeShelter.id == null) {
      setSaveError(
        "Save the active site and shelter to your account before saving an analysis.",
      );
      return;
    }
    setSaveError(null);
    const trimmed = caption.trim();
    const input: AnalysisInput = {
      caption:
        trimmed ||
        `${activeShelter.name} · ${formatNumber(selected.keroseneLitresPer24h, 1)} L/24h`,
      siteId: activeSite.id,
      shelterId: activeShelter.id,
      config: selected.config,
      verdict: {
        pmv: selected.pmv,
        ppd: selected.ppd,
        keroseneLitresPer24h: selected.keroseneLitresPer24h,
        sapperManHours: selected.sapperManHours,
        airliftSorties: BigInt(selected.airliftSorties),
        structuralWeightKg: selected.structuralWeightKg,
      },
    };
    createAnalysis.mutate(input, {
      onSuccess: () => {
        setSaved(true);
        setCaption("");
      },
      onError: (error) => {
        setSaveError(
          error instanceof Error
            ? error.message
            : "Could not save the analysis",
        );
      },
    });
  }

  if (!ready) {
    return (
      <div
        data-ocid="optimize.empty_state"
        className="panel flex flex-col items-center gap-3 rounded-sm px-4 py-10 text-center"
      >
        <Target className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">
            Set a site and shelter first
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The optimizer sweeps 125 envelope configurations against the active
            site climate and shelter geometry. Choose both to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section
        data-ocid="optimize.summary"
        className="panel rounded-sm p-3"
        aria-label="Design space summary"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Design space
          </h2>
          <span className="label-tech">125 configurations</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="surface-inset rounded-sm px-2.5 py-2">
            <p className="label-tech">Evaluated</p>
            <p className="readout mt-1 text-base text-primary">
              {points.length}
            </p>
          </div>
          <div className="surface-inset rounded-sm px-2.5 py-2">
            <p className="label-tech">On front</p>
            <p className="readout mt-1 text-base text-primary">
              {front.length}
            </p>
          </div>
          <div className="surface-inset rounded-sm px-2.5 py-2">
            <p className="label-tech">Shell area</p>
            <p className="readout mt-1 text-base text-primary">
              {formatNumber(context ? shellAreaM2(context) : 0, 0)}
              <span className="ml-1 text-[0.625rem] text-muted-foreground">
                m²
              </span>
            </p>
          </div>
        </div>
        <p className="mt-2 text-[0.625rem] leading-tight text-muted-foreground">
          Non-dominated front trading procurement cost (INR) against 24 h
          kerosene deficit at the +{TARGET_INTERIOR_C} °C target. Tap a point to
          load it.
        </p>
      </section>

      <section
        data-ocid="optimize.chart_panel"
        className="panel rounded-sm p-3"
        aria-label="Pareto front chart"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Cost vs fuel front
          </h2>
          <span className="label-tech">INR · L/24h</span>
        </div>
        <div className="mt-2">
          <ParetoChart
            points={points}
            selectedKey={selectedKey}
            onSelect={(point) => {
              setConfig(point.config);
              setSaved(false);
            }}
          />
        </div>
      </section>

      {selected ? (
        <>
          <ConfigDetailCard
            point={selected}
            loaded={configKey(config) === configKey(selected.config)}
            onLoad={() => {
              setConfig(selected.config);
              setSaved(false);
            }}
          />
          <VerdictPanel point={selected} />
        </>
      ) : (
        <div
          data-ocid="optimize.detail.empty_state"
          className="surface-inset rounded-sm px-3 py-6 text-center"
        >
          <p className="label-tech">Select a point on the front</p>
        </div>
      )}

      <section
        data-ocid="optimize.save_panel"
        className="panel rounded-sm p-3"
        aria-label="Save analysis"
      >
        <h2 className="font-display text-sm font-semibold text-foreground">
          Save analysis
        </h2>
        <p className="mt-1 text-[0.625rem] leading-tight text-muted-foreground">
          Stores the site, shelter, chosen configuration and verdict to your
          account.
        </p>
        <label htmlFor="optimize-caption" className="label-tech mt-2.5 block">
          Caption
        </label>
        <Input
          id="optimize-caption"
          data-ocid="optimize.caption_input"
          value={caption}
          onChange={(event) => {
            setCaption(event.target.value);
            setSaved(false);
          }}
          placeholder="e.g. Ladakh winter — 100 mm PUF baseline"
          className="mt-1 h-10 rounded-sm border-input bg-secondary/60 font-body text-sm"
        />
        {saveError ? (
          <p
            data-ocid="optimize.save_error_state"
            className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-destructive"
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {saveError}
          </p>
        ) : null}
        {saved ? (
          <p
            data-ocid="optimize.save_success_state"
            className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-primary"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Analysis saved to your account.
          </p>
        ) : null}
        {!persisted ? (
          <p
            data-ocid="optimize.save_hint"
            className="mt-2 text-[0.625rem] leading-tight text-muted-foreground"
          >
            Save the active site and shelter to your account first — an analysis
            references both.
          </p>
        ) : null}
        <button
          type="button"
          data-ocid="optimize.save_button"
          onClick={handleSave}
          disabled={createAnalysis.isPending || !selected || !persisted}
          className="transition-smooth mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm bg-primary px-3 py-2 font-display text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createAnalysis.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save analysis
            </>
          )}
        </button>
      </section>
    </div>
  );
}

export function OptimizePage() {
  return (
    <div data-ocid="optimize.page">
      <OptimizeBody />
    </div>
  );
}
