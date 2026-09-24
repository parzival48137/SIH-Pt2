import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatTimestamp } from "@/lib/format";
import type { Shelter } from "@/types/domain";
import { AlertTriangle, FolderOpen, RefreshCw, Trash2 } from "lucide-react";

interface SavedShelterListProps {
  shelters: Shelter[] | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Id of the shelter currently loaded into the editor, if any. */
  activeId: bigint | null;
  onLoad: (shelter: Shelter) => void;
  onDelete: (shelter: Shelter) => void;
  onRetry: () => void;
  deletingId: bigint | null;
}

/** Saved shelter definitions for the signed-in user, with load and delete. */
export function SavedShelterList({
  shelters,
  isLoading,
  isError,
  activeId,
  onLoad,
  onDelete,
  onRetry,
  deletingId,
}: SavedShelterListProps) {
  if (isLoading) {
    return (
      <div data-ocid="shelter.saved_list.loading_state" className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => `shelter-skeleton-${i}`).map(
          (id) => (
            <Skeleton key={id} className="h-[68px] w-full rounded-sm" />
          ),
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="shelter.saved_list.error_state"
        className="panel flex flex-col items-start gap-2 rounded-sm p-3"
      >
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Could not load saved shelters.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid="shelter.saved_list.retry_button"
          onClick={onRetry}
          className="rounded-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }

  if (!shelters || shelters.length === 0) {
    return (
      <div
        data-ocid="shelter.saved_list.empty_state"
        className="panel flex flex-col items-center gap-2 rounded-sm px-4 py-6 text-center"
      >
        <FolderOpen
          className="h-6 w-6 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="font-display text-sm font-medium text-foreground">
          No saved shelters yet
        </p>
        <p className="max-w-[16rem] text-xs text-muted-foreground">
          Define a geometry above and save it to reuse across analyses.
        </p>
      </div>
    );
  }

  return (
    <ul data-ocid="shelter.saved_list" className="space-y-2">
      {shelters.map((shelter, index) => {
        const active = activeId !== null && shelter.id === activeId;
        const deleting = deletingId !== null && shelter.id === deletingId;
        return (
          <li
            key={shelter.id.toString()}
            data-ocid={`shelter.saved_list.item.${index + 1}`}
            className={`panel flex items-center justify-between gap-2 rounded-sm p-2.5 ${
              active ? "border-primary/60" : ""
            }`}
          >
            <button
              type="button"
              data-ocid={`shelter.saved_list.load_button.${index + 1}`}
              onClick={() => onLoad(shelter)}
              className="transition-smooth min-w-0 flex-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-1.5">
                <span className="truncate font-display text-sm font-medium text-foreground">
                  {shelter.name}
                </span>
                {active ? (
                  <span className="label-tech shrink-0 text-primary">
                    Active
                  </span>
                ) : null}
              </span>
              <span className="readout mt-0.5 block text-[0.6875rem] text-muted-foreground">
                {formatNumber(shelter.floorAreaM2, 1)} m² floor ·{" "}
                {formatNumber(shelter.interiorVolumeM3, 1)} m³ ·{" "}
                {formatNumber(shelter.orientationAzimuthDeg, 0)}°
              </span>
              <span className="label-tech mt-0.5 block truncate">
                {shelter.sourceFileName ??
                  shelter.sourcePreset ??
                  "Manual entry"}{" "}
                · {formatTimestamp(shelter.createdAt)}
              </span>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ocid={`shelter.saved_list.delete_button.${index + 1}`}
              aria-label={`Delete ${shelter.name}`}
              disabled={deleting}
              onClick={() => onDelete(shelter)}
              className="shrink-0 rounded-sm text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
