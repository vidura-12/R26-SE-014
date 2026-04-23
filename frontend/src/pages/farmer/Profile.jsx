import { useEffect, useState, useCallback } from 'react'
import { farmersApi, authApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import LocationPicker from '../../components/LocationPicker'
import Spinner from '../../components/Spinner'
import { toast } from 'sonner'
import { UserCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function FarmerProfile() {
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [accountForm, setAccountForm] = useState({ name: '', phone: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingAccount, setSavingAccount] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    farmersApi.myProfile()
      .then(r => {
        setProfile(r.data.data)
        setForm({
          fullName: r.data.data.fullName ?? '',
          nic: r.data.data.nic ?? '',
          notes: r.data.data.notes ?? '',
          primaryLocation: r.data.data.primaryLocation ?? { lat: null, lng: null, address: '', district: '' },
        })
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user) setAccountForm(prev => ({ ...prev, name: user.name ?? '', phone: user.phone ?? '' }))
  }, [user])

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))
  const setAcc = (k) => (e) => setAccountForm(prev => ({ ...prev, [k]: e.target.value }))
  const handleLocationChange = useCallback((partial) => {
    setForm(prev => ({ ...prev, primaryLocation: { ...prev.primaryLocation, ...partial } }))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await farmersApi.updateMyProfile(form)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update profile')
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
        <h1>My Profile</h1>
        <p>Update your personal details and location</p>
      </div>

      {/* Account info header */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full gradient-cinnamon flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'F'}
          </div>
          <div>
            <p className="font-display font-bold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {profile?.farmerCode && (
              <p className="text-xs text-cinnamon-600 font-semibold mt-0.5">#{profile.farmerCode}</p>
            )}
          </div>
        </div>
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
          <div className="rounded-xl bg-cinnamon-50 border border-cinnamon-100 px-4 py-3 flex items-center gap-2">
            <UserCircleIcon className="h-4 w-4 text-cinnamon-500 flex-shrink-0" />
            <p className="text-xs text-cinnamon-700">Leave password fields blank to keep your current password.</p>
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

      {/* Editable profile form */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-display font-bold text-gray-900 text-base mb-5">Farmer Details</h3>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input-field" value={form.fullName} onChange={set('fullName')} required />
            </div>
            <div>
              <label className="label">NIC number</label>
              <input className="input-field" value={form.nic} onChange={set('nic')} placeholder="Optional" />
            </div>
          </div>

          <LocationPicker
            lat={form.primaryLocation?.lat}
            lng={form.primaryLocation?.lng}
            district={form.primaryLocation?.district}
            address={form.primaryLocation?.address}
            onChange={handleLocationChange}
            label="My Location"
          />

          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input-field" value={form.notes} onChange={set('notes')} placeholder="Any additional info…" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={() => setForm({
              fullName: profile.fullName ?? '',
              nic: profile.nic ?? '',
              notes: profile.notes ?? '',
              primaryLocation: profile.primaryLocation ?? { lat: null, lng: null, address: '', district: '' },
            })}>Reset</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
