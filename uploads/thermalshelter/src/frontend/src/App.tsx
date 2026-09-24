import { AppLayout } from "@/components/layout/AppLayout";
import { OptimizePage } from "@/pages/OptimizePage";
import { SavedPage } from "@/pages/SavedPage";
import { ShelterPage } from "@/pages/ShelterPage";
import { SimulatePage } from "@/pages/SimulatePage";
import { SitePage } from "@/pages/SitePage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

function SiteRoute() {
  return (
    <AppLayout title="Site" subtitle="Operational sector and climate window">
      <SitePage />
    </AppLayout>
  );
}

function ShelterRoute() {
  return (
    <AppLayout title="Shelter" subtitle="Geometry and orientation">
      <ShelterPage />
    </AppLayout>
  );
}

function SimulateRoute() {
  return (
    <AppLayout title="Simulate" subtitle="24-hour transient thermal run">
      <SimulatePage />
    </AppLayout>
  );
}

function OptimizeRoute() {
  return (
    <AppLayout title="Optimize" subtitle="Cost versus fuel design front">
      <OptimizePage />
    </AppLayout>
  );
}

function SavedRoute() {
  return (
    <AppLayout title="Saved" subtitle="Reopen a completed analysis">
      <SavedPage />
    </AppLayout>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const siteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: SiteRoute,
});

const shelterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shelter",
  component: ShelterRoute,
});

const simulateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/simulate",
  component: SimulateRoute,
});

const optimizeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/optimize",
  component: OptimizeRoute,
});

const savedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saved",
  component: SavedRoute,
});

const routeTree = rootRoute.addChildren([
  siteRoute,
  shelterRoute,
  simulateRoute,
  optimizeRoute,
  savedRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          classNames: {
            toast:
              "rounded-sm border border-border bg-popover text-popover-foreground font-body",
            description: "text-muted-foreground",
          },
        }}
      />
    </>
  );
}
