# Recettes d'animation et pièges connus

Toutes ces recettes existent déjà, testées, dans `assets/template/js/` (`main.js`, `plus.js`, `scene.js`).
Les réutiliser telles quelles puis les adapter.

## Moments « WOW » disponibles (en choisir au moins 3, varier d'un site à l'autre)

| Moment | Où dans le gabarit |
|---|---|
| Préchargeur compteur + double rideau (fond clair puis accent) | `main.js` → `preload()` / `intro()` |
| Lettres du titre qui arrivent de partout et s'assemblent (version +) | `main.js` → `intro()` (branche `PLUS`) |
| Graisse de la police variable qui suit le curseur (effet loupe) | `main.js` → `heroWeight()` |
| Lettres qui ondulent puis s'envolent au défilement | `plus.js` §2 |
| Ambiance (couleurs) qui change à chaque chapitre | `main.js` → `THEMES`, `applyTheme()` |
| Sculpture WebGL qui change de forme / place par chapitre, onde au clic, halo | `scene.js` |
| Ruban de couleur derrière le curseur + gerbe au clic | `plus.js` §1 |
| Manifeste mot à mot (opacité + montée) | `main.js` + `plus.js` §3 |
| Textes qui se « décodent » | `plus.js` §4 |
| Liens dont le texte roule au survol | `plus.js` §5 + CSS `.roll` |
| Section horizontale épinglée, panneaux révélés et inclinés selon la vitesse | `main.js` → `horizontal()`, `plus.js` §8 |
| Liste avec aperçu flottant qui suit la souris et teinte la scène | `main.js` → `projects()` |
| Inclinaison des blocs selon la vitesse de défilement | `main.js` (skewY) |
| Bandeau infini accéléré par la vitesse | `main.js` (marquee) |
| Compteurs, badge circulaire qui tourne, boutons magnétiques, curseur à libellé | `main.js` |
| Lettres du titre final qui sautent au survol | `plus.js` §7 |

Idées supplémentaires à créer selon le client (originales, pas copiées) : frise de chantier qui se construit au défilement (BTP), étapes d'un parcours de formation qui s'allument comme une timeline, plan/blueprint qui se dessine (SVG `stroke-dashoffset`), cartes qui se retournent en 3D, chiffres qui roulent comme un compteur mécanique.

## Pièges déjà rencontrés (ne pas les refaire)

1. **Transition CSS + GSAP sur la même propriété** → l'élément reste figé. Mettre la transition sur un parent ou sur une autre propriété.
2. **Ordre des ScrollTrigger** : créer d'abord la section épinglée (`pin: true`), puis les déclencheurs suivants ; pour suivre une section épinglée, utiliser son `.pin-spacer` (`sec.closest('.pin-spacer') || sec`).
3. **Mouvement réduit** : sauter l'intro (`tl.progress(1)`), sinon la page reste bloquée sur le préchargeur ; afficher la bannière « Activer les animations ».
4. **Hébergement Artifact** : la page est enveloppée → `window.NOCTURNE_MODE` plutôt que `<html data-mode>` ; importer `plus.js` statiquement.
5. **Animations scrubées sur des éléments déjà animés par l'intro** : les créer dans `intro:done` (évènement émis à la fin de l'intro).
6. **Survol sur mobile** : tout survol sous `@media (hover: hover) and (pointer: fine)` ; curseur, traînée et aperçus désactivés au tactile.
7. **Sculpture qui masque le texte** : ajuster `STATES_DESKTOP/MOBILE` après avoir regardé les captures de chaque chapitre.
8. **Fluidité** : `devicePixelRatio` plafonné (1,75 bureau / 1,5 mobile), géométrie allégée sur mobile, boucle de la traînée arrêtée quand rien ne bouge, rendu WebGL en pause quand l'onglet est caché.
