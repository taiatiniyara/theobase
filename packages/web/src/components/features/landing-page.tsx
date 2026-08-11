import { useNavigate } from '@tanstack/react-router';
import {
  Users,
  PiggyBank,
  FileText,
  Globe,
  Shield,
  Zap,
  Smartphone,
  Check,
  ArrowRight,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Membership Management',
      desc: 'Full member lifecycle — baptisms, transfers, households. Self-serve CSV import with validation.',
    },
    {
      icon: PiggyBank,
      title: 'Counting Room',
      desc: 'Dual-signoff giving batches. Two counters independently confirm before committing.',
    },
    {
      icon: FileText,
      title: 'Zero-Assembly Reports',
      desc: 'Annual statistical report and tithe remittance auto-generated from live data. Review and approve.',
    },
    {
      icon: Smartphone,
      title: 'Offline-First PWA',
      desc: 'Works without internet. Syncs when you reconnect. Built for churches in Fiji and beyond.',
    },
    {
      icon: Shield,
      title: 'Secure by Design',
      desc: 'Append-only event log with SHA-256 hash chain. Role-based access with 14 permission levels.',
    },
    {
      icon: Globe,
      title: 'Built for 215+ Countries',
      desc: 'i18n with English + Fijian Hindi. RTL support. Works on 3G connections in the Pacific.',
    },
  ];

  const pricingFeatures = [
    'Full membership lifecycle',
    'Counting room + dual-signoff',
    'Auto-generated reports',
    'Conference analytics',
    'CSV import & export',
    'Offline PWA sync',
    'Self-serve onboarding',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="Theobase" className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Theobase
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: '/login' })}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/church/register' })}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98]"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:px-8 lg:pb-40 lg:pt-36">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
                <Zap className="h-3 w-3" />
                Church management, reimagined
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-neutral-100">
                Your church runs itself.
                <span className="block text-brand-600 dark:text-brand-400">You stay informed.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
                Theobase is the offline-first church management platform for Seventh-day Adventist churches.
                Reports appear pre-filled. Giving is tracked automatically. The system does the work.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => navigate({ to: '/church/register' })}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/25 active:scale-[0.98]"
                >
                  Register your church
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/login' })}
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-medium text-neutral-700 transition-all hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                >
                  Sign in to existing church
                </button>
              </div>
              <p className="mt-4 text-sm text-neutral-400">Free for your local church. $3/month billed to the Conference.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-200/60 bg-neutral-50 py-20 dark:border-neutral-800 dark:bg-neutral-900/50 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Everything your church needs
              </h2>
              <p className="mt-4 text-neutral-500 dark:text-neutral-400">
                Designed for church officers — not IT departments.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-neutral-200/60 bg-white p-8 shadow-sm transition-all hover:border-brand-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-800"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-400 dark:group-hover:bg-brand-900">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-neutral-500 dark:text-neutral-400">
                The Conference subscribes. Churches never receive a bill.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-lg">
              <div className="rounded-2xl border-2 border-brand-200 bg-white p-10 shadow-lg dark:border-brand-800 dark:bg-neutral-900">
                <div className="text-center">
                  <span className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Per active church
                  </span>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">$3</span>
                    <span className="text-xl text-neutral-500">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-400">or $30/year ($2.50/mo)</p>
                </div>
                <ul className="mt-8 space-y-3">
                  {pricingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                      <Check className="h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/church/register' })}
                  className="mt-10 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98]"
                >
                  Get started free
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-200/60 bg-neutral-50 py-20 dark:border-neutral-800 dark:bg-neutral-900/50 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                How it works
              </h2>
              <p className="mt-4 text-neutral-500 dark:text-neutral-400">
                From onboarding to daily operations — no training required.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Register your church',
                  desc: 'A clerk signs up in 30 seconds. The system provisions your church automatically and grants clerk access.',
                },
                {
                  step: '02',
                  title: 'Import your members',
                  desc: 'Upload your CSV membership roll. The system parses it, flags unresolved rows, and imports everything in one go.',
                },
                {
                  step: '03',
                  title: 'Start counting',
                  desc: 'Two counters open a batch, enter today\'s offering on the custom keypad, and confirm. The batch is committed and immutable.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <span className="text-4xl font-bold text-brand-100 dark:text-brand-900">{item.step}</span>
                  <h3 className="mt-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200/60 py-12 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src="/logo-icon.svg" alt="Theobase" className="h-6 w-6" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Theobase</span>
            </div>
            <div className="flex items-center gap-6">
              <button type="button" onClick={() => navigate({ to: '/login' })} className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                Sign in
              </button>
              <button type="button" onClick={() => navigate({ to: '/church/register' })} className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                Register
              </button>
              <button type="button" onClick={() => navigate({ to: '/visitor/welcome' })} className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                Visitor
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              &copy; {new Date().getFullYear()} Theobase. Built for churches worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
