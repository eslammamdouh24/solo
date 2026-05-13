import { AnimatedEntry } from "@/components/AnimatedEntry";
import { DefaultAvatar } from "@/components/DefaultAvatar";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";
import { MilestoneModal } from "@/components/MilestoneModal";
import { MuscleGroupGrid } from "@/components/MuscleGroupGrid";
import { Skeleton } from "@/components/Skeleton";
import { StatsPanel } from "@/components/StatsPanel";
import { Toast } from "@/components/Toast";
import { TopBar } from "@/components/TopBar";
import { XPBar } from "@/components/XPBar";
import { Colors } from "@/constants/colors";
import { calculateXP, EXERCISES, MuscleGroup } from "@/constants/exercises";
import { FontSize } from "@/constants/font-size";
import { getFont } from "@/constants/fonts";
import { getMilestoneBonusXP } from "@/constants/milestones";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useFloatingXP } from "@/hooks/useFloatingXP";
import {
    useDiminishingReturns,
    useGameStateWithDB,
} from "@/hooks/useGameStateWithDB";
import { useSound } from "@/hooks/useSound";
import {
    calculateNewStreak,
    calculateStreakPenalty,
    getStatGains,
    updateStatsForWorkout,
} from "@/utils/workoutHelpers";
import { calculateBonuses, processWorkout } from "@/utils/workoutProcessor";
import {
    calculateStatBonus,
    getRequiredXP,
    getToday,
    safeNumber,
} from "@/utils/xpCalculations";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
    useCallback,
    useMemo
} from "react";
import {
    Image,
    LayoutAnimation,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  // Custom hooks
  const router = useRouter();
  const params = useLocalSearchParams();
  const { language, workoutSession, clearWorkoutSession } = useApp();
  const { user } = useAuth();
  const C = useColors();
  const isRTL = language === "ar";
  const fontRegular = getFont(language, "regular");
  const fontSemibold = getFont(language, "semibold");
  const fontBold = getFont(language, "bold");
  const fontBlack = getFont(language, "black");
  const gameState = useGameStateWithDB();

  // Profile data is now synced only when user updates their profile
  // This prevents duplicate API calls on mount/refresh
  const diminishingReturns = useDiminishingReturns();
  const { playXPSound, playLevelUpSound } = useSound();
  const { FloatingXPComponent, showFloatingXP, clearQueue } = useFloatingXP();
  const [refreshing, setRefreshing] = React.useState(false);
  const [headerImageError, setHeaderImageError] = React.useState(false);
  const [stretchingDone, setStretchingDone] = React.useState(false);
  const stretchingBonusGiven = React.useRef(false);
  const [statsCollapsed, setStatsCollapsed] = React.useState(false);
  const [musclesCollapsed, setMusclesCollapsed] = React.useState(false);
  const [toastVisible, setToastVisible] = React.useState(false);
  const [milestoneVisible, setMilestoneVisible] = React.useState(false);
  const [milestoneLevel, setMilestoneLevel] = React.useState(0);
  const [levelUpVisible, setLevelUpVisible] = React.useState(false);
  const [newLevel, setNewLevel] = React.useState(0);
  const penaltyApplied = React.useRef(false);
  const sessionAnimationShown = React.useRef(false);

  // No useFocusEffect refetch: the shared cache in lib/stateApi + the hook's
  // in-memory cache already serve cached data instantly. Mutations that change
  // game state (workout log, profile reset, admin actions) explicitly call
  // invalidateGameState / refetch, so focus-based refetching is redundant.

  // Show toast when there's a database error
  React.useEffect(() => {
    if (gameState.error) {
      setToastVisible(true);
    }
  }, [gameState.error]);

  // Check for inactivity penalty on mount and when lastWorkoutDate changes
  React.useEffect(() => {
    if (gameState.loading || penaltyApplied.current) return;

    const penalty = calculateStreakPenalty(
      gameState.lastWorkoutDate,
      gameState.xp,
      gameState.level,
    );

    if (penalty.shouldApplyPenalty && penalty.xpLost > 0) {
      const newXP = Math.max(0, gameState.xp - penalty.xpLost);
      gameState.setXp(newXP);
      penaltyApplied.current = true;

      // Show warning message
      showFloatingXP(-penalty.xpLost, [
        t(language, "penalty.daysInactive", { days: penalty.daysInactive }),
        t(language, "penalty.xpLost", { xp: penalty.xpLost }),
        t(language, "penalty.getBack"),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.lastWorkoutDate, gameState.loading]);

  // Show accumulated XP animations when returning to home after workout session
  React.useEffect(() => {
    if (
      workoutSession.length > 0 &&
      !sessionAnimationShown.current &&
      !gameState.loading
    ) {
      sessionAnimationShown.current = true;

      // Calculate total XP and check for level ups
      const totalXP = workoutSession.reduce((sum, w) => sum + w.earnedXP, 0);
      const didLevelUp = workoutSession.some((w) => w.leveledUp);
      const finalLevel = workoutSession.reduce(
        (max, w) => (w.leveledUp && w.newLevel > max ? w.newLevel : max),
        0,
      );

      // Small delay to let screen settle
      setTimeout(() => {
        playXPSound();

        // Show floating XP with number of workouts completed
        const workoutCount = workoutSession.length;
        const workoutText =
          workoutCount === 1
            ? language === "ar"
              ? "تمرين واحد"
              : "1 workout"
            : `${workoutCount} ${t(language, "dashboard.workouts")}`;

        showFloatingXP(totalXP, [
          t(language, "exerciseDetail.completed"),
          workoutText,
          `+${totalXP} XP`,
        ]);

        // Show level up celebration if leveled up
        if (didLevelUp && finalLevel > 0) {
          setTimeout(() => {
            playLevelUpSound();
            setNewLevel(finalLevel);
            setLevelUpVisible(true);
          }, 1500); // Show after XP animation
        }

        // Clear workout session after showing animations
        clearWorkoutSession();

        // Reset flag for next session
        setTimeout(() => {
          sessionAnimationShown.current = false;
        }, 3000);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutSession.length, gameState.loading]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await gameState.refetch();
    setRefreshing(false);
  }, [gameState.refetch]);

  const handleLogWorkout = useCallback(
    (muscleGroup: MuscleGroup) => {
      const {
        level,
        xp,
        strength,
        discipline,
        currentStreak,
        dailyBonusClaimed,
        sessionCount,
        setDailyBonusClaimed,
        setSessionCount,
      } = gameState;

      // Calculate base XP with diminishing returns
      const dimMultiplier = diminishingReturns.calculateMultiplier(muscleGroup);
      const exercises = EXERCISES[muscleGroup];
      let baseXP = exercises.reduce((acc) => acc + calculateXP(60, 10, 3), 0);
      baseXP = Math.floor(baseXP * dimMultiplier);

      // Calculate bonuses
      const statBonus = calculateStatBonus(strength);
      const { xp: sessionXP, messages } = calculateBonuses({
        baseXP,
        currentStreak,
        statBonus,
        discipline,
        dailyBonusClaimed,
        sessionCount,
        setDailyBonusClaimed,
        setSessionCount,
        language,
      });

      // Process workout results
      const result = processWorkout({
        sessionXP,
        currentState: {
          xp,
          level,
          skillPoints: gameState.skillPoints,
          discipline,
          currentStreak,
          dailyBonusClaimed,
        },
        setDailyBonusClaimed,
      });

      // Check for milestone bonus XP and add it to the result
      let finalXp = result.newXp;
      if (result.milestoneReached && result.milestoneLevel) {
        const bonusXP = getMilestoneBonusXP(result.milestoneLevel);
        finalXp += bonusXP;
      }

      // Batch update: single DB write with all values
      const statGains = getStatGains(muscleGroup);
      const newStreak = calculateNewStreak(
        gameState.lastWorkoutDate,
        currentStreak,
      );
      const today = getToday();

      gameState.batchUpdate({
        level: result.newLevel,
        xp: finalXp,
        skillPoints: result.newSkillPoints,
        strength: gameState.strength + statGains.strength,
        endurance: gameState.endurance + statGains.endurance,
        discipline: discipline + statGains.discipline,
        currentStreak: newStreak,
        lastWorkoutDate: today,
      });

      if (result.newLevel > level) {
        playLevelUpSound();
        // Show level-up celebration
        setNewLevel(result.newLevel);
        setLevelUpVisible(true);
      } else if (sessionXP > 0) {
        playXPSound();
      }

      // Check for milestone
      if (result.milestoneReached && result.milestoneLevel) {
        setMilestoneLevel(result.milestoneLevel);
        setMilestoneVisible(true);
      }

      // Show feedback
      showFloatingXP(sessionXP, [...messages, ...result.messages]);
    },
    [
      gameState,
      diminishingReturns,
      playXPSound,
      playLevelUpSound,
      showFloatingXP,
      language,
    ],
  );

  const safeXP = safeNumber(gameState.xp, 0, 0);
  const safeLevel = safeNumber(gameState.level, 1, 1);
  const safeRequiredXP = getRequiredXP(safeLevel);

  const muscleGroups = useMemo<MuscleGroup[]>(
    () => [
      "chest",
      "waist_core",
      "back",
      "shoulders",
      "upper_legs",
      "lower_legs",
      "biceps",
      "triceps",
      "lower_arms",
      "cardio",
    ],
    [],
  );

  const muscleLabels = useMemo<Record<MuscleGroup, string>>(
    () => ({
      chest: t(language, "muscles.chest"),
      back: t(language, "muscles.back"),
      upper_legs: t(language, "muscles.upper_legs"),
      lower_legs: t(language, "muscles.lower_legs"),
      shoulders: t(language, "muscles.shoulders"),
      biceps: t(language, "muscles.biceps"),
      triceps: t(language, "muscles.triceps"),
      waist_core: t(language, "muscles.waist_core"),
      lower_arms: t(language, "muscles.lower_arms"),
      cardio: t(language, "muscles.cardio"),
    }),
    [language],
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <TopBar />

        {gameState.loading ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.main}>
              {/* Profile card skeleton */}
              <View
                style={[
                  styles.profileCard,
                  { backgroundColor: C.surface, alignItems: "center" },
                ]}
              >
                <Skeleton width={70} height={70} borderRadius={35} />
                <Skeleton width={140} height={24} borderRadius={8} />
              </View>

              {/* XP bar skeleton */}
              <View style={[styles.section, { backgroundColor: C.surface }]}>
                <View style={{ gap: 8, paddingVertical: Spacing.md }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Skeleton width={80} height={18} borderRadius={6} />
                    <Skeleton width={60} height={18} borderRadius={6} />
                  </View>
                  <Skeleton height={32} borderRadius={16} />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Skeleton width={50} height={14} borderRadius={6} />
                    <Skeleton width={50} height={14} borderRadius={6} />
                  </View>
                </View>
              </View>

              {/* Stats panel skeleton - 3 stat cards */}
              <View style={[styles.section, { backgroundColor: C.surface }]}>
                <Skeleton width={120} height={20} borderRadius={8} />
                <View
                  style={{
                    flexDirection: "row",
                    gap: Spacing.md,
                    marginTop: Spacing.md,
                  }}
                >
                  <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton height={60} borderRadius={12} />
                  </View>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton height={60} borderRadius={12} />
                  </View>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton height={60} borderRadius={12} />
                  </View>
                </View>
                <Skeleton
                  height={50}
                  borderRadius={12}
                  style={{ marginTop: Spacing.md }}
                />
              </View>

              {/* Muscle grid skeleton - 2 columns */}
              <View style={[styles.section, { backgroundColor: C.surface }]}>
                <Skeleton width={180} height={20} borderRadius={8} />
                <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
                  {[0, 1, 2, 3, 4].map((row) => (
                    <View
                      key={row}
                      style={{ flexDirection: "row", gap: Spacing.sm }}
                    >
                      <Skeleton flex={1} height={75} borderRadius={12} />
                      <Skeleton flex={1} height={75} borderRadius={12} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Stretching skeleton */}
              <View style={[styles.section, { backgroundColor: C.surface }]}>
                <Skeleton height={60} borderRadius={12} />
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            }
          >
            <View style={styles.main}>
              {/* Profile Card */}
              <AnimatedEntry index={0}>
                <Pressable
                  style={({ pressed }) => [
                    styles.profileCard,
                    {
                      backgroundColor: C.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => router.push("/profile")}
                >
                  {user?.user_metadata?.profile_image && !headerImageError ? (
                    <Image
                      source={{ uri: user.user_metadata.profile_image }}
                      style={[styles.profileAvatar, { borderColor: C.primary }]}
                      onError={() => setHeaderImageError(true)}
                    />
                  ) : (
                    <DefaultAvatar
                      size={70}
                      gender={user?.user_metadata?.gender}
                    />
                  )}
                  <Text
                    style={[
                      styles.profileName,
                      { color: C.text, fontFamily: fontBlack },
                    ]}
                  >
                    {user?.user_metadata?.username ||
                      user?.email?.split("@")[0] ||
                      ""}
                  </Text>
                </Pressable>
              </AnimatedEntry>

              {/* Progress Section */}
              <AnimatedEntry index={1}>
                <View style={[styles.section, { backgroundColor: C.surface }]}>
                  <XPBar
                    xp={safeXP}
                    level={safeLevel}
                    requiredXP={safeRequiredXP}
                    streak={gameState.currentStreak}
                  />
                  <FloatingXPComponent />
                </View>
              </AnimatedEntry>

              {/* Stats Section */}
              <AnimatedEntry index={2}>
                <View style={[styles.section, { backgroundColor: C.surface }]}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      LayoutAnimation.configureNext({
                        duration: 300,
                        update: {
                          type: LayoutAnimation.Types.easeInEaseOut,
                          property: LayoutAnimation.Properties.scaleY,
                        },
                        delete: {
                          type: LayoutAnimation.Types.easeInEaseOut,
                          property: LayoutAnimation.Properties.opacity,
                        },
                      });
                      setStatsCollapsed(!statsCollapsed);
                    }}
                    style={[
                      styles.collapsibleHeader,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <View
                      style={[
                        styles.collapsibleTitleRow,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.collapsibleTitle,
                          { color: C.text, fontFamily: fontBold },
                        ]}
                      >
                        {t(language, "stats.title")}
                      </Text>
                      {gameState.skillPoints > 0 && (
                        <View
                          style={[
                            styles.skillPointsBadgeSmall,
                            { backgroundColor: C.level },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="star"
                            size={12}
                            color="#FFF"
                          />
                          <Text style={styles.skillPointsTextSmall}>
                            {gameState.skillPoints}
                          </Text>
                        </View>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name={statsCollapsed ? "chevron-down" : "chevron-up"}
                      size={24}
                      color={C.textSecondary}
                    />
                  </TouchableOpacity>
                  {!statsCollapsed && (
                    <View style={{ marginTop: Spacing.md }}>
                      <StatsPanel
                        strength={gameState.strength}
                        endurance={gameState.endurance}
                        discipline={gameState.discipline}
                        skillPoints={gameState.skillPoints}
                        onUpgradeStrength={gameState.upgradeStrength}
                        onUpgradeEndurance={gameState.upgradeEndurance}
                        onUpgradeDiscipline={gameState.upgradeDiscipline}
                        hideTitle={true}
                      />
                    </View>
                  )}
                </View>
              </AnimatedEntry>

              {/* Muscle Groups Section (includes cardio) */}
              <AnimatedEntry index={3}>
                <View style={[styles.section, { backgroundColor: C.surface }]}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      LayoutAnimation.configureNext({
                        duration: 300,
                        update: {
                          type: LayoutAnimation.Types.easeInEaseOut,
                          property: LayoutAnimation.Properties.scaleY,
                        },
                        delete: {
                          type: LayoutAnimation.Types.easeInEaseOut,
                          property: LayoutAnimation.Properties.opacity,
                        },
                      });
                      setMusclesCollapsed(!musclesCollapsed);
                    }}
                    style={[
                      styles.collapsibleHeader,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.collapsibleTitle,
                        { color: C.text, fontFamily: fontBold },
                      ]}
                    >
                      {t(language, "home.muscleGroups")}
                    </Text>
                    <MaterialCommunityIcons
                      name={musclesCollapsed ? "chevron-down" : "chevron-up"}
                      size={24}
                      color={C.textSecondary}
                    />
                  </TouchableOpacity>
                  {!musclesCollapsed && (
                    <View style={{ marginTop: Spacing.md }}>
                      <MuscleGroupGrid
                        muscleGroups={muscleGroups}
                        onPress={(group) =>
                          router.push({
                            pathname: "/exercise-list",
                            params: { muscle: group },
                          })
                        }
                        labels={muscleLabels}
                        hideTitle={true}
                      />
                    </View>
                  )}
                </View>
              </AnimatedEntry>

              {/* Stretching Checkbox */}
              <AnimatedEntry index={4}>
                <View style={[styles.section, { backgroundColor: C.surface }]}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: C.textSecondary, fontFamily: fontBold },
                    ]}
                  >
                    {t(language, "home.stretching")}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.stretchingContainer,
                      {
                        backgroundColor: C.surfaceHighlight,
                        borderColor: C.surface,
                        flexDirection: isRTL ? "row-reverse" : "row",
                      },
                    ]}
                    onPress={() => {
                      // Clear any pending XP animations to prevent queue buildup
                      clearQueue();

                      const newState = !stretchingDone;
                      setStretchingDone(newState);

                      const STRETCHING_XP = 50;

                      if (newState) {
                        // Grant stretching XP + stats
                        stretchingBonusGiven.current = true;
                        gameState.setXp((prev) => prev + STRETCHING_XP);
                        updateStatsForWorkout({
                          muscleGroup: "stretching",
                          setStrength: gameState.setStrength,
                          setEndurance: gameState.setEndurance,
                          setDiscipline: gameState.setDiscipline,
                        });
                        playXPSound();
                        showFloatingXP(STRETCHING_XP, [
                          t(language, "home.stretchingComplete"),
                        ]);
                      } else {
                        // Remove stretching XP + stats when unchecked
                        stretchingBonusGiven.current = false;
                        gameState.setXp((prev) =>
                          Math.max(0, prev - STRETCHING_XP),
                        );
                        // Remove stats (stretching gives +1 endurance, +1 discipline)
                        gameState.setEndurance((prev) => Math.max(0, prev - 1));
                        gameState.setDiscipline((prev) =>
                          Math.max(0, prev - 1),
                        );
                        showFloatingXP(-STRETCHING_XP, [
                          t(language, "home.stretchingRemoved"),
                        ]);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.stretchingCheckbox,
                        { borderColor: C.textSecondary },
                        stretchingDone && {
                          backgroundColor: C.success,
                          borderColor: C.success,
                        },
                      ]}
                    >
                      {stretchingDone && (
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color="#fff"
                        />
                      )}
                    </View>
                    <View style={styles.stretchingTextContainer}>
                      <Text
                        style={[
                          styles.stretchingTitle,
                          { color: C.text, fontFamily: fontSemibold },
                        ]}
                      >
                        {t(language, "home.stretchingSubtitle")}
                      </Text>
                      <Text
                        style={[
                          styles.stretchingSubtitle,
                          { color: C.textSecondary, fontFamily: fontRegular },
                        ]}
                      >
                        {t(language, "home.stretchingDuration")}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="meditation"
                      size={24}
                      color={stretchingDone ? C.success : C.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </AnimatedEntry>
            </View>
          </ScrollView>
        )}
      </View>

      <Toast
        message={gameState.error || t(language, "auth.errorOccurred")}
        type="error"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      <MilestoneModal
        visible={milestoneVisible}
        level={milestoneLevel}
        onClose={async () => {
          setMilestoneVisible(false);
          // Optional: Send SMS if user has phone number in profile
          // You can add phone number to user profile and send SMS here
          // Example: await sendMilestoneSMS(userPhone, milestoneLevel, title, prize);
        }}
      />

      <LevelUpCelebration
        visible={levelUpVisible}
        level={newLevel}
        onComplete={() => setLevelUpVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  main: {
    width: "100%",
    maxWidth: 420,
    gap: Spacing.xxl,
  },

  profileCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  profileName: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1.2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: Spacing.lg,
  },
  collapsibleHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    width: "100%",
  },
  collapsibleTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.sm,
  },
  collapsibleTitle: {
    fontSize: FontSize.base,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  skillPointsBadgeSmall: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  skillPointsTextSmall: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: "#FFF",
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  stretchingContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  stretchingCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  stretchingCheckboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stretchingTextContainer: { flex: 1 },
  stretchingTitle: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stretchingSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
