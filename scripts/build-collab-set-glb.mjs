/**
 * Collaborative BIM set: chair, hex table, sitting humanoid, laptop.
 *
 *   node ./scripts/build-collab-set-glb.mjs
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MAT,
  THREE,
  addCapsule,
  addCylinder,
  addExtrude,
  addRound,
  addSphere,
  addTorus,
  roundedHexShape,
  writeGlb,
} from "./glb-kit.mjs";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "models");
const HEX_ROT = Math.PI / 6;

export function buildOfficeChair() {
  const root = new THREE.Group();
  root.name = "OfficeChair";

  addRound(root, "Seat", {
    w: 0.46,
    h: 0.055,
    d: 0.46,
    y: 0.452,
    z: 0.02,
    radius: 0.04,
    material: MAT.navy,
  });
  addRound(root, "SeatPad", {
    w: 0.4,
    h: 0.028,
    d: 0.4,
    y: 0.492,
    z: 0.02,
    radius: 0.03,
    material: MAT.teal,
  });
  addRound(root, "BackLower", {
    w: 0.42,
    h: 0.28,
    d: 0.055,
    y: 0.62,
    z: -0.2,
    rx: -0.12,
    radius: 0.03,
    material: MAT.white,
  });
  addRound(root, "BackPad", {
    w: 0.34,
    h: 0.22,
    d: 0.032,
    y: 0.64,
    z: -0.168,
    rx: -0.12,
    radius: 0.02,
    material: MAT.navy,
  });
  addRound(root, "BackUpper", {
    w: 0.4,
    h: 0.34,
    d: 0.05,
    y: 0.92,
    z: -0.23,
    rx: -0.08,
    radius: 0.03,
    material: MAT.whiteSoft,
  });
  addRound(root, "Arm_L", {
    w: 0.05,
    h: 0.036,
    d: 0.28,
    x: -0.24,
    y: 0.62,
    z: 0.02,
    radius: 0.016,
    material: MAT.white,
  });
  addRound(root, "Arm_R", {
    w: 0.05,
    h: 0.036,
    d: 0.28,
    x: 0.24,
    y: 0.62,
    z: 0.02,
    radius: 0.016,
    material: MAT.white,
  });

  addCylinder(root, "Stem", {
    radiusTop: 0.028,
    radiusBottom: 0.036,
    height: 0.28,
    y: 0.28,
    material: MAT.charcoal,
  });
  addCylinder(root, "Hub", {
    radiusTop: 0.05,
    radiusBottom: 0.05,
    height: 0.044,
    y: 0.05,
    material: MAT.ink,
  });

  for (let i = 0; i < 5; i += 1) {
    const n = String(i + 1).padStart(2, "0");
    const a = (i / 5) * Math.PI * 2;
    addRound(root, `Spoke_${n}`, {
      w: 0.28,
      h: 0.024,
      d: 0.04,
      x: Math.sin(a) * 0.14,
      y: 0.036,
      z: Math.cos(a) * 0.14,
      ry: a,
      radius: 0.008,
      material: MAT.charcoal,
    });
    addSphere(root, `Caster_${n}`, {
      r: 0.026,
      x: Math.sin(a) * 0.28,
      y: 0.026,
      z: Math.cos(a) * 0.28,
      segments: 10,
      material: MAT.ink,
    });
  }

  return root;
}

export function buildHexTable() {
  const root = new THREE.Group();
  root.name = "HexTable";
  const topY = 0.748;

  addExtrude(root, "Plinth", roundedHexShape(0.52, 0.12), {
    depth: 0.045,
    y: 0.024,
    bevel: 0.006,
    material: MAT.navyDeep,
  });
  addExtrude(root, "GlowTrim", roundedHexShape(0.58, 0.12), {
    depth: 0.012,
    y: 0.054,
    bevel: 0.003,
    material: MAT.cyan,
    shadows: false,
  });
  addExtrude(root, "Pedestal", roundedHexShape(0.44, 0.1), {
    depth: 0.58,
    y: 0.35,
    bevel: 0.012,
    material: MAT.navy,
  });
  addExtrude(root, "Top", roundedHexShape(1.4, 0.26), {
    depth: 0.072,
    y: 0.698,
    bevel: 0.014,
    material: MAT.white,
  });
  addExtrude(root, "Well", roundedHexShape(0.5, 0.14), {
    depth: 0.02,
    y: 0.668,
    bevel: 0.006,
    material: MAT.ice,
    shadows: false,
  });

  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + HEX_ROT;
    addCylinder(root, `Pad_${String(i + 1).padStart(2, "0")}`, {
      radiusTop: 0.048,
      radiusBottom: 0.048,
      height: 0.006,
      x: Math.sin(a) * 1.02,
      y: topY + 0.004,
      z: Math.cos(a) * 1.02,
      radial: 24,
      material: MAT.glow,
      shadows: false,
    });
  }

  addRound(root, "Panel", {
    w: 0.22,
    h: 0.008,
    d: 0.13,
    x: 0.72,
    y: topY + 0.006,
    z: -0.18,
    ry: -0.55,
    radius: 0.012,
    material: MAT.whiteSoft,
  });
  addRound(root, "PanelScreen", {
    w: 0.18,
    h: 0.004,
    d: 0.09,
    x: 0.72,
    y: topY + 0.012,
    z: -0.18,
    ry: -0.55,
    radius: 0.006,
    material: MAT.screen,
    shadows: false,
  });

  return root;
}

function hangLimb(parent, name, { r, length, material }) {
  return addCapsule(parent, name, {
    r,
    length,
    hang: true,
    y: 0,
    cap: 8,
    radial: 16,
    material,
  });
}

export function buildHumanoidSitting() {
  const root = new THREE.Group();
  root.name = "HumanoidSitting";
  const skin = MAT.skin;
  const shirt = MAT.shirt;
  const tie = MAT.cyan;

  const hipY = 0.5;
  const thigh = { r: 0.074, length: 0.28 };
  const shin = { r: 0.062, length: 0.328 };
  const upperArm = { r: 0.046, length: 0.15 };
  const foreArm = { r: 0.038, length: 0.195 };

  function addLeg(side, x, hipX, kneeX) {
    const hip = new THREE.Group();
    hip.name = `HipJoint_${side}`;
    hip.position.set(x, hipY, 0.03);
    hip.rotation.x = hipX;
    hip.rotation.y = side === "L" ? 0.06 : -0.06;
    root.add(hip);
    addSphere(hip, `Hip_${side}`, { r: 0.082, segments: 24, material: skin });
    hangLimb(hip, `UpperLeg_${side}`, { ...thigh, material: skin });

    const knee = new THREE.Group();
    knee.name = `KneeJoint_${side}`;
    knee.position.set(0, -(thigh.length + thigh.r * 2), 0);
    knee.rotation.x = kneeX;
    hip.add(knee);
    addSphere(knee, `Knee_${side}`, { r: 0.07, segments: 22, material: skin });
    hangLimb(knee, `LowerLeg_${side}`, { ...shin, material: skin });

    const ankle = new THREE.Group();
    ankle.name = `Ankle_${side}`;
    ankle.position.set(0, -(shin.length + shin.r * 2), 0);
    ankle.rotation.x = -(hipX + kneeX) + 0.02;
    knee.add(ankle);
    addSphere(ankle, `AnkleBall_${side}`, { r: 0.028, y: 0.004, z: -0.01, segments: 16, material: skin });
    addRound(ankle, `Foot_${side}`, {
      w: 0.092,
      h: 0.042,
      d: 0.2,
      y: -0.012,
      z: 0.062,
      radius: 0.02,
      segments: 2,
      material: skin,
    });
    addSphere(ankle, `Heel_${side}`, { r: 0.026, y: -0.004, z: -0.018, segments: 16, material: skin });
    addRound(ankle, `Toe_${side}`, {
      w: 0.08,
      h: 0.028,
      d: 0.055,
      y: -0.016,
      z: 0.148,
      radius: 0.014,
      segments: 2,
      material: skin,
    });
  }

  addLeg("L", -0.1, -Math.PI / 2 + 0.04, Math.PI / 2 - 0.06);
  addLeg("R", 0.1, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.04);

  const spine = new THREE.Group();
  spine.name = "Spine";
  spine.position.set(0, hipY + 0.02, 0.02);
  spine.rotation.x = 0.08;
  root.add(spine);

  addRound(spine, "Pelvis", {
    w: 0.3,
    h: 0.14,
    d: 0.2,
    y: -0.02,
    z: -0.01,
    radius: 0.06,
    segments: 3,
    material: skin,
  });
  addRound(spine, "SeatMass", {
    w: 0.24,
    h: 0.1,
    d: 0.16,
    y: -0.05,
    z: -0.04,
    radius: 0.048,
    segments: 2,
    material: skin,
  });
  addRound(spine, "Torso", {
    w: 0.23,
    h: 0.3,
    d: 0.135,
    y: 0.2,
    z: -0.012,
    radius: 0.06,
    segments: 3,
    material: skin,
  });
  addRound(spine, "Shirt", {
    w: 0.28,
    h: 0.34,
    d: 0.17,
    y: 0.195,
    radius: 0.07,
    segments: 3,
    material: shirt,
  });
  addRound(spine, "Placket", {
    w: 0.016,
    h: 0.24,
    d: 0.01,
    y: 0.185,
    z: 0.09,
    radius: 0.005,
    segments: 2,
    material: MAT.whiteSoft,
  });

  addTorus(spine, "Collar", {
    radius: 0.048,
    tube: 0.011,
    y: 0.365,
    radial: 28,
    tubular: 12,
    material: shirt,
    shadows: true,
  });
  addTorus(spine, "CollarBand", {
    radius: 0.05,
    tube: 0.007,
    y: 0.352,
    radial: 28,
    tubular: 10,
    material: MAT.navy,
    shadows: true,
  });
  addRound(spine, "CollarLeaf_L", {
    w: 0.07,
    h: 0.04,
    d: 0.013,
    x: -0.038,
    y: 0.372,
    z: 0.042,
    ry: 0.48,
    rz: -0.22,
    radius: 0.01,
    segments: 2,
    material: shirt,
  });
  addRound(spine, "CollarLeaf_R", {
    w: 0.07,
    h: 0.04,
    d: 0.013,
    x: 0.038,
    y: 0.372,
    z: 0.042,
    ry: -0.48,
    rz: 0.22,
    radius: 0.01,
    segments: 2,
    material: shirt,
  });

  const headRig = new THREE.Group();
  headRig.name = "HeadRig";
  headRig.position.set(0, 0.4, -0.006);
  headRig.rotation.x = 0.18;
  spine.add(headRig);
  addCylinder(headRig, "Neck", {
    radiusTop: 0.03,
    radiusBottom: 0.036,
    height: 0.06,
    y: 0.012,
    radial: 22,
    material: skin,
  });
  addSphere(headRig, "Head", { r: 0.096, y: 0.128, z: 0.004, segments: 32, material: skin });

  addRound(spine, "TieKnot", {
    w: 0.038,
    h: 0.032,
    d: 0.028,
    y: 0.338,
    z: 0.092,
    radius: 0.01,
    segments: 2,
    material: tie,
  });
  addRound(spine, "Tie", {
    w: 0.028,
    h: 0.185,
    d: 0.014,
    y: 0.205,
    z: 0.094,
    radius: 0.008,
    segments: 2,
    material: tie,
  });
  addRound(spine, "TieTip", {
    w: 0.024,
    h: 0.036,
    d: 0.012,
    y: 0.1,
    z: 0.094,
    radius: 0.008,
    segments: 2,
    material: tie,
  });

  function flattenWorld(node) {
    root.updateMatrixWorld(true);
    const inv = new THREE.Quaternion();
    node.getWorldQuaternion(inv).invert();
    node.quaternion.copy(inv);
  }

  function addHand(wrist, side) {
    addRound(wrist, `Hand_${side}`, {
      w: 0.06,
      h: 0.02,
      d: 0.074,
      y: -0.01,
      z: 0.03,
      radius: 0.01,
      segments: 2,
      material: skin,
    });
    const widths = [-0.022, -0.0075, 0.0075, 0.022];
    const lens = [0.032, 0.04, 0.038, 0.028];
    widths.forEach((fx, i) => {
      const f = new THREE.Group();
      f.name = `FingerJoint_${side}_${i}`;
      f.position.set(fx, -0.008, 0.064);
      f.rotation.x = 0.48 + i * 0.05;
      wrist.add(f);
      addCapsule(f, `Finger_${side}_${i}`, {
        r: 0.0076,
        length: lens[i],
        z: lens[i] / 2 + 0.006,
        rx: Math.PI / 2,
        cap: 6,
        radial: 10,
        material: skin,
      });
    });
    const thumb = new THREE.Group();
    thumb.name = `ThumbJoint_${side}`;
    thumb.position.set(side === "L" ? 0.03 : -0.03, -0.002, 0.016);
    thumb.rotation.set(0.42, side === "L" ? 0.9 : -0.9, side === "L" ? 0.35 : -0.35);
    wrist.add(thumb);
    addCapsule(thumb, `Thumb_${side}`, {
      r: 0.0088,
      length: 0.03,
      z: 0.022,
      rx: Math.PI / 2,
      cap: 6,
      radial: 10,
      material: skin,
    });
  }

  function addArm(side, x, shX, elbX, shZ, elbZ) {
    const sh = new THREE.Group();
    sh.name = `ShoulderJoint_${side}`;
    sh.position.set(x, 0.348, 0.035);
    sh.rotation.x = shX;
    sh.rotation.z = shZ;
    spine.add(sh);
    addSphere(sh, `Shoulder_${side}`, { r: 0.058, segments: 22, material: shirt });
    hangLimb(sh, `UpperArm_${side}`, { ...upperArm, material: shirt });

    const elb = new THREE.Group();
    elb.name = `ElbowJoint_${side}`;
    elb.position.set(0, -(upperArm.length + upperArm.r * 2), 0);
    elb.rotation.x = elbX;
    elb.rotation.z = elbZ;
    sh.add(elb);
    addSphere(elb, `Elbow_${side}`, { r: 0.042, segments: 20, material: shirt });
    hangLimb(elb, `ForeArm_${side}`, { ...foreArm, material: shirt });

    const wristY = -(foreArm.length + foreArm.r * 2);
    addCylinder(elb, `Cuff_${side}`, {
      radiusTop: 0.04,
      radiusBottom: 0.042,
      height: 0.034,
      radial: 18,
      y: wristY + 0.014,
      material: shirt,
    });
    addCylinder(elb, `CuffTrim_${side}`, {
      radiusTop: 0.043,
      radiusBottom: 0.044,
      height: 0.01,
      radial: 18,
      y: wristY + 0.028,
      material: MAT.cyan,
      shadows: false,
    });

    const wrist = new THREE.Group();
    wrist.name = `Wrist_${side}`;
    wrist.position.set(0, wristY, 0);
    elb.add(wrist);
    flattenWorld(wrist);
    wrist.rotateX(0.38);
    wrist.rotateY(side === "L" ? 0.04 : -0.04);
    addHand(wrist, side);
  }

  addArm("L", -0.12, -0.5, -1.96, -0.05, 0.08);
  addArm("R", 0.12, -0.46, -1.98, 0.05, -0.08);

  return root;
}

export function buildLaptop() {
  const root = new THREE.Group();
  root.name = "Laptop";

  addRound(root, "Base", {
    w: 0.32,
    h: 0.014,
    d: 0.22,
    y: 0.007,
    radius: 0.006,
    material: MAT.charcoal,
  });
  addRound(root, "KeyboardDeck", {
    w: 0.28,
    h: 0.004,
    d: 0.14,
    y: 0.016,
    z: 0.02,
    radius: 0.002,
    material: MAT.navyDeep,
  });

  const lid = new THREE.Group();
  lid.name = "Lid";
  lid.position.set(0, 0.014, -0.105);
  lid.rotation.x = -1.05;
  root.add(lid);

  addRound(lid, "ScreenBack", {
    w: 0.32,
    h: 0.2,
    d: 0.01,
    y: 0.1,
    radius: 0.006,
    material: MAT.charcoal,
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
  addRound(lid, "Logo", {
    w: 0.028,
    h: 0.028,
    d: 0.004,
    y: 0.1,
    z: -0.008,
    radius: 0.004,
    material: MAT.cyan,
    shadows: false,
  });
  addRound(lid, "Chart_1", {
    w: 0.04,
    h: 0.07,
    d: 0.003,
    x: -0.06,
    y: 0.085,
    z: 0.012,
    radius: 0.002,
    material: MAT.ice,
    shadows: false,
  });
  addRound(lid, "Chart_2", {
    w: 0.04,
    h: 0.1,
    d: 0.003,
    x: -0.012,
    y: 0.1,
    z: 0.012,
    radius: 0.002,
    material: MAT.cyan,
    shadows: false,
  });
  addRound(lid, "Chart_3", {
    w: 0.04,
    h: 0.055,
    d: 0.003,
    x: 0.036,
    y: 0.078,
    z: 0.012,
    radius: 0.002,
    material: MAT.whiteSoft,
    shadows: false,
  });

  return root;
}

export function buildHubPlant() {
  const root = new THREE.Group();
  root.name = "HubPlant";

  addCylinder(root, "PlantPot", {
    radiusTop: 0.042,
    radiusBottom: 0.034,
    height: 0.068,
    y: 0.034,
    radial: 16,
    material: MAT.charcoal,
  });
  addCylinder(root, "PlantSoil", {
    radiusTop: 0.034,
    radiusBottom: 0.034,
    height: 0.01,
    y: 0.066,
    radial: 16,
    material: MAT.soil,
  });
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    const leaf = addRound(root, `PlantLeaf_${String(i + 1).padStart(2, "0")}`, {
      w: 0.05,
      h: 0.016,
      d: 0.07,
      x: Math.cos(a) * 0.022,
      y: 0.09,
      z: Math.sin(a) * 0.022,
      radius: 0.008,
      material: i % 2 === 0 ? MAT.leaf : MAT.leafDark,
    });
    leaf.rotation.set(-0.42, a, 0);
  }
  addSphere(root, "PlantBud", { r: 0.018, y: 0.108, segments: 12, material: MAT.leaf });
  return root;
}

export function buildHubMug() {
  const root = new THREE.Group();
  root.name = "HubMug";
  addCylinder(root, "Cup", {
    radiusTop: 0.032,
    radiusBottom: 0.028,
    height: 0.07,
    y: 0.035,
    radial: 20,
    material: MAT.charcoal,
  });
  addCylinder(root, "Rim", {
    radiusTop: 0.033,
    radiusBottom: 0.033,
    height: 0.008,
    y: 0.068,
    radial: 20,
    material: MAT.cyan,
    shadows: false,
  });
  addCylinder(root, "Handle", {
    radiusTop: 0.007,
    radiusBottom: 0.007,
    height: 0.042,
    x: 0.048,
    y: 0.036,
    radial: 12,
    material: MAT.charcoal,
  });
  return root;
}

const assets = [
  ["office-chair.glb", buildOfficeChair],
  ["hex-table.glb", buildHexTable],
  ["humanoid-sitting.glb", buildHumanoidSitting],
  ["laptop.glb", buildLaptop],
  ["hub-plant.glb", buildHubPlant],
  ["hub-mug.glb", buildHubMug],
];

if (process.argv.includes("--dump")) {
  const root = buildHumanoidSitting();
  root.updateMatrixWorld(true);
  const p = new THREE.Vector3();
  const names = [
    "Head",
    "Shoulder_L",
    "UpperArm_L",
    "Elbow_L",
    "ForeArm_L",
    "Cuff_L",
    "Wrist_L",
    "Hand_L",
    "Finger_L_1",
    "Thumb_L",
    "Shoulder_R",
    "Elbow_R",
    "Hand_R",
    "Hip_L",
    "UpperLeg_L",
    "Knee_L",
    "LowerLeg_L",
    "Ankle_L",
    "Foot_L",
    "Toe_L",
  ];
  for (const name of names) {
    const o = root.getObjectByName(name);
    if (!o) {
      console.log(name.padEnd(16), "MISSING");
      continue;
    }
    o.getWorldPosition(p);
    console.log(name.padEnd(16), p.x.toFixed(3), p.y.toFixed(3), p.z.toFixed(3));
  }
} else {
  for (const [file, build] of assets) {
    await writeGlb(build(), join(outDir, file));
  }
}
