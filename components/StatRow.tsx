import { getFont } from "@/constants/fonts";
import { STAT_ICONS } from "@/constants/stats";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface StatRowProps {
  label: string;
  value: number | string;
  iconName: keyof typeof STAT_ICONS;
  onUpgrade?: () => void;
  canUpgrade?: boolean;
}

export const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  iconName,
  onUpgrade,
  canUpgrade,
}) => {
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
      <View
        style={[
          styles.valueSection,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <Text
          style={[styles.value, { color: C.primary, fontFamily: fontBold }]}
        >
          {value}
        </Text>
        {canUpgrade && onUpgrade && (
          <TouchableOpacity
            onPress={onUpgrade}
            style={[
              styles.upgradeButton,
              { backgroundColor: `${C.primary}33` },
            ]}
          >
            <MaterialCommunityIcons name="plus" size={16} color={C.primary} />
          </TouchableOpacity>
        )}
      </View>
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
  valueSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  upgradeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});
