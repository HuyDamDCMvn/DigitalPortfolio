"""Local paths: repo kit, Blender 4.5 on this machine, export sandbox."""

from __future__ import annotations

import os
from pathlib import Path

MARKER = "__KIT_RESULT__"

_MCP_DIR = Path(__file__).resolve().parent
REPO_ROOT = Path(os.environ.get("BLENDER_KIT_ROOT", _MCP_DIR.parents[1])).resolve()
KIT_DIR = REPO_ROOT / "scripts" / "blender"
MODELS_DIR = REPO_ROOT / "public" / "models"
COMPONENTS_DIR = KIT_DIR / "components"
EXPORT_KIT = KIT_DIR / "export_kit.py"
JOBS_DIR = _MCP_DIR / "jobs"
TMP_DIR = _MCP_DIR / ".tmp"
KIT_TS = REPO_ROOT / "app" / "lab" / "kit.ts"

BLENDER_CANDIDATES = [
    os.environ.get("BLENDER_PATH"),
    r"D:\03_DCMvn\tools\blender-4.5.10\blender-4.5.10-windows-x64\blender.exe",
    r"D:\03_DCMvn\tools\blender-4.5.10\blender.exe",
    r"C:\Program Files\Blender Foundation\Blender 4.5\blender.exe",
    r"C:\Program Files\Blender Foundation\Blender 4.4\blender.exe",
    r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe",
    r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
]

TIMEOUT_SEC = int(os.environ.get("BLENDER_MCP_TIMEOUT", "180"))
CHAR_TIMEOUT_SEC = int(os.environ.get("BLENDER_CHAR_TIMEOUT", "480"))


def find_blender() -> Path | None:
    for raw in BLENDER_CANDIDATES:
        if not raw:
            continue
        path = Path(raw)
        if path.is_file():
            return path
    return None


def ensure_dirs() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    COMPONENTS_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)


def sandbox_file(path: Path, *allowed_roots: Path) -> Path:
    resolved = path.resolve()
    roots = allowed_roots or (MODELS_DIR, COMPONENTS_DIR, TMP_DIR, KIT_DIR)
    for root in roots:
        try:
            resolved.relative_to(root.resolve())
            return resolved
        except ValueError:
            continue
    raise ValueError(f"path is outside the kit sandbox: {resolved}")
