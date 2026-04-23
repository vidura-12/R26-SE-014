import { useEffect, useState, useCallback } from 'react'
import { harvestApi } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { toast } from 'sonner'
import { PlusIcon, MapPinIcon, TrashIcon, PencilIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { PinMap } from '../../components/Map'
import LocationPicker from '../../components/LocationPicker'

const CATEGORIES = ['ALBA', 'C5_SPECIAL', 'C5', 'H1', 'H2', 'OTHER']
const STATUSES = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

function HarvestModal({ harvest, onClose, onSave }) {
  const [form, setForm] = useState(harvest ?? {
    plantationName: '',
    location: { lat: null, lng: null, address: '', district: '' },
    treeCount: 100, harvestReadyDate: '', deadlineDate: '',
    urgencyLevel: 3, processingCategory: 'ALBA', estimatedYieldKg: '', notes: ''
  })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // Merge partial location updates from the picker
  const handleLocationChange = useCallback((partial) => {
    setForm(prev => ({
      ...prev,
      location: { ...prev.location, ...partial }
    }))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.location.lat || !form.location.lng) {
      toast.error('Please pin your plantation location on the map')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        treeCount: parseInt(form.treeCount),
        urgencyLevel: parseInt(form.urgencyLevel),
        estimatedYieldKg: form.estimatedYieldKg ? parseFloat(form.estimatedYieldKg) : undefined,
        location: {
          lat: parseFloat(form.location.lat),
          lng: parseFloat(form.location.lng),
          district: form.location.district ?? '',
          address: form.location.address ?? '',
        }
      }
      if (!payload.farmer) delete payload.farmer
      else if (typeof payload.farmer === 'object') payload.farmer = payload.farmer._id
      if (harvest?._id) {
        await harvestApi.update(harvest._id, payload)
        toast.success('Updated successfully')
      } else {
        await harvestApi.create(payload)
        toast.success('Harvest request submitted!')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error saving request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1001]" />
      <div className="relative z-[1002] flex items-start justify-center min-h-full px-3 pt-3 pb-10 sm:p-6" onClick={onClose}>
        <div className="card w-full max-w-full sm:max-w-2xl p-4 sm:p-6 animate-slide-up rounded-2xl mt-2 sm:my-4" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg sm:text-xl font-bold text-gray-900">
              {harvest?._id ? 'Edit Request' : 'Submit Harvest Request'}
            </h3>
            <button type="button" onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">

            {/* Plantation name */}
            <div>
              <label className="label">Plantation name</label>
              <input className="input-field" placeholder="e.g. Akuressa Cinnamon Plot A"
                value={form.plantationName} onChange={set('plantationName')} required />
            </div>

            {/* Details grid — 1 col on mobile, 2 col on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Tree count</label>
                <input type="number" min={1} className="input-field" value={form.treeCount}
                  onChange={(e) => setForm({ ...form, treeCount: e.target.value })} required />
              </div>
              <div>
                <label className="label">Processing category</label>
                <select className="input-field" value={form.processingCategory} onChange={set('processingCategory')}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ready date</label>
                <input type="date" className="input-field"
                  value={form.harvestReadyDate?.split?.('T')?.[0] ?? form.harvestReadyDate}
                  onChange={set('harvestReadyDate')} required />
              </div>
              <div>
                <label className="label">Deadline date</label>
                <input type="date" className="input-field"
                  value={form.deadlineDate?.split?.('T')?.[0] ?? form.deadlineDate}
                  onChange={set('deadlineDate')} required />
              </div>
              <div>
                <label className="label">Urgency level (1–5)</label>
                <input type="number" min={1} max={5} className="input-field" value={form.urgencyLevel}
                  onChange={(e) => setForm({ ...form, urgencyLevel: e.target.value })} />
              </div>
              <div>
                <label className="label">Est. yield (kg)</label>
                <input type="number" min={0} className="input-field" value={form.estimatedYieldKg}
                  onChange={set('estimatedYieldKg')} placeholder="Optional" />
              </div>
            </div>

            {/* Map location picker */}
            <LocationPicker
              lat={form.location.lat}
              lng={form.location.lng}
              district={form.location.district}
              address={form.location.address}
              onChange={handleLocationChange}
            />

            {/* Notes */}
            <div>
              <label className="label">Notes</label>
              <textarea rows={2} className="input-field" value={form.notes} onChange={set('notes')}
                placeholder="Any special instructions…" />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
              <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <Spinner size="sm" /> : null}
                {harvest?._id ? 'Update Request' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


export default function FarmerHarvestRequests() {
  const [harvests, setHarvests] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = () => {
    setLoading(true)
    harvestApi.list().then(r => setHarvests(r.data.data ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const remove = async (id) => {
    if (!confirm('Cancel this harvest request?')) return
    try { await harvestApi.remove(id); toast.success('Request removed'); load() }
    catch { toast.error('Could not remove') }
  }

  const updateStatus = async (id, status) => {
    try { await harvestApi.updateStatus(id, status); toast.success('Status updated'); load() }
    catch { toast.error('Could not update status') }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {modal !== null && (
        <HarvestModal
          harvest={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}

      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>My Harvest Requests</h1>
          <p>{harvests.length} total requests submitted</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('new')}>
          <PlusIcon className="h-4 w-4" /> New Request
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {harvests.length === 0 && (
            <div className="col-span-full card p-12 text-center">
              <CalendarDaysIcon className="h-12 w-12 text-cinnamon-200 mx-auto mb-3" />
              <p className="text-gray-500">No harvest requests yet. Submit your first one!</p>
            </div>
          )}
          {harvests.map(h => (
            <div key={h._id} className="card overflow-hidden">
              {/* Map preview */}
              {h.location?.lat && h.location?.lng && (
                <div className="h-36 w-full">
                  <PinMap lat={h.location.lat} lng={h.location.lng} label={h.plantationName} height="144px" />
                </div>
              )}

              {/* Coloured status bar */}
              <div className={`h-1 w-full ${h.status === 'COMPLETED' ? 'bg-forest-500' : h.status === 'SCHEDULED' ? 'bg-forest-400' : h.status === 'IN_PROGRESS' ? 'bg-amber-500' : h.status === 'CANCELLED' ? 'bg-red-400' : 'bg-cinnamon-400'}`} />

              <div className="p-5 space-y-4">
                {/* Title row */}
                <div>
                  <p className="font-display font-bold text-gray-900 text-base truncate">{h.plantationName}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                    {h.location?.district ?? 'Unknown location'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={h.status}
                      onChange={e => updateStatus(h._id, e.target.value)}
                      className="text-xs rounded-lg border border-cinnamon-200 bg-white px-2 py-1 text-gray-700 font-medium"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <StatusBadge status={h.processingCategory} />
                  </div>
                </div>

                {/* Stat blocks */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Trees', value: h.treeCount.toLocaleString() },
                    { label: 'Ready', value: format(new Date(h.harvestReadyDate), 'MMM d, yyyy') },
                    { label: 'Deadline', value: format(new Date(h.deadlineDate), 'MMM d, yyyy') },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-cinnamon-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-bold text-gray-800 leading-tight">{value}</p>
                    </div>
                  ))}
                </div>

                {h.notes && (
                  <p className="text-xs text-gray-400 italic border-l-2 border-cinnamon-200 pl-2">"{h.notes}"</p>
                )}

                {/* Actions */}
                {h.status === 'PENDING' && (
                  <div className="flex gap-2 pt-1">
                    <button className="btn-secondary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"
                      onClick={() => setModal(h)}>
                      <PencilIcon className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button className="text-xs py-1.5 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1"
                      onClick={() => remove(h._id)}>
                      <TrashIcon className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
