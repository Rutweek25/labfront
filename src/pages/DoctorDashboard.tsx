import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { socket } from "../lib/socket";
import { Loader } from "../components/Loader";
import { EmptyState } from "../components/EmptyState";
import { OrderTimeline } from "../components/OrderTimeline";
import { PageHeader } from "../components/PageHeader";
import type { Order, TestItem } from "../types";
import { useDoctorRequestStore } from "../store/doctorRequestStore";

type RequestStatus = "PENDING" | "IN_PROGRESS" | "PAID" | "COMPLETED";
type StatusTone = "completed" | "pending" | "in-progress" | "issue";

const PAGE_SIZE = 8;

const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
);

const PencilIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M13.3 3.3l3.4 3.4M3.3 16.7l3.2-.7 9.3-9.3-2.5-2.5-9.3 9.3-.7 3.2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M4.5 6h11M7.5 6V4.8c0-.4.3-.8.8-.8h3.4c.5 0 .8.4.8.8V6M7.2 9.2v5.3M10 9.2v5.3M12.8 9.2v5.3M6.6 16h6.8c.5 0 .9-.4 1-.9L15 6H5l.6 9.1c0 .5.4.9 1 .9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M1.8 10s3-5 8.2-5 8.2 5 8.2 5-3 5-8.2 5-8.2-5-8.2-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 12.7A2.7 2.7 0 1 0 10 7.3a2.7 2.7 0 0 0 0 5.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getRequestStatus = (order: Order): RequestStatus => {
  if (order.payments.some((payment) => payment.status === "PAID")) return "PAID";
  if (order.status === "COMPLETED") return "COMPLETED";
  if (order.status === "IN_PROGRESS") return "IN_PROGRESS";
  return "PENDING";
};

const toneClass = (tone: StatusTone) => {
  if (tone === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "in-progress") return "border-blue-200 bg-blue-50 text-blue-700";
  if (tone === "issue") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const requestStatusTone = (status: RequestStatus): StatusTone => {
  if (status === "PAID" || status === "COMPLETED") return "completed";
  if (status === "IN_PROGRESS") return "in-progress";
  return "pending";
};

const sampleStatusMeta = (order: Order) => {
  if (order.sampleStatus === "PROCESSING") return { label: "Processing", tone: "in-progress" as StatusTone };
  if (order.sampleStatus === "COLLECTED" || order.sampleStatus === "RECEIVED") {
    return { label: order.sampleStatus === "COLLECTED" ? "Collected" : "Received", tone: "completed" as StatusTone };
  }
  return { label: "Pending", tone: "pending" as StatusTone };
};

const labStatusMeta = (order: Order) => {
  if (order.status === "COMPLETED") return { label: "Completed", tone: "completed" as StatusTone };
  if (order.status === "IN_PROGRESS") return { label: "In Progress", tone: "in-progress" as StatusTone };
  return { label: "Pending", tone: "pending" as StatusTone };
};

const paymentStatusMeta = (order: Order) => {
  const isPaid = order.payments.some((payment) => payment.status === "PAID");
  return isPaid ? { label: "Paid", tone: "completed" as StatusTone } : { label: "Pending", tone: "pending" as StatusTone };
};

const reportStatusMeta = (order: Order) => {
  const latestReport = order.reports[0];
  if (!latestReport) return { label: "Pending", tone: "pending" as StatusTone };
  if (latestReport.status === "READY") return { label: "Ready", tone: "completed" as StatusTone };
  if (latestReport.status === "REJECTED") return { label: "Issue", tone: "issue" as StatusTone };
  return { label: "In Progress", tone: "in-progress" as StatusTone };
};

const requestDateLabel = (value: string) => {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const getTotalAmount = (order: Order) => {
  return order.orderTests.reduce((sum, item) => sum + Number(item.unitPrice), 0);
};

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const {
    tests,
    requests,
    loading,
    error,
    fetchData,
    deletePatient,
    deleteOrder,
    updateRequest
  } = useDoctorRequestStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>("ALL");
  const [page, setPage] = useState(1);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdatingRequest, setIsUpdatingRequest] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Order | null>(null);
  const [viewingRequest, setViewingRequest] = useState<Order | null>(null);
  const [editTests, setEditTests] = useState<number[]>([]);
  const [editTestPrices, setEditTestPrices] = useState<Record<number, number>>({});
  const [confirmAction, setConfirmAction] = useState<
    | null
    | { type: "patient"; patientId: number; label: string }
    | { type: "order"; orderId: number; label: string }
  >(null);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((order) => {
      const requestStatus = getRequestStatus(order);
      const statusMatch = statusFilter === "ALL" || requestStatus === statusFilter;
      const searchMatch =
        !query ||
        order.patient.name.toLowerCase().includes(query) ||
        order.patient.phone.toLowerCase().includes(query) ||
        order.orderTests.some((item) => item.test.name.toLowerCase().includes(query));

      return statusMatch && searchMatch;
    });
  }, [requests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, page]);

  const totalEditSelected = useMemo(() => {
    return editTests.reduce((sum, testId) => sum + Number(editTestPrices[testId] ?? 0), 0);
  }, [editTests, editTestPrices]);

  useEffect(() => {
    fetchData().catch((err: any) => {
      toast.error(err?.response?.data?.message || "Failed to load doctor dashboard");
    });
  }, [fetchData]);

  useEffect(() => {
    const syncDashboard = () => {
      fetchData(search).catch(() => {
        // no-op
      });
    };

    socket.on("order:new", syncDashboard);
    socket.on("order:updated", syncDashboard);
    socket.on("payment:updated", syncDashboard);
    socket.on("report:uploaded", syncDashboard);
    socket.on("notification:new", syncDashboard);

    return () => {
      socket.off("order:new", syncDashboard);
      socket.off("order:updated", syncDashboard);
      socket.off("payment:updated", syncDashboard);
      socket.off("report:uploaded", syncDashboard);
      socket.off("notification:new", syncDashboard);
    };
  }, [fetchData, search]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openEditModal = (order: Order) => {
    setEditingRequest(order);
    setEditTests(order.orderTests.map((item) => item.testId));
    setEditTestPrices(
      order.orderTests.reduce<Record<number, number>>((acc, item) => {
        acc[item.testId] = Number(item.unitPrice);
        return acc;
      }, {})
    );
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setEditingRequest(null);
    setEditTests([]);
    setEditTestPrices({});
    setIsEditOpen(false);
  };

  const closeViewModal = () => {
    setViewingRequest(null);
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingRequest) {
      return;
    }

    if (!editTests.length) {
      toast.error("Select at least one test");
      return;
    }

    try {
      setIsUpdatingRequest(true);
      const testItems = editTests.map((testId) => ({
        testId,
        unitPrice: Number(editTestPrices[testId] ?? 0)
      }));

      await updateRequest(editingRequest.id, { testItems });
      toast.success("Request updated successfully");
      closeEditModal();
      await fetchData(search);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update request");
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmAction) {
      return;
    }

    try {
      if (confirmAction.type === "order") {
        await deleteOrder(confirmAction.orderId);
        toast.success("Request deleted successfully");
      } else {
        await deletePatient(confirmAction.patientId);
        toast.success("Patient deleted successfully");
      }
      setConfirmAction(null);
      await fetchData(search);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        toast.error("You are not allowed to delete this request");
        return;
      }
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Dashboard" subtitle="Create requests for existing patients and manage request history." />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Create Request</h2>
        <p className="mb-4 text-sm text-slate-600">Choose how you'd like to create a lab request:</p>
        
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/create-request/existing")}
            className="rounded-xl border-2 border-blue-200 bg-blue-50 px-5 py-4 text-left transition hover:border-blue-300 hover:bg-blue-100"
          >
            <p className="font-semibold text-blue-900">Existing Patient</p>
            <p className="mt-1 text-sm text-blue-700">Create a request for a patient already in the system</p>
          </button>
          
          <button
            type="button"
            onClick={() => navigate("/create-request/new")}
            className="rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <p className="font-semibold text-slate-900">+ New Patient</p>
            <p className="mt-1 text-sm text-slate-600">Create a new patient and submit a request together</p>
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Request History</h2>
            <p className="mt-1 text-sm text-slate-500">Manage and track all lab requests</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name or phone"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
            />
            <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="m16.2 16.2 4.3 4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | RequestStatus)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        {loading ? (
          <div className="mt-5">
            <Loader />
          </div>
        ) : !filteredRequests.length ? (
          <div className="mt-5">
            <EmptyState title="No requests found" description="Create a request or clear the filters to view the full request history." />
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginatedRequests.map((order) => {
                const requestStatus = getRequestStatus(order);
                const sampleMeta = sampleStatusMeta(order);
                const labMeta = labStatusMeta(order);
                const paymentMeta = paymentStatusMeta(order);
                const reportMeta = reportStatusMeta(order);
                const totalAmount = getTotalAmount(order);

                return (
                  <article
                    key={order.id}
                    className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Request #{order.id}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{order.patient.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{order.patient.phone}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass(requestStatusTone(requestStatus))}`}>
                        {requestStatus.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Date</span>
                        <span className="font-medium text-slate-900">{requestDateLabel(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Total</span>
                        <span className="font-medium text-slate-900">₹ {totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Tests</span>
                        <span className="font-medium text-slate-900">{order.orderTests.length}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass(sampleMeta.tone)}`}>Sample: {sampleMeta.label}</span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass(labMeta.tone)}`}>Lab: {labMeta.label}</span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass(paymentMeta.tone)}`}>Payment: {paymentMeta.label}</span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass(reportMeta.tone)}`}>Report: {reportMeta.label}</span>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Progress</p>
                      <OrderTimeline order={order} />
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setViewingRequest(order)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <EyeIcon />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(order)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <PencilIcon />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            type: "order",
                            orderId: order.id,
                            label: `Delete request #${order.id}?`
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        <TrashIcon />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col items-start justify-between gap-3 text-sm text-slate-600 md:flex-row md:items-center">
              <p>
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredRequests.length)} of {filteredRequests.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700">Page {page} / {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {viewingRequest && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Request #{viewingRequest.id}</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{viewingRequest.patient.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{viewingRequest.patient.phone}</p>
              </div>
              <button type="button" onClick={closeViewModal} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
                Close
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Sample</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{sampleStatusMeta(viewingRequest).label}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Lab</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{labStatusMeta(viewingRequest).label}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Payment</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{paymentStatusMeta(viewingRequest).label}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Report</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{reportStatusMeta(viewingRequest).label}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Selected Tests</p>
                  <div className="mt-3 space-y-2">
                    {viewingRequest.orderTests.map((item) => (
                      <div key={`${item.testId}-${item.test.name}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                        <span>{item.test.name}</span>
                        <span>₹ {Number(item.unitPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-slate-900">
                    <span>Total</span>
                    <span>₹ {getTotalAmount(viewingRequest).toFixed(2)}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Progress</p>
                  <div className="mt-3">
                    <OrderTimeline order={viewingRequest} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    closeViewModal();
                    openEditModal(viewingRequest);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Edit Request
                </button>
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && editingRequest && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white pb-4">
              <h3 className="text-xl font-semibold text-slate-900">Edit Request #{editingRequest.id}</h3>
              <button type="button" onClick={closeEditModal} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                Close
              </button>
            </div>

            <form onSubmit={submitEdit} className="space-y-4 pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input value={editingRequest.patient.name} readOnly className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5" />
                <input value={editingRequest.patient.phone} readOnly className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5" />
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-600">Update Tests</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {tests.map((test: TestItem) => {
                    const checked = editTests.includes(test.id);
                    return (
                      <label key={test.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setEditTests((prev) =>
                              checked ? prev.filter((id) => id !== test.id) : [...prev, test.id]
                            );
                            if (!checked) {
                              setEditTestPrices((prev) => ({
                                ...prev,
                                [test.id]: prev[test.id] ?? Number(test.price)
                              }));
                            }
                          }}
                        />
                        <span className="font-medium">{test.name}</span>
                        <span className="ml-auto text-slate-500">₹ {Number(test.price).toFixed(2)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-600">Edit Test Pricing</p>
                <div className="space-y-2">
                  {editTests.map((testId) => {
                    const test = tests.find((item) => item.id === testId);
                    if (!test) return null;

                    return (
                      <div key={`edit-price-${testId}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                        <span className="font-medium text-slate-700">{test.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">₹</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={editTestPrices[testId] ?? Number(test.price)}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setEditTestPrices((prev) => ({
                                ...prev,
                                [testId]: Number.isFinite(value) ? value : 0
                              }));
                            }}
                            className="w-28 rounded-lg border border-slate-300 px-2 py-1.5"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Recalculated Total: ₹ {totalEditSelected.toFixed(2)}</p>
                <button
                  type="submit"
                  disabled={!editTests.length || loading || isUpdatingRequest}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isUpdatingRequest ? <Spinner /> : <PencilIcon />}
                  {isUpdatingRequest ? "Updating..." : "Update Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirm Action</h3>
            <p className="mt-2 text-sm text-slate-600">{confirmAction.label}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};