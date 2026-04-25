import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { optimizationApi, peelersApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'
import { format } from 'date-fns'

export default function PeelerHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      optimizationApi.schedules(),
      peelersApi.myGroup().catch(() => null),
    ]).then(([schedRes, groupRes]) => {
      const groupId = groupRes?.data?.data?._id ?? null
      const all = (schedRes.data.data ?? []).filter(s => s.status !== 'CANCELLED')
      const filtered = groupId
        ? all.filter(s => (s.assignments ?? []).some(a => {
            const id = a.peelerGroup?._id ?? a.peelerGroup
            return String(id) === String(groupId)
          }))
        : all
      setSchedules(filtered.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Spinner size="lg" />
    </div>
  )

  const today = new Date()
  const activeSchedule = schedules.find(s =>
    today >= new Date(s.weekStartDate) && today <= new Date(s.weekEndDate)
  ) ?? schedules[0] ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Welcome Banner */}
      <div className="welcome-banner fade-in">
        <div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Peeler Dashboard</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', color: 'white' }}>
            {user?.name} 👋
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
            {activeSchedule ? 'Active harvest schedule this week.' : 'No active schedule assigned yet.'}
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, padding: '10px 16px',
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#5bb87e', lineHeight: 1 }}>
            {schedules.length}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Schedules
          </div>
        </div>
      </div>

      {/* Active schedule card */}
      {activeSchedule ? (
        <div className="card fade-in d1" style={{ borderLeft: '3px solid var(--green-lt)' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Current Week Schedule</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', marginTop: 2 }}>
                {format(new Date(activeSchedule.weekStartDate), 'MMM d')} – {format(new Date(activeSchedule.weekEndDate), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { icon: '📍', label: 'Assigned Farms', value: activeSchedule.optimizerSummary?.totalAssignedFarms ?? '—' },
              { icon: '🚛', label: 'Total Distance', value: `${activeSchedule.optimizerSummary?.totalDistanceKm?.toFixed(1) ?? '—'} km` },
              { icon: '🗺️', label: 'Routes',         value: activeSchedule.assignments?.length ?? '—' },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{
                background: 'var(--mint)', border: '1px solid var(--green-pale)',
                borderRadius: 12, padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{icon}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-dark)' }}>{value}</div>
                <div style={{ fontSize: '0.69rem', color: 'var(--text-soft)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card fade-in d1" style={{
          textAlign: 'center', padding: '40px 24px',
          border: '2px dashed var(--green-pale)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🚛</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: 'var(--green-dark)', marginBottom: 6 }}>
            No Active Schedule
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>
            The admin will assign your routes once optimization runs.
          </div>
        </div>
      )}

      {/* Recent Schedules */}
      <div className="card fade-in d2">
        <div className="card-header">
          <div className="card-title">Recent Schedules</div>
        </div>
        {schedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-soft)', fontSize: '0.85rem' }}>
            No schedules available yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {schedules.map(s => (
              <div key={s._id} onClick={() => navigate('/peeler/routes')} style={{
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
                  background: 'var(--mint)', border: '1px solid var(--green-pale)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>📅</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.86rem', color: 'var(--green-dark)' }}>
                    {format(new Date(s.weekStartDate), 'MMM d')} – {format(new Date(s.weekEndDate), 'MMM d, yyyy')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: 2 }}>
                    {s.assignments?.length ?? 0} routes · {s.optimizerSummary?.totalAssignedFarms ?? 0} farms
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="tips-grid">
        {[
          { icon: '⚡', title: 'AI-Optimized Routes', desc: 'Your routes are generated by a genetic algorithm that minimizes travel distance and respects deadlines.', bg: 'var(--cinnamon-bg)', border: 'rgba(200,119,58,0.22)', tc: 'var(--cinnamon)' },
          { icon: '⭐', title: 'Rating Matters', desc: 'Higher-rated peeler groups get priority assignment to premium ALBA and C5 Special grade farms.', bg: 'var(--mint)', border: 'var(--green-pale)', tc: 'var(--green-dark)' },
        ].map(item => (
          <div key={item.title} style={{
            background: item.bg, border: `1px solid ${item.border}`,
            borderRadius: 14, padding: '18px 20px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: item.tc, marginBottom: 5 }}>{item.title}</div>
              <div style={{ fontSize: '0.79rem', color: 'var(--text-mid)', lineHeight: 1.65 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`@media(max-width:700px){.tips-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
