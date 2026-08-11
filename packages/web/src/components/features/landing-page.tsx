import { useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  Users,
  Calculator,
  Receipt,
  ShieldCheck,
  Download,
  Wifi,
  FileText,
  UserCheck,
  Banknote,
  History,
  Sparkles,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <img src="/logo-full.svg" alt="Theobase" className="h-4 w-auto dark:hidden sm:h-5" />
          <img src="/logo-full-light.svg" alt="Theobase" className="hidden h-4 w-auto dark:block sm:h-5" />
          <div className="flex items-center gap-2 sm:gap-4">
            <button type="button" onClick={() => navigate({ to: '/login' })} className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 sm:px-4 dark:text-neutral-400 dark:hover:text-neutral-100">
              Sign in
            </button>
            <button type="button" onClick={() => navigate({ to: '/church/register' })} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] sm:px-5 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
              Register
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-neutral-100 dark:border-neutral-800">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-white dark:from-brand-950 dark:via-neutral-950 dark:to-neutral-950" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:pt-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Now serving churches in the Pacific
              </div>
              <h1 className="font-heading text-3xl font-bold leading-tight tracking-wide text-neutral-900 sm:text-4xl lg:text-5xl dark:text-neutral-100">
                Membership. Giving. Reports. Built for the way SDA churches work.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-400">
                From the counting room to the conference — the one place your
                church officers can count on. Free for every local church.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => navigate({ to: '/church/register' })} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/10 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/20 active:scale-[0.98]">
                  Set up your church
                  <ArrowRight className="h-5 w-5" />
                </button>
                <p className="text-sm text-neutral-400">
                  Free for your church. $3/month paid by the Conference.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-wide text-neutral-900 sm:text-3xl dark:text-neutral-100">
                Where we&rsquo;re headed
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                From paper notebooks to a platform every church officer opens on
                Sabbath morning. Starting in the Pacific, expanding conference by
                conference.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-warning-light text-warning-700 dark:bg-warning-900/40 dark:text-warning-400">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                  Today
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Paper notebooks in the counting room. Membership rolls re-typed
                  into Excel. Quarterly reports assembled by hand. Hours of
                  paperwork every week.
                </p>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 shadow-sm sm:p-8 dark:border-brand-800 dark:bg-brand-950/30">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                  Tomorrow
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Dual-signoff enforced by software. Reports that fill themselves
                  out. A platform that works offline, scales globally, and belongs
                  to the church.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-100 bg-neutral-50 py-20 dark:border-neutral-800 dark:bg-neutral-900/20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-wide text-neutral-900 sm:text-3xl dark:text-neutral-100">
                How church officers use it
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                  For the Clerk
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Track baptisms, transfers, and membership changes as they
                  happen. When the Conference asks for the annual statistical
                  report, it&rsquo;s already complete.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-400">
                  <Calculator className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                  For the Counting Room
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Two counters enter amounts on a large, easy-to-tap keypad.
                  Totals are compared. Match? Batch locks forever. Mismatch?
                  Reconciled side by side.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:col-span-2 lg:col-span-1">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success-light text-success-700 dark:bg-green-900/40 dark:text-success">
                  <Receipt className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                  For the Treasurer
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Giving records flow from the counting room automatically. The
                  tithe remittance statement is pre-computed from live data. You
                  review and approve.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400">
                  <Wifi className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                    Works offline. Syncs when you reconnect.
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Count offerings, update records, review reports — everything
                    functions without internet. Changes sync automatically when
                    you&rsquo;re back online. Nothing is lost.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-wide text-neutral-900 sm:text-3xl dark:text-neutral-100">
                What makes it different
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                  Built for SDA polity
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Dual-signoff isn&rsquo;t a setting — it&rsquo;s the only way a
                  batch works. Fourteen role types, each seeing exactly what their
                  job requires. The software enforces the polity.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                  No IT department needed
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Sign up in 30 seconds. Upload your membership roll as a CSV or
                  add members one at a time. First-time counters open the app with
                  zero training.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400">
                  <Download className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                  Your data stays yours
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Export your full membership roll, giving history, and audit
                  trail as CSV or JSON at any time. No lock-in. No contract. The
                  Conference sees aggregates only.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                  Permanent audit trail
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Every action leaves an unalterable trail — who changed what,
                  when, and why. Tamper with a record and it breaks the chain,
                  detectable instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-100 bg-neutral-50 py-20 dark:border-neutral-800 dark:bg-neutral-900/20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-lg text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success-light px-4 py-1.5 text-xs font-semibold text-success-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                <Banknote className="h-3.5 w-3.5" />
                Simple, transparent pricing
              </div>
              <h2 className="font-heading text-2xl font-bold tracking-wide text-neutral-900 sm:text-3xl dark:text-neutral-100">
                $3 per church. Per month.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                Or $30/year. The Conference subscribes — individual churches never
                see a bill. Every church gets the full platform. Cancel and export
                your data anytime.
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

      <footer className="border-t border-neutral-100 py-10 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
