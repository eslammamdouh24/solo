// Centralized enums and constants — no hardcoded strings in code
// Import these everywhere instead of using string literals

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  BOTH = "both",
}

export enum Language {
  EN = "en",
  AR = "ar",
}

export enum Theme {
  DARK = "dark",
  LIGHT = "light",
}

export enum Difficulty {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
}

export enum MuscleGroup {
  CHEST = "chest",
  BACK = "back",
  LEGS = "legs",
  SHOULDERS = "shoulders",
  BICEPS = "biceps",
  TRICEPS = "triceps",
  ABS = "abs",
  FOREARMS = "forearms",
}

// Extended groups used in stat calculations
export enum ActivityGroup {
  CHEST = "chest",
  BACK = "back",
  LEGS = "legs",
  SHOULDERS = "shoulders",
  BICEPS = "biceps",
  TRICEPS = "triceps",
  ABS = "abs",
  FOREARMS = "forearms",
  CARDIO = "cardio",
  STRETCHING = "stretching",
}

export enum Equipment {
  BARBELL = "Barbell",
  DUMBBELLS = "Dumbbells",
  BODYWEIGHT = "Bodyweight",
  MACHINE = "Machine",
  KETTLEBELL = "Kettlebell",
  CABLE = "Cable",
  EZ_BAR = "EZ Bar",
  SMITH_MACHINE = "Smith Machine",
  BAND = "Band",
  MEDICINE_BALL = "Medicine Ball",
  STABILITY_BALL = "Stability Ball",
  WEIGHTED = "Weighted",
  OLYMPIC_BARBELL = "Olympic Barbell",
  TRAP_BAR = "Trap Bar",
  BOSU_BALL = "Bosu Ball",
  ROLLER = "Roller",
  OTHER = "Other",
}

// Platform helper
import { Platform } from "react-native";
export const isWeb = Platform.OS === "web";
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const useNativeDriver = !isWeb;

// RTL helper
export const isRTL = (language: Language | string) => language === Language.AR;
