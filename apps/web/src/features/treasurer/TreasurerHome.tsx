import { useEffect, useState } from 'react'
import { ChurchRecordsView } from '../churches/ChurchRecordsView'
import { CountEntryForm } from '../counts/CountEntryForm'
import { SyncStatusIndicator } from '../sync/SyncStatusIndicator'
import { type ChurchRecord, fetchChurchRecords } from '../../lib/churches'
import { type CurrentAccount, getCurrentAccount } from '../../lib/session'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

type Tab = 'home' | 'entry' | 'history'

// Task-first home screen — see CONTEXT.md > UI/UX > Treasurer home
// screen: the dominant, default action is "Enter this week's count";
// history, reports, and status live are secondary, reached via
// navigation rather than competing for the landing screen. Attention
// cards (a flagged, unresolved discrepancy) link straight to that
// record's detail screen, skipping the history list — the fastest
// path from "something needs attention" to the actual record.
//
// "A pending sign-off" is CONTEXT.md's other named example of an
// attention-card item, but dual sign-off (#12) has no persisted
// pending state to surface here: the treasurer and co-signer complete
// it together, synchronously, on one device, before the record is
// ever saved at all — there's nothing left "pending" once a count
// exists to show a card for. This only ever renders discrepancy cards
// as a result, not a gap in this screen.
export function TreasurerHome() {
  const [account, setAccount] = useState<CurrentAccount | null | undefined>(undefined)
  const [records, setRecords] = useState<ChurchRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('home')

  useEffect(() => {
    async function load() {
      try {
        const acc = await getCurrentAccount()
        setAccount(acc)
        if (acc?.accountType === 'local' && acc.role === 'treasurer') {
          const { records } = await fetchChurchRecords()
          setRecords(records)
        }
      } catch (err) {
        setError(errorMessage(err))
      }
    }
    void load()
  }, [])

  if (error) {
    return <p className="p-4 text-sm text-red-700">{error}</p>
  }
  if (account === undefined) {
    return <p className="p-4 text-sm text-neutral-600">Loading…</p>
  }
  if (account === null) {
    return <p className="p-4 text-sm text-neutral-600">Log in to view this.</p>
  }
  if (account.accountType !== 'local' || account.role !== 'treasurer') {
    return <p className="p-4 text-sm text-neutral-600">This screen is for Treasurer accounts.</p>
  }

  if (tab === 'entry') {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setTab('home')} className="px-4 pt-4 text-left text-sm text-neutral-500">
          ← Back to Home
        </button>
        <SyncStatusIndicator />
        <CountEntryForm />
      </div>
    )
  }

  if (tab === 'history') {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setTab('home')} className="px-4 pt-4 text-left text-sm text-neutral-500">
          ← Back to Home
        </button>
        <h2 className="px-4 text-lg font-semibold">Records</h2>
        <ChurchRecordsView />
      </div>
    )
  }

  const attention = (records ?? []).filter((r) => r.hasDiscrepancy && !r.discrepancyResolvedAt)

  return (
    <div className="flex flex-col gap-4 p-4">
      <SyncStatusIndicator />

      {attention.length > 0 && (
        <section className="flex flex-col gap-2">
          {attention.map((record) => (
            <a
              key={record.countId}
              href={`?count=${record.countId}`}
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              Discrepancy flagged on the {record.sabbathDate} count — tap to view
            </a>
          ))}
        </section>
      )}

      <button
        type="button"
        onClick={() => setTab('entry')}
        className="bg-brand rounded-lg p-6 text-xl font-semibold text-white"
      >
        Enter this week's count
      </button>

      <button
        type="button"
        onClick={() => setTab('history')}
        className="rounded-lg border border-neutral-300 p-3 text-base font-medium text-neutral-700"
      >
        Records &amp; history
      </button>
    </div>
  )
}
