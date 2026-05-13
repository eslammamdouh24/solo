import { CARDIO_EXERCISES, CardioType } from "@/constants/exercises";
import { getFont } from "@/constants/fonts";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useRef } from "react";
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface CardioGridProps {
  onPress: (cardioType: CardioType) => void;
}

const CardioCard = React.memo<{
  name: string;
  icon: string;
  onPress: () => void;
}>(({ name, icon, onPress }) => {
  const C = useColors();
  const { language } = useApp();
  const haptics = useHaptics();
  const fontBold = getFont(language, "bold");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    haptics.light();
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
        haptics.medium();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: "47%" }}
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
          name={icon as any}
          size={28}
          color={C.primary}
          style={styles.icon}
        />
        <Text
          style={[styles.label, { color: C.text, fontFamily: fontBold }]}
          numberOfLines={1}
        >
          {name.toUpperCase()}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

export const CardioGrid = React.memo<CardioGridProps>(({ onPress }) => {
  const C = useColors();
  const { language } = useApp();

  const cardioLabels = useMemo<Record<string, string>>(
    () => ({
      Walking: t(language, "cardio.walking"),
      Running: t(language, "cardio.running"),
      Cycling: t(language, "cardio.cycling"),
      Elliptical: t(language, "cardio.elliptical"),
      "Jump Rope": t(language, "cardio.jumpRope"),
      "Stair Climb": t(language, "cardio.stairClimb"),
    }),
    [language],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: C.textSecondary }]}>
        {t(language, "home.cardio")}
      </Text>
      <View style={styles.grid}>
        {CARDIO_EXERCISES.map((cardio) => (
          <CardioCard
            key={cardio.name}
            name={cardioLabels[cardio.name] || cardio.name}
            icon={cardio.icon}
            onPress={() => onPress(cardio.name as CardioType)}
          />
        ))}
      </View>
    </View>
  );
});

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
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
});
