"""Load character presets from JSON (no bpy)."""

from __future__ import annotations

import json
from pathlib import Path

PRESET_DIR = Path(__file__).resolve().parent / "presets"
STAGES = ["base", "hair", "wardrobe", "accessory", "bind", "clip", "qc"]
CLIPS = ["Sit", "Idle"]
BONES = [
    "Root",
    "Hips",
    "Spine",
    "Chest",
    "Neck",
    "Head",
    "Shoulder_L",
    "UpperArm_L",
    "LowerArm_L",
    "Hand_L",
    "Shoulder_R",
    "UpperArm_R",
    "LowerArm_R",
    "Hand_R",
    "UpperLeg_L",
    "LowerLeg_L",
    "Foot_L",
    "UpperLeg_R",
    "LowerLeg_R",
    "Foot_R",
]


def list_presets() -> list[dict]:
    rows = []
    if not PRESET_DIR.is_dir():
        return rows
    for path in sorted(PRESET_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        data["path"] = str(path)
        rows.append(data)
    return rows


def load_preset(preset_id: str) -> dict:
    path = PRESET_DIR / f"{preset_id}.json"
    if not path.is_file():
        known = ", ".join(p["id"] for p in list_presets()) or "(none)"
        raise ValueError(f"unknown preset {preset_id!r}; have {known}")
    data = json.loads(path.read_text(encoding="utf-8"))
    data["path"] = str(path)
    return data


def catalog() -> dict:
    return {
        "stages": STAGES,
        "clips": CLIPS,
        "bones": BONES,
        "presets": list_presets(),
        "gate": "Hub/lead meeting is OctTable (8 chairs, 7 sitters, 1 remote laptop). Lead identity is lead-white-coat — do not seat them without a user placement call.",
    }
