import { useAudioPlayer } from "expo-audio";

export const useSound = () => {
  const xpPlayer = useAudioPlayer(require("@/assets/sounds/xp-gain.mp3"));
  const levelUpPlayer = useAudioPlayer(require("@/assets/sounds/level-up.mp3"));

  const playXPSound = async () => {
    try {
      await xpPlayer.seekTo(0);
      xpPlayer.play();
    } catch {}
  };

  const playLevelUpSound = async () => {
    try {
      await levelUpPlayer.seekTo(0);
      levelUpPlayer.play();
    } catch {}
  };

  return { playXPSound, playLevelUpSound };
};
