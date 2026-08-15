/**
 * Writes a small BIM-style massing GLB to public/models/digital-massing.glb
 * (navy / cyan / yellow brand materials, no textures).
 *
 *   node ./scripts/build-digital-massing-glb.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const MAGIC = 0x46546c67;

function srgbToLinear(channel) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function hexToLinear(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [
    srgbToLinear(((n >> 16) & 255) / 255),
    srgbToLinear(((n >> 8) & 255) / 255),
    srgbToLinear((n & 255) / 255),
  ];
}

function padTo4(byteLength) {
  return (4 - (byteLength % 4)) % 4;
}

function createGroup() {
  return {
    positions: [],
    normals: [],
    indices: [],
  };
}

function addBox(group, cx, cy, cz, sx, sy, sz) {
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;
  const faces = [
    { n: [0, 0, 1], c: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
    { n: [0, 0, -1], c: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
    { n: [0, 1, 0], c: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
    { n: [0, -1, 0], c: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
    { n: [1, 0, 0], c: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
    { n: [-1, 0, 0], c: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
  ];

  const base = group.positions.length / 3;
  for (const face of faces) {
    for (const corner of face.c) {
      group.positions.push(cx + corner[0] * hx, cy + corner[1] * hy, cz + corner[2] * hz);
      group.normals.push(face.n[0], face.n[1], face.n[2]);
    }
  }
  for (let i = 0; i < 6; i += 1) {
    const o = base + i * 4;
    group.indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
}

function align(offset) {
  return offset + padTo4(offset);
}

function packAttribute(binParts, values, componentType, componentCount) {
  const offset = align(binParts.cursor);
  const bytesPer = componentType === 5126 ? 4 : 2;
  const byteLength = values.length * bytesPer;
  binParts.cursor = offset + byteLength;
  binParts.chunks.push({ offset, byteLength, values, componentType, componentCount });
  return { offset, byteLength, count: values.length / componentCount };
}

function bounds(values, stride) {
  const min = Array.from({ length: stride }, () => Number.POSITIVE_INFINITY);
  const max = Array.from({ length: stride }, () => Number.NEGATIVE_INFINITY);
  for (let i = 0; i < values.length; i += stride) {
    for (let c = 0; c < stride; c += 1) {
      const v = values[i + c];
      if (v < min[c]) min[c] = v;
      if (v > max[c]) max[c] = v;
    }
  }
  return { min, max };
}

function buildMassing() {
  const navy = createGroup();
  const mass = createGroup();
  const cyan = createGroup();
  const gold = createGroup();

  // Ground plate (top at y = 0)
  addBox(navy, 0, -0.04, 0, 7.2, 0.08, 5.4);

  // Podium
  addBox(mass, 0.05, 0.2, 0.05, 4.4, 0.4, 2.7);

  // Towers sit on podium top (y = 0.4)
  addBox(mass, -1.35, 1.65, 0.2, 1.2, 2.5, 1.2);
  addBox(mass, 0.1, 2.25, -0.35, 1.0, 3.7, 1.0);
  addBox(mass, 1.4, 1.275, 0.28, 1.35, 1.75, 1.25);

  // Floor bands on the tall tower
  for (let i = 0; i < 6; i += 1) {
    addBox(cyan, 0.1, 0.72 + i * 0.52, -0.35, 1.06, 0.045, 1.06);
  }

  // Skybridge between left and center towers
  addBox(cyan, -0.62, 2.08, -0.05, 1.55, 0.16, 0.32);

  // Coordination beacon on the tall tower
  addBox(gold, 0.1, 4.28, -0.35, 0.34, 0.34, 0.34);
  addBox(gold, 0.1, 4.52, -0.35, 0.12, 0.18, 0.12);

  // Site marker on the podium
  addBox(gold, -1.85, 0.43, 1.05, 0.22, 0.06, 0.22);

  return { navy, mass, cyan, gold };
}

function encodeBin(groups) {
  const binParts = { cursor: 0, chunks: [] };
  const meshes = [];

  for (const [name, group] of Object.entries(groups)) {
    const pos = packAttribute(binParts, group.positions, 5126, 3);
    const nrm = packAttribute(binParts, group.normals, 5126, 3);
    const idx = packAttribute(binParts, group.indices, 5123, 1);
    meshes.push({ name, pos, nrm, idx, positions: group.positions, normals: group.normals, indices: group.indices });
  }

  const total = align(binParts.cursor);
  const bin = Buffer.alloc(total);
  for (const chunk of binParts.chunks) {
    if (chunk.componentType === 5126) {
      const f32 = new Float32Array(chunk.values);
      Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength).copy(bin, chunk.offset);
    } else {
      const u16 = new Uint16Array(chunk.values);
      Buffer.from(u16.buffer, u16.byteOffset, u16.byteLength).copy(bin, chunk.offset);
    }
  }

  return { bin, meshes };
}

function buildGltf(bin, meshes) {
  const materials = [
    {
      name: "NavyGround",
      pbrMetallicRoughness: {
        baseColorFactor: [...hexToLinear("#062553"), 1],
        metallicFactor: 0.12,
        roughnessFactor: 0.62,
      },
    },
    {
      name: "Massing",
      pbrMetallicRoughness: {
        baseColorFactor: [...hexToLinear("#1a4a78"), 1],
        metallicFactor: 0.08,
        roughnessFactor: 0.48,
      },
    },
    {
      name: "CyanScan",
      pbrMetallicRoughness: {
        baseColorFactor: [...hexToLinear("#5fc7ec"), 1],
        metallicFactor: 0.35,
        roughnessFactor: 0.28,
      },
      emissiveFactor: hexToLinear("#1a6a88"),
    },
    {
      name: "GoldBeacon",
      pbrMetallicRoughness: {
        baseColorFactor: [...hexToLinear("#ffbd24"), 1],
        metallicFactor: 0.45,
        roughnessFactor: 0.32,
      },
      emissiveFactor: hexToLinear("#7a4e00"),
    },
  ];

  const bufferViews = [];
  const accessors = [];
  const gltfMeshes = [];
  const nodes = [{ name: "DigitalMassing", children: [] }];

  meshes.forEach((mesh, meshIndex) => {
    const posBounds = bounds(mesh.positions, 3);
    const nrmBounds = bounds(mesh.normals, 3);

    const posView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: mesh.pos.offset,
      byteLength: mesh.pos.byteLength,
      byteStride: 12,
      target: 34962,
    });
    const nrmView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: mesh.nrm.offset,
      byteLength: mesh.nrm.byteLength,
      byteStride: 12,
      target: 34962,
    });
    const idxView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: mesh.idx.offset,
      byteLength: mesh.idx.byteLength,
      target: 34963,
    });

    const posAcc = accessors.length;
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: mesh.pos.count,
      type: "VEC3",
      min: posBounds.min,
      max: posBounds.max,
    });
    const nrmAcc = accessors.length;
    accessors.push({
      bufferView: nrmView,
      componentType: 5126,
      count: mesh.nrm.count,
      type: "VEC3",
      min: nrmBounds.min,
      max: nrmBounds.max,
    });
    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxView,
      componentType: 5123,
      count: mesh.idx.count,
      type: "SCALAR",
    });

    gltfMeshes.push({
      name: mesh.name,
      primitives: [
        {
          attributes: { POSITION: posAcc, NORMAL: nrmAcc },
          indices: idxAcc,
          material: meshIndex,
        },
      ],
    });

    const nodeIndex = nodes.length;
    nodes.push({ name: mesh.name, mesh: meshIndex });
    nodes[0].children.push(nodeIndex);
  });

  return {
    asset: {
      version: "2.0",
      generator: "DigitalTeamWeb/scripts/build-digital-massing-glb.mjs",
    },
    scene: 0,
    scenes: [{ name: "Lab", nodes: [0] }],
    nodes,
    meshes: gltfMeshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.byteLength }],
  };
}

function packGlb(json, bin) {
  const jsonText = JSON.stringify(json);
  const jsonBuffer = Buffer.from(jsonText, "utf8");
  const jsonPad = padTo4(jsonBuffer.byteLength);
  const jsonChunkLen = jsonBuffer.byteLength + jsonPad;
  const binPad = padTo4(bin.byteLength);
  const binChunkLen = bin.byteLength + binPad;
  const total = 12 + 8 + jsonChunkLen + 8 + binChunkLen;

  const out = Buffer.alloc(total);
  let o = 0;
  out.writeUInt32LE(MAGIC, o); o += 4;
  out.writeUInt32LE(2, o); o += 4;
  out.writeUInt32LE(total, o); o += 4;

  out.writeUInt32LE(jsonChunkLen, o); o += 4;
  out.writeUInt32LE(JSON_CHUNK, o); o += 4;
  jsonBuffer.copy(out, o); o += jsonBuffer.byteLength;
  out.fill(0x20, o, o + jsonPad); o += jsonPad;

  out.writeUInt32LE(binChunkLen, o); o += 4;
  out.writeUInt32LE(BIN_CHUNK, o); o += 4;
  bin.copy(out, o); o += bin.byteLength;
  out.fill(0x00, o, o + binPad);

  return out;
}

const groups = buildMassing();
const { bin, meshes } = encodeBin(groups);
const gltf = buildGltf(bin, meshes);
const glb = packGlb(gltf, bin);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "models", "digital-massing.glb");
writeFileSync(outPath, glb);
console.log(`Wrote ${outPath} (${glb.byteLength} bytes)`);
