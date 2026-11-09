# Conducteur de travaux augmenté — refonte « studio premium »

Refonte du site de la formation IA pour conducteurs de travaux (17 modules, 15 agents, n8n, Paperclip)
avec le skill `studio-premium-web`. **Tout le contenu et tous les outils d'origine sont conservés**
(fiches d'agents avec versions Standard / n8n / Paperclip, onglets d'outils, programme suivi,
calculateur de gains, quiz, FAQ, glossaire). En ligne : https://claude.ai/artifact/NF3JDoANkyQHumVZQYtUbc

- `index.html` : structure (accueil, chiffres, règle d'or, niveaux, chapitres Jour 1 / Jour 2 / Référence, final).
- `js/app.js` : données et outils interactifs repris du site d'origine.
- `js/studio.js` : mise en scène (préchargeur, Lenis, ambiances par chapitre, animations, curseur, sommaire).
- `js/scene.js` : sculpture WebGL aux couleurs du chantier.
- Palette : béton clair, sable, acier nuit (chapitre des agents), gris bleuté (jour 2), final jaune chantier.

Lancer en local : `python3 -m http.server` dans ce dossier, puis ouvrir http://localhost:8000.
