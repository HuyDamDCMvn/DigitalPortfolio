"""
Export the lab 3D library from Blender.

  blender --background --python scripts/blender/export_kit.py -- --out public/models
"""

from __future__ import annotations

import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from core import export_glb, make_materials, reset_scene  # noqa: E402
from figures import (  # noqa: E402
    build_figure_hardhat,
    build_figure_point,
    build_figure_sit,
    build_figure_stand_plans,
    build_figure_stand_tablet,
    build_humanoid_sitting,
    build_walker,
)
from furniture import (  # noqa: E402
    build_bookshelf_table,
    build_digital_massing,
    build_hex_table,
    build_hub_mug,
    build_hub_plant,
    build_laptop,
    build_lead_blueprints,
    build_lead_chair,
    build_lead_dashboard,
    build_lead_mug,
    build_lead_notebook,
    build_lead_table,
    build_oct_table,
    build_office_chair,
)


def load_component_assets():
    """Builders saved by the Blender MCP into scripts/blender/components/."""
    folder = os.path.join(SCRIPT_DIR, "components")
    extra = []
    if not os.path.isdir(folder):
        return extra
    for name in sorted(os.listdir(folder)):
        if not name.endswith(".py") or name.startswith("_"):
            continue
        path = os.path.join(folder, name)
        ns = {"__name__": f"components.{name[:-3]}", "__file__": path}
        with open(path, encoding="utf-8") as handle:
            exec(compile(handle.read(), path, "exec"), ns, ns)  # noqa: S102
        filename = ns.get("FILE")
        builder = ns.get("build")
        if isinstance(filename, str) and callable(builder):
            extra.append((filename, builder))
    return extra


ASSETS = [
    ("office-chair.glb", build_office_chair),
    ("hex-table.glb", build_hex_table),
    ("oct-table.glb", build_oct_table),
    ("humanoid-sitting.glb", build_humanoid_sitting),
    ("laptop.glb", lambda mat: build_laptop(mat, "Laptop", "charcoal")),
    ("hub-plant.glb", build_hub_plant),
    ("hub-mug.glb", build_hub_mug),
    ("bookshelf-table.glb", build_bookshelf_table),
    ("digital-massing.glb", build_digital_massing),
    ("walker.glb", build_walker),
    ("lead-table.glb", build_lead_table),
    ("lead-chair.glb", build_lead_chair),
    ("lead-figure-sit.glb", build_figure_sit),
    ("lead-figure-point.glb", build_figure_point),
    ("lead-figure-hardhat.glb", build_figure_hardhat),
    ("lead-figure-stand-tablet.glb", build_figure_stand_tablet),
    ("lead-figure-stand-plans.glb", build_figure_stand_plans),
    ("lead-laptop.glb", lambda mat: build_laptop(mat, "LeadLaptop", "whiteSoft")),
    ("lead-mug.glb", build_lead_mug),
    ("lead-notebook.glb", build_lead_notebook),
    ("lead-blueprints.glb", build_lead_blueprints),
    ("lead-dashboard.glb", build_lead_dashboard),
]


def parse_args(argv):
    out = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "public", "models"))
    only = None
    args = argv[argv.index("--") + 1 :] if "--" in argv else argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--out" and i + 1 < len(args):
            out = os.path.abspath(args[i + 1])
            i += 2
            continue
        if args[i] == "--only" and i + 1 < len(args):
            only = args[i + 1]
            i += 2
            continue
        i += 1
    return out, only


def main():
    out, only = parse_args(sys.argv)
    os.makedirs(out, exist_ok=True)
    for filename, builder in list(ASSETS) + load_component_assets():
        if only and only not in filename:
            continue
        reset_scene()
        mat = make_materials()
        root = builder(mat)
        export_glb(root, os.path.join(out, filename))


if __name__ == "__main__":
    main()
