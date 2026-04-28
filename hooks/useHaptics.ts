import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const useHaptics = () => {
  const isNative = Platform.OS !== "web";

  const light = () => {
    if (isNative) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const medium = () => {
    if (isNative) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const heavy = () => {
    if (isNative) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const success = () => {
    if (isNative) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const warning = () => {
    if (isNative) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const error = () => {
    if (isNative) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const selection = () => {
    if (isNative) {
      Haptics.selectionAsync();
    }
  };

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
  };
};
