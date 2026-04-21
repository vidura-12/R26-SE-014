import { useEffect, useState, useCallback } from 'react'
import { peelersApi } from '../../api'
import Spinner from '../../components/Spinner'
import { toast } from 'sonner'
import { PlusIcon, MapPinIcon, StarIcon, UserGroupIcon, TrashIcon, PencilIcon, MapIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { OverviewMap, PinMap } from '../../components/Map'
import LocationPicker from '../../components/LocationPicker'
import Pagination from '../../components/Pagination'

function Stars({ count, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <StarIcon key={i} className={`h-3.5 w-3.5 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

function DeleteConfirmModal({ groupName, onConfirm, onCancel }) {
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
              <h3 className="font-display font-bold text-gray-900 text-lg mb-1">Delete Peeler Group?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-700">{groupName}</span>? This will also delete the leader's login account.
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

function PeelerModal({ peeler, onClose, onSave }) {
  const [form, setForm] = useState(peeler ?? {
    groupName: '', leaderName: '', groupSize: 5,
    peelingCapacityTreesPerHour: 40, maxHoursPerDay: 8,
    skillLevel: 3, rating: 4,
    currentLocation: { lat: 6.9271, lng: 79.8612, address: '', district: '' }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: k === 'groupName' || k === 'leaderName' ? e.target.value : Number(e.target.value) || e.target.value })
  const handleLocationChange = useCallback((partial) => {
    setForm(prev => ({ ...prev, currentLocation: { ...prev.currentLocation, ...partial } }))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!peeler?._id && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      if (peeler?._id) {
        await peelersApi.update(peeler._id, form)
        toast.success('Peeler group updated')
      } else {
        await peelersApi.create({ ...form, email, password, phone })
        toast.success('Peeler group created')
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
      <div className="card w-full sm:max-w-lg p-5 sm:p-6 animate-slide-up rounded-2xl mt-2 sm:my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-bold text-gray-900">
            {peeler?._id ? 'Edit Peeler Group' : 'Add Peeler Group'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Group name</label>
              <input className="input-field" value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Leader name</label>
              <input className="input-field" value={form.leaderName} onChange={(e) => setForm({ ...form, leaderName: e.target.value })} required />
            </div>
          </div>

          {!peeler?._id && (
            <div className="rounded-xl border border-forest-100 bg-forest-50/50 p-4 space-y-3">
              <p className="text-xs font-semibold text-forest-700 uppercase tracking-wide">Leader Login Account</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} className="input-field pr-10" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} className={`input-field pr-10 ${confirmPassword && password !== confirmPassword ? 'border-red-400 focus:ring-red-300' : ''}`} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">The leader will use this account to log in and manage the group.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Group size</label>
              <input type="number" min={1} className="input-field" value={form.groupSize}
                onChange={(e) => setForm({ ...form, groupSize: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Capacity (trees/hr)</label>
              <input type="number" min={1} className="input-field" value={form.peelingCapacityTreesPerHour}
                onChange={(e) => setForm({ ...form, peelingCapacityTreesPerHour: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="label">Max hrs/day</label>
              <input type="number" min={1} max={16} className="input-field" value={form.maxHoursPerDay}
                onChange={(e) => setForm({ ...form, maxHoursPerDay: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="label">Skill level (1-5)</label>
              <input type="number" min={1} max={5} className="input-field" value={form.skillLevel}
                onChange={(e) => setForm({ ...form, skillLevel: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Rating (1-5)</label>
              <input type="number" min={1} max={5} className="input-field" value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} />
            </div>
          </div>
          <LocationPicker
            lat={form.currentLocation.lat}
            lng={form.currentLocation.lng}
            district={form.currentLocation.district}
            address={form.currentLocation.address}
            onChange={handleLocationChange}
            label="Current Location"
          />
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" /> : null}
              {peeler?._id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}

export default function Peelers() {
  const [peelers, setPeelers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 8

  const load = (p = page, q = search) => {
    setLoading(true)
    setPeelers([])
    const params = { page: p, limit: PAGE_SIZE }
    if (q) params.search = q
    peelersApi.list(params)
      .then(r => { setPeelers(r.data.data ?? []); setTotal(r.data.total ?? 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const remove = async (id) => {
    try {
      await peelersApi.remove(id)
      toast.success('Peeler group deleted')
      if (selected?._id === id) setSelected(null)
      load()
    } catch { toast.error('Could not delete') }
  }

  const filtered = peelers
  const paginated = filtered

  return (
    <div className="space-y-6 animate-slide-up">
      {deleteTarget && (
        <DeleteConfirmModal
          groupName={deleteTarget.name}
          onConfirm={() => { remove(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {modal !== null && (
        <PeelerModal
          peeler={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}

      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Peeler Groups</h1>
          <p>{total} Kalliya groups registered</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('new')}>
          <PlusIcon className="h-4 w-4" /> Add Group
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            className="input-field pl-9 pr-9"
            placeholder="Search by group name or district…"
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
        <div className="card p-12 text-center text-gray-400 text-sm">No peeler groups found</div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cards list */}
          <div className="lg:col-span-2 space-y-3">
            {paginated.map(p => (
              <div
                key={p._id}
                onClick={() => setSelected(selected?._id === p._id ? null : p)}
                className={`card p-5 cursor-pointer transition-all ${selected?._id === p._id ? 'ring-2 ring-forest-400' : 'card-hover'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                      <UserGroupIcon className="h-6 w-6 text-forest-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{p.groupName}</p>
                      <p className="text-xs text-gray-400">Leader: {p.leaderName}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-forest-50 text-gray-500 hover:text-forest-700"
                      onClick={e => { e.stopPropagation(); setModal(p) }}>
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                      onClick={e => { e.stopPropagation(); setDeleteTarget({ id: p._id, name: p.groupName }) }}>
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Size', value: `${p.groupSize}` },
                    { label: 'trees/hr', value: `${p.peelingCapacityTreesPerHour}` },
                    { label: 'hrs/day', value: `${p.maxHoursPerDay}` },
                    { label: 'avail days', value: `${p.availability?.filter(a => a.available).length ?? 0}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-forest-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-forest-800">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPinIcon className="h-3.5 w-3.5 text-forest-500" />
                    {p.currentLocation?.district ?? 'Unknown'}
                  </span>
                  <Stars count={p.rating ?? 0} />
                </div>
              </div>
            ))}
            {!loading && <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => { setPage(p); load(p) }} />}
          </div>

          {/* Map panel */}
          <div className="card p-4 h-fit sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                <MapIcon className="h-4 w-4 text-forest-600" />
                {selected ? selected.groupName : 'All Peeler Locations'}
              </h3>
              {selected && (
                <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-forest-600">
                  Show all
                </button>
              )}
            </div>
            {selected ? (
              <PinMap
                lat={selected.currentLocation?.lat}
                lng={selected.currentLocation?.lng}
                label={selected.groupName}
                height="320px"
                color="#33762d"
              />
            ) : (
              <OverviewMap peelers={filtered} height="320px" />
            )}
            {selected?.currentLocation?.district && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />{selected.currentLocation.district}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
