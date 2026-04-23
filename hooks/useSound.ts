import { useApp } from "@/contexts/AppContext";
import { useAudioPlayer } from "expo-audio";

export const useSound = () => {
  const { soundEnabled } = useApp();

  const xpPlayer = useAudioPlayer(require("@/assets/sounds/xp-gain.mp3"));
  const levelUpPlayer = useAudioPlayer(require("@/assets/sounds/level-up.mp3"));
  const milestonePlayer = useAudioPlayer(
    require("@/assets/sounds/milestone.mp3"),
  );
  const exerciseDonePlayer = useAudioPlayer(
    require("@/assets/sounds/exercise-done.mp3"),
  );
  const countdownPlayer = useAudioPlayer(
    require("@/assets/sounds/countdown.mp3"),
  );
  const streakPlayer = useAudioPlayer(require("@/assets/sounds/streak.mp3"));

  const play = async (player: any) => {
    if (!soundEnabled) return;
    try {
      await player.seekTo(0);
      player.play();
    } catch {}
  };

  const playXPSound = async () => play(xpPlayer);
  const playLevelUpSound = async () => play(levelUpPlayer);
  const playMilestoneSound = async () => play(milestonePlayer);
  const playExerciseDoneSound = async () => play(exerciseDonePlayer);
  const playCountdownSound = async () => play(countdownPlayer);
  const playStreakSound = async () => play(streakPlayer);

  return {
    playXPSound,
    playLevelUpSound,
    playMilestoneSound,
    playExerciseDoneSound,
    playCountdownSound,
    playStreakSound,
  };
};
