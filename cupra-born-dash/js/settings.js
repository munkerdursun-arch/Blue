// Réglages persistants (localStorage). Toute lecture/écriture est protégée :
// en navigation privée ou si le stockage est bloqué, l'appli tourne avec les valeurs par défaut.

const KEY = 'borndash.settings.v1';

export const DEFAULTS = {
  source: 'demo',          // 'demo' | 'gps'
  carName: 'Cupra Born',
  // Valeurs indicatives, à ajuster selon la version de la batterie (modifiable dans Réglages).
  capacityKwh: 58,
  maxDcKw: 120,
  pricePerKwh: 0.25,
  socManual: 80,
  quality: 'high',         // 'high' | 'eco'
  fps: 60,
  modelRot: 0,
  theme: 'dark',           // 'auto' | 'dark' | 'light'
  paint: 'graphite',
  urls: {
    bridge: '',                              // ex. intent://#Intent;package=<nom.du.paquet>;end
    nav: 'https://maps.google.com/',
    route: 'https://waze.com/ul',
    music: 'https://open.spotify.com/',
    phone: 'tel:',
    video: 'https://www.youtube.com/',
  },
};

function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function loadSettings() {
  const s = clone(DEFAULTS);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      Object.assign(s, saved, { urls: { ...s.urls, ...(saved.urls || {}) } });
    }
  } catch { /* stockage indisponible : on garde les défauts */ }
  return s;
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignoré */ }
}

// Petit stockage clé/valeur pour l'état du véhicule (compteur, trajet, batterie).
export function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
export function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignoré */ }
}
