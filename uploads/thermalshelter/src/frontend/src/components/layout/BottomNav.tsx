import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Layers, LineChart, MapPin, Target } from "lucide-react";

interface NavTab {
  to: string;
  label: string;
  icon: typeof MapPin;
}

const TABS: NavTab[] = [
  { to: "/", label: "Site", icon: MapPin },
  { to: "/shelter", label: "Shelter", icon: Layers },
  { to: "/simulate", label: "Simulate", icon: LineChart },
  { to: "/optimize", label: "Optimize", icon: Target },
];

export function BottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <nav
      data-ocid="nav.bottom"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => {
          const active =
            tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                data-ocid={`nav.tab.${tab.label.toLowerCase()}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "transition-smooth flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    active && "scale-110",
                  )}
                  aria-hidden="true"
                />
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em]">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <Link
            to="/saved"
            data-ocid="nav.tab.saved"
            aria-current={pathname.startsWith("/saved") ? "page" : undefined}
            className={cn(
              "transition-smooth flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              pathname.startsWith("/saved")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Compass
              className={cn(
                "h-5 w-5 transition-transform",
                pathname.startsWith("/saved") && "scale-110",
              )}
              aria-hidden="true"
            />
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em]">
              Saved
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
