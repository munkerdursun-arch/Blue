// =====================================================================
// Nocturne (v2) — orchestration : préchargeur à double rideau, défilement
// fluide (Lenis), changement d'ambiance par chapitre, titre à graisse
// variable réactif au curseur, inclinaison selon la vitesse, curseur,
// boutons magnétiques, menu. gsap / ScrollTrigger / Lenis = globals.
// =====================================================================
import { initScene } from './scene.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const EASE_OUT = 'expo.out';
const EASE_IO = 'power4.inOut';

// ---------- Ambiances des chapitres (variables CSS animées) ----------
const THEMES = {
  cream:  { '--bg': '#f3efe7', '--ink': '#141418', '--ink-dim': '#6f6b66', '--ink-faint': '#cfc8bd', '--line': 'rgba(20,20,24,0.12)', '--accent': '#ff5b2e', dark: false },
  sand:   { '--bg': '#f0e3d3', '--ink': '#1a1410', '--ink-dim': '#7a6a5c', '--ink-faint': '#d6c4b0', '--line': 'rgba(26,20,16,0.12)', '--accent': '#ff5b2e', dark: false },
  night:  { '--bg': '#111116', '--ink': '#f3efe7', '--ink-dim': '#8d8a92', '--ink-faint': '#34343e', '--line': 'rgba(243,239,231,0.14)', '--accent': '#ff7a52', dark: true },
  lilac:  { '--bg': '#e7e2f3', '--ink': '#17151f', '--ink-dim': '#6d6880', '--ink-faint': '#cbc4dc', '--line': 'rgba(23,21,31,0.12)', '--accent': '#ff5b2e', dark: false },
  orange: { '--bg': '#ff5b2e', '--ink': '#160f0c', '--ink-dim': 'rgba(22,15,12,0.62)', '--ink-faint': 'rgba(22,15,12,0.25)', '--line': 'rgba(22,15,12,0.22)', '--accent': '#160f0c', dark: false },
};
const meta = $('meta[name="theme-color"]');
function applyTheme(name, instant = false) {
  const t = THEMES[name];
  if (!t) return;
  const vars = Object.fromEntries(Object.entries(t).filter(([k]) => k.startsWith('--')));
  gsap.to(document.documentElement, { ...vars, duration: instant || reduced ? 0 : 0.9, ease: 'power2.inOut', overwrite: true });
  scene?.setTheme(t['--bg'], t.dark);
  meta?.setAttribute('content', t['--bg']);
}

// ---------- Scène WebGL ----------
const scene = initScene($('.webgl'), { reducedMotion: reduced });
if (!scene) document.documentElement.classList.add('no-webgl');

// ---------- Défilement fluide ----------
const lenis = reduced ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
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
const scrollToTarget = (el) => (lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));

// ---------- Barre de progression ----------
const progress = $('.progress');
const setProgress = gsap.quickSetter(progress, 'scaleX');
onScroll((y) => setProgress(y / Math.max(1, document.documentElement.scrollHeight - innerHeight)));

// ---------- Découpage du texte ----------
// Lettres pour les grands titres (le libellé complet reste lisible par les lecteurs d'écran).
function splitChars(root) {
  root.setAttribute('aria-label', root.textContent.replace(/\s+/g, ' ').trim());
  $$('.line', root).forEach((line) => {
    const walk = (node, out) => {
      node.childNodes.forEach((c) => {
        if (c.nodeType === 3) {
          [...c.textContent].forEach((ch) => {
            const s = document.createElement('span');
            s.className = 'char';
            s.setAttribute('aria-hidden', 'true');
            s.textContent = ch === ' ' ? ' ' : ch;
            out.appendChild(s);
          });
        } else if (c.nodeType === 1) {
          const clone = c.cloneNode(false);
          clone.setAttribute('aria-hidden', 'true');
          walk(c, clone);
          out.appendChild(clone);
        }
      });
    };
    const frag = document.createDocumentFragment();
    walk(line, frag);
    line.replaceChildren(frag);
  });
  return $$('.char', root);
}
// Mots pour le manifeste (les <em> restent en italique orange)
function splitWords(el) {
  const out = [];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.push(document.createTextNode(' ')); return; }
        const s = document.createElement('span'); s.className = 'w'; s.textContent = part; out.push(s);
      });
    } else if (node.nodeType === 1) {
      node.classList.add('w'); out.push(node);
    }
  });
  el.replaceChildren(...out);
  return $$('.w', el);
}

const heroChars = splitChars($('.hero__title'));
const contactChars = splitChars($('.contact__title'));
const manifestoWords = splitWords($('[data-words]'));

// ---------- Préchargeur puis intro ----------
function intro() {
  const tl = gsap.timeline({
    defaults: { ease: EASE_OUT },
    onComplete: () => { lenis?.start(); document.body.classList.remove('is-loading'); },
  });
  tl.to('.loader > *', { y: -30, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power3.in' })
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: EASE_IO }, '-=0.15')
    .to('.curtain', { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: EASE_IO }, '-=0.82')
    .add(() => scene?.reveal(), '-=0.7')
    .from(heroChars, { yPercent: 120, rotate: 8, duration: 1.5, stagger: 0.028 }, '-=0.55')
    .from('.header > *', { y: -16, opacity: 0, duration: 1, stagger: 0.08 }, '-=1.3')
    .from('[data-reveal]', { y: 28, opacity: 0, duration: 1.2, stagger: 0.12 }, '-=1.1')
    .from(['.scroll-hint', '.hero__badge'], { opacity: 0, scale: 0.9, duration: 1, stagger: 0.1 }, '-=0.9')
    .set(['.loader', '.curtain'], { display: 'none' });
  if (reduced) tl.progress(1); // mouvement réduit : on saute directement à l'état final
  return tl;
}

(function preload() {
  const count = $('[data-count]');
  const bar = $('.loader__bar span');
  const state = { p: 0 };
  const render = () => { count.textContent = Math.round(state.p); bar.style.transform = `scaleX(${state.p / 100})`; };
  const ready = Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, reduced ? 0 : 900))]);
  const tween = gsap.to(state, { p: 90, duration: reduced ? 0.1 : 1.6, ease: 'power2.out', onUpdate: render });
  ready.then(() => {
    tween.kill();
    gsap.to(state, { p: 100, duration: 0.45, ease: 'power2.out', onUpdate: render, onComplete: intro });
  });
})();

// ---------- Expertises : défilement horizontal épinglé ----------
// (créé AVANT les déclencheurs suivants : l'épinglage décale leurs positions)
(function horizontal() {
  const track = $('.expertise__track');
  const distance = () => track.scrollWidth - innerWidth + 40;
  const tween = gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: {
      trigger: '.expertise', start: 'top top', end: () => `+=${distance()}`,
      pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
    },
  });
  // chaque panneau se révèle quand il entre dans l'écran (animation imbriquée dans le défilement horizontal)
  $$('.panel:not(.panel--intro)').forEach((panel) => {
    gsap.from(panel.children, {
      y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: EASE_OUT,
      scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 85%' },
    });
  });
})();

// ---------- Chapitres : forme de la sculpture + ambiance ----------
let currentScene = 0;
$$('[data-scene]').forEach((sec) => {
  const i = Number(sec.dataset.scene);
  ScrollTrigger.create({
    // une section épinglée vit dans un « pin-spacer » : on suit celui-ci pour couvrir toute la durée de l'épinglage
    trigger: sec.closest('.pin-spacer') || sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => {
      if (!self.isActive) return;
      currentScene = i;
      scene?.setSection(i);
      applyTheme(sec.dataset.theme);
    },
  });
});
applyTheme('cream', true);

// ---------- Titre du hero : la graisse suit le curseur (police variable) ----------
(function heroWeight() {
  if (!finePointer || reduced) return;
  const hero = $('.hero');
  const chars = heroChars.map((el) => ({ el, italic: !!el.closest('em'), cx: 0, cy: 0 }));
  const measure = () => chars.forEach((c) => { const r = c.el.getBoundingClientRect(); c.cx = r.left + r.width / 2; c.cy = r.top + r.height / 2 + scrollY; });
  let active = false, mx = -1e4, my = -1e4, raf = 0;
  const update = () => {
    raf = 0;
    for (const c of chars) {
      const d = Math.hypot(mx - c.cx, my - (c.cy - scrollY));
      const f = Math.max(0, 1 - d / 260); // influence dans un rayon de 260 px
      // gras qui s'affine / italique fin qui s'épaissit : effet « loupe »
      const w = c.italic ? 300 + 500 * f : 700 - 520 * f;
      c.el.style.fontVariationSettings = `"wght" ${w.toFixed(0)}`;
    }
  };
  hero.addEventListener('pointerenter', () => { active = true; measure(); });
  hero.addEventListener('pointerleave', () => { active = false; mx = my = -1e4; if (!raf) raf = requestAnimationFrame(update); });
  hero.addEventListener('pointermove', (e) => { if (!active) { active = true; measure(); } mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(update); });
  addEventListener('resize', measure);
})();

// ---------- Manifeste : les mots s'allument au fil du défilement ----------
if (!reduced) {
  gsap.to(manifestoWords, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 50%', scrub: 0.6 },
  });
}

// ---------- Traits des surtitres qui se dessinent ----------
$$('.eyebrow').forEach((el) => {
  gsap.fromTo(el, { '--draw': 0 }, { '--draw': 1, duration: 1.2, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 88%' } });
});

// ---------- Titre du contact ----------
gsap.from(contactChars, {
  yPercent: 120, rotate: 8, duration: 1.5, ease: EASE_OUT, stagger: 0.022,
  scrollTrigger: { trigger: '.contact__title', start: 'top 80%' },
});
gsap.from('.cta', { y: 30, opacity: 0, duration: 1.2, ease: EASE_OUT, scrollTrigger: { trigger: '.cta', start: 'top 92%' } });

// ---------- Projets : aperçu flottant + teinte de la scène ----------
(function projects() {
  const preview = $('.preview');
  const art = $('.preview__art');
  const label = $('.preview__label');
  if (!finePointer) return;
  gsap.set(preview, { scale: 0.9, opacity: 0, xPercent: -50, yPercent: -50 });
  const qx = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3.out' });
  const qy = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3.out' });
  const qr = gsap.quickTo(preview, 'rotation', { duration: 0.9, ease: 'power3.out' });
  let lastX = 0;
  addEventListener('pointermove', (e) => {
    qx(e.clientX); qy(e.clientY);
    qr(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.4)); // inclinaison selon la vitesse de la souris
    lastX = e.clientX;
  });
  $$('.project').forEach((p) => {
    p.addEventListener('pointerenter', () => {
      const h = Number(p.dataset.hue);
      art.style.setProperty('--h', h);
      label.textContent = $('.project__name', p).textContent;
      gsap.to(preview, { scale: 1, opacity: 1, duration: 0.6, ease: EASE_OUT, overwrite: 'auto' });
      scene?.setHue(h / 360);
    });
    p.addEventListener('pointerleave', () => {
      gsap.to(preview, { scale: 0.9, opacity: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' }); // sortie plus rapide
      scene?.resetHue(currentScene);
    });
  });
})();

// ---------- Inclinaison selon la vitesse de défilement (sensation de matière) ----------
if (!reduced) {
  const skewTargets = ['.work__list', '.marquee', '.stats'];
  const setSkew = skewTargets.map((s) => gsap.quickTo(s, 'skewY', { duration: 0.6, ease: 'power3.out' }));
  onScroll((_, v) => { const k = gsap.utils.clamp(-4, 4, v * 0.12); setSkew.forEach((fn) => fn(k)); });
}

// ---------- Bandeau infini, accéléré par la vitesse ----------
$$('[data-marquee]').forEach((row) => {
  const dir = Number(row.dataset.marquee);
  const span = row.firstElementChild;
  for (let i = 0; i < 3; i++) row.appendChild(span.cloneNode(true)); // 4 copies : pas de trou
  if (reduced) return;
  // chaque copie glisse de sa propre largeur : la boucle est sans couture
  const [from, to] = dir > 0 ? [0, -100] : [-100, 0];
  const loop = gsap.fromTo(row.children, { xPercent: from }, { xPercent: to, duration: 24, ease: 'none', repeat: -1 });
  const ts = gsap.quickTo(loop, 'timeScale', { duration: 0.5, ease: 'power2.out' });
  let idle;
  onScroll((_, v) => {
    ts(1 + Math.min(Math.abs(v) / 10, 5));
    clearTimeout(idle); idle = setTimeout(() => ts(1), 120);
  });
});

// ---------- Compteurs ----------
$$('[data-to]').forEach((el) => {
  const obj = { v: 0 };
  gsap.to(obj, {
    v: Number(el.dataset.to), duration: 2.2, ease: 'power3.out',
    onUpdate: () => { el.textContent = Math.round(obj.v); },
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
  });
});

// ---------- Curseur personnalisé ----------
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
    const t = e.target.closest('a, button, [data-cursor]');
    root.classList.toggle('is-hover', !!t);
    const text = t?.dataset.cursor;
    root.classList.toggle('is-label', !!text);
    if (text) label.textContent = text;
  });
  document.addEventListener('pointerleave', () => gsap.to(root, { opacity: 0, duration: 0.2 }));
  document.addEventListener('pointerenter', () => shown && gsap.to(root, { opacity: 1, duration: 0.2 }));
})();

// ---------- Éléments magnétiques ----------
$$('[data-magnetic]').forEach((el) => {
  if (!finePointer || reduced) return;
  const strength = el.classList.contains('cta') || el.classList.contains('hero__badge') ? 0.35 : 0.25;
  const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    qx((e.clientX - (r.left + r.width / 2)) * strength);
    qy((e.clientY - (r.top + r.height / 2)) * strength);
  });
  el.addEventListener('pointerleave', () => { qx(0); qy(0); });
});

// ---------- Menu plein écran ----------
(function menu() {
  const btn = $('.burger');
  const nav = $('#menu');
  const links = $$('.menu__list span');
  let open = false;
  const tl = gsap.timeline({ paused: true, defaults: { ease: EASE_IO } })
    .set(nav, { visibility: 'visible' })
    .to(nav, { clipPath: 'inset(0 0 0% 0)', duration: 0.9 })
    .from(links, { yPercent: 110, rotate: 4, duration: 0.9, stagger: 0.06, ease: EASE_OUT }, '-=0.45')
    .from('.menu__foot', { opacity: 0, y: 10, duration: 0.6, ease: EASE_OUT }, '-=0.6');

  function toggle(force) {
    open = force ?? !open;
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.setAttribute('aria-hidden', String(!open));
    if (open) { lenis?.stop(); tl.timeScale(1).play(); $('.menu__list a').focus({ preventScroll: true }); }
    else { lenis?.start(); tl.timeScale(1.6).reverse(); } // fermeture plus rapide que l'ouverture
  }
  btn.addEventListener('click', () => toggle());
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { toggle(false); btn.focus(); } });
  $$('#menu a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    toggle(false);
    const target = $(a.getAttribute('href'));
    if (target) setTimeout(() => scrollToTarget(target), 350);
  }));
})();

// ---------- Ancres internes via Lenis ----------
$$('a[href^="#"]:not(#menu a)').forEach((a) => a.addEventListener('click', (e) => {
  const target = $(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  scrollToTarget(target);
}));

// ---------- Détails ----------
$('[data-year]').textContent = new Date().getFullYear();
const clock = $('[data-clock]');
const fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
const tick = () => { clock.textContent = fmt.format(new Date()); };
tick(); setInterval(tick, 10_000);

document.fonts.ready.then(() => ScrollTrigger.refresh());
