"""Hard-surface gloss-black robot for the /lab/neobot study.

Author in Three.js metres (Y up, +Z forward). Floor y = 0.
Named empties Chest / Breath / Head stay in the GLB so the web scene can
rotate them for look-at without an armature.
"""

from __future__ import annotations

import math

import bpy
from mathutils import Vector

from core import (
    add_capsule,
    add_cylinder,
    add_empty,
    add_hex,
    add_round,
    add_sphere,
    add_torus,
    bloc,
    make_material,
)

FILE = "neobot.glb"

CHEST_Y = 1.00
NECK_Y = 1.40
HEAD_Y = 1.475

HIP = (0.105, 0.86, 0.0)
KNEE = (0.112, 0.455, 0.012)
ANKLE = (0.108, 0.115, 0.006)
SHOULDER = (0.222, 1.315, 0.0)
ELBOW = (0.272, 1.02, 0.018)
WRIST = (0.30, 0.755, 0.042)


def _local(point, pivot_y):
    return (point[0], point[1] - pivot_y, point[2])


def _mirror(point, side):
    return (point[0] * side, point[1], point[2])


def _gloss(name, color, roughness=0.22, metal=0.0, coat=1.0, coat_rough=0.05, emission=None, emission_strength=0.0):
    mat = make_material(name, color, roughness=roughness, metalness=metal, emission=emission, emission_strength=emission_strength)
    bsdf = next((node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if bsdf:
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = coat
        if "Coat Roughness" in bsdf.inputs:
            bsdf.inputs["Coat Roughness"].default_value = coat_rough
    return mat


def _bone(parent, name, start, end, radius, mat):
    """Capsule along start→end, parented to an aim empty at the midpoint."""
    sx, sy, sz = start
    ex, ey, ez = end
    dx, dy, dz = ex - sx, ey - sy, ez - sz
    span = math.sqrt(dx * dx + dy * dy + dz * dz)
    mx, my, mz = (sx + ex) * 0.5, (sy + ey) * 0.5, (sz + ez) * 0.5
    pivot = add_empty(parent, f"{name}Aim", x=mx, y=my, z=mz)
    bpy.context.view_layer.update()
    direction = Vector(bloc(dx, dy, dz))
    if direction.length > 1e-8:
        pivot.rotation_euler = direction.normalized().to_track_quat("Z", "Y").to_euler()
    add_capsule(pivot, name, radius, max(span - 2.0 * radius, 0.012), mat=mat)
    return pivot


def _arm(chest, side, shell, joint, visor):
    tag = "L" if side < 0 else "R"
    shoulder = _local(_mirror(SHOULDER, side), CHEST_Y)
    elbow = _local(_mirror(ELBOW, side), CHEST_Y)
    wrist = _local(_mirror(WRIST, side), CHEST_Y)
    add_sphere(chest, f"Shoulder_{tag}", 0.074, x=shoulder[0], y=shoulder[1], z=shoulder[2], mat=shell)
    add_round(
        chest,
        f"Pauldron_{tag}",
        w=0.155,
        h=0.072,
        d=0.16,
        x=shoulder[0] + 0.02 * side,
        y=shoulder[1] + 0.028,
        z=shoulder[2] - 0.01,
        radius=0.03,
        mat=shell,
    )
    upper = _bone(chest, f"UpperArm_{tag}", shoulder, elbow, 0.055, shell)
    add_round(upper, f"UpperPlate_{tag}", w=0.078, h=0.14, d=0.05, z=0.042, radius=0.016, mat=visor)
    add_sphere(chest, f"Elbow_{tag}", 0.048, x=elbow[0], y=elbow[1], z=elbow[2], mat=joint)
    _bone(chest, f"ForeArm_{tag}", elbow, wrist, 0.058, shell)
    add_sphere(chest, f"Wrist_{tag}", 0.042, x=wrist[0], y=wrist[1], z=wrist[2], mat=joint)
    hand = add_round(
        chest,
        f"Hand_{tag}",
        w=0.07,
        h=0.112,
        d=0.05,
        x=wrist[0] + 0.006 * side,
        y=wrist[1] - 0.078,
        z=wrist[2] + 0.006,
        radius=0.022,
        mat=shell,
    )
    for i, ox in enumerate((-0.018, 0.0, 0.018)):
        add_capsule(hand, f"Finger_{tag}{i + 1}", 0.009, 0.032, x=ox, y=-0.068, z=0.004, mat=shell)


def _leg(root, side, shell, joint, visor, groove):
    tag = "L" if side < 0 else "R"
    hip = _mirror(HIP, side)
    knee = _mirror(KNEE, side)
    ankle = _mirror(ANKLE, side)
    add_sphere(root, f"Hip_{tag}", 0.084, x=hip[0], y=hip[1], z=hip[2], mat=shell)
    thigh = _bone(root, f"UpperLeg_{tag}", hip, knee, 0.08, shell)
    add_round(thigh, f"ThighPlate_{tag}", w=0.11, h=0.2, d=0.055, z=0.055, radius=0.02, mat=visor)
    add_round(thigh, f"ThighSeam_{tag}", w=0.014, h=0.16, d=0.012, z=0.084, radius=0.004, mat=groove)
    add_sphere(root, f"Knee_{tag}", 0.064, x=knee[0], y=knee[1], z=knee[2], mat=joint)
    shin = _bone(root, f"LowerLeg_{tag}", knee, ankle, 0.062, shell)
    add_round(shin, f"ShinPlate_{tag}", w=0.09, h=0.16, d=0.045, z=0.048, radius=0.016, mat=visor)
    add_round(
        root,
        f"Foot_{tag}",
        w=0.128,
        h=0.078,
        d=0.248,
        x=ankle[0],
        y=0.042,
        z=ankle[2] + 0.05,
        radius=0.032,
        mat=shell,
    )
    add_round(
        root,
        f"Sole_{tag}",
        w=0.12,
        h=0.016,
        d=0.236,
        x=ankle[0],
        y=0.008,
        z=ankle[2] + 0.05,
        radius=0.006,
        mat=groove,
    )


def _head(head, shell, visor, joint, eye):
    y = HEAD_Y - NECK_Y
    add_sphere(head, "Cranium", 0.138, y=y, mat=shell)
    add_round(head, "Visor", w=0.22, h=0.12, d=0.055, y=y + 0.008, z=0.102, radius=0.04, mat=visor)
    add_round(head, "VisorBar", w=0.18, h=0.014, d=0.014, y=y + 0.008, z=0.128, radius=0.005, mat=joint)
    for side, name in ((-1, "Eye_L"), (1, "Eye_R")):
        orb = add_sphere(head, name, 0.014, x=0.042 * side, y=y + 0.014, z=0.132, mat=eye)
        orb.scale = (2.1, 0.42, 0.55)
    add_cylinder(head, "Neck", 0.048, 0.056, 0.072, y=y - 0.132, mat=joint)
    add_torus(head, "Collar", 0.062, 0.011, y=y - 0.09, mat=joint)


def _torso(breath, shell, visor, groove, cyan):
    add_round(breath, "ChestHull", w=0.41, h=0.43, d=0.26, y=0.20, radius=0.11, mat=shell)
    add_round(breath, "SpinePlate", w=0.16, h=0.28, d=0.04, y=0.18, z=-0.125, radius=0.018, mat=visor)
    add_round(breath, "Sternum", w=0.17, h=0.22, d=0.048, y=0.19, z=0.118, radius=0.02, mat=visor)
    add_round(breath, "ChestGrooveH", w=0.30, h=0.01, d=0.03, y=0.105, z=0.128, radius=0.003, mat=groove)
    add_round(breath, "ChestGrooveV", w=0.01, h=0.20, d=0.03, y=0.21, z=0.128, radius=0.003, mat=groove)
    for side, name in ((-1, "Pec_L"), (1, "Pec_R")):
        add_round(
            breath,
            name,
            w=0.13,
            h=0.145,
            d=0.042,
            x=0.095 * side,
            y=0.255,
            z=0.122,
            radius=0.02,
            mat=shell,
        )
    for i, (x, y) in enumerate(((-0.055, 0.155), (0.055, 0.155), (-0.055, 0.085), (0.055, 0.085))):
        add_hex(breath, f"Vent_{i + 1}", 0.016, 0.01, x=x, y=y, z=0.148, mat=cyan)


def build(mat):
    shell = _gloss("NeobotShell", "#0b0b0e", roughness=0.24, metal=0.0, coat=1.0, coat_rough=0.05)
    visor = _gloss("NeobotVisor", "#05060c", roughness=0.06, metal=0.12, coat=1.0, coat_rough=0.02)
    joint = _gloss("NeobotJoint", "#191c22", roughness=0.36, metal=0.86, coat=0.35, coat_rough=0.18)
    groove = _gloss("NeobotGroove", "#050507", roughness=0.55, metal=0.18, coat=0.15, coat_rough=0.4)
    eye = _gloss(
        "NeobotEye",
        "#0b0b0e",
        roughness=0.28,
        metal=0.0,
        coat=0.6,
        coat_rough=0.12,
        emission="#5fc7ec",
        emission_strength=2.4,
    )
    cyan = mat["cyan"]

    root = add_empty(None, "Neobot")
    for side in (-1, 1):
        _leg(root, side, shell, joint, visor, groove)

    add_round(root, "Pelvis", w=0.30, h=0.20, d=0.21, y=0.905, radius=0.07, mat=shell)
    add_round(root, "PelvisGroove", w=0.22, h=0.01, d=0.04, y=0.905, z=0.108, radius=0.003, mat=groove)

    chest = add_empty(root, "Chest", x=0.0, y=CHEST_Y, z=0.0)
    add_cylinder(chest, "Waist", 0.09, 0.098, 0.1, y=0.02, mat=joint)
    add_torus(chest, "WaistRing", 0.102, 0.01, y=0.02, mat=joint)

    breath = add_empty(chest, "Breath")
    _torso(breath, shell, visor, groove, cyan)

    for side in (-1, 1):
        _arm(chest, side, shell, joint, visor)

    head = add_empty(chest, "Head", x=0.0, y=NECK_Y - CHEST_Y, z=0.0)
    _head(head, shell, visor, joint, eye)
    return root
