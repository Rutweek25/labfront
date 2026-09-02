import { create } from "zustand";
import { persist } from "zustand/middleware";
import API from "../api/axios";
import type { Role, User } from "../types";
import { refreshSocketAuth } from "../lib/socket";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  resetLoading: () => void;
  login: (email: string, password: string, role: Role) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<{ email: string }>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<void>;
  resendRegistrationOtp: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyResetOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) => Promise<void>;
  logout: () => void;
}

type PersistedAuthState = {
  user: User | null;
  token: string | null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      resetLoading: () => set({ loading: false }),
      login: async (email, password, role) => {
        set({ loading: true });
        try {
          const { data } = await API.post("/auth/login", { email, password, role });
          localStorage.setItem("lab_token", data.token);
          refreshSocketAuth();
          set({ user: data.user, token: data.token });
        } finally {
          set({ loading: false });
        }
      },
      register: async (payload) => {
        set({ loading: true });
        try {
          const { data } = await API.post("/auth/register", payload);
          return { email: data.email };
        } finally {
          set({ loading: false });
        }
      },
      verifyRegistrationOtp: async (email, otp) => {
        set({ loading: true });
        try {
          await API.post("/auth/verify-otp", { email, otp });
        } finally {
          set({ loading: false });
        }
      },
      resendRegistrationOtp: async (email) => {
        set({ loading: true });
        try {
          await API.post("/auth/resend-otp", { email });
        } finally {
          set({ loading: false });
        }
      },
      forgotPassword: async (email) => {
        set({ loading: true });
        try {
          await API.post("/auth/forgot-password", { email });
        } finally {
          set({ loading: false });
        }
      },
      verifyResetOtp: async (email, otp) => {
        set({ loading: true });
        try {
          await API.post("/auth/verify-reset-otp", { email, otp });
        } finally {
          set({ loading: false });
        }
      },
      resetPassword: async (payload) => {
        set({ loading: true });
        try {
          await API.post("/auth/reset-password", payload);
        } finally {
          set({ loading: false });
        }
      },
      logout: () => {
        localStorage.removeItem("lab_token");
        refreshSocketAuth();
        set({ user: null, token: null, loading: false });
      }
    }),
    {
      name: "lab-auth-storage",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<PersistedAuthState> | undefined;
        return {
          user: state?.user ?? null,
          token: state?.token ?? null
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.resetLoading();
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token
      })
    }
  )
);
