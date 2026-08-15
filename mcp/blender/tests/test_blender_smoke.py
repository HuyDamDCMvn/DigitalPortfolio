import pytest

from config import JOBS_DIR, MODELS_DIR, find_blender
from runner import run_job, write_temp


@pytest.mark.skipif(find_blender() is None, reason="Blender not installed")
def test_kit_run_tiny_block():
    code = "\n".join(
        [
            'root = add_empty(None, "McpProbe")',
            'add_round(root, "Block", w=0.12, h=0.12, d=0.12, y=0.06, mat=mat["cyan"])',
        ]
    )
    code_path = write_temp("probe.py", code)
    filename = "mcp-probe.glb"
    dest = MODELS_DIR / filename
    result = run_job(
        JOBS_DIR / "run_job.py",
        ["--code", str(code_path), "--out", str(MODELS_DIR), "--export", filename],
        timeout=120,
    )
    assert result.get("ok") is True, result
    assert dest.is_file()
    assert result.get("bytes", 0) > 200
    mins = result["bounds"]["min"]
    maxs = result["bounds"]["max"]
    assert mins[1] >= -0.01
    assert maxs[1] > 0.05
    dest.unlink(missing_ok=True)
