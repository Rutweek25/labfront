import { useEffect, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts";
import toast from "react-hot-toast";
import API from "../api/axios";
import { PageHeader } from "../components/PageHeader";
import { Loader } from "../components/Loader";
import type { User } from "../types";

const COLORS = ["#0f766e", "#2563eb", "#7c3aed", "#ea580c"];

export const AdminDashboard = () => {
  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, usersRes] = await Promise.all([
        API.get("/admin/summary"),
        API.get("/admin/users")
      ]);
      setSummary(summaryRes.data);
      setUsers(usersRes.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const roleData = [
    { name: "Doctors", value: users.filter((user) => user.role === "DOCTOR").length },
    { name: "Technicians", value: users.filter((user) => user.role === "TECHNICIAN").length },
    { name: "Admins", value: users.filter((user) => user.role === "ADMIN").length }
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="System overview, user directory, and operational metrics." />

      {loading && <Loader />}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Users</p>
          <p className="mt-2 text-2xl font-semibold">{summary?.summary?.userCount ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Patients</p>
          <p className="mt-2 text-2xl font-semibold">{summary?.summary?.patientCount ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Orders</p>
          <p className="mt-2 text-2xl font-semibold">{summary?.summary?.orderCount ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="mt-2 text-2xl font-semibold">Rs. {Number(summary?.summary?.revenue || 0).toFixed(2)}</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="py-3 font-medium text-slate-900">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{new Date((user as any).createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Role Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={110} innerRadius={70} paddingAngle={3}>
                  {roleData.map((_entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Recent Tests</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {summary?.recentTests?.map((test: any) => (
            <div key={test.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{test.name}</p>
              <p className="text-sm text-slate-600">Rs. {Number(test.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
