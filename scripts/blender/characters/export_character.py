"""glTF export for skinned characters (keep armature, export actions)."""

from __future__ import annotations

import os

import bpy

from core import enable_gltf


def export_character_glb(armature, path):
    enable_gltf()
    bpy.context.view_layer.update()
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    keep = {armature, *armature.children_recursive}
    for obj in list(bpy.data.objects):
        if obj not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    for obj in armature.children_recursive:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = armature
    kwargs = dict(
        filepath=path,
        check_existing=False,
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_yup=True,
        export_cameras=False,
        export_extras=False,
        export_skins=True,
        export_animations=True,
        export_morph=False,
    )
    try:
        bpy.ops.export_scene.gltf(
            **kwargs,
            export_animation_mode="NLA_TRACKS",
            export_anim_single_armature=True,
        )
    except TypeError:
        try:
            bpy.ops.export_scene.gltf(**kwargs, export_nla_strips=True)
        except TypeError:
            bpy.ops.export_scene.gltf(**kwargs)
    return os.path.getsize(path) if os.path.isfile(path) else 0
