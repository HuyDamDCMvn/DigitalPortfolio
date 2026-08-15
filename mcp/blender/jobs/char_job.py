"""Build / inspect / preview / export a skinned character (runs inside Blender)."""

from __future__ import annotations

import os
import sys
import traceback

_JOBS = os.path.dirname(os.path.abspath(__file__))
if _JOBS not in sys.path:
    sys.path.insert(0, _JOBS)

from kit_job import add_kit_path, argv_after_dash, bounds_yup, emit, parse_kv

add_kit_path()

from characters.export_character import export_character_glb  # noqa: E402
from characters.pipeline import build_through, inspect_ctx  # noqa: E402
from characters.preset_lib import load_preset  # noqa: E402
from core import enable_gltf, reset_scene  # noqa: E402


def _pose_action(arm, name):
    import bpy

    action = bpy.data.actions.get(name)
    if arm is None or action is None:
        return
    if arm.animation_data is None:
        arm.animation_data_create()
    arm.animation_data.use_nla = False
    arm.animation_data.action = action
    if hasattr(arm.animation_data, "action_slot") and getattr(action, "slots", None):
        try:
            arm.animation_data.action_slot = action.slots[0]
        except Exception:
            pass
    bpy.context.scene.frame_set(12 if name == "Idle" else 1)
    bpy.context.view_layer.update()


def _disable_nla(except_action=None):
    import bpy

    for obj in bpy.data.objects:
        if obj.type != "ARMATURE" or obj.animation_data is None:
            continue
        obj.animation_data.use_nla = False
        if except_action:
            for track in obj.animation_data.nla_tracks:
                track.mute = track.name != except_action
            action = bpy.data.actions.get(except_action)
            if action:
                obj.animation_data.action = action
                if hasattr(obj.animation_data, "action_slot") and getattr(action, "slots", None):
                    try:
                        obj.animation_data.action_slot = action.slots[0]
                    except Exception:
                        pass
        else:
            obj.animation_data.action = None
            for track in obj.animation_data.nla_tracks:
                track.mute = True


def render_character_preview(path, size=768, view="three_quarter"):
    """Chest-height studio camera. Face is -Y in Blender."""
    import bpy
    from mathutils import Vector

    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    scene = bpy.context.scene
    engine = None
    for candidate in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = candidate
            engine = candidate
            break
        except Exception:
            continue
    if engine is None:
        scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = int(size)
    scene.render.resolution_y = int(size)
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.filepath = path
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"

    seated = "Sit" in view or "Idle" in view or "idle" in view
    target = Vector((0.0, 0.02, 0.42 if seated else 0.48))
    dist = 1.55 if seated else 1.72
    key = (view or "three_quarter").lower()
    if key in ("turnaround", "front"):
        cam_loc = Vector((0.0, -dist, 0.50))
    elif key in ("side", "profile"):
        cam_loc = Vector((dist * 0.95, 0.0, 0.50))
    elif key == "back":
        cam_loc = Vector((0.0, dist, 0.52))
    else:
        cam_loc = Vector((dist * 0.38, -dist * 0.92, 0.58))

    cam_data = bpy.data.cameras.new("CharPreviewCam")
    cam_data.lens = 55
    cam = bpy.data.objects.new("CharPreviewCam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    cam.location = cam_loc
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    world = bpy.data.worlds.new("CharWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.03, 0.035, 0.04, 1.0)
        bg.inputs[1].default_value = 0.25
    scene.world = world

    key_data = bpy.data.lights.new("CharKey", "AREA")
    key_data.energy = 55
    key_data.size = 0.9
    key_light = bpy.data.objects.new("CharKey", key_data)
    bpy.context.collection.objects.link(key_light)
    key_light.location = target + Vector((0.55, -0.85, 0.70))
    key_light.rotation_euler = (target - key_light.location).to_track_quat("-Z", "Y").to_euler()

    fill_data = bpy.data.lights.new("CharFill", "AREA")
    fill_data.energy = 18
    fill_data.size = 1.2
    fill = bpy.data.objects.new("CharFill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = target + Vector((-0.70, -0.20, 0.45))

    rim_data = bpy.data.lights.new("CharRim", "SUN")
    rim_data.energy = 1.1
    rim = bpy.data.objects.new("CharRim", rim_data)
    bpy.context.collection.objects.link(rim)
    rim.location = target + Vector((-0.4, 0.9, 0.8))
    rim.rotation_euler = (target - rim.location).to_track_quat("-Z", "Y").to_euler()

    bpy.ops.render.render(write_still=True)
    return path if os.path.isfile(path) else None


def inspect_glb(path):
    import bpy

    reset_scene()
    enable_gltf()
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    imported = [obj for obj in bpy.data.objects if obj not in before]
    roots = [obj for obj in imported if obj.parent is None]
    armatures = [obj.name for obj in imported if obj.type == "ARMATURE"]
    bones = []
    for obj in imported:
        if obj.type == "ARMATURE":
            bones.extend(b.name for b in obj.data.bones)
    groups = {}
    skinned = False
    meshes = []
    for obj in imported:
        if obj.type != "MESH":
            continue
        meshes.append(obj.name)
        groups[obj.name] = [g.name for g in obj.vertex_groups]
        if obj.vertex_groups or any(mod.type == "ARMATURE" for mod in obj.modifiers):
            skinned = True
    actions = [a.name for a in bpy.data.actions]
    nla = []
    for obj in imported:
        if obj.animation_data and obj.animation_data.nla_tracks:
            nla.extend(t.name for t in obj.animation_data.nla_tracks)
    bounds = None
    for root in roots:
        piece = bounds_yup(root)
        if piece is None:
            continue
        if bounds is None:
            bounds = piece
        else:
            bounds = {
                "min": [min(a, b) for a, b in zip(bounds["min"], piece["min"])],
                "max": [max(a, b) for a, b in zip(bounds["max"], piece["max"])],
            }
    return {
        "ok": True,
        "glb": path,
        "bytes": os.path.getsize(path) if os.path.isfile(path) else 0,
        "roots": [obj.name for obj in roots],
        "armatures": armatures,
        "bones": bones,
        "meshes": meshes,
        "vertex_groups": groups,
        "skinned": skinned,
        "actions": actions,
        "nla": nla,
        "morphs": [],
        "bounds": bounds,
    }


def main():
    args = parse_kv(argv_after_dash())
    preset = args.get("preset")
    stage = args.get("stage") or "clip"
    preview_path = args.get("preview")
    export_path = args.get("export")
    glb = args.get("glb")
    view = args.get("view") or "three_quarter"
    size = int(args.get("size") or 768)

    try:
        if glb:
            payload = inspect_glb(glb)
            if preview_path:
                payload["preview"] = render_character_preview(preview_path, size, view)
            emit(payload)
            return

        if not preset:
            emit({"ok": False, "error": "need --preset or --glb"})
            raise SystemExit(1)

        ctx = build_through(preset, stage)
        payload = inspect_ctx(ctx)
        payload["bounds"] = bounds_yup(ctx["armature"] or ctx["body"])

        pose_name = None
        if "Sit" in view or view.endswith("Sit"):
            pose_name = "Sit"
        elif "Idle" in view or view.endswith("Idle") or "idle" in view:
            pose_name = "Idle"
        _disable_nla(pose_name)
        if pose_name:
            _pose_action(ctx.get("armature"), pose_name)

        if preview_path:
            payload["preview"] = render_character_preview(preview_path, size, view)
            payload["view"] = view

        if export_path:
            if ctx.get("armature") is None:
                emit({"ok": False, "error": "bind before export", **payload})
                raise SystemExit(1)
            arm = ctx["armature"]
            if arm.animation_data:
                for track in arm.animation_data.nla_tracks:
                    track.mute = False
            payload["bytes"] = export_character_glb(ctx["armature"], export_path)
            payload["glb"] = export_path

        spec = load_preset(preset)
        payload["file"] = spec.get("file")
        emit(payload)
    except Exception as exc:
        emit({"ok": False, "error": str(exc), "trace": traceback.format_exc()})
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
