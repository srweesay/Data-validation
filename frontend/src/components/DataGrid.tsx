import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { RowRecord, ValidationErrorItem } from '#/lib/types'

const ROW_HEIGHT = 40
const ROW_NUM_WIDTH = 64
const CELL_WIDTH = 180

export function DataGrid({
  headers,
  rows,
  errors,
  onCellChange,
}: {
  headers: string[]
  rows: RowRecord[]
  errors: ValidationErrorItem[]
  onCellChange: (rowIndex: number, column: string, value: string) => void
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const errorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of errors) {
      map.set(`${e.row - 1}:${e.column}`, e.message)
    }
    return map
  }, [errors])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-medium text-slate-600">
          {rows.length.toLocaleString()} rows &middot; {headers.length} columns
        </p>
        {errorMap.size > 0 && (
          <p className="text-sm font-medium text-[var(--color-danger)]">
            {errorMap.size.toLocaleString()} cell{errorMap.size === 1 ? '' : 's'} need attention
          </p>
        )}
      </div>

      <div ref={parentRef} className="max-h-[560px] overflow-auto">
        <div style={{ width: ROW_NUM_WIDTH + headers.length * CELL_WIDTH }}>
          {/* Sticky header row */}
          <div
            className="sticky top-0 z-10 flex border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"
            style={{ height: ROW_HEIGHT }}
          >
            <div
              className="sticky left-0 z-20 flex shrink-0 items-center border-r border-slate-200 bg-slate-50 px-3"
              style={{ width: ROW_NUM_WIDTH }}
            >
              Row
            </div>
            {headers.map((h) => (
              <div
                key={h}
                className="flex shrink-0 items-center truncate border-r border-slate-100 px-3"
                style={{ width: CELL_WIDTH }}
                title={h}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Virtualized body */}
          <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
            {virtualItems.map((vRow) => {
              const row = rows[vRow.index]
              return (
                <div
                  key={vRow.index}
                  className="absolute left-0 top-0 flex w-full border-b border-slate-100"
                  style={{ height: vRow.size, transform: `translateY(${vRow.start}px)` }}
                >
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center border-r border-slate-200 bg-slate-50 px-3 text-xs font-medium tabular-nums text-slate-500"
                    style={{ width: ROW_NUM_WIDTH }}
                  >
                    {vRow.index + 1}
                  </div>
                  {headers.map((col) => {
                    const errorMessage = errorMap.get(`${vRow.index}:${col}`)
                    return (
                      <div
                        key={col}
                        className="shrink-0 border-r border-slate-100 p-0.5"
                        style={{ width: CELL_WIDTH }}
                      >
                        <input
                          defaultValue={String(row[col] ?? '')}
                          title={errorMessage}
                          onBlur={(e) => {
                            if (e.target.value !== String(row[col] ?? '')) {
                              onCellChange(vRow.index, col, e.target.value)
                            }
                          }}
                          className={
                            'h-full w-full rounded-sm border px-2 text-sm focus:outline-none focus:ring-1 ' +
                            (errorMessage
                              ? 'border-[var(--color-danger)] bg-[var(--color-danger-bg)] text-[var(--color-danger)] focus:ring-[var(--color-danger)]'
                              : 'border-transparent bg-transparent focus:border-[var(--color-gold)] focus:ring-[var(--color-gold)]')
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
