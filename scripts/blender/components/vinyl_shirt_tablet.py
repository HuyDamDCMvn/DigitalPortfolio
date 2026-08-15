"""Vinyl office figure rebuilt from the 15-view turnaround sheet.

Torso + neck voxel-fuse. Arms and legs stay on idle empties so ModelIdle
can walk. Head, collar piping, teal trim, tablet, and soles stay as overlays.
"""

from __future__ import annotations

import math

import bpy
from mathutils import Vector

from core import (
    add_capsule,
    add_cylinder,
    add_empty,
    add_round,
    add_sphere,
    add_torus,
    join_into,
    make_material,
)

FILE = "vinyl-shirt-tablet.glb"

HEAD_R = 0.159
HIP_Y = 0.500
THIGH_R, THIGH_L = 0.048, 0.168
SHIN_R, SHIN_L = 0.044, 0.152
ARM_R, ARM_L = 0.052, 0.092
FORE_R, FORE_L = 0.048, 0.058
FORE_R_R, FORE_L_R = 0.048, 0.090
SH_X, SH_Y, SH_Z = 0.108, 0.278, 0.052


def _span(r, length):
    return length + 2.0 * r


def _hang(parent, name, r, length, mat, radial=44):
    return add_capsule(parent, name, r=r, length=length, hang=True, y=0, cap=18, radial=radial, mat=mat)


def _three_to_blend(x, y, z):
    return Vector((x, -z, y))


def _join_world(target, extras):
    bpy.context.view_layer.update()
    baked = []
    for extra in extras:
        if extra is None or extra == target:
            continue
        mw = extra.matrix_world.copy()
        extra.parent = None
        extra.matrix_world = mw
        baked.append(extra)
    bpy.context.view_layer.update()
    return join_into(target, baked)


def _reparent_world(obj, parent):
    bpy.context.view_layer.update()
    mw = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = mw
    bpy.context.view_layer.update()


def _apply_mods(obj):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    old = obj.data
    obj.data = mesh
    obj.modifiers.clear()
    if old.users == 0:
        bpy.data.meshes.remove(old)


def _vinyl_fuse(obj, voxel=0.006):
    rem = obj.modifiers.new("VinylRemesh", "REMESH")
    rem.mode = "VOXEL"
    rem.voxel_size = voxel
    rem.adaptivity = 0.0015
    _apply_mods(obj)
    sm = obj.modifiers.new("VinylSmooth", "SMOOTH")
    sm.factor = 0.16
    sm.iterations = 4
    _apply_mods(obj)


def _aim_dir(obj, dx, dy, dz):
    bpy.context.view_layer.update()
    origin = obj.matrix_world.translation.copy()
    dest = origin + _three_to_blend(dx, dy, dz)
    direction = dest - origin
    if direction.length < 1e-8:
        return
    direction.normalize()
    quat = direction.to_track_quat("-Z", "X")
    mat = quat.to_matrix().to_4x4()
    mat.translation = origin
    obj.matrix_world = mat
    bpy.context.view_layer.update()


def _mesh_ymin_blend():
    bpy.context.view_layer.update()
    ymin = None
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not obj.data or not obj.data.vertices:
            continue
        mw = obj.matrix_world
        for vert in obj.data.vertices:
            z = (mw @ vert.co).z
            ymin = z if ymin is None else min(ymin, z)
    return 0.0 if ymin is None else ymin


def _neck_saddle_y(shirt, spine, radius=0.09):
    bpy.context.view_layer.update()
    inv = spine.matrix_world.inverted()
    top = None
    for vert in shirt.data.vertices:
        loc = inv @ (shirt.matrix_world @ vert.co)
        if loc.x * loc.x + loc.y * loc.y > radius * radius:
            continue
        top = loc.z if top is None else max(top, loc.z)
    return 0.36 if top is None else top


def _shift_local_y(obj, dy):
    obj.location.z += dy


def _snap_floor(root):
    ymin = _mesh_ymin_blend()
    root.location.z -= ymin
    bpy.context.view_layer.update()


def build(mat):
    clay = make_material("VinylClay", "#f5f6f7", roughness=0.84, metalness=0.0)
    teal = make_material("VinylTeal", "#0f9d98", roughness=0.52, metalness=0.0)
    ink = make_material("VinylInk", "#3a3e42", roughness=0.66, metalness=0.04)
    ink2 = make_material("VinylInkDeep", "#2a2d31", roughness=0.52, metalness=0.05)
    seam = make_material("VinylSeam", "#eceeef", roughness=0.90, metalness=0.0)

    root = add_empty(None, "VinylShirtTablet")

    for side, x, hip_rx, hip_ry, knee_rx in (
        ("L", 0.074, 0.024, -0.028, 0.042),
        ("R", -0.074, 0.022, 0.028, 0.046),
    ):
        hip = add_empty(root, f"HipJoint_{side}", x=x, y=HIP_Y, z=0.010, rx=hip_rx, ry=hip_ry)
        _hang(hip, f"UpperLeg_{side}", THIGH_R, THIGH_L, clay, radial=48)
        knee = add_empty(hip, f"KneeJoint_{side}", y=-_span(THIGH_R, THIGH_L) + 0.078, rx=knee_rx)
        shin = _hang(knee, f"LowerLeg_{side}", SHIN_R, SHIN_L, clay, radial=44)
        ankle = add_empty(knee, f"Ankle_{side}", y=-_span(SHIN_R, SHIN_L) + 0.062, rx=-(hip_rx + knee_rx) + 0.018)
        shoe = add_round(ankle, f"Shoe_{side}", w=0.080, h=0.048, d=0.138, y=0.010, z=0.032, radius=0.022, mat=clay)
        add_round(ankle, f"Sole_{side}", w=0.082, h=0.009, d=0.142, y=-0.014, z=0.030, radius=0.007, mat=seam)

    spine = add_empty(root, "Spine", y=HIP_Y, z=0.016, rx=0.016)
    add_empty(spine, "Chest", y=0.20, z=0.0)
    shirt = add_round(spine, "Shirt", w=0.200, h=0.392, d=0.088, y=0.168, z=0.010, radius=0.042, mat=clay)
    pelvis = add_round(spine, "Pelvis", w=0.184, h=0.158, d=0.086, y=-0.008, z=0.008, radius=0.040, mat=clay)
    deltoid_l = add_sphere(spine, "Deltoid_L", 0.056, x=SH_X - 0.006, y=SH_Y + 0.004, z=SH_Z, segments=28, mat=clay)
    deltoid_r = add_sphere(spine, "Deltoid_R", 0.056, x=-(SH_X - 0.006), y=SH_Y + 0.004, z=SH_Z, segments=28, mat=clay)
    join_into(shirt, [pelvis, deltoid_l, deltoid_r])
    add_round(
        spine,
        "Pocket_L",
        w=0.003,
        h=0.052,
        d=0.028,
        x=0.092,
        y=0.006,
        z=0.052,
        rx=-0.08,
        rz=0.22,
        radius=0.001,
        mat=seam,
    )

    neck = add_cylinder(spine, "Neck", 0.074, 0.082, 0.040, y=0.368, z=0.006, radial=44, mat=clay)
    add_torus(spine, "CollarTeal", radius=0.086, tube=0.0018, y=0.392, z=0.012, rx=math.pi / 2, radial=72, tubular=12, mat=teal)
    add_round(spine, "CollarLeaf_L", w=0.036, h=0.008, d=0.004, x=0.018, y=0.378, z=0.072, ry=-1.05, rz=0.18, radius=0.0015, mat=clay)
    add_round(spine, "CollarLeaf_R", w=0.036, h=0.008, d=0.004, x=-0.018, y=0.378, z=0.072, ry=1.05, rz=-0.18, radius=0.0015, mat=clay)

    add_round(spine, "TieKnot", w=0.028, h=0.022, d=0.014, y=0.348, z=0.086, radius=0.006, mat=teal)
    add_cylinder(spine, "Tie", 0.013, 0.005, 0.152, y=0.258, z=0.088, radial=20, mat=teal)

    head = add_empty(spine, "HeadRig", y=0.524, z=0.008, rx=0.004)
    add_sphere(head, "Head", HEAD_R, segments=64, mat=clay)

    tab = add_empty(spine, "Tablet", x=-0.164, y=0.010, z=0.024, ry=0.02)
    add_round(tab, "TabletBody", w=0.010, h=0.228, d=0.142, radius=0.004, mat=ink)
    add_round(tab, "TabletFace", w=0.002, h=0.212, d=0.126, x=-0.006, radius=0.002, mat=ink2)

    sh_l = add_empty(spine, "ShoulderJoint_L", x=SH_X, y=SH_Y, z=SH_Z)
    upper_l = _hang(sh_l, "UpperArm_L", ARM_R, ARM_L, clay)
    elb_l = add_empty(sh_l, "ElbowJoint_L", y=-_span(ARM_R, ARM_L) + 0.072)
    elbow_l = add_sphere(elb_l, "ElbowCap_L", ARM_R * 0.92, y=0.0, segments=24, mat=clay)
    fore_l = _hang(elb_l, "ForeArm_L", FORE_R, FORE_L, clay)
    wrist_l_y = -_span(FORE_R, FORE_L) + 0.028
    add_torus(elb_l, "CuffTeal_L", radius=0.050, tube=0.0018, y=wrist_l_y + 0.006, rx=math.pi / 2, radial=28, tubular=10, mat=teal)
    add_empty(elb_l, "Wrist_L", y=wrist_l_y)

    sh_r = add_empty(spine, "ShoulderJoint_R", x=-SH_X, y=SH_Y, z=SH_Z)
    upper_r = _hang(sh_r, "UpperArm_R", ARM_R, ARM_L, clay)
    elb_r = add_empty(sh_r, "ElbowJoint_R", y=-_span(ARM_R, ARM_L) + 0.072)
    elbow_r = add_sphere(elb_r, "ElbowCap_R", ARM_R * 0.92, y=0.0, segments=24, mat=clay)
    fore_r = _hang(elb_r, "ForeArm_R", FORE_R_R, FORE_L_R, clay)
    wrist_r_y = -_span(FORE_R_R, FORE_L_R) + 0.040
    add_torus(elb_r, "CuffTeal_R", radius=0.050, tube=0.0018, y=wrist_r_y + 0.006, rx=math.pi / 2, radial=28, tubular=10, mat=teal)
    wrist_r = add_empty(elb_r, "Wrist_R", y=wrist_r_y)
    hand_r = add_round(wrist_r, "Hand_R", w=0.032, h=0.022, d=0.036, x=0.004, y=0.002, z=0.004, radius=0.009, mat=clay)
    thumb_r = add_capsule(wrist_r, "Thumb_R", r=0.007, length=0.010, x=0.008, y=0.003, z=0.004, rx=0.9, ry=-0.4, cap=10, radial=14, mat=clay)

    # Hang mostly vertical so top/side views show circular sausages, not horizontal fins.
    _aim_dir(sh_l, 0.18, -0.96, 0.14)
    _aim_dir(elb_l, -0.22, -0.94, 0.16)
    _aim_dir(sh_r, -0.16, -0.97, 0.10)
    _aim_dir(elb_r, 0.04, -0.99, 0.04)

    _join_world(shirt, [neck])
    _vinyl_fuse(shirt, voxel=0.0055)

    saddle = _neck_saddle_y(shirt, spine)
    dy = (saddle + 0.004) - 0.392
    for name in (
        "CollarTeal",
        "CollarLeaf_L",
        "CollarLeaf_R",
        "HeadRig",
        "TieKnot",
        "Tie",
    ):
        ob = bpy.data.objects.get(name)
        if ob is not None:
            _shift_local_y(ob, dy)
    bpy.context.view_layer.update()
    _snap_floor(root)

    return root
