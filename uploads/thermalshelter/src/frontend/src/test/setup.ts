import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Radix primitives (sliders, popovers) measure their trigger with a
// ResizeObserver, which jsdom does not implement. A no-op observer is enough
// for the component-level assertions these tests make.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    ResizeObserverStub;
}

afterEach(() => {
  cleanup();
});
