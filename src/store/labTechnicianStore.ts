import { create } from "zustand";
import API from "../api/axios";
import type { Order, TestItem } from "../types";

interface LabTechnicianState {
  orders: Order[];
  tests: TestItem[];
  loading: boolean;
  error: string | null;
  fetchLabData: (options?: { silent?: boolean }) => Promise<void>;
  updateOrderTests: (orderId: string | number, testItems: Array<{ testId: string | number; unitPrice: number }>) => Promise<void>;
  deleteOrder: (orderId: string | number) => Promise<void>;
  updateOrderStatus: (orderId: string | number, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => Promise<void>;
  updateOrderSampleStatus: (orderId: string | number, sampleStatus: "PENDING" | "COLLECTED" | "RECEIVED" | "PROCESSING") => Promise<void>;
  updatePaymentStatus: (orderId: string | number, status: "PAID" | "PENDING") => Promise<void>;
  uploadReport: (orderId: string | number, file: File) => Promise<void>;
  updateReportStatus: (reportId: string | number, status: "UPLOADED" | "READY" | "REJECTED") => Promise<void>;
}

const getLatestPayment = (payments: any[]) => {
  if (!payments?.length) return null;
  return [...payments].sort((a, b) => {
    const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateDiff !== 0) return dateDiff;
    return String(b.id || "").localeCompare(String(a.id || ""));
  })[0];
};

const normalizeOrder = (item: any): Order => {
  const orderTests = (item?.orderTests || []).map((ot: any) => ({
    ...ot,
    unitPrice: Number(ot?.unitPrice ?? 0),
    test: ot?.test ? { ...ot.test, price: Number(ot.test.price ?? 0) } : { id: ot?.testId, name: "Unknown", price: 0 }
  }));

  const payments = (item?.payments || [])
    .map((payment: any) => ({
      ...payment,
      amount: Number(payment?.amount ?? 0)
    }))
    .sort((a: any, b: any) => {
      const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return String(b.id || "").localeCompare(String(a.id || ""));
    });

  const totalAmount = orderTests.reduce((sum: number, ot: any) => sum + Number(ot.unitPrice || 0), 0);

  return {
    ...item,
    orderTests,
    payments,
    reports: item?.reports || [],
    totalAmount,
    paymentStatus: getLatestPayment(payments)?.status === "PAID" ? "PAID" : "PENDING"
  };
};

export const useLabTechnicianStore = create<LabTechnicianState>((set) => ({
  orders: [],
  tests: [],
  loading: false,
  error: null,

  fetchLabData: async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      set({ loading: true, error: null });
    }
    try {
      const [ordersRes, testsRes] = await Promise.all([
        API.get("/orders", { params: { page: 1, pageSize: 100 } }),
        API.get("/tests")
      ]);

      set({
        loading: false,
        orders: (ordersRes.data?.data || []).map((item: any) => normalizeOrder(item)),
        tests: (testsRes.data || []).map((item: any) => ({ ...item, price: Number(item.price || 0) }))
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load lab dashboard"
      });
      throw error;
    }
  },

  updateOrderTests: async (orderId, testItems) => {
    try {
      await API.put(`/orders/${orderId}/tests`, { testItems });
      const [ordersRes] = await Promise.all([API.get("/orders", { params: { page: 1, pageSize: 100 } })]);
      set({
        orders: (ordersRes.data?.data || []).map((item: any) => normalizeOrder(item))
      });
    } catch (error: any) {
      set({ error: error?.response?.data?.message || "Failed to update tests" });
      throw error;
    }
  },

  deleteOrder: async (orderId) => {
    try {
      await API.delete(`/orders/${orderId}`);
      set((state) => ({
        orders: state.orders.filter((o) => String(o.id) !== String(orderId))
      }));
    } catch (error: any) {
      set({ error: error?.response?.data?.message || "Failed to delete order" });
      throw error;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      await API.put(`/orders/${orderId}/status`, { status });
      set((state) => ({
        orders: state.orders.map((o) => (String(o.id) === String(orderId) ? { ...o, status } : o))
      }));
    } catch (error: any) {
      set({ error: error?.response?.data?.message || "Failed to update order status" });
      throw error;
    }
  },

  updateOrderSampleStatus: async (orderId, sampleStatus) => {
    try {
      await API.put(`/orders/${orderId}/sample-status`, { sampleStatus });
      set((state) => ({
        orders: state.orders.map((o) => (String(o.id) === String(orderId) ? { ...o, sampleStatus } : o))
      }));
    } catch (error: any) {
      set({ error: error?.response?.data?.message || "Failed to update sample status" });
      throw error;
    }
  },

  updatePaymentStatus: async (orderId, status) => {
    try {
      await API.put(`/payments/${orderId}`, { status });
      set((state) => ({
        orders: state.orders.map((order) => {
          if (String(order.id) !== String(orderId)) return order;

          const now = new Date().toISOString();
          const existing = order.payments[0];
          const nextPayment = existing
            ? { ...existing, status, amount: order.totalAmount }
            : {
                id: -Number(orderId),
                orderId: String(orderId),
                amount: order.totalAmount,
                status,
                method: "CASH" as const,
                createdAt: now
              };

          return {
            ...order,
            paymentStatus: status,
            payments: [nextPayment, ...order.payments.slice(1)]
          };
        })
      }));
    } catch (error: any) {
      set({ error: error?.response?.data?.message || "Failed to update payment status" });
      throw error;
    }
  },

  uploadReport: async (orderId, file) => {
    try {
      const formData = new FormData();
      formData.append("orderId", String(orderId));
      formData.append("report", file);

      await API.post("/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const ordersRes = await API.get("/orders", { params: { page: 1, pageSize: 100 } });
      set({
        orders: (ordersRes.data?.data || []).map((item: any) => normalizeOrder(item))
      });
    } catch (error: any) {
      set({ error: error?.response?.data?.message || "Failed to upload report" });
      throw error;
    }
  },

  updateReportStatus: async (reportId, status) => {
    try {
      await API.patch(`/reports/${reportId}/status`, { status });
      set((state) => ({
        orders: state.orders.map((order) => ({
          ...order,
          reports: order.reports.map((r) => (String(r.id) === String(reportId) ? { ...r, status } : r))
        }))
      }));
    } catch (error: any) {
      set({ error: error?.response?.data?.message || "Failed to update report status" });
      throw error;
    }
  }
}));
