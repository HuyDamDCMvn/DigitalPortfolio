"""White vinyl task chair from the 14-view product sheet.

Proportions locked from the orthographic cells (front 190 px = 1.00 m):
seat 0.50 x 0.49, seat-top 0.48 m, back 0.46 x 0.52, base ~0.65 m.
Teal is the vertical/side band only — white on the large faces.
Author in Three.js metres (Y up, +Z forward). Floor y = 0.
"""

from __future__ import annotations

import math
import os

import bmesh
import bpy
from mathutils import Matrix, Vector

from core import (
    _bevel,
    _bm_to_obj,
    add_cylinder,
    add_empty,
    add_round,
    add_sphere,
    add_torus,
    beul,
    bloc,
    make_material,
)

FILE = "white-teal-chair.glb"

# --- sheet-derived metres -------------------------------------------------
SEAT_W = 0.500
SEAT_D = 0.490
SEAT_H = 0.082
SEAT_Y = 0.480
SEAT_Z = 0.018
BACK_W = 0.458
BACK_H = 0.528
BACK_T = 0.102
BACK_RECLINE = 0.12
ARM_X = 0.268
ARM_PAD_Y = 0.638
ARM_PAD_L = 0.248
ARM_PAD_W = 0.056
ARM_PAD_H = 0.026
BASE_R = 0.318
STEM_R = 0.022
PISTON_R = 0.0155
WHEEL_R = 0.025


def _mat(name, hex_color, roughness, metalness=0.04):
    return make_material(name, hex_color, roughness=roughness, metalness=metalness)


def _round_rect_2d(w, d, radius, segs):
    hw, hd = w * 0.5, d * 0.5
    r = min(radius, hw - 1e-4, hd - 1e-4)
    segs = max(4, int(segs))
    pts = []
    corners = (
        (hw - r, hd - r, 0.0, math.pi * 0.5),
        (-(hw - r), hd - r, math.pi * 0.5, math.pi),
        (-(hw - r), -(hd - r), math.pi, math.pi * 1.5),
        (hw - r, -(hd - r), math.pi * 1.5, math.pi * 2.0),
    )
    for cx, cy, a0, a1 in corners:
        for i in range(segs + 1):
            a = a0 + (a1 - a0) * (i / segs)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    cleaned = [pts[0]]
    for px, py in pts[1:]:
        dx = px - cleaned[-1][0]
        dy = py - cleaned[-1][1]
        if dx * dx + dy * dy > 1e-12:
            cleaned.append((px, py))
    dx = cleaned[0][0] - cleaned[-1][0]
    dy = cleaned[0][1] - cleaned[-1][1]
    if dx * dx + dy * dy < 1e-12:
        cleaned.pop()
    return cleaned


def _tag_band(bm, thin, threshold):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.faces.ensure_lookup_table()
    for face in bm.faces:
        axis = face.normal.z if thin == "z" else face.normal.y
        face.material_index = 0 if abs(axis) >= threshold else 1


def _prism_fillet(face_a, face_b, thick, corner_r, fillet_r, segs, thin="z"):
    bm = bmesh.new()
    pts = _round_rect_2d(face_a, face_b, corner_r, segs)
    ht = thick * 0.5
    bot, top = [], []
    for pa, pb in pts:
        if thin == "z":
            bot.append(bm.verts.new((pa, pb, -ht)))
            top.append(bm.verts.new((pa, pb, ht)))
        else:
            bot.append(bm.verts.new((pa, -ht, pb)))
            top.append(bm.verts.new((pa, ht, pb)))
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bot[i], bot[j], top[j], top[i]))
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if fillet_r > 1e-5:
        if thin == "z":
            rim = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6]
        else:
            rim = [e for e in bm.edges if abs(e.verts[0].co.y - e.verts[1].co.y) < 1e-6]
        kwargs = dict(geom=rim, offset=min(fillet_r, thick * 0.42), segments=4, profile=0.55, clamp_overlap=True)
        try:
            bmesh.ops.bevel(bm, offset_type="OFFSET", affect="EDGES", **kwargs)
        except TypeError:
            try:
                bmesh.ops.bevel(bm, offset_type="OFFSET", **kwargs)
            except TypeError:
                bmesh.ops.bevel(bm, geom=rim, offset=fillet_r, segments=4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def _deform_seat(bm, w, d, h):
    hw, hd, hh = w * 0.5, d * 0.5, h * 0.5
    for v in bm.verts:
        x, y, z = v.co.x, v.co.y, v.co.z
        nx = x / hw
        ny = y / hd
        if z > 0.0:
            v.co.z -= 0.009 * max(0.0, 1.0 - nx * nx) * max(0.0, 1.0 - ny * ny)
        if y > 0.18 * hd:
            t = (y - 0.18 * hd) / max(1e-4, hd - 0.18 * hd)
            t = max(0.0, min(1.0, t))
            v.co.z -= t * t * 0.016
            v.co.y += t * 0.012


def _deform_back(bm, w, h, t):
    hw, hh, ht = w * 0.5, h * 0.5, t * 0.5
    for v in bm.verts:
        x, y, z = v.co.x, v.co.y, v.co.z
        xn = x / hw
        zn = z / hh
        wrap = (1.0 - xn * xn) * 0.010
        lumbar = math.exp(-((zn + 0.12) / 0.38) ** 2) * 0.008
        s_curve = (zn * 0.5 + 0.5) ** 2 * 0.016
        if y > 0.0:
            v.co.y -= wrap
            v.co.y += lumbar
        v.co.y -= s_curve * (0.55 if y > 0.0 else 1.0)


def add_cushion(
    parent,
    name,
    face_a,
    face_b,
    thick,
    *,
    corner_r,
    fillet_r,
    white,
    teal,
    thin="z",
    x=0.0,
    y=0.0,
    z=0.0,
    rx=0.0,
    ry=0.0,
    rz=0.0,
    deform=None,
    segs=10,
    threshold=0.42,
):
    bm = _prism_fillet(face_a, face_b, thick, corner_r, fillet_r, segs, thin=thin)
    _tag_band(bm, thin, threshold)
    if deform == "seat":
        _deform_seat(bm, face_a, face_b, thick)
    elif deform == "back":
        _deform_back(bm, face_a, face_b, thick)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    mesh.materials.append(white)
    mesh.materials.append(teal)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
        obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.location = bloc(x, y, z)
    obj.rotation_euler = beul(rx, ry, rz)
    return obj


def add_tapered_spoke(parent, name, length, yaw, y, mat):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        t = v.co.y + 0.5
        v.co.x *= 0.054 * (1.0 - 0.42 * t)
        v.co.z *= 0.024 * (1.0 - 0.22 * t)
        v.co.y = (t - 0.5) * length
    _bevel(bm, 0.0075, 5)
    r = BASE_R - length * 0.5 - 0.012
    obj = _bm_to_obj(
        name,
        bm,
        parent,
        bloc(math.sin(yaw) * r, y, math.cos(yaw) * r),
        beul(0.07, yaw, 0.0),
        mat,
    )
    return obj


def add_caster(parent, index, yaw, black, rubber):
    n = f"{index:02d}"
    px = math.sin(yaw) * BASE_R
    pz = math.cos(yaw) * BASE_R
    swivel = add_empty(parent, f"Caster_{n}", x=px, y=WHEEL_R + 0.016, z=pz, ry=yaw, size=0.03)
    add_cylinder(swivel, f"CasterPin_{n}", 0.008, 0.008, 0.022, y=0.010, radial=20, mat=black)
    add_round(
        swivel,
        f"CasterHorn_{n}",
        w=0.040,
        h=0.022,
        d=0.038,
        y=-0.002,
        radius=0.009,
        segments=6,
        mat=black,
    )
    add_cylinder(swivel, f"CasterHood_{n}", 0.022, 0.022, 0.028, y=0.002, rx=math.pi / 2, radial=20, mat=black)
    gap = 0.016
    for side, sx in (("L", -gap), ("R", gap)):
        add_cylinder(
            swivel,
            f"Wheel_{n}{side}",
            WHEEL_R,
            WHEEL_R,
            0.012,
            x=sx,
            y=-0.016,
            rz=math.pi / 2,
            radial=32,
            mat=rubber,
        )
        add_cylinder(
            swivel,
            f"WheelHub_{n}{side}",
            0.0065,
            0.0065,
            0.014,
            x=sx,
            y=-0.016,
            rz=math.pi / 2,
            radial=16,
            mat=black,
        )
    return swivel


def _smooth(obj):
    if obj.type != "MESH":
        return
    for poly in obj.data.polygons:
        poly.use_smooth = True


def build(mat):
    vinyl = _mat("ChairVinyl", "#F7F6F3", 0.44, 0.02)
    teal = _mat("ChairTeal", "#00B7B9", 0.28, 0.08)
    black = _mat("ChairBlack", "#101112", 0.64, 0.08)
    rubber = _mat("ChairRubber", "#0E0F10", 0.82, 0.02)
    chrome = _mat("ChairChrome", "#9AA0A6", 0.14, 0.88)
    plastic = _mat("ChairWhitePlastic", "#F4F3F0", 0.38, 0.05)

    root = add_empty(None, "WhiteTealChair")
    base = add_empty(root, "Base")
    lift = add_empty(root, "Lift")
    swivel = add_empty(lift, "Swivel")
    tilt = add_empty(swivel, "Tilt")

    hub = add_cylinder(base, "Hub", 0.056, 0.060, 0.032, y=0.026, radial=48, mat=black)
    add_cylinder(base, "HubCap", 0.036, 0.036, 0.008, y=0.044, radial=36, mat=black)
    add_cylinder(base, "StemHousing", STEM_R + 0.002, STEM_R + 0.004, 0.255, y=0.168, radial=40, mat=black)
    add_torus(base, "HousingRing", radius=STEM_R + 0.006, tube=0.0032, y=0.292, radial=28, tubular=10, mat=black)

    for i in range(5):
        a = i * (math.pi * 2.0 / 5.0) + math.pi / 5.0
        add_tapered_spoke(base, f"Spoke_{i + 1:02d}", 0.268, a, 0.030, black)
        add_caster(base, i + 1, a, black, rubber)

    add_cylinder(lift, "StemPiston", PISTON_R, PISTON_R, 0.155, y=0.355, radial=36, mat=chrome)
    add_cylinder(swivel, "StemSleeve", 0.027, 0.029, 0.048, y=0.412, radial=32, mat=black)

    mech = add_round(
        tilt,
        "Mech",
        w=0.22,
        h=0.018,
        d=0.18,
        y=SEAT_Y - SEAT_H * 0.5 - 0.016,
        z=SEAT_Z - 0.02,
        radius=0.012,
        segments=6,
        mat=black,
    )
    add_round(
        tilt,
        "SeatUnderside",
        w=0.42,
        h=0.010,
        d=0.40,
        y=SEAT_Y - SEAT_H * 0.5 - 0.004,
        z=SEAT_Z,
        radius=0.04,
        segments=8,
        mat=black,
    )
    add_round(
        tilt,
        "HeightLever",
        w=0.11,
        h=0.008,
        d=0.014,
        x=0.16,
        y=SEAT_Y - SEAT_H * 0.5 - 0.018,
        z=0.06,
        ry=0.35,
        radius=0.003,
        segments=4,
        mat=black,
    )
    add_sphere(tilt, "LeverKnob", 0.009, x=0.215, y=SEAT_Y - SEAT_H * 0.5 - 0.018, z=0.078, segments=20, mat=black)

    add_cushion(
        tilt,
        "Seat",
        SEAT_W,
        SEAT_D,
        SEAT_H,
        corner_r=0.072,
        fillet_r=0.016,
        white=vinyl,
        teal=teal,
        thin="z",
        y=SEAT_Y,
        z=SEAT_Z,
        deform="seat",
        segs=12,
        threshold=0.36,
    )

    back_y = SEAT_Y + 0.018 + BACK_H * 0.5
    back_z = SEAT_Z - SEAT_D * 0.5 + 0.012
    add_cushion(
        tilt,
        "Back",
        BACK_W,
        BACK_H,
        BACK_T,
        corner_r=0.078,
        fillet_r=0.016,
        white=vinyl,
        teal=teal,
        thin="y",
        y=back_y,
        z=back_z,
        rx=BACK_RECLINE,
        deform="back",
        segs=12,
        threshold=0.34,
    )
    add_round(
        tilt,
        "BackBracket",
        w=0.08,
        h=0.028,
        d=0.055,
        y=SEAT_Y + 0.012,
        z=back_z + BACK_T * 0.15,
        rx=0.2,
        radius=0.008,
        segments=5,
        mat=black,
    )

    for side, sx in (("L", -ARM_X), ("R", ARM_X)):
        arm = add_empty(tilt, f"Arm_{side}", x=sx, y=SEAT_Y - 0.02, z=SEAT_Z - 0.02)
        post = add_cylinder(
            arm,
            f"ArmPost_{side}",
            0.013,
            0.016,
            0.175,
            y=0.092,
            z=0.0,
            radial=28,
            mat=plastic,
        )
        post.scale.x = 0.72
        add_round(
            arm,
            f"ArmPad_{side}",
            w=ARM_PAD_W,
            h=ARM_PAD_H,
            d=ARM_PAD_L,
            y=ARM_PAD_Y - (SEAT_Y - 0.02),
            z=0.008,
            radius=0.013,
            segments=10,
            mat=vinyl,
        )

    def walk(obj):
        _smooth(obj)
        for child in obj.children:
            walk(child)

    walk(root)
    return root


def render_refs(root, out_dir=None):
    """Orthographic front / right / top / three-quarter for sheet comparison."""
    if out_dir is None:
        here = os.path.dirname(os.path.abspath(__file__))
        out_dir = os.path.normpath(os.path.join(here, "..", "..", "..", "mcp", "blender", ".tmp"))
    os.makedirs(out_dir, exist_ok=True)

    xs, ys, zs = [], [], []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not obj.data.vertices:
            continue
        mw = obj.matrix_world
        for vert in obj.data.vertices:
            wco = mw @ vert.co
            xs.append(wco.x)
            ys.append(wco.y)
            zs.append(wco.z)
    if not xs:
        return []
    min_v = Vector((min(xs), min(ys), min(zs)))
    max_v = Vector((max(xs), max(ys), max(zs)))
    center = (min_v + max_v) / 2.0
    size_v = max_v - min_v
    span = max(size_v.x, size_v.y, size_v.z) * 1.18

    scene = bpy.context.scene
    for candidate in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = candidate
            break
        except Exception:
            continue
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.world = bpy.data.worlds.new("ChairWorld") if scene.world is None else scene.world
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.96, 0.96, 0.96, 1.0)
        bg.inputs[1].default_value = 1.0

    for name in list(bpy.data.objects):
        if name.name.startswith("RefCam") or name.name.startswith("RefLight"):
            bpy.data.objects.remove(name, do_unlink=True)

    sun = bpy.data.lights.new("RefSun", "SUN")
    sun.energy = 2.6
    sun_obj = bpy.data.objects.new("RefSun", sun)
    bpy.context.collection.objects.link(sun_obj)
    sun_obj.location = center + Vector((1.2, -1.4, 2.0))

    fill = bpy.data.lights.new("RefFill", "AREA")
    fill.energy = 90
    fill.size = 1.4
    fill_obj = bpy.data.objects.new("RefFill", fill)
    bpy.context.collection.objects.link(fill_obj)
    fill_obj.location = center + Vector((-1.0, 0.8, 1.2))

    dist = 2.7
    mid_z = (min_v.z + max_v.z) * 0.5
    # Blender camera default looks -Z. Chair sitting-face is -Y.
    views = {
        "front": (Vector((center.x, min_v.y - dist, mid_z)), (math.pi * 0.5, 0.0, math.pi), "ORTHO"),
        "back": (Vector((center.x, max_v.y + dist, mid_z)), (math.pi * 0.5, 0.0, 0.0), "ORTHO"),
        "right": (Vector((max_v.x + dist, center.y, mid_z)), (math.pi * 0.5, 0.0, -math.pi * 0.5), "ORTHO"),
        "top": (Vector((center.x, center.y, max_v.z + dist)), (0.0, 0.0, 0.0), "ORTHO"),
        "three_quarter": (
            Vector((center.x + 1.55, center.y - 2.15, mid_z + 0.55)),
            None,
            "PERSP",
        ),
    }
    paths = []
    cam_data = bpy.data.cameras.new("RefCam")
    cam = bpy.data.objects.new("RefCam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    for view, (loc, euler, kind) in views.items():
        cam.location = loc
        if euler is None:
            direction = Vector((center.x, center.y, mid_z)) - loc
            cam.rotation_euler = direction.to_track_quat("-Z", "Z").to_euler()
        else:
            cam.rotation_euler = euler
        cam_data.type = kind
        cam_data.clip_start = 0.05
        cam_data.clip_end = 20.0
        if kind == "ORTHO":
            cam_data.ortho_scale = max(span, 1.25)
        else:
            cam_data.lens = 55
        path = os.path.join(out_dir, f"white-teal-chair-{view}.png")
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        paths.append(path)
    return paths
