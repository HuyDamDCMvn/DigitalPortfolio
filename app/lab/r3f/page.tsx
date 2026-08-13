import type { Metadata } from "next";
import { R3fLabCanvas } from "./scene";
import "./lab.css";

export const metadata: Metadata = {
  title: "R3F Lab — Digital Team",
  description: "Sandbox for React Three Fiber, drei, and custom shaders.",
  robots: { index: false, follow: false },
};

export default function R3fLabPage() {
  return (
    <main className="r3f-lab">
      <header className="r3f-lab-header">
        <div>
          <p className="r3f-lab-eyebrow">Lab · not linked from portfolio</p>
          <h1>React Three Fiber starter</h1>
          <p className="r3f-lab-copy">
            Stack ready: <code>three</code> + <code>@react-three/fiber</code> +{" "}
            <code>@react-three/drei</code> + custom GLSL in{" "}
            <code>pulse-material.tsx</code>. Swap geometry, uniforms, or load a{" "}
            <code>.glb</code> when you have an idea.
          </p>
        </div>
        <a className="r3f-lab-back" href="/">
          ← Portfolio
        </a>
      </header>

      <R3fLabCanvas />

      <aside className="r3f-lab-notes">
        <h2>Where to edit</h2>
        <ul>
          <li>
            <code>app/lab/r3f/pulse-material.tsx</code> — uniforms + vertex/fragment shaders
          </li>
          <li>
            <code>app/lab/r3f/scene.tsx</code> — lights, mesh, OrbitControls, Environment
          </li>
          <li>
            Put models in <code>public/models/</code> then use{" "}
            <code>useGLTF</code> from drei
          </li>
        </ul>
      </aside>
    </main>
  );
}
