"""Jackets, pants, shoes, hollow-cube logo. Sleeves follow the A-pose arm line."""

from __future__ import annotations

import math

from mathutils import Vector

from . import prim, proportions


def _scale(ctx):
    return proportions.body_scale(ctx["spec"].get("body", "male"))


def _limb(name, a, b, radius, mat, segments=16):
    va, vb = Vector(a), Vector(b)
    mid = (va + vb) * 0.5
    delta = vb - va
    length = max(delta.length, 0.02)
    obj = prim.ellipsoid(name, length * 0.55, radius, radius, (mid.x, mid.y, mid.z), mat, segments)
    prim.aim_x(obj, delta)
    return obj


def _arm_line(sx, side_sign):
    s = side_sign
    sh = (proportions.SHOULDER_X * sx * s, 0.016, proportions.SHOULDER_Z)
    el = (proportions.ELBOW_X * sx * s, 0.010, 0.505)
    hd = (proportions.HAND_X * sx * s * 0.92, 0.012, proportions.HAND_Z + 0.028)
    return sh, el, hd


def _jacket_parts(ctx, name, extra=0.016, contrast_sleeves=False):
    mat = ctx["mats"]["jacket"]
    trim = ctx["mats"]["accent"]
    shirt_m = ctx["mats"].get("shirt") or trim
    zip_m = ctx["mats"].get("charcoal") or trim
    sx = _scale(ctx)["shoulder"]
    sleeve_mat = trim if contrast_sleeves else mat
    body_bits = [
        prim.ellipsoid(f"{name}Torso", 0.132 * sx + extra, 0.096, 0.158, (0, 0.022, 0.545), mat, 28),
        prim.ellipsoid(f"{name}Chest", 0.128 * sx + extra, 0.090, 0.070, (0, 0.028, 0.640), mat, 22),
        prim.ellipsoid(f"{name}Collar", 0.070, 0.055, 0.032, (0, 0.038, 0.698), mat, 16),
    ]
    for s, side in ((-1.0, "L"), (1.0, "R")):
        body_bits.append(
            prim.sphere(
                f"{name}_Shoulder_{side}",
                0.054 * sx,
                (proportions.SHOULDER_X * sx * s, 0.018, proportions.SHOULDER_Z),
                mat,
                16,
            )
        )
    extras = [
        prim.ellipsoid(f"{name}_Hem", 0.118 * sx + extra, 0.088, 0.032, (0, 0.020, 0.448), trim, 16),
        prim.ellipsoid("Shirt", 0.052, 0.038, 0.038, (0, -0.018, 0.682), shirt_m, 14),
        prim.round_box("Zipper", (0.010, 0.009, 0.132), (0, -0.072, 0.548), zip_m, 0.003),
    ]
    sleeve_bits = []
    for s, side in ((-1.0, "L"), (1.0, "R")):
        sh, el, hd = _arm_line(sx, s)
        sleeve = _limb(f"{name}_Sleeve_{side}", sh, el, 0.056 + extra * 0.4, sleeve_mat, 16)
        forearm = _limb(f"{name}_Fore_{side}", el, hd, 0.046, sleeve_mat, 14)
        cuff = prim.ellipsoid(
            f"{name}_Cuff_{side}",
            0.028,
            0.038,
            0.038,
            (hd[0] * 0.98, hd[1], hd[2] + 0.006),
            trim,
            12,
        )
        extras.append(cuff)
        if contrast_sleeves:
            extras.extend([sleeve, forearm])
        else:
            sleeve_bits.extend([sleeve, forearm])
    jacket = prim.join_meshes(name, body_bits + sleeve_bits, mat)
    prim.voxel_remesh(jacket, 0.009)
    return jacket, extras


def bomber(ctx):
    jacket, extras = _jacket_parts(ctx, "Jacket")
    ctx["meshes"].extend(extras)
    return jacket


def hoodie(ctx):
    jacket, extras = _jacket_parts(ctx, "Hoodie", extra=0.024)
    hood = prim.ellipsoid("Hood", 0.118, 0.092, 0.070, (0, 0.055, 0.755), ctx["mats"]["jacket"], 18)
    pocket = prim.ellipsoid("Kangaroo", 0.078, 0.028, 0.042, (0, -0.070, 0.500), ctx["mats"]["jacket"], 14)
    vest_m = ctx["mats"].get("vest") or ctx["mats"]["charcoal"]
    vest = prim.ellipsoid("Vest", 0.092, 0.048, 0.110, (0, -0.032, 0.560), vest_m, 16)
    ctx["meshes"].extend(extras)
    ctx["meshes"].extend([pocket, vest])
    hoodie = prim.join_meshes("Hoodie", [jacket, hood], ctx["mats"]["jacket"])
    prim.voxel_remesh(hoodie, 0.010)
    return hoodie


def varsity(ctx):
    jacket, extras = _jacket_parts(ctx, "Varsity", contrast_sleeves=True)
    ctx["meshes"].extend(extras)
    return jacket


def _footwear_kind(ctx):
    spec = ctx["spec"]
    if spec.get("footwear"):
        return spec["footwear"]
    if spec.get("id") in ("teal-headphones", "purple-bun", "orange-varsity"):
        return "boot"
    return "sneaker"


def pants_and_shoes(ctx):
    pants_m = ctx["mats"]["pants"]
    shoe_m = ctx["mats"]["shoes"]
    sole_m = ctx["mats"]["sole"]
    trim = ctx["mats"]["accent"]
    hx = _scale(ctx)["hip"]
    pid = ctx["spec"].get("id")
    stripe = pid == "teal-headphones"
    hip_x = proportions.HIP_X * hx
    bits = [prim.ellipsoid("PantsHip", 0.108 * hx, 0.082, 0.078, (0, 0.014, proportions.HIP_Z), pants_m, 20)]
    shoes = []
    boots = _footwear_kind(ctx) == "boot"
    for s, side in ((-1.0, "L"), (1.0, "R")):
        bits.append(
            prim.ellipsoid(
                f"PantsThigh_{side}",
                0.058 * hx,
                0.056,
                0.112,
                (hip_x * s, 0.014, 0.275),
                pants_m,
                18,
            )
        )
        bits.append(
            prim.ellipsoid(
                f"PantsShin_{side}",
                0.046,
                0.044,
                0.090,
                (hip_x * s, 0.012, 0.125),
                pants_m,
                16,
            )
        )
        if pid in ("blue-hoodie", "orange-varsity", "tan-dreads"):
            bits.append(prim.round_box(f"Cargo_{side}", (0.026, 0.020, 0.038), (hip_x * s * 1.35, 0.032, 0.295), pants_m, 0.004))
        if stripe:
            bits.append(prim.ellipsoid(f"Stripe_{side}", 0.008, 0.012, 0.155, (hip_x * s * 1.28, 0.010, 0.215), trim, 8))
        x, y = hip_x * s, -0.048
        if boots:
            shoes.append(prim.ellipsoid(f"Shoe_{side}", 0.044, 0.080, 0.048, (x, y, 0.042), shoe_m, 16))
            shoes.append(prim.ellipsoid(f"BootShaft_{side}", 0.038, 0.042, 0.055, (x, y + 0.012, 0.078), shoe_m, 14))
            shoes.append(prim.ellipsoid(f"Sole_{side}", 0.048, 0.090, 0.012, (x, y - 0.004, 0.012), sole_m, 14))
        else:
            shoes.append(prim.ellipsoid(f"Shoe_{side}", 0.042, 0.082, 0.030, (x, y, 0.032), shoe_m, 16))
            shoes.append(prim.ellipsoid(f"Sole_{side}", 0.046, 0.092, 0.012, (x, y - 0.004, 0.012), sole_m, 14))
            shoes.append(prim.round_box(f"Toe_{side}", (0.040, 0.042, 0.020), (x, y - 0.042, 0.028), shoe_m, 0.006))
            shoes.append(prim.round_box(f"Tongue_{side}", (0.026, 0.018, 0.022), (x, y + 0.018, 0.044), trim, 0.004))
            lace_m = ctx["mats"].get("white") or sole_m
            for i in range(3):
                lace = prim.cylinder(f"Lace_{side}_{i}", 0.004, 0.022, (x, y + 0.010, 0.038 + i * 0.008), lace_m, 8)
                lace.rotation_euler = (0, math.pi / 2, 0)
                shoes.append(lace)
    pants = prim.join_meshes("Pants", bits, pants_m)
    prim.voxel_remesh(pants, 0.010)
    footwear = prim.join_meshes("Shoes", shoes, shoe_m)
    return pants, footwear


def officer_boots(ctx):
    pants_m = ctx["mats"]["pants"]
    shoe_m = ctx["mats"]["shoes"]
    gold = ctx["mats"]["gold"]
    hx = _scale(ctx)["hip"]
    hip_x = proportions.HIP_X * hx
    bits = [prim.ellipsoid("PantsHip", 0.110 * hx, 0.085, 0.080, (0, 0.012, proportions.HIP_Z), pants_m, 18)]
    shoes = []
    buckles = []
    for s, side in ((-1.0, "L"), (1.0, "R")):
        bits.append(prim.ellipsoid(f"PantsThigh_{side}", 0.060 * hx, 0.058, 0.115, (hip_x * s, 0.012, 0.275), pants_m, 16))
        bits.append(prim.ellipsoid(f"PantsShin_{side}", 0.046, 0.044, 0.088, (hip_x * s, 0.012, 0.135), pants_m, 14))
        shoes.append(prim.ellipsoid(f"Shoe_{side}", 0.050, 0.090, 0.055, (hip_x * s, -0.042, 0.045), shoe_m, 14))
        shoes.append(prim.ellipsoid(f"Sole_{side}", 0.052, 0.095, 0.016, (hip_x * s, -0.052, 0.014), ctx["mats"]["sole"], 12))
        for i, z in enumerate((0.055, 0.038)):
            buckles.append(prim.cube(f"BootStrap_{side}_{i}", (0.055, 0.022, 0.012), (hip_x * s, -0.020, z), gold))
    pants = prim.join_meshes("Pants", bits, pants_m)
    prim.voxel_remesh(pants, 0.012)
    footwear = prim.join_meshes("Shoes", shoes, shoe_m)
    buckle = prim.join_meshes("Buckle", buckles, gold)
    return pants, footwear, buckle


def greatcoat(ctx):
    mat = ctx["mats"]["jacket"]
    sx = _scale(ctx)["shoulder"]
    bits = [
        prim.ellipsoid("CoatTorso", 0.150 * sx, 0.120, 0.220, (0, 0.040, 0.520), mat, 24),
        prim.ellipsoid("CoatSkirt", 0.180 * sx, 0.160, 0.240, (0, 0.080, 0.260), mat, 20),
        prim.ellipsoid("CoatTrain", 0.120 * sx, 0.140, 0.180, (0, 0.140, 0.120), mat, 16),
        prim.ellipsoid("CoatHem_L", 0.100, 0.120, 0.180, (-0.080, 0.090, 0.100), mat, 14),
        prim.ellipsoid("CoatHem_R", 0.100, 0.120, 0.180, (0.080, 0.090, 0.100), mat, 14),
        prim.ellipsoid("CoatCollar_L", 0.050, 0.060, 0.100, (-0.045, 0.040, 0.740), mat, 12),
        prim.ellipsoid("CoatCollar_R", 0.050, 0.060, 0.100, (0.045, 0.040, 0.740), mat, 12),
    ]
    bits[5].rotation_euler = (0.35, -0.45, 0.25)
    bits[6].rotation_euler = (0.35, 0.45, -0.25)
    for s, side in ((-1.0, "L"), (1.0, "R")):
        sh, el, hd = _arm_line(sx, s)
        bits.append(_limb(f"CoatSleeve_{side}", sh, el, 0.056, mat, 14))
        bits.append(_limb(f"CoatFore_{side}", el, hd, 0.046, mat, 12))
    coat = prim.join_meshes("Jacket", bits, mat)
    prim.voxel_remesh(coat, 0.014)
    return coat


def vest_and_tie(ctx):
    vest_m = ctx["mats"]["vest"]
    tie_m = ctx["mats"]["tie"]
    vest = prim.ellipsoid("Vest", 0.100, 0.065, 0.130, (0, -0.020, 0.560), vest_m, 18)
    prim.voxel_remesh(vest, 0.014)
    tie = prim.ellipsoid("Tie", 0.016, 0.012, 0.090, (0, -0.085, 0.540), tie_m, 8)
    prim.apply_scale(tie)
    return vest, tie


def eagle_crest(ctx):
    gold = ctx["mats"]["gold"]
    bits = [
        prim.ellipsoid("EagleBody", 0.028, 0.018, 0.055, (0, 0.120, 0.550), gold, 10),
        prim.ellipsoid("EagleWing_L", 0.055, 0.012, 0.032, (-0.055, 0.120, 0.550), gold, 8),
        prim.ellipsoid("EagleWing_R", 0.055, 0.012, 0.032, (0.055, 0.120, 0.550), gold, 8),
        prim.ellipsoid("EagleHead", 0.012, 0.014, 0.020, (0, 0.130, 0.610), gold, 8),
    ]
    bits[1].rotation_euler = (0.0, 0.0, 0.45)
    bits[2].rotation_euler = (0.0, 0.0, -0.45)
    return prim.join_meshes("Eagle", bits, gold)


def epaulettes(ctx):
    gold = ctx["mats"]["gold"]
    sx = _scale(ctx)["shoulder"]
    bits = [prim.ellipsoid("Epaulette_Hem", 0.130, 0.028, 0.018, (0, 0.130, 0.050), gold, 10)]
    for s, side in ((-1.0, "L"), (1.0, "R")):
        bits.append(prim.ellipsoid(f"Epaulette_{side}", 0.048, 0.034, 0.022, (0.150 * s * sx, 0.050, 0.680), gold, 10))
        cuff = prim.ellipsoid(f"Epaulette_Cuff_{side}", 0.042, 0.042, 0.018, (0.400 * s * sx, 0.030, 0.460), gold, 10)
        cuff.rotation_euler = (0.0, 0.5 * s, 0.0)
        bits.append(cuff)
    return prim.join_meshes("Epaulette", bits, gold)


def medals(ctx):
    gold = ctx["mats"]["gold"]
    bits = []
    for i, (x, z) in enumerate(((0.085, 0.630), (0.105, 0.610), (0.080, 0.595))):
        medal = prim.cylinder(f"Medal_{i}", 0.014, 0.007, (x, -0.100, z), gold, 8)
        medal.rotation_euler = (math.pi / 2, 0, 0)
        bits.append(medal)
    return prim.join_meshes("Medal", bits, gold)


def belt_and_gloves(ctx):
    dark = ctx["mats"]["vest"]
    gold = ctx["mats"]["gold"]
    glove_m = ctx["mats"]["glove"]
    sx = _scale(ctx)["shoulder"]
    belt = prim.cylinder("Belt", 0.120, 0.028, (0, 0.020, 0.420), dark, 24)
    belt.scale = (1.0, 0.72, 1.0)
    prim.apply_scale(belt)
    buckle = prim.cube("Buckle_Plate", (0.040, 0.020, 0.028), (0, -0.085, 0.420), gold)
    gloves = []
    for s, side in ((-1.0, "L"), (1.0, "R")):
        gloves.append(
            prim.ellipsoid(
                f"Glove_{side}",
                0.042,
                0.032,
                0.022,
                (proportions.HAND_X * s * sx, 0.020, proportions.HAND_Z),
                glove_m,
                12,
            )
        )
    glove = prim.join_meshes("Gloves", gloves, glove_m)
    return belt, buckle, glove


def hex_logo(ctx, name="LogoHex", loc=(0, 0.095, 0.58), radius=0.026):
    """Hollow cube / hex mark from the sheet — emissive ring with inner cell."""
    mat = ctx["mats"]["logo"]
    outer = prim.cylinder(name, radius, 0.007, loc, mat, 6)
    outer.rotation_euler = (math.pi / 2, 0, math.pi / 6)
    inner = prim.cylinder(f"{name}Inner", radius * 0.42, 0.009, (loc[0], loc[1] + 0.002, loc[2]), mat, 6)
    inner.rotation_euler = (math.pi / 2, 0, math.pi / 6)
    logo = prim.join_meshes(name, [outer, inner], mat)
    prim.apply_scale(logo)
    return logo


def sleeve_patches(ctx):
    mat = ctx["mats"]["logo"]
    sx = _scale(ctx)["shoulder"]
    bits = []
    for s, side in ((-1.0, "L"), (1.0, "R")):
        patch = prim.cylinder(f"Patch_{side}", 0.018, 0.006, (0.22 * s * sx, 0.055, 0.560), mat, 16)
        patch.rotation_euler = (math.pi / 2, 0.35 * s, 0)
        bits.append(patch)
    return prim.join_meshes("Patch", bits, mat)


WARDROBE = {
    "bomber": bomber,
    "hoodie": hoodie,
    "varsity": varsity,
    "jacket": bomber,
    "greatcoat": greatcoat,
}


def build_wardrobe(ctx):
    kind = ctx["spec"].get("wardrobe", "bomber")
    if kind == "greatcoat":
        jacket = greatcoat(ctx)
        pants, shoes, boot_gold = officer_boots(ctx)
        vest, tie = vest_and_tie(ctx)
        extras = [eagle_crest(ctx), epaulettes(ctx), medals(ctx), vest, tie, boot_gold]
        extras.extend(belt_and_gloves(ctx))
        ctx["jacket"] = jacket
        ctx["pants"] = pants
        ctx["shoes"] = shoes
        ctx["meshes"].extend([jacket, pants, shoes, *extras])
        return jacket
    jacket = WARDROBE[kind](ctx)
    pants, shoes = pants_and_shoes(ctx)
    back = hex_logo(ctx, "LogoHex", (0, 0.128, 0.575), 0.032)
    chest = hex_logo(ctx, "LogoChest", (0.050, -0.078, 0.615), 0.014)
    ctx["jacket"] = jacket
    ctx["pants"] = pants
    ctx["shoes"] = shoes
    ctx["logo"] = back
    extras = [jacket, pants, shoes, back, chest]
    if ctx["spec"].get("id") == "tan-dreads":
        extras.append(sleeve_patches(ctx))
    ctx["meshes"].extend(extras)
    return jacket
