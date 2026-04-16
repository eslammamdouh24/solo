import { TopBar } from "@/components/TopBar";
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
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface LeaderboardEntry {
  user_id: string;
  email: string;
  level: number;
  xp: number;
  total_stats: number;
  current_streak: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { language } = useApp();
  const C = useColors();
  const router = useRouter();
  const isRTL = language === "ar";
  const fontBold = getFont(language, "bold");
  const fontSemibold = getFont(language, "semibold");
  const fontRegular = getFont(language, "regular");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"all" | "level" | "xp">("level");

  const loadLeaderboard = React.useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("game_states")
        .select(
          `
          user_id,
          level,
          xp,
          strength,
          endurance,
          discipline,
          current_streak
        `,
        )
        .order(timeFilter === "level" ? "level" : "xp", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        // Get user emails from auth.users
        const leaderboardData: LeaderboardEntry[] = await Promise.all(
          data.map(async (entry, index) => ({
            ...entry,
            email: `User ${index + 1}`, // Simplified - would need to join with users table
            total_stats: entry.strength + entry.endurance + entry.discipline,
            rank: index + 1,
          })),
        );

        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return Colors.gold;
    if (rank === 2) return Colors.silver;
    if (rank === 3) return Colors.bronze;
    return Colors.textSecondary;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "trophy";
    if (rank === 2) return "medal";
    if (rank === 3) return "medal-outline";
    return "numeric-" + rank;
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TopBar showBack />
      </View>

      {/* Screen Title */}
      <Text
        style={[styles.screenTitle, { color: C.text, fontFamily: fontBold }]}
      >
        {t(language, "leaderboard.title")}
      </Text>

      {/* Filter Tabs */}
      <View
        style={[
          styles.filterContainer,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: C.surfaceHighlight },
            timeFilter === "level" && [
              styles.filterTabActive,
              { backgroundColor: C.primary },
            ],
          ]}
          onPress={() => setTimeFilter("level")}
        >
          <Text
            style={[
              styles.filterText,
              { color: C.textSecondary, fontFamily: fontBold },
              timeFilter === "level" && { color: C.background },
            ]}
          >
            {t(language, "leaderboard.byLevel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: C.surfaceHighlight },
            timeFilter === "xp" && [
              styles.filterTabActive,
              { backgroundColor: C.primary },
            ],
          ]}
          onPress={() => setTimeFilter("xp")}
        >
          <Text
            style={[
              styles.filterText,
              { color: C.textSecondary, fontFamily: fontBold },
              timeFilter === "xp" && { color: C.background },
            ]}
          >
            {t(language, "leaderboard.byXP")}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {leaderboard.map((entry) => (
            <View
              key={entry.user_id}
              style={[
                styles.entryCard,
                {
                  backgroundColor: C.surface,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
                entry.user_id === user?.id && [
                  styles.entryCardHighlight,
                  { borderColor: C.primary },
                ],
              ]}
            >
              <View style={styles.rankContainer}>
                <MaterialCommunityIcons
                  name={getRankIcon(entry.rank) as any}
                  size={24}
                  color={getRankColor(entry.rank)}
                />
                <Text
                  style={[
                    styles.rankText,
                    { color: getRankColor(entry.rank), fontFamily: fontBold },
                  ]}
                >
                  #{entry.rank}
                </Text>
              </View>

              <View
                style={[
                  styles.entryInfo,
                  { alignItems: isRTL ? "flex-end" : "flex-start" },
                ]}
              >
                <Text
                  style={[
                    styles.entryEmail,
                    {
                      color: C.text,
                      fontFamily: fontSemibold,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {entry.user_id === user?.id
                    ? t(language, "common.you")
                    : entry.email}
                </Text>
                <View
                  style={[
                    styles.statsRow,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  <View
                    style={[
                      styles.statItem,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="trophy"
                      size={14}
                      color={Colors.level}
                    />
                    <Text
                      style={[
                        styles.statText,
                        { color: C.textSecondary, fontFamily: fontRegular },
                      ]}
                    >
                      {t(language, "leaderboard.level")} {entry.level}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statItem,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="star"
                      size={14}
                      color={Colors.xp}
                    />
                    <Text
                      style={[
                        styles.statText,
                        { color: C.textSecondary, fontFamily: fontRegular },
                      ]}
                    >
                      {entry.xp} XP
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statItem,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="fire"
                      size={14}
                      color={Colors.streak}
                    />
                    <Text
                      style={[
                        styles.statText,
                        { color: C.textSecondary, fontFamily: fontRegular },
                      ]}
                    >
                      {entry.current_streak} {language === "ar" ? "ي" : "d"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "web" ? Spacing.md : 50,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 3,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterTab: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: "700",
    letterSpacing: 1,
  },
  filterTextActive: {
    color: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.lg,
  },
  entryCardHighlight: {
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  rankContainer: {
    alignItems: "center",
    minWidth: 50,
  },
  rankText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  entryInfo: {
    flex: 1,
    gap: Spacing.sm,
  },
  entryEmail: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.text,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
