// =============================================================================
// Born Dash — point d'entrée : relie données, interface et rendu 3D.
// =============================================================================

import { ICONS, weatherInfo } from './icons.js';
import { loadSettings, saveSettings } from './settings.js';
import { createStore, Vehicle, DemoSource, GpsSource, planCharge, fetchWeather } from './data.js';
import { renderLaunchers, openUrl } from './apps.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let settings = loadSettings();
const getSettings = () => settings;

// --- Formatage français ------------------------------------------------------------
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fmtWeekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
const fmtDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
const duration = (min) => {
  if (!isFinite(min)) return '—';
  const m = Math.round(min);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
};

// --- Toast ---------------------------------------------------------------------------
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// --- Liaisons DOM (mise à jour uniquement si la valeur change) ----------------------
const bindCache = new Map();
function bind(values) {
  for (const [key, val] of Object.entries(values)) {
    if (bindCache.get(key) === val) continue;
    bindCache.set(key, val);
    $$(`[data-bind="${key}"]`).forEach((el) => { el.textContent = val; });
    $$(`[data-bind-width="${key}"]`).forEach((el) => { el.style.width = `${Math.max(0, Math.min(100, val))}%`; });
    $$(`[data-bind-class="${key}"]`).forEach((el) => {
      el.className = el.className.split(' ').filter((c) => !c.startsWith('dyn-') && !['demo', 'live', 'err', 'regen'].includes(c)).join(' ');
      if (val) el.classList.add(...String(val).split(' '));
    });
  }
}
function bindHTML(key, html) {
  if (bindCache.get(key) === html) return;
  bindCache.set(key, html);
  $$(`[data-bind="${key}"]`).forEach((el) => { el.innerHTML = html; });
}

// --- Icônes statiques -------------------------------------------------------------------
function injectIcons() {
  $('#btnSettings').innerHTML = ICONS.gear;
  $('#camPrev').innerHTML = ICONS.chevL;
  $('#camNext').innerHTML = ICONS.chevR;
  $('.launch-ico').innerHTML = ICONS.cast;
  $('.launch-chev').innerHTML = ICONS.chevR;
  $('.ico-battery').innerHTML = ICONS.battery;
  $('.ico-plug').innerHTML = ICONS.plug;
  $('.ico-route').innerHTML = ICONS.route;
  $$('[data-icon]').forEach((el) => { el.innerHTML = ICONS[el.dataset.icon] || ''; });
}

// --- Thème -------------------------------------------------------------------------------
function resolvedTheme() {
  if (settings.theme !== 'auto') return settings.theme;
  const h = new Date().getHours();
  return h >= 7 && h < 19 ? 'light' : 'dark';
}
function applyTheme() {
  const t = resolvedTheme();
  document.documentElement.dataset.theme = t;
  $('meta[name="theme-color"]').content = t === 'light' ? '#e9ebee' : '#0a0b0d';
  $('#btnTheme').innerHTML = settings.theme === 'auto' ? ICONS.auto : t === 'light' ? ICONS.sun : ICONS.moon;
  car?.setTheme(t === 'light');
}

// --- Données ------------------------------------------------------------------------------
const store = createStore({ gear: 'P', source: settings.source, status: 'demo', statusMsg: 'Mode démo', weather: null, position: null });
const vehicle = new Vehicle(store, getSettings);
let source = null;

function setStatus(status, msg) { store.set({ status, statusMsg: msg }); }

function startSource() {
  source?.stop();
  vehicle.setTargetSpeed(0);
  if (settings.source === 'gps') {
    source = new GpsSource(vehicle, setStatus, (position) => {
      store.set({ position });
      maybeFetchWeather(position);
    });
  } else {
    source = new DemoSource(vehicle);
    setStatus('demo', 'Mode démo · données simulées');
  }
  store.set({ source: settings.source });
  source.start();
}

let lastWeatherAt = 0;
async function maybeFetchWeather(pos) {
  if (!pos || Date.now() - lastWeatherAt < 15 * 60 * 1000) return;
  lastWeatherAt = Date.now();
  try {
    store.set({ weather: await fetchWeather(pos.lat, pos.lon) });
  } catch {
    lastWeatherAt = Date.now() - 13 * 60 * 1000; // nouvel essai dans ~2 min
  }
}

// Boucle de simulation à 10 Hz
let lastTick = performance.now();
setInterval(() => {
  const now = performance.now();
  const dt = Math.min(0.5, (now - lastTick) / 1000);
  lastTick = now;
  source?.tick(dt);
  vehicle.tick(dt);
}, 100);

// --- Rendu de l'interface -------------------------------------------------------------------
const RING_LEN = 2 * Math.PI * 84;
let activeTab = 'vehicle';

function render(s) {
  const gps = settings.source === 'gps';
  const est = gps ? ' (est.)' : '';
  const soc = s.soc ?? 0;
  const power = s.powerKw ?? 0;
  const regen = power < -0.5;

  bind({
    carName: settings.carName,
    sourceLabel: s.statusMsg,
    sourceDot: s.status === 'live' ? 'live' : s.status === 'err' ? 'err' : s.status === 'demo' ? 'demo' : '',
    speed: nf0.format(s.speed ?? 0),
    speedPct: ((s.speed ?? 0) / 160) * 100,
    soc: nf0.format(soc),
    socPct: soc,
    range: nf0.format(s.range ?? 0),
    rangeNote: gps ? 'estimée (modèle)' : 'estimée',
    power: nf0.format(Math.round(power) || 0),
    powerPct: (Math.abs(power) / (regen ? 60 : 150)) * 100,
    powerMeterClass: regen ? 'regen' : '',
    gear: s.gear ?? 'P',
    avgCons: nf1.format(s.avgCons ?? 0),
    energyLeft: nf1.format(s.energyLeft ?? 0),
    regen: nf1.format(s.trip?.regen ?? 0),
    socNote: gps ? 'estimé à partir du GPS' : '',
    chipEnergy: `${nf0.format(soc)} %${est} · ${nf0.format(s.range ?? 0)} km`,
    chipCharge: s.charging?.active ? `En charge · ${nf0.format(s.charging.kw)} kW` : 'Débranché',
    chipTrip: `${nf1.format(s.trip?.dist ?? 0)} km · ${duration((s.trip?.time ?? 0) / 60)}`,
    bridgeLabel: settings.urls.bridge ? "Ouvrir l'appli passerelle" : 'À configurer dans Réglages',
  });

  if (activeTab === 'energy') renderEnergy(s);
  if (activeTab === 'charge') renderChargeLive(s);
  if (activeTab === 'trip') renderTrip(s);
  car?.update(s);
}

function renderEnergy(s) {
  const soc = s.soc ?? 0;
  const arc = $('#socArc');
  arc.style.strokeDasharray = RING_LEN;
  arc.style.strokeDashoffset = RING_LEN * (1 - soc / 100);
  arc.style.stroke = soc < 15 ? 'var(--bad)' : soc < 30 ? 'var(--warn)' : 'var(--ok)';

  // Barre de puissance : -60 kW (régén.) à +150 kW (traction), zéro à 28,57 %
  const p = Math.max(-60, Math.min(150, s.powerKw ?? 0));
  const zero = 60 / 210;
  const fill = $('#powerFill');
  if (p >= 0) {
    fill.style.left = `${zero * 100}%`;
    fill.style.width = `${(p / 210) * 100}%`;
    fill.style.background = 'var(--accent)';
  } else {
    fill.style.left = `${(zero + p / 210) * 100}%`;
    fill.style.width = `${(-p / 210) * 100}%`;
    fill.style.background = 'var(--regen)';
  }
  drawSpark(s.history || []);
}

function canvasCtx(cv) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = cv.clientWidth;
  const h = cv.clientHeight;
  if (!w || !h) return null;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function drawSpark(hist) {
  const c = canvasCtx($('#spark'));
  if (!c) return;
  const { ctx, w, h } = c;
  const min = -60;
  const max = Math.max(40, ...hist.map((v) => v + 5));
  const y = (v) => h - 8 - ((v - min) / (max - min)) * (h - 16);
  // ligne du zéro
  ctx.strokeStyle = css('--line-2');
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(0, y(0)); ctx.lineTo(w, y(0)); ctx.stroke();
  ctx.setLineDash([]);
  if (hist.length < 2) return;
  const step = w / 299;
  const x0 = w - (hist.length - 1) * step;
  const path = new Path2D();
  hist.forEach((v, i) => (i ? path.lineTo(x0 + i * step, y(v)) : path.moveTo(x0, y(v))));
  // remplissage traction (cuivre) au-dessus de zéro, régénération (bleu) en dessous
  ctx.save();
  const area = new Path2D(path);
  area.lineTo(w, y(0)); area.lineTo(x0, y(0)); area.closePath();
  ctx.beginPath(); ctx.rect(0, 0, w, y(0)); ctx.clip();
  ctx.fillStyle = css('--accent-soft');
  ctx.fill(area);
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.rect(0, y(0), w, h); ctx.clip();
  ctx.fillStyle = 'rgba(72,198,255,0.18)';
  ctx.fill(area);
  ctx.restore();
  ctx.strokeStyle = css('--accent');
  ctx.lineWidth = 1.6;
  ctx.stroke(path);
}

// --- Charge -------------------------------------------------------------------------------
let chargerKw = 11;
function currentChargerKw() { return chargerKw === 'max' ? settings.maxDcKw : chargerKw; }

function renderChargePlan() {
  const s = store.get();
  const target = +$('#targetSoc').value;
  const from = Math.min(s.soc ?? 0, target);
  const plan = planCharge(from, target, currentChargerKw(), settings.capacityKwh, settings.maxDcKw);
  const end = new Date(Date.now() + plan.minutes * 60000);
  bind({
    targetSoc: String(target),
    chEnergy: nf1.format(plan.energyKwh),
    chTime: plan.energyKwh < 0.05 ? 'Déjà atteint' : duration(plan.minutes),
    chEnd: plan.energyKwh < 0.05 ? '—' : fmtTime.format(end),
    chCost: nf1.format(plan.gridKwh * settings.pricePerKwh),
  });
  drawChargeCurve(s.soc ?? 0, target);
}

function drawChargeCurve(soc, target) {
  const c = canvasCtx($('#chargeCurve'));
  if (!c) return;
  const { ctx, w, h } = c;
  const kw = currentChargerKw();
  const full = planCharge(0, 100, kw, settings.capacityKwh, settings.maxDcKw).curve;
  const maxP = Math.max(...full.map((p) => p[1])) * 1.15;
  const pad = { l: 34, r: 12, t: 14, b: 24 };
  const X = (s) => pad.l + (s / 100) * (w - pad.l - pad.r);
  const Y = (p) => h - pad.b - (p / maxP) * (h - pad.t - pad.b);

  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = css('--text-3');
  ctx.strokeStyle = css('--line');
  ctx.lineWidth = 1;
  for (let s = 0; s <= 100; s += 20) {
    ctx.beginPath(); ctx.moveTo(X(s), pad.t); ctx.lineTo(X(s), h - pad.b); ctx.stroke();
    ctx.textAlign = s === 100 ? 'right' : s === 0 ? 'left' : 'center';
    ctx.fillText(`${s} %`, X(s), h - 7);
  }
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const p = (maxP / ticks) * i;
    ctx.textAlign = 'left';
    ctx.fillText(nf0.format(p), 4, Y(p) + 4);
  }
  // zone de la session prévue
  ctx.fillStyle = css('--accent-soft');
  ctx.fillRect(X(Math.min(soc, target)), pad.t, X(target) - X(Math.min(soc, target)), h - pad.t - pad.b);
  // courbe
  ctx.strokeStyle = css('--accent');
  ctx.lineWidth = 2;
  ctx.beginPath();
  full.forEach(([s, p], i) => (i ? ctx.lineTo(X(s), Y(p)) : ctx.moveTo(X(s), Y(p))));
  ctx.stroke();
  // position actuelle
  ctx.fillStyle = css('--ok');
  const pNow = full.find((pt) => pt[0] >= soc)?.[1] ?? 0;
  ctx.beginPath(); ctx.arc(X(soc), Y(pNow), 5, 0, Math.PI * 2); ctx.fill();
}

function renderChargeLive(s) {
  const live = !!s.charging?.active;
  $('#chargeLive').hidden = !live;
  const btn = $('#btnCharge');
  btn.textContent = live ? 'Arrêter la charge' : settings.source === 'demo' ? 'Simuler une charge' : 'Démarrer le suivi de charge (estimé)';
  btn.classList.toggle('stop', live);
  bind({ chLivePower: nf0.format(s.charging?.kw ?? 0) });
  // rafraîchit le plan ~1×/s
  const now = performance.now();
  if (!renderChargeLive.last || now - renderChargeLive.last > 1000) { renderChargeLive.last = now; renderChargePlan(); }
}

// --- Trajet --------------------------------------------------------------------------------------
function renderTrip(s) {
  const t = s.trip || {};
  const hours = (t.time || 0) / 3600;
  bind({
    tripDist: nf1.format(t.dist || 0),
    tripTime: duration((t.time || 0) / 60),
    tripAvgSpeed: nf0.format(hours > 0.003 ? (t.dist || 0) / hours : 0),
    tripMaxSpeed: nf0.format(t.maxSpeed || 0),
    tripCons: (t.dist || 0) > 0.5 ? nf1.format((t.energy / t.dist) * 100) : '--',
    tripEnergy: nf1.format(t.energy || 0),
    odometer: nf0.format(s.odometer || 0),
  });
}

// --- Horloge & météo ---------------------------------------------------------------------------------
function renderClock() {
  const d = new Date();
  bind({ time: fmtTime.format(d), timeShort: fmtTime.format(d), weekday: fmtWeekday.format(d), date: fmtDate.format(d) });
  const w = store.get().weather;
  if (w) {
    const info = weatherInfo(w.code);
    bindHTML('weather', `${info.icon}<span>${nf0.format(w.temp)} °C · ${info.label}</span>`);
  } else {
    bindHTML('weather', settings.source === 'gps' ? '<span>Météo : en attente de position</span>' : '<span>Météo disponible en mode GPS</span>');
  }
  if (settings.theme === 'auto') applyTheme();
}

// --- Onglets ------------------------------------------------------------------------------------------
function showTab(name) {
  activeTab = name;
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  $$('.page').forEach((p) => p.classList.toggle('active', p.dataset.page === name));
  car?.setRunning(name === 'vehicle');
  if (name === 'charge') renderChargePlan();
  render(store.get());
}

// --- Rendu 3D (chargé à part : l'interface reste utilisable si WebGL échoue) ----------------------------
let car = null;
let PAINTS = [];

async function init3D() {
  const stage = $('#stage3d');
  try {
    const mod = await import('./car3d.js');
    PAINTS = mod.PAINTS;
    const paint = PAINTS.find((p) => p.id === settings.paint) || PAINTS[0];
    car = new mod.Car3D(stage, { quality: settings.quality, fps: +settings.fps, paint: paint.color });
    window.__borndash = { car }; // accès console pour le débogage
    car.setTheme(resolvedTheme() === 'light');
    $('#loading3d').remove();
    renderSwatches();
    const saved = await idbGet('model').catch(() => null);
    if (saved) {
      try { await car.loadModel(saved, +settings.modelRot); } catch { toast('Modèle importé illisible : modèle intégré utilisé'); }
    }
  } catch (err) {
    console.error(err);
    $('#loading3d').textContent = 'Rendu 3D indisponible sur cet appareil (WebGL).';
  }
}

function renderSwatches() {
  const box = $('#swatches');
  box.replaceChildren(...PAINTS.map((p) => {
    const b = document.createElement('button');
    b.className = `swatch${p.id === settings.paint ? ' active' : ''}`;
    b.style.background = p.color;
    b.title = p.name;
    b.setAttribute('aria-label', p.name);
    b.addEventListener('click', () => {
      settings.paint = p.id;
      saveSettings(settings);
      car?.setPaint(p.color);
      renderSwatches();
      toast(p.name);
    });
    return b;
  }));
}

// --- Stockage du modèle 3D importé (IndexedDB) ----------------------------------------------------------
function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('borndash', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('files');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const r = db.transaction('files').objectStore('files').get(key);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}
async function idbSet(key, value) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    if (value === null) tx.objectStore('files').delete(key); else tx.objectStore('files').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Réglages -------------------------------------------------------------------------------------------
function openSettings() {
  const f = $('#settingsForm');
  f.source.value = settings.source;
  f.quality.value = settings.quality;
  for (const k of ['socManual', 'carName', 'capacityKwh', 'maxDcKw', 'pricePerKwh', 'fps', 'modelRot', 'theme']) f[k].value = settings[k];
  for (const k of Object.keys(settings.urls)) f[`url_${k}`].value = settings.urls[k];
  $('#settings').showModal();
}

function saveFromForm() {
  const f = $('#settingsForm');
  const num = (v, def, min, max) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
  const prevSource = settings.source;
  const prevSocManual = settings.socManual;
  const prevRot = settings.modelRot;
  settings = {
    ...settings,
    source: f.source.value || 'demo',
    quality: f.quality.value || 'high',
    socManual: num(f.socManual.value, 80, 1, 100),
    carName: f.carName.value.trim() || 'Cupra Born',
    capacityKwh: num(f.capacityKwh.value, 58, 20, 120),
    maxDcKw: num(f.maxDcKw.value, 120, 20, 350),
    pricePerKwh: num(f.pricePerKwh.value, 0.25, 0, 2),
    fps: +f.fps.value || 60,
    modelRot: +f.modelRot.value || 0,
    theme: f.theme.value || 'dark',
    urls: Object.fromEntries(Object.keys(settings.urls).map((k) => [k, f[`url_${k}`].value.trim()])),
  };
  saveSettings(settings);
  applyTheme();
  car?.setOptions({ quality: settings.quality, fps: settings.fps });
  if (settings.source === 'gps' && (prevSource !== 'gps' || prevSocManual !== settings.socManual)) vehicle.setSoc(settings.socManual);
  if (prevSource !== settings.source) startSource();
  if (prevRot !== settings.modelRot && car?.custom) {
    idbGet('model').then((m) => m && car.loadModel(m, settings.modelRot)).catch(() => {});
  }
  toast('Réglages enregistrés');
}

// --- Démarrage ---------------------------------------------------------------------------------------------
function wireUI() {
  injectIcons();
  applyTheme();
  renderLaunchers($('#dockApps'), $('#quickApps'), getSettings, (app) => {
    if (app) toast(`Lien « ${app.name} » à définir dans Réglages`);
    openSettings();
  });

  $$('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
  $$('[data-goto]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.goto)));

  $('#btnTheme').addEventListener('click', () => {
    const order = ['dark', 'light', 'auto'];
    settings.theme = order[(order.indexOf(settings.theme) + 1) % order.length];
    saveSettings(settings);
    applyTheme();
    toast(settings.theme === 'auto' ? 'Thème automatique (jour / nuit)' : settings.theme === 'light' ? 'Thème clair' : 'Thème sombre');
  });
  $('#btnSettings').addEventListener('click', openSettings);
  $('#camPrev').addEventListener('click', () => car && toast(car.prevView()));
  $('#camNext').addEventListener('click', () => car && toast(car.nextView()));

  $('#btnBridge').addEventListener('click', () => {
    if (!openUrl(settings.urls.bridge)) {
      toast("Indique l'appli passerelle CarPlay / Android Auto dans Réglages");
      openSettings();
    }
  });

  // Charge
  $$('#chargerSeg button').forEach((b) => b.addEventListener('click', () => {
    $$('#chargerSeg button').forEach((x) => x.classList.toggle('active', x === b));
    chargerKw = b.dataset.kw === 'max' ? 'max' : +b.dataset.kw;
    renderChargePlan();
  }));
  $('#targetSoc').addEventListener('input', renderChargePlan);
  $('#btnCharge').addEventListener('click', () => {
    if (store.get().charging?.active) vehicle.stopCharge();
    else {
      const target = +$('#targetSoc').value;
      if ((store.get().soc ?? 0) >= target) return toast('Objectif déjà atteint');
      vehicle.startCharge(currentChargerKw(), target);
      if (settings.source === 'demo') toast('Charge simulée (accélérée ×60)');
    }
  });

  $('#btnTripReset').addEventListener('click', () => { vehicle.resetTrip(); toast('Nouveau trajet'); });

  // Réglages
  $('#settingsForm').addEventListener('submit', (e) => {
    if (e.submitter?.value === 'save') saveFromForm();
  });
  $('#glbInput').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file || !car) return;
    try {
      toast('Chargement du modèle…');
      await car.loadModel(file, +$('#settingsForm').modelRot.value);
      await idbSet('model', file).catch(() => {});
      toast('Modèle 3D importé');
    } catch (err) {
      console.error(err);
      toast('Impossible de lire ce fichier (.glb attendu)');
    }
    e.target.value = '';
  });
  $('#btnResetModel').addEventListener('click', async () => {
    car?.clearCustomModel();
    await idbSet('model', null).catch(() => {});
    toast('Modèle intégré rétabli');
  });
  $('#btnFullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      try { await screen.orientation?.lock?.('landscape'); } catch { /* non supporté */ }
    } catch { toast('Plein écran non disponible ici'); }
  });
  let wake = null;
  $('#btnWake').addEventListener('click', async () => {
    try {
      if (wake) { await wake.release(); wake = null; toast('Mise en veille normale'); return; }
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener('release', () => { wake = null; });
      toast("L'écran restera allumé");
    } catch { toast('Maintien de l\'écran non supporté par ce navigateur'); }
  });

  window.addEventListener('resize', () => { if (activeTab === 'charge') renderChargePlan(); });
}

wireUI();
store.subscribe(render);
startSource();
renderClock();
setInterval(renderClock, 5000);
init3D();

if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne non disponible */ });
}
