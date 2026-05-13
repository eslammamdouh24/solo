import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface AnimatedButtonProps {
  onPress: () => void;
  children?: React.ReactNode;
  text?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  children,
  text,
  icon,
  variant = "primary",
  size = "medium",
  disabled = false,
  style,
  fullWidth = false,
}) => {
  const C = useColors();
  const haptics = useHaptics();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    haptics.light();
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 300,
        friction: 10,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;
    haptics.medium();
    onPress();
  };

  const getVariantColor = () => {
    switch (variant) {
      case "primary":
        return C.primary;
      case "secondary":
        return C.textSecondary;
      case "danger":
        return C.error;
      case "success":
        return C.success;
      default:
        return C.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: 13,
          iconSize: 16,
        };
      case "medium":
        return {
          paddingHorizontal: 24,
          paddingVertical: 14,
          fontSize: 15,
          iconSize: 18,
        };
      case "large":
        return {
          paddingHorizontal: 32,
          paddingVertical: 18,
          fontSize: 17,
          iconSize: 20,
        };
      default:
        return {
          paddingHorizontal: 24,
          paddingVertical: 14,
          fontSize: 15,
          iconSize: 18,
        };
    }
  };

  const variantColor = getVariantColor();
  const sizeStyles = getSizeStyles();
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={disabled}
      style={[fullWidth && { width: "100%" }, disabled && { opacity: 0.5 }]}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: variantColor + "22",
            borderColor: variantColor + "66",
            paddingHorizontal: sizeStyles.paddingHorizontal,
            paddingVertical: sizeStyles.paddingVertical,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glowOverlay,
            {
              backgroundColor: variantColor,
              opacity: glowOpacity,
            },
          ]}
          pointerEvents="none"
        />

        {/* Content */}
        <View style={styles.content}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantColor}
              style={styles.icon}
            />
          )}
          {text && (
            <Text
              style={[
                styles.text,
                {
                  color: variantColor,
                  fontSize: sizeStyles.fontSize,
                },
              ]}
            >
              {text}
            </Text>
          )}
          {children}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  glowOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
