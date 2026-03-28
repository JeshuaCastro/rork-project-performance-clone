import { ExerciseDefinition } from '@/types/exercises';
import { getExerciseById, searchExercisesByKeywords, getCardioFallbackExercise } from '@/constants/exerciseDatabase';

// WHOOP Activity Types - Based on WHOOP's official activity catalog
// These are the sport IDs that WHOOP uses in their API
export const WHOOP_ACTIVITY_TYPES = {
  // Strength Training
  FUNCTIONAL_FITNESS: 1,
  WEIGHTLIFTING: 2,
  POWERLIFTING: 3,
  BODYBUILDING: 4,
  CROSSFIT: 5,
  
  // Running
  RUNNING: 10,
  TRACK_RUNNING: 11,
  TREADMILL_RUNNING: 12,
  TRAIL_RUNNING: 13,
  
  // Cycling
  CYCLING: 20,
  INDOOR_CYCLING: 21,
  MOUNTAIN_BIKING: 22,
  ROAD_CYCLING: 23,
  
  // Swimming
  SWIMMING: 30,
  POOL_SWIMMING: 31,
  OPEN_WATER_SWIMMING: 32,
  
  // Combat Sports
  BOXING: 40,
  MARTIAL_ARTS: 41,
  MMA: 42,
  WRESTLING: 43,
  
  // Team Sports
  BASKETBALL: 50,
  FOOTBALL: 51,
  SOCCER: 52,
  TENNIS: 53,
  VOLLEYBALL: 54,
  
  // Other Cardio
  ROWING: 60,
  ELLIPTICAL: 61,
  STAIR_CLIMBING: 62,
  WALKING: 63,
  HIKING: 64,
  
  // Yoga & Recovery
  YOGA: 70,
  PILATES: 71,
  STRETCHING: 72,
  MEDITATION: 73,
  
  // High Intensity
  HIIT: 80,
  CIRCUIT_TRAINING: 81,
  BOOTCAMP: 82,
  
  // Other
  GENERAL_FITNESS: 90,
  ACTIVITY: 91,
  SPORT: 92
} as const;

// Reverse mapping for activity names
export const WHOOP_ACTIVITY_NAMES: Record<number, string> = {
  [WHOOP_ACTIVITY_TYPES.FUNCTIONAL_FITNESS]: 'Functional Fitness',
  [WHOOP_ACTIVITY_TYPES.WEIGHTLIFTING]: 'Weightlifting',
  [WHOOP_ACTIVITY_TYPES.POWERLIFTING]: 'Powerlifting',
  [WHOOP_ACTIVITY_TYPES.BODYBUILDING]: 'Bodybuilding',
  [WHOOP_ACTIVITY_TYPES.CROSSFIT]: 'CrossFit',
  
  [WHOOP_ACTIVITY_TYPES.RUNNING]: 'Running',
  [WHOOP_ACTIVITY_TYPES.TRACK_RUNNING]: 'Track Running',
  [WHOOP_ACTIVITY_TYPES.TREADMILL_RUNNING]: 'Treadmill Running',
  [WHOOP_ACTIVITY_TYPES.TRAIL_RUNNING]: 'Trail Running',
  
  [WHOOP_ACTIVITY_TYPES.CYCLING]: 'Cycling',
  [WHOOP_ACTIVITY_TYPES.INDOOR_CYCLING]: 'Indoor Cycling',
  [WHOOP_ACTIVITY_TYPES.MOUNTAIN_BIKING]: 'Mountain Biking',
  [WHOOP_ACTIVITY_TYPES.ROAD_CYCLING]: 'Road Cycling',
  
  [WHOOP_ACTIVITY_TYPES.SWIMMING]: 'Swimming',
  [WHOOP_ACTIVITY_TYPES.POOL_SWIMMING]: 'Pool Swimming',
  [WHOOP_ACTIVITY_TYPES.OPEN_WATER_SWIMMING]: 'Open Water Swimming',
  
  [WHOOP_ACTIVITY_TYPES.BOXING]: 'Boxing',
  [WHOOP_ACTIVITY_TYPES.MARTIAL_ARTS]: 'Martial Arts',
  [WHOOP_ACTIVITY_TYPES.MMA]: 'MMA',
  [WHOOP_ACTIVITY_TYPES.WRESTLING]: 'Wrestling',
  
  [WHOOP_ACTIVITY_TYPES.BASKETBALL]: 'Basketball',
  [WHOOP_ACTIVITY_TYPES.FOOTBALL]: 'Football',
  [WHOOP_ACTIVITY_TYPES.SOCCER]: 'Soccer',
  [WHOOP_ACTIVITY_TYPES.TENNIS]: 'Tennis',
  [WHOOP_ACTIVITY_TYPES.VOLLEYBALL]: 'Volleyball',
  
  [WHOOP_ACTIVITY_TYPES.ROWING]: 'Rowing',
  [WHOOP_ACTIVITY_TYPES.ELLIPTICAL]: 'Elliptical',
  [WHOOP_ACTIVITY_TYPES.STAIR_CLIMBING]: 'Stair Climbing',
  [WHOOP_ACTIVITY_TYPES.WALKING]: 'Walking',
  [WHOOP_ACTIVITY_TYPES.HIKING]: 'Hiking',
  
  [WHOOP_ACTIVITY_TYPES.YOGA]: 'Yoga',
  [WHOOP_ACTIVITY_TYPES.PILATES]: 'Pilates',
  [WHOOP_ACTIVITY_TYPES.STRETCHING]: 'Stretching',
  [WHOOP_ACTIVITY_TYPES.MEDITATION]: 'Meditation',
  
  [WHOOP_ACTIVITY_TYPES.HIIT]: 'HIIT',
  [WHOOP_ACTIVITY_TYPES.CIRCUIT_TRAINING]: 'Circuit Training',
  [WHOOP_ACTIVITY_TYPES.BOOTCAMP]: 'Bootcamp',
  
  [WHOOP_ACTIVITY_TYPES.GENERAL_FITNESS]: 'General Fitness',
  [WHOOP_ACTIVITY_TYPES.ACTIVITY]: 'Activity',
  [WHOOP_ACTIVITY_TYPES.SPORT]: 'Sport'
};

// Direct mapping from WHOOP activity types to our exercise database IDs
export const WHOOP_TO_EXERCISE_MAPPING: Record<number, string[]> = {
  // Strength Training - map to compound movements
  [WHOOP_ACTIVITY_TYPES.FUNCTIONAL_FITNESS]: ['squat', 'deadlift', 'push-up', 'dumbbell-row'],
  [WHOOP_ACTIVITY_TYPES.WEIGHTLIFTING]: ['squat', 'deadlift', 'bench-press', 'overhead-press'],
  [WHOOP_ACTIVITY_TYPES.POWERLIFTING]: ['squat', 'deadlift', 'bench-press'],
  [WHOOP_ACTIVITY_TYPES.BODYBUILDING]: ['squat', 'deadlift', 'bench-press', 'dumbbell-row', 'lunge'],
  [WHOOP_ACTIVITY_TYPES.CROSSFIT]: ['squat', 'deadlift', 'push-up', 'burpee', 'mountain-climbers'],
  
  // Running - map to running exercises based on intensity
  [WHOOP_ACTIVITY_TYPES.RUNNING]: ['easy-run', 'tempo-run', 'interval-training'],
  [WHOOP_ACTIVITY_TYPES.TRACK_RUNNING]: ['interval-training', 'tempo-run'],
  [WHOOP_ACTIVITY_TYPES.TREADMILL_RUNNING]: ['easy-run', 'tempo-run'],
  [WHOOP_ACTIVITY_TYPES.TRAIL_RUNNING]: ['long-run', 'easy-run'],
  
  // Cycling
  [WHOOP_ACTIVITY_TYPES.CYCLING]: ['steady-state-cycling', 'cycling-intervals'],
  [WHOOP_ACTIVITY_TYPES.INDOOR_CYCLING]: ['cycling-intervals', 'steady-state-cycling'],
  [WHOOP_ACTIVITY_TYPES.MOUNTAIN_BIKING]: ['steady-state-cycling'],
  [WHOOP_ACTIVITY_TYPES.ROAD_CYCLING]: ['steady-state-cycling', 'cycling-intervals'],
  
  // High Intensity Training
  [WHOOP_ACTIVITY_TYPES.HIIT]: ['burpee', 'mountain-climbers', 'jumping-jacks'],
  [WHOOP_ACTIVITY_TYPES.CIRCUIT_TRAINING]: ['burpee', 'squat', 'push-up', 'mountain-climbers'],
  [WHOOP_ACTIVITY_TYPES.BOOTCAMP]: ['burpee', 'squat', 'push-up', 'lunge', 'jumping-jacks'],
  
  // General Fitness
  [WHOOP_ACTIVITY_TYPES.GENERAL_FITNESS]: ['squat', 'push-up', 'plank', 'lunge'],
  [WHOOP_ACTIVITY_TYPES.WALKING]: ['easy-run'], // Use easy run as walking equivalent
  [WHOOP_ACTIVITY_TYPES.HIKING]: ['long-run'], // Use long run as hiking equivalent
};

// Exercise intensity mapping based on WHOOP strain scores
export const STRAIN_TO_INTENSITY_MAPPING = {
  LOW: { min: 0, max: 8, rpe: 4, description: 'Easy/Recovery' },
  MODERATE: { min: 8, max: 14, rpe: 6, description: 'Moderate' },
  HIGH: { min: 14, max: 18, rpe: 8, description: 'Hard' },
  VERY_HIGH: { min: 18, max: 21, rpe: 9, description: 'Very Hard' }
};

// Interface for WHOOP workout data
export interface WhoopWorkout {
  id: string;
  sport_id: number;
  strain: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
  calories?: number;
  distance_meter?: number;
  altitude_gain_meter?: number;
  altitude_change_meter?: number;
  zone_duration?: {
    zone_zero_milli: number;
    zone_one_milli: number;
    zone_two_milli: number;
    zone_three_milli: number;
    zone_four_milli: number;
    zone_five_milli: number;
  };
  created_at: string;
  updated_at: string;
}

// Enhanced exercise recommendation based on WHOOP data
export interface WhoopExerciseRecommendation {
  exercise: ExerciseDefinition;
  matchReason: string;
  confidenceScore: number; // 0-1
  adaptations: {
    targetRPE: number;
    estimatedDuration: string;
    intensityAdjustment: string;
    volumeRecommendation: string;
  };
}

/**
 * Maps a WHOOP activity to our exercise database
 */
export const mapWhoopActivityToExercises = (sportId: number, strain?: number): WhoopExerciseRecommendation[] => {
  console.log(`Mapping WHOOP activity ${sportId} (${WHOOP_ACTIVITY_NAMES[sportId] || 'Unknown'}) with strain ${strain}`);
  
  const recommendations: WhoopExerciseRecommendation[] = [];
  
  // Get direct mapping first
  const directMapping = WHOOP_TO_EXERCISE_MAPPING[sportId];
  
  if (directMapping) {
    directMapping.forEach(exerciseId => {
      const exercise = getExerciseById(exerciseId);
      if (exercise) {
        const intensityLevel = getIntensityFromStrain(strain || 10);
        
        recommendations.push({
          exercise,
          matchReason: `Direct mapping from ${WHOOP_ACTIVITY_NAMES[sportId] || 'WHOOP activity'}`,
          confidenceScore: 0.9,
          adaptations: {
            targetRPE: intensityLevel.rpe,
            estimatedDuration: adaptDurationForIntensity(exercise.estimatedDuration || '30 minutes', intensityLevel.rpe),
            intensityAdjustment: intensityLevel.description,
            volumeRecommendation: getVolumeRecommendation(intensityLevel.rpe, exercise.difficulty)
          }
        });
      }
    });
  }
  
  // If no direct mapping, try keyword-based matching
  if (recommendations.length === 0) {
    const activityName = WHOOP_ACTIVITY_NAMES[sportId];
    if (activityName) {
      const keywords = activityName.toLowerCase().split(' ');
      const matchedExercises = searchExercisesByKeywords(keywords);
      
      matchedExercises.slice(0, 3).forEach(exercise => { // Limit to top 3 matches
        const intensityLevel = getIntensityFromStrain(strain || 10);
        
        recommendations.push({
          exercise,
          matchReason: `Keyword match for "${activityName}"`,
          confidenceScore: 0.6,
          adaptations: {
            targetRPE: intensityLevel.rpe,
            estimatedDuration: adaptDurationForIntensity(exercise.estimatedDuration || '30 minutes', intensityLevel.rpe),
            intensityAdjustment: intensityLevel.description,
            volumeRecommendation: getVolumeRecommendation(intensityLevel.rpe, exercise.difficulty)
          }
        });
      });
    }
  }
  
  // Fallback to cardio exercises for unknown activities
  if (recommendations.length === 0) {
    const fallbackExercise = getCardioFallbackExercise('cardio');
    if (fallbackExercise) {
      const intensityLevel = getIntensityFromStrain(strain || 10);
      
      recommendations.push({
        exercise: fallbackExercise,
        matchReason: 'Fallback cardio exercise for unknown activity',
        confidenceScore: 0.3,
        adaptations: {
          targetRPE: intensityLevel.rpe,
          estimatedDuration: adaptDurationForIntensity(fallbackExercise.estimatedDuration || '30 minutes', intensityLevel.rpe),
          intensityAdjustment: intensityLevel.description,
          volumeRecommendation: getVolumeRecommendation(intensityLevel.rpe, fallbackExercise.difficulty)
        }
      });
    }
  }
  
  console.log(`Generated ${recommendations.length} exercise recommendations for WHOOP activity ${sportId}`);
  return recommendations;
};

/**
 * Determines intensity level from WHOOP strain score
 */
export const getIntensityFromStrain = (strain: number) => {
  if (strain <= STRAIN_TO_INTENSITY_MAPPING.LOW.max) {
    return STRAIN_TO_INTENSITY_MAPPING.LOW;
  } else if (strain <= STRAIN_TO_INTENSITY_MAPPING.MODERATE.max) {
    return STRAIN_TO_INTENSITY_MAPPING.MODERATE;
  } else if (strain <= STRAIN_TO_INTENSITY_MAPPING.HIGH.max) {
    return STRAIN_TO_INTENSITY_MAPPING.HIGH;
  } else {
    return STRAIN_TO_INTENSITY_MAPPING.VERY_HIGH;
  }
};

/**
 * Adapts exercise duration based on target RPE
 */
const adaptDurationForIntensity = (baseDuration: string, targetRPE: number): string => {
  // Extract minutes from duration string (e.g., "30 seconds" -> 0.5, "45 minutes" -> 45)
  const durationMatch = baseDuration.match(/(\d+)\s*(second|minute|hour)s?/);
  if (!durationMatch) return baseDuration;
  
  const value = parseInt(durationMatch[1]);
  const unit = durationMatch[2];
  
  let minutes = value;
  if (unit === 'second') minutes = value / 60;
  if (unit === 'hour') minutes = value * 60;
  
  // Adjust duration based on RPE
  let adjustedMinutes = minutes;
  if (targetRPE <= 4) {
    adjustedMinutes = minutes * 1.5; // Longer for easy efforts
  } else if (targetRPE >= 8) {
    adjustedMinutes = minutes * 0.7; // Shorter for high intensity
  }
  
  // Format back to string
  if (adjustedMinutes < 1) {
    return `${Math.round(adjustedMinutes * 60)} seconds`;
  } else if (adjustedMinutes >= 60) {
    return `${Math.round(adjustedMinutes / 60)} hours`;
  } else {
    return `${Math.round(adjustedMinutes)} minutes`;
  }
};

/**
 * Provides volume recommendations based on RPE and difficulty
 */
const getVolumeRecommendation = (targetRPE: number, difficulty: string): string => {
  const isHighIntensity = targetRPE >= 8;
  const isBeginner = difficulty === 'beginner';
  
  if (isHighIntensity) {
    return isBeginner ? 'Start with 2-3 sets, focus on form' : 'Reduce volume by 20%, focus on intensity';
  } else if (targetRPE <= 4) {
    return isBeginner ? 'Can increase volume by 25%, focus on movement quality' : 'Increase volume by 30-50% for active recovery';
  } else {
    return isBeginner ? 'Standard volume, focus on consistency' : 'Maintain planned volume';
  }
};

/**
 * Analyzes WHOOP workout data to provide exercise insights
 */
export const analyzeWhoopWorkout = (workout: WhoopWorkout): {
  recommendations: WhoopExerciseRecommendation[];
  insights: string[];
  recoveryGuidance: string;
} => {
  const recommendations = mapWhoopActivityToExercises(workout.sport_id, workout.strain);
  const insights: string[] = [];
  
  // Analyze heart rate zones if available
  if (workout.zone_duration) {
    const totalDuration = Object.values(workout.zone_duration).reduce((sum, duration) => sum + duration, 0);
    const zone4And5Duration = workout.zone_duration.zone_four_milli + workout.zone_duration.zone_five_milli;
    const highIntensityPercentage = (zone4And5Duration / totalDuration) * 100;
    
    if (highIntensityPercentage > 20) {
      insights.push(`High anaerobic stress: ${Math.round(highIntensityPercentage)}% in zones 4-5`);
    }
    
    const zone1And2Duration = workout.zone_duration.zone_one_milli + workout.zone_duration.zone_two_milli;
    const aerobicPercentage = (zone1And2Duration / totalDuration) * 100;
    
    if (aerobicPercentage > 70) {
      insights.push(`Good aerobic base building: ${Math.round(aerobicPercentage)}% in aerobic zones`);
    }
  }
  
  // Analyze strain level
  if (workout.strain > 15) {
    insights.push('High strain workout - consider recovery focus tomorrow');
  } else if (workout.strain < 8) {
    insights.push('Low strain workout - good for active recovery or technique work');
  }
  
  // Recovery guidance based on strain and activity type
  let recoveryGuidance = '';
  if (workout.strain > 18) {
    recoveryGuidance = 'High strain detected. Prioritize sleep, hydration, and consider a rest day or light activity tomorrow.';
  } else if (workout.strain > 14) {
    recoveryGuidance = 'Moderate-high strain. Ensure adequate nutrition and sleep. Light activity or active recovery recommended tomorrow.';
  } else if (workout.strain < 8) {
    recoveryGuidance = 'Low strain workout. You can likely handle normal or increased training load tomorrow.';
  } else {
    recoveryGuidance = 'Moderate strain. Listen to your body and adjust tomorrow\'s training based on how you feel.';
  }
  
  return {
    recommendations,
    insights,
    recoveryGuidance
  };
};

/**
 * Gets the best exercise match for a WHOOP activity
 */
export const getBestExerciseForWhoopActivity = (sportId: number, strain?: number): ExerciseDefinition | null => {
  const recommendations = mapWhoopActivityToExercises(sportId, strain);
  
  if (recommendations.length === 0) {
    return null;
  }
  
  // Return the highest confidence recommendation
  const bestMatch = recommendations.reduce((best, current) => 
    current.confidenceScore > best.confidenceScore ? current : best
  );
  
  return bestMatch.exercise;
};

/**
 * Validates if a WHOOP sport ID is supported
 */
export const isWhoopActivitySupported = (sportId: number): boolean => {
  return sportId in WHOOP_ACTIVITY_NAMES;
};

/**
 * Gets human-readable name for WHOOP activity
 */
export const getWhoopActivityName = (sportId: number): string => {
  return WHOOP_ACTIVITY_NAMES[sportId] || `Unknown Activity (${sportId})`;
};

/**
 * Suggests alternative exercises based on WHOOP activity patterns
 */
export const suggestAlternativeExercises = (recentWhoopActivities: WhoopWorkout[]): WhoopExerciseRecommendation[] => {
  const activityCounts: Record<number, number> = {};
  const strainLevels: number[] = [];
  
  // Analyze recent activity patterns
  recentWhoopActivities.forEach(workout => {
    activityCounts[workout.sport_id] = (activityCounts[workout.sport_id] || 0) + 1;
    strainLevels.push(workout.strain);
  });
  
  const mostCommonActivity = Object.entries(activityCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  if (!mostCommonActivity) {
    return [];
  }
  
  const sportId = parseInt(mostCommonActivity);
  
  // Suggest complementary exercises
  const suggestions: WhoopExerciseRecommendation[] = [];
  
  // If mostly cardio, suggest strength
  if ([WHOOP_ACTIVITY_TYPES.RUNNING as number, WHOOP_ACTIVITY_TYPES.CYCLING as number].includes(sportId)) {
    const strengthExercises = ['squat', 'deadlift', 'push-up', 'dumbbell-row'];
    strengthExercises.forEach(exerciseId => {
      const exercise = getExerciseById(exerciseId);
      if (exercise) {
        suggestions.push({
          exercise,
          matchReason: 'Complementary strength training for cardio-focused routine',
          confidenceScore: 0.8,
          adaptations: {
            targetRPE: 6,
            estimatedDuration: '45 minutes',
            intensityAdjustment: 'Moderate',
            volumeRecommendation: 'Focus on form and progressive overload'
          }
        });
      }
    });
  }
  
  // If mostly strength, suggest cardio
  if ([WHOOP_ACTIVITY_TYPES.WEIGHTLIFTING as number, WHOOP_ACTIVITY_TYPES.POWERLIFTING as number].includes(sportId)) {
    const cardioExercises = ['easy-run', 'steady-state-cycling'];
    cardioExercises.forEach(exerciseId => {
      const exercise = getExerciseById(exerciseId);
      if (exercise) {
        suggestions.push({
          exercise,
          matchReason: 'Complementary cardio for strength-focused routine',
          confidenceScore: 0.8,
          adaptations: {
            targetRPE: 4,
            estimatedDuration: '30 minutes',
            intensityAdjustment: 'Easy/Recovery',
            volumeRecommendation: 'Focus on aerobic base building'
          }
        });
      }
    });
  }
  
  return suggestions;
};