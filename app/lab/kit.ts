/**
 * Shared 3D kit — one contract so parts snap into a larger scene.
 *
 * - Unit: metres
 * - Floor: y = 0 (casters, feet, table legs)
 * - Front: local +Z (chair back is −Z; sitters look +Z)
 * - Tabletop props: place with onTable("HexTable" | "OctTable" | "LeadTable", x, z)
 * - World pose lives on <LabPart> / the outer group — idle never moves it
 */
export const WORLD = {
  unit: "m",
  forward: "+z",
  hexTableTopY: 0.748,
  octTableTopY: 0.748,
  leadTableTopY: 0.77,
  defaultOrbitSpeed: 0.7,
  slowOrbitSpeed: 0.18,
} as const;

export type IdleClip = "none" | "auto" | "type" | "walk" | "idle" | "float" | "sway" | "lid" | "glow" | "sit" | "hero" | "swivel";

export type Playback = "empty" | "mixer";

export type KitPart = {
  src: string;
  file: string;
  /** floor = stand on y = 0. tabletop = underside sits on a table surface. */
  anchor: "floor" | "tabletop";
  idle: IdleClip;
  orbitSpeed: number;
  /** empty-rig ModelIdle vs skinned AnimationMixer. Default empty. */
  playback?: Playback;
  /** Library tile yaw so travel / face reads on a +Z camera. Hub ignores this. */
  previewYaw?: number;
  /** Top surface Y, if this part is a table. */
  tableTopY?: number;
};

export const KIT = {
  Neobot: {
    src: "/models/neobot.glb?v=2",
    file: "neobot.glb",
    anchor: "floor",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  HexTable: {
    src: "/models/hex-table.glb?v=blender-3",
    file: "hex-table.glb",
    anchor: "floor",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
    tableTopY: WORLD.hexTableTopY,
  },
  OctTable: {
    src: "/models/oct-table.glb?v=blender-2",
    file: "oct-table.glb",
    anchor: "floor",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
    tableTopY: WORLD.octTableTopY,
  },
  OfficeChair: {
    src: "/models/office-chair.glb?v=blender-4",
    file: "office-chair.glb",
    anchor: "floor",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  WhiteTealChair: {
    src: "/models/white-teal-chair.glb?v=1",
    file: "white-teal-chair.glb",
    anchor: "floor",
    idle: "swivel",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  HumanoidSitting: {
    src: "/models/humanoid-sitting.glb?v=human-4",
    file: "humanoid-sitting.glb",
    anchor: "floor",
    idle: "type",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  Laptop: {
    src: "/models/laptop.glb?v=blender-1",
    file: "laptop.glb",
    anchor: "tabletop",
    idle: "lid",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  HubPlant: {
    src: "/models/hub-plant.glb?v=blender-1",
    file: "hub-plant.glb",
    anchor: "tabletop",
    idle: "sway",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  HubMug: {
    src: "/models/hub-mug.glb?v=blender-1",
    file: "hub-mug.glb",
    anchor: "tabletop",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  HoloCity: {
    src: "/models/holo-city.glb?v=blender-4",
    file: "holo-city.glb",
    anchor: "tabletop",
    idle: "float",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  BookshelfTable: {
    src: "/models/bookshelf-table.glb?v=blender-1",
    file: "bookshelf-table.glb",
    anchor: "floor",
    idle: "sway",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  DigitalMassing: {
    src: "/models/digital-massing.glb?v=blender-1",
    file: "digital-massing.glb",
    anchor: "floor",
    idle: "none",
    orbitSpeed: WORLD.slowOrbitSpeed,
  },
  Walker: {
    src: "/models/walker.glb?v=human-3",
    file: "walker.glb",
    anchor: "floor",
    idle: "walk",
    orbitSpeed: 0,
    previewYaw: -0.72,
  },
  LeadTable: {
    src: "/models/lead-table.glb?v=blender-1",
    file: "lead-table.glb",
    anchor: "floor",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
    tableTopY: WORLD.leadTableTopY,
  },
  LeadChair: {
    src: "/models/lead-chair.glb?v=blender-1",
    file: "lead-chair.glb",
    anchor: "floor",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  LeadFigurePoint: {
    src: "/models/lead-figure-point.glb?v=human-3",
    file: "lead-figure-point.glb",
    anchor: "floor",
    idle: "idle",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  LeadFigureHardhat: {
    src: "/models/lead-figure-hardhat.glb?v=human-3",
    file: "lead-figure-hardhat.glb",
    anchor: "floor",
    idle: "type",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  LeadFigureSit: {
    src: "/models/lead-figure-sit.glb?v=human-3",
    file: "lead-figure-sit.glb",
    anchor: "floor",
    idle: "type",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  LeadFigureStandTablet: {
    src: "/models/lead-figure-stand-tablet.glb?v=human-3",
    file: "lead-figure-stand-tablet.glb",
    anchor: "floor",
    idle: "idle",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  VinylShirtTablet: {
    src: "/models/vinyl-shirt-tablet.glb?v=walk-1",
    file: "vinyl-shirt-tablet.glb",
    anchor: "floor",
    idle: "walk",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  ShirtTieSitter: {
    src: "/models/shirt-tie-sitter.glb?v=sheet-1",
    file: "shirt-tie-sitter.glb",
    anchor: "floor",
    idle: "idle",
    playback: "mixer",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  LeadFigureStandPlans: {
    src: "/models/lead-figure-stand-plans.glb?v=human-3",
    file: "lead-figure-stand-plans.glb",
    anchor: "floor",
    idle: "idle",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  LeadLaptop: {
    src: "/models/lead-laptop.glb?v=blender-1",
    file: "lead-laptop.glb",
    anchor: "tabletop",
    idle: "lid",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  LeadMug: {
    src: "/models/lead-mug.glb?v=blender-1",
    file: "lead-mug.glb",
    anchor: "tabletop",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  LeadNotebook: {
    src: "/models/lead-notebook.glb?v=blender-1",
    file: "lead-notebook.glb",
    anchor: "tabletop",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  LeadBlueprints: {
    src: "/models/lead-blueprints.glb?v=blender-1",
    file: "lead-blueprints.glb",
    anchor: "tabletop",
    idle: "none",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  LeadDashboard: {
    src: "/models/lead-dashboard.glb?v=blender-1",
    file: "lead-dashboard.glb",
    anchor: "floor",
    idle: "float",
    orbitSpeed: WORLD.defaultOrbitSpeed,
  },
  CharNavyBomber: {
    src: "/models/char-navy-bomber.glb?v=char-4",
    file: "char-navy-bomber.glb",
    anchor: "floor",
    idle: "idle",
    playback: "mixer",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  CharTealHeadphones: {
    src: "/models/char-teal-headphones.glb?v=char-4",
    file: "char-teal-headphones.glb",
    anchor: "floor",
    idle: "idle",
    playback: "mixer",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  CharBlueHoodie: {
    src: "/models/char-blue-hoodie.glb?v=char-4",
    file: "char-blue-hoodie.glb",
    anchor: "floor",
    idle: "idle",
    playback: "mixer",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  CharPurpleBun: {
    src: "/models/char-purple-bun.glb?v=char-4",
    file: "char-purple-bun.glb",
    anchor: "floor",
    idle: "idle",
    playback: "mixer",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  CharOrangeVarsity: {
    src: "/models/char-orange-varsity.glb?v=char-4",
    file: "char-orange-varsity.glb",
    anchor: "floor",
    idle: "idle",
    playback: "mixer",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  CharTanDreads: {
    src: "/models/char-tan-dreads.glb?v=char-4",
    file: "char-tan-dreads.glb",
    anchor: "floor",
    idle: "idle",
    playback: "mixer",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  CharWhiteGlasses: {
    src: "/models/char-white-glasses.glb?v=char-4",
    file: "char-white-glasses.glb",
    anchor: "floor",
    idle: "idle",
    playback: "mixer",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  CharLead: {
    src: "/models/char-lead-white-coat.glb?v=char-3",
    file: "char-lead-white-coat.glb",
    anchor: "floor",
    idle: "idle",
    playback: "mixer",
    orbitSpeed: WORLD.slowOrbitSpeed,
    previewYaw: 0.35,
  },
  ParticleBrain: {
    src: "/models/particle-brain.glb?v=5",
    file: "particle-brain.glb",
    anchor: "floor",
    idle: "none",
    orbitSpeed: WORLD.slowOrbitSpeed,
  },
} as const satisfies Record<string, KitPart>;

export type KitId = keyof typeof KIT;

export const KIT_ORDER = [
  "Neobot",
  "ShirtTieSitter",
  "WhiteTealChair",
  "VinylShirtTablet",
  "OctTable",
  "OfficeChair",
  "HoloCity",
  "Laptop",
  "CharNavyBomber",
  "CharTealHeadphones",
  "CharBlueHoodie",
  "CharPurpleBun",
  "CharOrangeVarsity",
  "CharTanDreads",
  "CharWhiteGlasses",
  "CharLead",
  "HexTable",
  "HumanoidSitting",
  "HubPlant",
  "HubMug",
  "BookshelfTable",
  "DigitalMassing",
  "Walker",
  "LeadTable",
  "LeadChair",
  "LeadFigurePoint",
  "LeadFigureHardhat",
  "LeadFigureSit",
  "LeadFigureStandTablet",
  "LeadFigureStandPlans",
  "LeadLaptop",
  "LeadMug",
  "LeadNotebook",
  "LeadBlueprints",
  "LeadDashboard",
] as const satisfies readonly KitId[];

export const LIB_SRC = {
  neobot: KIT.Neobot.src,
  hex: KIT.HexTable.src,
  oct: KIT.OctTable.src,
  chair: KIT.OfficeChair.src,
  whiteTealChair: KIT.WhiteTealChair.src,
  person: KIT.HumanoidSitting.src,
  laptop: KIT.Laptop.src,
  hubPlant: KIT.HubPlant.src,
  hubMug: KIT.HubMug.src,
  holoCity: KIT.HoloCity.src,
  bookshelf: KIT.BookshelfTable.src,
  massing: KIT.DigitalMassing.src,
  walker: KIT.Walker.src,
  leadTable: KIT.LeadTable.src,
  leadChair: KIT.LeadChair.src,
  leadPoint: KIT.LeadFigurePoint.src,
  leadHardhat: KIT.LeadFigureHardhat.src,
  leadSit: KIT.LeadFigureSit.src,
  leadStandTablet: KIT.LeadFigureStandTablet.src,
  vinylShirtTablet: KIT.VinylShirtTablet.src,
  shirtTieSitter: KIT.ShirtTieSitter.src,
  leadStandPlans: KIT.LeadFigureStandPlans.src,
  leadLaptop: KIT.LeadLaptop.src,
  leadMug: KIT.LeadMug.src,
  leadNotebook: KIT.LeadNotebook.src,
  leadBlueprints: KIT.LeadBlueprints.src,
  leadDashboard: KIT.LeadDashboard.src,
  charNavyBomber: KIT.CharNavyBomber.src,
  charTealHeadphones: KIT.CharTealHeadphones.src,
  charBlueHoodie: KIT.CharBlueHoodie.src,
  charPurpleBun: KIT.CharPurpleBun.src,
  charOrangeVarsity: KIT.CharOrangeVarsity.src,
  charTanDreads: KIT.CharTanDreads.src,
  charWhiteGlasses: KIT.CharWhiteGlasses.src,
  charLead: KIT.CharLead.src,
} as const;

export function kitBySrc(src: string) {
  return (Object.values(KIT) as KitPart[]).find((part) => part.src === src);
}

export function kitIdBySrc(src: string): KitId | undefined {
  return KIT_ORDER.find((id) => KIT[id].src === src);
}

/** Yaw so local +Z looks at (toX, toZ) from (fromX, fromZ). */
export function faceYaw(fromX: number, fromZ: number, toX = 0, toZ = 0) {
  return Math.atan2(toX - fromX, toZ - fromZ);
}

export function ringSlot(index: number, count: number, radius: number, offset = Math.PI / 6) {
  const a = (index / count) * Math.PI * 2 + offset;
  const x = Math.sin(a) * radius;
  const z = Math.cos(a) * radius;
  return { x, z, a, yaw: a + Math.PI, position: [x, 0, z] as [number, number, number] };
}

export function onTable(table: "HexTable" | "OctTable" | "LeadTable", x: number, z: number, extraY = 0): [number, number, number] {
  const y =
    table === "HexTable" ? WORLD.hexTableTopY : table === "OctTable" ? WORLD.octTableTopY : WORLD.leadTableTopY;
  return [x, y + extraY, z];
}
