// =====================================================================
// Scène WebGL : une sculpture organique irisée, une aurore en fond
// et des particules qui flottent. La sculpture change de place selon
// la section visible (comme l'animal 3D de Dogstudio).
// Tout est procédural : aucun modèle 3D ni texture à télécharger.
// =====================================================================
import * as THREE from 'three';

// Bruit simplex 3D (Ashima Arts / Stefan Gustavson, licence MIT), partagé par les shaders.
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

// Positions de la sculpture pour chaque section : [x, y, échelle, rotation Y]
const STATES_DESKTOP = [
  [1.6, -0.05, 1.05, 0.0],   // hero : à droite du titre
  [2.3, 0.2, 0.75, 1.2],     // manifeste : à droite, le texte occupe la gauche
  [1.4, 0.0, 1.1, 2.4],      // projets : en retrait et assombri, le texte prime
  [-2.2, 0.9, 0.55, 3.4],    // expertises : petit, en haut à gauche
  [0.0, -1.3, 0.7, 4.4],     // chiffres : sous les nombres
  [2.1, 0.0, 0.95, 5.6],     // contact : à droite du grand titre
];
const STATES_MOBILE = [
  [0.5, 1.3, 0.8, 0], [0.6, 2.0, 0.55, 1.2], [0.3, 0.0, 0.85, 2.4],
  [0.5, 2.2, 0.5, 3.4], [0.0, -1.9, 0.6, 4.4], [0.4, 1.9, 0.7, 5.6],
];

export function initScene(canvas, { reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null; // le CSS affiche un dégradé de repli (.no-webgl)
  }
  const isMobile = matchMedia('(max-width: 820px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x0e0f14, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  const uniforms = {
    uTime: { value: 0 },
    uHue: { value: 0 },          // décalage de teinte (survol des projets)
    uMouse: { value: new THREE.Vector2() },
    uDim: { value: 0 },          // assombrit la sculpture quand le texte doit dominer
    uVelocity: { value: 0 },     // vitesse de défilement : agite la surface
  };

  // ---------- 1. Aurore de fond (plan plein écran) ----------
  const aurora = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,.999,1.); }`,
      fragmentShader: /* glsl */ `
        precision highp float; varying vec2 vUv; uniform float uTime, uHue; uniform vec2 uMouse;
        ${NOISE}
        void main(){
          vec2 p = vUv; float t = uTime*.04;
          float n1 = snoise(vec3(p*1.4 + uMouse*.05, t));
          float n2 = snoise(vec3(p*2.2 - 3., t*1.3));
          vec3 base = vec3(.055,.058,.078);
          vec3 c1 = vec3(.16,.13,.42);   // indigo
          vec3 c2 = vec3(.05,.30,.36);   // bleu canard
          vec3 c3 = vec3(.42,.10,.30);   // prune
          float m1 = smoothstep(.15,.9,n1) * smoothstep(1.1,.2,length(p-vec2(.25,.75)));
          float m2 = smoothstep(.2,.9,n2) * smoothstep(1.,.1,length(p-vec2(.55,.85)));
          float m3 = smoothstep(.3,1.,n1*n2+.3) * smoothstep(.9,.0,length(p-vec2(.15,.35)));
          vec3 col = base + c1*m1*.55 + c2*m2*.45 + c3*m3*.25;
          // rotation de teinte simple pilotée par uHue
          float a = uHue; mat3 rot = mat3(
            .299+.701*cos(a)+.168*sin(a), .587-.587*cos(a)+.330*sin(a), .114-.114*cos(a)-.497*sin(a),
            .299-.299*cos(a)-.328*sin(a), .587+.413*cos(a)+.035*sin(a), .114-.114*cos(a)+.292*sin(a),
            .299-.300*cos(a)+1.25*sin(a), .587-.588*cos(a)-1.05*sin(a), .114+.886*cos(a)-.203*sin(a));
          col = mix(col, rot*col, step(.001, abs(a)));
          float vig = smoothstep(1.25,.25,length(p-.5));
          gl_FragColor = vec4(col*vig + base*(1.-vig)*.6, 1.);
        }`,
    })
  );
  aurora.renderOrder = -1;
  aurora.frustumCulled = false;
  scene.add(aurora);

  // ---------- 2. Sculpture irisée ----------
  const sculptMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime, uVelocity; uniform vec2 uMouse;
      varying vec3 vNormal, vView; varying float vNoise;
      ${NOISE}
      float field(vec3 p){
        float t = uTime*.18;
        return snoise(p*.8 + t)*.34 + snoise(p*1.9 - t*1.4)*.09 + snoise(p*4.2 + t)*.02*(1.+uVelocity*4.);
      }
      void main(){
        vec3 p = position; vec3 n = normalize(normal);
        float d = field(p + vec3(uMouse*.25, 0.));
        vec3 displaced = p + n*d;
        // normale recalculée par différences finies (éclairage correct sur la surface déformée)
        vec3 up = abs(n.y) > .99 ? vec3(1.,0.,0.) : vec3(0.,1.,0.);
        vec3 tA = normalize(cross(n, up)); vec3 tB = normalize(cross(n, tA));
        float e = .01;
        vec3 pA = p + tA*e; pA += normalize(pA)*field(pA + vec3(uMouse*.25,0.));
        vec3 pB = p + tB*e; pB += normalize(pB)*field(pB + vec3(uMouse*.25,0.));
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
      uniform float uTime, uHue, uDim;
      varying vec3 vNormal, vView; varying float vNoise;
      // dégradé irisé en boucle : indigo → violet → bleu canard → rose → indigo
      vec3 pal(float t){
        t = fract(t + uHue/6.28318) * 4.;
        vec3 c0 = vec3(.22,.28,.95), c1 = vec3(.58,.32,.98), c2 = vec3(.16,.78,.86), c3 = vec3(.95,.42,.72);
        if (t < 1.) return mix(c0, c1, smoothstep(0.,1.,t));
        if (t < 2.) return mix(c1, c2, smoothstep(1.,2.,t));
        if (t < 3.) return mix(c2, c3, smoothstep(2.,3.,t));
        return mix(c3, c0, smoothstep(3.,4.,t));
      }
      void main(){
        vec3 n = normalize(vNormal); vec3 v = normalize(vView);
        float ndv = clamp(dot(n, v), 0., 1.);
        float fres = pow(1. - ndv, 2.6);
        vec3 L1 = normalize(vec3(-.6,.8,.6)), L2 = normalize(vec3(.8,-.3,.4));
        float dif = max(dot(n, L1), 0.)*.55 + max(dot(n, L2), 0.)*.25;
        float spec = pow(max(dot(reflect(-L1, n), v), 0.), 48.);
        vec3 irid = pal(ndv*.9 + vNoise*1.4 + uTime*.015);
        vec3 body = vec3(.07,.075,.11) + irid*dif*.55;
        vec3 col = body + irid*fres*1.15 + vec3(spec)*.6;
        col += vec3(.9,.25,.22)*pow(fres, 7.)*.25;  // liseré chaud, rappel de l'accent rouge
        col = mix(col, col*.25, uDim);
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const detail = isMobile ? 40 : 72;
  const sculpt = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, detail), sculptMat);
  const pivot = new THREE.Group();
  pivot.add(sculpt);
  scene.add(pivot);

  // ---------- 3. Particules (« pollen » lumineux) ----------
  const COUNT = isMobile ? 260 : 700;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    seed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const particles = new THREE.Points(pGeo, new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uPR: { value: renderer.getPixelRatio() }, uScroll: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime, uPR, uScroll; attribute float aSeed; varying float vA;
      void main(){
        vec3 p = position;
        // montée lente + entraînement par le défilement, en boucle sur 9 unités
        p.y = mod(position.y + uTime*.05*(.3+aSeed) + uScroll*.6*(.5+aSeed) + 4.5, 9.) - 4.5;
        p.x += sin(uTime*.3 + aSeed*20.)*.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.5 + aSeed*3.5) * uPR * (6. / -mv.z);
        vA = .25 + .55*aSeed;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float; varying float vA;
      void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,d)*vA; gl_FragColor = vec4(vec3(.75,.78,1.)*a, a); }`,
  }));
  scene.add(particles);

  // ---------- Redimensionnement ----------
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // garde la sculpture lisible quel que soit le format d'écran
    camera.position.z = w / h < 1 ? 9.5 : 7;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  // ---------- État animé (interpolé à chaque image) ----------
  const states = isMobile ? STATES_MOBILE : STATES_DESKTOP;
  const target = { x: states[0][0], y: states[0][1], s: states[0][2], r: 0, dim: 0, hue: 0 };
  const cur = { ...target, s: 0.001 }; // départ minuscule : la sculpture « éclot » après le chargement
  const mouse = new THREE.Vector2(), mouseSm = new THREE.Vector2();
  addEventListener('pointermove', (e) => {
    mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  });

  let running = true, started = false, scrollY = 0, velocity = 0;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) loop(); });

  const clock = new THREE.Clock();
  const speed = reducedMotion ? 0.25 : 1;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const k = 1 - Math.exp(-dt * 3);     // lissage indépendant du taux de rafraîchissement
    uniforms.uTime.value += dt * speed;

    mouseSm.lerp(mouse, 1 - Math.exp(-dt * 2.5));
    uniforms.uMouse.value.copy(mouseSm);

    for (const key of ['x', 'y', 'r', 'dim', 'hue']) cur[key] += (target[key] - cur[key]) * k;
    if (started) cur.s += (target.s - cur.s) * (1 - Math.exp(-dt * 2));
    uniforms.uDim.value = cur.dim;
    uniforms.uHue.value = cur.hue;
    uniforms.uVelocity.value += (Math.min(Math.abs(velocity) / 40, 1) - uniforms.uVelocity.value) * k;
    particles.material.uniforms.uScroll.value = scrollY / innerHeight;

    pivot.position.set(cur.x + mouseSm.x * 0.12, cur.y + mouseSm.y * 0.08, 0);
    pivot.scale.setScalar(cur.s);
    sculpt.rotation.y = cur.r + uniforms.uTime.value * 0.05 + mouseSm.x * 0.25;
    sculpt.rotation.x = -mouseSm.y * 0.2 + Math.sin(uniforms.uTime.value * 0.2) * 0.08;
    camera.position.x = mouseSm.x * 0.15;
    camera.position.y = mouseSm.y * 0.1;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  loop();

  return {
    reveal() { started = true; },
    setSection(i) {
      const s = states[Math.max(0, Math.min(states.length - 1, i))];
      target.x = s[0]; target.y = s[1]; target.s = s[2]; target.r = s[3];
      target.dim = i === 2 ? 0.7 : 0; // section projets : le texte prime
    },
    setHue(h) { target.hue = h; },
    setScroll(y, v) { scrollY = y; velocity = v; },
  };
}
