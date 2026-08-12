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
 Layers,
 Users,
 CalendarDays,
 MessageSquare,
 HeartHandshake,
 BookOpen,
 Smartphone,
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
  q: 'Is Theobase just membership and finances?',
  a: 'No — that&rsquo;s where it starts. Theobase is being built as the central platform for church operations. Membership and finances ship first because every church runs on them; Sabbath School, communication, and department ministries follow on the same foundation.',
 },
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
  a: 'Free for every local church. The Conference subscribes at $3 per church per month. No feature gates — every module that ships is included, no surprises.',
 },
 {
  q: 'How do we get started?',
  a: 'Register your church, import your membership roll, and count your next offering. Your officers get role-based access right away.',
 },
];

const LIVE_MODULES = [
 {
  title: 'Membership',
  desc: 'The roll, households, and lifecycle — kept as one record the whole church trusts.',
  icon: UserCheck,
  tag: 'Live today',
 },
 {
  title: 'Finances',
  desc: 'Counting room, giving, and remittance — dual-signoff enforced by software.',
  icon: Calculator,
  tag: 'Live today',
 },
 {
  title: 'Reporting',
  desc: 'Annual statistics, tithe remittance, financial statements — derived, not assembled.',
  icon: FileText,
  tag: 'Live today',
 },
];

const ROADMAP_MODULES = [
 {
  title: 'Sabbath School',
  desc: 'Class rosters, check-in, and lesson distribution — the church&rsquo;s biggest weekly ministry.',
  icon: CalendarDays,
 },
 {
  title: 'Communication',
  desc: 'Announcements, prayer requests, and milestone reminders, delivered how members prefer.',
  icon: MessageSquare,
 },
 {
  title: 'Department ministries',
  desc: 'Pathfinders, Health, Women&rsquo;s, Men&rsquo;s — rosters and coordination for every ministry team.',
  icon: Users,
 },
 {
  title: 'Visitation & care',
  desc: 'Pastoral visits, Bible study interests, and baptismal class tracking.',
  icon: HeartHandshake,
 },
 {
  title: 'Member self-service',
  desc: 'Giving history, tax receipts, and contact updates — straight from each member&rsquo;s phone.',
  icon: Smartphone,
 },
 {
  title: 'Yearbook & Conference bridge',
  desc: 'Your data feeds the Adventist Yearbook and upstream systems automatically. No double-entry.',
  icon: BookOpen,
 },
];

export function LandingPage() {
 const navigate = useNavigate();
 const [email, setEmail] = useState('');
 const [submitted, setSubmitted] = useState(false);

 const goToRoadmap = () => {
  document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
 };

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
 <span className="inline-flex items-center gap-2 rounded-full border border-brand-700 bg-brand-900/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-200">
 <Layers className="h-3.5 w-3.5" />
 A platform for church operations
 </span>
 <h1 className="mt-6 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
 One platform for everything your church runs on.
 </h1>
 <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-brand-200 sm:text-lg">
 Theobase is becoming the central platform for church operations. It starts where the
 paperwork hurts most — membership and finances — and grows from there, so the mundane
 is handled and the gospel gets your people&rsquo;s time.
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
 onClick={goToRoadmap}
 className="rounded-xl px-7 py-4 text-base font-medium text-brand-200 transition-colors hover:text-white"
 >
 See the roadmap
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

 <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
 Not another app for one job. A foundation.
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
 Churches don&rsquo;t run on one app — they run on Excel sheets, paper notebooks, and a
 dozen disconnected tools. Theobase is built the other way: one foundation, one source
 of truth, and every module on top of it. No importing the same names into three
 systems. No re-keying the same numbers twice.
 </p>
 </div>
 <div className="mx-auto mt-12 max-w-4xl">
 <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
 <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
 Modules on the platform
 </div>
 <div className="mt-4 grid gap-4 sm:grid-cols-3">
 {LIVE_MODULES.map((mod) => (
 <div
 key={mod.title}
 className="rounded-2xl border border-brand-200 bg-brand-50 p-5"
 >
 <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
 <mod.icon className="h-5 w-5" />
 </div>
 <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
 {mod.tag}
 </div>
 <h3 className="mt-1 font-heading text-base font-bold text-neutral-900">
 {mod.title}
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-neutral-600">
 {mod.desc}
 </p>
 </div>
 ))}
 </div>
 <div className="mt-6 flex items-center gap-3 rounded-2xl bg-brand-950 px-6 py-5">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-brand-200">
 <Layers className="h-5 w-5" />
 </div>
 <p className="text-sm font-medium leading-relaxed text-brand-100">
 The Theobase foundation — one record, one login, one source of truth. Every future
 module is built on it, so nothing is ever entered twice.
 </p>
 </div>
 </div>
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
 The platform starts with the two systems every church runs on. Each officer gets
 exactly what their job needs — so the paperwork moves fast and the church moves on to
 ministry.
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
 is already drafted — review, approve, and it&rsquo;s on its way.
 </p>
 <p className="mt-4 text-xs font-medium text-success-700">
 One tap to the Conference &rarr;
 </p>
 </div>
 </div>
 </div>
 </section>

 <section id="roadmap" className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
 The roadmap
 </span>
 <h2 className="mt-3 font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
 Where the platform is going
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
 Membership and finances ship first. The rest of church operations joins on the same
 foundation — every module included, no feature gates.
 </p>
 </div>
 <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
 {ROADMAP_MODULES.map((mod) => (
 <div key={mod.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
 <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
 <mod.icon className="h-5 w-5" />
 </div>
 <h3 className="font-heading text-base font-bold text-neutral-900">
 {mod.title}
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-neutral-500">
 {mod.desc}
 </p>
 <div className="mt-4">
 <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
 <Sparkles className="h-3.5 w-3.5" />
 Coming next
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 py-20 sm:py-28">
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
 The offering gets counted even when the internet doesn&rsquo;t
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-neutral-500">
 Count, update records, and review reports offline. Everything syncs the moment
 they&rsquo;re back online.
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
 Every action leaves an unalterable record. Tamper with a record and it&rsquo;s
 immediately visible.
 </p>
 </div>
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
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