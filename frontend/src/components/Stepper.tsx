import type { WizardStep } from '#/lib/types'

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'upload', label: 'Upload File' },
  { key: 'workspace', label: 'Validate, Correct & Download' },
]

export function Stepper({ current }: { current: WizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current)
  return (
    <ol className="flex w-full items-center">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx
        const isActive = idx === currentIdx
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-3">
              <span
                className={
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-display text-sm font-semibold tabular-nums ' +
                  (isActive
                    ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-ink)]'
                    : isDone
                    ? 'border-[var(--color-gold)] bg-transparent text-[var(--color-gold)]'
                    : 'border-white/20 text-white/40')
                }
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span
                className={
                  'hidden text-sm font-medium sm:block ' +
                  (isActive ? 'text-white' : isDone ? 'text-[var(--color-gold-light)]' : 'text-white/40')
                }
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={
                  'mx-4 h-px flex-1 ' + (idx < currentIdx ? 'bg-[var(--color-gold)]' : 'bg-white/15')
                }
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
