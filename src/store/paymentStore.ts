import { create } from "zustand";
import API from "../api/axios";
import type { PaymentStatusRow } from "../types";

interface PaymentState {
  rows: PaymentStatusRow[];
  loading: boolean;
  error: string | null;
  statusFilter: "ALL" | "PAID" | "PENDING";
  search: string;
  setStatusFilter: (status: "ALL" | "PAID" | "PENDING") => void;
  setSearch: (search: string) => void;
  fetchPayments: () => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  statusFilter: "ALL",
  search: "",

  setStatusFilter: (status) => set({ statusFilter: status }),
  setSearch: (search) => set({ search }),

  fetchPayments: async () => {
    set({ loading: true, error: null });
    try {
      const { statusFilter, search } = get();
      const { data } = await API.get("/payments", {
        params: {
          ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
          ...(search.trim() ? { search: search.trim() } : {})
        }
      });

      set({
        rows: data.map((row: any) => ({
          ...row,
          totalAmount: Number(row.totalAmount)
        })),
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to fetch payments"
      });
      throw error;
    }
  }
}));
