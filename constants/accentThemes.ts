// Accent color themes. Each palette overrides `primary` + related accent colors
// while keeping the rest of the palette (background, text, gold, etc.) intact.

export type AccentThemeId =
  | "purple"
  | "cyan"
  | "emerald"
  | "rose"
  | "amber"
  | "blue";

export interface AccentTheme {
  id: AccentThemeId;
  label: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  /** Subtle dark background tinted toward the accent. */
  background: string;
}

export const AccentThemes: Record<AccentThemeId, AccentTheme> = {
  purple: {
    id: "purple",
    label: "Purple",
    primary: "#A855F7",
    primaryDark: "#7E22CE",
    primaryLight: "#D8B4FE",
    background: "#0F0A1C",
  },
  cyan: {
    id: "cyan",
    label: "Cyan",
    primary: "#00E5FF",
    primaryDark: "#00B8D4",
    primaryLight: "#6EFFF5",
    background: "#07141A",
  },
  emerald: {
    id: "emerald",
    label: "Emerald",
    primary: "#10B981",
    primaryDark: "#047857",
    primaryLight: "#6EE7B7",
    background: "#081511",
  },
  rose: {
    id: "rose",
    label: "Rose",
    primary: "#F43F5E",
    primaryDark: "#BE123C",
    primaryLight: "#FDA4AF",
    background: "#180A10",
  },
  amber: {
    id: "amber",
    label: "Amber",
    primary: "#F59E0B",
    primaryDark: "#B45309",
    primaryLight: "#FCD34D",
    background: "#14100A",
  },
  blue: {
    id: "blue",
    label: "Blue",
    primary: "#3B82F6",
    primaryDark: "#1D4ED8",
    primaryLight: "#93C5FD",
    background: "#0A0F22",
  },
};

export const AccentThemeList: AccentTheme[] = Object.values(AccentThemes);

export const DEFAULT_ACCENT: AccentThemeId = "purple";
