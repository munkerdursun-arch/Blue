"""
Robot S4 — « régime de volatilité » (SPY acheteur seulement quand VIX/VIX3M < seuil).

STATUT : candidate NON admise (17/25 < 18/25). Le robot démarre donc en MODE « shadow » :
il calcule les signaux, fait valider par le risk manager et JOURNALISE, mais n'envoie
AUCUN ordre. Le mode « paper » (compte de simulation Alpaca) ne doit être activé
qu'après décision écrite du propriétaire. Il n'existe AUCUN mode argent réel dans ce code
(paper=True est codé en dur).

Architecture (conception la plus simple possible, un seul fichier) :
  données  -> signal -> risk manager -> trader -> journal
  - Données : SPY via Alpaca (si clés) sinon Yahoo ; VIX et VIX3M via CBOE (source officielle).
  - Signal  : calculé sur bougies JOURNALIÈRES CLÔTURÉES uniquement (pas de donnée future).
  - Risque  : 1 % du capital par trade, stop = 3 × ATR14, coupe-circuits (perte jour 2 %,
              3 pertes consécutives, données périmées, fenêtre d'événements).
  - Ordres  : achat/vente par ordre LIMITÉ (DAY) ; stop natif si accepté par Alpaca,
              sinon stop logiciel surveillé toutes les 5 min (commande `watch`).
  - Journal : JOURNAL.md (titre · idée · preuves · étape suivante) + state.json.

Utilisation :
  python robot_s4.py daily   # après la clôture US (22:30 heure de Paris)
  python robot_s4.py watch   # pendant la séance, toutes les 5 min (stop logiciel)
"""
from __future__ import annotations

import io
import json
import os
import sys
import datetime as dt
from pathlib import Path

import pandas as pd
import requests

# ============================== CONFIGURATION ============================== #
MODE = os.getenv("ROBOT_MODE", "shadow")      # "shadow" (défaut) ou "paper"
SYMBOL = "SPY"
RATIO_THR = 0.95          # paramètre retenu par le walk-forward pour 2026 (à ré-entraîner chaque 1er janvier)
NEED_TREND = False        # filtre MM200 (choix walk-forward 2026)
RISK_PER_TRADE = 0.01     # 1 % des fonds propres
STOP_ATR_K = 3.0
MAX_WEIGHT = 1.0          # ETF indiciel large, pas de levier : notionnel <= trésorerie
LIMIT_SLIP = 0.002        # prix limite = clôture × (1 ± 0,2 %)
DAILY_LOSS_KILL = 0.02
MAX_CONSEC_LOSSES = 3
# Fenêtre d'événements (dates US, ET) : aucune PREMIÈRE mise en service la veille / le jour.
# Sources : calendrier BLS / Fed relevé le 2026-11-08 — à mettre à jour chaque semaine.
EVENT_DATES = ["2026-11-10", "2026-12-04", "2026-12-09", "2026-12-10"]

ROOT = Path(__file__).resolve().parent
STATE = ROOT / "state.json"
JOURNAL = ROOT.parent / "JOURNAL.md"
UA = {"User-Agent": "Mozilla/5.0 (trading-desk research)"}
CBOE = "https://cdn.cboe.com/api/global/us_indices/daily_prices/{}_History.csv"


# ================================ JOURNAL ================================== #
def log(agent: str, titre: str, idee: str, preuves: str, suite: str) -> None:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    line = f"| {now} | {agent} | {titre} | {idee} | {preuves} | {suite} |\n"
    with JOURNAL.open("a", encoding="utf-8") as f:
        f.write(line)
    print(line.strip())


def load_state() -> dict:
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"activated": False, "consec_losses": 0, "position": None, "halted": False}


def save_state(s: dict) -> None:
    STATE.write_text(json.dumps(s, indent=2, default=str))


# ================================ DONNÉES ================================== #
def cboe_close(name: str) -> pd.Series:
    r = requests.get(CBOE.format(name), headers=UA, timeout=30)
    r.raise_for_status()
    df = pd.read_csv(io.StringIO(r.text))
    df["DATE"] = pd.to_datetime(df["DATE"], format="%m/%d/%Y")
    return df.set_index("DATE")["CLOSE"].astype(float)


def spy_daily() -> pd.DataFrame:
    """Bougies journalières SPY. Alpaca si clés présentes (source du courtier), sinon Yahoo."""
    key, sec = os.getenv("APCA_API_KEY_ID"), os.getenv("APCA_API_SECRET_KEY")
    if key and sec:
        from alpaca.data.historical import StockHistoricalDataClient
        from alpaca.data.requests import StockBarsRequest
        from alpaca.data.timeframe import TimeFrame
        from alpaca.data.enums import Adjustment
        cli = StockHistoricalDataClient(key, sec)
        req = StockBarsRequest(symbol_or_symbols=SYMBOL, timeframe=TimeFrame.Day,
                               start=dt.datetime.now() - dt.timedelta(days=500),
                               adjustment=Adjustment.ALL)
        df = cli.get_stock_bars(req).df.xs(SYMBOL)
        df.index = pd.to_datetime(df.index).tz_convert("America/New_York").normalize().tz_localize(None)
        return df[["open", "high", "low", "close", "volume"]]
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=2y&interval=1d")
    res = requests.get(url, headers=UA, timeout=30).json()["chart"]["result"][0]
    q = res["indicators"]["quote"][0]
    df = pd.DataFrame({k: q[k] for k in ("open", "high", "low", "close", "volume")},
                      index=pd.to_datetime(res["timestamp"], unit="s").normalize())
    return df.dropna()


def only_closed_bars(df: pd.DataFrame) -> pd.DataFrame:
    """Retire la bougie du jour si la séance US n'est pas terminée (évite la donnée incomplète)."""
    now_ny = pd.Timestamp.now(tz="America/New_York")
    if len(df) and df.index[-1].date() == now_ny.date() and now_ny.hour < 16:
        return df.iloc[:-1]
    return df


def atr14(df: pd.DataFrame) -> pd.Series:
    pc = df["close"].shift(1)
    tr = pd.concat([df["high"] - df["low"], (df["high"] - pc).abs(), (df["low"] - pc).abs()], axis=1).max(axis=1)
    return tr.ewm(alpha=1 / 14, adjust=False, min_periods=14).mean()


# ================================ SIGNAL =================================== #
def compute_signal() -> dict:
    spy = only_closed_bars(spy_daily())
    vix, vix3m = cboe_close("VIX"), cboe_close("VIX3M")
    d = spy.index[-1]
    stale = not (d in vix.index and d in vix3m.index)
    age_days = (pd.Timestamp.now().normalize() - d).days
    stale |= age_days > 4                       # week-end + 1 jour férié max
    ratio = float(vix.get(d, float("nan")) / vix3m.get(d, float("nan")))
    sma200 = float(spy["close"].rolling(200).mean().iloc[-1])
    ok = ratio < RATIO_THR and (spy["close"].iloc[-1] > sma200 if NEED_TREND else True)
    return dict(date=str(d.date()), close=float(spy["close"].iloc[-1]), low=float(spy["low"].iloc[-1]),
                open=float(spy["open"].iloc[-1]), atr=float(atr14(spy).iloc[-1]),
                vix=float(vix.get(d, float("nan"))), vix3m=float(vix3m.get(d, float("nan"))),
                ratio=ratio, sma200=sma200, long=bool(ok), stale=bool(stale))


# ============================= RISK MANAGER ================================ #
def risk_manager(plan: dict, sig: dict, st: dict, acct: dict) -> tuple[bool, str]:
    """Peut refuser n'importe quel plan. Renvoie (approuvé, raison)."""
    if st.get("halted"):
        return False, "robot arrêté par coupe-circuit (réarmement manuel requis)"
    if sig["stale"]:
        return False, "données périmées ou dates SPY/VIX non alignées"
    if acct["day_pnl_pct"] <= -DAILY_LOSS_KILL:
        return False, f"perte journalière {acct['day_pnl_pct']:.2%} >= 2 %"
    if st["consec_losses"] >= MAX_CONSEC_LOSSES:
        return False, "3 pertes consécutives"
    if plan["side"] == "buy":
        today = pd.Timestamp.now(tz="America/New_York").normalize().tz_localize(None)
        if not st["activated"]:
            for e in EVENT_DATES:
                gap = (pd.Timestamp(e) - today).days
                if 0 <= gap <= 1:
                    return False, f"première mise en service interdite avant l'événement du {e}"
        risk_cash = plan["qty"] * (plan["limit"] - plan["stop"])
        if risk_cash > RISK_PER_TRADE * acct["equity"] * 1.05:
            return False, f"risque {risk_cash:.2f} > 1 % des fonds propres"
        if plan["qty"] * plan["limit"] > acct["cash"]:
            return False, "notionnel > trésorerie (levier interdit)"
    return True, "conforme aux Règles de trading"


# ================================ TRADER =================================== #
def trading_client():
    from alpaca.trading.client import TradingClient
    return TradingClient(os.environ["APCA_API_KEY_ID"], os.environ["APCA_API_SECRET_KEY"], paper=True)


def account_snapshot() -> dict:
    if MODE != "paper":
        st = load_state()
        eq = st.get("shadow_equity", 1000.0)
        return dict(equity=eq, cash=eq if not st["position"] else 0.0, day_pnl_pct=0.0)
    a = trading_client().get_account()
    eq, last = float(a.equity), float(a.last_equity)
    return dict(equity=eq, cash=float(a.cash), day_pnl_pct=(eq - last) / last if last else 0.0)


def cancel_open_orders(cli) -> None:
    """Annule tout ordre ouvert sur SYMBOL (ex. stop natif) AVANT une vente : sinon deux ventes
    pourraient s'exécuter et créer une position vendeuse (vente à découvert interdite)."""
    from alpaca.trading.requests import GetOrdersRequest
    from alpaca.trading.enums import QueryOrderStatus
    for o in cli.get_orders(GetOrdersRequest(status=QueryOrderStatus.OPEN, symbols=[SYMBOL])):
        cli.cancel_order_by_id(o.id)


def broker_qty(cli) -> float:
    """Quantité réellement détenue chez le courtier (source de vérité)."""
    for p in cli.get_all_positions():
        if p.symbol == SYMBOL:
            return float(p.qty)
    return 0.0


def trader_execute(plan: dict) -> str:
    """Seul composant autorisé à toucher aux ordres. En mode shadow : rien n'est envoyé."""
    if MODE != "paper":
        return "SHADOW : aucun ordre envoyé"
    from alpaca.trading.requests import LimitOrderRequest
    from alpaca.trading.enums import OrderSide, TimeInForce
    cli = trading_client()
    qty = plan["qty"]
    if plan["side"] == "sell":
        cancel_open_orders(cli)
        qty = min(qty, broker_qty(cli))   # ne jamais vendre plus que détenu
        if qty <= 0:
            return "rien à vendre chez le courtier"
    o = cli.submit_order(LimitOrderRequest(
        symbol=SYMBOL, qty=round(qty, 4), limit_price=round(plan["limit"], 2),
        side=OrderSide.BUY if plan["side"] == "buy" else OrderSide.SELL,
        time_in_force=TimeInForce.DAY))
    return f"ordre limité soumis id={o.id}"


def place_native_stop(qty: float, stop: float) -> str:
    """Tente un stop natif. Si Alpaca refuse (ex. quantité fractionnaire), le stop logiciel prend le relais."""
    if MODE != "paper":
        return "SHADOW"
    from alpaca.trading.requests import StopOrderRequest
    from alpaca.trading.enums import OrderSide, TimeInForce
    try:
        o = trading_client().submit_order(StopOrderRequest(
            symbol=SYMBOL, qty=round(qty, 4), stop_price=round(stop, 2),
            side=OrderSide.SELL, time_in_force=TimeInForce.DAY))
        return f"stop natif id={o.id}"
    except Exception as e:  # noqa: BLE001 - on journalise toute erreur courtier
        return f"stop natif refusé ({e}) -> stop logiciel actif"


# ================================ ROUTINES ================================= #
def daily() -> None:
    st = load_state()
    try:
        sig = compute_signal()
    except Exception as e:  # noqa: BLE001
        st["halted"] = True
        save_state(st)
        log("Risk manager", "ARRÊT données", "Source indisponible", repr(e)[:120], "Vérifier la connexion puis réarmer")
        return
    acct = account_snapshot()
    pos = st["position"]
    if pos and MODE == "paper" and broker_qty(trading_client()) <= 0:
        log("Trader", "Réconciliation", "Position absente chez le courtier", str(pos), "État local remis à zéro")
        st["position"] = pos = None
    if pos and MODE != "paper" and sig["date"] > pos["date"] and sig["low"] <= pos["stop"]:
        px = min(sig["open"], pos["stop"])   # gap sous le stop -> sortie à l'ouverture (hypothèse défavorable)
        pnl = (px - pos["entry"]) * pos["qty"]
        st["consec_losses"] = st["consec_losses"] + 1 if pnl < 0 else 0
        st["shadow_equity"] = st.get("shadow_equity", 1000.0) + pnl
        st["position"] = pos = None
        log("Trader", f"STOP fictif {SYMBOL} @ {px:.2f}", "Shadow", f"plus bas {sig['low']:.2f}", "Revue risk manager")
    preuves = (f"{sig['date']} clôture {sig['close']:.2f} VIX {sig['vix']:.2f} VIX3M {sig['vix3m']:.2f} "
               f"ratio {sig['ratio']:.3f} (seuil {RATIO_THR}) ATR {sig['atr']:.2f}")
    if sig["long"] and not pos:
        limit = sig["close"] * (1 + LIMIT_SLIP)
        stop = limit - STOP_ATR_K * sig["atr"]
        qty = min(RISK_PER_TRADE * acct["equity"] / (limit - stop), MAX_WEIGHT * acct["equity"] / limit,
                  acct["cash"] / limit)
        plan = dict(side="buy", qty=qty, limit=limit, stop=stop)
    elif not sig["long"] and pos:
        plan = dict(side="sell", qty=pos["qty"], limit=sig["close"] * (1 - LIMIT_SLIP), stop=None)
    else:
        log("Stratège", "S4 : pas de changement", "Contango requis pour être acheteur" if not pos else "Position maintenue",
            preuves, "Prochaine évaluation après la clôture")
        return
    ok, why = risk_manager(plan, sig, st, acct)
    if not ok:
        log("Risk manager", f"REFUS {plan['side']} {SYMBOL}", "Plan S4", f"{preuves} — {why}", "Aucun ordre")
        if "pertes" in why or "perte journalière" in why:
            st["halted"] = True
        save_state(st)
        return
    res = trader_execute(plan)
    log("Trader", f"{plan['side'].upper()} {SYMBOL} {plan['qty']:.4f} @ limite {plan['limit']:.2f}",
        "S4 régime de volatilité", f"{preuves} — stop {plan['stop'] or '-'} — {res}", "Vérifier l'exécution à l'ouverture")
    # En mode shadow on suppose l'exécution au prix limite pour suivre une performance fictive.
    if plan["side"] == "buy":
        st["position"] = dict(qty=plan["qty"], entry=plan["limit"], stop=plan["stop"], date=sig["date"])
        st["activated"] = True
        log("Trader", "Stop", "Protection", place_native_stop(plan["qty"], plan["stop"]), "Surveillance `watch`")
    else:
        pnl = (plan["limit"] - pos["entry"]) * pos["qty"]
        st["consec_losses"] = st["consec_losses"] + 1 if pnl < 0 else 0
        st["shadow_equity"] = st.get("shadow_equity", 1000.0) + pnl
        st["position"] = None
    save_state(st)


def watch() -> None:
    """Stop logiciel : si le dernier cours <= stop, vente immédiate (seule exception aux ordres limités)."""
    st = load_state()
    pos = st.get("position")
    if not pos:
        return
    if MODE != "paper":
        return  # en shadow, le stop est évalué a posteriori sur le plus bas du jour par `daily`
    from alpaca.data.historical import StockHistoricalDataClient
    from alpaca.data.requests import StockLatestTradeRequest
    cli = StockHistoricalDataClient(os.environ["APCA_API_KEY_ID"], os.environ["APCA_API_SECRET_KEY"])
    px = float(cli.get_stock_latest_trade(StockLatestTradeRequest(symbol_or_symbols=SYMBOL))[SYMBOL].price)
    if px <= pos["stop"]:
        tc = trading_client()
        cancel_open_orders(tc)
        if broker_qty(tc) > 0:
            tc.close_position(SYMBOL)
        pnl = (px - pos["entry"]) * pos["qty"]
        st["consec_losses"] = st["consec_losses"] + 1 if pnl < 0 else 0
        st["position"] = None
        save_state(st)
        log("Trader", f"STOP {SYMBOL} @ {px:.2f}", "Stop logiciel", f"stop {pos['stop']:.2f}", "Revue par le risk manager")


if __name__ == "__main__":
    {"daily": daily, "watch": watch}.get(sys.argv[1] if len(sys.argv) > 1 else "daily", daily)()
