"""MRI pial cortex for /lab/particles — Brainder Brain-for-Blender (CC BY-SA 3.0).

Joins Desikan-Killiany pial parcels plus cerebellum cortex and brainstem from
the same subject. Do not remesh or voronoi-displace: that destroys gyri.

Source archives (cached under .tmp-brain-meshes/):
  https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/smallfiles/pial_DK_obj.tar.bz2
  https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/smallfiles/subcortical_obj.tar.bz2

Author in metres after mm→m. Y-up export via export_glb. Origin at bounds centre.
"""

from __future__ import annotations

import glob
import os

import bmesh
import bpy
from mathutils import Vector

from core import add_empty

FILE = "particle-brain.glb"

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CACHE = os.path.join(REPO, ".tmp-brain-meshes")
PIAL_GLOB = os.path.join(CACHE, "pial_DK_obj", "**", "*.obj")
SUB_DIR = os.path.join(CACHE, "subcortical_obj")
SUB_NAMES = (
    "Left-Cerebellum-Cortex.obj",
    "Right-Cerebellum-Cortex.obj",
    "Brain-Stem.obj",
)
MM_TO_M = 0.001
TARGET_VERTS = 160_000


def _active(obj):
    view = bpy.context.view_layer
    for item in list(bpy.context.selected_objects):
        item.select_set(False)
    obj.select_set(True)
    view.objects.active = obj


def _parse_obj(path):
    verts = []
    faces = []
    with open(path, encoding="ascii", errors="ignore") as handle:
        for raw in handle:
            if raw.startswith("v "):
                parts = raw.split()
                verts.append((float(parts[1]), float(parts[2]), float(parts[3])))
            elif raw.startswith("f "):
                ids = [int(bit.split("/")[0]) - 1 for bit in raw.split()[1:]]
                if len(ids) == 3:
                    faces.append(ids)
                elif len(ids) > 3:
                    for i in range(1, len(ids) - 1):
                        faces.append([ids[0], ids[i], ids[i + 1]])
    return verts, faces


def _find_sub(name):
    matches = glob.glob(os.path.join(SUB_DIR, "**", name), recursive=True)
    return matches[0] if matches else None


def _load_mri_mesh():
    paths = sorted(glob.glob(PIAL_GLOB, recursive=True))
    for name in SUB_NAMES:
        found = _find_sub(name)
        if found:
            paths.append(found)
    if len(paths) < 40:
        raise FileNotFoundError(
            "MRI cortex OBJs missing. Download Brainder pial_DK_obj.tar.bz2 and "
            "subcortical_obj.tar.bz2 into .tmp-brain-meshes/ and extract them. "
            "See particle_brain.py header for URLs."
        )

    verts = []
    faces = []
    for path in paths:
        part_v, part_f = _parse_obj(path)
        base = len(verts)
        verts.extend(part_v)
        faces.extend((a + base, b + base, c + base) for a, b, c in part_f)
    return verts, faces, len(paths)


def build(mat):
    verts, faces, n_files = _load_mri_mesh()
    print(f"particle-brain: {n_files} objs, {len(verts)} verts, {len(faces)} faces")

    mesh = bpy.data.meshes.new("CortexMesh")
    mesh.from_pydata(verts, [], faces)
    mesh.validate(clean_customdata=True)
    mesh.update()

    brain = bpy.data.objects.new("Cortex", mesh)
    bpy.context.collection.objects.link(brain)
    charcoal = mat["charcoal"]
    if brain.data.materials:
        brain.data.materials[0] = charcoal
    else:
        brain.data.materials.append(charcoal)

    # FreeSurfer RAS mm → metres. Blender Z-up: X right, Y anterior, Z superior.
    brain.scale = (MM_TO_M, MM_TO_M, MM_TO_M)
    _active(brain)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.00012)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    degenerate = [f for f in bm.faces if f.calc_area() < 1e-12]
    if degenerate:
        bmesh.ops.delete(bm, geom=degenerate, context="FACES")
    bm.to_mesh(mesh)
    bm.free()

    if len(mesh.vertices) > TARGET_VERTS:
        ratio = max(0.32, TARGET_VERTS / float(len(mesh.vertices)))
        dec = brain.modifiers.new("WebDecimate", "DECIMATE")
        dec.decimate_type = "COLLAPSE"
        dec.ratio = ratio
        dec.use_collapse_triangulate = True
        _active(brain)
        bpy.ops.object.modifier_apply(modifier=dec.name)
        print(f"particle-brain: decimated ratio={ratio:.3f} → {len(mesh.vertices)} verts")

    _active(brain)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.delete_loose()
    bpy.ops.mesh.dissolve_degenerate()
    try:
        bpy.ops.mesh.fill_holes(sides=6)
    except Exception:
        pass
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    mesh.validate(clean_customdata=True)
    for poly in mesh.polygons:
        poly.use_smooth = True
    _active(brain)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=0.96, keep_sharp_edges=False)
    except TypeError:
        bpy.ops.object.shade_smooth()
    mesh.update()

    _active(brain)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    brain.location = (0.0, 0.0, 0.0)

    root = add_empty(None, "ParticleBrain")
    brain.parent = root
    return root
