---
name: studio-premium-web
description: Standard « studio premium » de Munker pour TOUT site web ou landing page (vitrine, formation, entreprise, portfolio, refonte) — niveau des studios primés (awwwards), ultra fluide et très animé, couleurs adaptées au domaine. Fournit un gabarit complet (Three.js + GSAP + Lenis), des palettes par secteur, les règles de mouvement d'Emil Kowalski et une checklist de qualité. Utiliser dès qu'on crée, refait, améliore ou anime un site, même si la demande ne dit pas « premium ».
---

# Studio premium web

Le propriétaire veut que **chaque site** fasse dire « WOUAW, le site est magnifique » :
ultra fluide, très animé, parfait, **lumineux** (pas tout sombre), avec une identité propre
au client. Référence validée : la démo « Studio Nocturne », **version « + »** (`assets/template/plus.html`).

Avant de commencer : lire `references/palettes.md` (couleurs selon le domaine) et
`references/recettes.md` (code des animations et pièges connus).

## Déroulé

1. **Comprendre le client** : domaine, public, action principale (s'inscrire, demander un devis…), contenus réels. Garder les textes et informations existants du site à refaire ; ne rien inventer comme réel (chiffres, avis, clients).
2. **Choisir l'ambiance** dans `references/palettes.md` : 5 chapitres (clair de base, clair chaud, **un chapitre sombre**, clair teinté, **final en couleur vive**). Un seul accent vif.
3. **Partir du gabarit** `assets/template/` (copier tout le dossier : `css/`, `js/`, `fonts/`, `vendor/`, `plus.html`). Garder l'architecture : `main.js` (orchestration), `scene.js` (WebGL), `plus.js` (couche d'animations « + », **activée par défaut** via `window.NOCTURNE_MODE = 'plus'`).
4. **Adapter** : textes, sections (`data-scene` + `data-theme`), table `THEMES` dans `main.js`, palette nacrée et états de la sculpture (`STATES_DESKTOP/MOBILE` dans `scene.js` : position, échelle, forme 0 goutte / 1 fleur / 2 anneaux / 3 cristal, teinte). Remplacer la sculpture si le domaine l'appelle (ex. BTP : forme plus architecturale, cristal / anneaux).
5. **Au moins 3 moments « WOW » originaux** par page (liste dans `references/recettes.md`), jamais une copie d'un site existant.
6. **Vérifier** (obligatoire, voir checklist) puis **publier** (voir « Publication »).

## Signature visuelle

- Fond clair nacré par défaut, texte quasi noir (jamais `#000`/`#fff` purs), **un** accent vif ; un chapitre sombre pour le contraste ; un final plein écran dans la couleur d'accent.
- **L'ambiance change à chaque chapitre** : variables CSS `--bg --ink --ink-dim --ink-faint --line --accent` animées par GSAP + fond WebGL teinté en même temps.
- Typo : serif display **variable** très grand (gras + italique fin coloré) + sans fin. Polices **auto-hébergées** en `woff2` (pas de Google Fonts : RGPD). Gabarit : Fraunces + Inter.
- Pièce maîtresse WebGL qui suit la souris, change de place **et de forme** par chapitre, réagit au clic (onde), avec halo coloré.
- Beaucoup d'air, numérotation éditoriale (« 01 — … »), petites capitales espacées, grain léger, barre de progression, badge au texte circulaire, curseur personnalisé, boutons magnétiques, menu plein écran en couleur d'accent.

## Mouvement (règles d'Emil Kowalski, non négociables)

- Lenis + GSAP/ScrollTrigger ; une seule famille de courbes : `--ease-out: cubic-bezier(.23,1,.32,1)`, `--ease-io: cubic-bezier(.77,0,.175,1)`.
- Jamais `scale(0)` (partir de `.9` + opacité) ; jamais `ease-in` sur l'interface ; `:active { transform: scale(.97) }` ; **sortie plus rapide que l'entrée** ; survols sous `@media (hover: hover) and (pointer: fine)` ; n'animer que `transform`/`opacity` (sauf effets ponctuels).
- **Jamais de transition CSS sur une propriété que GSAP anime** (bug vécu : le menu restait invisible).
- Mouvement réduit : respecter le réglage système **mais** afficher la bannière « Activer les animations » (déjà dans le gabarit) — sinon le client croit que rien n'est animé.

## Checklist avant de dire « fini »

1. Playwright (Chromium) à **1440×900** et **390×844** : zéro erreur console, zéro défilement horizontal.
2. Regarder chaque capture : rien ne chevauche le texte (déplacer la sculpture via ses états), contrastes lisibles sur chaque chapitre.
3. Tester : menu ouvert/fermé (Échap), ancres, survols, intro complète, mode mouvement réduit (bannière + bouton).
4. Accessibilité : lien d'évitement, focus visible, `aria-expanded`, `lang="fr"`, libellés des titres découpés.
5. WebGL indisponible → repli en dégradé (classe `.no-webgl`).

## Publication

- Pour que le propriétaire voie le résultat sans rien installer (il est sur Mac/iPhone, pas de terminal) : **publier en Artifact claude.ai** (page + fichiers `css/ js/ fonts/ vendor/` via `files`), et donner le lien.
- L'hébergeur des Artifacts **enveloppe la page** dans son propre squelette : ne pas dépendre des attributs de `<html>` ; déclarer le mode par un script (`window.NOCTURNE_MODE`).
- Dans un dépôt : bibliothèques copiées dans `vendor/` avec version fixe (three r170, GSAP 3.15.1, Lenis 1.3.27).

## Skills associés (si installés)

`emil-design-eng`, `animate`, `choreograph`, `animation-performance`, `review-animations`.
`design-taste-frontend` (taste) : ses **contrôles qualité** sont utiles, mais son style (interdit violet, fondus au défilement) est en conflit — c'est ce skill-ci qui décide du style.
