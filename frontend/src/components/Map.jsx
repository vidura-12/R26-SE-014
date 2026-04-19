import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix default marker icon (Vite asset hashing breaks leaflet's auto-detection)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeIcon(color, label) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:32px;height:32px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="
          transform:rotate(45deg);color:white;font-size:10px;
          font-weight:700;font-family:Inter,sans-serif;line-height:1;
        ">${label ?? ''}</span>
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  })
}

export const farmerIcon   = (n) => makeIcon('#b86620', n ?? '🌿')
export const peelerIcon   = (n) => makeIcon('#33762d', n ?? '✂')
export const harvestIcon  = (n) => makeIcon('#7c3aed', n ?? '🌾')
export const stopIcon     = (n) => makeIcon('#b86620', n)

// Fit map to given bounds when markers change
function FlyTo({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 13, { duration: 0.8 })
  }, [lat, lng])
  return null
}

function BoundsAdjuster({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (!positions || positions.length === 0) return
    const valid = positions.filter(p => p && p[0] != null && p[1] != null)
    if (valid.length === 0) return
    if (valid.length === 1) { map.setView(valid[0], 12); return }
    try { map.fitBounds(L.latLngBounds(valid), { padding: [40, 40], maxZoom: 13 }) }
    catch { /* ignore invalid bounds */ }
  }, [positions.map(p => p?.join(',')).join('|')])
  return null
}

// ── Overview map: farms + peelers ──────────────────────────────────────────
export function OverviewMap({ farmers = [], peelers = [], harvests = [], height = '400px' }) {
  const allPositions = [
    ...farmers.map(f => f.primaryLocation ? [f.primaryLocation.lat, f.primaryLocation.lng] : null),
    ...peelers.map(p => p.currentLocation ? [p.currentLocation.lat, p.currentLocation.lng] : null),
    ...harvests.map(h => h.location ? [h.location.lat, h.location.lng] : null),
  ].filter(Boolean)

  return (
    <MapContainer
      center={[6.9, 80.5]}
      zoom={8}
      style={{ height, width: '100%', borderRadius: '1rem' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundsAdjuster positions={allPositions} />

      {farmers.map((f, i) => {
        const loc = f.primaryLocation
        if (!loc?.lat || !loc?.lng) return null
        return (
          <Marker key={f._id ?? i} position={[loc.lat, loc.lng]} icon={farmerIcon()}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-cinnamon-700">{f.fullName}</p>
                <p className="text-gray-500">{loc.district ?? 'Farmer'}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {peelers.map((p, i) => {
        const loc = p.currentLocation
        if (!loc?.lat || !loc?.lng) return null
        return (
          <Marker key={p._id ?? i} position={[loc.lat, loc.lng]} icon={peelerIcon()}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-forest-700">{p.groupName}</p>
                <p className="text-gray-500">{loc.district ?? 'Peeler'} · {p.groupSize} members</p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {harvests.map((h, i) => {
        const loc = h.location
        if (!loc?.lat || !loc?.lng) return null
        return (
          <Marker key={h._id ?? i} position={[loc.lat, loc.lng]} icon={harvestIcon()}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-purple-700">{h.plantationName}</p>
                <p className="text-gray-500">{h.treeCount} trees · {h.processingCategory}</p>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  h.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                  h.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-700'}`}>{h.status}</span>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

// ── Single pin map (farmer / harvest location picker) ─────────────────────
export function PinMap({ lat, lng, label, height = '220px', color }) {
  if (!lat || !lng) return (
    <div style={{ height }} className="rounded-xl bg-cinnamon-50 flex items-center justify-center text-gray-400 text-sm border border-cinnamon-100">
      No location set
    </div>
  )
  const icon = makeIcon(color ?? '#b86620', '')
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      style={{ height, width: '100%', borderRadius: '1rem' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo lat={lat} lng={lng} />
      <Marker position={[lat, lng]} icon={icon}>
        {label && <Popup><p className="text-sm font-semibold">{label}</p></Popup>}
      </Marker>
    </MapContainer>
  )
}

// ── Route map: ordered stops with polyline ────────────────────────────────
export function RouteMap({ stops = [], peelerLocation, height = '380px' }) {
  const positions = stops
    .map(s => {
      const loc = s.harvestRequest?.location ?? s.location
      return loc?.lat && loc?.lng ? [loc.lat, loc.lng] : null
    })
    .filter(Boolean)

  const allPositions = peelerLocation?.lat
    ? [[peelerLocation.lat, peelerLocation.lng], ...positions]
    : positions

  return (
    <MapContainer
      center={allPositions[0] ?? [6.9, 80.5]}
      zoom={10}
      style={{ height, width: '100%', borderRadius: '1rem' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundsAdjuster positions={allPositions} />

      {/* Peeler starting point */}
      {peelerLocation?.lat && (
        <Marker position={[peelerLocation.lat, peelerLocation.lng]} icon={peelerIcon()}>
          <Popup><p className="text-sm font-bold text-forest-700">Peeler start</p></Popup>
        </Marker>
      )}

      {/* Route line */}
      {allPositions.length > 1 && (
        <Polyline
          positions={allPositions}
          pathOptions={{ color: '#b86620', weight: 3, opacity: 0.8, dashArray: '6 4' }}
        />
      )}

      {/* Farm stops */}
      {stops.map((stop, i) => {
        const loc = stop.harvestRequest?.location ?? stop.location
        if (!loc?.lat || !loc?.lng) return null
        return (
          <Marker key={i} position={[loc.lat, loc.lng]} icon={stopIcon(i + 1)}>
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-bold text-cinnamon-700">Stop {i + 1}</p>
                <p className="font-semibold">{stop.harvestRequest?.plantationName ?? `Farm ${i + 1}`}</p>
                {loc.district && <p className="text-gray-500">{loc.district}</p>}
                {stop.estimatedHours && <p className="text-gray-500">{stop.estimatedHours.toFixed(1)}h work</p>}
                {stop.arrivalTime && <p className="text-gray-500">Arrival: {stop.arrivalTime}</p>}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
