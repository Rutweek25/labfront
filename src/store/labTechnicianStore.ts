import { create } from "zustand";
import API from "../api/axios";
import type { Order, TestItem } from "../types";

interface LabTechnicianState {
  orders: Order[];
  tests: TestItem[];
  loading: boolean;
  error: string | null;
  fetchLabData: () => Promise<void>;
  updateOrderTests: (orderId: number, testItems: Array<{ testId: number; unitPrice: number }>) => Promise<void>;
  deleteOrder: (orderId: number) => Promise<void>;
  updateOrderStatus: (orderId: number, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => Promise<void>;
  updateOrderSampleStatus: (orderId: number, sampleStatus: "PENDING" | "COLLECTED" | "RECEIVED" | "PROCESSING") => Promise<void>;
  updatePaymentStatus: (orderId: number, status: "PAID" | "PENDING") => Promise<void>;
  uploadReport: (orderId: number, file: File) => Promise<void>;
  updateReportStatus: (reportId: number, status: "UPLOADED" | "READY" | "REJECTED") => Promise<void>;
}

const getLatestPayment = (payments: any[]) => {
  if (!payments?.length) return null;
  return [...payments].sort((a, b) => {
    const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateDiff !== 0) return dateDiff;
    return Number(b.id) - Number(a.id);
  })[0];
};

const normalizeOrder = (item: any): Order => ({
  ...item,
  orderTests: item.orderTests.map((ot: any) => ({
    ...ot,
    unitPrice: Number(ot.unitPrice),
    test: { ...ot.test, price: Number(ot.test.price) }
  })),
  payments: item.payments
    .map((payment: any) => ({
      ...payment,
      amount: Number(payment.amount)
    }))
    .sort((a: any, b: any) => {
      const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return Number(b.id) - Number(a.id);
    }),
  totalAmount: item.orderTests.reduce((sum: number, ot: any) => sum + Number(ot.unitPrice), 0),
  paymentStatus: getLatestPayment(item.payments)?.status === "PAID" ? "PAID" : "PENDING"
});

export const useLabTechnicianStore = create<LabTechnicianState>((set, get) => ({
  orders: [],
  tests: [],
  loading: false,
  error: null,

  fetchLabData: async () => {
    set({ loading: true, error: null });
    try {
      const [ordersRes, testsRes] = await Promise.all([
        API.get("/orders", { params: { page: 1, pageSize: 100 } }),
        API.get("/tests")
      ]);

      set({
        loading: false,
        orders: ordersRes.data.data.map((item: any) => normalizeOrder(item)),
        tests: testsRes.data.map((item: any) => ({ ...item, price: Number(item.price) }))
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
    set({ loading: true, error: null });
    try {
      await API.put(`/orders/${orderId}/tests`, { testItems });
      await get().fetchLabData();
      set({ loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to update tests"
      });
      throw error;
    }
  },

  deleteOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      await API.delete(`/orders/${orderId}`);
      await get().fetchLabData();
      set({ loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to delete order"
      });
      throw error;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ loading: true, error: null });
    try {
      await API.put(`/orders/${orderId}/status`, { status });
      await get().fetchLabData();
      set({ loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to update order status"
      });
      throw error;
    }
  },

  updateOrderSampleStatus: async (orderId, sampleStatus) => {
    set({ loading: true, error: null });
    try {
      await API.put(`/orders/${orderId}/sample-status`, { sampleStatus });
      await get().fetchLabData();
      set({ loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to update sample status"
      });
      throw error;
    }
  },

  updatePaymentStatus: async (orderId, status) => {
    set({ loading: true, error: null });
    try {
      await API.put(`/payments/${orderId}`, { status });

      set((state) => ({
        loading: true,
        orders: state.orders.map((order) => {
          if (order.id !== orderId) return order;

          const now = new Date().toISOString();
          const existing = order.payments[0];
          const nextPayment = existing
            ? { ...existing, status, amount: order.totalAmount }
            : {
                id: -orderId,
                orderId,
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

      await get().fetchLabData();
      set({ loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to update payment status"
      });
      throw error;
    }
  },

  uploadReport: async (orderId, file) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("orderId", String(orderId));
      formData.append("report", file);

      await API.post("/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await get().fetchLabData();
      set({ loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to upload report"
      });
      throw error;
    }
  },

  updateReportStatus: async (reportId, status) => {
    set({ loading: true, error: null });
    try {
      await API.patch(`/reports/${reportId}/status`, { status });
      await get().fetchLabData();
      set({ loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to update report status"
      });
      throw error;
    }
  }
}));
