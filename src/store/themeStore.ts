import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "light",
      toggleMode: () => set({ mode: get().mode === "light" ? "dark" : "light" })
    }),
    {
      name: "lab-theme"
    }
  )
);
