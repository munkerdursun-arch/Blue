// =====================================================================
// Vitrine « Conducteur de travaux augmenté » — orchestration.
// Préchargeur (plan qui se trace) → rideau jaune → lettres qui s'assemblent.
// Pièce maîtresse : un immeuble 3D qui sort de terre au fil de la page, avec sa grue.
// Moments forts : le lundi qui se range (épinglé), compteur mécanique « 18 »,
// panneau à palettes (une seule IA), parcours horizontal qui s'allume,
// comparatif barré au défilement, largeur de police qui suit le curseur.
// gsap / ScrollTrigger / Lenis sont des globales (vendor/).
// =====================================================================
import { initBuilding } from './building.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const EASE_OUT = 'expo.out';
const EASE_IO = 'power4.inOut';
const isMobile = matchMedia('(max-width: 600px)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Animations toujours actives (choix du propriétaire) ----------
// Le réglage système « réduire les animations » n'est volontairement pas appliqué.
const reduced = false;

// ---------- Ambiances des chapitres ----------
const THEMES = {
  beton: { '--bg': '#f2f0eb', '--ink': '#14181d', '--ink-dim': 'rgba(20,24,29,0.68)', '--ink-faint': 'rgba(20,24,29,0.3)', '--line': 'rgba(20,24,29,0.14)', '--mark': '#ffb000', '--em': '#14181d', '--card': 'rgba(255,255,255,0.62)', dark: false },
  sable: { '--bg': '#efe6d6', '--ink': '#1b1610', '--ink-dim': 'rgba(27,22,16,0.68)', '--ink-faint': 'rgba(27,22,16,0.3)', '--line': 'rgba(27,22,16,0.14)', '--mark': '#ffb000', '--em': '#1b1610', '--card': 'rgba(255,252,246,0.6)', dark: false },
  bleu:  { '--bg': '#e3e8ec', '--ink': '#121a22', '--ink-dim': 'rgba(18,26,34,0.68)', '--ink-faint': 'rgba(18,26,34,0.3)', '--line': 'rgba(18,26,34,0.14)', '--mark': '#ffb000', '--em': '#121a22', '--card': 'rgba(255,255,255,0.6)', dark: false },
  nuit:  { '--bg': '#14181d', '--ink': '#f2f0eb', '--ink-dim': 'rgba(242,240,235,0.66)', '--ink-faint': 'rgba(242,240,235,0.28)', '--line': 'rgba(242,240,235,0.16)', '--mark': 'rgba(255,176,0,0)', '--em': '#ffb000', '--card': 'rgba(255,255,255,0.05)', dark: true },
  orange: { '--bg': '#ff8a1f', '--ink': '#14181d', '--ink-dim': 'rgba(20,24,29,0.74)', '--ink-faint': 'rgba(20,24,29,0.32)', '--line': 'rgba(20,24,29,0.2)', '--mark': 'rgba(255,255,255,0)', '--em': '#14181d', '--card': 'rgba(255,255,255,0.3)', dark: false },
};
const metaTheme = $('meta[name="theme-color"]');
let building = null;
try { building = initBuilding($('.webgl')); } catch { building = null; }
if (!building) document.documentElement.classList.add('no-webgl');

// Cadrage du chantier par chapitre : [décalage à droite, orbite, atténuation, fenêtres allumées, distance]
// (poussé à droite et atténué quand le texte prend la largeur, allumé la nuit et à la livraison)
const SHOTS_DESKTOP = [
  [0.36, 0, 0, 0, 29], [0.36, 0.15, 0, 0, 30], [0.38, 0.25, 0.86, 0, 34], [0.38, 0.35, 0.86, 0, 34], [0.39, 0.45, 0.3, 1, 35],
  [0.3, 0.55, 0.86, 0, 32], [0.39, 0.65, 0.8, 0, 37], [0.38, 0.75, 0.15, 0, 34], [0.41, 0.9, 0, 1, 36],
];
const SHOTS_MOBILE = [[0, 0, 0, 0], [0, 0.15, 0.82, 0], [0, 0.25, 0.86, 0], [0, 0.35, 0.86, 0], [0, 0.45, 0.4, 1], [0, 0.55, 0.86, 0], [0, 0.65, 0.84, 0], [0, 0.75, 0.84, 0], [0, 0.9, 0.5, 1]];
const SHOTS = isMobile ? SHOTS_MOBILE : SHOTS_DESKTOP;
function frame(i) {
  const [shift, orbit, dim, lights, dist] = SHOTS[Math.max(0, Math.min(SHOTS.length - 1, i))];
  building?.setShift(shift); building?.setOrbit(orbit); building?.setDim(dim); building?.setLights(lights);
  if (dist) building?.setZoom(dist);
}

let currentTheme = '';
function applyTheme(name) {
  const t = THEMES[name];
  if (!t || name === currentTheme) return;
  currentTheme = name;
  const vars = Object.fromEntries(Object.entries(t).filter(([k]) => k.startsWith('--')));
  gsap.to(document.documentElement, { ...vars, duration: reduced ? 0 : 0.9, ease: 'power2.inOut', overwrite: true });
  metaTheme?.setAttribute('content', t['--bg']);
}

// ---------- Défilement fluide ----------
const lenis = reduced ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, touchMultiplier: 1.3 });
if (lenis) {
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToTarget = (el) => (lenis ? lenis.scrollTo(el, { duration: 1.5 }) : el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));

// ---------- Découpe des titres (mots insécables, puis lettres) ----------
function splitChars(root) {
  root.setAttribute('aria-label', root.textContent.replace(/\s+/g, ' ').trim());
  const walk = (node, out) => {
    node.childNodes.forEach((c) => {
      if (c.nodeType === 3) {
        c.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'wrd';
          [...part].forEach((ch) => { const s = document.createElement('span'); s.className = 'char'; s.textContent = ch; w.appendChild(s); });
          out.appendChild(w);
        });
      } else if (c.nodeType === 1) {
        const clone = c.cloneNode(false);
        walk(c, clone);
        out.appendChild(clone);
      }
    });
  };
  $$('.line', root).forEach((line) => {
    const frag = document.createDocumentFragment();
    walk(line, frag);
    line.replaceChildren(frag);
    line.setAttribute('aria-hidden', 'true');
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

const heroTitle = $('.hero__title');
const heroChars = splitChars(heroTitle);
const finalChars = splitChars($('.final__title'));
const manifestWords = splitWords($('[data-words]'));

// ---------- Préchargeur puis intro ----------
function intro() {
  const tl = gsap.timeline({
    defaults: { ease: EASE_OUT },
    onComplete: () => {
      lenis?.start();
      document.body.classList.remove('is-loading');
      heroTitle.classList.add('is-marked');
      document.dispatchEvent(new Event('intro:done'));
    },
  });
  tl.to('.loader > *', { y: -24, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' })
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 0.95, ease: EASE_IO }, '-=0.1')
    .to('.curtain', { clipPath: 'inset(0 0 100% 0)', duration: 0.95, ease: EASE_IO }, '-=0.78')
    // les lettres arrivent de partout et s'assemblent en un titre
    .from(heroChars, {
      x: () => gsap.utils.random(-420, 420), y: () => gsap.utils.random(-300, 300),
      rotation: () => gsap.utils.random(-90, 90), scale: () => gsap.utils.random(0.5, 1.6),
      opacity: 0, duration: 1.7, stagger: { each: 0.02, from: 'random' },
    }, '-=0.55')
    .from('.header > *', { y: -16, opacity: 0, duration: 1, stagger: 0.08 }, '-=1.3')
    .from('.hero [data-reveal]', { y: 28, opacity: 0, duration: 1.1, stagger: 0.1 }, '-=1.1')
    .from('.panneau', { opacity: 0, y: 30, rotation: -3, duration: 1.1 }, '-=0.9')
    .set(['.loader', '.curtain'], { display: 'none' });
  if (reduced) tl.progress(1);
}

(function preload() {
  const count = $('[data-count]');
  const paths = $$('.loader__plan path');
  paths.forEach((p) => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
  const state = { p: 0 };
  const render = () => {
    count.textContent = Math.round(state.p);
    const k = state.p / 100;
    paths.forEach((p, i) => {
      const local = gsap.utils.clamp(0, 1, k * paths.length - i * 0.7);
      p.style.strokeDashoffset = parseFloat(p.style.strokeDasharray) * (1 - local);
    });
  };
  const ready = Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, reduced ? 0 : 900))]);
  const tween = gsap.to(state, { p: 88, duration: reduced ? 0.05 : 1.5, ease: 'power2.out', onUpdate: render });
  ready.then(() => {
    tween.kill();
    gsap.to(state, { p: 100, duration: reduced ? 0.05 : 0.45, ease: 'power2.out', onUpdate: render, onComplete: intro });
  });
})();

// =====================================================================
// Sections épinglées (créées AVANT les autres déclencheurs)
// =====================================================================

// ---------- 02 Le lundi qui se range ----------
(function monday() {
  const sec = $('.monday');
  const stage = $('.monday__stage', sec);
  const cards = $$('.task', stage);
  const label = $('[data-state]', sec);
  const labelTxt = $('[data-state-txt]', sec);
  const setState = (after) => {
    label.textContent = after ? 'Après' : 'Avant';
    labelTxt.textContent = after ? '8 brouillons prêts à valider' : '8 urgences sur votre bureau';
  };
  if (reduced) {
    gsap.set($$('.s-before', sec), { opacity: 0 });
    gsap.set($$('.s-after', sec), { opacity: 1 });
    setState(true);
    return;
  }
  // désordre de départ : pseudo-aléatoire fixe pour que l'état ne saute pas au redimensionnement
  const rnd = cards.map((_, i) => [Math.sin(i * 12.9898) * 0.5, Math.cos(i * 78.233) * 0.5, Math.sin(i * 3.7) * 1]);
  const pile = (i, axis) => {
    const c = cards[i];
    if (axis === 'x') return stage.clientWidth / 2 - (c.offsetLeft + c.offsetWidth / 2) + rnd[i][0] * stage.clientWidth * 0.55;
    return stage.clientHeight / 2 - (c.offsetTop + c.offsetHeight / 2) + rnd[i][1] * stage.clientHeight * 0.45;
  };
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: sec, start: 'top top', end: () => '+=' + innerHeight * (isMobile ? 1.3 : 1.6),
      pin: true, scrub: 0.8, invalidateOnRefresh: true,
      onUpdate: (self) => setState(self.progress > 0.62),
    },
  });
  tl.fromTo(cards,
    { x: (i) => pile(i, 'x'), y: (i) => pile(i, 'y'), rotation: (i) => rnd[i][2] * 16, scale: 0.94 },
    { x: 0, y: 0, rotation: 0, scale: 1, duration: 1, ease: 'power3.inOut', stagger: 0.05 })
    .to($$('.s-before', sec), { opacity: 0, y: -8, duration: 0.2, stagger: 0.03 }, '>-0.15')
    .fromTo($$('.s-after', sec), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.03 }, '<0.05')
    .to({}, { duration: 0.25 }); // un temps de pause, état rangé visible
})();

// ---------- 05 Parcours horizontal ----------
(function path() {
  const sec = $('.path');
  const track = $('.path__track', sec);
  const fill = $('.path__fill', sec);
  const steps = $$('.step:not(.step--intro)', sec);
  if (reduced) { steps.forEach((s) => s.classList.add('is-on')); return; }
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
      onUpdate: (self) => {
        fill.style.transform = `scaleX(${self.progress})`;
        const limit = innerWidth * 0.62;
        steps.forEach((s) => s.classList.toggle('is-on', s.getBoundingClientRect().left < limit));
      },
    },
  });
  // les cartes s'inclinent légèrement selon la vitesse
  const skew = gsap.quickTo(steps, 'skewX', { duration: 0.5, ease: 'power3.out' });
  ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onUpdate: (self) => skew(gsap.utils.clamp(-6, 6, self.getVelocity() / -320)) });
})();

// =====================================================================
// Chapitres : ambiance + état de la sculpture
// =====================================================================
$$('[data-theme]').forEach((sec) => {
  const i = Number(sec.dataset.scene);
  ScrollTrigger.create({
    trigger: sec.closest('.pin-spacer') || sec,
    start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) { applyTheme(sec.dataset.theme); frame(i); } },
  });
});
applyTheme('beton');
frame(0);

// Barre de progression + avancement du chantier (livré à l'arrivée sur le final)
building?.setProgress(0.12);
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (self) => {
    $('.progress span').style.transform = `scaleX(${self.progress})`;
    building?.setProgress(0.12 + Math.min(1, self.progress / 0.86) * 0.88);
  },
});

// =====================================================================
// Révélations au défilement
// =====================================================================
function onEnter(el, fn, start = 'top 80%') { ScrollTrigger.create({ trigger: el, start, once: true, onEnter: fn }); }

if (!reduced) {
  // manifeste : mot à mot, lié au défilement
  gsap.fromTo(manifestWords, { opacity: 0.12, y: 14 }, {
    opacity: 1, y: 0, stagger: 0.06, ease: 'none',
    scrollTrigger: { trigger: '.manifest__text', start: 'top 78%', end: 'bottom 52%', scrub: 0.6 },
  });
  gsap.from('[data-reveal-s]', { opacity: 0, y: 24, duration: 1.1, ease: EASE_OUT, scrollTrigger: { trigger: '[data-reveal-s]', start: 'top 90%' } });

  // titres de section et numérotation
  $$('section:not(.hero):not(.final) .cote').forEach((c) => gsap.from(c, { opacity: 0, x: -20, duration: 1, ease: EASE_OUT, scrollTrigger: { trigger: c, start: 'top 88%' } }));
  $$('.h2').forEach((h) => gsap.from(h, { opacity: 0, y: 46, duration: 1.2, ease: EASE_OUT, scrollTrigger: { trigger: h, start: 'top 85%' } }));

  // 18 agents : cascade
  gsap.from('.agents li', { opacity: 0, y: 26, scale: 0.94, duration: 0.9, ease: EASE_OUT, stagger: { each: 0.035, grid: 'auto', from: 'start' }, scrollTrigger: { trigger: '.agents', start: 'top 82%' } });
  $$('.keeps li').forEach((li) => gsap.from(li, { opacity: 0, y: 34, duration: 1, ease: EASE_OUT, scrollTrigger: { trigger: li, start: 'top 88%' } }));

  // une seule IA
  gsap.from(['.mono__cols > *', '.mono__list'], { opacity: 0, y: 30, duration: 1.1, ease: EASE_OUT, stagger: 0.12, scrollTrigger: { trigger: '.mono__cols', start: 'top 85%' } });

  // comparatif : la ligne générique se barre, la nôtre arrive
  $$('.compare .row').forEach((row) => {
    gsap.set(row.querySelector('s'), { '--strike': 0 });
    gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 82%' } })
      .from(row.querySelector('s'), { opacity: 0, x: -20, duration: 0.6, ease: EASE_OUT })
      .to(row.querySelector('s'), { '--strike': 1, duration: 0.5, ease: 'power3.out' }, '-=0.2')
      .from(row.querySelector('p'), { opacity: 0, x: 40, duration: 0.9, ease: EASE_OUT }, '-=0.3');
  });
  gsap.from('.trainer > *', { opacity: 0, y: 36, duration: 1.1, ease: EASE_OUT, stagger: 0.12, scrollTrigger: { trigger: '.trainer', start: 'top 82%' } });
  gsap.from('.faq details', { opacity: 0, y: 24, duration: 0.9, ease: EASE_OUT, stagger: 0.07, scrollTrigger: { trigger: '.faq__list', start: 'top 85%' } });

  // final : lettres qui montent, puis sautent au survol
  gsap.from(finalChars, { yPercent: 110, opacity: 0, rotation: 6, duration: 1.2, ease: EASE_OUT, stagger: 0.018, scrollTrigger: { trigger: '.final__title', start: 'top 80%' } });
  gsap.from(['.final .btns', '.foot'], { opacity: 0, y: 24, duration: 1, ease: EASE_OUT, stagger: 0.1, scrollTrigger: { trigger: '.final .btns', start: 'top 92%' } });
  if (finePointer) finalChars.forEach((c) => c.addEventListener('pointerenter', () => {
    if (gsap.isTweening(c)) return;
    gsap.fromTo(c, { y: 0 }, { y: -18, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1 });
  }));
}
// surligneur des italiques au passage
$$('.h2').forEach((h) => onEnter(h, () => h.classList.add('is-marked'), 'top 70%'));

// ---------- Compteur mécanique « 18 » ----------
(function counter() {
  const cols = $$('[data-roll]');
  cols.forEach((col) => { col.innerHTML = Array.from({ length: 20 }, (_, i) => `<i>${i % 10}</i>`).join(''); });
  const go = () => cols.forEach((col, k) => {
    const d = Number(col.dataset.roll);
    gsap.to(col, { yPercent: -((10 + d) / 20) * 100, duration: reduced ? 0 : 1.8 + k * 0.35, ease: 'power4.out' });
  });
  if (reduced) go(); else onEnter('.takeaway .h2', go, 'top 78%');
})();

// ---------- Panneau à palettes : l'IA autorisée ----------
(function flap() {
  const el = $('[data-flap]');
  const title = $('.mono__title');
  const words = ['Copilot', 'votre IA interne', 'ChatGPT', 'Claude', 'Gemini', 'Le Chat'];
  title.setAttribute('aria-label', "Votre entreprise n'autorise que Copilot, votre IA interne, ChatGPT, Claude, Gemini ou Le Chat ? Parfait.");
  [...title.children].forEach((c) => c.setAttribute('aria-hidden', 'true'));
  const esc = (c) => (c === ' ' ? '&nbsp;' : c.replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x])));
  const set = (w) => { el.innerHTML = [...w].map((c) => `<span class="fc">${esc(c)}</span>`).join(''); return $$('.fc', el); };
  set(words[0]);
  if (reduced) return;
  let i = 0, timer = null;
  const next = () => {
    i = (i + 1) % words.length;
    gsap.to($$('.fc', el), {
      rotationX: 90, opacity: 0, duration: 0.2, stagger: 0.015, ease: 'power2.out',
      onComplete: () => gsap.fromTo(set(words[i]), { rotationX: -90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 0.55, stagger: 0.03, ease: 'back.out(1.8)' }),
    });
  };
  ScrollTrigger.create({
    trigger: '.mono', start: 'top 70%', end: 'bottom 30%',
    onToggle: (self) => { clearInterval(timer); if (self.isActive) timer = setInterval(next, 2100); },
  });
})();

// ---------- Bandeau infini accéléré par la vitesse ----------
(function marquee() {
  const track = $('.marquee__track');
  track.innerHTML += track.innerHTML;
  if (reduced) return;
  const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
  let boost = 1;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 5);
      loop.timeScale(boost * (self.direction < 0 ? -1 : 1));
      gsap.to(loop, { timeScale: self.direction < 0 ? -1 : 1, duration: 1.2, ease: 'power2.out', overwrite: true });
    },
  });
})();

// ---------- Titre : largeur et graisse qui suivent le curseur (effet loupe) ----------
(function heroStretch() {
  if (!finePointer || reduced) return;
  const hero = $('.hero');
  const chars = heroChars.map((c) => ({ el: c, serif: !!c.closest('em'), x: 0, y: 0 }));
  const measure = () => chars.forEach((c) => { const r = c.el.getBoundingClientRect(); c.x = r.left + r.width / 2; c.y = r.top + r.height / 2 + scrollY; });
  let ready = false;
  document.addEventListener('intro:done', () => { measure(); ready = true; });
  addEventListener('resize', () => { if (ready) measure(); });
  const setters = chars.map((c) => gsap.quickTo(c.el, '--v', { duration: 0.6, ease: 'power3.out' }));
  chars.forEach((c) => { c.el.style.setProperty('--v', 0); c.el.style.fontVariationSettings = c.serif ? "'wght' calc(300 + var(--v) * 500)" : "'wght' calc(850 - var(--v) * 450), 'wdth' calc(100 + var(--v) * 25)"; });
  hero.addEventListener('pointermove', (e) => {
    if (!ready) return;
    const py = e.clientY + scrollY;
    chars.forEach((c, i) => {
      const d = Math.hypot(e.clientX - c.x, (py - c.y) * 1.4);
      setters[i](Math.max(0, 1 - d / 260));
    });
  });
  hero.addEventListener('pointerleave', () => setters.forEach((s) => s(0)));
})();

// ---------- Boutons magnétiques ----------
if (finePointer && !reduced) $$('[data-magnetic]').forEach((el) => {
  const mx = gsap.quickTo(el, '--mx', { duration: 0.5, ease: 'power3.out', unit: 'px' });
  const my = gsap.quickTo(el, '--my', { duration: 0.5, ease: 'power3.out', unit: 'px' });
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    mx((e.clientX - r.left - r.width / 2) * 0.3);
    my((e.clientY - r.top - r.height / 2) * 0.4);
  });
  el.addEventListener('pointerleave', () => { mx(0); my(0); });
});

// ---------- Questions : ouverture douce ----------
$$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
  if (d.open && !reduced) gsap.from(d.querySelector('div'), { height: 0, opacity: 0, duration: 0.5, ease: EASE_OUT, clearProps: 'height,opacity' });
}));

// ---------- Menu plein écran ----------
(function menu() {
  const btn = $('.menu-btn');
  const panel = $('#menu');
  let open = false;
  const toggle = (force) => {
    open = force ?? !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('span').textContent = open ? 'Fermer' : 'Menu';
    gsap.killTweensOf(panel);
    if (open) {
      panel.hidden = false;
      lenis?.stop();
      gsap.fromTo(panel, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: reduced ? 0 : 0.8, ease: EASE_IO });
      gsap.from($$('a', panel), { y: 40, opacity: 0, duration: reduced ? 0 : 0.8, ease: EASE_OUT, stagger: 0.06, delay: reduced ? 0 : 0.25 });
      $('a', panel).focus({ preventScroll: true });
    } else {
      lenis?.start();
      gsap.to(panel, { clipPath: 'inset(0 0 100% 0)', duration: reduced ? 0 : 0.5, ease: 'power3.inOut', onComplete: () => { panel.hidden = true; } });
    }
  };
  btn.addEventListener('click', () => toggle());
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { toggle(false); btn.focus(); } });
  // liens internes (en-tête, menu, boutons)
  $$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (open) toggle(false);
    scrollToTarget(target);
  }));
})();

// Recalcul une fois les polices chargées (les hauteurs changent)
document.fonts.ready.then(() => ScrollTrigger.refresh());
