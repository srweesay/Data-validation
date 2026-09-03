import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ValidationErrorItem } from '#/lib/types'

const columnHelper = createColumnHelper<ValidationErrorItem>()

export function ErrorTable({
  errors,
  onCorrect,
}: {
  errors: ValidationErrorItem[]
  onCorrect: (row: number, column: string, value: string) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'row', desc: false }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilter, setColumnFilter] = useState('all')

  const columnOptions = useMemo(
    () => Array.from(new Set(errors.map((e) => e.column))).sort(),
    [errors]
  )

  const filteredByColumn = useMemo(
    () => (columnFilter === 'all' ? errors : errors.filter((e) => e.column === columnFilter)),
    [errors, columnFilter]
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('row', {
        header: 'Row',
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
        size: 70,
      }),
      columnHelper.accessor('column', {
        header: 'Column',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('value', {
        header: 'Current Value',
        cell: (info) => {
          const item = info.row.original
          return (
            <input
              defaultValue={String(item.value ?? '')}
              onBlur={(e) => onCorrect(item.row, item.column, e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-[var(--color-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]"
            />
          )
        },
      }),
      columnHelper.accessor('message', {
        header: 'Error Description',
        cell: (info) => (
          <span className="text-[var(--color-danger)]">{info.getValue()}</span>
        ),
      }),
    ],
    [onCorrect]
  )

  const table = useReactTable({
    data: filteredByColumn,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  if (errors.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-bg)] p-8 text-center">
        <p className="font-display text-lg font-semibold text-[var(--color-success)]">
          No validation errors found
        </p>
        <p className="mt-1 text-sm text-slate-600">Every row passed all validation rules.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search errors…"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-[var(--color-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]"
          />
        </div>
        <select
          value={columnFilter}
          onChange={(e) => setColumnFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[var(--color-gold)] focus:outline-none"
        >
          <option value="all">All columns ({errors.length})</option>
          {columnOptions.map((col) => (
            <option key={col} value={col}>
              {col} ({errors.filter((e) => e.column === col).length})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="cursor-pointer select-none whitespace-nowrap px-4 py-3"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-[var(--color-gold-light)]/10">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 p-4 text-sm text-slate-600">
        <span>
          Showing{' '}
          <span className="font-medium text-slate-900">
            {table.getRowModel().rows.length === 0
              ? 0
              : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            –
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredByColumn.length
            )}
          </span>{' '}
          of <span className="font-medium text-slate-900">{filteredByColumn.length}</span> errors
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="tabular-nums">
            Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
