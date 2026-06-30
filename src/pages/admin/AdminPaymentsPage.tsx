import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { useAdminStore } from "../../store/adminStore";

export const AdminPaymentsPage = () => {
  const { payments, loading, error, fetchPayments } = useAdminStore();
  const [status, setStatus] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = async () => {
    try {
      await fetchPayments({ status, startDate: startDate || undefined, endDate: endDate || undefined });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load payments");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRevenue = useMemo(() => payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount), 0), [payments]);
  const pendingPayments = useMemo(() => payments.filter((p) => p.status === "PENDING").length, [payments]);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Track all payment transactions with financial filters." />
      {loading && <Loader />}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total Revenue</p><p className="mt-2 text-2xl font-semibold">Rs. {totalRevenue.toFixed(2)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Pending Payments</p><p className="mt-2 text-2xl font-semibold">{pendingPayments}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">All Payments</p><p className="mt-2 text-2xl font-semibold">{payments.length}</p></article>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <select className="rounded-xl border border-slate-300 px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
          </select>
          <input type="date" className="rounded-xl border border-slate-300 px-3 py-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="rounded-xl border border-slate-300 px-3 py-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={load}>Apply</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-3">Order</th>
              <th className="py-2 pr-3">Patient</th>
              <th className="py-2 pr-3">Tests</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-3 pr-3 font-medium text-slate-900">#{row.orderId}</td>
                <td className="py-3 pr-3">{row.patientName}</td>
                <td className="py-3 pr-3">{row.tests.join(", ")}</td>
                <td className="py-3 pr-3">Rs. {Number(row.amount).toFixed(2)}</td>
                <td className="py-3 pr-3">{row.status}</td>
                <td className="py-3 pr-3">{new Date(row.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
