import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { AlertCircle, CheckCircle2, Download, FileDown, RefreshCw, ShieldAlert } from 'lucide-react'
import { PortalHeader } from '#/components/PortalHeader'
import { FileUpload } from '#/components/FileUpload'
import { SummaryCards } from '#/components/SummaryCards'
import { MissingColumnsBanner } from '#/components/MissingColumnsBanner'
import { ErrorTable } from '#/components/ErrorTable'
import { ErrorWalker } from '#/components/ErrorWalker'
import { DataGrid } from '#/components/DataGrid'
import { parseFile, revalidate, downloadFile } from '#/lib/api'
import type { RowRecord, ValidationResult, WizardStep } from '#/lib/types'

export const Route = createFileRoute('/')({ component: DataValidationPortal })

function DataValidationPortal() {
  const [step, setStep] = useState<WizardStep>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<RowRecord[]>([])
  const [fileName, setFileName] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [correctionView, setCorrectionView] = useState<'walker' | 'list'>('walker')

  const handleFile = useCallback(async (file: File) => {
    setIsBusy(true)
    setError(null)
    try {
      const parsed = await parseFile(file)
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setFileName(parsed.fileName)
      setValidation(null)
      setIsDirty(false)
      setStep('workspace')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file.')
    } finally {
      setIsBusy(false)
    }
  }, [])

  const handleCellChange = useCallback((rowIndex: number, column: string, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === rowIndex ? { ...r, [column]: value } : r)))
    setIsDirty(true)
  }, [])

  const handleErrorTableCorrect = useCallback(
    (row: number, column: string, value: string) => {
      handleCellChange(row - 1, column, value)
    },
    [handleCellChange]
  )

  const handleValidate = useCallback(async () => {
    setIsBusy(true)
    setError(null)
    try {
      const res = await revalidate(headers, rows)
      setValidation(res)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate data.')
    } finally {
      setIsBusy(false)
    }
  }, [headers, rows])

  const handleDownload = useCallback(
    async (format: 'xlsx' | 'csv') => {
      setIsBusy(true)
      setError(null)
      try {
        await downloadFile(headers, rows, format)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to export file.')
      } finally {
        setIsBusy(false)
      }
    },
    [headers, rows]
  )

  const startOver = useCallback(() => {
    setStep('upload')
    setHeaders([])
    setRows([])
    setFileName('')
    setValidation(null)
    setIsDirty(false)
  }, [])

  const readyToDownload = !!validation && validation.canDownload && !isDirty

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <PortalHeader step={step} />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {step === 'upload' && (
          <section>
            <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">Upload investor data</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Upload the Excel or CSV file containing investor onboarding data. It will open right here in
              the portal so you can validate and correct it before it goes into the CSD system.
            </p>
            <div className="mt-6">
              <FileUpload onFile={handleFile} isBusy={isBusy} />
            </div>
          </section>
        )}

        {step === 'workspace' && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">{fileName}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {validation
                    ? isDirty
                      ? 'You have unsaved edits — click Revalidate Data to refresh the results.'
                      : validation.canDownload
                      ? 'All rows passed validation.'
                      : 'Fix the highlighted cells below, then revalidate.'
                    : 'Review the data below, then click Validate Data to check it.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleValidate}
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-md bg-[var(--color-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-gold-dark)] hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={'h-4 w-4 ' + (isBusy ? 'animate-spin' : '')} />
                  {validation ? 'Revalidate Data' : 'Validate Data'}
                </button>
                <button
                  onClick={startOver}
                  className="text-sm font-medium text-slate-500 underline-offset-2 hover:underline"
                >
                  Start over
                </button>
              </div>
            </div>

            {validation && <SummaryCards summary={validation.summary} />}

            {validation && validation.columnValidation.missingColumns.length > 0 && (
              <MissingColumnsBanner missingColumns={validation.columnValidation.missingColumns} />
            )}

            {readyToDownload && (
              <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-bg)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--color-success)]" />
                    <div>
                      <p className="font-display font-semibold text-[var(--color-success)]">
                        Validation successful — error count: 0
                      </p>
                      <p className="text-sm text-slate-600">Your file is ready to download.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDownload('xlsx')}
                      disabled={isBusy}
                      className="flex items-center gap-2 rounded-md bg-[var(--color-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-gold-dark)] hover:text-white disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      Download Clean File (.xlsx)
                    </button>
                    <button
                      onClick={() => handleDownload('csv')}
                      disabled={isBusy}
                      className="flex items-center gap-2 rounded-md border border-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)] hover:text-white disabled:opacity-50"
                    >
                      <FileDown className="h-4 w-4" />
                      Download as .csv
                    </button>
                  </div>
                </div>
              </div>
            )}

            {validation && validation.errors.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-gold-light)]/20 px-4 py-3 text-sm text-[var(--color-gold-dark)]">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                Fix each error below, then click "Revalidate Data" to confirm. The full spreadsheet with
                red-highlighted cells is further down for reference.
              </div>
            )}

            {validation && validation.errors.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                    Fix errors
                  </h3>
                  <div className="flex overflow-hidden rounded-md border border-slate-300 text-sm">
                    <button
                      onClick={() => setCorrectionView('walker')}
                      className={
                        'px-3 py-1.5 font-medium transition ' +
                        (correctionView === 'walker'
                          ? 'bg-[var(--color-ink)] text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50')
                      }
                    >
                      Step through
                    </button>
                    <button
                      onClick={() => setCorrectionView('list')}
                      className={
                        'px-3 py-1.5 font-medium transition ' +
                        (correctionView === 'list'
                          ? 'bg-[var(--color-ink)] text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50')
                      }
                    >
                      Full list
                    </button>
                  </div>
                </div>
                {correctionView === 'walker' ? (
                  <ErrorWalker errors={validation.errors} onCorrect={handleErrorTableCorrect} />
                ) : (
                  <ErrorTable errors={validation.errors} onCorrect={handleErrorTableCorrect} />
                )}
              </div>
            )}

            <DataGrid
              headers={headers}
              rows={rows}
              errors={validation?.errors ?? []}
              onCellChange={handleCellChange}
            />
          </section>
        )}
      </main>
    </div>
  )
}
