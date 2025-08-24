import { WorkoutExercise } from '@/types/exercises';

// Helper function to convert existing workout descriptions to structured exercises
export const parseWorkoutToExercises = (workoutTitle: string, workoutDescription: string): WorkoutExercise[] => {
  const exercises: WorkoutExercise[] = [];
  
  // Map common workout titles and descriptions to exercise IDs
  const exerciseMapping: Record<string, string[]> = {
    // Exact matches for titles
    'Push-Up': ['push-up'],
    'Squat': ['squat'],
    'Plank': ['plank'],
    'Bench Press': ['bench-press'],
    'Deadlift': ['deadlift'],
    'Overhead Press': ['overhead-press'],
    'Deadlift Focus': ['deadlift'],
    'Upper Body': ['bench-press', 'dumbbell-row', 'overhead-press'],
    'Lower Body': ['squat', 'deadlift', 'lunge'],
    'Full Body': ['squat', 'deadlift', 'bench-press', 'dumbbell-row'],
    
    // Workout type matches
    'Push Day': ['bench-press', 'overhead-press', 'push-up'],
    'Pull Day': ['dumbbell-row'],
    'Leg Day': ['squat', 'deadlift', 'lunge'],
    'Upper Body Push': ['bench-press', 'overhead-press', 'push-up'],
    'Upper Body Pull': ['dumbbell-row'],
    'HIIT': ['jumping-jacks', 'mountain-climbers', 'burpee'],
    'Cardio': ['jumping-jacks', 'mountain-climbers'],
    'Strength': ['squat', 'deadlift', 'bench-press'],
    'Core': ['plank'],
    'Recovery': [], // No specific exercises for recovery
  };

  // Try to match workout title to exercises (exact matches first)
  let matchedExercises: string[] = [];
  
  // First try exact title matches
  for (const [key, exerciseIds] of Object.entries(exerciseMapping)) {
    if (workoutTitle.toLowerCase() === key.toLowerCase() || 
        workoutTitle.toLowerCase().includes(key.toLowerCase())) {
      matchedExercises = [...exerciseIds];
      break;
    }
  }
  
  // If no title match, try description matches
  if (matchedExercises.length === 0) {
    for (const [key, exerciseIds] of Object.entries(exerciseMapping)) {
      if (workoutDescription.toLowerCase().includes(key.toLowerCase())) {
        matchedExercises = [...exerciseIds];
        break;
      }
    }
  }

  // If no direct match, try to parse individual exercises from description
  if (matchedExercises.length === 0) {
    const description = workoutDescription.toLowerCase();
    const title = workoutTitle.toLowerCase();
    const combined = `${title} ${description}`;
    
    // Look for specific exercise mentions
    if (combined.includes('bench press') || combined.includes('bench-press') || combined.includes('bench')) {
      matchedExercises.push('bench-press');
    }
    if (combined.includes('deadlift')) {
      matchedExercises.push('deadlift');
    }
    if (combined.includes('overhead press') || combined.includes('shoulder press') || combined.includes('press')) {
      // Only add overhead press if bench press isn't already there
      if (!matchedExercises.includes('bench-press')) {
        matchedExercises.push('overhead-press');
      }
    }
    if (combined.includes('squat')) {
      matchedExercises.push('squat');
    }
    if (combined.includes('row')) {
      matchedExercises.push('dumbbell-row');
    }
    if (combined.includes('lunge')) {
      matchedExercises.push('lunge');
    }
    if (combined.includes('push-up') || combined.includes('push up')) {
      matchedExercises.push('push-up');
    }
    if (combined.includes('plank')) {
      matchedExercises.push('plank');
    }
    if (combined.includes('jumping jack')) {
      matchedExercises.push('jumping-jacks');
    }
    if (combined.includes('mountain climber')) {
      matchedExercises.push('mountain-climbers');
    }
    if (combined.includes('burpee')) {
      matchedExercises.push('burpee');
    }
    
    // If still no matches, infer from workout type
    if (matchedExercises.length === 0) {
      if (combined.includes('upper body') || combined.includes('upper-body')) {
        matchedExercises.push('bench-press', 'dumbbell-row', 'overhead-press');
      } else if (combined.includes('lower body') || combined.includes('lower-body') || combined.includes('leg')) {
        matchedExercises.push('squat', 'deadlift', 'lunge');
      } else if (combined.includes('full body') || combined.includes('full-body')) {
        matchedExercises.push('squat', 'deadlift', 'bench-press');
      } else if (combined.includes('strength')) {
        matchedExercises.push('squat', 'deadlift', 'bench-press');
      } else if (combined.includes('cardio') || combined.includes('hiit')) {
        matchedExercises.push('jumping-jacks', 'mountain-climbers', 'burpee');
      }
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

  // If no exercises found, create a generic one based on workout type
  if (exercises.length === 0) {
    const combined = `${workoutTitle} ${workoutDescription}`.toLowerCase();
    let fallbackExercise = 'squat'; // Default fallback
    
    if (combined.includes('upper') || combined.includes('chest') || combined.includes('arm')) {
      fallbackExercise = 'bench-press';
    } else if (combined.includes('cardio') || combined.includes('run')) {
      fallbackExercise = 'jumping-jacks';
    } else if (combined.includes('core') || combined.includes('ab')) {
      fallbackExercise = 'plank';
    }
    
    exercises.push({
      exerciseId: fallbackExercise,
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