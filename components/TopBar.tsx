import { getFont } from "@/constants/fonts";
import { BorderRadius, FontSize, Spacing } from "@/constants/theme-colors";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TopBarProps {
  showBack?: boolean;
  hideLogo?: boolean;
}

export function TopBar({ showBack = false, hideLogo = false }: TopBarProps) {
  const { theme, language, toggleTheme, setLanguage } = useApp();
  const C = useColors();
  const router = useRouter();
  const isRTL = language === "ar";
  const fontBlack = getFont(language, "black");

  return (
    <View
      style={[
        styles.container,
        { flexDirection: isRTL ? "row-reverse" : "row" },
      ]}
    >
      {/* Left side: Back arrow + SOLO logo + slogan */}
      <View
        style={[
          styles.leftSide,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        {showBack && (
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            style={styles.backButton}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name={isRTL ? "arrow-right" : "arrow-left"}
              size={22}
              color={C.textSecondary}
            />
          </TouchableOpacity>
        )}
        {!hideLogo && (
          <TouchableOpacity
            onPress={() => router.push("/")}
            activeOpacity={0.7}
            style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}
          >
            <Text
              style={[
                styles.logoText,
                { color: C.primary, fontFamily: fontBlack },
              ]}
            >
              SOLO
            </Text>
            <Text style={[styles.sloganText, { color: C.gold }]}>
              {t(language, "auth.slogan")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Right side: Theme + Language toggles */}
      <View
        style={[
          styles.rightSide,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.button, { backgroundColor: C.surfaceHighlight }]}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={theme === "dark" ? "weather-sunny" : "weather-night"}
            size={20}
            color={theme === "dark" ? "#FF8C00" : "#FFD700"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setLanguage(language === "en" ? "ar" : "en")}
          style={[styles.button, { backgroundColor: C.surfaceHighlight }]}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="translate"
            size={20}
            color={C.primary}
          />
          <Text style={[styles.langText, { color: C.primary }]}>
            {language === "en" ? "AR" : "EN"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  logoText: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    letterSpacing: 3,
  },
  sloganText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: -2,
  },
  rightSide: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  langText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
});
