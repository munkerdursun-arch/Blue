"""
Les hypothèses du stratège, traduites en signaux (tous calculés à la clôture, causaux).
Chaque fonction renvoie (entry, exit, rank, sim_kwargs). Univers = ETF seulement
(composition stable depuis 1998-2000 -> pas de biais du survivant).

Confirmation commune « tendance + momentum + volume » pour les stratégies de suivi :
  tendance  : clôture > moyenne mobile 200 j
  momentum  : rendement sur 126 j > 0
  volume    : accumulation 50 j (volume jours haussiers / baissiers) > 1
"""
import itertools
import numpy as np
import pandas as pd

from engine import rsi, accumulation


def _frame(panel, tickers, fn):
    return pd.DataFrame({t: fn(panel[t]) for t in tickers})


def confirm(panel, tickers):
    trend = _frame(panel, tickers, lambda d: d["close"] > d["close"].rolling(200).mean())
    mom = _frame(panel, tickers, lambda d: d["close"].pct_change(126) > 0)
    vol = _frame(panel, tickers, lambda d: accumulation(d, 50) > 1.0)
    return trend, mom, vol


# ---------------- S1 : retour à la moyenne RSI(2) au-dessus de MM200 ---------------- #
# Contrepartie : vendeurs pressés / liquidations de court terme dans une tendance haussière.
GRID_MR = list(itertools.product([5, 10, 15], [5, 10], [False, True]))  # rsi_thr, exit_sma, vol_filter


def mean_reversion(panel, tickers, rsi_thr, exit_sma, vol_filter):
    trend, mom, _ = confirm(panel, tickers)
    r2 = _frame(panel, tickers, lambda d: rsi(d["close"], 2))
    entry = trend & mom & (r2 < rsi_thr)
    if vol_filter:  # capitulation : volume du jour > moyenne 20 j
        entry &= _frame(panel, tickers, lambda d: d["volume"] > d["volume"].rolling(20).mean())
    exit_ = _frame(panel, tickers, lambda d: d["close"] > d["close"].rolling(exit_sma).mean())
    return entry, exit_, -r2, dict(stop_k=3.0, max_hold=10)


# ---------------- S2 : rotation sectorielle par momentum (mensuelle) ---------------- #
# Contrepartie : allocataires institutionnels qui rééquilibrent lentement / investisseurs
# qui vendent trop tôt les secteurs gagnants (sous-réaction).
GRID_ROT = list(itertools.product([63, 126, 252], [2, 3]))  # lookback, top_n


def sector_rotation(panel, tickers, lookback, top_n):
    trend, _, vol = confirm(panel, tickers)
    mom = _frame(panel, tickers, lambda d: d["close"].pct_change(lookback))
    idx = mom.index
    month_end = pd.Series(idx.to_period("M"), index=idx) != pd.Series(idx.to_period("M"), index=idx).shift(-1)
    rk = mom.rank(axis=1, ascending=False)
    top = (rk <= top_n) & (mom > 0) & trend & vol
    entry = top & month_end.values[:, None]
    exit_ = (~top) & month_end.values[:, None]
    return entry, exit_, mom, dict(stop_k=3.0, trail=True, max_pos=top_n)


# ---------------- S3 : cassure de plus haut avec volume ---------------- #
# Contrepartie : vendeurs qui ont placé des ordres de prise de profit sous la résistance
# et acheteurs tardifs forcés de poursuivre le mouvement (FOMO, rachats de couvertures).
GRID_BO = list(itertools.product([55, 100], [1.5, 2.0], [3.0, 4.0]))  # n_high, vol_mult, trail_k


def breakout(panel, tickers, n_high, vol_mult, trail_k):
    trend, mom, vol = confirm(panel, tickers)
    hh = _frame(panel, tickers, lambda d: d["close"] >= d["close"].rolling(n_high).max())
    vspike = _frame(panel, tickers, lambda d: d["volume"] >= vol_mult * d["volume"].rolling(50).mean().shift(1))
    rel_vol = _frame(panel, tickers, lambda d: d["volume"] / d["volume"].rolling(50).mean().shift(1))
    entry = hh & vspike & trend & mom & vol
    exit_ = entry & False  # sortie uniquement par stop suiveur
    return entry, exit_, rel_vol, dict(stop_k=trail_k, trail=True)


# ---------------- S4 : régime de volatilité (structure VIX / VIX3M) ---------------- #
# Contrepartie : acheteurs de protection qui paient une prime de volatilité en période calme ;
# on est exposé seulement quand la courbe de volatilité est en contango.
GRID_VOL = list(itertools.product([0.90, 0.95, 1.00], [False, True]))  # ratio_thr, need_trend


def vol_regime(panel, tickers, ratio_thr, need_trend, *, vix, vix3m):
    assert tickers == ["SPY"]
    d = panel["SPY"]
    ratio = (vix / vix3m).reindex(d.index)  # séries de clôture du même jour (publiées à 16:15 ET)
    ok = ratio < ratio_thr
    if need_trend:
        ok &= d["close"] > d["close"].rolling(200).mean()
    ok = ok & ratio.notna()
    entry = pd.DataFrame({"SPY": ok})
    exit_ = pd.DataFrame({"SPY": ~ok & ratio.notna()})
    rank = pd.DataFrame({"SPY": -ratio})
    return entry, exit_, rank, dict(stop_k=3.0, max_pos=1, max_w=1.0)
