import { useState, useEffect } from 'react'
import { authApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'
import { toast } from 'sonner'
import { UserCircleIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function AdminProfile() {
  const { user, setUser } = useAuth()
  const [accountForm, setAccountForm] = useState({ name: '', phone: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    if (user) setAccountForm(prev => ({ ...prev, name: user.name ?? '', phone: user.phone ?? '' }))
  }, [user])

  const set = (k) => (e) => setAccountForm(prev => ({ ...prev, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      toast.error('New passwords do not match'); return
    }
    setSaving(true)
    try {
      const payload = { name: accountForm.name, phone: accountForm.phone }
      if (accountForm.newPassword) {
        payload.currentPassword = accountForm.currentPassword
        payload.newPassword = accountForm.newPassword
      }
      const res = await authApi.updateAccount(payload)
      setUser(prev => ({ ...prev, ...res.data.data }))
      setAccountForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      toast.success('Account updated')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div className="page-header">
        <h1>My Account</h1>
        <p>Update your name, phone number, or password</p>
      </div>

      {/* Identity card */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full gradient-cinnamon flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="font-display font-bold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-cinnamon-600 bg-cinnamon-50 border border-cinnamon-100 rounded-full px-2 py-0.5">
              <ShieldCheckIcon className="h-3 w-3" />
              Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Account settings form */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-display font-bold text-gray-900 text-base mb-5">Account Settings</h3>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input-field" value={accountForm.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">Phone number</label>
              <input className="input-field" value={accountForm.phone} onChange={set('phone')} placeholder="Optional" />
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
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="input-field pr-10"
                  value={accountForm.currentPassword}
                  onChange={set('currentPassword')}
                  placeholder="Required only when changing password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">New password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="input-field pr-10"
                  value={accountForm.newPassword}
                  onChange={set('newPassword')}
                  placeholder="Min 6 characters"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input-field"
                value={accountForm.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
