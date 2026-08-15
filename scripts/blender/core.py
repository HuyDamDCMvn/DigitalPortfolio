"""
Blender kit primitives — author in Three.js space (Y up, +Z forward).
Helpers convert to Blender Z-up so glTF export_yup yields the lab kit contract.
"""

from __future__ import annotations

import math
import os

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

CYL = 64
SPH = 48
BEVEL = 5
CAP_R = 16
TOR_MAJ = 48
TOR_MIN = 16

C_YUP_TO_ZUP = Matrix(
    (
        (1.0, 0.0, 0.0, 0.0),
        (0.0, 0.0, -1.0, 0.0),
        (0.0, 1.0, 0.0, 0.0),
        (0.0, 0.0, 0.0, 1.0),
    )
)


def bloc(x=0.0, y=0.0, z=0.0):
    return (x, -z, y)


def beul(rx=0.0, ry=0.0, rz=0.0):
    return (rx, -rz, ry)


def hex_color(hex_str):
    n = int(hex_str[1:], 16)
    return ((n >> 16) & 255) / 255.0, ((n >> 8) & 255) / 255.0, (n & 255) / 255.0


def make_material(
    name,
    color,
    roughness=0.42,
    metalness=0.06,
    emission=None,
    emission_strength=0.0,
    alpha=1.0,
    double_sided=False,
):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (-280, 0)
    out.location = (80, 0)
    r, g, b = hex_color(color)
    bsdf.inputs["Base Color"].default_value = (r, g, b, alpha)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metalness
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    if emission and emission_strength:
        er, eg, eb = hex_color(emission)
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (er, eg, eb, 1.0)
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = (er, eg, eb, 1.0)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    mat.use_backface_culling = not double_sided
    if alpha < 0.999:
        if hasattr(mat, "blend_method"):
            mat.blend_method = "BLEND"
        if hasattr(mat, "shadow_method"):
            try:
                mat.shadow_method = "NONE"
            except TypeError:
                pass
        if hasattr(mat, "surface_render_method"):
            try:
                mat.surface_render_method = "BLENDED"
            except TypeError:
                pass
    return mat


def make_materials():
    return {
        "white": make_material("White", "#f4f7fa", roughness=0.38),
        "whiteSoft": make_material("WhiteSoft", "#e8eef4", roughness=0.5),
        "skin": make_material("Skin", "#f0d4c2", roughness=0.48, metalness=0.0),
        "skinDeep": make_material("SkinDeep", "#d4a48c", roughness=0.52, metalness=0.0),
        "hair": make_material("Hair", "#2c241c", roughness=0.34, metalness=0.06),
        "brow": make_material("Brow", "#2c241c", roughness=0.38, metalness=0.04),
        "eyeWhite": make_material("EyeWhite", "#fbf8f4", roughness=0.12, metalness=0.04),
        "iris": make_material("Iris", "#3d5a73", roughness=0.22, metalness=0.06),
        "pupil": make_material("Pupil", "#121212", roughness=0.14, metalness=0.02),
        "spec": make_material("Spec", "#ffffff", roughness=0.06, metalness=0.04),
        "lash": make_material("Lash", "#1a1412", roughness=0.42, metalness=0.0),
        "lip": make_material("Lip", "#c49a92", roughness=0.48, metalness=0.0),
        "shoe": make_material("Shoe", "#1a2430", roughness=0.38, metalness=0.12),
        "sole": make_material("Sole", "#12161c", roughness=0.55, metalness=0.04),
        "trouser": make_material("Trouser", "#062553", roughness=0.5, metalness=0.08),
        "shirt": make_material("Shirt", "#ffffff", roughness=0.34, metalness=0.02),
        "navy": make_material("Navy", "#062553", roughness=0.48, metalness=0.12),
        "navyDeep": make_material("NavyDeep", "#031733", roughness=0.55),
        "charcoal": make_material("Charcoal", "#2a3340", roughness=0.4, metalness=0.22),
        "cyan": make_material(
            "Cyan",
            "#5fc7ec",
            roughness=0.32,
            metalness=0.18,
            emission="#0a3a52",
            emission_strength=0.22,
        ),
        "gold": make_material(
            "Gold",
            "#ffbd24",
            roughness=0.34,
            metalness=0.28,
            emission="#5a3a00",
            emission_strength=0.18,
        ),
        "glass": make_material(
            "Glass",
            "#d7f3ff",
            roughness=0.08,
            metalness=0.04,
            alpha=0.22,
            double_sided=True,
        ),
        "glow": make_material(
            "Glow",
            "#5fc7ec",
            roughness=0.25,
            metalness=0.05,
            emission="#5fc7ec",
            emission_strength=0.85,
            alpha=0.45,
            double_sided=True,
        ),
        "holo": make_material(
            "Holo",
            "#7ad4f5",
            roughness=0.18,
            metalness=0.05,
            emission="#5fc7ec",
            emission_strength=0.55,
            alpha=0.38,
            double_sided=True,
        ),
        "screen": make_material(
            "Screen",
            "#0a2a48",
            roughness=0.2,
            metalness=0.1,
            emission="#1a6a88",
            emission_strength=0.45,
        ),
        "paper": make_material("Paper", "#ffffff", roughness=0.32, metalness=0.02),
        "ice": make_material("Ice", "#7eb8e8", roughness=0.42, metalness=0.04),
        "iceDeep": make_material("IceDeep", "#4a90c4", roughness=0.4, metalness=0.06),
        "struct": make_material("Struct", "#8fa0b0", roughness=0.48, metalness=0.12),
        "mepGreen": make_material("MepGreen", "#6fbf73", roughness=0.4, metalness=0.08),
        "teal": make_material("Teal", "#1a5c6c", roughness=0.48, metalness=0.06),
        "leaf": make_material("Leaf", "#3f9a62", roughness=0.55, metalness=0.0),
        "leafDark": make_material("LeafDark", "#2c6f46", roughness=0.6, metalness=0.0),
        "soil": make_material("Soil", "#3a322c", roughness=0.72, metalness=0.0),
        "ink": make_material("Ink", "#1a1a1b", roughness=0.48, metalness=0.08),
        "pull": make_material("Pull", "#1a3a58", roughness=0.35, metalness=0.2),
        "mass": make_material("Massing", "#1a4a78", roughness=0.48, metalness=0.08),
        "key": make_material("Keycap", "#1c2836", roughness=0.36, metalness=0.08),
        "liquid": make_material(
            "Liquid",
            "#cfefff",
            roughness=0.12,
            metalness=0.0,
            alpha=0.55,
            double_sided=True,
        ),
    }


def reset_scene():
    if bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode="OBJECT")
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for arm in list(bpy.data.armatures):
        bpy.data.armatures.remove(arm)
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    for curve in list(bpy.data.curves):
        bpy.data.curves.remove(curve)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def _link(obj, parent):
    bpy.context.collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
        obj.matrix_parent_inverse = Matrix.Identity(4)


def add_empty(parent, name, x=0.0, y=0.0, z=0.0, rx=0.0, ry=0.0, rz=0.0, size=0.04):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_size = size
    obj.empty_display_type = "PLAIN_AXES"
    _link(obj, parent)
    obj.location = bloc(x, y, z)
    obj.rotation_euler = beul(rx, ry, rz)
    return obj


def _bm_to_obj(name, bm, parent, loc, rot, mat, smooth=True):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    if smooth:
        for poly in mesh.polygons:
            poly.use_smooth = True
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    _link(obj, parent)
    obj.location = loc
    obj.rotation_euler = rot
    if mat is not None:
        obj.data.materials.append(mat)
    return obj


def _bevel(bm, radius, segments=BEVEL):
    if radius <= 1e-6 or not bm.edges:
        return
    segs = max(1, int(segments))
    geom = list(bm.edges)
    kwargs = dict(geom=geom, offset=radius, segments=segs, profile=0.5, clamp_overlap=True)
    try:
        bmesh.ops.bevel(bm, offset_type="OFFSET", affect="EDGES", **kwargs)
    except TypeError:
        try:
            bmesh.ops.bevel(bm, offset_type="OFFSET", **kwargs)
        except TypeError:
            bmesh.ops.bevel(bm, geom=geom, offset=radius, segments=segs)


def add_round(
    parent,
    name,
    w,
    h,
    d,
    x=0.0,
    y=0.0,
    z=0.0,
    rx=0.0,
    ry=0.0,
    rz=0.0,
    radius=0.018,
    segments=BEVEL,
    mat=None,
):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w
        v.co.y *= d
        v.co.z *= h
    r = min(radius, w / 2.2, h / 2.2, d / 2.2)
    _bevel(bm, r, segments)
    return _bm_to_obj(name, bm, parent, bloc(x, y, z), beul(rx, ry, rz), mat)


def add_cylinder(
    parent,
    name,
    radius_top,
    radius_bottom,
    height,
    x=0.0,
    y=0.0,
    z=0.0,
    rx=0.0,
    ry=0.0,
    rz=0.0,
    radial=CYL,
    mat=None,
    cap=True,
):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=cap,
        cap_tris=False,
        segments=max(8, int(radial)),
        radius1=radius_bottom,
        radius2=radius_top,
        depth=height,
    )
    return _bm_to_obj(name, bm, parent, bloc(x, y, z), beul(rx, ry, rz), mat)


def add_sphere(parent, name, r, x=0.0, y=0.0, z=0.0, segments=SPH, mat=None):
    bm = bmesh.new()
    u = max(12, int(segments))
    v = max(8, u // 2)
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    return _bm_to_obj(name, bm, parent, bloc(x, y, z), beul(0, 0, 0), mat)


def add_capsule(
    parent,
    name,
    r,
    length,
    x=0.0,
    y=0.0,
    z=0.0,
    rx=0.0,
    ry=0.0,
    rz=0.0,
    hang=False,
    cap=CAP_R,
    radial=CYL,
    mat=None,
):
    if hang:
        y = y - (length / 2.0 + r)
    bm = bmesh.new()
    segs = max(12, int(radial))
    bmesh.ops.create_cone(
        bm,
        cap_ends=False,
        cap_tris=False,
        segments=segs,
        radius1=r,
        radius2=r,
        depth=length,
    )
    half = length / 2.0
    for pole in (1.0, -1.0):
        ret = bmesh.ops.create_uvsphere(
            bm,
            u_segments=segs,
            v_segments=max(6, int(cap)),
            radius=r,
            matrix=Matrix.Translation((0.0, 0.0, pole * half)),
        )
        kill = [v for v in ret["verts"] if pole * v.co.z < pole * half - 1e-6]
        if kill:
            bmesh.ops.delete(bm, geom=kill, context="VERTS")
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-4)
    return _bm_to_obj(name, bm, parent, bloc(x, y, z), beul(rx, ry, rz), mat)


def add_torus(
    parent,
    name,
    radius,
    tube,
    x=0.0,
    y=0.0,
    z=0.0,
    rx=0.0,
    ry=0.0,
    rz=0.0,
    radial=TOR_MAJ,
    tubular=TOR_MIN,
    mat=None,
    three_horizontal=True,
):
    """Three.js addTorus defaults rx=pi/2 (horizontal). Match that unless overridden."""
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, segments=max(8, int(tubular)), radius=tube)
    bmesh.ops.translate(bm, verts=list(bm.verts), vec=(radius, 0.0, 0.0))
    geom = list(bm.verts) + list(bm.edges)
    bmesh.ops.spin(
        bm,
        geom=geom,
        angle=math.pi * 2.0,
        steps=max(12, int(radial)),
        axis=(0.0, 0.0, 1.0),
        cent=(0.0, 0.0, 0.0),
    )
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
    use_rx = 0.0 if three_horizontal and abs(rx - math.pi / 2) < 1e-6 else rx
    if three_horizontal and abs(rx) < 1e-6:
        use_rx = -math.pi / 2
    return _bm_to_obj(name, bm, parent, bloc(x, y, z), beul(use_rx, ry, rz), mat)


def add_ngon(
    parent,
    name,
    radius,
    height,
    segments=8,
    x=0.0,
    y=0.0,
    z=0.0,
    ry=0.0,
    corner=0.08,
    mat=None,
    bevel_rim=0.008,
):
    bm = bmesh.new()
    segs = max(3, int(segments))
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=segs,
        radius1=radius,
        radius2=radius,
        depth=height,
    )
    bm.edges.ensure_lookup_table()
    vertical = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > height * 0.45]
    if vertical and corner > 0:
        try:
            bmesh.ops.bevel(
                bm,
                geom=vertical,
                offset=min(corner, radius * 0.35),
                segments=8,
                profile=0.7,
                offset_type="OFFSET",
                affect="EDGES",
                clamp_overlap=True,
            )
        except TypeError:
            bmesh.ops.bevel(bm, geom=vertical, offset=min(corner, radius * 0.35), segments=8)
    if bevel_rim > 0:
        _bevel(bm, bevel_rim, segments=3)
    return _bm_to_obj(name, bm, parent, bloc(x, y, z), beul(0, ry, 0), mat)


def add_hex(
    parent,
    name,
    radius,
    height,
    x=0.0,
    y=0.0,
    z=0.0,
    ry=math.pi / 6.0,
    corner=0.16,
    mat=None,
    bevel_rim=0.01,
):
    return add_ngon(
        parent,
        name,
        radius,
        height,
        segments=6,
        x=x,
        y=y,
        z=z,
        ry=ry,
        corner=corner,
        mat=mat,
        bevel_rim=bevel_rim,
    )


def add_oct(
    parent,
    name,
    radius,
    height,
    x=0.0,
    y=0.0,
    z=0.0,
    ry=math.pi / 8.0,
    corner=0.08,
    mat=None,
    bevel_rim=0.008,
):
    return add_ngon(
        parent,
        name,
        radius,
        height,
        segments=8,
        x=x,
        y=y,
        z=z,
        ry=ry,
        corner=corner,
        mat=mat,
        bevel_rim=bevel_rim,
    )


def add_tube(
    parent,
    name,
    radius_outer,
    radius_inner,
    height,
    x=0.0,
    y=0.0,
    z=0.0,
    rx=0.0,
    ry=0.0,
    rz=0.0,
    radial=CYL,
    mat=None,
):
    bm = bmesh.new()
    segs = max(16, int(radial))
    z0, z1 = -height / 2.0, height / 2.0

    def ring(rad, z):
        verts = []
        for i in range(segs):
            a = (i / segs) * math.pi * 2.0
            verts.append(bm.verts.new((math.cos(a) * rad, math.sin(a) * rad, z)))
        return verts

    o0, i0 = ring(radius_outer, z0), ring(radius_inner, z0)
    o1, i1 = ring(radius_outer, z1), ring(radius_inner, z1)
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((o0[i], o0[j], o1[j], o1[i]))
        bm.faces.new((i0[j], i0[i], i1[i], i1[j]))
        bm.faces.new((o0[j], o0[i], i0[i], i0[j]))
        bm.faces.new((o1[i], o1[j], i1[j], i1[i]))
    return _bm_to_obj(name, bm, parent, bloc(x, y, z), beul(rx, ry, rz), mat)


def add_ngon_ring(
    parent,
    name,
    radius_outer,
    radius_inner,
    height,
    segments=8,
    x=0.0,
    y=0.0,
    z=0.0,
    ry=0.0,
    corner=0.08,
    mat=None,
    bevel_rim=0.008,
):
    """Horizontal n-gon slab with a matching n-gon hole (tabletop well)."""
    bm = bmesh.new()
    segs = max(3, int(segments))
    outer = max(radius_inner + 0.01, float(radius_outer))
    inner = min(float(radius_inner), outer - 0.01)
    z0, z1 = -height / 2.0, height / 2.0

    def ring(rad, z):
        verts = []
        for i in range(segs):
            a = (i / segs) * math.pi * 2.0
            verts.append(bm.verts.new((math.cos(a) * rad, math.sin(a) * rad, z)))
        return verts

    o0, i0 = ring(outer, z0), ring(inner, z0)
    o1, i1 = ring(outer, z1), ring(inner, z1)
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((o0[i], o0[j], o1[j], o1[i]))
        bm.faces.new((i0[j], i0[i], i1[i], i1[j]))
        bm.faces.new((o0[j], o0[i], i0[i], i0[j]))
        bm.faces.new((o1[i], o1[j], i1[j], i1[i]))
    bm.edges.ensure_lookup_table()
    vertical = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > height * 0.45]
    if vertical and corner > 0:
        offset = min(corner, (outer - inner) * 0.35, outer * 0.25)
        try:
            bmesh.ops.bevel(
                bm,
                geom=vertical,
                offset=offset,
                segments=8,
                profile=0.7,
                offset_type="OFFSET",
                affect="EDGES",
                clamp_overlap=True,
            )
        except TypeError:
            bmesh.ops.bevel(bm, geom=vertical, offset=offset, segments=8)
    if bevel_rim > 0:
        _bevel(bm, bevel_rim, segments=3)
    return _bm_to_obj(name, bm, parent, bloc(x, y, z), beul(0, ry, 0), mat)


def add_oct_ring(
    parent,
    name,
    radius_outer,
    radius_inner,
    height,
    x=0.0,
    y=0.0,
    z=0.0,
    ry=math.pi / 8.0,
    corner=0.08,
    mat=None,
    bevel_rim=0.008,
):
    return add_ngon_ring(
        parent,
        name,
        radius_outer,
        radius_inner,
        height,
        segments=8,
        x=x,
        y=y,
        z=z,
        ry=ry,
        corner=corner,
        mat=mat,
        bevel_rim=bevel_rim,
    )


def flatten_world(obj):
    """Match Three.js flattenWorld: identity world rotation, keep world location."""
    bpy.context.view_layer.update()
    loc = obj.matrix_world.to_translation().copy()
    dest = Matrix.Translation(loc)
    if obj.parent is not None:
        obj.matrix_parent_inverse = obj.parent.matrix_world.inverted() @ dest
        obj.location = (0.0, 0.0, 0.0)
        obj.rotation_euler = (0.0, 0.0, 0.0)
        obj.scale = (1.0, 1.0, 1.0)
    else:
        obj.matrix_world = dest


def rotate_three(obj, rx=0.0, ry=0.0, rz=0.0):
    extra = Euler(beul(rx, ry, rz), "XYZ").to_matrix()
    current = obj.rotation_euler.to_matrix()
    obj.rotation_euler = (extra @ current).to_euler("XYZ")

def join_into(target, extras):
    extras = [e for e in extras if e is not None and e != target]
    if not extras:
        return target
    if bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    bpy.context.view_layer.objects.active = target
    for extra in extras:
        extra.select_set(True)
    bpy.ops.object.join()
    return target


def select_hierarchy(root):
    bpy.ops.object.select_all(action="DESELECT")

    def walk(obj):
        obj.select_set(True)
        for child in obj.children:
            walk(child)

    walk(root)
    bpy.context.view_layer.objects.active = root


def enable_gltf():
    try:
        bpy.ops.preferences.addon_enable(module="io_scene_gltf2")
    except Exception:
        pass


def _hierarchy_has_armature(root):
    stack = [root]
    while stack:
        obj = stack.pop()
        if obj.type == "ARMATURE":
            return True
        stack.extend(obj.children)
    return False


def export_glb(root, path):
    enable_gltf()
    bpy.context.view_layer.update()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    select_hierarchy(root)
    skinned = _hierarchy_has_armature(root)
    kwargs = dict(
        filepath=path,
        check_existing=False,
        export_format="GLB",
        use_selection=True,
        export_apply=not skinned,
        export_yup=True,
        export_cameras=False,
        export_extras=False,
        export_animations=skinned,
        export_skins=skinned,
        export_morph=False,
    )
    if skinned:
        try:
            bpy.ops.export_scene.gltf(
                **kwargs,
                export_animation_mode="NLA_TRACKS",
                export_anim_single_armature=True,
            )
        except TypeError:
            try:
                bpy.ops.export_scene.gltf(**kwargs, export_nla_strips=True)
            except TypeError:
                bpy.ops.export_scene.gltf(**kwargs)
    else:
        bpy.ops.export_scene.gltf(**kwargs)
    size = os.path.getsize(path)
    names = []

    def collect(obj):
        if obj.type == "MESH":
            names.append(obj.name)
        for child in obj.children:
            collect(child)

    collect(root)
    print(f"Wrote {path} ({size} bytes) meshes={len(names)}")
    return names
