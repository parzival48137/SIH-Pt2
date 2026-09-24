import { Skeleton } from "@/components/ui/skeleton";
import { formatCoordinates, formatNumber } from "@/lib/format";
import { sectorLabel } from "@/lib/sectors";
import type { Site } from "@/types/domain";
import { MapPin, Trash2 } from "lucide-react";

interface SavedSiteListProps {
  sites: Site[];
  loading: boolean;
  error: boolean;
  /** Id of the site currently loaded into the active analysis. */
  activeId: bigint | null;
  onSelect: (site: Site) => void;
  onDelete: (id: bigint) => void;
  deletingId: bigint | null;
}

/** Previously saved sites, listed for reuse. */
export function SavedSiteList({
  sites,
  loading,
  error,
  activeId,
  onSelect,
  onDelete,
  deletingId,
}: SavedSiteListProps) {
  return (
    <section
      data-ocid="site.saved_list"
      className="panel rounded-sm p-3"
      aria-label="Saved sites"
    >
      <div className="flex items-center justify-between">
        <p className="label-tech">Saved sites</p>
        <span className="readout text-[0.625rem] text-muted-foreground">
          {loading ? "—" : `${sites.length} stored`}
        </span>
      </div>

      {loading ? (
        <div
          data-ocid="site.saved_list.loading_state"
          className="mt-2 space-y-2"
        >
          {Array.from({ length: 3 }, (_, i) => `site-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-14 w-full rounded-sm" />
            ),
          )}
        </div>
      ) : error ? (
        <p
          data-ocid="site.saved_list.error_state"
          className="mt-2 rounded-sm border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-[0.6875rem] text-destructive"
        >
          Could not load saved sites. Check your connection and retry.
        </p>
      ) : sites.length === 0 ? (
        <div
          data-ocid="site.saved_list.empty_state"
          className="mt-2 flex flex-col items-center gap-1.5 rounded-sm border border-dashed border-border px-3 py-5 text-center"
        >
          <MapPin
            className="h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-xs font-medium text-foreground">
            No saved sites yet
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">
            Configure a sector and save it to reuse across analyses.
          </p>
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {sites.map((site, index) => {
            const isActive = activeId !== null && site.id === activeId;
            return (
              <li
                key={site.id.toString()}
                data-ocid={`site.saved_list.item.${index + 1}`}
                className={`transition-smooth flex items-center gap-2 rounded-sm border px-2.5 py-2 ${
                  isActive
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-secondary/50"
                }`}
              >
                <button
                  type="button"
                  data-ocid={`site.saved_list.select_button.${index + 1}`}
                  onClick={() => onSelect(site)}
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Load site ${site.caption}`}
                >
                  <p className="truncate font-display text-[0.8125rem] font-semibold text-foreground">
                    {site.caption}
                  </p>
                  <p className="readout truncate text-[0.625rem] text-muted-foreground">
                    {sectorLabel(site.sector)} ·{" "}
                    {formatCoordinates(site.latitude, site.longitude)}
                  </p>
                  <p className="readout text-[0.625rem] text-primary">
                    {formatNumber(site.altitudeM, 0)} m ·{" "}
                    {formatNumber(site.airDensityKgM3, 4)} kg/m³
                  </p>
                </button>
                <button
                  type="button"
                  data-ocid={`site.saved_list.delete_button.${index + 1}`}
                  onClick={() => onDelete(site.id)}
                  disabled={deletingId === site.id}
                  aria-label={`Delete site ${site.caption}`}
                  className="transition-smooth flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-destructive/60 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
