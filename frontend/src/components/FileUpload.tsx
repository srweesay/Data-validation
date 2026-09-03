import { useCallback, useRef, useState } from 'react'
import { UploadCloud, FileSpreadsheet, AlertTriangle } from 'lucide-react'

const ACCEPTED_EXT = ['.xlsx', '.xls', '.csv']
const MAX_SIZE_BYTES = 20 * 1024 * 1024

export function FileUpload({
  onFile,
  isBusy,
}: {
  onFile: (file: File) => void
  isBusy: boolean
}) {
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndEmit = useCallback(
    (file: File | undefined) => {
      if (!file) return
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ACCEPTED_EXT.includes(ext)) {
        setLocalError(`Unsupported file type "${ext}". Please upload .xlsx, .xls, or .csv`)
        return
      }
      if (file.size > MAX_SIZE_BYTES) {
        setLocalError(
          `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB, which exceeds the 20MB limit.`
        )
        return
      }
      setLocalError(null)
      onFile(file)
    },
    [onFile]
  )

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          validateAndEmit(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        className={
          'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors ' +
          (dragOver
            ? 'border-[var(--color-gold)] bg-[var(--color-gold-light)]/10'
            : 'border-[var(--color-accent)]/30 bg-white hover:border-[var(--color-gold)]/60')
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT.join(',')}
          className="hidden"
          onChange={(e) => validateAndEmit(e.target.files?.[0])}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-ink)]">
          <UploadCloud className="h-7 w-7 text-[var(--color-gold)]" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-[var(--color-ink)]">
            {isBusy ? 'Uploading and validating…' : 'Drop your investor data file here'}
          </p>
          <p className="mt-1 text-sm text-slate-500">or click to browse — .xlsx, .xls, .csv up to 20MB</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <FileSpreadsheet className="h-4 w-4" />
          Supports 500+, 1,000+, and 5,000+ record files
        </div>
      </div>
      {localError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{localError}</span>
        </div>
      )}
    </div>
  )
}
