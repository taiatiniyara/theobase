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
            <button
              type="button"
              onClick={() => navigate({ to: '/login' })}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/church/register' })}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              Register your church
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-neutral-100 dark:border-neutral-800">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-24 sm:pb-32 sm:pt-32">
            <div className="mx-auto max-w-2xl">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Church management platform &middot; 215+ countries &middot; offline-first
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-neutral-100">
                Most churches still count offerings on paper.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                Two deacons. A calculator. A notebook. It takes 45 minutes each Sabbath. 
                And if the totals don't match, they start over. Theobase replaces that — 
                built for the counting room, the clerk's desk, and the 3G connection in Suva.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => navigate({ to: '/church/register' })}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/10 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/20 active:scale-[0.98]"
                >
                  Set up your church
                  <ArrowRight className="h-5 w-5" />
                </button>
                <p className="text-sm text-neutral-400">
                  Free for your local church. $3/month billed to the Conference.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  How it works
                </p>
              </div>
              <div className="lg:col-span-2 space-y-16">
                <div className="group">
                  <div className="mb-4 text-5xl font-bold text-neutral-100 transition-colors group-hover:text-brand-100 dark:text-neutral-800 dark:group-hover:text-brand-900">
                    01
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    A clerk registers the church in 30 seconds.
                  </h3>
                  <p className="mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
                    No sales call. No demo. The clerk enters the church name and address. 
                    The system provisions a Durable Object — one per church. The clerk gets 
                    full access and starts inviting the treasurer and counters.
                  </p>
                </div>

                <div className="group">
                  <div className="mb-4 text-5xl font-bold text-neutral-100 transition-colors group-hover:text-brand-100 dark:text-neutral-800 dark:group-hover:text-brand-900">
                    02
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Upload the membership roll as a CSV.
                  </h3>
                  <p className="mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Drop the spreadsheet you already have. The system parses every row, 
                    validates names and dates, and flags anything it can't resolve. 
                    You review the flagged rows and import the rest in one click.
                  </p>
                </div>

                <div className="group">
                  <div className="mb-4 text-5xl font-bold text-neutral-100 transition-colors group-hover:text-brand-100 dark:text-neutral-800 dark:group-hover:text-brand-900">
                    03
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Count today's offering. Two people. One batch.
                  </h3>
                  <p className="mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Two counters open the app. Each enters their tally independently on a 
                    large custom keypad. The system compares. If they match, the batch is 
                    committed and becomes immutable. If they don't, the system shows the 
                    discrepancy side by side until both counters reconcile.
                  </p>
                </div>

                <div className="group">
                  <div className="mb-4 text-5xl font-bold text-neutral-100 transition-colors group-hover:text-brand-100 dark:text-neutral-800 dark:group-hover:text-brand-900">
                    04
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Reports appear fully populated. You review and approve.
                  </h3>
                  <p className="mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
                    The annual statistical report. The tithe remittance statement. The monthly 
                    financial summary. All derived from live data. No copying numbers into Excel. 
                    No assembling reports by hand. The system produces the output — you sign off.
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
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Built for real churches
                </p>
              </div>
              <div className="lg:col-span-2 space-y-12">
                <div className="grid gap-8 sm:grid-cols-2">
                  {[
                    { value: 'Offline-first', label: 'No internet? No problem. The app works offline and syncs when you reconnect. Built for churches on 3G in the Pacific.' },
                    { value: 'Dual-signoff', label: 'SDA policy encoded in software. Two counters must independently confirm every batch. No exceptions.' },
                    { value: '14 role types', label: 'Clerk, treasurer, counter, pastor, board member, auditor — each sees exactly what their role permits. Conference admins see aggregates only.' },
                    { value: 'Immutable records', label: 'Every mutation is an append-only event with a SHA-256 hash chain. Tampering is detectable by construction.' },
                    { value: 'Self-teaching', label: 'No manual. No training. Every screen guides you to the next action. A first-time counter opens the app and counts today\'s offering.' },
                    { value: 'Data portability', label: 'Export your full membership roll, giving history, and audit trail as CSV or JSON at any time. No lock-in. Ever.' },
                  ].map((item) => (
                    <div key={item.value}>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.value}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                Pricing
              </p>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                $3 per church. Per month.
              </h2>
              <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
                Or $30/year. The Conference subscribes. Individual churches never receive a bill. 
                No feature gates — every church gets the full platform. Cancel anytime. 
                Export your data. No lock-in.
              </p>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => navigate({ to: '/church/register' })}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/10 transition-all hover:bg-brand-700 active:scale-[0.98]"
                >
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
              <button type="button" onClick={() => navigate({ to: '/login' })} className="hover:text-neutral-600 dark:hover:text-neutral-300">Sign in</button>
              <button type="button" onClick={() => navigate({ to: '/church/register' })} className="hover:text-neutral-600 dark:hover:text-neutral-300">Register</button>
            </div>
            <p className="text-xs text-neutral-400">&copy; {new Date().getFullYear()} Theobase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
