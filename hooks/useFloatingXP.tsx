import { useRef, useState } from "react";
import { Animated, Platform } from "react-native";

export const useFloatingXP = () => {
  const [floatingXP, setFloatingXP] = useState<number | null>(null);
  const [floatingMessage, setFloatingMessage] = useState<string | null>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;

  const showFloatingXP = (amount: number, messages: string[] = []) => {
    setFloatingXP(amount);
    setFloatingMessage(messages.length > 0 ? messages.join("\n") : null);
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
    });
  };

  const FloatingXPComponent = () => {
    if (floatingXP === null) return null;

    return (
      <Animated.Text
        style={{
          position: "absolute",
          bottom: 8,
          alignSelf: "center",
          fontSize: 16,
          fontWeight: "800",
          color: "#00E5FF",
          letterSpacing: 1,
          opacity: floatOpacity,
          transform: [{ translateY: floatAnim }],
        }}
      >
        +{floatingXP} XP
        {floatingMessage && `\n${floatingMessage}`}
      </Animated.Text>
    );
  };

  return { FloatingXPComponent, showFloatingXP };
};
