# 🇹🇷 Mini Türkçe Maceram

**Mon aventure pour apprendre le turc !**

Application web ludique et interactive pour apprendre le turc, pensée pour un
enfant francophone de 6 ans. Parcours progressif de 90 jours, jeux, petites
conversations, histoires, chansons, système de récompenses (étoiles, badges)
et tableau de bord parent — construite avec React, React Router et Tailwind CSS.

## Démarrer

```bash
npm install
npm run dev       # serveur de développement
npm run build     # build de production
npm run preview   # prévisualiser le build
```

## Fonctionnalités

- Parcours de 90 jours en 6 phases (découverte, phrases, vie quotidienne,
  conversation, immersion, autonomie), avec immersion en turc croissante.
- 6 mini-jeux : Trouve l'image, Memory, Écoute et choisis, Répète (avec
  reconnaissance vocale du navigateur si disponible), Construis la phrase,
  Devine.
- Mode conversation avec un professeur virtuel (dialogues à choix guidés).
- Synthèse vocale (turc/français) et reconnaissance vocale du navigateur,
  avec repli automatique si l'API n'est pas disponible.
- Répétition espacée (SRS) pour réviser le vocabulaire déjà vu.
- Étoiles, badges, série de jours, progression sauvegardée en local
  (`localStorage`) — aucune donnée envoyée à un serveur.
- Espace Parent avec statistiques (temps, mots appris, à revoir, points
  forts/à travailler) et réinitialisation de la progression.

Tout le contenu turc (vocabulaire, phrases, dialogues, histoires, comptines)
est original et écrit à la main dans `src/data/`.
