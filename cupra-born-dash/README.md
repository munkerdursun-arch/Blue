# Born Dash — tableau de bord embarqué pour Cupra Born

Interface plein écran façon « CarPlay amélioré », pensée pour une **tablette ou un
autoradio Android** posé dans une compacte électrique : voiture en 3D, énergie,
planificateur de charge, trajet, lanceur d'applications.

Application web autonome (HTML/CSS/JS + three.js embarqué) : **aucune dépendance
réseau** pour fonctionner, installable comme une appli (PWA) et utilisable hors ligne.

## À lire avant tout : ce que l'appli peut et ne peut pas faire

| Point | Réalité |
|---|---|
| Installer sur l'écran d'origine de la Born | **Impossible.** L'écran de la voiture n'accepte pas d'applis tierces. |
| S'afficher *dans* Apple CarPlay | **Impossible.** CarPlay n'affiche que des applis iOS validées par Apple, pas de pages web. |
| Lire la batterie réelle de la voiture | **Non.** Il faudrait un adaptateur OBD et des requêtes propres au constructeur (non incluses). |
| Vitesse, distance, durée de trajet | **Réelles** en mode GPS (capteur de la tablette/du téléphone). |
| Puissance, batterie, autonomie | **Simulées** (mode démo) ou **estimées** par un modèle physique (mode GPS). Toujours signalé à l'écran. |
| Commander la voiture (clim, verrouillage…) | **Non**, et volontairement : aucune commande n'est envoyée. |

## Fonctionnalités

- **Véhicule** : compacte électrique en 3D générée par code (carrosserie lissée,
  vitrage teinté, pavillon noir, jantes et étriers cuivrés, signature lumineuse avant,
  bandeau arrière pleine largeur). Rotation au doigt, 5 vues, 5 teintes, roues qui
  tournent selon la vitesse, feux stop au freinage, trappe de recharge qui pulse en charge.
  Import possible d'un **vrai modèle `.glb`** (gardé en mémoire sur l'appareil).
- **Énergie** : anneau d'état de charge, autonomie, puissance instantanée
  traction / récupération, historique 5 min, consommation moyenne.
- **Charge** : type de borne (AC 7,4 / 11, DC 50 / max), objectif, énergie, durée,
  heure de fin et coût estimés, courbe de charge type. Simulation de charge en démo.
- **Trajet** : distance, durée, vitesses moyenne/max, consommation, énergie
  utilisée et récupérée, compteur, remise à zéro.
- **Colonne droite** : bouton CarPlay / Android Auto (ouvre l'appli passerelle de
  ton autoradio), raccourcis, horloge, météo réelle (mode GPS, via Open-Meteo), tuiles live.
- Thème sombre / clair / automatique, plein écran, maintien de l'écran allumé,
  mode « Économie » pour autoradios peu puissants (sans ombres, 30 i/s possible).

## Lancer l'appli

```bash
cd cupra-born-dash
python3 -m http.server 8080      # ou : npx serve .
# puis ouvrir http://localhost:8080
```

Le GPS, l'installation en appli et le mode hors ligne exigent **HTTPS** (sauf sur
`localhost`). Pour la tablette de la voiture, héberge le dossier sur un service
HTTPS (par ex. GitHub Pages, Netlify, Cloudflare Pages), ouvre l'adresse dans
Chrome, puis menu ⋮ → « Ajouter à l'écran d'accueil ».

## Configurer le bouton CarPlay / Android Auto

Sur les autoradios Android, CarPlay passe par une appli passerelle installée sur
l'autoradio. Dans **Réglages → Applications**, indique un lien de la forme :

```
intent://#Intent;package=NOM.DU.PAQUET;end
```

Le nom du paquet se trouve dans Paramètres Android → Applications → (l'appli) ou
dans l'adresse de sa fiche Play Store (`id=...`). Le comportement des liens
`intent://` dépend du navigateur et de la version d'Android : **à tester sur ton
appareil**.

## Utiliser un vrai modèle 3D

Réglages → Rendu 3D → « Importer un modèle .glb ». Le modèle est mis à l'échelle et
posé au sol automatiquement ; si la voiture apparaît de travers, change « Rotation du
modèle importé ». Utilise uniquement un modèle dont la licence t'y autorise.

## Organisation du code

```
cupra-born-dash/
├── index.html            structure de l'interface
├── css/style.css         design (tout en rem : s'adapte de 1024×600 à 1920×720)
├── js/main.js            liaison données ↔ interface, onglets, réglages
├── js/data.js            modèle énergétique, démo, GPS, courbe de charge, météo
├── js/car3d.js           scène three.js et voiture procédurale
├── js/apps.js            lanceur d'applications
├── js/icons.js           icônes SVG (génériques, aucun logo de marque)
├── js/settings.js        réglages persistants (localStorage)
├── sw.js                 cache hors ligne
└── vendor/three/         three.js r170 (licence MIT, voir LICENSE)
```

Pour brancher une vraie source de données (adaptateur OBD, API…), il suffit
d'appeler `vehicle.setTargetSpeed()` / `vehicle.setSoc()` depuis une nouvelle classe
sur le modèle de `GpsSource` dans `js/data.js`.

## Sécurité routière

Ne manipule pas l'écran en roulant. En France, le Code de la route (art. R412-6-2)
encadre les écrans placés dans le champ de vision du conducteur : vérifie la
réglementation avant d'installer une tablette au tableau de bord.
