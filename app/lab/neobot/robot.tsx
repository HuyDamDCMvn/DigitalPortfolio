"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  Color,
  MathUtils,
  MeshPhysicalMaterial,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Group,
  type Material,
} from "three";

/** Camera sits level with the chest, so the whole scene is lowered by this much. */
export const SCENE_LIFT = 1.28;

const LOOK = { head: 0.46, chest: 0.18, hips: 0.08 };
const CHEST_Y = 0.98;
const HEAD_LOCAL_Y = 0.5;
const UP = new Vector3(0, 1, 0);

type Joint = [number, number, number];

function makeCarbonMaps() {
  const size = 256;
  const color = document.createElement("canvas");
  const bump = document.createElement("canvas");
  color.width = color.height = bump.width = bump.height = size;
  const cctx = color.getContext("2d");
  const bctx = bump.getContext("2d");
  if (!cctx || !bctx) return { map: null, bumpMap: null };

  const cell = 3;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const band = Math.floor((x / cell + Math.floor(y / cell) * 0.5) % 2);
      cctx.fillStyle = band ? "#0d0d10" : "#222228";
      cctx.fillRect(x, y, cell, cell);
      bctx.fillStyle = band ? "#404040" : "#e8e8e8";
      bctx.fillRect(x, y, cell, cell);
    }
  }
  const map = new CanvasTexture(color);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(10, 8);
  map.anisotropy = 8;
  const bumpMap = new CanvasTexture(bump);
  bumpMap.wrapS = bumpMap.wrapT = RepeatWrapping;
  bumpMap.repeat.set(10, 8);
  return { map, bumpMap };
}

function makeLedMap() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 96, 48);
  ctx.fillStyle = "#ffffff";
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      ctx.beginPath();
      ctx.arc(10 + col * 14, 10 + row * 14, 3.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.needsUpdate = true;
  return map;
}

function useNexbotMaterials() {
  const materials = useMemo(() => {
    const { map, bumpMap } = makeCarbonMaps();
    const ledMap = makeLedMap();
    return {
      chrome: new MeshPhysicalMaterial({
        color: "#08080b",
        metalness: 1,
        roughness: 0.07,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.9,
      }),
      visor: new MeshPhysicalMaterial({
        color: "#101218",
        metalness: 0.4,
        roughness: 0.1,
        transmission: 0.18,
        thickness: 0.02,
        transparent: true,
        opacity: 0.88,
        envMapIntensity: 1.5,
      }),
      frost: new MeshPhysicalMaterial({
        color: "#c8ced6",
        metalness: 0.04,
        roughness: 0.6,
        transparent: true,
        opacity: 0.38,
        envMapIntensity: 0.45,
      }),
      carbon: new MeshPhysicalMaterial({
        color: "#141418",
        map: map ?? undefined,
        bumpMap: bumpMap ?? undefined,
        bumpScale: 0.045,
        metalness: 0.08,
        roughness: 0.62,
        clearcoat: 0.08,
        clearcoatRoughness: 0.55,
        envMapIntensity: 0.55,
      }),
      shell: new MeshPhysicalMaterial({
        color: "#101014",
        metalness: 0.1,
        roughness: 0.52,
        clearcoat: 0.12,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.55,
      }),
      joint: new MeshPhysicalMaterial({
        color: "#0b0b0e",
        metalness: 0.95,
        roughness: 0.14,
        clearcoat: 0.65,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.4,
      }),
      led: new MeshPhysicalMaterial({
        color: "#ffffff",
        map: ledMap ?? undefined,
        transparent: true,
        emissive: new Color("#ffffff"),
        emissiveMap: ledMap ?? undefined,
        emissiveIntensity: 2.2,
        roughness: 0.35,
        metalness: 0,
        depthWrite: false,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      for (const mat of Object.values(materials)) {
        mat.map?.dispose();
        mat.bumpMap?.dispose();
        mat.emissiveMap?.dispose();
        mat.dispose();
      }
    },
    [materials],
  );

  return materials;
}

type Mats = ReturnType<typeof useNexbotMaterials>;

function Bone({
  from,
  to,
  radius,
  material,
}: {
  from: Joint;
  to: Joint;
  radius: number;
  material: Material;
}) {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const direction = end.clone().sub(start);
  const span = direction.length();
  const middle = start.clone().add(end).multiplyScalar(0.5);
  const quaternion = new Quaternion().setFromUnitVectors(UP, direction.normalize());

  return (
    <mesh position={middle} quaternion={quaternion} material={material}>
      <capsuleGeometry args={[radius, Math.max(span - radius * 2, 0.012), 5, 16]} />
    </mesh>
  );
}

function Head({ materials }: { materials: Mats }) {
  return (
    <group>
      <mesh scale={[0.92, 1.42, 1.04]} material={materials.chrome}>
        <sphereGeometry args={[0.102, 48, 36]} />
      </mesh>
      <mesh scale={[0.94, 1.44, 1.07]} material={materials.visor}>
        <sphereGeometry args={[0.102, 48, 36, Math.PI / 2 - 1.02, 2.04, 0.38, 1.28]} />
      </mesh>
      <mesh position={[0, -0.07, 0.068]} scale={[1.05, 0.48, 0.38]} material={materials.frost}>
        <sphereGeometry args={[0.068, 24, 16]} />
      </mesh>
      <mesh position={[0, 0.008, 0.088]} material={materials.chrome} scale={[0.18, 1.15, 0.35]}>
        <boxGeometry args={[0.012, 0.055, 0.02]} />
      </mesh>
      <mesh position={[-0.036, 0.014, 0.09]} material={materials.led}>
        <planeGeometry args={[0.072, 0.036]} />
      </mesh>
      <mesh position={[0.036, 0.014, 0.09]} material={materials.led}>
        <planeGeometry args={[0.072, 0.036]} />
      </mesh>
    </group>
  );
}

function Neck({ materials }: { materials: Mats }) {
  return (
    <group position={[0, HEAD_LOCAL_Y - 0.155, 0]}>
      <mesh material={materials.joint}>
        <cylinderGeometry args={[0.016, 0.019, 0.1, 16]} />
      </mesh>
      {[-0.03, 0, 0.03].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.joint}>
          <torusGeometry args={[0.028, 0.0055, 10, 22]} />
        </mesh>
      ))}
    </group>
  );
}

function TorsoShell({ materials }: { materials: Mats }) {
  const points = useMemo(
    () => [
      new Vector2(0.08, -0.08),
      new Vector2(0.095, 0.02),
      new Vector2(0.13, 0.1),
      new Vector2(0.175, 0.2),
      new Vector2(0.2, 0.3),
      new Vector2(0.192, 0.4),
      new Vector2(0.12, 0.46),
      new Vector2(0.05, 0.5),
    ],
    [],
  );

  return (
    <group>
      <mesh material={materials.carbon} scale={[1, 1, 0.74]}>
        <latheGeometry args={[points, 48]} />
      </mesh>
      <mesh position={[-0.068, 0.3, 0.055]} scale={[1.05, 0.72, 0.58]} material={materials.carbon}>
        <sphereGeometry args={[0.09, 24, 18]} />
      </mesh>
      <mesh position={[0.068, 0.3, 0.055]} scale={[1.05, 0.72, 0.58]} material={materials.carbon}>
        <sphereGeometry args={[0.09, 24, 18]} />
      </mesh>
    </group>
  );
}

function Hand({ side, materials }: { side: number; materials: Mats }) {
  return (
    <group rotation={[0.55, 0.12 * side, 0.35 * side]}>
      <mesh scale={[0.9, 1.05, 0.55]} material={materials.shell}>
        <sphereGeometry args={[0.032, 16, 12]} />
      </mesh>
      {[-0.016, -0.005, 0.006, 0.016].map((x, i) => (
        <group key={x} position={[x, -0.03, 0.004]} rotation={[0.55 + i * 0.06, 0, 0]}>
          <mesh position={[0, -0.014, 0]} material={materials.chrome}>
            <capsuleGeometry args={[0.0054, 0.018, 3, 8]} />
          </mesh>
          <mesh position={[0, -0.034, 0.003]} rotation={[0.4, 0, 0]} material={materials.chrome}>
            <capsuleGeometry args={[0.0048, 0.012, 3, 8]} />
          </mesh>
        </group>
      ))}
      <group position={[0.018 * side, -0.01, 0.01]} rotation={[0.25, 0.85 * side, 0.2 * side]}>
        <mesh position={[0, -0.014, 0]} material={materials.chrome}>
          <capsuleGeometry args={[0.0058, 0.014, 3, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function Arm({ side, materials }: { side: number; materials: Mats }) {
  const shoulder: Joint = [0.228 * side, 0.38, 0.02];
  const elbow: Joint = [0.262 * side, 0.1, 0.03];
  const wrist: Joint = [0.285 * side, -0.16, 0.055];

  return (
    <group>
      <mesh position={shoulder} material={materials.joint}>
        <sphereGeometry args={[0.038, 20, 16]} />
      </mesh>
      <Bone from={shoulder} to={elbow} radius={0.048} material={materials.carbon} />
      <mesh position={elbow} material={materials.joint}>
        <sphereGeometry args={[0.03, 16, 12]} />
      </mesh>
      <mesh position={elbow} rotation={[0, 0, Math.PI / 2]} material={materials.chrome}>
        <cylinderGeometry args={[0.01, 0.01, 0.048, 12]} />
      </mesh>
      <Bone from={elbow} to={wrist} radius={0.04} material={materials.shell} />
      <group position={wrist}>
        <Hand side={side} materials={materials} />
      </group>
    </group>
  );
}

function Pauldron({ side, materials }: { side: number; materials: Mats }) {
  return (
    <mesh position={[0.232 * side, 0.41, 0.015]} scale={[1.15, 0.78, 1.02]} material={materials.carbon}>
      <sphereGeometry args={[0.082, 28, 20]} />
    </mesh>
  );
}

function Leg({ side, materials }: { side: number; materials: Mats }) {
  const hip: Joint = [0.1 * side, 0.9, 0];
  const knee: Joint = [0.108 * side, 0.48, 0.012];
  const ankle: Joint = [0.105 * side, 0.12, 0.01];

  return (
    <group>
      <mesh position={hip} rotation={[0, 0, Math.PI / 2]} material={materials.chrome}>
        <cylinderGeometry args={[0.05, 0.05, 0.068, 24]} />
      </mesh>
      <Bone from={hip} to={knee} radius={0.07} material={materials.shell} />
      <mesh position={knee} material={materials.joint}>
        <sphereGeometry args={[0.044, 16, 12]} />
      </mesh>
      <Bone from={knee} to={ankle} radius={0.054} material={materials.shell} />
    </group>
  );
}

export function Neobot() {
  const materials = useNexbotMaterials();
  const rootRef = useRef<Group>(null);
  const chestRef = useRef<Group>(null);
  const breathRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);

  useFrame((state, delta) => {
    const { x, y } = state.pointer;
    const time = state.clock.elapsedTime;
    const step = Math.min(delta, 0.05);
    const root = rootRef.current;
    const chest = chestRef.current;
    const breath = breathRef.current;
    const head = headRef.current;
    if (!root || !chest || !breath || !head) return;

    root.rotation.y = MathUtils.damp(root.rotation.y, x * LOOK.hips, 4, step);
    chest.rotation.y = MathUtils.damp(chest.rotation.y, x * LOOK.chest, 5, step);
    chest.rotation.x = MathUtils.damp(chest.rotation.x, -y * LOOK.chest * 0.5, 5, step);
    head.rotation.y = MathUtils.damp(head.rotation.y, x * LOOK.head, 7, step);
    head.rotation.x = MathUtils.damp(head.rotation.x, -y * LOOK.head * 0.62, 7, step);
    head.position.y = HEAD_LOCAL_Y + Math.sin(time * 1.15 + 0.4) * 0.005;
    breath.scale.y = 1 + Math.sin(time * 1.15) * 0.01;
  });

  return (
    <group ref={rootRef}>
      {[-1, 1].map((side) => (
        <Leg key={`leg-${side}`} side={side} materials={materials} />
      ))}

      <group ref={chestRef} position={[0, CHEST_Y, 0]}>
        <group ref={breathRef}>
          <TorsoShell materials={materials} />
        </group>
        {[-1, 1].map((side) => (
          <Pauldron key={`p-${side}`} side={side} materials={materials} />
        ))}
        {[-1, 1].map((side) => (
          <Arm key={`a-${side}`} side={side} materials={materials} />
        ))}
        <Neck materials={materials} />
        <group ref={headRef} position={[0, HEAD_LOCAL_Y, 0]}>
          <Head materials={materials} />
        </group>
      </group>
    </group>
  );
}
