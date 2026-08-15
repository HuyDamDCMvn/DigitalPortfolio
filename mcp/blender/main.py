"""FastMCP stdio server — local Blender 4.5 kit for Digital Team GLB parts."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from fastmcp import FastMCP

import catalog
from config import (
    CHAR_TIMEOUT_SEC,
    COMPONENTS_DIR,
    JOBS_DIR,
    KIT_DIR,
    MODELS_DIR,
    REPO_ROOT,
    TMP_DIR,
    find_blender,
)
from runner import (
    BlenderError,
    blender_version,
    export_known,
    models_glb,
    run_job,
    validate_code,
    validate_glb_name,
    write_temp,
)

if str(KIT_DIR) not in sys.path:
    sys.path.insert(0, str(KIT_DIR))

from characters.preset_lib import STAGES, catalog as character_catalog, load_preset

mcp = FastMCP(
    "blender-kit",
    instructions=(
        "Local headless Blender for Digital Team kit parts and skinned characters. "
        "Furniture: kit_catalog, kit_run, kit_export. "
        "Characters: char_catalog, char_stage, char_inspect, char_preview, char_export. "
        "Do not kit_run armatures. Author in metres, Y up, +Z forward, floor at y=0. "
        "Hub and lead meeting layout is OctTable: 8 chairs, 7 sitters, 1 remote laptop."
    ),
)

MODULE_RE = re.compile(r"^[a-z][a-z0-9_]*$")
ID_RE = re.compile(r"^[A-Z][A-Za-z0-9]+$")


def _err(exc: Exception) -> dict:
    return {"ok": False, "error": str(exc)}


@mcp.tool
def blender_status() -> dict:
    """Check local Blender 4.5, kit paths, and whether the MCP can export GLBs."""
    blender = find_blender()
    try:
        version = blender_version() if blender else None
    except Exception as exc:
        version = str(exc)
    return {
        "ok": blender is not None,
        "blender": str(blender) if blender else None,
        "version": version,
        "repo": str(REPO_ROOT),
        "models": str(MODELS_DIR),
        "components": str(COMPONENTS_DIR),
        "note": "Headless kit MCP. Does not need the Blender GUI or the official 5.1 Lab add-on.",
    }


@mcp.tool
def kit_catalog() -> dict:
    """Lab 3D contract, materials, primitives, builtin GLBs, MCP components, and files on disk."""
    return catalog.catalog()


@mcp.tool
def kit_export(only: str | None = None) -> dict:
    """Rebuild kit GLBs with Blender. Pass only='hex-table' (substring of the filename) to export one asset."""
    try:
        return export_known(only)
    except (BlenderError, ValueError) as exc:
        return _err(exc)


@mcp.tool
def kit_run(code: str, filename: str, preview: bool = True, overwrite: bool = True) -> dict:
    """Run kit Python inside headless Blender and write public/models/<filename>.

    `code` must assign `root`. Coordinates are Three.js metres (Y up, +Z forward).
    `mat` is already defined. Example:

        root = add_empty(None, "DeskLamp")
        add_cylinder(root, "Stem", 0.012, 0.016, 0.28, y=0.14, mat=mat["charcoal"])
        add_sphere(root, "Shade", 0.06, y=0.32, mat=mat["gold"])
    """
    try:
        filename = validate_glb_name(filename)
        code = validate_code(code)
        dest = models_glb(filename)
        if dest.exists() and not overwrite:
            return {"ok": False, "error": f"{filename} exists; set overwrite=true"}
        code_path = write_temp("run.py", code)
        args = ["--code", str(code_path), "--out", str(MODELS_DIR), "--export", filename]
        if preview:
            preview_path = TMP_DIR / f"{Path(filename).stem}.png"
            args.extend(["--preview", str(preview_path)])
        return run_job(JOBS_DIR / "run_job.py", args)
    except (BlenderError, ValueError) as exc:
        return _err(exc)


@mcp.tool
def kit_inspect(filename: str, preview: bool = False) -> dict:
    """Import an existing public/models GLB and report mesh names plus Y-up bounds (metres)."""
    try:
        path = models_glb(filename)
        if not path.is_file():
            return {"ok": False, "error": f"missing {path}"}
        args = ["--glb", str(path)]
        if preview:
            args.extend(["--preview", str(TMP_DIR / f"{path.stem}-inspect.png")])
        return run_job(JOBS_DIR / "inspect_job.py", args)
    except (BlenderError, ValueError) as exc:
        return _err(exc)


@mcp.tool
def kit_preview(filename: str, size: int = 768) -> dict:
    """Render a PNG preview of a kit GLB (EEVEE, transparent). Path is in the result; Read that PNG in Cursor."""
    try:
        path = models_glb(filename)
        if not path.is_file():
            return {"ok": False, "error": f"missing {path}"}
        preview_path = TMP_DIR / f"{path.stem}.png"
        result = run_job(
            JOBS_DIR / "inspect_job.py",
            ["--glb", str(path), "--preview", str(preview_path), "--size", str(size)],
        )
        return result
    except (BlenderError, ValueError) as exc:
        return _err(exc)


@mcp.tool
def kit_save_builder(module: str, filename: str, code: str, overwrite: bool = False) -> dict:
    """Persist a reusable builder in scripts/blender/components/<module>.py (FILE + build(mat))."""
    try:
        if not MODULE_RE.match(module):
            raise ValueError("module must be snake_case like desk_lamp")
        filename = validate_glb_name(filename)
        code = validate_code(code)
        COMPONENTS_DIR.mkdir(parents=True, exist_ok=True)
        path = COMPONENTS_DIR / f"{module}.py"
        if path.exists() and not overwrite:
            return {"ok": False, "error": f"{path.name} exists; set overwrite=true"}
        if "def build" in code:
            body = code
            if "FILE" not in body:
                body = f'FILE = "{filename}"\n\n' + body
        else:
            indented = "\n".join(("    " + line if line else "") for line in code.splitlines())
            body = (
                '"""Digital Team kit component — Three.js metres, Y up, +Z forward."""\n\n'
                "from core import (\n"
                "    add_capsule,\n"
                "    add_cylinder,\n"
                "    add_empty,\n"
                "    add_hex,\n"
                "    add_round,\n"
                "    add_sphere,\n"
                "    add_torus,\n"
                "    add_tube,\n"
                "    join_into,\n"
                ")\n\n"
                f'FILE = "{filename}"\n\n\n'
                "def build(mat):\n"
                f"{indented}\n"
                "    return root\n"
            )
        path.write_text(body, encoding="utf-8")
        return {"ok": True, "path": str(path), "file": filename, "module": module}
    except ValueError as exc:
        return _err(exc)


@mcp.tool
def kit_web_snippet(
    kit_id: str,
    filename: str,
    anchor: str = "floor",
    idle: str = "none",
) -> dict:
    """Return the app/lab/kit.ts entry for a new part. Does not edit the file; the agent must add ENG+VIE copy too."""
    try:
        if not ID_RE.match(kit_id):
            raise ValueError("kit_id must be PascalCase like DeskLamp")
        filename = validate_glb_name(filename)
        if anchor not in {"floor", "tabletop"}:
            raise ValueError("anchor must be floor or tabletop")
        snippet = catalog.web_snippet(kit_id, filename, anchor, idle)
        return {
            "ok": True,
            "kit_ts": snippet,
            "also": [
                "Add kit_id to KIT_ORDER and LIB_SRC in app/lab/kit.ts",
                "Bump ?v= on src if replacing an existing GLB",
                "Update ENG and VIE labels if the part appears in the UI",
            ],
        }
    except ValueError as exc:
        return _err(exc)


PRESET_RE = re.compile(r"^[a-z][a-z0-9-]*$")
STAGE_SET = set(STAGES)
VIEW_SET = {"three_quarter", "turnaround", "pose:Idle", "pose:Sit", "pose:idle", "pose:sit"}


def _run_char(args: list[str]) -> dict:
    return run_job(JOBS_DIR / "char_job.py", args, timeout=CHAR_TIMEOUT_SEC)


@mcp.tool
def char_catalog() -> dict:
    """Character presets, bone names, stages, and clips. Call before char_stage."""
    return character_catalog()


@mcp.tool
def char_stage(preset: str, stage: str, preview: bool = True) -> dict:
    """Rebuild a character through one pipeline stage (base…clip/qc). One stage per call."""
    try:
        if not PRESET_RE.match(preset):
            raise ValueError("preset must be kebab-case like navy-bomber")
        if stage not in STAGE_SET:
            raise ValueError(f"stage must be one of {STAGES}")
        load_preset(preset)
        preview_path = TMP_DIR / f"char-{preset}-{stage}.png"
        args = ["--preset", preset, "--stage", stage]
        if preview:
            args.extend(["--preview", str(preview_path)])
        return _run_char(args)
    except (BlenderError, ValueError) as exc:
        return _err(exc)


@mcp.tool
def char_inspect(filename: str) -> dict:
    """Import a char-*.glb and report bones, vertex groups, actions, skins, bounds."""
    try:
        filename = validate_glb_name(filename)
        path = models_glb(filename)
        if not path.is_file():
            return {"ok": False, "error": f"missing {path}"}
        return _run_char(["--glb", str(path)])
    except (BlenderError, ValueError) as exc:
        return _err(exc)


@mcp.tool
def char_preview(preset: str, view: str = "three_quarter", size: int = 768) -> dict:
    """Render a PNG of a character preset (builds through clip). Read the preview path."""
    try:
        if not PRESET_RE.match(preset):
            raise ValueError("preset must be kebab-case like navy-bomber")
        load_preset(preset)
        if view not in VIEW_SET:
            raise ValueError("view must be three_quarter, turnaround, pose:Idle, or pose:Sit")
        preview_path = TMP_DIR / f"char-{preset}-{view.replace(':', '-')}.png"
        return _run_char(
            [
                "--preset",
                preset,
                "--stage",
                "clip",
                "--view",
                view,
                "--preview",
                str(preview_path),
                "--size",
                str(size),
            ]
        )
    except (BlenderError, ValueError) as exc:
        return _err(exc)


@mcp.tool
def char_export(preset: str, overwrite: bool = True, preview: bool = True) -> dict:
    """Export public/models/char-<preset>.glb with skins and Sit/Idle animations."""
    try:
        if not PRESET_RE.match(preset):
            raise ValueError("preset must be kebab-case like navy-bomber")
        spec = load_preset(preset)
        filename = validate_glb_name(spec["file"])
        dest = models_glb(filename)
        if dest.exists() and not overwrite:
            return {"ok": False, "error": f"{filename} exists; set overwrite=true"}
        preview_path = TMP_DIR / f"{Path(filename).stem}.png"
        args = [
            "--preset",
            preset,
            "--stage",
            "clip",
            "--view",
            "pose:Sit",
            "--export",
            str(dest),
        ]
        if preview:
            args.extend(["--preview", str(preview_path)])
        return _run_char(args)
    except (BlenderError, ValueError) as exc:
        return _err(exc)


@mcp.resource("blender-kit://contract")
def resource_contract() -> str:
    return json.dumps(catalog.CONTRACT, indent=2)


@mcp.resource("blender-kit://catalog")
def resource_catalog() -> str:
    return json.dumps(catalog.catalog(), indent=2)


def main() -> None:
    blender = find_blender()
    sys.stderr.write(
        f"[blender-kit] repo={REPO_ROOT} blender={blender or 'MISSING'}\n"
    )
    sys.stderr.flush()
    mcp.run()


if __name__ == "__main__":
    main()
