import { Program, ProgramSchema, Exercise } from "@/src/schemas/program";
import { EXERCISE_DICTIONARY, lookupByName } from "@/src/content/exerciseDictionary";
import { coerceAiExercise } from "@/src/services/workoutAdapter";

const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

const GENERIC_PLACEHOLDER_URL = "assets/exercises/placeholder.mp4" as const;
const GENERIC_PLACEHOLDER_DESC = "Unverified exercise — check form." as const;

function normString(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  return normString(input)
    .split(" ")
    .filter(Boolean);
}

// Levenshtein distance for character-level similarity
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0) as number[]);
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}



// Enhanced similarity function with multiple scoring methods
function similarity(a: string, b: string): number {
  const an = normString(a);
  const bn = normString(b);
  if (!an || !bn) return 0;
  if (an === bn) return 1;
  
  // Levenshtein distance score
  const maxLen = Math.max(an.length, bn.length);
  const lev = levenshtein(an, bn);
  const levenshteinScore = 1 - lev / maxLen;
  
  // Jaccard similarity (token overlap)
  const aTokens = new Set(tokenize(an));
  const bTokens = new Set(tokenize(bn));
  const intersection = [...aTokens].filter(t => bTokens.has(t)).length;
  const union = new Set<string>([...aTokens, ...bTokens]).size;
  const jaccardScore = union === 0 ? 0 : intersection / union;
  
  // Substring matching bonuses
  const containsBonus = an.includes(bn) || bn.includes(an) ? 0.15 : 0;
  const startsWithBonus = an.startsWith(bn) || bn.startsWith(an) ? 0.1 : 0;
  const endsWithBonus = an.endsWith(bn) || bn.endsWith(an) ? 0.05 : 0;
  
  // Length similarity bonus (prefer similar length matches)
  const lengthRatio = Math.min(an.length, bn.length) / Math.max(an.length, bn.length);
  const lengthBonus = lengthRatio > 0.7 ? 0.05 : 0;
  
  // Common word patterns bonus
  const commonPatterns = ['press', 'squat', 'lift', 'row', 'run', 'cycle', 'jump', 'climb'];
  const patternBonus = commonPatterns.some(pattern => an.includes(pattern) && bn.includes(pattern)) ? 0.05 : 0;
  
  // Weighted combination of all scores
  const finalScore = (
    0.4 * levenshteinScore +
    0.35 * jaccardScore +
    containsBonus +
    startsWithBonus +
    endsWithBonus +
    lengthBonus +
    patternBonus
  );
  
  return Math.max(0, Math.min(1, finalScore));
}

function inferMediaTypeFromUrl(url: string | undefined): "gif" | "mp4" | undefined {
  if (!url) return undefined;
  const lower = url.toLowerCase();
  if (lower.endsWith(".gif")) return "gif";
  if (lower.endsWith(".mp4")) return "mp4";
  return undefined;
}

// Enhanced exercise matching with multi-stage fuzzy matching
function findBestDictionaryMatch(name: string, threshold: number = 0.6) {
  const query = normString(name);
  if (!query) return null;
  
  console.log(`Enhanced matching for: "${name}" -> normalized: "${query}"`);
  
  // Stage 1: Direct lookup (fastest)
  const direct = lookupByName(name);
  if (direct) {
    console.log('Direct match found:', direct.name);
    return direct;
  }

  // Stage 2: Enhanced fuzzy matching with multiple strategies
  let bestKey: string | null = null;
  let bestScore = 0;
  let bestMatchReason = '';
  const candidates: {key: string, score: number, reason: string}[] = [];

  for (const key of Object.keys(EXERCISE_DICTIONARY)) {
    const entry = EXERCISE_DICTIONARY[key];
    const searchTerms: string[] = [entry.slug, entry.name, ...(entry.synonyms ?? [])];
    
    for (const candidate of searchTerms) {
      const candidateNorm = normString(candidate);
      
      // Exact match (highest priority)
      if (query === candidateNorm) {
        console.log('Exact normalized match found:', entry.name);
        return entry;
      }
      
      // High-confidence substring matches
      if (query.includes(candidateNorm) || candidateNorm.includes(query)) {
        const baseScore = similarity(query, candidateNorm);
        const lengthRatio = Math.min(query.length, candidateNorm.length) / Math.max(query.length, candidateNorm.length);
        const adjustedScore = Math.min(0.95, baseScore + (lengthRatio > 0.8 ? 0.1 : 0.05));
        
        candidates.push({ key, score: adjustedScore, reason: `substring match with "${candidate}"` });
      }
      
      // Token-based matching (individual words)
      const queryTokens = tokenize(query);
      const candidateTokens = tokenize(candidateNorm);
      const tokenMatches = queryTokens.filter(qt => 
        candidateTokens.some(ct => ct.includes(qt) || qt.includes(ct) || similarity(qt, ct) > 0.8)
      ).length;
      
      if (tokenMatches > 0) {
        const tokenScore = tokenMatches / Math.max(queryTokens.length, candidateTokens.length);
        if (tokenScore > 0.5) {
          const baseScore = similarity(query, candidateNorm);
          const combinedScore = Math.min(0.9, 0.6 * baseScore + 0.4 * tokenScore);
          candidates.push({ key, score: combinedScore, reason: `token match (${tokenMatches}/${Math.max(queryTokens.length, candidateTokens.length)}) with "${candidate}"` });
        }
      }
      
      // General fuzzy matching
      const fuzzyScore = similarity(query, candidateNorm);
      if (fuzzyScore > threshold) {
        candidates.push({ key, score: fuzzyScore, reason: `fuzzy match (${Math.round(fuzzyScore * 100)}%) with "${candidate}"` });
      }
    }
  }

  // Remove duplicates and find best match
  const uniqueCandidates = candidates.reduce((acc, candidate) => {
    const existing = acc.find(c => c.key === candidate.key);
    if (!existing || candidate.score > existing.score) {
      return [...acc.filter(c => c.key !== candidate.key), candidate];
    }
    return acc;
  }, [] as typeof candidates);

  uniqueCandidates.sort((a, b) => b.score - a.score);
  const best = uniqueCandidates[0];

  if (best && best.score >= threshold) {
    bestKey = best.key;
    bestScore = best.score;
    bestMatchReason = best.reason;
    
    console.log(`Best match found: ${EXERCISE_DICTIONARY[bestKey].name} (${Math.round(bestScore * 100)}%) - ${bestMatchReason}`);
    if (uniqueCandidates.length > 1) {
      console.log('Other candidates:', uniqueCandidates.slice(1, 3).map(c => `${EXERCISE_DICTIONARY[c.key].name} (${Math.round(c.score * 100)}%)`));
    }
    
    return EXERCISE_DICTIONARY[bestKey];
  }

  console.log(`No match found for "${name}" (best score: ${Math.round(bestScore * 100)}%, threshold: ${Math.round(threshold * 100)}%)`);
  return null;
}

// Workout type mapping for fallback exercise selection
const workoutTypeMapping: Record<string, string[]> = {
  'upper body': ['bench-press', 'bent-over-row', 'overhead-press', 'push-up'],
  'lower body': ['barbell-squat', 'deadlift', 'lunge'],
  'full body': ['barbell-squat', 'deadlift', 'bench-press', 'bent-over-row'],
  'push': ['bench-press', 'overhead-press', 'push-up'],
  'pull': ['bent-over-row', 'pull-up'],
  'legs': ['barbell-squat', 'deadlift', 'lunge'],
  'chest': ['bench-press', 'push-up'],
  'back': ['bent-over-row', 'deadlift', 'pull-up'],
  'shoulders': ['overhead-press'],
  'arms': ['bench-press', 'bent-over-row', 'overhead-press'],
  'core': ['plank', 'mountain-climbers'],
  'cardio': ['treadmill-easy', 'jumping-jacks', 'mountain-climbers', 'burpee'],
  'running': ['treadmill-easy', 'treadmill-tempo', 'interval-training', 'long-run'],
  'cycling': ['stationary-bike'],
  'endurance': ['treadmill-easy', 'long-run', 'stationary-bike'],
  'aerobic': ['treadmill-easy', 'stationary-bike'],
  'tempo': ['treadmill-tempo'],
  'intervals': ['interval-training'],
  'speed work': ['interval-training'],
  'base building': ['treadmill-easy', 'stationary-bike'],
  'hiit': ['jumping-jacks', 'mountain-climbers', 'burpee'],
  'strength': ['barbell-squat', 'deadlift', 'bench-press'],
  'compound': ['barbell-squat', 'deadlift', 'bench-press', 'bent-over-row'],
};

// Enhanced exercise resolution with better fallback logic
export function resolveExercise(ex: Partial<Exercise>): Exercise {
  const baseId = ex.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const baseName = ex.name ?? "Unknown Exercise";
  const baseType: Exercise["type"] = ex.type ?? "strength";

  console.log(`Resolving exercise: "${baseName}"`);

  // Try direct dictionary match first
  let matched = findBestDictionaryMatch(baseName);

  // If no direct match, try contextual matching based on workout type keywords
  if (!matched) {
    const nameNorm = normString(baseName);
    for (const [workoutType, exerciseIds] of Object.entries(workoutTypeMapping)) {
      if (nameNorm.includes(normString(workoutType))) {
        const fallbackId = exerciseIds[0]; // Take first exercise as fallback
        matched = EXERCISE_DICTIONARY[fallbackId];
        console.log(`Found contextual match via workout type '${workoutType}': ${matched?.name}`);
        break;
      }
    }
  }

  // If still no match, try partial word matching
  if (!matched) {
    const nameWords = tokenize(baseName).filter(w => w.length > 2);
    if (nameWords.length > 0) {
      for (const word of nameWords) {
        matched = findBestDictionaryMatch(word, 0.7); // Lower threshold for single words
        if (matched) {
          console.log(`Found partial word match for '${word}': ${matched.name}`);
          break;
        }
      }
    }
  }

  if (matched) {
    const mediaType = ex.mediaType ?? matched.mediaType ?? inferMediaTypeFromUrl(ex.mediaUrl ?? matched.mediaUrl) ?? "mp4";
    const description = ex.description ?? `How to: ${matched.name}. Maintain safe range of motion and controlled tempo.`;

    const resolvedExercise = {
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
    
    console.log(`Successfully resolved "${baseName}" to "${matched.name}"`);
    return resolvedExercise;
  }

  if (isDev) {
    console.debug("resolveExercise: could not resolve exercise", { name: baseName, provided: ex });
  }

  const mediaType = ex.mediaType ?? inferMediaTypeFromUrl(ex.mediaUrl) ?? "mp4";

  const fallbackExercise = {
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
  
  console.log(`Using fallback for unresolved exercise: "${baseName}"`);
  return fallbackExercise;
}

export function normalizeAiProgram(input: unknown): Program {
  const prepped = (() => {
    const src = input as Record<string, unknown> | null | undefined;
    if (!src || typeof src !== "object") return input;
    const clone: Record<string, unknown> = { ...src };
    const workouts = Array.isArray((src as any).workouts) ? (src as any).workouts : [];
    clone.workouts = workouts.map((w: any) => {
      const wClone: any = { ...w };
      const exs: any[] = Array.isArray(w?.exercises) ? w.exercises : [];
      wClone.exercises = exs.map((ex: any) => ({ ...ex, ...coerceAiExercise(ex) }));
      return wClone;
    });
    return clone;
  })();

  const parsed = ProgramSchema.safeParse(prepped);
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
