import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-1 pt-3">
      <p className="text-xs text-gray-400">{from}–{to} of {total}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-cinnamon-50 hover:text-cinnamon-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
            acc.push(p)
            return acc
          }, [])
          .map((p, i) =>
            p === '…'
              ? <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">…</span>
              : <button
                  key={p}
                  onClick={() => onChange(p)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${page === p ? 'bg-cinnamon-600 text-white' : 'text-gray-600 hover:bg-cinnamon-50 hover:text-cinnamon-700'}`}
                >
                  {p}
                </button>
          )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-cinnamon-50 hover:text-cinnamon-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
