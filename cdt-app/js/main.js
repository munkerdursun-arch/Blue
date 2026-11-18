// =====================================================================
// Conducteur de travaux augmenté — application
//  - page publique animée (le chantier se construit au défilement)
//  - connexion sur invitation (Supabase), activation du compte
//  - stagiaire : quiz final corrigé côté serveur, certificat PDF
//  - administrateur : invitations, suivi, formation complète, quiz
//  - vérification publique d'un certificat
// gsap, ScrollTrigger, Lenis, supabase et jspdf sont chargés en scripts classiques.
// =====================================================================
import { initBuilding } from './building.js';
import { initCourse } from './course.js';
import { initMono } from './mono.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

// ---------- configuration (clé publiable : conçue pour être publique, la sécurité est en base) ----------
const SUPABASE_URL = 'https://eaohftwefynaithyefxh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GbYBQZCToUA4LnczIfIKoQ_9ORDgw-v';
const FN_URL = SUPABASE_URL + '/functions/v1/admin-api';
const SITE_URL = 'https://munkerdursun-arch.github.io/Blue/cdt/';
const TRAINER = 'Munker Dursun';
const QUIZ_TOTAL = 20, PASS_MARK = 17; // quiz final : 20 questions, réussite à 17 (corrigé côté serveur)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'expo.out';

// =====================================================================
// SESSION
// =====================================================================
let profile = null;
async function loadProfile() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { profile = null; return null; }
  const { data } = await sb.from('profiles').select('id, email, full_name, role').eq('id', session.user.id).maybeSingle();
  profile = data || { id: session.user.id, email: session.user.email, full_name: '', role: 'none' };
  return profile;
}
const sessionReady = loadProfile().catch(() => null);
const isMember = () => profile && (profile.role === 'admin' || profile.role === 'trainee');
const isAdmin = () => profile?.role === 'admin';
const home = () => (isAdmin() ? '#/admin' : '#/quiz');


// ---------- mouvement réduit : respecté, avec possibilité d'activer ----------
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let forced = false;
try { forced = localStorage.getItem('cdt-motion') === 'on'; } catch { /* stockage indisponible */ }
const reduced = prefersReduced && !forced;
document.documentElement.classList.toggle('reduced', reduced);
if (reduced) {
  const n = document.createElement('div');
  n.className = 'motion-note'; n.setAttribute('role', 'status');
  n.innerHTML = '<p>Votre appareil demande de <b>réduire les animations</b>.</p><button type="button">Activer les animations</button>';
  n.querySelector('button').onclick = () => { try { localStorage.setItem('cdt-motion', 'on'); } catch { /* ignoré */ } location.reload(); };
  document.body.appendChild(n);
}

// ---------- scène 3D ----------
const building = initBuilding($('.scene3d'), { reducedMotion: reduced });
if (!building) document.documentElement.classList.add('no-webgl');

// ---------- défilement fluide ----------
const lenis = reduced ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
const onScrollFns = [];
const onScroll = (fn) => onScrollFns.push(fn);
if (lenis) {
  lenis.on('scroll', (e) => { ScrollTrigger.update(); onScrollFns.forEach((fn) => fn(e.scroll, e.velocity)); });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
} else addEventListener('scroll', () => onScrollFns.forEach((fn) => fn(scrollY, 0)), { passive: true });
const scrollTop = () => (lenis ? lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0));
const scrollToEl = (el) => (lenis ? lenis.scrollTo(el, { offset: -90, duration: 1.3 }) : el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));

const setProgress = gsap.quickSetter('.progress', 'scaleX');
const header = $('.header');
let lastY = 0;
onScroll((y) => {
  setProgress(y / Math.max(1, document.documentElement.scrollHeight - innerHeight));
  header.classList.toggle('is-scrolled', y > 30);
  if (y > innerHeight * 0.8 && y > lastY + 4) header.classList.add('is-hidden');
  else if (y < lastY - 4 || y < innerHeight * 0.8) header.classList.remove('is-hidden');
  lastY = y;
});

// ---------- découpage du texte ----------
function splitChars(root) {
  root.setAttribute('aria-label', root.textContent.replace(/\s+/g, ' ').trim());
  $$('.line', root).forEach((line) => {
    const walk = (node, out) => node.childNodes.forEach((c) => {
      if (c.nodeType === 3) {
        c.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'wrd'; w.setAttribute('aria-hidden', 'true');
          [...part].forEach((ch) => { const s = document.createElement('span'); s.className = 'char'; s.textContent = ch; w.appendChild(s); });
          out.appendChild(w);
        });
      } else if (c.nodeType === 1) { const k = c.cloneNode(false); k.setAttribute('aria-hidden', 'true'); walk(c, k); out.appendChild(k); }
    });
    const f = document.createDocumentFragment(); walk(line, f); line.replaceChildren(f);
  });
  return $$('.char', root);
}
function splitWords(el) {
  const out = [];
  [...el.childNodes].forEach((n) => {
    if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach((p) => {
      if (!p) return;
      if (/^\s+$/.test(p)) { out.push(document.createTextNode(' ')); return; }
      const s = document.createElement('span'); s.className = 'w'; s.textContent = p; out.push(s);
    });
    else if (n.nodeType === 1) { n.classList.add('w'); out.push(n); }
  });
  el.replaceChildren(...out);
  return $$('.w', el);
}

// ---------- curseur et éléments magnétiques ----------
// (curseur personnalisé retiré à la demande du propriétaire : flèche normale du système)
function magnetic(scope = document) {
  if (!finePointer || reduced) return;
  $$('[data-magnetic]', scope).forEach((el) => {
    if (el.dataset.magOn) return; el.dataset.magOn = '1';
    const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' }), qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.25); qy((e.clientY - r.top - r.height / 2) * 0.25); });
    el.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });
}
magnetic();

// =====================================================================
// PAGE PUBLIQUE
// =====================================================================
const landing = $('#landing');
const app = $('#app');
const heroChars = splitChars($('.hero__title'));
const finalChars = splitChars($('.final__title'));
const ruleWords = splitWords($('[data-words]'));
let introDone = false;

function intro() {
  const tl = gsap.timeline({ defaults: { ease: EASE }, onComplete: () => { introDone = true; lenis?.start(); document.body.classList.remove('is-loading'); } });
  tl.to('.loader > *', { y: -24, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power3.in' })
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 0.95, ease: 'power4.inOut' }, '-=0.1')
    .to('.curtain', { clipPath: 'inset(0 0 100% 0)', duration: 0.95, ease: 'power4.inOut' }, '-=0.78')
    .add(() => updateBuild(), '-=0.6')
    .from(heroChars, { yPercent: 115, duration: 1.3, stagger: 0.025 }, '-=0.55')
    .from('.header > *', { y: -14, opacity: 0, duration: 0.9, stagger: 0.07 }, '-=1.1')
    .from('[data-reveal]', { y: 26, opacity: 0, duration: 1.1, stagger: 0.1 }, '-=1')
    .from('.hero__scale', { opacity: 0, duration: 0.8 }, '-=0.6')
    .set(['.loader', '.curtain'], { display: 'none' });
  if (reduced) tl.progress(1);
}
(function preload() {
  const count = $('[data-count]'), path = $('.loader__plan path');
  const st = { p: 0 };
  const render = () => { count.textContent = Math.round(st.p); path.style.strokeDashoffset = String(520 * (1 - st.p / 100)); };
  const ready = Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, reduced ? 0 : 900)), sessionReady]);
  const tw = gsap.to(st, { p: 88, duration: reduced ? 0.1 : 1.6, ease: 'power2.out', onUpdate: render });
  ready.then(() => { tw.kill(); gsap.to(st, { p: 100, duration: 0.4, onUpdate: render, onComplete: intro }); });
})();

// --- construction continue liée au défilement : on interpole entre les sections ---
const buildSections = $$('[data-build]', landing);
let anchors = [];
function measureAnchors() {
  anchors = buildSections.map((s) => {
    const box = s.closest('.pin-spacer') || s;
    const r = box.getBoundingClientRect();
    return { top: r.top + scrollY, h: r.height, el: s, build: +s.dataset.build, orbit: +s.dataset.orbit, shift: +s.dataset.shift, lights: +(s.dataset.lights || 0), dark: s.hasAttribute('data-dark') };
  });
}
function updateBuild() {
  if (!building || landing.hidden || !anchors.length) return;
  const y = scrollY + innerHeight * 0.55;
  let i = 0;
  while (i < anchors.length - 1 && y >= anchors[i + 1].top) i++;
  const a = anchors[i], b = anchors[Math.min(i + 1, anchors.length - 1)];
  const t = b === a ? 0 : Math.max(0, Math.min(1, (y - a.top) / (b.top - a.top)));
  const L = (k) => a[k] + (b[k] - a[k]) * t;
  building.setProgress(introDone || !reduced ? L('build') : a.build);
  building.setOrbit(L('orbit'));
  building.setShift(L('shift'));
  building.setLights(L('lights'));
  document.body.classList.toggle('is-dark', (b.dark && t > 0.35) || a.dark);
}
onScroll(() => updateBuild());
ScrollTrigger.addEventListener('refresh', () => { measureAnchors(); updateBuild(); });

// --- trois niveaux : défilement horizontal épinglé (créé en premier) ---
(function levels() {
  const track = $('.levels__track');
  const dist = () => Math.max(0, track.scrollWidth - innerWidth + 40);
  const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.levels', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
  $$('.lvl:not(.lvl--intro)').forEach((p) => {
    gsap.from(p.children, { y: 40, opacity: 0, duration: 1, stagger: 0.07, ease: EASE, scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 85%' } });
    gsap.from($$('.meter i', p), { scaleX: 0, transformOrigin: 'left', duration: 0.8, stagger: 0.12, ease: EASE, scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 70%' } });
  });
  if (!reduced) {
    const sk = gsap.quickTo('.lvl', 'skewX', { duration: 0.5, ease: 'power3.out' });
    onScroll((_, v) => sk(gsap.utils.clamp(-6, 6, -v * 0.2)));
  }
})();

if (!reduced) {
  // règle d'or : les mots s'allument
  gsap.to(ruleWords, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.rule__text', start: 'top 78%', end: 'bottom 50%', scrub: 0.6 } });
  gsap.from(ruleWords, { yPercent: 40, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.rule__text', start: 'top 85%', end: 'bottom 55%', scrub: 0.6 } });
  // cotes : le trait se dessine
  $$('.cote', landing).forEach((c) => gsap.fromTo(c, { '--draw': 0 }, { '--draw': 1, duration: 1.2, ease: EASE, scrollTrigger: { trigger: c, start: 'top 90%' } }));
  // chiffres
  gsap.from('.fig', { y: 50, opacity: 0, duration: 1.1, stagger: 0.1, ease: EASE, scrollTrigger: { trigger: '.figures', start: 'top 80%' } });
  $$('[data-to]').forEach((el) => { const o = { v: 0 }; gsap.to(o, { v: +el.dataset.to, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); }, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); });
  // programme : chaque ligne se trace comme sur un plan
  $$('.plan').forEach((ol) => {
    const lis = $$('li', ol);
    gsap.from(lis, { x: -24, opacity: 0, duration: 0.8, stagger: 0.06, ease: EASE, scrollTrigger: { trigger: ol, start: 'top 82%' } });
    lis.forEach((li, i) => gsap.fromTo(li, { '--draw': 0 }, { '--draw': 1, duration: 1, delay: i * 0.06, ease: EASE, scrollTrigger: { trigger: ol, start: 'top 82%' } }));
  });
  gsap.from('.program .big, .cert .big', { y: 40, opacity: 0, duration: 1.2, ease: EASE, stagger: 0.2, scrollTrigger: { trigger: '.program', start: 'top 75%' } });
  // certificat : étapes en cascade, carte qui se pose
  gsap.from('.steps4 li', { y: 50, opacity: 0, duration: 1, stagger: 0.12, ease: EASE, scrollTrigger: { trigger: '.steps4', start: 'top 82%' } });
  gsap.fromTo('.certcard', { rotateX: 24, y: 80, opacity: 0, transformPerspective: 1200 }, { rotateX: 0, y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.certcard', start: 'top 95%', end: 'top 45%', scrub: 0.8 } });
  // titre final
  gsap.from(finalChars, { yPercent: 115, duration: 1.3, stagger: 0.03, ease: EASE, scrollTrigger: { trigger: '.final__title', start: 'top 80%' } });
}

// --- titre d'accueil : les lettres s'élargissent sous le curseur (police à largeur variable) ---
(function heroStretch() {
  if (!finePointer || reduced) return;
  const hero = $('.hero');
  const chars = heroChars.map((el) => ({ el, cx: 0, cy: 0 }));
  const measure = () => chars.forEach((c) => { const r = c.el.getBoundingClientRect(); c.cx = r.left + r.width / 2; c.cy = r.top + r.height / 2 + scrollY; });
  let mx = -1e4, my = -1e4, raf = 0, active = false;
  const upd = () => {
    raf = 0;
    for (const c of chars) {
      const f = Math.max(0, 1 - Math.hypot(mx - c.cx, my - (c.cy - scrollY)) / 240);
      c.el.style.fontStretch = (72 + 48 * f).toFixed(1) + '%';
    }
  };
  hero.addEventListener('pointermove', (e) => { if (!active) { active = true; measure(); } mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(upd); });
  hero.addEventListener('pointerleave', () => { active = false; mx = my = -1e4; if (!raf) raf = requestAnimationFrame(upd); });
  addEventListener('resize', () => { active = false; });
})();

function renderHeader() {
  const logged = isMember();
  const inApp = landing.hidden;
  $('.header__nav[data-public]').hidden = logged || inApp;
  $('.pill-btn[data-public]').hidden = logged || location.hash.startsWith('#/connexion');
  $$('[data-private]').forEach((e) => { e.hidden = !logged; });
  if (!logged) return;
  $('.userchip__name').textContent = profile.full_name || profile.email;
  $('.userchip__role').textContent = isAdmin() ? 'Admin' : 'Stagiaire';
  const links = isAdmin()
    ? [['#/admin', 'Administration'], ['#/formation', 'Formation'], ['#/quiz', 'Quiz final'], ['#/certificat', 'Certificat']]
    : [['#/quiz', 'Quiz final'], ['#/certificat', 'Mon certificat']];
  const nav = $('.header__nav[data-private]');
  nav.innerHTML = links.map(([h, t]) => `<a href="${h}">${t}</a>`).join('');
  $$('a', nav).forEach((a) => a.classList.toggle('is-active', location.hash.startsWith(a.getAttribute('href'))));
}
document.addEventListener('click', async (e) => {
  if (e.target.closest('[data-logout]')) { await sb.auth.signOut(); profile = null; location.hash = '#/'; renderHeader(); }
});
function subnav() {
  if (!isMember()) return '';
  const links = isAdmin() ? [['#/admin', 'Admin'], ['#/formation', 'Formation'], ['#/quiz', 'Quiz'], ['#/certificat', 'Certificat']] : [['#/quiz', 'Quiz final'], ['#/certificat', 'Mon certificat']];
  return `<nav class="row subnav" style="margin-bottom:22px" aria-label="Sections">${links.map(([h, t]) => `<a class="mini" href="${h}" ${location.hash.startsWith(h) ? 'style="background:var(--ink);color:var(--bg)"' : ''}>${t}</a>`).join('')}</nav>`;
}

// =====================================================================
// ROUTEUR
// =====================================================================
let viewCtx = null;
function showApp(html) {
  viewCtx?.revert(); viewCtx = null;
  landing.hidden = true; app.hidden = false;
  app.innerHTML = html;
  document.body.classList.remove('is-dark');
  building?.setProgress(1); building?.setLights(0); building?.setOrbit(0.85); building?.setShift(0.3); building?.setDim(0.55);
  scrollTop();
  renderHeader();
  requestAnimationFrame(() => ScrollTrigger.refresh());
  // entrée de la vue
  if (!reduced) gsap.from(app.querySelectorAll('.view__head > *, .panel, .stats3 > *'), { y: 26, opacity: 0, duration: 0.9, stagger: 0.06, ease: EASE, clearProps: 'transform,opacity' });
  magnetic(app);
}
function showLanding() {
  viewCtx?.revert(); viewCtx = null;
  app.hidden = true; app.innerHTML = ''; landing.hidden = false;
  building?.setDim(0);
  renderHeader();
  requestAnimationFrame(() => { ScrollTrigger.refresh(); measureAnchors(); updateBuild(); });
}
function params() { const q = location.hash.split('?')[1] || ''; return new URLSearchParams(q); }

async function route() {
  await sessionReady;
  const h = location.hash || '#/';
  const path = h.startsWith('#/') ? h.slice(1).split('?')[0] : '/';
  if (path === '/' || path === '') return showLanding();
  if (path === '/verifier') return viewVerify();
  if (path === '/activer') return viewActivate();
  if (path === '/installation') return viewSetup();
  if (path === '/connexion') return isMember() ? (location.hash = home()) : viewLogin();
  if (!isMember()) return profile ? viewNotInvited() : (location.hash = '#/connexion');
  if (path === '/quiz') return viewQuiz();
  if (path === '/certificat') return viewCertificate();
  if (path === '/admin') return isAdmin() ? viewAdmin() : (location.hash = home());
  if (path === '/formation') return isAdmin() ? viewCourse() : (location.hash = home());
  return showLanding();
}
addEventListener('hashchange', route);

// liens internes « #section » (sans « / ») : défilement doux, sans quitter la vue
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href.startsWith('#/')) return;
  e.preventDefault();
  const el = href.length > 1 && document.getElementById(href.slice(1));
  if (el) requestAnimationFrame(() => scrollToEl(el));
});

// =====================================================================
// VUES
// =====================================================================
function viewLogin(msg = '') {
  showApp(`<section class="view view--narrow">
    <div class="view__head"><p class="cote"><span>Accès</span> Espace stagiaire</p><h1 class="view__title">Se <em>connecter</em></h1>
    <p class="view__sub">Accès réservé aux personnes invitées par le formateur.</p></div>
    <div class="panel"><form class="form" id="login" novalidate>
      ${msg ? `<p class="msg msg--info">${esc(msg)}</p>` : ''}
      <div class="field"><label for="em">E-mail</label><input id="em" type="email" autocomplete="email" required /></div>
      <div class="field"><label for="pw">Mot de passe</label><input id="pw" type="password" autocomplete="current-password" required /></div>
      <p class="msg msg--err" id="err" hidden></p>
      <button class="btn btn--pri" type="submit">Se connecter</button>
      <p class="muted">Première connexion ? Ouvrez le lien personnel envoyé par votre formateur. Mot de passe oublié ? Demandez-lui un nouveau lien.</p>
    </form></div></section>`);
  $('#login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter; btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value });
    btn.disabled = false;
    if (error) { const er = $('#err'); er.hidden = false; er.textContent = 'E-mail ou mot de passe incorrect.'; return; }
    await loadProfile();
    location.hash = isMember() ? home() : '#/connexion';
    if (!isMember()) viewNotInvited();
  });
}

function viewNotInvited() {
  showApp(`<section class="view view--narrow"><div class="panel"><h2>Accès non autorisé</h2>
    <p>Ce compte n'a pas été invité à la formation. Contactez votre formateur.</p>
    <div class="row" style="margin-top:18px"><button class="btn" data-logout>Se déconnecter</button></div></div></section>`);
}

async function viewActivate() {
  const p = params(); const t = p.get('t'), type = p.get('type') === 'recovery' ? 'recovery' : 'invite';
  showApp(`<section class="view view--narrow"><div class="view__head"><p class="cote"><span>Activation</span> Votre compte</p><h1 class="view__title">Bienvenue <em>sur le chantier</em></h1></div><div class="panel" id="act"><p class="muted">Vérification de votre lien…</p></div></section>`);
  const box = $('#act');
  if (t) {
    const { error } = await sb.auth.verifyOtp({ token_hash: t, type });
    if (error) {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { box.innerHTML = '<p class="msg msg--err">Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien à votre formateur.</p>'; return; }
    }
  }
  await loadProfile();
  if (!profile) { box.innerHTML = '<p class="msg msg--err">Lien invalide. Demandez un nouveau lien à votre formateur.</p>'; return; }
  if (!isMember()) { box.innerHTML = '<p class="msg msg--err">Ce compte n\'a pas été invité.</p>'; return; }
  history.replaceState(null, '', '#/activer'); // retire le jeton de l'adresse
  renderHeader();
  box.innerHTML = `<form class="form" id="actf" novalidate>
    <div class="field"><label for="nm">Nom et prénom</label><input id="nm" value="${esc(profile.full_name)}" required maxlength="120" /><small>Tel qu'il apparaîtra sur votre certificat.</small></div>
    <div class="field"><label for="p1">Mot de passe</label><input id="p1" type="password" autocomplete="new-password" minlength="8" required /><small>8 caractères minimum.</small></div>
    <div class="field"><label for="p2">Confirmation</label><input id="p2" type="password" autocomplete="new-password" required /></div>
    <p class="msg msg--err" id="err" hidden></p>
    <button class="btn btn--pri" type="submit">Activer mon compte</button></form>`;
  $('#actf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const er = $('#err'); er.hidden = true;
    const nm = $('#nm').value.trim(), p1 = $('#p1').value, p2 = $('#p2').value;
    if (nm.length < 2) { er.hidden = false; er.textContent = 'Indiquez votre nom et prénom.'; return; }
    if (p1.length < 8) { er.hidden = false; er.textContent = 'Le mot de passe doit faire au moins 8 caractères.'; return; }
    if (p1 !== p2) { er.hidden = false; er.textContent = 'Les deux mots de passe sont différents.'; return; }
    e.submitter.disabled = true;
    const { error } = await sb.auth.updateUser({ password: p1 });
    if (error) { e.submitter.disabled = false; er.hidden = false; er.textContent = 'Impossible d\'enregistrer le mot de passe : ' + error.message; return; }
    if (nm !== profile.full_name) await sb.rpc('set_my_name', { p_name: nm });
    await loadProfile();
    location.hash = home();
  });
}

// ---------- quiz final ----------
async function viewQuiz() {
  showApp(`<section class="view" style="max-width:820px">${subnav()}<div class="view__head"><p class="cote"><span>Évaluation</span> Quiz final</p><h1 class="view__title">Quiz <em>final</em></h1>
    <p class="view__sub">${QUIZ_TOTAL} questions sur la formation. Réussite à partir de ${PASS_MARK} bonnes réponses : votre certificat est alors délivré immédiatement.</p></div>
    <div class="panel" id="qz"><p class="muted">Chargement…</p></div></section>`);
  const box = $('#qz');
  const [{ data: cert }, { data: qs, error }] = await Promise.all([
    sb.from('certificates').select('*').eq('user_id', profile.id).maybeSingle(),
    sb.from('quiz_questions').select('id, position, question, options').order('position'),
  ]);
  if (!box.isConnected) return;
  if (cert && !isAdmin()) {
    box.innerHTML = `<h2>Quiz validé</h2><p>Vous avez obtenu ${cert.score} / ${cert.total} le ${fmtDate(cert.issued_at)}. Votre certificat est disponible.</p><div class="row" style="margin-top:18px"><a class="btn btn--pri" href="#/certificat">Voir mon certificat</a></div>`;
    return;
  }
  if (error || !qs?.length) { box.innerHTML = '<p class="msg msg--err">Impossible de charger le quiz. Réessayez plus tard.</p>'; return; }
  const answers = new Array(qs.length).fill(-1);
  let cur = 0, wrong = [];
  const L = 'ABCD';
  function render(dir = 1) {
    const q = qs[cur];
    const done = answers.filter((a) => a >= 0).length;
    box.innerHTML = `<p class="quiz__count">Question ${cur + 1} / ${qs.length}</p>
      <div class="quiz__bar"><i style="width:${(done / qs.length) * 100}%"></i></div>
      <div id="qcard"><h2 class="quiz__q">${esc(q.question)}</h2>
      <div class="opts" role="group" aria-label="Réponses">${q.options.map((o, i) => `<button type="button" class="opt" data-i="${i}" aria-pressed="${answers[cur] === i}"><b>${L[i]}</b><span>${esc(o)}</span></button>`).join('')}</div></div>
      <div class="quiz__nav"><button class="btn btn--ghost btn--sm" id="prev" ${cur === 0 ? 'disabled' : ''}>← Précédente</button>
      ${cur < qs.length - 1 ? `<button class="btn btn--sm" id="next">Suivante →</button>` : `<button class="btn btn--pri" id="send" ${done < qs.length ? 'disabled' : ''}>Valider mes réponses</button>`}</div>
      <div class="dots" aria-label="Aller à une question">${qs.map((_, i) => `<button type="button" data-g="${i}" class="${answers[i] >= 0 ? 'is-done' : ''} ${i === cur ? 'is-cur' : ''}" ${wrong.includes(i + 1) ? 'style="border-color:var(--bad);color:var(--bad)"' : ''} aria-label="Question ${i + 1}">${i + 1}</button>`).join('')}</div>
      ${done === qs.length && cur < qs.length - 1 ? '<p class="muted" style="margin-top:14px">Toutes les questions ont une réponse : allez à la dernière pour valider.</p>' : ''}`;
    if (!reduced) gsap.from('#qcard', { x: 40 * dir, opacity: 0, duration: 0.5, ease: EASE });
    $$('.opt', box).forEach((b) => b.onclick = () => {
      answers[cur] = +b.dataset.i;
      $$('.opt', box).forEach((x) => x.setAttribute('aria-pressed', x === b));
      setTimeout(() => { if (cur < qs.length - 1) { cur++; render(1); } else render(0); }, reduced ? 0 : 260);
    });
    $('#prev', box).onclick = () => { cur--; render(-1); };
    const nx = $('#next', box); if (nx) nx.onclick = () => { cur++; render(1); };
    $$('[data-g]', box).forEach((b) => b.onclick = () => { const n = +b.dataset.g; const d = n > cur ? 1 : -1; cur = n; render(d); });
    const sd = $('#send', box); if (sd) sd.onclick = submit;
  }
  async function submit() {
    box.innerHTML = '<p class="muted">Correction en cours…</p>';
    const { data, error } = await sb.rpc('submit_quiz', { p_answers: answers });
    if (error) { box.innerHTML = `<p class="msg msg--err">${esc(error.message.includes('limite') ? 'Vous avez atteint la limite de 5 tentatives en 24 h. Réessayez demain.' : 'La correction a échoué : ' + error.message)}</p><div class="row" style="margin-top:16px"><button class="btn" id="back">Revenir aux questions</button></div>`; $('#back').onclick = () => render(); return; }
    if (data.passed) {
      box.innerHTML = `<p class="quiz__count">Résultat</p><p class="score">${data.score}<small> / ${data.total}</small></p>
        <h2 style="margin-top:14px">Félicitations, quiz validé !</h2><p>Votre certificat de formation est délivré.</p>
        <div class="row" style="margin-top:20px"><a class="btn btn--pri" href="#/certificat">Voir et télécharger mon certificat</a></div>
        <h2 style="margin-top:34px">Corrigé</h2><ol class="corr">${data.corrections.map((c) => `<li class="${c.ok ? '' : 'is-bad'}"><b>${c.n}.</b> ${c.ok ? 'Juste.' : 'Réponse attendue : ' + esc(qs[c.n - 1].options[c.correct]) + '.'} ${esc(c.explanation)}</li>`).join('')}</ol>`;
      celebrate();
    } else {
      wrong = data.wrong;
      box.innerHTML = `<p class="quiz__count">Résultat</p><p class="score">${data.score}<small> / ${data.total}</small></p>
        <h2 style="margin-top:14px">Pas encore validé</h2><p>Il faut au moins ${data.pass_mark} bonnes réponses. Questions à revoir : <b>${data.wrong.join(', ')}</b>.</p>
        <p class="muted" style="margin-top:8px">Vous pouvez corriger vos réponses et revalider (5 tentatives maximum par 24 h).</p>
        <div class="row" style="margin-top:20px"><button class="btn btn--pri" id="retry">Corriger mes réponses</button></div>`;
      $('#retry').onclick = () => { cur = (data.wrong[0] || 1) - 1; render(); };
    }
  }
  render();
}

function celebrate() {
  if (reduced) return;
  const colors = ['#ffb000', '#14171b', '#e0d9cc', '#ff7a1a'];
  for (let i = 0; i < 90; i++) {
    const d = document.createElement('i');
    d.style.cssText = `position:fixed;left:50%;top:42%;width:${6 + Math.random() * 8}px;height:${6 + Math.random() * 8}px;background:${colors[i % 4]};z-index:130;pointer-events:none;border-radius:${i % 3 ? '2px' : '50%'}`;
    document.body.appendChild(d);
    const a = Math.random() * Math.PI * 2, v = 200 + Math.random() * 420;
    gsap.to(d, { x: Math.cos(a) * v, y: Math.sin(a) * v - 120, rotation: Math.random() * 720, duration: 0.9, ease: 'power3.out' });
    gsap.to(d, { y: '+=' + (400 + Math.random() * 300), opacity: 0, duration: 1.6, delay: 0.7, ease: 'power2.in', onComplete: () => d.remove() });
  }
}

// ---------- certificat ----------
function certCard(c) {
  return `<div class="certcard" style="margin:0 auto">
    <p class="certcard__kicker">Certificat de formation</p>
    <p class="certcard__title">Intelligence artificielle appliquée au métier du BTP</p>
    <p class="certcard__name">${esc(c.full_name)}</p>
    <p class="certcard__meta">Formation « Conducteur de travaux augmenté » · Évaluation finale ${c.score} / ${c.total} · Délivré le ${fmtDate(c.issued_at)} · Formateur : ${TRAINER}</p>
    <p class="certcard__code">N° ${esc(c.code)}</p></div>`;
}
const verifyUrl = (code) => `${SITE_URL}#/verifier?c=${encodeURIComponent(code)}`;
async function viewCertificate() {
  showApp(`<section class="view">${subnav()}<div class="view__head"><p class="cote"><span>Certificat</span> Formation IA · BTP</p><h1 class="view__title">Mon <em>certificat</em></h1></div><div id="cbox"><div class="panel"><p class="muted">Chargement…</p></div></div></section>`);
  const box = $('#cbox');
  const { data: c } = await sb.from('certificates').select('*').eq('user_id', profile.id).maybeSingle();
  if (!box.isConnected) return;
  if (!c) { box.innerHTML = `<div class="panel"><h2>Pas encore de certificat</h2><p>Validez le quiz final (${PASS_MARK} / ${QUIZ_TOTAL} minimum) pour obtenir votre certificat.</p><div class="row" style="margin-top:18px"><a class="btn btn--pri" href="#/quiz">Passer le quiz final</a></div></div>`; return; }
  box.innerHTML = `${certCard(c)}<div class="row" style="justify-content:center;margin-top:30px">
    <button class="btn btn--pri" id="pdf">Télécharger le PDF</button><button class="btn" id="cpv">Copier le lien de vérification</button></div>
    <p class="muted" style="text-align:center;margin-top:14px">Toute personne peut vérifier l'authenticité de ce certificat avec son numéro.</p>`;
  if (!reduced) gsap.from('.certcard', { rotateX: 20, y: 60, opacity: 0, transformPerspective: 1200, duration: 1.2, ease: EASE });
  $('#pdf').onclick = () => certificatePDF(c);
  $('#cpv').onclick = (e) => copy(verifyUrl(c.code), e.currentTarget);
}

function certificatePDF(c) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;
  doc.setFillColor(251, 250, 246); doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor(20, 23, 27); doc.setLineWidth(1.2); doc.rect(9, 9, W - 18, H - 18);
  doc.setDrawColor(255, 176, 0); doc.setLineWidth(0.6); doc.rect(13, 13, W - 26, H - 26);
  // trame de plan discrète
  doc.setDrawColor(232, 228, 220); doc.setLineWidth(0.15);
  for (let x = 20; x < W - 20; x += 8) doc.line(x, 16, x, H - 16);
  for (let y = 20; y < H - 16; y += 8) doc.line(16, y, W - 16, y);
  doc.setFillColor(251, 250, 246); doc.rect(24, 24, W - 48, H - 48, 'F');
  // logo
  doc.setFillColor(20, 23, 27); doc.roundedRect(28, 28, 14, 14, 2.5, 2.5, 'F');
  doc.setFillColor(255, 176, 0); doc.lines([[4, -2.6], [4, 2.6], [0, 5.6], [-2.6, 0], [0, -3.2], [-2.8, 0], [0, 3.2], [-2.6, 0]], 31, 34.5, [1, 1], 'F', true);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 23, 27);
  doc.text('CDT AUGMENTÉ', 46, 34); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 122); doc.text('Formation IA · BTP', 46, 39);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(138, 83, 0);
  doc.text('CERTIFICAT DE FORMATION', 32, 62, { charSpace: 1.4 });
  doc.setTextColor(20, 23, 27); doc.setFontSize(26);
  doc.text('INTELLIGENCE ARTIFICIELLE APPLIQUÉE', 32, 76); doc.text('AU MÉTIER DU BTP', 32, 87);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(107, 114, 122);
  doc.text('Décerné à', 32, 104);
  doc.setTextColor(20, 23, 27); doc.setFontSize(34);
  doc.text(c.full_name, 32, 119);
  doc.setDrawColor(20, 23, 27); doc.setLineWidth(0.3); doc.line(32, 124, W - 32, 124);
  doc.setFontSize(11.5); doc.setTextColor(60, 67, 75);
  const body = `pour avoir suivi la formation « Conducteur de travaux augmenté » (agents IA, prompts, automatisation avec n8n et Paperclip, sécurité, RGPD et AI Act) et validé l'évaluation finale avec un score de ${c.score} / ${c.total}.`;
  doc.text(doc.splitTextToSize(body, W - 64), 32, 134);
  // pied
  const y = 166;
  doc.setFontSize(8.5); doc.setTextColor(107, 114, 122);
  doc.text('DÉLIVRÉ LE', 32, y); doc.text('FORMATEUR', 120, y); doc.text('NUMÉRO', 200, y);
  doc.setFontSize(12); doc.setTextColor(20, 23, 27);
  doc.text(fmtDate(c.issued_at), 32, y + 7);
  doc.setFont('times', 'italic'); doc.setFontSize(18); doc.text(TRAINER, 120, y + 8);
  doc.setFont('courier', 'bold'); doc.setFontSize(11.5); doc.text(c.code, 200, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(107, 114, 122);
  doc.text('Vérifier ce certificat :', 200, y + 14); doc.text(SITE_URL + '#/verifier', 200, y + 18);
  doc.setFillColor(255, 176, 0); doc.rect(W - 46, 28, 18, 3, 'F');
  doc.save(`certificat-formation-IA-BTP-${c.full_name.replace(/[^\p{L}\p{N}]+/gu, '-')}.pdf`);
}

async function copy(text, btn) {
  try { await navigator.clipboard.writeText(text); const t = btn.textContent; btn.textContent = 'Copié ✓'; setTimeout(() => { btn.textContent = t; }, 1500); }
  catch { prompt('Copiez ce texte :', text); }
}

// ---------- installation / récupération du compte administrateur (code secret) ----------
function viewSetup() {
  showApp(`<section class="view view--narrow"><div class="view__head"><p class="cote"><span>Admin</span> Installation</p><h1 class="view__title">Compte <em>administrateur</em></h1>
    <p class="view__sub">Saisissez votre code d'installation pour obtenir un lien d'activation (première fois ou mot de passe oublié).</p></div>
    <div class="panel"><form class="form" id="su"><div class="field"><label for="sc">Code d'installation</label><input id="sc" type="password" autocomplete="off" required /></div>
    <p class="msg msg--err" id="err" hidden></p><button class="btn btn--pri" type="submit">Obtenir mon lien</button></form><div id="sr"></div></div></section>`);
  $('#su').addEventListener('submit', async (e) => {
    e.preventDefault();
    const er = $('#err'); er.hidden = true; e.submitter.disabled = true;
    try {
      const r = await fetch(FN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, body: JSON.stringify({ action: 'bootstrap', code: $('#sc').value.trim(), full_name: TRAINER }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'code invalide' ? 'Code incorrect.' : j.error || 'Erreur');
      $('#sr').innerHTML = `<div class="invite-res"><p>Lien prêt (usage unique, durée limitée).</p><a class="btn btn--pri" href="${esc(j.link)}">Activer mon compte administrateur</a></div>`;
    } catch (err) { er.hidden = false; er.textContent = err.message; }
    e.submitter.disabled = false;
  });
}

// ---------- vérification publique ----------
async function viewVerify() {
  const code = params().get('c') || '';
  showApp(`<section class="view view--narrow"><div class="view__head"><p class="cote"><span>Vérification</span> Certificat</p><h1 class="view__title">Vérifier un <em>certificat</em></h1></div>
    <div class="panel"><form class="form" id="vf"><div class="field"><label for="vc">Numéro du certificat</label><input id="vc" value="${esc(code)}" placeholder="CDT-2026-…" required /></div><button class="btn btn--pri" type="submit">Vérifier</button></form><div id="vr" style="margin-top:22px"></div></div></section>`);
  const run = async (c) => {
    const box = $('#vr'); box.innerHTML = '<p class="muted">Vérification…</p>';
    const { data } = await sb.rpc('verify_certificate', { p_code: c });
    if (data?.length) {
      const r = data[0];
      box.innerHTML = `<div class="verif"><div class="verif__icon verif__icon--ok">✓</div><h2>Certificat authentique</h2><p><b>${esc(r.full_name)}</b> a validé la formation « Conducteur de travaux augmenté » (IA appliquée au métier du BTP) le ${fmtDate(r.issued_at)}, avec ${r.score} / ${r.total}.</p></div>`;
    } else box.innerHTML = '<div class="verif"><div class="verif__icon verif__icon--bad">✕</div><h2>Certificat introuvable</h2><p>Aucun certificat ne correspond à ce numéro. Vérifiez la saisie.</p></div>';
  };
  $('#vf').addEventListener('submit', (e) => { e.preventDefault(); run($('#vc').value.trim()); });
  if (code) run(code);
}

// ---------- administration ----------
async function callAdmin(body) {
  const { data: { session } } = await sb.auth.getSession();
  const r = await fetch(FN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: 'réponse illisible' }));
  if (!r.ok) throw new Error(j.error || 'erreur');
  return j;
}
function mailto(name, email, link) {
  const subject = 'Votre accès à la formation « Conducteur de travaux augmenté »';
  const body = `Bonjour ${name},\n\nVoici votre lien personnel pour accéder au quiz final de la formation « Conducteur de travaux augmenté » et obtenir votre certificat :\n\n${link}\n\nCe lien est à usage unique et à durée limitée : il vous permet de choisir votre mot de passe. Ensuite, connectez-vous sur ${SITE_URL}#/connexion avec votre adresse e-mail.\n\nÀ bientôt,\n${TRAINER}`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function linkBox(name, email, link) {
  return `<div class="invite-res"><p><b>Lien d'activation de ${esc(name)}</b> (usage unique, durée limitée). Transmettez-le par e-mail, SMS ou messagerie.</p><code>${esc(link)}</code>
    <div class="row"><button class="btn btn--pri btn--sm" data-copy="${esc(link)}">Copier le lien</button><a class="btn btn--sm" href="${esc(mailto(name, email, link))}">Préparer l'e-mail</a></div></div>`;
}
async function viewAdmin() {
  showApp(`<section class="view">${subnav()}<div class="view__head"><p class="cote"><span>Admin</span> Tableau de bord</p><h1 class="view__title">Administra<em>tion</em></h1>
    <p class="view__sub">Invitez une personne : elle accède uniquement au quiz final et reçoit son certificat après réussite. Vous avez accès à tout.</p></div>
    <div class="stats3" id="st"><div class="stat"><b>–</b><span>Invités</span></div><div class="stat"><b>–</b><span>Comptes activés</span></div><div class="stat"><b>–</b><span>Certifiés</span></div></div>
    <div class="panel"><h2>Inviter un stagiaire</h2><form class="form" id="inv" novalidate><div class="row" style="align-items:flex-end">
      <div class="field" style="flex:1 1 220px"><label for="in">Nom et prénom</label><input id="in" required maxlength="120" /></div>
      <div class="field" style="flex:1 1 260px"><label for="ie">E-mail</label><input id="ie" type="email" required /></div>
      <button class="btn btn--pri" type="submit">Créer l'invitation</button></div><p class="msg msg--err" id="ierr" hidden></p></form><div id="ires"></div></div>
    <div class="panel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Stagiaires</h2><button class="mini" id="refresh">Actualiser</button></div>
      <div id="list" style="margin-top:16px"><p class="muted">Chargement…</p></div></div>
    <div class="panel"><h2>Raccourcis</h2><div class="row"><a class="btn btn--sm" href="#/formation">Voir toute la formation</a><a class="btn btn--sm" href="#/quiz">Tester le quiz final</a><a class="btn btn--sm" href="#/verifier">Vérifier un certificat</a></div></div></section>`);
  const list = $('#list');
  let rows = [];
  async function load() {
    const { data, error } = await sb.rpc('admin_trainees');
    if (!list.isConnected) return; // la vue a été quittée pendant le chargement
    if (error) { list.innerHTML = `<p class="msg msg--err">${esc(error.message)}</p>`; return; }
    rows = (data || []).filter((r) => r.role !== 'admin');
    const st = $$('#st b');
    st[0].textContent = rows.length; st[1].textContent = rows.filter((r) => r.activated).length; st[2].textContent = rows.filter((r) => r.certificate).length;
    if (!rows.length) { list.innerHTML = '<p class="muted">Aucun stagiaire pour l\'instant. Créez une première invitation ci-dessus.</p>'; return; }
    list.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Stagiaire</th><th>Statut</th><th>Tentatives</th><th>Meilleur score</th><th>Certificat</th><th>Actions</th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr><td><b>${esc(r.full_name)}</b><br><span class="muted">${esc(r.email)}</span></td>
        <td>${r.certificate ? '<span class="tag tag--y">Certifié</span>' : r.activated ? '<span class="tag tag--ok">Actif</span>' : '<span class="tag">Invité</span>'}</td>
        <td>${r.attempts || 0}</td><td>${r.best != null ? r.best + ' / ' + QUIZ_TOTAL : '–'}</td>
        <td>${r.certificate ? `<span style="font-family:var(--mono);font-size:12px">${esc(r.certificate.code)}</span><br><button class="mini" data-pdf="${i}">PDF</button>` : '–'}</td>
        <td><div class="row" style="gap:6px"><button class="mini" data-relink="${i}">Nouveau lien</button><button class="mini mini--danger" data-revoke="${i}">Retirer</button></div></td></tr>`).join('')}
      </tbody></table></div><div id="rl"></div>`;
  }
  load();
  $('#refresh').onclick = load;
  $('#inv').addEventListener('submit', async (e) => {
    e.preventDefault();
    const er = $('#ierr'); er.hidden = true;
    const name = $('#in').value.trim(), email = $('#ie').value.trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { er.hidden = false; er.textContent = 'Indiquez un nom et une adresse e-mail valides.'; return; }
    e.submitter.disabled = true;
    try {
      const r = await callAdmin({ action: 'invite', full_name: name, email });
      $('#ires').innerHTML = linkBox(r.full_name, r.email, r.link);
      $('#in').value = ''; $('#ie').value = '';
      load();
    } catch (err) { er.hidden = false; er.textContent = err.message; }
    e.submitter.disabled = false;
  });
  $('.view', app).addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) return copy(b.dataset.copy, b);
    if (b.dataset.pdf) return certificatePDF(rows[+b.dataset.pdf].certificate);
    if (b.dataset.relink) {
      const r = rows[+b.dataset.relink]; b.disabled = true;
      try { const j = await callAdmin({ action: 'relink', email: r.email }); $('#rl').innerHTML = linkBox(r.full_name, r.email, j.link); scrollToEl($('#rl')); }
      catch (err) { alert(err.message); }
      b.disabled = false;
    }
    if (b.dataset.revoke) {
      const r = rows[+b.dataset.revoke];
      if (!confirm(`Retirer l'accès de ${r.full_name} ? Son compte, ses tentatives et son certificat seront supprimés.`)) return;
      try { await callAdmin({ action: 'revoke', email: r.email }); load(); } catch (err) { alert(err.message); }
    }
  });
}

// ---------- formation complète (administrateur) ----------
let courseNode = null, courseReady = false;
async function viewCourse() {
  showApp(`<section class="view" style="max-width:1080px">${subnav()}<div class="view__head"><p class="cote"><span>Admin</span> Contenu complet</p><h1 class="view__title">La <em>formation</em></h1>
    <p class="view__sub">20 modules, 18 agents, outils interactifs. Visible uniquement par l'administrateur.</p><p class="muted" style="margin-top:10px">IA de l'entreprise : <b data-mono-badge>toutes les IA</b> · <a class="link" href="#monoia">changer</a></p></div><div id="cwrap"><div class="panel"><p class="muted">Chargement du contenu…</p></div></div></section>`);
  const wrap = $('#cwrap');
  if (!courseNode) {
    const [{ data: secs, error: e1 }, { data: dat, error: e2 }] = await Promise.all([
      sb.from('course_sections').select('id, position, title, html').order('position'),
      sb.from('course_data').select('key, value'),
    ]);
    if (e1 || e2 || !secs?.length) { wrap.innerHTML = '<div class="panel"><p class="msg msg--err">Contenu indisponible.</p></div>'; return; }
    courseNode = document.createElement('div');
    courseNode.className = 'course';
    const mods = secs.filter((s) => !s.id.startsWith('chap-'));
    courseNode.innerHTML = `<nav class="course-nav" aria-label="Modules">${mods.map((s) => `<a href="#${s.id}">${esc(s.html.match(/<div class="no">(?:<small>MOD\.<\/small>)?([^<]+)<\/div>/)?.[1] || '·')}</a>`).join('')}</nav>` + secs.map((s) => s.html).join('\n');
    // le quiz d'auto-évaluation devient l'accès au quiz final corrigé côté serveur
    const qcm = courseNode.querySelector('#qcm .body');
    if (qcm) qcm.innerHTML = '<p>L\'évaluation se fait avec le <b>quiz final</b> : 20 questions, correction côté serveur, réussite à 17 / 20, certificat délivré automatiquement.</p><div class="row"><a class="btn btn--pri" href="#/quiz">Ouvrir le quiz final</a></div>';
    wrap.replaceChildren(courseNode);
    const data = Object.fromEntries(dat.map((r) => [r.key, r.value]));
    initCourse(data);
    initMono(data, courseNode);
    courseReady = true;
  } else wrap.replaceChildren(courseNode);
  // animations des modules (recréées à chaque affichage, défaites en quittant la vue)
  viewCtx = gsap.context(() => {
    if (reduced) return;
    $$('.mod > header', courseNode).forEach((h) => {
      gsap.from(h.children, { y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: EASE, scrollTrigger: { trigger: h, start: 'top 85%' } });
    });
    $$('.flow', courseNode).forEach((f) => {
      const items = [...f.children];
      const tl = gsap.timeline({ scrollTrigger: { trigger: f, start: 'top 88%' } });
      items.forEach((el, i) => { if (el.classList.contains('ar')) tl.add(() => el.classList.add('is-lit'), i * 0.08); else tl.from(el, { y: 14, opacity: 0, scale: 0.94, duration: 0.5, ease: EASE }, i * 0.08); });
    });
    $$('.chapter__title', courseNode).forEach((t) => gsap.from(t, { y: 60, opacity: 0, duration: 1.2, ease: EASE, scrollTrigger: { trigger: t, start: 'top 85%' } }));
  }, courseNode);
  // module actif dans la barre (dans le même contexte, défait en quittant la vue)
  const links = $$('.course-nav a', courseNode);
  viewCtx.add(() => {
    $$('.mod', courseNode).forEach((m) => ScrollTrigger.create({ trigger: m, start: 'top 50%', end: 'bottom 50%', onToggle: (st) => { if (st.isActive) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + m.id)); } }));
  });
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
// les hauteurs changent (fiches ouvertes, onglets…) : on recalcule
let rT; new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(() => ScrollTrigger.refresh(), 250); }).observe(app);

// ---------- démarrage ----------
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') { profile = null; renderHeader(); } });
sessionReady.then(() => { renderHeader(); route(); });
document.fonts.ready.then(() => { ScrollTrigger.refresh(); measureAnchors(); updateBuild(); });
