"""Helpers that run inside Blender's Python (stdlib + bpy only)."""

from __future__ import annotations

import json
import os
import sys

MARKER = "__KIT_RESULT__"


def kit_dir():
    env = os.environ.get("BLENDER_KIT_DIR")
    if env:
        return env
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.normpath(os.path.join(here, "..", "..", "..", "scripts", "blender"))


def add_kit_path():
    path = kit_dir()
    if path not in sys.path:
        sys.path.insert(0, path)
    return path


def argv_after_dash():
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1 :]
    return sys.argv[1:]


def parse_kv(argv):
    out = {}
    i = 0
    flags = set()
    while i < len(argv):
        key = argv[i]
        if key.startswith("--") and i + 1 < len(argv) and not argv[i + 1].startswith("--"):
            out[key[2:]] = argv[i + 1]
            i += 2
            continue
        if key.startswith("--"):
            flags.add(key[2:])
            i += 1
            continue
        i += 1
    out["_flags"] = flags
    return out


def emit(payload):
    sys.stdout.write(MARKER + json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def bounds_yup(root):
    xs, ys, zs = [], [], []

    def walk(obj):
        if getattr(obj, "type", None) == "MESH" and obj.data and obj.data.vertices:
            mw = obj.matrix_world
            for vert in obj.data.vertices:
                world = mw @ vert.co
                xs.append(world.x)
                ys.append(world.z)
                zs.append(-world.y)
        for child in obj.children:
            walk(child)

    walk(root)
    if not xs:
        return None
    return {
        "min": [min(xs), min(ys), min(zs)],
        "max": [max(xs), max(ys), max(zs)],
    }


def mesh_names(root):
    names = []

    def walk(obj):
        if getattr(obj, "type", None) == "MESH":
            names.append(obj.name)
        for child in obj.children:
            walk(child)

    walk(root)
    return names


def render_preview(path, size=768):
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

    xs, ys, zs = [], [], []
    for obj in scene.objects:
        if obj.type != "MESH":
            continue
        mw = obj.matrix_world
        for vert in obj.data.vertices:
            world = mw @ vert.co
            xs.append(world.x)
            ys.append(world.y)
            zs.append(world.z)
    if not xs:
        return None
    min_v = Vector((min(xs), min(ys), min(zs)))
    max_v = Vector((max(xs), max(ys), max(zs)))
    center = (min_v + max_v) / 2.0
    size_v = max_v - min_v
    radius = max(size_v.length * 0.7, 0.35)

    cam_data = bpy.data.cameras.new("KitPreviewCam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("KitPreviewCam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    cam.location = center + Vector((radius * 0.85, -radius * 1.15, radius * 0.7))
    direction = center - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    sun_data = bpy.data.lights.new("KitSun", "SUN")
    sun_data.energy = 3.0
    sun = bpy.data.objects.new("KitSun", sun_data)
    bpy.context.collection.objects.link(sun)
    sun.location = center + Vector((radius, -radius, radius * 1.4))

    fill_data = bpy.data.lights.new("KitFill", "AREA")
    fill_data.energy = 80
    fill_data.size = max(radius, 0.4)
    fill = bpy.data.objects.new("KitFill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = center + Vector((-radius * 0.4, radius * 0.6, radius))

    bpy.ops.render.render(write_still=True)
    return path if os.path.isfile(path) else None
