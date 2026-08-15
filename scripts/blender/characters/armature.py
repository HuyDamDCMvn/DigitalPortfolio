"""Humanoid armature in Blender Z-up, names match bones.md."""

from __future__ import annotations

import bpy
from mathutils import Vector

from . import prim, proportions


def _scale(ctx):
    return proportions.body_scale(ctx["spec"].get("body", "male"))


def build_armature(ctx):
    prim.ensure_object_mode()
    data = bpy.data.armatures.new("Armature")
    data.display_type = "OCTAHEDRAL"
    arm = bpy.data.objects.new("Armature", data)
    prim.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    edit = data.edit_bones
    created = {}
    scale = _scale(ctx)
    sx = scale["shoulder"]
    hx = scale["hip"]
    hip_z = proportions.HIP_Z
    sh_z = proportions.SHOULDER_Z
    hip_x = proportions.HIP_X * hx
    sh_x = proportions.SHOULDER_X * sx

    rows = [
        ("Root", (0.0, 0.0, 0.0), (0.0, 0.0, 0.08), None),
        ("Hips", (0.0, 0.02, hip_z), (0.0, 0.02, hip_z + 0.08), "Root"),
        ("Spine", (0.0, 0.02, hip_z + 0.08), (0.0, 0.02, 0.52), "Hips"),
        ("Chest", (0.0, 0.02, 0.52), (0.0, 0.02, 0.64), "Spine"),
        ("Neck", (0.0, 0.02, 0.64), (0.0, 0.02, proportions.NECK_Z + 0.02), "Chest"),
        ("Head", (0.0, 0.02, proportions.NECK_Z + 0.02), (0.0, 0.02, proportions.HEAD_Z + 0.12), "Neck"),
        ("UpperLeg_L", (-hip_x, 0.02, hip_z), (-hip_x, 0.02, proportions.KNEE_Z), "Hips"),
        ("LowerLeg_L", (-hip_x, 0.02, proportions.KNEE_Z), (-hip_x, 0.02, proportions.ANKLE_Z), "UpperLeg_L"),
        ("Foot_L", (-hip_x, 0.02, proportions.ANKLE_Z), (-hip_x, -0.08, 0.02), "LowerLeg_L"),
        ("UpperLeg_R", (hip_x, 0.02, hip_z), (hip_x, 0.02, proportions.KNEE_Z), "Hips"),
        ("LowerLeg_R", (hip_x, 0.02, proportions.KNEE_Z), (hip_x, 0.02, proportions.ANKLE_Z), "UpperLeg_R"),
        ("Foot_R", (hip_x, 0.02, proportions.ANKLE_Z), (hip_x, -0.08, 0.02), "LowerLeg_R"),
        ("Shoulder_L", (0.0, 0.02, sh_z), (-sh_x, 0.02, sh_z), "Chest"),
        ("UpperArm_L", (-sh_x, 0.02, sh_z), (-proportions.ELBOW_X * sx, 0.02, 0.505), "Shoulder_L"),
        ("LowerArm_L", (-proportions.ELBOW_X * sx, 0.02, 0.505), (-proportions.HAND_X * sx, 0.02, proportions.HAND_Z), "UpperArm_L"),
        ("Hand_L", (-proportions.HAND_X * sx, 0.02, proportions.HAND_Z), (-(proportions.HAND_X * sx + 0.06), 0.03, 0.40), "LowerArm_L"),
        ("Shoulder_R", (0.0, 0.02, sh_z), (sh_x, 0.02, sh_z), "Chest"),
        ("UpperArm_R", (sh_x, 0.02, sh_z), (proportions.ELBOW_X * sx, 0.02, 0.505), "Shoulder_R"),
        ("LowerArm_R", (proportions.ELBOW_X * sx, 0.02, 0.505), (proportions.HAND_X * sx, 0.02, proportions.HAND_Z), "UpperArm_R"),
        ("Hand_R", (proportions.HAND_X * sx, 0.02, proportions.HAND_Z), (proportions.HAND_X * sx + 0.06, 0.03, 0.40), "LowerArm_R"),
    ]
    for name, head, tail, parent in rows:
        bone = edit.new(name)
        bone.head = Vector(head)
        bone.tail = Vector(tail)
        bone.use_connect = False
        if parent:
            bone.parent = created[parent]
        created[name] = bone
        if (Vector(tail) - Vector(head)).length < 0.02:
            bone.tail = Vector(head) + Vector((0, 0, 0.04))
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"
    ctx["armature"] = arm
    return arm
