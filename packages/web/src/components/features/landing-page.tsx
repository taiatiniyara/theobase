import { useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  Calculator,
  Receipt,
  ShieldCheck,
  Download,
  Wifi,
  FileText,
  UserCheck,
  Sparkles,
  History,
} from 'lucide-react';

function WaveDivider() {
  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
      <svg viewBox="0 0 1440 80" className="h-10 w-full sm:h-16 lg:h-20" preserveAspectRatio="none">
        <path
          d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
          className="fill-white"
        />
      </svg>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-brand-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <img src="/logo-full-light.svg" alt="Theobase" className="h-4 w-auto sm:h-5" />
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/login' })}
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-200 transition-colors hover:text-white sm:px-4"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/church/register' })}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-900 shadow-sm transition-all hover:bg-brand-50 active:scale-[0.98] sm:px-5"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative bg-brand-950 pb-24 pt-20 sm:pb-32 sm:pt-28 lg:pt-36">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-heading text-3xl font-bold leading-tight tracking-wide text-white sm:text-4xl lg:text-5xl">
                Membership. Giving. Reports. Built for the way SDA churches work.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-brand-200 sm:text-lg">
                From the counting room to the conference — the one place your church officers can
                count on.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => navigate({ to: '/church/register' })}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-brand-900 shadow-lg transition-all hover:bg-brand-50 active:scale-[0.98]"
                >
                  Set up your church
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/church/register' })}
                  className="rounded-xl px-7 py-4 text-base font-medium text-brand-200 transition-colors hover:text-white"
                >
                  Talk to the Conference
                </button>
              </div>
            </div>
          </div>
          <WaveDivider />
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { label: 'Role types', value: '14', sub: 'SDA polity enforced by software' },
                { label: 'Counters per batch', value: '2', sub: 'Dual-signoff is the only way' },
                { label: 'Works offline', value: 'Always', sub: 'Syncs when you reconnect' },
                { label: 'Per church', value: '$3/mo', sub: 'Paid by the Conference' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-heading text-2xl font-bold tracking-wide text-neutral-900 sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-neutral-900">{stat.label}</div>
                  <div className="mt-1 text-xs leading-snug text-neutral-400">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-100 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-wide text-neutral-900 sm:text-3xl">
                Three roles. One platform.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-500">
                Every church officer gets exactly the tools their job requires. No more, no less.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold tracking-wide text-neutral-900">
                  Church Clerk
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                  Track baptisms, transfers, and membership changes as they happen. The annual
                  statistical report fills itself out. No Excel. No copying.
                </p>
                <p className="mt-4 text-xs font-medium text-brand-600">
                  Upload your membership roll as CSV &rarr;
                </p>
              </div>
              <div className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-warning-light text-warning-700">
                  <Calculator className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold tracking-wide text-neutral-900">
                  Counters
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                  Two people count on a large, easy-to-tap keypad. Totals are compared. Match? Batch
                  locks forever. Mismatch? Reconciled side by side.
                </p>
                <p className="mt-4 text-xs font-medium text-warning-700">
                  Dual-signoff enforced by software &rarr;
                </p>
              </div>
              <div className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-success-light text-success-700">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold tracking-wide text-neutral-900">
                  Treasurer
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                  Giving records flow from the counting room automatically. The tithe remittance
                  statement is pre-computed. Review and approve.
                </p>
                <p className="mt-4 text-xs font-medium text-success-700">
                  One-tap remittance submission &rarr;
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-neutral-50 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-wide text-neutral-900 sm:text-3xl">
                What makes it different
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900">
                  Polity enforced by software
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  Dual-signoff, role-based access, audit trail — all encoded into the platform so
                  officers don&rsquo;t police each other.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <Wifi className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900">
                  Works offline. Syncs later.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  Count offerings, update records, review reports — all without internet. Changes
                  sync when you&rsquo;re back online.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <Download className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900">
                  Your data stays yours
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  Export full membership, giving history, and audit trail as CSV or JSON. No
                  lock-in. Conference sees aggregates only.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide text-neutral-900">
                  Permanent audit trail
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  Every action leaves an unalterable record. Tamper with a record and the chain
                  breaks — detectable instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-wide text-neutral-900 sm:text-3xl">
                Where we&rsquo;re headed
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-500">
                From paper notebooks to a platform every SDA church officer opens on Sabbath
                morning. Starting in the Pacific, expanding conference by conference.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <FileText className="mb-4 h-8 w-8 text-warning-600" />
                <div className="text-xs font-semibold uppercase tracking-wider text-warning-600">
                  Today
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                  Paper notebooks in the counting room. Membership rolls in Excel. Reports assembled
                  by hand. Hours of admin work every week.
                </p>
              </div>
              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 shadow-sm sm:p-8">
                <Sparkles className="mb-4 h-8 w-8 text-brand-600" />
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Tomorrow
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  One platform that understands SDA polity. Reports that fill themselves out. Works
                  offline, scales globally, belongs to the church.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-wide text-neutral-900 sm:text-3xl">
                Ready to set up your church?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-500">
                Free for every local church. The Conference subscribes at $3/church/month. No
                feature gates. Export your data anytime.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => navigate({ to: '/church/register' })}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/10 transition-all hover:bg-brand-700 active:scale-[0.98]"
                >
                  Register your church
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/login' })}
                  className="rounded-xl px-7 py-4 text-base font-medium text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-100 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <img src="/logo-full.svg" alt="Theobase" className="h-4 w-auto" />
            <div className="flex items-center gap-6 text-xs text-neutral-400">
              <button type="button" onClick={() => navigate({ to: '/login' })}>
                Sign in
              </button>
              <button type="button" onClick={() => navigate({ to: '/church/register' })}>
                Register
              </button>
            </div>
            <p className="text-xs text-neutral-400">&copy; {new Date().getFullYear()} Theobase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
