import { useState, useEffect, useRef } from 'react'
import { notificationsApi } from '../api'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

const typeColors = {
  HARVEST_STATUS:    { dot: '#c8773a', bg: '#fdf3ec' },
  SCHEDULE_ASSIGNED: { dot: '#3a9460', bg: '#e8f5ec' },
  HARVEST_CREATED:   { dot: '#5b87d4', bg: '#eef3ff' },
  GENERAL:           { dot: '#7a9882', bg: '#f8faf7' },
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const load = async () => {
    try {
      setLoading(true)
      const res = await notificationsApi.list()
      setNotifications(res.data.data)
      setUnread(res.data.unreadCount)
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [])

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleClick = async (n) => {
    if (!n.read) {
      await notificationsApi.markRead(n._id).catch(() => {})
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x))
      setUnread(prev => Math.max(0, prev - 1))
    }
    if (n.link) { navigate(n.link); setOpen(false) }
  }

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead().catch(() => {})
    setNotifications(prev => prev.map(x => ({ ...x, read: true })))
    setUnread(0)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await notificationsApi.remove(id).catch(() => {})
    setNotifications(prev => prev.filter(x => x._id !== id))
    setUnread(prev => {
      const n = notifications.find(x => x._id === id)
      return n && !n.read ? Math.max(0, prev - 1) : prev
    })
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) load() }}
        style={{
          position: 'relative',
          width: 34, height: 34, borderRadius: 8,
          border: '1px solid var(--border)', background: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 0.2s', fontSize: '1rem',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--mint)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
        aria-label="Notifications"
      >
        {unread > 0 ? '🔔' : '🔕'}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--cinnamon)', color: 'white',
            fontSize: '0.6rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: 320, background: 'white',
          borderRadius: 16, border: '1px solid var(--border)',
          boxShadow: '0 16px 50px rgba(0,0,0,0.12)', zIndex: 50,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-dark)' }}>
                Notifications
              </span>
              {unread > 0 && (
                <span style={{
                  background: 'var(--cinnamon-bg)', color: 'var(--cinnamon)',
                  border: '1px solid rgba(200,119,58,0.25)',
                  borderRadius: 100, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 700,
                }}>
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Mark all read ✓
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-soft)', fontSize: '0.82rem' }}>Loading…</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.4 }}>🔕</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const colors = typeColors[n.type] ?? typeColors.GENERAL
                return (
                  <div
                    key={n._id}
                    onClick={() => handleClick(n)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 16px',
                      background: n.read ? 'white' : colors.bg,
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--off-white)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'white' : colors.bg}
                  >
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: n.read ? 'var(--border)' : colors.dot,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.82rem', lineHeight: 1.4,
                        color: n.read ? 'var(--text-soft)' : 'var(--green-dark)',
                        fontWeight: n.read ? 400 : 600,
                      }}>{n.title}</p>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-soft)', marginTop: 2, lineHeight: 1.5 }}>{n.message}</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-soft)', marginTop: 4 }}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, n._id)}
                      style={{
                        flexShrink: 0, background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--text-soft)', fontSize: '0.75rem',
                        padding: '2px 4px', borderRadius: 4, transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-soft)'}
                    >
                      ✕
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
