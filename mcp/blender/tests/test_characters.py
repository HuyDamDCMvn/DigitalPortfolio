import sys

from config import KIT_DIR

if str(KIT_DIR) not in sys.path:
    sys.path.insert(0, str(KIT_DIR))

from characters.preset_lib import catalog, load_preset


def test_presets_include_roster_and_lead():
    rows = {row["id"]: row for row in catalog()["presets"]}
    for key in (
        "navy-bomber",
        "teal-headphones",
        "blue-hoodie",
        "purple-bun",
        "orange-varsity",
        "tan-dreads",
        "white-glasses",
        "lead-white-coat",
    ):
        assert key in rows
        assert rows[key]["file"].startswith("char-")
        assert rows[key]["file"].endswith(".glb")
    assert rows["lead-white-coat"]["kit_id"] == "CharLead"
    assert rows["lead-white-coat"]["wardrobe"] == "greatcoat"


def test_load_navy_bomber():
    spec = load_preset("navy-bomber")
    assert spec["kit_id"] == "CharNavyBomber"
    assert spec["hair"] == "spike"
    assert spec.get("footwear") == "sneaker"


def test_sheet_wardrobe_matches_turnaround():
    assert load_preset("teal-headphones")["wardrobe"] == "varsity"
    assert load_preset("purple-bun")["wardrobe"] == "varsity"
    assert load_preset("teal-headphones").get("footwear") == "boot"
