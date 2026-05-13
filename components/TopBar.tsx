import { isRTL as checkRTL, isWeb } from "@/constants/enums";
import { FontSize } from "@/constants/font-size";
import { getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useFloatingTimer } from "@/contexts/FloatingTimerContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSideDrawer } from "@/contexts/SideDrawerContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import React, { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TopBarProps {
  showBack?: boolean;
  hideLogo?: boolean;
  title?: string;
}

export const TopBar = React.memo<TopBarProps>(
  ({ showBack = false, hideLogo = false, title }) => {
    const { language } = useApp();
    const { isOnline } = useNetwork();
    const { open: openDrawer } = useSideDrawer();
    const floatingTimer = useFloatingTimer();
    const pathname = usePathname();
    const params = useLocalSearchParams();
    const C = useColors();
    const router = useRouter();
    const isRTL = checkRTL(language);
    const fontBlack = getFont(language, "black");
    const isNavigatingRef = useRef(false);

    const handleBackPress = () => {
      // Prevent multiple rapid clicks
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      // Reset after navigation completes
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);

      // Special handling for exercise-detail screen
      if (pathname === "/exercise-detail") {
        // Auto-minimize timer if running
        if (
          floatingTimer.exerciseName &&
          floatingTimer.running &&
          !floatingTimer.isMinimized
        ) {
          floatingTimer.minimize();
          // Go directly to dashboard to see floating timer
          router.replace("/");
          return;
        }

        // No timer running - go back to exercise list
        const muscle = params.muscle as string;
        if (muscle) {
          router.replace({
            pathname: "/exercise-list",
            params: { muscle },
          });
          return;
        }
      }

      // Special handling for exercise-list screen - go directly to dashboard
      if (pathname === "/exercise-list") {
        router.replace("/");
        return;
      }

      // Normal back navigation for other screens
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    };

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
                onPress={handleBackPress}
                style={styles.backButton}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                activeOpacity={0.6}
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
          {/* Spacer to keep burger menu position consistent */}
          <View style={{ flex: 1 }} />
          {/* Right side: Hamburger menu */}
          <View
            style={[
              styles.rightSide,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
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
              { color: C.text, fontFamily: fontBlack },
            ]}
          >
            {title}
          </Text>
        ) : null}
      </View>
    );
  },
);

TopBar.displayName = "TopBar";

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
    borderRadius: BorderRadius.full,
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
