import { create } from "zustand";
import API from "../api/axios";
import type { Order, Patient, TestItem } from "../types";

interface CreatePatientPayload {
  name: string;
  phone: string;
  age: number;
  gender: string;
}

interface UpdatePatientPayload {
  name: string;
  phone: string;
  age: number;
  gender: string;
}

interface DoctorRequestState {
  patients: Patient[];
  selectedPatient: Patient | null;
  tests: TestItem[];
  requests: Order[];
  loading: boolean;
  error: string | null;
  setSelectedPatient: (patient: Patient | null) => void;
  fetchData: (search?: string, options?: { silent?: boolean }) => Promise<void>;
  createPatientWithOrder: (payload: { patient: CreatePatientPayload; testIds: (string | number)[] }) => Promise<void>;
  createOrderForExisting: (payload: { patientId: string | number; testIds: (string | number)[] }) => Promise<void>;
  updatePatient: (patientId: string | number, payload: UpdatePatientPayload) => Promise<void>;
  deletePatient: (patientId: string | number) => Promise<void>;
  deleteOrder: (orderId: string | number) => Promise<void>;
  updateRequest: (
    orderId: string | number,
    payload: { testIds?: (string | number)[]; testItems?: Array<{ testId: string | number; unitPrice: number }> }
  ) => Promise<void>;
}

const normalizeOrder = (item: any): Order => ({
  ...item,
  orderTests: (item?.orderTests || []).map((ot: any) => ({
    ...ot,
    unitPrice: Number(ot?.unitPrice ?? 0),
    test: ot?.test ? { ...ot.test, price: Number(ot.test.price ?? 0) } : { id: ot?.testId, name: "Unknown", price: 0 }
  })),
  payments: (item?.payments || []).map((p: any) => ({
    ...p,
    amount: Number(p?.amount ?? 0)
  }))
});

export const useDoctorRequestStore = create<DoctorRequestState>((set) => ({
  patients: [],
  selectedPatient: null,
  tests: [],
  requests: [],
  loading: false,
  error: null,
  setSelectedPatient: (patient) => set({ selectedPatient: patient }),

  fetchData: async (search = "", options?: { silent?: boolean }) => {
    if (!options?.silent) {
      set({ loading: true, error: null });
    }
    try {
      const [patientsRes, testsRes, ordersRes] = await Promise.all([
        API.get("/patients", { params: { search, page: 1, pageSize: 100 } }),
        API.get("/tests"),
        API.get("/orders", { params: { search, page: 1, pageSize: 100 } })
      ]);

      set({
        patients: patientsRes.data.data,
        tests: testsRes.data.map((item: any) => ({ ...item, price: Number(item.price) })),
        requests: ordersRes.data.data.map((item: any) => normalizeOrder(item)),
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to fetch doctor dashboard data"
      });
      throw error;
    }
  },

  createPatientWithOrder: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post("/patients-with-order", payload);
      set((state) => ({
        loading: false,
        patients: data?.lists?.patients ?? state.patients,
        requests: data?.lists?.requests
          ? data.lists.requests.map((item: any) => normalizeOrder(item))
          : state.requests
      }));
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to create request"
      });
      throw error;
    }
  },

  createOrderForExisting: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post("/orders", payload);
      set((state) => ({
        loading: false,
        requests: data?.lists?.requests
          ? data.lists.requests.map((item: any) => normalizeOrder(item))
          : state.requests
      }));
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to create request"
      });
      throw error;
    }
  },

  updatePatient: async (patientId, payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put(`/patients/${patientId}`, payload);
      set((state) => {
        const nextPatients: Patient[] = data?.patients ?? state.patients.map((p) => (p.id === patientId ? { ...p, ...payload } : p));
        return {
          loading: false,
          patients: nextPatients,
          selectedPatient: nextPatients.find((p) => p.id === state.selectedPatient?.id) ?? state.selectedPatient
        };
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to update patient"
      });
      throw error;
    }
  },

  deletePatient: async (patientId) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem("lab_token");
      const { data } = await API.delete(`/patients/${patientId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      set((state) => ({
        loading: false,
        patients: data?.patients ?? state.patients.filter((p) => p.id !== patientId),
        selectedPatient: state.selectedPatient?.id === patientId ? null : state.selectedPatient
      }));
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to delete patient"
      });
      throw error;
    }
  },

  deleteOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.delete(`/orders/${orderId}`);
      set((state) => ({
        loading: false,
        requests: data?.lists?.requests
          ? data.lists.requests.map((item: any) => normalizeOrder(item))
          : state.requests.filter((order) => order.id !== orderId)
      }));
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to delete request"
      });
      throw error;
    }
  },

  updateRequest: async (orderId, payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put(`/orders/${orderId}`, payload);
      set((state) => ({
        loading: false,
        requests: data?.lists?.requests
          ? data.lists.requests.map((item: any) => normalizeOrder(item))
          : state.requests
      }));
    } catch (error: any) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to update request"
      });
      throw error;
    }
  }
}));
