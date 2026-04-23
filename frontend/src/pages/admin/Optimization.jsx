import { useState, useCallback } from 'react'
import { optimizationApi, optimizerApi } from '../../api'
import Spinner from '../../components/Spinner'
import { toast } from 'sonner'
import { SparklesIcon, EyeIcon, PlayIcon, CheckCircleIcon, ExclamationTriangleIcon, CpuChipIcon, MapIcon, BoltIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { format, addDays, startOfWeek } from 'date-fns'

function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1001]" onClick={onCancel} />
      <div className="relative z-[1002] flex items-center justify-center min-h-full p-4">
        <div className="card w-full max-w-sm p-6 animate-slide-up rounded-2xl">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-900 text-lg mb-1">Run Optimizer?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This will create a new schedule and mark matching harvest requests as <span className="font-semibold text-gray-700">SCHEDULED</span>.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full pt-1">
              <button className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2 whitespace-nowrap" onClick={onConfirm}>
                <PlayIcon className="h-4 w-4" />
                Run Optimizer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Optimization() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const [weekStartDate, setWeekStartDate] = useState(format(weekStart, 'yyyy-MM-dd'))
  const [weekEndDate, setWeekEndDate] = useState(format(addDays(weekStart, 6), 'yyyy-MM-dd'))
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingRun, setLoadingRun] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(preview.data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePreview = async () => {
    setLoadingPreview(true)
    setPreview(null)
    try {
      const res = await optimizationApi.preview({ weekStartDate, weekEndDate })
      setPreview(res.data)
      toast.success('Preview generated')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Preview failed')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleRunClick = async () => {
    // If preview is already loaded use it, otherwise fetch quickly
    let farmCount = preview?.data?.farms?.length ?? null
    if (farmCount === null) {
      try {
        const res = await optimizationApi.preview({ weekStartDate, weekEndDate })
        setPreview(res.data)
        farmCount = res.data?.data?.farms?.length ?? 0
      } catch {
        setShowConfirm(true)
        return
      }
    }
    if (farmCount < 2) {
      toast.error(`Need at least 2 harvest-ready farms to run the optimizer (found ${farmCount})`)
      return
    }
    setShowConfirm(true)
  }

  const handleRun = useCallback(async () => {
    setShowConfirm(false)
    setLoadingRun(true)
    setResult(null)
    try {
      toast.info('Waking up optimizer service…')
      await optimizerApi.health()
      const res = await optimizationApi.run({ weekStartDate, weekEndDate })
      setResult(res.data)
      toast.success('Optimization complete!')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Optimization failed — is the optimizer service running?')
    } finally {
      setLoadingRun(false)
    }
  }, [weekStartDate, weekEndDate])

  return (
    <>
    {showConfirm && <ConfirmModal onConfirm={handleRun} onCancel={() => setShowConfirm(false)} />}
    <div className="space-y-6 animate-slide-up max-w-4xl">
      <div className="page-header">
        <h1>Genetic Algorithm Optimizer</h1>
        <p>Match peeler groups to farms using AI-powered route optimization</p>
      </div>

      {/* Config card */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-display font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-cinnamon-600" />
          Schedule Week
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="label">Week start date</label>
            <input type="date" className="input-field" value={weekStartDate}
              onChange={e => {
                setWeekStartDate(e.target.value)
                setWeekEndDate(format(addDays(new Date(e.target.value), 6), 'yyyy-MM-dd'))
              }} />
          </div>
          <div>
            <label className="label">Week end date</label>
            <input type="date" className="input-field" value={weekEndDate}
              onChange={e => setWeekEndDate(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-none"
            onClick={handlePreview}
            disabled={loadingPreview}
          >
            {loadingPreview ? <Spinner size="sm" /> : <EyeIcon className="h-4 w-4" />}
            Preview Payload
          </button>
          <button
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-none"
            onClick={handleRunClick}
            disabled={loadingRun}
          >
            {loadingRun ? <Spinner size="sm" /> : <PlayIcon className="h-4 w-4" />}
            {loadingRun ? 'Optimizing…' : 'Run Optimizer'}
          </button>
        </div>
      </div>

      {/* Algorithm info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { Icon: CpuChipIcon, title: 'Genetic Algorithm', desc: 'Evolutionary optimization over 220+ generations with tournament selection and elitism', iconBg: 'bg-gradient-to-br from-cinnamon-100 to-cinnamon-200', iconColor: 'text-cinnamon-700', ring: 'ring-cinnamon-100' },
          { Icon: MapIcon, title: 'VRP Routing', desc: 'Simultaneous farm assignment and route sequencing using haversine distance calculation', iconBg: 'bg-gradient-to-br from-forest-100 to-forest-200', iconColor: 'text-forest-700', ring: 'ring-forest-100' },
          { Icon: BoltIcon, title: 'Multi-Objective', desc: 'Balances distance, urgency, ALBA priority, capacity, deadlines and workload balance', iconBg: 'bg-gradient-to-br from-amber-100 to-amber-200', iconColor: 'text-amber-700', ring: 'ring-amber-100' },
        ].map(({ Icon, title, desc, iconBg, iconColor, ring }) => (
          <div key={title} className={`card p-4 sm:p-5 flex sm:flex-col gap-4 sm:gap-0 items-start ring-1 ${ring}`}>
            <div className={`h-12 w-12 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0 sm:mb-3 shadow-sm`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div>
              <h4 className="font-display font-bold text-gray-900 text-sm mb-1">{title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Preview result */}
      {preview && (
        <div className="card p-4 sm:p-6 animate-slide-up">
          <h3 className="font-display font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <EyeIcon className="h-5 w-5 text-cinnamon-600" />
            Payload Preview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Farm requests', value: preview.data?.farms?.length ?? 0 },
              { label: 'Peeler groups', value: preview.data?.peelerGroups?.length ?? 0 },
              { label: 'Week start', value: format(new Date(weekStartDate), 'MMM d') },
              { label: 'Week end', value: format(new Date(weekEndDate), 'MMM d') },
            ].map(({ label, value }) => (
              <div key={label} className="bg-cinnamon-50 rounded-xl p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-cinnamon-700">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-cinnamon-600">View raw payload</summary>
            <div className="relative mt-2">
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-500 hover:text-cinnamon-700 hover:border-cinnamon-300 transition-colors"
              >
                {copied ? <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-forest-600" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <pre className="bg-gray-50 rounded-xl p-3 sm:p-4 text-xs overflow-auto max-h-64 text-gray-600">
                {JSON.stringify(preview.data, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* Optimization result */}
      {result && (
        <div className="card p-4 sm:p-6 animate-slide-up">
          <h3 className="font-display font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-forest-600" />
            Optimization Results
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Fitness score', value: result.data?.optimizerSummary?.fitnessScore?.toFixed(2) ?? '—', tooltip: 'A composite score from the genetic algorithm (higher = better). Combines travel distance, urgency, ALBA priority, capacity, deadlines and workload balance.' },
              { label: 'Total distance', value: `${result.data?.optimizerSummary?.totalDistanceKm?.toFixed(1) ?? '—'} km` },
              { label: 'Assigned farms', value: result.data?.optimizerSummary?.totalAssignedFarms ?? '—' },
              { label: 'Unassigned', value: result.data?.optimizerSummary?.unassignedFarmIds?.length ?? '—' },
            ].map(({ label, value, tooltip }) => (
              <div key={label} className={`rounded-xl p-3 text-center ${label === 'Unassigned' && parseInt(value) > 0 ? 'bg-red-50' : 'bg-forest-50'}`}>
                <p className={`text-xl sm:text-2xl font-bold ${label === 'Unassigned' && parseInt(value) > 0 ? 'text-red-600' : 'text-forest-700'}`}>{value}</p>
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

          <h4 className="font-semibold text-gray-800 text-sm mb-3">Peeler Routes</h4>
          <div className="space-y-4">
            {(result.data?.assignments ?? []).filter(a => a.route?.length > 0).map((a, i) => (
              <div key={i} className="border border-cinnamon-100 rounded-2xl overflow-hidden">
                {/* Group header */}
                <div className="bg-gradient-to-r from-cinnamon-50 to-cinnamon-100 px-5 py-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display font-bold text-gray-900 text-sm">{a.peelerGroup?.groupName ?? `Peeler Group ${i + 1}`}</p>
                    <p className="text-xs text-gray-500">Leader: {a.peelerGroup?.leaderName ?? '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="bg-white rounded-lg px-2.5 py-1 text-gray-600 font-medium">{a.totalDistanceKm?.toFixed(1)} km</span>
                    <span className="bg-white rounded-lg px-2.5 py-1 text-gray-600 font-medium">{a.totalWorkHours?.toFixed(1)} hrs</span>
                    <span className="bg-white rounded-lg px-2.5 py-1 text-forest-700 font-semibold">{a.utilizationScore ?? 0} trees</span>
                  </div>
                </div>
                {/* Route stops */}
                <div className="p-4 space-y-2">
                  {(a.route ?? []).map((stop, j) => (
                    <div key={j} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="h-6 w-6 rounded-full bg-cinnamon-600 text-white text-xs font-bold flex items-center justify-center">{j + 1}</div>
                        {j < a.route.length - 1 && <div className="w-0.5 bg-cinnamon-200 flex-1 mt-1" style={{ minHeight: '1.5rem' }} />}
                      </div>
                      <div className="flex-1 bg-cinnamon-50 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{stop.harvestRequest?.plantationName ?? `Farm ${j + 1}`}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{stop.harvestRequest?.location?.district ?? '—'}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500 flex-shrink-0 space-y-0.5">
                          <p className="font-medium text-gray-700">{stop.estimatedHours?.toFixed(1)}h work</p>
                          {j > 0 && <p>{stop.distanceFromPreviousKm?.toFixed(1)} km away</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
