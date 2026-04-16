import { MuscleGroup } from "@/constants/exercises";
import { getFont } from "@/constants/fonts";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MuscleGroupGridProps {
  muscleGroups: MuscleGroup[];
  onPress: (group: MuscleGroup) => void;
  labels?: Record<MuscleGroup, string>;
}

const MUSCLE_ICONS: Record<
  MuscleGroup,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  chest: "dumbbell",
  back: "human-handsup",
  shoulders: "human",
  biceps: "arm-flex",
  triceps: "arm-flex-outline",
  abs: "shield-star",
  legs: "shoe-sneaker",
};

const MuscleCard: React.FC<{
  group: MuscleGroup;
  onPress: () => void;
  isFullWidth?: boolean;
  label?: string;
}> = ({ group, onPress, isFullWidth = false, label }) => {
  const C = useColors();
  const { language } = useApp();
  const fontSemibold = getFont(language, "semibold");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: isFullWidth ? "100%" : "47%" }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: C.surfaceHighlight,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <MaterialCommunityIcons
          name={MUSCLE_ICONS[group]}
          size={28}
          color={C.primary}
          style={styles.icon}
        />
        <Text
          style={[styles.label, { color: C.text, fontFamily: fontSemibold }]}
          numberOfLines={1}
        >
          {label || group.toUpperCase()}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const MuscleGroupGrid: React.FC<MuscleGroupGridProps> = ({
  muscleGroups,
  onPress,
  labels,
}) => {
  const C = useColors();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: C.textSecondary }]}>
        MUSCLE GROUPS
      </Text>
      <View style={styles.grid}>
        {muscleGroups.map((group, index) => (
          <MuscleCard
            key={group}
            group={group}
            onPress={() => onPress(group)}
            isFullWidth={index === muscleGroups.length - 1}
            label={labels?.[group]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7A8CA3",
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 26,
    marginBottom: 6,
  },
  label: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
