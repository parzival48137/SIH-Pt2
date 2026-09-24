import { sectorLabel } from "@/lib/sectors";
import { useAnalysisStore } from "@/store/analysis-store";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  /** Optional short descriptor shown under the title. */
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  const activeSite = useAnalysisStore((state) => state.activeSite);
  const activeShelter = useAnalysisStore((state) => state.activeShelter);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <Link
          to="/saved"
          data-ocid="header.saved_link"
          className="transition-smooth flex min-h-[36px] shrink-0 items-center gap-1 rounded-sm border border-border bg-secondary px-2.5 py-1.5 text-muted-foreground hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open saved analyses"
        >
          <span className="label-tech">Saved</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="mx-auto flex max-w-md items-center gap-2 overflow-x-auto px-4 pb-2">
        <span
          data-ocid="header.site_context"
          className="surface-inset flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1"
        >
          <span className="label-tech">Site</span>
          <span className="readout text-[0.6875rem] text-primary">
            {activeSite ? sectorLabel(activeSite.sector) : "—"}
          </span>
        </span>
        <span
          data-ocid="header.shelter_context"
          className="surface-inset flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1"
        >
          <span className="label-tech">Shelter</span>
          <span className="readout max-w-[9rem] truncate text-[0.6875rem] text-primary">
            {activeShelter ? activeShelter.name : "—"}
          </span>
        </span>
        {activeSite?.usingFallback ? (
          <span
            data-ocid="header.fallback_badge"
            className="flex shrink-0 items-center gap-1.5 rounded-sm border border-accent/50 bg-accent/10 px-2 py-1"
          >
            <span className="label-tech text-accent">Offline profile</span>
          </span>
        ) : null}
      </div>
    </header>
  );
}
