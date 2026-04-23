import { useEffect, useState } from 'react'
import { optimizationApi, harvestApi } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { toast } from 'sonner'
import { ChartBarIcon, MapPinIcon, ClockIcon, ArrowRightIcon, TruckIcon, ChevronDownIcon, ChevronUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { RouteMap } from '../../components/Map'

const HARVEST_STATUSES = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

function ScheduleCard({ s, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left card p-4 cursor-pointer transition-all ${active ? 'ring-2 ring-cinnamon-400' : 'card-hover'}`}>
      <div className="mb-2">
        <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
          {format(new Date(s.weekStartDate), 'MMM d')} – {format(new Date(s.weekEndDate), 'MMM d, yyyy')}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{s.assignments?.length ?? 0} routes</p>
      </div>
      <div className="flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><MapPinIcon className="h-3 w-3" />{s.optimizerSummary?.totalAssignedFarms ?? '?'} farms</span>
        <span className="flex items-center gap-1"><TruckIcon className="h-3 w-3" />{s.optimizerSummary?.totalDistanceKm?.toFixed(0) ?? '?'} km</span>
      </div>
    </button>
  )
}

function DetailPanel({ selected, onHarvestStatusChange }) {
  if (!selected) return (
    <div className="card p-10 text-center text-gray-400 min-h-[200px] flex flex-col items-center justify-center gap-3">
      <div className="h-12 w-12 rounded-full bg-cinnamon-50 flex items-center justify-center">
        <ChartBarIcon className="h-6 w-6 text-cinnamon-300" />
      </div>
      <div>
        <p className="font-medium text-gray-500 text-sm">No schedule selected</p>
        <p className="text-xs text-gray-400 mt-1">Tap a schedule to view its details</p>
      </div>
    </div>
  )

  return (
    <div className="card p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display font-bold text-gray-900 text-base sm:text-lg">
            {format(new Date(selected.weekStartDate), 'MMM d')} – {format(new Date(selected.weekEndDate), 'MMM d, yyyy')}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{selected.assignments?.length ?? 0} peeler routes</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Fitness score', value: selected.optimizerSummary?.fitnessScore?.toFixed(2) ?? '—', tooltip: 'A composite score from the genetic algorithm (higher = better). Combines travel distance, urgency, ALBA priority, capacity, deadlines and workload balance.' },
          { label: 'Distance', value: `${selected.optimizerSummary?.totalDistanceKm?.toFixed(1) ?? '—'} km` },
          { label: 'Assigned', value: selected.optimizerSummary?.totalAssignedFarms ?? '—' },
          { label: 'Unassigned', value: selected.optimizerSummary?.unassignedFarmIds?.length ?? '—' },
        ].map(({ label, value, tooltip }) => (
          <div key={label} className="bg-cinnamon-50 rounded-xl p-3 text-center">
            <p className="text-lg sm:text-xl font-bold text-cinnamon-700">{value}</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <p className="text-xs text-gray-500">{label}</p>
              {tooltip && (
                <div className="relative group/tip">
                  <InformationCircleIcon className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 leading-relaxed opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-10">
                    {tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assignments */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 text-sm">Peeler Assignments</h4>
        {(selected.assignments ?? []).map((a, i) => (
          <div key={i} className="border border-cinnamon-100 rounded-xl overflow-hidden">
            {/* Assignment header */}
            <div className="bg-cinnamon-50 px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-gray-800 text-sm">{a.peelerGroup?.groupName ?? `Peeler Group ${i + 1}`}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>{a.totalDistanceKm?.toFixed(1)} km</span>
                <span>{a.totalWorkHours?.toFixed(1)} hrs</span>
                <span className="text-forest-700 font-semibold">{a.utilizationScore ?? 0} trees</span>
              </div>
            </div>

            {/* Route map */}
            {(a.route ?? []).length > 0 && (
              <div className="px-4 pt-3">
                <RouteMap stops={a.route} peelerLocation={a.peelerGroup?.currentLocation} height="200px" />
              </div>
            )}

            {/* Stop list */}
            <div className="p-4 space-y-3">
              {(a.route ?? []).map((stop, j) => (
                <div key={j} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="h-7 w-7 rounded-full bg-cinnamon-600 text-white text-xs font-bold flex items-center justify-center">{j + 1}</div>
                    {j < a.route.length - 1 && <div className="w-0.5 bg-cinnamon-200 flex-1 mt-1" style={{ minHeight: '1.5rem' }} />}
                  </div>
                  <div className="flex-1 bg-cinnamon-50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{stop.harvestRequest?.plantationName ?? `Farm ${j + 1}`}</p>
                        {stop.harvestRequest?.location?.district && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3 flex-shrink-0" />{stop.harvestRequest.location.district}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500 flex-shrink-0 space-y-0.5">
                        {stop.arrivalTime && <p className="flex items-center gap-1 justify-end"><ClockIcon className="h-3 w-3" />{stop.arrivalTime}</p>}
                        {stop.estimatedHours != null && <p className="font-medium text-gray-700">{stop.estimatedHours.toFixed(1)}h work</p>}
                        {j > 0 && stop.distanceFromPreviousKm && <p className="flex items-center gap-1 justify-end"><ArrowRightIcon className="h-3 w-3" />{stop.distanceFromPreviousKm.toFixed(1)} km</p>}
                      </div>
                    </div>
                    {stop.harvestRequest?._id && (
                      <div className="mt-2 pt-2 border-t border-cinnamon-100 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400">Harvest status</span>
                        <select
                          value={stop.harvestRequest.status ?? 'PENDING'}
                          onChange={e => onHarvestStatusChange(stop.harvestRequest._id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="text-xs rounded-lg border border-cinnamon-200 bg-white px-2 py-1 text-gray-700 font-medium"
                        >
                          {HARVEST_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Schedules() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showPicker, setShowPicker] = useState(false)

  const load = () => {
    setLoading(true)
    optimizationApi.schedules().then(r => setSchedules(r.data.data ?? [])).finally(() => setLoading(false))
  }

  const loadDetail = async (id) => {
    const s = schedules.find(x => x._id === id)
    if (s?.assignments?.[0]?.route) { setSelected(s); return }
    try {
      const res = await optimizationApi.schedule(id)
      setSelected(res.data.data)
    } catch { toast.error('Failed to load schedule details') }
  }

  const updateHarvestStatus = async (harvestId, status) => {
    try {
      await harvestApi.updateStatus(harvestId, status)
      toast.success('Status updated')
      // Update the stop's status in the selected schedule in-place
      setSelected(prev => {
        if (!prev) return prev
        return {
          ...prev,
          assignments: prev.assignments.map(a => ({
            ...a,
            route: a.route.map(stop =>
              stop.harvestRequest?._id === harvestId
                ? { ...stop, harvestRequest: { ...stop.harvestRequest, status } }
                : stop
            )
          }))
        }
      })
    } catch { toast.error('Failed to update status') }
  }

  const handleSelect = (id) => {
    setExpanded(id)
    loadDetail(id)
    setShowPicker(false)
  }

  useEffect(() => { load() }, [])

  const selectedSchedule = schedules.find(s => s._id === expanded)

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="page-header">
        <h1>Schedules</h1>
        <p>{schedules.length} generated schedules</p>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
      ) : schedules.length === 0 ? (
        <div className="card p-12 text-center">
          <ChartBarIcon className="h-12 w-12 text-cinnamon-200 mx-auto mb-3" />
          <p className="text-gray-500">No schedules yet. Run the optimizer to generate one.</p>
        </div>
      ) : (
        <>
          {/* Mobile: dropdown picker */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowPicker(v => !v)}
              className="w-full card p-4 flex items-center justify-between gap-3">
              <div className="text-left min-w-0">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Selected schedule</p>
                {selectedSchedule ? (
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {format(new Date(selectedSchedule.weekStartDate), 'MMM d')} – {format(new Date(selectedSchedule.weekEndDate), 'MMM d, yyyy')}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Tap to select a schedule</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {showPicker ? <ChevronUpIcon className="h-4 w-4 text-gray-400" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
              </div>
            </button>

            {showPicker && (
              <div className="mt-2 space-y-2">
                {schedules.map(s => (
                  <ScheduleCard key={s._id} s={s} active={expanded === s._id} onClick={() => handleSelect(s._id)} />
                ))}
              </div>
            )}
          </div>

          {/* Mobile: detail */}
          <div className="lg:hidden">
            <DetailPanel selected={selected} onHarvestStatusChange={updateHarvestStatus} />
          </div>

          {/* Desktop: sidebar + detail */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3">
              {schedules.map(s => (
                <ScheduleCard key={s._id} s={s} active={expanded === s._id} onClick={() => handleSelect(s._id)} />
              ))}
            </div>
            <div className="lg:col-span-2">
              <DetailPanel selected={selected} onHarvestStatusChange={updateHarvestStatus} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
