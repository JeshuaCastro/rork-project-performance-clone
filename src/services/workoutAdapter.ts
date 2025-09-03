import { Exercise } from "@/src/schemas/program";
import { ExerciseDefinition } from '@/types/exercises';
import { exerciseMappingService, EnhancedMappingResult } from '@/services/exerciseMappingService';
import { getExerciseById } from '@/constants/exerciseDatabase';

export const AI_EXERCISE_ALIAS_MAP = {
  sets: ["sets", "setCount", "numSets"],
  reps: ["reps", "rep", "repRange", "repetitions"],
  targetIntensity: ["targetIntensity", "intensity", "rpe", "effort", "pace"],
  restSec: ["restSec", "rest", "restTime"],
  durationMin: ["durationMin", "duration", "timeMin", "minutes"],
  distanceKm: ["distanceKm", "distance", "km", "kilometers"],
  equipment: ["equipment", "equip"],
  primaryMuscles: ["primaryMuscles", "muscles", "targetMuscles"],
  mediaUrl: ["mediaUrl", "media", "video", "gif", "animation"],
} as const;

const numberFrom = (v: unknown): number | undefined => {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const stringFrom = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;

const asArray = (v: unknown): string[] | undefined => {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string" && v.trim()) return v.split(/[,/]|\s{2,}/).map((s) => s.trim()).filter(Boolean);
  return undefined;
};

function parsePrescription(text: string): Partial<Exercise> {
  const result: Partial<Exercise> = {};
  const cleaned = text.trim();

  const volMatch = cleaned.match(/(\d+)\s*[xX]\s*(\d+)/);
  if (volMatch) {
    const sets = numberFrom(volMatch[1]);
    const reps = numberFrom(volMatch[2]);
    if (sets !== undefined) result.sets = sets;
    if (reps !== undefined) result.reps = reps;
  }

  const rpeMatch = cleaned.match(/(RPE|@?\s*RPE)\s*(\d+(?:\.\d+)?)/i);
  if (rpeMatch) {
    result.targetIntensity = `RPE ${rpeMatch[2]}`;
  }

  const pctMatch = cleaned.match(/@\s*(\d{1,3})%/);
  if (pctMatch) {
    result.targetIntensity = `${pctMatch[1]}%`;
  }

  const restMatch = cleaned.match(/rest\s*(\d+)\s*(s|sec|seconds|m|min|minutes)?/i);
  if (restMatch) {
    const n = numberFrom(restMatch[1]);
    if (n !== undefined) {
      const unit = (restMatch[2] || "s").toLowerCase();
      result.restSec = unit.startsWith("m") ? n * 60 : n;
    }
  }

  return result;
}

export function coerceAiExercise(raw: unknown): Partial<Exercise> {
  const src = (raw ?? {}) as Record<string, unknown>;
  const out: Partial<Exercise> = {};

  for (const key of AI_EXERCISE_ALIAS_MAP.sets) {
    if (src[key] != null) {
      const n = numberFrom(src[key]);
      if (n !== undefined) out.sets = n;
      break;
    }
  }
  for (const key of AI_EXERCISE_ALIAS_MAP.reps) {
    if (src[key] != null) {
      const v = src[key];
      const n = numberFrom(v);
      out.reps = n ?? stringFrom(v);
      break;
    }
  }
  for (const key of AI_EXERCISE_ALIAS_MAP.targetIntensity) {
    if (src[key] != null) {
      const s = stringFrom(src[key]);
      if (s) out.targetIntensity = s.toUpperCase().startsWith("RPE") ? s.toUpperCase() : s;
      break;
    }
  }
  for (const key of AI_EXERCISE_ALIAS_MAP.restSec) {
    if (src[key] != null) {
      const v = src[key];
      if (typeof v === "string") {
        const m = v.match(/(\d+)\s*(s|sec|seconds|m|min|minutes)?/i);
        if (m) {
          const n = numberFrom(m[1]);
          if (n !== undefined) {
            const unit = (m[2] || "s").toLowerCase();
            out.restSec = unit.startsWith("m") ? n * 60 : n;
          }
        }
      } else {
        const n = numberFrom(v);
        if (n !== undefined) out.restSec = n;
      }
      break;
    }
  }
  for (const key of AI_EXERCISE_ALIAS_MAP.durationMin) {
    if (src[key] != null) {
      const v = src[key];
      if (typeof v === "string") {
        const m = v.match(/(\d+(?:\.\d+)*)\s*(m|min|minutes)?/i);
        const n = m ? numberFrom(m[1]) : numberFrom(v);
        if (n !== undefined) out.durationMin = n;
      } else {
        const n = numberFrom(v);
        if (n !== undefined) out.durationMin = n;
      }
      break;
    }
  }
  for (const key of AI_EXERCISE_ALIAS_MAP.distanceKm) {
    if (src[key] != null) {
      const v = src[key];
      if (typeof v === "string") {
        const m = v.match(/(\d+(?:\.\d+)*)\s*(k|km|kilometers)?/i);
        const n = m ? numberFrom(m[1]) : numberFrom(v);
        if (n !== undefined) out.distanceKm = n;
      } else {
        const n = numberFrom(v);
        if (n !== undefined) out.distanceKm = n;
      }
      break;
    }
  }

  for (const key of AI_EXERCISE_ALIAS_MAP.equipment) {
    if (src[key] != null) {
      const arr = asArray(src[key]);
      if (arr) out.equipment = arr;
      break;
    }
  }
  for (const key of AI_EXERCISE_ALIAS_MAP.primaryMuscles) {
    if (src[key] != null) {
      const arr = asArray(src[key]);
      if (arr) out.primaryMuscles = arr;
      break;
    }
  }
  for (const key of AI_EXERCISE_ALIAS_MAP.mediaUrl) {
    if (src[key] != null) {
      const s = stringFrom(src[key]);
      if (s) out.mediaUrl = s;
      break;
    }
  }

  const nameLike = stringFrom(src["name"]) || stringFrom(src["title"]);
  if (nameLike) out.name = nameLike;

  const prescription = stringFrom(src["scheme"]) || stringFrom(src["prescription"]) || stringFrom(src["notes"]) || undefined;
  if (prescription) {
    Object.assign(out, parsePrescription(prescription));
    if (!out.targetIntensity) {
      const rpeInline = prescription.match(/RPE\s*\d+(?:\.\d+)?/i);
      if (rpeInline) out.targetIntensity = rpeInline[0].toUpperCase();
    }
  }

  return out;
}

/**
 * Enhanced canonical mapping function that uses the exercise mapping service
 * to resolve AI-generated exercise names to database exercises
 */
export async function mapProgramWorkoutToCanonical(
  aiWorkout: unknown,
  workoutContext?: string
): Promise<{
  exercise: Exercise;
  mappingResult: EnhancedMappingResult;
  needsUserReview: boolean;
}> {
  console.log('Mapping AI workout to canonical format:', { aiWorkout, workoutContext });
  
  // First, coerce the AI exercise data into our format
  const coercedExercise = coerceAiExercise(aiWorkout);
  
  // Extract the exercise name for mapping
  const aiExerciseName = coercedExercise.name || 'Unknown Exercise';
  
  // Use the enhanced mapping service to resolve the exercise
  const mappingResult = await exerciseMappingService.mapExerciseName(
    aiExerciseName,
    workoutContext
  );
  
  console.log('Exercise mapping result:', {
    originalName: aiExerciseName,
    mappedTo: mappingResult.exerciseId,
    confidence: mappingResult.confidence,
    matchType: mappingResult.matchType,
    needsReview: mappingResult.needsUserReview
  });
  
  // Get the canonical exercise definition
  const canonicalExercise = mappingResult.exercise;
  
  // Determine exercise type based on canonical exercise properties
  const exerciseType = (() => {
    const muscles = canonicalExercise.primaryMuscles || [];
    if (muscles.includes('cardio')) return 'cardio';
    if (muscles.includes('core')) return 'mobility';
    return 'strength';
  })();

  // Create the final exercise object by merging canonical data with AI data
  const finalExercise: Exercise = {
    // Start with canonical exercise data
    id: canonicalExercise.id,
    name: canonicalExercise.name,
    type: exerciseType,
    
    // Map ExerciseDefinition properties to Exercise schema properties
    primaryMuscles: canonicalExercise.primaryMuscles?.map(muscle => muscle.toString()) || 
                   coercedExercise.primaryMuscles || [],
    equipment: canonicalExercise.equipment?.map(eq => eq.toString()) || 
              coercedExercise.equipment || [],
    mediaUrl: canonicalExercise.videoUrl || canonicalExercise.imageUrl || coercedExercise.mediaUrl,
    description: canonicalExercise.description,
    
    // Override with AI-provided workout parameters
    sets: coercedExercise.sets,
    reps: coercedExercise.reps,
    targetIntensity: coercedExercise.targetIntensity,
    restSec: coercedExercise.restSec,
    durationMin: coercedExercise.durationMin,
    distanceKm: coercedExercise.distanceKm,
    
    // Preserve original AI name as slug if different from canonical
    ...(aiExerciseName !== canonicalExercise.name && {
      slug: aiExerciseName.toLowerCase().replace(/\s+/g, '-')
    })
  };
  
  // Log the final result
  console.log('Final canonical exercise:', {
    id: finalExercise.id,
    name: finalExercise.name,
    originalAiName: aiExerciseName,
    confidence: mappingResult.confidence,
    hasAlternatives: mappingResult.alternatives.length > 0
  });
  
  return {
    exercise: finalExercise,
    mappingResult,
    needsUserReview: mappingResult.needsUserReview || mappingResult.confidence < 0.8
  };
}

/**
 * Batch process multiple AI exercises with enhanced mapping
 */
export async function mapMultipleProgramWorkoutsToCanonical(
  aiWorkouts: unknown[],
  workoutContext?: string
): Promise<{
  exercises: Exercise[];
  mappingResults: EnhancedMappingResult[];
  needsUserReview: boolean;
  unmappedCount: number;
}> {
  console.log(`Mapping ${aiWorkouts.length} AI workouts to canonical format`);
  
  const results = await Promise.all(
    aiWorkouts.map(workout => mapProgramWorkoutToCanonical(workout, workoutContext))
  );
  
  const exercises = results.map(r => r.exercise);
  const mappingResults = results.map(r => r.mappingResult);
  const needsUserReview = results.some(r => r.needsUserReview);
  const unmappedCount = mappingResults.filter(r => r.matchType === 'generic').length;
  
  console.log('Batch mapping complete:', {
    totalExercises: exercises.length,
    needsUserReview,
    unmappedCount,
    averageConfidence: mappingResults.reduce((sum, r) => sum + r.confidence, 0) / mappingResults.length
  });
  
  return {
    exercises,
    mappingResults,
    needsUserReview,
    unmappedCount
  };
}

/**
 * Helper function to get exercise alternatives for user review
 */
export function getExerciseAlternatives(mappingResult: EnhancedMappingResult): ExerciseDefinition[] {
  return mappingResult.alternatives
    .map(alt => getExerciseById(alt.exerciseId))
    .filter((ex): ex is ExerciseDefinition => ex !== undefined)
    .slice(0, 5); // Limit to top 5 alternatives
}

/**
 * Helper function to create a user-friendly mapping summary
 */
export function createMappingSummary(mappingResults: EnhancedMappingResult[]): {
  totalMapped: number;
  exactMatches: number;
  fuzzyMatches: number;
  userMappings: number;
  genericFallbacks: number;
  needsReview: number;
  averageConfidence: number;
} {
  const summary = {
    totalMapped: mappingResults.length,
    exactMatches: mappingResults.filter(r => r.matchType === 'exact').length,
    fuzzyMatches: mappingResults.filter(r => r.matchType === 'fuzzy').length,
    userMappings: mappingResults.filter(r => r.matchType === 'user_mapping').length,
    genericFallbacks: mappingResults.filter(r => r.matchType === 'generic').length,
    needsReview: mappingResults.filter(r => r.needsUserReview).length,
    averageConfidence: mappingResults.length > 0 
      ? mappingResults.reduce((sum, r) => sum + r.confidence, 0) / mappingResults.length 
      : 0
  };
  
  console.log('Mapping summary:', summary);
  return summary;
}
