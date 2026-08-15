"""Office figures: shared anatomical rig, posed per kit part.

Author in Three.js metres (Y up, +Z forward). Joint names stay compatible
with app/lab/model-idle.tsx (HipJoint_, KneeJoint_, ShoulderJoint_, …).
"""

from __future__ import annotations

import math

from core import (
    add_capsule,
    add_cylinder,
    add_empty,
    add_round,
    add_sphere,
    add_torus,
    add_tube,
    flatten_world,
    rotate_three,
)

# Standing hip height so shoe soles sit on y = 0.
THIGH_R, THIGH_L = 0.066, 0.36
SHIN_R, SHIN_L = 0.052, 0.35
ARM_R, ARM_L = 0.048, 0.26
FORE_R, FORE_L = 0.042, 0.24
HIP_STAND = 0.96
HIP_SIT = 0.50


def _scale(obj, sx, sy, sz):
    """Scale in Three.js axes on an unrotated mesh."""
    obj.scale = (sx, sz, sy)
    return obj


def _hang(parent, name, r, length, mat, radial=40, cap=14):
    return add_capsule(parent, name, r=r, length=length, hang=True, y=0, cap=cap, radial=radial, mat=mat)


def _span(r, length):
    return length + 2.0 * r


def add_head(parent, mat, y, look_x=0.0, hardhat=False, hair=True):
    """Vinyl-toy / designer-figure head: big glassy eyes, tiny nose, chunky hair."""
    skin, deep, hair_m = mat["skin"], mat["skinDeep"], mat["hair"]
    lash, spec = mat["lash"], mat["spec"]
    head_rig = add_empty(parent, "HeadRig", y=y, z=-0.002, rx=look_x)
    add_cylinder(head_rig, "Neck", 0.048, 0.056, 0.044, y=0.006, z=-0.006, radial=44, mat=skin)

    skull = add_sphere(head_rig, "Head", 0.132, y=0.152, z=0.006, segments=64, mat=skin)
    _scale(skull, 1.12, 1.10, 0.94)
    add_round(head_rig, "Jaw", w=0.168, h=0.088, d=0.128, y=0.072, z=0.038, radius=0.042, segments=8, mat=skin)
    add_round(head_rig, "Chin", w=0.062, h=0.042, d=0.052, y=0.042, z=0.086, radius=0.02, segments=8, mat=skin)
    cheek_l = add_sphere(head_rig, "Cheek_L", 0.042, x=-0.072, y=0.102, z=0.072, segments=40, mat=skin)
    _scale(cheek_l, 1.15, 0.95, 0.9)
    cheek_r = add_sphere(head_rig, "Cheek_R", 0.042, x=0.072, y=0.102, z=0.072, segments=40, mat=skin)
    _scale(cheek_r, 1.15, 0.95, 0.9)

    for side, x, brow_rz in (("L", -0.046, 0.18), ("R", 0.046, -0.18)):
        white = add_sphere(head_rig, f"EyeWhite_{side}", 0.032, x=x, y=0.136, z=0.108, segments=40, mat=mat["eyeWhite"])
        _scale(white, 1.28, 0.90, 0.68)
        iris = add_sphere(head_rig, f"Iris_{side}", 0.019, x=x, y=0.134, z=0.124, segments=32, mat=mat["iris"])
        _scale(iris, 1.12, 1.02, 0.70)
        add_sphere(head_rig, f"Pupil_{side}", 0.009, x=x, y=0.134, z=0.136, segments=20, mat=mat["pupil"])
        add_sphere(head_rig, f"Highlight_{side}", 0.007, x=x - 0.007, y=0.144, z=0.140, segments=16, mat=spec)
        add_sphere(head_rig, f"Highlight_{side}2", 0.0034, x=x + 0.008, y=0.126, z=0.140, segments=12, mat=spec)
        add_round(
            head_rig,
            f"Lid_{side}",
            w=0.068,
            h=0.009,
            d=0.024,
            x=x,
            y=0.158,
            z=0.112,
            rx=-0.28,
            rz=0.08 if side == "L" else -0.08,
            radius=0.004,
            segments=6,
            mat=lash,
        )
        add_round(
            head_rig,
            f"Brow_{side}",
            w=0.058,
            h=0.016,
            d=0.018,
            x=x,
            y=0.164,
            z=0.102,
            rz=brow_rz,
            radius=0.006,
            segments=6,
            mat=hair_m,
        )

    add_sphere(head_rig, "Nose", 0.011, y=0.108, z=0.124, segments=24, mat=deep)
    add_round(head_rig, "Lip", w=0.030, h=0.006, d=0.009, y=0.082, z=0.122, radius=0.004, segments=6, mat=mat["lip"])
    add_sphere(head_rig, "LipCorner_L", 0.0045, x=-0.016, y=0.086, z=0.120, segments=12, mat=mat["lip"])
    add_sphere(head_rig, "LipCorner_R", 0.0045, x=0.016, y=0.086, z=0.120, segments=12, mat=mat["lip"])
    add_round(head_rig, "Ear_L", w=0.022, h=0.058, d=0.032, x=-0.128, y=0.128, z=-0.002, ry=0.28, radius=0.012, segments=8, mat=skin)
    add_round(head_rig, "Ear_R", w=0.022, h=0.058, d=0.032, x=0.128, y=0.128, z=-0.002, ry=-0.28, radius=0.012, segments=8, mat=skin)

    if hair and not hardhat:
        cap = add_sphere(head_rig, "Hair", 0.138, y=0.208, z=-0.028, segments=48, mat=hair_m)
        _scale(cap, 1.16, 0.70, 1.10)
        add_round(head_rig, "HairFringe", w=0.14, h=0.042, d=0.048, y=0.204, z=0.078, radius=0.02, segments=8, mat=hair_m)
        add_round(head_rig, "HairSide_L", w=0.048, h=0.09, d=0.07, x=-0.108, y=0.155, z=-0.01, radius=0.022, segments=8, mat=hair_m)
        add_round(head_rig, "HairSide_R", w=0.048, h=0.09, d=0.07, x=0.108, y=0.155, z=-0.01, radius=0.022, segments=8, mat=hair_m)
        add_round(head_rig, "HairBack", w=0.14, h=0.12, d=0.08, y=0.145, z=-0.092, radius=0.032, segments=8, mat=hair_m)
        add_round(head_rig, "HairSpike_L", w=0.05, h=0.07, d=0.06, x=-0.07, y=0.248, z=-0.02, rx=-0.35, ry=-0.2, radius=0.02, segments=6, mat=hair_m)
        add_round(head_rig, "HairSpike_R", w=0.05, h=0.07, d=0.06, x=0.07, y=0.248, z=-0.02, rx=-0.35, ry=0.2, radius=0.02, segments=6, mat=hair_m)
    if hardhat:
        add_sphere(head_rig, "HatDome", 0.155, y=0.22, z=-0.012, segments=48, mat=mat["paper"])
        add_cylinder(head_rig, "HatBrim", 0.178, 0.178, 0.016, y=0.118, radial=56, mat=mat["whiteSoft"])
        add_round(head_rig, "HatBand", w=0.24, h=0.02, d=0.24, y=0.128, radius=0.01, mat=mat["gold"])
    return head_rig


def add_hand(wrist, side, mat, pose="rest"):
    skin = mat["skin"]
    add_round(wrist, f"Hand_{side}", w=0.072, h=0.026, d=0.088, y=-0.008, z=0.032, radius=0.012, mat=skin)
    add_round(wrist, f"Knuckle_{side}", w=0.066, h=0.018, d=0.022, y=-0.004, z=0.068, radius=0.008, mat=skin)
    widths = (-0.024, -0.008, 0.008, 0.023)
    segs = ((0.026, 0.018, 0.014), (0.03, 0.02, 0.015), (0.028, 0.019, 0.014), (0.022, 0.016, 0.012))
    curl = {"rest": 0.18, "type": 0.2, "point": 0.08, "hold": 0.55, "grip": 0.7}.get(pose, 0.22)
    point_i = 1 if pose == "point" else None
    for i, fx in enumerate(widths):
        extra = -0.35 if point_i == i else curl + i * 0.04
        joint = add_empty(wrist, f"FingerJoint_{side}_{i}", x=fx, y=-0.006, z=0.066, rx=extra)
        add_capsule(joint, f"Finger_{side}_{i}", r=0.0074, length=segs[i][0], z=segs[i][0] / 2 + 0.005, rx=math.pi / 2, cap=8, radial=14, mat=skin)
        mid = add_empty(joint, f"FingerJoint_{side}_{i}b", z=segs[i][0] + 0.004, rx=0.18 if pose != "point" or i != point_i else 0.04)
        add_capsule(mid, f"Finger_{side}_{i}b", r=0.0066, length=segs[i][1], z=segs[i][1] / 2 + 0.003, rx=math.pi / 2, cap=8, radial=12, mat=skin)
        tip = add_empty(mid, f"FingerJoint_{side}_{i}c", z=segs[i][1] + 0.003, rx=0.16 if pose != "point" or i != point_i else 0.02)
        add_capsule(tip, f"Finger_{side}_{i}c", r=0.0058, length=segs[i][2], z=segs[i][2] / 2 + 0.002, rx=math.pi / 2, cap=8, radial=12, mat=skin)
    sgn = 1.0 if side == "L" else -1.0
    thumb = add_empty(
        wrist,
        f"ThumbJoint_{side}",
        x=0.032 * sgn,
        y=-0.002,
        z=0.014,
        rx=0.38,
        ry=0.85 * sgn,
        rz=0.32 * sgn,
    )
    add_capsule(thumb, f"Thumb_{side}", r=0.009, length=0.028, z=0.02, rx=math.pi / 2, cap=8, radial=14, mat=skin)
    t2 = add_empty(thumb, f"ThumbJoint_{side}b", z=0.034, rx=0.22)
    add_capsule(t2, f"Thumb_{side}b", r=0.008, length=0.02, z=0.014, rx=math.pi / 2, cap=8, radial=12, mat=skin)


def add_arm(spine, side, mat, shirt, x, y, sh_x, elb_x, sh_z=0.0, elb_z=0.0, hand="rest", wrist_rx=None):
    sh = add_empty(spine, f"ShoulderJoint_{side}", x=x, y=y, z=0.03, rx=sh_x, rz=sh_z)
    add_sphere(sh, f"Shoulder_{side}", 0.062, segments=40, mat=shirt)
    add_torus(sh, f"ShoulderRing_{side}", radius=0.048, tube=0.006, rx=math.pi / 2, radial=28, tubular=10, mat=mat["ink"])
    _hang(sh, f"UpperArm_{side}", ARM_R, ARM_L, shirt, radial=40)
    elb = add_empty(sh, f"ElbowJoint_{side}", y=-_span(ARM_R, ARM_L), rx=elb_x, rz=elb_z)
    add_sphere(elb, f"Elbow_{side}", 0.044, segments=32, mat=shirt)
    add_torus(elb, f"ElbowRing_{side}", radius=0.034, tube=0.005, rx=math.pi / 2, radial=24, tubular=8, mat=mat["ink"])
    _hang(elb, f"ForeArm_{side}", FORE_R, FORE_L, shirt, radial=36)
    wrist_y = -_span(FORE_R, FORE_L)
    add_cylinder(elb, f"Cuff_{side}", 0.038, 0.04, 0.032, y=wrist_y + 0.016, radial=32, mat=shirt)
    add_cylinder(elb, f"CuffTrim_{side}", 0.042, 0.043, 0.008, y=wrist_y + 0.03, radial=32, mat=mat["cyan"])
    wrist = add_empty(elb, f"Wrist_{side}", y=wrist_y)
    flatten_world(wrist)
    if wrist_rx is None:
        wrx = 0.28 if hand == "type" else 0.12
    else:
        wrx = wrist_rx
    rotate_three(wrist, rx=wrx, ry=0.05 if side == "L" else -0.05)
    add_hand(wrist, side, mat, pose=hand)
    return wrist, elb


def add_shoe(ankle, side, mat):
    shoe, sole, skin = mat["shoe"], mat["sole"], mat["skin"]
    add_sphere(ankle, f"AnkleBall_{side}", 0.026, y=0.006, z=-0.006, segments=28, mat=skin)
    add_round(ankle, f"Foot_{side}", w=0.098, h=0.058, d=0.22, y=0.008, z=0.058, radius=0.02, mat=shoe)
    add_round(ankle, f"Sole_{side}", w=0.10, h=0.018, d=0.23, y=-0.016, z=0.054, radius=0.01, mat=sole)
    add_sphere(ankle, f"Heel_{side}", 0.028, y=0.008, z=-0.022, segments=24, mat=shoe)
    add_round(ankle, f"Toe_{side}", w=0.088, h=0.032, d=0.055, y=0.004, z=0.155, radius=0.014, mat=shoe)


def add_leg(root, side, mat, x, hip_y, hip_x, knee_x, hip_ry=0.0):
    trouser, skin = mat["trouser"], mat["skin"]
    hip = add_empty(root, f"HipJoint_{side}", x=x, y=hip_y, z=0.02, rx=hip_x, ry=hip_ry)
    add_sphere(hip, f"Hip_{side}", 0.078, segments=40, mat=trouser)
    add_torus(hip, f"HipRing_{side}", radius=0.058, tube=0.006, rx=math.pi / 2, radial=28, tubular=10, mat=mat["ink"])
    _hang(hip, f"UpperLeg_{side}", THIGH_R, THIGH_L, trouser, radial=44)
    knee = add_empty(hip, f"KneeJoint_{side}", y=-_span(THIGH_R, THIGH_L), rx=knee_x)
    add_sphere(knee, f"Knee_{side}", 0.052, segments=32, mat=trouser)
    _hang(knee, f"LowerLeg_{side}", SHIN_R, SHIN_L, trouser, radial=40)
    ankle = add_empty(knee, f"Ankle_{side}", y=-_span(SHIN_R, SHIN_L), rx=-(hip_x + knee_x) + 0.04)
    add_cylinder(knee, f"TrouserCuff_{side}", 0.048, 0.05, 0.04, y=-_span(SHIN_R, SHIN_L) + 0.06, radial=32, mat=trouser)
    add_shoe(ankle, side, mat)
    return hip


def add_torso(root, mat, hip_y, shirt, sit=False, look_x=None, hardhat=False):
    skin, cloth, tie = mat["skin"], shirt, mat["cyan"]
    spine = add_empty(root, "Spine", y=hip_y + 0.02, z=0.03, rx=0.14 if sit else 0.06)
    add_round(spine, "Pelvis", w=0.28, h=0.13, d=0.18, y=-0.02, z=-0.01, radius=0.055, mat=mat["trouser"])
    if sit:
        add_round(spine, "SeatMass", w=0.24, h=0.09, d=0.16, y=-0.05, z=-0.04, radius=0.04, mat=mat["trouser"])
    add_round(spine, "Torso", w=0.22, h=0.28, d=0.13, y=0.2, z=-0.012, radius=0.055, mat=skin)
    add_round(spine, "Chest", w=0.26, h=0.16, d=0.15, y=0.28, z=0.01, radius=0.05, mat=cloth)
    add_round(spine, "Shirt", w=0.3, h=0.38, d=0.18, y=0.2, radius=0.07, mat=cloth)
    add_round(spine, "ShirtTail", w=0.28, h=0.1, d=0.16, y=0.02, z=-0.01, radius=0.04, mat=cloth)
    add_round(spine, "Placket", w=0.016, h=0.26, d=0.01, y=0.2, z=0.094, radius=0.005, mat=mat["whiteSoft"])
    add_torus(spine, "Collar", radius=0.05, tube=0.012, y=0.38, rx=math.pi / 2, radial=40, tubular=16, mat=cloth)
    add_torus(spine, "CollarBand", radius=0.052, tube=0.007, y=0.368, rx=math.pi / 2, radial=40, tubular=14, mat=mat["navy"])
    add_round(spine, "CollarLeaf_L", w=0.072, h=0.042, d=0.014, x=-0.04, y=0.388, z=0.044, ry=0.48, rz=-0.22, radius=0.01, mat=cloth)
    add_round(spine, "CollarLeaf_R", w=0.072, h=0.042, d=0.014, x=0.04, y=0.388, z=0.044, ry=-0.48, rz=0.22, radius=0.01, mat=cloth)
    add_round(spine, "TieKnot", w=0.038, h=0.032, d=0.028, y=0.352, z=0.096, radius=0.01, mat=tie)
    add_round(spine, "Tie", w=0.028, h=0.2, d=0.014, y=0.22, z=0.098, radius=0.008, mat=tie)
    add_round(spine, "TieTip", w=0.024, h=0.036, d=0.012, y=0.108, z=0.098, radius=0.008, mat=tie)
    if look_x is None:
        look_x = 0.2 if sit else 0.04
    add_head(spine, mat, y=0.40, look_x=look_x, hardhat=hardhat)
    return spine


def add_briefcase(wrist, mat):
    bag = add_empty(wrist, "Briefcase", x=0.07, y=-0.02, z=0.01, ry=0.1)
    add_round(bag, "Case", w=0.078, h=0.17, d=0.24, y=-0.12, radius=0.018, mat=mat["charcoal"])
    add_round(bag, "CaseBand", w=0.082, h=0.028, d=0.246, y=-0.12, radius=0.008, mat=mat["navy"])
    add_round(bag, "Clasp", w=0.034, h=0.018, d=0.014, y=-0.12, z=0.128, radius=0.004, mat=mat["cyan"])
    add_round(bag, "Latch_L", w=0.012, h=0.02, d=0.01, x=-0.018, y=-0.055, z=0.122, radius=0.003, mat=mat["gold"])
    add_round(bag, "Latch_R", w=0.012, h=0.02, d=0.01, x=0.018, y=-0.055, z=0.122, radius=0.003, mat=mat["gold"])
    add_capsule(bag, "HandlePost_L", r=0.008, length=0.03, y=-0.012, z=-0.04, mat=mat["charcoal"])
    add_capsule(bag, "HandlePost_R", r=0.008, length=0.03, y=-0.012, z=0.04, mat=mat["charcoal"])
    add_capsule(bag, "HandleBar", r=0.009, length=0.08, y=0.022, rx=math.pi / 2, mat=mat["charcoal"])
    return bag


def build_humanoid_sitting(mat, name="HumanoidSitting", shirt=None, look_x=0.22):
    shirt = shirt or mat["shirt"]
    root = add_empty(None, name)
    add_leg(root, "L", mat, -0.1, HIP_SIT, -math.pi / 2 + 0.05, math.pi / 2 - 0.08, hip_ry=0.06)
    add_leg(root, "R", mat, 0.1, HIP_SIT, -math.pi / 2 + 0.03, math.pi / 2 - 0.05, hip_ry=-0.06)
    spine = add_torso(root, mat, HIP_SIT, shirt, sit=True, look_x=look_x)
    add_arm(spine, "L", mat, shirt, -0.125, 0.40, -0.28, -2.16, -0.05, 0.08, hand="type", wrist_rx=0.02)
    add_arm(spine, "R", mat, shirt, 0.125, 0.40, -0.26, -2.18, 0.05, -0.08, hand="type", wrist_rx=0.02)
    return root


def build_walker(mat):
    shirt = mat["shirt"]
    root = add_empty(None, "Walker")
    add_leg(root, "L", mat, -0.09, HIP_STAND, 0.08, 0.12)
    add_leg(root, "R", mat, 0.09, HIP_STAND, -0.06, 0.1)
    spine = add_torso(root, mat, HIP_STAND, shirt, sit=False)
    add_arm(spine, "L", mat, shirt, -0.16, 0.34, -0.18, 0.22, -0.12, 0.04, hand="rest")
    wrist_r, _ = add_arm(spine, "R", mat, shirt, 0.16, 0.34, 0.12, 0.18, 0.1, -0.04, hand="grip")
    add_briefcase(wrist_r, mat)
    return root


def build_figure_sit(mat, name="LeadFigureSit"):
    return build_humanoid_sitting(mat, name=name, shirt=mat["whiteSoft"], look_x=0.2)


def build_figure_point(mat):
    shirt = mat["whiteSoft"]
    root = add_empty(None, "LeadFigurePoint")
    add_leg(root, "L", mat, -0.1, HIP_SIT, -math.pi / 2 + 0.05, math.pi / 2 - 0.08, hip_ry=0.05)
    add_leg(root, "R", mat, 0.1, HIP_SIT, -math.pi / 2 + 0.03, math.pi / 2 - 0.05, hip_ry=-0.05)
    spine = add_torso(root, mat, HIP_SIT, shirt, sit=True, look_x=-0.12)
    add_arm(spine, "L", mat, shirt, -0.13, 0.348, -0.28, -0.15, -0.1, 0.04, hand="rest")
    add_arm(spine, "R", mat, shirt, 0.13, 0.348, -1.55, -0.35, 0.08, -0.06, hand="point")
    return root


def build_figure_hardhat(mat):
    shirt = mat["whiteSoft"]
    root = add_empty(None, "LeadFigureHardhat")
    add_leg(root, "L", mat, -0.1, HIP_SIT, -math.pi / 2 + 0.05, math.pi / 2 - 0.08, hip_ry=0.05)
    add_leg(root, "R", mat, 0.1, HIP_SIT, -math.pi / 2 + 0.03, math.pi / 2 - 0.05, hip_ry=-0.05)
    spine = add_torso(root, mat, HIP_SIT, shirt, sit=True, look_x=0.16, hardhat=True)
    add_arm(spine, "L", mat, shirt, -0.125, 0.40, -0.28, -2.16, -0.05, 0.08, hand="type", wrist_rx=0.02)
    add_arm(spine, "R", mat, shirt, 0.125, 0.40, -0.26, -2.18, 0.05, -0.08, hand="type", wrist_rx=0.02)
    return root


def build_figure_stand_tablet(mat):
    shirt = mat["whiteSoft"]
    root = add_empty(None, "LeadFigureStandTablet")
    add_leg(root, "L", mat, -0.09, HIP_STAND, 0.04, 0.08)
    add_leg(root, "R", mat, 0.09, HIP_STAND, -0.03, 0.1)
    spine = add_torso(root, mat, HIP_STAND, shirt, sit=False, look_x=0.22)
    add_arm(spine, "L", mat, shirt, -0.16, 0.34, -0.2, 0.16, -0.08, 0.02, hand="rest")
    _, elb = add_arm(spine, "R", mat, shirt, 0.16, 0.34, -0.55, -1.22, 0.08, -0.1, hand="hold")
    tab = add_empty(elb, "Tablet", y=-0.28, z=0.04, rx=0.2)
    add_round(tab, "TabletBody", w=0.16, h=0.01, d=0.24, radius=0.008, mat=mat["charcoal"])
    add_round(tab, "TabletScreen", w=0.14, h=0.004, d=0.21, y=0.008, radius=0.004, mat=mat["screen"])
    return root


def build_figure_stand_plans(mat):
    shirt = mat["whiteSoft"]
    root = add_empty(None, "LeadFigureStandPlans")
    add_leg(root, "L", mat, -0.09, HIP_STAND, 0.04, 0.08)
    add_leg(root, "R", mat, 0.09, HIP_STAND, -0.03, 0.1)
    spine = add_torso(root, mat, HIP_STAND, shirt, sit=False, look_x=0.16)
    _, elb = add_arm(spine, "L", mat, shirt, -0.16, 0.34, -0.48, -1.12, -0.1, 0.08, hand="hold")
    add_arm(spine, "R", mat, shirt, 0.16, 0.34, -0.18, 0.14, 0.08, 0.02, hand="rest")
    rolls = add_empty(elb, "BlueprintBundle", x=0.02, y=-0.24, z=0.02, rx=0.15)
    for i in range(3):
        add_tube(
            rolls,
            f"Blueprint_{i + 1}",
            0.028,
            0.016,
            0.32,
            x=(i - 1) * 0.04,
            z=i * 0.012,
            rx=math.pi / 2,
            radial=40,
            mat=mat["whiteSoft"] if i == 1 else mat["paper"],
        )
    return root
