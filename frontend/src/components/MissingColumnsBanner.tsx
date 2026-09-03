import { AlertOctagon } from 'lucide-react'

export function MissingColumnsBanner({ missingColumns }: { missingColumns: string[] }) {
  if (missingColumns.length === 0) return null
  return (
    <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-bg)] p-5">
      <div className="flex items-center gap-2 text-[var(--color-danger)]">
        <AlertOctagon className="h-5 w-5" />
        <h3 className="font-display text-base font-semibold">Missing Required Columns</h3>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-[var(--color-danger)]">
        {missingColumns.map((col) => (
          <li key={col}>• {col} is missing</li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-slate-600">
        You cannot proceed until the file includes all required columns. Please update the source file and
        upload again.
      </p>
    </div>
  )
}
