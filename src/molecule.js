// Ibuprofen built from idealized bond lengths and angles, its mirror image,
// the sequence-rule check, and a schematic three-point binding pocket.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry } from './fx.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const K = Math.sqrt(8) / 3;

// The three other bond directions of a tetrahedral atom, given the direction to its parent.
function tetra(toParent, ref, twist = 0) {
  const u = toParent.clone().normalize();
  let w0 = (ref || (Math.abs(u.x) < 0.9 ? V(1, 0, 0) : V(0, 1, 0))).clone();
  w0.sub(u.clone().multiplyScalar(w0.dot(u))).normalize();
  const w1 = new THREE.Vector3().crossVectors(u, w0);
  return [0, 1, 2].map((k) => { const a = twist + k * 2 * Math.PI / 3; return u.clone().multiplyScalar(-1 / 3).add(w0.clone().multiplyScalar(Math.cos(a) * K)).add(w1.clone().multiplyScalar(Math.sin(a) * K)); });
}

// Sequence rules for ibuprofen's chirality center: COOH carbon carries (O,O,O),
// ring carbon carries (C,C,C), methyl carbon carries (H,H,H), then H.
export const PRIORITY = ['Acid', 'Aryl', 'Me', 'H'];

// With the lowest-ranked group pointing away from the viewer, 1 to 2 to 3
// clockwise is R and counterclockwise is S.
export function configuration(dirs) {
  const [a, b, c, d] = PRIORITY.map((g) => dirs[g]);
  const n = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
  return n.dot(d.clone().negate()) > 0 ? 'S' : 'R';
}

export function buildIbuprofen(want = 'S') {
  const az = (deg) => V(Math.cos(deg * Math.PI / 180) * K, -1 / 3, Math.sin(deg * Math.PI / 180) * K);
  let dirs = { H: V(0, 1, 0), Acid: az(270), Aryl: az(150), Me: az(30) };
  if (configuration(dirs) !== want) { const t = dirs.Acid; dirs.Acid = dirs.Me; dirs.Me = t; }
  const atoms = [], bonds = [];
  const add = (el, p, group, kind) => { atoms.push({ el, p: p.clone(), group, kind }); return atoms.length - 1; };
  const bond = (i, j, order = 1) => bonds.push({ i, j, order });
  const hydrogens = (ci, toParent, group, n = 3, ref) => { const t = tetra(toParent, ref); for (let k = 0; k < n; k++) bond(ci, add('H', atoms[ci].p.clone().add(t[k].multiplyScalar(1.09)), group, 'h')); return t; };

  const c0 = add('C', V(0, 0, 0), 'center', 'center');
  bond(c0, add('H', dirs.H.clone().multiplyScalar(1.09), 'H', 'h'));
  // methyl
  const cm = add('C', dirs.Me.clone().multiplyScalar(1.53), 'Me', 'ch3'); bond(c0, cm);
  hydrogens(cm, dirs.Me.clone().negate(), 'Me');
  // carboxylic acid
  const ca = add('C', dirs.Acid.clone().multiplyScalar(1.52), 'Acid', 'acid'); bond(c0, ca);
  const p = new THREE.Vector3().crossVectors(dirs.Acid, dirs.H).normalize();
  const o1 = add('O', atoms[ca].p.clone().add(dirs.Acid.clone().multiplyScalar(0.5).add(p.clone().multiplyScalar(0.866)).multiplyScalar(1.21)), 'Acid', 'o'); bond(ca, o1, 2);
  const o2 = add('O', atoms[ca].p.clone().add(dirs.Acid.clone().multiplyScalar(0.5).add(p.clone().multiplyScalar(-0.866)).multiplyScalar(1.34)), 'Acid', 'o'); bond(ca, o2);
  bond(o2, add('H', atoms[o2].p.clone().add(dirs.Acid.clone().multiplyScalar(0.96)), 'Acid', 'h'));
  // benzene ring
  const d = dirs.Aryl, q = new THREE.Vector3().crossVectors(d, dirs.H).normalize();
  const rc = d.clone().multiplyScalar(1.51 + 1.39), ring = [];
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; const rad = d.clone().multiplyScalar(-Math.cos(a)).add(q.clone().multiplyScalar(Math.sin(a)));
    ring.push(add('C', rc.clone().add(rad.clone().multiplyScalar(1.39)), 'Aryl', 'ring'));
    if (k % 3) bond(ring[k], add('H', rc.clone().add(rad.clone().multiplyScalar(1.39 + 1.08)), 'Aryl', 'h')); }
  for (let k = 0; k < 6; k++) bond(ring[k], ring[(k + 1) % 6], 1.5);
  bond(c0, ring[0]);
  // isobutyl
  const cb1 = add('C', atoms[ring[3]].p.clone().add(d.clone().multiplyScalar(1.51)), 'Aryl', 'ch2'); bond(ring[3], cb1);
  const t1 = tetra(d.clone().negate(), dirs.H);
  const cb2 = add('C', atoms[cb1].p.clone().add(t1[0].clone().multiplyScalar(1.53)), 'Aryl', 'ch'); bond(cb1, cb2);
  for (const k of [1, 2]) bond(cb1, add('H', atoms[cb1].p.clone().add(t1[k].clone().multiplyScalar(1.09)), 'Aryl', 'h'));
  const t2 = tetra(t1[0].clone().negate(), d);
  for (const k of [0, 1]) { const m = add('C', atoms[cb2].p.clone().add(t2[k].clone().multiplyScalar(1.53)), 'Aryl', 'ch3'); bond(cb2, m); hydrogens(m, t2[k].clone().negate(), 'Aryl'); }
  bond(cb2, add('H', atoms[cb2].p.clone().add(t2[2].clone().multiplyScalar(1.09)), 'Aryl', 'h'));
  return { atoms, bonds, dirs, ringCenter: rc, ringNormal: new THREE.Vector3().crossVectors(d, q).normalize(), config: configuration(dirs) };
}

export function mirrorOf(m) {
  const fx = (v) => V(-v.x, v.y, v.z);
  const dirs = {}; for (const g in m.dirs) dirs[g] = fx(m.dirs[g]);
  return { atoms: m.atoms.map((a) => ({ ...a, p: fx(a.p) })), bonds: m.bonds, dirs, ringCenter: fx(m.ringCenter), ringNormal: fx(m.ringNormal), config: configuration(dirs) };
}

const R = { C: 0.42, O: 0.4, H: 0.25 };
const COL = { C: 0x4d586e, O: 0xf04a58, H: 0xcfd6e4 };
const sph = { C: new THREE.SphereGeometry(R.C, 28, 20), O: new THREE.SphereGeometry(R.O, 28, 20), H: new THREE.SphereGeometry(R.H, 20, 14) };
const cyl = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
const UP = V(0, 1, 0);

export function makeMesh(m, ghost) {
  const g = new THREE.Group(); const mats = {}; const atomMeshes = [];
  const gm = ghost && new THREE.MeshBasicMaterial({ color: 0xc3b1ff, transparent: true, opacity: 0.16, depthWrite: false });
  const mat = (el, group) => { if (ghost) return gm; const k = el + group; return mats[k] || (mats[k] = new THREE.MeshPhysicalMaterial({ color: COL[el], roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.2, emissive: 0x000000 })); };
  const bm = ghost ? gm : new THREE.MeshPhysicalMaterial({ color: 0x8f9bb5, roughness: 0.35, clearcoat: 0.6 });
  m.atoms.forEach((a, i) => { const s = new THREE.Mesh(sph[a.el], mat(a.el, a.group)); s.position.copy(a.p); s.userData.atom = i; g.add(s); atomMeshes.push(s); });
  const stick = (p0, p1, r) => { const c = new THREE.Mesh(cyl, bm); const dv = p1.clone().sub(p0); c.position.copy(p0).add(dv.clone().multiplyScalar(0.5)); c.scale.set(r, dv.length(), r); c.quaternion.setFromUnitVectors(UP, dv.clone().normalize()); g.add(c); };
  for (const b of m.bonds) { const p0 = m.atoms[b.i].p, p1 = m.atoms[b.j].p;
    if (b.order === 2) { const off = new THREE.Vector3().crossVectors(p1.clone().sub(p0), m.dirs.H).normalize().multiplyScalar(0.11); stick(p0.clone().add(off), p1.clone().add(off), 0.065); stick(p0.clone().sub(off), p1.clone().sub(off), 0.065); }
    else stick(p0, p1, 0.1); }
  const tor = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.045, 8, 40), bm); tor.position.copy(m.ringCenter); tor.quaternion.setFromUnitVectors(V(0, 0, 1), m.ringNormal); g.add(tor);
  return { group: g, atomMeshes, mats, data: m,
    glow(group, color, k) { for (const key in mats) { const on = group && (group === 'all' || key.slice(1) === group || (group === 'center' && key === 'Ccenter')); if (key.slice(1) === group || group === null || group === 'all' || (group === 'center' && key === 'Ccenter')) { mats[key].emissive.setHex(on && group ? color : 0); mats[key].emissiveIntensity = k || 0; } } },
    setGlow(map) { for (const key in mats) { const e = map[key.slice(1)]; mats[key].emissive.setHex(e ? e[0] : 0); mats[key].emissiveIntensity = e ? e[1] : 0; } } };
}

// Schematic receptor site with three complementary contacts. Not a real protein structure.
export function makePocket(dirs) {
  const rnd = mulberry(11), g = new THREE.Group(), geos = [];
  const azOf = (d) => Math.atan2(d.z, d.x), near = (a, b, w) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < w;
  // floor dish
  for (let i = 0; i < 150; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 12.5; const s = new THREE.SphereGeometry(1.5 + rnd() * 0.7, 12, 9); s.translate(Math.cos(a) * r, -6.6 - rnd() * 0.8 + r * r * 0.012, Math.sin(a) * r * 0.8 - 1.5); geos.push(s); }
  // low wall between the sites, open toward the viewer
  for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2; if (Math.sin(a) > 0.55) continue; if (near(a, azOf(dirs.Aryl), 0.5) || near(a, azOf(dirs.Acid), 0.3) || near(a, azOf(dirs.Me), 0.3)) continue;
    for (let k = 0; k < 2; k++) { const r = 7.6 + k * 1.6 + rnd() * 0.5; const s = new THREE.SphereGeometry(1.3 + rnd() * 0.5, 12, 9); s.translate(Math.cos(a) * r, -4.6 + k * 1.3 + rnd() * 0.6, Math.sin(a) * r); geos.push(s); } }
  g.add(new THREE.Mesh(mergeGeometries(geos), new THREE.MeshPhysicalMaterial({ color: 0x35346f, roughness: 0.6, clearcoat: 0.3, emissive: 0x100e30, emissiveIntensity: 0.5 })));
  const lump = (pts, color, e) => { const gs = pts.map(([p, r]) => { const s = new THREE.SphereGeometry(r, 16, 12); s.translate(p.x, p.y, p.z); return s; }); const m = new THREE.Mesh(mergeGeometries(gs), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: e, roughness: 0.45 })); g.add(m); return m; };
  const side = (d) => new THREE.Vector3().crossVectors(d, V(0, 1, 0)).normalize();
  const sites = {};
  { const d = dirs.Acid, c = d.clone().multiplyScalar(5.6), s = side(d); sites.Acid = lump([[c, 1.35], [c.clone().add(s.clone().multiplyScalar(1.5)).add(V(0, -1.2, 0)), 1.2], [c.clone().add(s.clone().multiplyScalar(-1.5)).add(V(0, -1.2, 0)), 1.2], [c.clone().add(V(0, -2.6, 0)), 1.5]], 0x4f9dff, 0.45); }
  { const d = dirs.Me, c = d.clone().multiplyScalar(4.6), s = side(d); sites.Me = lump([[c.clone().add(s.clone().multiplyScalar(1.25)), 0.85], [c.clone().add(s.clone().multiplyScalar(-1.25)), 0.85], [c.clone().add(V(0, -1.3, 0)), 0.9], [c.clone().add(d.clone().multiplyScalar(1.1)), 0.9], [c.clone().add(V(0, -2.8, 0)), 1.3]], 0x4fd38a, 0.45); }
  { const d = dirs.Aryl, s = side(d), pts = []; for (let k = 0; k < 8; k++) for (const sg of [-1, 1]) pts.push([d.clone().multiplyScalar(3.6 + k * 1.35).add(s.clone().multiplyScalar(sg * 2.7)).add(V(0, -1.9, 0)), 1.2]); for (let k = 0; k < 8; k++) pts.push([d.clone().multiplyScalar(3.6 + k * 1.35).add(V(0, -3.6, 0)), 1.25]); sites.Aryl = lump(pts, 0xd9a441, 0.22); }
  return { group: g, sites, dirs };
}
