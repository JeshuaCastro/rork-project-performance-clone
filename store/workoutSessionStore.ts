import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { 
  WorkoutSession, 
  TrackedWorkoutExercise, 
  WorkoutSet, 
  ProgressiveOverloadData,
  WorkoutPerformance 
} from '@/types/exercises';

const WORKOUT_SESSION_KEY = 'workout_session';
const PROGRESSIVE_OVERLOAD_KEY = 'progressive_overload_data';

export const [WorkoutSessionProvider, useWorkoutSession] = createContextHook(() => {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [progressiveOverloadData, setProgressiveOverloadData] = useState<Record<string, ProgressiveOverloadData>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted session on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      setIsLoading(true);
      
      // Load current session
      const sessionData = await AsyncStorage.getItem(WORKOUT_SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData) as WorkoutSession;
        setCurrentSession(session);
      }

      // Load progressive overload data
      const overloadData = await AsyncStorage.getItem(PROGRESSIVE_OVERLOAD_KEY);
      if (overloadData) {
        const data = JSON.parse(overloadData) as Record<string, ProgressiveOverloadData>;
        setProgressiveOverloadData(data);
      }
    } catch (error) {
      console.error('Error loading persisted workout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persistSession = async (session: WorkoutSession | null) => {
    try {
      if (session) {
        await AsyncStorage.setItem(WORKOUT_SESSION_KEY, JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem(WORKOUT_SESSION_KEY);
      }
    } catch (error) {
      console.error('Error persisting workout session:', error);
    }
  };

  const persistProgressiveOverloadData = async (data: Record<string, ProgressiveOverloadData>) => {
    try {
      await AsyncStorage.setItem(PROGRESSIVE_OVERLOAD_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error persisting progressive overload data:', error);
    }
  };

  const startWorkoutSession = useCallback((
    workoutId: string, 
    exercises: TrackedWorkoutExercise[], 
    programId?: string,
    workoutTitle?: string,
    exerciseNameMap?: Record<string, string>
  ) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = 'current_user';
    
    const newSession: WorkoutSession = {
      id: sessionId,
      workoutId,
      programId,
      userId,
      startTime: new Date().toISOString(),
      status: 'in_progress',
      exercises: exercises.map(exercise => {
        // Check if this is a cardio exercise
        const isCardio = exercise.duration || 
          (exerciseNameMap && exerciseNameMap[exercise.exerciseId]?.toLowerCase().includes('run')) ||
          (exerciseNameMap && exerciseNameMap[exercise.exerciseId]?.toLowerCase().includes('bike')) ||
          (exerciseNameMap && exerciseNameMap[exercise.exerciseId]?.toLowerCase().includes('swim')) ||
          (exerciseNameMap && exerciseNameMap[exercise.exerciseId]?.toLowerCase().includes('walk'));
        
        // For cardio exercises, create a single dummy set if no sets exist
        let sets = exercise.sets;
        if (isCardio && (!sets || sets.length === 0)) {
          sets = [{
            setNumber: 1,
            targetReps: 1, // Dummy value for cardio
            completed: false
          }];
        }
        
        return {
          ...exercise,
          sets: sets.map((set, index) => ({
            ...set,
            setNumber: index + 1,
            completed: false
          }))
        };
      }),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      workoutTitle,
      exerciseNameMap
    };

    setCurrentSession(newSession);
    persistSession(newSession);
    return newSession;
  }, []);

  const updateCurrentSet = useCallback((setData: Partial<WorkoutSet>) => {
    if (!currentSession) return;

    const updatedSession = { ...currentSession };
    const currentExercise = updatedSession.exercises[updatedSession.currentExerciseIndex];
    const currentSet = currentExercise.sets[updatedSession.currentSetIndex];

    // Update the current set
    updatedSession.exercises[updatedSession.currentExerciseIndex].sets[updatedSession.currentSetIndex] = {
      ...currentSet,
      ...setData
    };

    // Update completion status
    const updatedExercise = updatedSession.exercises[updatedSession.currentExerciseIndex];
    updatedExercise.completedSets = updatedExercise.sets.filter(set => set.completed).length;
    updatedExercise.isCompleted = updatedExercise.completedSets === updatedExercise.totalSets;

    setCurrentSession(updatedSession);
    persistSession(updatedSession);
  }, [currentSession]);

  const updateProgressiveOverloadData = (completedSession: WorkoutSession) => {
    const updatedData = { ...progressiveOverloadData };

    completedSession.exercises.forEach(exercise => {
      const exerciseId = exercise.exerciseId;
      
      if (!updatedData[exerciseId]) {
        updatedData[exerciseId] = {
          exerciseId,
          userId: completedSession.userId,
          history: [],
          personalRecords: [],
          progressionTrend: 'improving',
          lastUpdated: new Date().toISOString()
        };
      }

      // Calculate performance metrics
      const completedSets = exercise.sets.filter(set => set.completed);
      const totalVolume = completedSets.reduce((sum, set) => {
        return sum + (set.actualWeight || 0) * (set.actualReps || 0);
      }, 0);
      const averageRPE = completedSets.reduce((sum, set) => sum + (set.actualRPE || 0), 0) / completedSets.length;

      const performance: WorkoutPerformance = {
        date: completedSession.startTime.split('T')[0],
        sessionId: completedSession.id,
        sets: completedSets,
        totalVolume,
        averageRPE,
        notes: exercise.exerciseNotes
      };

      updatedData[exerciseId].history.push(performance);
      updatedData[exerciseId].lastUpdated = new Date().toISOString();

      // Update progression trend (simplified logic)
      const recentHistory = updatedData[exerciseId].history.slice(-3);
      if (recentHistory.length >= 2) {
        const isImproving = recentHistory[recentHistory.length - 1].totalVolume > recentHistory[0].totalVolume;
        updatedData[exerciseId].progressionTrend = isImproving ? 'improving' : 'plateauing';
      }
    });

    setProgressiveOverloadData(updatedData);
    persistProgressiveOverloadData(updatedData);
  };

  const memoizedFunctions = useMemo(() => ({
    startWorkoutSession,
    updateCurrentSet
  }), [startWorkoutSession, updateCurrentSet]);

  const completeCurrentSet = useCallback((actualReps: number, actualWeight?: number, actualRPE?: number, notes?: string) => {
    if (!currentSession) return;

    const setData: Partial<WorkoutSet> = {
      actualReps,
      actualWeight,
      actualRPE,
      notes,
      completed: true,
      endTime: new Date().toISOString()
    };

    memoizedFunctions.updateCurrentSet(setData);
    
    // Move to next set or exercise
    moveToNextSet();
  }, [currentSession, memoizedFunctions]);

  const moveToNextSet = useCallback(() => {
    if (!currentSession) return;

    const updatedSession = { ...currentSession };
    const currentExercise = updatedSession.exercises[updatedSession.currentExerciseIndex];
    
    // Check if this is a cardio exercise
    const isCardio = currentExercise.duration || 
      (updatedSession.exerciseNameMap && updatedSession.exerciseNameMap[currentExercise.exerciseId]?.toLowerCase().includes('run')) ||
      (updatedSession.exerciseNameMap && updatedSession.exerciseNameMap[currentExercise.exerciseId]?.toLowerCase().includes('bike')) ||
      (updatedSession.exerciseNameMap && updatedSession.exerciseNameMap[currentExercise.exerciseId]?.toLowerCase().includes('swim')) ||
      (updatedSession.exerciseNameMap && updatedSession.exerciseNameMap[currentExercise.exerciseId]?.toLowerCase().includes('walk'));
    
    // For cardio exercises, mark the single set as completed and move to next exercise
    if (isCardio) {
      // Mark current set as completed
      updatedSession.exercises[updatedSession.currentExerciseIndex].sets[updatedSession.currentSetIndex].completed = true;
      updatedSession.exercises[updatedSession.currentExerciseIndex].sets[updatedSession.currentSetIndex].endTime = new Date().toISOString();
      
      // Update completion status
      const updatedExercise = updatedSession.exercises[updatedSession.currentExerciseIndex];
      updatedExercise.completedSets = updatedExercise.sets.filter(set => set.completed).length;
      updatedExercise.isCompleted = true; // Cardio exercises are completed after one "set"
      
      // Move to next exercise
      if (updatedSession.currentExerciseIndex < updatedSession.exercises.length - 1) {
        updatedSession.currentExerciseIndex += 1;
        updatedSession.currentSetIndex = 0;
      } else {
        // Workout completed
        completeWorkoutSession();
        return;
      }
    } else {
      // For strength exercises, follow normal set progression
      if (updatedSession.currentSetIndex < currentExercise.sets.length - 1) {
        updatedSession.currentSetIndex += 1;
      } else {
        // Move to next exercise
        if (updatedSession.currentExerciseIndex < updatedSession.exercises.length - 1) {
          updatedSession.currentExerciseIndex += 1;
          updatedSession.currentSetIndex = 0;
        } else {
          // Workout completed
          completeWorkoutSession();
          return;
        }
      }
    }

    setCurrentSession(updatedSession);
    persistSession(updatedSession);
  }, [currentSession]);

  const completeWorkoutSession = useCallback(() => {
    if (!currentSession) return;

    const completedSession: WorkoutSession = {
      ...currentSession,
      status: 'completed',
      endTime: new Date().toISOString(),
      totalDuration: Math.floor((new Date().getTime() - new Date(currentSession.startTime).getTime()) / 1000)
    };

    // Update progressive overload data
    updateProgressiveOverloadData(completedSession);

    // Clear current session
    setCurrentSession(null);
    persistSession(null);

    return completedSession;
  }, [currentSession, progressiveOverloadData]);

  const pauseWorkoutSession = useCallback(() => {
    if (!currentSession) return;

    const pausedSession = {
      ...currentSession,
      status: 'paused' as const
    };

    setCurrentSession(pausedSession);
    persistSession(pausedSession);
  }, [currentSession]);

  const resumeWorkoutSession = useCallback(() => {
    if (!currentSession) return;

    const resumedSession = {
      ...currentSession,
      status: 'in_progress' as const
    };

    setCurrentSession(resumedSession);
    persistSession(resumedSession);
  }, [currentSession]);

  const cancelWorkoutSession = useCallback(() => {
    if (!currentSession) return;

    const cancelledSession = {
      ...currentSession,
      status: 'cancelled' as const,
      endTime: new Date().toISOString()
    };

    setCurrentSession(null);
    persistSession(null);

    return cancelledSession;
  }, [currentSession]);

  const getExerciseHistory = useCallback((exerciseId: string): WorkoutPerformance[] => {
    return progressiveOverloadData[exerciseId]?.history || [];
  }, [progressiveOverloadData]);

  const getRecommendedWeight = useCallback((exerciseId: string): number | undefined => {
    const data = progressiveOverloadData[exerciseId];
    if (!data || data.history.length === 0) return undefined;

    const lastPerformance = data.history[data.history.length - 1];
    const lastSet = lastPerformance.sets[lastPerformance.sets.length - 1];
    
    // Simple progression: if last set was completed with good RPE, increase weight
    if (lastSet.actualRPE && lastSet.actualRPE <= 7 && lastSet.actualWeight) {
      return lastSet.actualWeight + 2.5; // Increase by 2.5 lbs
    }
    
    return lastSet.actualWeight;
  }, [progressiveOverloadData]);

  return useMemo(() => ({
    // State
    currentSession,
    progressiveOverloadData,
    isLoading,
    
    // Session management
    startWorkoutSession: memoizedFunctions.startWorkoutSession,
    completeWorkoutSession,
    pauseWorkoutSession,
    resumeWorkoutSession,
    cancelWorkoutSession,
    
    // Set tracking
    updateCurrentSet: memoizedFunctions.updateCurrentSet,
    completeCurrentSet,
    moveToNextSet,
    
    // Progressive overload
    getExerciseHistory,
    getRecommendedWeight,
    
    // Computed values
    isWorkoutActive: currentSession?.status === 'in_progress',
    isWorkoutPaused: currentSession?.status === 'paused',
    currentExercise: currentSession ? currentSession.exercises[currentSession.currentExerciseIndex] : null,
    currentSet: currentSession ? currentSession.exercises[currentSession.currentExerciseIndex]?.sets[currentSession.currentSetIndex] : null,
    workoutProgress: currentSession ? {
      completedExercises: currentSession.exercises.filter(ex => ex.isCompleted).length,
      totalExercises: currentSession.exercises.length,
      completedSets: currentSession.exercises.reduce((sum, ex) => sum + ex.completedSets, 0),
      totalSets: currentSession.exercises.reduce((sum, ex) => sum + ex.totalSets, 0)
    } : null
  }), [
    currentSession,
    progressiveOverloadData,
    isLoading,
    memoizedFunctions,
    completeWorkoutSession,
    pauseWorkoutSession,
    resumeWorkoutSession,
    cancelWorkoutSession,
    completeCurrentSet,
    moveToNextSet,
    getExerciseHistory,
    getRecommendedWeight
  ]);
});