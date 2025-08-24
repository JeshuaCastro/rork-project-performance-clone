import { WorkoutExercise } from '@/types/exercises';

// Helper function to convert existing workout descriptions to structured exercises
export const parseWorkoutToExercises = (workoutTitle: string, workoutDescription: string): WorkoutExercise[] => {
  const exercises: WorkoutExercise[] = [];
  
  // Map common workout titles to exercise IDs
  const exerciseMapping: Record<string, string[]> = {
    'Push-Up': ['push-up'],
    'Squat': ['squat'],
    'Plank': ['plank'],
    'Core': ['plank'],
    'Upper Body Push': ['push-up', 'bench-press', 'overhead-press'],
    'Upper Body Pull': ['dumbbell-row'],
    'Full Body': ['squat', 'deadlift', 'burpee'],
    'HIIT': ['jumping-jacks', 'mountain-climbers', 'burpee'],
    'Cardio': ['jumping-jacks', 'mountain-climbers'],
    'Strength': ['squat', 'deadlift', 'bench-press'],
    'Bench Press': ['bench-press'],
    'Deadlift': ['deadlift'],
    'Overhead Press': ['overhead-press'],
    'Press': ['bench-press', 'overhead-press'],
    'Recovery': [], // No specific exercises for recovery
  };

  // Try to match workout title to exercises
  let matchedExercises: string[] = [];
  
  for (const [key, exerciseIds] of Object.entries(exerciseMapping)) {
    if (workoutTitle.toLowerCase().includes(key.toLowerCase())) {
      matchedExercises = exerciseIds;
      break;
    }
  }

  // If no direct match, try to parse from description
  if (matchedExercises.length === 0) {
    const description = workoutDescription.toLowerCase();
    
    if (description.includes('push-up') || description.includes('push up')) {
      matchedExercises.push('push-up');
    }
    if (description.includes('squat')) {
      matchedExercises.push('squat');
    }
    if (description.includes('plank')) {
      matchedExercises.push('plank');
    }
    if (description.includes('row')) {
      matchedExercises.push('dumbbell-row');
    }
    if (description.includes('lunge')) {
      matchedExercises.push('lunge');
    }
    if (description.includes('jumping jack')) {
      matchedExercises.push('jumping-jacks');
    }
    if (description.includes('mountain climber')) {
      matchedExercises.push('mountain-climbers');
    }
    if (description.includes('burpee')) {
      matchedExercises.push('burpee');
    }
    if (description.includes('bench press') || description.includes('bench-press')) {
      matchedExercises.push('bench-press');
    }
    if (description.includes('deadlift')) {
      matchedExercises.push('deadlift');
    }
    if (description.includes('overhead press') || description.includes('shoulder press')) {
      matchedExercises.push('overhead-press');
    }
  }

  // Convert to WorkoutExercise format
  matchedExercises.forEach(exerciseId => {
    const workoutExercise: WorkoutExercise = {
      exerciseId,
      sets: extractSets(workoutDescription),
      reps: extractReps(workoutDescription),
      duration: extractDuration(workoutDescription),
      weight: extractWeight(workoutDescription),
      restTime: extractRestTime(workoutDescription),
      notes: workoutDescription,
    };

    exercises.push(workoutExercise);
  });

  // If no exercises found, create a generic one
  if (exercises.length === 0) {
    exercises.push({
      exerciseId: 'squat', // Default fallback
      notes: workoutDescription,
    });
  }

  return exercises;
};

// Helper functions to extract workout parameters from description
const extractSets = (description: string): number | undefined => {
  const setsMatch = description.match(/(\d+)\s*(?:x|sets?)/i);
  return setsMatch ? parseInt(setsMatch[1]) : undefined;
};

const extractReps = (description: string): number | string | undefined => {
  const repsMatch = description.match(/(\d+(?:-\d+)?)\s*(?:reps?|repetitions?)/i);
  if (repsMatch) {
    return repsMatch[1].includes('-') ? repsMatch[1] : parseInt(repsMatch[1]);
  }
  
  // Look for sets x reps format (e.g., "3x8", "5x5")
  const setsRepsMatch = description.match(/\d+\s*x\s*(\d+(?:-\d+)?)/i);
  if (setsRepsMatch) {
    return setsRepsMatch[1].includes('-') ? setsRepsMatch[1] : parseInt(setsRepsMatch[1]);
  }
  
  return undefined;
};

const extractDuration = (description: string): string | undefined => {
  const durationMatch = description.match(/(\d+(?:-\d+)?)\s*(?:minutes?|mins?|seconds?|secs?)/i);
  return durationMatch ? durationMatch[0] : undefined;
};

const extractWeight = (description: string): string | undefined => {
  if (description.toLowerCase().includes('bodyweight')) {
    return 'bodyweight';
  }
  
  const weightMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilograms?)/i);
  return weightMatch ? weightMatch[0] : undefined;
};

const extractRestTime = (description: string): string | undefined => {
  const restMatch = description.match(/(?:rest|break)\s*(?:for\s*)?(\d+(?:-\d+)?)\s*(?:minutes?|mins?|seconds?|secs?)/i);
  return restMatch ? restMatch[1] + (restMatch[0].includes('min') ? ' minutes' : ' seconds') : undefined;
};

// Helper to determine target RPE based on intensity
export const getTargetRPE = (intensity: string): number | undefined => {
  switch (intensity.toLowerCase()) {
    case 'low':
    case 'very low':
      return 3;
    case 'medium-low':
      return 5;
    case 'medium':
      return 6;
    case 'medium-high':
      return 7;
    case 'high':
      return 8;
    default:
      return undefined;
  }
};