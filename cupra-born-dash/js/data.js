// =============================================================================
// Données véhicule : modèle énergétique, simulation de conduite, GPS, météo.
//
// IMPORTANT — honnêteté des données :
//  • Mode démo : tout est simulé.
//  • Mode GPS  : vitesse, distance et durée sont RÉELLES (capteur GPS de
//    l'appareil). Puissance, batterie et autonomie sont ESTIMÉES par un modèle
//    physique simple à partir de la vitesse : elles ne viennent pas de la voiture.
// =============================================================================

import { loadJSON, saveJSON } from './settings.js';

const PERSIST_KEY = 'borndash.vehicle.v1';

// Paramètres physiques approximatifs d'une compacte électrique (~1,9 t en ordre de marche).
// Ce ne sont pas des données constructeur : ils servent uniquement à l'estimation.
const PHYS = {
  massKg: 1900,
  cdA: 0.27 * 2.36,      // coefficient de traînée × surface frontale (m²)
  crr: 0.009,            // résistance au roulement
  rho: 1.2,              // densité de l'air (kg/m³)
  driveEff: 0.88,        // rendement batterie → roues
  regenEff: 0.65,        // part de l'énergie de freinage récupérée
  maxRegenKw: 60,
  auxKw: 1.0,            // chauffage/clim/électronique en moyenne
  maxDriveKw: 150,
};

const DEFAULT_AVG_CONS = 16.5; // kWh/100 km, valeur de départ avant d'avoir des mesures

// --- Petit store observable ----------------------------------------------------
export function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      subs.forEach((fn) => fn(state));
    },
    subscribe(fn) { subs.add(fn); fn(state); return () => subs.delete(fn); },
  };
}

// --- Modèle physique -----------------------------------------------------------
/** Puissance batterie (kW) pour une vitesse v (m/s) et une accélération a (m/s²).
 *  > 0 : consommation ; < 0 : récupération. */
export function batteryPowerKw(v, a) {
  if (v < 0.3 && Math.abs(a) < 0.05) return PHYS.auxKw;
  const force = PHYS.massKg * a
    + 0.5 * PHYS.rho * PHYS.cdA * v * v
    + (v > 0.3 ? PHYS.crr * PHYS.massKg * 9.81 : 0);
  let kw = (force * v) / 1000;
  kw = kw > 0 ? Math.min(kw / PHYS.driveEff, PHYS.maxDriveKw) : Math.max(kw * PHYS.regenEff, -PHYS.maxRegenKw);
  return kw + PHYS.auxKw;
}

// --- Courbe de charge type -------------------------------------------------------
/** Puissance de charge estimée (kW) selon l'état de charge et la borne.
 *  chargerKw : puissance de la borne ; maxDcKw : limite DC du véhicule. */
export function chargePowerAt(soc, chargerKw, maxDcKw) {
  const AC_ONBOARD_KW = 11; // chargeur embarqué AC courant sur ce segment
  if (chargerKw <= 22) {
    const p = Math.min(chargerKw, AC_ONBOARD_KW);
    return soc < 95 ? p : p * (1 - ((soc - 95) / 5) * 0.7);
  }
  let f;
  if (soc <= 35) f = 1;
  else if (soc <= 80) f = 1 - ((soc - 35) / 45) * 0.55;
  else f = 0.45 - ((soc - 80) / 20) * 0.37;
  return Math.max(1, Math.min(chargerKw, maxDcKw * f));
}

/** Estimation d'une session de charge : énergie, durée (min), courbe pour le graphique. */
export function planCharge(fromSoc, toSoc, chargerKw, capacityKwh, maxDcKw) {
  const eff = chargerKw <= 22 ? 0.9 : 0.95;
  const step = 0.5;
  let minutes = 0;
  const curve = [];
  for (let s = fromSoc; s < toSoc; s += step) {
    const p = chargePowerAt(s, chargerKw, maxDcKw);
    curve.push([s, p]);
    minutes += ((capacityKwh * step) / 100 / (p * eff)) * 60;
  }
  const energyKwh = Math.max(0, ((toSoc - fromSoc) / 100) * capacityKwh);
  return { energyKwh, gridKwh: energyKwh / eff, minutes, curve };
}

// --- Véhicule : intègre vitesse → énergie, batterie, trajet ---------------------
export class Vehicle {
  constructor(store, getSettings) {
    this.store = store;
    this.getSettings = getSettings;
    this.speedMs = 0;          // vitesse lissée
    this.targetMs = 0;         // vitesse demandée par la source (démo ou GPS)
    this.secAcc = { e: 0, t: 0 };
    this.lastPersist = 0;

    const saved = loadJSON(PERSIST_KEY, null);
    const s = getSettings();
    this.p = {
      soc: saved?.soc ?? s.socManual ?? 80,
      odometer: saved?.odometer ?? 0,
      trip: saved?.trip ?? { dist: 0, time: 0, energy: 0, regen: 0, maxSpeed: 0 },
      avgLong: saved?.avgLong ?? DEFAULT_AVG_CONS,
    };
    this.charging = { active: false, kw: 0, chargerKw: 11, targetSoc: 80 };
    this.history = [];
  }

  setTargetSpeed(ms) { this.targetMs = Math.max(0, ms); }
  setSoc(soc) { this.p.soc = Math.min(100, Math.max(0, soc)); }

  startCharge(chargerKw, targetSoc) {
    this.charging = { active: true, kw: 0, chargerKw, targetSoc };
    this.targetMs = 0;
  }
  stopCharge() { this.charging = { ...this.charging, active: false, kw: 0 }; }

  resetTrip() {
    this.p.trip = { dist: 0, time: 0, energy: 0, regen: 0, maxSpeed: 0 };
    this.persist(true);
  }

  /** Avance la simulation de dt secondes. */
  tick(dt) {
    const s = this.getSettings();
    const cap = s.capacityKwh;
    const trip = this.p.trip;
    let powerKw;
    let accel = 0;

    if (this.charging.active) {
      this.speedMs = 0;
      const p = chargePowerAt(this.p.soc, this.charging.chargerKw, s.maxDcKw);
      this.charging.kw = p;
      powerKw = -p;
      // En démo, la charge est accélérée ×60 pour être visible.
      const speedup = s.source === 'demo' ? 60 : 1;
      this.p.soc += ((p * 0.95 * dt * speedup) / 3600 / cap) * 100;
      if (this.p.soc >= this.charging.targetSoc) {
        this.p.soc = this.charging.targetSoc;
        this.stopCharge();
      }
    } else {
      // Lissage : accélération limitée à des valeurs réalistes.
      const prev = this.speedMs;
      const diff = this.targetMs - prev;
      accel = Math.max(-3.2, Math.min(2.6, diff * 0.9));
      if (Math.abs(diff) < Math.abs(accel * dt)) accel = diff / dt;
      this.speedMs = Math.max(0, prev + accel * dt);
      powerKw = batteryPowerKw(this.speedMs, accel);

      const dKm = (this.speedMs * dt) / 1000;
      const dKwh = (powerKw * dt) / 3600;
      if (this.speedMs > 0.3) trip.time += dt;
      trip.dist += dKm;
      this.p.odometer += dKm;
      trip.energy += dKwh;
      if (dKwh < 0) trip.regen += -dKwh;
      trip.maxSpeed = Math.max(trip.maxSpeed, this.speedMs * 3.6);
      this.p.soc = Math.min(100, Math.max(0, this.p.soc - (dKwh / cap) * 100));

      // Moyenne long terme lissée (mise à jour lente)
      if (dKm > 0 && trip.dist > 2) {
        const tripAvg = (trip.energy / trip.dist) * 100;
        this.p.avgLong += (tripAvg - this.p.avgLong) * Math.min(1, dKm / 50);
      }
    }

    // Historique : une valeur moyenne par seconde, 5 minutes conservées.
    this.secAcc.e += powerKw * dt;
    this.secAcc.t += dt;
    if (this.secAcc.t >= 1) {
      this.history.push(this.secAcc.e / this.secAcc.t);
      if (this.history.length > 300) this.history.shift();
      this.secAcc = { e: 0, t: 0 };
    }

    const avgCons = trip.dist > 2 ? Math.max(8, (trip.energy / trip.dist) * 100) * 0.5 + this.p.avgLong * 0.5 : this.p.avgLong;
    const energyLeft = (this.p.soc / 100) * cap;

    this.store.set({
      speed: this.speedMs * 3.6,
      accel,
      powerKw,
      soc: this.p.soc,
      energyLeft,
      avgCons,
      range: (energyLeft / avgCons) * 100,
      odometer: this.p.odometer,
      trip: { ...trip },
      charging: { ...this.charging },
      history: this.history,
      gear: this.charging.active ? 'P' : this.speedMs > 0.3 ? 'D' : this.store.get().gear === 'P' ? 'P' : 'D',
    });

    this.persist();
  }

  persist(force = false) {
    const now = performance.now();
    if (!force && now - this.lastPersist < 5000) return;
    this.lastPersist = now;
    saveJSON(PERSIST_KEY, this.p);
  }
}

// --- Source démo : un conducteur virtuel ville / route / autoroute ---------------
export class DemoSource {
  constructor(vehicle) {
    this.vehicle = vehicle;
    // [vitesse cible km/h, durée s]
    this.plan = [[0, 6], [30, 14], [50, 22], [0, 8], [50, 18], [70, 20], [90, 25], [110, 30], [130, 45], [110, 20], [80, 18], [50, 20], [30, 12], [0, 10]];
    this.i = 0;
    this.t = 0;
    this.jitter = 0;
  }
  start() { this.running = true; }
  stop() { this.running = false; }
  tick(dt) {
    if (!this.running || this.vehicle.charging.active) return;
    this.t += dt;
    const [kmh, dur] = this.plan[this.i];
    if (this.t > dur) {
      this.t = 0;
      this.i = (this.i + 1) % this.plan.length;
      this.jitter = (Math.random() - 0.5) * 8;
    }
    const wobble = kmh > 0 ? Math.sin(performance.now() / 2300) * 2.5 + this.jitter : 0;
    this.vehicle.setTargetSpeed(Math.max(0, kmh + wobble) / 3.6);
  }
}

// --- Source GPS ---------------------------------------------------------------------
export class GpsSource {
  constructor(vehicle, onStatus, onPosition) {
    this.vehicle = vehicle;
    this.onStatus = onStatus;
    this.onPosition = onPosition;
    this.watchId = null;
    this.last = null;
    this.lastFixAt = 0;
  }

  start() {
    if (!('geolocation' in navigator)) {
      this.onStatus('err', 'GPS indisponible sur cet appareil');
      return;
    }
    if (!window.isSecureContext) {
      this.onStatus('err', 'GPS : HTTPS requis');
      return;
    }
    this.onStatus('searching', 'Recherche GPS…');
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.onFix(pos),
      (err) => {
        const msg = err.code === 1 ? 'GPS refusé (autorisation)' : err.code === 3 ? 'GPS : délai dépassé' : 'GPS indisponible';
        this.onStatus('err', msg);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  }

  stop() {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    this.last = null;
  }

  onFix(pos) {
    const { latitude, longitude, speed, accuracy } = pos.coords;
    const t = pos.timestamp;
    let v = typeof speed === 'number' && speed >= 0 ? speed : null;
    // Si l'appareil ne fournit pas la vitesse, on la déduit de deux positions successives.
    if (v === null && this.last) {
      const dt = (t - this.last.t) / 1000;
      if (dt > 0.5) v = haversine(this.last.lat, this.last.lon, latitude, longitude) / dt;
    }
    if (v === null || accuracy > 60) v = this.vehicle.targetMs; // fix trop imprécis : on garde la valeur précédente
    if (v < 0.8) v = 0; // dérive GPS à l'arrêt
    this.vehicle.setTargetSpeed(v);
    this.last = { lat: latitude, lon: longitude, t };
    this.lastFixAt = performance.now();
    this.onStatus('live', `GPS · ±${Math.round(accuracy)} m`);
    this.onPosition({ lat: latitude, lon: longitude });
  }

  tick() {
    // Plus de fix depuis 6 s (tunnel, parking) : on ramène progressivement la vitesse à 0.
    if (this.watchId !== null && this.lastFixAt && performance.now() - this.lastFixAt > 6000) {
      this.vehicle.setTargetSpeed(0);
      this.onStatus('searching', 'Signal GPS perdu');
      this.lastFixAt = 0;
    }
  }
}

export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// --- Météo (Open-Meteo, gratuit, sans clé) -----------------------------------------
export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,weather_code`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    return { temp: json.current.temperature_2m, code: json.current.weather_code };
  } finally {
    clearTimeout(timer);
  }
}
