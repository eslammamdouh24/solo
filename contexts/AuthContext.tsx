import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInInProgress: boolean;
  signUp: (
    email: string,
    password: string,
    username?: string,
    profileData?: {
      fullName: string;
      birthDay: number;
      birthMonth: number;
      birthYear: number;
      gender: string;
    },
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (data: Record<string, any>) => Promise<void>;
  isPasswordRecovery: boolean;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInInProgress: false,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  deleteAccount: async () => {},
  updateProfile: async () => {},
  isPasswordRecovery: false,
  changePassword: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInInProgress, setSignInInProgress] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === "PASSWORD_RECOVERY") {
        // User clicked password reset link — let them set a new password
        setIsPasswordRecovery(true);
        setUser(session?.user ?? null);
      } else if (event === "SIGNED_IN" && session?.user) {
        // Fetch fresh user data from server to get latest metadata
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          // User no longer exists (e.g. deleted account with stale token)
          setUser(null);
          setSession(null);
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        } else {
          setUser(data.user);
        }
      } else {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    username?: string,
    profileData?: {
      fullName: string;
      birthDay: number;
      birthMonth: number;
      birthYear: number;
      gender: string;
    },
  ) => {
    try {
      // Validate input on client side
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Prevent email confirmation redirects
          data: {
            created_at: new Date().toISOString(),
            username: username || email.split("@")[0],
            full_name: profileData?.fullName || "",
            birth_day: profileData?.birthDay || null,
            birth_month: profileData?.birthMonth || null,
            birth_year: profileData?.birthYear || null,
            gender: profileData?.gender || "",
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error("USER_ALREADY_REGISTERED");
        }
        throw error;
      }

      if (data.user) {
        // Check if there's an existing game state
        try {
          const { data: existingState } = await supabase
            .from("game_states")
            .select("id")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (!existingState) {
            // Create fresh game state with username and email for lookup
            const { error: insertError } = await supabase
              .from("game_states")
              .insert([
                {
                  user_id: data.user.id,
                  username: (username || email.split("@")[0]).toLowerCase(),
                  email: email.toLowerCase(),
                  level: 1,
                  xp: 0,
                  strength: 0,
                  endurance: 0,
                  discipline: 0,
                  skill_points: 0,
                  current_streak: 0,
                  last_workout_date: null,
                  daily_bonus_claimed: null,
                  session_count: 0,
                },
              ]);

            if (insertError) {
              throw new Error(
                "Failed to initialize your account. Please try again.",
              );
            }
          }
        } catch (dbError: any) {
          // Sign out user and re-throw error
          await supabase.auth.signOut();
          throw new Error(
            dbError.message ||
              "Failed to initialize your account. Please contact support if this persists.",
          );
        }
      }
    } catch (error: any) {
      // Sanitize error messages for security
      const message = error.message || "Failed to create account";
      throw new Error(message);
    }
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      if (!emailOrUsername || !password) {
        throw new Error("Email/username and password are required");
      }

      let email = emailOrUsername;

      // If input doesn't look like an email, treat it as a username
      if (!emailOrUsername.includes("@")) {
        const { data: foundEmail, error: lookupError } = await supabase.rpc(
          "get_email_by_username",
          {
            lookup_username: emailOrUsername.toLowerCase(),
          },
        );

        if (lookupError || !foundEmail) {
          throw new Error("Invalid email or password");
        }
        email = foundEmail;
      }

      // Set flag BEFORE signInWithPassword to block _layout redirect
      setSignInInProgress(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setSignInInProgress(false);
        if (error.message.includes("Invalid")) {
          throw new Error("Invalid email or password");
        }
        throw error;
      }

      // Check if user has a game state, create if not
      if (data.user) {
        try {
          const { data: gameState } = await supabase
            .from("game_states")
            .select("id, username, email, deleted_at")
            .eq("user_id", data.user.id)
            .maybeSingle();

          // Check if account was soft-deleted
          if (gameState?.deleted_at) {
            const deletedAt = new Date(gameState.deleted_at);
            const daysSinceDelete = Math.floor(
              (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (daysSinceDelete >= 30) {
              // Past 30-day grace period — permanently delete
              await supabase.rpc("permanently_delete_user_account");
              await supabase.auth.signOut();
              setSignInInProgress(false);
              throw new Error("ACCOUNT_EXPIRED");
            } else {
              // Within grace period — restore the account
              await supabase.rpc("restore_user_account");
            }
          }

          if (gameState && !gameState.username) {
            // Backfill username/email for existing users
            const meta = data.user.user_metadata;
            await supabase
              .from("game_states")
              .update({
                username: (
                  meta?.username ||
                  data.user.email?.split("@")[0] ||
                  ""
                ).toLowerCase(),
                email: data.user.email?.toLowerCase(),
              })
              .eq("user_id", data.user.id);
          }

          if (!gameState) {
            const { error: insertError } = await supabase
              .from("game_states")
              .insert([
                {
                  user_id: data.user.id,
                  level: 1,
                  xp: 0,
                  strength: 0,
                  endurance: 0,
                  discipline: 0,
                  skill_points: 0,
                  current_streak: 0,
                  last_workout_date: null,
                  daily_bonus_claimed: null,
                  session_count: 0,
                },
              ]);

            if (insertError) {
              await supabase.auth.signOut();
              setSignInInProgress(false);
              throw new Error(
                "Failed to load your profile. Please try signing in again.",
              );
            }
          }
        } catch (error: any) {
          if (!error.message.includes("Failed to load")) {
            await supabase.auth.signOut();
          }
          setSignInInProgress(false);
          throw error;
        }
      }

      // Everything succeeded - refresh user to get latest metadata
      const { data: freshUser } = await supabase.auth.getUser();
      if (freshUser?.user) {
        setUser(freshUser.user);
      }

      // Allow navigation
      setSignInInProgress(false);
    } catch (error: any) {
      setSignInInProgress(false);
      const message = error.message || "Failed to sign in";
      throw new Error(message);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      const message = error.message || "Failed to sign out";
      throw new Error(message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      // Build redirect URL — use current origin on web, or app scheme on native
      const redirectTo =
        Platform.OS === "web" && typeof window !== "undefined"
          ? window.location.origin
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;
    } catch (error: any) {
      const message = error.message || "Failed to send reset email";
      throw new Error(message);
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      if (!newPassword || newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Clear recovery state
      setIsPasswordRecovery(false);
    } catch (error: any) {
      const message = error.message || "Failed to change password";
      throw new Error(message);
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) {
        throw new Error("No user logged in");
      }

      // Soft delete — mark account as deleted (30-day recovery period)
      const { error: rpcError } = await supabase.rpc(
        "soft_delete_user_account",
      );

      if (rpcError) {
        // Fallback: set deleted_at manually
        console.warn(
          "RPC not available, using fallback soft delete:",
          rpcError.message,
        );

        const { error: updateError } = await supabase
          .from("game_states")
          .update({ deleted_at: new Date().toISOString() })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error soft-deleting game state:", updateError);
          throw new Error("Failed to delete your account. Please try again.");
        }
      }

      // Clear local state
      setUser(null);
      setSession(null);

      // Sign out normally (auth user still exists for 30-day recovery)
      await supabase.auth.signOut();
    } catch (error: any) {
      const message = error.message || "Failed to delete account";
      throw new Error(message);
    }
  };

  const updateProfile = async (data: Record<string, any>) => {
    try {
      const { data: updatedUser, error } = await supabase.auth.updateUser({
        data,
      });
      if (error) throw error;
      if (updatedUser.user) {
        setUser(updatedUser.user);
        // Sync username to game_states if it changed
        if (data.username) {
          const { error: updateError } = await supabase
            .from("game_states")
            .update({ username: data.username.toLowerCase() })
            .eq("user_id", updatedUser.user.id);
          if (updateError) {
            console.warn(
              "Failed to sync username to game_states:",
              updateError.message,
            );
          }
        }
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to update profile");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInInProgress,
        signUp,
        signIn,
        signOut,
        resetPassword,
        deleteAccount,
        updateProfile,
        isPasswordRecovery,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
