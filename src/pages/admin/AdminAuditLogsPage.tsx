import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import type { AuditLogItem } from "../../types";

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchLogs = async (query = "") => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/audit-logs", { params: query ? { search: query } : {} });
      setLogs(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Inspect tracked user actions, metadata, and entity changes." />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or entity"
            className="min-w-72 rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="button" onClick={() => fetchLogs(search.trim())} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Search
          </button>
        </div>
      </div>

      {loading && <Loader />}

      {!loading && !logs.length ? (
        <EmptyState title="No audit logs found" description="Tracked actions will appear here after user activity." />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3">Entity</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Actor</th>
                <th className="py-2 pr-3">Metadata</th>
                <th className="py-2 pr-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-3 font-medium text-slate-900">{log.entityType}{log.entityId ? ` #${log.entityId}` : ""}</td>
                  <td className="py-3 pr-3">{log.action}</td>
                  <td className="py-3 pr-3">{log.actorRole || "SYSTEM"}{log.actorId ? ` (${log.actorId})` : ""}</td>
                  <td className="py-3 pr-3 text-slate-600">{log.metadata ? JSON.stringify(log.metadata) : "-"}</td>
                  <td className="py-3 pr-3">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};