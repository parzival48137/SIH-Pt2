import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatTimestamp } from "@/lib/format";
import { CORE_LABELS } from "@/lib/pareto";
import { sectorLabel } from "@/lib/sectors";
import type { AnalysisRecord } from "@/types/domain";
import { Archive, ChevronRight, Trash2 } from "lucide-react";

interface SavedAnalysisListProps {
  records: AnalysisRecord[];
  loading: boolean;
  error: boolean;
  /** Id of the analysis currently opened in the detail panel. */
  selectedId: bigint | null;
  onOpen: (record: AnalysisRecord) => void;
  onDelete: (id: bigint) => void;
  deletingId: bigint | null;
}

/** The user's saved analyses, listed for reopen or delete. */
export function SavedAnalysisList({
  records,
  loading,
  error,
  selectedId,
  onOpen,
  onDelete,
  deletingId,
}: SavedAnalysisListProps) {
  return (
    <section
      data-ocid="saved.list"
      className="panel rounded-sm p-3"
      aria-label="Saved analyses"
    >
      <div className="flex items-center justify-between">
        <p className="label-tech">Saved analyses</p>
        <span className="readout text-[0.625rem] text-muted-foreground">
          {loading ? "—" : `${records.length} stored`}
        </span>
      </div>

      {loading ? (
        <div data-ocid="saved.list.loading_state" className="mt-2 space-y-2">
          {Array.from({ length: 3 }, (_, i) => `analysis-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-20 w-full rounded-sm" />
            ),
          )}
        </div>
      ) : error ? (
        <p
          data-ocid="saved.list.error_state"
          className="mt-2 rounded-sm border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-[0.6875rem] text-destructive"
        >
          Could not load saved analyses. Check your connection and retry.
        </p>
      ) : records.length === 0 ? (
        <div
          data-ocid="saved.list.empty_state"
          className="mt-2 flex flex-col items-center gap-1.5 rounded-sm border border-dashed border-border px-3 py-6 text-center"
        >
          <Archive
            className="h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-xs font-medium text-foreground">
            No saved analyses yet
          </p>
          <p className="text-[0.6875rem] leading-tight text-muted-foreground">
            Run a simulation and save it from the Optimize screen to reopen it
            here.
          </p>
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {records.map((record, index) => {
            const { analysis, site, shelter } = record;
            const isSelected =
              selectedId !== null && analysis.id === selectedId;
            return (
              <li
                key={analysis.id.toString()}
                data-ocid={`saved.list.item.${index + 1}`}
                className={`transition-smooth rounded-sm border ${
                  isSelected
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-secondary/50"
                }`}
              >
                <div className="flex items-stretch gap-1">
                  <button
                    type="button"
                    data-ocid={`saved.list.open_button.${index + 1}`}
                    onClick={() => onOpen(record)}
                    className="min-w-0 flex-1 rounded-sm px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open analysis ${analysis.caption}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate font-display text-[0.8125rem] font-semibold text-foreground">
                        {analysis.caption || "Untitled analysis"}
                      </span>
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="readout mt-0.5 block truncate text-[0.625rem] text-muted-foreground">
                      {site ? sectorLabel(site.sector) : "Site unavailable"} ·{" "}
                      {shelter ? shelter.name : "Shelter unavailable"}
                    </span>
                    <span className="readout mt-0.5 block truncate text-[0.625rem] text-primary">
                      {formatNumber(
                        Number(analysis.config.insulationThicknessMm),
                        0,
                      )}{" "}
                      mm ·{" "}
                      {formatNumber(
                        Number(analysis.config.windowToWallRatioPct),
                        0,
                      )}
                      % WWR · {CORE_LABELS[analysis.config.thermalMassCore]}
                    </span>
                    <span className="readout mt-0.5 block truncate text-[0.625rem] text-accent">
                      {formatNumber(analysis.verdict.keroseneLitresPer24h, 2)} L
                      / 24 h · {formatTimestamp(analysis.createdAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    data-ocid={`saved.list.delete_button.${index + 1}`}
                    onClick={() => onDelete(analysis.id)}
                    disabled={deletingId === analysis.id}
                    aria-label={`Delete analysis ${analysis.caption}`}
                    className="transition-smooth m-1 flex w-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-destructive/60 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
