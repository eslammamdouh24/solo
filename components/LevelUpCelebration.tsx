import { useApp } from "@/contexts/AppContext";
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
  "#E040FB",
  "#69F0AE",
];

const CONFETTI_COUNT = 30;

const EGYPTIAN_LEVEL_UP_WORDS = [
  "عاش! 🔥",
  "يا سلام! 💪",
  "كبير! 🏆",
  "أسطورة! ⭐",
  "جامد! 💥",
  "يا معلم! 👑",
  "بطل! 🎖️",
  "ولا أروع! ✨",
  "تحفة! 🌟",
  "ماشاء الله! 🙌",
];

const ENGLISH_LEVEL_UP_WORDS = [
  "LEVEL UP! 🔥",
  "BEAST MODE! 💪",
  "UNSTOPPABLE! 🏆",
  "LEGENDARY! ⭐",
  "LET'S GO! 💥",
  "CRUSHING IT! 👑",
  "CHAMPION! 🎖️",
  "GODLIKE! ✨",
  "EPIC! 🌟",
  "POWER UP! 🙌",
];

interface LevelUpCelebrationProps {
  visible: boolean;
  level: number;
  onComplete: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  visible,
  level,
  onComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    })),
  ).current;
  const { language } = useApp();

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, () => ({
        startX: Math.random() * SCREEN_WIDTH,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 8 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 120,
        delay: Math.random() * 600,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible],
  );

  // Pick a random celebration word each time the modal appears
  const celebrationText = useMemo(() => {
    const words =
      language === "ar" ? EGYPTIAN_LEVEL_UP_WORDS : ENGLISH_LEVEL_UP_WORDS;
    return words[Math.floor(Math.random() * words.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, language]);

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
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
              duration: 2500 + Math.random() * 1000,
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.timing(c.translateX, {
              toValue: piece.drift,
              duration: 2500,
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.timing(c.rotate, {
              toValue: 3 + Math.random() * 5,
              duration: 2500,
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.sequence([
              Animated.delay(2000),
              Animated.timing(c.opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: Platform.OS !== "web",
              }),
            ]),
          ]),
        ]).start();
      });

      // Start celebration animation sequence
      Animated.sequence([
        // Trophy appears with scale and rotation
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]),
        // Small bounce effect
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -20,
            duration: 150,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]),
        // Hold longer
        Animated.delay(5000),
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start(() => {
        onComplete();
      });
    }
  }, [
    visible,
    scaleAnim,
    rotateAnim,
    fadeAnim,
    bounceAnim,
    confettiAnims,
    confettiPieces,
    onComplete,
  ]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.overlay} onPress={onComplete}>
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
              transform: [
                { scale: scaleAnim },
                { rotate },
                { translateY: bounceAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#8B5CF6", "#7C3AED", "#6D28D9"]}
            style={styles.gradient}
          >
            {/* Hexagonal badge background */}
            <View style={styles.hexagonContainer}>
              {/* Star burst effect */}
              {[...Array(8)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.burstLine,
                    {
                      transform: [{ rotate: `${i * 45}deg` }],
                    },
                  ]}
                />
              ))}

              {/* Center badge */}
              <View style={styles.badge}>
                <MaterialCommunityIcons
                  name="shield-star"
                  size={80}
                  color="#FFD700"
                  style={styles.badgeIcon}
                />
              </View>
            </View>

            {/* Floating sparkles */}
            <MaterialCommunityIcons
              name="creation"
              size={32}
              color="#FFD700"
              style={[styles.sparkle, styles.sparkle1]}
            />
            <MaterialCommunityIcons
              name="creation"
              size={32}
              color="#FFD700"
              style={[styles.sparkle, styles.sparkle2]}
            />
            <MaterialCommunityIcons
              name="star-shooting"
              size={36}
              color="#FFF"
              style={[styles.sparkle, styles.sparkle3]}
            />

            {/* Level Text */}
            <Text style={styles.levelUpText}>{celebrationText}</Text>
            <View style={styles.levelContainer}>
              <Text style={styles.levelLabel}>LEVEL</Text>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>

            {/* Dismiss button */}
            <Pressable style={styles.dismissButton} onPress={onComplete}>
              <Text style={styles.dismissButtonText}>Continue</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#FFF"
              />
            </Pressable>

            {/* Tap hint */}
            <Text style={styles.tapHint}>Tap anywhere to continue</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 380,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  gradient: {
    width: "100%",
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  hexagonContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  burstLine: {
    position: "absolute",
    width: 4,
    height: 80,
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    borderRadius: 2,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 215, 0, 0.5)",
  },
  badgeIcon: {
    ...(Platform.OS === "web"
      ? { textShadow: "0px 4px 12px rgba(0, 0, 0, 0.4)" }
      : {
          textShadowColor: "rgba(0, 0, 0, 0.4)",
          textShadowOffset: { width: 0, height: 4 },
          textShadowRadius: 12,
        }),
  } as any,
  levelUpText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: "center",
    ...(Platform.OS === "web"
      ? { textShadow: "0px 3px 6px rgba(0, 0, 0, 0.3)" }
      : {
          textShadowColor: "rgba(0, 0, 0, 0.3)",
          textShadowOffset: { width: 0, height: 3 },
          textShadowRadius: 6,
        }),
  } as any,
  levelContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 3,
    marginBottom: 4,
  },
  levelNumber: {
    fontSize: 64,
    fontWeight: "900",
    color: "#FFD700",
    ...(Platform.OS === "web"
      ? { textShadow: "0px 4px 8px rgba(0, 0, 0, 0.4)" }
      : {
          textShadowColor: "rgba(0, 0, 0, 0.4)",
          textShadowOffset: { width: 0, height: 4 },
          textShadowRadius: 8,
        }),
  } as any,
  sparkle: {
    position: "absolute",
    opacity: 0.9,
  },
  sparkle1: {
    top: 60,
    left: 20,
  },
  sparkle2: {
    top: 60,
    right: 20,
  },
  sparkle3: {
    bottom: 100,
    right: 30,
  },
  dismissButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  tapHint: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 12,
    textAlign: "center",
  },
});
