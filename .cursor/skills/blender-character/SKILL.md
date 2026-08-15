---
name: blender-character
description: >-
  Build skinned Digital Team chibi characters (armature, weights, Sit/Idle
  clips) via blender-kit MCP char_* tools. Use when the user asks for a 3D
  character, vinyl/chibi figure, navy-bomber, roster identity, skinning,
  or character animation. Do not use kit_run for armatures.
---

# Blender character (path B)

Headless Blender 4.5 through the **blender-kit** MCP. Characters are **skinned meshes**, not empty-rig capsules. Furniture still uses [blender-kit](../blender-kit/SKILL.md).

## First calls

1. `blender_status`
2. `char_catalog` — presets, bones, stages, clips

## Contract

- Metres, floor `y = 0` in the exported GLB (Y-up, +Z forward)
- Rest pose: standing A-pose; **Sit** and **Idle** are actions (Idle = sitting breathe)
- Output: `public/models/char-<preset>.glb`
- Do **not** `kit_run` with `bpy.ops.armature`, vertex groups, or shapekeys
- Hub `/lab/r3f` and `/lab/lead` use **OctTable** (8 chairs, 7 sitters, 1 remote laptop). Tabletop `y = 0.748`. Chair ring radius 1.64 m, slot offset 0 (faces). Do not invent a new table shape without a new reference.

## Pipeline (one MCP stage per call)

Show a short plan, then call **one** stage. After each call: `char_inspect` / `char_preview`, Read the PNG, retry the **same** stage up to 3 times on fail.

`base` → `hair` → `wardrobe` → `accessory` → `bind` → `clip` → `qc`

Then `char_export`. Web: `kit_web_snippet` + `app/lab/kit.ts` with `playback: "mixer"`. ENG + VIE if the part is visible. **Never** attach `ModelIdle` to `char-*` GLBs.

## Tools

| Tool | Use |
|---|---|
| `char_catalog` | Start of a character task |
| `char_stage` | `preset` + one `stage` |
| `char_inspect` | Bones, groups, actions, bounds (GLB) |
| `char_preview` | `three_quarter` / `turnaround` / `pose:Idle` / `pose:Sit` |
| `char_export` | skins + animations on |

Details: [pipeline.md](pipeline.md), [bones.md](bones.md), [presets.md](presets.md).

## QC bind (must pass before clip)

- Armature root, names match `bones.md`
- Rest is A-pose, feet on floor
- Deform meshes have vertex groups; armature modifier **not** applied
- `char_inspect` → `skinned: true`

## QC clips

- Actions named `Sit` and `Idle` (Idle loops, sitting breathe)
- Sit hip height is **provisional** (~0.50 m, current `office-chair` pad). Re-measure after chair images

## Web

Skinned `char-*` → `AnimationMixer` + clip names. Old `lead-figure-*` / `walker` keep `ModelIdle`.
