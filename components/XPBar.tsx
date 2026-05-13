import { Colors } from "@/constants/colors";
import { FontSize } from "@/constants/font-size";
import { getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Easing,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface XPBarProps {
  xp: number;
  level: number;
  requiredXP: number;
  streak?: number;
}

export const XPBar = React.memo<XPBarProps>(
  ({ xp, level, requiredXP, streak = 0 }) => {
    const C = useColors();
    const { language } = useApp();
    const isRTL = language === "ar";
    const fontRegular = getFont(language, "regular");
    const fontBold = getFont(language, "bold");
    const fontBlack = getFont(language, "black");
    const progress = (xp / requiredXP) * 100;
    const nearLevelUp = progress >= 80;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const levelScaleAnim = useRef(new Animated.Value(1)).current;
    const streakScaleAnim = useRef(new Animated.Value(1)).current;
    const glowPulseAnim = useRef(new Animated.Value(0)).current;

    const streakLabel = useMemo(() => {
      if (streak >= 7) return t(language, "xpBar.beastMode");
      if (streak >= 3) return t(language, "xpBar.onFire");
      return null;
    }, [streak, language]);

    // Pulsing glow effect when near level up
    useEffect(() => {
      if (nearLevelUp) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowPulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(glowPulseAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      } else {
        glowPulseAnim.setValue(0);
      }
    }, [nearLevelUp]);

    useEffect(() => {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress]);

    useEffect(() => {
      if (level > 1) {
        Animated.sequence([
          Animated.timing(levelScaleAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(levelScaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]).start();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [level]);

    useEffect(() => {
      if (streak > 0) {
        Animated.sequence([
          Animated.timing(streakScaleAnim, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(streakScaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]).start();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [streak]);

    return (
      <View style={styles.container}>
        {/* Large Level Display */}
        <View
          style={[
            styles.levelBadge,
            {
              backgroundColor: `${C.primary}15`,
              borderColor: C.primary + "40",
            },
          ]}
        >
          <Text
            style={[
              styles.levelLabel,
              { color: C.textSecondary, fontFamily: fontBold },
            ]}
          >
            {t(language, "xpBar.level").toUpperCase()}
          </Text>
          <Animated.Text
            style={[
              styles.levelNumber,
              {
                color: C.primary,
                fontFamily: fontBlack,
                transform: [{ scale: levelScaleAnim }],
              },
            ]}
          >
            {level}
          </Animated.Text>
        </View>

        <View
          style={[
            styles.barRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <View
            style={[
              styles.barContainer,
              {
                backgroundColor: C.surfaceHighlight,
                borderWidth: 1,
                borderColor: nearLevelUp
                  ? C.primary + "40"
                  : "rgba(255, 255, 255, 0.05)",
              },
            ]}
          >
            <Animated.View
              style={[
                styles.barFill,
                {
                  backgroundColor: nearLevelUp ? C.primaryLight : C.xp,
                  shadowColor: nearLevelUp ? C.primaryLight : C.xp,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: glowPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.9],
                  }),
                  shadowRadius: glowPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 12],
                  }),
                  elevation: 8,
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            >
              {/* Inner shine effect */}
              <View
                style={[
                  styles.barShine,
                  { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                ]}
              />
            </Animated.View>
          </View>
          <Text
            style={[
              styles.percentText,
              {
                color: nearLevelUp ? C.primaryLight : C.xp,
                fontFamily: fontBold,
              },
            ]}
          >
            {Math.round(progress)}%
          </Text>
        </View>

        <View
          style={[
            styles.xpRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={styles.xpStar}>✨</Text>
          <Text
            style={[
              styles.xpText,
              { color: C.textSecondary, fontFamily: fontBold },
            ]}
          >
            {xp} / {requiredXP} XP
          </Text>
          <Text style={styles.xpStar}>✨</Text>
        </View>

        {nearLevelUp && (
          <Text
            style={[
              styles.nearLevelText,
              { color: C.primaryLight, fontFamily: fontBold },
            ]}
          >
            🎯 {t(language, "xpBar.almostLevelUp")} 🎯
          </Text>
        )}

        {streak > 0 && (
          <Animated.View
            style={[
              styles.streakRow,
              {
                transform: [{ scale: streakScaleAnim }],
                flexDirection: isRTL ? "row-reverse" : "row",
              },
            ]}
          >
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text
              style={[
                styles.streakCount,
                { color: C.streak, fontFamily: fontBlack },
              ]}
            >
              {streak}
            </Text>
            <Text
              style={[
                styles.streakLabel,
                { color: C.textSecondary, fontFamily: fontRegular },
              ]}
            >
              {" "}
              {t(language, "xpBar.dayStreak")}
            </Text>
          </Animated.View>
        )}

        {streakLabel && <Text style={styles.streakTier}>{streakLabel}</Text>}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  levelBadge: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    alignItems: "center",
    gap: 4,
  },
  levelLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    letterSpacing: 2,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 2,
  },
  barRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  barContainer: {
    flex: 1,
    height: 14,
    backgroundColor: "#1a1a1a",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  percentText: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.xp,
    minWidth: 42,
    textAlign: "right",
  },
  barFill: {
    height: "100%",
    backgroundColor: Colors.xp,
    borderRadius: BorderRadius.full,
    position: "relative",
  },
  barShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderTopLeftRadius: BorderRadius.full,
    borderTopRightRadius: BorderRadius.full,
  },
  barFillNear: {
    boxShadow: "0px 0px 10px rgba(168, 85, 247, 0.8)",
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  xpStar: {
    fontSize: 16,
  },
  xpText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  nearLevelText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.md,
    fontWeight: "800",
    letterSpacing: 0.5,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  streakEmoji: {
    fontSize: FontSize.lg,
    marginRight: Spacing.xs,
  },
  streakCount: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: Colors.streak,
  },
  streakLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  streakTier: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gold,
    letterSpacing: 0.5,
  },
});
