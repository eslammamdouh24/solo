import { useColors } from "@/hooks/useColors";
import { useSound } from "@/hooks/useSound";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CountdownTimerProps {
  visible: boolean;
  onComplete: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  visible,
  onComplete,
}) => {
  const [count, setCount] = React.useState(5);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const C = useColors();
  const { playXPSound } = useSound();

  useEffect(() => {
    if (visible) {
      setCount(5);
      startCountdown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const startCountdown = () => {
    let currentCount = 5;

    const countdown = () => {
      if (currentCount <= 0) {
        // Countdown finished - GO! animation
        setCount(0);
        scaleAnim.setValue(0);
        fadeAnim.setValue(0);

        // Play sound for GO!
        playXPSound();

        Animated.sequence([
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1.3,
              friction: 4,
              tension: 50,
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: Platform.OS !== "web",
            }),
          ]),
          Animated.delay(500),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: Platform.OS !== "web",
            }),
          ]),
        ]).start(() => {
          onComplete();
        });
        return;
      }

      setCount(currentCount);

      // Play tick sound
      if (currentCount <= 3) {
        playXPSound();
      }

      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);

      // Animate number appearing
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 200,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();

      currentCount--;
      setTimeout(countdown, 1000);
    };

    countdown();
  };

  if (!visible) return null;

  const getCountdownColor = () => {
    if (count === 0) return "#00FF41"; // Bright green for GO!
    if (count <= 2) return "#FF4757"; // Red for urgency
    if (count <= 4) return "#FFA502"; // Orange
    return C.primary; // Primary color for 5
  };

  const getCountdownGradient = (): [string, string, string] => {
    if (count === 0) return ["#00FF41", "#00D936", "#00B82E"]; // Green gradient for GO!
    if (count <= 2) return ["#FF4757", "#FF3838", "#EE2020"]; // Red gradient
    if (count <= 4) return ["#FFA502", "#FF8F00", "#FF7A00"]; // Orange gradient
    return [C.primary, C.primaryDark || C.primary, C.primary]; // Primary gradient
  };

  const getCountdownText = () => {
    if (count === 0) return "GO!";
    return count.toString();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <LinearGradient
        colors={[
          "rgba(0, 0, 0, 0.98)",
          "rgba(0, 0, 0, 0.95)",
          "rgba(0, 0, 0, 0.98)",
        ]}
        style={styles.overlay}
      >
        {/* Main countdown number/text */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
          }}
        >
          <View style={styles.numberContainer}>
            <Text style={[styles.countText, { color: getCountdownColor() }]}>
              {getCountdownText()}
            </Text>
          </View>
        </Animated.View>

        {/* "Get Ready" or "GO!" text */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: 40 }}>
          <Text
            style={[
              styles.readyText,
              {
                color: count === 0 ? getCountdownColor() : C.textSecondary,
                fontSize: count === 0 ? 32 : 24,
              },
            ]}
          >
            {count === 0 ? "LET'S GO!" : "GET READY"}
          </Text>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  numberContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 140,
    fontWeight: "900",
    textAlign: "center",
    ...(Platform.OS === "web"
      ? { textShadow: "0px 8px 24px rgba(0, 0, 0, 0.8)" }
      : {
          textShadowColor: "rgba(0, 0, 0, 0.8)",
          textShadowOffset: { width: 0, height: 8 },
          textShadowRadius: 24,
        }),
  } as any,
  readyText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
  },
});
