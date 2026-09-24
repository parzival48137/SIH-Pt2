import { AnalysisDetailCard } from "@/components/saved/AnalysisDetailCard";
import { SavedAnalysisList } from "@/components/saved/SavedAnalysisList";
import { useAnalyses, useDeleteAnalysis } from "@/hooks/use-analyses";
import { useShelters } from "@/hooks/use-shelters";
import { useSites } from "@/hooks/use-sites";
import { buildAnalysisReport, downloadReport } from "@/lib/report";
import { useAnalysisStore } from "@/store/analysis-store";
import type { AnalysisRecord } from "@/types/domain";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function SavedPage() {
  const analysesQuery = useAnalyses();
  const sitesQuery = useSites();
  const sheltersQuery = useShelters();
  const deleteAnalysis = useDeleteAnalysis();
  const navigate = useNavigate();

  const setActiveSite = useAnalysisStore((state) => state.setActiveSite);
  const setActiveShelter = useAnalysisStore((state) => state.setActiveShelter);
  const setConfig = useAnalysisStore((state) => state.setConfig);

  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [copied, setCopied] = useState(false);

  const records = useMemo<AnalysisRecord[]>(() => {
    const analyses = analysesQuery.data ?? [];
    const sites = sitesQuery.data ?? [];
    const shelters = sheltersQuery.data ?? [];
    return analyses
      .map((analysis) => ({
        analysis,
        site: sites.find((site) => site.id === analysis.siteId) ?? null,
        shelter:
          shelters.find((shelter) => shelter.id === analysis.shelterId) ?? null,
      }))
      .sort((a, b) => Number(b.analysis.createdAt - a.analysis.createdAt));
  }, [analysesQuery.data, sitesQuery.data, sheltersQuery.data]);

  const selected =
    records.find((record) => record.analysis.id === selectedId) ?? null;

  const loading =
    analysesQuery.isLoading || sitesQuery.isLoading || sheltersQuery.isLoading;
  const error =
    analysesQuery.isError || sitesQuery.isError || sheltersQuery.isError;

  function handleOpen(record: AnalysisRecord) {
    setSelectedId(record.analysis.id);
  }

  function handleReopen(record: AnalysisRecord) {
    const { analysis, site, shelter } = record;
    if (site) {
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
    }
    if (shelter) {
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
    setConfig(analysis.config);
    toast.success(`Reopened “${analysis.caption || "Untitled analysis"}”`);
    void navigate({ to: "/simulate" });
  }

  function handleDelete(id: bigint) {
    deleteAnalysis.mutate(id, {
      onSuccess: () => {
        setSelectedId((current) => (current === id ? null : current));
        toast.success("Analysis deleted");
      },
      onError: () => {
        toast.error("Could not delete the analysis. Try again.");
      },
    });
  }

  function handleDownload(record: AnalysisRecord) {
    downloadReport(record.analysis.caption, buildAnalysisReport(record));
    toast.success("Report downloaded");
  }

  async function handleCopy(record: AnalysisRecord) {
    const report = buildAnalysisReport(record);
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast.success("Report copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard unavailable. Use Download instead.");
    }
  }

  return (
    <div data-ocid="saved.page" className="space-y-3">
      <SavedAnalysisList
        records={records}
        loading={loading}
        error={error}
        selectedId={selectedId}
        onOpen={handleOpen}
        onDelete={handleDelete}
        deletingId={
          deleteAnalysis.isPending ? (deleteAnalysis.variables ?? null) : null
        }
      />

      {selected ? (
        <AnalysisDetailCard
          record={selected}
          onReopen={() => handleReopen(selected)}
          onDownload={() => handleDownload(selected)}
          onCopy={() => void handleCopy(selected)}
          copied={copied}
        />
      ) : records.length > 0 && !loading ? (
        <p
          data-ocid="saved.detail_hint"
          className="rounded-sm border border-dashed border-border px-3 py-3 text-center text-[0.6875rem] text-muted-foreground"
        >
          Select a saved analysis to inspect its configuration and verdict.
        </p>
      ) : null}
    </div>
  );
}
