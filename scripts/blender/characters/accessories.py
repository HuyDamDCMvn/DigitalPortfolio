"""Headphones and glasses — sized from the side/front sheets, parented to Head."""

from __future__ import annotations

import math

from . import prim, proportions


def headphones(ctx):
    """Over-ear cups that sit outside the hair volume (teal / blue-hoodie)."""
    mat = ctx["mats"]["accent"]
    dark = ctx["mats"]["charcoal"]
    z = proportions.HEAD_Z + 0.008
    y = proportions.HEAD_Y
    bits = []
    band = prim.torus("HeadbandArch", 0.128, 0.011, (0, y, z + 0.018), mat, 32, 12)
    band.rotation_euler = (math.pi / 2, 0, 0)
    bits.append(band)
    for s, side in ((-1.0, "L"), (1.0, "R")):
        cup = prim.cylinder(f"EarCup_{side}", 0.048, 0.034, (0.138 * s, y, z), dark, 22)
        cup.rotation_euler = (0, math.pi / 2, 0)
        pad = prim.torus(f"EarPad_{side}", 0.042, 0.009, (0.142 * s, y, z), mat, 22, 10)
        pad.rotation_euler = (0, math.pi / 2, 0)
        ring = prim.torus(f"EarRing_{side}", 0.030, 0.004, (0.156 * s, y, z), mat, 18, 8)
        ring.rotation_euler = (0, math.pi / 2, 0)
        bits.extend([cup, pad, ring])
    hp = prim.join_meshes("Headphones", bits, mat)
    ctx["headphones"] = hp
    ctx["meshes"].append(hp)
    return hp


def glasses(ctx):
    """Thick rectangular frames from the analyst sheet."""
    mat = ctx["mats"]["charcoal"]
    glass = ctx["mats"]["glass"]
    z = proportions.HEAD_Z + 0.008
    y = proportions.HEAD_Y - proportions.HEAD_R * 0.82
    bits = []
    for s, side in ((-1.0, "L"), (1.0, "R")):
        x = 0.036 * s
        bits.append(prim.round_box(f"Lens_{side}", (0.050, 0.004, 0.036), (x, y, z), glass, 0.002, 2))
        bits.append(prim.round_box(f"Rim_{side}", (0.056, 0.008, 0.042), (x, y + 0.002, z), mat, 0.003, 2))
        temple = prim.round_box(f"Temple_{side}", (0.008, 0.058, 0.008), (0.060 * s, y + 0.032, z + 0.004), mat, 0.002)
        temple.rotation_euler = (0.12, 0, 0.10 * s)
        bits.append(temple)
    bits.append(prim.round_box("Bridge", (0.018, 0.006, 0.008), (0, y, z + 0.004), mat, 0.002))
    obj = prim.join_meshes("Glasses", bits, mat)
    ctx["glasses"] = obj
    ctx["meshes"].append(obj)
    return obj


def headband(ctx):
    mat = ctx["mats"]["white"]
    band = prim.cylinder("Headband", 0.122, 0.016, (0, proportions.HEAD_Y, proportions.HEAD_Z + 0.055), mat, 24)
    band.scale = (1.0, 0.22, 1.0)
    prim.apply_scale(band)
    ctx["headband"] = band
    ctx["meshes"].append(band)
    return band


def scar(ctx):
    mat = ctx["mats"].get("scar") or ctx["mats"]["skinDeep"]
    obj = prim.ellipsoid(
        "Scar",
        0.005,
        0.003,
        0.020,
        (-0.044, proportions.HEAD_Y - proportions.HEAD_R * 0.82, proportions.HEAD_Z - 0.016),
        mat,
        8,
    )
    obj.rotation_euler = (0.35, 0.15, 0.9)
    prim.apply_scale(obj)
    ctx["scar"] = obj
    ctx["meshes"].append(obj)
    return obj


BUILDERS = {
    "headphones": headphones,
    "glasses": glasses,
    "headband": headband,
    "scar": scar,
}


def build_accessories(ctx):
    for item in ctx["spec"].get("accessories") or []:
        if item in BUILDERS:
            BUILDERS[item](ctx)
