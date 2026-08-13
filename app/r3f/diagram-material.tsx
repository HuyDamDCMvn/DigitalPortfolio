"use client";

import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Textured diagram plane with light pulse / cyan edge — DCM brand safe.
 */
export const DiagramMaterial = shaderMaterial(
  {
    uTime: 0,
    uAmp: 0.018,
    uPulseBoost: 0,
    uHover: 0,
    uBright: 1,
    uLift: 0,
    uMap: null as unknown as THREE.Texture,
    uTint: new THREE.Color("#5fc7ec"),
  },
  /* glsl */ `
    uniform float uTime;
    uniform float uAmp;
    uniform float uPulseBoost;
    uniform float uHover;
    varying vec2 vUv;
    varying float vWave;

    void main() {
      vUv = uv;
      float wave = sin(uv.x * 6.28318 + uTime * 1.6) * cos(uv.y * 4.0 - uTime * 1.1);
      vWave = wave;
      float amp = uAmp * (1.0 + uPulseBoost * 1.2 + uHover * 0.25);
      vec3 displaced = position + normal * (wave * amp);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `,
  /* glsl */ `
    uniform sampler2D uMap;
    uniform vec3 uTint;
    uniform float uHover;
    uniform float uPulseBoost;
    uniform float uBright;
    uniform float uLift;
    varying vec2 vUv;
    varying float vWave;

    void main() {
      vec4 tex = texture2D(uMap, vUv);
      float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(0.0, 0.12, vUv.y)
        * smoothstep(1.0, 0.88, vUv.x) * smoothstep(1.0, 0.88, vUv.y);
      float wash = (0.02 + uHover * 0.025 + uPulseBoost * 0.03) * (0.45 + 0.25 * vWave);
      vec3 tinted = tex.rgb * mix(vec3(1.0), vec3(0.94, 0.98, 1.0), wash);
      vec3 color = mix(tex.rgb, tinted, 0.7);
      color = mix(color, color * (1.0 + uTint * 0.06), (1.0 - edge) * 0.15 * (0.35 + uHover * 0.2));
      // Exposure-style lift for brighter midtones without white flash.
      color = color * uBright + vec3(uLift);
      color = pow(max(color, 0.0), vec3(0.94));
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), tex.a);
    }
  `,
);

extend({ DiagramMaterial });

export type DiagramMaterialImpl = THREE.ShaderMaterial & {
  uTime: number;
  uAmp: number;
  uPulseBoost: number;
  uHover: number;
  uBright: number;
  uLift: number;
  uMap: THREE.Texture;
  uTint: THREE.Color;
};

declare module "@react-three/fiber" {
  interface ThreeElements {
    diagramMaterial: ThreeElement<typeof DiagramMaterial>;
  }
}
