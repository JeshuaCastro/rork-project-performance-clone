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

// For tracking completed exercises
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