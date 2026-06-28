import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";
import { palettes, type ThemeColors, type ThemeMode } from "../theme";
import { themeStore } from "../storage";

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(
    themeStore.get() ?? (system === "dark" ? "dark" : "light")
  );

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      themeStore.set(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, colors: palettes[mode], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
