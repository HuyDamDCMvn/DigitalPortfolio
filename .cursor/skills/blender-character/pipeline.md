# Character pipeline

`char_stage` rebuilds from scratch **through** the requested stage (inclusive). Do not skip `bind` before `clip`.

## Stages

1. **base** — contiguous remeshed chibi body, A-pose, feet at floor
2. **hair** — clump hair parented/skinned to `Head`
3. **wardrobe** — jacket/hoodie/varsity, pants, shoes, hex logo on back
4. **accessory** — headphones and/or glasses when the preset lists them; no handheld tablet (table reference has none)
5. **bind** — armature + Automatic Weights
6. **clip** — actions `Sit` and `Idle`
7. **qc** — inspect + preview, no extra mesh

## Export

`char_export` uses `export_character_glb` (`export_skins=True`, `export_animations=True`, `export_apply=False`). Do not use kit `export_glb` for characters.

## Hub / lead layout

Octagon table from the 9-view reference (`oct-table.glb`): navy drum, cyan strip on the floor, white top, recessed well. Eight `OfficeChair`s. Seven `char-*` Sit/Idle. Seat 7 = remote `Laptop` only. `HoloCity` in the well via `onTable("OctTable", 0, 0, OCT_HOLO_DROP)`. Lead (`char-lead-white-coat.glb`) is a separate identity — do not invent a throne or steal a hub seat without a user call.
