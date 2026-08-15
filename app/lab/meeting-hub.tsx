"use client";

import { LabPart } from "./lab-part";
import { onTable, ringSlot, type KitId } from "./kit";

export const OCT_SEATS = 8;
/** Face-aligned octagon (OCT_ROT); offset 0 puts chairs on flats, not corners. */
export const OCT_SLOT_OFFSET = 0;
/** Circumradius 1.50, apothem ≈ 1.386; chairs tucked under the overhang. */
export const OCT_CHAIR_R = 1.64;
export const OCT_LAPTOP_R = 1.08;
export const OCT_REMOTE_SEAT = 7;
/** Hover the hex campus above the well — larger than the hole, slow bob. */
export const OCT_HOLO_DROP = 0.13;
export const OCT_HOLO_SCALE = 1.52;

export const HUB_CHAR_IDS = [
  "CharNavyBomber",
  "CharTealHeadphones",
  "CharBlueHoodie",
  "CharPurpleBun",
  "CharOrangeVarsity",
  "CharTanDreads",
  "CharWhiteGlasses",
] as const satisfies readonly KitId[];

function octSlot(index: number, radius: number) {
  return ringSlot(index, OCT_SEATS, radius, OCT_SLOT_OFFSET);
}

function OctSeat({ index }: { index: number }) {
  const chair = octSlot(index, OCT_CHAIR_R);
  const isRemote = index === OCT_REMOTE_SEAT;
  const charId = isRemote ? null : HUB_CHAR_IDS[index];
  return (
    <group>
      <LabPart id="OfficeChair" seed={index * 0.41} position={chair.position} rotationY={chair.yaw} pick={false} />
      {charId ? (
        <LabPart id={charId} seed={index * 0.73} position={chair.position} rotationY={chair.yaw} clip="sit" glowOnHover>
          <mesh visible={false} position={[0, 0.42, 0.02]}>
            <capsuleGeometry args={[0.2, 0.38, 4, 8]} />
          </mesh>
        </LabPart>
      ) : (
        <LabPart
          id="Laptop"
          seed={index * 0.29}
          position={onTable("OctTable", octSlot(index, OCT_LAPTOP_R).x, octSlot(index, OCT_LAPTOP_R).z)}
          rotationY={chair.yaw}
          clip="none"
          pick={false}
        />
      )}
    </group>
  );
}

/** Octagon table + 8 chairs + 7 sitters + 1 remote laptop + hologram well. */
export function MeetingHub({ holoHover = true }: { holoHover?: boolean }) {
  return (
    <group>
      <LabPart id="OctTable" pick={false} />
      <LabPart
        id="HoloCity"
        position={onTable("OctTable", 0, 0, OCT_HOLO_DROP)}
        scale={OCT_HOLO_SCALE}
        glowOnHover={holoHover}
        glowColor="#5fc7ec"
        shadows={false}
      >
        <mesh visible={false} position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.32, 12]} />
        </mesh>
      </LabPart>
      {Array.from({ length: OCT_SEATS }, (_, i) => (
        <OctSeat key={i} index={i} />
      ))}
    </group>
  );
}
