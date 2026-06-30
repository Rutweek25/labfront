import { useEffect } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { Loader } from "../components/Loader";
import { usePaymentStore } from "../store/paymentStore";

export const PaymentPage = () => {
  const {
    rows,
    loading,
    error,
    statusFilter,
    search,
    setStatusFilter,
    setSearch,
    fetchPayments
  } = usePaymentStore();

  useEffect(() => {
    fetchPayments().catch((err: any) => {
      toast.error(err?.response?.data?.message || "Failed to load payments");
    });
  }, [fetchPayments, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Read-only payment status overview for all requests." />

      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "ALL" ? "bg-slate-900 text-white" : ""}`}
          onClick={() => setStatusFilter("ALL")}
        >
          All
        </button>
        <button
          className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "PAID" ? "bg-emerald-600 text-white" : ""}`}
          onClick={() => setStatusFilter("PAID")}
        >
          Paid
        </button>
        <button
          className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "PENDING" ? "bg-rose-600 text-white" : ""}`}
          onClick={() => setStatusFilter("PENDING")}
        >
          Pending
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient or phone"
          className="ml-auto rounded-xl border border-slate-300 px-4 py-2 text-sm"
        />
        <button
          onClick={() => {
            fetchPayments().catch((err: any) => {
              toast.error(err?.response?.data?.message || "Failed to load payments");
            });
          }}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
        >
          Apply
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <Loader label="Loading payments..." />
      ) : !rows.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No payments found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Tests</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.orderId} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.patientName}</td>
                  <td className="px-4 py-3">{row.phone}</td>
                  <td className="px-4 py-3">{row.tests.join(", ")}</td>
                  <td className="px-4 py-3">Rs. {row.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        row.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {row.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
