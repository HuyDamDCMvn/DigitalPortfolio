"""Spawn headless Blender and parse the kit JSON result line."""

from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path

from config import (
    JOBS_DIR,
    KIT_DIR,
    MARKER,
    MODELS_DIR,
    REPO_ROOT,
    TIMEOUT_SEC,
    TMP_DIR,
    ensure_dirs,
    find_blender,
    sandbox_file,
)

GLB_NAME = re.compile(r"^[a-z0-9][a-z0-9-]*\.glb$")
DENIED = re.compile(
    r"\b(socket|subprocess|urllib|requests|http\.client|ctypes|winreg|shutil)\b"
    r"|\bos\.system\b|\beval\s*\(|\bexec\s*\(",
    re.I,
)


class BlenderError(RuntimeError):
    pass


def require_blender() -> Path:
    path = find_blender()
    if path is None:
        raise BlenderError(
            "Blender executable not found. Set BLENDER_PATH or install 4.5 under D:\\03_DCMvn\\tools."
        )
    return path


def blender_version() -> str:
    blender = require_blender()
    proc = subprocess.run(
        [str(blender), "--version"],
        capture_output=True,
        text=True,
        timeout=30,
        cwd=str(REPO_ROOT),
    )
    line = (proc.stdout or proc.stderr or "").strip().splitlines()
    return line[0] if line else "unknown"


def parse_result(stdout: str, stderr: str) -> dict:
    for stream in (stdout, stderr):
        for line in stream.splitlines():
            if line.startswith(MARKER):
                payload = line[len(MARKER) :].strip()
                return json.loads(payload)
    tail = "\n".join((stderr or stdout).splitlines()[-40:])
    raise BlenderError(f"Blender did not return {MARKER}\n{tail}")


def run_job(script: Path, args: list[str], timeout: int | None = None) -> dict:
    blender = require_blender()
    ensure_dirs()
    cmd = [
        str(blender),
        "--background",
        "--factory-startup",
        "--python-exit-code",
        "1",
        "--python",
        str(script),
        "--",
        *args,
    ]
    env = os.environ.copy()
    env["BLENDER_KIT_DIR"] = str(KIT_DIR)
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout or TIMEOUT_SEC,
            cwd=str(REPO_ROOT),
            env=env,
        )
    except subprocess.TimeoutExpired as exc:
        raise BlenderError(f"Blender timed out after {timeout or TIMEOUT_SEC}s") from exc
    if proc.returncode != 0:
        try:
            return parse_result(proc.stdout or "", proc.stderr or "")
        except Exception:
            tail = "\n".join((proc.stderr or proc.stdout or "").splitlines()[-50:])
            raise BlenderError(f"Blender exit {proc.returncode}\n{tail}") from None
    return parse_result(proc.stdout or "", proc.stderr or "")


def validate_glb_name(filename: str) -> str:
    name = Path(filename).name.lower()
    if not GLB_NAME.match(name):
        raise ValueError("filename must be kebab-case.glb (e.g. desk-lamp.glb)")
    return name


def validate_code(code: str) -> str:
    if len(code) > 200_000:
        raise ValueError("code is too large")
    if DENIED.search(code):
        raise ValueError("code uses a blocked import or call; stick to kit primitives")
    return code


def models_glb(filename: str) -> Path:
    return sandbox_file(MODELS_DIR / validate_glb_name(filename), MODELS_DIR)


def write_temp(name: str, text: str) -> Path:
    ensure_dirs()
    path = TMP_DIR / name
    path.write_text(text, encoding="utf-8")
    return path


def export_known(only: str | None = None) -> dict:
    args = ["--out", str(MODELS_DIR)]
    if only:
        args.extend(["--only", only])
    return run_job(JOBS_DIR / "export_job.py", args)
