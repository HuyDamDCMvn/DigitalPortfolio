"""Sit (held) and Idle (sitting breathe) actions on the character armature."""

from __future__ import annotations

import math

import bpy

from . import proportions

SIT_X = -math.radians(78)
KNEE_X = math.radians(82)
ARM_DOWN = math.radians(35)
SPINE_SIT = math.radians(8)


def _pb(arm, name):
    return arm.pose.bones.get(name)


def apply_sit(arm):
    lift = proportions.SIT_HIP_Z - proportions.HIP_Z
    hips = _pb(arm, "Hips")
    if hips:
        hips.location = (0.0, 0.04, lift)
        hips.rotation_euler = (math.radians(12), 0, 0)
    spine = _pb(arm, "Spine")
    if spine:
        spine.rotation_euler = (SPINE_SIT, 0, 0)
    chest = _pb(arm, "Chest")
    if chest:
        chest.rotation_euler = (math.radians(4), 0, 0)
    for side, sign in (("L", -1.0), ("R", 1.0)):
        ul = _pb(arm, f"UpperLeg_{side}")
        if ul:
            ul.rotation_euler = (SIT_X, 0, math.radians(6) * sign)
        ll = _pb(arm, f"LowerLeg_{side}")
        if ll:
            ll.rotation_euler = (KNEE_X, 0, 0)
        foot = _pb(arm, f"Foot_{side}")
        if foot:
            foot.rotation_euler = (math.radians(-8), 0, 0)
        ua = _pb(arm, f"UpperArm_{side}")
        if ua:
            ua.rotation_euler = (ARM_DOWN, math.radians(18) * sign, math.radians(12) * sign)
        la = _pb(arm, f"LowerArm_{side}")
        if la:
            la.rotation_euler = (math.radians(40), 0, 0)
        hand = _pb(arm, f"Hand_{side}")
        if hand:
            hand.rotation_euler = (math.radians(-12), 0, 0)
    head = _pb(arm, "Head")
    if head:
        head.rotation_euler = (math.radians(6), 0, 0)


def apply_idle_offset(arm, amount):
    spine = _pb(arm, "Spine")
    if spine:
        spine.rotation_euler[0] += amount * 0.04
    chest = _pb(arm, "Chest")
    if chest:
        chest.location = (0.0, 0.0, amount * 0.006)
    head = _pb(arm, "Head")
    if head:
        head.rotation_euler[1] = amount * 0.05
        head.rotation_euler[0] += amount * 0.02
    for side, sign in (("L", -1.0), ("R", 1.0)):
        ua = _pb(arm, f"UpperArm_{side}")
        if ua:
            ua.rotation_euler[0] += amount * 0.03 * sign


def _key(arm, frame):
    for pb in arm.pose.bones:
        pb.keyframe_insert(data_path="location", frame=frame)
        pb.keyframe_insert(data_path="rotation_euler", frame=frame)


def _clear_pose(arm):
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.pose.transforms_clear()


def _assign_action(arm, action):
    if arm.animation_data is None:
        arm.animation_data_create()
    arm.animation_data.action = action
    if hasattr(arm.animation_data, "action_slot") and getattr(action, "slots", None):
        try:
            arm.animation_data.action_slot = action.slots[0]
        except Exception:
            pass


def _new_action(arm, name):
    action = bpy.data.actions.new(name)
    _assign_action(arm, action)
    return action


def _push_nla(arm, action, name):
    if arm.animation_data is None:
        arm.animation_data_create()
    track = arm.animation_data.nla_tracks.new()
    track.name = name
    start = int(action.frame_range[0])
    strip = track.strips.new(name, start, action)
    strip.name = name
    return track


def build_clips(ctx):
    arm = ctx["armature"]
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    scene = bpy.context.scene
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 24

    sit = _new_action(arm, "Sit")
    _clear_pose(arm)
    apply_sit(arm)
    _key(arm, 1)
    _key(arm, 24)

    idle = _new_action(arm, "Idle")
    _clear_pose(arm)
    apply_sit(arm)
    _key(arm, 1)
    apply_idle_offset(arm, 1.0)
    _key(arm, 12)
    _clear_pose(arm)
    apply_sit(arm)
    _key(arm, 24)

    arm.animation_data.action = None
    _push_nla(arm, sit, "Sit")
    _push_nla(arm, idle, "Idle")
    arm.animation_data.use_nla = False
    for track in arm.animation_data.nla_tracks:
        track.mute = True
    _clear_pose(arm)
    bpy.ops.object.mode_set(mode="OBJECT")
    ctx["actions"] = ["Sit", "Idle"]
    return ctx["actions"]
