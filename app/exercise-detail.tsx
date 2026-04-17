import { CountdownTimer } from "@/components/CountdownTimer";
import { ExerciseCompletionCelebration } from "@/components/ExerciseCompletionCelebration";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";
import { TopBar } from "@/components/TopBar";
import { isRTL as checkRTL, Difficulty } from "@/constants/enums";
import { exerciseImages } from "@/constants/exerciseImages";
import { calculateXP } from "@/constants/exercises";
import { getFont } from "@/constants/fonts";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useGameStateWithDB } from "@/hooks/useGameStateWithDB";
import { useSound } from "@/hooks/useSound";
import { getExerciseById, MuscleGroup } from "@/lib/exerciseApi";
import { logWorkout } from "@/lib/workoutApi";
import { calculateNewStreak, getStatGains } from "@/utils/workoutHelpers";
import { processWorkout } from "@/utils/workoutProcessor";
import { getToday } from "@/utils/xpCalculations";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const ExerciseDetailScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const muscle = (params as { muscle?: string }).muscle as
    | MuscleGroup
    | undefined;
  const exerciseId = (params as { exerciseId?: string }).exerciseId;

  const { user } = useAuth();
  const { language } = useApp();
  const isRTL = checkRTL(language);
  const fontSemibold = getFont(language, "semibold");
  const fontBold = getFont(language, "bold");
  const gameState = useGameStateWithDB();
  const { playLevelUpSound } = useSound();

  const exercise = useMemo(() => {
    if (!muscle || !exerciseId) return null;
    return getExerciseById(muscle, exerciseId);
  }, [muscle, exerciseId]);

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [logged, setLogged] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [earnedXP, setEarnedXP] = useState<number | null>(null);
  const [performanceFeedback, setPerformanceFeedback] = useState<string>("");
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const C = useColors();

  const xpEstimate = useMemo(() => {
    if (!exercise) return 0;
    const difficultyWeight =
      exercise.difficulty === Difficulty.BEGINNER
        ? 35
        : exercise.difficulty === Difficulty.INTERMEDIATE
          ? 45
          : 55;
    return calculateXP(difficultyWeight, exercise.reps, exercise.sets);
  }, [exercise]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  if (!exercise) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: C.background }]}>
        <Text style={[styles.emptyText, { color: C.text }]}>
          {t(language, "exerciseDetail.exerciseNotFound")}
        </Text>
      </View>
    );
  }

  const formattedTime = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const handleLogExercise = async (xpValue?: number) => {
    const xpToLog = xpValue ?? earnedXP;
    if (!exercise || !user || xpToLog === null || xpToLog === 0 || logged)
      return false;

    try {
      const { error } = await logWorkout({
        user_id: user.id,
        muscle_group: muscle || "",
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        duration_seconds: seconds,
        sets: exercise.sets,
        reps: exercise.reps,
        xp: xpToLog,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
      });

      if (error) {
        throw error;
      }

      // Process XP through level system (handles level-up, skill points, milestones)
      const result = processWorkout({
        sessionXP: xpToLog,
        currentState: {
          xp: gameState.xp,
          level: gameState.level,
          skillPoints: gameState.skillPoints,
          discipline: gameState.discipline,
          currentStreak: gameState.currentStreak,
          dailyBonusClaimed: gameState.dailyBonusClaimed,
        },
        setDailyBonusClaimed: gameState.setDailyBonusClaimed,
      });

      // Calculate streak and stat gains
      const newStreak = calculateNewStreak(
        gameState.lastWorkoutDate,
        gameState.currentStreak,
      );
      const statGains = getStatGains(muscle || "");
      const today = getToday();

      // Batch update everything in one DB write
      gameState.batchUpdate({
        level: result.newLevel,
        xp: result.newXp,
        skillPoints: result.newSkillPoints,
        strength: gameState.strength + statGains.strength,
        endurance: gameState.endurance + statGains.endurance,
        discipline: gameState.discipline + statGains.discipline,
        currentStreak: newStreak,
        lastWorkoutDate: today,
        sessionCount: gameState.sessionCount + 1,
      });

      setLogged(true);

      // Check for level up
      if (result.newLevel > gameState.level) {
        setNewLevel(result.newLevel);
        setLevelUpVisible(true);
      }

      return true;
    } catch (error: any) {
      Alert.alert(
        t(language, "exerciseDetail.errorTitle"),
        error.message || t(language, "exerciseDetail.errorMessage"),
      );
      return false;
    }
  };

  const handleStart = () => {
    if (!running && !hasStarted) {
      // First time starting - show countdown
      setCountdownVisible(true);
    } else {
      // Resume or pause
      setRunning((prev) => !prev);
      if (finished) {
        setFinished(false);
        setEarnedXP(null);
      }
    }
  };

  const handleCountdownComplete = () => {
    setCountdownVisible(false);
    setHasStarted(true);
    setRunning(true);
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(0);
    setFinished(false);
    setEarnedXP(null);
    setPerformanceFeedback("");
    setHasStarted(false);
  };

  const handleFinish = async () => {
    setRunning(false);
    setFinished(true);

    // MINIMUM TIME GATE — industry-standard anti-cheat
    // Calculate minimum realistic time: ~1.5s per rep across all sets
    const totalReps = exercise.sets * exercise.reps;
    const minTime = Math.max(20, Math.floor(totalReps * 1.5));

    // Optimal zone: proper tempo + rest periods
    const TEMPO_BY_DIFFICULTY = {
      Beginner: { repTime: 2, rest: 45 },
      Intermediate: { repTime: 3, rest: 60 },
      Advanced: { repTime: 4, rest: 90 },
    };
    const { repTime, rest } = TEMPO_BY_DIFFICULTY[exercise.difficulty];
    const workTime = totalReps * repTime;
    const totalRest = (exercise.sets - 1) * rest;
    const optimalLow = Math.floor((workTime + totalRest) * 0.8);
    const optimalHigh = Math.floor((workTime + totalRest) * 1.2);

    let earned = 0;
    let performanceRating = "";

    if (seconds < minTime) {
      // Too fast — no XP
      earned = 0;
      performanceRating = t(language, "exerciseDetail.tooFast");
      Alert.alert(
        t(language, "exerciseDetail.tooQuickTitle"),
        t(language, "exerciseDetail.tooQuickMessage", { seconds: minTime }),
      );
    } else if (seconds >= optimalLow && seconds <= optimalHigh) {
      // Optimal zone — bonus XP (+15%)
      earned = Math.floor(xpEstimate * 1.15);
      performanceRating = t(language, "exerciseDetail.perfectTiming");
    } else {
      // Past minimum — full XP, no penalty
      earned = xpEstimate;
      performanceRating = t(language, "exerciseDetail.completed");
    }

    earned = Math.min(150, earned);
    setEarnedXP(earned);
    setPerformanceFeedback(performanceRating);
    const loggedSuccessfully = await handleLogExercise(earned);
    if (!loggedSuccessfully) {
      return;
    }

    // Only show celebration if XP was earned
    if (earned > 0) {
      playLevelUpSound();
      setSuccessVisible(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <TopBar showBack title={exercise.name} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.imageWrapper, { backgroundColor: C.surface }]}>
          <Image
            source={
              exerciseImages[exercise.gif] ||
              (exercise.gifUrl ? { uri: exercise.gifUrl } : undefined)
            }
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: C.text,
                textAlign: isRTL ? "right" : "left",
                fontFamily: fontBold,
              },
            ]}
          >
            {t(language, "exerciseDetail.details")}
          </Text>
          <Text
            style={[
              styles.description,
              {
                color: C.textSecondary,
                textAlign: isRTL ? "right" : "left",
                fontFamily: fontSemibold,
              },
            ]}
          >
            {isRTL ? exercise.descriptionAr : exercise.description}
          </Text>
          <View
            style={[
              styles.detailRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: C.textSecondary, fontFamily: fontSemibold },
              ]}
            >
              {t(language, "exerciseDetail.equipment")}
            </Text>
            <Text
              style={[styles.value, { color: C.text, fontFamily: fontBold }]}
            >
              {t(language, `equipmentNames.${exercise.equipment}`)}
            </Text>
          </View>
          <View
            style={[
              styles.detailRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: C.textSecondary, fontFamily: fontSemibold },
              ]}
            >
              {t(language, "exerciseDetail.difficulty")}
            </Text>
            <Text
              style={[styles.value, { color: C.text, fontFamily: fontBold }]}
            >
              {t(language, `difficultyNames.${exercise.difficulty}`)}
            </Text>
          </View>
          {exercise.target ? (
            <View
              style={[
                styles.detailRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  { color: C.textSecondary, fontFamily: fontSemibold },
                ]}
              >
                {t(language, "exerciseDetail.target")}
              </Text>
              <Text
                style={[styles.value, { color: C.text, fontFamily: fontBold }]}
              >
                {t(language, `targetNames.${exercise.target}`)}
              </Text>
            </View>
          ) : null}
          {exercise.secondaryMuscles.length > 0 && (
            <View
              style={[
                styles.detailRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  { color: C.textSecondary, fontFamily: fontSemibold },
                ]}
              >
                {t(language, "exerciseDetail.secondary")}
              </Text>
              <Text
                style={[styles.value, { color: C.text, fontFamily: fontBold }]}
                numberOfLines={2}
              >
                {exercise.secondaryMuscles
                  .map((m) => t(language, `secondaryNames.${m}`))
                  .join(isRTL ? "، " : ", ")}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.detailRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: C.textSecondary, fontFamily: fontSemibold },
              ]}
            >
              {t(language, "exerciseDetail.setsReps")}
            </Text>
            <Text
              style={[styles.value, { color: C.text, fontFamily: fontBold }]}
            >
              {exercise.sets} x {exercise.reps}
            </Text>
          </View>
          {(exercise.caloriesPerMinute ?? 0) > 0 && (
            <View
              style={[
                styles.detailRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  { color: C.textSecondary, fontFamily: fontSemibold },
                ]}
              >
                {t(language, "exerciseDetail.caloriesMin")}
              </Text>
              <Text
                style={[
                  styles.value,
                  { color: C.primary, fontFamily: fontBold },
                ]}
              >
                🔥 {(exercise.caloriesPerMinute ?? 0).toFixed(1)}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.detailRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: C.textSecondary, fontFamily: fontSemibold },
              ]}
            >
              {t(language, "exerciseDetail.estimatedXP")}
            </Text>
            <Text
              style={[styles.value, { color: C.primary, fontFamily: fontBold }]}
            >
              {xpEstimate}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: C.text,
                textAlign: isRTL ? "right" : "left",
                fontFamily: fontBold,
              },
            ]}
          >
            {t(language, "exerciseDetail.timer")}
          </Text>
          <Text style={[styles.timerText, { color: C.text }]}>
            {formattedTime}
          </Text>
          <View
            style={[
              styles.timerButtons,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Pressable
              onPress={handleStart}
              style={[styles.timerButton, { backgroundColor: C.primary }]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: C.background, fontFamily: fontBold },
                ]}
              >
                {running
                  ? t(language, "exerciseDetail.pause")
                  : hasStarted
                    ? t(language, "exerciseDetail.resume")
                    : t(language, "exerciseDetail.start")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleReset}
              style={[
                styles.timerButton,
                { backgroundColor: C.surfaceHighlight },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: C.text, fontFamily: fontBold },
                ]}
              >
                {t(language, "exerciseDetail.reset")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleFinish}
              disabled={seconds === 0}
              style={[
                styles.timerButton,
                {
                  backgroundColor: C.primary,
                  opacity: seconds === 0 ? 0.5 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: C.background, fontFamily: fontBold },
                ]}
              >
                {t(language, "exerciseDetail.finish")}
              </Text>
            </Pressable>
          </View>
          {finished && earnedXP !== null ? (
            <View style={styles.finishedRow}>
              <Text
                style={[
                  styles.finishText,
                  {
                    color: C.primary,
                    textAlign: isRTL ? "right" : "left",
                    fontFamily: fontBold,
                  },
                ]}
              >
                {t(language, "exerciseDetail.finished")}: {formattedTime} • +
                {earnedXP} XP
              </Text>
            </View>
          ) : null}
        </View>

        {/* Countdown Timer */}
        <CountdownTimer
          visible={countdownVisible}
          onComplete={handleCountdownComplete}
        />

        {/* Exercise Completion Celebration */}
        <ExerciseCompletionCelebration
          visible={successVisible}
          exerciseName={exercise.name}
          earnedXP={earnedXP || 0}
          duration={formattedTime}
          performanceFeedback={performanceFeedback}
          onDismiss={() => {
            setSuccessVisible(false);
            if (muscle) {
              router.replace({
                pathname: "/exercise-list",
                params: { muscle },
              });
            }
          }}
        />

        {/* Level Up Celebration */}
        <LevelUpCelebration
          visible={levelUpVisible}
          level={newLevel}
          onComplete={() => setLevelUpVisible(false)}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  imageWrapper: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  value: {
    fontSize: 13,
    fontWeight: "700",
  },
  timerText: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
  },
  timerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  timerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  finishedRow: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
  },
  finishText: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
});

export default ExerciseDetailScreen;
