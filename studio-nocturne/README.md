# Nocturne — démo de site « studio premium »

Site vitrine d'un studio créatif **fictif**, pour montrer le niveau de finition visé
(inspiré des techniques de dogstudio.co, sans reprendre son contenu ni son modèle 3D).

## Ce qu'il contient

- Préchargeur avec compteur, puis intro animée (titre lettre par lettre, traits rouges).
- Sculpture WebGL irisée (Three.js, shaders maison) qui suit la souris et change de place à chaque section ; aurore en fond et particules.
- Défilement fluide (Lenis) et animations liées au défilement (GSAP ScrollTrigger) : manifeste mot à mot, section horizontale épinglée, bandeau accéléré par la vitesse, compteurs.
- Liste de projets avec aperçu flottant qui suit la souris et teinte la scène.
- Curseur personnalisé, boutons magnétiques, menu plein écran, horloge de Lyon.
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
