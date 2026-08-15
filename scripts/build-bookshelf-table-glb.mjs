/**
 * Bookshelf table as separate named meshes → public/models/bookshelf-table.glb
 *
 *   node ./scripts/build-bookshelf-table-glb.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

function mat(color, extra = {}) {
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

const MAT = {
  white: mat("#f4f7fa", { roughness: 0.38 }),
  whiteSoft: mat("#e8eef4", { roughness: 0.5 }),
  navy: mat("#062553", { roughness: 0.48, metalness: 0.12 }),
  navyDeep: mat("#031733", { roughness: 0.55 }),
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
  soil: mat("#3a2a1c", { roughness: 0.85, metalness: 0 }),
  leaf: mat("#3f9a62", { roughness: 0.55, metalness: 0 }),
  leafDark: mat("#2c6f46", { roughness: 0.6, metalness: 0 }),
  pull: mat("#1a3a58", { roughness: 0.35, metalness: 0.2 }),
};

function addRound(parent, name, { w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, radius = 0.018, segments = 1, material }) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, segments, Math.min(radius, w / 2.2, h / 2.2, d / 2.2)), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, name, { radiusTop, radiusBottom, height, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, material }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildBookshelfTable() {
  const root = new THREE.Group();
  root.name = "BookshelfTable";

  const carcass = new THREE.Group();
  carcass.name = "Carcass";
  root.add(carcass);

  // Overall: W 2.32, body H 0.64, D 0.50. Plinth sits under the white body.
  addRound(carcass, "Plinth", {
    w: 2.18,
    h: 0.055,
    d: 0.44,
    y: 0.0275,
    radius: 0.02,
    material: MAT.navy,
  });

  addRound(carcass, "BottomDeck", {
    w: 2.32,
    h: 0.048,
    d: 0.5,
    y: 0.055 + 0.024,
    radius: 0.02,
    material: MAT.white,
  });

  addRound(carcass, "Top", {
    w: 2.32,
    h: 0.058,
    d: 0.5,
    y: 0.67,
    radius: 0.022,
    material: MAT.white,
  });

  addRound(carcass, "LeftSide", {
    w: 0.05,
    h: 0.58,
    d: 0.5,
    x: -1.135,
    y: 0.37,
    radius: 0.016,
    material: MAT.white,
  });

  addRound(carcass, "RightSide", {
    w: 0.05,
    h: 0.58,
    d: 0.5,
    x: 1.135,
    y: 0.37,
    radius: 0.016,
    material: MAT.white,
  });

  addRound(carcass, "Back", {
    w: 2.22,
    h: 0.58,
    d: 0.034,
    y: 0.37,
    z: -0.233,
    radius: 0.01,
    material: MAT.whiteSoft,
  });

  addRound(carcass, "Divider", {
    w: 0.034,
    h: 0.54,
    d: 0.46,
    x: 0.42,
    y: 0.37,
    radius: 0.01,
    material: MAT.white,
  });

  addRound(carcass, "ShelfBoard", {
    w: 1.48,
    h: 0.028,
    d: 0.44,
    x: -0.36,
    y: 0.355,
    radius: 0.008,
    material: MAT.whiteSoft,
  });

  addRound(carcass, "DrawerFront", {
    w: 0.78,
    h: 0.13,
    d: 0.028,
    x: -0.58,
    y: 0.175,
    z: 0.236,
    radius: 0.01,
    material: MAT.white,
  });

  addRound(carcass, "DrawerPull", {
    w: 0.12,
    h: 0.012,
    d: 0.012,
    x: -0.58,
    y: 0.175,
    z: 0.255,
    radius: 0.005,
    material: MAT.navy,
  });

  const binders = new THREE.Group();
  binders.name = "Binders";
  root.add(binders);

  const binderMats = [MAT.white, MAT.cyan, MAT.whiteSoft, MAT.cyan, MAT.white, MAT.gold, MAT.cyan];
  const binderW = 0.052;
  const binderGap = 0.02;
  const binderStartX = -0.98;
  const shelfTop = 0.355 + 0.014;
  const binderH = 0.24;
  const binderD = 0.2;

  binderMats.forEach((material, i) => {
    const n = String(i + 1).padStart(2, "0");
    const x = binderStartX + i * (binderW + binderGap);
    const y = shelfTop + binderH / 2;
    addRound(binders, `Binder_${n}`, {
      w: binderW,
      h: binderH,
      d: binderD,
      x,
      y,
      z: 0.02,
      radius: 0.01,
      material,
    });
    addCylinder(binders, `BinderPull_${n}`, {
      radiusTop: 0.01,
      radiusBottom: 0.01,
      height: 0.01,
      x,
      y: y + 0.02,
      z: 0.02 + binderD / 2 + 0.002,
      rx: Math.PI / 2,
      material: MAT.pull,
    });
  });

  const vitrine = new THREE.Group();
  vitrine.name = "Vitrine";
  root.add(vitrine);

  addRound(vitrine, "GlassFront", {
    w: 0.68,
    h: 0.52,
    d: 0.012,
    x: 0.78,
    y: 0.38,
    z: 0.232,
    radius: 0.004,
    material: MAT.glass,
  });

  addRound(vitrine, "GlassLeft", {
    w: 0.01,
    h: 0.52,
    d: 0.42,
    x: 0.445,
    y: 0.38,
    z: 0.02,
    radius: 0.003,
    material: MAT.glass,
  });

  const display = new THREE.Group();
  display.name = "DisplayModel";
  display.position.set(0.78, 0.12, 0.02);
  vitrine.add(display);

  addRound(display, "DisplayPodium", {
    w: 0.28,
    h: 0.04,
    d: 0.18,
    y: 0.02,
    radius: 0.01,
    material: MAT.white,
  });
  addRound(display, "DisplayTowerA", {
    w: 0.08,
    h: 0.22,
    d: 0.08,
    x: -0.05,
    y: 0.15,
    z: 0.01,
    radius: 0.01,
    material: MAT.whiteSoft,
  });
  addRound(display, "DisplayTowerB", {
    w: 0.07,
    h: 0.14,
    d: 0.07,
    x: 0.055,
    y: 0.11,
    z: -0.02,
    radius: 0.01,
    material: MAT.white,
  });
  addRound(display, "DisplayBeacon", {
    w: 0.04,
    h: 0.04,
    d: 0.04,
    x: -0.05,
    y: 0.28,
    z: 0.01,
    radius: 0.008,
    material: MAT.cyan,
  });

  const plant = new THREE.Group();
  plant.name = "Plant";
  plant.position.set(-0.92, 0.699, 0.04);
  root.add(plant);

  addRound(plant, "PlantPot", {
    w: 0.16,
    h: 0.15,
    d: 0.16,
    y: 0.075,
    radius: 0.022,
    material: MAT.white,
  });
  addRound(plant, "PlantSoil", {
    w: 0.12,
    h: 0.02,
    d: 0.12,
    y: 0.142,
    radius: 0.008,
    material: MAT.soil,
  });

  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = addRound(plant, `PlantLeaf_${String(i + 1).padStart(2, "0")}`, {
      w: 0.068,
      h: 0.022,
      d: 0.09,
      x: Math.cos(a) * 0.032,
      y: 0.172,
      z: Math.sin(a) * 0.032,
      radius: 0.01,
      material: i % 2 === 0 ? MAT.leaf : MAT.leafDark,
    });
    leaf.rotation.set(-0.38, a, 0);
  }

  addRound(plant, "PlantBud", {
    w: 0.048,
    h: 0.036,
    d: 0.048,
    y: 0.188,
    radius: 0.016,
    material: MAT.leaf,
  });

  return root;
}

const scene = new THREE.Scene();
scene.name = "BookshelfTableScene";
const table = buildBookshelfTable();
scene.add(table);
scene.updateMatrixWorld(true);

const exporter = new GLTFExporter();
const buffer = await exporter.parseAsync(scene, { binary: true, trs: true });
const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "models", "bookshelf-table.glb");
writeFileSync(outPath, Buffer.from(buffer));

const names = [];
table.traverse((obj) => {
  if (obj.isMesh) names.push(obj.name);
});
console.log(`Wrote ${outPath} (${Buffer.from(buffer).byteLength} bytes)`);
console.log(`Meshes (${names.length}): ${names.join(", ")}`);
