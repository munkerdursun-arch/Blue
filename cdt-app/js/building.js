// =====================================================================
// « Le chantier qui se construit » : un immeuble 3D procédural qui sort
// de terre au fil du défilement. D'abord le trait (comme un plan), puis
// la matière : fondations, poteaux, dalles, façades vitrées, garde-corps.
// Une grue à tour pivote et monte les éléments. À la fin, les fenêtres
// s'allument : le chantier est livré.
// Aucun modèle à télécharger : tout est construit en code.
// =====================================================================
import * as THREE from 'three';

const FLOORS = 7;
const W = 6.4, D = 4.4, H = 0.95;           // emprise et hauteur d'étage
const COLS_X = 5, COLS_Z = 3;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

export function initBuilding(canvas, { reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const mobile = matchMedia('(max-width: 820px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  // ---------- lumières ----------
  const hemi = new THREE.HemisphereLight(0xfff8ee, 0xb8b2a6, 1.15);
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(8, 14, 6);
  const fill = new THREE.DirectionalLight(0xdfe8f2, 0.5);
  fill.position.set(-10, 6, -8);
  scene.add(hemi, sun, fill);

  // ---------- matériaux ----------
  const M = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xd9d3c7, roughness: 0.92, metalness: 0 }),
    slab: new THREE.MeshStandardMaterial({ color: 0xcdc6b8, roughness: 0.9 }),
    column: new THREE.MeshStandardMaterial({ color: 0xbfb7a8, roughness: 0.85 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9db4c8, roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.62, emissive: 0xffb54a, emissiveIntensity: 0 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.6, metalness: 0.4 }),
    crane: new THREE.MeshStandardMaterial({ color: 0xffb000, roughness: 0.55, metalness: 0.2 }),
    craneDark: new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.6 }),
    rail: new THREE.MeshStandardMaterial({ color: 0xffb000, roughness: 0.6 }),
    ground: new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 1 }),
  };
  const lineMat = new THREE.LineBasicMaterial({ color: 0x15181c, transparent: true, opacity: 0.55 });
  const gridMat = new THREE.LineBasicMaterial({ color: 0x15181c, transparent: true, opacity: 0.08 });

  const root = new THREE.Group();
  scene.add(root);

  // ---------- sol : trame de plan + emprise du chantier ----------
  const grid = [];
  for (let i = -20; i <= 20; i++) { grid.push(-20, 0, i, 20, 0, i, i, 0, -20, i, 0, 20); }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3));
  root.add(new THREE.LineSegments(gridGeo, gridMat));
  // ombre de contact douce (dégradé radial dessiné dans un canvas)
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    r.addColorStop(0, 'rgba(20,22,26,0.32)'); r.addColorStop(1, 'rgba(20,22,26,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 2.4, D * 2.8), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002;
  root.add(shadow);
  // emprise pointillée jaune
  const site = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 3.2, 0.001, D + 3.2)),
    new THREE.LineDashedMaterial({ color: 0xffb000, dashSize: 0.3, gapSize: 0.2 }),
  );
  site.computeLineDistances(); site.position.y = 0.01;
  root.add(site);

  // ---------- éléments à construire ----------
  // chaque pièce a une fenêtre d'apparition [t0, t1] dans la progression 0 → 1
  const parts = [];
  function addPart(geo, mat, pos, t0, dur = 0.05, { grow = 'y', edges = true } = {}) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    const group = new THREE.Group();
    group.position.copy(pos);
    mesh.position.set(0, 0, 0);
    // pivot en bas pour pousser vers le haut
    geo.computeBoundingBox();
    const h = geo.boundingBox.max.y - geo.boundingBox.min.y;
    if (grow === 'y') { mesh.position.y = h / 2; group.position.y -= h / 2; }
    group.add(mesh);
    let line = null;
    if (edges) {
      line = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat.clone());
      line.position.copy(mesh.position);
      group.add(line);
    }
    group.visible = false;
    root.add(group);
    parts.push({ group, mesh, line, t0, dur, grow });
    return group;
  }

  // fondations
  addPart(new THREE.BoxGeometry(W + 0.6, 0.35, D + 0.6), M.concrete, new THREE.Vector3(0, 0, 0), 0.0, 0.06);
  const colGeo = new THREE.BoxGeometry(0.2, H - 0.12, 0.2);
  const slabGeo = new THREE.BoxGeometry(W + 0.2, 0.14, D + 0.2);
  const glassGeoX = new THREE.BoxGeometry(W / (COLS_X - 1) - 0.06, H - 0.2, 0.04);
  const glassGeoZ = new THREE.BoxGeometry(0.04, H - 0.2, D / (COLS_Z - 1) - 0.06);
  const railGeoX = new THREE.BoxGeometry(W + 0.2, 0.05, 0.05);
  const railGeoZ = new THREE.BoxGeometry(0.05, 0.05, D + 0.2);
  const glassMeshes = [];

  const floorSpan = 0.62 / FLOORS; // les étages se montent entre 0.06 et 0.68
  for (let f = 0; f < FLOORS; f++) {
    const base = 0.35 + f * H;
    const t = 0.06 + f * floorSpan;
    // poteaux
    for (let i = 0; i < COLS_X; i++) for (let j = 0; j < COLS_Z; j++) {
      const x = -W / 2 + (i * W) / (COLS_X - 1), z = -D / 2 + (j * D) / (COLS_Z - 1);
      addPart(colGeo, M.column, new THREE.Vector3(x, base + (H - 0.12) / 2, z), t + (i + j) * 0.004, 0.035);
    }
    // dalle
    addPart(slabGeo, M.slab, new THREE.Vector3(0, base + H - 0.12 + 0.07, 0), t + floorSpan * 0.55, 0.04);
    // façades vitrées (plus tard : 0.62 → 0.86)
    const tg = 0.62 + f * 0.03;
    for (let i = 0; i < COLS_X - 1; i++) {
      const x = -W / 2 + ((i + 0.5) * W) / (COLS_X - 1);
      for (const z of [-D / 2, D / 2]) glassMeshes.push(addPart(glassGeoX, M.glass, new THREE.Vector3(x, base + H / 2 - 0.02, z), tg + i * 0.004, 0.04, { edges: false }));
    }
    for (let j = 0; j < COLS_Z - 1; j++) {
      const z = -D / 2 + ((j + 0.5) * D) / (COLS_Z - 1);
      for (const x of [-W / 2, W / 2]) glassMeshes.push(addPart(glassGeoZ, M.glass, new THREE.Vector3(x, base + H / 2 - 0.02, z), tg + j * 0.004, 0.04, { edges: false }));
    }
  }
  // garde-corps jaunes sur la toiture-terrasse
  const roofY = 0.35 + FLOORS * H + 0.05;
  addPart(railGeoX, M.rail, new THREE.Vector3(0, roofY + 0.4, -D / 2 - 0.05), 0.86, 0.04);
  addPart(railGeoX, M.rail, new THREE.Vector3(0, roofY + 0.4, D / 2 + 0.05), 0.87, 0.04);
  addPart(railGeoZ, M.rail, new THREE.Vector3(-W / 2 - 0.05, roofY + 0.4, 0), 0.88, 0.04);
  addPart(railGeoZ, M.rail, new THREE.Vector3(W / 2 + 0.05, roofY + 0.4, 0), 0.89, 0.04);
  // édicule technique
  addPart(new THREE.BoxGeometry(1.6, 0.7, 1.2), M.concrete, new THREE.Vector3(1.4, roofY + 0.35, 0.6), 0.9, 0.05);

  // ---------- grue à tour ----------
  const crane = new THREE.Group();
  crane.position.set(W / 2 + 2.4, 0, -D / 2 - 1.6); // derrière, côté droit : jamais devant le texte
  root.add(crane);
  const MAST_H = 0.35 + FLOORS * H + 3.2;
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.42, MAST_H, 0.42), M.crane);
  mast.position.y = MAST_H / 2;
  const mastLines = new THREE.LineSegments(new THREE.EdgesGeometry(mast.geometry), new THREE.LineBasicMaterial({ color: 0x15181c, transparent: true, opacity: 0.35 }));
  mastLines.position.copy(mast.position);
  // croisillons du treillis
  const lattice = [];
  for (let y = 0; y < MAST_H; y += 0.5) {
    lattice.push(-0.21, y, 0.215, 0.21, y + 0.5, 0.215, 0.21, y, 0.215, -0.21, y + 0.5, 0.215);
    lattice.push(0.215, y, -0.21, 0.215, y + 0.5, 0.21, -0.215, y, 0.21, -0.215, y + 0.5, -0.21);
  }
  const latGeo = new THREE.BufferGeometry(); latGeo.setAttribute('position', new THREE.Float32BufferAttribute(lattice, 3));
  const latLines = new THREE.LineSegments(latGeo, new THREE.LineBasicMaterial({ color: 0x15181c, transparent: true, opacity: 0.45 }));
  const slew = new THREE.Group(); slew.position.y = MAST_H;
  const jib = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.32, 0.32), M.crane); jib.position.x = 4.2;
  const cjib = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 0.32), M.crane); cjib.position.x = -1.6;
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), M.craneDark); counter.position.set(-2.7, -0.3, 0);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.55), M.craneDark); cab.position.set(0.5, -0.4, 0.4);
  const apex = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.4, 4), M.crane); apex.position.y = 0.85; apex.rotation.y = Math.PI / 4;
  const trolley = new THREE.Group(); trolley.position.x = 5;
  const cableGeo = new THREE.BufferGeometry(); cableGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, -3, 0], 3));
  const cable = new THREE.Line(cableGeo, new THREE.LineBasicMaterial({ color: 0x15181c }));
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.22), M.craneDark);
  const load = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.24), M.column); // poutre en levage
  trolley.add(cable, hook, load);
  slew.add(jib, cjib, counter, cab, apex, trolley);
  // tirants du haut de la tour vers les flèches
  const tieGeo = new THREE.BufferGeometry(); tieGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.5, 0, 8.8, 0.16, 0, 0, 1.5, 0, -3, 0.15, 0], 3));
  slew.add(new THREE.LineSegments(tieGeo, new THREE.LineBasicMaterial({ color: 0x15181c, transparent: true, opacity: 0.6 })));
  crane.add(mast, mastLines, latLines, slew);
  crane.traverse((o) => { if (o.isMesh) o.userData.baseY = o.position.y; });

  // ---------- poussière de chantier ----------
  const N = mobile ? 120 : 260;
  const dust = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { dust[i * 3] = (Math.random() - 0.5) * 22; dust[i * 3 + 1] = Math.random() * 10; dust[i * 3 + 2] = (Math.random() - 0.5) * 22; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xb8a98c, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false }));
  root.add(dustPts);

  // ---------- caméra et cadrage ----------
  let shift = mobile ? 0 : 0.3;  // part de l'écran : l'immeuble se décale à droite pour laisser le texte
  let shiftT = shift;
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  // ---------- état ----------
  let progress = 0, progressT = 0;     // construction 0 → 1
  let lights = 0, lightsT = 0;         // fenêtres allumées 0 → 1
  let orbit = 0, orbitT = 0;           // angle de vue lié au défilement
  let dim = 0, dimT = 0;               // atténuation (vues de l'espace connecté)
  const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
  addEventListener('pointermove', (e) => mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1));

  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); loop(); } });
  const clock = new THREE.Clock();
  let time = 0;

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    time += dt * (reducedMotion ? 0.3 : 1);
    const k = 1 - Math.exp(-dt * 3.2);
    progress += (progressT - progress) * k;
    lights += (lightsT - lights) * k;
    orbit += (orbitT - orbit) * (1 - Math.exp(-dt * 2));
    dim += (dimT - dim) * k;
    shift += (shiftT - shift) * (1 - Math.exp(-dt * 2.4));
    mouseS.lerp(mouse, 1 - Math.exp(-dt * 2.5));

    // pièces : trait d'abord, puis matière qui pousse
    for (const p of parts) {
      const local = clamp01((progress - p.t0) / p.dur);
      const pre = clamp01((progress - (p.t0 - 0.03)) / 0.03);   // le trait apparaît juste avant
      p.group.visible = pre > 0.001;
      if (!p.group.visible) continue;
      const e = easeOut(local);
      p.mesh.scale.y = Math.max(0.0001, e);
      p.mesh.position.y = p.grow === 'y' ? (p.mesh.geometry.boundingBox.max.y - p.mesh.geometry.boundingBox.min.y) * e / 2 : 0;
      p.mesh.visible = local > 0.001;
      if (p.line) {
        p.line.material.opacity = 0.55 * pre * (1 - 0.6 * e);
        p.line.scale.y = 1; p.line.position.y = p.mesh.geometry.boundingBox.max.y;
      }
    }
    // fenêtres qui s'allument
    M.glass.emissiveIntensity = lights * 0.9;
    M.glass.opacity = 0.62 + lights * 0.2;

    // grue : rotation lente + chariot et crochet qui suivent l'étage en cours
    const level = 0.35 + Math.min(FLOORS, progress / 0.09) * H;
    slew.rotation.y = -0.35 + Math.sin(time * 0.18) * 0.5 + progress * 1.2;
    trolley.position.x = 3.2 + Math.sin(time * 0.3) * 1.6;
    const drop = Math.max(0.6, MAST_H - level - 1.2 + Math.sin(time * 0.5) * 0.4);
    cable.geometry.attributes.position.setY(1, -drop); cable.geometry.attributes.position.needsUpdate = true;
    hook.position.y = -drop - 0.14; load.position.y = -drop - 0.4;
    load.visible = progress < 0.92;

    // poussière qui flotte
    const pos = dustGeo.attributes.position;
    for (let i = 0; i < N; i++) { let y = pos.getY(i) + dt * 0.12; if (y > 10) y = 0; pos.setY(i, y); }
    pos.needsUpdate = true;
    dustPts.material.opacity = 0.5 * (1 - lights);

    // caméra : orbite selon le défilement, parallaxe selon la souris
    const height = 0.35 + Math.min(progress / 0.68, 1) * FLOORS * H;
    const ang = -0.75 + orbit * 1.4 + mouseS.x * 0.12;
    const radius = mobile ? 30 : 27;
    camera.position.set(Math.sin(ang) * radius, 6.5 + orbit * 5 + mouseS.y * 0.6, Math.cos(ang) * radius);
    camera.lookAt(0, height * 0.45 + 1, 0);
    // décalage de cadrage (immeuble à droite du texte)
    const w = innerWidth, h = innerHeight;
    camera.setViewOffset(w, h, -shift * w, mobile ? h * 0.12 : 0, w, h);

    renderer.domElement.style.opacity = String(1 - dim * 0.75);
    renderer.render(scene, camera);
  }
  loop();

  return {
    setProgress(p) { progressT = clamp01(p); },
    setLights(v) { lightsT = clamp01(v); },
    setOrbit(v) { orbitT = v; },
    setShift(v) { shiftT = mobile ? 0 : v; },
    setDim(v) { dimT = clamp01(v); },
  };
}
