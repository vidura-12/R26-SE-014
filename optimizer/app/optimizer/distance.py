from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from app.models import Location


def haversine_km(a: Location, b: Location) -> float:
    """Great-circle distance between two GPS points in kilometers."""
    earth_radius_km = 6371.0
    lat1, lon1 = radians(a.lat), radians(a.lng)
    lat2, lon2 = radians(b.lat), radians(b.lng)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * earth_radius_km * asin(sqrt(h))
