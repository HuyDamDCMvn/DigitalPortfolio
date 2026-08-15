"""Furniture and props: chair, hex table, laptop, bookshelf, massing, lead set."""

from __future__ import annotations

import math

from core import (
    add_capsule,
    add_cylinder,
    add_empty,
    add_hex,
    add_oct,
    add_oct_ring,
    add_round,
    add_sphere,
    add_torus,
    add_tube,
    join_into,
    make_material,
)


HEX_ROT = math.pi / 6.0
OCT_ROT = math.pi / 8.0
# White top surface height (metres). Chairs and HoloCity use this via kit WORLD.octTableTopY.
OCT_TOP_Y = 0.748


def _capsule_between(root, name, a, b, r, mat, radial=28):
    """Capsule spanning Three.js points A→B. Default capsule is +Y; pitch then yaw."""
    ax, ay, az = a
    bx, by, bz = b
    dx, dy, dz = bx - ax, by - ay, bz - az
    dist = math.sqrt(dx * dx + dy * dy + dz * dz)
    if dist < 1e-5:
        return add_sphere(root, name, r, x=ax, y=ay, z=az, segments=radial, mat=mat)
    length = max(0.004, dist - 2.0 * r * 0.15)
    horiz = math.hypot(dx, dz)
    rx = math.atan2(horiz, dy)
    ry = math.atan2(dx, dz) if horiz > 1e-8 else 0.0
    return add_capsule(
        root,
        name,
        r=r,
        length=length,
        x=(ax + bx) * 0.5,
        y=(ay + by) * 0.5,
        z=(az + bz) * 0.5,
        rx=rx,
        ry=ry,
        radial=radial,
        cap=12,
        mat=mat,
    )


def _yz_round_rect(x, y0, y1, z0, z1, cr, n=6):
    """Rounded rectangle in the YZ plane (loop arm path)."""
    pts = []

    def arc(cz, cy, a0, a1):
        for i in range(n + 1):
            a = a0 + (a1 - a0) * (i / n)
            pts.append((x, cy + cr * math.sin(a), cz + cr * math.cos(a)))

    arc(z1 - cr, y0 + cr, -math.pi / 2, 0.0)
    arc(z1 - cr, y1 - cr, 0.0, math.pi / 2)
    arc(z0 + cr, y1 - cr, math.pi / 2, math.pi)
    arc(z0 + cr, y0 + cr, math.pi, math.pi * 1.5)
    return pts


def _chair_loop_arm(root, side, x, shell, pad_mat, ink, steel):
    """Closed loop armrest from under the seat, matching hub stills."""
    sgn = 1.0 if side == "R" else -1.0
    ox = x + sgn * 0.036
    y0, y1, z0, z1, cr = 0.428, 0.672, -0.138, 0.162, 0.048
    pts = _yz_round_rect(ox, y0, y1, z0, z1, cr, n=7)
    tube = 0.0105
    arm = _capsule_between(root, f"Arm_{side}", pts[0], pts[1], tube, steel)
    extras = [
        _capsule_between(root, f"_ArmSeg_{side}_{i}", pts[i], pts[(i + 1) % len(pts)], tube, steel)
        for i in range(1, len(pts))
    ]
    extras.extend(
        [
            _capsule_between(root, f"_ArmMountF_{side}", (x, y0, 0.08), (ox, y0, 0.08), tube, steel),
            _capsule_between(root, f"_ArmMountR_{side}", (x, y0, -0.08), (ox, y0, -0.08), tube, steel),
            add_round(
                root,
                f"_ArmPad_{side}",
                w=0.044,
                h=0.015,
                d=0.18,
                x=ox,
                y=y1 + 0.008,
                z=0.012,
                radius=0.007,
                segments=8,
                mat=pad_mat,
            ),
            add_round(
                root,
                f"_ArmPadStitch_{side}",
                w=0.034,
                h=0.003,
                d=0.14,
                x=ox,
                y=y1 + 0.016,
                z=0.012,
                radius=0.002,
                segments=4,
                mat=ink,
            ),
            add_cylinder(
                root,
                f"_ArmBoltF_{side}",
                0.005,
                0.005,
                0.014,
                x=x + sgn * 0.008,
                y=y0,
                z=0.08,
                rx=math.pi / 2,
                radial=16,
                mat=ink,
            ),
            add_cylinder(
                root,
                f"_ArmBoltR_{side}",
                0.005,
                0.005,
                0.014,
                x=x + sgn * 0.008,
                y=y0,
                z=-0.08,
                rx=math.pi / 2,
                radial=16,
                mat=ink,
            ),
        ]
    )
    join_into(arm, extras)
    return arm


def _chair_wheel(root, name, x, y, z, a, rubber, rim, ink):
    """Twin-wheel half: tire, rim, hub. Axle along spoke-perpendicular. Tread on y=0."""
    return [
        add_cylinder(root, f"{name}Tire", 0.025, 0.025, 0.012, x=x, y=y, z=z, rz=math.pi / 2, ry=a, radial=48, mat=rubber),
        add_cylinder(root, f"{name}Tread", 0.026, 0.026, 0.006, x=x, y=y, z=z, rz=math.pi / 2, ry=a, radial=48, mat=ink),
        add_cylinder(root, f"{name}Rim", 0.015, 0.015, 0.013, x=x, y=y, z=z, rz=math.pi / 2, ry=a, radial=32, mat=rim),
        add_cylinder(root, f"{name}Cap", 0.006, 0.006, 0.015, x=x, y=y, z=z, rz=math.pi / 2, ry=a, radial=20, mat=ink),
    ]


def _chair_caster(root, n, a, ink, charcoal, rubber):
    """Twin-wheel caster: pin, U-yoke, axle, two wheels. Wheel tread on y = 0."""
    wr = 0.025
    cx, cz = math.sin(a) * 0.325, math.cos(a) * 0.325
    px, pz = math.sin(a + math.pi / 2) * 0.022, math.cos(a + math.pi / 2) * 0.022
    yoke = add_round(
        root, f"Caster_{n}", w=0.048, h=0.016, d=0.028, x=cx, y=0.046, z=cz, ry=a, radius=0.006, segments=8, mat=ink
    )
    extras = [
        add_cylinder(root, f"_CasterPin_{n}", 0.007, 0.008, 0.028, x=cx, y=0.062, z=cz, radial=28, mat=charcoal),
        add_cylinder(root, f"_CasterCollar_{n}", 0.011, 0.011, 0.008, x=cx, y=0.074, z=cz, radial=24, mat=ink),
        add_round(
            root,
            f"_CasterHornL_{n}",
            w=0.012,
            h=0.028,
            d=0.018,
            x=cx + px,
            y=0.034,
            z=cz + pz,
            ry=a,
            radius=0.005,
            segments=6,
            mat=ink,
        ),
        add_round(
            root,
            f"_CasterHornR_{n}",
            w=0.012,
            h=0.028,
            d=0.018,
            x=cx - px,
            y=0.034,
            z=cz - pz,
            ry=a,
            radius=0.005,
            segments=6,
            mat=ink,
        ),
        add_cylinder(
            root, f"_CasterAxle_{n}", 0.0035, 0.0035, 0.042, x=cx, y=wr, z=cz, rz=math.pi / 2, ry=a, radial=16, mat=charcoal
        ),
        *_chair_wheel(root, f"_CasterL_{n}", cx + px, wr, cz + pz, a, rubber, charcoal, ink),
        *_chair_wheel(root, f"_CasterR_{n}", cx - px, wr, cz - pz, a, rubber, charcoal, ink),
    ]
    join_into(yoke, extras)
    return yoke


def build_office_chair(mat):
    """Task chair matching hub stills: white shell, teal pads, loop arms, 5-star + twin casters."""
    root = add_empty(None, "OfficeChair")
    shell = make_material("ChairShell", "#eef3f7", roughness=0.30, metalness=0.10)
    fabric = make_material("ChairFabric", "#165a5c", roughness=0.66, metalness=0.02)
    piping = make_material("ChairPipe", "#062553", roughness=0.48, metalness=0.10)
    steel = make_material("ChairSteel", "#3a4450", roughness=0.28, metalness=0.55)
    rubber = make_material("ChairRubber", "#1a1c20", roughness=0.78, metalness=0.02)
    ink, charcoal = mat["ink"], mat["charcoal"]
    navy = piping

    seat = add_round(root, "Seat", w=0.48, h=0.038, d=0.48, y=0.456, z=0.018, radius=0.055, segments=10, mat=shell)
    join_into(
        seat,
        [
            add_round(root, "_SeatDish", w=0.42, h=0.014, d=0.40, y=0.476, z=0.024, radius=0.045, segments=10, mat=shell),
            add_round(root, "_SeatFall", w=0.42, h=0.032, d=0.14, y=0.442, z=0.23, rx=0.55, radius=0.032, segments=8, mat=shell),
            add_round(root, "_SeatLip", w=0.40, h=0.018, d=0.07, y=0.418, z=0.28, rx=0.15, radius=0.02, segments=8, mat=shell),
            add_round(root, "_SeatUnderside", w=0.36, h=0.016, d=0.32, y=0.434, z=0.01, radius=0.02, segments=6, mat=steel),
            add_round(root, "_SeatRib", w=0.20, h=0.016, d=0.10, y=0.426, z=-0.06, radius=0.008, segments=6, mat=ink),
        ],
    )
    pad = add_round(root, "SeatPad", w=0.40, h=0.036, d=0.36, y=0.500, z=0.008, radius=0.05, segments=10, mat=fabric)
    join_into(
        pad,
        [
            add_round(root, "_SeatQuilt", w=0.28, h=0.01, d=0.24, y=0.518, z=0.0, radius=0.04, segments=8, mat=fabric),
            add_round(root, "_SeatFallPad", w=0.36, h=0.028, d=0.12, y=0.478, z=0.20, rx=0.62, radius=0.032, segments=8, mat=fabric),
            add_round(root, "_SeatFallTip", w=0.32, h=0.018, d=0.06, y=0.448, z=0.26, rx=0.35, radius=0.02, segments=8, mat=fabric),
            add_round(root, "_SeatBolsterL", w=0.048, h=0.026, d=0.30, x=-0.178, y=0.508, z=0.016, radius=0.018, segments=8, mat=navy),
            add_round(root, "_SeatBolsterR", w=0.048, h=0.026, d=0.30, x=0.178, y=0.508, z=0.016, radius=0.018, segments=8, mat=navy),
            add_round(root, "_SeatPipe", w=0.418, h=0.006, d=0.408, y=0.484, z=0.022, radius=0.02, segments=8, mat=navy),
        ],
    )

    back_lower = add_round(
        root, "BackLower", w=0.40, h=0.20, d=0.048, y=0.62, z=-0.198, rx=-0.14, radius=0.032, segments=10, mat=shell
    )
    join_into(
        back_lower,
        [
            add_round(root, "_BackSpine", w=0.07, h=0.28, d=0.036, y=0.56, z=-0.168, rx=-0.22, radius=0.016, segments=8, mat=shell),
            add_round(root, "_BackJBar", w=0.055, h=0.10, d=0.08, y=0.48, z=-0.12, rx=-0.4, radius=0.016, segments=8, mat=shell),
            add_round(root, "_BackHinge", w=0.13, h=0.036, d=0.07, y=0.442, z=-0.11, radius=0.012, segments=8, mat=ink),
            add_cylinder(root, "_HingeBolt", 0.008, 0.008, 0.08, y=0.442, z=-0.11, rz=math.pi / 2, radial=20, mat=steel),
            add_round(root, "_LumbarShell", w=0.34, h=0.09, d=0.03, y=0.64, z=-0.172, rx=-0.12, radius=0.02, segments=8, mat=shell),
        ],
    )
    back_pad = add_round(
        root, "BackPad", w=0.30, h=0.12, d=0.038, y=0.655, z=-0.162, rx=-0.12, radius=0.028, segments=10, mat=fabric
    )
    join_into(
        back_pad,
        [
            add_round(root, "_LumbarPipe", w=0.304, h=0.006, d=0.04, y=0.655, z=-0.142, rx=-0.12, radius=0.01, segments=6, mat=navy),
            add_round(root, "_LumbarQuilt", w=0.22, h=0.02, d=0.02, y=0.655, z=-0.144, rx=-0.12, radius=0.01, segments=6, mat=fabric),
        ],
    )
    back_upper = add_round(
        root, "BackUpper", w=0.42, h=0.32, d=0.050, y=0.90, z=-0.228, rx=-0.06, radius=0.045, segments=10, mat=shell
    )
    join_into(
        back_upper,
        [
            add_round(root, "_BackUpperPad", w=0.30, h=0.22, d=0.034, y=0.90, z=-0.198, rx=-0.06, radius=0.03, segments=10, mat=fabric),
            add_round(root, "_BackCrown", w=0.28, h=0.07, d=0.038, y=1.05, z=-0.242, rx=-0.03, radius=0.028, segments=8, mat=shell),
            add_round(root, "_BackShellEdgeL", w=0.04, h=0.28, d=0.022, x=-0.20, y=0.90, z=-0.248, rx=-0.06, radius=0.012, segments=6, mat=shell),
            add_round(root, "_BackShellEdgeR", w=0.04, h=0.28, d=0.022, x=0.20, y=0.90, z=-0.248, rx=-0.06, radius=0.012, segments=6, mat=shell),
            add_round(root, "_BackUpperPipe", w=0.304, h=0.006, d=0.036, y=0.90, z=-0.178, rx=-0.06, radius=0.01, segments=6, mat=navy),
        ],
    )

    _chair_loop_arm(root, "L", -0.228, shell, ink, ink, steel)
    _chair_loop_arm(root, "R", 0.228, shell, ink, ink, steel)

    mech = add_round(root, "Mech", w=0.20, h=0.042, d=0.16, y=0.416, z=-0.02, radius=0.014, segments=8, mat=ink)
    join_into(
        mech,
        [
            add_round(root, "_MechPlate", w=0.24, h=0.01, d=0.18, y=0.438, z=0.0, radius=0.012, segments=6, mat=steel),
            add_round(root, "_MechRail", w=0.08, h=0.02, d=0.12, y=0.408, z=0.04, radius=0.006, segments=6, mat=charcoal),
            add_round(root, "_HeightLever", w=0.13, h=0.009, d=0.016, x=0.13, y=0.410, z=0.05, ry=0.32, radius=0.004, segments=6, mat=ink),
            add_sphere(root, "_LeverKnob", 0.011, x=0.188, y=0.410, z=0.072, segments=24, mat=charcoal),
            add_cylinder(root, "_LeverPivot", 0.008, 0.008, 0.02, x=0.07, y=0.410, z=0.03, rz=math.pi / 2, radial=16, mat=steel),
            add_cylinder(root, "_TensionKnob", 0.018, 0.020, 0.024, x=-0.085, y=0.398, z=0.055, rx=math.pi / 2, radial=32, mat=charcoal),
            add_torus(root, "_TensionRing", radius=0.014, tube=0.0025, x=-0.085, y=0.398, z=0.068, rx=math.pi / 2, mat=steel),
        ],
    )

    stem = add_cylinder(root, "Stem", 0.015, 0.018, 0.26, y=0.248, radial=48, mat=steel)
    bellows = [
        add_torus(root, f"_Bellow_{i}", radius=0.022, tube=0.0045, y=0.118 + i * 0.015, radial=36, tubular=12, mat=ink)
        for i in range(8)
    ]
    join_into(stem, bellows)
    sleeve = add_cylinder(root, "StemSleeve", 0.023, 0.026, 0.078, y=0.372, radial=40, mat=ink)
    join_into(
        sleeve,
        [
            add_torus(root, "_SleeveRing", radius=0.027, tube=0.0035, y=0.408, radial=32, tubular=10, mat=steel),
            add_cylinder(root, "_SleeveLip", 0.027, 0.027, 0.008, y=0.338, radial=36, mat=charcoal),
        ],
    )

    hub = add_cylinder(root, "Hub", 0.052, 0.058, 0.034, y=0.042, radial=56, mat=ink)
    join_into(
        hub,
        [
            add_cylinder(root, "_HubCap", 0.042, 0.042, 0.01, y=0.060, radial=48, mat=steel),
            add_cylinder(root, "_HubBoss", 0.018, 0.020, 0.016, y=0.070, radial=32, mat=charcoal),
            add_cylinder(root, "_HubDish", 0.062, 0.050, 0.012, y=0.028, radial=48, mat=ink),
        ],
    )

    for i in range(5):
        n = f"{i + 1:02d}"
        a = (i / 5) * math.pi * 2
        sx, sz = math.sin(a) * 0.158, math.cos(a) * 0.158
        spoke = add_round(
            root,
            f"Spoke_{n}",
            w=0.044,
            h=0.020,
            d=0.30,
            x=sx,
            y=0.036,
            z=sz,
            rx=0.07,
            ry=a,
            radius=0.009,
            segments=8,
            mat=charcoal,
        )
        join_into(
            spoke,
            [
                add_round(
                    root,
                    f"_SpokeRoot_{n}",
                    w=0.050,
                    h=0.024,
                    d=0.06,
                    x=math.sin(a) * 0.045,
                    y=0.040,
                    z=math.cos(a) * 0.045,
                    ry=a,
                    radius=0.01,
                    segments=6,
                    mat=ink,
                ),
                add_sphere(
                    root,
                    f"_SpokeEnd_{n}",
                    0.016,
                    x=math.sin(a) * 0.305,
                    y=0.030,
                    z=math.cos(a) * 0.305,
                    segments=28,
                    mat=ink,
                ),
            ],
        )
        _chair_caster(root, n, a, ink, charcoal, rubber)
    return root


def build_hex_table(mat):
    root = add_empty(None, "HexTable")
    top_y = 0.748
    add_hex(root, "Plinth", radius=0.52, height=0.045, y=0.024, ry=HEX_ROT, corner=0.12, mat=mat["navyDeep"])
    add_hex(root, "GlowTrim", radius=0.58, height=0.012, y=0.054, ry=HEX_ROT, corner=0.12, mat=mat["cyan"])
    add_hex(root, "Pedestal", radius=0.44, height=0.58, y=0.35, ry=HEX_ROT, corner=0.1, mat=mat["navy"])
    add_hex(root, "Top", radius=1.4, height=0.072, y=0.698, ry=HEX_ROT, corner=0.26, mat=mat["white"])
    add_hex(root, "Well", radius=0.5, height=0.02, y=0.668, ry=HEX_ROT, corner=0.14, mat=mat["ice"])
    for i in range(6):
        a = (i / 6) * math.pi * 2 + HEX_ROT
        add_cylinder(
            root,
            f"Pad_{i + 1:02d}",
            0.048,
            0.048,
            0.006,
            x=math.sin(a) * 1.02,
            y=top_y + 0.004,
            z=math.cos(a) * 1.02,
            radial=32,
            mat=mat["glow"],
        )
    add_round(root, "Panel", w=0.22, h=0.008, d=0.13, x=0.72, y=top_y + 0.006, z=-0.18, ry=-0.55, radius=0.012, mat=mat["whiteSoft"])
    add_round(root, "PanelScreen", w=0.18, h=0.004, d=0.09, x=0.72, y=top_y + 0.012, z=-0.18, ry=-0.55, radius=0.006, mat=mat["screen"])
    return root


def build_oct_table(mat):
    """Octagonal hub table from the 9-view reference: navy drum, cyan floor strip, white top, recessed well."""
    root = add_empty(None, "OctTable")
    top_y = OCT_TOP_Y
    top_h = 0.082
    well_r = 0.58
    drum_r = 1.26
    # Cyan neon at the drum foot (same radius so it reads as the base edge, not a wider pancake).
    add_oct(root, "GlowTrim", radius=drum_r, height=0.022, y=0.014, ry=OCT_ROT, corner=0.07, mat=mat["glow"])
    add_oct(root, "Pedestal", radius=drum_r, height=0.640, y=0.348, ry=OCT_ROT, corner=0.07, mat=mat["navy"])
    add_oct_ring(
        root,
        "Top",
        radius_outer=1.50,
        radius_inner=well_r,
        height=top_h,
        y=top_y - top_h / 2,
        ry=OCT_ROT,
        corner=0.09,
        bevel_rim=0.012,
        mat=mat["white"],
    )
    add_oct(root, "Well", radius=well_r - 0.02, height=0.014, y=0.675, ry=OCT_ROT, corner=0.05, mat=mat["navyDeep"])
    add_oct(root, "WellGlass", radius=well_r - 0.02, height=0.005, y=top_y - 0.010, ry=OCT_ROT, corner=0.045, mat=mat["glass"])
    return root


def build_laptop(mat, name="Laptop", chassis="charcoal"):
    body = mat[chassis]
    root = add_empty(None, name)
    base = add_round(root, "Base", w=0.32, h=0.014, d=0.22, y=0.007, radius=0.007, mat=body)
    hinge_l = add_cylinder(root, "Hinge_L", 0.005, 0.005, 0.04, x=-0.12, y=0.012, z=-0.105, rz=math.pi / 2, mat=body)
    hinge_r = add_cylinder(root, "Hinge_R", 0.005, 0.005, 0.04, x=0.12, y=0.012, z=-0.105, rz=math.pi / 2, mat=body)
    join_into(base, [hinge_l, hinge_r])
    deck = add_round(root, "KeyboardDeck", w=0.28, h=0.004, d=0.14, y=0.016, z=0.02, radius=0.002, mat=mat["navyDeep"])
    extras = []
    extras.append(add_round(root, "Trackpad", w=0.09, h=0.003, d=0.055, y=0.018, z=0.072, radius=0.004, mat=mat["charcoal"]))
    cols, rows = 13, 4
    for iy in range(rows):
        for ix in range(cols):
            extras.append(
                add_round(
                    root,
                    f"_key_{iy}_{ix}",
                    w=0.016,
                    h=0.004,
                    d=0.016,
                    x=(ix - (cols - 1) / 2) * 0.019,
                    y=0.02,
                    z=-0.02 + iy * 0.022,
                    radius=0.002,
                    segments=2,
                    mat=mat["key"],
                )
            )
    join_into(deck, extras)
    lid = add_empty(root, "Lid", y=0.014, z=-0.105, rx=-1.05)
    add_round(lid, "ScreenBack", w=0.32, h=0.2, d=0.01, y=0.1, radius=0.007, mat=body)
    add_round(lid, "Screen", w=0.29, h=0.175, d=0.004, y=0.1, z=0.008, radius=0.003, mat=mat["screen"])
    if name == "Laptop":
        add_round(lid, "Logo", w=0.028, h=0.028, d=0.004, y=0.1, z=-0.008, radius=0.005, mat=mat["cyan"])
        add_round(lid, "Chart_1", w=0.04, h=0.07, d=0.003, x=-0.06, y=0.085, z=0.012, radius=0.002, mat=mat["ice"])
        add_round(lid, "Chart_2", w=0.04, h=0.1, d=0.003, x=-0.012, y=0.1, z=0.012, radius=0.002, mat=mat["cyan"])
        add_round(lid, "Chart_3", w=0.04, h=0.055, d=0.003, x=0.036, y=0.078, z=0.012, radius=0.002, mat=mat["whiteSoft"])
    return root


def build_hub_plant(mat):
    root = add_empty(None, "HubPlant")
    add_cylinder(root, "PlantPot", 0.042, 0.034, 0.068, y=0.034, radial=48, mat=mat["charcoal"])
    add_cylinder(root, "PlantSoil", 0.034, 0.034, 0.01, y=0.066, radial=32, mat=mat["soil"])
    for i in range(6):
        a = (i / 6) * math.pi * 2
        leaf = add_capsule(
            root,
            f"PlantLeaf_{i + 1:02d}",
            r=0.01,
            length=0.055,
            x=math.cos(a) * 0.022,
            y=0.09,
            z=math.sin(a) * 0.022,
            rx=-0.42,
            ry=a,
            mat=mat["leaf"] if i % 2 == 0 else mat["leafDark"],
        )
        leaf.scale = (1.7, 0.5, 1.0)
    add_sphere(root, "PlantBud", 0.018, y=0.108, segments=24, mat=mat["leaf"])
    return root


def build_hub_mug(mat):
    root = add_empty(None, "HubMug")
    add_cylinder(root, "Cup", 0.032, 0.028, 0.07, y=0.035, radial=48, mat=mat["charcoal"])
    add_cylinder(root, "Rim", 0.033, 0.033, 0.008, y=0.068, radial=48, mat=mat["cyan"])
    add_torus(
        root,
        "Handle",
        radius=0.022,
        tube=0.006,
        x=0.04,
        y=0.036,
        rx=0.0,
        rz=math.pi / 2,
        three_horizontal=False,
        mat=mat["charcoal"],
    )
    return root


def build_bookshelf_table(mat):
    root = add_empty(None, "BookshelfTable")
    carcass = add_empty(root, "Carcass")
    add_round(carcass, "Plinth", w=2.18, h=0.055, d=0.44, y=0.0275, radius=0.02, mat=mat["navy"])
    add_round(carcass, "BottomDeck", w=2.32, h=0.048, d=0.5, y=0.079, radius=0.02, mat=mat["white"])
    add_round(carcass, "Top", w=2.32, h=0.058, d=0.5, y=0.67, radius=0.022, mat=mat["white"])
    add_round(carcass, "LeftSide", w=0.05, h=0.58, d=0.5, x=-1.135, y=0.37, radius=0.016, mat=mat["white"])
    add_round(carcass, "RightSide", w=0.05, h=0.58, d=0.5, x=1.135, y=0.37, radius=0.016, mat=mat["white"])
    add_round(carcass, "Back", w=2.22, h=0.58, d=0.034, y=0.37, z=-0.233, radius=0.01, mat=mat["whiteSoft"])
    add_round(carcass, "Divider", w=0.034, h=0.54, d=0.46, x=0.42, y=0.37, radius=0.01, mat=mat["white"])
    add_round(carcass, "ShelfBoard", w=1.48, h=0.028, d=0.44, x=-0.36, y=0.355, radius=0.008, mat=mat["whiteSoft"])
    add_round(carcass, "DrawerFront", w=0.78, h=0.13, d=0.028, x=-0.58, y=0.175, z=0.236, radius=0.01, mat=mat["white"])
    add_round(carcass, "DrawerPull", w=0.12, h=0.012, d=0.012, x=-0.58, y=0.175, z=0.255, radius=0.005, mat=mat["navy"])

    binders = add_empty(root, "Binders")
    binder_mats = [mat["white"], mat["cyan"], mat["whiteSoft"], mat["cyan"], mat["white"], mat["gold"], mat["cyan"]]
    binder_w, gap, start_x = 0.052, 0.02, -0.98
    shelf_top, binder_h, binder_d = 0.369, 0.24, 0.2
    for i, material in enumerate(binder_mats):
        n = f"{i + 1:02d}"
        x = start_x + i * (binder_w + gap)
        y = shelf_top + binder_h / 2
        add_round(binders, f"Binder_{n}", w=binder_w, h=binder_h, d=binder_d, x=x, y=y, z=0.02, radius=0.01, mat=material)
        add_cylinder(
            binders,
            f"BinderPull_{n}",
            0.01,
            0.01,
            0.01,
            x=x,
            y=y + 0.02,
            z=0.02 + binder_d / 2 + 0.002,
            rx=math.pi / 2,
            mat=mat["pull"],
        )

    vitrine = add_empty(root, "Vitrine")
    add_round(vitrine, "GlassFront", w=0.68, h=0.52, d=0.012, x=0.78, y=0.38, z=0.232, radius=0.004, mat=mat["glass"])
    add_round(vitrine, "GlassLeft", w=0.01, h=0.52, d=0.42, x=0.445, y=0.38, z=0.02, radius=0.003, mat=mat["glass"])
    display = add_empty(vitrine, "DisplayModel", x=0.78, y=0.12, z=0.02)
    add_round(display, "DisplayPodium", w=0.28, h=0.04, d=0.18, y=0.02, radius=0.01, mat=mat["white"])
    add_round(display, "DisplayTowerA", w=0.08, h=0.22, d=0.08, x=-0.05, y=0.15, z=0.01, radius=0.01, mat=mat["whiteSoft"])
    add_round(display, "DisplayTowerB", w=0.07, h=0.14, d=0.07, x=0.055, y=0.11, z=-0.02, radius=0.01, mat=mat["white"])
    add_round(display, "DisplayBeacon", w=0.04, h=0.04, d=0.04, x=-0.05, y=0.28, z=0.01, radius=0.008, mat=mat["cyan"])

    plant = add_empty(root, "Plant", x=-0.92, y=0.699, z=0.04)
    add_round(plant, "PlantPot", w=0.16, h=0.15, d=0.16, y=0.075, radius=0.022, mat=mat["white"])
    add_round(plant, "PlantSoil", w=0.12, h=0.02, d=0.12, y=0.142, radius=0.008, mat=mat["soil"])
    for i in range(7):
        a = (i / 7) * math.pi * 2
        leaf = add_capsule(
            plant,
            f"PlantLeaf_{i + 1:02d}",
            r=0.012,
            length=0.07,
            x=math.cos(a) * 0.032,
            y=0.172,
            z=math.sin(a) * 0.032,
            rx=-0.38,
            ry=a,
            mat=mat["leaf"] if i % 2 == 0 else mat["leafDark"],
        )
        leaf.scale = (1.8, 0.55, 1.0)
    add_sphere(plant, "PlantBud", 0.024, y=0.188, mat=mat["leaf"])
    return root


def _mass_box(parent, name, cx, cy, cz, sx, sy, sz, mat, chamfer=0.05):
    return add_round(parent, name, w=sx, h=sy, d=sz, x=cx, y=cy, z=cz, radius=chamfer, mat=mat)


def build_digital_massing(mat):
    root = add_empty(None, "DigitalMassing")
    navy = _mass_box(root, "navy", 0, -0.04, 0, 7.2, 0.08, 5.4, mat["navy"], 0.04)
    podium = _mass_box(root, "_podium", 0.05, 0.2, 0.05, 4.4, 0.4, 2.7, mat["mass"], 0.06)
    t1 = _mass_box(root, "_t1", -1.35, 1.65, 0.2, 1.2, 2.5, 1.2, mat["mass"], 0.05)
    t2 = _mass_box(root, "_t2", 0.1, 2.25, -0.35, 1.0, 3.7, 1.0, mat["mass"], 0.05)
    t3 = _mass_box(root, "_t3", 1.4, 1.275, 0.28, 1.35, 1.75, 1.25, mat["mass"], 0.05)
    join_into(podium, [t1, t2, t3])
    podium.name = "mass"
    cyan_bits = []
    for i in range(6):
        cyan_bits.append(
            _mass_box(root, f"_band{i}", 0.1, 0.72 + i * 0.52, -0.35, 1.06, 0.045, 1.06, mat["cyan"], 0.01)
        )
    cyan_bits.append(_mass_box(root, "_bridge", -0.62, 2.08, -0.05, 1.55, 0.16, 0.32, mat["cyan"], 0.02))
    join_into(cyan_bits[0], cyan_bits[1:])
    cyan_bits[0].name = "cyan"
    gold_a = _mass_box(root, "gold", 0.1, 4.28, -0.35, 0.34, 0.34, 0.34, mat["gold"], 0.04)
    gold_b = _mass_box(root, "_beacon", 0.1, 4.52, -0.35, 0.12, 0.18, 0.12, mat["gold"], 0.02)
    gold_c = _mass_box(root, "_marker", -1.85, 0.43, 1.05, 0.22, 0.06, 0.22, mat["gold"], 0.02)
    join_into(gold_a, [gold_b, gold_c])
    return root


def build_lead_table(mat):
    root = add_empty(None, "LeadTable")
    add_round(root, "Top", w=2.35, h=0.08, d=1.05, y=0.73, radius=0.07, mat=mat["paper"])
    for i, x, z in ((1, -0.95, -0.38), (2, 0.95, -0.38), (3, -0.95, 0.38), (4, 0.95, 0.38)):
        add_cylinder(root, f"Leg_{i}", 0.055, 0.06, 0.69, x=x, y=0.345, z=z, mat=mat["whiteSoft"])
    return root


def build_lead_chair(mat):
    root = add_empty(None, "LeadChair")
    add_round(root, "Seat", w=0.44, h=0.06, d=0.44, y=0.46, radius=0.05, mat=mat["ice"])
    add_round(root, "Back", w=0.42, h=0.48, d=0.07, y=0.74, z=-0.2, rx=-0.12, radius=0.045, mat=mat["ice"])
    add_cylinder(root, "Stem", 0.028, 0.034, 0.28, y=0.28, mat=mat["paper"])
    add_cylinder(root, "Base", 0.18, 0.18, 0.04, y=0.03, mat=mat["paper"])
    return root


def build_lead_mug(mat):
    root = add_empty(None, "LeadMug")
    add_cylinder(root, "Cup", 0.038, 0.034, 0.08, y=0.04, radial=48, mat=mat["ice"])
    add_torus(root, "Handle", radius=0.028, tube=0.007, x=0.042, y=0.04, rx=0.0, rz=math.pi / 2, three_horizontal=False, mat=mat["iceDeep"])
    add_cylinder(root, "_liquid", 0.03, 0.03, 0.004, y=0.072, mat=mat["liquid"])
    return root


def build_lead_notebook(mat):
    root = add_empty(None, "LeadNotebook")
    add_round(root, "Cover", w=0.16, h=0.012, d=0.22, y=0.006, radius=0.01, mat=mat["iceDeep"])
    add_round(root, "Pages", w=0.15, h=0.008, d=0.2, y=0.014, radius=0.005, mat=mat["paper"])
    return root


def build_lead_blueprints(mat):
    root = add_empty(None, "LeadBlueprints")
    for i in range(3):
        add_tube(
            root,
            f"Roll_{i + 1}",
            0.03,
            0.018,
            0.34,
            x=(i - 1) * 0.045,
            y=0.03,
            z=i * 0.01,
            rx=math.pi / 2,
            radial=48,
            mat=mat["whiteSoft"] if i == 1 else mat["paper"],
        )
    return root


def build_lead_dashboard(mat):
    root = add_empty(None, "LeadDashboard")
    add_round(root, "Board", w=4.2, h=1.85, d=0.06, y=0.92, radius=0.05, mat=mat["whiteSoft"])
    add_round(root, "Header", w=4.2, h=0.22, d=0.07, y=1.74, radius=0.035, mat=mat["navy"])
    icons = ["IconClient", "IconLead", "IconPm", "IconMep", "IconArch"]
    for i, name in enumerate(icons):
        add_cylinder(
            root,
            name,
            0.09,
            0.09,
            0.03,
            x=-1.5 + i * 0.42,
            y=1.74,
            z=0.05,
            rx=math.pi / 2,
            mat=mat["gold"] if i == 1 else mat["ice"],
        )
    g = add_empty(root, "ArchModel", x=1.15, y=0.02, z=0.08)
    add_round(g, "ArchPodium", w=0.42, h=0.06, d=0.28, y=0.03, radius=0.02, mat=mat["ice"])
    add_round(g, "ArchWing", w=0.18, h=0.22, d=0.22, x=-0.1, y=0.17, radius=0.02, mat=mat["whiteSoft"])
    add_round(g, "ArchTower", w=0.16, h=0.38, d=0.16, x=0.1, y=0.25, radius=0.02, mat=mat["paper"])
    for i in range(4):
        add_round(
            g,
            f"ArchWindow_{i + 1}",
            w=0.12,
            h=0.035,
            d=0.01,
            x=0.1,
            y=0.14 + i * 0.07,
            z=0.085,
            radius=0.004,
            mat=mat["navy"],
        )
    g = add_empty(root, "StructModel", y=0.02, z=0.08)
    for ix in range(3):
        for iz in range(3):
            add_cylinder(
                g,
                f"Col_{ix}{iz}",
                0.018,
                0.018,
                0.36,
                x=(ix - 1) * 0.14,
                y=0.18,
                z=(iz - 1) * 0.12,
                mat=mat["struct"],
            )
    for iy in range(3):
        add_round(g, f"Slab_{iy + 1}", w=0.32, h=0.016, d=0.28, y=0.08 + iy * 0.12, radius=0.004, mat=mat["struct"])
    g = add_empty(root, "MepModel", x=-1.15, y=0.04, z=0.08)
    add_round(g, "MepFootprint", w=0.4, h=0.02, d=0.28, y=0.01, radius=0.006, mat=mat["navyDeep"])
    add_cylinder(g, "DuctMain", 0.035, 0.035, 0.32, y=0.12, z=0.02, rx=math.pi / 2, mat=mat["cyan"])
    add_cylinder(g, "PipeGreen", 0.016, 0.016, 0.28, x=-0.1, y=0.1, rx=math.pi / 2, mat=mat["mepGreen"])
    add_cylinder(g, "PipeGold", 0.014, 0.014, 0.22, x=0.12, y=0.16, rz=math.pi / 2, mat=mat["gold"])
    add_round(g, "AhUnit", w=0.1, h=0.1, d=0.08, x=0.12, y=0.1, z=-0.06, radius=0.012, mat=mat["iceDeep"])
    return root
