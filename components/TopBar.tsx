import { isRTL as checkRTL, isWeb } from "@/constants/enums";
import { FontSize } from "@/constants/font-size";
import { fonts, getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSideDrawer } from "@/contexts/SideDrawerContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TopBarProps {
  showBack?: boolean;
  hideLogo?: boolean;
  title?: string;
  showDashboard?: boolean;
}

export function TopBar({
  showBack = false,
  hideLogo = false,
  title,
  showDashboard = false,
}: TopBarProps) {
  const { language } = useApp();
  const { isOnline } = useNetwork();
  const { open: openDrawer } = useSideDrawer();
  const C = useColors();
  const router = useRouter();
  const isRTL = checkRTL(language);
  const fontBlack = getFont(language, "black");

  return (
    <View style={[styles.wrapper, { backgroundColor: C.background }]}>
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

        {/* Center: Offline indicator only */}
        {!isOnline && (
          <View
            style={[styles.syncStatus, { backgroundColor: C.error + "20" }]}
          >
            <MaterialCommunityIcons
              name="cloud-off-outline"
              size={14}
              color={C.error}
            />
            <Text style={[styles.syncText, { color: C.error }]}>Offline</Text>
          </View>
        )}

        {/* Right side: Dashboard + Hamburger menu */}
        <View
          style={[
            styles.rightSide,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          {showDashboard && (
            <TouchableOpacity
              onPress={() => router.push("/dashboard")}
              style={[styles.iconOnlyButton]}
              hitSlop={8}
              activeOpacity={0.6}
              accessibilityLabel="View dashboard"
            >
              <MaterialCommunityIcons name="chart-line" size={24} color={C.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={openDrawer}
            style={[styles.iconOnlyButton]}
            hitSlop={8}
            activeOpacity={0.6}
            accessibilityLabel="Open menu"
          >
            <MaterialCommunityIcons name="menu" size={24} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>
      {title ? (
        <Text
          style={[
            styles.screenTitle,
            { color: C.text, fontFamily: fonts.en.black },
          ]}
        >
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: isWeb ? Spacing.md : 50,
    paddingBottom: Spacing.sm,
  },
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
  iconOnlyButton: {
    padding: 8,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  langText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  syncText: {
    fontSize: 11,
    fontWeight: "600",
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 3,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
