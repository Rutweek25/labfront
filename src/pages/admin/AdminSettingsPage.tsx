import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { useAdminStore } from "../../store/adminStore";

export const AdminSettingsPage = () => {
  const { settings, loading, error, fetchSettings, updateSettings } = useAdminStore();
  const [form, setForm] = useState({
    appName: "Lab Management System",
    currency: "Rs.",
    defaultRole: "DOCTOR" as "DOCTOR" | "TECHNICIAN" | "ADMIN",
    allowSelfRegistration: false
  });

  useEffect(() => {
    fetchSettings().catch((err: any) => toast.error(err?.response?.data?.message || "Failed to load settings"));
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(settings);
    }
  }, [settings]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(form);
      toast.success("Settings updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update settings");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Update system configuration for admin operations." />
      {loading && <Loader />}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input className="rounded-xl border border-slate-300 px-3 py-2" value={form.appName} onChange={(e) => setForm((p) => ({ ...p, appName: e.target.value }))} />
          <input className="rounded-xl border border-slate-300 px-3 py-2" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
          <select className="rounded-xl border border-slate-300 px-3 py-2" value={form.defaultRole} onChange={(e) => setForm((p) => ({ ...p, defaultRole: e.target.value as any }))}>
            <option value="DOCTOR">DOCTOR</option>
            <option value="TECHNICIAN">LAB</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <input type="checkbox" checked={form.allowSelfRegistration} onChange={(e) => setForm((p) => ({ ...p, allowSelfRegistration: e.target.checked }))} />
            Allow self registration
          </label>
        </div>

        <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save Settings</button>
      </form>
    </div>
  );
};
