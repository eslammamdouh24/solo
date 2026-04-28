import { MuscleGroup } from "@/constants/exercises";
import { getFont } from "@/constants/fonts";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
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
  waist_core: "shield-star",
  upper_legs: "shoe-sneaker",
  lower_legs: "walk",
  lower_arms: "hand-back-left",
  cardio: "run-fast",
};

const MuscleCard: React.FC<{
  group: MuscleGroup;
  onPress: () => void;
  isFullWidth?: boolean;
  label?: string;
  index: number;
}> = ({ group, onPress, isFullWidth = false, label, index }) => {
  const C = useColors();
  const { language } = useApp();
  const haptics = useHaptics();
  const fontSemibold = getFont(language, "semibold");
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Staggered fade-in and slide-up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: isFullWidth ? "100%" : "47%" }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: C.surfaceHighlight,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
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
  const { language } = useApp();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: C.textSecondary }]}>
        {t(language, "home.muscleGroups")}
      </Text>
      <View style={styles.grid}>
        {muscleGroups.map((group, index) => (
          <MuscleCard
            key={group}
            group={group}
            index={index}
            onPress={() => onPress(group)}
            isFullWidth={
              index === muscleGroups.length - 1 && muscleGroups.length % 2 !== 0
            }
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
