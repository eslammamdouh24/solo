import { Difficulty, Gender } from "@/constants/enums";
import { EXERCISES, Exercise, MuscleGroup } from "@/constants/exercises";

const difficultyOrder = {
  [Difficulty.BEGINNER]: 1,
  [Difficulty.INTERMEDIATE]: 2,
  [Difficulty.ADVANCED]: 3,
};

export const getExercisesByMuscle = (
  muscle: MuscleGroup,
  userGender?: string,
) => {
  let exercises = [...EXERCISES[muscle]];

  // Filter by gender: show "both" + matching gender exercises
  if (userGender === Gender.MALE || userGender === Gender.FEMALE) {
    exercises = exercises.filter(
      (e) => e.gender === Gender.BOTH || e.gender === userGender,
    );
  }

  // Sort exercises by difficulty level (Beginner -> Intermediate -> Advanced)
  return exercises.sort((a, b) => {
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });
};

export const getExerciseById = (
  muscle: MuscleGroup,
  exerciseId: string,
): Exercise | null => {
  return (
    EXERCISES[muscle].find((exercise) => exercise.id === exerciseId) ?? null
  );
};

export type { Exercise, MuscleGroup };
