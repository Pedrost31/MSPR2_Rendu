import { useTheme } from "../context/ThemeContext";
import type { ThemeColors } from "../theme";

export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}
