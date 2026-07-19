import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-lg font-bold text-white">
              T
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Theobase</h1>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Sign in
            </a>
            <a
              href="/signup"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Get started
            </a>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Church management,{' '}
            <span className="text-primary-600">simplified.</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Theobase is a mobile-first platform for Seventh-day Adventist churches.
            Manage membership records, track finances, generate reports, and connect
            your congregation — all in one place, even offline.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a
              href="/signup"
              className="rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Start your church
            </a>
            <a
              href="/login"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Sign in
            </a>
          </div>
        </div>

        <div className="mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            {
              title: 'Membership',
              description: 'Full member directory, households, transfers, and baptism tracking.',
            },
            {
              title: 'Finances',
              description: 'Tithe, offerings, expenses, and fund accounting per SDA policy.',
            },
            {
              title: 'Reports',
              description: 'Monthly remittance forms, annual receipts, and Mission dashboards.',
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl border border-gray-200 bg-white p-6 text-left">
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          Theobase &mdash; Built for Seventh-day Adventist churches in the Fiji Mission and beyond.
        </div>
      </footer>
    </div>
  );
}
