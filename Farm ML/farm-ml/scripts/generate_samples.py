import ee
import pyodbc
import json
import os
import time
from pathlib import Path
from datetime import datetime as dt, timedelta
from shapely.geometry import Polygon as ShapelyPolygon, box, MultiPolygon
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
# ══════════════════════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════════════════════

CELL_DEG           = 0.00009
GEE_SCALE          = 10
LOOKBACK_DAYS      = 60
DATE_INTERVAL_DAYS = 5
CLOUD_THRESHOLD    = 60

GEE_CELL_CHUNK     = 2_000
DB_BATCH_SIZE      = 500
GEE_RETRY_ATTEMPTS = 3
GEE_RETRY_BASE_S   = 10

DB_CONN_STR = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=VIDURA\\SQLEXPRESS;"
    "DATABASE=SDMS;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
    "TrustServerCertificate=yes;"
    "Connection Timeout=180;"
)
# ══════════════════════════════════════════════════════════════════════════════
# RISK SCORE  0–100
# ══════════════════════════════════════════════════════════════════════════════

def compute_risk(ndvi: float, ndmi: float) -> float:
    ndvi_risk = max(0.0, min(100.0, (0.8 - ndvi) / 0.8 * 100.0))
    ndmi_risk = max(0.0, min(100.0, (0.4 - ndmi) / 0.4 * 100.0))
    return round(0.6 * ndvi_risk + 0.4 * ndmi_risk, 2)


# ══════════════════════════════════════════════════════════════════════════════
# GRID BUILDER
# ══════════════════════════════════════════════════════════════════════════════

def mask_cloud_shadows(image):
    """Mask cloud shadows only using SCL band — safer than full QA60 masking for small cells."""
    scl = image.select('SCL')
    # SCL class 3 = cloud shadow, class 9 = cloud high prob, class 8 = cloud med prob
    # Only remove shadows — clouds are already filtered at collection level
    shadow_mask = scl.neq(3)
    return image.updateMask(shadow_mask)


def _largest_polygon(geom):
    if isinstance(geom, MultiPolygon):
        return max(geom.geoms, key=lambda g: g.area)
    return geom


def build_grid_cells(polygon_coords: list[list[float]]) -> list[dict]:
    farm_shape = ShapelyPolygon(polygon_coords)
    if not farm_shape.is_valid:
        farm_shape = farm_shape.buffer(0)

    lons = [c[0] for c in polygon_coords]
    lats = [c[1] for c in polygon_coords]
    min_lon, max_lon = min(lons), max(lons)
    min_lat, max_lat = min(lats), max(lats)

    cells = []
    row = 0
    lat = min_lat

    while lat < max_lat:
        col = 0
        lon = min_lon
        while lon < max_lon:
            cell_box = box(lon, lat, lon + CELL_DEG, lat + CELL_DEG)

            if farm_shape.intersects(cell_box):
                clipped = _largest_polygon(farm_shape.intersection(cell_box))

                if not clipped.is_empty:
                    c_lon = round(lon + CELL_DEG / 2, 9)
                    c_lat = round(lat + CELL_DEG / 2, 9)
                    ee_coords = [list(c) for c in clipped.exterior.coords]

                    cells.append({
                        "cell_id":     f"r{row}_c{col}",
                        "center_lat":  c_lat,
                        "center_lon":  c_lon,
                        "ee_geometry": ee.Geometry.Polygon(ee_coords),
                    })

            col += 1
            lon = round(lon + CELL_DEG, 9)

        row += 1
        lat = round(lat + CELL_DEG, 9)

    return cells


# ══════════════════════════════════════════════════════════════════════════════
# GEE STATS  — chunked + retry
# ══════════════════════════════════════════════════════════════════════════════

def _reduce_chunk(chunk: list[dict], date_str: str, next_date_str: str) -> list:
    features = [
        ee.Feature(
            cell["ee_geometry"],
            {
                "cell_id": cell["cell_id"],
                "lat":     cell["center_lat"],
                "lon":     cell["center_lon"],
            },
        )
        for cell in chunk
    ]
    fc = ee.FeatureCollection(features)

    raw_count = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(fc)
        .filterDate(date_str, next_date_str)
        .size().getInfo()
    )
    print(f"        Raw images (no cloud filter): {raw_count}")

    s2 = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(fc)
        .filterDate(date_str, next_date_str)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", CLOUD_THRESHOLD))
        .map(mask_cloud_shadows)   # shadows only — won't blank small cells
    )

    after_count = s2.size().getInfo()
    print(f"        After cloud filter ({CLOUD_THRESHOLD}%): {after_count}")

    if after_count == 0:
        return []

    # Median of top 3 clearest images — more robust than .first()
    img = s2.sort("CLOUDY_PIXEL_PERCENTAGE").limit(3).median()

    ndvi = img.normalizedDifference(["B8", "B4"]).rename("NDVI")
    ndmi = img.normalizedDifference(["B8", "B11"]).rename("NDMI")

    # ── Sanity check — catch bad/empty images before processing all cells ──
    sample_cell = chunk[0]
    test_geom = ee.Geometry.Point([
        sample_cell["center_lon"],
        sample_cell["center_lat"],
    ]).buffer(100)

    ndvi_check = ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=test_geom,
        scale=GEE_SCALE,
    ).getInfo()

    ndvi_sample = ndvi_check.get("NDVI")
    print(f"        NDVI sanity check: {ndvi_sample}")

    if ndvi_sample is None:
        print("        No valid pixels at sample point — skipping window")
        return []

    if float(ndvi_sample) < 0.05:
        print(f"        NDVI {ndvi_sample:.3f} too low — likely cloud shadow artifact, skipping")
        return []

    # ── Reduce NDVI and NDMI independently for predictable key names ────────
    ndvi_stats = ndvi.reduceRegions(
        collection=fc,
        reducer=(
            ee.Reducer.mean()
            .combine(ee.Reducer.min(),   sharedInputs=True)
            .combine(ee.Reducer.max(),   sharedInputs=True)
            .combine(ee.Reducer.count(), sharedInputs=True)
        ),
        scale=GEE_SCALE,
    )

    ndmi_stats = ndmi.reduceRegions(
        collection=fc,
        reducer=(
            ee.Reducer.mean()
            .combine(ee.Reducer.min(), sharedInputs=True)
            .combine(ee.Reducer.max(), sharedInputs=True)
        ),
        scale=GEE_SCALE,
    )

    ndvi_info = ndvi_stats.getInfo()
    ndmi_info = ndmi_stats.getInfo()

    if not ndvi_info or not ndmi_info:
        print("        getInfo() returned None")
        return []

    ndvi_features = ndvi_info.get("features", [])
    ndmi_features = ndmi_info.get("features", [])

    # ── Merge NDVI + NDMI by cell_id ────────────────────────────────────────
    ndmi_lookup = {
        f["properties"]["cell_id"]: f["properties"]
        for f in ndmi_features
        if "cell_id" in f["properties"]
    }

    merged = []
    for f in ndvi_features:
        props      = f["properties"]
        cell_id    = props.get("cell_id")
        ndmi_props = ndmi_lookup.get(cell_id, {})

        merged.append({
            "properties": {
                "cell_id":       cell_id,
                "lat":           props.get("lat"),
                "lon":           props.get("lon"),
                # single-band reducer outputs plain "mean"/"min"/"max"/"count"
                "NDVI_mean":     props.get("mean"),
                "NDVI_min":      props.get("min"),
                "NDVI_max":      props.get("max"),
                "pxcount_count": props.get("count"),
                "NDMI_mean":     ndmi_props.get("mean"),
                "NDMI_min":      ndmi_props.get("min"),
                "NDMI_max":      ndmi_props.get("max"),
            }
        })

    return merged


def _reduce_chunk_with_retry(
    chunk: list[dict], date_str: str, next_date_str: str
) -> list:
    for attempt in range(GEE_RETRY_ATTEMPTS):
        try:
            return _reduce_chunk(chunk, date_str, next_date_str)
        except Exception as e:
            if attempt == GEE_RETRY_ATTEMPTS - 1:
                print(f"        GEE chunk failed after {GEE_RETRY_ATTEMPTS} attempts: {e}")
                return []
            wait = GEE_RETRY_BASE_S * (2 ** attempt)
            print(f"        GEE error (attempt {attempt + 1}): {e} — retrying in {wait}s …")
            time.sleep(wait)


def get_all_cells_stats(cells: list[dict], date_str: str, next_date_str: str) -> list:
    all_features = []
    total_chunks = (len(cells) + GEE_CELL_CHUNK - 1) // GEE_CELL_CHUNK

    for i in range(0, len(cells), GEE_CELL_CHUNK):
        chunk     = cells[i : i + GEE_CELL_CHUNK]
        chunk_num = i // GEE_CELL_CHUNK + 1
        print(f"      GEE chunk {chunk_num}/{total_chunks} ({len(chunk)} cells) …")
        features = _reduce_chunk_with_retry(chunk, date_str, next_date_str)
        all_features.extend(features)
        print(f"        → {len(features)} results")

    return all_features


# ══════════════════════════════════════════════════════════════════════════════
# DB HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def get_connection() -> pyodbc.Connection:
    """Connect with retry logic to handle cold-start / transient failures."""
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


def ensure_risk_float(cursor, conn):
    cursor.execute("""
        SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'FarmPixelData' AND COLUMN_NAME = 'Risk'
    """)
    row = cursor.fetchone()
    if row and row[0].lower() in ("int", "smallint", "tinyint", "bigint"):
        print("  ⚠  Risk column is INTEGER — altering to FLOAT …")
        cursor.execute("ALTER TABLE FarmPixelData ALTER COLUMN Risk FLOAT")
        conn.commit()
        print("  Risk column → FLOAT ✓")


def batch_insert(cursor, rows: list[tuple]):
    sql = """
        INSERT INTO FarmPixelData
            (FarmId, CellId, Date,
             Latitude, Longitude,
             NDVI, NDMI,
             NDVI_Min, NDVI_Max,
             NDMI_Min, NDMI_Max,
             PixelCount, Risk)
        SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?
        WHERE NOT EXISTS (
            SELECT 1 FROM FarmPixelData WITH (NOLOCK)
            WHERE FarmId=? AND CellId=? AND Date=?
        )
    """
    for start in range(0, len(rows), DB_BATCH_SIZE):
        batch  = rows[start : start + DB_BATCH_SIZE]
        params = [r + (r[0], r[1], r[2]) for r in batch]
        cursor.executemany(sql, params)


def count_rows(cursor, farm_id, date_str: str) -> int:
    cursor.execute(
        "SELECT COUNT(*) FROM FarmPixelData WHERE FarmId=? AND Date=?",
        farm_id, date_str,
    )
    return cursor.fetchone()[0]


def fetch_all_farms() -> list:
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        ensure_risk_float(cursor, conn)
        cursor.execute("SELECT FarmId, Name, Polygon FROM Farms")
        return cursor.fetchall()
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# PER-FARM PROCESSOR
# ══════════════════════════════════════════════════════════════════════════════

def process_farm(farm) -> int:
    farm_id, farm_name, poly_json = farm

    print("=" * 70)
    print(f"  {farm_name}  (FarmId={farm_id})")
    print("=" * 70)

    conn   = get_connection()
    cursor = conn.cursor()
    cursor.fast_executemany = True

    try:
        # ── Date range ───────────────────────────────────────────────────────
        cursor.execute(
            "SELECT MAX(Date) FROM FarmPixelData WHERE FarmId = ?", farm_id
        )
        last_date  = cursor.fetchone()[0]
        start_date = (
            last_date + timedelta(days=DATE_INTERVAL_DAYS)
            if last_date
            else dt.now().date() - timedelta(days=LOOKBACK_DAYS)
        )
        end_date = dt.now().date()

        if start_date >= end_date:
            print("  Already up-to-date\n")
            return 0

        # ── Parse polygon ────────────────────────────────────────────────────
        try:
            poly_data  = json.loads(poly_json)
            raw_coords = (
                poly_data["coordinates"][0]
                if "coordinates" in poly_data
                else poly_data
            )
            coords = [[float(c[0]), float(c[1])] for c in raw_coords]
        except Exception as ex:
            print(f"  Polygon parse error: {ex} — skipping\n")
            return 0

        # ── Build grid ───────────────────────────────────────────────────────
        cells  = build_grid_cells(coords)
        cell_m = int(CELL_DEG * 111_320)
        print(f"  {len(cells)} grid cells  (≈ {cell_m} m × {cell_m} m each)\n")

        if not cells:
            print("  No cells — check polygon\n")
            return 0

        farm_total   = 0
        current_date = start_date

        while current_date < end_date:
            date_str      = current_date.strftime("%Y-%m-%d")
            next_date     = min(current_date + timedelta(days=DATE_INTERVAL_DAYS), end_date)
            next_date_str = next_date.strftime("%Y-%m-%d")

            print(f"  Window: {date_str} → {next_date_str}")

            results = get_all_cells_stats(cells, date_str, next_date_str)

            if not results:
                print("    No valid imagery — skipping window\n")
                current_date = next_date
                continue

            rows: list[tuple] = []
            skip_nodata = skip_pixels = 0

            for r in results:
                props = r["properties"]

                ndvi        = props.get("NDVI_mean")
                ndmi        = props.get("NDMI_mean")
                pixel_count = int(props.get("pxcount_count") or 0)

                if ndvi is None or ndmi is None:
                    skip_nodata += 1
                    continue
                if pixel_count < 1:
                    skip_pixels += 1
                    continue

                risk     = compute_risk(float(ndvi), float(ndmi))
                ndvi_min = props.get("NDVI_min")
                ndvi_max = props.get("NDVI_max")
                ndmi_min = props.get("NDMI_min")
                ndmi_max = props.get("NDMI_max")

                rows.append((
                    farm_id,
                    props["cell_id"],
                    date_str,
                    float(props["lat"]),
                    float(props["lon"]),
                    float(ndvi),
                    float(ndmi),
                    float(ndvi_min) if ndvi_min is not None else None,
                    float(ndvi_max) if ndvi_max is not None else None,
                    float(ndmi_min) if ndmi_min is not None else None,
                    float(ndmi_max) if ndmi_max is not None else None,
                    pixel_count,
                    float(risk),
                ))

            if rows:
                before = count_rows(cursor, farm_id, date_str)
                batch_insert(cursor, rows)
                conn.commit()
                after  = count_rows(cursor, farm_id, date_str)
                saved  = after - before
            else:
                saved = 0

            farm_total += saved

            print(
                f"    Saved={saved} | "
                f"NoData={skip_nodata} | "
                f"TooSmall={skip_pixels} | "
                f"Duplicates={len(rows) - saved}\n"
            )

            current_date = next_date

        print(f"  Farm done — {farm_total} new rows\n")
        return farm_total

    except Exception as e:
        print(f"  !! Farm {farm_id} failed unexpectedly: {e}\n")
        return 0

    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    from google.oauth2 import service_account

    key_path = Path(__file__).resolve().parent.parent / os.getenv("GEE_KEY_PATH")

    with open(key_path) as f:
     service_account_info = json.load(f)

    credentials = service_account.Credentials.from_service_account_info(
        service_account_info,
        scopes=["https://www.googleapis.com/auth/earthengine"],
    )
    ee.Initialize(credentials)
    print("Earth Engine initialised")

    farms = fetch_all_farms()
    print(f"{len(farms)} farm(s) found\n")

    grand_total = 0

    for farm in farms:
        grand_total += process_farm(farm)

    print("=" * 70)
    print(f"SYNC COMPLETE — {grand_total} total rows inserted")
    print("=" * 70)


if __name__ == "__main__":
    main()