import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VerdictPanel } from "@/components/optimize/VerdictPanel";
import { GeometrySummaryCard } from "@/components/shelter/GeometrySummaryCard";
import { OrientationControl } from "@/components/shelter/OrientationControl";
import {
  PresetPicker,
  SHELTER_PRESETS,
} from "@/components/shelter/PresetPicker";
import { DewPointAlert } from "@/components/simulation/DewPointAlert";
import { SimulationControls } from "@/components/simulation/SimulationControls";
import { SimulationReadouts } from "@/components/simulation/SimulationReadouts";
import { SectorPicker } from "@/components/site/SectorPicker";
import { SiteSummaryCard } from "@/components/site/SiteSummaryCard";
import { airDensityAtAltitude } from "@/lib/physics";
import { useAnalysisStore } from "@/store/analysis-store";
import {
  ClimateProfile,
  FoundationMode,
  Sector,
  ThermalMassCore,
} from "@/types/domain";
import type { ParetoPoint, SimulationResult } from "@/types/domain";

function makeResult(
  overrides: Partial<SimulationResult> = {},
): SimulationResult {
  const interiorC = Array.from({ length: 24 }, (_, hour) => 8 + hour * 0.2);
  const ambientC = Array.from({ length: 24 }, (_, hour) => -20 + hour * 0.5);
  return {
    interiorC,
    ambientC,
    interiorRhPct: Array.from({ length: 24 }, () => 45),
    surfaceC: Array.from({ length: 24 }, (_, hour) => 6 + hour * 0.2),
    dewPointC: Array.from({ length: 24 }, () => 2),
    dewPointBreach: false,
    breachHour: null,
    peakInteriorC: Math.max(...interiorC),
    minInteriorC: Math.min(...interiorC),
    deficitKwh: 42.5,
    keroseneLitresPer24h: 4.4,
    ...overrides,
  };
}

function makePoint(overrides: Partial<ParetoPoint> = {}): ParetoPoint {
  return {
    config: {
      insulationThicknessMm: 100n,
      windowToWallRatioPct: 15n,
      thermalMassCore: ThermalMassCore.puf,
    },
    capitalCostInr: 245_000,
    keroseneLitresPer24h: 12.5,
    structuralWeightKg: 1450,
    airliftSorties: 6,
    sapperManHours: 21.4,
    pmv: -0.4,
    ppd: 8.2,
    onFront: true,
    ...overrides,
  };
}

beforeEach(() => {
  useAnalysisStore.getState().reset();
});

describe("SiteSummaryCard", () => {
  it("shows sector, coordinates, altitude, air density and the climate window", () => {
    const altitudeM = 3500;
    render(
      <SiteSummaryCard
        caption="Leh ridge"
        sector={Sector.westernLadakh}
        latitude={34.1526}
        longitude={77.5771}
        altitudeM={altitudeM}
        airDensityKgM3={airDensityAtAltitude(altitudeM)}
        climateProfile={ClimateProfile.extremeWinter}
        climateStartNs={1_700_000_000_000_000_000n}
        climateEndNs={1_700_100_000_000_000_000n}
        usingFallback={false}
        loading={false}
      />,
    );

    const card = screen.getByRole("region", { name: "Active site summary" });
    expect(within(card).getByText("Western Ladakh")).toBeInTheDocument();
    expect(within(card).getByText("34.1526°N 77.5771°E")).toBeInTheDocument();
    expect(within(card).getByText("3,500")).toBeInTheDocument();
    // Air density at 3,500 m is below the 1.225 kg/m3 sea-level reference.
    const density = airDensityAtAltitude(altitudeM);
    expect(density).toBeLessThan(1.225);
    expect(within(card).getByText(density.toFixed(4))).toBeInTheDocument();
    expect(within(card).getByText(/1\.225 kg\/m³/)).toBeInTheDocument();
    expect(within(card).getByText("Live NASA POWER")).toBeInTheDocument();
  });

  it("labels the offline fallback profile when live data is unavailable", () => {
    render(
      <SiteSummaryCard
        caption="Leh ridge"
        sector={Sector.westernLadakh}
        latitude={34.1526}
        longitude={77.5771}
        altitudeM={3500}
        airDensityKgM3={airDensityAtAltitude(3500)}
        climateProfile={ClimateProfile.extremeWinter}
        climateStartNs={1_700_000_000_000_000_000n}
        climateEndNs={1_700_100_000_000_000_000n}
        usingFallback
        loading={false}
      />,
    );
    expect(screen.getByText("Offline profile")).toBeInTheDocument();
  });
});

describe("SectorPicker", () => {
  it("offers all four operational sectors and reports selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <SectorPicker value={Sector.westernLadakh} onChange={onChange} />,
    );
    const picker = within(container);

    expect(picker.getByText("Western Ladakh")).toBeInTheDocument();
    expect(picker.getByText("Spiti–Kinnaur")).toBeInTheDocument();
    expect(picker.getByText("Northern Sikkim")).toBeInTheDocument();
    expect(picker.getByText("Tawang")).toBeInTheDocument();

    await user.click(picker.getByText("Tawang"));
    expect(onChange).toHaveBeenCalledWith(Sector.tawang);
  });
});

describe("GeometrySummaryCard", () => {
  it("shows floor, roof, per-compass walls, volume and orientation", () => {
    render(
      <GeometrySummaryCard
        sourceLabel="Insulated panel hut"
        geometry={{
          floorAreaM2: 18,
          roofAreaM2: 19.2,
          wallAreaNorthM2: 10.8,
          wallAreaSouthM2: 10.8,
          wallAreaEastM2: 7.2,
          wallAreaWestM2: 7.2,
          interiorVolumeM3: 46.8,
          orientationAzimuthDeg: 90,
          foundationMode: FoundationMode.slabOnGrade,
        }}
      />,
    );

    const card = screen.getByRole("region", { name: "Geometry summary" });
    const readout = (ocid: string) =>
      card.querySelector(`[data-ocid="${ocid}"]`)?.textContent;
    expect(readout("shelter.summary.floor")).toBe("18.0");
    expect(readout("shelter.summary.roof")).toBe("19.2");
    expect(readout("shelter.summary.wall_north")).toBe("10.8");
    expect(readout("shelter.summary.wall_south")).toBe("10.8");
    expect(readout("shelter.summary.wall_east")).toBe("7.2");
    expect(readout("shelter.summary.wall_west")).toBe("7.2");
    expect(readout("shelter.summary.volume")).toBe("46.8");
    expect(readout("shelter.summary.orientation")).toBe("90");
    expect(
      within(card).getByText("Slab-on-grade · permafrost sink"),
    ).toBeInTheDocument();
  });
});

describe("PresetPicker", () => {
  it("lists the built-in shelter presets and reports selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <PresetPicker selectedId={null} onSelect={onSelect} />,
    );
    const picker = within(container);

    for (const preset of SHELTER_PRESETS) {
      expect(picker.getByText(preset.name)).toBeInTheDocument();
    }
    await user.click(picker.getByText("Canvas tent"));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "canvas-tent" }),
    );
  });
});

describe("OrientationControl", () => {
  it("reports the compass azimuth and snaps to a cardinal", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <OrientationControl value={0} onChange={onChange} />,
    );
    const control = within(container);

    expect(control.getByText("0°")).toBeInTheDocument();
    await user.click(control.getByRole("button", { name: "E" }));
    expect(onChange).toHaveBeenCalledWith(90);
  });
});

describe("SimulationControls", () => {
  it("reports a foundation-mode change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SimulationControls
        values={{
          insulationThicknessMm: 100,
          ach: 1.2,
          occupants: 4,
          heatingKw: 2,
          foundationMode: FoundationMode.slabOnGrade,
        }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Elevated skids/ }));
    expect(onChange).toHaveBeenCalledWith({
      foundationMode: FoundationMode.elevatedSkids,
    });
  });
});

describe("DewPointAlert", () => {
  it("shows the no-risk state when no hour breaches the dew point", () => {
    render(<DewPointAlert result={makeResult()} />);
    expect(screen.getByText("No condensation risk")).toBeInTheDocument();
  });

  it("shows the breach alert with the breach hour when a surface reaches the dew point", () => {
    render(
      <DewPointAlert
        result={makeResult({ dewPointBreach: true, breachHour: 5 })}
      />,
    );
    const alert = screen.getByRole("alert", { name: "Dew-point breach alert" });
    expect(
      within(alert).getByText("Dew-point breach at 05:00"),
    ).toBeInTheDocument();
  });
});

describe("SimulationReadouts", () => {
  it("reports the target verdict and kerosene demand", () => {
    render(
      <SimulationReadouts result={makeResult()} interiorVolumeM3={46.8} />,
    );
    expect(screen.getByText("+15 °C target missed")).toBeInTheDocument();
    expect(screen.getByText(/Kerosene 4\.4 L\/24 h/)).toBeInTheDocument();
  });
});

describe("VerdictPanel", () => {
  it("shows kerosene, PMV/PPD, structural weight, sorties and sapper hours", () => {
    render(<VerdictPanel point={makePoint()} />);
    const panel = screen.getByRole("region", { name: "Operational verdict" });
    expect(within(panel).getByText("12.5")).toBeInTheDocument();
    expect(within(panel).getByText("-0.40")).toBeInTheDocument();
    expect(within(panel).getByText("8.2")).toBeInTheDocument();
    expect(within(panel).getByText("1,450")).toBeInTheDocument();
    expect(within(panel).getByText("6")).toBeInTheDocument();
    expect(within(panel).getByText("21.4")).toBeInTheDocument();
    expect(within(panel).getByText("Comfortable")).toBeInTheDocument();
  });
});
