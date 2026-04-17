import { Colors } from "@/constants/colors";
import { Theme } from "@/constants/enums";
import { useApp } from "@/contexts/AppContext";
import { useMemo } from "react";

/**
 * Returns theme-aware colors. Same shape as Colors from theme-colors.ts
 * but values change based on the active theme (light/dark).
 */
export function useColors() {
  const { theme } = useApp();

  return useMemo(() => {
    if (theme === Theme.LIGHT) {
      return {
        ...Colors,
        // Core
        primary: "#0891B2",
        primaryDark: "#0E7490",
        primaryLight: "#06B6D4",

        // Background
        background: "#F8FAFC",
        surface: "rgba(0, 0, 0, 0.04)",
        surfaceHighlight: "rgba(0, 0, 0, 0.07)",

        // Text
        text: "#1E293B",
        textSecondary: "#64748B",
        textMuted: "#94A3B8",

        // Stats
        strength: "#DC2626",
        endurance: "#059669",
        discipline: "#7C3AED",

        // Status
        success: "#059669",
        error: "#DC2626",
        warning: "#D97706",
        info: "#2563EB",

        // XP & Level
        xp: "#0891B2",
        level: "#D97706",
        streak: "#DC2626",

        // Special
        gold: "#D97706",
      };
    }
    return Colors;
  }, [theme]);
}
