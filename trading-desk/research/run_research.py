"""
Recherche du soir : walk-forward (3 ans d'entraînement -> 1 an de test, glissant),
coûts de base / stress, délai d'exécution, Monte-Carlo, Deflated Sharpe, années 2020/2022.
Sortie : research/results/results.json + résumé console.
"""
import json
import math
import pathlib

import numpy as np
import pandas as pd

import data
import engine as E
import strategies as S

OUT = pathlib.Path(__file__).parent / "results"
OUT.mkdir(exist_ok=True)
TRAIN_YEARS = 3
BASE_BPS, STRESS_BPS = 10.0, 25.0

# ------------------------------------------------------------------ données
ALL = data.INDEX_ETFS + data.SECTOR_ETFS
panel = {t: data.yahoo_daily(t) for t in ALL}
cal = panel["SPY"].index[panel["SPY"].index >= "1999-03-01"]
panel = {t: df.reindex(cal) for t, df in panel.items()}
vix = data.yahoo_daily("^VIX")["close"]
vix3m = data.yahoo_daily("^VIX3M")["close"]
rf = pd.read_csv(data.DATA_DIR / "FRED_DTB3.csv", index_col=0, parse_dates=True).iloc[:, 0]
rf = (pd.to_numeric(rf, errors="coerce") / 100 / 252).reindex(cal).ffill()

# Trésorerie rémunérée au T-bill de la VEILLE (shift 1 : pas de donnée future)
CASH_RATE = rf.shift(1)

STRATS = {
    "S1_retour_moyenne_RSI2": (S.mean_reversion, S.GRID_MR, ALL, {}),
    "S2_rotation_sectorielle": (S.sector_rotation, S.GRID_ROT, data.SECTOR_ETFS, {}),
    "S3_cassure_volume": (S.breakout, S.GRID_BO, ALL, {}),
    "S4_regime_volatilite": (S.vol_regime, S.GRID_VOL, ["SPY"], {"vix": vix, "vix3m": vix3m}),
}
N_TRIALS = sum(len(g) for _, g, _, _ in STRATS.values())


def run_all(fn, params, tickers, extra, bps, delay=0):
    sub = {t: panel[t] for t in tickers}
    entry, exit_, rank, kw = fn(sub, tickers, *params, **extra)
    if delay:
        entry, exit_ = entry.shift(delay, fill_value=False), exit_.shift(delay, fill_value=False)
    return E.simulate(sub, entry.reindex(cal).fillna(False), exit_.reindex(cal).fillna(False),
                      rank.reindex(cal), cost_bps=bps, cash_rate=CASH_RATE, **kw)


def chain(results_by_param, picks):
    """Concatène les rendements journaliers des paramètres choisis pour chaque année de test."""
    parts, trades = [], []
    for year, p in picks.items():
        eq = results_by_param[p].equity
        r = eq.pct_change()
        parts.append(r[r.index.year == year])
        trades += [t for t in results_by_param[p].trades if t.entry_date.year == year]
    r = pd.concat(parts).fillna(0)
    return (1 + r).cumprod() * 1000.0, trades, r


summary = {}
all_trial_sr = []
for name, (fn, grid, tickers, extra) in STRATS.items():
    print(f"== {name} ({len(grid)} variantes)")
    base = {p: run_all(fn, p, tickers, extra, BASE_BPS) for p in grid}
    gross = {p: run_all(fn, p, tickers, extra, 0.0) for p in grid}
    for p, res in base.items():
        r = res.equity.pct_change().dropna()
        r = r[r.index >= "2003-01-01"]
        if r.std() > 0:
            all_trial_sr.append(r.mean() / r.std())

    first_valid = max(base[grid[0]].equity.index[0].year + 1, 2000)
    if name.startswith("S4"):
        first_valid = 2007  # VIX3M disponible depuis juillet 2006
    test_years = list(range(first_valid + TRAIN_YEARS, cal[-1].year + 1))
    picks = {}
    for y in test_years:
        lo, hi = pd.Timestamp(f"{y - TRAIN_YEARS}-01-01"), pd.Timestamp(f"{y - 1}-12-31")
        best, best_s = None, -np.inf
        for p in grid:
            eq = base[p].equity.loc[lo:hi]
            s = E.stats(eq, rf)["sharpe"]
            s = -np.inf if s is None or math.isnan(s) else s
            if s > best_s:
                best, best_s = p, s
        picks[y] = best

    oos_eq, oos_trades, oos_r = chain(base, picks)
    g_eq, _, _ = chain(gross, picks)
    st = E.stats(oos_eq, rf)
    gst = E.stats(g_eq, rf)
    closed = [t for t in oos_trades if t.reason != "ouverte"]
    fee_impact = (gst["cagr"] - st["cagr"]) / gst["cagr"] if gst["cagr"] > 0 else 1.0

    # stress coûts et délai d'exécution (mêmes choix de paramètres)
    needed = set(picks.values())
    stress = {p: run_all(fn, p, tickers, extra, STRESS_BPS) for p in needed}
    delayed = {p: run_all(fn, p, tickers, extra, BASE_BPS, delay=1) for p in needed}
    s_eq, _, _ = chain(stress, picks)
    d_eq, _, _ = chain(delayed, picks)

    # in-sample : meilleure variante sur toute la période (optimiste par construction)
    full = {p: E.stats(base[p].equity[base[p].equity.index >= f"{first_valid}-01-01"], rf) for p in grid}
    best_is = max(grid, key=lambda p: -np.inf if math.isnan(full[p]["sharpe"]) else full[p]["sharpe"])
    is_trades = [t for t in base[best_is].trades if t.entry_date.year >= first_valid and t.reason != "ouverte"]

    # Monte-Carlo sur les trades hors échantillon
    if closed:
        rets = np.array([t.ret for t in closed])
        fracs = []
        for t in closed:
            eq_series = base[picks[t.entry_date.year]].equity
            e0 = eq_series[:t.entry_date].iloc[-2] if len(eq_series[:t.entry_date]) > 1 else 1000.0
            fracs.append(t.qty * t.entry_px / e0)
        mc = E.monte_carlo_dd(rets, np.array(fracs))
        mc_stats = dict(p50=float(np.median(mc)), p95=float(np.quantile(mc, 0.95)), worst=float(mc.max()))
        win = float((rets > 0).mean())
        avg_ret = float(rets.mean())
    else:
        mc_stats, win, avg_ret = {}, float("nan"), float("nan")

    ex = oos_r - rf.reindex(oos_r.index).fillna(0)
    sr_var = float(np.var(all_trial_sr)) if len(all_trial_sr) > 1 else 0.0
    yearly = {}
    for y in sorted(set(oos_eq.index.year)):
        e = oos_eq[oos_eq.index.year == y]
        prev = oos_eq[oos_eq.index.year < y]
        start = prev.iloc[-1] if len(prev) else 1000.0
        yearly[y] = dict(ret=float(e.iloc[-1] / start - 1), maxdd=float(-(e / e.cummax() - 1).min()))
    spy = panel["SPY"]["close"].loc[oos_eq.index[0]:]
    bench = E.stats(spy / spy.iloc[0] * 1000, rf)
    sc = E.score(st["sharpe"], st["sortino"], st["maxdd"], len(closed), fee_impact)

    summary[name] = dict(
        oos_period=[str(oos_eq.index[0].date()), str(oos_eq.index[-1].date())],
        picks={str(k): list(v) for k, v in picks.items()},
        oos=st, oos_gross=gst, oos_stress=E.stats(s_eq, rf), oos_delay1=E.stats(d_eq, rf),
        n_trades_oos=len(closed), win_rate=win, avg_trade_ret=avg_ret, fee_impact=fee_impact,
        in_sample=dict(params=list(best_is), **full[best_is], n_trades=len(is_trades)),
        monte_carlo_maxdd=mc_stats, yearly=yearly, benchmark_spy=bench,
        open_positions=[(t.ticker, str(t.entry_date.date()), round(t.entry_px, 2), round(t.stop, 2))
                        for t in base[picks[max(picks)]].trades if t.reason == "ouverte"],
        score=sc,
        _ex_returns=ex,
    )
    print(f"  OOS {summary[name]['oos_period']} Sharpe {st['sharpe']:.2f} Sortino {st['sortino']:.2f} "
          f"DD {st['maxdd']:.1%} CAGR {st['cagr']:.1%} trades {len(closed)} frais {fee_impact:.0%} -> {sc['total']}/25")

# Deflated Sharpe (après avoir collecté la variance des Sharpe de TOUS les essais)
sr_var = float(np.var(all_trial_sr))
for name, s in summary.items():
    ex = s.pop("_ex_returns")
    s["deflated_sharpe_prob"] = E.deflated_sharpe(ex, N_TRIALS, sr_var)
    s["n_trials_total"] = N_TRIALS

meta = dict(
    generated_utc=pd.Timestamp.utcnow().isoformat(), last_bar=str(cal[-1].date()),
    sources=["Yahoo Finance v8 chart (non officiel, OHLC ajustés)", "FRED DTB3 (taux sans risque)",
             "Yahoo ^VIX, ^VIX3M (CBOE)"],
    costs_bps=dict(base=BASE_BPS, stress=STRESS_BPS), train_years=TRAIN_YEARS, n_trials=N_TRIALS,
)
(OUT / "results.json").write_text(json.dumps(dict(meta=meta, strategies=summary), indent=2, default=float))
print("Deflated Sharpe:", {k: round(v["deflated_sharpe_prob"], 3) for k, v in summary.items()})
