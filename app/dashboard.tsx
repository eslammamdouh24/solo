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
    StyleSheet,
    Text,
    View
} from "react-native";
import {
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictoryLine,
    VictoryPie,
    VictoryTheme,
} from "victory";
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
  const [chartAnims] = useState(() =>
    Array.from({ length: 4 }, () => new Animated.Value(0)),
  );

  const loadData = async () => {
    if (!user) return;

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

      // Stagger chart animations
      chartAnims.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: 200 + index * 150,
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
      <View
        style={[styles.loadingContainer, { backgroundColor: C.background }]}
      >
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const StatCard = ({
    icon,
    label,
    value,
    color,
    index,
  }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
    index: number;
  }) => {
    const anim = cardAnims[index];
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
        <View
          style={[styles.statIconContainer, { backgroundColor: color + "20" }]}
        >
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text
          style={[styles.statValue, { color: C.text, fontFamily: fontBold }]}
        >
          {value}
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

  const ChartCard = ({
    title,
    children,
    index,
  }: {
    title: string;
    children: React.ReactNode;
    index: number;
  }) => {
    const anim = chartAnims[index];
    return (
      <Animated.View
        style={[
          styles.chartCard,
          {
            backgroundColor: C.surface,
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text
          style={[
            styles.chartTitle,
            { color: C.text, fontFamily: fontSemibold },
          ]}
        >
          {title}
        </Text>
        {children}
      </Animated.View>
    );
  };

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

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <TopBar
        title={t(language, "dashboard.title")}
        showBack
        onBackPress={() => router.back()}
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
      >
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="dumbbell"
            label={t(language, "dashboard.totalWorkouts")}
            value={stats.totalWorkouts}
            color={C.primary}
            index={0}
          />
          <StatCard
            icon="fire"
            label={t(language, "dashboard.currentStreak")}
            value={`${stats.currentStreak} ${t(language, "dashboard.days")}`}
            color={Colors.orange}
            index={1}
          />
          <StatCard
            icon="star"
            label={t(language, "dashboard.totalXP")}
            value={stats.totalXP.toLocaleString()}
            color={Colors.gold}
            index={2}
          />
          <StatCard
            icon="clock-outline"
            label={t(language, "dashboard.totalTime")}
            value={formatDuration(stats.totalDuration)}
            color={Colors.blue}
            index={3}
          />
        </View>

        {/* Weekly Activity Bar Chart */}
        {weeklyActivity.length > 0 && (
          <ChartCard title={t(language, "dashboard.weeklyActivity")} index={0}>
            <VictoryChart
              theme={VictoryTheme.material}
              height={200}
              padding={{ left: 40, right: 20, top: 20, bottom: 40 }}
              domainPadding={{ x: 20 }}
            >
              <VictoryAxis
                style={{
                  axis: { stroke: C.border },
                  tickLabels: {
                    fill: C.textSecondary,
                    fontSize: 10,
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
                    fontSize: 10,
                    fontFamily: fontRegular,
                  },
                  grid: { stroke: C.border, strokeDasharray: "4,4" },
                }}
              />
              <VictoryBar
                data={weeklyActivity}
                x="day"
                y="count"
                style={{
                  data: { fill: C.primary },
                }}
                cornerRadius={{ top: 4 }}
                animate={{
                  duration: 1000,
                  onLoad: { duration: 1000 },
                }}
              />
            </VictoryChart>
          </ChartCard>
        )}

        {/* XP Progress Line Chart */}
        {xpProgress.length > 0 && (
          <ChartCard title={t(language, "dashboard.xpProgress")} index={1}>
            <VictoryChart
              theme={VictoryTheme.material}
              height={200}
              padding={{ left: 50, right: 20, top: 20, bottom: 40 }}
            >
              <VictoryAxis
                style={{
                  axis: { stroke: C.border },
                  tickLabels: {
                    fill: C.textSecondary,
                    fontSize: 9,
                    fontFamily: fontRegular,
                    angle: -45,
                    textAnchor: "end",
                  },
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: C.border },
                  tickLabels: {
                    fill: C.textSecondary,
                    fontSize: 10,
                    fontFamily: fontRegular,
                  },
                  grid: { stroke: C.border, strokeDasharray: "4,4" },
                }}
              />
              <VictoryLine
                data={xpProgress}
                x="date"
                y="cumulativeXp"
                style={{
                  data: { stroke: Colors.gold, strokeWidth: 3 },
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
        {muscleDistribution.length > 0 && (
          <ChartCard
            title={t(language, "dashboard.muscleDistribution")}
            index={2}
          >
            <View style={styles.pieChartContainer}>
              <VictoryPie
                data={muscleDistribution}
                x="muscle"
                y="count"
                colorScale={muscleColors}
                height={220}
                padding={{ left: 20, right: 20, top: 20, bottom: 20 }}
                style={{
                  labels: {
                    fontSize: 11,
                    fontFamily: fontSemibold,
                    fill: C.text,
                  },
                }}
                labelRadius={70}
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
                      { color: C.text, fontFamily: fontRegular },
                    ]}
                  >
                    {item.muscle} ({item.percentage}%)
                  </Text>
                </View>
              ))}
            </View>
          </ChartCard>
        )}

        {/* Equipment Usage */}
        {equipmentUsage.length > 0 && (
          <ChartCard title={t(language, "dashboard.equipmentUsage")} index={3}>
            <View style={styles.equipmentList}>
              {equipmentUsage.map((item, index) => (
                <Animated.View
                  key={item.equipment}
                  style={[
                    styles.equipmentItem,
                    {
                      opacity: chartAnims[3],
                      transform: [
                        {
                          translateX: chartAnims[3].interpolate({
                            inputRange: [0, 1],
                            outputRange: [isRTL ? 50 : -50, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.equipmentInfo}>
                    <Text
                      style={[
                        styles.equipmentName,
                        { color: C.text, fontFamily: fontSemibold },
                      ]}
                    >
                      {item.equipment}
                    </Text>
                    <Text
                      style={[
                        styles.equipmentCount,
                        { color: C.textSecondary, fontFamily: fontRegular },
                      ]}
                    >
                      {item.count} {t(language, "dashboard.workouts")}
                    </Text>
                  </View>
                  <View style={styles.equipmentBarContainer}>
                    <Animated.View
                      style={[
                        styles.equipmentBar,
                        {
                          backgroundColor: C.primary,
                          width: chartAnims[3].interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", `${item.percentage}%`],
                          }),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.equipmentPercentage,
                        { color: C.text, fontFamily: fontSemibold },
                      ]}
                    >
                      {item.percentage}%
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </ChartCard>
        )}

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: C.surface, marginBottom: Spacing.lg },
            ]}
          >
            <Text
              style={[
                styles.chartTitle,
                { color: C.text, fontFamily: fontSemibold },
              ]}
            >
              {t(language, "dashboard.recentWorkouts")}
            </Text>
            {recentWorkouts.map((workout, index) => (
              <Animated.View
                key={workout.id}
                style={[
                  styles.workoutItem,
                  {
                    borderBottomColor: C.border,
                    opacity: chartAnims[3],
                    transform: [
                      {
                        translateY: chartAnims[3].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
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
                  <Text
                    style={[
                      styles.workoutMuscle,
                      { color: C.textSecondary, fontFamily: fontRegular },
                    ]}
                  >
                    {workout.muscle_group} •{" "}
                    {formatDuration(workout.duration_seconds)}
                  </Text>
                </View>
                <View style={styles.workoutXp}>
                  <MaterialCommunityIcons
                    name="star"
                    size={16}
                    color={Colors.gold}
                  />
                  <Text
                    style={[
                      styles.workoutXpText,
                      { color: Colors.gold, fontFamily: fontBold },
                    ]}
                  >
                    {workout.xp}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.sm,
    textAlign: "center",
  },
  chartCard: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: FontSize.lg,
    marginBottom: Spacing.md,
  },
  pieChartContainer: {
    alignItems: "center",
  },
  legendContainer: {
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  legendText: {
    fontSize: FontSize.sm,
  },
  equipmentList: {
    gap: Spacing.md,
  },
  equipmentItem: {
    gap: Spacing.xs,
  },
  equipmentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  equipmentName: {
    fontSize: FontSize.md,
  },
  equipmentCount: {
    fontSize: FontSize.sm,
  },
  equipmentBarContainer: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  equipmentBar: {
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
  equipmentPercentage: {
    position: "absolute",
    right: Spacing.xs,
    top: -18,
    fontSize: FontSize.xs,
  },
  workoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: FontSize.md,
    marginBottom: Spacing.xs,
  },
  workoutMuscle: {
    fontSize: FontSize.sm,
  },
  workoutXp: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  workoutXpText: {
    fontSize: FontSize.md,
  },
});
