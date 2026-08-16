"use client";

/* eslint-disable react/no-unknown-property -- three.js intrinsic elements */

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";
import {
  AdditiveBlending,
  Box3,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  FrontSide,
  MathUtils,
  Mesh,
  NoColorSpace,
  Vector3,
  type Group,
  type Points,
} from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CanvasShell } from "../../r3f/canvas-shell";
import { KIT } from "../kit";

const CAM = { x: 5.4, y: 0.48, z: 2.2, fov: 32 };
const LOOK = { x: 0, y: -0.08, z: 0 };
const CAM_DIR = new Vector3(2.45, 0.22, 0.98).normalize();
const CAM_UP = new Vector3(0, 1, 0);
/** object-fit: contain — AABB sphere, plus haze / bloom / pointer tilt. */
const CAM_PAD = 1.72;
/** Shift look-at along camera-right so the 3/4 silhouette sits in the stage. */
const FRAME_RIGHT = 0.26;
const BRAIN_SPAN = 1.42;
const _fitSize = new Vector3();
const _fitCenter = new Vector3();
const _fitTarget = new Vector3();
const _fitRight = new Vector3();
const SURFACE_COUNT = 9800;
const HAZE_COUNT = 2100;
const RING_COUNT = 520;
const ORBIT_COUNT = 640;
const TRAIL_COUNT = 2600;
const DIGIT_COUNT = 160;

const WHITE = new Color("#f4f7fb");
const COOL = new Color("#c5d3e4");
const CYAN = new Color("#5fc7ec");

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function tintFor(i: number, color: Color, dim: number) {
  const roll = hash(i * 9.1);
  if (roll > 0.93) color.copy(CYAN);
  else if (roll > 0.52) color.copy(COOL);
  else color.copy(WHITE);
  color.multiplyScalar(dim);
}

function makeGlowSprite() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.16, "rgba(255,255,255,0.82)");
  g.addColorStop(0.38, "rgba(255,255,255,0.28)");
  g.addColorStop(0.62, "rgba(255,255,255,0.07)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function makeRingSprite() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(32, 32, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(32, 32, 18, 0, Math.PI * 2);
  ctx.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function makeGlyphSprite(glyph: string) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 34px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, 32, 34);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function collectGeometries(root: Group) {
  const geos: BufferGeometry[] = [];
  root.updateMatrixWorld(true);
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.geometry) return;
    const cloned = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    cloned.applyMatrix4(node.matrixWorld);
    geos.push(cloned);
  });
  return geos;
}

function fitBrainGeometry(root: Group) {
  const parts = collectGeometries(root);
  if (parts.length === 0) return null;
  const merged = parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
  if (!merged) return null;
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  const box = merged.boundingBox ?? new Box3().setFromBufferAttribute(merged.getAttribute("position") as BufferAttribute);
  const center = new Vector3();
  const size = new Vector3();
  box.getCenter(center);
  box.getSize(size);
  const span = Math.max(size.x, size.y, size.z, 0.001);
  const scale = BRAIN_SPAN / span;
  merged.translate(-center.x, -center.y, -center.z);
  merged.scale(scale, scale, scale);
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

type CloudKind = "surface" | "haze" | "ring" | "trail" | "digit";

function makeSampledCloud(sampler: MeshSurfaceSampler, count: number, kind: CloudKind) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const amps = new Float32Array(count);
  const pos = new Vector3();
  const nrm = new Vector3();
  const color = new Color();

  for (let i = 0; i < count; i += 1) {
    sampler.sample(pos, nrm);
    nrm.normalize();
    const lift =
      kind === "surface"
        ? 0.008 + hash(i + 3) * 0.028
        : kind === "haze"
          ? 0.06 + hash(i + 9) * 0.42
          : kind === "ring"
            ? 0.04 + hash(i + 15) * 0.18
            : kind === "trail"
              ? 0.04 + hash(i + 21) * 0.62
              : 0.03 + hash(i + 27) * 0.28;
    pos.addScaledVector(nrm, lift);
    if (kind === "trail") {
      const t = hash(i + 40);
      const swirl = 0.35 + t * 0.85;
      const a = t * Math.PI * 2;
      pos.x += Math.cos(a) * swirl * 0.22;
      pos.y += (hash(i + 44) - 0.5) * 0.28;
      pos.z -= t * 0.95;
    }
    const i3 = i * 3;
    positions[i3] = pos.x;
    positions[i3 + 1] = pos.y;
    positions[i3 + 2] = pos.z;
    const dim =
      kind === "haze" ? 0.22 + hash(i) * 0.26 : kind === "trail" ? 0.32 + hash(i) * 0.42 : 0.52 + hash(i) * 0.48;
    tintFor(i, color, dim);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
    phases[i] = hash(i + 70) * Math.PI * 2;
    amps[i] = kind === "surface" ? 0.006 : kind === "haze" ? 0.045 : kind === "trail" ? 0.07 : 0.018;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.userData.rest = positions.slice();
  geometry.userData.phases = phases;
  geometry.userData.amps = amps;
  geometry.userData.kind = kind;
  return geometry;
}

function makeOrbitCloud(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const amps = new Float32Array(count);
  const color = new Color();
  const rings = [
    { rx: 0.92, ry: 0.38, rz: 0.72, tilt: 0.42, roll: 0.18 },
    { rx: 0.78, ry: 0.58, rz: 0.88, tilt: -0.55, roll: 0.4 },
    { rx: 1.08, ry: 0.22, rz: 0.52, tilt: 1.05, roll: -0.28 },
  ];

  for (let i = 0; i < count; i += 1) {
    const ring = rings[i % rings.length];
    const theta = (i / count) * Math.PI * 2 * 3 + hash(i) * 0.4;
    let x = Math.cos(theta) * ring.rx;
    let y = Math.sin(theta * 0.15) * ring.ry * 0.35;
    let z = Math.sin(theta) * ring.rz;
    const cy = Math.cos(ring.tilt);
    const sy = Math.sin(ring.tilt);
    const y2 = y * cy - z * sy;
    const z2 = y * sy + z * cy;
    y = y2;
    z = z2;
    const cz = Math.cos(ring.roll);
    const sz = Math.sin(ring.roll);
    const x2 = x * cz - y * sz;
    const y3 = x * sz + y * cz;
    x = x2;
    y = y3;
    const i3 = i * 3;
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
    tintFor(i, color, 0.42 + hash(i + 3) * 0.4);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
    phases[i] = theta;
    amps[i] = 0.012;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.userData.rest = positions.slice();
  geometry.userData.phases = phases;
  geometry.userData.amps = amps;
  geometry.userData.kind = "orbit";
  return geometry;
}

const CORTEX_VERT = /* glsl */ `
  varying vec3 vView;
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vW = world.xyz;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const CORTEX_FRAG = /* glsl */ `
  varying vec3 vView;
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    if (!gl_FrontFacing) {
      gl_FragColor = vec4(0.008, 0.010, 0.014, 1.0);
      return;
    }
    vec3 n = normalize(vN);
    float ndv = max(dot(n, normalize(vView)), 0.0);
    float fres = pow(1.0 - ndv, 2.4);
    float crease = pow(1.0 - ndv, 5.0);
    float top = pow(max(n.y * 0.55 + 0.45, 0.0), 1.8);
    vec3 base = vec3(0.012, 0.015, 0.022);
    vec3 rim = vec3(0.90, 0.95, 1.0);
    vec3 col = base + rim * fres * 0.92 + rim * crease * 0.16 + vec3(0.08, 0.10, 0.14) * top * 0.28;
    float spec = pow(max(dot(n, normalize(vec3(0.42, 0.78, 0.32))), 0.0), 34.0);
    col += vec3(0.50, 0.58, 0.68) * spec * 0.12;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function SpriteCloud({
  geometry,
  map,
  size,
  speed,
  swirl,
}: {
  geometry: BufferGeometry;
  map: CanvasTexture | null;
  size: number;
  speed: number;
  swirl: number;
}) {
  const points = useRef<Points>(null);

  useFrame((state) => {
    const attr = points.current?.geometry.getAttribute("position");
    const rest = geometry.userData.rest as Float32Array | undefined;
    const phases = geometry.userData.phases as Float32Array | undefined;
    const amps = geometry.userData.amps as Float32Array | undefined;
    const kind = geometry.userData.kind as string | undefined;
    if (!attr || !rest || !phases || !amps) return;
    const t = state.clock.elapsedTime;
    const array = attr.array as Float32Array;
    for (let i = 0; i < phases.length; i += 1) {
      const i3 = i * 3;
      const phase = phases[i];
      const breathe = 1 + Math.sin(t * speed + phase) * amps[i];
      let x = rest[i3] * breathe;
      let y = rest[i3 + 1] * breathe;
      let z = rest[i3 + 2] * breathe;
      if (kind === "orbit") {
        const a = t * swirl + phase;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const nx = x * c - z * s;
        const nz = x * s + z * c;
        x = nx;
        z = nz;
      } else if (swirl !== 0) {
        const a = t * swirl + phase * 0.15;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const nx = x * c - z * s;
        const nz = x * s + z * c;
        x = nx;
        z = nz;
      }
      if (kind === "trail") {
        const flow = (t * 0.14 + phase) % 1.35;
        x += Math.sin(flow * 6.2 + phase) * 0.04;
        y += Math.cos(flow * 4.1 + phase) * 0.03;
        z -= flow * 0.85;
      }
      array[i3] = x;
      array[i3 + 1] = y;
      array[i3 + 2] = z;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={map ?? undefined}
        vertexColors
        transparent
        depthTest
        depthWrite={false}
        blending={AdditiveBlending}
        size={size}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

function ParticleRig() {
  const tilt = useRef<Group>(null);
  const { scene } = useGLTF(KIT.ParticleBrain.src);

  const brain = useMemo(() => fitBrainGeometry(scene), [scene]);
  const sampler = useMemo(() => {
    if (!brain) return null;
    const dummy = new Mesh(brain);
    dummy.updateMatrixWorld(true);
    return new MeshSurfaceSampler(dummy).build();
  }, [brain]);

  const surface = useMemo(
    () => (sampler ? makeSampledCloud(sampler, SURFACE_COUNT, "surface") : null),
    [sampler],
  );
  const haze = useMemo(() => (sampler ? makeSampledCloud(sampler, HAZE_COUNT, "haze") : null), [sampler]);
  const rings = useMemo(() => (sampler ? makeSampledCloud(sampler, RING_COUNT, "ring") : null), [sampler]);
  const orbits = useMemo(() => makeOrbitCloud(ORBIT_COUNT), []);
  const trails = useMemo(() => (sampler ? makeSampledCloud(sampler, TRAIL_COUNT, "trail") : null), [sampler]);
  const zeros = useMemo(() => (sampler ? makeSampledCloud(sampler, DIGIT_COUNT, "digit") : null), [sampler]);
  const ones = useMemo(
    () => (sampler ? makeSampledCloud(sampler, DIGIT_COUNT, "digit") : null),
    [sampler],
  );

  const glow = useMemo(() => (typeof document === "undefined" ? null : makeGlowSprite()), []);
  const ring = useMemo(() => (typeof document === "undefined" ? null : makeRingSprite()), []);
  const glyph0 = useMemo(() => (typeof document === "undefined" ? null : makeGlyphSprite("0")), []);
  const glyph1 = useMemo(() => (typeof document === "undefined" ? null : makeGlyphSprite("1")), []);

  useEffect(() => {
    return () => {
      brain?.dispose();
      surface?.dispose();
      haze?.dispose();
      rings?.dispose();
      orbits.dispose();
      trails?.dispose();
      zeros?.dispose();
      ones?.dispose();
      glow?.dispose();
      ring?.dispose();
      glyph0?.dispose();
      glyph1?.dispose();
    };
  }, [brain, surface, haze, rings, orbits, trails, zeros, ones, glow, ring, glyph0, glyph1]);

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05);
    const group = tilt.current;
    if (!group) return;
    group.rotation.y = MathUtils.damp(group.rotation.y, state.pointer.x * 0.1, 3.2, step);
    group.rotation.x = MathUtils.damp(group.rotation.x, -state.pointer.y * 0.06, 3.2, step);
  });

  if (!brain || !surface || !haze || !rings || !trails || !zeros || !ones) return null;

  return (
    <>
      <FrameBrain geometry={brain} />
      <group ref={tilt} position={[LOOK.x, LOOK.y, LOOK.z]}>
        <mesh geometry={brain}>
          <shaderMaterial vertexShader={CORTEX_VERT} fragmentShader={CORTEX_FRAG} side={FrontSide} />
        </mesh>
        <SpriteCloud geometry={surface} map={glow} size={0.022} speed={0.5} swirl={0} />
        <SpriteCloud geometry={haze} map={glow} size={0.068} speed={0.28} swirl={0.06} />
        <SpriteCloud geometry={rings} map={ring} size={0.042} speed={0.2} swirl={0.03} />
        <SpriteCloud geometry={orbits} map={glow} size={0.026} speed={0.12} swirl={0.22} />
        <SpriteCloud geometry={trails} map={glow} size={0.028} speed={0.38} swirl={0.08} />
        <SpriteCloud geometry={zeros} map={glyph0} size={0.052} speed={0.16} swirl={0.04} />
        <SpriteCloud geometry={ones} map={glyph1} size={0.052} speed={0.16} swirl={0.04} />
      </group>
    </>
  );
}

function FrameBrain({ geometry }: { geometry: BufferGeometry }) {
  useFrame((state) => {
    const cam = state.camera as PerspectiveCamera;
    if (!("isPerspectiveCamera" in cam) || !cam.isPerspectiveCamera) return;
    const { width, height } = state.size;
    if (width < 1 || height < 1) return;

    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;

    box.getSize(_fitSize);
    box.getCenter(_fitCenter);
    _fitRight.crossVectors(CAM_UP, CAM_DIR).normalize();
    _fitTarget
      .set(LOOK.x, LOOK.y, LOOK.z)
      .add(_fitCenter)
      .addScaledVector(_fitRight, FRAME_RIGHT);

    const radius = Math.max(_fitSize.length() * 0.5, 0.45);
    cam.fov = CAM.fov;
    cam.aspect = width / height;
    const vFov = (cam.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    const padded = radius * CAM_PAD;
    const dist = padded / Math.min(Math.sin(vFov / 2), Math.sin(hFov / 2));

    cam.position.copy(CAM_DIR).multiplyScalar(dist).add(_fitTarget);
    cam.near = Math.max(0.05, dist * 0.08);
    cam.far = dist * 8;
    cam.lookAt(_fitTarget);
    cam.updateProjectionMatrix();
  });

  return null;
}

export function ParticlesCanvas({
  fallbackLabel,
  sceneLabel,
}: {
  fallbackLabel: string;
  sceneLabel: string;
}) {
  const fallback = (
    <div className="particles-fallback">
      <div className="particles-fallback-cloud" aria-hidden="true" />
      <p>{fallbackLabel}</p>
    </div>
  );

  return (
    <CanvasShell
      className="particles-canvas"
      fallback={fallback}
      eager
      clearColor={0x070b12}
      camera={{ position: [CAM.x, CAM.y, CAM.z], fov: CAM.fov }}
      dpr={[1, 2]}
      role="img"
      aria-label={sceneLabel}
    >
      <color attach="background" args={["#070b12"]} />
      <ambientLight intensity={0.04} />
      <ParticleRig />
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom luminanceThreshold={0.64} mipmapBlur intensity={0.7} radius={0.72} />
      </EffectComposer>
    </CanvasShell>
  );
}

useGLTF.preload(KIT.ParticleBrain.src);
