import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Language = "en" | "ar";

interface AppContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
}

const AppContext = createContext<AppContextType>({
  theme: "dark",
  language: "en",
  toggleTheme: () => {},
  setLanguage: () => {},
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
  const [theme, setTheme] = useState<Theme>("dark");
  const [language, setLanguageState] = useState<Language>("en");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const loadPreferences = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        const savedLanguage = await AsyncStorage.getItem("language");

        if (savedTheme) setTheme(savedTheme as Theme);
        if (savedLanguage) setLanguageState(savedLanguage as Language);
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsReady(true);
      }
    };

    loadPreferences();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
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

  if (!isReady) {
    return null; // or a loading screen
  }

  return (
    <AppContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        setLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
