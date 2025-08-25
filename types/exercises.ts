export type MuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'cardio'
  | 'full-body';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type EquipmentType = 
  | 'bodyweight'
  | 'dumbbells'
  | 'barbell'
  | 'resistance-bands'
  | 'kettlebell'
  | 'machine'
  | 'cardio-equipment'
  | 'yoga-mat'
  | 'bench';

export interface ExerciseStep {
  stepNumber: number;
  instruction: string;
  tip?: string;
  commonMistake?: string;
}

export interface ExerciseModification {
  level: 'easier' | 'harder';
  description: string;
  instruction: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  description: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  difficulty: DifficultyLevel;
  equipment: EquipmentType[];
  instructions: ExerciseStep[];
  formTips: string[];
  commonMistakes: string[];
  modifications: ExerciseModification[];
  safetyNotes: string[];
  videoUrl?: string;
  imageUrl?: string;
  demonstrationImageUrl?: string; // URL for exercise demonstration image/gif
  estimatedDuration?: string; // e.g., "30 seconds", "10 reps"
  caloriesPerMinute?: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets?: number;
  reps?: number | string; // Can be "8-12" or "AMRAP"
  duration?: string; // For time-based exercises
  weight?: string; // "bodyweight", "15 lbs", "moderate"
  restTime?: string; // "60 seconds", "2 minutes"
  notes?: string;
  targetRPE?: number; // Rate of Perceived Exertion 1-10
}

export interface ExerciseProgression {
  exerciseId: string;
  week: number;
  sets: number;
  reps: number | string;
  weight?: string;
  notes?: string;
}

// Set-by-set tracking data structure
export interface WorkoutSet {
  setNumber: number;
  targetReps: number | string; // Can be "8-12" or specific number
  actualReps?: number;
  targetWeight?: number;
  actualWeight?: number;
  targetRPE?: number;
  actualRPE?: number;
  restTime?: number; // in seconds
  completed: boolean;
  startTime?: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  notes?: string;
}

// Enhanced workout exercise with set tracking
export interface TrackedWorkoutExercise extends Omit<WorkoutExercise, 'sets'> {
  sets: WorkoutSet[];
  totalSets: number;
  completedSets: number;
  isCompleted: boolean;
  startTime?: string;
  endTime?: string;
  exerciseNotes?: string;
}

// Workout session state for active workouts
export interface WorkoutSession {
  id: string;
  workoutId: string;
  programId?: string;
  userId: string;
  startTime: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  exercises: TrackedWorkoutExercise[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  totalDuration?: number; // in seconds
  notes?: string;
  whoopData?: {
    preWorkoutRecovery?: number;
    postWorkoutStrain?: number;
    heartRateData?: number[];
  };
}

// Progressive overload tracking
export interface ProgressiveOverloadData {
  exerciseId: string;
  userId: string;
  history: WorkoutPerformance[];
  personalRecords: PersonalRecord[];
  progressionTrend: 'improving' | 'plateauing' | 'declining';
  nextRecommendedWeight?: number;
  nextRecommendedReps?: number;
  lastUpdated: string;
}

export interface WorkoutPerformance {
  date: string;
  sessionId: string;
  sets: WorkoutSet[];
  totalVolume: number; // weight * reps * sets
  averageRPE: number;
  oneRepMaxEstimate?: number;
  notes?: string;
}

export interface PersonalRecord {
  type: '1RM' | 'volume' | 'reps' | 'endurance';
  value: number;
  date: string;
  sessionId: string;
  notes?: string;
}

// For tracking completed exercises (legacy - keeping for backward compatibility)
export interface CompletedExercise {
  exerciseId: string;
  date: string;
  sets: number;
  reps: number[];
  weight?: number[];
  duration?: number; // in seconds
  rpe?: number; // Rate of Perceived Exertion
  notes?: string;
}