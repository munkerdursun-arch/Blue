// =============================================================================
// Rendu 3D : compacte électrique stylisée, générée par code (aucun fichier
// externe nécessaire). Un vrai modèle .glb peut être importé depuis les réglages.
//
// Repère : x = avant du véhicule, y = haut, z = côté droit. Unités : mètres.
// =============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const PAINTS = [
  { id: 'graphite', name: 'Gris graphite', color: '#3a3f45' },
  { id: 'blue', name: 'Bleu profond', color: '#1d3f66' },
  { id: 'white', name: 'Blanc glacier', color: '#e6e8ea' },
  { id: 'copper', name: 'Cuivre', color: '#8a4f2e' },
  { id: 'black', name: 'Noir', color: '#101113' },
];

const VIEWS = [
  { name: '3/4 avant', pos: [5.6, 2.1, 5.4] },
  { name: 'Profil', pos: [0.2, 1.4, 7.6] },
  { name: '3/4 arrière', pos: [-5.6, 2.2, 5.2] },
  { name: 'Face', pos: [7.6, 1.5, 0.2] },
  { name: 'Dessus', pos: [3.2, 7.2, 3.2] },
];

// --- Dimensions générales -------------------------------------------------------
const L = 4.32;            // longueur
const XF = L / 2;          // pare-chocs avant
const XR = -L / 2;         // pare-chocs arrière
const AXLE_F = 1.36;
const AXLE_R = -1.41;      // empattement ≈ 2,77 m
const TIRE_R = 0.355;
const TRACK_Z = 0.775;     // demi-voie
const ARCH_R = 0.425;

// --- Interpolation monotone (Fritsch–Carlson) : courbes lisses sans dépassement ---
function monotone(points) {
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const d = [];
  const m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// Profils (abscisse = x le long du véhicule, de l'arrière vers l'avant)
const halfWidth = monotone([[XR, 0.70], [XR + 0.04, 0.80], [XR + 0.14, 0.865], [XR + 0.45, 0.9], [-0.4, 0.905], [1.3, 0.9], [XF - 0.3, 0.875], [XF - 0.12, 0.83], [XF - 0.04, 0.77], [XF, 0.66]]);
const beltLine = monotone([[XR, 0.84], [XR + 0.05, 0.94], [XR + 0.2, 0.985], [-1.0, 0.975], [0.0, 0.955], [1.1, 0.905], [1.6, 0.83], [XF - 0.15, 0.75], [XF - 0.04, 0.69], [XF, 0.61]]);
const cabinRoof = monotone([[-2.12, 0.99], [-2.06, 1.15], [-1.95, 1.3], [-1.75, 1.415], [-1.3, 1.495], [-0.7, 1.525], [-0.1, 1.505], [0.3, 1.415], [0.75, 1.19], [1.1, 0.94]]);
const bottomBase = monotone([[XR, 0.40], [XR + 0.12, 0.27], [XR + 0.45, 0.19], [XF - 0.55, 0.18], [XF - 0.12, 0.24], [XF, 0.30]]);
const greenhouseW = monotone([[-2.12, 0.54], [-1.6, 0.59], [-0.6, 0.615], [0.4, 0.6], [1.1, 0.72]]);

function archLift(x) {
  let y = 0;
  for (const ax of [AXLE_F, AXLE_R]) {
    const dx = x - ax;
    if (Math.abs(dx) < ARCH_R) y = Math.max(y, TIRE_R + Math.sqrt(ARCH_R * ARCH_R - dx * dx));
  }
  return y;
}

/** Paramètres de la section transversale à l'abscisse x. */
function section(x) {
  const w = halfWidth(x);
  const belt = beltLine(x);
  const yb = Math.min(belt - 0.07, Math.max(bottomBase(x), archLift(x)));
  const inCabin = x > -2.12 && x < 1.1;
  const roof = Math.max(belt + 0.035, inCabin ? cabinRoof(x) : 0);
  const gh = roof - belt;
  const wBelt = w - 0.065;
  const k = Math.min(1, gh / 0.32);
  const wg = THREE.MathUtils.lerp(wBelt - 0.05, Math.min(wBelt - 0.04, greenhouseW(x) * (w / 0.905)), k);
  return { w, belt, yb, roof, wBelt, wg, gh };
}

// Indices de contour (demi-section, du bas-centre au toit-centre)
const SEG = { bottom: 3, corner: 4, side: 7, shoulder: 4, glass: 7, roof: 7 };
const IDX = {};
{
  let i = 0;
  for (const k of Object.keys(SEG)) { IDX[k] = i; i += SEG[k]; }
  IDX.count = i + 1;
}

/** Points (z, y) de la demi-section, du bas vers le haut. */
function contour(x) {
  const s = section(x);
  const pts = [];
  const rc = 0.07;
  // fond
  for (let i = 0; i < SEG.bottom; i++) pts.push([(i / SEG.bottom) * (s.w - rc), s.yb]);
  // arrondi bas
  for (let i = 0; i < SEG.corner; i++) {
    const a = -Math.PI / 2 + (i / SEG.corner) * (Math.PI / 2);
    pts.push([s.w - rc + Math.cos(a) * rc, s.yb + rc + Math.sin(a) * rc]);
  }
  // flanc légèrement galbé
  const sideTop = Math.max(s.belt - 0.06, s.yb + rc + 0.012);
  for (let i = 0; i < SEG.side; i++) {
    const t = i / SEG.side;
    const y = s.yb + rc + t * (sideTop - s.yb - rc);
    const bulge = Math.sin(t * Math.PI) * 0.012;
    pts.push([s.w + bulge - t * t * 0.02, y]);
  }
  // épaulement
  for (let i = 0; i < SEG.shoulder; i++) {
    const a = (i / SEG.shoulder) * (Math.PI / 2);
    const z0 = s.w - 0.02;
    pts.push([s.wBelt + (z0 - s.wBelt) * Math.cos(a), sideTop + 0.06 * Math.sin(a)]);
  }
  // vitrage (tumblehome)
  const rr = Math.min(0.1, s.gh * 0.4);
  for (let i = 0; i < SEG.glass; i++) {
    const t = i / SEG.glass;
    pts.push([THREE.MathUtils.lerp(s.wBelt, s.wg, t), THREE.MathUtils.lerp(s.belt, s.roof - rr, t)]);
  }
  // pavillon (superellipse)
  for (let i = 0; i < SEG.roof; i++) {
    const a = (i / SEG.roof) * (Math.PI / 2);
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const z = s.wg * Math.sign(c) * Math.pow(Math.abs(c), 0.35);
    const y = s.roof - rr + rr * Math.pow(Math.abs(sn), 0.6);
    pts.push([z, y]);
  }
  pts.push([0, s.roof]);
  return pts;
}

// Stations le long du véhicule (plus denses aux extrémités et autour des roues)
function stations() {
  const xs = new Set();
  const add = (a, b, n) => { for (let i = 0; i <= n; i++) xs.add(+(a + ((b - a) * i) / n).toFixed(4)); };
  add(XR, XR + 0.25, 8);
  add(XR + 0.25, XF - 0.3, 70);
  add(XF - 0.3, XF, 10);
  for (const ax of [AXLE_F, AXLE_R]) add(ax - ARCH_R - 0.02, ax + ARCH_R + 0.02, 24);
  return [...xs].sort((a, b) => a - b);
}

/** Construit une surface en "loft" : sections successives reliées en quads.
 *  from/to : indices de contour utilisés. pick(ci, x) choisit le groupe de matériau
 *  de chaque bande (null = pas de face). offset : décalage le long de la normale. */
function loft(xs, from, to, offset, pick, cap = false) {
  const last = IDX.count - 1;
  // Description de l'anneau : gauche (haut → bas, z<0) puis droite (bas → haut, z>0)
  const ringCi = [];
  const ringSide = [];
  for (let i = to; i >= from; i--) { ringCi.push(i); ringSide.push(-1); }
  for (let i = from === 0 ? 1 : from; i <= (to === last ? to - 1 : to); i++) { ringCi.push(i); ringSide.push(1); }
  const closed = to === last; // le sommet (centre du toit) est partagé : l'anneau se referme
  const ring = ringCi.length;

  const pos = [];
  for (const x of xs) {
    const c = contour(x);
    for (let k = 0; k < ring; k++) pos.push(x, c[ringCi[k]][1], ringSide[k] * c[ringCi[k]][0]);
  }

  const groups = new Map();
  const push = (g, a, b, d) => { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(a, b, d); };
  const edges = [];
  for (let k = 0; k < ring - 1; k++) edges.push([k, k + 1]);
  if (closed) edges.push([ring - 1, 0]);

  for (let si = 0; si < xs.length - 1; si++) {
    const xm = (xs[si] + xs[si + 1]) / 2;
    for (const [k0, k1] of edges) {
      if (ringCi[k0] === ringCi[k1]) continue; // bande qui traverserait l'habitacle
      const g = pick(Math.min(ringCi[k0], ringCi[k1]), xm);
      if (g === null) continue;
      const a = si * ring + k0;
      const b = si * ring + k1;
      const c2 = a + ring;
      const d = b + ring;
      push(g, a, c2, b);
      push(g, b, c2, d);
    }
  }

  // Fermetures avant/arrière (éventail depuis le centre de la section)
  if (cap) {
    for (const [si, rear] of [[0, true], [xs.length - 1, false]]) {
      const base = si * ring;
      let cx = 0; let cy = 0;
      for (let k = 0; k < ring; k++) { cx += pos[(base + k) * 3]; cy += pos[(base + k) * 3 + 1]; }
      const center = pos.length / 3;
      pos.push(cx / ring, cy / ring, 0);
      for (const [k0, k1] of edges) {
        if (rear) push('cap', center, base + k0, base + k1);
        else push('cap', center, base + k1, base + k0);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const index = [];
  const order = [];
  for (const [g, arr] of groups) { order.push([g, index.length, arr.length]); index.push(...arr); }
  geo.setIndex(index);
  geo.computeVertexNormals();

  // Décalage le long de la normale (vitrage / pavillon posés sur la caisse)
  if (offset) {
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) + n.getX(i) * offset, p.getY(i) + n.getY(i) * offset, p.getZ(i) + n.getZ(i) * offset);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return { geo, order };
}

function surfacePoint(x, ci, side = 1, out = 0.006) {
  const c = contour(x)[ci];
  return new THREE.Vector3(x, c[1] + out * 0.4, side * (c[0] + out));
}

function tube(points, radius, mat) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(16, points.length * 6), radius, 8, false), mat);
}

/** Points d'une ligne lumineuse qui traverse la face avant/arrière (x0) à la hauteur y
 *  puis s'enroule sur les flancs. dir : petit décalage hors de la face (+ avant, − arrière). */
function wrapAcross(x0, y, dir, span) {
  const inward = Math.sign(dir) * -1; // vers le centre du véhicule
  const pts = [];
  const wAt = (x) => {
    // demi-largeur de la section à la hauteur y (cherche le point de contour le plus proche)
    const c = contour(x);
    let best = c[0];
    for (const p of c) if (Math.abs(p[1] - y) < Math.abs(best[1] - y) && p[0] > 0.2) best = p;
    return best[0];
  };
  for (const side of [-1]) {
    for (const dx of [0.07, 0.03]) pts.push(new THREE.Vector3(x0 + inward * dx, y, side * (wAt(x0 + inward * dx) + 0.005)));
  }
  const w0 = wAt(x0) * span;
  for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector3(x0 + dir, y, -w0 + (2 * w0 * i) / 12));
  for (const dx of [0.03, 0.07]) pts.push(new THREE.Vector3(x0 + inward * dx, y, wAt(x0 + inward * dx) + 0.005));
  return pts;
}

// ------------------------------------------------------------------------------------
export class Car3D {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = { quality: 'high', fps: 60, paint: PAINTS[0].color, ...opts };
    this.viewIndex = 0;
    this.state = { speed: 0, accel: 0, charging: false, night: false };
    this.wheelAngle = 0;
    this.running = true;
    this.lastFrame = 0;
    this.tween = null;
    this.custom = null;
    this.init();
  }

  init() {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = r;
    this.container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    this.camera.position.set(...VIEWS[0].pos);

    const c = new OrbitControls(this.camera, r.domElement);
    c.target.set(0, 0.62, 0);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.enablePan = false;
    c.minDistance = 5;
    c.maxDistance = 11;
    c.maxPolarAngle = 1.48;
    c.minPolarAngle = 0.25;
    c.autoRotate = true;
    c.autoRotateSpeed = 0.45;
    c.addEventListener('start', () => { c.autoRotate = false; this.tween = null; clearTimeout(this.idleTimer); });
    c.addEventListener('end', () => { this.idleTimer = setTimeout(() => { c.autoRotate = true; }, 8000); });
    this.controls = c;

    this.buildLights();
    this.buildFloor();
    this.car = this.buildCar();
    this.scene.add(this.car);
    this.applyQuality();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.container);
    this.resize();

    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.lastFrame = 0; });
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  buildLights() {
    const hemi = new THREE.HemisphereLight(0xdfe6f0, 0x1a1c20, 0.55);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(4, 7, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3.5; key.shadow.camera.right = 3.5;
    key.shadow.camera.top = 3.5; key.shadow.camera.bottom = -3.5;
    key.shadow.camera.near = 1; key.shadow.camera.far = 20;
    key.shadow.bias = -0.0004;
    key.shadow.radius = 4;
    this.key = key;
    this.scene.add(key);
    // Bandeaux "studio" : reflets longs sur la carrosserie
    const rim = new THREE.DirectionalLight(0xffd9c0, 1.1);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.5);
    fill.position.set(-2, 2, 6);
    this.scene.add(fill);
  }

  buildFloor() {
    const g = new THREE.Group();
    // Disque de présentation
    // dégradé radial : le disque se fond dans le fond de la carte
    const fade = document.createElement('canvas');
    fade.width = fade.height = 256;
    const fctx = fade.getContext('2d');
    const fg = fctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    fg.addColorStop(0, '#fff'); fg.addColorStop(0.7, '#bbb'); fg.addColorStop(1, '#000');
    fctx.fillStyle = fg; fctx.fillRect(0, 0, 256, 256);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.6, metalness: 0.2, transparent: true, alphaMap: new THREE.CanvasTexture(fade) });
    this.discMat = discMat;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.4, 96), discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.receiveShadow = true;
    g.add(disc);
    // Anneau lumineux cuivré
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc8875e, transparent: true, opacity: 0.55 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.32, 3.36, 128), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.61, 128), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 }));
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.002;
    g.add(ring2);
    // Ombre de contact (dégradé radial) : reste visible même sans ombres temps réel
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const ctx = cv.getContext('2d');
    const grd = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grd.addColorStop(0, 'rgba(0,0,0,0.75)');
    grd.addColorStop(0.5, 'rgba(0,0,0,0.35)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(cv);
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.003;
    g.add(contact);
    this.floor = g;
    this.scene.add(g);
  }

  buildCar() {
    const car = new THREE.Group();
    car.name = 'procedural-car';

    // --- Matériaux ---
    this.paint = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.opts.paint), metalness: 0.6, roughness: 0.26,
      clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide,
    });
    const trim = new THREE.MeshPhysicalMaterial({ color: 0x0e0f11, metalness: 0.2, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide });
    const glass = new THREE.MeshStandardMaterial({ color: 0x040506, metalness: 0.2, roughness: 0.1, envMapIntensity: 0.4, side: THREE.DoubleSide });
    const roofMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0b0d, metalness: 0.3, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.7, side: THREE.DoubleSide });
    const copper = new THREE.MeshPhysicalMaterial({ color: 0xc07a4f, metalness: 1, roughness: 0.28, clearcoat: 0.5 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.9, side: THREE.DoubleSide });
    this.headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf4ff, emissiveIntensity: 1.6 });
    this.tailMat = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1a1a, emissiveIntensity: 1.2 });
    this.copper = copper;

    const xs = stations();

    // --- Caisse ---
    const trimTop = IDX.side + 1;
    const body = loft(xs, 0, IDX.count - 1, 0, (ci, x) => {
      if (ci < trimTop) return 'trim';                        // bas de caisse / passages de roue
      if (x > XF - 0.22 && ci < IDX.side + 4) return 'trim';  // bouclier avant bas
      if (x < XR + 0.22 && ci < IDX.side + 5) return 'trim';  // diffuseur arrière
      return 'paint';
    }, true);
    const bodyMesh = new THREE.Mesh(body.geo, [this.paint, trim, this.paint]);
    body.order.forEach(([g, start, count]) => body.geo.addGroup(start, count, g === 'trim' ? 1 : g === 'paint' ? 0 : 2));
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    car.add(bodyMesh);

    // --- Vitrage (légèrement décollé de la caisse) ---
    const cabinXs = xs.filter((x) => x > -2.1 && x < 1.08 && section(x).gh > 0.06);
    const glassLoft = loft(cabinXs, IDX.glass, IDX.count - 1, 0.006, () => 'g');
    const glassMesh = new THREE.Mesh(glassLoft.geo, glass);
    glassMesh.name = 'glass';
    car.add(glassMesh);

    // --- Pavillon noir brillant "flottant" ---
    const roofXs = xs.filter((x) => x > -1.8 && x < -0.1);
    const roofLoft = loft(roofXs, IDX.roof + 1, IDX.count - 1, 0.012, () => 'r');
    car.add(new THREE.Mesh(roofLoft.geo, roofMat));

    // --- Montant C cuivré (signature) ---
    for (const side of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const x = -1.98 + i * 0.05;
        pts.push(surfacePoint(x, IDX.glass + 1, side, 0.009));
      }
      car.add(tube(pts, 0.011, copper));
    }

    // --- Passages de roue (doublures) + plancher pour éviter les transparences ---
    for (const ax of [AXLE_F, AXLE_R]) {
      // demi-cylindre supérieur, axe selon la largeur du véhicule
      const liner = new THREE.Mesh(new THREE.CylinderGeometry(ARCH_R - 0.005, ARCH_R - 0.005, 1.76, 32, 1, true, Math.PI / 2, Math.PI), dark);
      liner.rotation.x = Math.PI / 2;
      liner.position.set(ax, TIRE_R, 0);
      car.add(liner);
    }
    const floorPan = new THREE.Mesh(new THREE.BoxGeometry(AXLE_F - AXLE_R - 0.95, 0.14, 1.2), dark);
    floorPan.position.set((AXLE_F + AXLE_R) / 2, 0.27, 0);
    car.add(floorPan);

    // --- Signature lumineuse avant : barre pleine largeur + feux effilés ---
    {
      const yBar = contour(XF)[IDX.shoulder][1] - 0.03;
      car.add(tube(wrapAcross(XF, yBar, 0.006, 0.9), 0.008, this.headMat));
      for (const side of [1, -1]) {
        const lp = [];
        for (let i = 0; i <= 10; i++) lp.push(surfacePoint(XF - 0.42 + i * 0.038, IDX.shoulder - 1, side, 0.008));
        car.add(tube(lp, 0.015, this.headMat));
      }
      // Lame cuivrée sur la calandre basse
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.9), copper);
      blade.position.set(XF + 0.006, section(XF).yb + 0.1, 0);
      car.add(blade);
    }

    // --- Bandeau de feux arrière pleine largeur ---
    {
      const yTail = contour(XR)[IDX.shoulder][1] - 0.01;
      car.add(tube(wrapAcross(XR, yTail, -0.006, 0.92), 0.016, this.tailMat));
    }

    // --- Rétroviseurs ---
    for (const side of [1, -1]) {
      const m = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), this.paint);
      shell.scale.set(0.9, 0.55, 1.4);
      m.add(shell);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.12), trim);
      arm.position.z = -side * 0.1;
      m.add(arm);
      const s = section(0.86);
      m.position.set(0.86, s.belt + 0.06, side * (s.wBelt + 0.14));
      m.children.forEach((ch) => { ch.castShadow = true; });
      car.add(m);
    }

    // --- Poignées affleurantes ---
    for (const side of [1, -1]) {
      for (const x of [0.2, -0.85]) {
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.01), trim);
        const p = surfacePoint(x, IDX.side + SEG.side - 1, side, 0.004);
        h.position.copy(p);
        car.add(h);
      }
    }

    // --- Roues ---
    this.wheels = [];
    const wheelProto = this.buildWheel(copper);
    for (const ax of [AXLE_F, AXLE_R]) {
      for (const side of [1, -1]) {
        const w = wheelProto.clone(true);
        w.position.set(ax, TIRE_R, side * TRACK_Z);
        if (side < 0) w.rotation.y = Math.PI;
        car.add(w);
        this.wheels.push({ obj: w.getObjectByName('spin'), side });
      }
    }

    // --- Trappe de recharge (arrière droit) ---
    const port = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), new THREE.MeshStandardMaterial({ color: 0x0a2a18, emissive: 0x2bff88, emissiveIntensity: 0 }));
    const pp = surfacePoint(-1.72, IDX.side + 5, 1, 0.006);
    port.position.copy(pp);
    port.rotation.y = 0;
    port.lookAt(pp.clone().add(new THREE.Vector3(0, 0, 1)));
    this.portMat = port.material;
    car.add(port);

    car.traverse((o) => { if (o.isMesh && o !== glassMesh) o.castShadow = true; });
    return car;
  }

  buildWheel(copper) {
    const wheel = new THREE.Group();
    const spin = new THREE.Group();
    spin.name = 'spin';
    wheel.add(spin);

    // Pneu : profil arrondi en révolution
    const w = 0.235;
    const prof = [];
    const rIn = 0.262;
    prof.push(new THREE.Vector2(rIn, -w / 2 + 0.01));
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI;
      prof.push(new THREE.Vector2(TIRE_R - 0.04 + Math.cos(a) * 0.04, Math.sin(a) * (w / 2 - 0.005)));
    }
    prof.push(new THREE.Vector2(rIn, w / 2 - 0.01));
    const tire = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.88, side: THREE.DoubleSide }));
    tire.rotation.x = Math.PI / 2;
    spin.add(tire);

    // Jante : fût sombre + voile à 5 doubles branches
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rIn, rIn, w - 0.03, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x1b1c1f, metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide }));
    barrel.rotation.x = Math.PI / 2;
    spin.add(barrel);
    const rimMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2c30, metalness: 0.9, roughness: 0.25, clearcoat: 0.8 });
    const lip = new THREE.Mesh(new THREE.TorusGeometry(rIn - 0.005, 0.012, 10, 64), copper);
    lip.position.z = w / 2 - 0.02;
    spin.add(lip);
    const face = w / 2 - 0.035;
    for (let k = 0; k < 5; k++) {
      for (const off of [-0.11, 0.11]) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.032, 0.03), rimMat);
        const a = (k / 5) * Math.PI * 2 + off;
        spoke.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, face);
        spoke.rotation.z = a;
        spin.add(spoke);
      }
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.04, 24), rimMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = face + 0.01;
    spin.add(hub);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), copper);
    cap.position.z = face + 0.031;
    spin.add(cap);

    // Disque + étrier cuivré (ne tournent pas avec la roue pour l'étrier)
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.025, 40), new THREE.MeshStandardMaterial({ color: 0x55585e, metalness: 0.8, roughness: 0.45 }));
    disc.rotation.x = Math.PI / 2;
    disc.position.z = 0.0;
    spin.add(disc);
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.06), copper);
    caliper.position.set(-0.13, 0.08, 0.02);
    caliper.rotation.z = 0.5;
    wheel.add(caliper);
    return wheel;
  }

  // --- API publique -----------------------------------------------------------------
  setPaint(hex) { this.paint.color.set(hex); }

  setView(i) {
    this.viewIndex = (i + VIEWS.length) % VIEWS.length;
    const target = new THREE.Vector3(...VIEWS[this.viewIndex].pos);
    this.controls.autoRotate = false;
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => { this.controls.autoRotate = true; }, 10000);
    this.tween = { from: this.camera.position.clone(), to: target, t: 0 };
    return VIEWS[this.viewIndex].name;
  }
  nextView() { return this.setView(this.viewIndex + 1); }
  prevView() { return this.setView(this.viewIndex - 1); }

  setOptions(o) {
    Object.assign(this.opts, o);
    this.applyQuality();
  }

  applyQuality() {
    const high = this.opts.quality !== 'eco';
    const dpr = Math.min(window.devicePixelRatio || 1, high ? 2 : 1);
    this.renderer.setPixelRatio(dpr);
    this.renderer.shadowMap.enabled = high;
    this.key.castShadow = high;
    this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    this.resize();
  }

  setTheme(light) {
    this.discMat.color.set(light ? 0xd4d7dc : 0x16181c);
    this.state.night = !light;
  }

  /** Données temps réel → animation (roues, feux, recharge). */
  update(s) {
    this.state.speed = s.speed || 0;
    this.state.accel = s.accel || 0;
    this.state.charging = !!s.charging?.active;
  }

  setRunning(on) {
    this.running = on;
    if (on) { this.lastFrame = 0; requestAnimationFrame(this.loop); }
  }

  async loadModel(file, rotDeg = 0) {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const url = URL.createObjectURL(file);
    try {
      const gltf = await new GLTFLoader().loadAsync(url);
      this.setCustomModel(gltf.scene, rotDeg);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  setCustomModel(obj, rotDeg = 0) {
    this.clearCustomModel();
    const wrap = new THREE.Group();
    obj.rotation.y = THREE.MathUtils.degToRad(rotDeg);
    wrap.add(obj);
    // Mise à l'échelle : la plus grande dimension horizontale devient ≈ 4,3 m
    const box = new THREE.Box3().setFromObject(wrap);
    const size = box.getSize(new THREE.Vector3());
    const scale = 4.3 / Math.max(size.x, size.z, 0.001);
    wrap.scale.setScalar(scale);
    const box2 = new THREE.Box3().setFromObject(wrap);
    const center = box2.getCenter(new THREE.Vector3());
    wrap.position.set(-center.x, -box2.min.y, -center.z);
    wrap.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.custom = wrap;
    this.car.visible = false;
    this.scene.add(wrap);
  }

  clearCustomModel() {
    if (!this.custom) return;
    this.scene.remove(this.custom);
    this.custom.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => { Object.values(m).forEach((v) => v && v.isTexture && v.dispose()); m.dispose(); });
    });
    this.custom = null;
    this.car.visible = true;
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Garde la voiture entière dans le cadre même sur un écran étroit
    this.camera.fov = w / h < 1.4 ? 36 : 28;
    this.camera.updateProjectionMatrix();
  }

  loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    if (document.hidden) return;
    const minDt = 1000 / (this.opts.fps || 60) - 1;
    if (this.lastFrame && now - this.lastFrame < minDt) return;
    const dt = this.lastFrame ? Math.min(0.1, (now - this.lastFrame) / 1000) : 0.016;
    this.lastFrame = now;

    // Transition de caméra douce
    if (this.tween) {
      this.tween.t = Math.min(1, this.tween.t + dt / 1.1);
      const e = 1 - Math.pow(1 - this.tween.t, 3);
      this.camera.position.lerpVectors(this.tween.from, this.tween.to, e);
      if (this.tween.t >= 1) this.tween = null;
    }
    this.controls.update(dt);

    // Roues
    this.wheelAngle -= ((this.state.speed / 3.6) * dt) / TIRE_R;
    for (const w of this.wheels) w.obj.rotation.z = w.side > 0 ? this.wheelAngle : -this.wheelAngle;

    // Feux : stop plus intense au freinage, phares plus forts de nuit
    const braking = this.state.accel < -1.2;
    this.tailMat.emissiveIntensity += ((braking ? 4 : 1.2) - this.tailMat.emissiveIntensity) * Math.min(1, dt * 10);
    this.headMat.emissiveIntensity = this.state.night ? 2.4 : 1.4;
    this.portMat.emissiveIntensity = this.state.charging ? 1.5 + Math.sin(now / 300) * 1.2 : 0;

    this.renderer.render(this.scene, this.camera);
  }
}
