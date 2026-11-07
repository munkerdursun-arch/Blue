# Nocturne — démo de site « studio premium »

Site vitrine d'un studio créatif **fictif**, pour montrer le niveau de finition visé
(inspiré des techniques de dogstudio.co, sans reprendre son contenu ni son modèle 3D).

## Ce qu'il contient

- Préchargeur avec compteur puis double rideau (crème, puis orange).
- **Une ambiance par chapitre** : crème → sable → nuit (projets) → lilas → crème → orange (contact), en fondu.
- Sculpture nacrée WebGL (Three.js, shaders maison) qui **se métamorphose** à chaque chapitre (goutte, fleur, anneaux, cristal), suit la souris, réagit au clic par une onde, avec halo coloré et poussière lumineuse.
- Titre d'accueil dont **la graisse de la police suit le curseur** (police variable Fraunces).
- Défilement fluide (Lenis), inclinaison des blocs selon la vitesse, manifeste mot à mot, section horizontale épinglée avec panneaux révélés, bandeau accéléré, compteurs, barre de progression.
- Projets avec aperçu flottant animé qui teinte la scène ; curseur personnalisé, boutons magnétiques, menu plein écran orange.
- Mobile, clavier et `prefers-reduced-motion` pris en charge ; repli si WebGL indisponible.

## Lancer

Aucune installation : les bibliothèques et polices sont dans `vendor/` et `fonts/`.

```bash
cd studio-nocturne
python3 -m http.server 4321   # puis ouvrir http://localhost:4321
```

Un serveur est nécessaire (les modules JavaScript ne se chargent pas en `file://`).

## Bibliothèques embarquées

three.js r170 (MIT) · GSAP 3.15.1 (licence gratuite GreenSock/Webflow) · Lenis 1.3.27 (MIT) ·
polices Fraunces et Inter (SIL Open Font License).
