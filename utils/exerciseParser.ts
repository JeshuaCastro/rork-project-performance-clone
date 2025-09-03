import { WorkoutExercise } from '@/types/exercises';
import { exerciseDatabase } from '@/constants/exerciseDatabase';

type MatchResult = { id: string; alias: string; score: number; matchedBy: 'alias' | 'substring' | 'tokens' | 'fuzzy' };

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (s: string): string[] => normalize(s).split(' ').filter(Boolean);

const levenshtein = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
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
};

const similarity = (a: string, b: string): number => {
  const an = normalize(a);
  const bn = normalize(b);
  if (!an || !bn) return 0;
  if (an === bn) return 1;
  const maxLen = Math.max(an.length, bn.length);
  const lev = levenshtein(an, bn);
  const base = 1 - lev / maxLen;
  const aTokens = new Set(tokenize(an));
  const bTokens = new Set(tokenize(bn));
  const inter = [...aTokens].filter(t => bTokens.has(t)).length;
  const union = new Set<string>([...aTokens, ...bTokens]).size;
  const jaccard = union === 0 ? 0 : inter / union;
  const startsWithBoost = an.startsWith(bn) || bn.startsWith(an) ? 0.1 : 0;
  return Math.max(0, Math.min(1, 0.6 * base + 0.35 * jaccard + startsWithBoost));
};

const exerciseKeywordMap: Record<string, string[]> = {
  'bench-press': [
    'bench press', 'bench-press', 'chest press', 'barbell bench', 'dumbbell bench', 'flat bench', 'horizontal press'
  ],
  'squat': [
    'squat', 'squats', 'back squat', 'front squat', 'goblet squat', 'high bar squat', 'low bar squat', 'barbell squat', 'bodyweight squat', 'air squat'
  ],
  'deadlift': [
    'deadlift', 'deadlifts', 'romanian deadlift', 'rdl', 'conventional deadlift', 'sumo deadlift', 'hip hinge'
  ],
  'overhead-press': [
    'overhead press', 'shoulder press', 'military press', 'standing press', 'strict press', 'barbell press', 'dumbbell shoulder press', 'vertical press'
  ],
  'dumbbell-row': [
    'dumbbell row', 'one arm row', 'single-arm row', 'bent-over row', 'barbell row', 'cable row', 'rowing'
  ],
  'push-up': [
    'push-up', 'push up', 'pushup', 'push ups', 'bodyweight push'
  ],
  'lunge': [
    'lunge', 'lunges', 'forward lunge', 'reverse lunge', 'walking lunge', 'stationary lunge'
  ],
  'plank': [
    'plank', 'forearm plank'
  ],
  'jumping-jacks': [
    'jumping jacks', 'jumping jack', 'star jumps'
  ],
  'mountain-climbers': [
    'mountain climbers', 'mountain climber', 'cross-body mountain climbers'
  ],
  'burpee': [
    'burpee', 'burpees'
  ],
};

const aliasToId: Array<{ alias: string; id: string }> = (() => {
  const pairs: Array<{ alias: string; id: string }> = [];
  Object.entries(exerciseKeywordMap).forEach(([id, aliases]) => {
    aliases.forEach(a => pairs.push({ alias: normalize(a), id }));
  });
  exerciseDatabase.forEach(ex => {
    pairs.push({ alias: normalize(ex.name), id: ex.id });
  });
  const manual: Record<string, string> = {
    'barbell back squat': 'squat',
    'back squat': 'squat',
    'front squat': 'squat',
    'goblet squat': 'squat',
    'chest press': 'bench-press',
    'flat bench press': 'bench-press',
    'incline bench press': 'bench-press',
    'shoulder press': 'overhead-press',
    'military press': 'overhead-press',
    'strict press': 'overhead-press',
    'barbell row': 'dumbbell-row',
    'bent over row': 'dumbbell-row',
    'romanian deadlift': 'deadlift',
    'sumo deadlift': 'deadlift',
    'conventional deadlift': 'deadlift',
  };
  Object.entries(manual).forEach(([a, id]) => pairs.push({ alias: normalize(a), id }));
  return pairs;
})();

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

export const matchExerciseName = (raw: string): MatchResult | undefined => {
  const q = normalize(raw);
  if (!q) return undefined;
  let best: MatchResult | undefined;

  for (const { alias, id } of aliasToId) {
    if (q === alias) {
      const res = { id, alias, score: 1, matchedBy: 'alias' as const };
      best = res;
      break;
    }
  }
  if (!best) {
    for (const { alias, id } of aliasToId) {
      if (q.includes(alias) || alias.includes(q)) {
        const sc = Math.min(0.95, similarity(q, alias) + 0.05);
        if (!best || sc > best.score) best = { id, alias, score: sc, matchedBy: 'substring' };
      }
    }
  }
  if (!best) {
    for (const { alias, id } of aliasToId) {
      const sc = similarity(q, alias);
      if (sc > 0.68) {
        if (!best || sc > best.score) best = { id, alias, score: sc, matchedBy: 'fuzzy' };
      }
    }
  }
  if (best) {
    console.log('matchExerciseName result', { input: raw, ...best });
  } else {
    console.log('matchExerciseName no match', { input: raw });
  }
  return best;
};

const extractItems = (text: string): string[] => {
  const parts = normalize(text)
    .split(/\n|\r|\t|;|\||\u2022|\-|\•|\·/g)
    .map(s => s.trim())
    .filter(Boolean);
  const also = normalize(text).match(/\d+\s*x\s*\d+\s*([a-z\s-]+)/gi)?.map(s => s.replace(/\d+\s*x\s*\d+\s*/i, '').trim()) ?? [];
  return Array.from(new Set([...parts, ...also]));
};

export const parseWorkoutToExercises = (workoutTitle: string, workoutDescription: string): WorkoutExercise[] => {
  const exercises: WorkoutExercise[] = [];
  const combinedRaw = `${workoutTitle} ${workoutDescription}`;
  const combined = normalize(combinedRaw);

  console.log('Parsing workout:', { title: workoutTitle, description: workoutDescription });

  const candidates = extractItems(combinedRaw);
  const matchedSet = new Set<string>();

  for (const c of candidates) {
    const m = matchExerciseName(c);
    if (m && !matchedSet.has(m.id)) {
      matchedSet.add(m.id);
    }
  }

  let matchedExercises: string[] = [...matchedSet];

  if (matchedExercises.length === 0) {
    for (const [workoutType, exerciseIds] of Object.entries(workoutTypeMapping)) {
      if (combined.includes(normalize(workoutType))) {
        matchedExercises = [...exerciseIds];
        console.log(`Found exercises via workout type '${workoutType}':`, exerciseIds);
        break;
      }
    }
  }

  if (matchedExercises.length === 0) {
    if (combined.includes('compound movement') || combined.includes('compound exercise') || combined.includes('compound')) {
      matchedExercises = ['squat', 'deadlift', 'bench-press', 'dumbbell-row'];
    } else if (combined.includes('bodyweight') && (combined.includes('strength') || combined.includes('circuit'))) {
      matchedExercises = ['push-up', 'squat', 'lunge', 'plank'];
    } else if (combined.includes('running') || combined.includes('run') || combined.includes('jog')) {
      matchedExercises = ['jumping-jacks'];
    } else if (combined.includes('cycling') || combined.includes('bike')) {
      matchedExercises = ['jumping-jacks'];
    }
  }

  if (matchedExercises.length === 0) {
    if (combined.includes('upper') || combined.includes('chest') || combined.includes('arm') || combined.includes('shoulder')) {
      matchedExercises = ['bench-press', 'dumbbell-row', 'overhead-press'];
    } else if (combined.includes('lower') || combined.includes('leg') || combined.includes('glute') || combined.includes('quad') || combined.includes('hamstring')) {
      matchedExercises = ['squat', 'deadlift', 'lunge'];
    } else if (combined.includes('cardio') || combined.includes('endurance') || combined.includes('aerobic')) {
      matchedExercises = ['jumping-jacks', 'mountain-climbers'];
    } else if (combined.includes('core') || combined.includes('ab') || combined.includes('stability')) {
      matchedExercises = ['plank'];
    } else if (combined.includes('strength') || combined.includes('resistance') || combined.includes('weight')) {
      matchedExercises = ['squat', 'bench-press', 'dumbbell-row'];
    } else {
      matchedExercises = ['squat', 'push-up'];
    }
  }

  console.log('Final matched exercises:', matchedExercises);

  matchedExercises.forEach(exerciseId => {
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

  if (exercises.length === 0) {
    console.log('Creating final fallback exercise');
    exercises.push({
      exerciseId: 'squat',
      notes: `${workoutTitle}: ${workoutDescription}`,
    });
  }

  console.log('Parsed exercises result:', exercises);
  return exercises;
};

const extractSets = (description: string): number | undefined => {
  const setsMatch = description.match(/(\d+)\s*(?:x|sets?)/i);
  return setsMatch ? parseInt(setsMatch[1]) : undefined;
};

const extractReps = (description: string): number | string | undefined => {
  const repsMatch = description.match(/(\d+(?:-\d+)?)\s*(?:reps?|repetitions?)/i);
  if (repsMatch) {
    return repsMatch[1].includes('-') ? repsMatch[1] : parseInt(repsMatch[1]);
  }
  const setsRepsMatch = description.match(/\b\d+\s*x\s*(\d+(?:-\d+)?)\b/i);
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