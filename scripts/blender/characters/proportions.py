"""Vinyl-chibi proportions from the 5-view roster sheets.

Author space: Blender Z-up metres, floor z=0, face toward -Y.

Sheet read (front / 3/4 / side / back), as fractions of standing height H:

  crown 1.00 · head centre 0.84 · chin 0.68 · neck 0.71
  shoulder 0.63 · chest 0.58 · hip 0.40 · knee 0.22 · ankle 0.06
  head width ≈ 0.28 H (same as male shoulder width)
  head depth ≈ 0.24 H · eye line ≈ 0.80 H · four-finger hands

H is 0.94 m so the sitters still fit the office-chair pad (sit hip 0.50).
"""

from __future__ import annotations

HEIGHT = 0.94
HIP_Z = 0.38
SIT_HIP_Z = 0.50
SHOULDER_Z = 0.595
CHEST_Z = 0.55
NECK_Z = 0.668
HEAD_Z = 0.79
HEAD_R = 0.132
KNEE_Z = 0.205
ANKLE_Z = 0.052
FOOT_HALF = 0.058
SHOULDER_X = 0.132
HIP_X = 0.072
ELBOW_X = 0.275
HAND_X = 0.405
HAND_Z = 0.425
HEAD_Y = 0.018


def body_scale(kind: str) -> dict[str, float]:
    female = kind == "female"
    return {
        "shoulder": 0.90 if female else 1.0,
        "hip": 1.06 if female else 1.0,
        "torso": 0.95 if female else 1.0,
        "head": 1.0,
        "limb": 0.96 if female else 1.0,
    }
