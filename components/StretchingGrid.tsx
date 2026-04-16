import { STRETCHING_EXERCISES, StretchingType } from "@/constants/stretching";
import {
  BorderRadius,
  Colors,
  FontSize,
  Spacing,
} from "@/constants/theme-colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface StretchingGridProps {
  onPress: (stretchingType: StretchingType) => void;
}

export const StretchingGrid: React.FC<StretchingGridProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="yoga"
          size={18}
          color={Colors.discipline}
        />
        <Text style={styles.title}>STRETCHING & RECOVERY</Text>
      </View>
      <View style={styles.grid}>
        {STRETCHING_EXERCISES.map((stretch) => (
          <TouchableOpacity
            key={stretch.name}
            style={styles.card}
            onPress={() => onPress(stretch.name as StretchingType)}
          >
            <MaterialCommunityIcons
              name={stretch.icon as any}
              size={32}
              color={Colors.discipline}
            />
            <Text style={styles.exerciseName}>{stretch.name}</Text>
            <Text style={styles.duration}>{stretch.duration}s</Text>
          </TouchableOpacity>
        ))}
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
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  card: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.2)",
  },
  exerciseName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  duration: {
    fontSize: FontSize.xs,
    color: Colors.discipline,
    fontWeight: "700",
  },
});
