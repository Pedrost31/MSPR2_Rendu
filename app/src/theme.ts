export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  mode: ThemeMode;
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  blue: string;
  blueSoft: string;
  purple: string;
  indigo: string;
  overlay: string;
  inputBg: string;
}

const light: ThemeColors = {
  mode: "light",
  bg: "#f1f5f9",
  card: "#ffffff",
  cardAlt: "#f8fafc",
  text: "#1e293b",
  textMuted: "#64748b",
  border: "#e2e8f0",
  primary: "#10b981",
  primaryDark: "#059669",
  primarySoft: "#ecfdf5",
  onPrimary: "#ffffff",
  danger: "#ef4444",
  dangerSoft: "#fef2f2",
  warning: "#f97316",
  blue: "#3b82f6",
  blueSoft: "#eff6ff",
  purple: "#a855f7",
  indigo: "#6366f1",
  overlay: "rgba(241,245,249,0.7)",
  inputBg: "#f8fafc",
};

const dark: ThemeColors = {
  mode: "dark",
  bg: "#0f172a",
  card: "#1e293b",
  cardAlt: "#0f172a",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  border: "#334155",
  primary: "#10b981",
  primaryDark: "#059669",
  primarySoft: "rgba(16,185,129,0.12)",
  onPrimary: "#ffffff",
  danger: "#f87171",
  dangerSoft: "rgba(248,113,113,0.12)",
  warning: "#fb923c",
  blue: "#60a5fa",
  blueSoft: "rgba(96,165,250,0.12)",
  purple: "#c084fc",
  indigo: "#818cf8",
  overlay: "rgba(15,23,42,0.7)",
  inputBg: "#0f172a",
};

export const palettes: Record<ThemeMode, ThemeColors> = { light, dark };
