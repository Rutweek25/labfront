import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { socket } from "../lib/socket";
import { CountUpNumber } from "../components/CountUpNumber";
import { Loader } from "../components/Loader";
import { EmptyState } from "../components/EmptyState";
import { OrderTimeline } from "../components/OrderTimeline";
import { PageHeader } from "../components/PageHeader";
import { Skeleton } from "../components/Skeleton";
import { API_URL } from "../lib/runtimeConfig";
import { useLabTechnicianStore } from "../store/labTechnicianStore";

const PIE_COLORS = ["#16a34a", "#ef4444"];
const PAGE_SIZE = 6;

const Spinner = () => <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />;

const PencilIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M13.3 3.3l3.4 3.4M3.3 16.7l3.2-.7 9.3-9.3-2.5-2.5-9.3 9.3-.7 3.2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M2.5 10s2.8-4.5 7.5-4.5S17.5 10 17.5 10s-2.8 4.5-7.5 4.5S2.5 10 2.5 10z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const LabDashboard = () => {
  const {
    orders,
    tests,
    loading,
    fetchLabData,
    updateOrderTests,
    deleteOrder,
    updateOrderStatus,
    updateOrderSampleStatus,
    updatePaymentStatus,
    uploadReport,
    updateReportStatus
  } = useLabTechnicianStore();

  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [selectedTestPrices, setSelectedTestPrices] = useState<Record<number, number>>({});
  const [uploadingOrderId, setUploadingOrderId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [page, setPage] = useState(1);
  const [previewReport, setPreviewReport] = useState<any | null>(null);

  useEffect(() => {
    fetchLabData().catch((error: any) => {
      toast.error(error?.response?.data?.message || "Failed to load lab dashboard");
    });
  }, [fetchLabData]);

  useEffect(() => {
    const refresh = () => {
      fetchLabData().catch(() => undefined);
    };

    socket.on("order:new", refresh);
    socket.on("order:updated", refresh);
    socket.on("payment:updated", refresh);
    socket.on("report:uploaded", refresh);
    socket.on("notification:new", refresh);

    return () => {
      socket.off("order:new", refresh);
      socket.off("order:updated", refresh);
      socket.off("payment:updated", refresh);
      socket.off("report:uploaded", refresh);
      socket.off("notification:new", refresh);
    };
  }, [fetchLabData]);

  const openEditTestsModal = (orderId: number) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    setEditingOrderId(orderId);
    setSelectedTestIds(order.orderTests.map((ot) => ot.testId));
    setSelectedTestPrices(
      order.orderTests.reduce<Record<number, number>>((acc, ot) => {
        acc[ot.testId] = Number(ot.unitPrice);
        return acc;
      }, {})
    );
  };

  const saveTestsForOrder = async () => {
    if (!editingOrderId) return;
    if (!selectedTestIds.length) {
      toast.error("Select at least one test");
      return;
    }

    try {
      const testItems = selectedTestIds.map((testId) => ({
        testId,
        unitPrice: Number(selectedTestPrices[testId] ?? 0)
      }));
      await updateOrderTests(editingOrderId, testItems);
      toast.success("Order tests updated");
      setEditingOrderId(null);
      setSelectedTestIds([]);
      setSelectedTestPrices({});
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update order tests");
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    const confirmed = window.confirm("Delete this test request? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteOrder(orderId);
      toast.success("Order deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to delete order");
    }
  };

  const handleStatusUpdate = async (orderId: number, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success("Order status updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update status");
    }
  };

  const handleSampleStatusUpdate = async (
    orderId: number,
    sampleStatus: "PENDING" | "COLLECTED" | "RECEIVED" | "PROCESSING"
  ) => {
    try {
      await updateOrderSampleStatus(orderId, sampleStatus);
      toast.success("Sample status updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update sample status");
    }
  };

  const handlePaymentToggle = async (orderId: number, status: "PAID" | "PENDING") => {
    try {
      await updatePaymentStatus(orderId, status);
      toast.success("Payment status updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update payment status");
    }
  };

  const handleUploadReport = async (orderId: number, file: File | null) => {
    if (!file) return;
    setUploadingOrderId(orderId);
    try {
      await uploadReport(orderId, file);
      toast.success("Report uploaded");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to upload report");
    } finally {
      setUploadingOrderId(null);
    }
  };

  const handleReportStatusUpdate = async (reportId: number, status: "UPLOADED" | "READY" | "REJECTED") => {
    try {
      await updateReportStatus(reportId, status);
      toast.success("Report status updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update report status");
    }
  };

  const statusBadgeClass = (status: string) => {
    if (status === "COMPLETED") return "bg-emerald-100 text-emerald-700";
    if (status === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  const paidCount = useMemo(() => orders.filter((item) => item.paymentStatus === "PAID").length, [orders]);
  const pendingPayments = useMemo(() => orders.filter((item) => item.paymentStatus === "PENDING").length, [orders]);
  const inProgressCount = useMemo(() => orders.filter((item) => item.status === "IN_PROGRESS").length, [orders]);
  const completedCount = useMemo(() => orders.filter((item) => item.status === "COMPLETED").length, [orders]);
  const reportReadyCount = useMemo(() => orders.filter((item) => item.reports.length > 0).length, [orders]);
  const quickQueue = useMemo(
    () => orders.filter((item) => item.status !== "COMPLETED").slice(0, 5),
    [orders]
  );
  const paymentBreakdownData = useMemo(
    () => [
      { name: "Paid", value: paidCount },
      { name: "Pending", value: pendingPayments }
    ],
    [paidCount, pendingPayments]
  );
  const statusFlowData = useMemo(
    () => [
      { name: "Pending", value: orders.filter((item) => item.status === "PENDING").length },
      { name: "In Progress", value: inProgressCount },
      { name: "Completed", value: completedCount },
      { name: "Report Ready", value: reportReadyCount }
    ],
    [orders, inProgressCount, completedCount, reportReadyCount]
  );
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((item) => {
      const statusMatch = statusFilter === "ALL" || item.status === statusFilter;
      const searchMatch =
        !q ||
        item.patient.name.toLowerCase().includes(q) ||
        String(item.id).includes(q) ||
        item.orderTests.some((ot) => ot.test.name.toLowerCase().includes(q));
      return statusMatch && searchMatch;
    });
  }, [orders, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <PageHeader title="Lab Technician Dashboard" subtitle="Update test requests, payment states, and reports with role-protected workflows." />

      {loading && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Loader label="Refreshing lab operations..." />
        </section>
      )}

      <section className="animate-slide-up grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Requests</p>
          <p className="mt-2 text-2xl font-semibold"><CountUpNumber value={orders.length} /></p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600"><CountUpNumber value={inProgressCount} /></p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600"><CountUpNumber value={completedCount} /></p>
        </article>
        <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Paid Orders</p>
          <p className="mt-2 text-2xl font-semibold"><CountUpNumber value={paidCount} /></p>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pending Payments</p>
          <p className="mt-2 text-2xl font-semibold"><CountUpNumber value={pendingPayments} /></p>
        </article>
        <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Reports Ready</p>
          <p className="mt-2 text-2xl font-semibold text-sky-600"><CountUpNumber value={reportReadyCount} /></p>
        </article>
      </section>

      <section className="animate-slide-up rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" style={{ animationDelay: "80ms" }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Quick Work Queue</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Top 5 pending</span>
        </div>
        {!quickQueue.length ? (
          <p className="text-sm text-slate-500">No pending requests in queue.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {quickQueue.map((order) => (
              <div key={`queue-${order.id}`} className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">#{order.id} {order.patient.name}</p>
                <p className="text-xs text-slate-500">{order.orderTests.map((ot) => ot.test.name).join(", ")}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="animate-slide-up rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" style={{ animationDelay: "160ms" }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slate-900">LAB + PAYMENT: Requests and Status</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order, patient, or test"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div className="space-y-3">
          {paginatedOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">Order #{order.id} - {order.patient.name}</p>
                  <p className="text-sm text-slate-500">Tests: {order.orderTests.map((ot) => ot.test.name).join(", ")}</p>
                  <p className="text-sm text-slate-500">Total: Rs. {Number(order.totalAmount).toFixed(2)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}>{order.status}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                  onClick={() => openEditTestsModal(order.id)}
                >
                  <PencilIcon />
                  Edit Tests
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500"
                  onClick={() => handleDeleteOrder(order.id)}
                >
                  Delete
                </button>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value as "PENDING" | "IN_PROGRESS" | "COMPLETED")}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${order.paymentStatus === "PAID" ? "bg-blue-600 hover:bg-blue-500" : "bg-emerald-600 hover:bg-emerald-500"}`}
                  onClick={() => handlePaymentToggle(order.id, order.paymentStatus === "PAID" ? "PENDING" : "PAID")}
                >
                  Mark as {order.paymentStatus === "PAID" ? "Pending" : "Paid"}
                </button>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={order.sampleStatus}
                  onChange={(e) => handleSampleStatusUpdate(order.id, e.target.value as "PENDING" | "COLLECTED" | "RECEIVED" | "PROCESSING")}
                >
                  <option value="PENDING">Sample Pending</option>
                  <option value="COLLECTED">Collected</option>
                  <option value="RECEIVED">Received</option>
                  <option value="PROCESSING">Processing</option>
                </select>
                <a
                  href={`${API_URL}/payments/${order.id}/invoice`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Invoice
                </a>
              </div>

              <div className="mt-3">
                <OrderTimeline order={order} />
              </div>
            </article>
          ))}
          {!filteredOrders.length && (
            <EmptyState title="No test requests found" description="Try a different search term or status filter." />
          )}
          {!!filteredOrders.length && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-slate-600">Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50">Prev</button>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5">Page {page} / {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="animate-slide-up space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" style={{ animationDelay: "200ms" }}>
        <h2 className="text-xl font-semibold text-slate-900">REPORT: Upload and Download</h2>
        {orders.map((order) => {
          const existingReport = order.reports[0];
          return (
            <article key={`report-${order.id}`} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">Order #{order.id} - {order.patient.name}</p>
                  <p className="text-sm text-slate-500">{existingReport ? `Current: ${existingReport.fileName}` : "No report uploaded"}</p>
                </div>

                {existingReport && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewReport(existingReport)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                    >
                      <EyeIcon />
                      Preview
                    </button>
                    <a
                      href={existingReport.fileUrl || `/uploads/${existingReport.fileName}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                    >
                      Download
                    </a>
                    <select
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={existingReport.status}
                      onChange={(e) => handleReportStatusUpdate(existingReport.id, e.target.value as "UPLOADED" | "READY" | "REJECTED")}
                    >
                      <option value="UPLOADED">Uploaded</option>
                      <option value="READY">Ready</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                  onChange={(e) => handleUploadReport(order.id, e.target.files?.[0] || null)}
                  disabled={uploadingOrderId === order.id}
                />
                {uploadingOrderId === order.id && <span className="inline-flex items-center gap-2 text-xs text-slate-500"><Spinner /> Uploading...</span>}
              </div>
            </article>
          );
        })}
      </section>

      {previewReport && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Report Preview</h3>
            <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => setPreviewReport(null)}>Close</button>
          </div>
          {String(previewReport.fileType || "").includes("pdf") ? (
            <iframe title="report-preview" src={previewReport.fileUrl || `/uploads/${previewReport.fileName}`} className="h-[420px] w-full rounded-xl border" />
          ) : (
            <img src={previewReport.fileUrl || `/uploads/${previewReport.fileName}`} alt={previewReport.fileName} className="max-h-[420px] w-full rounded-xl object-contain" />
          )}
        </section>
      )}

      <section className="animate-slide-up grid gap-4 xl:grid-cols-2" style={{ animationDelay: "240ms" }}>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold text-slate-900">Payment Breakdown</h2>
          <div className="h-64 min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie data={paymentBreakdownData} dataKey="value" nameKey="name" outerRadius={90}>
                  {paymentBreakdownData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${Number(value ?? 0)} orders`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold text-slate-900">Pipeline Flow</h2>
          <div className="h-64 min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={statusFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value ?? 0)} requests`, "Pipeline"]} />
                <Bar dataKey="value" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {editingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Edit Tests for Order #{editingOrderId}</h3>
            <p className="mt-1 text-sm text-slate-500">Select the tests that should remain linked to this request.</p>

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {tests.map((test) => {
                const checked = selectedTestIds.includes(test.id);
                return (
                  <label key={test.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span className="text-sm text-slate-700">{test.name}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTestIds((prev) => [...prev, test.id]);
                          setSelectedTestPrices((prev) => ({
                            ...prev,
                            [test.id]: prev[test.id] ?? Number(test.price)
                          }));
                        } else {
                          setSelectedTestIds((prev) => prev.filter((id) => id !== test.id));
                        }
                      }}
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-4 space-y-2">
              {selectedTestIds.map((testId) => {
                const test = tests.find((item) => item.id === testId);
                if (!test) return null;

                return (
                  <div key={`price-${testId}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <span className="text-sm text-slate-700">{test.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Rs.</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={selectedTestPrices[testId] ?? Number(test.price)}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setSelectedTestPrices((prev) => ({
                            ...prev,
                            [testId]: Number.isFinite(value) ? value : 0
                          }));
                        }}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditingOrderId(null);
                  setSelectedTestIds([]);
                  setSelectedTestPrices({});
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                onClick={saveTestsForOrder}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
