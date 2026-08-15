"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, type RefObject } from "react";
import type { Object3D } from "three";
import type { IdleClip } from "./kit";

type Pose = {
  obj: Object3D;
  rx: number;
  ry: number;
  rz: number;
  px: number;
  py: number;
  pz: number;
};

type Rig = {
  hipL?: Pose;
  hipR?: Pose;
  kneeL?: Pose;
  kneeR?: Pose;
  ankleL?: Pose;
  ankleR?: Pose;
  shL?: Pose;
  shR?: Pose;
  elbL?: Pose;
  elbR?: Pose;
  wristL?: Pose;
  wristR?: Pose;
  spine?: Pose;
  chest?: Pose;
  head?: Pose;
  fingers: Pose[];
  lid?: Pose;
  glow?: Pose;
  briefcase?: Pose;
  tablet?: Pose;
  pocket?: Pose;
  floaters: Pose[];
  leaves: Pose[];
  swivel?: Pose;
  lift?: Pose;
  tilt?: Pose;
  casters: Pose[];
  wheels: Pose[];
};

function poseOf(obj: Object3D): Pose {
  return {
    obj,
    rx: obj.rotation.x,
    ry: obj.rotation.y,
    rz: obj.rotation.z,
    px: obj.position.x,
    py: obj.position.y,
    pz: obj.position.z,
  };
}

function pick(named: Map<string, Object3D>, ...names: string[]) {
  for (const name of names) {
    const obj = named.get(name);
    if (obj) return poseOf(obj);
  }
}

function rotX(node: Pose | undefined, delta: number) {
  if (!node) return;
  node.obj.rotation.x = node.rx + delta;
}

function rotY(node: Pose | undefined, delta: number) {
  if (!node) return;
  node.obj.rotation.y = node.ry + delta;
}

function rotZ(node: Pose | undefined, delta: number) {
  if (!node) return;
  node.obj.rotation.z = node.rz + delta;
}

function posY(node: Pose | undefined, delta: number) {
  if (!node) return;
  node.obj.position.y = node.py + delta;
}

function indexRig(root: Object3D): Rig {
  const named = new Map<string, Object3D>();
  const floaters: Pose[] = [];
  const leaves: Pose[] = [];
  const fingers: Pose[] = [];
  const casters: Pose[] = [];
  const wheels: Pose[] = [];

  root.traverse((obj) => {
    if (!obj.name) return;
    named.set(obj.name, obj);
    if (/^(HoloPanel|HoloGlobe|HoloScan|HoloBeacon|HoloBeam|HoloTower|HoloCube|HoloBridge|HoloOrbit|DisplayTower|DisplayBeacon|ArchTower|ArchWindow|ArchWing|ArchPodium)/.test(obj.name)) {
      floaters.push(poseOf(obj));
    }
    if (obj.name.startsWith("PlantLeaf_")) leaves.push(poseOf(obj));
    if (obj.name.startsWith("FingerJoint_") || obj.name.startsWith("ThumbJoint_")) fingers.push(poseOf(obj));
    if (/^Caster_\d+$/.test(obj.name)) casters.push(poseOf(obj));
    if (/^Wheel_/.test(obj.name)) wheels.push(poseOf(obj));
  });

  return {
    hipL: pick(named, "HipJoint_L", "Hip_L"),
    hipR: pick(named, "HipJoint_R", "Hip_R"),
    kneeL: pick(named, "KneeJoint_L"),
    kneeR: pick(named, "KneeJoint_R"),
    ankleL: pick(named, "Ankle_L"),
    ankleR: pick(named, "Ankle_R"),
    shL: pick(named, "ShoulderJoint_L", "Shoulder_L"),
    shR: pick(named, "ShoulderJoint_R", "Shoulder_R"),
    elbL: pick(named, "ElbowJoint_L", "Elbow_L"),
    elbR: pick(named, "ElbowJoint_R", "Elbow_R"),
    wristL: pick(named, "Wrist_L"),
    wristR: pick(named, "Wrist_R"),
    spine: pick(named, "Spine"),
    chest: pick(named, "Chest"),
    head: pick(named, "HeadRig", "Head"),
    fingers,
    lid: pick(named, "Lid"),
    glow: pick(named, "GlowRing"),
    briefcase: pick(named, "Briefcase"),
    tablet: pick(named, "Tablet"),
    pocket: pick(named, "Pocket_L", "Pocket_R"),
    floaters,
    leaves,
    swivel: pick(named, "Swivel"),
    lift: pick(named, "Lift"),
    tilt: pick(named, "Tilt"),
    casters,
    wheels,
  };
}

function isSeated(hip: Pose | undefined) {
  return !!hip && Math.abs(hip.rx) > 1.15;
}

export function ModelIdle({
  root,
  seed = 0,
  active = true,
  clip = "auto",
  bobRef,
}: {
  root: Object3D;
  seed?: number;
  active?: boolean;
  clip?: IdleClip;
  bobRef?: RefObject<Object3D | null>;
}) {
  const rig = useMemo(() => indexRig(root), [root]);
  const bobRestY = useMemo(() => ({ current: null as number | null }), [root]);

  useFrame(({ clock }, delta) => {
    if (!active || clip === "none") return;
    const t = clock.elapsedTime + seed;
    const seated = isSeated(rig.hipL);
    const canWalk = !!(rig.hipL && rig.hipR && !seated);
    const canType = !!(rig.elbL || rig.elbR);
    const doWalk = clip === "walk" || (clip === "auto" && canWalk);
    const doType = clip === "type" || (clip === "auto" && canType && !doWalk);
    const doIdle = clip === "idle" || (clip === "auto" && !doWalk && !doType && !!rig.spine);
    const doSwivel = clip === "swivel" || (clip === "auto" && !!rig.swivel && !doWalk && !doType);
    const doLid = clip === "auto" || clip === "lid";
    const doGlow = clip === "auto" || clip === "glow";
    const doFloat = clip === "auto" || clip === "float" || clip === "sway";
    const doSway = clip === "auto" || clip === "sway";
    const breathe = Math.sin(t * 1.65) * (doWalk ? 0.006 : 0.014);

    if (rig.spine && (doWalk || doType || doIdle)) {
      rotX(rig.spine, breathe);
      posY(rig.chest, Math.sin(t * 1.65) * 0.004);
      rotX(rig.head, Math.sin(t * 1.65 + 0.35) * 0.012 + Math.sin(t * 0.35) * 0.018);
      rotY(rig.head, Math.sin(t * 0.28) * 0.04);
    }

    if (doWalk) {
      const gait = t * 5.15;
      const left = Math.sin(gait);
      const right = Math.sin(gait + Math.PI);
      const bigWalk = !!rig.tablet && !!rig.pocket;
      const stride = rig.kneeL && rig.kneeR ? (bigWalk ? 0.78 : 0.42) : 0.14;
      const lift = rig.kneeL && rig.kneeR ? (bigWalk ? 0.92 : 0.55) : 0;
      const hipL = left * stride;
      const hipR = right * stride;
      const kneeL = Math.max(0, -left) * lift;
      const kneeR = Math.max(0, -right) * lift;
      const carry = !!rig.briefcase && !bigWalk;
      const pocket = !!rig.pocket && !bigWalk;
      const arm = bigWalk ? 0.72 : 0.38;
      rotX(rig.hipL, hipL);
      rotX(rig.hipR, hipR);
      rotY(rig.hipL, left * (bigWalk ? 0.12 : 0.06));
      rotY(rig.hipR, right * (bigWalk ? 0.12 : 0.06));
      rotX(rig.kneeL, kneeL);
      rotX(rig.kneeR, kneeR);
      rotX(rig.ankleL, -(hipL + kneeL) * 0.85 + Math.max(0, left) * (bigWalk ? 0.2 : 0.12));
      rotX(rig.ankleR, -(hipR + kneeR) * 0.85 + Math.max(0, right) * (bigWalk ? 0.2 : 0.12));
      rotX(rig.shL, right * (pocket ? 0.08 : arm));
      rotX(rig.shR, left * (carry ? 0.08 : arm));
      rotX(rig.elbL, (bigWalk ? 0.18 : 0.1) + Math.max(0, right) * (pocket ? 0.05 : bigWalk ? 0.42 : 0.22));
      rotX(rig.elbR, (carry ? 0.16 : bigWalk ? 0.18 : 0.12) + Math.max(0, left) * (carry ? 0.05 : bigWalk ? 0.42 : 0.22));
      rotY(rig.spine, left * (bigWalk ? 0.16 : 0.09));
      rotZ(rig.spine, left * (bigWalk ? 0.055 : 0.03));
      rotY(rig.head, -left * (bigWalk ? 0.1 : 0.06));
      const bob = bobRef?.current;
      if (bob) {
        if (bobRestY.current === null) bobRestY.current = bob.position.y;
        bob.position.y = bobRestY.current + Math.abs(left) * (bigWalk ? 0.04 : 0.022);
      }
    } else if (doType) {
      const tap = t * 8.6;
      rotX(rig.elbL, Math.sin(tap) * 0.012);
      rotX(rig.elbR, Math.sin(tap + 1.15) * 0.014);
      rotX(rig.wristL, Math.sin(tap + 0.3) * 0.022);
      rotX(rig.wristR, Math.sin(tap + 1.45) * 0.024);
      rig.fingers.forEach((finger, i) => {
        rotX(finger, Math.sin(tap * 1.15 + i * 0.7) * (0.06 + (i % 3) * 0.03));
      });
    } else if (doIdle) {
      rotX(rig.shL, Math.sin(t * 0.9) * 0.02);
      rotX(rig.shR, Math.sin(t * 0.9 + 0.8) * 0.02);
      rotX(rig.elbL, Math.sin(t * 1.05) * 0.015);
      rotX(rig.elbR, Math.sin(t * 1.05 + 0.6) * 0.015);
      rotY(rig.spine, Math.sin(t * 0.45) * 0.025);
      const bob = bobRef?.current;
      if (bob) {
        if (bobRestY.current === null) bobRestY.current = bob.position.y;
        bob.position.y = bobRestY.current + Math.sin(t * 1.65) * 0.004;
      }
    }

    if (doLid) rotX(rig.lid, Math.sin(t * 0.65) * 0.045);
    if (doGlow && rig.glow) rig.glow.obj.rotation.y += delta * 0.85;
    if (doFloat) {
      rig.floaters.forEach((node, i) => {
        posY(node, Math.sin(t * 1.55 + i * 0.7) * 0.008);
      });
      const bob = bobRef?.current;
      if (bob) {
        if (bobRestY.current === null) bobRestY.current = bob.position.y;
        bob.position.y = bobRestY.current + Math.sin(t * 0.9) * 0.018;
      }
    }
    if (doSway) {
      rig.leaves.forEach((node, i) => {
        rotZ(node, Math.sin(t * 1.35 + i * 0.55) * 0.1);
      });
    }
    if (doSwivel) {
      rotY(rig.swivel, Math.sin(t * 0.38) * 0.85);
      posY(rig.lift, Math.sin(t * 0.72) * 0.02);
      rotX(rig.tilt, Math.sin(t * 0.55) * 0.045);
      rig.casters.forEach((node, i) => {
        rotY(node, t * 0.95 + i * 0.7);
      });
      rig.wheels.forEach((node) => {
        node.obj.rotation.x += delta * 2.6;
      });
    }
  });

  return null;
}

export function idleSeed(id: string, index = 0) {
  let hash = index * 17;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 3)) % 997;
  return hash * 0.031;
}
