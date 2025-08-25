import { WhoopData } from '@/types/whoop';
import { ProgramGoal, AutoregulationConfig, WorkoutTemplate, ProgramExercise, GoalType } from '@/types/programs';
import { mapWhoopActivityToExercises, WhoopExerciseRecommendation } from './whoopExerciseMapping';

// Enhanced autoregulation based on WHOOP data and Renaissance Periodization principles
export interface EnhancedAutoregulationResult {
  shouldAdjust: boolean;
  adjustments: {
    volumeMultiplier: number; // 0.5 = 50% reduction, 1.2 = 20% increase
    intensityAdjustment: number; // RPE adjustment (-2 to +1)
    exerciseSubstitutions: ExerciseSubstitution[];
    restDayRecommended: boolean;
    deloadRecommended: boolean;
  };
  reasoning: string[];
  recoveryGuidance: string;
  nextDayRecommendations: string[];
}

export interface ExerciseSubstitution {
  originalExerciseId: string;
  recommendedExerciseId: string;
  reason: string;
}

export interface RecoveryMetrics {
  recovery: number;
  recoveryTrend: number; // 7-day trend
  strain: number;
  strainTrend: number; // 7-day trend
  sleepQuality: number;
  sleepDuration: number; // hours
  hrvTrend: number; // 7-day HRV trend
  restingHRTrend: number; // 7-day RHR trend
}

/**
 * Calculates comprehensive recovery metrics from WHOOP data
 */
export const calculateRecoveryMetrics = (whoopData: WhoopData): RecoveryMetrics => {
  const recentRecovery = whoopData.recovery.slice(0, 7);
  const recentStrain = whoopData.strain.slice(0, 7);
  const recentSleep = whoopData.sleep.slice(0, 7);
  
  // Current values (most recent)
  const currentRecovery = recentRecovery[0]?.score || 50;
  const currentStrain = recentStrain[0]?.score || 10;
  const currentSleep = recentSleep[0];
  
  // Calculate trends (7-day moving average vs previous 7 days)
  const recoveryTrend = calculateTrend(recentRecovery.map(r => r.score));
  const strainTrend = calculateTrend(recentStrain.map(s => s.score));
  
  // Sleep metrics
  const sleepQuality = currentSleep?.efficiency || 85;
  const sleepDuration = currentSleep?.duration ? currentSleep.duration / (1000 * 60 * 60) : 7.5;
  
  // HRV and RHR trends (mock calculation - would need actual HRV/RHR data)
  const hrvTrend = calculateTrend(recentRecovery.map(r => r.score * 0.5 + 25)); // Approximation
  const restingHRTrend = calculateTrend(recentRecovery.map(r => 70 - (r.score * 0.2))); // Approximation
  
  return {
    recovery: currentRecovery,
    recoveryTrend,
    strain: currentStrain,
    strainTrend,
    sleepQuality,
    sleepDuration,
    hrvTrend,
    restingHRTrend
  };
};

/**
 * Calculate trend from array of values (positive = improving, negative = declining)
 */
const calculateTrend = (values: number[]): number => {
  if (values.length < 2) return 0;
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  return firstAvg - secondAvg; // Positive means recent values are higher
};

/**
 * Enhanced autoregulation engine using Renaissance Periodization principles
 */
export const performEnhancedAutoregulation = (
  whoopData: WhoopData,
  programGoal: ProgramGoal,
  config: AutoregulationConfig,
  workoutTemplate: WorkoutTemplate,
  weekInProgram: number
): EnhancedAutoregulationResult => {
  const metrics = calculateRecoveryMetrics(whoopData);
  const reasoning: string[] = [];
  const nextDayRecommendations: string[] = [];
  
  // Base adjustment factors
  let volumeMultiplier = 1.0;
  let intensityAdjustment = 0;
  let restDayRecommended = false;
  let deloadRecommended = false;
  const exerciseSubstitutions: ExerciseSubstitution[] = [];
  
  // Recovery-based adjustments (Renaissance Periodization approach)
  if (metrics.recovery < 30) {
    volumeMultiplier = 0.5;
    intensityAdjustment = -2;
    restDayRecommended = true;
    reasoning.push("Very low recovery (<30%) - significant volume reduction recommended");
    nextDayRecommendations.push("Consider complete rest or light mobility work");
  } else if (metrics.recovery < 50) {
    volumeMultiplier = 0.7;
    intensityAdjustment = -1;
    reasoning.push("Low recovery (30-50%) - moderate volume reduction");
    nextDayRecommendations.push("Focus on technique and lighter loads");
  } else if (metrics.recovery > 80) {
    volumeMultiplier = 1.1;
    intensityAdjustment = 0;
    reasoning.push("High recovery (>80%) - slight volume increase possible");
    nextDayRecommendations.push("Good day for intensity or volume progression");
  }
  
  // Sleep-based adjustments
  if (metrics.sleepDuration < 6) {
    volumeMultiplier *= 0.8;
    intensityAdjustment -= 1;
    reasoning.push(`Insufficient sleep (${metrics.sleepDuration.toFixed(1)}h) - reducing intensity`);
  } else if (metrics.sleepQuality < 70) {
    volumeMultiplier *= 0.9;
    reasoning.push(`Poor sleep quality (${metrics.sleepQuality}%) - slight volume reduction`);
  }
  
  // Strain trend analysis
  if (metrics.strainTrend > 3) {
    volumeMultiplier *= 0.8;
    reasoning.push("High strain trend - reducing volume to prevent overreaching");
    nextDayRecommendations.push("Monitor recovery closely over next few days");
  }
  
  // Recovery trend analysis
  if (metrics.recoveryTrend < -10) {
    deloadRecommended = weekInProgram > 3;
    volumeMultiplier *= 0.6;
    reasoning.push("Declining recovery trend - deload may be needed");
    if (deloadRecommended) {
      nextDayRecommendations.push("Consider implementing a deload week");
    }
  }
  
  // Exercise substitutions based on recovery state
  if (metrics.recovery < 50 && workoutTemplate.exercises) {
    workoutTemplate.exercises.forEach(exercise => {
      // Check if exercise targets legs based on movement pattern
      if (['squat', 'lunge'].includes(exercise.movementPattern) && metrics.recovery < 40) {
        exerciseSubstitutions.push({
          originalExerciseId: exercise.exerciseId,
          recommendedExerciseId: `${exercise.exerciseId}_light`,
          reason: "Low recovery - substituting with lighter leg exercise"
        });
      }
      
      // Check if exercise is compound based on movement pattern
      if (['squat', 'hinge'].includes(exercise.movementPattern) && metrics.recovery < 35) {
        exerciseSubstitutions.push({
          originalExerciseId: exercise.exerciseId,
          recommendedExerciseId: `${exercise.exerciseId}_isolation`,
          reason: "Very low recovery - substituting compound with isolation exercise"
        });
      }
    });
  }
  
  // Generate recovery guidance
  let recoveryGuidance = "";
  if (metrics.recovery < 50) {
    recoveryGuidance = "Focus on sleep, hydration, and stress management. Consider additional recovery modalities.";
  } else if (metrics.recovery > 70) {
    recoveryGuidance = "Good recovery state. Maintain current recovery practices.";
  } else {
    recoveryGuidance = "Moderate recovery. Ensure adequate sleep and nutrition.";
  }
  
  // Add program-specific adjustments
  if (programGoal.type === 'strength' && metrics.recovery < 60) {
    intensityAdjustment -= 1;
    reasoning.push("Strength program requires high CNS readiness - reducing intensity");
  } else if (programGoal.type === 'endurance' && metrics.sleepDuration < 7) {
    volumeMultiplier *= 0.85;
    reasoning.push("Endurance training requires adequate recovery - reducing volume");
  }
  
  const shouldAdjust = volumeMultiplier !== 1.0 || 
                      intensityAdjustment !== 0 || 
                      exerciseSubstitutions.length > 0 ||
                      restDayRecommended ||
                      deloadRecommended;
  
  return {
    shouldAdjust,
    adjustments: {
      volumeMultiplier,
      intensityAdjustment,
      exerciseSubstitutions,
      restDayRecommended,
      deloadRecommended
    },
    reasoning,
    recoveryGuidance,
    nextDayRecommendations
  };
};

/**
 * Apply autoregulation adjustments to a workout template
 */
export const applyAutoregulationAdjustments = (
  workoutTemplate: WorkoutTemplate,
  adjustments: EnhancedAutoregulationResult['adjustments']
): WorkoutTemplate => {
  if (!workoutTemplate.exercises) return workoutTemplate;
  
  const adjustedExercises = workoutTemplate.exercises.map(exercise => {
    // Apply volume adjustments
    const adjustedSets = Math.max(1, Math.round(exercise.sets * adjustments.volumeMultiplier));
    
    // Apply intensity adjustments (modify RPE targets)
    const adjustedRpe = Math.max(6, Math.min(10, exercise.targetRPE + adjustments.intensityAdjustment));
    
    // Check for exercise substitutions
    const substitution = adjustments.exerciseSubstitutions.find(
      sub => sub.originalExerciseId === exercise.exerciseId
    );
    
    return {
      ...exercise,
      sets: adjustedSets,
      targetRPE: adjustedRpe,
      exerciseId: substitution?.recommendedExerciseId || exercise.exerciseId,
      autoregulationGuidelines: substitution ? 
        [...exercise.autoregulationGuidelines, `Auto-adjusted: ${substitution.reason}`] : 
        exercise.autoregulationGuidelines
    };
  });
  
  return {
    ...workoutTemplate,
    exercises: adjustedExercises
  };
};

/**
 * Generate personalized workout recommendations based on WHOOP data
 */
export const generatePersonalizedWorkoutRecommendations = (
  whoopData: WhoopData,
  programGoal: GoalType
): WhoopExerciseRecommendation[] => {
  const metrics = calculateRecoveryMetrics(whoopData);
  const recentActivities = whoopData.strain.slice(0, 3);
  
  const recommendations: WhoopExerciseRecommendation[] = [];
  
  // Generate recommendations based on strain data
  // Since StrainData doesn't have activities, we'll create mock sport IDs based on strain levels
  recentActivities.forEach(strainData => {
    // Map strain levels to likely activities
    let sportId = 90; // General fitness default
    if (strainData.score > 15) {
      sportId = 1; // High intensity - functional fitness
    } else if (strainData.score > 10) {
      sportId = 10; // Moderate - running
    } else {
      sportId = 70; // Low - yoga/recovery
    }
    
    const exerciseRecommendations = mapWhoopActivityToExercises(sportId, strainData.score);
    recommendations.push(...exerciseRecommendations);
  });
  
  // Filter and prioritize based on recovery state
  return recommendations
    .filter(rec => {
      // Filter based on adaptations intensity
      const intensity = rec.adaptations.targetRPE;
      if (metrics.recovery < 50 && intensity >= 8) return false;
      if (metrics.recovery < 30 && intensity >= 6) return false;
      return true;
    })
    .sort((a, b) => {
      // Prioritize based on recovery state and program goal
      if (metrics.recovery > 70) {
        return b.confidenceScore - a.confidenceScore; // High confidence first when recovered
      } else {
        return a.adaptations.targetRPE - b.adaptations.targetRPE; // Low intensity first when not recovered
      }
    })
    .slice(0, 10); // Limit to top 10 recommendations
};