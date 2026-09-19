import { useEffect, useState } from 'react'
import { getMostRecentSaturday } from '../../lib/date'
import { getCachedCategories, getChurchContext, saveLocalCount } from '../../lib/db'
import { verifyPin } from '../../lib/pinVerification'
import { refreshCategories, syncPendingCounts } from '../../lib/sync'
import { isEligibleCoSigner } from './coSignEligibility'

interface Category {
  id: number
  name: string
  isTithe: boolean
}

function centsFromInput(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type Step =
  | { name: 'amounts' }
  | { name: 'cosign'; lines: { fundCategoryId: number; categoryName: string; amountCents: number }[] }

// The Treasurer's core weekly task — see CONTEXT.md > UI/UX >
// Count-entry form. One scrollable screen, every active category at
// once, mirrors the paper "Treasurer's Cash Statement" rather than a
// step-by-step wizard. Saves locally first, unconditionally; syncing
// to the server is a best-effort side effect of submitting; whether it
// succeeds or the device is offline for weeks makes no difference to
// whether the count is safely recorded.
//
// Dual sign-off (#12): tapping "Save" doesn't save yet — it moves to a
// second screen ("hand the phone to your co-signer") that collects a
// second PIN on this same device. Only once that PIN verifies (online
// or from an already-earned offline cache, see pinVerification.ts) AND
// the co-signer is eligible does the record actually get saved; per
// CONTEXT.md, a count "is not considered entered" before that happens.
export function CountEntryForm() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [sabbathDate, setSabbathDate] = useState(() => getMostRecentSaturday())
  const [amounts, setAmounts] = useState<Record<number, string>>({})
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [step, setStep] = useState<Step>({ name: 'amounts' })
  const [coSignPhone, setCoSignPhone] = useState('')
  const [coSignPin, setCoSignPin] = useState('')
  const [coSignError, setCoSignError] = useState<string | null>(null)
  const [coSignBusy, setCoSignBusy] = useState(false)

  useEffect(() => {
    // Cache-first render (works offline, including with zero
    // connectivity so far this session), then refresh from the
    // network and re-render if that lands something new — two
    // separate steps, both driving the same state, so a fresh cache
    // update is never silently invisible to the UI.
    getCachedCategories().then(setCategories)
    refreshCategories()
      .then(() => getCachedCategories())
      .then(setCategories)
      .catch(() => {
        // Offline, or the request failed — whatever's cached (possibly
        // nothing, on a first-ever run with no connectivity) stands.
      })
  }, [])

  const totalCents = Object.values(amounts).reduce((sum, v) => sum + centsFromInput(v), 0)

  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!categories) return

    const lines = categories.map((c) => ({
      fundCategoryId: c.id,
      categoryName: c.name,
      amountCents: centsFromInput(amounts[c.id] ?? ''),
    }))

    setCoSignPhone('')
    setCoSignPin('')
    setCoSignError(null)
    setStep({ name: 'cosign', lines })
  }

  function handleBackToAmounts() {
    setStep({ name: 'amounts' })
  }

  async function handleCoSign(e: React.FormEvent) {
    e.preventDefault()
    if (step.name !== 'cosign') return
    setCoSignBusy(true)
    setCoSignError(null)

    try {
      const context = await getChurchContext()
      if (!context) {
        setCoSignError('Connect to the internet at least once before entering a count.')
        return
      }

      const result = await verifyPin(coSignPhone, coSignPin)
      if (!result.ok) {
        setCoSignError(
          result.reason === 'locked'
            ? 'Too many failed attempts. Try again later.'
            : result.reason === 'unavailable_offline'
              ? "This co-signer hasn't verified their PIN on this device before, and there's no internet connection right now."
              : 'Incorrect PIN.',
        )
        return
      }

      const eligible = isEligibleCoSigner(
        { accountId: result.accountId, role: result.role, churchId: result.churchId, districtId: result.districtId },
        {
          treasurerAccountId: context.treasurerAccountId,
          churchId: context.churchId,
          districtId: context.districtId,
        },
      )
      if (!eligible) {
        setCoSignError('This account is not eligible to co-sign this count.')
        return
      }

      await saveLocalCount({
        clientRecordId: crypto.randomUUID(),
        sabbathDate,
        recordedAt: new Date().toISOString(),
        coSignerAccountId: result.accountId,
        lines: step.lines,
      })

      setAmounts({})
      setStep({ name: 'amounts' })
      setSavedMessage(`Saved and confirmed by ${result.displayName}. Will sync automatically once online.`)

      // Best-effort, fire-and-forget — a failure here (offline, or a
      // transient server error) leaves the record safely queued for the
      // next attempt. The form has already done its job by saving locally.
      void syncPendingCounts()
    } finally {
      setCoSignBusy(false)
    }
  }

  if (categories === null) {
    return <p className="p-4 text-sm text-neutral-600">Loading…</p>
  }

  if (categories.length === 0) {
    return (
      <p className="p-4 text-sm text-neutral-600">
        No fund categories available yet. Connect to the internet at least once to load them.
      </p>
    )
  }

  if (step.name === 'cosign') {
    return (
      <form onSubmit={handleCoSign} className="flex flex-col gap-4 p-4 pb-28">
        <div className="rounded-lg bg-neutral-100 p-4 text-sm text-neutral-700">
          Hand the phone to a second counter. They should enter their own phone number and PIN to
          confirm this count.
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Co-signer's phone number</span>
          <input
            type="tel"
            value={coSignPhone}
            onChange={(e) => setCoSignPhone(e.target.value)}
            className="rounded-lg border border-neutral-300 p-3 text-lg"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Co-signer's PIN</span>
          <input
            type="password"
            inputMode="numeric"
            value={coSignPin}
            onChange={(e) => setCoSignPin(e.target.value)}
            className="rounded-lg border border-neutral-300 p-3 text-lg"
            required
          />
        </label>

        {coSignError && <p className="text-sm text-red-700">{coSignError}</p>}

        <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md flex-col gap-2 border-t border-neutral-300 bg-white p-4">
          <button
            type="submit"
            disabled={coSignBusy}
            className="bg-brand rounded-lg p-4 text-lg font-semibold text-white disabled:opacity-50"
          >
            {coSignBusy ? 'Checking…' : 'Confirm count'}
          </button>
          <button
            type="button"
            onClick={handleBackToAmounts}
            disabled={coSignBusy}
            className="rounded-lg p-3 text-base font-medium text-neutral-600"
          >
            Back
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleContinue} className="flex flex-col gap-4 p-4 pb-28">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Sabbath date</span>
        <input
          type="date"
          value={sabbathDate}
          onChange={(e) => setSabbathDate(e.target.value)}
          className="rounded-lg border border-neutral-300 p-3 text-lg"
          required
        />
      </label>

      {categories.map((category) => (
        <label key={category.id} className="flex flex-col gap-1">
          <span className="text-base font-medium text-neutral-800">
            {category.name}
            {category.isTithe && <span className="ml-1 text-xs text-neutral-500">(remitted up)</span>}
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amounts[category.id] ?? ''}
            onChange={(e) => setAmounts((prev) => ({ ...prev, [category.id]: e.target.value }))}
            className="rounded-lg border border-neutral-300 p-4 text-2xl tabular-nums"
          />
        </label>
      ))}

      <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md flex-col gap-2 border-t border-neutral-300 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-neutral-600">Total</span>
          <span className="text-2xl font-semibold tabular-nums">${formatCents(totalCents)}</span>
        </div>
        <button
          type="submit"
          className="bg-brand rounded-lg p-4 text-lg font-semibold text-white"
        >
          Save this week's count
        </button>
        {savedMessage && <p className="text-sm text-green-700">{savedMessage}</p>}
      </div>
    </form>
  )
}
