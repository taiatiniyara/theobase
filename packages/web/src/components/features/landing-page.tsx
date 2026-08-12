import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
 ArrowRight,
 Calculator,
 Receipt,
 ShieldCheck,
 Download,
 Wifi,
 FileText,
 UserCheck,
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

function Reveal({
 children,
 className = '',
 delay = 0,
}: {
 children: ReactNode;
 className?: string;
 delay?: number;
}) {
 const ref = useRef<HTMLDivElement>(null);
 const [visible, setVisible] = useState(false);

 useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const observer = new IntersectionObserver(
   ([entry]) => {
    if (entry?.isIntersecting) {
     setVisible(true);
     observer.disconnect();
    }
   },
   { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  observer.observe(el);
  return () => observer.disconnect();
 }, []);

 return (
 <div
  ref={ref}
  style={{ transitionDelay: `${delay}ms` }}
  className={`transition-all duration-700 ease-out ${
   visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
  } ${className}`}
 >
  {children}
 </div>
 );
}

function PhoneMockup() {
 return (
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
 );
}

function BrowserMockup() {
 const nav = ['Dashboard', 'Members', 'Households', 'Counting Room', 'Treasurer', 'Reports'];
 return (
 <div className="overflow-hidden rounded-2xl border border-brand-700/40 bg-neutral-900 shadow-2xl ring-1 ring-white/10">
 <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
 <span className="h-3 w-3 rounded-full bg-error" />
 <span className="h-3 w-3 rounded-full bg-warning" />
 <span className="h-3 w-3 rounded-full bg-success" />
 <div className="mx-auto flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-1 text-[11px] text-neutral-400">
 <span className="h-1.5 w-1.5 rounded-full bg-success" />
 app.theobase.app
 </div>
 </div>
 <div className="flex">
 <div className="hidden w-36 shrink-0 border-r border-neutral-800 p-3 sm:block">
 {nav.map((item, i) => (
 <div
  key={item}
  className={`rounded-lg px-3 py-1.5 text-[11px] font-medium ${
   i === 0 ? 'bg-brand-600 text-white' : 'text-neutral-500'
  }`}
 >
  {item}
 </div>
 ))}
 </div>
 <div className="flex-1 p-4">
 <div className="text-sm font-semibold text-white">Suva Central SDA Church</div>
 <div className="mt-3 grid grid-cols-3 gap-2">
 {[
  { label: 'Members', value: '214' },
  { label: 'Giving this month', value: '$9,412' },
  { label: 'Reports ready', value: '2' },
 ].map((stat) => (
  <div key={stat.label} className="rounded-xl bg-neutral-800 p-3">
   <div className="font-heading text-base font-bold text-white">{stat.value}</div>
   <div className="mt-0.5 text-[10px] text-neutral-500">{stat.label}</div>
  </div>
 ))}
 </div>
 <div className="mt-3 space-y-2">
 {[0, 1, 2].map((row) => (
  <div
   key={row}
   className="flex items-center justify-between rounded-xl bg-neutral-800 px-3 py-2"
  >
   <div className="flex items-center gap-2">
   <span className="h-6 w-6 rounded-full bg-brand-700/60" />
   <span className="h-2 w-20 rounded-full bg-neutral-600" />
   </div>
   <span className="h-2 w-10 rounded-full bg-neutral-600" />
  </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}

function ReportCard() {
 return (
 <div className="w-56 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
 <FileText className="h-5 w-5" />
 </div>
 <div>
 <div className="text-xs font-bold text-neutral-900">Annual Statistical Report</div>
 <div className="text-[10px] text-neutral-400">Ready for your review</div>
 </div>
 </div>
 <div className="mt-3 rounded-lg bg-brand-600 px-3 py-2 text-center text-[11px] font-semibold text-white">
 Approve &amp; submit
 </div>
 </div>
 );
}

const FAQS = [
 {
  q: 'Is Theobase just membership and finances?',
  a: 'No — that\u2019s where it starts. Theobase is being built as the central platform for church operations. Membership and finances ship first because every church runs on them; Sabbath School, communication, and department ministries follow on the same foundation.',
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
 },
 {
  title: 'Finances',
  desc: 'Counting room, giving, and remittance — dual-signoff enforced by software.',
  icon: Calculator,
 },
 {
  title: 'Reporting',
  desc: 'Annual statistics, tithe remittance, financial statements — derived, not assembled.',
  icon: FileText,
 },
];

const ROADMAP_MODULES = [
 {
  title: 'Sabbath School',
  desc: 'Class rosters, check-in, and lesson distribution — the church\u2019s biggest weekly ministry.',
  icon: CalendarDays,
 },
 {
  title: 'Communication',
  desc: 'Announcements, prayer requests, and milestone reminders, delivered how members prefer.',
  icon: MessageSquare,
 },
 {
  title: 'Department ministries',
  desc: 'Pathfinders, Health, Women\u2019s, Men\u2019s — rosters and coordination for every ministry team.',
  icon: Users,
 },
 {
  title: 'Visitation & care',
  desc: 'Pastoral visits, Bible study interests, and baptismal class tracking.',
  icon: HeartHandshake,
 },
 {
  title: 'Member self-service',
  desc: 'Giving history, tax receipts, and contact updates — straight from each member\u2019s phone.',
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

 const goToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
 <section className="relative overflow-hidden bg-brand-950 pb-44 pt-20 sm:pb-52 sm:pt-28 lg:pt-32">
 <div
  className="pointer-events-none absolute inset-0"
  style={{
  background:
   'radial-gradient(60% 45% at 50% 0%, rgba(59,130,246,0.28) 0%, rgba(23,37,84,0) 70%)',
  }}
 />
 <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <div className="mx-auto inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-brand-200">
 <span>Built with the Fiji Mission</span>
 <span className="text-brand-600">&middot;</span>
 <span>Offline-first for the Pacific</span>
 <span className="text-brand-600">&middot;</span>
 <span>Free for local churches</span>
 </div>
 <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
  Take care of the mundane.
  <br />
  <span className="text-brand-300">Focus on the gospel.</span>
 </h1>
 <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-brand-200 sm:text-lg">
  One platform for everything your church runs on. It starts where the paperwork hurts
  most — membership and finances — and grows from there, so the mundane gets handled
  and your people get their time back.
 </p>
 <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
 onClick={() => goToSection('inside')}
 className="rounded-xl px-7 py-4 text-base font-medium text-brand-200 transition-colors hover:text-white"
 >
  See what&rsquo;s inside
 </button>
 </div>
 </div>

 <div id="inside" className="relative mx-auto mt-16 max-w-5xl scroll-mt-24 sm:mt-20">
 <div className="hidden lg:block">
 <div className="absolute -top-8 left-4 z-20 animate-float">
  <ReportCard />
 </div>
 </div>
 <div className="animate-float-delayed">
 <BrowserMockup />
 </div>
 <div className="mx-auto -mt-16 w-56 sm:w-64 lg:absolute lg:-bottom-10 lg:right-6 lg:z-20 lg:mx-0 lg:mt-0 lg:w-64">
 <div className="animate-float">
  <PhoneMockup />
 </div>
 </div>
 </div>
 </div>
 <WaveDivider />
 </section>

 <section className="py-20 sm:py-24">
 <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
 <Reveal>
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
  It starts in a back room, every Sabbath.
 </h2>
 </Reveal>
 <Reveal delay={100}>
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
 </Reveal>
 </div>
 </section>

 <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <Reveal>
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
  Built on one foundation
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
  Churches run on Excel sheets, paper notebooks, and a handful of disconnected tools.
  Theobase keeps it in one place — one record, one login, one source of truth — so
  nothing is ever entered twice.
 </p>
 </Reveal>
 </div>
 <div className="mx-auto mt-12 max-w-4xl">
 <Reveal delay={100}>
 <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
 <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
  On the platform today
 </div>
 <div className="mt-4 grid gap-4 sm:grid-cols-3">
 {LIVE_MODULES.map((mod) => (
  <div key={mod.title} className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
   <mod.icon className="h-5 w-5" />
  </div>
  <h3 className="font-heading text-base font-bold text-neutral-900">{mod.title}</h3>
  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{mod.desc}</p>
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
 </Reveal>
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <Reveal>
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
  Three officers. One record they can trust.
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
  The platform starts with the two systems every church runs on. Each officer gets
  exactly what their job needs — so the paperwork moves fast and the church moves on
  to ministry.
 </p>
 </Reveal>
 </div>
 <div className="mt-12 grid gap-6 sm:grid-cols-3">
 {[
  {
  title: 'The Clerk',
  desc: 'Baptisms, transfers, removals — updated as they happen, not rebuilt for every report. The annual statistical report fills itself out.',
  footnote: 'No all-night session before conference',
  icon: UserCheck,
  color: 'bg-brand-100 text-brand-600',
  footnoteColor: 'text-brand-600',
  },
  {
  title: 'The Counters',
  desc: 'Two people, one easy-to-tap keypad, one agreed total. The moment they agree, the batch locks forever. Nobody recounts from memory on Monday.',
  footnote: 'Disagreements resolved side by side',
  icon: Calculator,
  color: 'bg-warning-light text-warning-700',
  footnoteColor: 'text-warning-700',
  },
  {
  title: 'The Treasurer',
  desc: 'Giving flows in from the counting room automatically. The tithe remittance statement is already drafted — review, approve, and it&rsquo;s on its way.',
  footnote: 'One tap to the Conference',
  icon: Receipt,
  color: 'bg-success-light text-success-700',
  footnoteColor: 'text-success-700',
  },
 ].map((officer, i) => (
  <Reveal key={officer.title} delay={i * 100}>
  <div className="group h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-8">
   <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${officer.color}`}>
   <officer.icon className="h-6 w-6" />
   </div>
   <h3 className="font-heading text-lg font-bold text-neutral-900">{officer.title}</h3>
   <p className="mt-3 text-sm leading-relaxed text-neutral-500">{officer.desc}</p>
   <p className={`mt-4 text-xs font-medium ${officer.footnoteColor}`}>
   {officer.footnote} &rarr;
   </p>
  </div>
  </Reveal>
 ))}
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <Reveal>
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
  What&rsquo;s on the roadmap
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
  Membership and finances come first. The rest of church operations builds on the same
  foundation.
 </p>
 </Reveal>
 </div>
 <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
 {ROADMAP_MODULES.map((mod, i) => (
  <Reveal key={mod.title} delay={(i % 3) * 100}>
  <div className="h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-8">
   <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
   <mod.icon className="h-5 w-5" />
   </div>
   <h3 className="font-heading text-base font-bold text-neutral-900">{mod.title}</h3>
   <p className="mt-2 text-sm leading-relaxed text-neutral-500">{mod.desc}</p>
  </div>
  </Reveal>
 ))}
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <Reveal>
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
  Getting started takes one Sabbath.
 </h2>
 </Reveal>
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
 ].map((item, i) => (
  <Reveal key={item.step} delay={i * 100}>
  <div className="h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-8">
   <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
   <item.icon className="h-6 w-6" />
   </div>
   <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
   Step {item.step}
   </div>
   <h3 className="mt-2 font-heading text-lg font-bold text-neutral-900">{item.title}</h3>
   <p className="mt-3 text-sm leading-relaxed text-neutral-500">{item.desc}</p>
  </div>
  </Reveal>
 ))}
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 bg-brand-950 py-20 sm:py-28">
 <div className="mx-auto max-w-4xl px-4 sm:px-6">
 <Reveal>
 <div className="text-center">
  <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
  Why we built it
  </span>
  <blockquote className="mt-6 font-heading text-2xl font-bold leading-snug text-white sm:text-3xl">
  &ldquo;Theobase started with a question from the Fiji Mission: why does counting the
  offering take all afternoon? We built the answer — a platform that does the mundane
  work, so the church can do the gospel work.&rdquo;
  </blockquote>
  <p className="mt-6 text-sm font-medium text-brand-200">
  The Theobase team &middot; offline-first, built for the Pacific, owned by the church
  </p>
 </div>
 </Reveal>
 </div>
 </section>

 <section className="py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-3xl text-center">
 <Reveal>
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
  Less admin, more ministry
 </h2>
 </Reveal>
 </div>
 <div className="mt-12 grid gap-6 sm:grid-cols-2">
 {[
  {
  title: 'No officer has to be the enforcer',
  desc: 'Dual sign-off, role-based access, and change history are built in — so the polity polices itself, not the people.',
  icon: ShieldCheck,
  },
  {
  title: 'The offering gets counted even when the internet doesn\u2019t',
  desc: 'Count, update records, and review reports offline. Everything syncs the moment they&rsquo;re back online.',
  icon: Wifi,
  },
  {
  title: 'The records stay with the church',
  desc: 'Full membership, giving history, and change log export anytime as spreadsheets. The Conference sees aggregates only.',
  icon: Download,
  },
  {
  title: 'Someone always knows what changed',
  desc: 'Every action leaves an unalterable record. Tamper with a record and it&rsquo;s immediately visible.',
  icon: History,
  },
 ].map((feature, i) => (
  <Reveal key={feature.title} delay={(i % 2) * 100}>
  <div className="h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-8">
   <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
   <feature.icon className="h-5 w-5" />
   </div>
   <h3 className="font-heading text-base font-bold text-neutral-900">{feature.title}</h3>
   <p className="mt-2 text-sm leading-relaxed text-neutral-500">{feature.desc}</p>
  </div>
  </Reveal>
 ))}
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
 <div className="mx-auto max-w-3xl px-4 sm:px-6">
 <Reveal>
 <h2 className="text-center font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
  Questions you might have
 </h2>
 </Reveal>
 <div className="mt-10 space-y-3">
 {FAQS.map((faq, i) => (
  <Reveal key={faq.q} delay={i * 50}>
  <details className="group rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow open:shadow-md">
   <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left">
   <span className="font-heading text-base font-bold text-neutral-900">{faq.q}</span>
   <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
   </summary>
   <p className="px-6 pb-5 text-sm leading-relaxed text-neutral-500">{faq.a}</p>
  </details>
  </Reveal>
 ))}
 </div>
 </div>
 </section>

 <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
 <div className="mx-auto max-w-6xl px-4 sm:px-6">
 <div className="mx-auto max-w-2xl text-center">
 <Reveal>
 <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
  It&rsquo;s yours when it&rsquo;s ready.
 </h2>
 <p className="mt-4 text-base leading-relaxed text-neutral-500">
  We&rsquo;re building this for churches like yours. If you&rsquo;d like to be the
  first to know when it&rsquo;s ready, leave your email — no newsletters, just one
  note when we launch.
 </p>
 </Reveal>
 {submitted ? (
  <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-6 py-5 text-left">
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
   <Check className="h-5 w-5" />
  </div>
  <p className="text-sm font-medium text-neutral-900">
   You&rsquo;re on the list. We&rsquo;ll be in touch the moment Theobase is ready for
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
   Notify me
  </button>
  </form>
 )}
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