import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🍲',
    title: 'Know what’s cooking',
    description: 'Browse the menu ahead of time and plan your meals around your day.',
    color: 'bg-orange-50',
  },
  {
    icon: '🎟️',
    title: 'Your pass, always ready',
    description: 'Keep your meal passes close and make check-in quick with QR access.',
    color: 'bg-emerald-50',
  },
  {
    icon: '📊',
    title: 'Everything in one place',
    description: 'Keep track of billing, announcements, and mess updates without the hassle.',
    color: 'bg-sky-50',
  },
];

const steps = [
  { number: '01', title: 'Create your account', description: 'Join your campus mess in just a minute.' },
  { number: '02', title: 'Pick your meals', description: 'Check the menu and choose what works for you.' },
  { number: '03', title: 'Enjoy the easy part', description: 'Show your pass, enjoy your meal, and stay in the loop.' },
];

function Brand({ light = false }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${light ? 'text-white' : 'text-gray-900'}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-lg text-white shadow-lg shadow-brand-900/15">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
          <path d="M5 19c0-7.5 5.2-12.5 14-14-1.5 8.8-6.5 14-14 14Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M5 19c2.3-3.7 5.6-6.5 10-8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight">MessMate</span>
    </Link>
  );
}

function MealPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[500px]">
      <div className="absolute -left-7 top-16 h-28 w-28 rounded-full bg-amber-200/50 blur-2xl" />
      <div className="absolute -right-4 bottom-8 h-36 w-36 rounded-full bg-brand-200/70 blur-2xl" />
      <div className="relative rounded-[2rem] border border-white/80 bg-white/80 p-3 shadow-2xl shadow-emerald-950/10 backdrop-blur">
        <div className="overflow-hidden rounded-[1.5rem] bg-[#f7f8f2]">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
              <span className="text-xs font-bold tracking-wide text-gray-700">TODAY AT YOUR MESS</span>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-gray-500">MON, 24 JUN</span>
          </div>
          <div className="p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm text-gray-500">Good afternoon, Arjun</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">Your menu is ready.</h2>
              </div>
              <span className="text-3xl" role="img" aria-label="sun">☀️</span>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-2xl" role="img" aria-label="lunch">🍛</span>
                  <div>
                    <p className="font-bold text-gray-900">Lunch</p>
                    <p className="text-xs text-gray-500">12:30 – 2:00 PM</p>
                  </div>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">OPTED IN</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Paneer curry', 'Jeera rice', 'Fresh salad'].map((item) => (
                  <span key={item} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">{item}</span>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-brand-700 p-4 text-white">
              <div>
                <p className="text-xs font-medium text-brand-100">Your lunch pass</p>
                <p className="mt-1 text-sm font-bold">Ready when you are</p>
              </div>
              <div className="grid h-12 w-12 grid-cols-3 gap-0.5 rounded-lg bg-white p-1.5" aria-label="QR pass preview">
                {[1, 0, 1, 0, 1, 0, 1, 1, 1].map((filled, index) => (
                  <span key={index} className={`rounded-[2px] ${filled ? 'bg-brand-800' : 'bg-brand-100'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-xl" role="img" aria-label="sparkles">✨</span>
        <div>
          <p className="text-xs font-bold text-gray-900">Mess life, made simple</p>
          <p className="text-[11px] text-gray-500">Your day, all in one place</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfcf8] text-gray-900">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          <a href="#features" className="text-sm font-medium text-gray-600 transition hover:text-brand-700">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-gray-600 transition hover:text-brand-700">How it works</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white sm:px-4">Log in</Link>
          <Link to="/register" className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-900/10 transition hover:bg-brand-800 sm:px-5">
            Get started
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:px-12 lg:pb-28 lg:pt-16">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-2 text-xs font-bold text-brand-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            A fresher way to do campus dining
          </span>
          <h1 className="mt-6 max-w-2xl text-[2.8rem] font-black leading-[1.07] tracking-[-0.045em] text-gray-950 sm:text-6xl lg:text-[4.25rem]">
            A better mess experience <span className="text-brand-700">starts here.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
            Menus, meal passes, and mess updates—all in one happy little place. Spend less time sorting things out and more time enjoying your day.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-900/15 transition hover:-translate-y-0.5 hover:bg-brand-800">
              Create your student account
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:border-brand-200 hover:text-brand-800">
              I already have an account
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
            <div className="flex -space-x-2">
              {['bg-amber-200', 'bg-rose-200', 'bg-sky-200', 'bg-brand-200'].map((color, index) => (
                <span key={color} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#fbfcf8] ${color} text-xs`} role="img" aria-label={`student ${index + 1}`}>
                  {['😊', '😄', '🙂', '😋'][index]}
                </span>
              ))}
            </div>
            <span><strong className="text-gray-800">Made for campus life.</strong> Easy from day one.</span>
          </div>
        </div>
        <MealPreview />
        <div className="pointer-events-none absolute -right-20 top-0 -z-0 h-96 w-96 rounded-full bg-brand-100/70 blur-3xl" />
      </section>

      <section id="features" className="scroll-mt-8 border-y border-gray-100 bg-white/80 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-700">The good stuff</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">One less thing to worry about.</h2>
            <p className="mt-4 leading-7 text-gray-600">All the little mess essentials, thoughtfully brought together for students and the teams who make every meal happen.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-gray-100 bg-[#fff] p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/5 sm:p-7">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} text-2xl`} role="img" aria-hidden="true">{feature.icon}</span>
                <h3 className="mt-5 text-lg font-extrabold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-8 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:px-12">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-700">How it works</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-gray-950 sm:text-4xl">Good food days, in three easy steps.</h2>
            <p className="mt-4 leading-7 text-gray-600">Get set up in a moment, then let MessMate handle the everyday details.</p>
            <Link to="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand-800 hover:text-brand-900">
              Get started for free <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:gap-6 sm:p-6">
                <span className="text-sm font-black tracking-widest text-brand-700">{step.number}</span>
                <div>
                  <h3 className="font-extrabold text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] bg-brand-800 px-7 py-9 text-white sm:px-10 sm:py-11 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-100">Ready for a smoother mess routine?</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Your next good meal is just a tap away.</h2>
          </div>
          <Link to="/register" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-800 transition hover:bg-brand-50">
            Join MessMate <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <Brand />
          <p className="text-xs text-gray-500">Making campus meals a little easier, every day.</p>
          <div className="flex gap-5 text-sm font-medium text-gray-600">
            <Link to="/login" className="hover:text-brand-700">Log in</Link>
            <Link to="/register" className="hover:text-brand-700">Register</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
