"use client";

/* eslint-disable react/no-unknown-property -- three.js intrinsic elements */

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import {
  ACESFilmicToneMapping,
  BufferGeometry,
  CanvasTexture,
  ExtrudeGeometry,
  MathUtils,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Shape,
  Vector2,
  Vector3,
  type Group,
  type PerspectiveCamera,
  type PointLight,
} from "three";
import { CanvasShell } from "../../r3f/canvas-shell";

export const CARD_COUNT = 8;
const CARD_W = 1.08;
const CARD_H = 1.72;
/** ISO ID-1 is ~0.76 mm on an 85.6 mm long edge — keep the plate credit-card thin. */
const CARD_D = 0.0065;
const CARD_CORNER = 0.085;
/** Hole inset. Visual lip ≈ CARD_RIM + 2 * RIM_BEVEL ≈ 0.0085 (25% of the old 0.034 plate). */
const CARD_RIM = 0.0045;
const RIM_BEVEL = 0.002;
const FACE_INSET = CARD_RIM + RIM_BEVEL + 0.00035;
const FAN_RADIUS = 2.12;
const FAN_LEFT = -0.98;
const FAN_RIGHT = 0.26;
const CAM = { x: 0.28, y: 0.22, z: 3.85, fov: 32 };
const LOOK = { x: 0.04, y: 0.18 };
/** Total margin when fitting the full fan into the canvas (split left/right and top/bottom). */
const FIT_PAD = 0.22;
/** Pointer NDC → key lamp. The round source sits up-left of the cursor and washes back onto the deck. */
const KEY_REACH_X = 3.55;
const KEY_REACH_Y = 2.65;
const KEY_Z = 3.2;
const KEY_FROM_POINTER = { x: -0.34, y: 0.4 };

type Pose = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const x = MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Pose A — compact left fan, front card toward camera (Spline default). */
function stackPose(u: number): Pose {
  const angle = lerp(-0.38, 0.1, u);
  const radius = 1.58;
  return {
    x: Math.sin(angle) * radius,
    y: Math.cos(angle) * radius - 1.28,
    z: u * 0.026,
    rx: 0,
    ry: 0,
    rz: -angle,
  };
}

/** Pose B — polar hand of cards; rightmost card is nearest and most upright. */
function fanPose(u: number): Pose {
  const angle = lerp(FAN_LEFT, FAN_RIGHT, u);
  return {
    x: Math.sin(angle) * FAN_RADIUS,
    y: Math.cos(angle) * FAN_RADIUS - 1.62,
    z: u * 0.038,
    rx: 0,
    ry: 0,
    rz: -angle,
  };
}

function mixPose(a: Pose, b: Pose, t: number): Pose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    rx: lerp(a.rx, b.rx, t),
    ry: lerp(a.ry, b.ry, t),
    rz: lerp(a.rz, b.rz, t),
  };
}

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

function expandWithCardCorners(pose: Pose, bounds: Bounds) {
  const hw = CARD_W / 2;
  const hh = CARD_H / 2;
  const c = Math.cos(pose.rz);
  const s = Math.sin(pose.rz);
  const lx = [-hw, hw, hw, -hw];
  const ly = [-hh, -hh, hh, hh];
  for (let i = 0; i < 4; i += 1) {
    const x = pose.x + lx[i] * c - ly[i] * s;
    const y = pose.y + lx[i] * s + ly[i] * c;
    bounds.minX = Math.min(bounds.minX, x);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxY = Math.max(bounds.maxY, y);
  }
}

/** World AABB of the deck at a pose blend — used so the open fan stays inside the canvas. */
function deckBounds(progress: number): Bounds {
  const bounds: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (let i = 0; i < CARD_COUNT; i += 1) {
    const u = CARD_COUNT === 1 ? 1 : i / (CARD_COUNT - 1);
    expandWithCardCorners(mixPose(stackPose(u), fanPose(u), progress), bounds);
  }
  return bounds;
}

function drawHex(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI / 6 + i * (Math.PI / 3);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function makeFaceTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1632;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#071529";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grain = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = grain.data;
  for (let i = 0; i < data.length; i += 16) {
    const n = (Math.random() * 18) | 0;
    data[i] = Math.min(255, data[i] + n);
    data[i + 1] = Math.min(255, data[i + 1] + n);
    data[i + 2] = Math.min(255, data[i + 2] + n);
  }
  ctx.putImageData(grain, 0, 0);

  const wash = ctx.createLinearGradient(80, 40, 980, 1580);
  wash.addColorStop(0, "rgba(232, 244, 251, 0.07)");
  wash.addColorStop(0.42, "rgba(95, 199, 236, 0.04)");
  wash.addColorStop(1, "rgba(3, 23, 51, 0.28)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#5fc7ec";
  drawHex(ctx, 512, 300, 88);
  ctx.fillStyle = "#ffbd24";
  drawHex(ctx, 512, 300, 42);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e8f4fb";
  ctx.font = "650 62px 'Spline Sans', system-ui, sans-serif";
  ctx.fillText("digital team.", 512, 1396);
  ctx.fillStyle = "#5fc7ec";
  ctx.font = "600 34px 'Spline Sans', system-ui, sans-serif";
  ctx.fillText("dcmvn", 512, 1456);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function cardUVGenerator(width: number, height: number) {
  const hw = width / 2;
  const hh = height / 2;
  const toUv = (x: number, y: number) => new Vector2((x + hw) / width, (y + hh) / height);
  return {
    generateTopUV(_geometry: BufferGeometry, vertices: number[], a: number, b: number, c: number) {
      return [
        toUv(vertices[a * 3], vertices[a * 3 + 1]),
        toUv(vertices[b * 3], vertices[b * 3 + 1]),
        toUv(vertices[c * 3], vertices[c * 3 + 1]),
      ];
    },
    generateSideWallUV(_geometry: BufferGeometry, vertices: number[], a: number, b: number, c: number, d: number) {
      void vertices;
      void a;
      void b;
      void c;
      void d;
      return [new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1)];
    },
  };
}

function makeRoundedRectShape(width: number, height: number, corner: number, clockwise = false) {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(corner, hw - 0.001, hh - 0.001);
  const shape = new Shape();
  if (!clockwise) {
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(hw, hh - r);
    shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-hw + r, hh);
    shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw, -hh + r);
    shape.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false);
  } else {
    shape.moveTo(hw - r, -hh);
    shape.lineTo(-hw + r, -hh);
    shape.absarc(-hw + r, -hh + r, r, -Math.PI / 2, Math.PI, true);
    shape.lineTo(-hw, hh - r);
    shape.absarc(-hw + r, hh - r, r, Math.PI, Math.PI / 2, true);
    shape.lineTo(hw - r, hh);
    shape.absarc(hw - r, hh - r, r, Math.PI / 2, 0, true);
    shape.lineTo(hw, -hh + r);
    shape.absarc(hw - r, -hh + r, r, 0, -Math.PI / 2, true);
  }
  return shape;
}

function makeCardGeometry(width: number, height: number, depth: number, corner: number) {
  const shape = makeRoundedRectShape(width, height, corner);
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 24,
    steps: 1,
    UVGenerator: cardUVGenerator(width, height),
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** Black metal bezel: outer plate minus the face window, with a micro-chamfer so the lip catches the key. */
function makeFrameGeometry(width: number, height: number, depth: number, corner: number, rim: number) {
  const outer = makeRoundedRectShape(width, height, corner);
  const innerW = width - rim * 2;
  const innerH = height - rim * 2;
  const innerR = Math.max(0.012, corner - rim);
  outer.holes.push(makeRoundedRectShape(innerW, innerH, innerR, true));

  const geometry = new ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.0016,
    bevelSize: RIM_BEVEL,
    bevelOffset: 0,
    bevelSegments: 3,
    curveSegments: 24,
    steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function pointerKeyPosition(pointerX: number, pointerY: number) {
  return {
    x: LOOK.x + (pointerX + KEY_FROM_POINTER.x) * KEY_REACH_X,
    y: LOOK.y + (pointerY + KEY_FROM_POINTER.y) * KEY_REACH_Y,
    z: KEY_Z,
  };
}

function StudioRig() {
  const keyRig = useRef<Group>(null);
  const keyLight = useRef<PointLight>(null);

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05);
    const next = pointerKeyPosition(state.pointer.x, state.pointer.y);

    const rig = keyRig.current;
    if (rig) {
      rig.position.x = MathUtils.damp(rig.position.x, next.x, 5.2, step);
      rig.position.y = MathUtils.damp(rig.position.y, next.y, 5.2, step);
      rig.position.z = MathUtils.damp(rig.position.z, next.z, 5.2, step);
    }

    const light = keyLight.current;
    if (light) {
      light.position.x = MathUtils.damp(light.position.x, next.x, 5.2, step);
      light.position.y = MathUtils.damp(light.position.y, next.y, 5.2, step);
      light.position.z = MathUtils.damp(light.position.z, next.z, 5.2, step);
    }
  });

  const rest = pointerKeyPosition(0, 0);

  return (
    <>
      <color attach="background" args={["#070b12"]} />
      <Environment frames={Infinity} resolution={128} environmentIntensity={0.85}>
        <group ref={keyRig} position={[rest.x, rest.y, rest.z]}>
          <Lightformer
            form="circle"
            intensity={5.5}
            color="#fff8ee"
            position={[0, 0, 0]}
            scale={2.35}
            target={[LOOK.x, LOOK.y, 0]}
          />
        </group>
        <Lightformer form="rect" intensity={0.7} color="#d7e7f2" position={[-2.4, 1.6, 2.4]} scale={[1.4, 4.2, 1]} />
        <Lightformer form="rect" intensity={0.28} color="#8fa3b8" position={[0, -2.2, 1.6]} scale={[6, 1.6, 1]} />
      </Environment>
      <ambientLight intensity={0.14} />
      <pointLight
        ref={keyLight}
        position={[rest.x, rest.y, rest.z]}
        intensity={11}
        distance={16}
        decay={1.2}
        color="#fff6ea"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.028}
        shadow-radius={8}
        shadow-blurSamples={12}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
      />
      <directionalLight position={[-2.2, 1.4, 2.0]} intensity={0.14} color="#8eb8cc" />
    </>
  );
}

function ToneMap() {
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.04;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = PCFSoftShadowMap;
  }, [gl]);
  return null;
}

/** Match Spline: camera above and to the right so the cyan top/left lip is visible. */
function CameraAim() {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.position.set(CAM.x, CAM.y, CAM.z);
    camera.lookAt(LOOK.x, LOOK.y, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function TeamCard({
  texture,
  rimGeometry,
  faceGeometry,
}: {
  texture: CanvasTexture | null;
  rimGeometry: BufferGeometry;
  faceGeometry: BufferGeometry;
}) {
  return (
    <group>
      <mesh geometry={rimGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#242830"
          metalness={0.92}
          roughness={0.14}
          ior={1.8}
          clearcoat={0.85}
          clearcoatRoughness={0.12}
          envMapIntensity={1.45}
          specularIntensity={0.85}
        />
      </mesh>
      <mesh geometry={faceGeometry} position={[0, 0, -0.00115]} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={texture ?? undefined}
          color={texture ? "#ffffff" : "#071529"}
          metalness={0.42}
          roughness={0.32}
          clearcoat={0.7}
          clearcoatRoughness={0.18}
          envMapIntensity={0.85}
          specularIntensity={0.7}
        />
      </mesh>
    </group>
  );
}

function CardFan({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const tilt = useRef<Group>(null);
  const fitted = useRef<Group>(null);
  const cards = useRef<(Group | null)[]>([]);
  const shown = useRef(0);
  const lookTarget = useMemo(() => new Vector3(LOOK.x, LOOK.y, 0), []);
  const openBounds = useMemo(() => deckBounds(1), []);

  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    return makeFaceTexture();
  }, []);

  const rimGeometry = useMemo(
    () => makeFrameGeometry(CARD_W, CARD_H, CARD_D, CARD_CORNER, CARD_RIM),
    // Rebuild when the lip math changes (HMR otherwise keeps the old ExtrudeGeometry).
    [CARD_RIM, RIM_BEVEL],
  );
  const faceGeometry = useMemo(
    () =>
      makeCardGeometry(
        CARD_W - FACE_INSET * 2,
        CARD_H - FACE_INSET * 2,
        CARD_D * 0.72,
        Math.max(0.012, CARD_CORNER - FACE_INSET),
      ),
    [FACE_INSET],
  );

  useEffect(() => {
    return () => {
      texture?.dispose();
      rimGeometry.dispose();
      faceGeometry.dispose();
    };
  }, [texture, rimGeometry, faceGeometry]);

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05);
    shown.current = MathUtils.damp(shown.current, progressRef.current, 8.5, step);
    const t = smoothstep(shown.current);

    const tiltGroup = tilt.current;
    if (tiltGroup) {
      tiltGroup.rotation.y = MathUtils.damp(tiltGroup.rotation.y, state.pointer.x * 0.035, 4.5, step);
      tiltGroup.rotation.x = MathUtils.damp(tiltGroup.rotation.x, -state.pointer.y * 0.025, 4.5, step);
    }

    const fitGroup = fitted.current;
    if (fitGroup) {
      const camera = state.camera as PerspectiveCamera;
      const vp = state.viewport.getCurrentViewport(camera, lookTarget);
      const spanX = Math.max(0.001, openBounds.maxX - openBounds.minX);
      const spanY = Math.max(0.001, openBounds.maxY - openBounds.minY);
      const scale = Math.min((vp.width * (1 - FIT_PAD)) / spanX, (vp.height * (1 - FIT_PAD)) / spanY);
      const cx = (openBounds.minX + openBounds.maxX) / 2;
      const cy = (openBounds.minY + openBounds.maxY) / 2;
      fitGroup.scale.setScalar(scale);
      fitGroup.position.set(-cx * scale, -cy * scale, 0);
    }

    for (let i = 0; i < CARD_COUNT; i += 1) {
      const node = cards.current[i];
      if (!node) continue;
      const u = CARD_COUNT === 1 ? 1 : i / (CARD_COUNT - 1);
      const pose = mixPose(stackPose(u), fanPose(u), t);
      node.position.set(pose.x, pose.y, pose.z);
      node.rotation.set(pose.rx, pose.ry, pose.rz);
    }
  });

  return (
    <group ref={tilt} position={[LOOK.x, LOOK.y, 0]}>
      <group ref={fitted}>
        {Array.from({ length: CARD_COUNT }, (_, index) => (
          <group
            key={index}
            ref={(node) => {
              cards.current[index] = node;
            }}
          >
            <TeamCard texture={texture} rimGeometry={rimGeometry} faceGeometry={faceGeometry} />
          </group>
        ))}
      </group>
    </group>
  );
}

export function CardsCanvas({
  progressRef,
  fallbackLabel,
  sceneLabel,
}: {
  progressRef: MutableRefObject<number>;
  fallbackLabel: string;
  sceneLabel: string;
}) {
  const fallback = (
    <div className="cards-fallback">
      <div className="cards-fallback-fan" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <p>{fallbackLabel}</p>
    </div>
  );

  return (
    <CanvasShell
      className="cards-canvas"
      fallback={fallback}
      eager
      clearColor={0x070b12}
      camera={{ position: [CAM.x, CAM.y, CAM.z], fov: CAM.fov }}
      shadows
      dpr={[1, 2]}
      role="img"
      aria-label={sceneLabel}
    >
      <ToneMap />
      <CameraAim />
      <StudioRig />
      <CardFan progressRef={progressRef} />
    </CanvasShell>
  );
}
