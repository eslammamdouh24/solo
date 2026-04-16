import { getFont } from "@/constants/fonts";
import { STAT_ICONS } from "@/constants/stats";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatRowProps {
  label: string;
  value: number | string;
  iconName: keyof typeof STAT_ICONS;
}

export const StatRow: React.FC<StatRowProps> = ({ label, value, iconName }) => {
  const C = useColors();
  const { language } = useApp();
  const isRTL = language === "ar";
  const fontSemibold = getFont(language, "semibold");
  const fontBold = getFont(language, "bold");
  const icon = STAT_ICONS[iconName];

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: C.surface,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
    >
      <View
        style={[
          styles.labelSection,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color={C.textSecondary} />
        <Text
          style={[
            styles.label,
            { color: C.textSecondary, fontFamily: fontSemibold },
          ]}
        >
          {label.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.value, { color: C.primary, fontFamily: fontBold }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  labelSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "#7A8CA3",
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  value: {
    fontSize: 22,
    fontWeight: "900",
    color: "#00E5FF",
  },
});
