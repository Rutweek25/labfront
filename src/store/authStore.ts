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
  }) => Promise<{ email: string; otpPreview?: string }>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<void>;
  resendRegistrationOtp: (email: string) => Promise<{ otpPreview?: string }>;
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
          return { email: data.email, otpPreview: data.otpPreview };
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
          const { data } = await API.post("/auth/resend-otp", { email });
          return { otpPreview: data.otpPreview };
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
