#!/usr/bin/env python3
"""Masada Kitty (AR) — odanın üç 3B varlığını ilkel şekillerden üretir: Kitty, kale maketi, havalimanı tabelası.

Çıktı: assets/ar/{kitty,kale,tabela}.glb ve .usdz
  · birim metre, Y yukarı, ön yüz +Z, zemin y=0 (gerçek ölçek: Kitty ~15 cm, kale ~25 cm, tabela ~40 cm)
  · GLB: trimesh ile (Android Scene Viewer, three.js). USDZ: pxr ile UsdPreviewSurface + ARKit paketi (iPhone Quick Look).
  · Pastel Pop dili: düz pastel dolgular + koyu mürdüm dış çizgi ("ters kabuk": hafif şişirilmiş, ters çevrilmiş
    ikinci yüzey; arka yüz ayıklandığı için yalnız kenarda ince bir çizgi olarak görünür).
Kurulum:  pip install trimesh numpy pillow usd-core          (usd-core 26.8 ile denendi)
Denetim:  UsdUtils.ComplianceChecker(arkit=True). usd-core 26 bu sınıfı kaldırdı; ≤25.x tekerlekleri ise UsdPreviewSurface
          tanımlarını (usdShaders) içermediği için denetim yarıda kalıyor. Çözüm: usd-core 25.11'in saf Python dosyasını
          (pxr/UsdUtils/complianceChecker.py) bir yere kopyalayıp --checker ile vermek; 26.8'in Sdr tanımlarıyla tam çalışır:
            pip install --target /tmp/usd2511 --no-deps usd-core==25.11
            python3 tools/ar_model.py --checker /tmp/usd2511/pxr/UsdUtils/complianceChecker.py
Çalıştır: python3 tools/ar_model.py                 # üçü birden
          python3 tools/ar_model.py kitty tabela    # seçilenler
          python3 tools/ar_model.py --font Fredoka.ttf --cache /yol/önbellek
Tabela yazısı Fredoka ile çizilir: --font verilmezse Google Fonts'tan indirilip önbelleğe alınır, ağ yoksa DejaVu.
Önizleme PNG'leri (assets/ar/*.png) bu betikle değil, GLB'ler three.js ile çizilerek üretilir.
"""
import argparse
import math
import os
import re
import shutil
import sys
import tempfile
import urllib.request

# iOS'un USD okuyucusu için en uyumlu usdc sürümü (yeni usd-core varsayılanı daha yeni olabilir)
os.environ.setdefault('USD_WRITE_NEW_USDC_FILES_AS_VERSION', '0.8.0')

import numpy as np
import trimesh
from PIL import Image, ImageDraw, ImageFont
from pxr import Gf, Kind, Sdf, Usd, UsdGeom, UsdShade, UsdUtils, Vt
from trimesh.visual import TextureVisuals
from trimesh.visual.material import PBRMaterial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'ar')
INK = '#3A1F2D'  # --k4-ink
MAX_BYTES = 1.5 * 1024 * 1024


# ---------------------------------------------------------------- renk
def srgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def linear(h):
    c = srgb(h)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def mix(a, b, t):
    c = srgb(a) * (1 - t) + srgb(b) * t
    return '#' + ''.join(f'{round(x * 255):02X}' for x in c)


# ---------------------------------------------------------------- dönüşümler
def T(x=0.0, y=0.0, z=0.0):
    m = np.eye(4)
    m[:3, 3] = (x, y, z)
    return m


def _rot(axis, deg):
    return trimesh.transformations.rotation_matrix(math.radians(deg), axis)


def Rx(d):
    return _rot([1, 0, 0], d)


def Ry(d):
    return _rot([0, 1, 0], d)


def Rz(d):
    return _rot([0, 0, 1], d)


def S(x, y=None, z=None):
    return np.diag([x, x if y is None else y, x if z is None else z, 1.0])


def M(*ms):
    out = np.eye(4)
    for m in ms:
        out = out @ m
    return out


def facing(n, up=(0.0, 1.0, 0.0)):
    """+Z eksenini n yönüne çeviren, 'yukarı'yı mümkün olduğunca koruyan dönüşüm."""
    z = np.asarray(n, float)
    z = z / np.linalg.norm(z)
    x = np.cross(up, z)
    if np.linalg.norm(x) < 1e-6:
        x = np.cross((0.0, 0.0, 1.0), z)
    x /= np.linalg.norm(x)
    y = np.cross(z, x)
    m = np.eye(4)
    m[:3, 0], m[:3, 1], m[:3, 2] = x, y, z
    return m


# ---------------------------------------------------------------- geometri (yalnız numpy; scipy gerekmez)
class Geo:
    def __init__(self, V, F, src=None, Mh=None):
        self.V = np.asarray(V, float).reshape(-1, 3)
        self.F = np.asarray(F, np.int64).reshape(-1, 3)
        self.src = src  # düz (prizma) şekillerde dış çizgi kabuğu için 2B kaynak: (çokgen, kalınlık, merkez)
        self.Mh = np.eye(4) if Mh is None else Mh  # kaynağa uygulanan toplam dönüşüm

    @staticmethod
    def of(tm):
        return Geo(tm.vertices.copy(), tm.faces.copy())

    def copy(self):
        return Geo(self.V.copy(), self.F.copy(), self.src, self.Mh.copy())

    def tf(self, m):
        self.V = (np.c_[self.V, np.ones(len(self.V))] @ m.T)[:, :3]
        self.Mh = m @ self.Mh
        if np.linalg.det(m[:3, :3]) < 0:
            self.F = self.F[:, ::-1]
        return self

    def face_normals(self):
        a, b, c = (self.V[self.F[:, i]] for i in range(3))
        n = np.cross(b - a, c - a)
        ln = np.linalg.norm(n, axis=1)
        return n / np.where(ln > 0, ln, 1)[:, None], ln / 2

    def vertex_normals(self):
        fn, fa = self.face_normals()
        n = np.zeros_like(self.V)
        for i in range(3):
            np.add.at(n, self.F[:, i], fn * fa[:, None])
        ln = np.linalg.norm(n, axis=1)
        return n / np.where(ln > 0, ln, 1)[:, None]

    def volume(self):
        a, b, c = (self.V[self.F[:, i]] for i in range(3))
        return float(np.einsum('ij,ij->i', a, np.cross(b, c)).sum() / 6)

    def outward(self):
        if self.volume() < 0:
            self.F = self.F[:, ::-1]
        return self

    def ray(self, o, d):
        """En yakın kesişim: (nokta, yumuşak normal) ya da None."""
        o, d = np.asarray(o, float), np.asarray(d, float)
        d = d / np.linalg.norm(d)
        v0, v1, v2 = (self.V[self.F[:, i]] for i in range(3))
        e1, e2 = v1 - v0, v2 - v0
        p = np.cross(d, e2)
        det = np.einsum('ij,ij->i', e1, p)
        ok = np.abs(det) > 1e-14
        inv = np.where(ok, 1 / np.where(ok, det, 1), 0)
        tv = o - v0
        u = np.einsum('ij,ij->i', tv, p) * inv
        q = np.cross(tv, e1)
        v = (q @ d) * inv
        t = np.einsum('ij,ij->i', e2, q) * inv
        hit = ok & (u >= 0) & (v >= 0) & (u + v <= 1) & (t > 1e-9)
        if not hit.any():
            return None
        i = np.where(hit)[0][np.argmin(t[hit])]
        vn = self.vertex_normals()
        f = self.F[i]
        n = vn[f[0]] * (1 - u[i] - v[i]) + vn[f[1]] * u[i] + vn[f[2]] * v[i]
        return o + d * t[i], n / np.linalg.norm(n)


def split_normals(g, angle):
    """Açısı 'angle' dereceden keskin kenarlarda köşeleri ayırır: küre yumuşak, kutu düz görünür."""
    fn, fa = g.face_normals()
    cv = g.F.ravel()
    cf = np.repeat(np.arange(len(g.F)), 3)
    order = np.argsort(cv, kind='stable')
    sf = cf[order]
    counts = np.bincount(cv, minlength=len(g.V))
    starts = np.concatenate([[0], np.cumsum(counts)[:-1]])
    k = counts[cv]
    rep = np.repeat(np.arange(len(cv)), k)
    offs = np.arange(len(rep)) - np.repeat(np.cumsum(k) - k, k)
    nb = sf[starts[cv[rep]] + offs]
    ok = np.einsum('ij,ij->i', fn[cf[rep]], fn[nb]) >= math.cos(math.radians(angle)) - 1e-9
    N = np.zeros((len(cv), 3))
    np.add.at(N, rep[ok], fn[nb[ok]] * fa[nb[ok]][:, None])
    ln = np.linalg.norm(N, axis=1)
    N = np.where(ln[:, None] > 0, N / np.where(ln > 0, ln, 1)[:, None], fn[cf])
    key = np.c_[cv, np.round(N * 2000).astype(np.int64)]
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    return g.V[cv[first]], inv.reshape(-1, 3), N[first]


def shell(g, t):
    """Dış çizgi için ters kabuk: köşeler normal boyunca t kadar şişirilir, yüzler ters çevrilir."""
    if g.src is not None:  # prizma: çokgeni yelpaze merkezine göre büyüt (kalbin içbükey çentiğinde de bozulmaz)
        P, depth, c = g.src
        k = 1 + t / float(np.median(np.linalg.norm(P - np.asarray(c), axis=1)))
        h = prism(np.asarray(c) + (P - np.asarray(c)) * k, depth + 2 * t, c).tf(g.Mh)
        h.F = h.F[:, ::-1]
        return h
    s = g.copy()
    vn = s.vertex_normals()
    fn, _ = s.face_normals()
    # keskin köşelerde yüzler tam t kadar dışarı çıksın diye uzaklığı açıya göre büyüt
    k = np.ones(len(s.V))
    for i in range(3):
        np.minimum.at(k, s.F[:, i], np.einsum('ij,ij->i', vn[s.F[:, i]], fn))
    s.V = s.V + vn * (t / np.clip(k, 0.45, 1.0))[:, None]
    s.F = s.F[:, ::-1]
    return s


# ---------------------------------------------------------------- ilkel şekiller
def sphere(sub=3):
    return Geo.of(trimesh.creation.icosphere(subdivisions=sub, radius=1.0))


def ellipsoid(c, r, sub=3, rot=None):
    return sphere(sub).tf(M(T(*c), np.eye(4) if rot is None else rot, S(*r)))


def box(ext, m=None):
    g = Geo.of(trimesh.creation.box(extents=ext))
    return g.tf(m) if m is not None else g


def cyl(p0, p1, r, sec=28):
    return Geo.of(trimesh.creation.cylinder(radius=r, segment=[p0, p1], sections=sec))


def capsule(p0, p1, r, count=(18, 18)):
    p0, p1 = np.asarray(p0, float), np.asarray(p1, float)
    L = np.linalg.norm(p1 - p0)
    g = Geo.of(trimesh.creation.capsule(height=L, radius=r, count=list(count)))
    return g.tf(M(T(*(p0 + p1) / 2), facing(p1 - p0, up=(0, 0, 1) if abs((p1 - p0)[1]) > 0.9 * L else (0, 1, 0))))


def lathe(profile, sec=40, loop=False):
    """(r, y) profilini Y ekseni etrafında döndürür. r=0 uçlar kutup olur; loop=True halka (simit) yapar."""
    ang = np.linspace(0, 2 * np.pi, sec, endpoint=False)
    V, rings = [], []
    for r, y in profile:
        if r <= 1e-9:
            rings.append([len(V)])
            V.append([0.0, y, 0.0])
        else:
            rings.append(list(range(len(V), len(V) + sec)))
            V += [[r * math.sin(a), y, r * math.cos(a)] for a in ang]
    pairs = list(zip(rings[:-1], rings[1:])) + ([(rings[-1], rings[0])] if loop else [])
    F = []
    for a, b in pairs:
        for i in range(sec):
            j = (i + 1) % sec
            if len(a) == 1 and len(b) > 1:
                F.append([a[0], b[j], b[i]])
            elif len(b) == 1 and len(a) > 1:
                F.append([a[i], a[j], b[0]])
            elif len(a) > 1:
                F += [[a[i], a[j], b[j]], [a[i], b[j], b[i]]]
    return Geo(V, F).outward()


def torus(R, r, sec=40, tube=12):
    prof = [(R + r * math.cos(a), r * math.sin(a)) for a in np.linspace(0, 2 * np.pi, tube, endpoint=False)]
    return lathe(prof, sec, loop=True)


def prism(poly, depth, center=(0.0, 0.0)):
    """XY düzlemindeki çokgeni z'de ±depth/2 kalınlıkla çıkarır (center'dan yelpaze üçgenleme; şekil oradan 'görünür' olmalı)."""
    P = np.asarray(poly, float)
    n = len(P)
    h = depth / 2
    V = np.vstack([np.c_[P, np.full(n, h)], np.c_[P, np.full(n, -h)], [[center[0], center[1], h], [center[0], center[1], -h]]])
    cf, cb = 2 * n, 2 * n + 1
    F = []
    for i in range(n):
        j = (i + 1) % n
        F += [[cf, i, j], [cb, n + j, n + i], [i, n + i, n + j], [i, n + j, j]]
    src = (P if _area2(P) > 0 else P[::-1], depth, tuple(center))  # kaynak hep saat yönünün tersine
    return Geo(V, F, src=src).outward()  # saat yönündeki çokgende hepsi tersse düzelir


def _area2(P):
    return float(np.sum(P[:, 0] * np.roll(P[:, 1], -1) - np.roll(P[:, 0], -1) * P[:, 1]))


def heart_outline(width, n=72):
    t = np.linspace(0, 2 * np.pi, n, endpoint=False)
    x = 16 * np.sin(t) ** 3
    y = 13 * np.cos(t) - 5 * np.cos(2 * t) - 2 * np.cos(3 * t) - np.cos(4 * t)
    y = y - (y.max() + y.min()) / 2
    k = width / 32
    return np.c_[x * k, y * k][::-1], (0.0, -2.0 * k)


def heart(width, depth):
    pts, c = heart_outline(width)
    return prism(pts, depth, c)


# ---------------------------------------------------------------- model
MATS = {
    'beyaz': ('#FFFFFF', 0.62), 'pembe': ('#FF8FB8', 0.58), 'kirmizi': ('#E3174D', 0.42), 'sari': ('#FFD34E', 0.45),
    'murekkep': ('#2B2024', 0.3), 'cizgi': (INK, 0.95), 'allik': ('#FFB3CB', 0.8),
}


class Model:
    def __init__(self, name, outline):
        self.name, self.t = name, outline
        self.parts, self.hulls, self.mats, self.tex = {}, [], {}, None

    def mat(self, key, color, rough=0.6):
        self.mats[key] = (color, rough)
        return key

    def add(self, g, mat, outline=False, angle=60):
        if mat in MATS and mat not in self.mats:
            self.mats[mat] = MATS[mat]
        if outline:
            self.hulls.append(shell(g, self.t if outline is True else outline))
        self.parts.setdefault(mat, []).append((g, angle))
        return g

    def merge(self, other, m):
        """Başka bir modelin parçalarını m dönüşümüyle ekler (küçük figürleri ölçekleyip yerleştirmek için)."""
        for k, v in other.mats.items():
            self.mats.setdefault(k, v)
        for mat, items in other.parts.items():
            self.parts.setdefault(mat, []).extend((g.copy().tf(m), a) for g, a in items)
        self.hulls.extend(h.copy().tf(m) for h in other.hulls)

    def add_textured(self, V, F, uv, image, mat='yuz'):
        self.tex = (np.asarray(V, float), np.asarray(F, np.int64), np.asarray(uv, float), image, mat)
        self.mats[mat] = ('#FFFFFF', 0.7)

    def build(self):
        """Malzeme başına tek ağ: [(ad, malzeme, V, F, N, uv|None)] — y=0 zemin, x/z ortalı."""
        out = []
        groups = list(self.parts.items())
        if self.hulls:
            self.mats.setdefault('cizgi', MATS['cizgi'])
            groups.append(('cizgi', [(h, 180) for h in self.hulls]))
        for mat, items in groups:
            Vs, Fs, Ns, off = [], [], [], 0
            for g, angle in items:
                v, f, n = split_normals(g, angle)
                Vs.append(v)
                Fs.append(f + off)
                Ns.append(n)
                off += len(v)
            out.append([mat, mat, np.vstack(Vs), np.vstack(Fs), np.vstack(Ns), None])
        if self.tex:
            V, F, uv, _, mat = self.tex
            fn = Geo(V, F).face_normals()[0][0]
            out.append([mat, mat, V, F, np.tile(fn, (len(V), 1)), uv])
        allv = np.vstack([o[2] for o in out])
        lo, hi = allv.min(0), allv.max(0)
        shift = np.array([-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2])
        for o in out:
            o[2] = o[2] + shift
        return out


# ---------------------------------------------------------------- dışa aktarım
def ident(s):
    return re.sub(r'[^A-Za-z0-9_]', '_', s)


def export_glb(model, meshes, path):
    sc = trimesh.Scene()
    exact = {}
    for name, mat, V, F, N, uv in meshes:
        color, rough = model.mats[mat]
        kw = dict(name=ident(mat), baseColorFactor=[*linear(color), 1.0], metallicFactor=0.0, roughnessFactor=rough)
        if uv is not None:
            kw['baseColorTexture'] = model.tex[3]
            kw['baseColorFactor'] = [1.0, 1.0, 1.0, 1.0]
        exact[ident(mat)] = [float(x) for x in kw['baseColorFactor']]
        tm = trimesh.Trimesh(V.astype(np.float32), F, vertex_normals=N.astype(np.float32), process=False)
        tm.visual = TextureVisuals(uv=uv, material=PBRMaterial(**kw))
        sc.add_geometry(tm, node_name=ident(name), geom_name=ident(name))

    def post(tree):
        # trimesh renk çarpanını 8 bite yuvarlıyor; doğrusal (linear) değerleri olduğu gibi geri yaz
        for m in tree.get('materials', []):
            if m.get('name') in exact:
                m.setdefault('pbrMetallicRoughness', {})['baseColorFactor'] = exact[m['name']]
        tree.setdefault('asset', {})['generator'] = 'Eln\'in Krallığı · tools/ar_model.py (trimesh)'

    data = trimesh.exchange.gltf.export_glb(sc, include_normals=True, tree_postprocessor=post)
    with open(path, 'wb') as f:
        f.write(data)


def export_usdz(model, meshes, path, work):
    name = ident(model.name)
    usdc = os.path.join(work, name.lower() + '.usdc')
    stage = Usd.Stage.CreateNew(usdc)
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
    UsdGeom.SetStageMetersPerUnit(stage, 1.0)
    root = UsdGeom.Xform.Define(stage, f'/{name}')
    stage.SetDefaultPrim(root.GetPrim())
    Usd.ModelAPI(root.GetPrim()).SetKind(Kind.Tokens.component)
    stage.SetMetadata('comment', 'Eln\'in Krallığı · Masada Kitty (AR) · tools/ar_model.py')
    UsdGeom.Scope.Define(stage, f'/{name}/Malzemeler')
    UsdGeom.Scope.Define(stage, f'/{name}/Govde')
    usd_mats = {}
    for key, (color, rough) in model.mats.items():
        mp = f'/{name}/Malzemeler/{ident(key)}'
        mat = UsdShade.Material.Define(stage, mp)
        pbr = UsdShade.Shader.Define(stage, mp + '/Yuzey')
        pbr.CreateIdAttr('UsdPreviewSurface')
        pbr.CreateInput('roughness', Sdf.ValueTypeNames.Float).Set(float(rough))
        pbr.CreateInput('metallic', Sdf.ValueTypeNames.Float).Set(0.0)
        if model.tex and key == model.tex[4]:
            os.makedirs(os.path.join(work, 'dokular'), exist_ok=True)
            rel = f'dokular/{name.lower()}.png'
            model.tex[3].save(os.path.join(work, rel), optimize=True)
            st = UsdShade.Shader.Define(stage, mp + '/StOkuyucu')
            st.CreateIdAttr('UsdPrimvarReader_float2')
            st.CreateInput('varname', Sdf.ValueTypeNames.String).Set('st')
            st_out = st.CreateOutput('result', Sdf.ValueTypeNames.Float2)
            tx = UsdShade.Shader.Define(stage, mp + '/Doku')
            tx.CreateIdAttr('UsdUVTexture')
            tx.CreateInput('file', Sdf.ValueTypeNames.Asset).Set(Sdf.AssetPath(rel))
            tx.CreateInput('st', Sdf.ValueTypeNames.Float2).ConnectToSource(st_out)
            tx.CreateInput('sourceColorSpace', Sdf.ValueTypeNames.Token).Set('sRGB')
            tx.CreateInput('wrapS', Sdf.ValueTypeNames.Token).Set('clamp')
            tx.CreateInput('wrapT', Sdf.ValueTypeNames.Token).Set('clamp')
            rgb = tx.CreateOutput('rgb', Sdf.ValueTypeNames.Float3)
            pbr.CreateInput('diffuseColor', Sdf.ValueTypeNames.Color3f).ConnectToSource(rgb)
        else:
            pbr.CreateInput('diffuseColor', Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(*map(float, linear(color))))
        surf = pbr.CreateOutput('surface', Sdf.ValueTypeNames.Token)
        mat.CreateSurfaceOutput().ConnectToSource(surf)
        usd_mats[key] = mat
    for mname, key, V, F, N, uv in meshes:
        mesh = UsdGeom.Mesh.Define(stage, f'/{name}/Govde/{ident(mname)}')
        P = V.astype(np.float32)
        mesh.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(P))
        mesh.CreateFaceVertexCountsAttr(Vt.IntArray.FromNumpy(np.full(len(F), 3, np.int32)))
        mesh.CreateFaceVertexIndicesAttr(Vt.IntArray.FromNumpy(F.astype(np.int32).ravel()))
        mesh.CreateNormalsAttr(Vt.Vec3fArray.FromNumpy(N.astype(np.float32)))
        mesh.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
        mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
        mesh.CreateDoubleSidedAttr(False)
        mesh.CreateExtentAttr(Vt.Vec3fArray([Gf.Vec3f(*map(float, P.min(0))), Gf.Vec3f(*map(float, P.max(0)))]))
        if uv is not None:
            pv = UsdGeom.PrimvarsAPI(mesh).CreatePrimvar('st', Sdf.ValueTypeNames.TexCoord2fArray, UsdGeom.Tokens.vertex)
            pv.Set(Vt.Vec2fArray.FromNumpy(uv.astype(np.float32)))
        UsdShade.MaterialBindingAPI.Apply(mesh.GetPrim()).Bind(usd_mats[key])
    stage.GetRootLayer().Save()
    if os.path.exists(path):
        os.remove(path)
    ok = UsdUtils.CreateNewARKitUsdzPackage(Sdf.AssetPath(usdc), path)
    if not ok:
        raise SystemExit(f'USDZ paketlenemedi: {path}')


def checker_class(path=None):
    CC = getattr(UsdUtils, 'ComplianceChecker', None)
    if CC is None and path:
        import importlib.util
        spec = importlib.util.spec_from_file_location('complianceChecker', path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        CC = mod.ComplianceChecker
    return CC


def check(path, checker=None):
    CC = checker_class(checker)
    if CC is None:
        print('    ComplianceChecker yok (usd-core 26+): denetim atlandı; --checker ile ver (betiğin başındaki nota bak)')
        return None
    c = CC(arkit=True, skipARKitRootLayerCheck=False, rootPackageOnly=False, skipVariants=False, verbose=False)
    c.CheckCompliance(path)
    errs, warns, failed = c.GetErrors(), c.GetWarnings(), c.GetFailedChecks()
    print(f'    ComplianceChecker(arkit=True): {len(errs)} hata, {len(warns)} uyarı, {len(failed)} başarısız kural')
    for m in errs + warns + failed:
        print('      -', m)
    return not (errs or warns or failed)


# ================================================================ 1) KITTY (~15 cm)
def kitty():
    md = Model('Kitty', outline=0.0012)
    cy = 0.098  # baş merkezi
    # Baş: basık yumurta (alt yarısı yanaklarda biraz daha geniş)
    g = sphere(4)
    y = g.V[:, 1].copy()
    g.V[:, 0] *= 0.056 * (1 - 0.06 * y)
    g.V[:, 2] *= 0.046 * (1 - 0.03 * y)
    g.V[:, 1] = y * 0.042 + cy
    head = md.add(g, 'beyaz', outline=True, angle=180)
    # Kulaklar: yuvarlak uçlu, öne-arkaya basık koniler; dışa doğru eğik
    for sx in (-1, 1):
        ear = lathe([(0, 0), (0.0195, 0), (0.019, 0.008), (0.0155, 0.018), (0.0105, 0.026), (0.0062, 0.0305),
                     (0.003, 0.0328), (0, 0.0335)], 36)
        ear.tf(M(T(sx * 0.0265, cy + 0.019, -0.004), Rz(-sx * 24), S(1, 1.12, 0.62)))
        md.add(ear, 'beyaz', outline=True, angle=180)
    front = lambda x, yy, gg=head: gg.ray((x, yy, 0.5), (0, 0, -1))  # noqa: E731
    # Gözler: siyah ovaller + ışık
    for sx in (-1, 1):
        p, n = front(sx * 0.0235, cy - 0.002)
        R = facing(n)
        md.add(ellipsoid(p - n * 0.0004, (0.0047, 0.0068, 0.0022), 3, R), 'murekkep')
        hl = p + (R[:3, :3] @ np.array([-0.0014, 0.0028, 0.0])) + n * 0.0017
        md.add(ellipsoid(hl, (0.0014, 0.0014, 0.0007), 2, R), 'beyaz')
    # Burun (sarı) ve allıklar
    p, n = front(0.0, cy - 0.012)
    md.add(ellipsoid(p, (0.0058, 0.0042, 0.0032), 3, facing(n)), 'sari', outline=0.0008)
    for sx in (-1, 1):
        p, n = front(sx * 0.0345, cy - 0.016)
        md.add(ellipsoid(p - n * 0.0006, (0.0085, 0.005, 0.0012), 2, facing(n)), 'allik')
    # Bıyıklar: her yanda üç ince silindir, yanaktan başın dışına doğru yelpaze
    for sx in (-1, 1):
        for y0, y1 in ((0.004, 0.009), (-0.006, -0.006), (-0.016, -0.021)):
            p, n = front(sx * 0.037, cy + y0)
            a = p + n * 0.0012
            b = np.array([sx * 0.064, cy + y1, a[2] * 0.48])
            md.add(cyl(a, b, 0.00085, 10), 'murekkep')
    # Fiyonk: sol kulağın yanında (izleyicinin sağı, +X), kırmızı + beyaz puantiye
    bow = []
    for sx in (-1, 1):
        lobe = ellipsoid((0, 0, 0), (0.0128, 0.0105, 0.0062), 3).tf(M(T(sx * 0.0126, 0.0008, 0), Rz(sx * 12)))
        bow.append((lobe, 'kirmizi', True))
        for dx, dy, r in ((-40, -12, 3.4), (-28, -17, 3), (-17, -7, 2.6), (-39, 3, 3), (-27, 1, 3.2)):
            s = 0.000492
            hit = lobe.ray((sx * -dx * s, -(dy + 9) * s + 0.0008, 0.1), (0, 0, -1))
            if hit:
                q, nn = hit
                bow.append((ellipsoid(q, (r * s, r * s, r * s * 0.35), 1, facing(nn)), 'beyaz', False))
    bow.append((ellipsoid((0, 0, 0.0018), (0.0066, 0.0062, 0.0056), 3), 'kirmizi', True))
    Tb = M(T(0.0315, cy + 0.0345, 0.0165), Rz(14), Rx(-18), S(0.9))
    for gg, mat, ol in bow:
        md.add(gg.tf(Tb), mat, outline=ol, angle=180)
    # Gövde: küçük pembe elbise (çan), etekte beyaz fırfır, göğüste kırmızı kalp
    dress = lathe([(0, 0.0016), (0.029, 0.0016), (0.0335, 0.003), (0.035, 0.007), (0.0335, 0.014), (0.0285, 0.026),
                   (0.0225, 0.039), (0.018, 0.05), (0.0155, 0.059), (0, 0.064)], 48)
    md.add(dress, 'pembe', outline=True, angle=55)
    md.add(torus(0.0338, 0.0024, 48, 10).tf(T(0, 0.0055, 0)), 'beyaz', outline=0.0008, angle=180)
    p, n = dress.ray((0, 0.03, 0.5), (0, 0, -1))
    md.add(heart(0.0135, 0.003).tf(M(T(*(p + n * 0.0008)), facing(n))), 'kirmizi', outline=0.0007, angle=40)
    # Kollar ve ayaklar
    for sx in (-1, 1):
        md.add(capsule((sx * 0.016, 0.049, 0.003), (sx * 0.0335, 0.0315, 0.0125), 0.0074), 'beyaz', outline=True, angle=180)
        md.add(ellipsoid((sx * 0.0145, 0.0068, 0.026), (0.0118, 0.0068, 0.0165), 3), 'beyaz', outline=True, angle=180)
    return md


# ================================================================ 2) KALE MAKETİ (~25 cm)
# Ana salondaki kale haritasının (js/core/app.js castleMap) yedi kanadı; her kule bir kanat, pastel tonlarda.
WINGS = [
    ('sahip', '#FFB8D2'),   # pembe
    ('mevsim', '#CDBBFF'),  # leylak
    ('zaman', '#EBCB9E'),   # kum
    ('anilar', '#E99AB8'),  # gül
    ('kalp', '#FF7A8A'),    # (pastel) kırmızı
    ('oyun', '#9FE5C4'),    # nane
    ('hazine', '#FFD873'),  # altın
]


def merlon_ring(md, c, y, R, n, size, mat, rot0=0.0):
    for k in range(n):
        a = rot0 + 2 * math.pi * k / n
        m = M(T(c[0] + R * math.sin(a), y + size[1] / 2, c[2] + R * math.cos(a)), Ry(math.degrees(a)))
        md.add(box(size, m), mat, outline=True, angle=30)


def arch(md, x, y, z, w, h, d, n=(0, 0, 1), mat='murekkep'):
    """Kemerli pencere/kapı: dikdörtgen + yarım daire üst, n yönüne bakar; (x,y,z) alt orta nokta."""
    R = facing(n)
    body = box((w, h - w / 2, d), M(T(x, y, z), R, T(0, (h - w / 2) / 2, 0)))
    top = Geo.of(trimesh.creation.cylinder(radius=w / 2, height=d, sections=20)).tf(M(T(x, y, z), R, T(0, h - w / 2, 0)))
    md.add(body, mat, angle=30)
    md.add(top, mat, angle=30)


def wall(md, a, b, h, th, y0, mat, skip=()):
    a, b = np.asarray(a, float), np.asarray(b, float)
    d = b - a
    L = np.linalg.norm(d)
    ang = math.degrees(math.atan2(d[0], d[2]))
    mid = (a + b) / 2
    md.add(box((th, h, L), M(T(mid[0], y0 + h / 2, mid[2]), Ry(ang))), mat, outline=True, angle=30)
    n = int(L / 0.0105)
    for k in range(n + 1):
        p = a + d * (k / max(n, 1))
        if any(np.linalg.norm(p[[0, 2]] - np.asarray(s[0])) < s[1] for s in skip):
            continue
        md.add(box((th + 0.001, 0.0055, 0.0056), M(T(p[0], y0 + h + 0.00275, p[2]), Ry(ang))), mat, outline=True, angle=30)


def kale():
    md = Model('Kale', outline=0.0011)
    md.mat('cimen', '#BDEBD3', 0.85)
    md.mat('sur', '#FFF4F8', 0.75)
    md.mat('yol', '#FFE9B8', 0.85)
    md.mat('direk', INK, 0.5)
    base_top = 0.008
    # Zemin: elips, nane çimen
    md.add(cyl((0, 0, 0), (0, base_top, 0), 1.0, 64).tf(M(T(0, 0, -0.016), S(0.124, 1, 0.074))), 'cimen', outline=True, angle=40)
    heights = [150, 176, 202, 228, 232, 176, 150]  # castleMap: ortası en uzun, kalp kanadı +30
    r = 0.0135
    pos = []
    for i, ((wid, col), th) in enumerate(zip(WINGS, heights)):
        phi = math.radians(200 - i * 220 / 6)
        x, z = 0.103 * math.cos(phi), -0.014 - 0.058 * math.sin(phi)
        pos.append((x, z))
        h = 0.036 + (th - 150) / 82 * 0.04
        top = base_top + h
        body_c = md.mat(f'kule_{wid}', mix('#FFFFFF', col, 0.32), 0.7)
        roof_c = md.mat(f'cati_{wid}', col, 0.55)
        md.add(cyl((x, base_top - 0.001, z), (x, top, z), r, 36), body_c, outline=True, angle=40)
        md.add(cyl((x, top, z), (x, top + 0.007, z), r * 1.22, 36), body_c, outline=True, angle=40)
        merlon_ring(md, (x, 0, z), top + 0.007, r * 1.08, 8, (0.0056, 0.0055, 0.004), body_c)
        rh = r * 2.5
        roof = lathe([(0, 0), (r * 1.02, 0), (r * 0.62, rh * 0.32), (r * 0.3, rh * 0.68), (r * 0.08, rh * 0.95), (0, rh)], 36)
        md.add(roof.tf(T(x, top + 0.007, z)), roof_c, outline=True, angle=50)
        tip = top + 0.007 + rh
        md.add(ellipsoid((x, tip + 0.0012, z), (0.0022, 0.0022, 0.0022), 2), 'sari', outline=0.0007)
        md.add(cyl((x, tip, z), (x, tip + 0.02, z), 0.0007, 10), 'direk')
        if wid == 'kalp':
            fl = heart(0.016, 0.0016).tf(M(T(x + 0.0088, tip + 0.0145, z), Rz(-8)))
        else:
            fl = prism([(0, 0), (0.016, -0.004), (0, -0.0085)], 0.0016, (0.005, -0.004)).tf(T(x, tip + 0.0198, z))
        md.add(fl, roof_c if wid != 'kalp' else 'kirmizi', outline=0.0007, angle=40)
        # Ön yüz (+Z): haritadaki beyaz madalyon, altında kemerli pencereler ve kapı
        zf = z + r
        md.add(cyl((x, top - 0.012, zf - 0.001), (x, top - 0.012, zf + 0.0012), 0.0052, 24), 'beyaz', outline=0.0007, angle=40)
        md.add(heart(0.0052, 0.0012).tf(T(x, top - 0.0122, zf + 0.0016)), roof_c, angle=40)
        wy = top - 0.03
        while wy > base_top + 0.026:
            arch(md, x, wy, zf - 0.0004, 0.0048, 0.0075, 0.0022)
            wy -= 0.015
        arch(md, x, base_top, zf - 0.0004, 0.0075, 0.011, 0.0024)
        if i not in (0, 6):  # arkadan bakınca da pencere
            out = np.array([x, 0, z - (-0.014)])
            out /= np.linalg.norm(out)
            arch(md, x + out[0] * (r - 0.0004), top - 0.022, z + out[2] * (r - 0.0004), 0.0048, 0.0075, 0.0022, out)
    # Surlar: kuleleri çevreleyen duvar, önde ortada kapı kulesi
    y0 = base_top - 0.0005
    towers = [((x, z), r + 0.003) for x, z in pos]
    for i in range(6):
        a, b = pos[i], pos[i + 1]
        wall(md, (a[0], 0, a[1]), (b[0], 0, b[1]), 0.024, 0.0075, y0, 'sur', towers)
    zf = pos[0][1]
    gate_w, gate_h, gate_d = 0.046, 0.04, 0.018
    for xa, xb in ((pos[0][0], -gate_w / 2), (gate_w / 2, pos[6][0])):
        wall(md, (xa, 0, zf), (xb, 0, zf), 0.024, 0.0075, y0, 'sur', towers + [((0, zf), gate_w / 2 + 0.004)])
    md.add(box((gate_w, gate_h, gate_d), T(0, y0 + gate_h / 2, zf)), 'sur', outline=True, angle=30)
    for k in range(4):
        gx = -gate_w / 2 + 0.0045 + k * (gate_w - 0.009) / 3
        md.add(box((0.0075, 0.0065, gate_d + 0.001), T(gx, y0 + gate_h + 0.00325, zf)), 'sur', outline=True, angle=30)
    gz = zf + gate_d / 2
    arch(md, 0, base_top, gz - 0.0006, 0.017, 0.024, 0.0024)
    md.add(heart(0.0125, 0.003).tf(T(0, base_top + 0.031, gz + 0.0012)), 'kirmizi', outline=0.0008, angle=40)
    for sx in (-1, 1):  # kapının iki yanında küçük flamalar
        md.add(prism([(0, 0), (0.007, 0), (0.0035, -0.008)], 0.0012, (0.0035, -0.003)).tf(T(sx * 0.0145 - 0.0035, base_top + 0.036, gz + 0.0008)),
               'pembe', outline=0.0006, angle=40)
    # Kapıdan zeminin önüne uzanan yol
    md.add(box((0.02, 0.0012, 0.04), T(0, base_top + 0.0006, gz + 0.02)), 'yol', outline=0.0006, angle=30)
    return md


# ================================================================ 3) HAVALİMANI TABELASI (~40 cm)
def cubic(p0, p1, p2, p3, n=16):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = map(np.asarray, (p0, p1, p2, p3))
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def quad(p0, p1, p2, n=12):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2 = map(np.asarray, (p0, p1, p2))
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2


def find_font(path, cache):
    if path:
        return path
    os.makedirs(cache, exist_ok=True)
    local = os.path.join(cache, 'Fredoka-600.ttf')
    if not os.path.exists(local):
        try:
            req = urllib.request.Request('https://fonts.googleapis.com/css2?family=Fredoka:wght@600', headers={'User-Agent': 'Wget/1.0'})
            css = urllib.request.urlopen(req, timeout=20).read().decode()
            url = re.search(r'url\((https://[^)]+\.ttf)\)', css).group(1)
            with urllib.request.urlopen(url, timeout=30) as r, open(local, 'wb') as f:
                f.write(r.read())
        except Exception as e:  # ağ yoksa
            print('    Fredoka indirilemedi, DejaVu kullanılıyor:', e)
            return '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    return local


def glyph_test(font_path):
    try:
        from fontTools.ttLib import TTFont
        cmap = TTFont(font_path).getBestCmap()
        return lambda ch: ord(ch) in cmap
    except Exception:  # fontTools yoksa: Fredoka'nın Google sürümünde ş/ğ hazır harf olarak yok
        fredoka = 'fredoka' in os.path.basename(font_path).lower()
        return lambda ch: not (fredoka and ch in 'şŞğĞİ')


def draw_tr(d, xy, text, font, fill, has):
    """Ortalanmış yazı. Yazı tipinde hazır olmayan Türkçe harfleri (Fredoka'da ş, ğ) temel harf + birleşik işaretle çizer."""
    import unicodedata
    base, marks = '', []
    for ch in text:
        if has(ch) or ch == ' ':
            base += ch
            continue
        dec = unicodedata.normalize('NFD', ch)
        marks.append((len(base), dec[1:]))
        base += dec[0]
    bb = d.textbbox((0, 0), base, font=font, anchor='ls')
    x0, y0 = xy[0] - (bb[0] + bb[2]) / 2, xy[1] - (bb[1] + bb[3]) / 2
    d.text((x0, y0), base, font=font, fill=fill, anchor='ls')
    for i, mk in marks:
        gx = x0 + d.textlength(base[:i], font=font) + d.textlength(base[i], font=font) / 2
        for m in mk:
            mb = d.textbbox((0, 0), m, font=font, anchor='ls')
            d.text((gx - (mb[0] + mb[2]) / 2, y0), m, font=font, fill=fill, anchor='ls')


def tabela_texture(w, h, font_path):
    """Pano yüzü: beyaz zemin, pastel puantiye, 'Hoş geldin', iki puantiyeli fiyonk ve yıldızcıklar (3B kalp ortada durur)."""
    k = 2
    W, H = w * k, h * k
    im = Image.new('RGB', (W, H), '#FFFFFF')
    d = ImageDraw.Draw(im)
    step = 46 * k
    for j, yy in enumerate(range(step // 2, H, step)):
        for xx in range(step // 2 + (j % 2) * step // 2, W, step):
            d.ellipse([xx - 5 * k, yy - 5 * k, xx + 5 * k, yy + 5 * k], fill='#FFEAF2')
    m = 24 * k
    d.rounded_rectangle([m, m, W - m, H - m], radius=34 * k, outline='#FFB8D2', width=6 * k)
    f = ImageFont.truetype(font_path, 200 * k)
    text = 'Hoş geldin'
    size = 200 * k
    while d.textlength(text, font=f) > W * 0.8:
        size -= 4 * k
        f = ImageFont.truetype(font_path, size)
    cx, ty = W / 2, H * 0.29
    has = glyph_test(font_path)
    draw_tr(d, (cx, ty + 9 * k), text, f, '#FF8FB8', has)
    draw_tr(d, (cx, ty), text, f, INK, has)
    f2 = ImageFont.truetype(font_path, int(size * 0.33))
    draw_tr(d, (cx, H * 0.495), 'sonunda buradasın', f2, '#E3174D', has)

    def bow(cx, cy, s):
        lobe = np.vstack([cubic((0, 0), (-12, -30), (-52, -36), (-52, -8)), cubic((-52, -8), (-52, 18), (-20, 16), (0, 0))])
        for sx in (-1, 1):
            pts = [(cx + sx * x * s, cy + y * s) for x, y in lobe]
            d.polygon(pts, fill='#E3174D', outline=INK, width=int(5 * s))
            for x, y, r in ((-40, -12, 3.4), (-28, -17, 3), (-17, -7, 2.6), (-39, 3, 3), (-27, 1, 3.2)):
                X, Y = cx + sx * x * s, cy + y * s
                d.ellipse([X - r * s, Y - r * s, X + r * s, Y + r * s], fill='#FFFFFF')
        d.ellipse([cx - 13 * s, cy - 12 * s, cx + 13 * s, cy + 12 * s], fill='#E3174D', outline=INK, width=int(5 * s))

    def spark(cx, cy, s, col='#FFD34E'):
        q = [(0, -9), (0, 0), (9, 0)], [(9, 0), (0, 0), (0, 9)], [(0, 9), (0, 0), (-9, 0)], [(-9, 0), (0, 0), (0, -9)]
        pts = np.vstack([quad(*c) for c in q])
        d.polygon([(cx + x * s, cy + y * s) for x, y in pts], fill=col)

    def mini_heart(cx, cy, wpx, col):
        pts, _ = heart_outline(wpx, 48)
        d.polygon([(cx + x, cy - y) for x, y in pts], fill=col)

    bow(W * 0.2, H * 0.73, 1.45 * k)
    bow(W * 0.8, H * 0.73, 1.45 * k)
    for x, y, s in ((0.1, 0.52, 1.6), (0.9, 0.5, 1.6), (0.33, 0.88, 1.2), (0.67, 0.89, 1.2), (0.08, 0.14, 1.3), (0.93, 0.15, 1.3)):
        spark(W * x, H * y, s * k)
    for x, y, s in ((0.06, 0.88, 26), (0.94, 0.86, 26), (0.5, 0.115, 20)):
        mini_heart(W * x, H * y, s * k, '#FF8FB8')
    return im.resize((w, h), Image.LANCZOS)


def kiz_kulesi(md, x, y0):
    """İstanbul — Kız Kulesi (art.js kizKulesi renkleri)."""
    md.mat('kk_kaya', '#EACBBE', 0.9)
    md.mat('kk_duvar', '#FFF7EE', 0.7)
    md.mat('kk_bant', '#F29BB5', 0.6)
    md.mat('kk_cati', '#C9B6FF', 0.55)
    t = 0.0011
    md.add(ellipsoid((x, y0 + 0.002, 0), (0.03, 0.006, 0.016), 3), 'kk_kaya', outline=t, angle=180)
    md.add(box((0.036, 0.013, 0.016), T(x, y0 + 0.0115, 0)), 'kk_duvar', outline=t, angle=30)
    md.add(box((0.04, 0.0035, 0.019), T(x, y0 + 0.0195, 0)), 'kk_bant', outline=t, angle=30)
    for wx in (-0.012, -0.005, 0.005, 0.012):
        arch(md, x + wx, y0 + 0.008, 0.0078, 0.0032, 0.0055, 0.0016)
    md.add(box((0.011, 0.026, 0.011), T(x, y0 + 0.034, 0)), 'kk_duvar', outline=t, angle=30)
    md.add(box((0.0155, 0.003, 0.0155), T(x, y0 + 0.036, 0)), 'kk_bant', outline=t, angle=30)
    arch(md, x, y0 + 0.024, 0.0053, 0.0034, 0.0065, 0.0016)
    arch(md, x, y0 + 0.039, 0.0053, 0.0034, 0.0065, 0.0016)
    md.add(box((0.0095, 0.008, 0.0095), T(x, y0 + 0.051, 0)), 'kk_duvar', outline=t, angle=30)
    md.add(lathe([(0, 0), (0.0088, 0), (0.0045, 0.008), (0, 0.016)], 4).tf(M(T(x, y0 + 0.055, 0), Ry(45))), 'kk_cati', outline=t, angle=30)
    md.add(cyl((x, y0 + 0.071, 0), (x, y0 + 0.075, 0), 0.0006, 8), 'direk')
    md.add(heart(0.0062, 0.0016).tf(T(x, y0 + 0.077, 0)), 'kirmizi', outline=0.0006, angle=40)
    # küçük yan kubbe
    md.add(box((0.007, 0.007, 0.007), T(x - 0.0125, y0 + 0.0247, 0)), 'kk_duvar', outline=t, angle=30)
    md.add(ellipsoid((x - 0.0125, y0 + 0.0282, 0), (0.0045, 0.004, 0.0045), 2), 'kk_cati', outline=t, angle=180)


def qiz_qalasi(md, x, y0):
    """Bakü — Qız Qalası (art.js qizQalasi renkleri): hafif daralan taş kule, yan payanda, mazgallar, pembe flama."""
    md.mat('qq_tas', '#F5D9C1', 0.85)
    md.mat('qq_koyu', '#EAC3A4', 0.85)
    md.mat('qq_flama', '#FF6FA3', 0.55)
    t = 0.0011
    H = 0.05
    md.add(lathe([(0, 0), (0.0145, 0), (0.0128, H), (0, H)], 36).tf(T(x, y0, 0)), 'qq_tas', outline=t, angle=40)
    md.add(lathe([(0, 0), (0.0062, 0), (0.0052, H * 0.86), (0, H * 0.86)], 24).tf(T(x + 0.0128, y0, -0.002)), 'qq_koyu', outline=t, angle=40)
    for k in range(1, 5):  # taş sıraları
        yy = y0 + k * H / 5
        rr = 0.0145 - (0.0017 * k / 5) + 0.0003
        md.add(cyl((x, yy, 0), (x, yy + 0.0009, 0), rr, 36), 'qq_koyu', angle=40)
    md.add(cyl((x, y0 + H, 0), (x, y0 + H + 0.0035, 0), 0.0138, 36), 'qq_koyu', outline=t, angle=40)
    merlon_ring(md, (x, 0, 0), y0 + H + 0.0035, 0.0122, 9, (0.004, 0.004, 0.0035), 'qq_koyu')
    arch(md, x, y0, 0.0141, 0.0052, 0.008, 0.0018)
    for wy, wx in ((0.02, -0.004), (0.033, 0.004)):
        p = np.array([wx, 0, 0.0138])
        arch(md, x + wx, y0 + wy, 0.0136, 0.0028, 0.0048, 0.0016, p / np.linalg.norm(p))
    top = y0 + H + 0.0035
    md.add(cyl((x, top, 0), (x, top + 0.022, 0), 0.0006, 8), 'direk')
    md.add(prism([(0, 0), (0.014, -0.0035), (0, -0.0075)], 0.0014, (0.004, -0.0035)).tf(T(x, top + 0.0215, 0)), 'qq_flama', outline=0.0006, angle=40)


def tabela(font_path):
    md = Model('Tabela', outline=0.0019)
    md.mat('cerceve', '#FF8FB8', 0.5)
    md.mat('pano', '#FFFFFF', 0.7)
    md.mat('sap', '#FFC6A6', 0.6)
    md.mat('ayak', '#FFD0E1', 0.7)
    md.mat('direk', INK, 0.5)
    W, H, D = 0.40, 0.26, 0.006
    base_h, stick = 0.012, 0.06
    cyb = base_h + stick + H / 2
    # Ayak ve sap (arkadan)
    md.add(cyl((0, 0, -0.012), (0, base_h, -0.012), 1.0, 48).tf(M(T(0, 0, -0.012), S(0.075, 1, 0.055), T(0, 0, 0.012))),
           'ayak', outline=True, angle=40)
    md.add(cyl((0, base_h - 0.002, -0.012), (0, cyb, -0.012), 0.0085, 24), 'sap', outline=True, angle=40)
    # Pano + pembe boru çerçeve
    md.add(box((W - 0.004, H - 0.004, D), T(0, cyb, 0)), 'pano', angle=30)
    fr = 0.0095
    c = [(-W / 2, cyb - H / 2), (W / 2, cyb - H / 2), (W / 2, cyb + H / 2), (-W / 2, cyb + H / 2)]
    for i in range(4):
        (ax, ay), (bx, by) = c[i], c[(i + 1) % 4]
        md.add(cyl((ax, ay, 0), (bx, by, 0), fr, 28), 'cerceve', outline=True, angle=50)
        md.add(ellipsoid((ax, ay, 0), (fr, fr, fr), 3), 'cerceve', outline=True, angle=180)
    # Yazılı yüz (doku): çerçevenin içinde, panonun hemen önünde
    qw, qh = W - 2 * fr - 0.002, H - 2 * fr - 0.002
    zf = D / 2 + 0.0003
    V = [(-qw / 2, cyb - qh / 2, zf), (qw / 2, cyb - qh / 2, zf), (qw / 2, cyb + qh / 2, zf), (-qw / 2, cyb + qh / 2, zf)]
    uv = [(0, 0), (1, 0), (1, 1), (0, 1)]
    tw = 1024
    md.add_textured(V, [(0, 1, 2), (0, 2, 3)], uv, tabela_texture(tw, int(round(tw * qh / qw)), font_path))
    # Arka yüz: düz pembe-beyaz, ortada küçük kalp
    md.add(heart(0.05, 0.004).tf(M(T(0, cyb, -D / 2 - 0.002), Ry(180))), 'pembe', outline=0.001, angle=40)
    # Büyük kalp (3B, öne taşar) + parlama
    hy = cyb + qh / 2 - qh * 0.73
    md.add(heart(0.096, 0.014).tf(T(0, hy, D / 2 + 0.008)), 'kirmizi', outline=True, angle=40)
    md.add(ellipsoid((-0.02, hy + 0.019, D / 2 + 0.0152), (0.009, 0.0045, 0.0012), 2, Rz(28)), 'beyaz')
    # İki küçük kule figürü üst çerçevede
    y_top = cyb + H / 2 + fr - 0.0015
    for fn, x in ((kiz_kulesi, -0.135), (qiz_qalasi, 0.135)):
        sub = Model('figur', outline=0.0011)
        sub.mat('direk', INK, 0.5)
        fn(sub, 0.0, 0.0)
        md.add(cyl((x, y_top - 0.002, 0), (x, y_top + 0.0035, 0), 0.025, 40), 'ayak', outline=True, angle=40)  # figür altlığı
        md.merge(sub, M(T(x, y_top + 0.0035, 0), S(1.45)))
    return md


BUILDERS = {'kitty': kitty, 'kale': kale, 'tabela': tabela}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('models', nargs='*', metavar='model', help='kitty, kale, tabela (boşsa hepsi)')
    ap.add_argument('--out', default=OUT)
    ap.add_argument('--font', help='Fredoka TTF (tabela yazısı için)')
    ap.add_argument('--cache', default=os.path.join(os.path.expanduser('~'), '.cache', 'eln-ar'))
    ap.add_argument('--checker', help='usd-core 25.x complianceChecker.py yolu (usd-core 26+ için)')
    ap.add_argument('--no-check', action='store_true')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    ok_all = True
    bad = [m for m in a.models if m not in BUILDERS]
    if bad:
        ap.error('bilinmeyen model: ' + ', '.join(bad))
    for key in a.models or list(BUILDERS):
        md = BUILDERS[key](find_font(a.font, a.cache)) if key == 'tabela' else BUILDERS[key]()
        meshes = md.build()
        V = np.vstack([m[2] for m in meshes])
        tris = sum(len(m[3]) for m in meshes)
        size = V.max(0) - V.min(0)
        glb, usdz = os.path.join(a.out, key + '.glb'), os.path.join(a.out, key + '.usdz')
        export_glb(md, meshes, glb)
        work = tempfile.mkdtemp(prefix='eln-ar-')
        try:
            export_usdz(md, meshes, usdz, work)
        finally:
            shutil.rmtree(work, ignore_errors=True)
        sg, su = os.path.getsize(glb), os.path.getsize(usdz)
        print(f'{key}: {tris} üçgen, {len(meshes)} ağ, boyut (G×Y×D) {size[0] * 100:.1f}×{size[1] * 100:.1f}×{size[2] * 100:.1f} cm, '
              f'glb {sg / 1024:.0f} KB, usdz {su / 1024:.0f} KB')
        if max(sg, su) > MAX_BYTES:
            print('    UYARI: 1.5 MB sınırı aşıldı')
            ok_all = False
        if not a.no_check and check(usdz, a.checker) is False:
            ok_all = False
    sys.exit(0 if ok_all else 1)


if __name__ == '__main__':
    main()
