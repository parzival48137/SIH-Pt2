/// <reference lib="webworker" />
/**
 * CAD parsing worker.
 *
 * Binary STL and OBJ files are decoded and decomposed off the main thread so
 * the shelter screen stays responsive while a large mesh is processed. The
 * worker reports coarse progress so the upload control can show a live bar.
 */
import {
  type ShelterGeometry,
  decomposeMesh,
  isAsciiStl,
  parseBinaryStl,
  parseObj,
} from "@/lib/cad-parser";

export interface CadParseRequest {
  fileName: string;
  buffer: ArrayBuffer;
}

export type CadParseResponse =
  | { kind: "progress"; value: number }
  | { kind: "done"; geometry: ShelterGeometry }
  | { kind: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<CadParseRequest>) => {
  const { fileName, buffer } = event.data;
  try {
    ctx.postMessage({
      kind: "progress",
      value: 0.15,
    } satisfies CadParseResponse);

    const lower = fileName.toLowerCase();
    let positions: Float32Array;

    if (lower.endsWith(".obj")) {
      const text = new TextDecoder().decode(buffer);
      ctx.postMessage({
        kind: "progress",
        value: 0.45,
      } satisfies CadParseResponse);
      positions = parseObj(text);
    } else if (lower.endsWith(".stl")) {
      if (isAsciiStl(buffer)) {
        throw new Error(
          "ASCII STL is not supported. Export the mesh as binary STL or OBJ.",
        );
      }
      positions = parseBinaryStl(buffer);
    } else {
      throw new Error(
        "Unsupported file type. Upload a binary STL or OBJ file.",
      );
    }

    ctx.postMessage({
      kind: "progress",
      value: 0.7,
    } satisfies CadParseResponse);
    const geometry = decomposeMesh(positions);
    ctx.postMessage({ kind: "progress", value: 1 } satisfies CadParseResponse);
    ctx.postMessage({ kind: "done", geometry } satisfies CadParseResponse);
  } catch (error) {
    ctx.postMessage({
      kind: "error",
      message:
        error instanceof Error ? error.message : "Failed to parse the mesh.",
    } satisfies CadParseResponse);
  }
};
