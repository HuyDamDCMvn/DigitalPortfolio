"""Build a kit part from agent Python and export GLB (runs inside Blender)."""

from __future__ import annotations

import os
import sys
import traceback

_JOBS = os.path.dirname(os.path.abspath(__file__))
if _JOBS not in sys.path:
    sys.path.insert(0, _JOBS)

from kit_job import add_kit_path, argv_after_dash, bounds_yup, emit, parse_kv, render_preview

add_kit_path()

from core import (  # noqa: E402
    add_capsule,
    add_cylinder,
    add_empty,
    add_hex,
    add_oct,
    add_oct_ring,
    add_round,
    add_sphere,
    add_torus,
    add_tube,
    export_glb,
    flatten_world,
    join_into,
    make_materials,
    reset_scene,
    rotate_three,
)


def main():
    args = parse_kv(argv_after_dash())
    code_path = args.get("code")
    out = args.get("out")
    filename = args.get("export")
    preview_path = args.get("preview")
    if not code_path or not out or not filename:
        emit({"ok": False, "error": "need --code --out --export"})
        raise SystemExit(1)

    with open(code_path, encoding="utf-8") as handle:
        code = handle.read()

    reset_scene()
    mat = make_materials()
    import furniture  # noqa: E402
    import figures  # noqa: E402

    ns = {
        "__name__": "__kit_run__",
        "mat": mat,
        "math": __import__("math"),
        "add_empty": add_empty,
        "add_round": add_round,
        "add_cylinder": add_cylinder,
        "add_sphere": add_sphere,
        "add_capsule": add_capsule,
        "add_hex": add_hex,
        "add_oct": add_oct,
        "add_oct_ring": add_oct_ring,
        "add_torus": add_torus,
        "add_tube": add_tube,
        "join_into": join_into,
        "flatten_world": flatten_world,
        "rotate_three": rotate_three,
        "make_materials": make_materials,
        "furniture": furniture,
        "figures": figures,
    }
    try:
        exec(compile(code, code_path, "exec"), ns, ns)  # noqa: S102 — intentional kit builder
    except Exception as exc:
        emit({"ok": False, "error": str(exc), "trace": traceback.format_exc()})
        raise SystemExit(1) from exc

    root = ns.get("root")
    if root is None:
        emit({"ok": False, "error": "builder must assign root (an empty or mesh from add_empty / add_*)"})
        raise SystemExit(1)

    glb_path = os.path.join(out, filename)
    names = export_glb(root, glb_path)
    payload = {
        "ok": True,
        "glb": glb_path,
        "bytes": os.path.getsize(glb_path) if os.path.isfile(glb_path) else 0,
        "meshes": names,
        "bounds": bounds_yup(root),
        "root": getattr(root, "name", "root"),
    }
    if preview_path:
        try:
            payload["preview"] = render_preview(preview_path)
        except Exception as exc:
            payload["preview_error"] = str(exc)
    emit(payload)


if __name__ == "__main__":
    main()
