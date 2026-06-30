import { useEffect } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { CountUpNumber } from "../../components/CountUpNumber";
import { PageHeader } from "../../components/PageHeader";
import { Loader } from "../../components/Loader";
import { Skeleton } from "../../components/Skeleton";
import { useAdminStore } from "../../store/adminStore";

const COLORS = ["#0f766e", "#0284c7", "#ea580c", "#334155"];

export const AdminDashboardPage = () => {
  const { analytics, loading, error, fetchDashboard } = useAdminStore();

  useEffect(() => {
    fetchDashboard().catch((err: any) => {
      toast.error(err?.response?.data?.message || "Failed to load admin dashboard");
    });
  }, [fetchDashboard]);

  const cards = analytics?.cards;
  const topRevenueTest = analytics?.charts.revenueByTest?.[0];
  const topDoctor = analytics?.charts.doctorPerformance?.[0];
  const paidPayments = analytics?.charts.paymentStatusBreakdown?.find((item) => item.name === "PAID")?.value || 0;
  const pending = analytics?.charts.paymentStatusBreakdown?.find((item) => item.name === "PENDING")?.value || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="System control center with operations and financial analytics." />

      {loading && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Loader label="Refreshing admin analytics..." />
        </section>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm"><p className="text-sm text-slate-500">Total Doctors</p><p className="mt-2 text-2xl font-semibold"><CountUpNumber value={cards?.totalDoctors ?? 0} /></p></article>
        <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm"><p className="text-sm text-slate-500">Total Lab Technicians</p><p className="mt-2 text-2xl font-semibold"><CountUpNumber value={cards?.totalLabTechnicians ?? 0} /></p></article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><p className="text-sm text-slate-500">Total Patients</p><p className="mt-2 text-2xl font-semibold"><CountUpNumber value={cards?.patientCount ?? 0} /></p></article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><p className="text-sm text-slate-500">Total Orders</p><p className="mt-2 text-2xl font-semibold"><CountUpNumber value={cards?.orderCount ?? 0} /></p></article>
        <article className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm"><p className="text-sm text-slate-500">Total Revenue</p><p className="mt-2 text-2xl font-semibold">Rs. <CountUpNumber value={Number(cards?.revenue ?? 0)} decimals={2} /></p></article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm"><p className="text-sm text-slate-500">Pending Payments</p><p className="mt-2 text-2xl font-semibold"><CountUpNumber value={cards?.pendingPayments ?? 0} /></p></article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Top Revenue Test</p>
          <p className="mt-2 text-xl font-semibold text-emerald-900">{topRevenueTest?.name || "N/A"}</p>
          <p className="mt-1 text-sm text-emerald-700">Rs. {Number(topRevenueTest?.value || 0).toFixed(2)}</p>
        </article>
        <article className="rounded-3xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-sky-700">Best Doctor By Volume</p>
          <p className="mt-2 text-xl font-semibold text-sky-900">{topDoctor?.name || "N/A"}</p>
          <p className="mt-1 text-sm text-sky-700">{topDoctor?.orders || 0} orders</p>
        </article>
        <article className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-amber-700">Payment Risk</p>
          <p className="mt-2 text-xl font-semibold text-amber-900">{pending > paidPayments ? "High" : "Stable"}</p>
          <p className="mt-1 text-sm text-amber-700">Paid: {paidPayments} | Pending: {pending}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Revenue Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.charts.revenueOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`Rs. ${Number(value ?? 0).toFixed(2)}`, "Revenue"]} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Orders Per Day</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.charts.ordersPerDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value ?? 0)} orders`, "Daily"]} />
                <Bar dataKey="value" fill="#0284c7" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Payment Status Breakdown</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics?.charts.paymentStatusBreakdown || []} dataKey="value" nameKey="name" outerRadius={120}>
                {(analytics?.charts.paymentStatusBreakdown || []).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${Number(value ?? 0)} payments`, "Count"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Revenue by Test</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.charts.revenueByTest || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip formatter={(value) => [`Rs. ${Number(value ?? 0).toFixed(2)}`, "Revenue"]} />
                <Bar dataKey="value" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Top Tests</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.charts.topTests || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value ?? 0)} orders`, "Volume"]} />
                <Bar dataKey="value" fill="#ea580c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Doctor Performance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.charts.doctorPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip formatter={(value, name) => [`${Number(value ?? 0)}`, String(name) === "orders" ? "Total Orders" : "Paid Orders"]} />
                <Legend />
                <Bar dataKey="orders" fill="#0284c7" />
                <Bar dataKey="paidOrders" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
};
