"""Export known kit assets and emit a JSON result line for the MCP runner."""

from __future__ import annotations

import os
import sys
import traceback

_JOBS = os.path.dirname(os.path.abspath(__file__))
if _JOBS not in sys.path:
    sys.path.insert(0, _JOBS)

from kit_job import add_kit_path, argv_after_dash, emit, parse_kv

add_kit_path()

from export_kit import ASSETS, load_component_assets  # noqa: E402
from core import export_glb, make_materials, reset_scene  # noqa: E402


def main():
    args = parse_kv(argv_after_dash())
    out = args.get("out")
    only = args.get("only")
    if not out:
        emit({"ok": False, "error": "need --out"})
        raise SystemExit(1)
    os.makedirs(out, exist_ok=True)
    wrote = []
    try:
        assets = list(ASSETS) + list(load_component_assets())
        for filename, builder in assets:
            if only and only not in filename:
                continue
            reset_scene()
            root = builder(make_materials())
            path = os.path.join(out, filename)
            export_glb(root, path)
            wrote.append({"file": filename, "bytes": os.path.getsize(path), "path": path})
        if only and not wrote:
            emit({"ok": False, "error": f"no asset matched --only {only}"})
            raise SystemExit(1)
        emit({"ok": True, "wrote": wrote})
    except Exception as exc:
        emit({"ok": False, "error": str(exc), "trace": traceback.format_exc(), "wrote": wrote})
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
