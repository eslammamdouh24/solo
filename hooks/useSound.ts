import { useAudioPlayer } from "expo-audio";
import { useEffect } from "react";

export const useSound = () => {
  const xpPlayer = useAudioPlayer(require("@/assets/sounds/xp-gain.mp3"));
  const levelUpPlayer = useAudioPlayer(require("@/assets/sounds/level-up.mp3"));

  useEffect(() => {
    console.log("[Solo] 🔊 Sound system ready (expo-audio)");

    return () => {
      // Cleanup handled automatically by useAudioPlayer
    };
  }, []);

  const playXPSound = async () => {
    try {
      await xpPlayer.seekTo(0);
      xpPlayer.play();
    } catch (error) {
      console.log("[Solo] Could not play XP sound:", error);
    }
  };

  const playLevelUpSound = async () => {
    try {
      await levelUpPlayer.seekTo(0);
      levelUpPlayer.play();
    } catch (error) {
      console.log("[Solo] Could not play level-up sound:", error);
    }
  };

  return { playXPSound, playLevelUpSound };
};
