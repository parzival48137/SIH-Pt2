import { CadUpload } from "@/components/shelter/CadUpload";
import {
  type GeometrySummary,
  GeometrySummaryCard,
} from "@/components/shelter/GeometrySummaryCard";
import { OrientationControl } from "@/components/shelter/OrientationControl";
import {
  PresetPicker,
  SHELTER_PRESETS,
  type ShelterPreset,
} from "@/components/shelter/PresetPicker";
import { SavedShelterList } from "@/components/shelter/SavedShelterList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateShelter,
  useDeleteShelter,
  useShelters,
} from "@/hooks/use-shelters";
import type { ShelterGeometry } from "@/lib/cad-parser";
import { clamp, formatNumber } from "@/lib/format";
import { useAnalysisStore } from "@/store/analysis-store";
import { FoundationMode, type Shelter } from "@/types/domain";
import { AlertTriangle, Check, Save } from "lucide-react";
import { useState } from "react";

interface GeometryDraft {
  floorAreaM2: number;
  roofAreaM2: number;
  wallAreaNorthM2: number;
  wallAreaSouthM2: number;
  wallAreaEastM2: number;
  wallAreaWestM2: number;
  interiorVolumeM3: number;
  orientationAzimuthDeg: number;
  foundationMode: FoundationMode;
}

const EMPTY_DRAFT: GeometryDraft = {
  floorAreaM2: 0,
  roofAreaM2: 0,
  wallAreaNorthM2: 0,
  wallAreaSouthM2: 0,
  wallAreaEastM2: 0,
  wallAreaWestM2: 0,
  interiorVolumeM3: 0,
  orientationAzimuthDeg: 0,
  foundationMode: FoundationMode.slabOnGrade,
};

function presetToDraft(preset: ShelterPreset): GeometryDraft {
  return {
    floorAreaM2: preset.floorAreaM2,
    roofAreaM2: preset.roofAreaM2,
    wallAreaNorthM2: preset.wallAreaNorthM2,
    wallAreaSouthM2: preset.wallAreaSouthM2,
    wallAreaEastM2: preset.wallAreaEastM2,
    wallAreaWestM2: preset.wallAreaWestM2,
    interiorVolumeM3: preset.interiorVolumeM3,
    orientationAzimuthDeg: 0,
    foundationMode: preset.foundationMode,
  };
}

function shelterToDraft(shelter: Shelter): GeometryDraft {
  return {
    floorAreaM2: shelter.floorAreaM2,
    roofAreaM2: shelter.roofAreaM2,
    wallAreaNorthM2: shelter.wallAreaNorthM2,
    wallAreaSouthM2: shelter.wallAreaSouthM2,
    wallAreaEastM2: shelter.wallAreaEastM2,
    wallAreaWestM2: shelter.wallAreaWestM2,
    interiorVolumeM3: shelter.interiorVolumeM3,
    orientationAzimuthDeg: shelter.orientationAzimuthDeg,
    foundationMode: shelter.foundationMode,
  };
}

/** Shelter geometry definition: presets, CAD upload, orientation, and save. */
export function ShelterPage() {
  const setActiveShelter = useAnalysisStore((state) => state.setActiveShelter);
  const activeShelter = useAnalysisStore((state) => state.activeShelter);

  const sheltersQuery = useShelters();
  const createShelter = useCreateShelter();
  const deleteShelter = useDeleteShelter();

  const [draft, setDraft] = useState<GeometryDraft>(EMPTY_DRAFT);
  const [name, setName] = useState("");
  const [presetId, setPresetId] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<bigint | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasGeometry = draft.floorAreaM2 > 0 || draft.interiorVolumeM3 > 0;
  const sourceLabel = sourceFileName
    ? sourceFileName
    : presetId
      ? (SHELTER_PRESETS.find((preset) => preset.id === presetId)?.name ??
        "Preset")
      : "Manual entry";

  function applyPreset(preset: ShelterPreset) {
    setDraft(presetToDraft(preset));
    setPresetId(preset.id);
    setSourceFileName(null);
    setActiveId(null);
    setSavedNotice(null);
    setSaveError(null);
    if (name.trim().length === 0) setName(preset.name);
  }

  function applyGeometry(geometry: ShelterGeometry, fileName: string) {
    setDraft((current) => ({
      ...current,
      floorAreaM2: geometry.floorAreaM2,
      roofAreaM2: geometry.roofAreaM2,
      wallAreaNorthM2: geometry.wallAreaNorthM2,
      wallAreaSouthM2: geometry.wallAreaSouthM2,
      wallAreaEastM2: geometry.wallAreaEastM2,
      wallAreaWestM2: geometry.wallAreaWestM2,
      interiorVolumeM3: geometry.interiorVolumeM3,
    }));
    setPresetId(null);
    setSourceFileName(fileName);
    setActiveId(null);
    setSavedNotice(null);
    setSaveError(null);
    if (name.trim().length === 0) {
      setName(fileName.replace(/\.(stl|obj)$/i, ""));
    }
  }

  function loadShelter(shelter: Shelter) {
    setDraft(shelterToDraft(shelter));
    setName(shelter.name);
    setPresetId(shelter.sourcePreset ?? null);
    setSourceFileName(shelter.sourceFileName ?? null);
    setActiveId(shelter.id);
    setSavedNotice(null);
    setSaveError(null);
    setActiveShelter({
      id: shelter.id,
      name: shelter.name,
      floorAreaM2: shelter.floorAreaM2,
      roofAreaM2: shelter.roofAreaM2,
      wallAreaNorthM2: shelter.wallAreaNorthM2,
      wallAreaSouthM2: shelter.wallAreaSouthM2,
      wallAreaEastM2: shelter.wallAreaEastM2,
      wallAreaWestM2: shelter.wallAreaWestM2,
      interiorVolumeM3: shelter.interiorVolumeM3,
      orientationAzimuthDeg: shelter.orientationAzimuthDeg,
      foundationMode: shelter.foundationMode,
      sourcePreset: shelter.sourcePreset,
      sourceFileName: shelter.sourceFileName,
    });
  }

  function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setSaveError("Enter a shelter name before saving.");
      return;
    }
    if (!hasGeometry) {
      setSaveError("Select a preset or upload a mesh before saving.");
      return;
    }
    setSaveError(null);
    setSavedNotice(null);
    createShelter.mutate(
      {
        name: trimmed,
        floorAreaM2: draft.floorAreaM2,
        roofAreaM2: draft.roofAreaM2,
        wallAreaNorthM2: draft.wallAreaNorthM2,
        wallAreaSouthM2: draft.wallAreaSouthM2,
        wallAreaEastM2: draft.wallAreaEastM2,
        wallAreaWestM2: draft.wallAreaWestM2,
        interiorVolumeM3: draft.interiorVolumeM3,
        orientationAzimuthDeg: draft.orientationAzimuthDeg,
        foundationMode: draft.foundationMode,
        sourcePreset: presetId ?? undefined,
        sourceFileName: sourceFileName ?? undefined,
      },
      {
        onSuccess: (shelter) => {
          setActiveId(shelter.id);
          setSavedNotice(`Saved “${shelter.name}”.`);
          setActiveShelter({
            id: shelter.id,
            name: shelter.name,
            floorAreaM2: shelter.floorAreaM2,
            roofAreaM2: shelter.roofAreaM2,
            wallAreaNorthM2: shelter.wallAreaNorthM2,
            wallAreaSouthM2: shelter.wallAreaSouthM2,
            wallAreaEastM2: shelter.wallAreaEastM2,
            wallAreaWestM2: shelter.wallAreaWestM2,
            interiorVolumeM3: shelter.interiorVolumeM3,
            orientationAzimuthDeg: shelter.orientationAzimuthDeg,
            foundationMode: shelter.foundationMode,
            sourcePreset: shelter.sourcePreset,
            sourceFileName: shelter.sourceFileName,
          });
        },
        onError: () => {
          setSaveError("Could not save the shelter. Try again.");
        },
      },
    );
  }

  function handleDelete(shelter: Shelter) {
    deleteShelter.mutate(shelter.id, {
      onSuccess: () => {
        if (activeId === shelter.id) setActiveId(null);
      },
    });
  }

  const summary: GeometrySummary = {
    ...draft,
    orientationAzimuthDeg: draft.orientationAzimuthDeg,
  };

  return (
    <div data-ocid="shelter.page" className="space-y-4">
      <section className="panel rounded-sm p-3" aria-label="Shelter presets">
        <header className="mb-2.5">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Built-in presets
          </h2>
          <p className="label-tech mt-0.5">
            Standard field structures · populates geometry
          </p>
        </header>
        <PresetPicker selectedId={presetId} onSelect={applyPreset} />
      </section>

      <section className="panel rounded-sm p-3" aria-label="CAD upload">
        <header className="mb-2.5">
          <h2 className="font-display text-sm font-semibold text-foreground">
            CAD mesh
          </h2>
          <p className="label-tech mt-0.5">
            Binary STL or OBJ · parsed off-thread
          </p>
        </header>
        <CadUpload onParsed={applyGeometry} />
      </section>

      <section className="panel rounded-sm p-3" aria-label="Orientation">
        <OrientationControl
          value={draft.orientationAzimuthDeg}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              orientationAzimuthDeg: clamp(value, 0, 359),
            }))
          }
        />
      </section>

      <section className="panel rounded-sm p-3" aria-label="Foundation mode">
        <div className="space-y-2">
          <Label htmlFor="shelter-foundation" className="label-tech">
            Foundation mode
          </Label>
          <Select
            value={draft.foundationMode}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                foundationMode: value as FoundationMode,
              }))
            }
          >
            <SelectTrigger
              id="shelter-foundation"
              data-ocid="shelter.foundation_select"
              className="rounded-sm"
            >
              <SelectValue placeholder="Select foundation mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FoundationMode.slabOnGrade}>
                Slab-on-grade · permafrost sink
              </SelectItem>
              <SelectItem value={FoundationMode.elevatedSkids}>
                Elevated skids · ventilated
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {hasGeometry ? (
        <GeometrySummaryCard geometry={summary} sourceLabel={sourceLabel} />
      ) : (
        <div
          data-ocid="shelter.geometry_empty_state"
          className="panel flex flex-col items-center gap-2 rounded-sm px-4 py-6 text-center"
        >
          <p className="font-display text-sm font-medium text-foreground">
            No geometry defined
          </p>
          <p className="max-w-[16rem] text-xs text-muted-foreground">
            Pick a built-in preset or upload a binary STL / OBJ mesh to
            decompose floor, roof, and wall areas.
          </p>
        </div>
      )}

      <section className="panel rounded-sm p-3" aria-label="Save shelter">
        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <Label htmlFor="shelter-name" className="label-tech">
              Shelter name
            </Label>
            <Input
              id="shelter-name"
              data-ocid="shelter.name_input"
              value={name}
              placeholder="e.g. Kaza winter hut"
              onChange={(event) => setName(event.target.value)}
              className="rounded-sm"
            />
          </div>

          <Button
            type="button"
            data-ocid="shelter.save_button"
            disabled={createShelter.isPending}
            onClick={handleSave}
            className="w-full rounded-sm"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {createShelter.isPending ? "Saving…" : "Save shelter"}
          </Button>

          {saveError ? (
            <p
              data-ocid="shelter.save_error"
              className="flex items-start gap-1.5 text-xs text-destructive"
            >
              <AlertTriangle
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              {saveError}
            </p>
          ) : null}

          {savedNotice ? (
            <p
              data-ocid="shelter.save_success"
              className="flex items-center gap-1.5 text-xs text-success"
            >
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {savedNotice}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-label="Saved shelters">
        <header className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Saved shelters
          </h2>
          <span className="readout text-[0.6875rem] text-muted-foreground">
            {sheltersQuery.data ? `${sheltersQuery.data.length} total` : "—"}
          </span>
        </header>
        <SavedShelterList
          shelters={sheltersQuery.data}
          isLoading={sheltersQuery.isLoading}
          isError={sheltersQuery.isError}
          activeId={activeId ?? activeShelter?.id ?? null}
          onLoad={loadShelter}
          onDelete={handleDelete}
          onRetry={() => void sheltersQuery.refetch()}
          deletingId={
            deleteShelter.isPending ? (deleteShelter.variables ?? null) : null
          }
        />
      </section>

      <p className="label-tech px-1 pb-2">
        {hasGeometry
          ? `Envelope ${formatNumber(
              draft.floorAreaM2 +
                draft.roofAreaM2 +
                draft.wallAreaNorthM2 +
                draft.wallAreaSouthM2 +
                draft.wallAreaEastM2 +
                draft.wallAreaWestM2,
              1,
            )} m² · ${formatNumber(draft.interiorVolumeM3, 1)} m³`
          : "Awaiting geometry input"}
      </p>
    </div>
  );
}
