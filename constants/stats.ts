import { MaterialCommunityIcons } from "@expo/vector-icons";

export const STAT_ICONS = {
  strength: "arm-flex",
  endurance: "heart-pulse",
  discipline: "brain",
} as const;

export const STATS_HEADER_ICON = "chart-line" as const;

export type StatType = keyof typeof STAT_ICONS;

// Type check to ensure all icons are valid MaterialCommunityIcons
export type ValidateStatIcons = {
  [K in keyof typeof STAT_ICONS]: (typeof STAT_ICONS)[K] extends keyof typeof MaterialCommunityIcons.glyphMap
    ? (typeof STAT_ICONS)[K]
    : never;
};

export type ValidateHeaderIcon =
  typeof STATS_HEADER_ICON extends keyof typeof MaterialCommunityIcons.glyphMap
    ? typeof STATS_HEADER_ICON
    : never;
