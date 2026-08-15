/**
 * Digital Lead still (story-04-lead.png) as separate named-mesh GLBs.
 *
 *   node ./scripts/build-digital-lead-glb.mjs
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MAT,
  THREE,
  addCapsule,
  addCylinder,
  addRound,
  addSphere,
  writeGlb,
} from "./glb-kit.mjs";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "models");

function limb(parent, name, { r, length }) {
  return addCapsule(parent, name, {
    r,
    length,
    hang: true,
    y: 0,
    material: MAT.paper,
    cap: 6,
    radial: 12,
  });
}

function addClayCore(root, { hipY, torsoY, headY, lookX = 0 }) {
  addCapsule(root, "Torso", {
    r: 0.11,
    length: 0.36,
    y: torsoY,
    material: MAT.paper,
    cap: 6,
    radial: 14,
  });
  addRound(root, "Pelvis", {
    w: 0.22,
    h: 0.1,
    d: 0.16,
    y: hipY,
    radius: 0.04,
    material: MAT.paper,
  });

  const headRig = new THREE.Group();
  headRig.name = "HeadRig";
  headRig.position.set(0, headY - 0.12, 0);
  headRig.rotation.x = lookX;
  root.add(headRig);
  addCylinder(headRig, "Neck", {
    radiusTop: 0.038,
    radiusBottom: 0.042,
    height: 0.07,
    y: 0,
    material: MAT.paper,
  });
  addSphere(headRig, "Head", { r: 0.11, y: 0.12, segments: 16, material: MAT.paper });
  return { hipY, headRig };
}

function addArm(root, side, x, shoulderY, shX, elbX, shZ = 0, elbZ = 0) {
  const sh = new THREE.Group();
  sh.name = `Shoulder_${side}`;
  sh.position.set(x, shoulderY, 0.02);
  sh.rotation.x = shX;
  sh.rotation.z = shZ;
  root.add(sh);
  limb(sh, `UpperArm_${side}`, { r: 0.04, length: 0.2 });
  const elb = new THREE.Group();
  elb.name = `Elbow_${side}`;
  elb.position.set(0, -(0.2 + 0.08), 0);
  elb.rotation.x = elbX;
  elb.rotation.z = elbZ;
  sh.add(elb);
  limb(elb, `ForeArm_${side}`, { r: 0.036, length: 0.18 });
  addSphere(elb, `Hand_${side}`, { r: 0.038, y: -(0.18 + 0.072), segments: 10, material: MAT.paper });
  return elb;
}

function addSittingLegs(root, hipY) {
  for (const { side, x } of [
    { side: "L", x: -0.08 },
    { side: "R", x: 0.08 },
  ]) {
    addRound(root, `UpperLeg_${side}`, {
      w: 0.095,
      h: 0.1,
      d: 0.28,
      x,
      y: hipY - 0.02,
      z: 0.14,
      radius: 0.04,
      material: MAT.paper,
    });
    addRound(root, `LowerLeg_${side}`, {
      w: 0.08,
      h: 0.28,
      d: 0.08,
      x,
      y: hipY - 0.2,
      z: 0.3,
      radius: 0.035,
      material: MAT.paper,
    });
    addRound(root, `Foot_${side}`, {
      w: 0.075,
      h: 0.045,
      d: 0.15,
      x,
      y: 0.04,
      z: 0.34,
      radius: 0.02,
      material: MAT.paper,
    });
  }
}

function addStandingLegs(root, hipY) {
  for (const { side, x } of [
    { side: "L", x: -0.08 },
    { side: "R", x: 0.08 },
  ]) {
    const hip = new THREE.Group();
    hip.name = `Hip_${side}`;
    hip.position.set(x, hipY, 0);
    root.add(hip);
    limb(hip, `UpperLeg_${side}`, { r: 0.055, length: 0.3 });
    const knee = new THREE.Group();
    knee.position.set(0, -(0.3 + 0.11), 0);
    hip.add(knee);
    limb(knee, `LowerLeg_${side}`, { r: 0.048, length: 0.3 });
    addRound(knee, `Foot_${side}`, {
      w: 0.075,
      h: 0.045,
      d: 0.15,
      y: -(0.3 + 0.1),
      z: 0.03,
      radius: 0.02,
      material: MAT.paper,
    });
  }
}

export function buildFigureSit() {
  const root = new THREE.Group();
  root.name = "LeadFigureSit";
  addClayCore(root, { hipY: 0.5, torsoY: 0.74, headY: 1.08, lookX: 0.22 });
  addSittingLegs(root, 0.5);
  addArm(root, "L", -0.16, 0.92, -0.38, -1.88, -0.22, 0.34);
  addArm(root, "R", 0.16, 0.92, -0.34, -1.92, 0.22, -0.34);
  return root;
}

export function buildFigurePoint() {
  const root = new THREE.Group();
  root.name = "LeadFigurePoint";
  addClayCore(root, { hipY: 0.5, torsoY: 0.74, headY: 1.08, lookX: -0.16 });
  addSittingLegs(root, 0.5);
  addArm(root, "L", -0.16, 0.92, -0.22, 0.28, -0.12, 0);
  addArm(root, "R", 0.16, 0.92, -1.72, -0.22, 0.1, -0.08);
  return root;
}

export function buildFigureHardhat() {
  const root = buildFigureSit();
  root.name = "LeadFigureHardhat";
  const headRig = root.getObjectByName("HeadRig");
  const hatParent = headRig ?? root;
  addSphere(hatParent, "HatDome", { r: 0.125, y: 0.2, segments: 16, material: MAT.paper });
  addCylinder(hatParent, "HatBrim", {
    radiusTop: 0.155,
    radiusBottom: 0.155,
    height: 0.018,
    y: 0.095,
    material: MAT.whiteSoft,
  });
  return root;
}

export function buildFigureStandTablet() {
  const root = new THREE.Group();
  root.name = "LeadFigureStandTablet";
  addClayCore(root, { hipY: 0.92, torsoY: 1.18, headY: 1.54, lookX: 0.28 });
  addStandingLegs(root, 0.92);
  addArm(root, "L", -0.16, 1.34, -0.18, 0.18, -0.08, 0);
  const elb = addArm(root, "R", 0.16, 1.34, -0.55, -1.28, 0.1, -0.12);
  const tab = new THREE.Group();
  tab.name = "Tablet";
  tab.position.set(0, -0.26, 0.02);
  tab.rotation.x = -(-0.55 + -1.28) + 0.12;
  elb.add(tab);
  addRound(tab, "TabletBody", {
    w: 0.16,
    h: 0.01,
    d: 0.24,
    radius: 0.008,
    material: MAT.charcoal,
  });
  addRound(tab, "TabletScreen", {
    w: 0.14,
    h: 0.004,
    d: 0.21,
    y: 0.008,
    radius: 0.004,
    material: MAT.screen,
    shadows: false,
  });
  return root;
}

export function buildFigureStandPlans() {
  const root = new THREE.Group();
  root.name = "LeadFigureStandPlans";
  addClayCore(root, { hipY: 0.92, torsoY: 1.18, headY: 1.54, lookX: 0.18 });
  addStandingLegs(root, 0.92);
  addArm(root, "R", 0.16, 1.34, -0.18, 0.16, 0.08, 0);
  const elb = addArm(root, "L", -0.16, 1.34, -0.48, -1.15, -0.1, 0.1);
  const rolls = new THREE.Group();
  rolls.name = "BlueprintBundle";
  rolls.position.set(0.02, -0.22, 0.02);
  rolls.rotation.x = -(-0.48 + -1.15);
  elb.add(rolls);
  for (let i = 0; i < 3; i += 1) {
    addCylinder(rolls, `Blueprint_${i + 1}`, {
      radiusTop: 0.028,
      radiusBottom: 0.028,
      height: 0.32,
      x: (i - 1) * 0.04,
      z: i * 0.012,
      rx: Math.PI / 2,
      material: i === 1 ? MAT.whiteSoft : MAT.paper,
    });
  }
  return root;
}

function buildLeadTable() {
  const root = new THREE.Group();
  root.name = "LeadTable";
  addRound(root, "Top", {
    w: 2.35,
    h: 0.08,
    d: 1.05,
    y: 0.73,
    radius: 0.06,
    material: MAT.paper,
  });
  for (const [i, x, z] of [
    [1, -0.95, -0.38],
    [2, 0.95, -0.38],
    [3, -0.95, 0.38],
    [4, 0.95, 0.38],
  ]) {
    addCylinder(root, `Leg_${i}`, {
      radiusTop: 0.055,
      radiusBottom: 0.06,
      height: 0.69,
      x,
      y: 0.345,
      z,
      material: MAT.whiteSoft,
    });
  }
  return root;
}

function buildLeadChair() {
  const root = new THREE.Group();
  root.name = "LeadChair";
  addRound(root, "Seat", {
    w: 0.44,
    h: 0.06,
    d: 0.44,
    y: 0.46,
    radius: 0.05,
    material: MAT.ice,
  });
  addRound(root, "Back", {
    w: 0.42,
    h: 0.48,
    d: 0.07,
    y: 0.74,
    z: -0.2,
    rx: -0.12,
    radius: 0.045,
    material: MAT.ice,
  });
  addCylinder(root, "Stem", {
    radiusTop: 0.028,
    radiusBottom: 0.034,
    height: 0.28,
    y: 0.28,
    material: MAT.paper,
  });
  addCylinder(root, "Base", {
    radiusTop: 0.18,
    radiusBottom: 0.18,
    height: 0.04,
    y: 0.03,
    material: MAT.paper,
  });
  return root;
}

function buildLeadLaptop() {
  const root = new THREE.Group();
  root.name = "LeadLaptop";
  addRound(root, "Base", {
    w: 0.32,
    h: 0.012,
    d: 0.22,
    y: 0.006,
    radius: 0.006,
    material: MAT.whiteSoft,
  });
  const lid = new THREE.Group();
  lid.name = "Lid";
  lid.position.set(0, 0.012, -0.105);
  lid.rotation.x = -1.05;
  root.add(lid);
  addRound(lid, "ScreenBack", {
    w: 0.32,
    h: 0.2,
    d: 0.01,
    y: 0.1,
    radius: 0.006,
    material: MAT.whiteSoft,
  });
  addRound(lid, "Screen", {
    w: 0.29,
    h: 0.175,
    d: 0.004,
    y: 0.1,
    z: 0.008,
    radius: 0.002,
    material: MAT.screen,
    shadows: false,
  });
  return root;
}

function buildLeadMug() {
  const root = new THREE.Group();
  root.name = "LeadMug";
  addCylinder(root, "Cup", {
    radiusTop: 0.038,
    radiusBottom: 0.034,
    height: 0.08,
    y: 0.04,
    material: MAT.ice,
  });
  addCylinder(root, "Handle", {
    radiusTop: 0.01,
    radiusBottom: 0.01,
    height: 0.05,
    x: 0.05,
    y: 0.04,
    z: 0,
    material: MAT.iceDeep,
  });
  return root;
}

function buildLeadNotebook() {
  const root = new THREE.Group();
  root.name = "LeadNotebook";
  addRound(root, "Cover", {
    w: 0.16,
    h: 0.012,
    d: 0.22,
    y: 0.006,
    radius: 0.008,
    material: MAT.iceDeep,
  });
  addRound(root, "Pages", {
    w: 0.15,
    h: 0.008,
    d: 0.2,
    y: 0.014,
    radius: 0.004,
    material: MAT.paper,
  });
  return root;
}

function buildLeadBlueprints() {
  const root = new THREE.Group();
  root.name = "LeadBlueprints";
  for (let i = 0; i < 3; i += 1) {
    addCylinder(root, `Roll_${i + 1}`, {
      radiusTop: 0.03,
      radiusBottom: 0.03,
      height: 0.34,
      x: (i - 1) * 0.045,
      y: 0.03,
      z: i * 0.01,
      rx: Math.PI / 2,
      material: i === 1 ? MAT.whiteSoft : MAT.paper,
    });
  }
  return root;
}

function addArchMassing(parent) {
  const g = new THREE.Group();
  g.name = "ArchModel";
  g.position.set(1.15, 0.02, 0.08);
  parent.add(g);
  addRound(g, "ArchPodium", { w: 0.42, h: 0.06, d: 0.28, y: 0.03, radius: 0.02, material: MAT.ice });
  addRound(g, "ArchWing", { w: 0.18, h: 0.22, d: 0.22, x: -0.1, y: 0.17, radius: 0.02, material: MAT.whiteSoft });
  addRound(g, "ArchTower", { w: 0.16, h: 0.38, d: 0.16, x: 0.1, y: 0.25, radius: 0.02, material: MAT.paper });
  for (let i = 0; i < 4; i += 1) {
    addRound(g, `ArchWindow_${i + 1}`, {
      w: 0.12,
      h: 0.035,
      d: 0.01,
      x: 0.1,
      y: 0.14 + i * 0.07,
      z: 0.085,
      radius: 0.004,
      material: MAT.navy,
      shadows: false,
    });
  }
}

function addStructFrame(parent) {
  const g = new THREE.Group();
  g.name = "StructModel";
  g.position.set(0, 0.02, 0.08);
  parent.add(g);
  for (let ix = 0; ix < 3; ix += 1) {
    for (let iz = 0; iz < 3; iz += 1) {
      addCylinder(g, `Col_${ix}${iz}`, {
        radiusTop: 0.018,
        radiusBottom: 0.018,
        height: 0.36,
        x: (ix - 1) * 0.14,
        y: 0.18,
        z: (iz - 1) * 0.12,
        material: MAT.struct,
      });
    }
  }
  for (let iy = 0; iy < 3; iy += 1) {
    addRound(g, `Slab_${iy + 1}`, {
      w: 0.32,
      h: 0.016,
      d: 0.28,
      y: 0.08 + iy * 0.12,
      radius: 0.004,
      material: MAT.struct,
    });
  }
}

function addMepKit(parent) {
  const g = new THREE.Group();
  g.name = "MepModel";
  g.position.set(-1.15, 0.04, 0.08);
  parent.add(g);
  addRound(g, "MepFootprint", { w: 0.4, h: 0.02, d: 0.28, y: 0.01, radius: 0.006, material: MAT.navyDeep });
  addCylinder(g, "DuctMain", {
    radiusTop: 0.035,
    radiusBottom: 0.035,
    height: 0.32,
    y: 0.12,
    z: 0.02,
    rx: Math.PI / 2,
    material: MAT.cyan,
  });
  addCylinder(g, "PipeGreen", {
    radiusTop: 0.016,
    radiusBottom: 0.016,
    height: 0.28,
    x: -0.1,
    y: 0.1,
    rx: Math.PI / 2,
    material: MAT.mepGreen,
  });
  addCylinder(g, "PipeGold", {
    radiusTop: 0.014,
    radiusBottom: 0.014,
    height: 0.22,
    x: 0.12,
    y: 0.16,
    rz: Math.PI / 2,
    material: MAT.gold,
  });
  addRound(g, "AhUnit", { w: 0.1, h: 0.1, d: 0.08, x: 0.12, y: 0.1, z: -0.06, radius: 0.012, material: MAT.iceDeep });
}

function buildLeadDashboard() {
  const root = new THREE.Group();
  root.name = "LeadDashboard";
  addRound(root, "Board", {
    w: 4.2,
    h: 1.85,
    d: 0.06,
    y: 0.92,
    radius: 0.04,
    material: MAT.whiteSoft,
  });
  addRound(root, "Header", {
    w: 4.2,
    h: 0.22,
    d: 0.07,
    y: 1.74,
    radius: 0.03,
    material: MAT.navy,
  });
  const icons = ["IconClient", "IconLead", "IconPm", "IconMep", "IconArch"];
  icons.forEach((name, i) => {
    addCylinder(root, name, {
      radiusTop: 0.09,
      radiusBottom: 0.09,
      height: 0.03,
      x: -1.5 + i * 0.42,
      y: 1.74,
      z: 0.05,
      rx: Math.PI / 2,
      material: i === 1 ? MAT.gold : MAT.ice,
      shadows: false,
    });
  });
  addArchMassing(root);
  addStructFrame(root);
  addMepKit(root);
  return root;
}

const assets = [
  ["lead-table.glb", buildLeadTable],
  ["lead-chair.glb", buildLeadChair],
  ["lead-figure-sit.glb", buildFigureSit],
  ["lead-figure-point.glb", buildFigurePoint],
  ["lead-figure-hardhat.glb", buildFigureHardhat],
  ["lead-figure-stand-tablet.glb", buildFigureStandTablet],
  ["lead-figure-stand-plans.glb", buildFigureStandPlans],
  ["lead-laptop.glb", buildLeadLaptop],
  ["lead-mug.glb", buildLeadMug],
  ["lead-notebook.glb", buildLeadNotebook],
  ["lead-blueprints.glb", buildLeadBlueprints],
  ["lead-dashboard.glb", buildLeadDashboard],
];

if (process.argv.includes("--dump")) {
  const { Vector3 } = THREE;
  const p = new Vector3();
  const f = new Vector3();
  const figures = [
    ["SIT", buildFigureSit()],
    ["POINT", buildFigurePoint()],
    ["TABLET", buildFigureStandTablet()],
    ["PLANS", buildFigureStandPlans()],
  ];
  const names = ["Head", "Shoulder_L", "Hand_L", "Shoulder_R", "Hand_R", "UpperLeg_L", "Foot_L", "Tablet", "TabletBody", "BlueprintBundle"];
  for (const [label, root] of figures) {
    root.updateMatrixWorld(true);
    console.log(`\n=== ${label} ===`);
    for (const name of names) {
      const o = root.getObjectByName(name);
      if (!o) continue;
      o.getWorldPosition(p);
      f.set(0, 0, 1).transformDirection(o.matrixWorld);
      console.log(name.padEnd(16), "pos", p.x.toFixed(3), p.y.toFixed(3), p.z.toFixed(3), "  z", p.z.toFixed(3));
    }
  }
} else {
  for (const [file, build] of assets) {
    await writeGlb(build(), join(outDir, file));
  }
}
