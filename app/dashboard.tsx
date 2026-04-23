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
  getEquipmentUsage,
  getMuscleDistribution,
  getRecentWorkouts,
  getWeeklyActivity,
  getWorkoutStats,
  getXPProgress,
  RecentWorkout,
} from "@/lib/dashboardApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryPie,
  VictoryTheme,
} from "victory";

export default function DashboardScreen() {
  const { user } = useAuth();
  const { language } = useApp();
  const C = useColors();
  const router = useRouter();
  const isRTL = language === "ar";
  const fontBold = getFont(language, "bold");
  const fontSemibold = getFont(language, "semibold");
  const fontRegular = getFont(language, "regular");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [muscleDistribution, setMuscleDistribution] = useState<any[]>([]);
  const [xpProgress, setXPProgress] = useState<any[]>([]);
  const [equipmentUsage, setEquipmentUsage] = useState<any[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const [cardAnims] = useState(() =>
    Array.from({ length: 4 }, () => new Animated.Value(0)),
  );

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [
        statsData,
        weeklyData,
        muscleData,
        xpData,
        equipmentData,
        recentData,
      ] = await Promise.all([
        getWorkoutStats(user.id),
        getWeeklyActivity(user.id),
        getMuscleDistribution(user.id),
        getXPProgress(user.id),
        getEquipmentUsage(user.id),
        getRecentWorkouts(user.id),
      ]);

      setStats(statsData);
      setWeeklyActivity(weeklyData);
      setMuscleDistribution(muscleData.slice(0, 5));
      setXPProgress(xpData);
      setEquipmentUsage(equipmentData.slice(0, 5));
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
      // Fade in and slide up animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Stagger card animations
      cardAnims.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [loading, stats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <TopBar
          title={t(language, "dashboard.title")}
          showBack
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <TopBar
          title={t(language, "dashboard.title")}
          showBack
        />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="account-alert" size={64} color={C.textSecondary} />
          <Text style={[styles.emptyText, { color: C.textSecondary, fontFamily: fontRegular }]}>
            {t(language, "auth.pleaseLogin")}
          </Text>
        </View>
      </View>
    );
  }

  if (!stats || stats.totalWorkouts === 0) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <TopBar
          title={t(language, "dashboard.title")}
          showBack
        />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="chart-box-outline" size={64} color={C.textSecondary} />
          <Text style={[styles.emptyTitle, { color: C.text, fontFamily: fontBold }]}>
            No Workout Data Yet
          </Text>
          <Text style={[styles.emptyText, { color: C.textSecondary, fontFamily: fontRegular }]}>
            Start working out to see your progress here!{"\n"}Complete your first exercise to unlock dashboard analytics.
          </Text>
        </View>
      </View>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const muscleColors = [
    C.primary,
    Colors.purple,
    Colors.orange,
    Colors.green,
    Colors.blue,
  ];

  // Generate insights based on data
  const getInsights = () => {
    const insights = [];
    
    // Streak insights
    if (stats.currentStreak >= 7) {
      insights.push({
        icon: "fire",
        color: Colors.orange,
        title: "🔥 On Fire!",
        message: `Amazing ${stats.currentStreak}-day streak! Keep it going!`,
      });
    } else if (stats.currentStreak >= 3) {
      insights.push({
        icon: "trending-up",
        color: Colors.green,
        title: "Great Progress",
        message: `${stats.currentStreak} days in a row. You're building momentum!`,
      });
    }

    // Muscle balance insight
    if (muscleDistribution.length > 0) {
      const topMuscle = muscleDistribution[0];
      const topPercentage = topMuscle.percentage;
      
      if (topPercentage > 40) {
        insights.push({
          icon: "alert-circle",
          color: Colors.orange,
          title: "Balance Your Workouts",
          message: `${topMuscle.muscle} dominates ${topPercentage}% of your training. Try other muscle groups for balance!`,
        });
      }
    }

    // Consistency insight
    const totalDays = weeklyActivity.reduce((sum, day) => sum + (day.count > 0 ? 1 : 0), 0);
    if (totalDays >= 5) {
      insights.push({
        icon: "calendar-check",
        color: Colors.green,
        title: "Consistent Warrior",
        message: `You trained ${totalDays} days this week! Excellent consistency.`,
      });
    } else if (totalDays <= 2 && stats.totalWorkouts > 5) {
      insights.push({
        icon: "calendar-alert",
        color: Colors.gold,
        title: "Stay Active",
        message: "Only 2 workouts this week. Let's get back on track!",
      });
    }

    // XP efficiency insight
    if (stats.avgWorkoutsPerWeek >= 4) {
      insights.push({
        icon: "chart-line",
        color: Colors.blue,
        title: "Strong Routine",
        message: `Averaging ${stats.avgWorkoutsPerWeek.toFixed(1)} workouts/week. You're crushing it!`,
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <TopBar
        title={t(language, "dashboard.title")}
        showBack
      />

      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
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
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="dumbbell"
            label={t(language, "dashboard.totalWorkouts")}
            value={stats.totalWorkouts}
            color={C.primary}
            index={0}
            anim={cardAnims[0]}
          />
          <StatCard
            icon="fire"
            label={t(language, "dashboard.currentStreak")}
            value={`${stats.currentStreak}`}
            subtitle={t(language, "dashboard.days")}
            color={stats.currentStreak >= 7 ? Colors.orange : Colors.gold}
            index={1}
            anim={cardAnims[1]}
          />
          <StatCard
            icon="star"
            label={t(language, "dashboard.totalXP")}
            value={stats.totalXP >= 1000 ? `${(stats.totalXP / 1000).toFixed(1)}k` : stats.totalXP}
            color={Colors.gold}
            index={2}
            anim={cardAnims[2]}
          />
          <StatCard
            icon="clock-outline"
            label={t(language, "dashboard.totalTime")}
            value={formatDuration(stats.totalDuration)}
            color={Colors.blue}
            index={3}
            anim={cardAnims[3]}
          />
        </View>

        {/* Insights Section */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fontBold }]}>
              💡 Insights & Recommendations
            </Text>
            {insights.map((insight, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.insightCard,
                  {
                    backgroundColor: C.surface,
                    borderLeftColor: insight.color,
                  },
                ]}
              >
                <View style={[styles.insightIconContainer, { backgroundColor: insight.color + "20" }]}>
                  <MaterialCommunityIcons name={insight.icon} size={24} color={insight.color} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: C.text, fontFamily: fontBold }]}>
                    {insight.title}
                  </Text>
                  <Text style={[styles.insightMessage, { color: C.textSecondary, fontFamily: fontRegular }]}>
                    {insight.message}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Weekly Activity Bar Chart */}
        {weeklyActivity.length > 0 && weeklyActivity.some(d => d.count > 0) && (
          <ChartCard title={t(language, "dashboard.weeklyActivity")} C={C} fontSemibold={fontSemibold}>
            <VictoryChart
              theme={VictoryTheme.material}
              height={220}
              padding={{ left: 45, right: 20, top: 20, bottom: 50 }}
              domainPadding={{ x: 25 }}
            >
              <VictoryAxis
                style={{
                  axis: { stroke: C.border },
                  tickLabels: {
                    fill: C.textSecondary,
                    fontSize: 11,
                    fontFamily: fontRegular,
                  },
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: C.border },
                  tickLabels: {
                    fill: C.textSecondary,
                    fontSize: 11,
                    fontFamily: fontRegular,
                  },
                  grid: { stroke: C.border, strokeDasharray: "4,4", opacity: 0.3 },
                }}
                tickFormat={(t) => Math.floor(t)}
              />
              <VictoryBar
                data={weeklyActivity}
                x="day"
                y="count"
                style={{
                  data: { 
                    fill: C.primary,
                    stroke: C.primary,
                    strokeWidth: 1,
                  },
                }}
                cornerRadius={{ top: 6 }}
                barWidth={28}
                animate={{
                  duration: 1000,
                  onLoad: { duration: 1000 },
                }}
              />
            </VictoryChart>
          </ChartCard>
        )}

        {/* XP Progress Line Chart */}
        {xpProgress.length >= 3 && (
          <ChartCard title={t(language, "dashboard.xpProgress")} C={C} fontSemibold={fontSemibold}>
            <VictoryChart
              theme={VictoryTheme.material}
              height={220}
              padding={{ left: 60, right: 20, top: 20, bottom: 50 }}
            >
              <VictoryAxis
                style={{
                  axis: { stroke: C.border },
                  tickLabels: {
                    fill: C.textSecondary,
                    fontSize: 10,
                    fontFamily: fontRegular,
                    angle: -45,
                    textAnchor: "end",
                  },
                }}
                tickFormat={(t) => {
                  const date = new Date(t);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: C.border },
                  tickLabels: {
                    fill: C.textSecondary,
                    fontSize: 11,
                    fontFamily: fontRegular,
                  },
                  grid: { stroke: C.border, strokeDasharray: "4,4", opacity: 0.3 },
                }}
                tickFormat={(t) => t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}
              />
              <VictoryLine
                data={xpProgress}
                x="date"
                y="cumulativeXp"
                style={{
                  data: { 
                    stroke: Colors.gold, 
                    strokeWidth: 3,
                    strokeLinecap: "round",
                  },
                }}
                animate={{
                  duration: 1500,
                  onLoad: { duration: 1500 },
                }}
              />
            </VictoryChart>
          </ChartCard>
        )}

        {/* Muscle Distribution Pie Chart */}
        {muscleDistribution.length >= 2 && (
          <ChartCard title={t(language, "dashboard.muscleDistribution")} C={C} fontSemibold={fontSemibold}>
            <View style={styles.pieChartContainer}>
              <VictoryPie
                data={muscleDistribution}
                x="muscle"
                y="count"
                colorScale={muscleColors}
                height={240}
                innerRadius={50}
                padding={{ left: 20, right: 20, top: 20, bottom: 20 }}
                style={{
                  labels: {
                    fontSize: 12,
                    fontFamily: fontSemibold,
                    fill: C.text,
                  },
                }}
                labelRadius={85}
                animate={{
                  duration: 1000,
                  onLoad: { duration: 1000 },
                }}
              />
            </View>
            <View style={styles.legendContainer}>
              {muscleDistribution.map((item, index) => (
                <View key={item.muscle} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: muscleColors[index] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      { color: C.text, fontFamily: fontSemibold },
                    ]}
                  >
                    {item.muscle}
                  </Text>
                  <Text
                    style={[
                      styles.legendPercentage,
                      { color: C.textSecondary, fontFamily: fontRegular },
                    ]}
                  >
                    {item.percentage}%
                  </Text>
                </View>
              ))}
            </View>
          </ChartCard>
        )}

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.chartTitle, { color: C.text, fontFamily: fontBold }]}>
              {t(language, "dashboard.recentWorkouts")}
            </Text>
            {recentWorkouts.slice(0, 5).map((workout, index) => (
              <View
                key={workout.id}
                style={[
                  styles.workoutItem,
                  {
                    borderBottomColor: C.border,
                    borderBottomWidth: index < 4 ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.workoutInfo}>
                  <Text
                    style={[
                      styles.workoutName,
                      { color: C.text, fontFamily: fontSemibold },
                    ]}
                  >
                    {workout.exercise_name}
                  </Text>
                  <View style={[styles.workoutMeta, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Text
                      style={[
                        styles.workoutMuscle,
                        { color: C.textSecondary, fontFamily: fontRegular },
                      ]}
                    >
                      {workout.muscle_group}
                    </Text>
                    <Text style={{ color: C.textSecondary }}> • </Text>
                    <Text
                      style={[
                        styles.workoutDuration,
                        { color: C.textSecondary, fontFamily: fontRegular },
                      ]}
                    >
                      {formatDuration(workout.duration_seconds)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.workoutXp, { backgroundColor: Colors.gold + "20" }]}>
                  <MaterialCommunityIcons name="star" size={14} color={Colors.gold} />
                  <Text
                    style={[
                      styles.workoutXpText,
                      { color: Colors.gold, fontFamily: fontBold },
                    ]}
                  >
                    {workout.xp}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: Spacing.xl }} />
      </Animated.ScrollView>
    </View>
  );
}

// Stat Card Component
const StatCard = ({
  icon,
  label,
  value,
  subtitle,
  color,
  index,
  anim,
}: {
  icon: any;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  index: number;
  anim: Animated.Value;
}) => {
  const C = useColors();
  const { language } = useApp();
  const fontBold = getFont(language, "bold");
  const fontRegular = getFont(language, "regular");

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: C.surface,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + "18" }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.statValue, { color: C.text, fontFamily: fontBold }]}>
        {value}
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: C.textSecondary, fontFamily: fontRegular }]}>
            {" "}{subtitle}
          </Text>
        )}
      </Text>
      <Text
        style={[
          styles.statLabel,
          { color: C.textSecondary, fontFamily: fontRegular },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

// Chart Card Component
const ChartCard = ({
  title,
  children,
  C,
  fontSemibold,
}: {
  title: string;
  children: React.ReactNode;
  C: any;
  fontSemibold: string;
}) => {
  return (
    <View style={[styles.chartCard, { backgroundColor: C.surface }]}>
      <Text style={[styles.chartTitle, { color: C.text, fontFamily: fontSemibold }]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: FontSize.xxl,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  statSubtitle: {
    fontSize: FontSize.sm,
  },
  statLabel: {
    fontSize: FontSize.sm,
    textAlign: "center",
    lineHeight: 18,
  },
  insightsSection: {
    padding: Spacing.md,
    paddingTop: 0,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  insightCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  insightContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  insightTitle: {
    fontSize: FontSize.md,
  },
  insightMessage: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  chartCard: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  chartTitle: {
    fontSize: FontSize.lg,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  pieChartContainer: {
    alignItems: "center",
    marginVertical: Spacing.sm,
  },
  legendContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
  },
  legendText: {
    fontSize: FontSize.md,
    flex: 1,
  },
  legendPercentage: {
    fontSize: FontSize.sm,
  },
  workoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  workoutInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  workoutName: {
    fontSize: FontSize.md,
  },
  workoutMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutMuscle: {
    fontSize: FontSize.sm,
  },
  workoutDuration: {
    fontSize: FontSize.sm,
  },
  workoutXp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  workoutXpText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
});
