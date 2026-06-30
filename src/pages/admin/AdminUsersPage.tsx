import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { useAdminStore } from "../../store/adminStore";
import type { User } from "../../types";

export const AdminUsersPage = () => {
  const { users, loading, error, fetchUsers, createUser, updateUser, deleteUser, toggleUserStatus } = useAdminStore();
  const [form, setForm] = useState({ name: "", email: "", role: "DOCTOR" as "DOCTOR" | "TECHNICIAN" | "ADMIN", password: "" });
  const [editing, setEditing] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers().catch((err: any) => toast.error(err?.response?.data?.message || "Failed to load users"));
  }, [fetchUsers]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateUser(editing.id, { name: form.name, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) });
        toast.success("User updated");
      } else {
        await createUser(form);
        toast.success("User created");
      }
      setForm({ name: "", email: "", role: "DOCTOR", password: "" });
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save user");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Manage doctors, lab technicians, and admin accounts." />
      {loading && <Loader />}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
        <select className="rounded-xl border border-slate-300 px-3 py-2" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as any }))}>
          <option value="DOCTOR">DOCTOR</option>
          <option value="TECHNICIAN">LAB</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder={editing ? "New password (optional)" : "Password"} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
        <div className="md:col-span-4 flex gap-2">
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{editing ? "Update User" : "Add User"}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: "", email: "", role: "DOCTOR", password: "" }); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancel</button>}
        </div>
      </form>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100">
                <td className="py-3 pr-3 font-medium text-slate-900">{user.name}</td>
                <td className="py-3 pr-3">{user.email}</td>
                <td className="py-3 pr-3">{user.role === "TECHNICIAN" ? "LAB" : user.role}</td>
                <td className="py-3 pr-3">{user.isActive === false ? "Inactive" : "Active"}</td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5" onClick={() => { setEditing(user); setForm({ name: user.name, email: user.email, role: user.role as any, password: "" }); }}>Edit</button>
                    <button type="button" className="rounded-lg border border-amber-300 px-3 py-1.5 text-amber-700" onClick={() => toggleUserStatus(user.id, user.isActive === false)}>{user.isActive === false ? "Activate" : "Deactivate"}</button>
                    <button type="button" className="rounded-lg border border-rose-300 px-3 py-1.5 text-rose-700" onClick={() => deleteUser(user.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
