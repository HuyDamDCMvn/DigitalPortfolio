"""Build a character through a named stage (Blender bpy)."""

from __future__ import annotations

from core import make_material, make_materials, reset_scene

from . import accessories, armature, body, clips, hair, wardrobe, weights
from .preset_lib import STAGES, load_preset

_THROUGH = ["base", "hair", "wardrobe", "accessory", "bind", "clip"]


def _hex_mat(name, hex_color, roughness=0.42, metalness=0.04, emission=None, emission_strength=0.0):
    return make_material(
        name,
        hex_color,
        roughness=roughness,
        metalness=metalness,
        emission=emission,
        emission_strength=emission_strength,
    )


def _palette(spec):
    colors = spec.get("colors") or {}
    pid = spec["id"]
    kit = make_materials()
    kit["skin"] = _hex_mat(f"CharSkin_{pid}", colors.get("skin", "#f3ebe3"), 0.46, 0.0)
    kit["shirt"] = _hex_mat(f"CharShirt_{pid}", colors.get("shirt", colors.get("jacketTrim", "#5fc7ec")), 0.44, 0.02)
    kit["iris"] = _hex_mat(f"CharIris_{pid}", colors.get("iris", "#5a3a28"), 0.18, 0.06)
    kit["skinDeep"] = _hex_mat(f"CharSkinDeep_{pid}", colors.get("skinDeep", "#d4a48c"), 0.48, 0.0)
    kit["hair"] = _hex_mat(f"CharHair_{pid}", colors.get("hair", "#1a1818"), 0.40, 0.02)
    kit["jacket"] = _hex_mat(f"CharJacket_{pid}", colors.get("jacket", "#062553"), 0.48, 0.08)
    kit["pants"] = _hex_mat(f"CharPants_{pid}", colors.get("pants", "#1a2430"), 0.48, 0.03)
    kit["shoes"] = _hex_mat(f"CharShoes_{pid}", colors.get("shoes", "#12161c"), 0.38, 0.08)
    kit["sole"] = _hex_mat(f"CharSole_{pid}", colors.get("sole", "#5fc7ec"), 0.50, 0.02)
    logo_hex = colors.get("logo", "#5fc7ec")
    gold_hex = colors.get("gold", colors.get("jacketTrim", "#c9a227"))
    logo_emit = 0.18 if spec.get("wardrobe") == "greatcoat" else 0.7
    kit["logo"] = _hex_mat(
        f"CharLogo_{pid}",
        logo_hex,
        0.28,
        0.55 if spec.get("wardrobe") == "greatcoat" else 0.04,
        emission=logo_hex,
        emission_strength=logo_emit,
    )
    kit["gold"] = _hex_mat(f"CharGold_{pid}", gold_hex, 0.32, 0.72)
    kit["vest"] = _hex_mat(f"CharVest_{pid}", colors.get("vest", "#1a1a1e"), 0.48, 0.04)
    kit["tie"] = _hex_mat(f"CharTie_{pid}", colors.get("tie", "#121212"), 0.46, 0.02)
    kit["glove"] = _hex_mat(f"CharGlove_{pid}", colors.get("glove", "#1a1a1e"), 0.5, 0.06)
    kit["scar"] = _hex_mat(f"CharScar_{pid}", colors.get("scar", "#6a3a32"), 0.55, 0.0)
    kit["accent"] = _hex_mat(
        f"CharAccent_{pid}",
        colors.get("jacketTrim", "#5fc7ec"),
        0.32,
        0.08,
        emission=colors.get("jacketTrim", "#5fc7ec"),
        emission_strength=0.25,
    )
    return kit


def _empty_ctx(spec):
    return {
        "spec": spec,
        "mats": _palette(spec),
        "meshes": [],
        "body": None,
        "armature": None,
        "actions": [],
        "deform": [],
    }


def build_through(preset_id: str, stage: str):
    if stage not in STAGES:
        raise ValueError(f"stage must be one of {STAGES}")
    spec = load_preset(preset_id)
    reset_scene()
    ctx = _empty_ctx(spec)
    stop = STAGES.index(stage)
    if stage == "qc":
        stop = STAGES.index("clip")
    for name in _THROUGH:
        if STAGES.index(name) > stop:
            break
        if name == "base":
            body.build_body(ctx)
        elif name == "hair":
            hair.build_hair(ctx)
        elif name == "wardrobe":
            wardrobe.build_wardrobe(ctx)
        elif name == "accessory":
            accessories.build_accessories(ctx)
        elif name == "bind":
            armature.build_armature(ctx)
            weights.bind_weights(ctx)
        elif name == "clip":
            if ctx["armature"] is None:
                armature.build_armature(ctx)
                weights.bind_weights(ctx)
            clips.build_clips(ctx)
    ctx["stage"] = stage
    return ctx


def inspect_ctx(ctx):
    import bpy

    arm = ctx.get("armature")
    bones = [b.name for b in arm.data.bones] if arm else []
    groups = {}
    skinned = False
    for obj in ctx.get("deform") or []:
        groups[obj.name] = [g.name for g in obj.vertex_groups]
        if obj.vertex_groups:
            skinned = True
        if any(mod.type == "ARMATURE" for mod in obj.modifiers):
            skinned = True
    actions = [a.name for a in bpy.data.actions]
    morphs = []
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            morphs.extend(k.name for k in obj.data.shape_keys.key_blocks)
    return {
        "ok": True,
        "preset": ctx["spec"]["id"],
        "file": ctx["spec"].get("file"),
        "stage": ctx.get("stage"),
        "root": arm.name if arm else (ctx["body"].name if ctx.get("body") else None),
        "bones": bones,
        "vertex_groups": groups,
        "skinned": skinned,
        "actions": actions,
        "morphs": morphs,
        "meshes": [m.name for m in ctx.get("meshes") or []],
    }
