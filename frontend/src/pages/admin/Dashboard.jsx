import { useEffect, useState } from 'react'
import { farmersApi, peelersApi, harvestApi, optimizationApi } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { OverviewMap } from '../../components/Map'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({ farmers: [], peelers: [], harvests: [], schedules: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      farmersApi.list(),
      peelersApi.list(),
      harvestApi.list(),
      optimizationApi.schedules(),
    ]).then(([f, p, h, s]) => {
      setData({
        farmers: f.data.data ?? [],
        peelers: p.data.data ?? [],
        harvests: h.data.data ?? [],
        schedules: s.data.data ?? [],
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Spinner size="lg" />
    </div>
  )

  const pending   = data.harvests.filter(h => h.status === 'PENDING').length
  const completed = data.harvests.filter(h => h.status === 'COMPLETED').length
  const recentHarvests  = [...data.harvests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)
  const recentSchedules = [...data.schedules].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)

  const kpis = [
    { icon: '🌾', color: 'green',  value: data.farmers.length, label: 'Registered Farmers',  badge: 'Total',    trend: 'neu' },
    { icon: '👥', color: 'cinn',   value: data.peelers.length, label: 'Peeler Groups',        badge: 'Active',   trend: 'neu' },
    { icon: '⏳', color: 'warn',   value: pending,             label: 'Pending Requests',     badge: pending > 0 ? 'Action needed' : 'All clear', trend: pending > 0 ? 'down' : 'neu' },
    { icon: '✅', color: 'green',  value: completed,           label: 'Completed Harvests',   badge: 'Total',    trend: 'up' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Welcome Banner */}
      <div className="welcome-banner fade-in">
        <div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', color: 'white' }}>
            {user?.name ?? 'Admin'} 👋
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
            {pending > 0 ? `${pending} harvest requests awaiting optimization.` : 'Everything looks good today.'}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, padding: '10px 16px',
          fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)',
        }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#5bb87e', lineHeight: 1 }}>
              {data.harvests.length}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Total Harvests
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="kpi-grid">
        {kpis.map((k, i) => (
          <div className={`kpi-card fade-in d${i + 1}`} key={k.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
              <span className={`badge badge-${k.trend === 'up' ? 'green' : k.trend === 'down' ? 'danger' : 'soft'}`}>
                {k.badge}
              </span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, alignItems: 'stretch' }} className="dash-lower">

        {/* Recent Harvest Requests */}
        <div className="card fade-in d3" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">Recent Harvest Requests</div>
            <Link to="/admin/harvests" style={{
              fontSize: '0.77rem', color: 'var(--green)', fontWeight: 600,
              cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'none',
            }}>View all →</Link>
          </div>
          {recentHarvests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-soft)', fontSize: '0.85rem' }}>
              No harvest requests yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentHarvests.map(h => (
                <div key={h._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  border: '1px solid var(--border)', background: 'var(--off-white)',
                  transition: 'border-color .2s, background .2s', cursor: 'pointer',
                  flexWrap: 'wrap',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-pale)'; e.currentTarget.style.background = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--off-white)'; }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--cinnamon-bg)', border: '1px solid rgba(200,119,58,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', flexShrink: 0,
                  }}>🌿</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.86rem', color: 'var(--green-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.plantationName}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-soft)', marginTop: 2 }}>
                      {h.location?.district ?? '—'} · {h.treeCount?.toLocaleString()} trees
                      {h.harvestReadyDate ? ` · Ready ${format(new Date(h.harvestReadyDate), 'MMM d, yyyy')}` : ''}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={h.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Schedules + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'stretch' }}>
          <div className="card fade-in d4">
            <div className="card-header">
              <div className="card-title">Recent Schedules</div>
              <Link to="/admin/schedules" style={{ fontSize: '0.77rem', color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
            </div>
            {recentSchedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-soft)', fontSize: '0.82rem' }}>
                No schedules yet.
                <div style={{ marginTop: 10 }}>
                  <Link to="/admin/optimization" className="btn-primary" style={{ fontSize: '0.78rem', padding: '8px 18px' }}>
                    Run Optimizer
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentSchedules.map(s => (
                  <div key={s._id} style={{
                    padding: '12px 14px', borderRadius: 12,
                    border: '1px solid var(--border)', background: 'var(--off-white)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.84rem', color: 'var(--green-dark)' }}>
                        Week of {format(new Date(s.weekStartDate), 'MMM d')}
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)' }}>
                      {s.assignments?.length ?? 0} peeler routes assigned
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card fade-in d5">
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: 'var(--green-dark)', marginBottom: 12 }}>
              Quick Actions
            </div>
            {[
              { label: '🌾  Manage Farmers',      path: '/admin/farmers' },
              { label: '👥  Peeler Groups',        path: '/admin/peelers' },
              { label: '📅  Harvest Requests',     path: '/admin/harvests' },
              { label: '⚡  Run Optimization',     path: '/admin/optimization' },
              { label: '📋  View Schedules',       path: '/admin/schedules' },
            ].map(q => (
              <Link
                key={q.path}
                to={q.path}
                style={{
                  display: 'block', width: '100%', padding: '9px 14px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--off-white)',
                  fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-mid)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all .18s',
                  fontFamily: "'DM Sans', sans-serif", marginBottom: 6,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--mint)'; e.currentTarget.style.borderColor = 'var(--green-pale)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--off-white)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Map overview */}
      <div className="card fade-in d5">
        <div className="card-header">
          <div>
            <div className="card-title">Field Overview</div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-soft)', marginTop: 2, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cinnamon)', display: 'inline-block' }} /> Farmers
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} /> Peeler groups
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} /> Harvest requests
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.73rem', color: 'var(--text-soft)' }}>
            <span>{data.farmers.length} farmers</span>
            <span>{data.peelers.length} peelers</span>
            <span>{data.harvests.length} harvests</span>
          </div>
        </div>
        <OverviewMap
          farmers={data.farmers}
          peelers={data.peelers}
          harvests={data.harvests}
          height="420px"
        />
      </div>

      <style>{`
        @media(max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width: 560px)  { .kpi-grid { grid-template-columns: 1fr !important; } }
        @media(max-width: 1000px) { .dash-lower { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
