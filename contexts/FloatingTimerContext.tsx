import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

interface FloatingTimerContextType {
  seconds: number;
  running: boolean;
  exerciseName: string | null;
  exerciseRoute: { muscle: string; exerciseId: string } | null;
  isMinimized: boolean;
  startTimer: (name: string, muscle: string, exerciseId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  minimize: () => void;
  maximize: () => void;
  reset: () => void;
}

const FloatingTimerContext = createContext<
  FloatingTimerContextType | undefined
>(undefined);

export const useFloatingTimer = () => {
  const context = useContext(FloatingTimerContext);
  if (!context) {
    throw new Error(
      "useFloatingTimer must be used within a FloatingTimerProvider",
    );
  }
  return context;
};

export const FloatingTimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const [exerciseRoute, setExerciseRoute] = useState<{
    muscle: string;
    exerciseId: string;
  } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running]);

  const startTimer = (name: string, muscle: string, exerciseId: string) => {
    setExerciseName(name);
    setExerciseRoute({ muscle, exerciseId });
    setSeconds(0);
    setRunning(true);
    setIsMinimized(false);
  };

  const pauseTimer = () => {
    setRunning(false);
  };

  const resumeTimer = () => {
    setRunning(true);
  };

  const stopTimer = () => {
    setRunning(false);
    setSeconds(0);
    setExerciseName(null);
    setExerciseRoute(null);
    setIsMinimized(false);
  };

  const minimize = () => {
    setIsMinimized(true);
  };

  const maximize = () => {
    setIsMinimized(false);
  };

  const reset = () => {
    setSeconds(0);
    setRunning(false);
  };

  return (
    <FloatingTimerContext.Provider
      value={{
        seconds,
        running,
        exerciseName,
        exerciseRoute,
        isMinimized,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        minimize,
        maximize,
        reset,
      }}
    >
      {children}
    </FloatingTimerContext.Provider>
  );
};
