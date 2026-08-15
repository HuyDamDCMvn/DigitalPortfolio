"""Read-only view of the Digital Team Blender kit (no bpy)."""

from __future__ import annotations

import ast
import re
from pathlib import Path

from config import COMPONENTS_DIR, EXPORT_KIT, KIT_DIR, KIT_TS, MODELS_DIR

CONTRACT = {
    "unit": "metres",
    "up": "Y",
    "forward": "+Z",
    "floor_y": 0,
    "authoring": (
        "Author in Three.js space. core.bloc / core.beul convert to Blender Z-up; "
        "glTF export_yup=True restores the web contract."
    ),
    "anchors": {
        "floor": "casters / feet / legs sit on y = 0",
        "tabletop": "underside sits on a table; place in the hub with onTable()",
    },
    "tables": {"HexTable": 0.748, "OctTable": 0.748, "LeadTable": 0.77},
    "export": "GLB into public/models, filename kebab-case.glb",
}

PRIMITIVE_HELP = [
    "add_empty(parent, name, x=0, y=0, z=0, rx=0, ry=0, rz=0)",
    "add_round(parent, name, w, h, d, x=0, y=0, z=0, rx=0, ry=0, rz=0, radius=0.018, mat=None)",
    "add_cylinder(parent, name, radius_top, radius_bottom, height, x=0, y=0, z=0, rx=0, ry=0, rz=0, mat=None)",
    "add_sphere(parent, name, r, x=0, y=0, z=0, mat=None)",
    "add_capsule(parent, name, r, length, x=0, y=0, z=0, rx=0, ry=0, rz=0, hang=False, mat=None)",
    "add_torus(parent, name, radius, tube, x=0, y=0, z=0, rx=0, ry=0, rz=0, mat=None)",
    "add_hex(parent, name, radius, height, x=0, y=0, z=0, ry=pi/6, mat=None)",
    "add_oct(parent, name, radius, height, x=0, y=0, z=0, ry=pi/8, mat=None)",
    "add_oct_ring(parent, name, radius_outer, radius_inner, height, x=0, y=0, z=0, ry=pi/8, mat=None)",
    "add_ngon(parent, name, radius, height, segments=8, x=0, y=0, z=0, ry=0, mat=None)",
    "add_tube(parent, name, radius_outer, radius_inner, height, x=0, y=0, z=0, rx=0, ry=0, rz=0, mat=None)",
    "join_into(target, extras)",
    "flatten_world(obj)  # identity world rotation, keep world location",
    "rotate_three(obj, rx=0, ry=0, rz=0)",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def material_names() -> list[str]:
    tree = ast.parse(_read(KIT_DIR / "core.py"))
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == "make_materials":
            names: list[str] = []
            for child in ast.walk(node):
                if isinstance(child, ast.Constant) and isinstance(child.value, str) and child.value.startswith("#"):
                    continue
                if isinstance(child, ast.Dict):
                    for key in child.keys:
                        if isinstance(key, ast.Constant) and isinstance(key.value, str):
                            names.append(key.value)
                    if names:
                        return names
    return []


def builtin_assets() -> list[str]:
    tree = ast.parse(_read(EXPORT_KIT))
    files: list[str] = []
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "ASSETS":
                    for elt in getattr(node.value, "elts", []):
                        if isinstance(elt, ast.Tuple) and elt.elts:
                            first = elt.elts[0]
                            if isinstance(first, ast.Constant) and isinstance(first.value, str):
                                files.append(first.value)
    return files


def component_assets() -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    if not COMPONENTS_DIR.is_dir():
        return out
    for path in sorted(COMPONENTS_DIR.glob("*.py")):
        if path.name.startswith("_"):
            continue
        text = _read(path)
        match = re.search(r'^FILE\s*=\s*["\']([^"\']+)["\']', text, re.M)
        out.append(
            {
                "module": path.stem,
                "path": str(path),
                "file": match.group(1) if match else "",
            }
        )
    return out


def kit_ts_parts() -> list[dict[str, str]]:
    if not KIT_TS.is_file():
        return []
    text = _read(KIT_TS)
    parts: list[dict[str, str]] = []
    for match in re.finditer(
        r"^\s+(\w+):\s*\{\s*\n(?:.*\n)*?\s+file:\s*\"([^\"]+)\"\s*,\s*\n\s+anchor:\s*\"(floor|tabletop)\"",
        text,
        re.M,
    ):
        parts.append({"id": match.group(1), "file": match.group(2), "anchor": match.group(3)})
    return parts


def glb_on_disk() -> list[dict[str, object]]:
    if not MODELS_DIR.is_dir():
        return []
    rows = []
    for path in sorted(MODELS_DIR.glob("*.glb")):
        rows.append({"file": path.name, "bytes": path.stat().st_size, "path": str(path)})
    return rows


def catalog() -> dict[str, object]:
    return {
        "contract": CONTRACT,
        "materials": material_names(),
        "primitives": PRIMITIVE_HELP,
        "run_python": {
            "must_assign": "root",
            "filename": "kebab-case.glb via the filename argument",
            "mat": "dict from make_materials(); use mat['navy'], mat['cyan'], …",
            "imports": "core helpers are preloaded; math is available",
        },
        "builtin_glb": builtin_assets(),
        "components": component_assets(),
        "kit_ts": kit_ts_parts(),
        "on_disk": glb_on_disk(),
    }


def web_snippet(kit_id: str, filename: str, anchor: str, idle: str = "none") -> str:
    src = f"/models/{filename}?v=blender-1"
    return (
        f'  {kit_id}: {{\n'
        f'    src: "{src}",\n'
        f'    file: "{filename}",\n'
        f'    anchor: "{anchor}",\n'
        f'    idle: "{idle}",\n'
        f"    orbitSpeed: WORLD.defaultOrbitSpeed,\n"
        f"  }},"
    )
