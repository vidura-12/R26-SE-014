import os
import time
import pyodbc
import requests
from datetime import datetime as dt, timedelta, date

# ══════════════════════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════════════════════

DB_CONN_STR = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=VIDURA\\SQLEXPRESS;"
    "DATABASE=SDMS;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
    "TrustServerCertificate=yes;"
    "Connection Timeout=180;"
)

WEATHER_API_URL      = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_API_URL     = "https://api.open-meteo.com/v1/forecast"
LOOKBACK_DAYS        = 360    # backfill last 60 days on first run
FORECAST_DAYS        = 7     # also fetch 7-day forecast
DB_BATCH_SIZE        = 100

# ══════════════════════════════════════════════════════════════════════════════
# DB CONNECTION
# ══════════════════════════════════════════════════════════════════════════════

def get_connection() -> pyodbc.Connection:
    last_error = None
    for attempt in range(5):
        try:
            conn = pyodbc.connect(DB_CONN_STR)
            conn.cursor().fast_executemany = True
            if attempt > 0:
                print(f"  DB connected after {attempt + 1} attempts ✓")
            return conn
        except Exception as e:
            last_error = e
            wait = 20 * (attempt + 1)
            print(f"  DB attempt {attempt + 1} failed — retrying in {wait}s: {e}")
            time.sleep(wait)
    raise last_error


# ══════════════════════════════════════════════════════════════════════════════
# FETCH FARMS
# ══════════════════════════════════════════════════════════════════════════════

def fetch_farms(cursor) -> list[dict]:
    """Get all farms with their coordinates from the Farms table."""
    cursor.execute("""
        SELECT FarmId, Name, Latitude, Longitude
        FROM Farms
        WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL
    """)
    rows = cursor.fetchall()
    farms = []
    for row in rows:
        farms.append({
            "farm_id":   row[0],
            "name":      row[1],
            "latitude":  float(row[2]),
            "longitude": float(row[3]),
        })
    return farms


# ══════════════════════════════════════════════════════════════════════════════
# WEATHER RISK CALCULATOR
# ══════════════════════════════════════════════════════════════════════════════

def compute_weather_risks(weather_rows: list[dict]) -> list[dict]:
    """
    Compute derived cinnamon-specific risk indicators from raw weather data.
    Uses rolling windows to calculate drought, flood, fungal and heat risks.

    Cinnamon risk rules (Sri Lanka wet zone):
      Drought risk  — no rain for 14+ consecutive days + high temp
      Flood risk    — >200mm rain in 14 days (waterlogging = root rot)
      Fungal risk   — humidity >75% for 3+ days (cinnamon dieback disease)
      Heat stress   — temp >32°C (growth suppression)
    """
    result = []

    for i, row in enumerate(weather_rows):
        # Rolling windows using previous entries
        window_7  = weather_rows[max(0, i - 6)  : i + 1]
        window_14 = weather_rows[max(0, i - 13) : i + 1]
        window_3  = weather_rows[max(0, i - 2)  : i + 1]

        rain_7d   = sum(r["rainfall"]  or 0 for r in window_7)
        rain_14d  = sum(r["rainfall"]  or 0 for r in window_14)
        hum_3d    = sum(r["humidity"]  or 0 for r in window_3) / len(window_3)
        dry_days  = sum(1 for r in window_14 if (r["rainfall"] or 0) < 1.0)

        drought_risk = round(min(100.0, dry_days / 14.0 * 100.0), 2)
        flood_risk   = round(min(100.0, max(0.0, (rain_14d - 200.0) / 100.0 * 100.0)), 2)
        fungal_risk  = round(min(100.0, max(0.0, (hum_3d - 75.0) / 25.0 * 100.0)), 2)
        heat_risk    = round(min(100.0, max(0.0, ((row["temp_max"] or 0) - 32.0) / 8.0 * 100.0)), 2)

        result.append({
            "farm_id":      row["farm_id"],
            "date":         row["date"],
            "drought_risk": drought_risk,
            "flood_risk":   flood_risk,
            "fungal_risk":  fungal_risk,
            "heat_risk":    heat_risk,
        })

    return result


# ══════════════════════════════════════════════════════════════════════════════
# OPEN-METEO API
# ══════════════════════════════════════════════════════════════════════════════

DAILY_VARIABLES = [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "relative_humidity_2m_max",
    "et0_fao_evapotranspiration",
    "windspeed_10m_max",
]


def _call_weather_api(url: str, lat: float, lon: float, extra_params: dict) -> dict | None:
    """Call Open-Meteo API with retry."""
    params = {
        "latitude":  lat,
        "longitude": lon,
        "daily":     DAILY_VARIABLES,
        "timezone":  "Asia/Colombo",
        **extra_params,
    }
    for attempt in range(3):
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            if attempt == 2:
                print(f"    Weather API failed after 3 attempts: {e}")
                return None
            time.sleep(5 * (attempt + 1))


def fetch_historical_weather(lat: float, lon: float,
                              start: date, end: date) -> dict | None:
    return _call_weather_api(
        WEATHER_API_URL, lat, lon,
        {"start_date": start.strftime("%Y-%m-%d"),
         "end_date":   end.strftime("%Y-%m-%d")}
    )


def fetch_forecast_weather(lat: float, lon: float) -> dict | None:
    return _call_weather_api(
        FORECAST_API_URL, lat, lon,
        {"forecast_days": FORECAST_DAYS}
    )


def parse_weather_response(farm_id: int, data: dict) -> list[dict]:
    """Parse Open-Meteo response into list of daily weather dicts."""
    daily   = data.get("daily", {})
    dates   = daily.get("time", [])
    rows    = []

    for i, date_str in enumerate(dates):
        rows.append({
            "farm_id":   farm_id,
            "date":      date_str,
            "temp_max":  daily.get("temperature_2m_max",          [None])[i],
            "temp_min":  daily.get("temperature_2m_min",          [None])[i],
            "rainfall":  daily.get("precipitation_sum",           [None])[i],
            "humidity":  daily.get("relative_humidity_2m_max",    [None])[i],
            "et0":       daily.get("et0_fao_evapotranspiration",  [None])[i],
            "wind":      daily.get("windspeed_10m_max",           [None])[i],
        })

    return rows


# ══════════════════════════════════════════════════════════════════════════════
# DB INSERT HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def upsert_weather(cursor, rows: list[dict]):
    """Insert weather rows, skip duplicates."""
    sql = """
        INSERT INTO FarmWeather
            (FarmId, Date, TempMax, TempMin, Rainfall, Humidity, ET0, WindSpeed)
        SELECT ?,?,?,?,?,?,?,?
        WHERE NOT EXISTS (
            SELECT 1 FROM FarmWeather WITH (NOLOCK)
            WHERE FarmId=? AND Date=?
        )
    """
    params = [
        (
            r["farm_id"], r["date"],
            r["temp_max"], r["temp_min"],
            r["rainfall"], r["humidity"],
            r["et0"], r["wind"],
            # duplicate check params
            r["farm_id"], r["date"],
        )
        for r in rows
    ]
    for start in range(0, len(params), DB_BATCH_SIZE):
        cursor.executemany(sql, params[start : start + DB_BATCH_SIZE])


def upsert_weather_risk(cursor, rows: list[dict]):
    """Insert weather risk rows, skip duplicates."""
    sql = """
        INSERT INTO FarmWeatherRisk
            (FarmId, Date, DroughtRisk, FloodRisk, FungalRisk, HeatStressRisk)
        SELECT ?,?,?,?,?,?
        WHERE NOT EXISTS (
            SELECT 1 FROM FarmWeatherRisk WITH (NOLOCK)
            WHERE FarmId=? AND Date=?
        )
    """
    params = [
        (
            r["farm_id"], r["date"],
            r["drought_risk"], r["flood_risk"],
            r["fungal_risk"], r["heat_risk"],
            r["farm_id"], r["date"],
        )
        for r in rows
    ]
    for start in range(0, len(params), DB_BATCH_SIZE):
        cursor.executemany(sql, params[start : start + DB_BATCH_SIZE])


def get_last_weather_date(cursor, farm_id: int):
    cursor.execute(
        "SELECT MAX(Date) FROM FarmWeather WHERE FarmId = ?", farm_id
    )
    row = cursor.fetchone()
    return row[0] if row else None


def count_weather_rows(cursor, farm_id: int) -> int:
    cursor.execute(
        "SELECT COUNT(*) FROM FarmWeather WHERE FarmId = ?", farm_id
    )
    return cursor.fetchone()[0]


# ══════════════════════════════════════════════════════════════════════════════
# PER-FARM PROCESSOR
# ══════════════════════════════════════════════════════════════════════════════

def process_farm_weather(farm: dict, cursor, conn) -> int:
    farm_id = farm["farm_id"]
    name    = farm["name"]
    lat     = farm["latitude"]
    lon     = farm["longitude"]

    print(f"\n{'=' * 60}")
    print(f"  {name}  (FarmId={farm_id})  [{lat:.4f}, {lon:.4f}]")
    print(f"{'=' * 60}")

    # ── Determine date range to fetch ────────────────────────────────────────
    last_date = get_last_weather_date(cursor, farm_id)

    if last_date:
        start_date = last_date + timedelta(days=1)
        print(f"  Last saved date: {last_date} — fetching from {start_date}")
    else:
        start_date = dt.now().date() - timedelta(days=LOOKBACK_DAYS)
        print(f"  No existing data — backfilling {LOOKBACK_DAYS} days from {start_date}")

    today    = dt.now().date()
    end_date = today - timedelta(days=1)  # yesterday (archive is 1 day behind)

    total_saved = 0

    # ── Historical data ───────────────────────────────────────────────────────
    if start_date <= end_date:
        print(f"  Fetching historical: {start_date} -> {end_date}")
        hist_data = fetch_historical_weather(lat, lon, start_date, end_date)

        if hist_data:
            weather_rows = parse_weather_response(farm_id, hist_data)
            risk_rows    = compute_weather_risks(weather_rows)

            before = count_weather_rows(cursor, farm_id)
            upsert_weather(cursor, weather_rows)
            upsert_weather_risk(cursor, risk_rows)
            conn.commit()
            after  = count_weather_rows(cursor, farm_id)
            saved  = after - before
            total_saved += saved
            print(f"  Historical saved: {saved} days")
        else:
            print("  Historical fetch failed — skipping")
    else:
        print("  Historical already up-to-date")

    # ── 7-day forecast ────────────────────────────────────────────────────────
    print(f"  Fetching {FORECAST_DAYS}-day forecast...")
    forecast_data = fetch_forecast_weather(lat, lon)

    if forecast_data:
        forecast_rows = parse_weather_response(farm_id, forecast_data)
        # Only future dates
        forecast_rows = [r for r in forecast_rows
                         if r["date"] > str(today)]
        risk_rows = compute_weather_risks(forecast_rows)

        if forecast_rows:
            upsert_weather(cursor, forecast_rows)
            upsert_weather_risk(cursor, risk_rows)
            conn.commit()
            print(f"  Forecast saved: {len(forecast_rows)} future days")
        else:
            print("  No future forecast days to save")
    else:
        print("  Forecast fetch failed")

    return total_saved


# ══════════════════════════════════════════════════════════════════════════════
# ENSURE TABLES EXIST
# ══════════════════════════════════════════════════════════════════════════════

def ensure_tables(cursor, conn):
    """Create FarmWeather and FarmWeatherRisk tables if they don't exist."""

    cursor.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = 'FarmWeather'
        )
        CREATE TABLE FarmWeather (
            Id        INT IDENTITY PRIMARY KEY,
            FarmId    INT NOT NULL,
            Date      DATE NOT NULL,
            TempMax   FLOAT,
            TempMin   FLOAT,
            Rainfall  FLOAT,
            Humidity  FLOAT,
            ET0       FLOAT,
            WindSpeed FLOAT,
            CONSTRAINT UQ_FarmWeather UNIQUE (FarmId, Date)
        )
    """)

    cursor.execute("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = 'FarmWeatherRisk'
        )
        CREATE TABLE FarmWeatherRisk (
            Id             INT IDENTITY PRIMARY KEY,
            FarmId         INT NOT NULL,
            Date           DATE NOT NULL,
            DroughtRisk    FLOAT,
            FloodRisk      FLOAT,
            FungalRisk     FLOAT,
            HeatStressRisk FLOAT,
            CONSTRAINT UQ_FarmWeatherRisk UNIQUE (FarmId, Date)
        )
    """)

    conn.commit()
    print("Tables verified ✓")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("  WEATHER SYNC STARTING")
    print("=" * 60)

    conn   = get_connection()
    cursor = conn.cursor()

    try:
        # Create tables if not exist
       # ensure_tables(cursor, conn)

        # Fetch all farms
        farms = fetch_farms(cursor)
        print(f"\n{len(farms)} farm(s) found\n")

        grand_total = 0
        for farm in farms:
            try:
                saved = process_farm_weather(farm, cursor, conn)
                grand_total += saved
            except Exception as e:
                print(f"  !! Farm {farm['farm_id']} failed: {e}")
                continue

    finally:
        conn.close()

    print(f"\n{'=' * 60}")
    print(f"  WEATHER SYNC COMPLETE — {grand_total} new rows inserted")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()