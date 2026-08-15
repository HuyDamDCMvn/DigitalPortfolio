"""Contiguous vinyl chibi body. Sheet: head ~1/3 height, thick limbs, 4 fingers."""

from __future__ import annotations

from mathutils import Vector

from . import prim, proportions


def _limb(name, a, b, radius, mat, segments=18):
    va, vb = Vector(a), Vector(b)
    mid = (va + vb) * 0.5
    delta = vb - va
    length = max(delta.length, 0.02)
    obj = prim.ellipsoid(name, length * 0.54, radius, radius, (mid.x, mid.y, mid.z), mat, segments)
    prim.aim_x(obj, delta)
    return obj


def _face(ctx, hx, hy, hz, hr, skin, deep):
    mats = ctx["mats"]
    iris_m = mats["iris"]
    bits = []
    eye_y = hy - hr * 0.96
    eye_z = hz + 0.008
    for side, s in (("L", -1.0), ("R", 1.0)):
        ex = 0.046 * s
        white = prim.ellipsoid(f"EyeWhite_{side}", 0.042, 0.018, 0.032, (ex, eye_y, eye_z), mats["eyeWhite"], 22)
        iris = prim.ellipsoid(f"Iris_{side}", 0.020, 0.011, 0.020, (ex, eye_y - 0.012, eye_z - 0.002), iris_m, 18)
        pupil = prim.sphere(f"Pupil_{side}", 0.009, (ex, eye_y - 0.018, eye_z - 0.002), mats["pupil"], 14)
        spec = prim.sphere(
            f"Highlight_{side}",
            0.005,
            (ex - 0.008 * s, eye_y - 0.018, eye_z + 0.010),
            mats["spec"],
            10,
        )
        spec2 = prim.sphere(
            f"Highlight_{side}2",
            0.0028,
            (ex + 0.010 * s, eye_y - 0.012, eye_z - 0.008),
            mats["spec"],
            8,
        )
        lid = prim.ellipsoid(f"Lid_{side}", 0.040, 0.012, 0.010, (ex, eye_y + 0.004, eye_z + 0.020), skin, 14)
        lash = prim.ellipsoid(
            f"Lash_{side}",
            0.036,
            0.004,
            0.006,
            (ex, eye_y - 0.008, eye_z + 0.024),
            mats.get("lash") or mats["hair"],
            10,
        )
        heavy = ctx["spec"].get("brow") == "heavy"
        brow = prim.ellipsoid(
            f"Brow_{side}",
            0.038 if heavy else 0.032,
            0.010 if heavy else 0.008,
            0.008 if heavy else 0.006,
            (ex, eye_y + 0.006, eye_z + 0.036),
            mats["hair"],
            12,
        )
        brow.rotation_euler = (0.18, 0.14 * s, 0.22 * s)
        bits.extend([white, iris, pupil, spec, spec2, lid, lash, brow])
    bits.append(prim.ellipsoid("NoseBridge", 0.012, 0.016, 0.016, (hx, hy - hr * 0.98, hz - 0.010), deep, 12))
    bits.append(prim.sphere("Nose", 0.013, (hx, hy - hr * 1.04, hz - 0.020), deep, 16))
    bits.append(prim.ellipsoid("LipUpper", 0.020, 0.008, 0.006, (hx, hy - hr * 0.98, hz - 0.054), mats["lip"], 12))
    bits.append(prim.ellipsoid("LipLower", 0.016, 0.009, 0.006, (hx, hy - hr * 0.96, hz - 0.062), mats["lip"], 12))
    bits.append(prim.sphere("LipCorner_L", 0.0046, (-0.018, hy - hr * 0.97, hz - 0.056), mats["lip"], 10))
    bits.append(prim.sphere("LipCorner_R", 0.0046, (0.018, hy - hr * 0.97, hz - 0.056), mats["lip"], 10))
    return bits


def _hands(skin, sx):
    bits = []
    hx0 = proportions.HAND_X
    hz0 = proportions.HAND_Z
    for side, s in (("L", -1.0), ("R", 1.0)):
        hx, hy, hz = hx0 * s * sx, 0.012, hz0
        palm = prim.ellipsoid(f"Hand_{side}", 0.034, 0.028, 0.018, (hx, hy, hz), skin, 16)
        bits.append(palm)
        knuckles = ((0.010, 0.010), (0.016, 0.002), (0.012, -0.008), (0.004, -0.016))
        for i, (fy, fz) in enumerate(knuckles):
            bits.append(
                prim.ellipsoid(
                    f"Finger_{side}_{i}",
                    0.020,
                    0.008,
                    0.008,
                    (hx + 0.030 * s, hy + fy, hz + fz),
                    skin,
                    10,
                )
            )
        thumb = prim.ellipsoid(
            f"Thumb_{side}",
            0.018,
            0.009,
            0.009,
            (hx + 0.006 * s, hy + 0.024, hz + 0.008),
            skin,
            10,
        )
        thumb.rotation_euler = (0.45, 0.55 * s, 0.28 * s)
        bits.append(thumb)
    return bits


def build_body(ctx):
    spec = ctx["spec"]
    mats = ctx["mats"]
    skin = mats["skin"]
    deep = mats["skinDeep"]
    scale = proportions.body_scale(spec.get("body", "male"))
    sx = scale["shoulder"]
    hx = scale["hip"]
    tz = scale["torso"]
    lr = scale["limb"]
    hr = proportions.HEAD_R * scale["head"]
    hy = proportions.HEAD_Y
    hz = proportions.HEAD_Z
    hip_z = proportions.HIP_Z
    sh_x = proportions.SHOULDER_X * sx
    hip_x = proportions.HIP_X * hx

    parts = [
        prim.ellipsoid("Pelvis", 0.098 * hx, 0.074, 0.074, (0, 0.018, hip_z), skin, 28),
        prim.ellipsoid("Abdomen", 0.092 * sx, 0.068, 0.090 * tz, (0, 0.020, 0.455), skin, 28),
        prim.ellipsoid("BodyCore", 0.108 * sx, 0.082, 0.155 * tz, (0, 0.024, 0.530), skin, 32),
        prim.ellipsoid("Torso", 0.102 * sx, 0.076, 0.100 * tz, (0, 0.022, 0.545), skin, 32),
        prim.ellipsoid("Chest", 0.114 * sx, 0.082, 0.062, (0, 0.028, proportions.CHEST_Z + 0.08), skin, 28),
        prim.cylinder("Neck", 0.034, 0.052, (0, 0.016, proportions.NECK_Z), skin, 24),
        prim.sphere("Head", hr, (0, hy, hz), skin, 42),
        prim.ellipsoid("Cranium", hr * 0.94, hr * 0.90, hr * 0.70, (0, hy + 0.008, hz + 0.042), skin, 28),
        prim.ellipsoid("Jaw", 0.082, 0.072, 0.050, (0, hy - 0.038, hz - 0.078), skin, 24),
        prim.ellipsoid("Chin", 0.044, 0.040, 0.028, (0, hy - 0.052, hz - 0.102), skin, 16),
        prim.ellipsoid("Cheek_L", 0.038, 0.032, 0.032, (-0.062, hy - 0.055, hz - 0.018), skin, 16),
        prim.ellipsoid("Cheek_R", 0.038, 0.032, 0.032, (0.062, hy - 0.055, hz - 0.018), skin, 16),
    ]
    for side, s in (("L", -1.0), ("R", 1.0)):
        ear = prim.ellipsoid(f"Ear_{side}", 0.018, 0.014, 0.032, (hr * 0.94 * s, hy + 0.008, hz - 0.006), skin, 14)
        ear.rotation_euler = (0.12, 0.38 * s, 0.18 * s)
        parts.append(ear)
        parts.append(
            _limb(
                f"Thigh_{side}",
                (hip_x * s, 0.014, hip_z - 0.02),
                (hip_x * s, 0.014, proportions.KNEE_Z + 0.02),
                0.050 * hx * lr,
                skin,
                20,
            )
        )
        parts.append(prim.sphere(f"Knee_{side}", 0.034 * lr, (hip_x * s, 0.014, proportions.KNEE_Z), skin, 14))
        parts.append(
            _limb(
                f"Shin_{side}",
                (hip_x * s, 0.012, proportions.KNEE_Z - 0.02),
                (hip_x * s, 0.008, proportions.ANKLE_Z + 0.02),
                0.038 * lr,
                skin,
                18,
            )
        )
        parts.append(prim.sphere(f"Ankle_{side}", 0.026, (hip_x * s, 0.004, proportions.ANKLE_Z), skin, 12))
        parts.append(
            prim.ellipsoid(f"Foot_{side}", 0.036, 0.074, 0.022, (hip_x * s, -0.040, 0.024), skin, 16)
        )
        parts.append(prim.sphere(f"Shoulder_{side}", 0.048 * sx, (sh_x * s, 0.016, proportions.SHOULDER_Z), skin, 20))
        parts.append(
            _limb(
                f"UpperArm_{side}",
                (sh_x * s, 0.014, proportions.SHOULDER_Z),
                (proportions.ELBOW_X * s * sx, 0.010, 0.505),
                0.036 * lr,
                skin,
                18,
            )
        )
        parts.append(prim.sphere(f"Elbow_{side}", 0.030 * lr, (proportions.ELBOW_X * s * sx, 0.010, 0.505), skin, 12))
        parts.append(
            _limb(
                f"ForeArm_{side}",
                (proportions.ELBOW_X * s * sx, 0.010, 0.505),
                (proportions.HAND_X * s * sx, 0.012, proportions.HAND_Z + 0.02),
                0.030 * lr,
                skin,
                18,
            )
        )
    parts.extend(_hands(skin, sx))

    body = prim.join_meshes("Body", parts, skin)
    prim.voxel_remesh(body, 0.008)
    ctx["body"] = body
    ctx["meshes"].append(body)

    face = _face(ctx, 0.0, hy, hz, hr, skin, deep)
    ctx["face"] = face
    ctx["meshes"].extend(face)
    return body
