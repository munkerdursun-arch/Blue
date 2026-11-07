# Règles pour Claude dans ce dépôt

Le propriétaire du dépôt veut des sites **au niveau des studios primés** (référence : dogstudio.co).
Ces règles s'appliquent à tout site ou page web créé ici. Démo de référence : `studio-nocturne/`.

## Skills de design installés (`.claude/skills/`)

| Skill | Quand l'utiliser |
|---|---|
| `emil-design-eng` | Toujours, pour toute interface : courbes, durées, retour au clic, accessibilité du mouvement. |
| `animate`, `choreograph`, `animation-performance` | Écrire ou enchaîner des animations, vérifier qu'elles restent à 60 i/s. |
| `review-animations`, `improve-animations` | Relire ou auditer les animations existantes. |
| `apple-design`, `break-ui`, `prototype` | Finitions façon Apple, tests de cas limites, variantes à comparer. |
| `design-taste-frontend` (taste) | Sites **d'entreprise / commerce / SaaS** : copie claire, photos réelles, contrôles automatiques (`gate.mjs`, Node 22+ et Chromium requis). |

**Conflit connu :** taste vise le style « figma.com / x.ai » et interdit le violet, les fondus au
défilement et le parallaxe. Pour un site **créatif / immersif façon Dogstudio**, suivre ce fichier
et Emil Kowalski plutôt que les règles de style de taste ; garder de taste ses contrôles de qualité
(accessibilité, débordements, poids des pages). Demander au propriétaire en cas de doute.

## Signature visuelle « studio premium »

- **Fond sombre profond** (pas de noir pur), texte blanc cassé (pas de `#fff`), **un seul accent**.
- **Typographie contrastée** : un serif display très grand (gras + italique fin) avec un sans fin. Polices **auto-hébergées** (`woff2`, pas de Google Fonts : RGPD).
- **Une pièce maîtresse WebGL** (Three.js, shaders) qui réagit à la souris et **change de place selon la section**.
- **Beaucoup d'air**, grilles asymétriques, numérotation éditoriale (« 01 — Le studio »), petites capitales espacées.
- Détails : grain léger, traits fins, horloge locale, curseur personnalisé, boutons magnétiques.

## Mouvement

- Défilement fluide **Lenis** + **GSAP / ScrollTrigger**. Une seule famille de courbes (tokens CSS `--ease-out`, `--ease-io`).
- Titres révélés lettre par lettre derrière un masque ; préchargeur ; menu plein écran en `clip-path`.
- Règles d'Emil : jamais `scale(0)` (partir de `.9` + opacité), jamais `ease-in` sur l'interface, `:active { scale(.97) }`, sortie plus rapide que l'entrée, survols sous `@media (hover: hover) and (pointer: fine)`, n'animer que `transform` / `opacity`.
- **Ne jamais mettre une transition CSS sur une propriété que GSAP anime** (bug déjà rencontré dans le menu).
- `prefers-reduced-motion` : pas de Lenis, mouvements coupés, contenu jamais caché.

## Qualité (obligatoire avant de dire « fini »)

1. Ouvrir la page avec Playwright (Chromium préinstallé ; MCP `playwright` dans `.mcp.json`) à 1440×900 et 390×844.
2. Aucune erreur console, aucun défilement horizontal, WebGL avec repli si indisponible.
3. Regarder les captures et corriger ce qui chevauche ou manque de contraste.
4. Accessibilité : lien d'évitement, focus visible, `aria-expanded` sur le menu, `lang="fr"`.

## Interdits

- Copier le code, les textes, les images ou le modèle 3D d'un site de référence : on reprend les **techniques**, pas l'œuvre.
- Inventer de faux clients, faux avis ou faux chiffres présentés comme réels (une démo doit être marquée « fictif »).
- Bibliothèques chargées sans version fixe ; préférer les copier dans `vendor/`.
