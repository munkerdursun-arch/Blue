// =====================================================================
// Nocturne — orchestration : préchargeur, défilement fluide (Lenis),
// animations GSAP/ScrollTrigger, curseur, boutons magnétiques, menu.
// gsap, ScrollTrigger et Lenis sont chargés en scripts classiques (globals).
// =====================================================================
import { initScene } from './scene.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Courbes : une seule famille pour tout le site (cohérence = sensation « premium »)
const EASE_OUT = 'expo.out';
const EASE_IO = 'power4.inOut';

// ---------- Scène WebGL ----------
const scene = initScene($('.webgl'), { reducedMotion: reduced });
if (!scene) document.documentElement.classList.add('no-webgl');

// ---------- Défilement fluide ----------
// Désactivé si l'utilisateur demande moins de mouvement : on garde le défilement natif.
const lenis = reduced ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
if (lenis) {
  lenis.on('scroll', ({ scroll, velocity }) => {
    ScrollTrigger.update();
    scene?.setScroll(scroll, velocity);
  });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // bloqué pendant le préchargement
} else {
  addEventListener('scroll', () => scene?.setScroll(scrollY, 0), { passive: true });
}
const scrollToTarget = (el) => (lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));

// ---------- Découpage du texte ----------
// Lettres pour les grands titres ; on conserve un libellé accessible complet.
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
          clone.style.display = 'inline-block';
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
// Mots pour le manifeste
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
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
  tl.to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: EASE_IO })
    .add(() => scene?.reveal(), '-=0.6')
    .from(heroChars, { yPercent: 115, rotate: 6, duration: 1.4, stagger: 0.025 }, '-=0.5')
    .to('.slash--a', { scaleX: 1, duration: 1.6, ease: EASE_IO }, '-=1.3')
    .to('.slash--b', { scaleX: 1, duration: 1.6, ease: EASE_IO }, '<0.15')
    .from('.header > *', { y: -16, opacity: 0, duration: 1, stagger: 0.08 }, '-=1.4')
    .from('[data-reveal]', { y: 24, opacity: 0, duration: 1.2, stagger: 0.12 }, '-=1.1')
    .from('.scroll-hint', { opacity: 0, duration: 1 }, '-=0.8')
    .set('.loader', { display: 'none' });
  return tl;
}

(function preload() {
  const count = $('[data-count]');
  const bar = $('.loader__bar span');
  const state = { p: 0 };
  // On attend les polices (et un minimum de temps pour que le chargement « se lise »).
  const ready = Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, reduced ? 0 : 900))]);
  const tween = gsap.to(state, {
    p: 90, duration: reduced ? 0.1 : 1.6, ease: 'power2.out',
    onUpdate: () => { count.textContent = Math.round(state.p); bar.style.transform = `scaleX(${state.p / 100})`; },
  });
  ready.then(() => {
    tween.kill();
    gsap.to(state, {
      p: 100, duration: 0.5, ease: 'power2.out',
      onUpdate: () => { count.textContent = Math.round(state.p); bar.style.transform = `scaleX(${state.p / 100})`; },
      onComplete: intro,
    });
  });
})();

// ---------- Sculpture : une position par section ----------
$$('[data-scene]').forEach((sec) => {
  const i = Number(sec.dataset.scene);
  ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) scene?.setSection(i); }, // fiable même après un saut (ancre, menu)
  });
});

// ---------- Manifeste : les mots s'allument au fil du défilement ----------
gsap.to(manifestoWords, {
  color: 'var(--ink)', stagger: 0.1, ease: 'none',
  scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 45%', scrub: true },
});

// ---------- Titre du contact ----------
gsap.from(contactChars, {
  yPercent: 115, rotate: 6, duration: 1.4, ease: EASE_OUT, stagger: 0.02,
  scrollTrigger: { trigger: '.contact__title', start: 'top 80%' },
});

// ---------- Projets : aperçu flottant qui suit la souris ----------
(function projects() {
  const preview = $('.preview');
  const inner = $('.preview__inner');
  const label = $('.preview__label');
  if (!finePointer) return;
  gsap.set(preview, { scale: 0.9, opacity: 0, xPercent: -50, yPercent: -50 });
  const qx = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3.out' });
  const qy = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3.out' });
  const qr = gsap.quickTo(preview, 'rotation', { duration: 0.9, ease: 'power3.out' });
  let lastX = 0;
  addEventListener('pointermove', (e) => {
    qx(e.clientX); qy(e.clientY);
    qr(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.4)); // légère inclinaison selon la vitesse
    lastX = e.clientX;
  });
  $$('.project').forEach((p) => {
    p.addEventListener('pointerenter', () => {
      const h = Number(p.dataset.hue);
      inner.style.setProperty('--h', h);
      label.textContent = $('.project__name', p).textContent;
      gsap.to(preview, { scale: 1, opacity: 1, duration: 0.6, ease: EASE_OUT, overwrite: 'auto' });
      scene?.setHue(((h - 265) / 360) * Math.PI * 2 * 0.35); // nuance, pas un changement de couleur brutal
    });
    p.addEventListener('pointerleave', () => {
      gsap.to(preview, { scale: 0.9, opacity: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' }); // sortie plus rapide que l'entrée
      scene?.setHue(0);
    });
  });
})();

// ---------- Expertises : défilement horizontal épinglé ----------
(function horizontal() {
  const track = $('.expertise__track');
  const distance = () => track.scrollWidth - innerWidth + 40;
  gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: {
      trigger: '.expertise', start: 'top top', end: () => `+=${distance()}`,
      pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
    },
  });
})();

// ---------- Bandeau infini, accéléré par la vitesse de défilement ----------
$$('[data-marquee]').forEach((row) => {
  const dir = Number(row.dataset.marquee);
  const span = row.firstElementChild;
  for (let i = 0; i < 3; i++) row.appendChild(span.cloneNode(true)); // 4 copies : pas de trou
  if (reduced) return;
  // chaque copie glisse de sa propre largeur : la boucle est sans couture
  const [from, to] = dir > 0 ? [0, -100] : [-100, 0];
  const loop = gsap.fromTo(row.children, { xPercent: from }, { xPercent: to, duration: 22, ease: 'none', repeat: -1 });
  lenis?.on('scroll', ({ velocity }) => {
    const boost = 1 + Math.min(Math.abs(velocity) / 12, 4);
    gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true });
    gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.2 });
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
  const root = $('.cursor');
  const label = $('.cursor__label');
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' });
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  let shown = false;
  addEventListener('pointermove', (e) => {
    if (!shown) { gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); gsap.to(root, { opacity: 1, duration: 0.3 }); shown = true; }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, [data-cursor]');
    root.classList.toggle('is-hover', !!t);
    const text = t?.dataset.cursor;
    root.classList.toggle('is-label', !!text);
    if (text) label.textContent = text;
  });
  document.addEventListener('pointerleave', () => gsap.to(root, { opacity: 0, duration: 0.2 }));
  document.addEventListener('pointerenter', () => gsap.to(root, { opacity: 1, duration: 0.2 }));
})();

// ---------- Éléments magnétiques ----------
$$('[data-magnetic]').forEach((el) => {
  if (!finePointer || reduced) return;
  const strength = el.classList.contains('cta') ? 0.35 : 0.25;
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
    .from(links, { yPercent: 110, duration: 0.9, stagger: 0.06, ease: EASE_OUT }, '-=0.45')
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

// Recalcule les positions une fois les polices chargées (les titres changent de taille)
document.fonts.ready.then(() => ScrollTrigger.refresh());
