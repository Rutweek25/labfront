import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import API from "../api/axios";
import { socket } from "../lib/socket";
import type { NotificationItem } from "../types";

type GlobalSearchResults = {
  patients: Array<{ id: number; name: string; phone: string }>;
  orders: Array<{
    id: number;
    patient: { name: string; phone: string };
    orderTests: Array<{ test: { name: string } }>;
    reports: Array<{ id: number; fileName: string; status: string }>;
  }>;
  reports: Array<{
    id: number;
    fileName: string;
    status: string;
    orderId: number;
    order: { patient: { name: string; phone: string } };
  }>;
};

const getWorkspacePath = (role?: string | null) => {
  if (role === "DOCTOR") return "/doctor-dashboard";
  if (role === "TECHNICIAN") return "/lab-dashboard";
  return "/admin/dashboard";
};

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
    <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.7" />
    <path d="m16.2 16.2 4.3 4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
    <path d="M12 21a2.3 2.3 0 0 0 2.2-1.6H9.8A2.3 2.3 0 0 0 12 21Zm7-4.4H5c1.3-1.1 2.1-2.1 2.1-4.4V10a4.9 4.9 0 1 1 9.8 0v2.2c0 2.3.8 3.3 2.1 4.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

const LiveDot = ({ live }: { live: boolean }) => (
  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${live ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
    <span className={`h-2.5 w-2.5 rounded-full ${live ? "bg-emerald-500" : "bg-amber-500"}`} />
    {live ? "Live" : "Reconnecting"}
  </span>
);

export const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>({ patients: [], orders: [], reports: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [socketLive, setSocketLive] = useState(socket.connected);
  const [menuOpen, setMenuOpen] = useState(false);

  const hasResults = useMemo(
    () => results.patients.length > 0 || results.orders.length > 0 || results.reports.length > 0,
    [results]
  );

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await API.get("/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch {
      // ignore notification panel errors
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, [user?.id]);

  useEffect(() => {
    socket.connect();

    const onConnect = () => setSocketLive(true);
    const onDisconnect = () => setSocketLive(false);
    const onNotification = (payload: NotificationItem & { title?: string; message?: string }) => {
      const nextNotification: NotificationItem = {
        id: payload.id,
        recipientId: payload.recipientId,
        type: payload.type,
        title: payload.title || payload.type,
        message: payload.message || payload.title || payload.type,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        metadata: payload.metadata ?? null,
        isRead: false,
        createdAt: payload.createdAt || new Date().toISOString()
      };

      setNotifications((current) => [nextNotification, ...current].slice(0, 10));
      setUnreadCount((count) => count + 1);
      if (nextNotification.message) {
        toast(nextNotification.message, { icon: "🔔" });
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("notification:new", onNotification);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("notification:new", onNotification);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const loadSearchSource = async () => {
      try {
        const [patientsResponse, ordersResponse] = await Promise.all([
          API.get("/patients", { params: { page: 1, pageSize: 100 } }),
          API.get("/orders", { params: { page: 1, pageSize: 100 } })
        ]);

        const allPatients = (patientsResponse.data?.data ?? []) as GlobalSearchResults["patients"];
        const allOrders = (ordersResponse.data?.data ?? []) as GlobalSearchResults["orders"];

        setResults((current) => ({
          ...current,
          patients: allPatients,
          orders: allOrders,
          reports: allOrders.flatMap((order) =>
            (order.reports ?? []).map((report) => ({
              id: report.id,
              fileName: report.fileName,
              status: report.status,
              orderId: order.id,
              order: { patient: order.patient }
            }))
          )
        }));
      } catch {
        // keep search working from previous in-memory results if loading fails
      }
    };

    void loadSearchSource();
  }, []);

  useEffect(() => {
    const term = search.trim();
    if (!term) {
      setResults((current) => ({ ...current, patients: [], orders: [], reports: [] }));
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const q = term.toLowerCase();
        const [patientsResponse, ordersResponse] = await Promise.all([
          API.get("/patients", { params: { page: 1, pageSize: 100 } }),
          API.get("/orders", { params: { page: 1, pageSize: 100 } })
        ]);

        const allPatients = (patientsResponse.data?.data ?? []) as GlobalSearchResults["patients"];
        const allOrders = (ordersResponse.data?.data ?? []) as GlobalSearchResults["orders"];

        const patients = allPatients.filter((patient) => {
          return (
            patient.name.toLowerCase().includes(q) ||
            patient.phone.toLowerCase().includes(q) ||
            String(patient.id).includes(q)
          );
        });

        const orders = allOrders.filter((order) => {
          const orderIdMatch = String(order.id).includes(q);
          const patientMatch = order.patient.name.toLowerCase().includes(q) || order.patient.phone.toLowerCase().includes(q);
          const testsMatch = (order.orderTests ?? []).some((item) => item.test.name.toLowerCase().includes(q));
          const reportsMatch = (order.reports ?? []).some(
            (report) =>
              report.fileName.toLowerCase().includes(q) ||
              String(report.status).toLowerCase().includes(q) ||
              String(report.id).includes(q)
          );
          return orderIdMatch || patientMatch || testsMatch || reportsMatch;
        });

        const reports = orders.flatMap((order) =>
          (order.reports ?? [])
            .filter(
              (report) =>
                report.fileName.toLowerCase().includes(q) ||
                String(report.status).toLowerCase().includes(q) ||
                String(report.id).includes(q) ||
                order.patient.name.toLowerCase().includes(q) ||
                order.patient.phone.toLowerCase().includes(q) ||
                String(order.id).includes(q)
            )
            .map((report) => ({
              id: report.id,
              fileName: report.fileName,
              status: report.status,
              orderId: order.id,
              order: { patient: order.patient }
            }))
        );

        setResults({ patients, orders, reports });
      } catch {
        setResults({ patients: [], orders: [], reports: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const markAllNotificationsRead = async () => {
    try {
      await API.patch("/notifications/read-all");
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error("Unable to update notifications");
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#fee2e2,transparent_35%),radial-gradient(circle_at_80%_0%,#dbeafe,transparent_30%),#f8fafc] text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm text-white shadow-lg shadow-slate-300">LM</span>
            <span>Lab Management</span>
          </Link>

          <nav className="hidden items-center gap-2 text-sm md:flex">
            {(user?.role === "DOCTOR" || user?.role === "ADMIN") && (
              <NavLink className="rounded-full px-3 py-1.5 hover:bg-slate-100" to="/doctor-dashboard">
                Doctor
              </NavLink>
            )}
            {(user?.role === "TECHNICIAN" || user?.role === "ADMIN") && (
              <NavLink className="rounded-full px-3 py-1.5 hover:bg-slate-100" to="/lab-dashboard">
                Lab
              </NavLink>
            )}
            {user?.role === "ADMIN" && (
              <NavLink className="rounded-full px-3 py-1.5 hover:bg-slate-100" to="/reports">
                Reports
              </NavLink>
            )}

            <div className="relative hidden lg:block">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, phone, order, report"
                className="w-80 rounded-2xl border border-slate-300 bg-white/90 py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none ring-0 transition focus:border-slate-400"
                onFocus={() => setNotificationsOpen(false)}
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              {search.trim() && (
                <div className="absolute right-0 z-40 mt-2 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                    <span>{searchLoading ? "Searching..." : hasResults ? "Results" : "No results"}</span>
                    {searchLoading && <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />}
                  </div>
                  <div className="max-h-80 overflow-auto p-2">
                    {results.orders.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Orders</p>
                        {results.orders.map((order) => (
                          <button
                            key={`o-${order.id}`}
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setResults({ patients: [], orders: [], reports: [] });
                              navigate(getWorkspacePath(user?.role));
                              toast.success(`Opened request #${order.id}`);
                            }}
                            className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="font-medium text-slate-900">Order #{order.id}</span>
                            <span className="text-xs text-slate-500">{order.patient.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.patients.length > 0 && (
                      <div className="space-y-1 pt-2">
                        <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Patients</p>
                        {results.patients.map((patient) => (
                          <button
                            key={`p-${patient.id}`}
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setResults({ patients: [], orders: [], reports: [] });
                              navigate(`/create-request/existing?patientId=${patient.id}`);
                              toast.success(`Opened ${patient.name}`);
                            }}
                            className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="font-medium text-slate-900">{patient.name}</span>
                            <span className="text-xs text-slate-500">{patient.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.reports.length > 0 && (
                      <div className="space-y-1 pt-2">
                        <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reports</p>
                        {results.reports.map((report) => (
                          <button
                            key={`r-${report.id}`}
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setResults({ patients: [], orders: [], reports: [] });
                              navigate("/reports");
                              toast.success(`Opened report for order #${report.orderId}`);
                            }}
                            className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="font-medium text-slate-900">{report.fileName}</span>
                            <span className="text-xs text-slate-500">#{report.orderId} • {report.order.patient.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!searchLoading && !hasResults && (
                      <p className="px-3 py-6 text-center text-sm text-slate-500">No matching patients, orders, or reports.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <LiveDot live={socketLive} />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((value) => !value);
                    setMenuOpen(false);
                  }}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300"
                >
                  <BellIcon />
                  {unreadCount > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-96 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Notifications</p>
                        <p className="text-xs text-slate-500">{unreadCount} unread</p>
                      </div>
                      <button type="button" onClick={markAllNotificationsRead} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-auto p-2">
                      {!notifications.length && <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications yet.</p>}
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={async () => {
                            if (!notification.isRead) {
                              try {
                                await API.patch(`/notifications/${notification.id}/read`);
                                setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
                                setUnreadCount((count) => Math.max(count - 1, 0));
                              } catch {
                                toast.error("Unable to open notification");
                              }
                            }
                          }}
                          className={`w-full rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50 ${notification.isRead ? "opacity-70" : "bg-slate-50/70"}`}
                        >
                          <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                          <p className="mt-2 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen((value) => !value);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">{user?.name?.slice(0, 1) ?? "U"}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.role}</p>
                  </div>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-56 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate("/login");
                      }}
                      className="w-full rounded-2xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm hover:bg-slate-50 md:hidden"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </nav>
        </div>

        {/* Mobile Nav Collapse */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200">
            <div className="space-y-4 px-4 py-4 backdrop-blur-3xl bg-white shadow-xl">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, phone, order"
                className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
              />
              
              <nav className="flex flex-col gap-2 font-medium">
                {(user?.role === "DOCTOR" || user?.role === "ADMIN") && (
                  <NavLink onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/doctor-dashboard">Doctor Dashboard</NavLink>
                )}
                {(user?.role === "TECHNICIAN" || user?.role === "ADMIN") && (
                  <NavLink onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/lab-dashboard">Lab Dashboard</NavLink>
                )}
                {(user?.role === "TECHNICIAN" || user?.role === "ADMIN") && (
                  <NavLink onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/tests">Tests</NavLink>
                )}
                {user?.role === "ADMIN" && (
                  <NavLink onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/admin/dashboard">Admin Dashboard</NavLink>
                )}
                <NavLink onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/payments">Payments</NavLink>
                <NavLink onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/reports">Reports</NavLink>
              </nav>

              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <button type="button" onClick={markAllNotificationsRead} className="text-xs font-semibold text-slate-600">Mark read</button>
                </div>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                      <p className="text-xs text-slate-500">{notification.message}</p>
                    </div>
                  ))}
                  {!notifications.length && <p className="text-xs text-slate-500">No notifications yet.</p>}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-2">
                <span className="text-sm font-semibold truncate">{user?.name} ({user?.role})</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6 w-full">
        <Outlet />
      </main>
    </div>
  );
};
