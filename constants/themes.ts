// Light and Dark theme colors
export const lightTheme = {
  background: "#F5F7FA",
  surface: "#FFFFFF",
  surfaceHighlight: "#F0F4F8",
  primary: "#3B82F6",
  secondary: "#8B5CF6",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  xp: "#3B82F6",
  level: "#F59E0B",
  streak: "#EF4444",
  strength: "#DC2626",
  endurance: "#059669",
  discipline: "#7C3AED",
};

export const darkTheme = {
  background: "#0A0E27",
  surface: "#151B3D",
  surfaceHighlight: "#1E2749",
  primary: "#60A5FA",
  secondary: "#A78BFA",
  text: "#F3F4F6",
  textSecondary: "#9CA3AF",
  border: "#374151",
  success: "#34D399",
  error: "#F87171",
  warning: "#FBBF24",
  xp: "#60A5FA",
  level: "#FBBF24",
  streak: "#F87171",
  strength: "#EF4444",
  endurance: "#10B981",
  discipline: "#8B5CF6",
};

export type ThemeColors = typeof darkTheme;

export const getThemeColors = (theme: "light" | "dark"): ThemeColors => {
  return theme === "light" ? lightTheme : darkTheme;
};
