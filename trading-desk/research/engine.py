"""
Moteur de backtest événementiel, journalier, acheteur uniquement.

Principes anti-biais (relus ligne à ligne) :
- Les signaux sont calculés à la CLÔTURE du jour i avec des données <= i.
- Les ordres sont exécutés à l'OUVERTURE du jour i+1 (aucune donnée future).
- Le stop est posé dès l'exécution ; s'il est touché en séance, sortie au stop,
  ou à l'ouverture si le cours ouvre en gap sous le stop (hypothèse défavorable).
- Taille de position : risque fixe (1 % des fonds propres) / (k × ATR14 de la veille),
  plafonnée par le poids max et la trésorerie disponible -> jamais de levier.
- Frais : `cost_bps` par côté, appliqués sur le notionnel échangé.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from statistics import NormalDist

import numpy as np
import pandas as pd

# --------------------------------------------------------------------------- #
# Indicateurs (tous causaux : la valeur en i n'utilise que les données <= i)
# --------------------------------------------------------------------------- #

def atr(df: pd.DataFrame, n: int = 14) -> pd.Series:
    pc = df["close"].shift(1)
    tr = pd.concat([df["high"] - df["low"], (df["high"] - pc).abs(), (df["low"] - pc).abs()], axis=1).max(axis=1)
    return tr.ewm(alpha=1 / n, adjust=False, min_periods=n).mean()


def rsi(close: pd.Series, n: int) -> pd.Series:
    d = close.diff()
    up = d.clip(lower=0).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    dn = (-d.clip(upper=0)).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    rs = up / dn.replace(0, np.nan)
    return (100 - 100 / (1 + rs)).fillna(100.0).where(up.notna())


def accumulation(df: pd.DataFrame, n: int = 50) -> pd.Series:
    """Volume des jours haussiers / volume des jours baissiers sur n jours (> 1 = accumulation)."""
    d = df["close"].diff()
    upv = df["volume"].where(d > 0, 0.0).rolling(n).sum()
    dnv = df["volume"].where(d < 0, 0.0).rolling(n).sum()
    return upv / dnv.replace(0, np.nan)


# --------------------------------------------------------------------------- #
# Simulation de portefeuille
# --------------------------------------------------------------------------- #

@dataclass
class Trade:
    ticker: str
    entry_date: pd.Timestamp
    entry_px: float
    qty: float
    stop: float
    exit_date: pd.Timestamp | None = None
    exit_px: float | None = None
    reason: str = ""
    cost: float = 0.0

    @property
    def pnl(self) -> float:
        return (self.exit_px - self.entry_px) * self.qty - self.cost

    @property
    def ret(self) -> float:
        return self.pnl / (self.entry_px * self.qty)


@dataclass
class Result:
    equity: pd.Series
    trades: list[Trade] = field(default_factory=list)


def simulate(panel: dict[str, pd.DataFrame], entry: pd.DataFrame, exit_: pd.DataFrame,
             rank: pd.DataFrame, stop_k: float = 3.0, trail: bool = False,
             max_hold: int | None = None, cost_bps: float = 10.0, risk: float = 0.01,
             max_pos: int = 5, max_w: float = 0.40, capital: float = 1000.0,
             cash_rate: pd.Series | None = None) -> Result:
    """cash_rate : taux journalier servi sur la trésorerie non investie (hypothèse : parking
    en ETF de bons du Trésor type BIL/SGOV). None = trésorerie non rémunérée."""
    dates = entry.index
    tickers = list(entry.columns)
    O = pd.DataFrame({t: panel[t]["open"] for t in tickers}).reindex(dates).to_numpy()
    H = pd.DataFrame({t: panel[t]["high"] for t in tickers}).reindex(dates).to_numpy()
    L = pd.DataFrame({t: panel[t]["low"] for t in tickers}).reindex(dates).to_numpy()
    C = pd.DataFrame({t: panel[t]["close"] for t in tickers}).reindex(dates).to_numpy()
    A = pd.DataFrame({t: atr(panel[t]) for t in tickers}).reindex(dates).to_numpy()
    E = entry.fillna(False).to_numpy(bool)
    X = exit_.fillna(False).to_numpy(bool)
    R = rank.reindex(dates).to_numpy(float)
    c = cost_bps / 1e4
    CR = (cash_rate.reindex(dates).ffill().fillna(0).to_numpy() if cash_rate is not None
          else np.zeros(len(dates)))

    cash = capital
    pos: dict[int, Trade] = {}
    held_days: dict[int, int] = {}
    pend_exit: set[int] = set()
    pend_entry: list[int] = []
    last_close = np.full(len(tickers), np.nan)
    trades: list[Trade] = []
    eq = np.empty(len(dates))

    def close_trade(j: int, px: float, d, why: str):
        nonlocal cash
        tr = pos.pop(j)
        held_days.pop(j, None)
        fee = px * tr.qty * c
        tr.exit_date, tr.exit_px, tr.reason = d, px, why
        tr.cost += fee
        cash += px * tr.qty - fee
        trades.append(tr)

    for i, d in enumerate(dates):
        # ---- 1) ouverture : sorties programmées puis entrées programmées ----
        for j in sorted(pend_exit):
            if j in pos and not math.isnan(O[i, j]):
                close_trade(j, O[i, j], d, "signal")
        pend_exit.clear()
        if pend_entry:
            equity_prev = eq[i - 1]
            for j in pend_entry:
                px, a = O[i, j], A[i - 1, j]
                if j in pos or len(pos) >= max_pos or math.isnan(px) or not a > 0:
                    continue
                qty = risk * equity_prev / (stop_k * a)
                qty = min(qty, max_w * equity_prev / px, cash / (px * (1 + c)))
                if qty * px < 1.0:  # notionnel minimal 1 $ (fractions d'actions)
                    continue
                fee = px * qty * c
                cash -= px * qty + fee
                pos[j] = Trade(tickers[j], d, px, qty, px - stop_k * a, cost=fee)
                held_days[j] = 0
            pend_entry = []
        # ---- 2) séance : stops ----
        for j in list(pos):
            tr = pos[j]
            if math.isnan(L[i, j]):
                continue
            if tr.entry_date != d and O[i, j] <= tr.stop:
                close_trade(j, O[i, j], d, "stop_gap")
            elif L[i, j] <= tr.stop:
                close_trade(j, tr.stop, d, "stop")
        cash *= 1 + CR[i]  # intérêt du jour sur la trésorerie (taux connu la veille)
        # ---- 3) clôture : valorisation, trailing, signaux pour J+1 ----
        last_close = np.where(np.isnan(C[i]), last_close, C[i])
        eq[i] = cash + sum(tr.qty * last_close[j] for j, tr in pos.items())
        for j, tr in pos.items():
            held_days[j] += 1
            if trail and not math.isnan(A[i, j]):
                tr.stop = max(tr.stop, C[i, j] - stop_k * A[i, j])
            if X[i, j] or (max_hold and held_days[j] >= max_hold):
                pend_exit.add(j)
        free = max_pos - (len(pos) - len(pend_exit))
        if free > 0 and i + 1 < len(dates):
            cands = [j for j in np.flatnonzero(E[i]) if j not in pos]
            cands.sort(key=lambda j: -R[i, j] if not math.isnan(R[i, j]) else 0)
            pend_entry = cands[:free]

    # clôture comptable des positions ouvertes à la dernière date (marquées, non vendues)
    for j, tr in list(pos.items()):
        tr.exit_date, tr.exit_px, tr.reason = dates[-1], last_close[j], "ouverte"
        trades.append(tr)
    return Result(pd.Series(eq, index=dates), trades)


# --------------------------------------------------------------------------- #
# Statistiques
# --------------------------------------------------------------------------- #

def stats(eq: pd.Series, rf_daily: pd.Series) -> dict:
    r = eq.pct_change().dropna()
    if len(r) < 20 or r.std() == 0:
        return dict(sharpe=np.nan, sortino=np.nan, maxdd=np.nan, cagr=np.nan, vol=np.nan)
    ex = r - rf_daily.reindex(r.index).ffill().fillna(0)
    sharpe = ex.mean() / ex.std() * np.sqrt(252)
    downside = np.sqrt((np.minimum(ex, 0) ** 2).mean())
    sortino = ex.mean() / downside * np.sqrt(252) if downside > 0 else np.nan
    dd = (eq / eq.cummax() - 1).min()
    yrs = (eq.index[-1] - eq.index[0]).days / 365.25
    cagr = (eq.iloc[-1] / eq.iloc[0]) ** (1 / yrs) - 1 if yrs > 0 else np.nan
    return dict(sharpe=sharpe, sortino=sortino, maxdd=-dd, cagr=cagr, vol=r.std() * np.sqrt(252))


def deflated_sharpe(r: pd.Series, n_trials: int, sr_var_daily: float) -> float:
    """Deflated Sharpe Ratio (Bailey & López de Prado, 2014). r = rendements journaliers excédentaires."""
    nd = NormalDist()
    sr = r.mean() / r.std()
    g3 = ((r - r.mean()) ** 3).mean() / r.std() ** 3
    g4 = ((r - r.mean()) ** 4).mean() / r.std() ** 4
    emc = 0.5772156649
    sr0 = math.sqrt(max(sr_var_daily, 1e-12)) * ((1 - emc) * nd.inv_cdf(1 - 1 / n_trials)
                                                  + emc * nd.inv_cdf(1 - 1 / (n_trials * math.e)))
    denom = math.sqrt(max(1 - g3 * sr + (g4 - 1) / 4 * sr ** 2, 1e-12))
    return nd.cdf((sr - sr0) * math.sqrt(len(r) - 1) / denom)


def monte_carlo_dd(trade_rets: np.ndarray, frac: np.ndarray, n: int = 1000, seed: int = 7) -> np.ndarray:
    """Rééchantillonnage (bootstrap) de l'ordre et de la composition des trades ; renvoie les drawdowns max.
    Chaque trade impacte les fonds propres de `frac × ret` (frac = poids du trade dans le capital)."""
    rng = np.random.default_rng(seed)
    out = np.empty(n)
    k = len(trade_rets)
    for s in range(n):
        idx = rng.integers(0, k, k)
        path = np.cumprod(1 + trade_rets[idx] * frac[idx])
        out[s] = -(path / np.maximum.accumulate(path) - 1).min()
    return out


def score(sharpe, sortino, maxdd, ntrades, fee_impact) -> dict:
    def band(x, cuts, rev=False):
        if x is None or (isinstance(x, float) and math.isnan(x)):
            return 1
        s = 1
        for cut in cuts:
            if (x < cut) if rev else (x >= cut):
                s += 1
        return s
    sc = dict(
        sharpe=band(sharpe, [0.3, 0.5, 0.8, 1.1]),
        sortino=band(sortino, [0.4, 0.7, 1.1, 1.5]),
        maxdd=band(maxdd, [0.35, 0.25, 0.18, 0.12], rev=True),
        trades=band(ntrades, [30, 60, 120, 250]),
        fees=band(fee_impact, [0.50, 0.35, 0.20, 0.10], rev=True),
    )
    # bornes inclusives telles que pré-enregistrées
    if maxdd is not None and maxdd > 0.35:
        sc["maxdd"] = 1
    sc["total"] = sum(sc.values())
    return sc
