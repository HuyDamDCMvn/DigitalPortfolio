"use client";

import { Bounds, Center, ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import type { Group, PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { KIT, KIT_ORDER, LIB_SRC, WORLD, kitBySrc } from "../kit";
import { applyFigureLook, cloneMeshMaterials, disposeMeshMaterials, sitterLook } from "../figure-look";
import { isolateMeshes, stripCharStrays } from "../lab-part";
import { CharacterMixer } from "../character-mixer";
import { ModelIdle } from "../model-idle";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

export { LIB_SRC };

for (const src of Object.values(LIB_SRC)) {
  useGLTF.preload(src);
}

export type ZoomApi = {
  zoomIn: () => void;
  zoomOut: () => void;
};

export type PartTile = {
  id: string;
  src: string;
  file: string;
  names: "all" | readonly string[];
};

const BINDER_MESHES = Array.from({ length: 7 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return [`Binder_${n}`, `BinderPull_${n}`];
}).flat();

const SPOKES = Array.from({ length: 5 }, (_, i) => `Spoke_${String(i + 1).padStart(2, "0")}`);
const CASTERS = Array.from({ length: 5 }, (_, i) => `Caster_${String(i + 1).padStart(2, "0")}`);
const WTC_BASE = [
  "Hub",
  "HubCap",
  "HousingRing",
  ...SPOKES,
  ...Array.from({ length: 5 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return [`CasterHorn_${n}`, `CasterPin_${n}`, `CasterHood_${n}`, `Wheel_${n}L`, `Wheel_${n}R`, `WheelHub_${n}L`, `WheelHub_${n}R`];
  }).flat(),
];

export const LIBRARY_TILES: PartTile[] = KIT_ORDER.map((id) => ({
  id,
  src: KIT[id].src,
  file: KIT[id].file,
  names: "all",
}));

export const EXPLODE_TILES: PartTile[] = [
  {
    id: "neobot-Head",
    src: LIB_SRC.neobot,
    file: "neobot.glb",
    names: ["Cranium", "Visor", "VisorBar", "Eye_L", "Eye_R", "Neck", "Collar"],
  },
  {
    id: "neobot-Torso",
    src: LIB_SRC.neobot,
    file: "neobot.glb",
    names: [
      "ChestHull",
      "Sternum",
      "SpinePlate",
      "Pec_L",
      "Pec_R",
      "ChestGrooveH",
      "ChestGrooveV",
      "Vent_1",
      "Vent_2",
      "Vent_3",
      "Vent_4",
      "Pelvis",
      "PelvisGroove",
      "Waist",
      "WaistRing",
    ],
  },
  {
    id: "neobot-Arms",
    src: LIB_SRC.neobot,
    file: "neobot.glb",
    names: [
      "Shoulder_L",
      "Shoulder_R",
      "Pauldron_L",
      "Pauldron_R",
      "UpperArm_L",
      "UpperArm_R",
      "UpperPlate_L",
      "UpperPlate_R",
      "Elbow_L",
      "Elbow_R",
      "ForeArm_L",
      "ForeArm_R",
      "Wrist_L",
      "Wrist_R",
      "Hand_L",
      "Hand_R",
      "Finger_L1",
      "Finger_L2",
      "Finger_L3",
      "Finger_R1",
      "Finger_R2",
      "Finger_R3",
    ],
  },
  {
    id: "neobot-Legs",
    src: LIB_SRC.neobot,
    file: "neobot.glb",
    names: [
      "Hip_L",
      "Hip_R",
      "UpperLeg_L",
      "UpperLeg_R",
      "ThighPlate_L",
      "ThighPlate_R",
      "ThighSeam_L",
      "ThighSeam_R",
      "Knee_L",
      "Knee_R",
      "LowerLeg_L",
      "LowerLeg_R",
      "ShinPlate_L",
      "ShinPlate_R",
      "Foot_L",
      "Foot_R",
      "Sole_L",
      "Sole_R",
    ],
  },
  { id: "hex-Plinth", src: LIB_SRC.hex, file: "hex-table.glb", names: ["Plinth"] },
  { id: "hex-Pedestal", src: LIB_SRC.hex, file: "hex-table.glb", names: ["Pedestal", "GlowTrim"] },
  { id: "hex-Top", src: LIB_SRC.hex, file: "hex-table.glb", names: ["Top"] },
  { id: "hex-Well", src: LIB_SRC.hex, file: "hex-table.glb", names: ["Well"] },
  {
    id: "hex-Pads",
    src: LIB_SRC.hex,
    file: "hex-table.glb",
    names: ["Pad_01", "Pad_02", "Pad_03", "Pad_04", "Pad_05", "Pad_06", "Panel", "PanelScreen"],
  },
  { id: "oct-Glow", src: LIB_SRC.oct, file: "oct-table.glb", names: ["GlowTrim"] },
  { id: "oct-Pedestal", src: LIB_SRC.oct, file: "oct-table.glb", names: ["Pedestal"] },
  { id: "oct-Top", src: LIB_SRC.oct, file: "oct-table.glb", names: ["Top"] },
  { id: "oct-Well", src: LIB_SRC.oct, file: "oct-table.glb", names: ["Well", "WellGlass"] },
  {
    id: "holo-Podium",
    src: LIB_SRC.holoCity,
    file: "holo-city.glb",
    names: [
      "HoloPodium",
      "HoloDeck",
      "HoloPad",
      "HoloRim",
      "HoloEmitter",
      "HoloStrip_01",
      "HoloStrip_02",
      "HoloStrip_03",
      "HoloStrip_04",
      "HoloStrip_05",
      "HoloStrip_06",
      "HoloStripB_01",
      "HoloStripB_02",
      "HoloStripB_03",
      "HoloStripB_04",
      "HoloStripB_05",
      "HoloStripB_06",
      "HoloCorner_01",
      "HoloCorner_02",
      "HoloCorner_03",
      "HoloCorner_04",
      "HoloCorner_05",
      "HoloCorner_06",
    ],
  },
  {
    id: "holo-Towers",
    src: LIB_SRC.holoCity,
    file: "holo-city.glb",
    names: [
      "HoloSpire",
      "HoloBldgA",
      "HoloBldgB",
      "HoloBldgC",
      "HoloBldgD",
      "HoloBldgE",
      "HoloBldgF",
      "HoloBldgG",
      "HoloBldgH",
      "HoloBldgI",
      "HoloBldgJ",
      "HoloBldgK",
      "HoloBldgL",
    ],
  },
  {
    id: "holo-Fx",
    src: LIB_SRC.holoCity,
    file: "holo-city.glb",
    names: [
      "GlowRing",
      "HoloScanA",
      "HoloScanB",
      "HoloBeam",
      "HoloBeacon",
      "HoloGround",
      "HoloPathRing",
      "HoloPathInner",
      "HoloPanel_01",
      "HoloPanel_02",
      "HoloPanel_03",
      "HoloPanel_04",
      "HoloGlobe",
      "HoloGlobeRing",
      "HoloPark_01",
      "HoloPark_02",
      "HoloPark_03",
      "HoloPark_04",
      "HoloPark_05",
      "HoloPark_06",
    ],
  },
  { id: "chair-Seat", src: LIB_SRC.chair, file: "office-chair.glb", names: ["Seat", "SeatPad"] },
  { id: "chair-Back", src: LIB_SRC.chair, file: "office-chair.glb", names: ["BackLower", "BackPad", "BackUpper"] },
  { id: "chair-Arms", src: LIB_SRC.chair, file: "office-chair.glb", names: ["Arm_L", "Arm_R"] },
  { id: "chair-Stem", src: LIB_SRC.chair, file: "office-chair.glb", names: ["Stem", "StemSleeve", "Hub", "Mech"] },
  { id: "chair-Base", src: LIB_SRC.chair, file: "office-chair.glb", names: [...SPOKES, ...CASTERS] },
  { id: "wtc-Seat", src: LIB_SRC.whiteTealChair, file: "white-teal-chair.glb", names: ["Seat", "SeatUnderside"] },
  { id: "wtc-Back", src: LIB_SRC.whiteTealChair, file: "white-teal-chair.glb", names: ["Back", "BackBracket"] },
  { id: "wtc-Arms", src: LIB_SRC.whiteTealChair, file: "white-teal-chair.glb", names: ["ArmPad_L", "ArmPost_L", "ArmPad_R", "ArmPost_R"] },
  { id: "wtc-Stem", src: LIB_SRC.whiteTealChair, file: "white-teal-chair.glb", names: ["StemHousing", "StemPiston", "StemSleeve", "Mech", "HeightLever", "LeverKnob"] },
  { id: "wtc-Base", src: LIB_SRC.whiteTealChair, file: "white-teal-chair.glb", names: WTC_BASE },
  { id: "human-Head", src: LIB_SRC.person, file: "humanoid-sitting.glb", names: ["Head", "Jaw", "Chin", "Neck", "Hair", "HairFringe", "HairSide_L", "HairSide_R", "HairBack", "HairSpike_L", "HairSpike_R", "Ear_L", "Ear_R", "EyeWhite_L", "EyeWhite_R", "Iris_L", "Iris_R", "Lid_L", "Lid_R", "Highlight_L", "Highlight_R", "Nose", "Lip", "Brow_L", "Brow_R", "Collar", "CollarBand", "CollarLeaf_L", "CollarLeaf_R"] },
  {
    id: "human-Torso",
    src: LIB_SRC.person,
    file: "humanoid-sitting.glb",
    names: ["Torso", "Chest", "Shirt", "ShirtTail", "Pelvis", "SeatMass", "Placket", "Tie", "TieKnot", "TieTip"],
  },
  {
    id: "human-Arms",
    src: LIB_SRC.person,
    file: "humanoid-sitting.glb",
    names: [
      "Shoulder_L",
      "UpperArm_L",
      "Elbow_L",
      "ForeArm_L",
      "Cuff_L",
      "CuffTrim_L",
      "Hand_L",
      "Knuckle_L",
      "Thumb_L",
      "Thumb_Lb",
      "Finger_L_0",
      "Finger_L_0b",
      "Finger_L_0c",
      "Finger_L_1",
      "Finger_L_1b",
      "Finger_L_1c",
      "Finger_L_2",
      "Finger_L_2b",
      "Finger_L_2c",
      "Finger_L_3",
      "Finger_L_3b",
      "Finger_L_3c",
      "Shoulder_R",
      "UpperArm_R",
      "Elbow_R",
      "ForeArm_R",
      "Cuff_R",
      "CuffTrim_R",
      "Hand_R",
      "Knuckle_R",
      "Thumb_R",
      "Thumb_Rb",
      "Finger_R_0",
      "Finger_R_0b",
      "Finger_R_0c",
      "Finger_R_1",
      "Finger_R_1b",
      "Finger_R_1c",
      "Finger_R_2",
      "Finger_R_2b",
      "Finger_R_2c",
      "Finger_R_3",
      "Finger_R_3b",
      "Finger_R_3c",
    ],
  },
  {
    id: "human-Legs",
    src: LIB_SRC.person,
    file: "humanoid-sitting.glb",
    names: [
      "Hip_L",
      "UpperLeg_L",
      "Knee_L",
      "LowerLeg_L",
      "AnkleBall_L",
      "Heel_L",
      "Foot_L",
      "Toe_L",
      "Sole_L",
      "TrouserCuff_L",
      "Hip_R",
      "UpperLeg_R",
      "Knee_R",
      "LowerLeg_R",
      "AnkleBall_R",
      "Heel_R",
      "Foot_R",
      "Toe_R",
      "Sole_R",
      "TrouserCuff_R",
    ],
  },
  { id: "laptop-Base", src: LIB_SRC.laptop, file: "laptop.glb", names: ["Base", "KeyboardDeck"] },
  { id: "laptop-Lid", src: LIB_SRC.laptop, file: "laptop.glb", names: ["ScreenBack", "Screen", "Logo", "Chart_1", "Chart_2", "Chart_3"] },
  { id: "hubPlant", src: LIB_SRC.hubPlant, file: "hub-plant.glb", names: ["PlantPot", "PlantSoil", "PlantBud", "PlantLeaf_01", "PlantLeaf_02", "PlantLeaf_03", "PlantLeaf_04", "PlantLeaf_05", "PlantLeaf_06"] },
  { id: "hubMug", src: LIB_SRC.hubMug, file: "hub-mug.glb", names: ["Cup", "Rim", "Handle"] },
  { id: "shelf-Plinth", src: LIB_SRC.bookshelf, file: "bookshelf-table.glb", names: ["Plinth"] },
  {
    id: "shelf-Carcass",
    src: LIB_SRC.bookshelf,
    file: "bookshelf-table.glb",
    names: [
      "BottomDeck",
      "Top",
      "LeftSide",
      "RightSide",
      "Back",
      "Divider",
      "ShelfBoard",
      "DrawerFront",
      "DrawerPull",
    ],
  },
  { id: "shelf-Binders", src: LIB_SRC.bookshelf, file: "bookshelf-table.glb", names: BINDER_MESHES },
  { id: "shelf-Vitrine", src: LIB_SRC.bookshelf, file: "bookshelf-table.glb", names: ["GlassFront", "GlassLeft"] },
  {
    id: "shelf-Display",
    src: LIB_SRC.bookshelf,
    file: "bookshelf-table.glb",
    names: ["DisplayPodium", "DisplayTowerA", "DisplayTowerB", "DisplayBeacon"],
  },
  {
    id: "shelf-Plant",
    src: LIB_SRC.bookshelf,
    file: "bookshelf-table.glb",
    names: [
      "PlantPot",
      "PlantSoil",
      "PlantBud",
      "PlantLeaf_01",
      "PlantLeaf_02",
      "PlantLeaf_03",
      "PlantLeaf_04",
      "PlantLeaf_05",
      "PlantLeaf_06",
      "PlantLeaf_07",
    ],
  },
  { id: "mass-navy", src: LIB_SRC.massing, file: "digital-massing.glb", names: ["navy"] },
  { id: "mass-mass", src: LIB_SRC.massing, file: "digital-massing.glb", names: ["mass"] },
  { id: "mass-cyan", src: LIB_SRC.massing, file: "digital-massing.glb", names: ["cyan"] },
  { id: "mass-gold", src: LIB_SRC.massing, file: "digital-massing.glb", names: ["gold"] },
  { id: "walker-Head", src: LIB_SRC.walker, file: "walker.glb", names: ["Head", "Jaw", "Chin", "Neck", "Hair", "HairFringe", "HairSide_L", "HairSide_R", "HairBack", "HairSpike_L", "HairSpike_R", "Ear_L", "Ear_R", "EyeWhite_L", "EyeWhite_R", "Iris_L", "Iris_R", "Lid_L", "Lid_R", "Highlight_L", "Highlight_R", "Nose", "Lip", "Brow_L", "Brow_R", "Collar", "CollarLeaf_L", "CollarLeaf_R"] },
  {
    id: "walker-Torso",
    src: LIB_SRC.walker,
    file: "walker.glb",
    names: ["Torso", "Chest", "Shirt", "ShirtTail", "Pelvis", "Placket", "Tie", "TieKnot", "TieTip"],
  },
  {
    id: "walker-Arms",
    src: LIB_SRC.walker,
    file: "walker.glb",
    names: [
      "Shoulder_L",
      "UpperArm_L",
      "Elbow_L",
      "ForeArm_L",
      "Cuff_L",
      "Hand_L",
      "Knuckle_L",
      "Thumb_L",
      "Shoulder_R",
      "UpperArm_R",
      "Elbow_R",
      "ForeArm_R",
      "Cuff_R",
      "Hand_R",
      "Knuckle_R",
      "Thumb_R",
    ],
  },
  {
    id: "walker-Legs",
    src: LIB_SRC.walker,
    file: "walker.glb",
    names: [
      "Hip_L",
      "UpperLeg_L",
      "Knee_L",
      "LowerLeg_L",
      "AnkleBall_L",
      "Foot_L",
      "Sole_L",
      "Toe_L",
      "Hip_R",
      "UpperLeg_R",
      "Knee_R",
      "LowerLeg_R",
      "AnkleBall_R",
      "Foot_R",
      "Sole_R",
      "Toe_R",
    ],
  },
  {
    id: "walker-Briefcase",
    src: LIB_SRC.walker,
    file: "walker.glb",
    names: ["Case", "CaseBand", "Clasp", "Latch_L", "Latch_R", "HandlePost_L", "HandlePost_R", "HandleBar"],
  },
  { id: "leadTable-Top", src: LIB_SRC.leadTable, file: "lead-table.glb", names: ["Top"] },
  { id: "leadTable-Legs", src: LIB_SRC.leadTable, file: "lead-table.glb", names: ["Leg_1", "Leg_2", "Leg_3", "Leg_4"] },
  { id: "leadChair-Seat", src: LIB_SRC.leadChair, file: "lead-chair.glb", names: ["Seat"] },
  { id: "leadChair-Back", src: LIB_SRC.leadChair, file: "lead-chair.glb", names: ["Back"] },
  { id: "leadChair-Base", src: LIB_SRC.leadChair, file: "lead-chair.glb", names: ["Stem", "Base"] },
  {
    id: "leadDash-Arch",
    src: LIB_SRC.leadDashboard,
    file: "lead-dashboard.glb",
    names: ["ArchPodium", "ArchWing", "ArchTower", "ArchWindow_1", "ArchWindow_2", "ArchWindow_3", "ArchWindow_4"],
  },
  {
    id: "leadDash-Struct",
    src: LIB_SRC.leadDashboard,
    file: "lead-dashboard.glb",
    names: [
      "Col_00",
      "Col_01",
      "Col_02",
      "Col_10",
      "Col_11",
      "Col_12",
      "Col_20",
      "Col_21",
      "Col_22",
      "Slab_1",
      "Slab_2",
      "Slab_3",
    ],
  },
  {
    id: "leadDash-Mep",
    src: LIB_SRC.leadDashboard,
    file: "lead-dashboard.glb",
    names: ["MepFootprint", "DuctMain", "PipeGreen", "PipeGold", "AhUnit"],
  },
];

function zoomCamera(controls: OrbitControlsImpl, factor: number) {
  const camera = controls.object as PerspectiveCamera;
  const offset = camera.position.clone().sub(controls.target);
  offset.multiplyScalar(factor);
  const nextLen = offset.length();
  const min = controls.minDistance;
  const max = controls.maxDistance;
  if (nextLen < min) offset.setLength(min);
  if (nextLen > max) offset.setLength(max);
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

export function IsolatedPart({
  src,
  names,
  zoomApiRef,
  seed = 0,
  active = true,
}: {
  src: string;
  names: readonly string[] | "all";
  zoomApiRef?: MutableRefObject<ZoomApi | null>;
  seed?: number;
  active?: boolean;
}) {
  const { scene, animations } = useGLTF(src);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const motionRef = useRef<Group>(null);
  const spec = kitBySrc(src);
  const mixer = spec?.playback === "mixer";
  const key = `${src}:${names === "all" ? "all" : names.join("|")}`;
  const part = useMemo(() => {
    if (mixer) {
      const clone = cloneSkinned(scene);
      stripCharStrays(clone);
      cloneMeshMaterials(clone);
      return clone;
    }
    const clone = isolateMeshes(scene, names);
    if (src.includes("humanoid-sitting")) applyFigureLook(clone, sitterLook(0));
    return clone;
  }, [scene, key, names, src, mixer]);

  useEffect(() => () => disposeMeshMaterials(part), [part]);

  useLayoutEffect(() => {
    if (!zoomApiRef) return;
    zoomApiRef.current = {
      zoomIn: () => {
        const controls = controlsRef.current;
        if (controls) zoomCamera(controls, 0.72);
      },
      zoomOut: () => {
        const controls = controlsRef.current;
        if (controls) zoomCamera(controls, 1.38);
      },
    };
    return () => {
      zoomApiRef.current = null;
    };
  }, [zoomApiRef]);

  return (
    <>
      <color attach="background" args={["#062553"]} />
      <ambientLight intensity={0.58} />
      <hemisphereLight args={["#e8f4fb", "#031733", 0.45]} />
      <directionalLight position={[2.6, 3.4, 2.4]} intensity={1.25} />
      <directionalLight position={[-2.2, 1.6, -1.2]} intensity={0.35} color="#5fc7ec" />
      <Bounds fit margin={1.4} maxDuration={0.35}>
        <Center>
          <group rotation-y={spec?.previewYaw ?? 0}>
            <group ref={motionRef}>
              <primitive object={part} />
            </group>
          </group>
        </Center>
      </Bounds>
      {mixer ? (
        <CharacterMixer root={part} clips={animations} clip={spec?.idle ?? "idle"} active={active} />
      ) : (
        <ModelIdle root={part} seed={seed} active={active} clip={spec?.idle ?? "auto"} bobRef={motionRef} />
      )}
      <ContactShadows position={[0, -0.72, 0]} opacity={0.4} scale={5} blur={2.2} far={3} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom
        zoomSpeed={0.85}
        minDistance={0.35}
        maxDistance={14}
        autoRotate={active && (spec?.orbitSpeed ?? WORLD.defaultOrbitSpeed) !== 0}
        autoRotateSpeed={spec?.orbitSpeed ?? WORLD.defaultOrbitSpeed}
      />
    </>
  );
}
