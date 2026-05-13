import {
    AccentThemeId,
    AccentThemes,
    DEFAULT_ACCENT,
} from "@/constants/accentThemes";
import { Language, Theme } from "@/constants/enums";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface WorkoutSessionData {
  earnedXP: number;
  leveledUp: boolean;
  newLevel: number;
}

interface AppContextType {
  theme: Theme;
  language: Language;
  accent: AccentThemeId;
  soundEnabled: boolean;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setAccent: (accent: AccentThemeId) => void;
  setSoundEnabled: (enabled: boolean) => void;
  // Workout session tracking
  workoutSession: WorkoutSessionData[];
  addWorkoutToSession: (data: WorkoutSessionData) => void;
  clearWorkoutSession: () => void;
}

const AppContext = createContext<AppContextType>({
  theme: Theme.DARK,
  language: Language.EN,
  accent: DEFAULT_ACCENT,
  soundEnabled: true,
  toggleTheme: () => {},
  setLanguage: () => {},
  setAccent: () => {},
  setSoundEnabled: () => {},
  workoutSession: [],
  addWorkoutToSession: () => {},
  clearWorkoutSession: () => {},
});

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(Theme.DARK);
  const [language, setLanguageState] = useState<Language>(Language.EN);
  const [accent, setAccentState] = useState<AccentThemeId>(DEFAULT_ACCENT);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSessionData[]>(
    [],
  );

  useEffect(() => {
    // Load saved preferences
    const loadPreferences = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        const savedLanguage = await AsyncStorage.getItem("language");
        const savedAccent = await AsyncStorage.getItem("accent");
        const savedSound = await AsyncStorage.getItem("soundEnabled");

        if (savedTheme) setTheme(savedTheme as Theme);
        if (savedLanguage) setLanguageState(savedLanguage as Language);
        if (savedAccent && savedAccent in AccentThemes) {
          setAccentState(savedAccent as AccentThemeId);
        }
        if (savedSound !== null) {
          setSoundEnabledState(savedSound === "true");
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsReady(true);
      }
    };

    loadPreferences();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem("language", lang);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  const setAccent = async (next: AccentThemeId) => {
    setAccentState(next);
    try {
      await AsyncStorage.setItem("accent", next);
    } catch (error) {
      console.error("Failed to save accent:", error);
    }
  };

  const setSoundEnabled = async (enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      await AsyncStorage.setItem("soundEnabled", String(enabled));
    } catch (error) {
      console.error("Failed to save sound setting:", error);
    }
  };

  const addWorkoutToSession = (data: WorkoutSessionData) => {
    setWorkoutSession((prev) => [...prev, data]);
  };

  const clearWorkoutSession = () => {
    setWorkoutSession([]);
  };

  if (!isReady) {
    return null; // or a loading screen
  }

  return (
    <AppContext.Provider
      value={{
        theme,
        language,
        accent,
        soundEnabled,
        toggleTheme,
        setLanguage,
        setAccent,
        setSoundEnabled,
        workoutSession,
        addWorkoutToSession,
        clearWorkoutSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
