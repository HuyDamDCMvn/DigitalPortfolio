"""Build a roster figure from the multi-view sheet and export GLB."""

from __future__ import annotations

import os
import sys
import traceback

_JOBS = os.path.dirname(os.path.abspath(__file__))
if _JOBS not in sys.path:
    sys.path.insert(0, _JOBS)

from kit_job import add_kit_path, argv_after_dash, bounds_yup, emit, parse_kv

add_kit_path()

from reconstruct import SPECS, build_character, pose_action, render_views  # noqa: E402
from characters.export_character import export_character_glb  # noqa: E402


def main():
    args = parse_kv(argv_after_dash())
    preset = args.get("id") or args.get("preset")
    export_path = args.get("out") or args.get("export")
    preview_dir = args.get("preview")
    pose = args.get("pose") or "Idle"
    size = int(args.get("size") or 768)
    ids = list(SPECS) if preset in ("all", "*") else [preset]
    if not preset:
        emit({"ok": False, "error": "need --id", "have": list(SPECS)})
        raise SystemExit(1)
    results = []
    try:
        for pid in ids:
            ctx = build_character(pid)
            arm = ctx["armature"]
            pose_action(arm, pose)
            row = {
                "ok": True,
                "id": pid,
                "file": ctx["spec"]["file"],
                "actions": ctx["actions"],
                "meshes": ctx["meshes"],
                "bounds": bounds_yup(arm),
            }
            dest = export_path
            if dest and preset in ("all", "*"):
                dest = os.path.join(os.path.dirname(dest) or ".", ctx["spec"]["file"])
            elif dest is None and args.get("models"):
                dest = os.path.join(args["models"], ctx["spec"]["file"])
            if dest:
                row["bytes"] = export_character_glb(arm, dest)
                row["glb"] = dest
            if preview_dir:
                row["previews"] = render_views(preview_dir, pid, size)
            results.append(row)
        emit({"ok": True, "results": results} if len(results) > 1 else results[0])
    except Exception as exc:
        emit({"ok": False, "error": str(exc), "trace": traceback.format_exc()})
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
