import { useApp } from "@/contexts/AppContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
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
        Animated.delay(3500),
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
      <View style={styles.overlay}>
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
            colors={["#FFD700", "#FFA500", "#FF8C00"]}
            style={styles.gradient}
          >
            {/* Trophy Icon */}
            <MaterialCommunityIcons
              name="trophy"
              size={120}
              color="#FFF"
              style={styles.trophy}
            />

            {/* Sparkles */}
            <MaterialCommunityIcons
              name="star-four-points"
              size={40}
              color="#FFF"
              style={[styles.sparkle, styles.sparkle1]}
            />
            <MaterialCommunityIcons
              name="star-four-points"
              size={40}
              color="#FFF"
              style={[styles.sparkle, styles.sparkle2]}
            />
            <MaterialCommunityIcons
              name="star-four-points"
              size={40}
              color="#FFF"
              style={[styles.sparkle, styles.sparkle3]}
            />

            {/* Level Text */}
            <Text style={styles.levelUpText}>{celebrationText}</Text>
            <Text style={styles.levelNumber}>{level}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: "hidden",
    boxShadow: "0px 0px 30px rgba(255, 215, 0, 0.8)",
  },
  gradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  trophy: {
    marginBottom: 10,
    ...(Platform.OS === "web"
      ? { textShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)" }
      : {
          textShadowColor: "rgba(0, 0, 0, 0.3)",
          textShadowOffset: { width: 0, height: 4 },
          textShadowRadius: 8,
        }),
  } as any,
  levelUpText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 3,
    ...(Platform.OS === "web"
      ? { textShadow: "0px 2px 4px rgba(0, 0, 0, 0.3)" }
      : {
          textShadowColor: "rgba(0, 0, 0, 0.3)",
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 4,
        }),
  } as any,
  levelNumber: {
    fontSize: 56,
    fontWeight: "900",
    color: "#FFF",
    ...(Platform.OS === "web"
      ? { textShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)" }
      : {
          textShadowColor: "rgba(0, 0, 0, 0.3)",
          textShadowOffset: { width: 0, height: 4 },
          textShadowRadius: 6,
        }),
  } as any,
  sparkle: {
    position: "absolute",
    opacity: 0.8,
  },
  sparkle1: {
    top: 30,
    left: 30,
  },
  sparkle2: {
    top: 30,
    right: 30,
  },
  sparkle3: {
    bottom: 40,
    left: Dimensions.get("window").width / 2 - 140,
  },
});
