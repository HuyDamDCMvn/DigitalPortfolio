/**
 * Clay businessman walker — STRATUM-style faceless figure in stride,
 * white shirt, molded collar, cyan tie, briefcase in the right hand.
 *
 * Hang-axis: capsules hang along local −Y. Negative rotation.x swings a
 * limb toward +Z (kit front / walk direction); positive rotation.x toward −Z.
 *
 *   node ./scripts/build-walker-glb.mjs
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
  addTorus,
  writeGlb,
} from "./glb-kit.mjs";

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

export function buildWalker() {
  const root = new THREE.Group();
  root.name = "Walker";
  const skin = MAT.skin;
  const shirt = MAT.shirt;
  const tie = MAT.cyan;
  const caseMat = MAT.charcoal;
  const accent = MAT.navy;

  const spine = new THREE.Group();
  spine.name = "Spine";
  spine.position.set(0, 0.96, 0);
  spine.rotation.x = 0.1;
  root.add(spine);

  addRound(spine, "Pelvis", {
    w: 0.26,
    h: 0.12,
    d: 0.18,
    y: -0.02,
    radius: 0.055,
    segments: 3,
    material: skin,
  });
  addRound(spine, "Torso", {
    w: 0.22,
    h: 0.32,
    d: 0.13,
    y: 0.2,
    z: -0.01,
    radius: 0.06,
    segments: 3,
    material: skin,
  });
  addRound(spine, "Shirt", {
    w: 0.28,
    h: 0.36,
    d: 0.17,
    y: 0.2,
    radius: 0.07,
    segments: 3,
    material: shirt,
  });
  addRound(spine, "Placket", {
    w: 0.016,
    h: 0.26,
    d: 0.01,
    y: 0.19,
    z: 0.088,
    radius: 0.005,
    segments: 2,
    material: MAT.whiteSoft,
  });

  addTorus(spine, "Collar", {
    radius: 0.048,
    tube: 0.011,
    y: 0.38,
    radial: 28,
    tubular: 12,
    material: shirt,
    shadows: true,
  });
  addRound(spine, "CollarLeaf_L", {
    w: 0.07,
    h: 0.04,
    d: 0.013,
    x: -0.038,
    y: 0.388,
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
    y: 0.388,
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
  headRig.rotation.x = 0.06;
  spine.add(headRig);
  addCylinder(headRig, "Neck", {
    radiusTop: 0.03,
    radiusBottom: 0.035,
    height: 0.065,
    y: 0.022,
    z: -0.002,
    radial: 22,
    material: skin,
  });
  addSphere(headRig, "Head", { r: 0.095, y: 0.148, z: 0.004, segments: 32, material: skin });

  addRound(spine, "TieKnot", {
    w: 0.038,
    h: 0.032,
    d: 0.028,
    y: 0.35,
    z: 0.09,
    radius: 0.01,
    segments: 2,
    material: tie,
  });
  addRound(spine, "Tie", {
    w: 0.028,
    h: 0.2,
    d: 0.014,
    y: 0.21,
    z: 0.092,
    radius: 0.008,
    segments: 2,
    material: tie,
  });
  addRound(spine, "TieTip", {
    w: 0.024,
    h: 0.036,
    d: 0.012,
    y: 0.095,
    z: 0.092,
    radius: 0.008,
    segments: 2,
    material: tie,
  });

  function addLeg(side, x, hipX, kneeX) {
    const hip = new THREE.Group();
    hip.name = `HipJoint_${side}`;
    hip.position.set(x, 0.94, 0.01);
    hip.rotation.x = hipX;
    root.add(hip);
    addSphere(hip, `Hip_${side}`, { r: 0.054, segments: 20, material: skin });
    hangLimb(hip, `UpperLeg_${side}`, { r: 0.048, length: 0.26, material: skin });

    const knee = new THREE.Group();
    knee.name = `KneeJoint_${side}`;
    knee.position.set(0, -(0.26 + 0.048 * 2), 0);
    knee.rotation.x = kneeX;
    hip.add(knee);
    addSphere(knee, `Knee_${side}`, { r: 0.05, segments: 18, material: skin });
    hangLimb(knee, `LowerLeg_${side}`, { r: 0.044, length: 0.26, material: skin });

    const ankle = new THREE.Group();
    ankle.name = `Ankle_${side}`;
    ankle.position.set(0, -(0.26 + 0.044 * 2), 0);
    ankle.rotation.x = -(hipX + kneeX) + 0.06;
    knee.add(ankle);
    addRound(ankle, `Foot_${side}`, {
      w: 0.086,
      h: 0.044,
      d: 0.17,
      y: -0.018,
      z: 0.048,
      radius: 0.02,
      segments: 2,
      material: skin,
    });
  }

  addLeg("R", 0.086, -0.7, 0.36);
  addLeg("L", -0.086, 0.58, 0.22);

  function addArm(side, x, shX, elbX, withCase) {
    const sh = new THREE.Group();
    sh.name = `ShoulderJoint_${side}`;
    sh.position.set(x, 0.34, 0.02);
    sh.rotation.x = shX;
    sh.rotation.z = side === "L" ? 0.16 : -0.16;
    spine.add(sh);
    addSphere(sh, `Shoulder_${side}`, { r: 0.046, segments: 20, material: shirt });
    hangLimb(sh, `UpperArm_${side}`, { r: 0.034, length: 0.2, material: shirt });

    const elb = new THREE.Group();
    elb.name = `ElbowJoint_${side}`;
    elb.position.set(0, -(0.2 + 0.034 * 2), 0);
    elb.rotation.x = elbX;
    elb.rotation.z = side === "L" ? -0.08 : 0.08;
    sh.add(elb);
    addSphere(elb, `Elbow_${side}`, { r: 0.032, segments: 16, material: shirt });
    hangLimb(elb, `ForeArm_${side}`, { r: 0.03, length: 0.18, material: shirt });

    const wrist = new THREE.Group();
    wrist.name = `Wrist_${side}`;
    wrist.position.set(0, -(0.18 + 0.03 * 2), 0);
    elb.add(wrist);
    addCylinder(wrist, `Cuff_${side}`, {
      radiusTop: 0.034,
      radiusBottom: 0.034,
      height: 0.028,
      radial: 18,
      y: 0.01,
      material: shirt,
    });
    const hand = addSphere(wrist, `Hand_${side}`, {
      r: 0.036,
      y: -0.032,
      segments: 18,
      material: skin,
    });
    hand.scale.set(1.05, 0.78, 1.12);

    if (!withCase) return;

    const bag = new THREE.Group();
    bag.name = "Briefcase";
    bag.position.set(0.078, -0.028, 0.012);
    bag.rotation.x = -(shX + elbX);
    bag.rotation.y = 0.12;
    bag.rotation.z = 0.06;
    wrist.add(bag);

    addRound(bag, "Case", {
      w: 0.078,
      h: 0.17,
      d: 0.24,
      y: -0.12,
      radius: 0.018,
      segments: 2,
      material: caseMat,
    });
    addRound(bag, "CaseBand", {
      w: 0.082,
      h: 0.028,
      d: 0.246,
      y: -0.12,
      radius: 0.008,
      segments: 2,
      material: accent,
    });
    addRound(bag, "Clasp", {
      w: 0.034,
      h: 0.018,
      d: 0.014,
      y: -0.12,
      z: 0.128,
      radius: 0.004,
      segments: 2,
      material: tie,
    });
    addRound(bag, "Latch_L", {
      w: 0.012,
      h: 0.02,
      d: 0.01,
      x: -0.018,
      y: -0.055,
      z: 0.122,
      radius: 0.003,
      segments: 1,
      material: MAT.gold,
    });
    addRound(bag, "Latch_R", {
      w: 0.012,
      h: 0.02,
      d: 0.01,
      x: 0.018,
      y: -0.055,
      z: 0.122,
      radius: 0.003,
      segments: 1,
      material: MAT.gold,
    });
    addCapsule(bag, "HandlePost_L", {
      r: 0.008,
      length: 0.03,
      y: -0.012,
      z: -0.04,
      material: caseMat,
    });
    addCapsule(bag, "HandlePost_R", {
      r: 0.008,
      length: 0.03,
      y: -0.012,
      z: 0.04,
      material: caseMat,
    });
    addCapsule(bag, "HandleBar", {
      r: 0.009,
      length: 0.08,
      y: 0.022,
      rx: Math.PI / 2,
      material: caseMat,
    });
  }

  addArm("L", -0.155, -0.82, 0.34, false);
  addArm("R", 0.155, 0.28, 0.18, true);

  return root;
}

const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "models", "walker.glb");
await writeGlb(buildWalker(), outPath);
