import { useCallback, useEffect, useState } from 'react'
import { fetchMissionExceptions, fetchMissionSettings, type MissionExceptions } from '../../lib/missions'
import { type CurrentAccount, getCurrentAccount } from '../../lib/session'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

// The one-tap filtered view CONTEXT.md calls for, separate from
// sorting the full roster (#20, not yet built) — a CFO or Mission
// staffer needs to see what currently needs attention without paging
// through ~400 churches. Two independently-computed "overdue" signals
// (see db/missions.ts's getMissionExceptions for why they're not
// unified) plus unresolved discrepancies.
export function MissionExceptionsTab() {
  const [account, setAccount] = useState<CurrentAccount | null | undefined>(undefined)
  const [exceptions, setExceptions] = useState<MissionExceptions | null>(null)
  const [thresholdDays, setThresholdDays] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const acc = await getCurrentAccount()
      setAccount(acc)
      if (acc?.accountType === 'institutional' && (acc.role === 'mission_admin' || acc.role === 'mission_staff')) {
        const [exc, { settings }] = await Promise.all([fetchMissionExceptions(), fetchMissionSettings()])
        setExceptions(exc)
        setThresholdDays(settings.stuckReconciliationThresholdDays)
      }
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (error) {
    return <p className="p-4 text-sm text-red-700">{error}</p>
  }
  if (account === undefined) {
    return <p className="p-4 text-sm text-neutral-600">Loading…</p>
  }
  if (account === null) {
    return <p className="p-4 text-sm text-neutral-600">Log in to view this.</p>
  }
  const isMissionActor =
    account.accountType === 'institutional' && (account.role === 'mission_admin' || account.role === 'mission_staff')
  if (!isMissionActor) {
    return <p className="p-4 text-sm text-neutral-600">This view is for Mission Admin and Mission Staff accounts.</p>
  }
  if (exceptions === null) {
    return <p className="p-4 text-sm text-neutral-600">Loading…</p>
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-16">
      <h2 className="text-xl font-semibold">Exceptions</h2>

      <section className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">Missing weekly count ({exceptions.missingCount.length})</h3>
        {exceptions.missingCount.length === 0 ? (
          <p className="text-sm text-neutral-500">No churches have missed 2 consecutive Sabbaths.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {exceptions.missingCount.map((item) => (
              <li key={item.churchId} className="rounded-lg bg-red-50 p-3 text-sm">
                <span className="font-medium">{item.churchName}</span> — no count for{' '}
                {item.missedSabbaths.slice().reverse().join(' or ')}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">
          Stuck reconciliation ({exceptions.stuckReconciliation.length})
          {thresholdDays !== null && (
            <span className="ml-1 text-xs font-normal text-neutral-500">
              — flagged past {thresholdDays} days in Submitted or In Transit
            </span>
          )}
        </h3>
        {exceptions.stuckReconciliation.length === 0 ? (
          <p className="text-sm text-neutral-500">No reconciliations are stuck.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {exceptions.stuckReconciliation.map((item) => (
              <li key={item.reconciliationId} className="rounded-lg bg-amber-50 p-3 text-sm">
                <a href={`?count=${item.countId}`} className="text-brand font-medium underline">
                  {item.churchName}
                </a>{' '}
                — {item.status === 'submitted' ? 'Submitted' : 'In Transit'} for {item.daysStuck} days
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">Unresolved discrepancies ({exceptions.discrepancies.length})</h3>
        {exceptions.discrepancies.length === 0 ? (
          <p className="text-sm text-neutral-500">No unresolved discrepancies.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {exceptions.discrepancies.map((item) => (
              <li key={item.reconciliationId} className="rounded-lg bg-red-50 p-3 text-sm">
                <a href={`?count=${item.countId}`} className="text-brand font-medium underline">
                  {item.churchName}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
