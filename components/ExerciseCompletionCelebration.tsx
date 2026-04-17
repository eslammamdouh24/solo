import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useSound } from "@/hooks/useSound";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#FF6BFF",
  "#FF8C42",
  "#00E5FF",
  "#FFD700",
];

const CONFETTI_COUNT = 25;

const CELEBRATION_WORDS_AR = [
  "عظيم! 💪",
  "ممتاز! 🔥",
  "رائع! ⭐",
  "برافو! 🎉",
  "يا نجم! 🌟",
  "قوي! 💥",
  "أسطوري! ⚡",
  "محترف! 🏆",
  "وحش! 🦁",
  "جامد! 🔥",
];

const CELEBRATION_WORDS_EN = [
  "AMAZING! 💪",
  "EXCELLENT! 🔥",
  "AWESOME! ⭐",
  "BRAVO! 🎉",
  "CRUSHED IT! 🌟",
  "POWERFUL! 💥",
  "LEGENDARY! ⚡",
  "BEAST MODE! 🦁",
  "CHAMPION! 🏆",
  "UNSTOPPABLE! 🚀",
];

interface ExerciseCompletionCelebrationProps {
  visible: boolean;
  exerciseName: string;
  earnedXP: number;
  duration: string;
  performanceFeedback?: string;
  onDismiss: () => void;
}

export const ExerciseCompletionCelebration: React.FC<
  ExerciseCompletionCelebrationProps
> = ({
  visible,
  exerciseName,
  earnedXP,
  duration,
  performanceFeedback,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    })),
  ).current;

  const { language } = useApp();
  const C = useColors();
  const { playXPSound } = useSound();

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, () => ({
        startX: Math.random() * SCREEN_WIDTH,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 100,
        delay: Math.random() * 400,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible],
  );

  const celebrationText = useMemo(() => {
    const words =
      language === "ar" ? CELEBRATION_WORDS_AR : CELEBRATION_WORDS_EN;
    return words[Math.floor(Math.random() * words.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, language]);

  useEffect(() => {
    if (visible) {
      // Play XP gain sound
      playXPSound();

      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      checkmarkAnim.setValue(0);
      confettiAnims.forEach((c) => {
        c.translateY.setValue(-50);
        c.translateX.setValue(0);
        c.rotate.setValue(0);
        c.opacity.setValue(1);
      });

      // Start confetti
      confettiAnims.forEach((c, i) => {
        const piece = confettiPieces[i];
        Animated.sequence([
          Animated.delay(piece.delay),
          Animated.parallel([
            Animated.timing(c.translateY, {
              toValue: SCREEN_HEIGHT + 100,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.timing(c.translateX, {
              toValue: piece.drift,
              duration: 2000,
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.timing(c.rotate, {
              toValue: 2 + Math.random() * 3,
              duration: 2000,
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.sequence([
              Animated.delay(1500),
              Animated.timing(c.opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: Platform.OS !== "web",
              }),
            ]),
          ]),
        ]).start();
      });

      // Main animation sequence
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]),
        Animated.spring(checkmarkAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    }
  }, [
    visible,
    scaleAnim,
    fadeAnim,
    slideAnim,
    checkmarkAnim,
    confettiAnims,
    confettiPieces,
  ]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.overlay} onPress={onDismiss}>
        {/* Confetti */}
        {confettiPieces.map((piece, i) => {
          const anim = confettiAnims[i];
          const spin = anim.rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          });
          return (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                top: -20,
                left: piece.startX,
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                borderRadius: 2,
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.translateY },
                  { translateX: anim.translateX },
                  { rotate: spin },
                ],
              }}
            />
          );
        })}

        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[C.primary, C.primaryDark || C.primary]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Checkmark circle */}
            <Animated.View
              style={[
                styles.checkmarkCircle,
                {
                  transform: [{ scale: checkmarkAnim }],
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="check-bold"
                size={80}
                color="#FFFFFF"
              />
            </Animated.View>

            {/* Celebration text */}
            <Text style={styles.celebrationText}>{celebrationText}</Text>

            {/* Exercise name */}
            <Text style={styles.exerciseName}>{exerciseName}</Text>

            {/* Performance feedback */}
            {performanceFeedback && (
              <View style={styles.performanceBadge}>
                <Text style={styles.performanceText}>
                  {performanceFeedback}
                </Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.statValue}>{duration}</Text>
                <Text style={styles.statLabel}>
                  {t(language, "exerciseCompletion.duration")}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={24}
                  color="#FFD700"
                />
                <Text style={[styles.statValue, { color: "#FFD700" }]}>
                  +{earnedXP}
                </Text>
                <Text style={styles.statLabel}>
                  {t(language, "exerciseCompletion.xpEarned")}
                </Text>
              </View>
            </View>

            {/* Dismiss button */}
            <Pressable style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissButtonText}>
                {t(language, "exerciseCompletion.continue")}
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            {/* Tap anywhere hint */}
            <Text style={styles.tapHint}>
              {t(language, "exerciseCompletion.tapToDismiss")}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradient: {
    padding: 32,
    alignItems: "center",
  },
  checkmarkCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
    textAlign: "center",
  },
  performanceBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  performanceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dismissButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tapHint: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 8,
  },
});
