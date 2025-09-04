import { Exercise } from "@/src/schemas/program";
import type { CanonicalWorkout } from "@/types/workout";
import type { ExerciseDefinition, TrackedWorkoutExercise, WorkoutSet } from "@/types/exercises";

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

export function createTrackedExercisesFromCanonical(
  canonical: CanonicalWorkout,
  extracted: ExerciseDefinition[]
): TrackedWorkoutExercise[] {
  console.log('[workoutAdapter] createTrackedExercisesFromCanonical start', { id: canonical.id, title: canonical.title, count: canonical.exercises.length });
  const nameToDef = new Map<string, ExerciseDefinition>();
  extracted.forEach((d) => nameToDef.set(d.name.toLowerCase(), d));

  const parseReps = (reps: number | string | undefined): number | string => {
    if (typeof reps === 'number') return reps;
    if (typeof reps === 'string') {
      const n = Number(reps.replace(/[^0-9.\-]/g, ''));
      if (Number.isFinite(n)) return Math.round(n);
      return reps;
    }
    return '8-12';
  };

  const parseRest = (rest: number | string | undefined): number | undefined => {
    if (typeof rest === 'number') return rest;
    if (typeof rest === 'string') {
      const m = rest.match(/(\d+)\s*(s|sec|seconds|m|min|minutes)?/i);
      if (m) {
        const val = Number(m[1]);
        if (Number.isFinite(val)) {
          const unit = (m[2] || 's').toLowerCase();
          return unit.startsWith('m') ? val * 60 : val;
        }
      }
    }
    return undefined;
  };

  const out: TrackedWorkoutExercise[] = canonical.exercises.map((ex, idx) => {
    const key = ex.name.toLowerCase().trim();
    const match = nameToDef.get(key);
    const exerciseId = match ? match.id : key.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `exercise-${idx}`;

    const totalSets = typeof ex.sets === 'number' && ex.sets > 0 ? ex.sets : 3;
    const targetReps = parseReps(ex.reps);
    const rest = parseRest((ex as any).rest ?? (ex as any).restSec ?? undefined) ?? 90;

    const sets: WorkoutSet[] = Array.from({ length: totalSets }).map((_, i) => ({
      setNumber: i + 1,
      targetReps,
      targetWeight: undefined,
      targetRPE: undefined,
      restTime: rest,
      completed: false,
    }));

    const tracked: TrackedWorkoutExercise = {
      exerciseId,
      sets,
      totalSets,
      completedSets: 0,
      isCompleted: false,
    };
    return tracked;
  });

  console.log('[workoutAdapter] createTrackedExercisesFromCanonical built', { count: out.length });
  return out;
}
