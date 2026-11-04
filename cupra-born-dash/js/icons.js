// Icônes SVG dessinées pour l'appli (style trait, 24×24, couleur = currentColor).
// Volontairement génériques : aucune reproduction de logo de marque.

const svg = (body, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`;

export const ICONS = {
  nav: svg('<path d="M12 2.8 19.5 20l-7.5-3.6L4.5 20z" fill="currentColor" stroke="none"/>'),
  route: svg('<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>'),
  music: svg('<path d="M9 18V5.5l11-2.3V16"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="17.5" cy="16" r="2.5" fill="currentColor"/>'),
  phone: svg('<path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11 11 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a1.8 1.8 0 0 1-1.9 1.8A16.5 16.5 0 0 1 3.2 5.4 1.8 1.8 0 0 1 5 3.5z" fill="currentColor" stroke="none"/>'),
  video: svg('<path d="M8.5 6.5v11l9-5.5z" fill="currentColor" stroke="none"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  cast: svg('<rect x="3" y="4.5" width="18" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M12 17v3.5"/><path d="M10 8.6v4.8l4-2.4z" fill="currentColor" stroke="none"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>'),
  auto: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/>'),
  battery: svg('<rect x="2.5" y="7" width="17" height="10" rx="2.2"/><path d="M21.5 10.5v3"/><path d="M11.5 8.8 8.8 12.3h3.4l-1.7 3"/>'),
  plug: svg('<path d="M9 2.5v5M15 2.5v5M6.5 7.5h11V11a5.5 5.5 0 0 1-11 0z"/><path d="M12 16.5v5"/>'),
  speed: svg('<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/>'),
  bolt: svg('<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>'),
  chevL: svg('<path d="m15 5-7 7 7 7"/>'),
  chevR: svg('<path d="m9 5 7 7-7 7"/>'),
  cloud: svg('<path d="M7 18.5h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.2 3.2 0 0 0 7 18.5z"/>'),
  rain: svg('<path d="M7 15.5h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.2 3.2 0 0 0 7 15.5z"/><path d="M9 18.5 8 21M13 18.5 12 21M17 18.5 16 21"/>'),
  snow: svg('<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>'),
  storm: svg('<path d="M7 15.5h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.2 3.2 0 0 0 7 15.5z"/><path d="m12.5 15-2 3.5h3l-2 3"/>'),
  fog: svg('<path d="M4 9h16M3 13h18M5 17h14"/>'),
};

// Codes météo WMO (utilisés par Open-Meteo) → icône + libellé court.
export function weatherInfo(code) {
  if (code === 0) return { icon: ICONS.sun, label: 'Ensoleillé' };
  if (code <= 3) return { icon: ICONS.cloud, label: code === 3 ? 'Couvert' : 'Nuageux' };
  if (code === 45 || code === 48) return { icon: ICONS.fog, label: 'Brouillard' };
  if (code >= 51 && code <= 67) return { icon: ICONS.rain, label: 'Pluie' };
  if (code >= 71 && code <= 77) return { icon: ICONS.snow, label: 'Neige' };
  if (code >= 80 && code <= 82) return { icon: ICONS.rain, label: 'Averses' };
  if (code >= 85 && code <= 86) return { icon: ICONS.snow, label: 'Averses de neige' };
  if (code >= 95) return { icon: ICONS.storm, label: 'Orage' };
  return { icon: ICONS.cloud, label: '' };
}
