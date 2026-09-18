import { useEffect, useState } from 'react'
import { getMostRecentSaturday } from '../../lib/date'
import { getCachedCategories, saveLocalCount } from '../../lib/db'
import { refreshCategories, syncPendingCounts } from '../../lib/sync'

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

// The Treasurer's core weekly task — see CONTEXT.md > UI/UX >
// Count-entry form. One scrollable screen, every active category at
// once, mirrors the paper "Treasurer's Cash Statement" rather than a
// step-by-step wizard. Saves locally first, unconditionally; syncing
// to the server is a best-effort side effect of submitting; whether it
// succeeds or the device is offline for weeks makes no difference to
// whether the count is safely recorded.
export function CountEntryForm() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [sabbathDate, setSabbathDate] = useState(() => getMostRecentSaturday())
  const [amounts, setAmounts] = useState<Record<number, string>>({})
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categories) return

    const lines = categories.map((c) => ({
      fundCategoryId: c.id,
      categoryName: c.name,
      amountCents: centsFromInput(amounts[c.id] ?? ''),
    }))

    await saveLocalCount({
      clientRecordId: crypto.randomUUID(),
      sabbathDate,
      recordedAt: new Date().toISOString(),
      lines,
    })

    setAmounts({})
    setSavedMessage('Saved. Will sync automatically once online.')

    // Best-effort, fire-and-forget — a failure here (offline, or a
    // transient server error) leaves the record safely queued for the
    // next attempt. The form has already done its job by saving locally.
    void syncPendingCounts()
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 pb-28">
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
