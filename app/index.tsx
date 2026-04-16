import { CardioGrid } from "@/components/CardioGrid";
import { DefaultAvatar } from "@/components/DefaultAvatar";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";
import {
  getMilestoneBonusXP,
  MilestoneModal,
} from "@/components/MilestoneModal";
import { MuscleGroupGrid } from "@/components/MuscleGroupGrid";
import { StatsPanel } from "@/components/StatsPanel";
import { Toast } from "@/components/Toast";
import { TopBar } from "@/components/TopBar";
import { XPBar } from "@/components/XPBar";
import {
  calculateCardioXP,
  calculateXP,
  CardioType,
  EXERCISES,
  MuscleGroup,
} from "@/constants/exercises";
import { getFont } from "@/constants/fonts";
import {
  BorderRadius,
  Colors,
  FontSize,
  Spacing,
} from "@/constants/theme-colors";
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
  calculateStreakPenalty,
  updateStatsForWorkout,
  updateStreak,
} from "@/utils/workoutHelpers";
import { calculateBonuses, processWorkout } from "@/utils/workoutProcessor";
import {
  calculateStatBonus,
  getRequiredXP,
  safeNumber,
} from "@/utils/xpCalculations";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  // Custom hooks
  const router = useRouter();
  const { language } = useApp();
  const { user } = useAuth();
  const C = useColors();
  const isRTL = language === "ar";
  const fontRegular = getFont(language, "regular");
  const fontSemibold = getFont(language, "semibold");
  const fontBold = getFont(language, "bold");
  const fontBlack = getFont(language, "black");
  const gameState = useGameStateWithDB();
  const diminishingReturns = useDiminishingReturns();
  const { playXPSound, playLevelUpSound } = useSound();
  const { FloatingXPComponent, showFloatingXP } = useFloatingXP();
  const [refreshing, setRefreshing] = React.useState(false);
  const [headerImageError, setHeaderImageError] = React.useState(false);
  const [stretchingDone, setStretchingDone] = React.useState(false);
  const stretchingBonusGiven = React.useRef(false);
  const [toastVisible, setToastVisible] = React.useState(false);
  const [milestoneVisible, setMilestoneVisible] = React.useState(false);
  const [milestoneLevel, setMilestoneLevel] = React.useState(0);
  const [levelUpVisible, setLevelUpVisible] = React.useState(false);
  const [newLevel, setNewLevel] = React.useState(0);
  const penaltyApplied = React.useRef(false);

  // Re-fetch game state when screen regains focus (e.g. after profile reset)
  useFocusEffect(
    React.useCallback(() => {
      gameState.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.refetch]),
  );

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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Simply reload the component will re-fetch from database
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLogWorkout = (muscleGroup: MuscleGroup) => {
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

    console.log("[Solo] Workout:", { muscleGroup, level, xp });

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
    gameState.batchUpdate({
      level: result.newLevel,
      xp: finalXp,
      skillPoints: result.newSkillPoints,
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

    // Update streak
    updateStreak({
      lastWorkoutDate: gameState.lastWorkoutDate,
      currentStreak,
      setCurrentStreak: gameState.setCurrentStreak,
      setLastWorkoutDate: gameState.setLastWorkoutDate,
    });

    // Update stats
    updateStatsForWorkout({
      muscleGroup,
      setStrength: gameState.setStrength,
      setEndurance: gameState.setEndurance,
      setDiscipline: gameState.setDiscipline,
    });

    // Show feedback
    showFloatingXP(sessionXP, [...messages, ...result.messages]);
  };

  const handleCardioWorkout = (cardioType: CardioType) => {
    const {
      level,
      xp,
      endurance,
      discipline,
      currentStreak,
      dailyBonusClaimed,
      sessionCount,
      setDailyBonusClaimed,
      setSessionCount,
    } = gameState;

    console.log("[Solo] Cardio:", { cardioType, level, xp });

    // Reset diminishing returns for cardio
    diminishingReturns.reset();

    // Calculate cardio XP
    const baseXP = calculateCardioXP(30);
    const statBonus = calculateStatBonus(endurance);
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

    // Process workout
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

    // Check for milestone bonus XP
    let finalXp = result.newXp;
    if (result.milestoneReached && result.milestoneLevel) {
      const bonusXP = getMilestoneBonusXP(result.milestoneLevel);
      finalXp += bonusXP;
    }

    // Batch update: single DB write with all values
    gameState.batchUpdate({
      level: result.newLevel,
      xp: finalXp,
      skillPoints: result.newSkillPoints,
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

    // Update streak and stats
    updateStreak({
      lastWorkoutDate: gameState.lastWorkoutDate,
      currentStreak,
      setCurrentStreak: gameState.setCurrentStreak,
      setLastWorkoutDate: gameState.setLastWorkoutDate,
    });

    updateStatsForWorkout({
      muscleGroup: "cardio",
      setStrength: gameState.setStrength,
      setEndurance: gameState.setEndurance,
      setDiscipline: gameState.setDiscipline,
    });

    showFloatingXP(sessionXP, [...messages, ...result.messages]);
  };

  const safeXP = safeNumber(gameState.xp, 0, 0);
  const safeLevel = safeNumber(gameState.level, 1, 1);
  const safeRequiredXP = getRequiredXP(safeLevel);

  const muscleGroups: MuscleGroup[] = [
    "chest",
    "abs",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "legs",
  ];

  const muscleLabels: Record<MuscleGroup, string> = {
    chest: t(language, "muscles.chest"),
    back: t(language, "muscles.back"),
    legs: t(language, "muscles.legs"),
    shoulders: t(language, "muscles.shoulders"),
    biceps: t(language, "muscles.biceps"),
    triceps: t(language, "muscles.triceps"),
    abs: t(language, "muscles.abs"),
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: C.background }]}>
        {/* Sticky Header */}
        <View style={[styles.stickyHeader, { backgroundColor: C.background }]}>
          <TopBar />
        </View>

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
                <DefaultAvatar size={70} gender={user?.user_metadata?.gender} />
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

            {/* Progress Section */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <XPBar
                xp={safeXP}
                level={safeLevel}
                requiredXP={safeRequiredXP}
                streak={gameState.currentStreak}
              />
              <FloatingXPComponent />
            </View>

            {/* Stats Section */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <StatsPanel
                strength={gameState.strength}
                endurance={gameState.endurance}
                discipline={gameState.discipline}
                skillPoints={gameState.skillPoints}
                onUpgradeStrength={gameState.upgradeStrength}
                onUpgradeEndurance={gameState.upgradeEndurance}
                onUpgradeDiscipline={gameState.upgradeDiscipline}
              />
            </View>

            {/* Muscle Groups Section */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <MuscleGroupGrid
                muscleGroups={muscleGroups}
                onPress={handleLogWorkout}
                labels={muscleLabels}
              />
            </View>

            {/* Cardio Section */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <CardioGrid onPress={handleCardioWorkout} />
            </View>

            {/* Stretching Checkbox */}
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
                    // Remove stretching XP when unchecked
                    stretchingBonusGiven.current = false;
                    gameState.setXp((prev) =>
                      Math.max(0, prev - STRETCHING_XP),
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
          </View>
        </ScrollView>
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
  stickyHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "web" ? Spacing.md : 50,
    paddingBottom: Spacing.md,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },
  section: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: Spacing.lg,
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
