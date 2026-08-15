/**
 * Shared helpers for Node GLB export (three + RoundedBox + FileReader polyfill).
 */
import { writeFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    result = null;
    onloadend = null;

    readAsArrayBuffer(blob) {
      Promise.resolve(blob.arrayBuffer()).then((buffer) => {
        this.result = buffer;
        this.onloadend?.();
      });
    }

    readAsDataURL(blob) {
      Promise.resolve(blob.arrayBuffer()).then((buffer) => {
        const b64 = Buffer.from(buffer).toString("base64");
        this.result = `data:application/octet-stream;base64,${b64}`;
        this.onloadend?.();
      });
    }
  };
}

export { THREE };

export function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: extra.roughness ?? 0.42,
    metalness: extra.metalness ?? 0.06,
    emissive: extra.emissive ?? 0x000000,
    emissiveIntensity: extra.emissiveIntensity ?? 0,
    transparent: extra.transparent ?? false,
    opacity: extra.opacity ?? 1,
    side: extra.side ?? THREE.FrontSide,
    depthWrite: extra.depthWrite ?? true,
  });
}

export const MAT = {
  white: mat("#f4f7fa", { roughness: 0.38 }),
  whiteSoft: mat("#e8eef4", { roughness: 0.5 }),
  skin: mat("#f4f6f8", { roughness: 0.64, metalness: 0 }),
  shirt: mat("#ffffff", { roughness: 0.34, metalness: 0.02 }),
  navy: mat("#062553", { roughness: 0.48, metalness: 0.12 }),
  navyDeep: mat("#031733", { roughness: 0.55 }),
  charcoal: mat("#2a3340", { roughness: 0.4, metalness: 0.22 }),
  cyan: mat("#5fc7ec", { roughness: 0.32, metalness: 0.18, emissive: "#0a3a52", emissiveIntensity: 0.22 }),
  gold: mat("#ffbd24", { roughness: 0.34, metalness: 0.28, emissive: "#5a3a00", emissiveIntensity: 0.18 }),
  glass: mat("#d7f3ff", {
    roughness: 0.08,
    metalness: 0.04,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  glow: mat("#5fc7ec", {
    roughness: 0.25,
    metalness: 0.05,
    emissive: "#5fc7ec",
    emissiveIntensity: 0.85,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  holo: mat("#7ad4f5", {
    roughness: 0.18,
    metalness: 0.05,
    emissive: "#5fc7ec",
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  screen: mat("#0a2a48", {
    roughness: 0.2,
    metalness: 0.1,
    emissive: "#1a6a88",
    emissiveIntensity: 0.45,
  }),
  paper: mat("#ffffff", { roughness: 0.32, metalness: 0.02 }),
  ice: mat("#7eb8e8", { roughness: 0.42, metalness: 0.04 }),
  iceDeep: mat("#4a90c4", { roughness: 0.4, metalness: 0.06 }),
  struct: mat("#8fa0b0", { roughness: 0.48, metalness: 0.12 }),
  mepGreen: mat("#6fbf73", { roughness: 0.4, metalness: 0.08 }),
  teal: mat("#1a5c6c", { roughness: 0.48, metalness: 0.06 }),
  leaf: mat("#3f9a62", { roughness: 0.55, metalness: 0 }),
  leafDark: mat("#2c6f46", { roughness: 0.6, metalness: 0 }),
  soil: mat("#3a322c", { roughness: 0.72, metalness: 0 }),
  ink: mat("#1a1a1b", { roughness: 0.48, metalness: 0.08 }),
  inkOutline: mat("#1a1a1b", { roughness: 0.85, metalness: 0, side: THREE.BackSide }),
};

function shadowFlags(mesh, shadows) {
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
}

export function addRound(
  parent,
  name,
  { w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, radius = 0.018, segments = 1, material, shadows = true },
) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(w, h, d, segments, Math.min(radius, w / 2.2, h / 2.2, d / 2.2)),
    material,
  );
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  shadowFlags(mesh, shadows);
  parent.add(mesh);
  return mesh;
}

export function addCylinder(
  parent,
  name,
  {
    radiusTop,
    radiusBottom,
    height,
    radial = 16,
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0,
    material,
    shadows = true,
  },
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  shadowFlags(mesh, shadows);
  parent.add(mesh);
  return mesh;
}

export function addCapsule(
  parent,
  name,
  {
    r,
    length,
    cap = 6,
    radial = 12,
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0,
    hang = false,
    material,
    shadows = true,
  },
) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, length, cap, radial), material);
  mesh.name = name;
  mesh.position.set(x, hang ? y - (length / 2 + r) : y, z);
  mesh.rotation.set(rx, ry, rz);
  shadowFlags(mesh, shadows);
  parent.add(mesh);
  return mesh;
}

export function addToonOutline(mesh, inflate = 1.07) {
  const outline = new THREE.Mesh(mesh.geometry, MAT.inkOutline);
  outline.name = `${mesh.name}Outline`;
  outline.position.copy(mesh.position);
  outline.rotation.copy(mesh.rotation);
  outline.scale.copy(mesh.scale).multiplyScalar(inflate);
  outline.castShadow = false;
  outline.receiveShadow = false;
  mesh.parent.add(outline);
  return outline;
}

export function addSphere(parent, name, { r, x = 0, y = 0, z = 0, segments = 14, material, shadows = true }) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  shadowFlags(mesh, shadows);
  parent.add(mesh);
  return mesh;
}

export function roundedHexShape(radius, corner = 0.2) {
  const shape = new THREE.Shape();
  const rot = Math.PI / 6;
  const verts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + rot;
    return new THREE.Vector2(Math.sin(a) * radius, Math.cos(a) * radius);
  });
  const along = (from, to, dist) => {
    const d = to.clone().sub(from);
    const len = d.length();
    return from.clone().add(d.multiplyScalar(Math.min(dist, len * 0.42) / len));
  };
  for (let i = 0; i < 6; i += 1) {
    const prev = verts[(i + 5) % 6];
    const cur = verts[i];
    const next = verts[(i + 1) % 6];
    const p0 = along(cur, prev, corner);
    const p1 = along(cur, next, corner);
    if (i === 0) shape.moveTo(p0.x, p0.y);
    else shape.lineTo(p0.x, p0.y);
    shape.quadraticCurveTo(cur.x, cur.y, p1.x, p1.y);
  }
  shape.closePath();
  return shape;
}

export function addExtrude(parent, name, shape, { depth, y = 0, material, bevel = 0.01, shadows = true }) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeBoundingBox();
  const midY = (geo.boundingBox.min.y + geo.boundingBox.max.y) / 2;
  geo.translate(0, -midY, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name;
  mesh.position.y = y;
  shadowFlags(mesh, shadows);
  parent.add(mesh);
  return mesh;
}

export function addTorus(
  parent,
  name,
  { radius, tube, x = 0, y = 0, z = 0, rx = Math.PI / 2, radial = 24, tubular = 10, material, shadows = false },
) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, tubular, radial), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, 0, 0);
  shadowFlags(mesh, shadows);
  parent.add(mesh);
  return mesh;
}

export async function writeGlb(object, outPath) {
  const scene = new THREE.Scene();
  scene.name = `${object.name || "Asset"}Scene`;
  scene.add(object);
  scene.updateMatrixWorld(true);
  const exporter = new GLTFExporter();
  const buffer = await exporter.parseAsync(scene, { binary: true, trs: true });
  writeFileSync(outPath, Buffer.from(buffer));
  const names = [];
  object.traverse((obj) => {
    if (obj.isMesh) names.push(obj.name);
  });
  console.log(`Wrote ${outPath} (${Buffer.from(buffer).byteLength} bytes) meshes=${names.length}`);
  return names;
}
