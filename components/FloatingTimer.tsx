import { FontSize } from "@/constants/font-size";
import { getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { useApp } from "@/contexts/AppContext";
import { useFloatingTimer } from "@/contexts/FloatingTimerContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

const EDGE_SNAP_DISTANCE = 60;
const COLLAPSED_WIDTH = 35;
const EXPANDED_WIDTH = 200;

export const FloatingTimer: React.FC = () => {
  const C = useColors();
  const { language } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const fontBold = getFont(language, "bold");
  const fontBlack = getFont(language, "black");
  const {
    seconds,
    running,
    exerciseName,
    exerciseRoute,
    isMinimized,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useFloatingTimer();

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Reanimated shared values
  const translateX = useSharedValue(20);
  const translateY = useSharedValue(100);
  const width = useSharedValue(EXPANDED_WIDTH);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAtLeftEdge, setIsAtLeftEdge] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleNavigateToExercise = () => {
    if (isDragging) return;
    if (exerciseRoute) {
      router.push({
        pathname: "/exercise-detail",
        params: {
          muscle: exerciseRoute.muscle,
          exerciseId: exerciseRoute.exerciseId,
        },
      });
    }
  };

  const handleExpandFromEdge = () => {
    if (isDragging) return;
    const targetX = isAtLeftEdge ? 20 : screenWidth - 220;
    translateX.value = withSpring(targetX, { damping: 15, stiffness: 150 });
    width.value = withTiming(EXPANDED_WIDTH, { duration: 250 });
    runOnJS(setIsCollapsed)(false);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      runOnJS(setIsDragging)(true);
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      const currentX = translateX.value;
      const currentY = translateY.value;

      // Check if near any edge
      const nearLeftEdge = currentX < EDGE_SNAP_DISTANCE;
      const nearRightEdge =
        currentX > screenWidth - EXPANDED_WIDTH - EDGE_SNAP_DISTANCE;
      const nearTopEdge = currentY < EDGE_SNAP_DISTANCE;
      const nearBottomEdge = currentY > screenHeight - 150 - EDGE_SNAP_DISTANCE;
      const nearAnyEdge =
        nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge;

      if (nearLeftEdge) {
        // Snap to left edge
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        width.value = withTiming(COLLAPSED_WIDTH, { duration: 250 });
        runOnJS(setIsCollapsed)(true);
        runOnJS(setIsAtLeftEdge)(true);
      } else if (nearRightEdge) {
        // Snap to right edge
        translateX.value = withSpring(screenWidth - COLLAPSED_WIDTH, {
          damping: 15,
          stiffness: 150,
        });
        width.value = withTiming(COLLAPSED_WIDTH, { duration: 250 });
        runOnJS(setIsCollapsed)(true);
        runOnJS(setIsAtLeftEdge)(false);
      } else if (nearTopEdge || nearBottomEdge) {
        // Near top or bottom edge - expand if collapsed
        if (isCollapsed) {
          width.value = withTiming(EXPANDED_WIDTH, { duration: 250 });
          runOnJS(setIsCollapsed)(false);
        }
      } else {
        // Not near any edge - expand if collapsed
        if (isCollapsed) {
          width.value = withTiming(EXPANDED_WIDTH, { duration: 250 });
          runOnJS(setIsCollapsed)(false);
        }
      }

      // Keep within bounds
      const maxX = screenWidth - EXPANDED_WIDTH;
      const maxY = screenHeight - 150;

      if (currentX < 0) {
        translateX.value = withSpring(0, { damping: 15 });
      } else if (currentX > maxX) {
        translateX.value = withSpring(maxX, { damping: 15 });
      }

      if (currentY < 0) {
        translateY.value = withSpring(0, { damping: 15 });
      } else if (currentY > maxY) {
        translateY.value = withSpring(maxY, { damping: 15 });
      }

      // Reset drag state after a short delay
      setTimeout(() => {
        runOnJS(setIsDragging)(false);
      }, 100);
    })
    .minDistance(3);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    width: width.value,
  }));

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Don't render if no exercise is active or not minimized
  if (!exerciseName || !isMinimized) {
    return null;
  }

  // Don't show if currently on exercise-detail screen
  if (pathname === "/exercise-detail") {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          {
            backgroundColor: C.background,
            borderColor: running ? C.primary : C.textSecondary,
          },
        ]}
      >
        {/* Solid background */}
        <View style={[styles.backgroundBlur, { backgroundColor: C.surface }]} />

        {isCollapsed ? (
          // Collapsed view - icon expands, timer navigates
          <View style={styles.collapsedContent}>
            <Pressable
              onPress={handleExpandFromEdge}
              hitSlop={8}
              disabled={isDragging}
            >
              <MaterialCommunityIcons
                name={isAtLeftEdge ? "chevron-right" : "chevron-left"}
                size={20}
                color={C.text}
              />
            </Pressable>
            <Pressable
              onPress={handleNavigateToExercise}
              style={styles.collapsedTimer}
              disabled={isDragging}
            >
              <Text
                style={[
                  styles.collapsedTime,
                  {
                    color: running ? C.primary : C.text,
                    fontFamily: fontBlack,
                  },
                ]}
              >
                {formatTime(seconds).split(":")[0]}
              </Text>
              <Text
                style={[
                  styles.collapsedTime,
                  {
                    color: running ? C.primary : C.text,
                    fontFamily: fontBlack,
                  },
                ]}
              >
                {formatTime(seconds).split(":")[1]}
              </Text>
            </Pressable>
          </View>
        ) : (
          // Expanded view
          <View style={styles.expandedWrapper}>
            {/* Drag handle at top */}
            <View
              style={[styles.dragHandle, { backgroundColor: C.textMuted }]}
            />

            <Pressable
              onPress={handleNavigateToExercise}
              style={styles.content}
              disabled={isDragging}
            >
              <View style={styles.topRow}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: running
                        ? C.primary + "20"
                        : C.surfaceHighlight,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="timer-outline"
                    size={20}
                    color={running ? C.primary : C.textSecondary}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.exerciseName,
                      { color: C.textSecondary, fontFamily: fontBold },
                    ]}
                    numberOfLines={1}
                  >
                    {exerciseName}
                  </Text>
                  <Text
                    style={[
                      styles.timer,
                      {
                        color: running ? C.primary : C.text,
                        fontFamily: fontBlack,
                      },
                    ]}
                  >
                    {formatTime(seconds)}
                  </Text>
                </View>
              </View>

              <View style={styles.controls}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    running ? pauseTimer() : resumeTimer();
                  }}
                  style={[
                    styles.controlButton,
                    { backgroundColor: C.primary + "20" },
                  ]}
                  hitSlop={8}
                  disabled={isDragging}
                >
                  <MaterialCommunityIcons
                    name={running ? "pause" : "play"}
                    size={18}
                    color={C.primary}
                  />
                </Pressable>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    stopTimer();
                  }}
                  style={[
                    styles.controlButton,
                    { backgroundColor: C.error + "20" },
                  ]}
                  hitSlop={8}
                  disabled={isDragging}
                >
                  <MaterialCommunityIcons
                    name="stop"
                    size={18}
                    color={C.error}
                  />
                </Pressable>
              </View>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    minHeight: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
    zIndex: 9999,
    overflow: "hidden",
  },
  backgroundBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    opacity: 1,
  },
  expandedWrapper: {
    position: "relative",
    zIndex: 1,
    flex: 1,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: BorderRadius.full,
    alignSelf: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    opacity: 0.6,
  },
  content: {
    padding: Spacing.md,
    paddingTop: 0,
    position: "relative",
    zIndex: 1,
  },
  collapsedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    zIndex: 1,
  },
  collapsedTimer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  collapsedTime: {
    fontSize: FontSize.md,
    fontWeight: "900",
    marginTop: Spacing.xs,
    textAlign: "center",
    lineHeight: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    marginBottom: 2,
  },
  timer: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    letterSpacing: 1,
  },
  controls: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  controlButton: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
