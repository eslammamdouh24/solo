import { useNetwork } from "@/contexts/NetworkContext";
import { useSyncQueue } from "@/contexts/SyncQueueContext";
import { useCallback } from "react";

/**
 * Hook to handle offline-first operations
 * Automatically queues operations when offline and syncs when online
 */
export const useOfflineSync = () => {
  const { isOnline } = useNetwork();
  const { queueOperation, queueSize, isSyncing } = useSyncQueue();

  /**
   * Log workout - works offline
   */
  const logWorkout = useCallback(
    async (workoutData: any) => {
      if (isOnline) {
        // Direct sync when online
        return queueOperation("workout_log", workoutData);
      } else {
        // Queue for later when offline
        return queueOperation("workout_log", workoutData);
      }
    },
    [isOnline, queueOperation],
  );

  /**
   * Update XP - works offline
   */
  const updateXP = useCallback(
    async (xp: number) => {
      return queueOperation("xp_update", { xp });
    },
    [queueOperation],
  );

  /**
   * Update profile - works offline
   */
  const updateProfile = useCallback(
    async (profileData: any) => {
      return queueOperation("profile_update", profileData);
    },
    [queueOperation],
  );

  /**
   * Update stats - works offline
   */
  const updateStats = useCallback(
    async (stats: any) => {
      return queueOperation("stats_update", { stats });
    },
    [queueOperation],
  );

  return {
    isOnline,
    logWorkout,
    updateXP,
    updateProfile,
    updateStats,
    pendingSync: queueSize,
    isSyncing,
  };
};
