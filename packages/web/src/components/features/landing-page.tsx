import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
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
 ClipboardList,
 Upload,
 Delete,
 Check,
 ChevronDown,
 Mail,
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

function PhoneMockup() {
 return (
 <div className="relative z-10 mx-auto mt-16 -mb-20 w-full max-w-sm sm:-mb-24">
 <div className="overflow-hidden rounded-[2rem] border border-brand-700/40 bg-neutral-900 shadow-2xl ring-1 ring-white/10">
 <div className="flex items-center justify-between px-6 pt-5 text-[11px] text-neutral-400">
 <span>9:41</span>
 <span className="font-semibold text-white">Counting Room</span>
 <span className="h-2 w-2 rounded-full bg-warning-500" />
 </div>
 <div className="px-6 pt-4">
 <div className="text-xs text-neutral-400">Batch #42 · Sabbath Offering</div>
 <div className="mt-1 font-heading text-3xl font-bold tracking-tight text-white">
 $2,450.00
 </div>
 </div>
 <div className="grid grid-cols-3 gap-2 px-6 pt-5">
 {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((key) => (
 <button
 key={key}
 type="button"
 className="rounded-xl bg-neutral-800 py-3 text-lg font-semibold text-white transition-colors hover:bg-neutral-700 active:scale-[0.97]"
 >
 {key}
 </button>
 ))}
 <button
 type="button"
 className="flex items-center justify-center rounded-xl bg-neutral-800 py-3 text-neutral-300 transition-colors hover:bg-neutral-700 active:scale-[0.97]"
 >
 <Delete className="h-5 w-5" />
 </button>
 </div>
 <div className="px-6 pb-5 pt-5">
 <div className="flex items-center justify-between rounded-xl bg-brand-600 px-4 py-3 shadow-lg shadow-brand-600/30">
 <span className="text-sm font-semibold text-white">Lock batch</span>
 <Check className="h-4 w-4 text-white" />
 </div>
 <div className="mt-3 flex justify-between text-[11px] text-neutral-400">
 <span>Counter 1 &middot; done</span>
 <span>Counter 2 &middot; done</span>
 </div>
 </div>
 </div>
 </div>
 );
}

const FAQS = [
 {
  q: 'Is our data safe?',
  a: 'Everything is encrypted. Roles control who sees what, and every change leaves an unalterable record. Your data belongs to your church — and exports anytime.',
 },
 {
  q: 'What if our church has no internet?',
  a: 'The counting room and your records work fully offline. Everything syncs automatically the moment you reconnect.',
 },
 {
  q: 'Is our membership visible to the Conference?',
  a: 'No. The Conference sees aggregates and official reports only — never individual member records.',
 },
 {
  q: 'How much does it cost?',
  a: 'Free for every local church. The Conference subscribes at $3 per church per month. No feature gates, no surprises.',
 },
 {
  q: 'How do we get started?',
  a: 'Register your church, import your membership roll, and count your next offering. Your officers get role-based access right away.',
 },
];

export function LandingPage() {
 const navigate = useNavigate();
 const [email, setEmail] = useState('');
 const [submitted, setSubmitted] = useState(false);

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
 <section className="relative bg-brand-950 pb-40 pt-20 sm:pb-48 sm:pt-28 lg:pt-36">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <h1 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
 Take care of the mundane. Focus on the gospel.
 </h1>
 <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-brand-200 sm:text-lg">
 Theobase handles the membership roll, the offering count, and the conference
 reports — so your church can pour its time into what actually matters.
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
 <PhoneMockup />
 </div>
 <WaveDivider />
 </section>

 <section className="py-20 sm:py-24">
 <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
 It starts in a back room, every Sabbath.
 </h2>
 <div className="mt-6 space-y-4 text-left text-base leading-relaxed text-neutral-500 sm:text-lg">
 <p>
 Two people stand over a pile of envelopes and a paper notebook. They count once.
 They count again. They write the total on a slip for the treasurer — who adds it
 all up again on Monday, retypes it into the report, and hopes nothing got lost
 along the way.
 </p>
 <p>
 Meanwhile the clerk keeps the membership roll in Excel, and every statistic has to
 be rebuilt by hand before conference.
 </p>
 <p className="font-medium text-neutral-700">
 None of it is ministry. All of it is necessary. Theobase is the way to stop doing
 it by hand.
 </p>
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 py-20 sm:py-24">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
 {[
 { label: 'Excel on Sunday night', value: '0', sub: 'The roll rebuilds itself before every report' },
 { label: 'Recounts from memory', value: '0', sub: 'Two counters agree, or the batch won\u2019t lock' },
 { label: 'Printed reports', value: '0', sub: 'The conference gets them with one tap' },
 { label: 'Tracked changes', value: '100%', sub: 'Every action leaves an unalterable record' },
 ].map((stat) => (
 <div key={stat.label} className="text-center">
 <div className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
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
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
 Three officers. One record they can trust.
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
 Everyone who touches the records gets exactly what their job needs — so the
 paperwork moves fast and the church moves on to ministry.
 </p>
 </div>
 <div className="mt-12 grid gap-6 sm:grid-cols-3">
 <div className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
 <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
 <UserCheck className="h-6 w-6" />
 </div>
 <h3 className="font-heading text-lg font-bold text-neutral-900">
 The Clerk
 </h3>
 <p className="mt-3 text-sm leading-relaxed text-neutral-500">
 Baptisms, transfers, removals — updated as they happen, not rebuilt for every
 report. The annual statistical report fills itself out.
 </p>
 <p className="mt-4 text-xs font-medium text-brand-600">
 No all-night session before conference &rarr;
 </p>
 </div>
 <div className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
 <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-warning-light text-warning-700">
 <Calculator className="h-6 w-6" />
 </div>
 <h3 className="font-heading text-lg font-bold text-neutral-900">
 The Counters
 </h3>
 <p className="mt-3 text-sm leading-relaxed text-neutral-500">
 Two people, one easy-to-tap keypad, one agreed total. The moment they agree, the
 batch locks forever. Nobody recounts from memory on Monday.
 </p>
 <p className="mt-4 text-xs font-medium text-warning-700">
 Disagreements resolved side by side &rarr;
 </p>
 </div>
 <div className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
 <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-success-light text-success-700">
 <Receipt className="h-6 w-6" />
 </div>
 <h3 className="font-heading text-lg font-bold text-neutral-900">
 The Treasurer
 </h3>
 <p className="mt-3 text-sm leading-relaxed text-neutral-500">
 Giving flows in from the counting room automatically. The tithe remittance statement
 is already drafted — review, approve, and it\u2019s on its way.
 </p>
 <p className="mt-4 text-xs font-medium text-success-700">
 One tap to the Conference &rarr;
 </p>
 </div>
 </div>
 </div>
 </section>

 <section className="bg-neutral-50 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
 Getting started takes one Sabbath.
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
 Three steps, and the mundane is handled.
 </p>
 </div>
 <div className="mt-12 grid gap-6 sm:grid-cols-3">
 {[
 {
  step: 1,
  title: 'Register your church',
  desc: 'Set up your workspace in minutes. Your Conference is already on board.',
  icon: ClipboardList,
 },
 {
  step: 2,
  title: 'Import your roll',
  desc: 'Upload your membership CSV or add people one by one. The roll sorts itself.',
  icon: Upload,
 },
 {
  step: 3,
  title: 'Count next Sabbath',
  desc: 'Two counters, one keypad, one locked total. Reports follow automatically.',
  icon: Calculator,
 },
 ].map((item) => (
 <div key={item.step} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
 <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
 <item.icon className="h-6 w-6" />
 </div>
 <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
 Step {item.step}
 </div>
 <h3 className="mt-2 font-heading text-lg font-bold text-neutral-900">
 {item.title}
 </h3>
 <p className="mt-3 text-sm leading-relaxed text-neutral-500">
 {item.desc}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>

 <section className="py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
 Less admin, more ministry
 </h2>
 </div>
 <div className="mt-12 grid gap-6 sm:grid-cols-2">
 <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
 <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
 <ShieldCheck className="h-5 w-5" />
 </div>
 <h3 className="font-heading text-base font-bold text-neutral-900">
 No officer has to be the enforcer
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-neutral-500">
 Dual sign-off, role-based access, and change history are built in — so the polity
 polices itself, not the people.
 </p>
 </div>
 <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
 <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
 <Wifi className="h-5 w-5" />
 </div>
 <h3 className="font-heading text-base font-bold text-neutral-900">
 The offering gets counted even when the internet doesn\u2019t
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-neutral-500">
 Count, update records, and review reports offline. Everything syncs the moment
 they\u2019re back online.
 </p>
 </div>
 <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
 <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
 <Download className="h-5 w-5" />
 </div>
 <h3 className="font-heading text-base font-bold text-neutral-900">
 The records stay with the church
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-neutral-500">
 Full membership, giving history, and change log export anytime as spreadsheets. The
 Conference sees aggregates only.
 </p>
 </div>
 <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
 <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
 <History className="h-5 w-5" />
 </div>
 <h3 className="font-heading text-base font-bold text-neutral-900">
 Someone always knows what changed
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-neutral-500">
 Every action leaves an unalterable record. Tamper with a record and it\u2019s
 immediately visible.
 </p>
 </div>
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
 A different kind of week
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
 From paper notebooks to a platform every officer opens on Sabbath morning — so the
 time a church spends on admin becomes time for people. Starting in the Pacific,
 expanding conference by conference.
 </p>
 </div>
 <div className="mt-12 grid gap-6 sm:grid-cols-2">
 <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
 <FileText className="mb-4 h-8 w-8 text-warning-600" />
 <div className="text-xs font-semibold uppercase text-warning-600">
 Today
 </div>
 <p className="mt-3 text-sm leading-relaxed text-neutral-500">
 Notebooks in the counting room. Membership rolls in Excel. Reports assembled by hand
 and delivered in person. Hours of admin every week.
 </p>
 </div>
 <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 shadow-sm sm:p-8">
 <Sparkles className="mb-4 h-8 w-8 text-brand-600" />
 <div className="text-xs font-semibold uppercase text-brand-600">
 Tomorrow
 </div>
 <p className="mt-3 text-sm leading-relaxed text-neutral-600">
 One record the whole church trusts. Reports that fill themselves out. Hours of
 admin given back — as time for gospel work.
 </p>
 </div>
 </div>
 </div>
 </section>

 <section className="py-20 sm:py-28">
 <div className="mx-auto max-w-3xl px-4 sm:px-6">
 <h2 className="text-center font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
 Questions we hear a lot
 </h2>
 <div className="mt-10 space-y-3">
 {FAQS.map((faq) => (
 <details
 key={faq.q}
 className="group rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow open:shadow-md"
 >
 <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left">
 <span className="font-heading text-base font-bold text-neutral-900">
 {faq.q}
 </span>
 <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
 </summary>
 <p className="px-6 pb-5 text-sm leading-relaxed text-neutral-500">
 {faq.a}
 </p>
 </details>
 ))}
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-2xl text-center">
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
 Let your church get back to the gospel.
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
 Free for every local church. The Conference subscribes at $3/church/month. No
 feature gates. Export your data anytime.
 </p>
 {submitted ? (
 <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-6 py-5 text-left">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
 <Check className="h-5 w-5" />
 </div>
 <p className="text-sm font-medium text-neutral-900">
 You&rsquo;re on the list. We&rsquo;ll let you know the moment Theobase is ready for
 your church.
 </p>
 </div>
 ) : (
 <form
 className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
 onSubmit={(e) => {
  e.preventDefault();
  if (email.trim()) setSubmitted(true);
 }}
 >
 <label className="sr-only" htmlFor="launch-email">
 Email address
 </label>
 <input
 id="launch-email"
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="you@yourchurch.org"
 className="w-full flex-1 rounded-xl border border-neutral-200 bg-white px-5 py-4 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
 />
 <button
 type="submit"
 className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/10 transition-all hover:bg-brand-700 active:scale-[0.98]"
 >
 <Mail className="h-5 w-5" />
 Get launch updates
 </button>
 </form>
 )}
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