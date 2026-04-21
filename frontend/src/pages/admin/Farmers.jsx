import { useState, useCallback, useEffect } from 'react'
import { farmersApi } from '../../api'
import Spinner from '../../components/Spinner'
import { toast } from 'sonner'
import { PlusIcon, MapPinIcon, UserIcon, TrashIcon, PencilIcon, MapIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { OverviewMap, PinMap } from '../../components/Map'
import LocationPicker from '../../components/LocationPicker'
import Pagination from '../../components/Pagination'

function DeleteConfirmModal({ farmerName, onConfirm, onCancel }) {
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
              <h3 className="font-display font-bold text-gray-900 text-lg mb-1">Delete Farmer?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-700">{farmerName}</span>? This action cannot be undone.
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

function FarmerModal({ farmer, onClose, onSave }) {
  const [form, setForm] = useState(farmer ?? {
    fullName: '', nic: '', notes: '', email: '', password: '', phone: '',
    primaryLocation: { lat: 6.9271, lng: 79.8612, address: '', district: '' }
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const handleLocationChange = useCallback((partial) => {
    setForm(prev => ({ ...prev, primaryLocation: { ...prev.primaryLocation, ...partial } }))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!farmer?._id && form.password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      if (farmer?._id) {
        await farmersApi.update(farmer._id, form)
        toast.success('Farmer updated')
      } else {
        await farmersApi.create(form)
        toast.success('Farmer created')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error saving farmer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1001]" />
      <div className="relative z-[1002] flex items-start justify-center min-h-full px-3 pt-3 pb-10 sm:p-6" onClick={onClose}>
      <div className="card w-full sm:max-w-lg p-5 sm:p-6 animate-slide-up rounded-2xl mt-2 sm:my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-bold text-gray-900">
            {farmer?._id ? 'Edit Farmer' : 'Add Farmer'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input-field" value={form.fullName} onChange={set('fullName')} required />
          </div>
          <div>
            <label className="label">NIC number</label>
            <input className="input-field" value={form.nic} onChange={set('nic')} />
          </div>
          {!farmer?._id && (
            <div className="rounded-xl border border-cinnamon-100 bg-cinnamon-50/50 p-4 space-y-3">
              <p className="text-xs font-semibold text-cinnamon-700 uppercase tracking-wide">Login Account</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input-field" value={form.email} onChange={set('email')} required />
                </div>
                <div>
                  <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="tel" className="input-field" value={form.phone} onChange={set('phone')} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} className="input-field pr-10" value={form.password} onChange={set('password')} minLength={6} required />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className={`input-field pr-10 ${confirmPassword && form.password !== confirmPassword ? 'border-red-400 focus:ring-red-300' : ''}`}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && form.password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">Minimum 6 characters. The farmer will use this to log in.</p>
            </div>
          )}
          <LocationPicker
            lat={form.primaryLocation.lat}
            lng={form.primaryLocation.lng}
            district={form.primaryLocation.district}
            address={form.primaryLocation.address}
            onChange={handleLocationChange}
            label="Primary Location"
          />
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input-field" value={form.notes} onChange={set('notes')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" /> : null}
              {farmer?._id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}

export default function Farmers() {
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [mapView, setMapView] = useState('all') // 'all' | 'selected'
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 8

  const load = (p = page, q = search) => {
    setLoading(true)
    setFarmers([])
    const params = { page: p, limit: PAGE_SIZE }
    if (q) params.search = q
    farmersApi.list(params)
      .then(r => { setFarmers(r.data.data ?? []); setTotal(r.data.total ?? 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const remove = async (id) => {
    try {
      await farmersApi.remove(id)
      toast.success('Farmer removed')
      if (selected?._id === id) setSelected(null)
      load()
    } catch { toast.error('Could not remove') }
  }

  const filtered = farmers
  const paginated = filtered

  return (
    <div className="space-y-6 animate-slide-up">
      {deleteTarget && (
        <DeleteConfirmModal
          farmerName={deleteTarget.name}
          onConfirm={() => { remove(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {modal !== undefined && modal !== null && (
        <FarmerModal
          farmer={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}

      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Farmers</h1>
          <p>{total} registered farmers</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('new')}>
          <PlusIcon className="h-4 w-4" /> Add Farmer
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            className="input-field pl-9 pr-9"
            placeholder="Search by name or district…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load(1, search) } }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); load(1, '') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading && <div className="flex justify-center pt-8"><Spinner size="lg" /></div>}

      {!loading && filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">No farmers found</div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cards list */}
          <div className="lg:col-span-2 space-y-3">
            {paginated.map(f => (
              <div
                key={f._id}
                onClick={() => setSelected(selected?._id === f._id ? null : f)}
                className={`card p-5 cursor-pointer transition-all ${selected?._id === f._id ? 'ring-2 ring-cinnamon-400' : 'card-hover'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-cinnamon-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-6 w-6 text-cinnamon-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{f.fullName}</p>
                      <p className="text-xs text-gray-400">{f.farmerCode}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-cinnamon-50 text-gray-500 hover:text-cinnamon-700"
                      onClick={e => { e.stopPropagation(); setModal(f) }}>
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                      onClick={e => { e.stopPropagation(); setDeleteTarget({ id: f._id, name: f.fullName }) }}>
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {f.primaryLocation?.district && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPinIcon className="h-3.5 w-3.5 text-cinnamon-500" />{f.primaryLocation.district}
                    </span>
                  )}
                  {f.nic && <span className="text-xs text-gray-400">NIC: {f.nic}</span>}
                </div>
              </div>
            ))}
          {!loading && <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => { setPage(p); load(p) }} />}
          </div>

          {/* Map panel */}
          <div className="card p-4 h-fit sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                <MapIcon className="h-4 w-4 text-cinnamon-600" />
                {selected ? selected.fullName : 'All Farmer Locations'}
              </h3>
              {selected && (
                <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-cinnamon-600">
                  Show all
                </button>
              )}
            </div>
            {selected ? (
              <PinMap
                lat={selected.primaryLocation?.lat}
                lng={selected.primaryLocation?.lng}
                label={selected.fullName}
                height="320px"
              />
            ) : (
              <OverviewMap farmers={filtered} height="320px" />
            )}
            {selected?.primaryLocation?.address && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />{selected.primaryLocation.address}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
