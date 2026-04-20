import { useEffect, useState } from 'react'
import { authApi } from '../../api'
import Spinner from '../../components/Spinner'
import { MagnifyingGlassIcon, XMarkIcon, ShieldCheckIcon, UserIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import Pagination from '../../components/Pagination'

const ROLE_CONFIG = {
  ADMIN:  { label: 'Admin',  bg: 'bg-cinnamon-100', text: 'text-cinnamon-700', Icon: ShieldCheckIcon },
  FARMER: { label: 'Farmer', bg: 'bg-amber-100',     text: 'text-amber-700',    Icon: UserIcon },
  PEELER: { label: 'Peeler', bg: 'bg-forest-100',    text: 'text-forest-700',   Icon: UserGroupIcon },
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, bg: 'bg-gray-100', text: 'text-gray-600', Icon: UserIcon }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <cfg.Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ ALL: 0, ADMIN: 0, FARMER: 0, PEELER: 0 })
  const PAGE_SIZE = 10

  const load = (p = 1, role = roleFilter, q = search) => {
    setLoading(true)
    setUsers([])
    const params = { page: p, limit: PAGE_SIZE }
    if (role !== 'ALL') params.role = role
    if (q) params.search = q
    Promise.all([authApi.listUsers(params), authApi.userCounts()])
      .then(([r, c]) => {
        setUsers(r.data.data ?? [])
        setTotal(r.data.total ?? 0)
        setCounts({ ALL: c.data.data.total, ...c.data.data })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [])

  const filtered = users
  const paginated = users

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1>System Users</h1>
        <p>All registered accounts — read only</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { role: 'ALL',    label: 'Total Users',  bg: 'bg-gray-100',        text: 'text-gray-700',     Icon: UserIcon },
          { role: 'ADMIN',  label: 'Admins',        bg: 'bg-cinnamon-100',    text: 'text-cinnamon-700', Icon: ShieldCheckIcon },
          { role: 'FARMER', label: 'Farmers',       bg: 'bg-amber-100',       text: 'text-amber-700',    Icon: UserIcon },
          { role: 'PEELER', label: 'Peelers',       bg: 'bg-forest-100',      text: 'text-forest-700',   Icon: UserGroupIcon },
        ].map(({ role, label, bg, text, Icon }) => (
          <div key={role} className="card p-4 text-center">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} ${text} mb-2`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{counts[role]}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            className="input-field pl-9 pr-9"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load(1, roleFilter, search) } }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); load(1, roleFilter, '') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'ADMIN', 'FARMER', 'PEELER'].map(r => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); load(1, r, search) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? 'bg-cinnamon-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()} ({counts[r]})
            </button>
          ))}

        </div>
      </div>

      {loading && <div className="flex justify-center pt-8"><Spinner size="lg" /></div>}

      {/* Table — desktop */}
      {!loading && <div className="card overflow-hidden hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">User</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Phone</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">No users found</td>
              </tr>
            ) : paginated.map(u => (
              <tr key={u._id} className="hover:bg-cinnamon-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full gradient-cinnamon flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{u.phone || <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-green-500' : 'bg-red-400'}`} />
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {/* Cards — mobile */}
      {!loading && <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-gray-400 text-sm">No users found</div>
        ) : paginated.map(u => (
          <div key={u._id} className="card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-cinnamon flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {u.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{u.name}</p>
              <p className="text-xs text-gray-400 truncate">{u.email}</p>
              {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <RoleBadge role={u.role} />
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-green-500' : 'bg-red-400'}`} />
                {u.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>}
      {!loading && <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => { setPage(p); load(p, roleFilter, search) }} />}
    </div>
  )
}
