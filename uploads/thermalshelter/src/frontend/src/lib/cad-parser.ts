/**
 * Shelter geometry decomposition.
 *
 * Parses binary STL and OBJ meshes and reduces them to the scalar envelope the
 * thermal model consumes: floor area, roof area, per-compass wall areas,
 * interior volume, and the mesh bounding box. All heavy work runs inside
 * `workers/cad-parser.worker.ts`; this module holds the pure math so it can be
 * unit-reasoned about and reused by the worker without DOM access.
 */

/** Scalar geometry envelope produced from a parsed mesh. */
export interface ShelterGeometry {
  floorAreaM2: number;
  roofAreaM2: number;
  wallAreaNorthM2: number;
  wallAreaSouthM2: number;
  wallAreaEastM2: number;
  wallAreaWestM2: number;
  interiorVolumeM3: number;
  /** Bounding box extents in metres, for the summary readout. */
  widthM: number;
  depthM: number;
  heightM: number;
  /** Number of triangles that contributed to the decomposition. */
  triangleCount: number;
}

/** A triangle with a pre-computed unit normal and area. */
interface Facet {
  /** Index of the source triangle in the position array. */
  triangleIndex: number;
  nx: number;
  ny: number;
  nz: number;
  area: number;
}

const EPSILON = 1e-9;

function cross(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
): [number, number, number] {
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

function normalize(x: number, y: number, z: number): [number, number, number] {
  const length = Math.hypot(x, y, z);
  if (length < EPSILON) return [0, 0, 0];
  return [x / length, y / length, z / length];
}

/**
 * Reduce a triangle soup to the shelter envelope.
 *
 * Facets are classified by their unit normal: near-vertical normals are roof
 * (up) or floor (down), and near-horizontal normals are assigned to the compass
 * wall whose outward direction they most closely match. Interior volume uses
 * the divergence theorem — the signed tetrahedron volume of every facet summed
 * against the mesh centroid, so the result is translation invariant.
 */
export function decomposeMesh(positions: Float32Array): ShelterGeometry {
  const triangleCount = Math.floor(positions.length / 9);
  if (triangleCount === 0) {
    return {
      floorAreaM2: 0,
      roofAreaM2: 0,
      wallAreaNorthM2: 0,
      wallAreaSouthM2: 0,
      wallAreaEastM2: 0,
      wallAreaWestM2: 0,
      interiorVolumeM3: 0,
      widthM: 0,
      depthM: 0,
      heightM: 0,
      triangleCount: 0,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  const facets: Facet[] = [];

  for (let t = 0; t < triangleCount; t += 1) {
    const o = t * 9;
    const ax = positions[o];
    const ay = positions[o + 1];
    const az = positions[o + 2];
    const bx = positions[o + 3];
    const by = positions[o + 4];
    const bz = positions[o + 5];
    const cx = positions[o + 6];
    const cy = positions[o + 7];
    const cz = positions[o + 8];

    if (ax < minX) minX = ax;
    if (ay < minY) minY = ay;
    if (az < minZ) minZ = az;
    if (ax > maxX) maxX = ax;
    if (ay > maxY) maxY = ay;
    if (az > maxZ) maxZ = az;
    if (bx < minX) minX = bx;
    if (by < minY) minY = by;
    if (bz < minZ) minZ = bz;
    if (bx > maxX) maxX = bx;
    if (by > maxY) maxY = by;
    if (bz > maxZ) maxZ = bz;
    if (cx < minX) minX = cx;
    if (cy < minY) minY = cy;
    if (cz < minZ) minZ = cz;
    if (cx > maxX) maxX = cx;
    if (cy > maxY) maxY = cy;
    if (cz > maxZ) maxZ = cz;

    const [nx, ny, nz] = normalize(
      ...cross(bx - ax, by - ay, bz - az, cx - ax, cy - ay, cz - az),
    );
    const area =
      0.5 *
      Math.hypot(
        ...cross(bx - ax, by - ay, bz - az, cx - ax, cy - ay, cz - az),
      );
    if (area < EPSILON) continue;

    facets.push({ triangleIndex: t, nx, ny, nz, area });
  }

  if (facets.length === 0) {
    return {
      floorAreaM2: 0,
      roofAreaM2: 0,
      wallAreaNorthM2: 0,
      wallAreaSouthM2: 0,
      wallAreaEastM2: 0,
      wallAreaWestM2: 0,
      interiorVolumeM3: 0,
      widthM: 0,
      depthM: 0,
      heightM: 0,
      triangleCount: 0,
    };
  }

  // Mesh centroid — the divergence-theorem reference point.
  let cx0 = 0;
  let cy0 = 0;
  let cz0 = 0;
  for (let t = 0; t < triangleCount; t += 1) {
    const o = t * 9;
    cx0 += (positions[o] + positions[o + 3] + positions[o + 6]) / 3;
    cy0 += (positions[o + 1] + positions[o + 4] + positions[o + 7]) / 3;
    cz0 += (positions[o + 2] + positions[o + 5] + positions[o + 8]) / 3;
  }
  cx0 /= triangleCount;
  cy0 /= triangleCount;
  cz0 /= triangleCount;

  let floorAreaM2 = 0;
  let roofAreaM2 = 0;
  let wallAreaNorthM2 = 0;
  let wallAreaSouthM2 = 0;
  let wallAreaEastM2 = 0;
  let wallAreaWestM2 = 0;
  let interiorVolumeM3 = 0;

  for (let f = 0; f < facets.length; f += 1) {
    const facet = facets[f];
    // Signed volume about the centroid: sum of tetrahedra (centroid, tri).
    // Index the source triangle, not the filtered facet, so degenerate
    // triangles skipped above cannot shift the volume onto the wrong tri.
    const o = facet.triangleIndex * 9;
    const ax = positions[o] - cx0;
    const ay = positions[o + 1] - cy0;
    const az = positions[o + 2] - cz0;
    const bx = positions[o + 3] - cx0;
    const by = positions[o + 4] - cy0;
    const bz = positions[o + 5] - cz0;
    const cx = positions[o + 6] - cx0;
    const cy = positions[o + 7] - cy0;
    const cz = positions[o + 8] - cz0;
    interiorVolumeM3 +=
      (ax * (by * cz - bz * cy) -
        ay * (bx * cz - bz * cx) +
        az * (bx * cy - by * cx)) /
      6;

    const vertical = Math.abs(facet.ny);
    if (vertical > 0.7) {
      if (facet.ny > 0) roofAreaM2 += facet.area;
      else floorAreaM2 += facet.area;
      continue;
    }

    // Horizontal normal: assign to the dominant compass direction.
    const absX = Math.abs(facet.nx);
    const absZ = Math.abs(facet.nz);
    if (absX >= absZ) {
      if (facet.nx >= 0) wallAreaEastM2 += facet.area;
      else wallAreaWestM2 += facet.area;
    } else if (facet.nz >= 0) {
      wallAreaSouthM2 += facet.area;
    } else {
      wallAreaNorthM2 += facet.area;
    }
  }

  return {
    floorAreaM2,
    roofAreaM2,
    wallAreaNorthM2,
    wallAreaSouthM2,
    wallAreaEastM2,
    wallAreaWestM2,
    interiorVolumeM3: Math.abs(interiorVolumeM3),
    widthM: maxX - minX,
    depthM: maxZ - minZ,
    heightM: maxY - minY,
    triangleCount: facets.length,
  };
}

/** Parse a binary STL file into a flat triangle-soup position array. */
export function parseBinaryStl(buffer: ArrayBuffer): Float32Array {
  const view = new DataView(buffer);
  if (buffer.byteLength < 84) {
    throw new Error("STL file is too small to contain a header.");
  }
  const triangleCount = view.getUint32(80, true);
  const expected = 84 + triangleCount * 50;
  if (expected > buffer.byteLength) {
    throw new Error(
      "STL file is truncated or not a binary STL. ASCII STL is not supported.",
    );
  }

  const positions = new Float32Array(triangleCount * 9);
  let offset = 84;
  for (let t = 0; t < triangleCount; t += 1) {
    offset += 12; // skip the facet normal, recomputed from winding
    for (let v = 0; v < 3; v += 1) {
      const base = t * 9 + v * 3;
      positions[base] = view.getFloat32(offset, true);
      positions[base + 1] = view.getFloat32(offset + 4, true);
      positions[base + 2] = view.getFloat32(offset + 8, true);
      offset += 12;
    }
    offset += 2; // attribute byte count
  }
  return positions;
}

/** Parse an OBJ file into a flat triangle-soup position array. */
export function parseObj(text: string): Float32Array {
  const vertices: number[] = [];
  const positions: number[] = [];
  const lines = text.split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    if (line.startsWith("v ")) {
      const parts = line.split(/\s+/);
      vertices.push(
        Number.parseFloat(parts[1]),
        Number.parseFloat(parts[2]),
        Number.parseFloat(parts[3]),
      );
    } else if (line.startsWith("f ")) {
      const parts = line.slice(2).trim().split(/\s+/);
      if (parts.length < 3) continue;
      const indices = parts.map((token) => {
        const rawIndex = Number.parseInt(token.split("/")[0], 10);
        if (Number.isNaN(rawIndex)) return -1;
        return rawIndex > 0 ? rawIndex - 1 : vertices.length / 3 + rawIndex;
      });
      // Fan-triangulate polygons with more than three vertices.
      for (let i = 1; i < indices.length - 1; i += 1) {
        const tri = [indices[0], indices[i], indices[i + 1]];
        for (const index of tri) {
          const base = index * 3;
          positions.push(
            vertices[base] ?? 0,
            vertices[base + 1] ?? 0,
            vertices[base + 2] ?? 0,
          );
        }
      }
    }
  }

  if (positions.length === 0) {
    throw new Error("OBJ file contains no readable faces.");
  }
  return new Float32Array(positions);
}

/** True when the buffer looks like an ASCII STL rather than a binary one. */
export function isAsciiStl(buffer: ArrayBuffer): boolean {
  const head = new Uint8Array(buffer, 0, Math.min(5, buffer.byteLength));
  return (
    head[0] === 0x73 && head[1] === 0x6f && head[2] === 0x6c && head[3] === 0x69
  );
}
