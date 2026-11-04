// Lanceur d'applications. Les liens sont modifiables dans Réglages.
// Sur Android, un lien https vers Maps/Spotify/YouTube ouvre l'appli si elle est installée ;
// un lien "intent://…;package=…;end" ouvre une appli précise (comportement à tester sur ton appareil).

import { ICONS } from './icons.js';

export const APPS = [
  { id: 'nav', name: 'Navigation', icon: 'nav', bg: 'linear-gradient(145deg,#3b82f6,#1d4ed8)' },
  { id: 'route', name: 'Itinéraire', icon: 'route', bg: 'linear-gradient(145deg,#38bdf8,#0e7490)' },
  { id: 'music', name: 'Musique', icon: 'music', bg: 'linear-gradient(145deg,#34d399,#047857)' },
  { id: 'phone', name: 'Téléphone', icon: 'phone', bg: 'linear-gradient(145deg,#4ade80,#15803d)' },
  { id: 'video', name: 'Vidéo', icon: 'video', bg: 'linear-gradient(145deg,#f87171,#b91c1c)' },
];

export function openUrl(url) {
  if (!url) return false;
  if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener');
  else window.location.href = url; // tel:, geo:, intent:, schémas d'applis
  return true;
}

function iconButton(app, onClick) {
  const b = document.createElement('button');
  b.className = 'app-icon';
  b.style.background = app.bg;
  b.title = app.name;
  b.setAttribute('aria-label', app.name);
  b.innerHTML = ICONS[app.icon];
  b.addEventListener('click', () => onClick(app));
  return b;
}

export function renderLaunchers(dockEl, quickEl, getSettings, onMissing) {
  const launch = (app) => {
    const url = getSettings().urls[app.id];
    if (!openUrl(url)) onMissing(app);
  };
  dockEl.replaceChildren(...APPS.slice(0, 4).map((a) => iconButton(a, launch)));
  // Raccourcis à droite : vidéo, navigateur, réglages
  const extra = [
    APPS[4],
    { id: 'web', name: 'Navigateur', icon: 'globe', bg: 'linear-gradient(145deg,#6b7280,#374151)' },
    { id: 'settings', name: 'Réglages', icon: 'gear', bg: 'linear-gradient(145deg,#52525b,#27272a)' },
  ];
  quickEl.replaceChildren(...extra.map((a) => iconButton(a, (app) => {
    if (app.id === 'settings') return onMissing(null);
    if (app.id === 'web') return openUrl('https://www.google.com/');
    return launch(app);
  })));
}
