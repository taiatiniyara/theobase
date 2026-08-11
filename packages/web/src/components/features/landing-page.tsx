import { useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <img src="/logo-full.svg" alt="Theobase" className="h-5 w-auto dark:hidden" />
          <img src="/logo-full-light.svg" alt="Theobase" className="hidden h-5 w-auto dark:block" />
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate({ to: '/login' })} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
              Sign in
            </button>
            <button type="button" onClick={() => navigate({ to: '/church/register' })} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
              Register your church
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-neutral-100 dark:border-neutral-800">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-24 sm:pb-32 sm:pt-32">
            <div className="mx-auto max-w-2xl">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-neutral-100">
                Church records, membership rolls, and offerings — all in one place.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                No more paper notebooks in the counting room. No more re-typing membership
                rolls into Excel. No more spending Saturday afternoon assembling the quarterly
                report by hand. Theobase handles the paperwork so your officers can focus on people.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button type="button" onClick={() => navigate({ to: '/church/register' })} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/10 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/20 active:scale-[0.98]">
                  Set up your church
                  <ArrowRight className="h-5 w-5" />
                </button>
                <p className="text-sm text-neutral-400">
                  Free for your local church. $3/month paid by the Conference.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  How church officers use it
                </h2>
              </div>
              <div className="lg:col-span-2 space-y-20">
                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    For the Church Clerk
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    The annual statistical report fills itself out.
                  </h3>
                  <p className="mt-2 leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Every baptism, transfer, and membership change is tracked as it happens.
                    When the Conference asks for the annual report, it's already complete —
                    every quarter, every number, every name. You review the numbers and submit.
                    No Excel. No copying.
                  </p>
                  <p className="mt-3 text-sm text-neutral-400">
                    Upload your existing membership roll as a CSV. The system parses it, validates 
                    every row, and flags anything it can't resolve for you to review.
                  </p>
                </div>

                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-warning-700 dark:text-warning-400">
                    For the Counting Room
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Two people count. The system checks the math.
                  </h3>
                  <p className="mt-2 leading-relaxed text-neutral-500 dark:text-neutral-400">
                    After the service, two counters open the app on their phones. Each enters amounts on
                    a large, easy-to-tap keypad — built for the counting room, not a tiny system keyboard.
                    When both confirm, the totals are compared. If they match, the batch locks forever.
                    If they don't, the difference is shown side by side until you reconcile.
                  </p>
                  <p className="mt-3 text-sm text-neutral-400">
                    No more re-counting the whole stack because one envelope was missed. 
                    The system spots the discrepancy and shows you exactly where.
                  </p>
                </div>

                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-success-700 dark:text-success">
                    For the Treasurer
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    The tithe remittance statement calculates itself.
                  </h3>
                  <p className="mt-2 leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Every batch committed in the counting room flows directly into the giving records.
                    When it's time to remit tithe to the Conference, the statement is pre-computed
                    from live data. Total tithe collected. Total offerings. Amount to remit. All there.
                    You review and approve. That's it.
                  </p>
                  <p className="mt-3 text-sm text-neutral-400">
                    Mark batches as deposited with the bank. Track which have been remitted and which are pending.
                    Every member's giving history is searchable and exportable.
                  </p>
                </div>

                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    For Everyone
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Works offline. Syncs when you reconnect.
                  </h3>
                  <p className="mt-2 leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Not every church has reliable internet. The app works without a connection.
                    Count offerings, update member records, review reports — everything functions offline.
                    When you're back online, changes sync automatically. Nothing is lost.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-100 bg-neutral-50 py-24 dark:border-neutral-800 dark:bg-neutral-900/30 sm:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  What makes it different
                </h2>
              </div>
              <div className="lg:col-span-2 space-y-10">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    Built for the way SDA churches actually work.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Dual-signoff isn't a setting you enable — it's the only way a batch works. The clerk manages membership, 
                    the treasurer handles money, the counters count. Fourteen role types, each seeing exactly what their
                    job requires. The software enforces the polity, so your officers don't have to police each other.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    No IT department needed.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    A church clerk signs up in 30 seconds. The platform provisions everything automatically. 
                    Upload a CSV of your membership roll if you have one, or add members one at a time.
                    First-time counters open the app and count today's offering with zero training. 
                    Every screen shows you what to do next.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    Your data stays yours. Always.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Export your full membership roll, giving history, and audit trail as CSV or JSON at any time.
                    No lock-in. No contract. Cancel anytime and take your data with you. The Conference
                    sees aggregate numbers — individual member details stay within the local church.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    Every change is permanently recorded.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Who changed this member's status? When was this batch committed? Who approved this report? 
                    Every action leaves an unalterable trail. The audit log shows exactly what happened, 
                    when, and by whom. If someone tries to tamper with a record, it breaks the chain — detectable instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                $3 per church. Per month.
              </h2>
              <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
                Or $30/year. The Conference subscribes — individual churches never receive a bill. 
                Every church gets the full platform. No feature gates. 
                Cancel and export your data anytime.
              </p>
              <div className="mt-8">
                <button type="button" onClick={() => navigate({ to: '/church/register' })} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/10 transition-all hover:bg-brand-700 active:scale-[0.98]">
                  Register your church
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-100 py-12 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <img src="/logo-full.svg" alt="Theobase" className="h-4 w-auto dark:hidden" />
            <img src="/logo-full-light.svg" alt="Theobase" className="hidden h-4 w-auto dark:block" />
            <div className="flex items-center gap-6 text-xs text-neutral-400">
              <button type="button" onClick={() => navigate({ to: '/login' })}>Sign in</button>
              <button type="button" onClick={() => navigate({ to: '/church/register' })}>Register</button>
            </div>
            <p className="text-xs text-neutral-400">&copy; {new Date().getFullYear()} Theobase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
