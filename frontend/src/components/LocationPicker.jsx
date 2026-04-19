import { useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { CursorArrowRaysIcon, MapPinIcon } from '@heroicons/react/24/outline'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#b86620;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);font-size:14px;line-height:1;">📍</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
})

function ClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng) } })
  return null
}

function FlyToLocation({ lat, lng, trigger }) {
  const map = useMap()
  const prev = useRef(null)
  if (trigger && trigger !== prev.current) {
    prev.current = trigger
    map.flyTo([lat, lng], 14, { duration: 1.2 })
  }
  return null
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const addr = data.address ?? {}
    const district = addr.district ?? addr.county ?? addr.state_district ?? addr.city ?? addr.town ?? ''
    return { district, address: data.display_name ?? '' }
  } catch {
    return { district: '', address: '' }
  }
}

export default function LocationPicker({ lat, lng, district, address, onChange, label = 'Location' }) {
  const [geocoding, setGeocoding] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [flyTrigger, setFlyTrigger] = useState(null)
  const hasPin = lat && lng

  const handleGPS = useCallback(async () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        onChange({ lat: latitude, lng: longitude, district: '', address: '' })
        setFlyTrigger(Date.now())
        setGeocoding(true)
        const geo = await reverseGeocode(latitude, longitude)
        onChange({ lat: latitude, lng: longitude, district: geo.district, address: geo.address })
        setGeocoding(false)
        setGpsLoading(false)
      },
      () => {
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [onChange])

  const handlePick = useCallback(async (newLat, newLng) => {
    onChange({ lat: newLat, lng: newLng, district: '', address: '' })
    setGeocoding(true)
    const geo = await reverseGeocode(newLat, newLng)
    onChange({ lat: newLat, lng: newLng, district: geo.district, address: geo.address })
    setGeocoding(false)
  }, [onChange])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="label mb-0">{label}</label>
        <div className="flex items-center gap-2">
          {geocoding && (
            <span className="text-xs text-cinnamon-600 flex items-center gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-cinnamon-500 inline-block" />
              Getting address…
            </span>
          )}
          {hasPin && !geocoding && (
            <span className="text-xs text-forest-600 font-medium">
              {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
            </span>
          )}
          <button type="button" onClick={handleGPS} disabled={gpsLoading}
            className="flex items-center gap-1 text-xs font-semibold text-cinnamon-600 hover:text-cinnamon-800 transition-colors disabled:opacity-50">
            <MapPinIcon className={`h-3.5 w-3.5 ${gpsLoading ? 'animate-pulse' : ''}`} />
            {gpsLoading ? 'Locating…' : 'Detect location'}
          </button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-cinnamon-200 hover:border-cinnamon-400 transition-colors" style={{ height: '240px' }}>
        <MapContainer
          center={hasPin ? [lat, lng] : [6.9, 80.5]}
          zoom={hasPin ? 13 : 8}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {hasPin && <Marker position={[lat, lng]} icon={pinIcon} />}
          {hasPin && <FlyToLocation lat={lat} lng={lng} trigger={flyTrigger} />}
        </MapContainer>

        {!hasPin && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
            <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-3 shadow-lg flex items-center gap-2.5">
              <CursorArrowRaysIcon className="h-5 w-5 text-cinnamon-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-700">Click on the map to pin location</p>
            </div>
          </div>
        )}
      </div>

      {hasPin && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">District</label>
            <input className="input-field text-sm" placeholder={geocoding ? 'Detecting…' : 'District'}
              disabled={geocoding} value={district ?? ''}
              onChange={(e) => onChange({ lat, lng, district: e.target.value, address })} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input-field text-sm" placeholder={geocoding ? 'Detecting…' : 'Address'}
              disabled={geocoding} value={address ?? ''}
              onChange={(e) => onChange({ lat, lng, district, address: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  )
}
