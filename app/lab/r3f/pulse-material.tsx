"use client";

import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Starter custom shader — vertex displacement “pulse”.
 * Edit uniforms / GLSL here when you try new ideas.
 */
export const PulseMaterial = shaderMaterial(
  {
    uTime: 0,
    uAmp: 0.14,
    uFreq: 3.2,
    uColor: new THREE.Color("#5fc7ec"),
    uTint: new THREE.Color("#062553"),
  },
  /* glsl */ `
    uniform float uTime;
    uniform float uAmp;
    uniform float uFreq;
    varying vec3 vNormal;
    varying float vPulse;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      float pulse = sin(position.y * uFreq + uTime * 2.0)
        * cos(position.x * uFreq * 0.6 + uTime * 1.4);
      vPulse = pulse;
      vec3 displaced = position + normal * (pulse * uAmp);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `,
  /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uTint;
    varying vec3 vNormal;
    varying float vPulse;

    void main() {
      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
      vec3 base = mix(uTint, uColor, 0.55 + vPulse * 0.35);
      vec3 color = mix(base, uColor, fresnel * 0.85);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
);

extend({ PulseMaterial });

export type PulseMaterialImpl = THREE.ShaderMaterial & {
  uTime: number;
  uAmp: number;
  uFreq: number;
  uColor: THREE.Color;
  uTint: THREE.Color;
};

declare module "@react-three/fiber" {
  interface ThreeElements {
    pulseMaterial: ThreeElement<typeof PulseMaterial>;
  }
}
