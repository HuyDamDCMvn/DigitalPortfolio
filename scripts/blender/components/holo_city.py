"""Hex projector + holographic campus for the oct-table well.

y = 0 is the underside of the metallic base (well-floor anchor).
Oct well hole circumradius is 0.58 m — this hex stays inside that ring.
"""

from __future__ import annotations

import math

from core import (
    add_cylinder,
    add_empty,
    add_hex,
    add_ngon_ring,
    add_round,
    add_sphere,
    add_torus,
    add_tube,
    make_material,
)

FILE = "holo-city.glb"
HEX_ROT = math.pi / 6.0
BASE_R = 0.50
BASE_H = 0.050
CITY_Y = BASE_H
# Horizontal torus: Three.js rx=pi/2. Do not pass rx=0 (that path can stand the ring up).
FLAT = math.pi / 2


def _xz(angle, radius):
    return math.sin(angle) * radius, math.cos(angle) * radius


def _bands(body, name, w, h, d, count, mat):
    span = h / (count + 1)
    for i in range(count):
        add_round(
            body,
            f"_{name}w{i}",
            w=w * 1.08,
            h=0.004,
            d=d * 1.08,
            y=-h / 2 + (i + 1) * span,
            radius=0.001,
            mat=mat,
        )


def _bldg(parent, name, x, z, w, d, h, y0, body_mat, band_mat, bands=4, ry=0.0):
    body = add_round(
        parent,
        name,
        w=w,
        h=h,
        d=d,
        x=x,
        y=y0 + h / 2,
        z=z,
        ry=ry,
        radius=min(0.01, w * 0.14, d * 0.14),
        mat=body_mat,
    )
    _bands(body, name, w, h, d, bands, band_mat)
    return body


def _tree(parent, name, x, z, y0, scale=1.0, leaf=None, dark=None):
    h = 0.028 * scale
    add_cylinder(parent, f"{name}Trunk", 0.003 * scale, 0.004 * scale, 0.008 * scale, x=x, y=y0 + 0.004 * scale, z=z, mat=dark)
    add_cylinder(parent, name, 0.002, 0.014 * scale, h, x=x, y=y0 + 0.008 * scale + h / 2, z=z, mat=leaf)


def _panel(parent, name, x, y, z, ry, w, h, glass, glow, cyan):
    plate = add_round(parent, name, w=w, h=h, d=0.004, x=x, y=y, z=z, ry=ry, radius=0.004, mat=glass)
    add_round(plate, f"_{name}Frame", w=w * 1.04, h=h * 1.04, d=0.002, z=0.003, radius=0.003, mat=glow)
    bar_w = w * 0.12
    for i, bh in enumerate((0.22, 0.38, 0.28, 0.48, 0.18)):
        add_round(
            plate,
            f"_{name}Bar{i}",
            w=bar_w,
            h=h * bh,
            d=0.003,
            x=-w * 0.32 + i * bar_w * 1.35,
            y=-h * 0.28 + h * bh / 2,
            z=0.004,
            radius=0.001,
            mat=cyan,
        )
    return plate


def build(mat):
    root = add_empty(None, "HoloCity")
    shell = make_material("HoloShell", "#eef3f8", roughness=0.26, metalness=0.46)
    inset = make_material("HoloInset", "#2a3340", roughness=0.34, metalness=0.55)
    holo_hi = make_material(
        "HoloBright",
        "#7ad8ff",
        roughness=0.14,
        metalness=0.04,
        emission="#3ec8ff",
        emission_strength=0.95,
        alpha=0.34,
        double_sided=True,
    )
    white, charcoal, cyan, glow, holo, glass, ice, navy, leaf, leaf_dark, gold = (
        mat["white"],
        mat["charcoal"],
        mat["cyan"],
        mat["glow"],
        mat["holo"],
        mat["glass"],
        mat["ice"],
        mat["navyDeep"],
        mat["leaf"],
        mat["leafDark"],
        mat["gold"],
    )
    _ = (white, charcoal)

    add_hex(root, "HoloPodium", radius=BASE_R, height=BASE_H, y=BASE_H / 2, ry=HEX_ROT, corner=0.06, mat=shell)
    add_hex(root, "HoloDeck", radius=BASE_R * 0.88, height=0.007, y=BASE_H - 0.002, ry=HEX_ROT, corner=0.05, mat=inset)
    add_ngon_ring(
        root,
        "HoloRim",
        radius_outer=BASE_R * 0.995,
        radius_inner=BASE_R * 0.88,
        height=0.007,
        segments=6,
        y=BASE_H + 0.001,
        ry=HEX_ROT,
        corner=0.04,
        mat=glow,
    )

    apothem = BASE_R * math.cos(math.pi / 6.0)
    face_w = BASE_R * 0.70
    for i in range(6):
        a = HEX_ROT + math.pi / 6.0 + i * math.pi / 3.0
        x, z = _xz(a, apothem - 0.003)
        add_round(root, f"HoloStrip_{i + 1:02d}", w=face_w, h=0.007, d=0.005, x=x, y=BASE_H * 0.36, z=z, ry=a, radius=0.002, mat=glow)
        add_round(root, f"HoloStripB_{i + 1:02d}", w=face_w * 0.86, h=0.005, d=0.004, x=x, y=BASE_H * 0.66, z=z, ry=a, radius=0.002, mat=cyan)
        cx, cz = _xz(HEX_ROT + i * math.pi / 3.0, BASE_R * 0.90)
        add_round(root, f"HoloCorner_{i + 1:02d}", w=0.034, h=BASE_H * 0.52, d=0.024, x=cx, y=BASE_H * 0.40, z=cz, ry=HEX_ROT + i * math.pi / 3.0, radius=0.005, mat=inset)

    add_cylinder(root, "HoloPad", 0.08, 0.08, 0.005, y=BASE_H + 0.004, mat=glow)
    add_cylinder(root, "HoloEmitter", 0.028, 0.046, 0.008, y=BASE_H + 0.009, mat=holo_hi)
    add_torus(root, "GlowRing", radius=0.095, tube=0.005, y=CITY_Y + 0.016, rx=FLAT, mat=glow)

    ground = CITY_Y + 0.005
    add_hex(root, "HoloGround", radius=BASE_R * 0.70, height=0.004, y=ground, ry=HEX_ROT, corner=0.04, mat=navy)
    add_tube(root, "HoloPathRing", BASE_R * 0.36, BASE_R * 0.32, 0.003, y=ground + 0.004, mat=cyan)
    add_tube(root, "HoloPathInner", BASE_R * 0.16, BASE_R * 0.12, 0.003, y=ground + 0.004, mat=glow)
    for i in range(6):
        a = HEX_ROT + i * math.pi / 3.0
        x, z = _xz(a, BASE_R * 0.24)
        add_round(root, f"HoloPath_{i + 1:02d}", w=0.014, h=0.003, d=BASE_R * 0.36, x=x, y=ground + 0.004, z=z, ry=a, radius=0.002, mat=cyan)

    for i in range(6):
        a = HEX_ROT + math.pi / 6.0 + i * math.pi / 3.0
        x, z = _xz(a, BASE_R * 0.42)
        add_hex(root, f"HoloPark_{i + 1:02d}", radius=0.055, height=0.005, x=x, y=ground + 0.005, z=z, ry=a, corner=0.016, mat=leaf)
        _tree(root, f"HoloTree_{i + 1:02d}a", x + math.sin(a) * 0.014, z + math.cos(a) * 0.014, ground + 0.005, 0.82, leaf, leaf_dark)
        _tree(root, f"HoloTree_{i + 1:02d}b", x - math.sin(a + 0.7) * 0.016, z - math.cos(a + 0.7) * 0.016, ground + 0.005, 0.64, leaf, leaf_dark)

    spire_h = 0.145
    spire = add_cylinder(root, "HoloSpire", 0.014, 0.032, spire_h, y=ground + spire_h / 2, mat=holo)
    add_cylinder(spire, "_Core", 0.006, 0.012, spire_h * 0.92, mat=holo_hi)
    add_cylinder(root, "HoloBeam", 0.003, 0.005, 0.045, y=ground + spire_h + 0.024, mat=glow)
    add_sphere(root, "HoloBeacon", 0.01, y=ground + spire_h + 0.048, mat=gold)
    add_torus(root, "HoloScanA", radius=0.042, tube=0.0035, y=ground + spire_h * 0.70, rx=FLAT, mat=glow)
    add_torus(root, "HoloScanB", radius=0.028, tube=0.0028, y=ground + spire_h * 0.88, rx=FLAT, mat=cyan)

    inner = (
        (0.0, 0.13, 0.042, 0.036, 0.068, 4, 0.12),
        (math.pi / 3, 0.14, 0.038, 0.032, 0.055, 3, -0.08),
        (2 * math.pi / 3, 0.125, 0.048, 0.032, 0.048, 3, 0.18),
        (math.pi, 0.14, 0.040, 0.040, 0.062, 4, 0.0),
        (4 * math.pi / 3, 0.13, 0.034, 0.030, 0.046, 3, -0.15),
        (5 * math.pi / 3, 0.135, 0.044, 0.034, 0.052, 3, 0.1),
    )
    for i, (ang, rad, w, d, h, bands, ry) in enumerate(inner):
        x, z = _xz(HEX_ROT + ang, rad)
        _bldg(root, f"HoloBldg{chr(65 + i)}", x, z, w, d, h, ground, ice, cyan, bands, HEX_ROT + ang + ry)

    outer = (
        (math.pi / 6, 0.24, 0.032, 0.026, 0.034, 2),
        (math.pi / 2, 0.25, 0.028, 0.028, 0.030, 2),
        (5 * math.pi / 6, 0.235, 0.034, 0.024, 0.038, 3),
        (7 * math.pi / 6, 0.245, 0.030, 0.026, 0.028, 2),
        (3 * math.pi / 2, 0.24, 0.032, 0.022, 0.036, 2),
        (11 * math.pi / 6, 0.238, 0.026, 0.026, 0.026, 2),
    )
    for i, (ang, rad, w, d, h, bands) in enumerate(outer):
        x, z = _xz(HEX_ROT + ang, rad)
        _bldg(root, f"HoloBldg{chr(71 + i)}", x, z, w, d, h, ground, ice, glow, bands, HEX_ROT + ang)

    _panel(root, "HoloPanel_01", 0.16, ground + 0.10, 0.10, -0.55, 0.07, 0.042, glass, glow, cyan)
    _panel(root, "HoloPanel_02", -0.15, ground + 0.11, 0.08, 0.62, 0.064, 0.038, glass, glow, cyan)
    _panel(root, "HoloPanel_03", 0.06, ground + 0.12, -0.16, 0.2, 0.056, 0.036, glass, glow, cyan)
    _panel(root, "HoloPanel_04", -0.05, ground + 0.09, 0.18, 3.0, 0.06, 0.034, glass, glow, cyan)

    gx, gz = _xz(HEX_ROT + 0.9, 0.18)
    add_sphere(root, "HoloGlobe", 0.022, x=gx, y=ground + 0.105, z=gz, mat=holo)
    add_torus(root, "HoloGlobeRing", radius=0.026, tube=0.0024, x=gx, y=ground + 0.105, z=gz, rx=FLAT, mat=cyan)

    return root
