"""Bind every character mesh with Automatic Weights. No bone-parent offsets."""

from __future__ import annotations

import bpy

from . import prim


def bind_weights(ctx):
    arm = ctx["armature"]
    deform = [obj for obj in ctx["meshes"] if obj is not None]
    if not deform and ctx.get("body"):
        deform = [ctx["body"]]

    prim.ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")
    for obj in deform:
        obj.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    ctx["deform"] = deform
    ctx["head_bits"] = []
    return deform
