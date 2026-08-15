---
name: blender-kit
description: >-
  Build and export Digital Team 3D kit GLBs (furniture, props, holograms) with
  the local blender-kit MCP (headless Blender 4.5). Use for tables, chairs,
  laptops, plants, mugs, massing, holo-city. For skinned chibi characters,
  armature, Sit/Idle clips, or vinyl figures, use the blender-character skill
  and char_* MCP tools — not kit_run.
---

# Blender kit (local MCP)

This repo already has a **kit-aware** MCP named `blender-kit`. It drives **Blender 4.5 headless** (`blender --background --python`). Do not install the official Blender 5.1 Lab MCP and do not require the Blender GUI.

**Characters:** new vinyl/chibi heroes with armature and clips use [blender-character](../blender-character/SKILL.md) (`char_catalog`, `char_stage`, `char_export`). Do not `kit_run` armatures. Hub meeting table is **OctTable** (`oct-table.glb`), not HexTable.

## First calls

1. `blender_status` — confirm Blender path
2. `kit_catalog` — contract, materials, primitives, existing GLBs

## Contract (always)

- Unit: metres
- Floor: `y = 0`
- Front: local `+Z` (chair back is −Z)
- Author in Three.js space; kit helpers convert to Blender Z-up; export is `export_yup`
- Output: `public/models/<kebab-name>.glb`
- Materials: `mat["navy"]`, `mat["cyan"]`, `mat["gold"]`, `mat["charcoal"]`, `mat["white"]`, …

## New component workflow

1. `kit_run` with Python that assigns `root` (use `add_empty`, `add_round`, `add_cylinder`, …)
2. `kit_inspect` / `kit_preview` — check bounds and the PNG (`mcp/blender/.tmp/`)
3. `kit_save_builder` so `npm run models:blender` can rebuild it
4. `kit_web_snippet` then edit `app/lab/kit.ts` (`KIT`, `KIT_ORDER`, `LIB_SRC`)
5. If the part is visible in the UI, update **ENG and VIE** in the same change

## `kit_run` example

```python
root = add_empty(None, "DeskLamp")
add_cylinder(root, "Stem", 0.012, 0.016, 0.28, y=0.14, mat=mat["charcoal"])
add_sphere(root, "Shade", 0.06, y=0.32, mat=mat["gold"])
```

`mat` is injected. Do not import `socket`, `subprocess`, or write outside `public/models`.

## Rebuild existing kit

`kit_export` with `only="hex-table"` (filename substring) or omit `only` to rebuild the library (slow).
