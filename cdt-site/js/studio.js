// =====================================================================
// Conducteur de travaux augmenté — couche « studio premium »
// Préchargeur à double rideau, défilement fluide (Lenis), ambiance par
// chapitre, sculpture WebGL, titres animés, niveaux en défilement
// horizontal, chaînes d'agents qui s'allument, curseur, ruban de couleur,
// sommaire plein écran et repère du module en cours.
// gsap / ScrollTrigger / Lenis sont chargés en scripts classiques.
// Les outils interactifs (agents, quiz, gains…) sont dans app.js.
// =====================================================================
import { initScene } from './scene.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const PLUS = window.CDT_MODE === 'plus';
const EASE_OUT = 'expo.out';
const EASE_IO = 'power4.inOut';
const PALETTE = ['#ffb000', '#ff7a1a', '#8fa7c0', '#d9d4ca', '#3d6fb8'];

// ---------- Mouvement réduit : on respecte le système, avec possibilité d'activer ----------
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let forcedMotion = false;
try { forcedMotion = localStorage.getItem('cdt-motion') === 'on'; } catch { /* stockage indisponible */ }
const reduced = prefersReduced && !forcedMotion;
document.documentElement.classList.toggle('reduced', reduced);
if (reduced) {
  const note = document.createElement('div');
  note.className = 'motion-note';
  note.setAttribute('role', 'status');
  note.innerHTML = '<p>Votre appareil demande de <b>réduire les animations</b> : la plupart sont désactivées.</p><button type="button">Activer les animations</button>';
  note.querySelector('button').addEventListener('click', () => {
    try { localStorage.setItem('cdt-motion', 'on'); } catch { /* ignoré */ }
    location.reload();
  });
  document.body.appendChild(note);
}

// ---------- Ambiances des chapitres ----------
const THEMES = {
  beton: { '--bg': '#f2f0eb', '--ink': '#15181c', '--ink-dim': '#5f666e', '--ink-faint': '#c9c6bf', '--line': 'rgba(21,24,28,0.12)', '--accent': '#c2410c', '--card': 'rgba(255,255,255,0.72)', '--code-bg': '#15191e', dark: false },
  sable: { '--bg': '#efe6d6', '--ink': '#1b1610', '--ink-dim': '#6f6254', '--ink-faint': '#d6c7b2', '--line': 'rgba(27,22,16,0.13)', '--accent': '#b03f0a', '--card': 'rgba(255,252,246,0.7)', '--code-bg': '#1b1712', dark: false },
  nuit: { '--bg': '#14181d', '--ink': '#eef0f2', '--ink-dim': '#9aa3ad', '--ink-faint': '#333b45', '--line': 'rgba(238,240,242,0.13)', '--accent': '#ffb000', '--card': 'rgba(255,255,255,0.045)', '--code-bg': '#0c0f13', dark: true },
  acier: { '--bg': '#e3e8ec', '--ink': '#121820', '--ink-dim': '#566270', '--ink-faint': '#c3cbd3', '--line': 'rgba(18,24,32,0.12)', '--accent': '#b03f0a', '--card': 'rgba(255,255,255,0.7)', '--code-bg': '#121820', dark: false },
  jaune: { '--bg': '#ffb000', '--ink': '#15181c', '--ink-dim': 'rgba(21,24,28,0.7)', '--ink-faint': 'rgba(21,24,28,0.28)', '--line': 'rgba(21,24,28,0.22)', '--accent': '#15181c', '--card': 'rgba(255,255,255,0.25)', '--code-bg': '#15191e', dark: false },
};
const metaTheme = $('meta[name="theme-color"]');
let currentTheme = '';
function applyTheme(name, instant = false) {
  const t = THEMES[name];
  if (!t || name === currentTheme) return;
  currentTheme = name;
  const vars = Object.fromEntries(Object.entries(t).filter(([k]) => k.startsWith('--')));
  gsap.to(document.documentElement, { ...vars, duration: instant || reduced ? 0 : 0.9, ease: 'power2.inOut', overwrite: true });
  scene?.setTheme(t['--bg'], t.dark);
  metaTheme?.setAttribute('content', t['--bg']);
}

// ---------- Scène WebGL ----------
const scene = initScene($('.webgl'), { reducedMotion: reduced });
if (!scene) document.documentElement.classList.add('no-webgl');

// ---------- Défilement fluide ----------
const lenis = reduced ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, touchMultiplier: 1.3 });
const scrollListeners = [];
const onScroll = (fn) => scrollListeners.push(fn);
if (lenis) {
  lenis.on('scroll', (e) => { ScrollTrigger.update(); scrollListeners.forEach((fn) => fn(e.scroll, e.velocity)); });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
} else {
  addEventListener('scroll', () => scrollListeners.forEach((fn) => fn(scrollY, 0)), { passive: true });
}
onScroll((y, v) => scene?.setScroll(y, v));
const scrollToTarget = (el) => {
  if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
};

// barre de progression + en-tête qui se range quand on lit vers le bas
const setProgress = gsap.quickSetter('.progress', 'scaleX');
const header = $('.header');
let lastY = 0;
onScroll((y) => {
  setProgress(y / Math.max(1, document.documentElement.scrollHeight - innerHeight));
  header.classList.toggle('is-scrolled', y > 40);
  const down = y > lastY + 4, up = y < lastY - 4;
  if (y > innerHeight && down && !document.body.classList.contains('menu-open')) header.classList.add('is-hidden');
  else if (up || y < innerHeight) header.classList.remove('is-hidden');
  lastY = y;
});

// ---------- Découpage du texte ----------
function splitChars(root) {
  root.setAttribute('aria-label', root.textContent.replace(/\s+/g, ' ').trim());
  $$('.line', root).forEach((line) => {
    const walk = (node, out) => {
      node.childNodes.forEach((c) => {
        if (c.nodeType === 3) {
          // chaque mot est regroupé (insécable) pour que la ligne ne se coupe jamais au milieu d'un mot
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
            const word = document.createElement('span');
            word.className = 'wrd'; word.setAttribute('aria-hidden', 'true');
            [...part].forEach((ch) => {
              const s = document.createElement('span');
              s.className = 'char';
              s.textContent = ch;
              word.appendChild(s);
            });
            out.appendChild(word);
          });
        } else if (c.nodeType === 1) {
          const clone = c.cloneNode(false); clone.setAttribute('aria-hidden', 'true');
          walk(c, clone); out.appendChild(clone);
        }
      });
    };
    const frag = document.createDocumentFragment();
    walk(line, frag);
    line.replaceChildren(frag);
  });
  return $$('.char', root);
}
function splitWords(el) {
  const out = [];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.push(document.createTextNode(' ')); return; }
        const s = document.createElement('span'); s.className = 'w'; s.textContent = part; out.push(s);
      });
    } else if (node.nodeType === 1) { node.classList.add('w'); out.push(node); }
  });
  el.replaceChildren(...out);
  return $$('.w', el);
}
const heroChars = splitChars($('.hero__title'));
const finalChars = splitChars($('.final__title'));
const chapterTitles = $$('.chapter__title').map((t) => splitChars(t));
const goldenWords = splitWords($('[data-words]'));

// ---------- Préchargeur puis intro ----------
function intro() {
  const tl = gsap.timeline({
    defaults: { ease: EASE_OUT },
    onComplete: () => { lenis?.start(); document.body.classList.remove('is-loading'); document.dispatchEvent(new Event('intro:done')); },
  });
  tl.to('.loader > *', { y: -30, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power3.in' })
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: EASE_IO }, '-=0.15')
    .to('.curtain', { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: EASE_IO }, '-=0.82')
    .add(() => scene?.reveal(), '-=0.7')
    .from(heroChars, PLUS
      ? { x: () => gsap.utils.random(-500, 500), y: () => gsap.utils.random(-350, 350), rotation: () => gsap.utils.random(-120, 120), scale: () => gsap.utils.random(0.3, 1.8), opacity: 0, duration: 1.9, stagger: { each: 0.03, from: 'random' } }
      : { yPercent: 120, rotate: 8, duration: 1.5, stagger: 0.028 }, '-=0.55')
    .from('.header > *', { y: -16, opacity: 0, duration: 1, stagger: 0.08 }, '-=1.3')
    .from('[data-reveal]', { y: 28, opacity: 0, duration: 1.2, stagger: 0.12 }, '-=1.1')
    .from(['.scroll-hint', '.hero__badge'], { opacity: 0, scale: 0.9, duration: 1, stagger: 0.1 }, '-=0.9')
    .set(['.loader', '.curtain'], { display: 'none' });
  if (reduced) tl.progress(1);
}
(function preload() {
  const count = $('[data-count]'), bar = $('.loader__bar span');
  const state = { p: 0 };
  const render = () => { count.textContent = Math.round(state.p); bar.style.transform = `scaleX(${state.p / 100})`; };
  const ready = Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, reduced ? 0 : 900))]);
  const tween = gsap.to(state, { p: 90, duration: reduced ? 0.1 : 1.6, ease: 'power2.out', onUpdate: render });
  ready.then(() => { tween.kill(); gsap.to(state, { p: 100, duration: 0.45, ease: 'power2.out', onUpdate: render, onComplete: intro }); });
})();

// ---------- Niveaux : défilement horizontal épinglé (créé avant les autres déclencheurs) ----------
let levelsTween = null;
(function horizontal() {
  const track = $('.levels__track');
  const distance = () => Math.max(0, track.scrollWidth - innerWidth + 40);
  levelsTween = gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: { trigger: '.levels', start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
  });
  $$('.lvl:not(.lvl--intro)').forEach((panel) => {
    gsap.from(panel.children, { y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: EASE_OUT, scrollTrigger: { trigger: panel, containerAnimation: levelsTween, start: 'left 85%' } });
    gsap.from($$('.meter i', panel), { scaleX: 0, transformOrigin: 'left', duration: 0.8, stagger: 0.12, ease: EASE_OUT, scrollTrigger: { trigger: panel, containerAnimation: levelsTween, start: 'left 70%' } });
  });
})();

// ---------- Chapitres : ambiance + position et forme de la sculpture ----------
const sections = $$('[data-theme]');
sections.forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec.closest('.pin-spacer') || sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => {
      if (!self.isActive) return;
      scene?.setSection(Number(sec.dataset.scene || 0));
      applyTheme(sec.dataset.theme);
    },
  });
});
applyTheme('beton', true);

// ---------- Repère du module en cours + sommaire actif ----------
const chip = $('.modchip'), chipNo = $('[data-chip-no]'), chipTitle = $('[data-chip-title]');
const menuLinks = $$('#menu a[data-target]');
let chipVisible = false;
function setChip(sec) {
  const show = !!sec;
  if (show) {
    chipNo.textContent = $('.no', sec)?.textContent.replace('MOD.', '').trim() || '';
    chipTitle.textContent = $('h2', sec)?.textContent.trim() || '';
    menuLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.target === sec.id));
  }
  if (show !== chipVisible) {
    chipVisible = show;
    chip.classList.toggle('is-on', show);
    gsap.to(chip, { opacity: show ? 1 : 0, y: show ? 0 : 20, duration: show ? 0.6 : 0.25, ease: show ? EASE_OUT : 'power2.out', overwrite: true });
  }
}
$$('.mod').forEach((sec) => {
  ScrollTrigger.create({ trigger: sec, start: 'top 40%', end: 'bottom 40%', onToggle: (self) => { if (self.isActive) setChip(sec); } });
});
ScrollTrigger.create({ trigger: '.read', start: 'top 40%', end: 'bottom 40%', onLeave: () => setChip(null), onLeaveBack: () => setChip(null) });
chip.addEventListener('click', (e) => { e.preventDefault(); toggleMenu(true); });

// ---------- Titre d'accueil : graisse variable qui suit le curseur ----------
(function heroWeight() {
  if (!finePointer || reduced) return;
  const hero = $('.hero');
  const chars = heroChars.map((el) => ({ el, italic: !!el.closest('em'), cx: 0, cy: 0 }));
  const measure = () => chars.forEach((c) => { const r = c.el.getBoundingClientRect(); c.cx = r.left + r.width / 2; c.cy = r.top + r.height / 2 + scrollY; });
  let active = false, mx = -1e4, my = -1e4, raf = 0;
  const update = () => {
    raf = 0;
    for (const c of chars) {
      const f = Math.max(0, 1 - Math.hypot(mx - c.cx, my - (c.cy - scrollY)) / 260);
      c.el.style.fontVariationSettings = `"wght" ${(c.italic ? 300 + 500 * f : 700 - 520 * f).toFixed(0)}`;
    }
  };
  hero.addEventListener('pointerleave', () => { active = false; mx = my = -1e4; if (!raf) raf = requestAnimationFrame(update); });
  hero.addEventListener('pointermove', (e) => { if (!active) { active = true; measure(); } mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(update); });
  addEventListener('resize', measure);
})();

// ---------- Animations au défilement ----------
if (!reduced) {
  // règle d'or : les mots s'allument et montent
  gsap.to(goldenWords, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.golden__text', start: 'top 80%', end: 'bottom 50%', scrub: 0.6 } });
  gsap.from(goldenWords, { yPercent: 50, rotation: 3, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.golden__text', start: 'top 85%', end: 'bottom 55%', scrub: 0.6 } });

  // ouvertures de chapitre : lettres + modules en cascade
  $$('.chapter').forEach((ch, i) => {
    gsap.from(chapterTitles[i], { yPercent: 120, rotate: 8, duration: 1.4, ease: EASE_OUT, stagger: 0.03, scrollTrigger: { trigger: ch, start: 'top 70%' } });
    gsap.from($$('.chip-link', ch), { y: 24, opacity: 0, duration: 0.9, ease: EASE_OUT, stagger: 0.05, scrollTrigger: { trigger: ch, start: 'top 55%' } });
  });

  // en-têtes de module : numéro qui glisse, titre mot à mot, pastilles en cascade
  $$('.mod > header').forEach((h) => {
    const h2 = $('h2', h);
    h2.innerHTML = h2.textContent.split(' ').map((w) => `<span class="line" style="display:inline-block"><span class="wd">${w}</span></span>`).join(' ');
    const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top 82%' } });
    tl.from($('.no', h), { xPercent: -30, opacity: 0, duration: 1.2, ease: EASE_OUT })
      .from($$('.wd', h), { yPercent: 110, duration: 1, ease: EASE_OUT, stagger: 0.04 }, '<0.1');
    const pills = $$('.meta span', h); // (FAQ, glossaire et sources n'ont pas de pastilles)
    if (pills.length) tl.from(pills, { y: 14, opacity: 0, duration: 0.7, ease: EASE_OUT, stagger: 0.05 }, '<0.3');
  });

  // chaînes d'agents : les étapes s'allument l'une après l'autre
  $$('.flow').forEach((flow) => {
    const items = [...flow.children];
    const tl = gsap.timeline({ scrollTrigger: { trigger: flow, start: 'top 85%' } });
    items.forEach((el, i) => {
      if (el.classList.contains('ar')) tl.add(() => el.classList.add('is-lit'), i * 0.09).to(el, { x: 4, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }, i * 0.09);
      else tl.from(el, { y: 18, opacity: 0, scale: 0.92, duration: 0.6, ease: EASE_OUT }, i * 0.09);
    });
  });

  // chiffres clés
  $$('[data-to]').forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: Number(el.dataset.to), duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); }, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.from('.fact', { y: 50, opacity: 0, duration: 1.1, ease: EASE_OUT, stagger: 0.1, scrollTrigger: { trigger: '.facts', start: 'top 80%' } });

  // surtitres : le trait se dessine
  $$('.eyebrow').forEach((el) => gsap.fromTo(el, { '--draw': 0 }, { '--draw': 1, duration: 1.2, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 90%' } }));

  // titre final
  gsap.from(finalChars, { yPercent: 120, rotate: 8, duration: 1.5, ease: EASE_OUT, stagger: 0.025, scrollTrigger: { trigger: '.final__title', start: 'top 80%' } });

  // bandeau infini, accéléré par la vitesse de défilement
  $$('[data-marquee]').forEach((row) => {
    const dir = Number(row.dataset.marquee);
    const span = row.firstElementChild;
    for (let i = 0; i < 3; i++) row.appendChild(span.cloneNode(true));
    const [from, to] = dir > 0 ? [0, -100] : [-100, 0];
    const loop = gsap.fromTo(row.children, { xPercent: from }, { xPercent: to, duration: 26, ease: 'none', repeat: -1 });
    const ts = gsap.quickTo(loop, 'timeScale', { duration: 0.5, ease: 'power2.out' });
    let idle;
    onScroll((_, v) => { ts(1 + Math.min(Math.abs(v) / 10, 5)); clearTimeout(idle); idle = setTimeout(() => ts(1), 120); });
  });

  // inclinaison selon la vitesse (bandeau et panneaux des niveaux)
  const setSkew = gsap.quickTo('.marquee', 'skewY', { duration: 0.6, ease: 'power3.out' });
  const setLvl = gsap.quickTo('.lvl', 'skewX', { duration: 0.5, ease: 'power3.out' });
  onScroll((_, v) => { setSkew(gsap.utils.clamp(-4, 4, v * 0.12)); setLvl(gsap.utils.clamp(-7, 7, -v * 0.22)); });

  // badge : tourne plus vite quand on défile
  const badge = $('.hero__badge');
  if (badge) { const setRot = gsap.quickTo(badge, 'rotation', { duration: 0.8, ease: 'power3.out' }); let rot = 0; onScroll((_, v) => { rot += v * 0.6; setRot(rot); }); }

  // titre d'accueil : ondulation puis envol au défilement (après l'intro)
  if (PLUS) {
    document.addEventListener('intro:done', () => {
      gsap.to(heroChars, { yPercent: -6, duration: 1.6, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: { each: 0.08 } });
      heroChars.forEach((c) => gsap.to(c, {
        y: -140 - Math.random() * 300, x: (Math.random() - 0.5) * 220, rotation: (Math.random() - 0.5) * 90, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: 0.8 },
      }));
      gsap.to('.hero__aside', { y: -80, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '25% top', end: 'bottom 30%', scrub: 0.8 } });
    }, { once: true });
  }
}

// ---------- Curseur, ruban de couleur, gerbe au clic ----------
(function cursor() {
  if (!finePointer) return;
  document.documentElement.classList.add('has-cursor');
  const root = $('.cursor'), label = $('.cursor__label'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  let shown = false;
  addEventListener('pointermove', (e) => {
    if (!shown) { gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); gsap.to(root, { opacity: 1, duration: 0.3 }); shown = true; }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  });
  addEventListener('pointerdown', () => gsap.to(ring, { scale: 0.8, duration: 0.15, ease: 'power2.out' }));
  addEventListener('pointerup', () => gsap.to(ring, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' }));
  document.addEventListener('pointerover', (e) => {
    const field = e.target.closest('input, textarea, pre');
    root.classList.toggle('is-text', !!field);
    const t = field ? null : e.target.closest('a, button, summary, [data-cursor], label');
    root.classList.toggle('is-hover', !!t);
    const text = t?.dataset.cursor;
    root.classList.toggle('is-label', !!text);
    if (text) label.textContent = text;
  });
  document.addEventListener('pointerleave', () => gsap.to(root, { opacity: 0, duration: 0.2 }));
  document.addEventListener('pointerenter', () => shown && gsap.to(root, { opacity: 1, duration: 0.2 }));

  if (!PLUS || reduced) return;
  // ruban continu aux couleurs du chantier, et gerbe de particules au clic
  const cv = document.createElement('canvas');
  cv.className = 'trail'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const size = () => { const dpr = Math.min(devicePixelRatio, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const pts = [], sparks = [];
  let hue = 0, raf = 0, last = performance.now();
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); } };
  addEventListener('pointermove', (e) => { pts.push({ x: e.clientX, y: e.clientY, life: 1, c: PALETTE[Math.floor(hue) % PALETTE.length] }); hue += 0.12; if (pts.length > 64) pts.shift(); kick(); });
  addEventListener('pointerdown', (e) => {
    if (e.target.closest('input, textarea, pre, select')) return;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + Math.random() * 0.3, v = 3 + Math.random() * 5;
      sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, life: 1, r: 2 + Math.random() * 4, c: PALETTE[i % PALETTE.length], sq: i % 3 === 0 });
    }
    kick();
  });
  function draw(now) {
    const dt = Math.min((now - last) / 16.67, 3); last = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const p of pts) p.life -= 0.02 * dt;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], p = pts[i];
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, p.life) * 0.9; ctx.strokeStyle = p.c; ctx.lineWidth = 2 + 18 * p.life * (i / pts.length);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    while (pts.length && pts[0].life <= 0) pts.shift();
    for (const s of sparks) {
      s.vy += 0.18 * dt; s.vx *= 0.97; s.vy *= 0.97; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= 0.022 * dt;
      if (s.life <= 0) continue;
      ctx.globalAlpha = s.life; ctx.fillStyle = s.c;
      const r = s.r * s.life;
      if (s.sq) ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2); // éclats « gravats » carrés
      else { ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill(); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
    ctx.globalAlpha = 1;
    raf = pts.length || sparks.length ? requestAnimationFrame(draw) : 0;
  }
})();

// ---------- Éléments magnétiques ----------
$$('[data-magnetic]').forEach((el) => {
  if (!finePointer || reduced) return;
  const strength = el.classList.contains('hero__badge') ? 0.35 : 0.22;
  const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - (r.left + r.width / 2)) * strength); qy((e.clientY - (r.top + r.height / 2)) * strength); });
  el.addEventListener('pointerleave', () => { qx(0); qy(0); });
});

// ---------- Lettres du titre final qui sautent au survol ----------
if (finePointer && !reduced) {
  finalChars.forEach((c) => c.addEventListener('pointerenter', () => {
    if (gsap.isTweening(c)) return;
    gsap.timeline().to(c, { y: -28, scaleY: 1.08, duration: 0.22, ease: 'power2.out' }).to(c, { y: 0, scaleY: 1, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
  }));
}

// ---------- Sommaire plein écran ----------
const menuBtn = $('.burger'), menu = $('#menu');
let menuOpen = false;
const menuTl = gsap.timeline({ paused: true, defaults: { ease: EASE_IO } })
  .set(menu, { visibility: 'visible' })
  .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.85 })
  .from($$('.menu a span', menu), { yPercent: 110, duration: 0.8, stagger: 0.015, ease: EASE_OUT }, '-=0.4')
  .from($$('.menu__grp, .menu__foot', menu), { opacity: 0, y: 10, duration: 0.5, ease: EASE_OUT, stagger: 0.05 }, '-=0.7');
function toggleMenu(force) {
  menuOpen = force ?? !menuOpen;
  document.body.classList.toggle('menu-open', menuOpen);
  menuBtn.setAttribute('aria-expanded', String(menuOpen));
  menuBtn.setAttribute('aria-label', menuOpen ? 'Fermer le sommaire' : 'Ouvrir le sommaire');
  menu.setAttribute('aria-hidden', String(!menuOpen));
  if (menuOpen) { lenis?.stop(); menuTl.timeScale(1).play(); ($('.menu a.is-active') || $('.menu a')).focus({ preventScroll: true }); }
  else { lenis?.start(); menuTl.timeScale(1.6).reverse(); }
}
menuBtn.addEventListener('click', () => toggleMenu());
addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { toggleMenu(false); menuBtn.focus(); } });

// ---------- Ancres internes (toutes, y compris celles créées par app.js) ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.classList.contains('modchip')) return;
  const id = a.getAttribute('href').slice(1);
  const target = id && document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const go = () => scrollToTarget(target);
  if (menuOpen) { toggleMenu(false); setTimeout(go, 380); } else requestAnimationFrame(go); // laisse app.js ouvrir une fiche d'agent d'abord
});

// ---------- Recalcul des positions quand le contenu change de hauteur ----------
// (fiches d'agents ouvertes, onglets, filtres, formule du programme, quiz…)
let rT;
new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(() => ScrollTrigger.refresh(), 250); }).observe($('.read'));
document.fonts.ready.then(() => ScrollTrigger.refresh());
