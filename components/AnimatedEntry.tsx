import React from "react";
import { ViewStyle } from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeInUp,
} from "react-native-reanimated";

type Direction = "up" | "down" | "left" | "right" | "fade";

interface AnimatedEntryProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  duration?: number;
  from?: Direction;
  style?: ViewStyle | ViewStyle[];
  stagger?: number;
}

/**
 * Wraps children with a bouncy spring entry animation.
 * Use `index` for staggered list animations.
 * Use `from` to control direction (default: "down" = slides up into view).
 */
export const AnimatedEntry: React.FC<AnimatedEntryProps> = ({
  children,
  index = 0,
  delay = 0,
  duration = 450,
  from = "down",
  style,
  stagger = 60,
}) => {
  const totalDelay = delay + index * stagger;

  const getEntering = () => {
    const base = (() => {
      switch (from) {
        case "up":
          return FadeInUp;
        case "left":
          return FadeInLeft;
        case "right":
          return FadeInRight;
        case "fade":
          return FadeIn;
        case "down":
        default:
          return FadeInDown;
      }
    })();
    return base
      .springify()
      .damping(14)
      .mass(0.9)
      .delay(totalDelay)
      .duration(duration);
  };

  return (
    <Animated.View entering={getEntering()} style={style}>
      {children}
    </Animated.View>
  );
};
