"""Seated vinyl office figure rebuilt from the 16-view turnaround sheet.

Author in Three.js metres (Y up, +Z forward). Rest pose = sheet sit.
Clips: Sit (held), Idle (seated breathe).
"""

from __future__ import annotations

import math
import os

import bpy
from mathutils import Matrix, Vector

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

FILE = "shirt-tie-sitter.glb"

HEAD_R = 0.105
NECK_R = 0.048
HIP_Y = 0.210
HIP_X = 0.078
THIGH_R, THIGH_L = 0.050, 0.170
SHIN_R, SHIN_L = 0.044, 0.150
ARM_R, ARM_L = 0.045, 0.100
FORE_R, FORE_L = 0.040, 0.090
SH_X, SH_Y, SH_Z = 0.092, 0.250, 0.030
COMPARE_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "..",
    "..",
    "mcp",
    "blender",
    ".tmp",
    "ref-exec-sit",
)


def _span(r, length):
    return length + 2.0 * r


def _t2b(x, y, z):
    return Vector((x, -z, y))


def _hang(parent, name, r, length, mat, radial=56):
    return add_capsule(parent, name, r=r, length=length, hang=True, y=0, cap=18, radial=radial, mat=mat)


def _smooth(obj):
    if obj is None or obj.type != "MESH":
        return
    for poly in obj.data.polygons:
        poly.use_smooth = True


def _world(obj):
    bpy.context.view_layer.update()
    return obj.matrix_world.translation.copy()


def _aim(obj, dx, dy, dz):
    bpy.context.view_layer.update()
    origin = obj.matrix_world.translation.copy()
    direction = _t2b(dx, dy, dz)
    if direction.length < 1e-8:
        return
    direction.normalize()
    quat = direction.to_track_quat("-Z", "X")
    mat4 = quat.to_matrix().to_4x4()
    mat4.translation = origin
    obj.matrix_world = mat4
    bpy.context.view_layer.update()


def _ymin():
    bpy.context.view_layer.update()
    lo = None
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not obj.data or not obj.data.vertices:
            continue
        mw = obj.matrix_world
        for vert in obj.data.vertices:
            z = (mw @ vert.co).z
            lo = z if lo is None else min(lo, z)
    return 0.0 if lo is None else lo


def _snap(root):
    root.location.z -= _ymin()
    bpy.context.view_layer.update()


def _reparent_world(obj, parent):
    bpy.context.view_layer.update()
    mw = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = mw


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
    joined = join_into(target, baked)
    _smooth(joined)
    return joined


def _rigid(obj, arm, bone):
    bpy.context.view_layer.update()
    mw = obj.matrix_world.copy()
    vg = obj.vertex_groups.new(name=bone)
    vg.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
    mod = obj.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    obj.parent = arm
    obj.matrix_world = mw
    bpy.context.view_layer.update()


def _key(arm, frame):
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"
        pb.keyframe_insert(data_path="location", frame=frame)
        pb.keyframe_insert(data_path="rotation_euler", frame=frame)


def _assign(arm, action):
    if arm.animation_data is None:
        arm.animation_data_create()
    arm.animation_data.action = action
    if hasattr(arm.animation_data, "action_slot") and getattr(action, "slots", None):
        try:
            arm.animation_data.action_slot = action.slots[0]
        except Exception:
            pass


def _nla(arm, action, name):
    if arm.animation_data is None:
        arm.animation_data_create()
    track = arm.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, int(action.frame_range[0]), action)
    strip.name = name


def _bone(arm, name, parent, head, tail):
    bone = arm.data.edit_bones.new(name)
    bone.head = head
    bone.tail = tail
    if (bone.tail - bone.head).length < 0.012:
        bone.tail = bone.head + Vector((0.0, 0.0, 0.02))
    if parent:
        bone.parent = arm.data.edit_bones[parent]
        bone.use_connect = False
    return bone


def _hand(parent, name, mat, grip=False):
    palm = add_round(parent, name, w=0.036, h=0.022, d=0.046, y=-0.002, z=0.004, radius=0.010, segments=6, mat=mat)
    bits = [palm]
    bend = 0.90 if grip else 0.45
    for i, fx in enumerate((-0.012, -0.004, 0.004, 0.012)):
        bits.append(
            add_capsule(
                parent,
                f"{name}F{i}",
                r=0.0064,
                length=0.015,
                x=fx,
                y=-0.002,
                z=0.022,
                rx=bend,
                cap=8,
                radial=12,
                mat=mat,
            )
        )
    bits.append(
        add_capsule(
            parent,
            f"{name}Thumb",
            r=0.007,
            length=0.012,
            x=0.016,
            y=0.002,
            z=0.008,
            rx=0.65,
            ry=-0.65 if not grip else 0.45,
            cap=8,
            radial=12,
            mat=mat,
        )
    )
    return _join_world(palm, bits[1:])


def build(mat):
    clay = make_material("SitClay", "#f4f5f6", roughness=0.84, metalness=0.0)
    teal = make_material("SitTeal", "#0a6a66", roughness=0.34, metalness=0.0)
    ink = make_material("SitInk", "#3a3d40", roughness=0.68, metalness=0.03)
    ink2 = make_material("SitInkFace", "#2c2f32", roughness=0.58, metalness=0.04)
    seam = make_material("SitSeam", "#e8eaeb", roughness=0.90, metalness=0.0)

    root = add_empty(None, "ShirtTieSitterRoot")
    joints = {}
    bind = {}

    for side, x, out in (("L", HIP_X, 0.08), ("R", -HIP_X, -0.08)):
        hip = add_empty(root, f"HipJoint_{side}", x=x, y=HIP_Y, z=0.016)
        thigh = _hang(hip, f"UpperLeg_{side}", THIGH_R, THIGH_L, clay)
        knee = add_empty(hip, f"KneeJoint_{side}", y=-_span(THIGH_R, THIGH_L) + 0.070)
        shin = _hang(knee, f"LowerLeg_{side}", SHIN_R, SHIN_L, clay)
        ankle = add_empty(knee, f"Ankle_{side}", y=-_span(SHIN_R, SHIN_L) + 0.056)
        shoe = add_round(
            ankle,
            f"Shoe_{side}",
            w=0.086,
            h=0.048,
            d=0.142,
            y=0.006,
            z=0.032,
            radius=0.022,
            segments=8,
            mat=clay,
        )
        sole = add_round(
            ankle,
            f"Sole_{side}",
            w=0.088,
            h=0.006,
            d=0.144,
            y=-0.020,
            z=0.030,
            radius=0.005,
            segments=4,
            mat=seam,
        )
        _aim(hip, out, -0.08, 0.995)
        _aim(knee, 0.0, -1.0, 0.0)
        joints[f"hip_{side}"] = hip
        joints[f"knee_{side}"] = knee
        joints[f"ankle_{side}"] = ankle
        bind[thigh.name] = f"UpperLeg_{side}"
        bind[shin.name] = f"LowerLeg_{side}"
        bind[shoe.name] = f"Foot_{side}"
        bind[sole.name] = f"Foot_{side}"
        hem = add_torus(
            knee,
            f"HemTeal_{side}",
            radius=0.046,
            tube=0.0014,
            y=-_span(SHIN_R, SHIN_L) + 0.072,
            rx=math.pi / 2,
            radial=28,
            tubular=8,
            mat=teal,
        )
        bind[hem.name] = f"LowerLeg_{side}"

    for name in ("Shoe_L", "Shoe_R", "Sole_L", "Sole_R"):
        obj = bpy.data.objects.get(name)
        if obj is None:
            continue
        bpy.context.view_layer.update()
        loc = obj.matrix_world.translation.copy()
        obj.matrix_world = Matrix.Translation(loc)

    spine = add_empty(root, "Spine", y=HIP_Y, z=0.020, rx=0.05)
    joints["hips"] = spine
    shirt = add_round(spine, "Shirt", w=0.170, h=0.292, d=0.116, y=0.146, z=0.006, radius=0.054, segments=8, mat=clay)
    pelvis = add_round(spine, "Pelvis", w=0.160, h=0.122, d=0.110, y=-0.004, z=0.004, radius=0.046, segments=7, mat=clay)
    del_l = add_sphere(spine, "Deltoid_L", 0.056, x=SH_X - 0.008, y=SH_Y, z=SH_Z, segments=40, mat=clay)
    del_r = add_sphere(spine, "Deltoid_R", 0.056, x=-(SH_X - 0.008), y=SH_Y, z=SH_Z, segments=40, mat=clay)
    join_into(shirt, [pelvis, del_l, del_r])
    _smooth(shirt)
    neck = add_cylinder(spine, "Neck", NECK_R, NECK_R + 0.005, 0.034, y=0.308, z=0.004, radial=48, mat=clay)
    bind[shirt.name] = "Chest"
    bind[neck.name] = "Neck"

    sh_l = add_empty(spine, "ShoulderJoint_L", x=SH_X, y=SH_Y, z=SH_Z)
    upper_l = _hang(sh_l, "UpperArm_L", ARM_R, ARM_L, clay)
    elb_l = add_empty(sh_l, "ElbowJoint_L", y=-_span(ARM_R, ARM_L) + 0.066)
    elbow_l = add_sphere(elb_l, "ElbowCap_L", ARM_R * 0.90, segments=28, mat=clay)
    fore_l = _hang(elb_l, "ForeArm_L", FORE_R, FORE_L, clay)
    wrist_l = add_empty(elb_l, "Wrist_L", y=-_span(FORE_R, FORE_L) + 0.028)
    hand_l = _hand(wrist_l, "Hand_L", clay, grip=False)
    cuff_l = add_torus(
        elb_l, "CuffTeal_L", radius=0.041, tube=0.0017, y=-_span(FORE_R, FORE_L) + 0.034, rx=math.pi / 2, radial=36, tubular=10, mat=teal
    )
    cuff_l2 = add_torus(
        elb_l, "CuffTeal_L2", radius=0.041, tube=0.0015, y=-_span(FORE_R, FORE_L) + 0.040, rx=math.pi / 2, radial=36, tubular=10, mat=teal
    )

    sh_r = add_empty(spine, "ShoulderJoint_R", x=-SH_X, y=SH_Y, z=SH_Z)
    upper_r = _hang(sh_r, "UpperArm_R", ARM_R, ARM_L, clay)
    elb_r = add_empty(sh_r, "ElbowJoint_R", y=-_span(ARM_R, ARM_L) + 0.066)
    elbow_r = add_sphere(elb_r, "ElbowCap_R", ARM_R * 0.90, segments=28, mat=clay)
    fore_r = _hang(elb_r, "ForeArm_R", FORE_R, FORE_L + 0.008, clay)
    wrist_r = add_empty(elb_r, "Wrist_R", y=-_span(FORE_R, FORE_L + 0.008) + 0.032)
    hand_r = _hand(wrist_r, "Hand_R", clay, grip=True)
    cuff_r = add_torus(
        elb_r,
        "CuffTeal_R",
        radius=0.041,
        tube=0.0017,
        y=-_span(FORE_R, FORE_L + 0.008) + 0.038,
        rx=math.pi / 2,
        radial=36,
        tubular=10,
        mat=teal,
    )
    cuff_r2 = add_torus(
        elb_r,
        "CuffTeal_R2",
        radius=0.041,
        tube=0.0015,
        y=-_span(FORE_R, FORE_L + 0.008) + 0.044,
        rx=math.pi / 2,
        radial=36,
        tubular=10,
        mat=teal,
    )

    _aim(sh_l, 0.14, -0.92, 0.18)
    _aim(elb_l, -0.12, -0.32, 0.62)
    _aim(sh_r, -0.16, -0.94, 0.06)
    _aim(elb_r, -0.14, -0.48, 0.18)

    tab = add_empty(spine, "Tablet", x=-0.150, y=0.016, z=0.072, ry=-0.03)
    tab_body = add_round(tab, "TabletBody", w=0.014, h=0.188, d=0.158, radius=0.005, segments=5, mat=ink)
    tab_face = add_round(tab, "TabletFace", w=0.002, h=0.170, d=0.140, x=-0.008, radius=0.002, segments=3, mat=ink2)

    joints["sh_l"] = sh_l
    joints["elb_l"] = elb_l
    joints["wrist_l"] = wrist_l
    joints["sh_r"] = sh_r
    joints["elb_r"] = elb_r
    joints["wrist_r"] = wrist_r

    bind[upper_l.name] = "UpperArm_L"
    bind[elbow_l.name] = "LowerArm_L"
    bind[fore_l.name] = "LowerArm_L"
    bind[hand_l.name] = "Hand_L"
    bind[cuff_l.name] = "LowerArm_L"
    bind[cuff_l2.name] = "LowerArm_L"
    bind[upper_r.name] = "UpperArm_R"
    bind[elbow_r.name] = "LowerArm_R"
    bind[fore_r.name] = "LowerArm_R"
    bind[hand_r.name] = "Hand_R"
    bind[cuff_r.name] = "LowerArm_R"
    bind[cuff_r2.name] = "LowerArm_R"
    bind[tab_body.name] = "Chest"
    bind[tab_face.name] = "Chest"

    collar_y = 0.318
    add_torus(spine, "CollarTeal", radius=0.060, tube=0.0022, y=collar_y, z=0.010, rx=math.pi / 2, radial=64, tubular=12, mat=teal)
    add_torus(spine, "CollarTeal2", radius=0.060, tube=0.0018, y=collar_y - 0.007, z=0.010, rx=math.pi / 2, radial=64, tubular=12, mat=teal)
    add_round(
        spine, "CollarLeaf_L", w=0.032, h=0.007, d=0.0035, x=0.015, y=collar_y - 0.010, z=0.062, ry=-1.05, rz=0.16, radius=0.0013, mat=clay
    )
    add_round(
        spine, "CollarLeaf_R", w=0.032, h=0.007, d=0.0035, x=-0.015, y=collar_y - 0.010, z=0.062, ry=1.05, rz=-0.16, radius=0.0013, mat=clay
    )
    add_round(spine, "TieKnot", w=0.030, h=0.024, d=0.018, y=collar_y - 0.014, z=0.078, radius=0.007, mat=teal)
    add_cylinder(spine, "Tie", 0.016, 0.007, 0.158, y=collar_y - 0.106, z=0.080, radial=22, mat=teal)
    bind["CollarTeal"] = "Neck"
    bind["CollarTeal2"] = "Neck"
    bind["CollarLeaf_L"] = "Neck"
    bind["CollarLeaf_R"] = "Neck"
    bind["TieKnot"] = "Chest"
    bind["Tie"] = "Chest"

    head_rig = add_empty(spine, "HeadRig", y=0.318 + HEAD_R + 0.004, z=0.008, rx=0.05)
    head = add_sphere(head_rig, "Head", HEAD_R, segments=64, mat=clay)
    joints["head"] = head_rig
    bind[head.name] = "Head"

    _snap(root)
    arm = _rig(root, joints, bind)
    _clips(arm)
    _render_views(arm)
    return arm


def _rig(root, joints, bind):
    arm_data = bpy.data.armatures.new("ShirtTieSitterRig")
    arm = bpy.data.objects.new("ShirtTieSitter", arm_data)
    bpy.context.collection.objects.link(arm)

    hips = _world(joints["hips"])
    head = _world(joints["head"])
    sh_l = _world(joints["sh_l"])
    sh_r = _world(joints["sh_r"])
    elb_l = _world(joints["elb_l"])
    elb_r = _world(joints["elb_r"])
    wrist_l = _world(joints["wrist_l"])
    wrist_r = _world(joints["wrist_r"])
    hip_l = _world(joints["hip_L"])
    hip_r = _world(joints["hip_R"])
    knee_l = _world(joints["knee_L"])
    knee_r = _world(joints["knee_R"])
    ankle_l = _world(joints["ankle_L"])
    ankle_r = _world(joints["ankle_R"])
    chest = hips.lerp(head, 0.36)
    neck = hips.lerp(head, 0.70)

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    _bone(arm, "Hips", None, hips, chest)
    _bone(arm, "Spine", "Hips", chest, neck)
    _bone(arm, "Chest", "Spine", neck, neck.lerp(head, 0.45))
    _bone(arm, "Neck", "Chest", neck.lerp(head, 0.45), head)
    _bone(arm, "Head", "Neck", head, head + Vector((0.0, 0.0, HEAD_R * 0.85)))
    _bone(arm, "Shoulder_L", "Chest", sh_l, sh_l.lerp(elb_l, 0.12))
    _bone(arm, "UpperArm_L", "Shoulder_L", sh_l, elb_l)
    _bone(arm, "LowerArm_L", "UpperArm_L", elb_l, wrist_l)
    _bone(arm, "Hand_L", "LowerArm_L", wrist_l, wrist_l + (elb_l - sh_l).normalized() * 0.04)
    _bone(arm, "Shoulder_R", "Chest", sh_r, sh_r.lerp(elb_r, 0.12))
    _bone(arm, "UpperArm_R", "Shoulder_R", sh_r, elb_r)
    _bone(arm, "LowerArm_R", "UpperArm_R", elb_r, wrist_r)
    _bone(arm, "Hand_R", "LowerArm_R", wrist_r, wrist_r + (elb_r - sh_r).normalized() * 0.04)
    _bone(arm, "UpperLeg_L", "Hips", hip_l, knee_l)
    _bone(arm, "LowerLeg_L", "UpperLeg_L", knee_l, ankle_l)
    _bone(arm, "Foot_L", "LowerLeg_L", ankle_l, ankle_l + Vector((0.0, -0.07, 0.0)))
    _bone(arm, "UpperLeg_R", "Hips", hip_r, knee_r)
    _bone(arm, "LowerLeg_R", "UpperLeg_R", knee_r, ankle_r)
    _bone(arm, "Foot_R", "LowerLeg_R", ankle_r, ankle_r + Vector((0.0, -0.07, 0.0)))
    bpy.ops.object.mode_set(mode="OBJECT")

    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"

    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    for obj in meshes:
        _reparent_world(obj, None)
        bone = bind.get(obj.name)
        if bone:
            _rigid(obj, arm, bone)
        else:
            _rigid(obj, arm, "Chest")

    for obj in list(bpy.context.scene.objects):
        if obj.type == "EMPTY":
            bpy.data.objects.remove(obj, do_unlink=True)

    bpy.context.view_layer.update()
    return arm


def _clips(arm):
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    scene = bpy.context.scene
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 48

    def rest():
        for pb in arm.pose.bones:
            pb.location = (0.0, 0.0, 0.0)
            pb.rotation_euler = (0.0, 0.0, 0.0)

    sit = bpy.data.actions.new("Sit")
    _assign(arm, sit)
    rest()
    _key(arm, 1)
    _key(arm, 48)

    idle = bpy.data.actions.new("Idle")
    _assign(arm, idle)
    rest()
    _key(arm, 1)
    chest = arm.pose.bones.get("Chest")
    spine = arm.pose.bones.get("Spine")
    head = arm.pose.bones.get("Head")
    if chest:
        chest.location = (0.0, 0.0, 0.006)
        chest.rotation_euler = (0.03, 0.0, 0.0)
    if spine:
        spine.rotation_euler = (0.024, 0.0, 0.0)
    if head:
        head.rotation_euler = (0.025, 0.04, 0.0)
    ua_l = arm.pose.bones.get("UpperArm_L")
    if ua_l:
        ua_l.rotation_euler = (0.018, 0.0, 0.0)
    _key(arm, 24)
    rest()
    _key(arm, 48)

    arm.animation_data.action = None
    _nla(arm, sit, "Sit")
    _nla(arm, idle, "Idle")
    arm.animation_data.use_nla = False
    for track in arm.animation_data.nla_tracks:
        track.mute = True
    rest()
    bpy.ops.object.mode_set(mode="OBJECT")


def _render_views(arm):
    folder = os.path.abspath(COMPARE_DIR)
    os.makedirs(folder, exist_ok=True)
    scene = bpy.context.scene
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            break
        except Exception:
            continue
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.world = bpy.data.worlds.new("SitWorld") if bpy.data.worlds.get("SitWorld") is None else bpy.data.worlds["SitWorld"]
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.97, 0.97, 0.97, 1.0)
        bg.inputs[1].default_value = 1.0

    xs, ys, zs = [], [], []
    for obj in scene.objects:
        if obj.type != "MESH":
            continue
        mw = obj.matrix_world
        for vert in obj.data.vertices:
            loc = mw @ vert.co
            xs.append(loc.x)
            ys.append(loc.y)
            zs.append(loc.z)
    if not xs:
        return
    cx = (min(xs) + max(xs)) * 0.5
    cy = (min(ys) + max(ys)) * 0.5
    cz = (min(zs) + max(zs)) * 0.5
    radius = max(max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs), 0.4) * 1.55

    cam_data = bpy.data.cameras.new("SitCam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 1.15
    cam_data.lens = 85
    cam = bpy.data.objects.new("SitCam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam

    sun = bpy.data.lights.new("SitSun", "AREA")
    sun.energy = 250
    sun.size = 1.8
    sun_obj = bpy.data.objects.new("SitSun", sun)
    bpy.context.collection.objects.link(sun_obj)
    sun_obj.location = (cx + radius * 0.3, cy - radius * 0.8, cz + radius * 1.1)

    fill = bpy.data.lights.new("SitFill", "AREA")
    fill.energy = 90
    fill.size = 2.2
    fill_obj = bpy.data.objects.new("SitFill", fill)
    bpy.context.collection.objects.link(fill_obj)
    fill_obj.location = (cx - radius * 0.6, cy + radius * 0.4, cz + radius * 0.7)

    views = {
        "ours-front": (cx, cy - radius * 1.35, cz),
        "ours-right": (cx - radius * 1.35, cy, cz),
        "ours-3q": (cx - radius * 0.85, cy - radius * 1.05, cz + radius * 0.18),
        "ours-back": (cx, cy + radius * 1.35, cz),
    }
    target = Vector((cx, cy, cz))
    extras = [cam, sun_obj, fill_obj]
    for name, loc in views.items():
        cam.location = loc
        cam.rotation_euler = (target - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(folder, f"{name}.png")
        bpy.ops.render.render(write_still=True)

    for obj in extras:
        bpy.data.objects.remove(obj, do_unlink=True)
