import { Exercise } from "@/src/schemas/program";

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
