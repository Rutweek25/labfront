import { create } from "zustand";
import API from "../api/axios";
import type {
  AdminDashboardAnalytics,
  AdminPaymentRow,
  AdminReportRow,
  AdminSettings,
  Order,
  TestItem,
  User
} from "../types";

interface AdminStore {
  users: User[];
  tests: TestItem[];
  orders: Order[];
  payments: AdminPaymentRow[];
  reports: AdminReportRow[];
  analytics: AdminDashboardAnalytics | null;
  settings: AdminSettings | null;
  loading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  createUser: (payload: { name: string; email: string; role: "DOCTOR" | "TECHNICIAN" | "ADMIN"; password?: string }) => Promise<void>;
  updateUser: (id: number, payload: Partial<{ name: string; email: string; role: "DOCTOR" | "TECHNICIAN" | "ADMIN"; password: string; isActive: boolean }>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  toggleUserStatus: (id: number, isActive: boolean) => Promise<void>;
  fetchTests: () => Promise<void>;
  createTest: (payload: { name: string; price: number }) => Promise<void>;
  updateTest: (id: number, payload: Partial<{ name: string; price: number }>) => Promise<void>;
  deleteTest: (id: number) => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchPayments: (filters?: { status?: "PAID" | "PENDING" | "ALL"; startDate?: string; endDate?: string }) => Promise<void>;
  fetchReports: (status?: "UPLOADED" | "READY" | "REJECTED" | "ALL") => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: AdminSettings) => Promise<void>;
}

const normalizeOrder = (item: any): Order => ({
  ...item,
  orderTests: (item.orderTests || []).map((ot: any) => ({
    ...ot,
    unitPrice: Number(ot.unitPrice),
    test: { ...ot.test, price: Number(ot.test.price) }
  })),
  payments: (item.payments || []).map((payment: any) => ({
    ...payment,
    amount: Number(payment.amount)
  })),
  reports: item.reports || [],
  totalAmount: (item.orderTests || []).reduce((sum: number, ot: any) => sum + Number(ot.unitPrice), 0),
  paymentStatus: item.payments?.[0]?.status === "PAID" ? "PAID" : "PENDING"
});

export const useAdminStore = create<AdminStore>((set) => ({
  users: [],
  tests: [],
  orders: [],
  payments: [],
  reports: [],
  analytics: null,
  settings: null,
  loading: false,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get("/admin/dashboard");
      set({ analytics: data, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to load dashboard" });
      throw error;
    }
  },

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get("/admin/users");
      set({ users: data, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to load users" });
      throw error;
    }
  },

  createUser: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post("/admin/users", payload);
      set((state) => ({ users: [data, ...state.users], loading: false }));
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to create user" });
      throw error;
    }
  },

  updateUser: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put(`/admin/users/${id}`, payload);
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? data : user)),
        loading: false
      }));
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to update user" });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await API.delete(`/admin/users/${id}`);
      set((state) => ({ users: state.users.filter((user) => user.id !== id), loading: false }));
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to delete user" });
      throw error;
    }
  },

  toggleUserStatus: async (id, isActive) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.patch(`/admin/users/${id}/status`, { isActive });
      set((state) => ({ users: state.users.map((user) => (user.id === id ? data : user)), loading: false }));
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to update status" });
      throw error;
    }
  },

  fetchTests: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get("/tests");
      set({ tests: data.map((item: any) => ({ ...item, price: Number(item.price) })), loading: false });
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to load tests" });
      throw error;
    }
  },

  createTest: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post("/tests", payload);
      set((state) => ({ tests: [...state.tests, { ...data, price: Number(data.price) }], loading: false }));
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to create test" });
      throw error;
    }
  },

  updateTest: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put(`/tests/${id}`, payload);
      set((state) => ({
        tests: state.tests.map((test) => (test.id === id ? { ...data, price: Number(data.price) } : test)),
        loading: false
      }));
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to update test" });
      throw error;
    }
  },

  deleteTest: async (id) => {
    set({ loading: true, error: null });
    try {
      await API.delete(`/tests/${id}`);
      set((state) => ({ tests: state.tests.filter((test) => test.id !== id), loading: false }));
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to delete test" });
      throw error;
    }
  },

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get("/admin/orders");
      set({ orders: data.map((item: any) => normalizeOrder(item)), loading: false });
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to load orders" });
      throw error;
    }
  },

  fetchPayments: async (filters) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get("/admin/payments", {
        params: {
          ...(filters?.status && filters.status !== "ALL" ? { status: filters.status } : {}),
          ...(filters?.startDate ? { startDate: filters.startDate } : {}),
          ...(filters?.endDate ? { endDate: filters.endDate } : {})
        }
      });

      set({
        payments: (data.rows || []).map((row: any) => ({ ...row, amount: Number(row.amount) })),
        loading: false
      });
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to load payments" });
      throw error;
    }
  },

  fetchReports: async (status = "ALL") => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get("/admin/reports", {
        params: {
          ...(status !== "ALL" ? { status } : {})
        }
      });
      set({ reports: data, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to load reports" });
      throw error;
    }
  },

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get("/admin/settings");
      set({ settings: data, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to load settings" });
      throw error;
    }
  },

  updateSettings: async (settings) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put("/admin/settings", settings);
      set({ settings: data.settings, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || "Failed to update settings" });
      throw error;
    }
  }
}));
