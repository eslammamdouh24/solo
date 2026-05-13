import { FontSize } from "@/constants/font-size";
import { getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { STATS_HEADER_ICON } from "@/constants/stats";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { StatRow } from "./StatRow";

interface StatsPanelProps {
  strength: number;
  endurance: number;
  discipline: number;
  skillPoints?: number;
  onUpgradeStrength?: () => void;
  onUpgradeEndurance?: () => void;
  onUpgradeDiscipline?: () => void;
  hideTitle?: boolean;
}

export const StatsPanel = React.memo<StatsPanelProps>(
  ({
    strength,
    endurance,
    discipline,
    skillPoints,
    onUpgradeStrength,
    onUpgradeEndurance,
    onUpgradeDiscipline,
    hideTitle = false,
  }) => {
    const C = useColors();
    const { language } = useApp();
    const isRTL = language === "ar";
    const fontBold = getFont(language, "bold");
    const fontSemibold = getFont(language, "semibold");

    const badgeScale = useRef(new Animated.Value(1)).current;
    const badgeGlow = useRef(new Animated.Value(0)).current;

    // Pulse animation when skill points are available
    useEffect(() => {
      if (skillPoints && skillPoints > 0) {
        Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(badgeScale, {
                toValue: 1.1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(badgeScale, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(badgeGlow, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false,
              }),
              Animated.timing(badgeGlow, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: false,
              }),
            ]),
          ]),
        ).start();
      } else {
        badgeScale.setValue(1);
        badgeGlow.setValue(0);
      }
    }, [skillPoints]);

    const glowIntensity = badgeGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });
    return (
      <View style={styles.container}>
        {!hideTitle && (
          <View
            style={[
              styles.header,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View
              style={[
                styles.headerLeft,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <MaterialCommunityIcons
                name={STATS_HEADER_ICON}
                size={18}
                color={C.primary}
              />
              <Text
                style={[styles.title, { color: C.text, fontFamily: fontBold }]}
              >
                {t(language, "stats.title")}
              </Text>
            </View>
            {skillPoints !== undefined && skillPoints > 0 && (
              <Animated.View
                style={[
                  styles.skillPointsBadge,
                  {
                    backgroundColor: C.level,
                    borderColor: C.level,
                    transform: [{ scale: badgeScale }],
                    shadowColor: C.level,
                    shadowOpacity: glowIntensity,
                  },
                ]}
              >
                <MaterialCommunityIcons name="star" size={14} color="#FFF" />
                <Text
                  style={[
                    styles.skillPointsText,
                    { color: "#FFF", fontFamily: fontBold },
                  ]}
                >
                  {skillPoints}
                </Text>
              </Animated.View>
            )}
          </View>
        )}
        <View style={styles.statsContainer}>
          <StatRow
            label={t(language, "stats.strength").toUpperCase()}
            value={strength}
            iconName="strength"
            onUpgrade={onUpgradeStrength}
            canUpgrade={!!skillPoints && skillPoints > 0}
          />
          <StatRow
            label={t(language, "stats.endurance").toUpperCase()}
            value={endurance}
            iconName="endurance"
            onUpgrade={onUpgradeEndurance}
            canUpgrade={!!skillPoints && skillPoints > 0}
          />
          <StatRow
            label={t(language, "stats.discipline").toUpperCase()}
            value={discipline}
            iconName="discipline"
            onUpgrade={onUpgradeDiscipline}
            canUpgrade={!!skillPoints && skillPoints > 0}
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    letterSpacing: 1,
  },
  skillPointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  skillPointsText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  statsContainer: {
    gap: Spacing.md,
  },
});
