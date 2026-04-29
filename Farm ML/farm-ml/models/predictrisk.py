import pandas as pd
import numpy as np
import json
import os
import pyodbc
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from xgboost import XGBRegressor
from datetime import datetime, timedelta
import warnings
import sys
warnings.filterwarnings("ignore")

# ══════════════════════════════════════════════════════════════════════════════
# CELL 1 — CONFIG
# ══════════════════════════════════════════════════════════════════════════════

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "xgboost_farm_model.json")
FEAT_PATH  = os.path.join(BASE_DIR, "features.json")

DB_SERVER  = "farmdbserver.database.windows.net"
DB_NAME    = "free-sql-db-5003384"
DB_USER    = "adminuser"
DB_PASS    = "YOUR_PASSWORD_HERE"   # ← replace

FORECAST_DAYS = 7

conn_str = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=VIDURA\\SQLEXPRESS;"
    "DATABASE=SDMS;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
    "TrustServerCertificate=yes;"
    "Connection Timeout=180;"
)


# ══════════════════════════════════════════════════════════════════════════════
# CELL 2 — Load model + feature list
# ══════════════════════════════════════════════════════════════════════════════

model = XGBRegressor()
model.load_model(MODEL_PATH)

with open(FEAT_PATH) as f:
    FEATURE_COLS = json.load(f)

sys.stdout.reconfigure(encoding='utf-8')
print(f"✅ Model loaded")
print(f"   Expected features: {len(FEATURE_COLS)}")

# ══════════════════════════════════════════════════════════════════════════════
# CELL 3 — Load latest satellite + weather data from DB
# ══════════════════════════════════════════════════════════════════════════════

conn = pyodbc.connect(conn_str)

history_sql = """
    SELECT TOP 2000
        fp.FarmId,
        f.Name                      AS FarmName,
        fp.Date,
        COUNT(DISTINCT fp.CellId)   AS CellCount,
        AVG(fp.NDVI)                AS NDVI,
        AVG(fp.NDMI)                AS NDMI,
        AVG(fp.Risk)                AS Risk,
        MIN(fp.Risk)                AS RiskMin,
        MAX(fp.Risk)                AS RiskMax,
        STDEV(fp.Risk)              AS RiskStd,
        SUM(CASE WHEN fp.Risk >= 70 THEN 1 ELSE 0 END) AS HighRiskCells,
        SUM(CASE WHEN fp.Risk >= 40
             AND fp.Risk < 70 THEN 1 ELSE 0 END)       AS MedRiskCells,
        SUM(CASE WHEN fp.Risk < 40  THEN 1 ELSE 0 END) AS LowRiskCells,
        fw.TempMax,
        fw.TempMin,
        fw.Rainfall,
        fw.Humidity,
        fw.ET0,
        fw.WindSpeed,
        wr.DroughtRisk,
        wr.FloodRisk,
        wr.FungalRisk,
        wr.HeatStressRisk,
        MONTH(fp.Date)              AS Month,
        DATEPART(dw, fp.Date)       AS DayOfWeek
    FROM FarmPixelData fp
    JOIN Farms f
        ON fp.FarmId = f.FarmId
    LEFT JOIN FarmWeather fw
        ON fp.FarmId = fw.FarmId AND fp.Date = fw.Date
    LEFT JOIN FarmWeatherRisk wr
        ON fp.FarmId = wr.FarmId AND fp.Date = wr.Date
    GROUP BY
        fp.FarmId, f.Name, fp.Date,
        fw.TempMax, fw.TempMin, fw.Rainfall, fw.Humidity,
        fw.ET0, fw.WindSpeed,
        wr.DroughtRisk, wr.FloodRisk, wr.FungalRisk, wr.HeatStressRisk,
        MONTH(fp.Date), DATEPART(dw, fp.Date)
    ORDER BY fp.FarmId, fp.Date DESC
"""

forecast_sql = """
    SELECT
        fw.FarmId,
        f.Name          AS FarmName,
        fw.Date,
        fw.TempMax,
        fw.TempMin,
        fw.Rainfall,
        fw.Humidity,
        fw.ET0,
        fw.WindSpeed,
        wr.DroughtRisk,
        wr.FloodRisk,
        wr.FungalRisk,
        wr.HeatStressRisk,
        MONTH(fw.Date)  AS Month
    FROM FarmWeather fw
    JOIN Farms f
        ON fw.FarmId = f.FarmId
    LEFT JOIN FarmWeatherRisk wr
        ON fw.FarmId = wr.FarmId AND fw.Date = wr.Date
    WHERE fw.Date > CAST(GETDATE() AS DATE)
    ORDER BY fw.FarmId, fw.Date
"""

df_history  = pd.read_sql(history_sql,  conn)
df_forecast = pd.read_sql(forecast_sql, conn)
conn.close()

df_history["Date"]  = pd.to_datetime(df_history["Date"])
df_forecast["Date"] = pd.to_datetime(df_forecast["Date"])

print(f"✅ History rows:  {len(df_history)}")
print(f"✅ Forecast rows: {len(df_forecast)}")
print(f"   Forecast dates: {df_forecast['Date'].min().date()} → "
      f"{df_forecast['Date'].max().date()}")


# ══════════════════════════════════════════════════════════════════════════════
# CELL 4 — Feature builder (must match training exactly)
# ══════════════════════════════════════════════════════════════════════════════

def build_features_for_row(farm_history: pd.DataFrame,
                            weather_row: dict) -> dict:
    h = farm_history.sort_values("Date").reset_index(drop=True)

    def safe_get(col, lag=0):
        idx = len(h) - 1 - lag
        if idx < 0:
            return np.nan
        return h.iloc[idx][col] if col in h.columns else np.nan

    feat = {
        "NDVI_lag1":  safe_get("NDVI", 0),
        "NDVI_lag2":  safe_get("NDVI", 1),
        "NDVI_lag3":  safe_get("NDVI", 2),
        "NDMI_lag1":  safe_get("NDMI", 0),
        "NDMI_lag2":  safe_get("NDMI", 1),
        "NDMI_lag3":  safe_get("NDMI", 2),
        "Risk_lag1":  safe_get("Risk", 0),
        "Risk_lag2":  safe_get("Risk", 1),
        "Risk_lag3":  safe_get("Risk", 2),
    }

    feat["NDVI_roll3"] = h["NDVI"].tail(3).mean()
    feat["NDVI_roll5"] = h["NDVI"].tail(5).mean()
    feat["Risk_roll3"] = h["Risk"].tail(3).mean()
    feat["NDVI_trend"] = feat["NDVI_lag1"] - feat["NDVI_roll3"]
    feat["Risk_trend"] = feat["Risk_lag1"] - feat["Risk_roll3"]
    feat["NDVI_change"] = safe_get("NDVI", 0) - safe_get("NDVI", 1)
    feat["NDMI_change"] = safe_get("NDMI", 0) - safe_get("NDMI", 1)

    feat["TempMax"]  = weather_row.get("TempMax")
    feat["TempMin"]  = weather_row.get("TempMin")
    feat["Rainfall"] = weather_row.get("Rainfall")
    feat["Humidity"] = weather_row.get("Humidity")
    feat["ET0"]      = weather_row.get("ET0")

    recent_rain = list(h["Rainfall"].tail(6).fillna(0).values) + \
                  [weather_row.get("Rainfall") or 0]
    feat["Rain_7d"]     = sum(recent_rain[-7:])
    feat["Rain_14d"]    = sum(recent_rain[-14:]) \
                          if len(recent_rain) >= 14 else sum(recent_rain)
    feat["Hum_3d_avg"]  = np.mean(
        list(h["Humidity"].tail(2).fillna(0).values) +
        [weather_row.get("Humidity") or 0]
    )
    feat["Temp_3d_avg"] = np.mean(
        list(h["TempMax"].tail(2).fillna(0).values) +
        [weather_row.get("TempMax") or 0]
    )

    all_rain = list(h["Rainfall"].fillna(0).values) + \
               [weather_row.get("Rainfall") or 0]
    streak = 0
    for r in reversed(all_rain):
        if r < 1.0:
            streak += 1
        else:
            break
    feat["DryStreak"] = streak

    feat["DroughtRisk"]    = weather_row.get("DroughtRisk",    0) or 0
    feat["FloodRisk"]      = weather_row.get("FloodRisk",      0) or 0
    feat["FungalRisk"]     = weather_row.get("FungalRisk",     0) or 0
    feat["HeatStressRisk"] = weather_row.get("HeatStressRisk", 0) or 0

    month = int(weather_row.get("Month",
                pd.Timestamp(weather_row["Date"]).month))
    season_map = {
        12:0, 1:0, 2:0, 3:1, 4:1,
         5:2, 6:2, 7:2, 8:2, 9:2,
        10:3, 11:3,
    }
    feat["Season"]          = season_map.get(month, 1)
    feat["IsHarvestSeason"] = int(month in [1, 2, 3, 10, 11])
    feat["IsFlushSeason"]   = int(month in [3, 4])

    feat["FungalCondition"]   = (feat["Humidity"] or 0) / 100.0 * \
                                (feat["TempMax"]  or 0) / 40.0
    feat["DroughtHeatStress"] = (feat["DroughtRisk"] / 100.0) * \
                                (feat["HeatStressRisk"] / 100.0)
    feat["HealthScore"]       = (feat["NDVI_lag1"] or 0) * 0.6 + \
                                (feat["NDMI_lag1"] or 0) * 0.4

    return feat


# ══════════════════════════════════════════════════════════════════════════════
# CELL 5 — Generate predictions for all farms
# ══════════════════════════════════════════════════════════════════════════════

all_predictions = []

for farm_id in df_history["FarmId"].unique():
    farm_hist     = df_history[df_history["FarmId"] == farm_id].copy()
    farm_forecast = df_forecast[df_forecast["FarmId"] == farm_id].copy()
    farm_name     = farm_hist["FarmName"].iloc[0]

    if farm_forecast.empty:
        print(f"⚠  FarmId {farm_id} ({farm_name}) — no forecast weather, skipping")
        continue

    print(f"\n📡  {farm_name} (FarmId={farm_id})")

    farm_hist = farm_hist.sort_values("Date").reset_index(drop=True)

    for _, frow in farm_forecast.sort_values("Date").iterrows():
        weather_dict       = frow.to_dict()
        weather_dict["Date"] = frow["Date"]

        features = build_features_for_row(farm_hist, weather_dict)
        feat_df  = pd.DataFrame([features])[FEATURE_COLS]

        pred_risk = float(np.clip(model.predict(feat_df)[0], 0, 100))

        level = "HIGH" if pred_risk >= 70 else \
                "MEDIUM" if pred_risk >= 40 else "LOW"
        icon  = "🔴" if level == "HIGH" else \
                "🟡" if level == "MEDIUM" else "🟢"

        print(f"   {frow['Date'].date()}  →  {pred_risk:5.1f}  {icon} {level}")

        all_predictions.append({
            "FarmId":        farm_id,
            "FarmName":      farm_name,
            "Date":          frow["Date"],
            "PredictedRisk": round(pred_risk, 2),
            "RiskLevel":     level,
            "TempMax":       frow.get("TempMax"),
            "Rainfall":      frow.get("Rainfall"),
            "Humidity":      frow.get("Humidity"),
            "FungalRisk":    frow.get("FungalRisk"),
            "DroughtRisk":   frow.get("DroughtRisk"),
        })

df_pred = pd.DataFrame(all_predictions)
print(f"\n✅ Total predictions: {len(df_pred)}")
df_pred


# ══════════════════════════════════════════════════════════════════════════════
# CELL 6 — Plot predictions vs history per farm
# ══════════════════════════════════════════════════════════════════════════════

farm_ids = sorted(df_pred["FarmId"].unique())
n_farms  = len(farm_ids)

fig, axes = plt.subplots(n_farms, 1, figsize=(14, 4 * n_farms))
if n_farms == 1:
    axes = [axes]

fig.suptitle(
    f"7-Day Risk Forecast  (as of {datetime.now().date()})",
    fontsize=14, fontweight="bold"
)

for ax, fid in zip(axes, farm_ids):
    fp    = df_pred[df_pred["FarmId"] == fid].sort_values("Date")
    fhist = df_history[df_history["FarmId"] == fid].sort_values("Date").tail(10)
    name  = fp["FarmName"].iloc[0]

    ax.plot(fhist["Date"], fhist["Risk"], "o-",
            color="steelblue", lw=2, ms=5, label="Historical")
    ax.plot(fp["Date"], fp["PredictedRisk"], "s--",
            color="tomato", lw=2, ms=7, label="Predicted")

    for _, row in fp.iterrows():
        c = "#d32f2f" if row["PredictedRisk"] >= 70 else \
            "#f57c00" if row["PredictedRisk"] >= 40 else "#388e3c"
        ax.scatter(row["Date"], row["PredictedRisk"], color=c, s=80, zorder=5)
        ax.annotate(f"{row['PredictedRisk']:.0f}",
                    (row["Date"], row["PredictedRisk"]),
                    textcoords="offset points", xytext=(0, 10),
                    fontsize=8, ha="center", color=c, fontweight="bold")

    ax.axhline(70, color="red",    ls=":", alpha=0.5)
    ax.axhline(40, color="orange", ls=":", alpha=0.5)
    if not fhist.empty:
        ax.axvline(fhist["Date"].max() + timedelta(days=1),
                   color="gray", ls="--", alpha=0.5, label="Today")

    ax.set_title(f"{name}  (FarmId={fid})", fontsize=11, fontweight="bold")
    ax.set_ylabel("Risk Score")
    ax.set_ylim(0, 110)
    ax.legend(fontsize=8, loc="upper left")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%m-%d"))
    ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig("risk_forecast.png", dpi=150, bbox_inches="tight")
plt.show()
print("✅ Saved: risk_forecast.png")


# ══════════════════════════════════════════════════════════════════════════════
# CELL 7 — Alert summary
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "=" * 65)
print("  FARM RISK ALERT SUMMARY")
print("=" * 65)

for fid in sorted(df_pred["FarmId"].unique()):
    fp   = df_pred[df_pred["FarmId"] == fid]
    name = fp["FarmName"].iloc[0]
    mx   = fp["PredictedRisk"].max()
    avg  = fp["PredictedRisk"].mean()
    high = (fp["RiskLevel"] == "HIGH").sum()
    peak = fp.loc[fp["PredictedRisk"].idxmax(), "Date"].date()

    alert = "🚨 ALERT " if mx >= 70 else \
            "⚠️  WATCH " if mx >= 40 else "✅ NORMAL"

    print(f"\n{alert}  {name} (FarmId={fid})")
    print(f"   Max risk   : {mx:.1f}")
    print(f"   Avg risk   : {avg:.1f}")
    print(f"   High days  : {high}/7")
    print(f"   Peak date  : {peak}")

df_pred.to_csv("farm_risk_forecast.csv", index=False)
print(f"\n✅ Saved: farm_risk_forecast.csv")


# ══════════════════════════════════════════════════════════════════════════════
# CELL 8 — Feature importance
# ══════════════════════════════════════════════════════════════════════════════

importances = pd.Series(
    model.feature_importances_, index=FEATURE_COLS
).sort_values(ascending=False).head(20)

fig, ax = plt.subplots(figsize=(10, 7))
colors  = ["#d32f2f" if i < 5 else "#f57c00" if i < 10
           else "#388e3c" for i in range(len(importances))]
importances.plot(kind="barh", ax=ax, color=list(reversed(colors)))
ax.set_title("Top 20 Feature Importances — What Drives Cinnamon Risk",
             fontsize=12, fontweight="bold")
ax.set_xlabel("Importance Score")
ax.invert_yaxis()
ax.grid(True, alpha=0.3, axis="x")
plt.tight_layout()
plt.savefig("feature_importance.png", dpi=150, bbox_inches="tight")
plt.show()
print("✅ Saved: feature_importance.png")