import { DewPointAlert } from "@/components/simulation/DewPointAlert";
import {
  type SimulationControlValues,
  SimulationControls,
} from "@/components/simulation/SimulationControls";
import { SimulationReadouts } from "@/components/simulation/SimulationReadouts";
import { TemperatureChart } from "@/components/simulation/TemperatureChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type SimulationInputs, runSimulation } from "@/lib/climate";
import { formatNumber } from "@/lib/format";
import { TARGET_INTERIOR_C } from "@/lib/physics";
import { getClimateProfile, getSectorPreset } from "@/lib/sectors";
import { useAnalysisStore } from "@/store/analysis-store";
import { FoundationMode } from "@/types/domain";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, MapPin, Ruler } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_CONTROLS: SimulationControlValues = {
  insulationThicknessMm: 100,
  ach: 1.2,
  occupants: 4,
  heatingKw: 2,
  foundationMode: FoundationMode.slabOnGrade,
};

const EQUIPMENT_LOAD_W = 250;

function LoadingState() {
  const ids = Array.from({ length: 4 }, (_, index) => `sim-skeleton-${index}`);
  return (
    <div data-ocid="simulate.loading_state" className="space-y-3">
      {ids.map((id) => (
        <Skeleton key={id} className="h-24 w-full rounded-sm" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <section
      data-ocid="simulate.empty_state"
      className="panel flex flex-col items-center gap-3 rounded-sm px-4 py-8 text-center"
    >
      <span className="surface-inset flex h-12 w-12 items-center justify-center rounded-sm">
        <Ruler className="h-5 w-5 text-primary" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-display text-sm font-semibold text-foreground">
          No active site or shelter
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Set an operational sector and define a shelter geometry before running
          the 24-hour transient thermal simulation.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button asChild className="w-full rounded-sm">
          <Link to="/" data-ocid="simulate.go_site_button">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Set the site
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full rounded-sm border-border"
        >
          <Link to="/shelter" data-ocid="simulate.go_shelter_button">
            Define the shelter
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/** Simulation screen: 24-hour transient energy-balance run with live inputs. */
export function SimulatePage() {
  const activeSite = useAnalysisStore((state) => state.activeSite);
  const activeShelter = useAnalysisStore((state) => state.activeShelter);
  const config = useAnalysisStore((state) => state.config);
  const liveClimateDay = useAnalysisStore((state) => state.liveClimateDay);
  const setLatestResult = useAnalysisStore((state) => state.setLatestResult);

  const [controls, setControls] =
    useState<SimulationControlValues>(DEFAULT_CONTROLS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  // Adopt the active design configuration (e.g. a Pareto point loaded from the
  // optimizer) into the local controls, while still allowing local adjustment.
  useEffect(() => {
    setControls((current) => ({
      ...current,
      insulationThicknessMm: Number(config.insulationThicknessMm),
    }));
  }, [config.insulationThicknessMm]);

  const inputs = useMemo<SimulationInputs | null>(() => {
    if (!activeSite || !activeShelter) return null;
    const preset = getSectorPreset(activeSite.sector);
    const day =
      liveClimateDay ??
      getClimateProfile(activeSite.sector, activeSite.climateProfile).day;
    return {
      day,
      latitude: activeSite.latitude || preset.latitude,
      altitudeM: activeSite.altitudeM,
      floorAreaM2: activeShelter.floorAreaM2,
      roofAreaM2: activeShelter.roofAreaM2,
      wallAreaNorthM2: activeShelter.wallAreaNorthM2,
      wallAreaSouthM2: activeShelter.wallAreaSouthM2,
      wallAreaEastM2: activeShelter.wallAreaEastM2,
      wallAreaWestM2: activeShelter.wallAreaWestM2,
      interiorVolumeM3: activeShelter.interiorVolumeM3,
      orientationAzimuthDeg: activeShelter.orientationAzimuthDeg,
      foundationMode: controls.foundationMode,
      insulationThicknessMm: controls.insulationThicknessMm,
      ach: controls.ach,
      occupants: controls.occupants,
      equipmentLoadW: EQUIPMENT_LOAD_W,
      heatingKw: controls.heatingKw,
    };
  }, [activeSite, activeShelter, controls, liveClimateDay]);

  const result = useMemo(
    () => (inputs ? runSimulation(inputs) : null),
    [inputs],
  );

  useEffect(() => {
    if (result) setLatestResult(result, activeSite?.usingFallback ?? false);
  }, [result, activeSite, setLatestResult]);

  const handleChange = (patch: Partial<SimulationControlValues>) => {
    setControls((current) => ({ ...current, ...patch }));
  };

  const shellArea = activeShelter
    ? activeShelter.floorAreaM2 +
      activeShelter.roofAreaM2 +
      activeShelter.wallAreaNorthM2 +
      activeShelter.wallAreaSouthM2 +
      activeShelter.wallAreaEastM2 +
      activeShelter.wallAreaWestM2
    : 0;

  return (
    <div data-ocid="simulate.page" className="space-y-3">
      {!ready ? (
        <LoadingState />
      ) : !activeSite || !activeShelter || !inputs || !result ? (
        <EmptyState />
      ) : (
        <>
          <section
            data-ocid="simulate.context_bar"
            className="panel flex items-center justify-between gap-2 rounded-sm px-3 py-2"
            aria-label="Active run context"
          >
            <div className="min-w-0">
              <p className="label-tech">Active run</p>
              <p className="readout truncate text-[0.6875rem] text-primary">
                {activeShelter.name} · {formatNumber(shellArea, 0)} m² shell
              </p>
            </div>
            <span className="surface-inset shrink-0 rounded-sm px-2 py-1">
              <span className="label-tech">Target</span>
              <span className="readout ml-1.5 text-[0.6875rem] text-accent">
                +{TARGET_INTERIOR_C} °C
              </span>
            </span>
          </section>

          {activeSite.usingFallback || !liveClimateDay ? (
            <p
              data-ocid="simulate.fallback_note"
              className="flex items-center gap-1.5 rounded-sm border border-accent/40 bg-accent/10 px-2.5 py-2 text-[0.6875rem] text-accent"
            >
              <AlertTriangle
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              Running the bundled offline climate profile for this sector.
            </p>
          ) : null}

          <SimulationControls values={controls} onChange={handleChange} />
          <TemperatureChart result={result} />
          <DewPointAlert result={result} />
          <SimulationReadouts
            result={result}
            interiorVolumeM3={activeShelter.interiorVolumeM3}
          />

          <Button asChild className="w-full rounded-sm">
            <Link to="/optimize" data-ocid="simulate.optimize_button">
              Open design optimization
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
