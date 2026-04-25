import { useEffect, useState } from 'react'
import { optimizationApi, peelersApi } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { MapPinIcon, ClockIcon, TruckIcon, UserGroupIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { RouteMap } from '../../components/Map'

function DetailPanel({ loading, detail, myGroupId }) {
  if (loading) return <div className="card flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!detail) return (
    <div className="card p-10 text-center text-gray-400">
      <TruckIcon className="h-10 w-10 mx-auto mb-3 text-cinnamon-200" />
      <p className="text-sm">Select a week to view your route</p>
    </div>
  )

  const a = (detail.assignments ?? []).find(
    x => x.peelerGroup?._id === myGroupId || x.peelerGroup === myGroupId
  )

  return (
    <div className="card p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-gray-900 text-base sm:text-xl">
            {format(new Date(detail.weekStartDate), 'MMM d')} – {format(new Date(detail.weekEndDate), 'MMM d, yyyy')}
          </h3>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {a ? `${a.route?.length ?? 0} farm stops assigned to your group` : 'Your group has no assignment this week'}
          </p>
        </div>
      </div>

      {!a ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-cinnamon-50 flex items-center justify-center">
            <UserGroupIcon className="h-6 w-6 text-cinnamon-300" />
          </div>
          <p className="font-medium text-gray-500 text-sm">Your group was not assigned to this schedule</p>
          <p className="text-xs text-gray-400">The admin may assign your group in the next optimization run</p>
        </div>
      ) : (
        <>
          {/* Stats — 2 cols on mobile, 4 on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'Farm stops', value: a.route?.length ?? '—' },
              { label: 'Distance', value: `${a.totalDistanceKm?.toFixed(1) ?? '—'} km` },
              { label: 'Work hours', value: `${a.totalWorkHours?.toFixed(1) ?? '—'} hrs` },
              { label: 'Trees', value: a.utilizationScore ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-cinnamon-50 rounded-xl p-3 text-center">
                <p className="text-lg sm:text-xl font-bold text-cinnamon-700">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Group header */}
          <div className="bg-gradient-to-r from-cinnamon-50 to-cinnamon-100 rounded-xl px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{a.peelerGroup?.groupName ?? 'Your Group'}</p>
              <p className="text-xs text-gray-500">Leader: {a.peelerGroup?.leaderName ?? '—'}</p>
            </div>
            <div className="flex gap-3 text-xs text-gray-600 mt-1 sm:mt-0">
              <span>{a.totalDistanceKm?.toFixed(1)} km</span>
              <span>{a.totalWorkHours?.toFixed(1)} hrs</span>
              <span className="text-forest-700 font-semibold">{a.utilizationScore ?? 0} trees</span>
            </div>
          </div>

          {/* Route map */}
          {(a.route ?? []).length > 0 && (
            <div className="rounded-xl overflow-hidden">
              <RouteMap stops={a.route} peelerLocation={a.peelerGroup?.currentLocation} height="240px" />
            </div>
          )}

          {/* Farm stops list */}
          <div className="space-y-3">
            {(a.route ?? []).map((stop, j) => (
              <div key={j} className="flex gap-3">
                {/* Step indicator */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="h-7 w-7 rounded-full bg-cinnamon-600 text-white text-xs font-bold flex items-center justify-center">{j + 1}</div>
                  {j < a.route.length - 1 && <div className="w-0.5 bg-cinnamon-200 flex-1 mt-1" style={{ minHeight: '1.5rem' }} />}
                </div>
                {/* Stop card */}
                <div className="flex-1 bg-cinnamon-50 rounded-xl p-3 hover:bg-cinnamon-100 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {stop.harvestRequest?.plantationName ?? `Farm Stop ${j + 1}`}
                      </p>
                      {stop.harvestRequest?.location?.district && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                          {stop.harvestRequest.location.district}
                        </p>
                      )}
                    </div>
                    {/* Meta — stacks on mobile */}
                    <div className="text-right text-xs text-gray-500 space-y-0.5 flex-shrink-0">
                      {stop.arrivalTime && (
                        <p className="flex items-center gap-1 justify-end">
                          <ClockIcon className="h-3 w-3" />{stop.arrivalTime}
                        </p>
                      )}
                      {stop.estimatedHours != null && (
                        <p>{stop.estimatedHours.toFixed(1)}h work</p>
                      )}
                      {j > 0 && stop.distanceFromPreviousKm && (
                        <p className="flex items-center gap-1 justify-end">
                          <TruckIcon className="h-3 w-3" />{stop.distanceFromPreviousKm.toFixed(1)} km
                        </p>
                      )}
                    </div>
                  </div>
                  {stop.harvestRequest?.status && (
                    <div className="mt-2 pt-2 border-t border-cinnamon-100 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400">Harvest status</span>
                      <StatusBadge status={stop.harvestRequest.status} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function PeelerRoutes() {
  const [schedules, setSchedules] = useState([])
  const [myGroupId, setMyGroupId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    Promise.all([
      optimizationApi.schedules(),
      peelersApi.myGroup().catch(() => null),
    ]).then(([schedRes, groupRes]) => {
      const groupId = groupRes?.data?.data?._id ?? null
      setMyGroupId(groupId)
      const all = schedRes.data.data ?? []
      const filtered = groupId
        ? all.filter(s => (s.assignments ?? []).some(a => {
            const id = a.peelerGroup?._id ?? a.peelerGroup
            return String(id) === String(groupId)
          }))
        : all
      setSchedules(filtered)
      if (filtered.length > 0) setSelected(filtered[0]._id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) { setDetail(null); return }
    setLoadingDetail(true)
    optimizationApi.schedule(selected)
      .then(r => setDetail(r.data.data))
      .finally(() => setLoadingDetail(false))
  }, [selected])

  const selectedSchedule = schedules.find(s => s._id === selected)

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="page-header">
        <h1>My Routes</h1>
        <p>View your assigned harvest routes and farm stops</p>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
      ) : schedules.length === 0 ? (
        <div className="card p-12 text-center">
          <TruckIcon className="h-12 w-12 text-cinnamon-200 mx-auto mb-3" />
          <p className="text-gray-500">No schedule assigned yet. Check back after the admin runs optimization.</p>
        </div>
      ) : (
        <>
          {/* Mobile: dropdown week selector */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowPicker(v => !v)}
              className="w-full card p-4 flex items-center justify-between gap-3">
              <div className="text-left min-w-0">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Selected week</p>
                {selectedSchedule && (
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {format(new Date(selectedSchedule.weekStartDate), 'MMM d')} – {format(new Date(selectedSchedule.weekEndDate), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {showPicker ? <ChevronUpIcon className="h-4 w-4 text-gray-400" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
              </div>
            </button>

            {showPicker && (
              <div className="mt-2 space-y-2">
                {schedules.map(s => {
                  const myAssignment = (s.assignments ?? []).find(a => String(a.peelerGroup?._id ?? a.peelerGroup) === String(myGroupId))
                  return (
                    <button key={s._id}
                      onClick={() => { setSelected(s._id); setShowPicker(false) }}
                      className={`w-full text-left card p-4 cursor-pointer transition-all ${selected === s._id ? 'ring-2 ring-cinnamon-400' : 'card-hover'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {format(new Date(s.weekStartDate), 'MMM d')} – {format(new Date(s.weekEndDate), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{myAssignment?.route?.length ?? 0} farm stops</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPinIcon className="h-3 w-3" />{myAssignment?.route?.length ?? 0} farms</span>
                        <span className="flex items-center gap-1"><TruckIcon className="h-3 w-3" />{myAssignment?.totalDistanceKm?.toFixed(0) ?? '0'} km</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Desktop: sidebar + detail */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Weeks</p>
              <div className="space-y-3">
                {schedules.map(s => {
                  const myAssignment = (s.assignments ?? []).find(a => String(a.peelerGroup?._id ?? a.peelerGroup) === String(myGroupId))
                  return (
                    <button key={s._id}
                      onClick={() => setSelected(s._id)}
                      className={`w-full text-left card p-4 cursor-pointer transition-all ${selected === s._id ? 'ring-2 ring-cinnamon-400' : 'card-hover'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                            {format(new Date(s.weekStartDate), 'MMM d')} – {format(new Date(s.weekEndDate), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{myAssignment?.route?.length ?? 0} farm stops</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPinIcon className="h-3 w-3" />{myAssignment?.route?.length ?? 0} farms</span>
                        <span className="flex items-center gap-1"><TruckIcon className="h-3 w-3" />{myAssignment?.totalDistanceKm?.toFixed(0) ?? '0'} km</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="lg:col-span-3">
              <DetailPanel loading={loadingDetail} detail={detail} myGroupId={myGroupId} />
            </div>
          </div>

          {/* Mobile: detail panel below selector */}
          <div className="lg:hidden">
            <DetailPanel loading={loadingDetail} detail={detail} myGroupId={myGroupId} />
          </div>
        </>
      )}
    </div>
  )
}
