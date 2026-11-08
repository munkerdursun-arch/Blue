# Rapport du matin — lundi 9 novembre 2026, 07:30 (Paris)
*Chef de cabinet. Données arrêtées à la clôture du vendredi 6 novembre 2026.*

## 1. Le marché en 5 lignes
1. **Jeudi 5/11 : krach de l'IA.** S&P 500 −4,4 %, Nasdaq −5,5 % (entrée en correction), Dow −1 800 pts : les pires séances depuis avril 2025. Les doutes sur la rentabilité des dépenses d'IA s'ajoutent aux craintes de ralentissement des data centers après les résultats électoraux de mi-mandat. [1][2]
2. **Vendredi 6/11 : rebond partiel.** Nasdaq +1,1 %, S&P +0,3 %. Sur la semaine : SPY −2,7 %, QQQ −5,0 %, XLK −8,2 % (calculs internes sur les clôtures).
3. **Volatilité en inversion.** VIX 25,64 contre VIX3M 24,60, soit un ratio de 1,04 (> 1 = stress de court terme). Source : CBOE.
4. **Rotation défensive.** XLF +1,2 %, XLY +1,9 % et XLP +0,7 % sur 5 jours, contre XLE −12,0 % et XLK −8,2 %. SPY reste au-dessus de sa MM200 (735,3 contre 730,4) ; QQQ, IWM et XLK sont passés dessous.
5. Les volumes du 5/11 ont atteint 1,7 à 4,1 fois la moyenne sur 50 jours sur les 13 ETF suivis : une capitulation, sans signal confirmé à ce stade.

## 2. Événements à fort impact
| Date (ET) | Événement | Conséquence pour le bureau |
|---|---|---|
| **Mar. 10/11, 08:30** | **CPI d'octobre** (consensus : +0,3 % m/m, core +0,2 %) [3][4] | **Aucune nouvelle stratégie mise en service lundi ni mardi** |
| Ven. 13/11, 08:30 | PPI d'octobre [3] | Prudence |
| Ven. 4/12 | Emploi de novembre [3] | Fenêtre de blocage |
| **Mer. 9/12, 14:00** | **Décision FOMC** [3] (une source indique les 17–18/12 : divergence non résolue, majorité pour les 8–9/12) | Fenêtre de blocage |

## 3. Classement des 3 stratégies (hors échantillon, walk-forward, nettes de frais)
Barème pré-enregistré, seuil d'admission **18/25**. **Aucune stratégie n'est admise.**

**#1 — S4 Régime de volatilité (SPY si VIX/VIX3M < seuil) — 17/25 ❌**
- Sharpe 0,42 · Sortino 0,57 · DD max 5,8 % · 156 trades (2010–2026) · frais : 15 % du rendement brut.
- Deflated Sharpe 0,25 (sur 32 essais) : **l'avantage n'est pas statistiquement établi.**
- Stress de frais à 25 pb : Sharpe 0,17. Exécution décalée d'un jour : Sharpe 0,34. 2020 : +1,8 %. 2022 : −3,7 %.
- Monte-Carlo (1 000 tirages) : DD médian 5,4 %, 95ᵉ centile 9,4 %, pire 13,7 %.
- Signal actuel : **à plat** (ratio 1,04 > 0,95). Le paramètre optimal change souvent d'une année à l'autre, signe de fragilité.

**#2 — S3 Cassure de plus haut avec volume (13 ETF) — 14/25 ❌**
- Sharpe 0,05 · Sortino 0,07 · DD 15,0 % · 219 trades · frais : 19 %.
- Deflated Sharpe 0,004. Le résultat in-sample est lui-même négatif (Sharpe −0,03) : aucun avantage décelé.

**#3 — S1 Retour à la moyenne RSI(2) au-dessus de la MM200 — 13/25 ❌**
- Sharpe 0,28 · Sortino 0,40 · DD 13,1 % · 1 191 trades · frais : **43 % du brut**.
- Sharpe brut 0,67, mais les frais détruisent l'avantage. Stress à 25 pb : Sharpe −0,29. Deflated Sharpe 0,06.
- *(S2 Rotation sectorielle : 13/25, Sharpe 0,00, Deflated Sharpe 0,002 : classée 4ᵉ.)*

Référence : sur 2003–2026, SPY en achat-conservation affiche un Sharpe de 0,57 avec un DD de 55 %. Aucune stratégie ne bat ce Sharpe, mais toutes réduisent fortement le drawdown.

## 4. Refus du risk manager
| Plan | Raison |
|---|---|
| Mise en simulation de S4 | Note 17/25 < 18/25, et Deflated Sharpe 0,25 : avantage non prouvé |
| S1, S2, S3 | Notes de 13 à 14/25 ; S1 non rentable sous stress de frais |
| H1 Dérive après résultats | **Non testée** : il faut la composition historique du S&P 500 et des dates de résultats point-in-time (biais du survivant sinon) |
| H6 Dérive après actualité | **Non testée** : aucun historique d'actualités horodatées |
| Toute mise en service lundi ou mardi | Publication du CPI le 10/11 |

## 5. Robots et transactions de la nuit
- **Robot S4 : mode OBSERVATION (shadow).** Aucun ordre, aucune connexion de compte. Premier passage réussi : signal « à plat ».
- **Transactions simulées de la nuit : 0.**
- Livrés : `bot/robot_s4.py`, `bot/S4_regime_volatilite.pine`, `bot/DEPLOIEMENT.md`.

## 6. Décision demandée
### ➡️ RETRAVAILLER
Aucune stratégie ne satisfait vos critères. Je recommande de **ne rien mettre en simulation active**, de laisser S4 en observation et de travailler ce soir :
1. **S1 :** réduire le coût par trade (entrée à la clôture, univers limité aux ETF les plus liquides, comme SPY et QQQ).
2. **H1 Dérive après résultats :** nécessite des données d'actions point-in-time (voir la question ci-dessous).
3. Tous les nouveaux essais seront ajoutés au compteur de tests multiples (32 aujourd'hui).

**Une question :** m'autorisez-vous à demander vos clés API Alpaca *paper* par formulaire sécurisé ? Elles donneraient accès à des données d'actions plus complètes. C'est une connexion de compte : j'attends votre « oui ».

### Pourquoi ce rapport pourrait se tromper
- Données Yahoo non officielles. VIX et VIX3M ont été recoupés avec la CBOE, la source officielle.
- Coûts estimés (10 pb par côté) et non mesurés.
- Le walk-forward introduit des discontinuités de positions aux changements d'année.
- Le Monte-Carlo ignore le chevauchement des trades.
- Avec un capital de 1 000 € et un risque de 1 %, l'exposition moyenne est faible : les rendements absolus sont modestes par construction.

---
Sources : [1] [Yahoo Finance — 5 nov. 2026](https://finance.yahoo.com/markets/live/stock-market-today-thursday-november-5-dow-sp-500-nasdaq-oil-rises-chip-stocks-141439950.html) · [2] [Newsweek — rebond de l'IA](https://newsweek.com/ai-stocks-rebound-trump-data-centers-12680473) · [3] [Market Daily — calendrier de novembre 2026](https://marketdaily.com/november-2026-economic-calendar-jolts-jobs-and-october-cpi-set-the-stage-for-the-feds-december-9-decision/) · [4] [BigGo Finance — prévisions CPI](https://finance.biggo.com/news/9e1d0a9b-b32c-4bf1-b265-11480691d264) · Prix : Yahoo Finance (OHLC ajustés) · VIX/VIX3M : CBOE · Taux sans risque : FRED DTB3.
