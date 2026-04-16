import {
  BorderRadius,
  Colors,
  FontSize,
  Spacing,
} from "@/constants/theme-colors";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface BossBarProps {
  level: number;
  bossHP: number;
  bossMaxHP: number;
  defeated?: boolean;
}

export const BossBar: React.FC<BossBarProps> = ({
  level,
  bossHP,
  bossMaxHP,
  defeated = false,
}) => {
  // Safety: ensure all values are valid numbers
  const safeLevel = Math.max(1, level) || 1;
  const safeBossHP = Math.max(0, bossHP) || 0;
  const safeBossMaxHP = Math.max(1, bossMaxHP) || 1;
  const hpPercent = safeBossMaxHP > 0 ? (safeBossHP / safeBossMaxHP) * 100 : 0;
  const hpAnim = useRef(new Animated.Value(100)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(hpAnim, {
      toValue: hpPercent,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hpPercent]);

  // Shake on damage
  useEffect(() => {
    if (safeBossHP < safeBossMaxHP && safeBossHP > 0) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 4,
          duration: 50,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(shakeAnim, {
          toValue: -4,
          duration: 50,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(shakeAnim, {
          toValue: 2,
          duration: 50,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeBossHP, safeBossMaxHP]);

  const getBarColor = () => {
    if (hpPercent > 50) return "#FF6B35";
    if (hpPercent > 25) return "#FF4444";
    return "#FF1744";
  };

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}
    >
      <Text style={styles.title}>⚔️ LEVEL {safeLevel} BOSS</Text>

      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: getBarColor(),
              width: hpAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>

      <Text style={styles.hpText}>
        {Math.round(safeBossHP)} / {Math.round(safeBossMaxHP)} HP
      </Text>

      {defeated && <Text style={styles.defeatedText}>Boss Defeated! 🎉</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: "800",
    color: Colors.bossHP,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  barContainer: {
    width: "100%",
    height: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: BorderRadius.sm - 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: BorderRadius.sm - 2,
    boxShadow: "0px 0px 6px rgba(239, 68, 68, 0.5)",
  },
  hpText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  defeatedText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 1,
  },
});
