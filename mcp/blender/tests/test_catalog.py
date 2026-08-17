from catalog import builtin_assets, kit_ts_parts, material_names, web_snippet
from runner import validate_code, validate_glb_name


def test_builtin_hex_table():
    files = builtin_assets()
    assert "hex-table.glb" in files
    assert "oct-table.glb" in files
    assert "lead-dashboard.glb" in files
    assert len(files) >= 20


def test_materials_include_brand():
    names = material_names()
    for key in ("navy", "cyan", "gold", "charcoal", "white"):
        assert key in names


def test_kit_ts_hex_table():
    parts = {row["id"]: row for row in kit_ts_parts()}
    assert parts["HexTable"]["file"] == "hex-table.glb"
    assert parts["HexTable"]["anchor"] == "floor"
    assert parts["OctTable"]["file"] == "oct-table.glb"
    assert parts["OctTable"]["anchor"] == "floor"
    assert parts["LeadLaptop"]["anchor"] == "tabletop"


def test_glb_name_normalizes():
    assert validate_glb_name("Desk-Lamp.glb") == "desk-lamp.glb"


def test_code_size_limit():
    try:
        validate_code("x" * 200_001)
    except ValueError:
        return
    raise AssertionError("expected size block")


def test_code_allows_trusted_tokens():
    assert validate_code("import socket\nroot = 1") == "import socket\nroot = 1"


def test_web_snippet():
    text = web_snippet("DeskLamp", "desk-lamp.glb", "tabletop", "glow")
    assert "DeskLamp" in text
    assert "desk-lamp.glb" in text
    assert "tabletop" in text
