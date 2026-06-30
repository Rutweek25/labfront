import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import API from "../api/axios";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { Skeleton } from "../components/Skeleton";
import { socket } from "../lib/socket";
import { API_URL } from "../lib/runtimeConfig";
import type { Report } from "../types";

export const ReportsPage = () => {
  const [orderId, setOrderId] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const Spinner = () => <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />;

  const API_BASE = API_URL.replace(/\/api\/?$/, "");

  const fetchReports = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await API.get(`/reports/${id}`);
      setReports(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(orderId);
  }, [orderId]);

  useEffect(() => {
    const onReport = () => {
      if (orderId) {
        fetchReports(orderId);
      }
    };
    socket.on("report:uploaded", onReport);
    socket.on("notification:new", onReport);

    return () => {
      socket.off("report:uploaded", onReport);
      socket.off("notification:new", onReport);
    };
  }, [orderId]);

  const uploadReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!orderId || !file) {
      toast.error("Select order and file");
      return;
    }

    if (!/^\d+$/.test(orderId.trim())) {
      toast.error("Order ID must be numeric");
      return;
    }

    const formData = new FormData();
    formData.append("report", file);

    try {
      setUploading(true);
      await API.post(`/reports/${orderId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Report uploaded");
      setFile(null);
      fetchReports(orderId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Upload and download lab reports in PDF or image format." />

      <form onSubmit={uploadReport} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-xl border border-slate-300 px-4 py-2.5"
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            inputMode="numeric"
            required
          />
          <input
            type="file"
            className="rounded-xl border border-slate-300 px-4 py-2.5"
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
          <button type="button" onClick={() => fetchReports(orderId)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Preview List</button>
          <button disabled={uploading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{uploading ? <Spinner /> : null}{uploading ? "Uploading..." : "Upload"}</button>
        </div>
      </form>

      <section className="space-y-3">
        {loading && (
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {!loading && !reports.length && (
          <EmptyState title="No reports found" description="Upload a report or check a different order ID." />
        )}
        {reports.map((report) => (
          <article key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="font-semibold">{report.fileName}</p>
              <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{report.status}</p>
              <p className="text-sm text-slate-600">{new Date(report.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedReport(report)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Preview
              </button>
              <a
                href={`${API_BASE}/api/reports/download/${report.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Download
              </a>
            </div>
          </article>
        ))}
      </section>

      {selectedReport && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Report Preview</h3>
            <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => setSelectedReport(null)}>Close</button>
          </div>
          {selectedReport.fileType.includes("pdf") ? (
            <iframe title="report-preview" src={`${API_BASE}${selectedReport.fileUrl}`} className="h-[480px] w-full rounded-xl border" />
          ) : (
            <img src={`${API_BASE}${selectedReport.fileUrl}`} alt={selectedReport.fileName} className="max-h-[480px] w-full rounded-xl object-contain" />
          )}
        </section>
      )}
    </div>
  );
};
