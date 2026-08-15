"""Clump hair from the 5-view sheets. Face is -Y, nape is +Y."""

from __future__ import annotations

from . import prim, proportions


def _mat(ctx):
    return ctx["mats"]["hair"]


def _head():
    return (0.0, proportions.HEAD_Y, proportions.HEAD_Z)


def _cap(mat, rx=1.10, ry=1.08, rz=0.72, zoff=0.034, yoff=0.018):
    hx, hy, hz = _head()
    hr = proportions.HEAD_R
    return prim.ellipsoid("HairCap", hr * rx, hr * ry, hr * rz, (hx, hy + yoff, hz + zoff), mat, 26)


def _spike_cluster(mat, locs):
    bits = []
    for name, rx, ry, rz, loc, rot in locs:
        spike = prim.ellipsoid(name, rx, ry, rz, loc, mat, 12)
        spike.rotation_euler = rot
        bits.append(spike)
    return bits


def spike_navy(ctx):
    """Short black spikes, ears readable from the side, logo-clear nape."""
    mat = _mat(ctx)
    hx, hy, hz = _head()
    bits = [
        _cap(mat, 1.10, 1.06, 0.70, 0.038, 0.016),
        prim.ellipsoid("HairFringe", 0.086, 0.026, 0.026, (hx + 0.010, hy - 0.100, hz + 0.038), mat, 14),
        prim.ellipsoid("HairSide_L", 0.042, 0.050, 0.062, (-0.108, hy + 0.012, hz + 0.018), mat, 14),
        prim.ellipsoid("HairSide_R", 0.048, 0.052, 0.068, (0.110, hy + 0.012, hz + 0.022), mat, 14),
        prim.ellipsoid("HairBack", 0.108, 0.068, 0.078, (hx, hy + 0.092, hz + 0.008), mat, 16),
    ]
    bits.extend(
        _spike_cluster(
            mat,
            [
                ("HairSpike_C", 0.032, 0.034, 0.070, (0.008, hy + 0.016, hz + 0.138), (0.42, 0.06, 0.0)),
                ("HairSpike_L", 0.028, 0.030, 0.060, (-0.048, hy + 0.012, hz + 0.122), (0.32, -0.22, 0.12)),
                ("HairSpike_R", 0.030, 0.032, 0.066, (0.052, hy + 0.014, hz + 0.126), (0.38, 0.26, -0.10)),
                ("HairSpike_LF", 0.026, 0.028, 0.048, (-0.036, hy - 0.055, hz + 0.100), (-0.35, -0.12, 0.08)),
                ("HairSpike_RF", 0.028, 0.030, 0.052, (0.046, hy - 0.058, hz + 0.104), (-0.38, 0.18, -0.06)),
                ("HairSpike_LB", 0.028, 0.032, 0.056, (-0.078, hy + 0.055, hz + 0.100), (0.22, -0.38, 0.10)),
                ("HairSpike_RB", 0.030, 0.034, 0.058, (0.078, hy + 0.058, hz + 0.108), (0.26, 0.40, -0.08)),
                ("HairSpike_Back", 0.034, 0.042, 0.056, (0.0, hy + 0.095, hz + 0.088), (-0.32, 0.0, 0.0)),
            ],
        )
    )
    return prim.join_meshes("Hair", bits, mat)


def spike_blue(ctx):
    """Messy dark-blue spikes under cyan headphones — keep crown lower."""
    mat = _mat(ctx)
    hx, hy, hz = _head()
    bits = [
        _cap(mat, 1.12, 1.08, 0.70, 0.034, 0.014),
        prim.ellipsoid("HairFringe", 0.088, 0.028, 0.028, (hx, hy - 0.102, hz + 0.030), mat, 14),
        prim.ellipsoid("HairSide_L", 0.046, 0.052, 0.066, (-0.112, hy + 0.010, hz + 0.016), mat, 14),
        prim.ellipsoid("HairSide_R", 0.046, 0.052, 0.066, (0.112, hy + 0.010, hz + 0.016), mat, 14),
        prim.ellipsoid("HairBack", 0.102, 0.058, 0.072, (hx, hy + 0.090, hz + 0.008), mat, 16),
    ]
    bits.extend(
        _spike_cluster(
            mat,
            [
                ("HairSpike_C", 0.030, 0.032, 0.058, (0.0, hy + 0.014, hz + 0.126), (0.38, 0.0, 0.0)),
                ("HairSpike_L", 0.028, 0.030, 0.054, (-0.050, hy + 0.010, hz + 0.114), (0.30, -0.20, 0.10)),
                ("HairSpike_R", 0.028, 0.030, 0.054, (0.050, hy + 0.010, hz + 0.114), (0.30, 0.20, -0.10)),
                ("HairSpike_LF", 0.026, 0.028, 0.044, (-0.040, hy - 0.052, hz + 0.092), (-0.32, -0.10, 0.06)),
                ("HairSpike_RF", 0.026, 0.028, 0.044, (0.040, hy - 0.052, hz + 0.092), (-0.32, 0.10, -0.06)),
                ("HairSpike_Back", 0.032, 0.040, 0.050, (0.0, hy + 0.092, hz + 0.080), (-0.28, 0.0, 0.0)),
            ],
        )
    )
    return prim.join_meshes("Hair", bits, mat)


def spike_orange(ctx):
    """Bright messy orange — more lift, still clump vinyl."""
    mat = _mat(ctx)
    hx, hy, hz = _head()
    bits = [
        _cap(mat, 1.14, 1.10, 0.74, 0.042, 0.016),
        prim.ellipsoid("HairFringe", 0.086, 0.030, 0.030, (hx + 0.008, hy - 0.100, hz + 0.034), mat, 14),
        prim.ellipsoid("HairSide_L", 0.050, 0.056, 0.072, (-0.112, hy + 0.012, hz + 0.022), mat, 14),
        prim.ellipsoid("HairSide_R", 0.052, 0.058, 0.076, (0.114, hy + 0.012, hz + 0.026), mat, 14),
        prim.ellipsoid("HairBack", 0.108, 0.062, 0.078, (hx, hy + 0.094, hz + 0.014), mat, 16),
    ]
    bits.extend(
        _spike_cluster(
            mat,
            [
                ("HairSpike_C", 0.036, 0.038, 0.080, (0.012, hy + 0.016, hz + 0.150), (0.48, 0.10, 0.0)),
                ("HairSpike_L", 0.032, 0.034, 0.070, (-0.052, hy + 0.012, hz + 0.134), (0.38, -0.24, 0.14)),
                ("HairSpike_R", 0.034, 0.036, 0.076, (0.058, hy + 0.014, hz + 0.140), (0.42, 0.30, -0.12)),
                ("HairSpike_LF", 0.028, 0.030, 0.054, (-0.038, hy - 0.054, hz + 0.106), (-0.40, -0.14, 0.08)),
                ("HairSpike_RF", 0.030, 0.032, 0.058, (0.048, hy - 0.058, hz + 0.110), (-0.42, 0.20, -0.08)),
                ("HairSpike_LB", 0.030, 0.036, 0.064, (-0.082, hy + 0.058, hz + 0.112), (0.28, -0.42, 0.12)),
                ("HairSpike_RB", 0.032, 0.038, 0.068, (0.084, hy + 0.062, hz + 0.118), (0.32, 0.44, -0.10)),
                ("HairSpike_Back", 0.038, 0.048, 0.064, (0.0, hy + 0.102, hz + 0.100), (-0.36, 0.0, 0.0)),
            ],
        )
    )
    return prim.join_meshes("Hair", bits, mat)


def spike(ctx):
    pid = ctx["spec"].get("id")
    if pid == "orange-varsity":
        return spike_orange(ctx)
    if pid == "blue-hoodie":
        return spike_blue(ctx)
    return spike_navy(ctx)


def long(ctx):
    """Teal girl: long waves to mid-back, straight bangs, volume at the sides."""
    mat = _mat(ctx)
    hx, hy, hz = _head()
    bits = [
        _cap(mat, 1.12, 1.10, 0.72, 0.040, 0.012),
        prim.ellipsoid("HairFringe", 0.110, 0.032, 0.028, (hx, hy - 0.108, hz + 0.028), mat, 16),
        prim.ellipsoid("HairBangs_L", 0.040, 0.026, 0.034, (-0.062, hy - 0.110, hz + 0.008), mat, 12),
        prim.ellipsoid("HairBangs_R", 0.040, 0.026, 0.034, (0.062, hy - 0.110, hz + 0.008), mat, 12),
        prim.ellipsoid("HairFall_L", 0.050, 0.058, 0.175, (-0.108, hy + 0.030, hz - 0.095), mat, 16),
        prim.ellipsoid("HairFall_R", 0.050, 0.058, 0.175, (0.108, hy + 0.030, hz - 0.095), mat, 16),
        prim.ellipsoid("HairWave_L", 0.042, 0.052, 0.110, (-0.092, hy + 0.048, hz - 0.050), mat, 12),
        prim.ellipsoid("HairWave_R", 0.042, 0.052, 0.110, (0.092, hy + 0.048, hz - 0.050), mat, 12),
        prim.ellipsoid("HairBack", 0.112, 0.078, 0.190, (hx, hy + 0.100, hz - 0.072), mat, 18),
        prim.ellipsoid("HairTip_L", 0.034, 0.042, 0.072, (-0.102, hy + 0.040, hz - 0.195), mat, 10),
        prim.ellipsoid("HairTip_R", 0.034, 0.042, 0.072, (0.102, hy + 0.040, hz - 0.195), mat, 10),
    ]
    return prim.join_meshes("Hair", bits, mat)


def bun(ctx):
    """Purple: high two-tier bun, side volume, clean nape."""
    mat = _mat(ctx)
    hx, hy, hz = _head()
    bits = [
        _cap(mat, 1.10, 1.06, 0.66, 0.036, 0.012),
        prim.sphere("HairBun", 0.058, (hx, hy + 0.030, hz + 0.148), mat, 24),
        prim.sphere("HairBunTop", 0.038, (hx, hy + 0.024, hz + 0.198), mat, 18),
        prim.ellipsoid("HairBunRing", 0.068, 0.052, 0.026, (hx, hy + 0.028, hz + 0.122), mat, 14),
        prim.ellipsoid("HairSide_L", 0.050, 0.056, 0.072, (-0.112, hy + 0.008, hz + 0.016), mat, 14),
        prim.ellipsoid("HairSide_R", 0.050, 0.056, 0.072, (0.112, hy + 0.008, hz + 0.016), mat, 14),
        prim.ellipsoid("HairNape", 0.088, 0.048, 0.046, (hx, hy + 0.078, hz - 0.018), mat, 12),
        prim.ellipsoid("HairFly_L", 0.018, 0.028, 0.036, (-0.078, hy + 0.040, hz + 0.102), mat, 8),
        prim.ellipsoid("HairFly_R", 0.018, 0.028, 0.036, (0.078, hy + 0.036, hz + 0.110), mat, 8),
    ]
    return prim.join_meshes("Hair", bits, mat)


def dreads(ctx):
    """Tan: short thick twists, rounded crown, not spaghetti."""
    mat = _mat(ctx)
    hx, hy, hz = _head()
    bits = [
        _cap(mat, 1.12, 1.10, 0.70, 0.038, 0.014),
        prim.ellipsoid("HairCrown", 0.090, 0.080, 0.048, (hx, hy + 0.012, hz + 0.088), mat, 16),
    ]
    locs = [
        (-0.078, 0.055, 0.038, 0.088),
        (-0.040, 0.078, 0.048, 0.096),
        (0.000, 0.088, 0.055, 0.102),
        (0.040, 0.078, 0.048, 0.096),
        (0.078, 0.055, 0.038, 0.088),
        (-0.068, -0.018, 0.048, 0.080),
        (0.000, -0.028, 0.062, 0.072),
        (0.068, -0.018, 0.048, 0.080),
        (-0.092, 0.016, 0.018, 0.082),
        (0.092, 0.016, 0.018, 0.082),
        (-0.028, 0.036, 0.072, 0.064),
        (0.028, 0.036, 0.072, 0.064),
        (-0.055, 0.090, 0.022, 0.078),
        (0.055, 0.090, 0.022, 0.078),
    ]
    for i, (x, y, zoff, length) in enumerate(locs):
        loc = (hx + x, hy + y, hz + zoff - length * 0.28)
        twist = prim.ellipsoid(f"Dread_{i:02d}", 0.018, 0.018, length * 0.48, loc, mat, 10)
        twist.rotation_euler = (0.18 * (i % 3 - 1), 0.10 * ((i % 5) - 2), 0.06 * (i % 2))
        bits.append(twist)
    return prim.join_meshes("Hair", bits, mat)


def fringe(ctx):
    return sidepart(ctx)


def sidepart(ctx):
    """Analyst: left part, volume on the right, short back, side-swept fringe."""
    mat = _mat(ctx)
    hx, hy, hz = _head()
    bits = [
        _cap(mat, 1.06, 1.04, 0.64, 0.034, 0.014),
        prim.ellipsoid("HairPart", 0.036, 0.085, 0.048, (hx - 0.042, hy + 0.008, hz + 0.058), mat, 12),
        prim.ellipsoid("HairVolume", 0.072, 0.078, 0.070, (hx + 0.058, hy + 0.010, hz + 0.052), mat, 16),
        prim.ellipsoid("HairFringe", 0.074, 0.024, 0.024, (hx + 0.018, hy - 0.100, hz + 0.028), mat, 12),
        prim.ellipsoid("HairBack", 0.096, 0.050, 0.054, (hx, hy + 0.082, hz + 0.010), mat, 14),
        prim.ellipsoid("HairTemple_L", 0.028, 0.038, 0.042, (-0.108, hy + 0.008, hz + 0.006), mat, 10),
        prim.ellipsoid("HairTemple_R", 0.034, 0.044, 0.048, (0.108, hy + 0.008, hz + 0.016), mat, 10),
    ]
    return prim.join_meshes("Hair", bits, mat)


def spike_lead(ctx):
    """Lead sheet: taller upward spikes, same vinyl family."""
    mat = _mat(ctx)
    hx, hy, hz = _head()
    bits = [
        _cap(mat, 1.16, 1.10, 0.76, 0.048, 0.016),
        prim.ellipsoid("HairFringe", 0.088, 0.030, 0.032, (hx, hy - 0.102, hz + 0.032), mat, 12),
        prim.ellipsoid("HairBack", 0.112, 0.072, 0.088, (hx, hy + 0.090, hz + 0.022), mat, 14),
        prim.ellipsoid("HairCrown", 0.048, 0.042, 0.072, (hx, hy + 0.016, hz + 0.138), mat, 12),
    ]
    bits.extend(
        _spike_cluster(
            mat,
            [
                ("HairSpike_C", 0.038, 0.036, 0.080, (0.0, hy + 0.016, hz + 0.156), (0.42, 0.0, 0.0)),
                ("HairSpike_L", 0.034, 0.034, 0.070, (-0.052, hy + 0.012, hz + 0.130), (0.32, -0.24, 0.18)),
                ("HairSpike_R", 0.034, 0.034, 0.070, (0.052, hy + 0.012, hz + 0.130), (0.32, 0.24, -0.18)),
                ("HairSpike_LB", 0.032, 0.036, 0.068, (-0.078, hy + 0.055, hz + 0.116), (0.24, -0.38, 0.12)),
                ("HairSpike_RB", 0.032, 0.036, 0.068, (0.078, hy + 0.055, hz + 0.116), (0.24, 0.38, -0.12)),
                ("HairSpike_Back", 0.038, 0.046, 0.068, (0.0, hy + 0.096, hz + 0.110), (-0.30, 0.0, 0.0)),
                ("HairSpike_LF", 0.028, 0.030, 0.050, (-0.030, hy - 0.055, hz + 0.112), (-0.38, -0.08, 0.08)),
                ("HairSpike_RF", 0.028, 0.030, 0.050, (0.036, hy - 0.055, hz + 0.112), (-0.38, 0.10, -0.06)),
            ],
        )
    )
    return prim.join_meshes("Hair", bits, mat)


BUILDERS = {
    "spike": spike,
    "spike-lead": spike_lead,
    "long": long,
    "bun": bun,
    "dreads": dreads,
    "fringe": fringe,
    "sidepart": sidepart,
}


def build_hair(ctx):
    kind = ctx["spec"].get("hair", "spike")
    hair = BUILDERS[kind](ctx)
    prim.shade_smooth(hair)
    ctx["hair"] = hair
    ctx["meshes"].append(hair)
    return hair
