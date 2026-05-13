import { getFont } from "@/constants/fonts";
import { STAT_ICONS } from "@/constants/stats";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface StatRowProps {
  label: string;
  value: number | string;
  iconName: keyof typeof STAT_ICONS;
  onUpgrade?: () => void;
  canUpgrade?: boolean;
}

export const StatRow = React.memo<StatRowProps>(
  ({ label, value, iconName, onUpgrade, canUpgrade }) => {
    const C = useColors();
    const { language } = useApp();
    const haptics = useHaptics();
    const isRTL = language === "ar";
    const fontSemibold = getFont(language, "semibold");
    const fontBold = getFont(language, "bold");
    const icon = STAT_ICONS[iconName];

    const buttonScale = useRef(new Animated.Value(1)).current;
    const buttonGlow = useRef(new Animated.Value(0)).current;
    const iconBounce = useRef(new Animated.Value(0)).current;

    // Pulsing effect for upgrade button
    useEffect(() => {
      if (canUpgrade) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(buttonGlow, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: false,
            }),
            Animated.timing(buttonGlow, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: false,
            }),
          ]),
        ).start();

        // Icon bounce
        Animated.loop(
          Animated.sequence([
            Animated.timing(iconBounce, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(iconBounce, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      }
    }, [canUpgrade]);

    const handlePress = () => {
      Animated.sequence([
        Animated.spring(buttonScale, {
          toValue: 0.85,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      haptics.medium();
      if (onUpgrade) onUpgrade();
    };

    const glowOpacity = buttonGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    const iconTranslateY = iconBounce.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -3],
    });

    return (
      <View
        style={[
          styles.container,
          {
            borderBottomColor: C.surface,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <View
          style={[
            styles.labelSection,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={C.textSecondary}
          />
          <Text
            style={[
              styles.label,
              { color: C.textSecondary, fontFamily: fontSemibold },
            ]}
          >
            {label.toUpperCase()}
          </Text>
        </View>
        <View
          style={[
            styles.valueSection,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text
            style={[styles.value, { color: C.primary, fontFamily: fontBold }]}
          >
            {value}
          </Text>
          {canUpgrade && onUpgrade && (
            <TouchableOpacity
              onPress={handlePress}
              activeOpacity={0.8}
              style={styles.upgradeButtonWrapper}
            >
              <Animated.View
                style={[
                  styles.upgradeButton,
                  {
                    backgroundColor: C.primary + "33",
                    transform: [{ scale: buttonScale }],
                  },
                ]}
              >
                {/* Pulsing glow background */}
                <Animated.View
                  style={[
                    styles.upgradeGlow,
                    {
                      backgroundColor: C.primary,
                      opacity: glowOpacity,
                    },
                  ]}
                />
                <Animated.View
                  style={{
                    transform: [{ translateY: iconTranslateY }],
                  }}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color={C.primary}
                  />
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  labelSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: "#7A8CA3",
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  value: {
    fontSize: 28,
    fontWeight: "900",
    color: "#A855F7",
  },
  valueSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  upgradeButtonWrapper: {
    position: "relative",
  },
  upgradeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  upgradeGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});
