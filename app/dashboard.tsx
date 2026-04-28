import { AnimatedEntry } from "@/components/AnimatedEntry";
import { Skeleton } from "@/components/Skeleton";
import { TopBar } from "@/components/TopBar";
import { Colors } from "@/constants/colors";
import { FontSize } from "@/constants/font-size";
import { getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
    getMuscleDistribution,
    getRecentWorkouts,
    getWeeklyActivity,
    getWorkoutStats,
    getXPProgress,
    RecentWorkout,
} from "@/lib/dashboardApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Animated, RefreshControl, StyleSheet, Text, View } from "react-native";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function DashboardScreen() {
  const { user } = useAuth();
  const { language } = useApp();
  const C = useColors();
  const router = useRouter();
  const isRTL = language === "ar";
  const fontBold = getFont(language, "bold");
  const fontSemibold = getFont(language, "semibold");
  const fontRegular = getFont(language, "regular");
  const fontBlack = getFont(language, "black");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [muscleDistribution, setMuscleDistribution] = useState<any[]>([]);
  const [xpProgress, setXPProgress] = useState<any[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [statsData, weeklyData, muscleData, xpData, recentData] =
        await Promise.all([
          getWorkoutStats(user.id),
          getWeeklyActivity(user.id),
          getMuscleDistribution(user.id),
          getXPProgress(user.id),
          getRecentWorkouts(user.id),
        ]);

      setStats(statsData);
      setWeeklyActivity(weeklyData);
      setMuscleDistribution(muscleData);
      setXPProgress(xpData);
      setRecentWorkouts(recentData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!loading && stats) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, stats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <TopBar title={t(language, "dashboard.title")} showBack />
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            gap: 16,
          }}
        >
          {/* Stats cards skeleton */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Skeleton height={100} borderRadius={12} />
            </View>
            <View style={{ flex: 1 }}>
              <Skeleton height={100} borderRadius={12} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Skeleton height={100} borderRadius={12} />
            </View>
            <View style={{ flex: 1 }}>
              <Skeleton height={100} borderRadius={12} />
            </View>
          </View>
          {/* Chart skeleton */}
          <Skeleton height={250} borderRadius={16} />
          {/* List skeleton */}
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
        </Animated.ScrollView>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <TopBar title={t(language, "dashboard.title")} showBack />
        <View style={styles.centerContainer}>
          <AnimatedEntry index={0} from="fade">
            <MaterialCommunityIcons
              name="account-off-outline"
              size={72}
              color={C.textSecondary}
            />
          </AnimatedEntry>
          <AnimatedEntry index={1} from="down">
            <Text
              style={[
                styles.emptyText,
                { color: C.textSecondary, fontFamily: fontRegular },
              ]}
            >
              Please login to view your dashboard
            </Text>
          </AnimatedEntry>
        </View>
      </View>
    );
  }

  if (!stats || stats.totalWorkouts === 0) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <TopBar title={t(language, "dashboard.title")} showBack />
        <View style={styles.centerContainer}>
          <AnimatedEntry index={0} from="fade">
            <View
              style={[
                styles.emptyIconWrapper,
                { backgroundColor: C.primary + "15" },
              ]}
            >
              <MaterialCommunityIcons
                name="chart-timeline-variant"
                size={56}
                color={C.primary}
              />
            </View>
          </AnimatedEntry>
          <AnimatedEntry index={1} from="down">
            <Text
              style={[
                styles.emptyTitle,
                { color: C.text, fontFamily: fontBold },
              ]}
            >
              Start Your Journey
            </Text>
          </AnimatedEntry>
          <AnimatedEntry index={2} from="down">
            <Text
              style={[
                styles.emptyText,
                { color: C.textSecondary, fontFamily: fontRegular },
              ]}
            >
              Complete your first workout to unlock detailed analytics and track
              your progress.
            </Text>
          </AnimatedEntry>
        </View>
      </View>
    );
  }

  // Derived metrics
  const weekDays = weeklyActivity.reduce(
    (sum, day) => sum + (day.count > 0 ? 1 : 0),
    0,
  );
  const maxWeeklyCount = Math.max(...weeklyActivity.map((d) => d.count), 1);
  const maxMuscleCount = Math.max(
    ...muscleDistribution.map((m: any) => m.count),
    1,
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <TopBar title={t(language, "dashboard.title")} showBack />

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card - Total XP with gradient */}
        <AnimatedEntry index={0} from="down">
          <LinearGradient
            colors={[C.primary, Colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <Text style={[styles.heroLabel, { fontFamily: fontSemibold }]}>
                TOTAL XP EARNED
              </Text>
              <Text style={[styles.heroValue, { fontFamily: fontBlack }]}>
                {stats.totalXP.toLocaleString()}
              </Text>
              <View style={styles.heroMeta}>
                <View style={styles.heroMetaItem}>
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={16}
                    color="#FFF"
                  />
                  <Text
                    style={[styles.heroMetaText, { fontFamily: fontSemibold }]}
                  >
                    {stats.totalWorkouts} workouts
                  </Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroMetaItem}>
                  <MaterialCommunityIcons name="fire" size={16} color="#FFF" />
                  <Text
                    style={[styles.heroMetaText, { fontFamily: fontSemibold }]}
                  >
                    {stats.currentStreak} day streak
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="trophy" size={28} color="#FFF" />
            </View>
          </LinearGradient>
        </AnimatedEntry>

        {/* Key Metrics Row */}
        <AnimatedEntry index={1} from="down">
          <View style={styles.metricsRow}>
            <MetricCard
              icon="clock-outline"
              value={formatDuration(stats.totalDuration)}
              label="Total Time"
              color={Colors.blue}
              C={C}
              fontBold={fontBold}
              fontRegular={fontRegular}
            />
            <MetricCard
              icon="fire"
              value={stats.totalCalories.toLocaleString()}
              label="Calories"
              color={Colors.orange}
              C={C}
              fontBold={fontBold}
              fontRegular={fontRegular}
            />
            <MetricCard
              icon="trophy-outline"
              value={`${stats.bestStreak}d`}
              label="Best Streak"
              color={Colors.gold}
              C={C}
              fontBold={fontBold}
              fontRegular={fontRegular}
            />
          </View>
        </AnimatedEntry>

        {/* Performance Stats */}
        <AnimatedEntry index={2} from="down">
          <View style={[styles.section, { backgroundColor: C.surface }]}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: C.text, fontFamily: fontBold },
                ]}
              >
                Performance
              </Text>
            </View>

            <View style={styles.performanceGrid}>
              <PerformanceRow
                icon="chart-line-variant"
                label="Avg Workouts / Week"
                value={stats.avgWorkoutsPerWeek.toFixed(1)}
                color={Colors.green}
                C={C}
                fontSemibold={fontSemibold}
                fontRegular={fontRegular}
              />
              <PerformanceRow
                icon="calendar-week"
                label="Active Days This Week"
                value={`${weekDays} / 7`}
                color={C.primary}
                C={C}
                fontSemibold={fontSemibold}
                fontRegular={fontRegular}
              />
              <PerformanceRow
                icon="arm-flex"
                label="Most Trained"
                value={
                  stats.mostTrainedMuscle && stats.mostTrainedMuscle !== "None"
                    ? t(language, `muscles.${stats.mostTrainedMuscle}` as any)
                    : "—"
                }
                color={Colors.orange}
                C={C}
                fontSemibold={fontSemibold}
                fontRegular={fontRegular}
                isLast
              />
            </View>
          </View>
        </AnimatedEntry>

        {/* Weekly Activity - Custom Bar Chart */}
        {weeklyActivity.length > 0 && (
          <AnimatedEntry index={3} from="down">
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: C.text, fontFamily: fontBold },
                  ]}
                >
                  Weekly Activity
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: C.textSecondary, fontFamily: fontRegular },
                  ]}
                >
                  {weekDays} active {weekDays === 1 ? "day" : "days"}
                </Text>
              </View>

              <View style={styles.barChartContainer}>
                {weeklyActivity.map((item, index) => {
                  const heightPercent = (item.count / maxWeeklyCount) * 100;
                  const isToday = index === weeklyActivity.length - 1;
                  return (
                    <View key={index} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
                        {item.count > 0 && (
                          <Text
                            style={[
                              styles.barValue,
                              { color: C.text, fontFamily: fontBold },
                            ]}
                          >
                            {item.count}
                          </Text>
                        )}
                        <View
                          style={[
                            styles.barTrack,
                            { backgroundColor: C.surfaceHighlight },
                          ]}
                        >
                          <AnimatedBar
                            height={item.count > 0 ? heightPercent : 0}
                            color={isToday ? Colors.orange : C.primary}
                            delay={index * 100}
                          />
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.barLabel,
                          {
                            color: isToday ? Colors.orange : C.textSecondary,
                            fontFamily: fontSemibold,
                          },
                        ]}
                      >
                        {item.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </AnimatedEntry>
        )}

        {/* Muscle Distribution */}
        {muscleDistribution.length > 0 && (
          <AnimatedEntry index={4} from="down">
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: C.text, fontFamily: fontBold },
                  ]}
                >
                  Muscle Focus
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: C.textSecondary, fontFamily: fontRegular },
                  ]}
                >
                  {muscleDistribution.length}{" "}
                  {muscleDistribution.length === 1 ? "group" : "groups"}
                </Text>
              </View>

              <View style={styles.muscleList}>
                {muscleDistribution.map((item: any, index: number) => {
                  const widthPercent = (item.count / maxMuscleCount) * 100;
                  const isEmpty = item.count === 0;
                  const barColor = C.primary;

                  return (
                    <View key={item.muscle} style={styles.muscleRow}>
                      <View style={styles.muscleHeader}>
                        <Text
                          style={[
                            styles.muscleName,
                            {
                              color: isEmpty ? C.textSecondary : C.text,
                              fontFamily: fontSemibold,
                            },
                          ]}
                        >
                          {t(language, `muscles.${item.muscle}` as any)}
                        </Text>
                        <Text
                          style={[
                            styles.muscleCount,
                            { color: C.textSecondary, fontFamily: fontRegular },
                          ]}
                        >
                          {item.count}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.muscleTrack,
                          { backgroundColor: C.surfaceHighlight },
                        ]}
                      >
                        {!isEmpty && (
                          <AnimatedHorizontalBar
                            width={widthPercent}
                            color={barColor}
                            delay={index * 80}
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </AnimatedEntry>
        )}

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <AnimatedEntry index={5} from="down">
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: C.text, fontFamily: fontBold },
                  ]}
                >
                  Recent Workouts
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: C.textSecondary, fontFamily: fontRegular },
                  ]}
                >
                  Last {Math.min(5, recentWorkouts.length)}
                </Text>
              </View>

              <View style={styles.workoutsList}>
                {recentWorkouts.slice(0, 5).map((workout, index) => (
                  <View
                    key={workout.id}
                    style={[
                      styles.workoutRow,
                      {
                        borderBottomColor: C.surfaceHighlight,
                        borderBottomWidth:
                          index < Math.min(4, recentWorkouts.length - 1)
                            ? 1
                            : 0,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.workoutIcon,
                        { backgroundColor: C.primary + "15" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="weight-lifter"
                        size={18}
                        color={C.primary}
                      />
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text
                        style={[
                          styles.workoutName,
                          { color: C.text, fontFamily: fontSemibold },
                        ]}
                        numberOfLines={1}
                      >
                        {workout.exercise_name}
                      </Text>
                      <Text
                        style={[
                          styles.workoutMeta,
                          {
                            color: C.textSecondary,
                            fontFamily: fontRegular,
                          },
                        ]}
                      >
                        {workout.muscle_group} ·{" "}
                        {formatDuration(workout.duration_seconds)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.workoutXP,
                        { color: Colors.gold, fontFamily: fontBold },
                      ]}
                    >
                      +{workout.xp} XP
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </AnimatedEntry>
        )}

        <View style={{ height: Spacing.xl }} />
      </Animated.ScrollView>
    </View>
  );
}

// Metric Card (small top cards)
const MetricCard = ({
  icon,
  value,
  label,
  color,
  C,
  fontBold,
  fontRegular,
}: {
  icon: IconName;
  value: string | number;
  label: string;
  color: string;
  C: any;
  fontBold: string;
  fontRegular: string;
}) => (
  <View style={[styles.metricCard, { backgroundColor: C.surface }]}>
    <MaterialCommunityIcons
      name={icon}
      size={22}
      color={color}
      style={{ marginBottom: 8 }}
    />
    <Text style={[styles.metricValue, { color: C.text, fontFamily: fontBold }]}>
      {value}
    </Text>
    <Text
      style={[
        styles.metricLabel,
        { color: C.textSecondary, fontFamily: fontRegular },
      ]}
    >
      {label}
    </Text>
  </View>
);

// Performance Row
const PerformanceRow = ({
  icon,
  label,
  value,
  color,
  C,
  fontSemibold,
  fontRegular,
  isLast,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  color: string;
  C: any;
  fontSemibold: string;
  fontRegular: string;
  isLast?: boolean;
}) => (
  <View
    style={[
      styles.perfRow,
      {
        borderBottomColor: C.surfaceHighlight,
        borderBottomWidth: isLast ? 0 : 1,
      },
    ]}
  >
    <View style={styles.perfLeft}>
      <View style={[styles.perfIconDot, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text
        style={[
          styles.perfLabel,
          { color: C.textSecondary, fontFamily: fontRegular },
        ]}
      >
        {label}
      </Text>
    </View>
    <Text
      style={[styles.perfValue, { color: C.text, fontFamily: fontSemibold }]}
    >
      {value}
    </Text>
  </View>
);

// Animated Vertical Bar
const AnimatedBar = ({
  height,
  color,
  delay,
}: {
  height: number;
  color: string;
  delay: number;
}) => {
  const anim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.barFill,
        {
          backgroundColor: color,
          height: anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", `${height}%`],
          }),
        },
      ]}
    />
  );
};

// Animated Horizontal Bar
const AnimatedHorizontalBar = ({
  width,
  color,
  delay,
}: {
  width: number;
  color: string;
  delay: number;
}) => {
  const anim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.muscleFill,
        {
          backgroundColor: color,
          width: anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", `${width}%`],
          }),
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    textAlign: "center",
  },
  emptyText: {
    fontSize: FontSize.md,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },

  // Hero
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg + 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  heroContent: {
    flex: 1,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroValue: {
    color: "#FFF",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: Spacing.sm + 2,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroMetaText: {
    color: "#FFF",
    fontSize: FontSize.sm,
  },
  heroDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Metrics row
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  metricValue: {
    fontSize: FontSize.xl,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Section
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
  },

  // Performance rows
  performanceGrid: {},
  perfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  perfLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    flex: 1,
  },
  perfIconDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  perfLabel: {
    fontSize: FontSize.md,
    flex: 1,
  },
  perfValue: {
    fontSize: FontSize.md,
    textTransform: "capitalize",
  },

  // Bar chart
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    height: "100%",
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barValue: {
    fontSize: FontSize.xs,
    marginBottom: 4,
  },
  barTrack: {
    width: "100%",
    height: "90%",
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
  },
  barLabel: {
    fontSize: FontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Muscle list
  muscleList: {
    gap: Spacing.md,
  },
  muscleRow: {
    gap: 6,
  },
  muscleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  muscleName: {
    fontSize: FontSize.md,
    textTransform: "capitalize",
  },
  muscleCount: {
    fontSize: FontSize.sm,
  },
  muscleTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  muscleFill: {
    height: "100%",
    borderRadius: 4,
  },

  // Workouts list
  workoutsList: {},
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  workoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  workoutInfo: {
    flex: 1,
    gap: 2,
  },
  workoutName: {
    fontSize: FontSize.md,
    textTransform: "capitalize",
  },
  workoutMeta: {
    fontSize: FontSize.sm,
    textTransform: "capitalize",
  },
  workoutXP: {
    fontSize: FontSize.md,
    letterSpacing: 0.3,
  },
});
