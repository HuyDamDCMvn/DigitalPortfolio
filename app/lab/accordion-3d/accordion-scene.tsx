"use client";

/* eslint-disable react/no-unknown-property -- three.js intrinsic elements */

import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { CanvasShell } from "../../r3f/canvas-shell";

const ROW_W = 2.15;
const ROW_H = 0.38;
const ROW_D = 0.18;
const GAP = 0.09;
const PLATE_H = 0.5;
const FACE_Z = ROW_D / 2 + 0.006;

type SceneProps = {
  count: number;
  openIndex: number | null;
  onSelect: (index: number | null) => void;
};

function AccordionStack({ count, openIndex, onSelect }: SceneProps) {
  const amounts = useRef<number[]>(Array.from({ length: count }, () => 0));
  const rows = useRef<(Group | null)[]>([]);
  const plates = useRef<(Group | null)[]>([]);
  const slabs = useRef<(MeshStandardMaterial | null)[]>([]);
  const cues = useRef<(Mesh | null)[]>([]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 9);
    const heights: number[] = [];
    let total = -GAP;

    for (let i = 0; i < count; i += 1) {
      const target = i === openIndex ? 1 : 0;
      const next = amounts.current[i] + (target - amounts.current[i]) * k;
      amounts.current[i] = next;
      const height = ROW_H + PLATE_H * next;
      heights.push(height);
      total += height + GAP;
    }

    let cursor = total / 2;

    for (let i = 0; i < count; i += 1) {
      const amount = amounts.current[i];
      const row = rows.current[i];
      if (row) {
        row.position.y = cursor - ROW_H / 2;
        row.position.z = amount * 0.3;
        row.rotation.x = (1 - amount) * 0.06;
      }

      const plate = plates.current[i];
      if (plate) {
        plate.scale.y = Math.max(amount, 0.0001);
        plate.visible = amount > 0.012;
      }

      const slab = slabs.current[i];
      if (slab) slab.emissiveIntensity = 0.04 + amount * 0.5;

      const cue = cues.current[i];
      if (cue) cue.scale.y = Math.max(1 - amount, 0.0001);

      cursor -= heights[i] + GAP;
    }
  });

  const select = (index: number) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(openIndex === index ? null : index);
  };

  const hover = (on: boolean) => (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = on ? "pointer" : "";
  };

  return (
    <group rotation={[0.07, -0.44, 0]} position={[0.12, 0, 0]}>
      {Array.from({ length: count }, (_, index) => (
        <group
          key={index}
          ref={(node) => {
            rows.current[index] = node;
          }}
          onClick={select(index)}
          onPointerOver={hover(true)}
          onPointerOut={hover(false)}
        >
          <RoundedBox args={[ROW_W, ROW_H, ROW_D]} radius={0.055} smoothness={4}>
            <meshStandardMaterial
              ref={(node) => {
                slabs.current[index] = node;
              }}
              color="#0b2246"
              roughness={0.46}
              metalness={0.22}
              emissive="#5fc7ec"
              emissiveIntensity={0.04}
            />
          </RoundedBox>

          {/* index pip */}
          <mesh position={[-ROW_W / 2 + 0.14, 0, FACE_Z]}>
            <boxGeometry args={[0.075, 0.075, 0.012]} />
            <meshStandardMaterial color="#5fc7ec" emissive="#5fc7ec" emissiveIntensity={0.7} />
          </mesh>

          {/* abstract title rule — real copy lives in the DOM list */}
          <mesh position={[-ROW_W / 2 + 0.66, 0, FACE_Z]}>
            <boxGeometry args={[0.86, 0.042, 0.01]} />
            <meshStandardMaterial color="#dceefb" roughness={0.6} />
          </mesh>

          {/* plus / minus cue */}
          <mesh position={[ROW_W / 2 - 0.2, 0, FACE_Z]}>
            <boxGeometry args={[0.15, 0.026, 0.01]} />
            <meshStandardMaterial color="#ffbd24" emissive="#ffbd24" emissiveIntensity={0.35} />
          </mesh>
          <mesh
            ref={(node) => {
              cues.current[index] = node;
            }}
            position={[ROW_W / 2 - 0.2, 0, FACE_Z]}
          >
            <boxGeometry args={[0.026, 0.15, 0.01]} />
            <meshStandardMaterial color="#ffbd24" emissive="#ffbd24" emissiveIntensity={0.35} />
          </mesh>

          {/* detail plate grows downward from the row */}
          <group
            ref={(node) => {
              plates.current[index] = node;
            }}
            position={[0, -ROW_H / 2 - 0.02, 0]}
            scale={[1, 0.0001, 1]}
          >
            <RoundedBox
              args={[ROW_W * 0.92, PLATE_H, ROW_D * 0.55]}
              radius={0.04}
              smoothness={4}
              position={[0, -PLATE_H / 2, 0]}
            >
              <meshStandardMaterial
                color="#071a35"
                roughness={0.72}
                metalness={0.1}
                emissive="#5fc7ec"
                emissiveIntensity={0.12}
              />
            </RoundedBox>
          </group>
        </group>
      ))}
    </group>
  );
}

function Scene(props: SceneProps) {
  return (
    <>
      <color attach="background" args={["#05070c"]} />
      <hemisphereLight args={["#dceefb", "#031733", 0.5]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[3.4, 4.2, 4.6]} intensity={1.1} />
      <directionalLight position={[-3.6, 1.4, 2.2]} intensity={0.55} color="#5fc7ec" />
      <pointLight position={[1.6, -1.2, 2.4]} intensity={0.6} color="#ffbd24" distance={7} />
      <AccordionStack {...props} />
    </>
  );
}

export function AccordionCanvas({
  count,
  openIndex,
  onSelect,
  fallbackLabel,
  sceneLabel,
}: SceneProps & {
  fallbackLabel: string;
  sceneLabel: string;
}) {
  const fallback = (
    <div className="accordion-lab-fallback">
      <span />
      <p>{fallbackLabel}</p>
    </div>
  );

  return (
    <CanvasShell
      className="accordion-lab-canvas"
      fallback={fallback}
      eager
      camera={{ position: [0, 0.1, 3.6], fov: 36 }}
      role="img"
      aria-label={sceneLabel}
    >
      <Scene count={count} openIndex={openIndex} onSelect={onSelect} />
    </CanvasShell>
  );
}
