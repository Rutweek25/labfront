import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { API_URL } from "../../lib/runtimeConfig";
import { useAdminStore } from "../../store/adminStore";

const API_BASE = API_URL.replace(/\/api\/?$/, "");

export const AdminReportsPage = () => {
  const { reports, loading, error, fetchReports } = useAdminStore();
  const [status, setStatus] = useState<"ALL" | "UPLOADED" | "READY" | "REJECTED">("ALL");

  const load = async (nextStatus: "ALL" | "UPLOADED" | "READY" | "REJECTED") => {
    try {
      await fetchReports(nextStatus);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load reports");
    }
  };

  useEffect(() => {
    load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="View and download generated reports." />
      {loading && <Loader />}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <select
            value={status}
            className="rounded-xl border border-slate-300 px-3 py-2"
            onChange={(e) => {
              const next = e.target.value as "ALL" | "UPLOADED" | "READY" | "REJECTED";
              setStatus(next);
              load(next);
            }}
          >
            <option value="ALL">All</option>
            <option value="UPLOADED">UPLOADED</option>
            <option value="READY">READY</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-3">Order</th>
              <th className="py-2 pr-3">Patient</th>
              <th className="py-2 pr-3">File</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-slate-100">
                <td className="py-3 pr-3 font-medium text-slate-900">#{report.orderId}</td>
                <td className="py-3 pr-3">{report.patientName}</td>
                <td className="py-3 pr-3">{report.fileName}</td>
                <td className="py-3 pr-3">{report.status}</td>
                <td className="py-3 pr-3">{new Date(report.createdAt).toLocaleDateString()}</td>
                <td className="py-3 text-right">
                  <a className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs" href={`${API_BASE}${report.fileUrl}`} target="_blank" rel="noreferrer">Download</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
