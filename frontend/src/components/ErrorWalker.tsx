import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import type { ValidationErrorItem } from '#/lib/types'

export function ErrorWalker({
  errors,
  onCorrect,
}: {
  errors: ValidationErrorItem[]
  onCorrect: (row: number, column: string, value: string) => void
}) {
  const [index, setIndex] = useState(0)
  const [draft, setDraft] = useState('')

  // Keep the pointer in range and reset the draft whenever the current error changes
  // (e.g. after a Revalidate shrinks or reorders the list).
  useEffect(() => {
    if (index > errors.length - 1) setIndex(Math.max(0, errors.length - 1))
  }, [errors.length, index])

  const current = errors[index]

  useEffect(() => {
    setDraft(current ? String(current.value ?? '') : '')
  }, [current])

  if (!current) return null

  const commit = () => {
    if (draft !== String(current.value ?? '')) {
      onCorrect(current.row, current.column, draft)
    }
  }

  const goTo = (next: number) => {
    commit()
    setIndex(Math.max(0, Math.min(errors.length - 1, next)))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
        <p className="text-sm font-semibold text-slate-600">
          Error <span className="tabular-nums text-[var(--color-ink)]">{index + 1}</span> of{' '}
          <span className="tabular-nums text-[var(--color-ink)]">{errors.length}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            onClick={() => goTo(index + 1)}
            disabled={index === errors.length - 1}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" />
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm text-slate-500">
              <span>
                Row <span className="font-semibold tabular-nums text-[var(--color-ink)]">{current.row}</span>
              </span>
              <span>
                Column <span className="font-semibold text-[var(--color-ink)]">{current.column}</span>
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-[var(--color-danger)]">{current.message}</p>

            <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Corrected value
            </label>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') goTo(index + 1)
              }}
              className="mt-1 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[var(--color-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => goTo(index + 1)}
                className="rounded-md bg-[var(--color-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-gold-dark)] hover:text-white"
              >
                {index === errors.length - 1 ? 'Save' : 'Save & Next'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex flex-wrap gap-1 border-t border-slate-100 bg-slate-50 px-5 py-3">
        {errors.map((e, i) => (
          <button
            key={`${e.row}-${e.column}-${i}`}
            title={`Row ${e.row} · ${e.column}`}
            onClick={() => goTo(i)}
            className={
              'h-2 w-2 rounded-full transition ' +
              (i === index
                ? 'bg-[var(--color-gold)]'
                : i < index
                ? 'bg-[var(--color-success)]/60'
                : 'bg-slate-300')
            }
          />
        ))}
      </div>
    </div>
  )
}
