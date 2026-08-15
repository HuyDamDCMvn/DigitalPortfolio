"""Blender Z-up mesh helpers for characters (no Three.js bloc())."""

from __future__ import annotations

import math

import bmesh
import bpy
from mathutils import Vector


def ensure_object_mode():
    if bpy.context.mode != "OBJECT" and bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode="OBJECT")


def link(obj):
    if obj.name not in bpy.context.collection.objects:
        bpy.context.collection.objects.link(obj)
    return obj


def assign_mat(obj, mat):
    if mat is None:
        return obj
    mesh = obj.data
    if mesh.materials:
        mesh.materials[0] = mat
    else:
        mesh.materials.append(mat)
    return obj


def shade_smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def _mesh_from_bm(name, bm, loc, mat):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    obj.location = loc
    shade_smooth(obj)
    assign_mat(obj, mat)
    return obj


def sphere(name, radius, loc, mat, segments=28):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=max(12, segments // 2), radius=radius)
    return _mesh_from_bm(name, bm, loc, mat)


def ellipsoid(name, rx, ry, rz, loc, mat, segments=28):
    obj = sphere(name, 1.0, loc, mat, segments=segments)
    obj.scale = (rx, ry, rz)
    return obj


def cylinder(name, radius, depth, loc, mat, vertices=28):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=vertices,
        radius1=radius,
        radius2=radius,
        depth=depth,
    )
    return _mesh_from_bm(name, bm, loc, mat)


def cube(name, size, loc, mat):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    obj = _mesh_from_bm(name, bm, loc, mat)
    obj.scale = size if isinstance(size, tuple) else (size, size, size)
    return obj


def cone(name, radius_top, radius_bottom, depth, loc, mat, vertices=20):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=vertices,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=depth,
    )
    return _mesh_from_bm(name, bm, loc, mat)


def torus(name, major, minor, loc, mat, major_seg=28, minor_seg=12):
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, segments=max(8, int(minor_seg)), radius=minor)
    bmesh.ops.translate(bm, verts=list(bm.verts), vec=(major, 0.0, 0.0))
    geom = list(bm.verts) + list(bm.edges)
    bmesh.ops.spin(
        bm,
        geom=geom,
        angle=math.pi * 2.0,
        steps=max(12, int(major_seg)),
        axis=(0.0, 0.0, 1.0),
        cent=(0.0, 0.0, 0.0),
    )
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
    return _mesh_from_bm(name, bm, loc, mat)


def round_box(name, size, loc, mat, radius=0.004, segments=3):
    w, d, h = size
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w
        v.co.y *= d
        v.co.z *= h
    r = min(radius, w / 2.4, d / 2.4, h / 2.4)
    if r > 1e-5:
        kwargs = dict(geom=list(bm.edges), offset=r, segments=max(1, int(segments)), profile=0.5, clamp_overlap=True)
        try:
            bmesh.ops.bevel(bm, offset_type="OFFSET", affect="EDGES", **kwargs)
        except TypeError:
            bmesh.ops.bevel(bm, **kwargs)
    return _mesh_from_bm(name, bm, loc, mat)


def aim_x(obj, direction):
    from mathutils import Vector

    delta = Vector(direction)
    if delta.length < 1e-8:
        return obj
    obj.rotation_euler = Vector((1.0, 0.0, 0.0)).rotation_difference(delta.normalized()).to_euler()
    return obj


def apply_transforms(obj, location=False, rotation=True, scale=True):
    ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=location, rotation=rotation, scale=scale)
    return obj


def apply_scale(obj):
    return apply_transforms(obj, location=False, rotation=True, scale=True)


def join_meshes(name, objs, mat=None):
    objs = [o for o in objs if o is not None]
    if not objs:
        raise ValueError("join_meshes needs objects")
    ensure_object_mode()
    for obj in objs:
        apply_scale(obj)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    root = bpy.context.view_layer.objects.active
    root.name = name
    if root.data:
        root.data.name = name
    if mat is not None:
        assign_mat(root, mat)
    return root


def voxel_remesh(obj, size=0.014):
    ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    mat = obj.data.materials[0] if obj.data.materials else None
    mesh = obj.data
    if hasattr(mesh, "remesh_voxel_size"):
        mesh.remesh_voxel_size = float(size)
        if hasattr(mesh, "use_remesh_fix_poles"):
            mesh.use_remesh_fix_poles = True
        try:
            bpy.ops.object.voxel_remesh()
            shade_smooth(obj)
            if mat is not None:
                assign_mat(obj, mat)
            return obj
        except Exception:
            pass
    mod = obj.modifiers.new("CharRemesh", "REMESH")
    mod.mode = "VOXEL"
    mod.voxel_size = float(size)
    try:
        bpy.ops.object.modifier_apply(modifier=mod.name)
    except Exception:
        obj.modifiers.remove(mod)
        return obj
    shade_smooth(obj)
    if mat is not None:
        assign_mat(obj, mat)
    return obj


def world_bounds(obj):
    xs, ys, zs = [], [], []
    mw = obj.matrix_world
    for vert in obj.data.vertices:
        co = mw @ vert.co
        xs.append(co.x)
        ys.append(co.y)
        zs.append(co.z)
    if not xs:
        return None
    return {
        "min": [min(xs), min(ys), min(zs)],
        "max": [max(xs), max(ys), max(zs)],
    }


def origin_to_world(obj, world_xyz):
    ensure_object_mode()
    bpy.context.view_layer.update()
    cursor = bpy.context.scene.cursor.location.copy()
    bpy.context.scene.cursor.location = Vector(world_xyz)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    bpy.context.scene.cursor.location = cursor
    return obj
