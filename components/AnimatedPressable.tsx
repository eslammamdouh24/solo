import React from "react";
import { Pressable, PressableProps, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

type AnimatedPressableProps = PressableProps & {
  style?: ViewStyle | ViewStyle[];
  /** Scale applied on press-in. Default 0.96 */
  pressScale?: number;
  /** Scale applied on hover (web only). Default 1.03 */
  hoverScale?: number;
  /** Opacity applied on press-in. Default 0.9 */
  pressOpacity?: number;
  children?: React.ReactNode;
};

/**
 * Pressable with spring scale on press and subtle hover lift on web.
 * Drop-in replacement for TouchableOpacity / Pressable.
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  pressScale = 0.96,
  hoverScale = 1.03,
  pressOpacity = 0.9,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  disabled,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const spring = { damping: 14, stiffness: 220, mass: 0.6 };

  return (
    <AnimatedPressableBase
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) {
          scale.value = withSpring(pressScale, spring);
          opacity.value = withTiming(pressOpacity, { duration: 80 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring);
        opacity.value = withTiming(1, { duration: 120 });
        onPressOut?.(e);
      }}
      onHoverIn={(e) => {
        if (!disabled) {
          scale.value = withSpring(hoverScale, spring);
        }
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        scale.value = withSpring(1, spring);
        onHoverOut?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableBase>
  );
};

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);
