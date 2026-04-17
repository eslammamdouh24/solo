/**
 * Font families for English (Inter) and Arabic (Cairo)
 */

export type FontWeight = "regular" | "medium" | "semibold" | "bold" | "black";

const interFonts: Record<FontWeight, string> = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  black: "Inter_900Black",
};

const cairoFonts: Record<FontWeight, string> = {
  regular: "Cairo_400Regular",
  medium: "Cairo_600SemiBold", // Cairo doesn't have 500, use 600
  semibold: "Cairo_600SemiBold",
  bold: "Cairo_700Bold",
  black: "Cairo_900Black",
};

/**
 * Returns the correct font family based on language and weight.
 * @param language - "en" or "ar"
 * @param weight - font weight (default: "regular")
 */
import { Language } from "@/constants/enums";

export function getFont(
  language: string,
  weight: FontWeight = "regular",
): string {
  return language === Language.AR ? cairoFonts[weight] : interFonts[weight];
}

/**
 * Shortcut font family constants by language
 */
export const fonts = {
  en: interFonts,
  ar: cairoFonts,
} as const;
