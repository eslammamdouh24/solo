import { Colors } from "@/constants/colors";
import { FontSize } from "@/constants/font-size";
import { getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { STATS_HEADER_ICON } from "@/constants/stats";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatRow } from "./StatRow";

interface StatsPanelProps {
  strength: number;
  endurance: number;
  discipline: number;
  skillPoints?: number;
  onUpgradeStrength?: () => void;
  onUpgradeEndurance?: () => void;
  onUpgradeDiscipline?: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  strength,
  endurance,
  discipline,
  skillPoints,
  onUpgradeStrength,
  onUpgradeEndurance,
  onUpgradeDiscipline,
}) => {
  const C = useColors();
  const { language } = useApp();
  const isRTL = language === "ar";
  const fontBold = getFont(language, "bold");
  const fontSemibold = getFont(language, "semibold");
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <MaterialCommunityIcons
          name={STATS_HEADER_ICON}
          size={16}
          color={C.textSecondary}
        />
        <Text
          style={[
            styles.title,
            { color: C.textSecondary, fontFamily: fontBold },
          ]}
        >
          {t(language, "stats.title")}
        </Text>
        {skillPoints !== undefined && skillPoints > 0 && (
          <View
            style={[
              styles.skillPointsBadge,
              { backgroundColor: `${C.primary}33` },
            ]}
          >
            <Text
              style={[
                styles.skillPointsText,
                { color: C.primary, fontFamily: fontSemibold },
              ]}
            >
              {skillPoints} {t(language, "stats.sp")}
            </Text>
          </View>
        )}
      </View>
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
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm - 2,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  skillPointsBadge: {
    backgroundColor: "rgba(0, 229, 255, 0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: "auto",
  },
  skillPointsText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  statsContainer: {
    gap: Spacing.sm,
  },
});
