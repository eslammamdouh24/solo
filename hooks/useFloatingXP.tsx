import { useRef, useState } from "react";
import { Animated, Platform } from "react-native";

export const useFloatingXP = () => {
  const [floatingXP, setFloatingXP] = useState<number | null>(null);
  const [floatingMessage, setFloatingMessage] = useState<string | null>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const queueRef = useRef<Array<{ amount: number; messages: string[] }>>([]);

  const processQueue = () => {
    if (isAnimatingRef.current || queueRef.current.length === 0) return;

    const next = queueRef.current.shift();
    if (!next) return;

    isAnimatingRef.current = true;
    setFloatingXP(next.amount);
    setFloatingMessage(
      next.messages.length > 0 ? next.messages.join("\n") : null,
    );
    floatAnim.setValue(0);
    floatOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(floatAnim, {
        toValue: -40,
        duration: 1000,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(floatOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start(() => {
      setFloatingXP(null);
      setFloatingMessage(null);
      isAnimatingRef.current = false;
      // Process next item in queue after a short delay
      setTimeout(processQueue, 100);
    });
  };

  const showFloatingXP = (amount: number, messages: string[] = []) => {
    queueRef.current.push({ amount, messages });
    processQueue();
  };

  const clearQueue = () => {
    queueRef.current = [];
    setFloatingXP(null);
    setFloatingMessage(null);
    isAnimatingRef.current = false;
  };

  const FloatingXPComponent = () => {
    if (floatingXP === null) return null;

    const isPositive = floatingXP > 0;
    const sign = isPositive ? "+" : "";

    return (
      <Animated.Text
        style={{
          position: "absolute",
          bottom: 8,
          alignSelf: "center",
          fontSize: 16,
          fontWeight: "800",
          color: isPositive ? "#A855F7" : "#EF4444",
          letterSpacing: 1,
          opacity: floatOpacity,
          transform: [{ translateY: floatAnim }],
        }}
      >
        {sign}
        {floatingXP} XP
        {floatingMessage && `\n${floatingMessage}`}
      </Animated.Text>
    );
  };

  return { FloatingXPComponent, showFloatingXP, clearQueue };
};
