import { Program, ProgramSchema, Exercise } from "@/src/schemas/program";
import { EXERCISE_DICTIONARY, lookupByName } from "@/src/content/exerciseDictionary";

const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

const GENERIC_PLACEHOLDER_URL = "assets/exercises/placeholder.mp4" as const;
const GENERIC_PLACEHOLDER_DESC = "Unverified exercise — check form." as const;

function normString(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function tokenize(input: string): string[] {
  return normString(input)
    .split(" ")
    .filter(Boolean);
}

function jaccard(aTokens: string[], bTokens: string[]): number {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  const intersection = new Set([...a].filter((x) => b.has(x))).size;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function dice(aTokens: string[], bTokens: string[]): number {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  const intersection = new Set([...a].filter((x) => b.has(x))).size;
  const denom = a.size + b.size;
  return denom === 0 ? 0 : (2 * intersection) / denom;
}

function similarity(a: string, b: string): number {
  const at = tokenize(a);
  const bt = tokenize(b);
  return (jaccard(at, bt) + dice(at, bt)) / 2;
}

function inferMediaTypeFromUrl(url: string | undefined): "gif" | "mp4" | undefined {
  if (!url) return undefined;
  const lower = url.toLowerCase();
  if (lower.endsWith(".gif")) return "gif";
  if (lower.endsWith(".mp4")) return "mp4";
  return undefined;
}

function findBestDictionaryMatch(name: string, threshold: number = 0.75) {
  const direct = lookupByName(name);
  if (direct) return direct;

  let bestKey: string | null = null;
  let bestScore = 0;

  for (const key of Object.keys(EXERCISE_DICTIONARY)) {
    const entry = EXERCISE_DICTIONARY[key];
    const candidates: string[] = [entry.slug, entry.name, ...(entry.synonyms ?? [])];
    for (const candidate of candidates) {
      const score = similarity(candidate, name);
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }
  }

  if (bestKey && bestScore >= threshold) {
    return EXERCISE_DICTIONARY[bestKey];
  }

  return null;
}

export function resolveExercise(ex: Partial<Exercise>): Exercise {
  const baseId = ex.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const baseName = ex.name ?? "Unknown Exercise";
  const baseType: Exercise["type"] = ex.type ?? "strength";

  const matched = findBestDictionaryMatch(baseName);

  if (matched) {
    const mediaType = ex.mediaType ?? matched.mediaType ?? inferMediaTypeFromUrl(ex.mediaUrl ?? matched.mediaUrl) ?? "mp4";
    const description = ex.description ?? `How to: ${matched.name}. Maintain safe range of motion and controlled tempo.`;

    return {
      id: baseId,
      name: matched.name,
      type: baseType,
      slug: matched.slug,
      primaryMuscles: ex.primaryMuscles ?? matched.primaryMuscles,
      equipment: ex.equipment ?? matched.equipment,
      description,
      mediaUrl: ex.mediaUrl ?? matched.mediaUrl,
      mediaType,
      beginnerAlternative: ex.beginnerAlternative ?? matched.beginnerAlternative,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo,
      restSec: ex.restSec,
      durationMin: ex.durationMin,
      distanceKm: ex.distanceKm,
      targetIntensity: ex.targetIntensity,
    };
  }

  if (isDev) {
    console.debug("resolveExercise: could not resolve exercise", { name: baseName, provided: ex });
  }

  const mediaType = ex.mediaType ?? inferMediaTypeFromUrl(ex.mediaUrl) ?? "mp4";

  return {
    id: baseId,
    name: baseName,
    type: baseType,
    slug: ex.slug,
    primaryMuscles: ex.primaryMuscles,
    equipment: ex.equipment,
    description: ex.description ?? GENERIC_PLACEHOLDER_DESC,
    mediaUrl: ex.mediaUrl ?? GENERIC_PLACEHOLDER_URL,
    mediaType,
    beginnerAlternative: ex.beginnerAlternative,
    sets: ex.sets,
    reps: ex.reps,
    tempo: ex.tempo,
    restSec: ex.restSec,
    durationMin: ex.durationMin,
    distanceKm: ex.distanceKm,
    targetIntensity: ex.targetIntensity,
  };
}

export function normalizeAiProgram(input: unknown): Program {
  const parsed = ProgramSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid program shape: ${parsed.error.message}`);
  }

  const program = parsed.data;

  const normalizedWorkouts = program.workouts.map((w) => {
    const exercises = w.exercises.map((ex) => {
      const needsResolve = !ex.slug || !ex.mediaUrl;
      const resolved = needsResolve ? resolveExercise(ex) : ex;

      const ensuredMediaType = resolved.mediaType ?? inferMediaTypeFromUrl(resolved.mediaUrl) ?? "mp4";
      const ensuredDescription = resolved.description ?? `How to: ${resolved.name}. Focus on quality reps and safe technique.`;

      const finalEx: Exercise = {
        ...resolved,
        mediaType: ensuredMediaType,
        description: ensuredDescription,
      };

      return finalEx;
    });

    return { ...w, exercises };
  });

  const normalized: Program = { ...program, workouts: normalizedWorkouts };
  return normalized;
}
