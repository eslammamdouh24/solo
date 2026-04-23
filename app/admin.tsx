import { TopBar } from "@/components/TopBar";
import { Colors } from "@/constants/colors";
import { isRTL as checkRTL } from "@/constants/enums";
import { getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmDialogContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Error-only notification (success is reflected optimistically in UI)
const notifyError = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

interface UserData {
  user_id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  role: string;
  session_count: number;
  created_at: string;
}

interface AppStats {
  totalUsers: number;
  totalWorkouts: number;
  totalXP: number;
  avgLevel: number;
  newThisWeek: number;
  avgWorkoutsPerUser: number;
}

interface DailyCount {
  day: string;
  count: number;
}

export default function AdminScreen() {
  const { language } = useApp();
  const { user, isAdmin, adminChecked } = useAuth();
  const C = useColors();
  const router = useRouter();
  const confirm = useConfirm();
  const isRTL = checkRTL(language);
  const fontBold = getFont(language, "bold");
  const fontSemibold = getFont(language, "semibold");
  const fontRegular = getFont(language, "regular");

  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [signupsDaily, setSignupsDaily] = useState<DailyCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  // Redirect only once admin status has been verified
  useEffect(() => {
    if (adminChecked && !isAdmin) {
      router.replace("/");
    }
  }, [adminChecked, isAdmin]);

  const computeStats = (list: UserData[]): AppStats => {
    const totalUsers = list.length;
    const totalXP = list.reduce((sum, u) => sum + (u.xp || 0), 0);
    const totalWorkouts = list.reduce(
      (sum, u) => sum + (u.session_count || 0),
      0,
    );
    const avgLevel = totalUsers
      ? Math.round(
          (list.reduce((s, u) => s + (u.level || 0), 0) / totalUsers) * 10,
        ) / 10
      : 0;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = list.filter(
      (u) => new Date(u.created_at).getTime() >= sevenDaysAgo,
    ).length;
    const avgWorkoutsPerUser = totalUsers
      ? Math.round((totalWorkouts / totalUsers) * 10) / 10
      : 0;
    return {
      totalUsers,
      totalWorkouts,
      totalXP,
      avgLevel,
      newThisWeek,
      avgWorkoutsPerUser,
    };
  };

  const computeSignups = (list: UserData[]): DailyCount[] => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets: DailyCount[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toDateString();
      const count = list.filter(
        (u) => new Date(u.created_at).toDateString() === dateStr,
      ).length;
      buckets.push({ day: dayNames[d.getDay()], count });
    }
    return buckets;
  };

  const loadData = async () => {
    try {
      // Single query — derive all stats from users list (no separate workout_logs fetch)
      const { data: usersData, error: usersError } = await supabase
        .from("game_states")
        .select(
          "user_id, username, email, level, xp, role, session_count, created_at",
        )
        .order("level", { ascending: false })
        .order("xp", { ascending: false });

      if (usersError) throw usersError;

      const list = usersData || [];
      setUsers(list);
      setStats(computeStats(list));
      setSignupsDaily(computeSignups(list));
    } catch (error: any) {
      console.error("Error loading admin data:", error);
      notifyError(
        t(language, "admin.errorTitle"),
        error.message || t(language, "admin.errorMessage"),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const actionText = newRole === "admin" ? "promote" : "demote";

    const confirmed = await confirm({
      title: t(language, "admin.confirmTitle"),
      message: t(
        language,
        `admin.confirm${actionText === "promote" ? "Promote" : "Demote"}`,
      ),
      confirmText: t(language, "admin.confirm"),
      cancelText: t(language, "admin.cancel"),
      icon: newRole === "admin" ? "shield-crown" : "account-arrow-down",
      iconColor: newRole === "admin" ? C.gold : Colors.warning,
      confirmColor: newRole === "admin" ? C.gold : Colors.warning,
    });
    if (!confirmed) return;

    // Optimistic UI update
    const prev = users;
    const nextList = users.map((u) =>
      u.user_id === userId ? { ...u, role: newRole } : u,
    );
    setUsers(nextList);

    try {
      const rpc = newRole === "admin" ? "promote_to_admin" : "demote_to_user";
      const { error } = await supabase.rpc(rpc, { target_user_id: userId });
      if (error) throw error;
    } catch (error: any) {
      // Revert on failure
      setUsers(prev);
      notifyError(
        t(language, "admin.errorTitle"),
        error.message || t(language, "admin.errorMessage"),
      );
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmed = await confirm({
      title: t(language, "admin.deleteUserTitle"),
      message: t(language, "admin.deleteUserMessage").replace(
        "{{username}}",
        username,
      ),
      confirmText: t(language, "admin.delete"),
      cancelText: t(language, "admin.cancel"),
      icon: "account-remove",
      iconColor: Colors.error,
      confirmColor: Colors.error,
    });
    if (!confirmed) return;

    // Optimistic: remove from UI immediately
    const prev = users;
    const nextList = users.filter((u) => u.user_id !== userId);
    setUsers(nextList);
    setStats(computeStats(nextList));

    try {
      // Fire-and-forget workouts (FK cascade will handle if set); still explicit for safety
      await supabase.from("workout_logs").delete().eq("user_id", userId);
      const { error } = await supabase
        .from("game_states")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    } catch (error: any) {
      setUsers(prev);
      setStats(computeStats(prev));
      notifyError(
        t(language, "admin.errorTitle"),
        error.message || t(language, "admin.errorMessage"),
      );
    }
  };

  const handleDeleteAllUsers = async () => {
    const confirmed = await confirm({
      title: t(language, "admin.deleteAllTitle"),
      message: t(language, "admin.deleteAllMessage"),
      confirmText: t(language, "admin.deleteAll"),
      cancelText: t(language, "admin.cancel"),
      icon: "delete-sweep",
      iconColor: Colors.error,
      confirmColor: Colors.error,
    });
    if (!confirmed) return;

    // Optimistic: keep only admin
    const prev = users;
    const nextList = users.filter((u) => u.user_id === user!.id);
    setUsers(nextList);
    setStats(computeStats(nextList));

    try {
      await supabase.from("workout_logs").delete().neq("user_id", user!.id);
      const { error } = await supabase
        .from("game_states")
        .delete()
        .neq("user_id", user!.id);
      if (error) throw error;
    } catch (error: any) {
      setUsers(prev);
      setStats(computeStats(prev));
      notifyError(
        t(language, "admin.errorTitle"),
        error.message || t(language, "admin.errorMessage"),
      );
    }
  };

  // Show loader while we verify admin status
  if (!adminChecked || (isAdmin && loading)) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <TopBar showBack />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <TopBar showBack />
        <View style={styles.centerContent}>
          <MaterialCommunityIcons
            name="shield-lock"
            size={80}
            color={C.textMuted}
          />
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>
            {t(language, "admin.accessDenied")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <TopBar showBack title={t(language, "admin.title")} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View
              style={[styles.statCard, { backgroundColor: C.surfaceHighlight }]}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={32}
                color={C.primary}
              />
              <Text
                style={[
                  styles.statValue,
                  { color: C.text, fontFamily: fontBold },
                ]}
              >
                {stats.totalUsers}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                {t(language, "admin.totalUsers")}
              </Text>
            </View>

            <View
              style={[styles.statCard, { backgroundColor: C.surfaceHighlight }]}
            >
              <MaterialCommunityIcons
                name="dumbbell"
                size={32}
                color={C.gold}
              />
              <Text
                style={[
                  styles.statValue,
                  { color: C.text, fontFamily: fontBold },
                ]}
              >
                {stats.totalWorkouts}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                {t(language, "admin.totalWorkouts")}
              </Text>
            </View>

            <View
              style={[styles.statCard, { backgroundColor: C.surfaceHighlight }]}
            >
              <MaterialCommunityIcons name="star" size={32} color={C.gold} />
              <Text
                style={[
                  styles.statValue,
                  { color: C.text, fontFamily: fontBold },
                ]}
              >
                {stats.totalXP.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                {t(language, "admin.totalXP")}
              </Text>
            </View>

            <View
              style={[styles.statCard, { backgroundColor: C.surfaceHighlight }]}
            >
              <MaterialCommunityIcons
                name="chart-line"
                size={32}
                color={C.primary}
              />
              <Text
                style={[
                  styles.statValue,
                  { color: C.text, fontFamily: fontBold },
                ]}
              >
                {stats.avgLevel}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                {t(language, "admin.avgLevel")}
              </Text>
            </View>

            <View
              style={[styles.statCard, { backgroundColor: C.surfaceHighlight }]}
            >
              <MaterialCommunityIcons
                name="account-plus"
                size={32}
                color={Colors.green}
              />
              <Text
                style={[
                  styles.statValue,
                  { color: C.text, fontFamily: fontBold },
                ]}
              >
                {stats.newThisWeek}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                New this week
              </Text>
            </View>

            <View
              style={[styles.statCard, { backgroundColor: C.surfaceHighlight }]}
            >
              <MaterialCommunityIcons
                name="chart-bar"
                size={32}
                color={Colors.purple}
              />
              <Text
                style={[
                  styles.statValue,
                  { color: C.text, fontFamily: fontBold },
                ]}
              >
                {stats.avgWorkoutsPerUser}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>
                Avg workouts / user
              </Text>
            </View>
          </View>
        )}

        {/* Signups last 7 days */}
        {signupsDaily.length > 0 && (
          <View
            style={[styles.chartCard, { backgroundColor: C.surfaceHighlight }]}
          >
            <Text
              style={[
                styles.chartTitle,
                { color: C.text, fontFamily: fontBold },
              ]}
            >
              Signups · Last 7 days
            </Text>
            <View style={styles.chartRow}>
              {signupsDaily.map((d, i) => {
                const max = Math.max(...signupsDaily.map((x) => x.count), 1);
                const heightPct = (d.count / max) * 100;
                const isToday = i === signupsDaily.length - 1;
                return (
                  <View key={i} style={styles.chartCol}>
                    <View style={styles.chartBarWrap}>
                      {d.count > 0 && (
                        <Text
                          style={[
                            styles.chartCount,
                            { color: C.text, fontFamily: fontBold },
                          ]}
                        >
                          {d.count}
                        </Text>
                      )}
                      <View
                        style={[
                          styles.chartTrack,
                          { backgroundColor: C.surface },
                        ]}
                      >
                        <View
                          style={{
                            height: `${heightPct}%`,
                            backgroundColor: isToday
                              ? Colors.orange
                              : C.primary,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.chartLabel,
                        {
                          color: isToday ? Colors.orange : C.textSecondary,
                          fontFamily: fontSemibold,
                        },
                      ]}
                    >
                      {d.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Search + Role Filter */}
        <View
          style={[styles.searchBar, { backgroundColor: C.surfaceHighlight }]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={C.textSecondary}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search username or email"
            placeholderTextColor={C.textMuted}
            style={[
              styles.searchInput,
              { color: C.text, fontFamily: fontRegular },
            ]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={C.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {(["all", "admin", "user"] as const).map((r) => {
            const active = roleFilter === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRoleFilter(r)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? C.primary + "22"
                      : C.surfaceHighlight,
                    borderColor: active ? C.primary : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: active ? C.primary : C.textSecondary,
                      fontFamily: fontSemibold,
                    },
                  ]}
                >
                  {r === "all" ? "All" : r === "admin" ? "Admins" : "Users"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Users List */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              styles.sectionTitleInline,
              { color: C.text, fontFamily: fontBold },
            ]}
          >
            {t(language, "admin.allUsers")} ({filteredUsers.length})
          </Text>
          {users.filter((u) => u.user_id !== user?.id).length > 0 && (
            <TouchableOpacity
              style={[
                styles.deleteAllButton,
                { backgroundColor: C.error + "20" },
              ]}
              onPress={handleDeleteAllUsers}
            >
              <MaterialCommunityIcons
                name="delete-sweep"
                size={18}
                color={C.error}
              />
              <Text style={[styles.deleteAllText, { color: C.error }]}>
                {t(language, "admin.deleteAll")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredUsers.map((userData) => (
          <View
            key={userData.user_id}
            style={[
              styles.userCard,
              { backgroundColor: C.surfaceHighlight },
              userData.user_id === user?.id && {
                borderColor: C.primary,
                borderWidth: 2,
              },
            ]}
          >
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <View style={styles.userTitleRow}>
                  <Text
                    style={[
                      styles.username,
                      { color: C.text, fontFamily: fontSemibold },
                    ]}
                  >
                    {userData.username}
                  </Text>
                  {userData.role === "admin" && (
                    <View
                      style={[
                        styles.adminBadge,
                        { backgroundColor: C.gold + "20" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="shield-crown"
                        size={14}
                        color={C.gold}
                      />
                      <Text style={[styles.adminBadgeText, { color: C.gold }]}>
                        {t(language, "admin.adminBadge")}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.userEmail, { color: C.textSecondary }]}>
                  {userData.email}
                </Text>
                <View style={styles.userStats}>
                  <Text style={[styles.userStat, { color: C.textSecondary }]}>
                    {t(language, "admin.level")}: {userData.level}
                  </Text>
                  <Text style={[styles.userStat, { color: C.textSecondary }]}>
                    • XP: {userData.xp.toLocaleString()}
                  </Text>
                  <Text style={[styles.userStat, { color: C.textSecondary }]}>
                    • {t(language, "admin.workouts")}: {userData.session_count}
                  </Text>
                </View>
              </View>
            </View>

            {userData.user_id !== user?.id && (
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor:
                        userData.role === "admin"
                          ? C.error + "20"
                          : C.primary + "20",
                    },
                  ]}
                  onPress={() =>
                    handleToggleRole(userData.user_id, userData.role)
                  }
                >
                  <MaterialCommunityIcons
                    name={
                      userData.role === "admin" ? "shield-off" : "shield-check"
                    }
                    size={18}
                    color={userData.role === "admin" ? C.error : C.primary}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      {
                        color: userData.role === "admin" ? C.error : C.primary,
                      },
                    ]}
                  >
                    {userData.role === "admin"
                      ? t(language, "admin.demote")
                      : t(language, "admin.promote")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: C.error + "20" },
                  ]}
                  onPress={() =>
                    handleDeleteUser(userData.user_id, userData.username)
                  }
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={18}
                    color={C.error}
                  />
                  <Text style={[styles.actionButtonText, { color: C.error }]}>
                    {t(language, "admin.delete")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitleInline: {
    marginBottom: 0,
    includeFontPadding: false,
    lineHeight: 22,
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  deleteAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  userCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  userTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  userEmail: {
    fontSize: 13,
  },
  userStats: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  userStat: {
    fontSize: 12,
  },
  userActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  chartCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: Spacing.xs,
    height: 110,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  chartBarWrap: {
    width: "100%",
    height: 90,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartCount: {
    fontSize: 10,
    marginBottom: 2,
  },
  chartTrack: {
    width: "70%",
    height: "100%",
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartLabel: {
    fontSize: 11,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full || 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
