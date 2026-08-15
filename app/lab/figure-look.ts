import {
  Color,
  MeshStandardMaterial,
  type Material,
  type Mesh,
  type Object3D,
} from "three";

export type FigureLook = {
  shirt: string;
  pants: string;
  tie: string;
  trim: string;
  shoes: string;
  skin: string;
  hair: string;
  iris: string;
};

/** One office palette per hub seat — brand cyan / gold / navy plus three accents. */
export const SITTER_LOOKS: FigureLook[] = [
  { shirt: "#5fc7ec", pants: "#062553", tie: "#ffbd24", trim: "#ffbd24", shoes: "#1a2430", skin: "#f3ebe3", hair: "#1c1a1a", iris: "#3d6a78" },
  { shirt: "#ffbd24", pants: "#2a3340", tie: "#062553", trim: "#5fc7ec", shoes: "#062553", skin: "#efe4d6", hair: "#e85a28", iris: "#5a3a28" },
  { shirt: "#f4f7fa", pants: "#062553", tie: "#5fc7ec", trim: "#5fc7ec", shoes: "#2a3340", skin: "#f6efe6", hair: "#2a2420", iris: "#4a6a78" },
  { shirt: "#6b7cff", pants: "#031733", tie: "#ffbd24", trim: "#ffbd24", shoes: "#1a2430", skin: "#eadfd4", hair: "#6b4cff", iris: "#5a48a0" },
  { shirt: "#ee6b56", pants: "#062553", tie: "#f4f7fa", trim: "#5fc7ec", shoes: "#2a3340", skin: "#f0e4d8", hair: "#1a1a1c", iris: "#3a5a68" },
  { shirt: "#3dcc9a", pants: "#062553", tie: "#ffbd24", trim: "#ffbd24", shoes: "#031733", skin: "#f4ebe2", hair: "#1a8a8a", iris: "#1a6a6c" },
];

export function sitterLook(index: number): FigureLook {
  const look = SITTER_LOOKS.at(((index % SITTER_LOOKS.length) + SITTER_LOOKS.length) % SITTER_LOOKS.length);
  return look ?? {
    shirt: "#5fc7ec",
    pants: "#062553",
    tie: "#ffbd24",
    trim: "#ffbd24",
    shoes: "#1a2430",
    skin: "#f3ebe3",
    hair: "#1c1a1a",
    iris: "#3d6a78",
  };
}

const WHITE = new Color("#f4f7fa");

function asStd(mat: Material | Material[]): MeshStandardMaterial[] {
  const list = Array.isArray(mat) ? mat : [mat];
  return list.filter((item): item is MeshStandardMaterial => "emissive" in item && "color" in item);
}

export function cloneMeshMaterials(root: Object3D) {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((item) => item.clone());
    else mesh.material = mesh.material.clone();
  });
}

export function disposeMeshMaterials(root: Object3D) {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    for (const mat of asStd(mesh.material)) mat.dispose();
  });
}

export function skipRaycast(root: Object3D) {
  root.traverse((obj) => {
    obj.raycast = () => {};
  });
}

function paint(mat: MeshStandardMaterial, hex: string, glowBoost: number) {
  mat.color.set(hex);
  mat.emissive.set(hex);
  mat.emissiveIntensity = glowBoost > 0.5 ? 0.12 : 0.03;
  mat.userData.baseEmissive = mat.emissive.clone();
  mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
  mat.userData.glowBoost = glowBoost;
}

function lookForName(name: string, look: FigureLook): { hex: string; boost: number } | null {
  if (name.includes("Ring")) return { hex: "#1a1a1b", boost: 0.12 };
  if (name.startsWith("CuffTrim") || name === "CollarBand") return { hex: look.trim, boost: 1.15 };
  if (name.startsWith("Tie")) return { hex: look.tie, boost: 1.05 };
  if (name.startsWith("Hair") || name.startsWith("Brow")) return { hex: look.hair, boost: 0.22 };
  if (name.startsWith("Lid") || name.startsWith("Lash")) return { hex: "#1a1412", boost: 0.08 };
  if (name.startsWith("Highlight")) return { hex: "#ffffff", boost: 0.45 };
  if (name.startsWith("EyeWhite")) return { hex: "#fbf8f4", boost: 0.18 };
  if (name.startsWith("Iris")) return { hex: look.iris, boost: 0.38 };
  if (name.startsWith("Pupil")) return { hex: "#121212", boost: 0.1 };
  if (name.startsWith("Lip")) return { hex: "#8a6a62", boost: 0.14 };
  if (
    name === "Shirt" ||
    name === "Chest" ||
    name === "ShirtTail" ||
    name === "Collar" ||
    name.startsWith("CollarLeaf") ||
    name.startsWith("Shoulder") ||
    name.startsWith("UpperArm") ||
    name.startsWith("Elbow") ||
    name.startsWith("ForeArm") ||
    name.startsWith("Cuff")
  ) {
    return { hex: look.shirt, boost: 1 };
  }
  if (
    name === "Pelvis" ||
    name === "SeatMass" ||
    name.startsWith("Hip_") ||
    name.startsWith("UpperLeg") ||
    name.startsWith("LowerLeg") ||
    name.startsWith("Trouser")
  ) {
    return { hex: look.pants, boost: 0.72 };
  }
  if (name.startsWith("Foot_") || name.startsWith("Heel_") || name.startsWith("Toe_") || name.startsWith("Sole_")) {
    return { hex: look.shoes, boost: 0.55 };
  }
  if (name === "Placket") return { hex: "#f4f7fa", boost: 0.85 };
  if (
    name === "Torso" ||
    name === "Head" ||
    name === "Jaw" ||
    name === "Chin" ||
    name === "Neck" ||
    name.startsWith("Cheek") ||
    name.startsWith("Ear") ||
    name === "Nose" ||
    name.startsWith("Hand_") ||
    name.startsWith("Knuckle") ||
    name.startsWith("Finger") ||
    name.startsWith("Thumb") ||
    name.startsWith("Knee") ||
    name.startsWith("Ankle")
  ) {
    return { hex: look.skin, boost: 0.32 };
  }
  return null;
}

export function applyFigureLook(root: Object3D, look: FigureLook) {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const mapped = lookForName(mesh.name, look);
    if (!mapped) return;
    for (const mat of asStd(mesh.material)) paint(mat, mapped.hex, mapped.boost);
  });
}

export function collectGlowMaterials(root: Object3D) {
  const mats: MeshStandardMaterial[] = [];
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    mats.push(...asStd(mesh.material));
  });
  for (const mat of mats) {
    if (!(mat.userData.baseEmissive instanceof Color)) {
      mat.userData.baseEmissive = mat.emissive.clone();
      mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
      if (typeof mat.userData.glowBoost !== "number") mat.userData.glowBoost = 1;
    }
  }
  return mats;
}

export function setFigureGlow(mats: MeshStandardMaterial[], amount: number) {
  for (const mat of mats) {
    const boost = typeof mat.userData.glowBoost === "number" ? mat.userData.glowBoost : 0.7;
    const base = mat.userData.baseEmissive as Color | undefined;
    const baseInt = typeof mat.userData.baseEmissiveIntensity === "number" ? mat.userData.baseEmissiveIntensity : 0.04;
    if (base) mat.emissive.copy(base).lerp(WHITE, amount * 0.55);
    mat.emissiveIntensity = baseInt + amount * 1.35 * boost;
  }
}
