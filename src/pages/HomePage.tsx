import { Link } from "react-router-dom";

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#fde68a,transparent_36%),radial-gradient(circle_at_85%_80%,#93c5fd,transparent_34%),linear-gradient(145deg,#f8fafc,#eef2ff)] p-5 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/70 bg-white p-8 shadow-2xl backdrop-blur md:p-10">
          <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white">Lab Management System</p>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-slate-900 md:text-6xl">Faster Diagnostics. Better Decisions.</h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-600 md:text-base">Run doctor, lab, and admin workflows from one connected platform with live status updates, smart analytics, and instant reports.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Get Started</Link>
            <a href="#features" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Explore Features</a>
          </div>
        </section>

        <section className="grid gap-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Why Teams Choose This</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Real-time request, payment, and report tracking</li>
              <li>Role-based dashboards for Doctor, Lab, and Admin</li>
              <li>Invoice PDF generation and report previews</li>
              <li>Operational analytics with performance insights</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Demo Access</h2>
            <p className="mt-2 text-sm text-slate-600">doctor@lab.com</p>
            <p className="text-sm text-slate-600">tech@lab.com</p>
            <p className="text-sm text-slate-600">admin@lab.com</p>
            <p className="mt-2 text-sm text-slate-900">Password: password123</p>
          </article>
        </section>
      </div>

      <section id="features" className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Doctor Workspace</h3>
          <p className="mt-2 text-sm text-slate-600">Build requests fast, track timelines, and follow payments and report readiness.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Lab Operations</h3>
          <p className="mt-2 text-sm text-slate-600">Manage test queue, status transitions, payment updates, and report publishing.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Admin Intelligence</h3>
          <p className="mt-2 text-sm text-slate-600">Monitor revenue by test, doctor performance, and organization-wide health.</p>
        </article>
      </section>
    </div>
  );
};
