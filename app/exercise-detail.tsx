import { AnimatedEntry } from "@/components/AnimatedEntry";
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
import { useFloatingTimer } from "@/contexts/FloatingTimerContext";
import { useColors } from "@/hooks/useColors";
import { useGameStateWithDB } from "@/hooks/useGameStateWithDB";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useSound } from "@/hooks/useSound";
import { getExerciseById, MuscleGroup } from "@/lib/exerciseApi";
import { supabase } from "@/lib/supabase";
import { getExerciseWorkoutHistory, WorkoutLogEntry } from "@/lib/workoutApi";
import { calculateNewStreak, getStatGains } from "@/utils/workoutHelpers";
import { processWorkout } from "@/utils/workoutProcessor";
import { getToday } from "@/utils/xpCalculations";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    Modal,
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
  const { language, addWorkoutToSession } = useApp();
  const isRTL = checkRTL(language);
  const fontSemibold = getFont(language, "semibold");
  const fontBold = getFont(language, "bold");
  const gameState = useGameStateWithDB();
  const { playLevelUpSound } = useSound();
  const {
    logWorkout: logWorkoutOffline,
    isOnline,
    pendingSync,
  } = useOfflineSync();

  const exercise = useMemo(() => {
    if (!muscle || !exerciseId) return null;
    return getExerciseById(muscle, exerciseId);
  }, [muscle, exerciseId]);

  const floatingTimer = useFloatingTimer();

  // Use timer from context if it exists for this exercise, otherwise local state
  const isTimerForThisExercise =
    floatingTimer.exerciseName === exercise?.name &&
    floatingTimer.exerciseRoute?.muscle === muscle &&
    floatingTimer.exerciseRoute?.exerciseId === exerciseId;

  const seconds = isTimerForThisExercise ? floatingTimer.seconds : 0;
  const running = isTimerForThisExercise ? floatingTimer.running : false;

  const [finished, setFinished] = useState(false);
  const [logged, setLogged] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [earnedXP, setEarnedXP] = useState<number | null>(null);
  const [performanceFeedback, setPerformanceFeedback] = useState<string>("");
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [gifFullscreen, setGifFullscreen] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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

  // Auto-sync timer state if returning to the same exercise
  useEffect(() => {
    if (
      floatingTimer.exerciseName === exercise?.name &&
      floatingTimer.exerciseRoute?.muscle === muscle &&
      floatingTimer.exerciseRoute?.exerciseId === exerciseId
    ) {
      setHasStarted(true); // Mark as started if timer already exists
    }
  }, [exercise?.name, muscle, exerciseId]);

  // Cleanup timer when leaving the screen
  useEffect(() => {
    return () => {
      // Keep timer running in minimized mode when unmounting
    };
  }, []);

  // Fetch workout history for this exercise
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !exerciseId) return;
      setHistoryLoading(true);
      try {
        const history = await getExerciseWorkoutHistory(user.id, exerciseId, 5);
        console.log("Workout history fetched:", history);
        setWorkoutHistory(history);
      } catch (error) {
        console.error("Error fetching workout history:", error);
      }
      setHistoryLoading(false);
    };
    fetchHistory();
  }, [user, exerciseId, logged]);

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
      const workoutData = {
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
      };

      console.log("Logging workout:", workoutData);

      // If online, insert directly to database for immediate availability
      if (isOnline) {
        const { error: dbError } = await supabase
          .from("workout_logs")
          .insert(workoutData);

        if (dbError) {
          console.error("Direct database insert error:", dbError);
          // Fall back to offline queue
          await logWorkoutOffline(workoutData);
        } else {
          console.log("Workout logged directly to database");
        }
      } else {
        // Queue for later when offline
        await logWorkoutOffline(workoutData);
        console.log("Workout queued for offline sync");
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
        setLeveledUp(true);
        // Don't show level up modal on exercise screen
        // It will be shown on home screen instead
        // setLevelUpVisible(true);
      }

      return true;
    } catch (error: any) {
      const errorMsg = isOnline
        ? error.message || t(language, "exerciseDetail.errorMessage")
        : t(language, "exerciseDetail.savedOffline");

      if (!isOnline) {
        // Show success for offline save
        Alert.alert(t(language, "exerciseDetail.offlineTitle"), errorMsg);
        return true;
      } else {
        Alert.alert(t(language, "exerciseDetail.errorTitle"), errorMsg);
        return false;
      }
    }
  };

  const handleStart = () => {
    if (!running && !hasStarted && !isTimerForThisExercise) {
      // First time starting - show countdown
      setCountdownVisible(true);
    } else {
      // Resume or pause
      if (running) {
        floatingTimer.pauseTimer();
      } else {
        floatingTimer.resumeTimer();
      }
      if (finished) {
        setFinished(false);
        setEarnedXP(null);
      }
    }
  };

  const handleCountdownComplete = () => {
    setCountdownVisible(false);
    setHasStarted(true);
    if (exercise && muscle && exerciseId) {
      floatingTimer.startTimer(exercise.name, muscle, exerciseId);
    }
  };

  const handleReset = () => {
    floatingTimer.stopTimer(); // Stop completely, not just reset
    setFinished(false);
    setEarnedXP(null);
    setPerformanceFeedback("");
    setHasStarted(false);
  };

  const handleMinimizeAndGoBack = () => {
    // Minimize the timer first
    floatingTimer.minimize();

    // Small delay for smooth transition, then navigate back
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    }, 250);
  };

  const handleFinish = async () => {
    floatingTimer.pauseTimer();
    setFinished(true);

    // MINIMUM TIME GATE — industry-standard anti-cheat
    // For time-based exercises (planks, carries): minTime = sets × duration
    // For rep-based: ~1.5s per rep across all sets
    const isTimeBased = !!exercise.duration;
    const totalReps = exercise.sets * exercise.reps;
    const minTime = isTimeBased
      ? Math.max(15, exercise.sets * (exercise.duration ?? 0))
      : Math.max(20, Math.floor(totalReps * 1.5));

    // Optimal zone: proper tempo + rest periods
    const TEMPO_BY_DIFFICULTY = {
      Beginner: { repTime: 2, rest: 45 },
      Intermediate: { repTime: 3, rest: 60 },
      Advanced: { repTime: 4, rest: 90 },
    };
    const { repTime, rest } = TEMPO_BY_DIFFICULTY[exercise.difficulty];
    const workTime = isTimeBased
      ? exercise.sets * (exercise.duration ?? 0)
      : totalReps * repTime;
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

      // Store workout in session for later animation on home
      addWorkoutToSession({
        earnedXP: earned,
        leveledUp: leveledUp,
        newLevel: leveledUp ? newLevel : 0,
      });
    }
  };

  const formatTimeAgo = (date: Date, lang: string) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return lang === "ar" ? "الآن" : "Just now";
    if (diffMins < 60)
      return lang === "ar" ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24)
      return lang === "ar" ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7)
      return lang === "ar" ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;

    return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <TopBar showBack title={exercise.name} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <AnimatedEntry index={0} from="down">
          <Pressable
            onPress={() => setGifFullscreen(true)}
            style={[styles.imageWrapper, { backgroundColor: C.surface }]}
          >
            <Image
              source={
                exerciseImages[exercise.gif] ||
                (exercise.gifUrl ? { uri: exercise.gifUrl } : undefined)
              }
              style={styles.image}
              resizeMode="contain"
            />
            <View
              style={[
                styles.expandBadge,
                { backgroundColor: C.background + "cc" },
              ]}
            >
              <Ionicons name="expand-outline" size={18} color={C.text} />
            </View>
          </Pressable>
        </AnimatedEntry>

        <AnimatedEntry index={1} from="down">
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

            {/* Stat pills grid */}
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statPill,
                  {
                    backgroundColor: C.background,
                    borderColor: C.surfaceHighlight,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
              >
                <Ionicons name="barbell-outline" size={16} color={C.primary} />
                <View style={styles.statPillText}>
                  <Text
                    style={[
                      styles.statPillLabel,
                      {
                        color: C.textMuted,
                        fontFamily: fontSemibold,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t(language, "exerciseDetail.equipment")}
                  </Text>
                  <Text
                    style={[
                      styles.statPillValue,
                      {
                        color: C.text,
                        fontFamily: fontBold,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t(language, `equipmentNames.${exercise.equipment}`)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statPill,
                  {
                    backgroundColor: C.background,
                    borderColor: C.surfaceHighlight,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color={C.primary}
                />
                <View style={styles.statPillText}>
                  <Text
                    style={[
                      styles.statPillLabel,
                      {
                        color: C.textMuted,
                        fontFamily: fontSemibold,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t(language, "exerciseDetail.difficulty")}
                  </Text>
                  <Text
                    style={[
                      styles.statPillValue,
                      {
                        color: C.text,
                        fontFamily: fontBold,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t(language, `difficultyNames.${exercise.difficulty}`)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statPill,
                  {
                    backgroundColor: C.background,
                    borderColor: C.surfaceHighlight,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
              >
                <Ionicons name="repeat-outline" size={16} color={C.primary} />
                <View style={styles.statPillText}>
                  <Text
                    style={[
                      styles.statPillLabel,
                      {
                        color: C.textMuted,
                        fontFamily: fontSemibold,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t(language, "exerciseDetail.setsReps")}
                  </Text>
                  <Text
                    style={[
                      styles.statPillValue,
                      {
                        color: C.text,
                        fontFamily: fontBold,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {exercise.duration
                      ? `${exercise.sets} × ${exercise.duration}s`
                      : `${exercise.sets} × ${exercise.reps}`}
                  </Text>
                </View>
              </View>
              {(exercise.caloriesPerMinute ?? 0) > 0 && (
                <View
                  style={[
                    styles.statPill,
                    {
                      backgroundColor: C.background,
                      borderColor: C.surfaceHighlight,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    },
                  ]}
                >
                  <Text style={{ fontSize: 15 }}>🔥</Text>
                  <View style={styles.statPillText}>
                    <Text
                      style={[
                        styles.statPillLabel,
                        {
                          color: C.textMuted,
                          fontFamily: fontSemibold,
                          textAlign: isRTL ? "right" : "left",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {t(language, "exerciseDetail.caloriesMin")}
                    </Text>
                    <Text
                      style={[
                        styles.statPillValue,
                        {
                          color: C.text,
                          fontFamily: fontBold,
                          textAlign: isRTL ? "right" : "left",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {(exercise.caloriesPerMinute ?? 0).toFixed(1)}
                    </Text>
                  </View>
                </View>
              )}
              <View
                style={[
                  styles.statPill,
                  {
                    backgroundColor: C.primary + "15",
                    borderColor: C.primary + "40",
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
              >
                <Ionicons name="star" size={16} color={C.primary} />
                <View style={styles.statPillText}>
                  <Text
                    style={[
                      styles.statPillLabel,
                      {
                        color: C.textMuted,
                        fontFamily: fontSemibold,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t(language, "exerciseDetail.estimatedXP")}
                  </Text>
                  <Text
                    style={[
                      styles.statPillValue,
                      {
                        color: C.primary,
                        fontFamily: fontBold,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    +{xpEstimate}
                  </Text>
                </View>
              </View>
            </View>

            {/* Target muscle — hero badge */}
            {exercise.target ? (
              <View style={styles.musclesBlock}>
                <Text
                  style={[
                    styles.musclesHeader,
                    {
                      color: C.textMuted,
                      fontFamily: fontSemibold,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {t(language, "exerciseDetail.target")}
                </Text>
                <View
                  style={[
                    styles.targetBadge,
                    {
                      backgroundColor: C.primary + "18",
                      borderColor: C.primary + "50",
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignSelf: isRTL ? "flex-end" : "flex-start",
                    },
                  ]}
                >
                  <View
                    style={[styles.targetDot, { backgroundColor: C.primary }]}
                  />
                  <Text
                    style={[
                      styles.targetText,
                      { color: C.primary, fontFamily: fontBold },
                    ]}
                  >
                    {t(language, `targetNames.${exercise.target}`)}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Secondary muscles — chip row */}
            {exercise.secondaryMuscles.length > 0 && (
              <View style={styles.musclesBlock}>
                <Text
                  style={[
                    styles.musclesHeader,
                    {
                      color: C.textMuted,
                      fontFamily: fontSemibold,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {t(language, "exerciseDetail.secondary")}
                </Text>
                <View
                  style={[
                    styles.chipRow,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  {exercise.secondaryMuscles.map((m) => (
                    <View
                      key={m}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: C.background,
                          borderColor: C.surfaceHighlight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: C.textSecondary, fontFamily: fontSemibold },
                        ]}
                      >
                        {t(language, `secondaryNames.${m}`)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Workout History */}
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
              {t(language, "exerciseDetail.workoutHistory")}
            </Text>

            {historyLoading ? (
              <View style={styles.historyEmpty}>
                <Text
                  style={[
                    styles.historyEmptyText,
                    { color: C.textSecondary, fontFamily: fontSemibold },
                  ]}
                >
                  {language === "ar" ? "جاري التحميل..." : "Loading..."}
                </Text>
              </View>
            ) : workoutHistory.length > 0 ? (
              <View style={styles.historyList}>
                {workoutHistory.map((log, index) => {
                  const date = new Date(log.created_at || "");
                  const timeAgo = formatTimeAgo(date, language);
                  const duration = formatDuration(log.duration_seconds);

                  return (
                    <View
                      key={log.id || index}
                      style={[
                        styles.historyItem,
                        {
                          backgroundColor: C.background,
                          borderBottomColor: C.surfaceHighlight,
                          borderBottomWidth:
                            index < workoutHistory.length - 1 ? 1 : 0,
                        },
                      ]}
                    >
                      <View style={styles.historyLeft}>
                        <View
                          style={[
                            styles.historyDot,
                            { backgroundColor: C.primary },
                          ]}
                        />
                        <View>
                          <Text
                            style={[
                              styles.historyDate,
                              { color: C.text, fontFamily: fontBold },
                            ]}
                          >
                            {timeAgo}
                          </Text>
                          <Text
                            style={[
                              styles.historyDuration,
                              {
                                color: C.textSecondary,
                                fontFamily: fontSemibold,
                              },
                            ]}
                          >
                            {duration}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.historyXP,
                          { color: C.primary, fontFamily: fontBold },
                        ]}
                      >
                        +{log.xp} XP
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.historyEmpty}>
                <Text
                  style={[
                    styles.historyEmptyText,
                    { color: C.textSecondary, fontFamily: fontSemibold },
                  ]}
                >
                  {language === "ar"
                    ? "لم تقم بهذا التمرين من قبل"
                    : "No previous workouts yet"}
                </Text>
              </View>
            )}
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
            {running && (
              <Pressable
                onPress={handleMinimizeAndGoBack}
                style={[
                  styles.minimizeButton,
                  {
                    backgroundColor: C.surfaceHighlight,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
              >
                <Ionicons name="contract-outline" size={18} color={C.primary} />
                <Text
                  style={[
                    styles.minimizeButtonText,
                    { color: C.primary, fontFamily: fontBold },
                  ]}
                >
                  {t(language, "exerciseDetail.minimizeTimer")}
                </Text>
              </Pressable>
            )}
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
        </AnimatedEntry>

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
            // Navigate back to exercise list to continue workout session
            if (muscle) {
              router.replace({
                pathname: "/exercise-list",
                params: { muscle },
              });
            } else {
              router.replace("/");
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

      {/* Fullscreen GIF viewer */}
      <Modal
        visible={gifFullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setGifFullscreen(false)}
      >
        <Pressable
          style={styles.fullscreenBackdrop}
          onPress={() => setGifFullscreen(false)}
        >
          <Image
            source={
              exerciseImages[exercise.gif] ||
              (exercise.gifUrl ? { uri: exercise.gifUrl } : undefined)
            }
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
          <Pressable
            onPress={() => setGifFullscreen(false)}
            style={styles.fullscreenClose}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </Pressable>
      </Modal>
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
  expandBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
  fullscreenClose: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statPill: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 140,
  },
  statPillText: {
    flex: 1,
    minWidth: 0,
  },
  statPillLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  statPillValue: {
    fontSize: 13,
  },
  musclesBlock: {
    marginTop: 4,
    marginBottom: 12,
  },
  musclesHeader: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  targetBadge: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  targetText: {
    fontSize: 13,
  },
  chipRow: {
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
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
  minimizeButton: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  minimizeButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  finishedRow: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(168, 85, 247, 0.1)",
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
  historyList: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  historyDuration: {
    fontSize: 12,
  },
  historyXP: {
    fontSize: 14,
  },
  historyEmpty: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  historyEmptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default ExerciseDetailScreen;
