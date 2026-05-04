import { useEffect, useState } from 'react'
import { harvestApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import {
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  SparklesIcon,
  StarIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline'

export default function FarmerHome() {
  const { user } = useAuth()
  const [harvests, setHarvests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    harvestApi.list().then(r => setHarvests(r.data.data ?? [])).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Spinner size="lg" />
    </div>
  )

  const pending   = harvests.filter(h => h.status === 'PENDING').length
  const scheduled = harvests.filter(h => h.status === 'SCHEDULED').length
  const completed = harvests.filter(h => h.status === 'COMPLETED').length
  const recent    = [...harvests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4)

  const kpis = [
    { Icon: ClockIcon,        color: 'warn',   value: pending,   label: 'Pending',   badge: 'Awaiting', trend: pending > 0 ? 'down' : 'neu' },
    { Icon: CalendarDaysIcon, color: 'green',  value: scheduled, label: 'Scheduled', badge: 'Active',   trend: 'neu' },
    { Icon: CheckCircleIcon,  color: 'green',  value: completed, label: 'Completed', badge: 'Done',     trend: 'up' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Welcome Banner */}
      <div className="welcome-banner fade-in">
        <div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            Farmer
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: 'white', lineHeight: 1.2 }}>
            Hi, {user?.name} <FaceSmileIcon style={{ width: 22, height: 22, display: 'inline', verticalAlign: 'middle', color: '#f4c97a' }} />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
            Manage your cinnamon harvest requests.
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, padding: '10px 16px',
        }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#5bb87e', lineHeight: 1 }}>
              {harvests.length}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Total Requests
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="kpi-grid-3">
        {kpis.map((k, i) => (
          <div className={`kpi-card fade-in d${i + 1}`} key={k.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className={`kpi-icon ${k.color}`}><k.Icon style={{ width: 20, height: 20 }} /></div>
              <span className={`badge badge-${k.trend === 'up' ? 'green' : k.trend === 'down' ? 'danger' : 'soft'}`}>{k.badge}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Harvest Requests */}
      <div className="card fade-in d3">
        <div className="card-header">
          <div className="card-title">Recent Harvest Requests</div>
          <Link to="/farmer/harvests" className="btn-primary" style={{ fontSize: '0.78rem', padding: '8px 16px' }}>
            + New Request
          </Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-soft)', fontSize: '0.85rem' }}>
            <SparklesIcon style={{ width: 36, height: 36, margin: '0 auto 10px', opacity: 0.3, color: 'var(--cinnamon)' }} />
            No harvest requests yet.
            <div style={{ marginTop: 10 }}>
              <Link to="/farmer/harvests" className="btn-primary" style={{ fontSize: '0.78rem', padding: '8px 18px' }}>
                Submit first request
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.map(h => (
              <div key={h._id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--off-white)',
                transition: 'all .2s', cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-pale)'; e.currentTarget.style.background = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--off-white)'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--cinnamon-bg)', border: '1px solid rgba(200,119,58,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <SparklesIcon style={{ width: 18, height: 18, color: 'var(--cinnamon)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.86rem', color: 'var(--green-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.plantationName}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-soft)', marginTop: 2 }}>
                    {h.treeCount?.toLocaleString()} trees · Ready {format(new Date(h.harvestReadyDate), 'MMM d, yyyy')}
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

      {/* Tips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="tips-grid">
        {[
          { Icon: StarIcon,         title: 'ALBA Premium Grade',    desc: 'ALBA cinnamon gets highest priority in scheduling. Ensure accurate processing category selection.', bg: 'var(--cinnamon-bg)', border: 'rgba(200,119,58,0.22)', tc: 'var(--cinnamon)' },
          { Icon: CalendarDaysIcon, title: 'Set Accurate Deadlines', desc: 'Deadlines influence urgency scoring in the genetic algorithm. Tight deadlines get higher priority.', bg: 'var(--mint)', border: 'var(--green-pale)', tc: 'var(--green-dark)' },
        ].map(item => (
          <div key={item.title} style={{
            background: item.bg, border: `1px solid ${item.border}`,
            borderRadius: 14, padding: '18px 20px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <item.Icon style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2, color: item.tc }} />
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: item.tc, marginBottom: 5 }}>{item.title}</div>
              <div style={{ fontSize: '0.79rem', color: 'var(--text-mid)', lineHeight: 1.65 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media(max-width: 900px)  { .kpi-grid-3 { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width: 500px)  { .kpi-grid-3 { grid-template-columns: 1fr !important; } }
        @media(max-width: 700px)  { .tips-grid  { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
