# Règles de trading — à lire par chaque Agent avant toute action

> Version 1.0 — 2026-11-08. Modifiable uniquement par le propriétaire du fonds.
> Statut : **SIMULATION UNIQUEMENT** (compte papier Alpaca). Aucun argent réel.

## 1. Univers autorisé
| Autorisé | Détail |
|---|---|
| Actions US grandes capitalisations | Constituants S&P 500 / Nasdaq 100, cours ≥ 5 $, volume moyen 20 j ≥ 1 M titres |
| ETF US non levier | Indices (SPY, QQQ, IWM, DIA) et secteurs (XLK, XLF, XLE, XLV, XLI, XLY, XLP, XLU, XLB, XLRE, XLC) |

**Biais du survivant** : tout backtest utilise la composition historique des indices (point-in-time), jamais la liste actuelle.

## 2. Interdits absolus
- ❌ Levier / marge (exposition brute ≤ 100 % du capital, aucun emprunt)
- ❌ Vente à découvert → **stratégies acheteuses uniquement**
- ❌ Options, futures, ETF à levier ou inversés, tout dérivé
- ❌ Rumeurs, « pump », signaux sans données sources
- ❌ Toute action engageant de l'argent réel, connectant un compte réel ou effectuant un paiement sans approbation écrite du propriétaire

## 3. Capital et risque
| Paramètre | Valeur |
|---|---|
| Capital simulé | 1 000 € (≈ montant équivalent en USD sur Alpaca, compte en USD — taux fixé au lancement et consigné) |
| Risque max par transaction | 1 % = **10 €** (perte si le stop est touché, frais et glissement inclus) |
| Taille de position | `taille = (capital × 1 %) / (k × ATR14)` — fractions d'actions autorisées |
| Positions simultanées max | 5 (risque ouvert total ≤ 5 %) |
| Exposition max par secteur | 40 % du capital |
| Ordres | Entrée par ordre limité, stop obligatoire posé dès l'exécution |

## 4. Horizon
Mixte : chaque stratégie déclare son horizon (intraday, swing 2–10 j, position 2–8 sem.).
⚠️ Contrainte réglementaire à vérifier au lancement : la règle *Pattern Day Trader* (compte < 25 000 $) peut limiter les allers-retours intraday ; l'état actuel de la règle n'est pas confirmé.

## 5. Coupe-circuits (le risk manager arrête tout)
- Perte journalière ≥ 2 % du capital
- 3 pertes consécutives sur une stratégie
- Données périmées (dernière barre plus vieille que 2 intervalles attendus) ou source indisponible
- Aucune nouvelle stratégie mise en service la veille / le jour de : résultats du titre, réunion FOMC, publication CPI

## 6. Critères d'admission d'une stratégie
- Logique claire + **contrepartie identifiée**
- Tendance, momentum et volume confirment ensemble
- ≥ 3 ans de données, ≥ 30 transactions hors échantillon, rentable **après frais et glissement**
- Note ≥ 18/25 (Sharpe, Sortino, drawdown max, nombre de trades, impact des frais : 1–5 chacun)
- Walk-forward + Monte-Carlo 1 000 tirages + tests 2020 et 2022 + correction des tests multiples
- Note technique ≥ 7/10 pour toute configuration retenue

## 7. Échelle de progression
Simulation 2 semaines → cohérence avec le backtest → **validation du propriétaire** → 10 % du capital réel → règles complètes.

## 8. Journal
Chaque idée, refus et transaction : **titre · idée · preuves · étape suivante** dans `JOURNAL.md`.

## 9. Barème de notation pré-enregistré (figé le 2026-11-08 AVANT tout backtest)
Mesures calculées uniquement sur les données hors échantillon (walk-forward), nettes de frais.

| Critère | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Sharpe annualisé (excès sur T-bill 3 mois) | < 0,3 | 0,3–0,5 | 0,5–0,8 | 0,8–1,1 | ≥ 1,1 |
| Sortino annualisé (excès sur T-bill) | < 0,4 | 0,4–0,7 | 0,7–1,1 | 1,1–1,5 | ≥ 1,5 |
| Drawdown max | > 35 % | 25–35 % | 18–25 % | 12–18 % | < 12 % |
| Nombre de transactions | < 30 (éliminatoire) | 30–60 | 60–120 | 120–250 | ≥ 250 |
| Impact des frais (part du rendement brut absorbée) | > 50 % | 35–50 % | 20–35 % | 10–20 % | < 10 % |

Hypothèses de coûts (estimations) : 10 pb par côté (écart + glissement) en scénario de base, 25 pb en scénario de stress. Commission Alpaca supposée nulle (à vérifier). Exécution : signal à la clôture J, ordre à l'ouverture J+1 (aucune donnée future).
