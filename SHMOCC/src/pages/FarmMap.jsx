import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import axios from "axios";

// ✅ REQUIRED IMPORTS
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

export default function FarmMap() {
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const userId = localStorage.getItem("userId");

  const [activeBase, setActiveBase] = useState("satellite");
  const [toast, setToast] = useState(null);
  const [searchVal, setSearchVal] = useState("");

  const baseLayers = useRef({});
  let labelsLayer = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ✅ SIMPLE AREA (no external lib)
  const calculateArea = (latlngs) => {
    let area = 0;
    for (let i = 0; i < latlngs.length; i++) {
      let j = (i + 1) % latlngs.length;
      area += latlngs[i].lng * latlngs[j].lat;
      area -= latlngs[j].lng * latlngs[i].lat;
    }
    return Math.abs(area / 2) * 111139 * 111139;
  };

  // 🔍 Search
const handleSearch = async () => {
  if (!searchVal.trim() || !mapRef.current) return;

  // ✅ NEW: detect lat,lng format
  const coordMatch = searchVal.match(
    /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/
  );

  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[3]);

    mapRef.current.setView([lat, lng], 16);

    L.marker([lat, lng])
      .addTo(mapRef.current)
      .bindPopup("📍 Coordinates location")
      .openPopup();

    return;
  }

  // 🔽 EXISTING LOGIC (UNCHANGED)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchVal)}&limit=1`
    );
    const data = await res.json();

    if (data.length) {
      mapRef.current.setView(
        [parseFloat(data[0].lat), parseFloat(data[0].lon)],
        16
      );
    } else {
      showToast("Location not found", "error");
    }
  } catch {
    showToast("Search failed", "error");
  }
};

  // 🔁 Switch base layer
  const switchBase = (key) => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(baseLayers.current).forEach((lyr) => {
      if (map.hasLayer(lyr)) map.removeLayer(lyr);
    });

    baseLayers.current[key].addTo(map);

    if (key === "satellite" && labelsLayer.current) {
      labelsLayer.current.addTo(map);
    }

    setActiveBase(key);
  };

  // 🗺 MAP INIT
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("farm-map", { zoomControl: false }).setView(
      [6.25, 80.50],
      14
    );
    mapRef.current = map;

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    // 🌍 Base layers
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 22 }
    );

    const labels = L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 22 }
    );

    const street = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 22 }
    );

    baseLayers.current = { satellite, street };
    labelsLayer.current = labels;

    satellite.addTo(map);
    labels.addTo(map);

    // 📍 USER LOCATION
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;

          map.setView([latitude, longitude], 16);

          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup("📍 You are here")
            .openPopup();
        },
        () => showToast("Location access denied", "error")
      );
    }

    // 🟢 Draw layer
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // ✅ DRAW CONTROL FIXED
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: true,
        rectangle: false,
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false,
      },
      edit: { featureGroup: drawnItems },
    });

    map.addControl(drawControl);

    // ✏ DRAW EVENT
    map.on(L.Draw.Event.CREATED, async (e) => {
      const layer = e.layer;

      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      map.fitBounds(layer.getBounds());

      const latlngs = layer.getLatLngs()[0];

      // ✅ 100 acre limit
      const area = calculateArea(latlngs);
      if (area > 404686) {
        showToast("❌ Farm cannot exceed 100 acres", "error");
        drawnItems.clearLayers();
        return;
      }

      // ✅ Ask name
      const farmName = prompt("Enter Farm Name:");
      if (!farmName || !farmName.trim()) {
        showToast("❌ Farm name required", "error");
        drawnItems.clearLayers();
        return;
      }

      const coords = latlngs.map((p) => [p.lng, p.lat]);

      const payload = {
        userId: parseInt(userId),
        name: farmName,
        polygon: JSON.stringify(coords),
        latitude: coords[0][1],
        longitude: coords[0][0],
      };

      try {
        await axios.post("https://localhost:44331/api/farm", payload);

        showToast("✓ Farm saved successfully", "success");

        setTimeout(() => {
          showToast("🛰 Monitoring will start soon", "waiting");
        }, 3500);
      } catch (err) {
        console.error(err);
        showToast("Failed to save farm", "error");
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Search location..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div id="farm-map" style={{ height: "85vh", width: "100%" }} />

      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <button onClick={() => switchBase("satellite")}>Satellite</button>
        <button onClick={() => switchBase("street")}>Street</button>
      </div>

      {toast && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#000",
            color: "#0f0",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}