"""Reconstruct vinyl roster figures from the multi-view sheet.

Blender Z-up, floor z=0, face −Y. Bind in a mild A-pose. Clips:
Idle = standing breathe, Hero = sheet pose 5, Sit = seated (hub).
"""

from __future__ import annotations

import math
import os

import bmesh
import bpy
from mathutils import Vector

from characters import prim
from characters.export_character import export_character_glb
from core import make_material, reset_scene

SPECS = {
    "navy-bomber": {
        "file": "char-navy-bomber.glb",
        "body": "male",
        "hair": "spike",
        "wardrobe": "bomber",
        "hero": "gesture",
        "accessories": [],
        "colors": {
            "skin": "#f3ebe3",
            "skinDeep": "#d4b09a",
            "hair": "#1a1818",
            "iris": "#3a2418",
            "jacket": "#081c40",
            "sleeve": "#081c40",
            "trim": "#2ec4b6",
            "shirt": "#1a8f88",
            "pants": "#071422",
            "shoes": "#12161c",
            "sole": "#2ec4b6",
            "accent": "#2ec4b6",
            "logo": "#5fc7ec",
        },
    },
    "teal-headphones": {
        "file": "char-teal-headphones.glb",
        "body": "female",
        "hair": "long",
        "wardrobe": "varsity",
        "hero": "stand",
        "accessories": ["headphones"],
        "colors": {
            "skin": "#f6efe6",
            "skinDeep": "#d8b8a8",
            "hair": "#2ec4b6",
            "iris": "#1e4e48",
            "jacket": "#14181c",
            "sleeve": "#1a8f88",
            "trim": "#2ec4b6",
            "shirt": "#2ec4b6",
            "pants": "#12161c",
            "shoes": "#12161c",
            "sole": "#0a0c0e",
            "accent": "#2ec4b6",
            "logo": "#f4f7fa",
        },
    },
    "blue-hoodie": {
        "file": "char-blue-hoodie.glb",
        "body": "male",
        "hair": "blue_spike",
        "wardrobe": "hoodie",
        "hero": "crossed",
        "accessories": ["headphones"],
        "colors": {
            "skin": "#f0e4d8",
            "skinDeep": "#c8a090",
            "hair": "#2a58c4",
            "iris": "#3a2418",
            "jacket": "#163830",
            "sleeve": "#163830",
            "trim": "#5fc7ec",
            "shirt": "#1a2430",
            "pants": "#12161c",
            "shoes": "#12161c",
            "sole": "#e8eef4",
            "accent": "#5fc7ec",
            "logo": "#5fc7ec",
        },
    },
    "purple-bun": {
        "file": "char-purple-bun.glb",
        "body": "female",
        "hair": "bun",
        "wardrobe": "varsity",
        "hero": "tablet",
        "accessories": ["tablet"],
        "colors": {
            "skin": "#eadfd4",
            "skinDeep": "#c8b0a4",
            "hair": "#4b2f9a",
            "iris": "#4a2878",
            "jacket": "#3a2460",
            "sleeve": "#1a1818",
            "trim": "#12161c",
            "shirt": "#c4b0ff",
            "pants": "#1a2430",
            "shoes": "#12161c",
            "sole": "#6b4cff",
            "accent": "#6b4cff",
            "logo": "#f4f7fa",
        },
    },
    "orange-varsity": {
        "file": "char-orange-varsity.glb",
        "body": "male",
        "hair": "orange_spike",
        "wardrobe": "varsity",
        "hero": "tablet",
        "accessories": ["tablet"],
        "colors": {
            "skin": "#efe4d6",
            "skinDeep": "#d0a888",
            "hair": "#f06028",
            "iris": "#4a3220",
            "jacket": "#1a1818",
            "sleeve": "#e24a12",
            "trim": "#e24a12",
            "shirt": "#1a1818",
            "pants": "#1a1818",
            "shoes": "#12161c",
            "sole": "#f4f7fa",
            "accent": "#2ec4b6",
            "logo": "#f4f7fa",
        },
    },
    "tan-dreads": {
        "file": "char-tan-dreads.glb",
        "body": "male",
        "hair": "dreads",
        "wardrobe": "varsity",
        "hero": "tablet",
        "accessories": ["tablet"],
        "colors": {
            "skin": "#7a5238",
            "skinDeep": "#4a3020",
            "hair": "#1a100c",
            "iris": "#2a1810",
            "jacket": "#c4a882",
            "sleeve": "#1a1818",
            "trim": "#1a1818",
            "shirt": "#1a1818",
            "pants": "#12161c",
            "shoes": "#12161c",
            "sole": "#1a1818",
            "accent": "#c4a882",
            "logo": "#1a1818",
        },
    },
    "white-glasses": {
        "file": "char-white-glasses.glb",
        "body": "male",
        "hair": "sidepart",
        "wardrobe": "varsity",
        "hero": "glasses",
        "accessories": ["glasses"],
        "colors": {
            "skin": "#f6efe6",
            "skinDeep": "#d8b8a8",
            "hair": "#1c1a1a",
            "iris": "#4a3220",
            "jacket": "#f4f7fa",
            "sleeve": "#f4f7fa",
            "trim": "#1a1818",
            "shirt": "#1a1818",
            "pants": "#12161c",
            "shoes": "#12161c",
            "sole": "#f4f7fa",
            "accent": "#1a1818",
            "logo": "#f4f7fa",
        },
    },
}


def _hex(name, color, roughness=0.42, metal=0.04, emit=None, emit_s=0.0, sss=0.0):
    mat = make_material(name, color, roughness=roughness, metalness=metal, emission=emit, emission_strength=emit_s)
    if sss <= 0:
        return mat
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        return mat
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = sss
    elif "Subsurface" in bsdf.inputs:
        bsdf.inputs["Subsurface"].default_value = sss
    if "Subsurface Radius" in bsdf.inputs:
        bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.35, 0.2)
    if "Subsurface Color" in bsdf.inputs:
        from core import hex_color

        r, g, b = hex_color(color)
        bsdf.inputs["Subsurface Color"].default_value = (min(1, r * 1.05), g * 0.85, b * 0.75, 1)
    return mat


def palette(spec):
    c = spec["colors"]
    pid = spec["id"]
    return {
        "skin": _hex(f"Skin_{pid}", c["skin"], 0.48, 0.0, sss=0.22),
        "deep": _hex(f"Deep_{pid}", c["skinDeep"], 0.52, 0.0, sss=0.12),
        "hair": _hex(f"Hair_{pid}", c["hair"], 0.28, 0.02),
        "iris": _hex(f"Iris_{pid}", c["iris"], 0.16, 0.08),
        "eye": _hex(f"Eye_{pid}", "#fbf8f4", 0.08, 0.04),
        "pupil": _hex(f"Pupil_{pid}", "#121212", 0.12, 0.02),
        "spec": _hex(f"Spec_{pid}", "#ffffff", 0.05, 0.0),
        "lip": _hex(f"Lip_{pid}", "#c49a92", 0.42, 0.0, sss=0.08),
        "lash": _hex(f"Lash_{pid}", "#1a1412", 0.45, 0.0),
        "jacket": _hex(f"Jacket_{pid}", c["jacket"], 0.52, 0.04),
        "sleeve": _hex(f"Sleeve_{pid}", c.get("sleeve", c["jacket"]), 0.52, 0.04),
        "trim": _hex(f"Trim_{pid}", c.get("trim", c.get("jacketTrim", "#12161c")), 0.40, 0.08),
        "shirt": _hex(f"Shirt_{pid}", c["shirt"], 0.44, 0.02),
        "pants": _hex(f"Pants_{pid}", c["pants"], 0.52, 0.04),
        "shoes": _hex(f"Shoes_{pid}", c["shoes"], 0.38, 0.10),
        "sole": _hex(f"Sole_{pid}", c["sole"], 0.55, 0.02),
        "accent": _hex(f"Accent_{pid}", c["accent"], 0.30, 0.08, emit=c["accent"], emit_s=0.28),
        "logo": _hex(f"Logo_{pid}", c["logo"], 0.22, 0.12, emit=c["logo"], emit_s=0.85),
        "plastic": _hex(f"Plastic_{pid}", "#1a1c1e", 0.28, 0.12),
        "tablet": _hex(f"Tablet_{pid}", "#1a1c22", 0.32, 0.18),
        "screen": _hex(f"Screen_{pid}", "#0a2a48", 0.18, 0.08, emit="#1a6a88", emit_s=0.55),
        "glass": _hex(f"Glass_{pid}", "#1a1a1c", 0.08, 0.4),
    }


def layout(spec):
    female = spec["body"] == "female"
    sx = 0.90 if female else 1.0
    hx = 1.08 if female else 1.0
    return {
        "female": female,
        "head_z": 0.855,
        "head_r": 0.126,
        "head_y": -0.012,
        "chin_z": 0.728,
        "neck_z": 0.702,
        "shoulder_z": 0.642,
        "chest_z": 0.575,
        "hip_z": 0.402,
        "knee_z": 0.215,
        "ankle_z": 0.054,
        "shoulder_x": 0.128 * sx,
        "hip_x": 0.070 * hx,
        "elbow_z": 0.505,
        "hand_z": 0.385,
        "arm_out": 0.072 * sx,
        "hand_out": 0.118 * sx,
        "torso_w": 0.172 * sx,
        "torso_d": 0.098,
        "pelvis_w": 0.152 * hx,
        "arm_r": 0.032 * (0.94 if female else 1.0),
        "leg_r": 0.042 * (0.96 if female else 1.0),
        "shoe_l": 0.118,
    }


def _clean(obj):
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.0004)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.validate()
    prim.shade_smooth(obj)
    return obj


def _limb(name, a, b, radius, mat, segs=22):
    va, vb = Vector(a), Vector(b)
    mid = (va + vb) * 0.5
    delta = vb - va
    length = max(delta.length, 0.03)
    obj = prim.ellipsoid(name, length * 0.62, radius, radius, (mid.x, mid.y, mid.z), mat, segs)
    prim.aim_x(obj, delta)
    prim.apply_scale(obj)
    return obj


def _box(name, size, loc, mat, radius=0.012, segs=3):
    return prim.round_box(name, size, loc, mat, radius=radius, segments=segs)


def _clump(name, rx, ry, rz, loc, mat, segs=18, rot=None):
    obj = prim.ellipsoid(name, rx, ry, rz, loc, mat, segs)
    if rot:
        obj.rotation_euler = rot
        prim.apply_scale(obj)
    return obj


def build_body(L, mats):
    bits = []
    hr, hy, hz = L["head_r"], L["head_y"], L["head_z"]
    bits.append(prim.ellipsoid("Head", hr * 0.96, hr * 0.90, hr * 1.02, (0.0, hy, hz), mats["skin"], 28))
    bits.append(prim.sphere("Ear_L", 0.022, (-hr * 0.92, hy + 0.006, hz - 0.004), mats["skin"], 16))
    bits.append(prim.sphere("Ear_R", 0.022, (hr * 0.92, hy + 0.006, hz - 0.004), mats["skin"], 16))
    bits.append(_box("Torso", (L["torso_w"] * 0.82, L["torso_d"] * 0.78, 0.14), (0.0, 0.014, L["chest_z"] - 0.02), mats["skin"], 0.024))
    bits.append(_box("Pelvis", (L["pelvis_w"] * 0.82, 0.072, 0.08), (0.0, 0.016, L["hip_z"]), mats["skin"], 0.022))
    sx = L["shoulder_x"]
    cover = 0.82
    for side, s in (("L", -1.0), ("R", 1.0)):
        sh = (s * sx, 0.018, L["shoulder_z"])
        el = (s * (sx + L["arm_out"] * 0.55), 0.026, L["elbow_z"])
        hd = (s * (sx + L["hand_out"] * 0.72), 0.032, L["hand_z"])
        bits.append(_limb(f"UpperArm_{side}", sh, el, L["arm_r"] * cover, mats["skin"]))
        bits.append(_limb(f"LowerArm_{side}", el, hd, L["arm_r"] * 0.78, mats["skin"]))
        bits.append(_hand(side, s, hd, mats["skin"]))
        hip = (s * L["hip_x"], 0.018, L["hip_z"] - 0.02)
        kn = (s * L["hip_x"] * 1.04, 0.020, L["knee_z"])
        an = (s * L["hip_x"] * 1.02, 0.014, L["ankle_z"] + 0.02)
        bits.append(_limb(f"UpperLeg_{side}", hip, kn, L["leg_r"] * cover, mats["skin"]))
        bits.append(_limb(f"LowerLeg_{side}", kn, an, L["leg_r"] * 0.78, mats["skin"]))
    return _clean(prim.join_meshes("Body", bits, mats["skin"]))


def _hand(side, s, loc, mat):
    palm = prim.ellipsoid(f"Palm_{side}", 0.028, 0.016, 0.022, loc, mat, 14)
    bits = [palm]
    for i, dz in enumerate((-0.012, -0.002, 0.008, 0.016)):
        start = (loc[0] + s * 0.012, loc[1] - 0.002, loc[2] + dz)
        end = (loc[0] + s * 0.038, loc[1] - 0.010, loc[2] + dz)
        bits.append(_limb(f"Finger_{side}{i}", start, end, 0.0062, mat, 10))
    return prim.join_meshes(f"Hand_{side}", bits, mat)


def build_face(L, mats):
    hr, hy, hz = L["head_r"], L["head_y"], L["head_z"]
    eye_y = hy - hr * 0.78
    eye_z = hz + 0.006
    bits = []
    for side, s in (("L", -1.0), ("R", 1.0)):
        ex = 0.046 * s
        bits.append(prim.ellipsoid(f"EyeWhite_{side}", 0.036, 0.015, 0.028, (ex, eye_y, eye_z), mats["eye"], 20))
        bits.append(prim.ellipsoid(f"Iris_{side}", 0.017, 0.010, 0.017, (ex, eye_y - 0.009, eye_z - 0.002), mats["iris"], 16))
        bits.append(prim.sphere(f"Pupil_{side}", 0.0075, (ex, eye_y - 0.015, eye_z - 0.002), mats["pupil"], 12))
        bits.append(prim.sphere(f"HL_{side}", 0.0048, (ex - 0.008 * s, eye_y - 0.017, eye_z + 0.010), mats["spec"], 8))
        bits.append(_clump(f"Lid_{side}", 0.038, 0.010, 0.009, (ex, eye_y + 0.002, eye_z + 0.018), mats["skin"]))
        bits.append(_clump(f"Lash_{side}", 0.034, 0.004, 0.005, (ex, eye_y - 0.006, eye_z + 0.022), mats["lash"]))
        brow = _clump(f"Brow_{side}", 0.034, 0.007, 0.006, (ex, eye_y + 0.004, eye_z + 0.034), mats["hair"])
        brow.rotation_euler = (0.16, 0.12 * s, 0.18 * s)
        prim.apply_scale(brow)
        bits.append(brow)
    bits.append(prim.ellipsoid("Nose", 0.012, 0.016, 0.014, (0.0, hy - hr * 0.88, hz - 0.016), mats["deep"], 14))
    bits.append(prim.ellipsoid("LipU", 0.016, 0.006, 0.0045, (0.0, hy - hr * 0.82, hz - 0.048), mats["lip"], 12))
    bits.append(prim.ellipsoid("LipL", 0.014, 0.007, 0.0045, (0.0, hy - hr * 0.80, hz - 0.056), mats["lip"], 12))
    return bits


def build_hair(spec, L, mats):
    style = spec["hair"]
    hr, hy, hz = L["head_r"], L["head_y"], L["head_z"]
    mat = mats["hair"]
    bits = [prim.ellipsoid("Scalp", hr * 1.02, hr * 0.92, hr * 0.72, (0.0, hy + 0.012, hz + hr * 0.28), mat, 22)]
    if style in ("spike", "blue_spike", "orange_spike"):
        clumps = [
            (0.078, 0.070, 0.155, (0.0, hy + 0.055, hz + 0.15), (0.95, 0.0, 0.0)),
            (0.065, 0.058, 0.130, (-0.058, hy + 0.040, hz + 0.13), (0.85, 0.0, 0.38)),
            (0.065, 0.058, 0.130, (0.058, hy + 0.040, hz + 0.13), (0.85, 0.0, -0.38)),
            (0.058, 0.072, 0.100, (0.0, hy + 0.095, hz + 0.06), (1.25, 0.0, 0.0)),
            (0.050, 0.052, 0.085, (-0.090, hy + 0.015, hz + 0.05), (0.45, 0.0, 0.72)),
            (0.050, 0.052, 0.085, (0.090, hy + 0.015, hz + 0.05), (0.45, 0.0, -0.72)),
            (0.042, 0.036, 0.055, (-0.048, hy - 0.075, hz + 0.10), (0.28, 0.0, 0.22)),
            (0.042, 0.036, 0.055, (0.048, hy - 0.075, hz + 0.10), (0.28, 0.0, -0.22)),
            (0.048, 0.055, 0.080, (0.0, hy + 0.110, hz - 0.01), (1.35, 0.0, 0.0)),
        ]
        for i, (rx, ry, rz, loc, rot) in enumerate(clumps):
            bits.append(_clump(f"Spike{i}", rx, ry, rz, loc, mat, 16, rot))
    elif style == "long":
        bits.append(_clump("BangM", 0.055, 0.030, 0.040, (0.0, hy - 0.07, hz + 0.06), mat, 16, (0.35, 0, 0)))
        bits.append(_clump("BangL", 0.042, 0.028, 0.038, (-0.055, hy - 0.05, hz + 0.05), mat, 14, (0.3, 0, 0.4)))
        bits.append(_clump("BangR", 0.042, 0.028, 0.038, (0.055, hy - 0.05, hz + 0.05), mat, 14, (0.3, 0, -0.4)))
        bits.append(_clump("SideL", 0.048, 0.055, 0.090, (-0.09, hy + 0.02, hz - 0.02), mat, 16, (0.15, 0, 0.2)))
        bits.append(_clump("SideR", 0.048, 0.055, 0.090, (0.09, hy + 0.02, hz - 0.02), mat, 16, (0.15, 0, -0.2)))
        bits.append(_clump("BackA", 0.070, 0.055, 0.110, (0.0, hy + 0.08, hz - 0.02), mat, 18, (0.4, 0, 0)))
        bits.append(_clump("BackB", 0.062, 0.050, 0.100, (0.0, hy + 0.07, hz - 0.12), mat, 16, (0.55, 0, 0)))
        bits.append(_clump("BackC", 0.048, 0.040, 0.080, (-0.05, hy + 0.06, hz - 0.10), mat, 14, (0.5, 0, 0.25)))
        bits.append(_clump("BackD", 0.048, 0.040, 0.080, (0.05, hy + 0.06, hz - 0.10), mat, 14, (0.5, 0, -0.25)))
    elif style == "bun":
        bits.append(_clump("Fringe", 0.070, 0.040, 0.045, (0.0, hy - 0.04, hz + 0.08), mat, 16, (0.25, 0, 0)))
        bits.append(_clump("SideL", 0.040, 0.045, 0.070, (-0.09, hy + 0.01, hz + 0.02), mat, 14))
        bits.append(_clump("SideR", 0.040, 0.045, 0.070, (0.09, hy + 0.01, hz + 0.02), mat, 14))
        bits.append(prim.sphere("Bun", 0.055, (0.0, hy + 0.04, hz + 0.16), mat, 20))
        bits.append(_clump("BunLock", 0.028, 0.030, 0.040, (0.02, hy + 0.02, hz + 0.20), mat, 12, (0.3, 0, 0.4)))
    elif style == "dreads":
        bits.append(_clump("Crown", 0.090, 0.080, 0.050, (0.0, hy + 0.02, hz + 0.08), mat, 18))
        for i, (x, y, z, rx) in enumerate(
            (
                (-0.05, 0.02, 0.12, 0.022),
                (0.05, 0.02, 0.12, 0.022),
                (0.0, 0.04, 0.13, 0.024),
                (-0.08, 0.00, 0.08, 0.020),
                (0.08, 0.00, 0.08, 0.020),
                (-0.03, -0.04, 0.10, 0.018),
                (0.03, -0.04, 0.10, 0.018),
                (0.0, 0.06, 0.08, 0.020),
            )
        ):
            bits.append(prim.ellipsoid(f"Dread{i}", rx, rx, 0.032, (x, hy + y, hz + z), mat, 12))
    else:
        bits.append(_clump("PartL", 0.070, 0.055, 0.055, (-0.03, hy + 0.01, hz + 0.10), mat, 16, (0.35, 0, 0.15)))
        bits.append(_clump("PartR", 0.055, 0.048, 0.048, (0.05, hy + 0.00, hz + 0.09), mat, 14, (0.3, 0, -0.25)))
        bits.append(_clump("Fringe", 0.050, 0.028, 0.032, (-0.02, hy - 0.06, hz + 0.06), mat, 14, (0.4, 0, 0.1)))
        bits.append(_clump("Back", 0.075, 0.050, 0.055, (0.0, hy + 0.05, hz + 0.04), mat, 16, (0.5, 0, 0)))
    return _clean(prim.join_meshes("Hair", bits, mat))


def _logo(name, loc, mat, size=0.016):
    disc = prim.cylinder(f"{name}_d", size, 0.004, loc, mat, 6)
    disc.rotation_euler = (math.pi / 2, 0, 0)
    prim.apply_scale(disc)
    cube = _box(f"{name}_c", (size * 0.55, size * 0.55, size * 0.55), (loc[0], loc[1] - 0.002, loc[2]), mat, 0.002, 1)
    return prim.join_meshes(name, [disc, cube], mat)


def build_clothes(spec, L, mats):
    kind = spec["wardrobe"]
    out = []
    shirt = _box(
        "Shirt",
        (L["torso_w"] * 0.78, L["torso_d"] * 0.70, 0.150),
        (0.0, -0.028, L["chest_z"] - 0.010),
        mats["shirt"],
        0.020,
    )
    out.append(shirt)
    jacket_core = [
        _box(
            "JacketBody",
            (L["torso_w"] * 1.24, L["torso_d"] * 1.20, 0.255),
            (0.0, 0.020, L["chest_z"] - 0.055),
            mats["jacket"],
            0.030,
        ),
        prim.ellipsoid("Collar", 0.070, 0.058, 0.040, (0.0, 0.006, L["neck_z"] + 0.004), mats["jacket"], 18),
    ]
    if kind == "hoodie":
        jacket_core.append(prim.ellipsoid("Hood", 0.090, 0.070, 0.070, (0.0, 0.04, L["head_z"] - 0.04), mats["jacket"], 18))
    out.append(_clean(prim.join_meshes("Jacket", jacket_core, mats["jacket"])))
    sx = L["shoulder_x"]
    for side, s in (("L", -1.0), ("R", 1.0)):
        sh = (s * (sx - 0.02), 0.022, L["shoulder_z"] - 0.02)
        hd = (s * (sx + L["hand_out"] * 0.62), 0.030, L["hand_z"] + 0.012)
        out.append(_limb(f"Sleeve_{side}", sh, hd, L["arm_r"] * 1.52, mats["sleeve"]))
        out.append(prim.sphere(f"Cuff_{side}", L["arm_r"] * 1.22, hd, mats["trim"], 14))
    out.append(_logo("ChestLogo", (-0.040, -0.058, L["chest_z"] + 0.018), mats["logo"], 0.012))
    out.append(_logo("BackLogo", (0.0, 0.082, L["chest_z"] + 0.008), mats["logo"], 0.020))
    out.append(_logo("SleeveLogo_L", (-sx - 0.05, 0.012, L["shoulder_z"] - 0.08), mats["logo"], 0.011))
    out.append(_logo("SleeveLogo_R", (sx + 0.05, 0.012, L["shoulder_z"] - 0.08), mats["logo"], 0.011))
    pant_bits = [_box("PantsHip", (L["pelvis_w"] * 1.22, 0.108, 0.155), (0.0, 0.018, L["hip_z"] + 0.01), mats["pants"], 0.028)]
    for side, s in (("L", -1.0), ("R", 1.0)):
        hip = (s * L["hip_x"], 0.018, L["hip_z"] + 0.02)
        an = (s * L["hip_x"] * 1.02, 0.012, 0.018)
        pant_bits.append(_limb(f"Pant_{side}", hip, an, L["leg_r"] * 1.38, mats["pants"]))
        pant_bits.append(_box(f"Pocket_{side}", (0.034, 0.022, 0.046), (s * (L["hip_x"] + 0.038), 0.055, L["hip_z"] - 0.04), mats["pants"], 0.006, 2))
    out.append(_clean(prim.join_meshes("Pants", pant_bits, mats["pants"])))
    for side, s in (("L", -1.0), ("R", 1.0)):
        out.append(_box(f"Shoe_{side}", (0.050, L["shoe_l"], 0.048), (s * L["hip_x"] * 1.02, -0.028, 0.028), mats["shoes"], 0.010))
        out.append(_box(f"Sole_{side}", (0.052, L["shoe_l"] * 1.06, 0.016), (s * L["hip_x"] * 1.02, -0.028, 0.008), mats["sole"], 0.006))
        out.append(_box(f"Tongue_{side}", (0.028, 0.040, 0.022), (s * L["hip_x"] * 1.02, -0.055, 0.048), mats["accent"], 0.006, 2))
    return out


def build_accessories(spec, L, mats):
    bits = []
    acc = spec.get("accessories") or []
    hr, hy, hz = L["head_r"], L["head_y"], L["head_z"]
    if "headphones" in acc:
        for side, s in (("L", -1.0), ("R", 1.0)):
            cup = prim.cylinder(f"Cup_{side}", 0.038, 0.028, (s * (hr + 0.012), hy + 0.004, hz + 0.004), mats["plastic"], 20)
            cup.rotation_euler = (0, math.pi / 2, 0)
            prim.apply_scale(cup)
            bits.append(cup)
            ring = prim.torus(f"CupRing_{side}", 0.030, 0.004, (s * (hr + 0.026), hy + 0.004, hz + 0.004), mats["accent"], 18, 8)
            ring.rotation_euler = (0, math.pi / 2, 0)
            prim.apply_scale(ring)
            bits.append(ring)
        band = prim.torus("Headband", hr * 1.08, 0.008, (0.0, hy + 0.01, hz + 0.02), mats["plastic"], 24, 8)
        band.scale = (1.0, 0.72, 1.05)
        prim.apply_scale(band)
        bits.append(band)
    if "glasses" in acc:
        for side, s in (("L", -1.0), ("R", 1.0)):
            frame = _box(f"Lens_{side}", (0.032, 0.004, 0.022), (s * 0.034, hy - hr * 0.80, hz + 0.008), mats["glass"], 0.002, 1)
            bits.append(frame)
        bits.append(_box("Bridge", (0.016, 0.004, 0.008), (0.0, hy - hr * 0.82, hz + 0.010), mats["glass"], 0.001, 1))
        bits.append(_box("Arm_L", (0.004, 0.055, 0.006), (-0.055, hy - 0.04, hz + 0.008), mats["glass"], 0.001, 1))
        bits.append(_box("Arm_R", (0.004, 0.055, 0.006), (0.055, hy - 0.04, hz + 0.008), mats["glass"], 0.001, 1))
    if "tablet" in acc:
        tab = _box("Tablet", (0.072, 0.008, 0.108), (0.12, -0.02, 0.48), mats["tablet"], 0.004, 2)
        bits.append(tab)
        bits.append(_box("Screen", (0.060, 0.002, 0.092), (0.12, -0.025, 0.48), mats["screen"], 0.002, 1))
        bits.append(_logo("TabLogo", (0.12, -0.014, 0.48), mats["logo"], 0.010))
    return bits


def build_armature(L):
    prim.ensure_object_mode()
    data = bpy.data.armatures.new("Armature")
    data.display_type = "OCTAHEDRAL"
    arm = bpy.data.objects.new("Armature", data)
    prim.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    edit = data.edit_bones
    created = {}
    sx, hx = L["shoulder_x"], L["hip_x"]
    rows = [
        ("Root", (0.0, 0.0, 0.0), (0.0, 0.0, 0.08), None),
        ("Hips", (0.0, 0.02, L["hip_z"]), (0.0, 0.02, L["hip_z"] + 0.08), "Root"),
        ("Spine", (0.0, 0.02, L["hip_z"] + 0.08), (0.0, 0.02, 0.52), "Hips"),
        ("Chest", (0.0, 0.02, 0.52), (0.0, 0.02, 0.64), "Spine"),
        ("Neck", (0.0, 0.02, 0.64), (0.0, 0.02, L["neck_z"] + 0.02), "Chest"),
        ("Head", (0.0, 0.02, L["neck_z"] + 0.02), (0.0, 0.02, L["head_z"] + 0.12), "Neck"),
        ("UpperLeg_L", (-hx, 0.02, L["hip_z"]), (-hx, 0.02, L["knee_z"]), "Hips"),
        ("LowerLeg_L", (-hx, 0.02, L["knee_z"]), (-hx, 0.02, L["ankle_z"]), "UpperLeg_L"),
        ("Foot_L", (-hx, 0.02, L["ankle_z"]), (-hx, -0.08, 0.02), "LowerLeg_L"),
        ("UpperLeg_R", (hx, 0.02, L["hip_z"]), (hx, 0.02, L["knee_z"]), "Hips"),
        ("LowerLeg_R", (hx, 0.02, L["knee_z"]), (hx, 0.02, L["ankle_z"]), "UpperLeg_R"),
        ("Foot_R", (hx, 0.02, L["ankle_z"]), (hx, -0.08, 0.02), "LowerLeg_R"),
        ("Shoulder_L", (0.0, 0.02, L["shoulder_z"]), (-sx, 0.02, L["shoulder_z"]), "Chest"),
        ("UpperArm_L", (-sx, 0.02, L["shoulder_z"]), (-(sx + L["arm_out"] * 0.55), 0.03, L["elbow_z"]), "Shoulder_L"),
        ("LowerArm_L", (-(sx + L["arm_out"] * 0.55), 0.03, L["elbow_z"]), (-(sx + L["hand_out"] * 0.72), 0.04, L["hand_z"]), "UpperArm_L"),
        ("Hand_L", (-(sx + L["hand_out"] * 0.72), 0.04, L["hand_z"]), (-(sx + L["hand_out"] * 0.72 + 0.06), 0.04, L["hand_z"] - 0.02), "LowerArm_L"),
        ("Shoulder_R", (0.0, 0.02, L["shoulder_z"]), (sx, 0.02, L["shoulder_z"]), "Chest"),
        ("UpperArm_R", (sx, 0.02, L["shoulder_z"]), (sx + L["arm_out"] * 0.55, 0.03, L["elbow_z"]), "Shoulder_R"),
        ("LowerArm_R", (sx + L["arm_out"] * 0.55, 0.03, L["elbow_z"]), (sx + L["hand_out"] * 0.72, 0.04, L["hand_z"]), "UpperArm_R"),
        ("Hand_R", (sx + L["hand_out"] * 0.72, 0.04, L["hand_z"]), (sx + L["hand_out"] * 0.72 + 0.06, 0.04, L["hand_z"] - 0.02), "LowerArm_R"),
    ]
    for name, head, tail, parent in rows:
        bone = edit.new(name)
        bone.head = Vector(head)
        bone.tail = Vector(tail)
        bone.use_connect = False
        if parent:
            bone.parent = created[parent]
        created[name] = bone
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"
    return arm


def bind(arm, meshes, head_lock):
    prim.ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")
    for mesh in meshes:
        if mesh is None:
            continue
        mesh.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    for mesh in head_lock:
        if mesh is None:
            continue
        for vg in list(mesh.vertex_groups):
            mesh.vertex_groups.remove(vg)
        group = mesh.vertex_groups.new(name="Head")
        group.add([v.index for v in mesh.data.vertices], 1.0, "REPLACE")


def _pb(arm, name):
    return arm.pose.bones.get(name)


def _key(arm, frame):
    for pb in arm.pose.bones:
        pb.keyframe_insert(data_path="location", frame=frame)
        pb.keyframe_insert(data_path="rotation_euler", frame=frame)


def _clear(arm):
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.pose.transforms_clear()


def _assign(arm, action):
    if arm.animation_data is None:
        arm.animation_data_create()
    arm.animation_data.action = action
    if hasattr(arm.animation_data, "action_slot") and getattr(action, "slots", None):
        try:
            arm.animation_data.action_slot = action.slots[0]
        except Exception:
            pass


def _push(arm, action, name):
    if arm.animation_data is None:
        arm.animation_data_create()
    track = arm.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, int(action.frame_range[0]), action)
    strip.name = name


def apply_sit(arm, L):
    lift = 0.50 - L["hip_z"]
    hips = _pb(arm, "Hips")
    if hips:
        hips.location = (0.0, 0.04, lift)
        hips.rotation_euler = (math.radians(12), 0, 0)
    if _pb(arm, "Spine"):
        _pb(arm, "Spine").rotation_euler = (math.radians(8), 0, 0)
    if _pb(arm, "Chest"):
        _pb(arm, "Chest").rotation_euler = (math.radians(4), 0, 0)
    if _pb(arm, "Head"):
        _pb(arm, "Head").rotation_euler = (math.radians(6), 0, 0)
    for side, sign in (("L", -1.0), ("R", 1.0)):
        if _pb(arm, f"UpperLeg_{side}"):
            _pb(arm, f"UpperLeg_{side}").rotation_euler = (math.radians(-78), 0, math.radians(6) * sign)
        if _pb(arm, f"LowerLeg_{side}"):
            _pb(arm, f"LowerLeg_{side}").rotation_euler = (math.radians(82), 0, 0)
        if _pb(arm, f"Foot_{side}"):
            _pb(arm, f"Foot_{side}").rotation_euler = (math.radians(-8), 0, 0)
        if _pb(arm, f"UpperArm_{side}"):
            _pb(arm, f"UpperArm_{side}").rotation_euler = (math.radians(32), math.radians(16) * sign, math.radians(10) * sign)
        if _pb(arm, f"LowerArm_{side}"):
            _pb(arm, f"LowerArm_{side}").rotation_euler = (math.radians(38), 0, 0)


def apply_idle(arm, t):
    if _pb(arm, "Spine"):
        _pb(arm, "Spine").rotation_euler = (t * 0.03, t * 0.012, 0)
    if _pb(arm, "Chest"):
        _pb(arm, "Chest").location = (0.0, 0.0, t * 0.005)
        _pb(arm, "Chest").rotation_euler = (t * 0.02, 0, 0)
    if _pb(arm, "Head"):
        _pb(arm, "Head").rotation_euler = (t * 0.025, t * 0.05, 0)
    if _pb(arm, "Hips"):
        _pb(arm, "Hips").rotation_euler = (0, 0, t * 0.018)
    for side, sign in (("L", -1.0), ("R", 1.0)):
        if _pb(arm, f"UpperArm_{side}"):
            _pb(arm, f"UpperArm_{side}").rotation_euler = (t * 0.02, math.radians(4) * sign, t * 0.015 * sign)
        if _pb(arm, f"UpperLeg_{side}"):
            _pb(arm, f"UpperLeg_{side}").rotation_euler = (t * 0.012 * sign, 0, 0)


def apply_hero(arm, kind, t=1.0):
    apply_idle(arm, t * 0.25)
    if kind == "gesture":
        if _pb(arm, "UpperArm_R"):
            _pb(arm, "UpperArm_R").rotation_euler = (math.radians(-18), math.radians(8), math.radians(55))
        if _pb(arm, "LowerArm_R"):
            _pb(arm, "LowerArm_R").rotation_euler = (math.radians(22), 0, math.radians(-12))
        if _pb(arm, "Hand_R"):
            _pb(arm, "Hand_R").rotation_euler = (math.radians(-20), math.radians(10), math.radians(8))
        if _pb(arm, "Head"):
            _pb(arm, "Head").rotation_euler = (math.radians(4), math.radians(-12), 0)
        if _pb(arm, "Spine"):
            _pb(arm, "Spine").rotation_euler = (math.radians(4), math.radians(-6), 0)
    elif kind == "crossed":
        if _pb(arm, "UpperArm_L"):
            _pb(arm, "UpperArm_L").rotation_euler = (math.radians(70), math.radians(-18), math.radians(-28))
        if _pb(arm, "LowerArm_L"):
            _pb(arm, "LowerArm_L").rotation_euler = (math.radians(85), 0, math.radians(20))
        if _pb(arm, "UpperArm_R"):
            _pb(arm, "UpperArm_R").rotation_euler = (math.radians(62), math.radians(22), math.radians(32))
        if _pb(arm, "LowerArm_R"):
            _pb(arm, "LowerArm_R").rotation_euler = (math.radians(90), 0, math.radians(-18))
        if _pb(arm, "Chest"):
            _pb(arm, "Chest").rotation_euler = (math.radians(6), 0, 0)
    elif kind == "tablet":
        if _pb(arm, "UpperArm_L"):
            _pb(arm, "UpperArm_L").rotation_euler = (math.radians(48), math.radians(-12), math.radians(-18))
        if _pb(arm, "LowerArm_L"):
            _pb(arm, "LowerArm_L").rotation_euler = (math.radians(55), 0, math.radians(10))
        if _pb(arm, "Hand_L"):
            _pb(arm, "Hand_L").rotation_euler = (math.radians(-8), math.radians(18), 0)
        if _pb(arm, "UpperArm_R"):
            _pb(arm, "UpperArm_R").rotation_euler = (math.radians(40), math.radians(8), math.radians(22))
        if _pb(arm, "LowerArm_R"):
            _pb(arm, "LowerArm_R").rotation_euler = (math.radians(48), 0, 0)
        if _pb(arm, "Head"):
            _pb(arm, "Head").rotation_euler = (math.radians(16), math.radians(8), 0)
    elif kind == "glasses":
        if _pb(arm, "UpperArm_L"):
            _pb(arm, "UpperArm_L").rotation_euler = (math.radians(-8), math.radians(-6), math.radians(-70))
        if _pb(arm, "LowerArm_L"):
            _pb(arm, "LowerArm_L").rotation_euler = (math.radians(95), 0, math.radians(8))
        if _pb(arm, "Hand_L"):
            _pb(arm, "Hand_L").rotation_euler = (math.radians(12), 0, math.radians(-20))
        if _pb(arm, "Head"):
            _pb(arm, "Head").rotation_euler = (math.radians(-4), math.radians(10), math.radians(-6))
    else:
        if _pb(arm, "UpperArm_L"):
            _pb(arm, "UpperArm_L").rotation_euler = (math.radians(8), math.radians(-4), math.radians(-6))
        if _pb(arm, "Head"):
            _pb(arm, "Head").rotation_euler = (0, math.radians(6), 0)


def build_clips(arm, spec, L):
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    scene = bpy.context.scene
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 48
    hero_kind = spec.get("hero") or "stand"

    sit = bpy.data.actions.new("Sit")
    _assign(arm, sit)
    _clear(arm)
    apply_sit(arm, L)
    _key(arm, 1)
    _key(arm, 24)

    idle = bpy.data.actions.new("Idle")
    _assign(arm, idle)
    for frame, amt in ((1, 0.0), (12, 1.0), (24, 0.0), (36, -0.85), (48, 0.0)):
        _clear(arm)
        apply_idle(arm, amt)
        _key(arm, frame)

    hero = bpy.data.actions.new("Hero")
    _assign(arm, hero)
    for frame, amt in ((1, 0.85), (16, 1.0), (32, 0.9), (48, 0.85)):
        _clear(arm)
        apply_hero(arm, hero_kind, amt)
        _key(arm, frame)

    arm.animation_data.action = None
    arm.animation_data.use_nla = False
    _push(arm, sit, "Sit")
    _push(arm, idle, "Idle")
    _push(arm, hero, "Hero")
    arm.animation_data.use_nla = False
    bpy.ops.object.mode_set(mode="OBJECT")
    return ["Sit", "Idle", "Hero"]


def pose_action(arm, name):
    action = bpy.data.actions.get(name)
    if arm is None or action is None:
        return
    if arm.animation_data is None:
        arm.animation_data_create()
    arm.animation_data.use_nla = False
    arm.animation_data.action = action
    if hasattr(arm.animation_data, "action_slot") and getattr(action, "slots", None):
        try:
            arm.animation_data.action_slot = action.slots[0]
        except Exception:
            pass
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()


def render_views(out_dir, spec_id, size=768):
    os.makedirs(out_dir, exist_ok=True)
    scene = bpy.context.scene
    engine = None
    for candidate in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = candidate
            engine = candidate
            break
        except Exception:
            continue
    if engine is None:
        scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = int(size)
    scene.render.resolution_y = int(size)
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    world = scene.world or bpy.data.worlds.new("Studio")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.16, 0.17, 0.18, 1)
        bg.inputs[1].default_value = 1.0
    target = Vector((0.0, 0.02, 0.48))
    dist = 1.70
    views = {
        "front": Vector((0.0, -dist, 0.50)),
        "three_quarter": Vector((dist * 0.38, -dist * 0.92, 0.58)),
        "side": Vector((dist * 0.95, 0.0, 0.50)),
        "back": Vector((0.0, dist, 0.52)),
    }
    cam_data = bpy.data.cameras.new("RecCam")
    cam_data.lens = 55
    cam = bpy.data.objects.new("RecCam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    key_data = bpy.data.lights.new("RecKey", "AREA")
    key_data.energy = 55
    key_data.size = 0.95
    key = bpy.data.objects.new("RecKey", key_data)
    bpy.context.collection.objects.link(key)
    key.location = target + Vector((0.55, -0.85, 0.70))
    fill_data = bpy.data.lights.new("RecFill", "AREA")
    fill_data.energy = 22
    fill_data.size = 1.1
    fill = bpy.data.objects.new("RecFill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = target + Vector((-0.65, 0.40, 0.55))
    paths = {}
    for name, loc in views.items():
        cam.location = loc
        cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
        path = os.path.join(out_dir, f"{spec_id}-{name}.png")
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        paths[name] = path
    return paths


def build_character(preset_id):
    if preset_id not in SPECS:
        raise ValueError(f"unknown figure {preset_id}; have {', '.join(SPECS)}")
    spec = dict(SPECS[preset_id])
    spec["id"] = preset_id
    reset_scene()
    L = layout(spec)
    mats = palette(spec)
    body = build_body(L, mats)
    face = build_face(L, mats)
    hair = build_hair(spec, L, mats)
    clothes = build_clothes(spec, L, mats)
    extras = build_accessories(spec, L, mats)
    deform = [body, *face, hair, *clothes, *extras]
    arm = build_armature(L)
    bind(arm, deform, [hair, *[o for o in extras if o and ("Cup" in o.name or "Headband" in o.name or "Lens" in o.name or "Bridge" in o.name or "Arm_" in o.name)]])
    actions = build_clips(arm, spec, L)
    pose_action(arm, "Idle")
    return {
        "spec": spec,
        "armature": arm,
        "actions": actions,
        "meshes": [o.name for o in deform if o],
    }
