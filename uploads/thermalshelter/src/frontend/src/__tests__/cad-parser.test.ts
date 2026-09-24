import { describe, expect, it } from "vitest";

import {
  decomposeMesh,
  isAsciiStl,
  parseBinaryStl,
  parseObj,
} from "@/lib/cad-parser";
import { FoundationMode, Sector } from "@/types/domain";

/** Build a binary STL ArrayBuffer from a triangle soup of 9-float triangles. */
function binaryStl(triangles: number[][]): ArrayBuffer {
  const buffer = new ArrayBuffer(84 + triangles.length * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triangles.length, true);
  let offset = 84;
  for (const tri of triangles) {
    offset += 12; // facet normal, recomputed from winding
    for (const value of tri) {
      view.setFloat32(offset, value, true);
      offset += 4;
    }
    offset += 2; // attribute byte count
  }
  return buffer;
}

/**
 * A closed axis-aligned box, 2 m (x) by 3 m (z) by 2 m (y), centred on the
 * origin. Winding is counter-clockwise seen from outside so the divergence
 * theorem yields a positive interior volume.
 */
function boxTriangles(): number[][] {
  const x0 = -1;
  const x1 = 1;
  const y0 = -1;
  const y1 = 1;
  const z0 = -1.5;
  const z1 = 1.5;
  return [
    // Roof (y = y1), normal +y.
    [x0, y1, z0, x0, y1, z1, x1, y1, z1],
    [x0, y1, z0, x1, y1, z1, x1, y1, z0],
    // Floor (y = y0), normal -y.
    [x0, y0, z0, x1, y0, z1, x0, y0, z1],
    [x0, y0, z0, x1, y0, z0, x1, y0, z1],
    // East wall (x = x1), normal +x.
    [x1, y0, z0, x1, y1, z0, x1, y1, z1],
    [x1, y0, z0, x1, y1, z1, x1, y0, z1],
    // West wall (x = x0), normal -x.
    [x0, y0, z0, x0, y0, z1, x0, y1, z1],
    [x0, y0, z0, x0, y1, z1, x0, y1, z0],
    // South wall (z = z1), normal +z.
    [x0, y0, z1, x1, y0, z1, x1, y1, z1],
    [x0, y0, z1, x1, y1, z1, x0, y1, z1],
    // North wall (z = z0), normal -z.
    [x0, y0, z0, x0, y1, z0, x1, y1, z0],
    [x0, y0, z0, x1, y1, z0, x1, y0, z0],
  ];
}

describe("decomposeMesh", () => {
  it("returns a zero envelope for an empty mesh", () => {
    const geometry = decomposeMesh(new Float32Array(0));
    expect(geometry.triangleCount).toBe(0);
    expect(geometry.floorAreaM2).toBe(0);
    expect(geometry.interiorVolumeM3).toBe(0);
  });

  it("decomposes a closed box into floor, roof, per-compass walls and volume", () => {
    const geometry = decomposeMesh(new Float32Array(boxTriangles().flat()));

    // Floor and roof are 2 m x 3 m each.
    expect(geometry.floorAreaM2).toBeCloseTo(6, 4);
    expect(geometry.roofAreaM2).toBeCloseTo(6, 4);
    // East and west walls are 3 m x 2 m; north and south are 2 m x 2 m.
    expect(geometry.wallAreaEastM2).toBeCloseTo(6, 4);
    expect(geometry.wallAreaWestM2).toBeCloseTo(6, 4);
    expect(geometry.wallAreaNorthM2).toBeCloseTo(4, 4);
    expect(geometry.wallAreaSouthM2).toBeCloseTo(4, 4);
    // Interior volume is 2 x 3 x 2.
    expect(geometry.interiorVolumeM3).toBeCloseTo(12, 3);
    expect(geometry.widthM).toBeCloseTo(2, 4);
    expect(geometry.depthM).toBeCloseTo(3, 4);
    expect(geometry.heightM).toBeCloseTo(2, 4);
    expect(geometry.triangleCount).toBe(12);
  });

  it("is translation invariant for interior volume", () => {
    const shifted = boxTriangles().map((tri) =>
      tri.map((value, index) => (index % 3 === 0 ? value + 100 : value)),
    );
    const geometry = decomposeMesh(new Float32Array(shifted.flat()));
    expect(geometry.interiorVolumeM3).toBeCloseTo(12, 3);
  });
});

describe("parseBinaryStl", () => {
  it("reads every triangle from a binary STL buffer", () => {
    const positions = parseBinaryStl(binaryStl(boxTriangles()));
    expect(positions.length).toBe(12 * 9);
    const geometry = decomposeMesh(positions);
    expect(geometry.interiorVolumeM3).toBeCloseTo(12, 3);
  });

  it("rejects a truncated buffer", () => {
    const buffer = binaryStl(boxTriangles());
    const truncated = buffer.slice(0, 100);
    expect(() => parseBinaryStl(truncated)).toThrow();
  });

  it("detects an ASCII STL header", () => {
    const ascii = new TextEncoder().encode("solid test\n").buffer;
    expect(isAsciiStl(ascii)).toBe(true);
    expect(isAsciiStl(binaryStl(boxTriangles()))).toBe(false);
  });
});

describe("parseObj", () => {
  it("parses a quad face by fan triangulation", () => {
    const obj = [
      "v -1 -1 -1.5",
      "v 1 -1 -1.5",
      "v 1 1 -1.5",
      "v -1 1 -1.5",
      "f 1 2 3 4",
    ].join("\n");
    const positions = parseObj(obj);
    // A quad fans into two triangles.
    expect(positions.length).toBe(2 * 9);
  });

  it("parses a closed box into a positive interior volume", () => {
    const lines: string[] = [];
    const vertices: number[][] = [];
    for (const tri of boxTriangles()) {
      for (let v = 0; v < 3; v += 1) {
        vertices.push([tri[v * 3], tri[v * 3 + 1], tri[v * 3 + 2]]);
      }
    }
    for (const [x, y, z] of vertices) {
      lines.push(`v ${x} ${y} ${z}`);
    }
    for (let i = 0; i < vertices.length; i += 3) {
      lines.push(`f ${i + 1} ${i + 2} ${i + 3}`);
    }
    const geometry = decomposeMesh(parseObj(lines.join("\n")));
    expect(geometry.interiorVolumeM3).toBeCloseTo(12, 3);
    expect(geometry.floorAreaM2).toBeCloseTo(6, 4);
  });

  it("throws when the OBJ has no faces", () => {
    expect(() => parseObj("v 0 0 0\n# nothing else")).toThrow();
  });
});

describe("sector and foundation enums", () => {
  it("exposes the four operational sectors", () => {
    expect(Object.values(Sector)).toHaveLength(4);
  });

  it("exposes both foundation modes", () => {
    expect(Object.values(FoundationMode)).toHaveLength(2);
  });
});
