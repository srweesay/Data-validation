import { ShieldCheck } from 'lucide-react'
import type { WizardStep } from '#/lib/types'
import { Stepper } from './Stepper'

export function PortalHeader({ step }: { step: WizardStep }) {
  return (
    <header className="ledger-bg bg-[var(--color-ink)]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-gold)]/40 bg-[var(--color-ink-800)]">
            <ShieldCheck className="h-5 w-5 text-[var(--color-gold)]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-gold)]">
              CSD Onboarding
            </p>
            <h1 className="font-display text-xl font-bold text-white">Data Validation Portal</h1>
          </div>
        </div>
        <div className="mt-8">
          <Stepper current={step} />
        </div>
      </div>
    </header>
  )
}
