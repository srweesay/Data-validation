import type { ValidationSummary } from '#/lib/types'
import { FileStack, CheckCircle2, XCircle, ListX, AlertOctagon } from 'lucide-react'

export function SummaryCards({ summary }: { summary: ValidationSummary }) {
  const cards = [
    { label: 'Total Rows', value: summary.totalRows, icon: FileStack, tone: 'neutral' as const },
    { label: 'Valid Rows', value: summary.validRows, icon: CheckCircle2, tone: 'success' as const },
    { label: 'Invalid Rows', value: summary.invalidRows, icon: XCircle, tone: 'danger' as const },
    { label: 'Missing Columns', value: summary.missingColumns, icon: ListX, tone: 'danger' as const },
    { label: 'Validation Errors', value: summary.validationErrors, icon: AlertOctagon, tone: 'danger' as const },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
            <Icon
              className={
                'h-4 w-4 ' +
                (tone === 'success'
                  ? 'text-[var(--color-success)]'
                  : tone === 'danger' && value > 0
                  ? 'text-[var(--color-danger)]'
                  : 'text-slate-400')
              }
            />
          </div>
          <p
            className={
              'mt-2 font-display text-2xl font-bold tabular-nums ' +
              (tone === 'danger' && value > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink)]')
            }
          >
            {value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
