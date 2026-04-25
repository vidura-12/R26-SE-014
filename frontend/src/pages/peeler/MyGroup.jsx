import { useEffect, useState, useCallback } from 'react'
import { peelersApi, authApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import LocationPicker from '../../components/LocationPicker'
import Spinner from '../../components/Spinner'
import { toast } from 'sonner'
import { UserGroupIcon, PlusIcon, EyeIcon, EyeSlashIcon, UserCircleIcon } from '@heroicons/react/24/outline'

const DEFAULT_FORM = {
  groupName: '', leaderName: '',
  groupSize: 5, peelingCapacityTreesPerHour: 40,
  maxHoursPerDay: 8, skillLevel: 3,
  currentLocation: { lat: null, lng: null, address: '', district: '' },
}

export default function MyGroup() {
  const { user, setUser } = useAuth()
  const [group, setGroup] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [accountForm, setAccountForm] = useState({ name: '', phone: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingAccount, setSavingAccount] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const load = () => {
    setLoading(true)
    peelersApi.myGroup()
      .then(r => {
        const g = r.data.data
        setGroup(g)
        if (g) setForm({
          groupName: g.groupName ?? '',
          leaderName: g.leaderName ?? '',
          groupSize: g.groupSize ?? 5,
          peelingCapacityTreesPerHour: g.peelingCapacityTreesPerHour ?? 40,
          maxHoursPerDay: g.maxHoursPerDay ?? 8,
          skillLevel: g.skillLevel ?? 3,
          currentLocation: g.currentLocation ?? { lat: null, lng: null, address: '', district: '' },
        })
        else setForm({ ...DEFAULT_FORM, leaderName: user?.name ?? '' })
      })
      .catch(() => toast.error('Could not load group'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (user) setAccountForm(prev => ({ ...prev, name: user.name ?? '', phone: user.phone ?? '' }))
  }, [user])

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: isNaN(e.target.value) || k === 'groupName' || k === 'leaderName' ? e.target.value : Number(e.target.value) }))
  const setAcc = (k) => (e) => setAccountForm(prev => ({ ...prev, [k]: e.target.value }))
  const handleLocationChange = useCallback((partial) => {
    setForm(prev => ({ ...prev, currentLocation: { ...prev.currentLocation, ...partial } }))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.currentLocation.lat) { toast.error('Please pin your location on the map'); return }
    setCreating(true)
    try {
      await peelersApi.create(form)
      toast.success('Group created!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to create group')
    } finally {
      setCreating(false) }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await peelersApi.updateMyGroup(form)
      toast.success('Group updated')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update group')
    } finally {
      setSaving(false)
    }
  }

  const submitAccount = async (e) => {
    e.preventDefault()
    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      toast.error('New passwords do not match'); return
    }
    setSavingAccount(true)
    try {
      const payload = { name: accountForm.name, phone: accountForm.phone }
      if (accountForm.newPassword) {
        payload.currentPassword = accountForm.currentPassword
        payload.newPassword = accountForm.newPassword
      }
      const res = await authApi.updateAccount(payload)
      if (setUser) setUser(prev => ({ ...prev, ...res.data.data }))
      setAccountForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      toast.success('Account updated')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update account')
    } finally {
      setSavingAccount(false)
    }
  }

  if (loading) return <div className="flex justify-center pt-24"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div className="page-header">
        <h1>My Peeler Group</h1>
        <p>{group ? 'Manage your group details and location' : 'Create your peeler group to get started'}</p>
      </div>

      {/* Status card */}
      <div className="card p-5 sm:p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
          <UserGroupIcon className="h-7 w-7 text-forest-700" />
        </div>
        <div>
          <p className="font-display font-bold text-gray-900 text-lg">{group ? group.groupName : 'No group yet'}</p>
          <p className="text-sm text-gray-500">{group ? `Leader: ${group.leaderName}` : 'Fill the form below to create your group'}</p>
          {group?.groupCode && <p className="text-xs text-forest-600 font-semibold mt-0.5">#{group.groupCode}</p>}
        </div>
      </div>

      {/* Form */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-display font-bold text-gray-900 text-base mb-5">
          {group ? 'Edit Group Details' : 'Create Group'}
        </h3>
        <form onSubmit={group ? handleUpdate : handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Group name</label>
              <input className="input-field" value={form.groupName} onChange={set('groupName')} required />
            </div>
            <div>
              <label className="label">Leader name</label>
              <input className="input-field" value={form.leaderName} onChange={set('leaderName')} required />
            </div>
            <div>
              <label className="label">Group size</label>
              <input type="number" min={1} className="input-field" value={form.groupSize} onChange={set('groupSize')} required />
            </div>
            <div>
              <label className="label">Capacity (trees/hr)</label>
              <input type="number" min={1} className="input-field" value={form.peelingCapacityTreesPerHour} onChange={set('peelingCapacityTreesPerHour')} required />
            </div>
            <div>
              <label className="label">Max hrs/day</label>
              <input type="number" min={1} max={16} className="input-field" value={form.maxHoursPerDay} onChange={set('maxHoursPerDay')} />
            </div>
            <div>
              <label className="label">Skill level (1–5)</label>
              <input type="number" min={1} max={5} className="input-field" value={form.skillLevel} onChange={set('skillLevel')} />
            </div>
          </div>

          <LocationPicker
            lat={form.currentLocation?.lat}
            lng={form.currentLocation?.lng}
            district={form.currentLocation?.district}
            address={form.currentLocation?.address}
            onChange={handleLocationChange}
            label="Group Current Location"
          />

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
            {group && (
              <button type="button" className="btn-secondary flex-1" onClick={() => setForm({
                groupName: group.groupName, leaderName: group.leaderName,
                groupSize: group.groupSize, peelingCapacityTreesPerHour: group.peelingCapacityTreesPerHour,
                maxHoursPerDay: group.maxHoursPerDay, skillLevel: group.skillLevel,
                currentLocation: group.currentLocation,
              })}>Reset</button>
            )}
            <button type="submit" disabled={saving || creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {(saving || creating) ? <Spinner size="sm" /> : <PlusIcon className="h-4 w-4" />}
              {group ? (saving ? 'Saving…' : 'Save changes') : (creating ? 'Creating…' : 'Create group')}
            </button>
          </div>
        </form>
      </div>

      {/* Account settings */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-display font-bold text-gray-900 text-base mb-5">Account Settings</h3>
        <form onSubmit={submitAccount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input-field" value={accountForm.name} onChange={setAcc('name')} required />
            </div>
            <div>
              <label className="label">Phone number</label>
              <input className="input-field" value={accountForm.phone} onChange={setAcc('phone')} placeholder="Optional" />
            </div>
          </div>
          <div className="rounded-xl bg-forest-50 border border-forest-100 px-4 py-3 flex items-center gap-2">
            <UserCircleIcon className="h-4 w-4 text-forest-600 flex-shrink-0" />
            <p className="text-xs text-forest-700">Leave password fields blank to keep your current password.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Current password</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} className="input-field pr-10" value={accountForm.currentPassword} onChange={setAcc('currentPassword')} placeholder="Required only when changing password" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">New password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} className="input-field pr-10" value={accountForm.newPassword} onChange={setAcc('newPassword')} placeholder="Min 6 characters" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input type="password" className="input-field" value={accountForm.confirmPassword} onChange={setAcc('confirmPassword')} placeholder="Repeat new password" />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={savingAccount} className="btn-primary flex items-center gap-2">
              {savingAccount ? <Spinner size="sm" /> : null}
              {savingAccount ? 'Saving…' : 'Save account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
