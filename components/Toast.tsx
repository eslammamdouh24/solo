import {
  BorderRadius,
  Colors,
  FontSize,
  Spacing,
} from "@/constants/theme-colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text } from "react-native";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
  duration?: number;
  onHide?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  visible,
  duration = 3000,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start(() => {
      onHide?.();
    });
  }, [translateY, opacity, onHide]);

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, translateY, opacity, duration, hideToast]);

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: Colors.success,
          iconColor: Colors.background,
          icon: "check-circle" as const,
        };
      case "error":
        return {
          backgroundColor: Colors.error,
          iconColor: Colors.background,
          icon: "alert-circle" as const,
        };
      case "info":
        return {
          backgroundColor: Colors.info,
          iconColor: Colors.background,
          icon: "information" as const,
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: toastStyle.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={toastStyle.icon}
        size={24}
        color={toastStyle.iconColor}
      />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
    zIndex: 9999,
  },
  message: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 20,
  },
});
