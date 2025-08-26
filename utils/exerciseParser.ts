import { WorkoutExercise } from '@/types/exercises';
import { exerciseDatabase } from '@/constants/exerciseDatabase';

// Enhanced exercise keyword mapping for better AI workout parsing
const exerciseKeywordMap: Record<string, string[]> = {
  // Strength exercises with multiple keyword variations
  'bench-press': [
    'bench press', 'bench-press', 'bench pressing', 'chest press', 
    'barbell bench', 'dumbbell bench', 'pressing movement', 'horizontal press'
  ],
  'squat': [
    'squat', 'squats', 'squatting', 'bodyweight squat', 'air squat',
    'back squat', 'front squat', 'goblet squat', 'leg exercise'
  ],
  'deadlift': [
    'deadlift', 'deadlifts', 'deadlifting', 'romanian deadlift', 'rdl',
    'conventional deadlift', 'sumo deadlift', 'hip hinge'
  ],
  'overhead-press': [
    'overhead press', 'shoulder press', 'military press', 'standing press',
    'dumbbell press', 'barbell press', 'vertical press', 'pressing overhead'
  ],
  'dumbbell-row': [
    'row', 'rows', 'rowing', 'dumbbell row', 'bent-over row', 'single-arm row',
    'barbell row', 'cable row', 'pulling movement', 'back exercise'
  ],
  'push-up': [
    'push-up', 'push up', 'pushup', 'push ups', 'bodyweight push',
    'chest exercise', 'upper body push'
  ],
  'lunge': [
    'lunge', 'lunges', 'lunging', 'forward lunge', 'reverse lunge',
    'walking lunge', 'stationary lunge', 'leg exercise'
  ],
  'plank': [
    'plank', 'planks', 'planking', 'forearm plank', 'core exercise',
    'isometric hold', 'core stability'
  ],
  
  // Cardio exercises
  'jumping-jacks': [
    'jumping jacks', 'jumping jack', 'star jumps', 'cardio exercise',
    'full body cardio', 'plyometric'
  ],
  'mountain-climbers': [
    'mountain climbers', 'mountain climber', 'mountain climbing',
    'cardio core', 'dynamic plank'
  ],
  'burpee': [
    'burpee', 'burpees', 'full body exercise', 'compound cardio',
    'high intensity exercise'
  ]
};

// Workout type to exercise mapping for broader categorization
const workoutTypeMapping: Record<string, string[]> = {
  'upper body': ['bench-press', 'dumbbell-row', 'overhead-press', 'push-up'],
  'lower body': ['squat', 'deadlift', 'lunge'],
  'full body': ['squat', 'deadlift', 'bench-press', 'dumbbell-row'],
  'push': ['bench-press', 'overhead-press', 'push-up'],
  'pull': ['dumbbell-row'],
  'legs': ['squat', 'deadlift', 'lunge'],
  'chest': ['bench-press', 'push-up'],
  'back': ['dumbbell-row', 'deadlift'],
  'shoulders': ['overhead-press'],
  'arms': ['bench-press', 'dumbbell-row', 'overhead-press'],
  'core': ['plank', 'mountain-climbers'],
  'cardio': ['easy-run', 'jumping-jacks', 'mountain-climbers', 'burpee'],
  'running': ['easy-run', 'tempo-run', 'interval-training', 'long-run'],
  'cycling': ['steady-state-cycling', 'cycling-intervals'],
  'endurance': ['easy-run', 'long-run', 'steady-state-cycling'],
  'aerobic': ['easy-run', 'steady-state-cycling'],
  'tempo': ['tempo-run'],
  'intervals': ['interval-training', 'cycling-intervals'],
  'speed work': ['interval-training'],
  'base building': ['easy-run', 'steady-state-cycling'],
  'hiit': ['jumping-jacks', 'mountain-climbers', 'burpee'],
  'strength': ['squat', 'deadlift', 'bench-press'],
  'compound': ['squat', 'deadlift', 'bench-press', 'dumbbell-row'],
};

// Helper function to convert existing workout descriptions to structured exercises
export const parseWorkoutToExercises = (workoutTitle: string, workoutDescription: string): WorkoutExercise[] => {
  const exercises: WorkoutExercise[] = [];
  const combined = `${workoutTitle} ${workoutDescription}`.toLowerCase();
  
  console.log('Parsing workout:', { title: workoutTitle, description: workoutDescription });

  // Step 1: Try to find specific exercises mentioned in the text using keyword matching
  let matchedExercises: string[] = [];
  
  // Enhanced keyword-based exercise detection
  for (const [exerciseId, keywords] of Object.entries(exerciseKeywordMap)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        if (!matchedExercises.includes(exerciseId)) {
          matchedExercises.push(exerciseId);
          console.log(`Found exercise '${exerciseId}' via keyword '${keyword}'`);
        }
      }
    }
  }
  
  // Step 2: If no specific exercises found, try workout type matching
  if (matchedExercises.length === 0) {
    for (const [workoutType, exerciseIds] of Object.entries(workoutTypeMapping)) {
      if (combined.includes(workoutType)) {
        matchedExercises = [...exerciseIds];
        console.log(`Found exercises via workout type '${workoutType}':`, exerciseIds);
        break;
      }
    }
  }
  
  // Step 3: Special handling for compound workout descriptions
  if (matchedExercises.length === 0) {
    // Handle AI-generated descriptions that mention multiple exercises
    if (combined.includes('compound movements') || combined.includes('compound exercise')) {
      matchedExercises = ['squat', 'deadlift', 'bench-press', 'dumbbell-row'];
    } else if (combined.includes('bodyweight') && combined.includes('strength')) {
      matchedExercises = ['push-up', 'squat', 'lunge', 'plank'];
    } else if (combined.includes('running') || combined.includes('run') || combined.includes('jog')) {
      // Running specificity
      if (combined.includes('tempo')) {
        matchedExercises = ['tempo-run'];
      } else if (combined.includes('interval') || combined.includes('repeats') || combined.includes('speed work')) {
        matchedExercises = ['interval-training'];
      } else if (combined.includes('long')) {
        matchedExercises = ['long-run'];
      } else if (combined.includes('easy') || combined.includes('recovery')) {
        matchedExercises = ['easy-run'];
      } else {
        matchedExercises = ['easy-run'];
      }
    } else if (combined.includes('cycling') || combined.includes('bike')) {
      // Cycling specificity
      if (combined.includes('interval')) {
        matchedExercises = ['cycling-intervals'];
      } else {
        matchedExercises = ['steady-state-cycling'];
      }
    } else if (combined.includes('swimming') || combined.includes('swim')) {
      // No swim in DB; default to cardio placeholder
      matchedExercises = ['jumping-jacks'];
    }
  }

  // Step 4: If still no matches, create a smart fallback based on workout characteristics
  if (matchedExercises.length === 0) {
    console.log('No specific exercises found, using intelligent fallback');
    
    if (combined.includes('upper') || combined.includes('chest') || combined.includes('arm') || combined.includes('shoulder')) {
      matchedExercises = ['bench-press', 'dumbbell-row', 'overhead-press'];
    } else if (combined.includes('lower') || combined.includes('leg') || combined.includes('glute') || combined.includes('quad') || combined.includes('hamstring')) {
      matchedExercises = ['squat', 'deadlift', 'lunge'];
    } else if (combined.includes('cardio') || combined.includes('endurance') || combined.includes('aerobic')) {
      matchedExercises = ['easy-run'];
    } else if (combined.includes('run') || combined.includes('jog')) {
      matchedExercises = ['easy-run'];
    } else if (combined.includes('cycle') || combined.includes('bike')) {
      matchedExercises = ['steady-state-cycling'];
    } else if (combined.includes('core') || combined.includes('ab') || combined.includes('stability')) {
      matchedExercises = ['plank'];
    } else if (combined.includes('strength') || combined.includes('resistance') || combined.includes('weight')) {
      matchedExercises = ['squat', 'bench-press', 'dumbbell-row'];
    } else {
      // Ultimate fallback - provide a balanced workout
      matchedExercises = ['squat', 'push-up'];
    }
  }
  
  console.log('Final matched exercises:', matchedExercises);
  
  // Convert to WorkoutExercise format with enhanced parameter extraction
  matchedExercises.forEach(exerciseId => {
    // Verify the exercise exists in our database
    const exerciseExists = exerciseDatabase.find(ex => ex.id === exerciseId);
    if (!exerciseExists) {
      console.warn(`Exercise '${exerciseId}' not found in database, skipping`);
      return;
    }
    
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

  // Ensure we always return at least one exercise
  if (exercises.length === 0) {
    console.log('Creating final fallback exercise');
    exercises.push({
      exerciseId: 'squat', // Safe fallback that exists in database
      notes: `${workoutTitle}: ${workoutDescription}`,
    });
  }

  console.log('Parsed exercises result:', exercises);
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