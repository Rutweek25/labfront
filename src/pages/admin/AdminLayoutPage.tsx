import { NavLink, Outlet } from "react-router-dom";

const menu = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Users", path: "/admin/users" },
  { label: "Tests", path: "/admin/tests" },
  { label: "Payments", path: "/admin/payments" },
  { label: "Reports", path: "/admin/reports" },
  { label: "Audit Logs", path: "/admin/audit-logs" },
  { label: "Settings", path: "/admin/settings" }
];

export const AdminLayoutPage = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</h2>
        <nav className="space-y-1">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 text-sm ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section>
        <Outlet />
      </section>
    </div>
  );
};
