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

  // Calculate additional stats
  const getAdditionalStats = () => {
    const totalDays = weeklyActivity.reduce((sum, day) => sum + (day.count > 0 ? 1 : 0), 0);
    const avgXPPerWorkout = stats.totalWorkouts > 0 ? Math.round(stats.totalXP / stats.totalWorkouts) : 0;
    const avgDurationMins = stats.totalWorkouts > 0 ? Math.round((stats.totalDuration / stats.totalWorkouts) / 60) : 0;
    
    return [
      {
        icon: "chart-line",
        label: "Avg Workouts/Week",
        value: stats.avgWorkoutsPerWeek.toFixed(1),
        color: Colors.green,
      },
      {
        icon: "trophy",
        label: "Best Streak",
        value: stats.bestStreak,
        subtitle: "days",
        color: Colors.gold,
      },
      {
        icon: "lightning-bolt",
        label: "Avg XP/Workout",
        value: avgXPPerWorkout,
        color: Colors.purple,
      },
      {
        icon: "timer-outline",
        label: "Avg Duration",
        value: avgDurationMins,
        subtitle: "min",
        color: Colors.blue,
      },
      {
        icon: "calendar-week",
        label: "This Week",
        value: totalDays,
        subtitle: "days",
        color: C.primary,
      },
      {
        icon: "bullseye-arrow",
        label: "Most Trained",
        value: stats.mostTrainedMuscle || "None",
        isText: true,
        color: Colors.orange,
      },
    ];
  };

  const additionalStats = getAdditionalStats();

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

        {/* Additional Stats Grid */}
        <View style={styles.additionalStatsSection}>
          <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fontBold }]}>
            📊 Detailed Statistics
          </Text>
          <View style={styles.additionalStatsGrid}>
            {additionalStats.map((stat, index) => (
              <View
                key={index}
                style={[
                  styles.additionalStatCard,
                  {
                    backgroundColor: C.surface,
                    borderLeftWidth: 3,
                    borderLeftColor: stat.color,
                  },
                ]}
              >
                <MaterialCommunityIcons name={stat.icon} size={24} color={stat.color} style={styles.additionalStatIcon} />
                <View style={styles.additionalStatContent}>
                  <Text style={[styles.additionalStatValue, { color: C.text, fontFamily: fontBold }]}>
                    {stat.value}
                    {stat.subtitle && (
                      <Text style={[styles.additionalStatSubtitle, { color: C.textSecondary, fontFamily: fontRegular }]}>
                        {" "}{stat.subtitle}
                      </Text>
                    )}
                  </Text>
                  <Text style={[styles.additionalStatLabel, { color: C.textSecondary, fontFamily: fontRegular }]}>
                    {stat.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Activity Bar Chart */}
        {weeklyActivity.length > 0 && weeklyActivity.some(d => d.count > 0) && (
          <ChartCard title={t(language, "dashboard.weeklyActivity")} C={C} fontSemibold={fontSemibold}>
            <View style={{ paddingHorizontal: 0 }}>
              <VictoryChart
                theme={VictoryTheme.material}
                height={200}
                padding={{ left: 40, right: 15, top: 10, bottom: 35 }}
                domainPadding={{ x: 20 }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: C.border, strokeWidth: 1 },
                    tickLabels: {
                      fill: C.textSecondary,
                      fontSize: 11,
                      fontFamily: fontRegular,
                      padding: 5,
                    },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: {
                      fill: C.textSecondary,
                      fontSize: 11,
                      fontFamily: fontRegular,
                    },
                    grid: { stroke: C.border, strokeWidth: 1, strokeDasharray: "3,3", opacity: 0.2 },
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
                    },
                  }}
                  cornerRadius={{ top: 8, bottom: 0 }}
                  barWidth={32}
                  animate={{
                    duration: 800,
                    onLoad: { duration: 800 },
                  }}
                />
              </VictoryChart>
            </View>
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
                <View style={[styles.workoutDot, { backgroundColor: C.primary }]} />
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
                <View style={styles.workoutXp}>
                  <Text
                    style={[
                      styles.workoutXpText,
                      { color: Colors.gold, fontFamily: fontBold },
                    ]}
                  >
                    +{workout.xp} XP
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
          borderTopWidth: 3,
          borderTopColor: color,
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
      <MaterialCommunityIcons name={icon} size={32} color={color} style={styles.statIcon} />
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
  statIcon: {
    marginBottom: Spacing.sm,
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
  additionalStatsSection: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  additionalStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  additionalStatCard: {
    width: "31.5%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  additionalStatIcon: {
    marginBottom: 2,
  },
  additionalStatContent: {
    alignItems: "center",
    gap: 2,
  },
  additionalStatValue: {
    fontSize: FontSize.xl,
    textAlign: "center",
  },
  additionalStatSubtitle: {
    fontSize: FontSize.sm,
  },
  additionalStatLabel: {
    fontSize: FontSize.xs,
    textAlign: "center",
    lineHeight: 16,
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
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  workoutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    alignItems: "flex-end",
  },
  workoutXpText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
