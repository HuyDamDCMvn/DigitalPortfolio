"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { AnimationMixer, LoopRepeat, type AnimationClip, type Object3D } from "three";
import type { IdleClip } from "./kit";

function clipName(clip: IdleClip | "none"): string | null {
  if (clip === "none") return null;
  if (clip === "sit") return "Sit";
  if (clip === "hero") return "Hero";
  if (clip === "idle" || clip === "auto") return "Idle";
  return "Idle";
}

function findClip(clips: AnimationClip[], name: string) {
  const lower = name.toLowerCase();
  return (
    clips.find((item) => item.name === name) ||
    clips.find((item) => item.name.toLowerCase() === lower) ||
    clips.find((item) => item.name.toLowerCase().includes(lower))
  );
}

export function CharacterMixer({
  root,
  clips,
  clip = "idle",
  active = true,
}: {
  root: Object3D;
  clips: AnimationClip[];
  clip?: IdleClip;
  active?: boolean;
}) {
  const mixerRef = useRef<AnimationMixer | null>(null);

  useEffect(() => {
    const mixer = new AnimationMixer(root);
    mixerRef.current = mixer;
    const name = clipName(clip);
    if (name) {
      const found = findClip(clips, name);
      if (found) {
        const action = mixer.clipAction(found);
        action.setLoop(LoopRepeat, Infinity);
        action.play();
      }
    }
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      mixerRef.current = null;
    };
  }, [root, clips, clip]);

  useFrame((_, delta) => {
    if (!active) return;
    mixerRef.current?.update(delta);
  });

  return null;
}
