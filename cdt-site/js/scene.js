// =====================================================================
// Scène WebGL (formation CDT) : une sculpture minérale qui se METAMORPHOSE à chaque
// chapitre (strates, cristal, facettes), un halo coloré, un fond
// en dégradé vivant qui suit la couleur du chapitre, et de la poussière
// lumineuse. Un clic envoie une onde dans la matière.
// Tout est procédural : aucun modèle 3D ni texture à télécharger.
// =====================================================================
import * as THREE from 'three';

// Bruit simplex 3D (Ashima Arts / Stefan Gustavson, licence MIT).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

// Palette BTP partagée : jaune chantier → orange sécurité → acier → béton → bleu plan (boucle)
const PALETTE = /* glsl */ `
vec3 pal(float t){
  t = fract(t) * 5.;
  vec3 c0=vec3(1.,.72,.05), c1=vec3(1.,.45,.12), c2=vec3(.55,.66,.78), c3=vec3(.88,.86,.82), c4=vec3(.24,.44,.74); // jaune chantier, orange sécurité, acier, béton, bleu plan
  if(t<1.) return mix(c0,c1,smoothstep(0.,1.,t));
  if(t<2.) return mix(c1,c2,smoothstep(1.,2.,t));
  if(t<3.) return mix(c2,c3,smoothstep(2.,3.,t));
  if(t<4.) return mix(c3,c4,smoothstep(3.,4.,t));
  return mix(c4,c0,smoothstep(4.,5.,t));
}`;

// Par chapitre : [x, y, échelle, rotation Y, forme (0 goutte, 1 fleur, 2 strates, 3 cristal), teinte]
// En lecture (modules), la sculpture se range dans la marge droite pour ne jamais gêner le texte.
const STATES_DESKTOP = [
  [1.55, 0.72, 0.78, 0.0, 2.6, 0.00],  // 0 accueil (haut droite, au-dessus du texte d'intro) : strates + facettes (architecture)
  [2.45, 0.35, 0.8, 1.2, 3, 0.12],    // 1 règle d'or, chiffres
  [2.95, 1.55, 0.36, 2.0, 2, 0.30],   // 2 niveaux (coin haut droit) (défilement horizontal)
  [2.9, -0.7, 0.42, 3.0, 3, 0.08],    // 3 jour 1 (lecture)
  [2.9, 0.75, 0.5, 4.0, 2, 0.55],     // 4 agents, chantier de nuit
  [2.9, -0.7, 0.42, 5.0, 3, 0.75],    // 5 jour 2 (lecture)
  [2.9, 0.7, 0.4, 6.0, 2, 0.4],       // 6 référence
  [2.0, 0.0, 1.0, 7.0, 2.6, 0.92],    // 7 final jaune chantier
  [1.7, -0.15, 0.9, 8.0, 3, 0.2],     // 8 ouverture de chapitre
];
const STATES_MOBILE = [
  [0.55, 2.05, 0.68, 0, 2.6, 0], [0.6, 2.1, 0.5, 1.2, 3, 0.12], [0.55, 2.2, 0.45, 2, 2, 0.3],
  [0.95, 2.75, 0.26, 3, 3, 0.08], [0.95, 2.75, 0.28, 4, 2, 0.55], [0.95, 2.75, 0.26, 5, 3, 0.75],
  [0.95, 2.75, 0.26, 6, 2, 0.4], [0.4, 1.95, 0.75, 7, 2.6, 0.92], [0.5, 1.7, 0.7, 8, 3, 0.2],
];

export function initScene(canvas, { reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null; // le CSS affiche un dégradé de repli (.no-webgl)
  }
  const isMobile = matchMedia('(max-width: 820px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uBg: { value: new THREE.Color('#f3efe7') },  // couleur du chapitre
    uDark: { value: 0 },                          // 1 sur un fond sombre
    uForm: { value: 0 },                          // forme interpolée (0..3)
    uShift: { value: 0 },                         // décalage de teinte
    uPulse: { value: 0 },                         // onde au clic
    uVelocity: { value: 0 },                      // vitesse de défilement
  };

  // ---------- 1. Fond : dégradé vivant teinté par le chapitre ----------
  const bgMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,.999,1.); }`,
      fragmentShader: /* glsl */ `
        precision highp float; varying vec2 vUv;
        uniform float uTime, uDark, uShift; uniform vec2 uMouse; uniform vec3 uBg;
        ${NOISE} ${PALETTE}
        void main(){
          vec2 p = vUv; float t = uTime*.035;
          float n1 = snoise(vec3(p*1.2 + uMouse*.04, t));
          float n2 = snoise(vec3(p*1.7 - 2.3, t*1.2));
          // taches de couleur douces qui dérivent (plus discrètes sur fond clair)
          float m1 = smoothstep(.0,.9,n1) * smoothstep(.95,.1,length(p-vec2(.78,.62)));
          float m2 = smoothstep(.1,.9,n2) * smoothstep(.9,.1,length(p-vec2(.2,.25)));
          vec3 a = pal(.05 + uShift + t*.3), b = pal(.55 + uShift - t*.2);
          float k = mix(.22, .26, uDark);
          vec3 col = uBg;
          col = mix(col, a, m1*k);
          col = mix(col, b, m2*k*.8);
          col *= mix(1., smoothstep(1.3,.2,length(p-.5))*.6+.4, uDark); // vignette la nuit seulement
          gl_FragColor = vec4(col, 1.);
        }`,
    })
  );
  bgMesh.renderOrder = -2;
  bgMesh.frustumCulled = false;
  scene.add(bgMesh);

  // ---------- 2. Sculpture nacrée métamorphe ----------
  const sculptMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime, uForm, uPulse, uVelocity; uniform vec2 uMouse;
      varying vec3 vNormal, vView; varying float vNoise;
      ${NOISE}
      float w(float i){ return max(0., 1. - abs(uForm - i)); } // poids de chaque forme
      float field(vec3 p){
        float t = uTime*.16;
        vec3 q = p + vec3(uMouse*.22, 0.);
        float d = snoise(q*.8 + t)*.26 + snoise(q*1.9 - t*1.3)*.07;
        float th = atan(p.z, p.x), ph = acos(clamp(p.y / length(p), -1., 1.));
        d += w(1.) * .32 * pow(abs(sin(th*5. + t*2.) * sin(ph*3.)), 1.6);       // fleur à pétales
        d += w(2.) * .13 * sin(ph*16. - t*6.) * (.6 + .4*sin(th*3. + t));        // anneaux plissés
        d += w(3.) * .38 * pow(abs(snoise(q*2.4 + t*.5)), 2.2);                   // cristal à pointes
        d += uPulse * .16 * sin(p.y*7. - uTime*9.);                               // onde du clic
        d += snoise(q*4.2 + t)*.02*(1. + uVelocity*4.);                           // frisson au défilement
        return d;
      }
      void main(){
        vec3 p = position; vec3 n = normalize(normal);
        float d = field(p);
        vec3 displaced = p + n*d;
        // normale recalculée par différences finies : éclairage juste sur la forme déformée
        vec3 up = abs(n.y) > .99 ? vec3(1.,0.,0.) : vec3(0.,1.,0.);
        vec3 tA = normalize(cross(n, up)), tB = normalize(cross(n, tA));
        float e = .012;
        vec3 pA = p + tA*e; pA += normalize(pA)*field(pA);
        vec3 pB = p + tB*e; pB += normalize(pB)*field(pB);
        vec3 nn = normalize(cross(pA - displaced, pB - displaced));
        if (dot(nn, n) < 0.) nn = -nn;
        vNoise = d;
        vec4 mv = modelViewMatrix * vec4(displaced, 1.);
        vNormal = normalize(normalMatrix * nn);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime, uShift, uDark;
      varying vec3 vNormal, vView; varying float vNoise;
      ${PALETTE}
      void main(){
        vec3 n = normalize(vNormal), v = normalize(vView);
        float ndv = clamp(dot(n, v), 0., 1.);
        float fres = pow(1. - ndv, 2.2);
        vec3 L1 = normalize(vec3(-.5,.9,.7)), L2 = normalize(vec3(.9,-.2,.5));
        float dif = max(dot(n, L1), 0.)*.7 + max(dot(n, L2), 0.)*.3;
        float spec = pow(max(dot(reflect(-L1, n), v), 0.), 60.) + pow(max(dot(reflect(-L2, n), v), 0.), 24.)*.3;
        vec3 irid = pal(ndv*1.1 + vNoise*1.6 + uTime*.02 + uShift);
        vec3 irid2 = pal(ndv*.6 - vNoise + uShift + .4);
        // corps nacré clair + reflets irisés + liseré saturé (lisible sur fond clair comme sombre)
        vec3 pearl = mix(vec3(.97,.95,.93), irid, .5);
        vec3 col = pearl * (.42 + .7*dif);
        col += irid2 * fres * .55;
        col = mix(col, irid * .62, pow(1. - ndv, 4.) * .7);
        col += vec3(1.) * spec * .85;
        col *= mix(1., 1.08, uDark);
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const detail = isMobile ? 48 : 80;
  const sculpt = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, detail), sculptMat);

  // Halo coloré derrière la sculpture
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */ `
        precision highp float; varying vec2 vUv; uniform float uTime, uShift, uDark; ${PALETTE}
        void main(){
          float d = length(vUv-.5)*2.;
          float a = smoothstep(1., 0., d); a *= a;
          vec3 c = pal(uShift + .1 + uTime*.01 + atan(vUv.y-.5, vUv.x-.5)*.08);
          gl_FragColor = vec4(c, a * mix(.32, .45, uDark));
        }`,
    })
  );
  halo.position.z = -1.6;

  const pivot = new THREE.Group();
  pivot.add(halo, sculpt);
  scene.add(pivot);

  // ---------- 3. Poussière lumineuse ----------
  const COUNT = isMobile ? 220 : 600;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 0.5;
    seed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const dustUniforms = { uPR: { value: renderer.getPixelRatio() }, uScroll: { value: 0 } };
  const dust = new THREE.Points(pGeo, new THREE.ShaderMaterial({
    uniforms: { ...uniforms, ...dustUniforms },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime, uPR, uScroll; attribute float aSeed; varying float vA, vS;
      void main(){
        vec3 p = position;
        // montée lente + entraînement par le défilement, en boucle sur 9 unités
        p.y = mod(position.y + uTime*.05*(.3+aSeed) + uScroll*.6*(.5+aSeed) + 4.5, 9.) - 4.5;
        p.x += sin(uTime*.3 + aSeed*20.)*.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.5 + aSeed*3.) * uPR * (6. / -mv.z);
        vA = .25 + .5*aSeed; vS = aSeed;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float; varying float vA, vS; uniform float uDark, uShift; ${PALETTE}
      void main(){
        float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,d)*vA;
        vec3 c = mix(pal(vS + uShift)*.85, vec3(1.), uDark*.5);
        gl_FragColor = vec4(c, a * mix(.7, 1., uDark));
      }`,
  }));
  scene.add(dust);

  // ---------- Redimensionnement ----------
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1 ? 9.5 : 7;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  // ---------- État animé (interpolé à chaque image) ----------
  const states = isMobile ? STATES_MOBILE : STATES_DESKTOP;
  const s0 = states[0];
  const target = { x: s0[0], y: s0[1], s: s0[2], r: s0[3], form: s0[4], shift: s0[5], dark: 0 };
  const cur = { ...target, s: 0.001 }; // la sculpture « éclot » après le chargement
  const bgTarget = new THREE.Color('#f3efe7');
  const mouse = new THREE.Vector2(), mouseSm = new THREE.Vector2();
  addEventListener('pointermove', (e) => {
    mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  });
  if (!reducedMotion) addEventListener('pointerdown', () => { uniforms.uPulse.value = 1; });

  let running = true, started = false, scrollY = 0, velocity = 0, boost = false, spin = 0;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); loop(); } });

  const clock = new THREE.Clock();
  const speed = reducedMotion ? 0.25 : 1;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const k = 1 - Math.exp(-dt * 2.6);   // lissage indépendant du taux de rafraîchissement
    uniforms.uTime.value += dt * speed;

    mouseSm.lerp(mouse, 1 - Math.exp(-dt * 2.5));
    uniforms.uMouse.value.copy(mouseSm);

    for (const key of ['x', 'y', 'r', 'form', 'shift', 'dark']) cur[key] += (target[key] - cur[key]) * k;
    if (started) cur.s += (target.s - cur.s) * (1 - Math.exp(-dt * 2.2));
    uniforms.uForm.value = cur.form;
    uniforms.uShift.value = cur.shift;
    uniforms.uDark.value = cur.dark;
    uniforms.uBg.value.lerp(bgTarget, k);
    uniforms.uPulse.value *= Math.exp(-dt * 1.6);
    uniforms.uVelocity.value += (Math.min(Math.abs(velocity) / 40, 1) - uniforms.uVelocity.value) * k;
    dustUniforms.uScroll.value = scrollY / innerHeight;

    const t = uniforms.uTime.value;
    pivot.position.set(cur.x + mouseSm.x * 0.12, cur.y + mouseSm.y * 0.08 + Math.sin(t * 0.6) * 0.06, 0);
    pivot.scale.setScalar(cur.s);
    if (boost) spin += Math.max(-60, Math.min(60, velocity)) * dt * 0.035; // version « + » : tourne avec le défilement
    sculpt.rotation.y = cur.r + t * 0.06 + mouseSm.x * 0.3 + spin;
    sculpt.rotation.x = -mouseSm.y * 0.25 + Math.sin(t * 0.2) * 0.08;
    camera.position.x = mouseSm.x * 0.15;
    camera.position.y = mouseSm.y * 0.1;
    camera.lookAt(0, 0, 0);
    halo.lookAt(camera.position);

    renderer.render(scene, camera);
  }
  loop();

  return {
    reveal() { started = true; },
    setSection(i) {
      const s = states[Math.max(0, Math.min(states.length - 1, i))];
      [target.x, target.y, target.s, target.r, target.form, target.shift] = s;
    },
    setTheme(bg, dark) { bgTarget.set(bg); target.dark = dark ? 1 : 0; },
    setHue(h) { target.shift = h; },
    resetHue(i) { target.shift = states[i][5]; },
    setScroll(y, v) { scrollY = y; velocity = v; },
    setBoost(on) { boost = on; },
  };
}
