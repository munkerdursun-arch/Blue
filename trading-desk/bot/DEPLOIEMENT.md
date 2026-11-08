# Déploiement du robot S4 — guide pas à pas (aucune compétence en code requise)

> ⚠️ Le robot démarre en **mode observation (« shadow »)** : il calcule et note tout dans le journal, mais **n'envoie aucun ordre**.
> Le mode « paper » (compte de simulation Alpaca) ne s'active qu'avec votre accord écrit. **Il n'existe aucun mode argent réel.**

## Étape 1 — Installer Python (10 min)
1. Allez sur https://www.python.org/downloads/ et téléchargez la dernière version 3.x.
2. **Windows** : pendant l'installation, cochez **« Add Python to PATH »**.
3. Ouvrez un terminal (Windows : touche Windows → tapez `cmd` ; Mac : application « Terminal »).
4. Tapez `python --version` (Mac : `python3 --version`). Un numéro de version doit s'afficher.

## Étape 2 — Récupérer le dossier
Téléchargez le dépôt depuis GitHub (bouton vert **Code → Download ZIP**, branche `claude/clever-ramanujan-w4gl62`) et décompressez-le, par exemple dans `Documents/Blue`.

## Étape 3 — Installer les bibliothèques
Dans le terminal :
```
cd Documents/Blue/trading-desk/bot
python -m pip install pandas requests alpaca-py
```

## Étape 4 — Premier test en mode observation (sans compte)
```
python robot_s4.py daily
```
Une ligne apparaît. Elle est aussi ajoutée à `trading-desk/JOURNAL.md`.

## Étape 5 — (plus tard, avec votre accord) Compte de simulation Alpaca
1. Créez un compte sur https://alpaca.markets puis ouvrez le tableau de bord **Paper Trading**.
2. Générez une clé API **paper**. Ne la partagez jamais, ni par e-mail ni dans une conversation.
3. Enregistrez-la comme variables d'environnement :
   - Windows : `setx APCA_API_KEY_ID "votre_cle"` puis `setx APCA_API_SECRET_KEY "votre_secret"`
   - Mac : ajoutez `export APCA_API_KEY_ID=...` et `export APCA_API_SECRET_KEY=...` à `~/.zshrc`
4. Dans le tableau de bord Alpaca paper, **désactivez la vente à découvert (shorting)** et réglez le compte sur **1 000 $**.
5. Le passage en mode simulation se fait avec `setx ROBOT_MODE "paper"` (Mac : `export ROBOT_MODE=paper`). **Seulement après votre décision « approuver ».**

## Étape 6 — Automatiser
**Windows (Planificateur de tâches)**
1. Ouvrez « Planificateur de tâches » → **Créer une tâche de base**.
2. Nom : `Robot S4 daily`. Déclencheur : quotidien, **22:30**, du lundi au vendredi.
3. Action : démarrer un programme. Programme : `python`. Arguments : `robot_s4.py daily`. Démarrer dans : le chemin du dossier `bot`.
4. *(mode paper uniquement)* Créez une 2ᵉ tâche `robot_s4.py watch` toutes les 5 min, de 15:30 à 22:00.

**Mac / Linux (cron)** : tapez `crontab -e` et ajoutez :
```
30 22 * * 1-5 cd ~/Documents/Blue/trading-desk/bot && /usr/bin/python3 robot_s4.py daily
*/5 15-21 * * 1-5 cd ~/Documents/Blue/trading-desk/bot && /usr/bin/python3 robot_s4.py watch
```
L'ordinateur doit rester allumé. Pour un fonctionnement 7×24 h fiable, un petit serveur VPS (≈ 5 €/mois) est préférable. Il s'agit d'un **paiement** : à décider par vous.

## Étape 7 — Indicateur TradingView
1. TradingView → graphique **SPY**, unité **1 jour**.
2. En bas, ouvrez **Éditeur Pine**, collez le contenu de `S4_regime_volatilite.pine` puis cliquez sur **Ajouter au graphique**.
3. Cliquez sur l'icône réveil (**Alertes**) → Condition : « S4 Régime de volatilité » → **S4 ENTRÉE** → « Une fois par barre clôturée ». Répétez l'opération pour **S4 SORTIE**.

## Arrêt d'urgence
- Supprimez les tâches planifiées, **ou** placez `"halted": true` dans `bot/state.json`.
- En mode paper : dans le tableau de bord Alpaca, utilisez **Close all positions** et **Cancel all orders**.

## Points à vérifier avant le mode paper (non confirmés)
- Alpaca accepte-t-il les **ordres limités fractionnaires** hors séance (mis en file pour l'ouverture) ?
- Les **stops natifs** sont-ils acceptés sur une quantité fractionnaire ? En cas de refus, le robot bascule sur le stop logiciel, journalisé.
- Statut actuel de la règle *Pattern Day Trader* pour un compte de moins de 25 000 $ (sans impact pour S4, qui n'est pas intraday).
