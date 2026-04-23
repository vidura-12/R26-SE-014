import { useEffect, useState, useCallback } from 'react'
import { harvestApi, farmersApi } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { toast } from 'sonner'
import { PlusIcon, MapPinIcon, TrashIcon, PencilIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import LocationPicker from '../../components/LocationPicker'
import Pagination from '../../components/Pagination'

function DeleteConfirmModal({ plantationName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1001]" onClick={onCancel} />
      <div className="relative z-[1002] flex items-center justify-center min-h-full p-4">
        <div className="card w-full max-w-sm p-6 animate-slide-up rounded-2xl">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-900 text-lg mb-1">Delete Harvest Request?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-700">{plantationName}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full pt-1">
              <button className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
              <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2.5 transition-colors" onClick={onConfirm}>
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CATEGORIES = ['ALBA', 'C5_SPECIAL', 'C5', 'H1', 'H2', 'OTHER']
const STATUSES = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

function HarvestModal({ harvest, farmers = [], onClose, onSave }) {
  const [form, setForm] = useState(harvest ?? {
    plantationName: '',
    farmer: '',
    location: { lat: 6.9271, lng: 79.8612, address: '', district: '' },
    treeCount: 100, harvestReadyDate: '', deadlineDate: '',
    urgencyLevel: 3, processingCategory: 'ALBA', estimatedYieldKg: '', notes: ''
  })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const handleLocationChange = useCallback((partial) => {
    setForm(prev => ({ ...prev, location: { ...prev.location, ...partial } }))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        treeCount: parseInt(form.treeCount),
        urgencyLevel: parseInt(form.urgencyLevel),
        estimatedYieldKg: form.estimatedYieldKg ? parseFloat(form.estimatedYieldKg) : undefined,
        location: { ...form.location, lat: parseFloat(form.location.lat), lng: parseFloat(form.location.lng) }
      }
      if (harvest?._id) {
        await harvestApi.update(harvest._id, payload)
        toast.success('Harvest request updated')
      } else {
        await harvestApi.create(payload)
        toast.success('Harvest request created')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error saving')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1001]" />
      <div className="relative z-[1002] flex items-start justify-center min-h-full px-3 pt-3 pb-10 sm:p-6" onClick={onClose}>
      <div className="card w-full max-w-full sm:max-w-2xl p-4 sm:p-6 animate-slide-up rounded-2xl mt-2 sm:my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg sm:text-xl font-bold text-gray-900">
            {harvest?._id ? 'Edit Harvest Request' : 'New Harvest Request'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Plantation name</label>
              <input className="input-field" value={form.plantationName} onChange={set('plantationName')} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Farmer</label>
              <select className="input-field" value={form.farmer?._id ?? form.farmer ?? ''} onChange={e => setForm({ ...form, farmer: e.target.value })} required>
                <option value="">Select a farmer…</option>
                {farmers.map(f => (
                  <option key={f._id} value={f._id}>{f.fullName}{f.primaryLocation?.district ? ` — ${f.primaryLocation.district}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tree count</label>
              <input type="number" min={1} className="input-field" value={form.treeCount}
                onChange={(e) => setForm({ ...form, treeCount: e.target.value })} required />
            </div>
            <div>
              <label className="label">Processing category</label>
              <select className="input-field" value={form.processingCategory} onChange={set('processingCategory')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ready date</label>
              <input type="date" className="input-field" value={form.harvestReadyDate?.split('T')[0]}
                onChange={set('harvestReadyDate')} required />
            </div>
            <div>
              <label className="label">Deadline date</label>
              <input type="date" className="input-field" value={form.deadlineDate?.split('T')[0]}
                onChange={set('deadlineDate')} required />
            </div>
            <div>
              <label className="label">Urgency (1–5)</label>
              <input type="number" min={1} max={5} className="input-field" value={form.urgencyLevel}
                onChange={(e) => setForm({ ...form, urgencyLevel: e.target.value })} />
            </div>
            <div>
              <label className="label">Est. yield (kg)</label>
              <input type="number" min={0} className="input-field" value={form.estimatedYieldKg}
                onChange={set('estimatedYieldKg')} />
            </div>
            <div className="sm:col-span-2">
              <LocationPicker
                lat={form.location.lat}
                lng={form.location.lng}
                district={form.location.district}
                address={form.location.address}
                onChange={handleLocationChange}
                label="Plantation Location"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea rows={2} className="input-field" value={form.notes} onChange={set('notes')} />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" /> : null}
              {harvest?._id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}

export default function Harvests() {
  const [harvests, setHarvests] = useState([])
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 10

  const load = (p = page, status = statusFilter, q = search) => {
    setLoading(true)
    setHarvests([])
    const params = { page: p, limit: PAGE_SIZE }
    if (status !== 'ALL') params.status = status
    if (q.trim()) params.search = q.trim()
    Promise.all([harvestApi.list(params), farmersApi.list()])
      .then(([h, f]) => {
        setHarvests(h.data.data ?? [])
        setTotal(h.data.total ?? 0)
        setFarmers(f.data.data ?? [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const remove = async (id) => {
    try { await harvestApi.remove(id); toast.success('Deleted'); load() }
    catch { toast.error('Could not delete') }
  }

  const updateStatus = async (id, status) => {
    try { await harvestApi.updateStatus(id, status); load() }
    catch { toast.error('Could not update status') }
  }

  const paginated = harvests

  return (
    <div className="space-y-6 animate-slide-up">
      {deleteTarget && (
        <DeleteConfirmModal
          plantationName={deleteTarget.plantationName}
          onConfirm={() => { remove(deleteTarget._id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {modal !== null && (
        <HarvestModal
          harvest={modal === 'new' ? null : modal}
          farmers={farmers}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}

      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Harvest Requests</h1>
          <p>{total} total requests</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('new')}>
          <PlusIcon className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by plantation name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load(1, statusFilter, search) } }}
            className="input-field pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); load(1, statusFilter, '') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {['ALL', ...STATUSES].map(s => (
            <button key={s}
              onClick={() => { setStatusFilter(s); setPage(1); load(1, s, search) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-cinnamon-600 text-white' : 'bg-cinnamon-50 text-cinnamon-700 hover:bg-cinnamon-100'}`}>
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
      ) : paginated.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">No harvest requests</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {paginated.map(h => (
              <div key={h._id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 text-sm truncate">{h.plantationName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPinIcon className="h-3 w-3 flex-shrink-0" />{h.location?.district ?? '—'}
                    </p>
                    {(() => {
                      const farmer = farmers.find(f => f._id === (h.farmer?._id ?? h.farmer))
                      return farmer
                        ? <p className="text-xs text-cinnamon-700 font-medium mt-0.5">{farmer.fullName}</p>
                        : null
                    })()}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                    <StatusBadge status={h.processingCategory} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-cinnamon-50 rounded-lg p-2">
                    <p className="text-gray-400">Trees</p>
                    <p className="font-semibold text-gray-700">{h.treeCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-cinnamon-50 rounded-lg p-2">
                    <p className="text-gray-400">Ready</p>
                    <p className="font-semibold text-gray-700">{format(new Date(h.harvestReadyDate), 'MMM d, yy')}</p>
                  </div>
                  <div className="bg-cinnamon-50 rounded-lg p-2">
                    <p className="text-gray-400">Deadline</p>
                    <p className="font-semibold text-gray-700">{format(new Date(h.deadlineDate), 'MMM d, yy')}</p>
                  </div>
                  <div className="bg-cinnamon-50 rounded-lg p-2">
                    <p className="text-gray-400">Status</p>
                    <select
                      value={h.status}
                      onChange={e => updateStatus(h._id, e.target.value)}
                      className="text-xs bg-transparent font-semibold text-gray-700 w-full mt-0.5"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cinnamon-50 text-cinnamon-700 text-xs font-medium hover:bg-cinnamon-100"
                    onClick={() => setModal(h)}>
                    <PencilIcon className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100"
                    onClick={() => setDeleteTarget(h)}>
                    <TrashIcon className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-cinnamon-50 border-b border-cinnamon-100">
                    {['Plantation', 'Farmer', 'Trees', 'Category', 'Ready Date', 'Deadline', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 first:pl-6 last:pr-6 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinnamon-50">
                  {paginated.map(h => (
                    <tr key={h._id} className="hover:bg-cinnamon-50/50 transition-colors group">
                      <td className="px-4 py-3 pl-6">
                        <p className="font-semibold text-gray-800 text-sm whitespace-nowrap">{h.plantationName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPinIcon className="h-3 w-3" />{h.location?.district ?? '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          const farmer = farmers.find(f => f._id === (h.farmer?._id ?? h.farmer))
                          return farmer
                            ? <div>
                                <p className="text-sm font-medium text-gray-700">{farmer.fullName}</p>
                                {farmer.farmerCode && <p className="text-xs text-gray-400">{farmer.farmerCode}</p>}
                              </div>
                            : <span className="text-xs text-gray-400">—</span>
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-700">{h.treeCount.toLocaleString()}</p>
                        {h.estimatedYieldKg && <p className="text-xs text-gray-400">{h.estimatedYieldKg} kg</p>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={h.processingCategory} /></td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{format(new Date(h.harvestReadyDate), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{format(new Date(h.deadlineDate), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3">
                        <select
                          value={h.status}
                          onChange={e => updateStatus(h._id, e.target.value)}
                          className="text-xs rounded-lg border border-cinnamon-200 bg-white px-2 py-1 text-gray-700"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 pr-6">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded-lg hover:bg-cinnamon-50 text-gray-500 hover:text-cinnamon-700" onClick={() => setModal(h)}>
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600" onClick={() => setDeleteTarget(h)}>
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {!loading && <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => { setPage(p); load(p) }} />}
        </>
      )}
    </div>
  )
}
