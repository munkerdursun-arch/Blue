"""
Téléchargement de données journalières réelles (non inventées).

Source principale : Yahoo Finance (endpoint public v8/chart) — source NON officielle,
gratuite, utilisée faute de clés Alpaca. Les prix OHLC sont ajustés des dividendes et
splits via le ratio adjclose/close (ajustement rétroactif standard).
Source secondaire : FRED (Réserve fédérale de St. Louis) pour VIX et VIX3M.

Chaque fichier est mis en cache dans data/ avec la date de téléchargement, pour que
les backtests soient reproductibles.
"""
import io
import time
import pathlib
import requests
import pandas as pd

DATA_DIR = pathlib.Path(__file__).parent / "data"
UA = {"User-Agent": "Mozilla/5.0 (research script)"}


def yahoo_daily(ticker: str, start: str = "1999-01-01", refresh: bool = False) -> pd.DataFrame:
    """OHLCV journalier ajusté. Index = date (séance US)."""
    path = DATA_DIR / f"{ticker}.csv"
    if path.exists() and not refresh:
        return pd.read_csv(path, index_col=0, parse_dates=True)
    p1 = int(pd.Timestamp(start).timestamp())
    p2 = int(time.time())
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
           f"?period1={p1}&period2={p2}&interval=1d&events=div%7Csplit&includeAdjustedClose=true")
    r = requests.get(url, headers=UA, timeout=30)
    r.raise_for_status()
    res = r.json()["chart"]["result"][0]
    q = res["indicators"]["quote"][0]
    adj = res["indicators"]["adjclose"][0]["adjclose"]
    df = pd.DataFrame({
        "open": q["open"], "high": q["high"], "low": q["low"],
        "close": q["close"], "volume": q["volume"], "adjclose": adj,
    }, index=pd.to_datetime(res["timestamp"], unit="s").normalize())
    df = df.dropna(subset=["open", "high", "low", "close", "adjclose"])
    df = df[~df.index.duplicated(keep="last")]
    # Ajustement des OHLC par le même facteur que la clôture (dividendes + splits).
    f = df["adjclose"] / df["close"]
    for c in ("open", "high", "low"):
        df[c] = df[c] * f
    df["close"] = df["adjclose"]
    df = df.drop(columns="adjclose")
    df.to_csv(path)
    return df


def fred_series(series_id: str, refresh: bool = False) -> pd.Series:
    path = DATA_DIR / f"FRED_{series_id}.csv"
    if not path.exists() or refresh:
        url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
        r = requests.get(url, headers=UA, timeout=30)
        r.raise_for_status()
        path.write_text(r.text)
    s = pd.read_csv(path, index_col=0, parse_dates=True).iloc[:, 0]
    return pd.to_numeric(s, errors="coerce").dropna()


INDEX_ETFS = ["SPY", "QQQ", "IWM", "DIA"]
# Les 9 SPDR sectoriels historiques (cotés depuis déc. 1998) : historique long et
# point-in-time, donc pas de biais du survivant sur l'univers ETF.
SECTOR_ETFS = ["XLK", "XLF", "XLE", "XLV", "XLI", "XLY", "XLP", "XLU", "XLB"]

if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)
    for t in INDEX_ETFS + SECTOR_ETFS:
        df = yahoo_daily(t, refresh=True)
        print(t, df.index[0].date(), df.index[-1].date(), len(df))
        time.sleep(0.5)
    for s in ("VIXCLS", "VXVCLS"):
        x = fred_series(s, refresh=True)
        print(s, x.index[0].date(), x.index[-1].date(), len(x))
