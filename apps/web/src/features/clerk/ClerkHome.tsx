import { useEffect, useState } from 'react'
import { ChurchRecordsView } from '../churches/ChurchRecordsView'
import {
  type ChurchCategory,
  fetchChurchCategories,
  setChurchCategoryEnabled,
} from '../../lib/churches'
import {
  createChurchAccount,
  editChurchAccount,
  fetchChurchAccounts,
  type LocalAccountSummary,
  type LocalRole,
  requestAccountRemoval,
} from '../../lib/localAccounts'
import { type CurrentAccount, getCurrentAccount } from '../../lib/session'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

type Tab = 'oversight' | 'settings'

function AccountRow({ account, onChanged }: { account: LocalAccountSummary; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(account.displayName)
  const [phone, setPhone] = useState(account.phone)
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await editChurchAccount(account.id, {
        displayName: displayName !== account.displayName ? displayName : undefined,
        phone: phone !== account.phone ? phone : undefined,
        pin: pin.trim() ? pin : undefined,
      })
      setEditing(false)
      setPin('')
      onChanged()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleRequestRemoval() {
    setBusy(true)
    setError(null)
    try {
      await requestAccountRemoval(account.id)
      onChanged()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="flex flex-col gap-2 rounded-lg border border-neutral-300 p-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Name</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-lg border border-neutral-300 p-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-neutral-300 p-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Reset PIN (leave blank to keep current)</span>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="rounded-lg border border-neutral-300 p-2"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="bg-brand rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={busy} className="rounded-lg px-4 py-2 text-neutral-600">
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{account.displayName}</p>
          <p className="text-sm text-neutral-500">
            {account.role} · {account.phone}
            {!account.active && ' · removed'}
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {account.active && (
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-neutral-300 px-3 py-1 text-sm">
            Edit
          </button>
          {account.hasPendingRemovalRequest ? (
            <span className="rounded-lg bg-amber-100 px-3 py-1 text-sm text-amber-700">Removal pending</span>
          ) : (
            <button
              type="button"
              onClick={handleRequestRemoval}
              disabled={busy}
              className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 disabled:opacity-50"
            >
              Request removal
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AddAccountForm({ onCreated }: { onCreated: () => void }) {
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [role, setRole] = useState<LocalRole>('treasurer')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await createChurchAccount({ displayName, phone, pin, role })
      setDisplayName('')
      setPhone('')
      setPin('')
      onCreated()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-neutral-300 p-3">
      <h4 className="font-semibold">Add account</h4>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Name</span>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="rounded-lg border border-neutral-300 p-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Phone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="rounded-lg border border-neutral-300 p-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">PIN</span>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
          className="rounded-lg border border-neutral-300 p-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Role</span>
        <select value={role} onChange={(e) => setRole(e.target.value as LocalRole)} className="rounded-lg border border-neutral-300 p-2">
          <option value="treasurer">Treasurer</option>
          <option value="clerk">Clerk</option>
        </select>
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="bg-brand rounded-lg p-2 font-semibold text-white disabled:opacity-50">
        Add account
      </button>
    </form>
  )
}

function CategoryToggleList() {
  const [categories, setCategories] = useState<ChurchCategory[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    fetchChurchCategories()
      .then(({ categories }) => setCategories(categories))
      .catch((err: unknown) => setError(errorMessage(err)))
  }

  useEffect(load, [])

  async function handleToggle(categoryId: number, enabled: boolean) {
    setError(null)
    try {
      const { categories } = await setChurchCategoryEnabled(categoryId, enabled)
      setCategories(categories)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (error) return <p className="text-sm text-red-700">{error}</p>
  if (categories === null) return <p className="text-sm text-neutral-600">Loading…</p>

  return (
    <ul className="flex flex-col gap-2">
      {categories.map((category) => (
        <li key={category.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
          <span>
            {category.name}
            {category.isTithe && <span className="ml-1 text-xs text-neutral-500">(remitted up)</span>}
          </span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={category.enabled}
              onChange={(e) => handleToggle(category.id, e.target.checked)}
            />
            Active for this church
          </label>
        </li>
      ))}
    </ul>
  )
}

// Clerk's landing screen — see CONTEXT.md > UI/UX > Clerk's role: a
// read-only oversight view by default (the same ChurchRecordsView
// component Treasurer's history tab reuses, #17 — not a separate
// build), with accounts and category toggles living in a settings tab
// since admin actions are infrequent.
export function ClerkHome() {
  const [account, setAccount] = useState<CurrentAccount | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('oversight')
  const [churchAccounts, setChurchAccounts] = useState<LocalAccountSummary[] | null>(null)

  useEffect(() => {
    void getCurrentAccount()
      .then(setAccount)
      .catch((err: unknown) => setError(errorMessage(err)))
  }, [])

  function loadAccounts() {
    fetchChurchAccounts()
      .then(({ accounts }) => setChurchAccounts(accounts))
      .catch((err: unknown) => setError(errorMessage(err)))
  }

  useEffect(() => {
    if (tab === 'settings' && account?.role === 'clerk') {
      loadAccounts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, account])

  if (error) {
    return <p className="p-4 text-sm text-red-700">{error}</p>
  }
  if (account === undefined) {
    return <p className="p-4 text-sm text-neutral-600">Loading…</p>
  }
  if (account === null) {
    return <p className="p-4 text-sm text-neutral-600">Log in to view this.</p>
  }
  if (account.accountType !== 'local' || account.role !== 'clerk') {
    return <p className="p-4 text-sm text-neutral-600">This screen is for Clerk accounts.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 px-4 pt-4">
        <button
          type="button"
          onClick={() => setTab('oversight')}
          className={`rounded-lg px-3 py-1 text-sm font-medium ${tab === 'oversight' ? 'bg-brand text-white' : 'bg-neutral-200 text-neutral-600'}`}
        >
          Records
        </button>
        <button
          type="button"
          onClick={() => setTab('settings')}
          className={`rounded-lg px-3 py-1 text-sm font-medium ${tab === 'settings' ? 'bg-brand text-white' : 'bg-neutral-200 text-neutral-600'}`}
        >
          Settings
        </button>
      </div>

      {tab === 'oversight' && <ChurchRecordsView />}

      {tab === 'settings' && (
        <div className="flex flex-col gap-6 p-4">
          <section className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">Accounts</h3>
            {churchAccounts === null ? (
              <p className="text-sm text-neutral-600">Loading…</p>
            ) : (
              <div className="flex flex-col gap-2">
                {churchAccounts.map((a) => (
                  <AccountRow key={a.id} account={a} onChanged={loadAccounts} />
                ))}
              </div>
            )}
            <AddAccountForm onCreated={loadAccounts} />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">Fund categories</h3>
            <CategoryToggleList />
          </section>
        </div>
      )}
    </div>
  )
}
