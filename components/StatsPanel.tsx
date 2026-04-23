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
          <Text style={[styles.title, { color: C.text, fontFamily: fontBold }]}>
            {t(language, "stats.title")}
          </Text>
        </View>
        {skillPoints !== undefined && skillPoints > 0 && (
          <View
            style={[
              styles.skillPointsBadge,
              { backgroundColor: C.level, borderColor: C.level },
            ]}
          >
            <MaterialCommunityIcons name="star" size={12} color="#FFF" />
            <Text
              style={[
                styles.skillPointsText,
                { color: "#FFF", fontFamily: fontBold },
              ]}
            >
              {skillPoints}
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
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  skillPointsText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  statsContainer: {
    gap: Spacing.md,
  },
});
