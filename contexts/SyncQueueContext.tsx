import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { useNetwork } from "./NetworkContext";

const SYNC_QUEUE_KEY = "sync_queue";

export interface SyncOperation {
  id: string;
  type: "workout_log" | "profile_update" | "xp_update" | "stats_update";
  data: any;
  timestamp: number;
  userId: string;
}

interface SyncQueueContextType {
  queueOperation: (type: SyncOperation["type"], data: any) => Promise<void>;
  syncNow: () => Promise<void>;
  queueSize: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
}

const SyncQueueContext = createContext<SyncQueueContextType>({
  queueOperation: async () => {},
  syncNow: async () => {},
  queueSize: 0,
  isSyncing: false,
  lastSyncTime: null,
});

export const useSyncQueue = () => useContext(SyncQueueContext);

export const SyncQueueProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isOnline } = useNetwork();
  const [userId, setUserId] = useState<string | null>(null);
  const [queue, setQueue] = useState<SyncOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Get user directly from supabase (avoids circular dependency with AuthContext)
  // Use getSession() — it's cached locally, no network call (unlike getUser()).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load queue from storage
  useEffect(() => {
    loadQueue();
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      syncNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const loadQueue = async () => {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load sync queue:", error);
    }
  };

  const saveQueue = async (newQueue: SyncOperation[]) => {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(newQueue));
      setQueue(newQueue);
    } catch (error) {
      console.error("Failed to save sync queue:", error);
    }
  };

  const queueOperation = useCallback(
    async (type: SyncOperation["type"], data: any) => {
      if (!userId) return;

      const operation: SyncOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        userId: userId,
      };

      setQueue((prevQueue) => {
        const newQueue = [...prevQueue, operation];
        // Save asynchronously without blocking
        AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(newQueue)).catch(
          (error) => console.error("Failed to save sync queue:", error),
        );
        return newQueue;
      });

      // If online, try to sync immediately
      if (isOnline) {
        setTimeout(() => syncNow(), 100);
      }
    },
    [userId, isOnline],
  );

  const processOperation = async (
    operation: SyncOperation,
  ): Promise<boolean> => {
    try {
      switch (operation.type) {
        case "workout_log": {
          console.log("Processing workout_log operation:", operation.data);
          const { error } = await supabase
            .from("workout_logs")
            .insert(operation.data);

          if (error) {
            console.error("Error inserting workout log:", error);
            return false;
          }

          console.log("Workout log inserted successfully");
          return true;
        }

        case "xp_update": {
          const { error } = await supabase.rpc("add_xp", {
            user_id: operation.userId,
            xp_amount: operation.data.xp,
          });
          return !error;
        }

        case "profile_update": {
          // Update user metadata via auth
          const { error: authError } = await supabase.auth.updateUser({
            data: operation.data,
          });

          // Sync relevant fields to game_states for admin dashboard access
          if (!authError) {
            const updateData: any = {};

            if (operation.data.username) {
              updateData.username = operation.data.username.toLowerCase();
            }
            if (operation.data.gender !== undefined) {
              updateData.gender = operation.data.gender;
            }
            if (operation.data.profile_image !== undefined) {
              updateData.profile_image = operation.data.profile_image;
            }

            if (Object.keys(updateData).length > 0) {
              await supabase
                .from("game_states")
                .update(updateData)
                .eq("user_id", operation.userId);
            }
          }

          return !authError;
        }

        case "stats_update": {
          // Update game_states table with stats
          const { error } = await supabase
            .from("game_states")
            .update(operation.data)
            .eq("user_id", operation.data.user_id);
          return !error;
        }

        default:
          return false;
      }
    } catch (error) {
      console.error("Failed to process operation:", error);
      return false;
    }
  };

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing || queue.length === 0) return;

    setIsSyncing(true);

    try {
      const remainingQueue: SyncOperation[] = [];

      for (const operation of queue) {
        const success = await processOperation(operation);
        if (!success) {
          // Keep failed operations in queue
          remainingQueue.push(operation);
        }
      }

      setQueue(remainingQueue);
      AsyncStorage.setItem(
        SYNC_QUEUE_KEY,
        JSON.stringify(remainingQueue),
      ).catch((error) => console.error("Failed to save sync queue:", error));
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, queue]);

  return (
    <SyncQueueContext.Provider
      value={{
        queueOperation,
        syncNow,
        queueSize: queue.length,
        isSyncing,
        lastSyncTime,
      }}
    >
      {children}
    </SyncQueueContext.Provider>
  );
};
