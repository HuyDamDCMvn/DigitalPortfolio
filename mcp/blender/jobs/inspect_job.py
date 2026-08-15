"""Import a GLB, report Y-up bounds, optionally render a PNG preview."""

from __future__ import annotations

import os
import sys
import traceback

_JOBS = os.path.dirname(os.path.abspath(__file__))
if _JOBS not in sys.path:
    sys.path.insert(0, _JOBS)

from kit_job import add_kit_path, argv_after_dash, bounds_yup, emit, mesh_names, parse_kv, render_preview

add_kit_path()

from core import enable_gltf, reset_scene  # noqa: E402


def import_glb(path):
    import bpy

    enable_gltf()
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [obj for obj in bpy.data.objects if obj not in before]


def main():
    args = parse_kv(argv_after_dash())
    glb = args.get("glb")
    preview_path = args.get("preview")
    if not glb or not os.path.isfile(glb):
        emit({"ok": False, "error": f"missing glb: {glb}"})
        raise SystemExit(1)
    try:
        reset_scene()
        imported = import_glb(glb)
        roots = [obj for obj in imported if obj.parent is None]
        meshes = []
        bounds = None
        for root in roots:
            meshes.extend(mesh_names(root))
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
        payload = {
            "ok": True,
            "glb": glb,
            "bytes": os.path.getsize(glb),
            "roots": [obj.name for obj in roots],
            "meshes": meshes,
            "bounds": bounds,
        }
        if preview_path:
            size = int(args.get("size") or 768)
            try:
                payload["preview"] = render_preview(preview_path, size=size)
            except Exception as exc:
                payload["preview_error"] = str(exc)
        emit(payload)
    except Exception as exc:
        emit({"ok": False, "error": str(exc), "trace": traceback.format_exc()})
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
