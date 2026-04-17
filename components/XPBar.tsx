import { Colors } from "@/constants/colors";
import { FontSize } from "@/constants/font-size";
import { getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import React, { useEffect, useRef } from "react";
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

export const XPBar: React.FC<XPBarProps> = ({
  xp,
  level,
  requiredXP,
  streak = 0,
}) => {
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

  const getStreakLabel = () => {
    if (streak >= 7) return t(language, "xpBar.beastMode");
    if (streak >= 3) return t(language, "xpBar.onFire");
    return null;
  };

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.ease),
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
      <Animated.Text
        style={[
          styles.levelText,
          { color: C.text, transform: [{ scale: levelScaleAnim }] },
        ]}
      >
        {t(language, "xpBar.level")} {level}
      </Animated.Text>

      <View
        style={[
          styles.barRow,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <View
          style={[styles.barContainer, { backgroundColor: C.surfaceHighlight }]}
        >
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: nearLevelUp ? C.primaryLight : C.xp,
                boxShadow: nearLevelUp
                  ? `0px 0px 10px ${C.primaryLight}CC`
                  : `0px 0px 6px ${C.xp}66`,
              },
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text
          style={[styles.percentText, { color: C.xp, fontFamily: fontBold }]}
        >
          {Math.round(progress)}%
        </Text>
      </View>

      <Text
        style={[
          styles.xpText,
          { color: C.textSecondary, fontFamily: fontRegular },
        ]}
      >
        {xp} / {requiredXP} XP
      </Text>

      {nearLevelUp && (
        <Text style={[styles.nearLevelText, { color: C.primaryLight }]}>
          {t(language, "xpBar.almostLevelUp")}
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

      {getStreakLabel() && (
        <Text style={styles.streakTier}>{getStreakLabel()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  levelText: {
    fontSize: 42,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: 3,
    marginBottom: Spacing.lg,
  },
  barRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md - 2,
  },
  barContainer: {
    flex: 1,
    height: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  percentText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.xp,
    minWidth: 34,
    textAlign: "right",
  },
  barFill: {
    height: "100%",
    backgroundColor: Colors.xp,
    borderRadius: BorderRadius.md,
    boxShadow: "0px 0px 6px rgba(0, 229, 255, 0.4)",
  },
  barFillNear: {
    boxShadow: "0px 0px 10px rgba(0, 229, 255, 0.8)",
  },
  xpText: {
    marginTop: Spacing.md - 2,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  nearLevelText: {
    marginTop: Spacing.sm - 2,
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.primaryLight,
    letterSpacing: 1,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
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
