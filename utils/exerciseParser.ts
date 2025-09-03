import { WorkoutExercise } from '@/types/exercises';
import { exerciseDatabase } from '@/constants/exerciseDatabase';

type MatchResult = { id: string; alias: string; score: number; matchedBy: 'alias' | 'substring' | 'tokens' | 'fuzzy' | 'partial' };

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
};

// Enhanced similarity function with multiple scoring methods
const similarity = (a: string, b: string): number => {
  const an = normalize(a);
  const bn = normalize(b);
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
};

// Enhanced exercise keyword mapping with comprehensive variations
const exerciseKeywordMap: Record<string, string[]> = {
  'bench-press': [
    'bench press', 'bench-press', 'chest press', 'barbell bench', 'dumbbell bench', 'flat bench', 'horizontal press',
    'incline bench', 'decline bench', 'db bench', 'bb bench', 'press', 'chest', 'pec', 'pectoral'
  ],
  'squat': [
    'squat', 'squats', 'back squat', 'front squat', 'goblet squat', 'high bar squat', 'low bar squat', 
    'barbell squat', 'bodyweight squat', 'air squat', 'box squat', 'overhead squat', 'zercher squat',
    'hack squat', 'bulgarian split squat', 'pistol squat', 'jump squat', 'sqt', 'quad', 'leg'
  ],
  'deadlift': [
    'deadlift', 'deadlifts', 'romanian deadlift', 'rdl', 'conventional deadlift', 'sumo deadlift', 
    'hip hinge', 'stiff leg deadlift', 'trap bar deadlift', 'hex bar deadlift', 'single leg deadlift',
    'deficit deadlift', 'rack pull', 'dl', 'dead lift', 'posterior chain', 'hamstring', 'glute'
  ],
  'overhead-press': [
    'overhead press', 'shoulder press', 'military press', 'standing press', 'strict press', 
    'barbell press', 'dumbbell shoulder press', 'vertical press', 'seated press', 'arnold press',
    'push press', 'jerk', 'clean and press', 'ohp', 'press', 'shoulder', 'delt', 'deltoid'
  ],
  'dumbbell-row': [
    'dumbbell row', 'one arm row', 'single-arm row', 'bent-over row', 'barbell row', 'cable row', 
    'rowing', 'bent row', 'pendlay row', 'chest supported row', 'seated row', 'inverted row',
    'db row', 'bb row', 'row', 'pull', 'lat', 'latissimus', 'rhomboid', 'rear delt'
  ],
  'push-up': [
    'push-up', 'push up', 'pushup', 'push ups', 'bodyweight push', 'press up', 'press-up',
    'diamond pushup', 'wide pushup', 'decline pushup', 'incline pushup', 'knee pushup',
    'hindu pushup', 'archer pushup', 'plyometric pushup', 'clap pushup'
  ],
  'lunge': [
    'lunge', 'lunges', 'forward lunge', 'reverse lunge', 'walking lunge', 'stationary lunge',
    'lateral lunge', 'side lunge', 'curtsy lunge', 'jumping lunge', 'alternating lunge',
    'split lunge', 'step up', 'step-up', 'single leg', 'unilateral'
  ],
  'plank': [
    'plank', 'forearm plank', 'front plank', 'high plank', 'low plank', 'side plank',
    'plank hold', 'isometric hold', 'core hold', 'ab hold', 'stability'
  ],
  'jumping-jacks': [
    'jumping jacks', 'jumping jack', 'star jumps', 'side straddle hop', 'jacks',
    'cardio', 'warm up', 'warmup', 'conditioning'
  ],
  'mountain-climbers': [
    'mountain climbers', 'mountain climber', 'cross-body mountain climbers', 'mt climbers',
    'climbers', 'running plank', 'plank runs', 'cardio core'
  ],
  'burpee': [
    'burpee', 'burpees', 'squat thrust', 'full body', 'compound movement', 'hiit', 'metabolic'
  ],
  'easy-run': [
    'easy run', 'jog', 'jogging', 'light run', 'recovery run', 'base run', 'aerobic run',
    'conversational pace', 'zone 2', 'easy pace', 'steady run'
  ],
  'tempo-run': [
    'tempo run', 'tempo', 'threshold run', 'lactate threshold', 'comfortably hard',
    'sustained effort', 'race pace', 'tempo pace'
  ],
  'interval-training': [
    'intervals', 'interval training', 'speed work', 'track work', 'fartlek', 'repeats',
    'high intensity', 'vo2 max', 'anaerobic', 'sprint'
  ],
  'long-run': [
    'long run', 'long slow distance', 'lsd', 'endurance run', 'distance run', 'marathon pace'
  ],
  'steady-state-cycling': [
    'cycling', 'bike', 'bicycle', 'steady state', 'endurance cycling', 'road cycling',
    'indoor cycling', 'spin', 'cardio bike'
  ],
  'cycling-intervals': [
    'cycling intervals', 'bike intervals', 'spin intervals', 'cycling hiit', 'power intervals'
  ]
};

const aliasToId: { alias: string; id: string }[] = (() => {
  const pairs: { alias: string; id: string }[] = [];
  Object.entries(exerciseKeywordMap).forEach(([id, aliases]) => {
    aliases.forEach(a => pairs.push({ alias: normalize(a), id }));
  });
  exerciseDatabase.forEach(ex => {
    pairs.push({ alias: normalize(ex.name), id: ex.id });
  });
  // Comprehensive manual mappings for common exercise variations
  const manual: Record<string, string> = {
    // Squat variations
    'barbell back squat': 'squat',
    'barbell squat': 'squat',
    'back squat': 'squat',
    'front squat': 'squat',
    'goblet squat': 'squat',
    'box squat': 'squat',
    'overhead squat': 'squat',
    'air squat': 'squat',
    'bodyweight squat': 'squat',
    'jump squat': 'squat',
    'sqt': 'squat',
    
    // Bench press variations
    'chest press': 'bench-press',
    'flat bench press': 'bench-press',
    'incline bench press': 'bench-press',
    'decline bench press': 'bench-press',
    'dumbbell bench press': 'bench-press',
    'barbell bench press': 'bench-press',
    'db bench': 'bench-press',
    'bb bench': 'bench-press',
    
    // Overhead press variations
    'shoulder press': 'overhead-press',
    'military press': 'overhead-press',
    'strict press': 'overhead-press',
    'standing press': 'overhead-press',
    'seated press': 'overhead-press',
    'dumbbell shoulder press': 'overhead-press',
    'barbell press': 'overhead-press',
    'push press': 'overhead-press',
    'ohp': 'overhead-press',
    
    // Row variations
    'barbell row': 'dumbbell-row',
    'bent over row': 'dumbbell-row',
    'bent-over row': 'dumbbell-row',
    'pendlay row': 'dumbbell-row',
    'one arm row': 'dumbbell-row',
    'single arm row': 'dumbbell-row',
    'cable row': 'dumbbell-row',
    'seated row': 'dumbbell-row',
    'db row': 'dumbbell-row',
    'bb row': 'dumbbell-row',
    
    // Deadlift variations
    'romanian deadlift': 'deadlift',
    'sumo deadlift': 'deadlift',
    'conventional deadlift': 'deadlift',
    'stiff leg deadlift': 'deadlift',
    'trap bar deadlift': 'deadlift',
    'hex bar deadlift': 'deadlift',
    'deficit deadlift': 'deadlift',
    'rack pull': 'deadlift',
    'rdl': 'deadlift',
    'dl': 'deadlift',
    'dead lift': 'deadlift',
    
    // Push-up variations
    'press up': 'push-up',
    'press-up': 'push-up',
    'pushup': 'push-up',
    'diamond pushup': 'push-up',
    'wide pushup': 'push-up',
    'knee pushup': 'push-up',
    
    // Lunge variations
    'forward lunge': 'lunge',
    'reverse lunge': 'lunge',
    'walking lunge': 'lunge',
    'lateral lunge': 'lunge',
    'side lunge': 'lunge',
    'curtsy lunge': 'lunge',
    'split lunge': 'lunge',
    'alternating lunge': 'lunge',
    
    // Plank variations
    'forearm plank': 'plank',
    'front plank': 'plank',
    'high plank': 'plank',
    'low plank': 'plank',
    'plank hold': 'plank',
    
    // Cardio variations
    'jumping jack': 'jumping-jacks',
    'star jumps': 'jumping-jacks',
    'jacks': 'jumping-jacks',
    'mountain climber': 'mountain-climbers',
    'mt climbers': 'mountain-climbers',
    'climbers': 'mountain-climbers',
    'squat thrust': 'burpee',
    
    // Running variations
    'jog': 'easy-run',
    'jogging': 'easy-run',
    'light run': 'easy-run',
    'recovery run': 'easy-run',
    'base run': 'easy-run',
    'easy pace': 'easy-run',
    'tempo': 'tempo-run',
    'threshold run': 'tempo-run',
    'lactate threshold': 'tempo-run',
    'intervals': 'interval-training',
    'speed work': 'interval-training',
    'track work': 'interval-training',
    'fartlek': 'interval-training',
    'long slow distance': 'long-run',
    'lsd': 'long-run',
    'endurance run': 'long-run',
    
    // Cycling variations
    'bike': 'steady-state-cycling',
    'bicycle': 'steady-state-cycling',
    'cycling': 'steady-state-cycling',
    'spin': 'steady-state-cycling',
    'indoor cycling': 'steady-state-cycling',
    'road cycling': 'steady-state-cycling',
    'bike intervals': 'cycling-intervals',
    'cycling hiit': 'cycling-intervals',
    'spin intervals': 'cycling-intervals'
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

// Enhanced exercise name matching with multi-stage fuzzy matching
export const matchExerciseName = (raw: string): MatchResult | undefined => {
  const q = normalize(raw);
  if (!q) return undefined;
  
  console.log(`Matching exercise name: "${raw}" -> normalized: "${q}"`);
  
  let best: MatchResult | undefined;
  const candidates: MatchResult[] = [];

  // Stage 1: Exact match
  for (const { alias, id } of aliasToId) {
    if (q === alias) {
      const result = { id, alias, score: 1, matchedBy: 'alias' as const };
      console.log('Exact match found:', result);
      return result;
    }
  }

  // Stage 2: High-confidence substring matches
  for (const { alias, id } of aliasToId) {
    if (q.includes(alias) || alias.includes(q)) {
      const baseScore = similarity(q, alias);
      const lengthRatio = Math.min(q.length, alias.length) / Math.max(q.length, alias.length);
      const adjustedScore = Math.min(0.95, baseScore + (lengthRatio > 0.8 ? 0.1 : 0.05));
      
      candidates.push({ id, alias, score: adjustedScore, matchedBy: 'substring' });
    }
  }

  // Stage 3: Token-based matching (individual words)
  const queryTokens = tokenize(q);
  for (const { alias, id } of aliasToId) {
    const aliasTokens = tokenize(alias);
    const tokenMatches = queryTokens.filter(qt => 
      aliasTokens.some(at => at.includes(qt) || qt.includes(at) || similarity(qt, at) > 0.8)
    ).length;
    
    if (tokenMatches > 0) {
      const tokenScore = tokenMatches / Math.max(queryTokens.length, aliasTokens.length);
      if (tokenScore > 0.5) {
        const baseScore = similarity(q, alias);
        const combinedScore = Math.min(0.9, 0.6 * baseScore + 0.4 * tokenScore);
        candidates.push({ id, alias, score: combinedScore, matchedBy: 'tokens' });
      }
    }
  }

  // Stage 4: Fuzzy matching with lower threshold
  for (const { alias, id } of aliasToId) {
    const sc = similarity(q, alias);
    if (sc > 0.6) { // Lowered threshold for better coverage
      candidates.push({ id, alias, score: sc, matchedBy: 'fuzzy' });
    }
  }

  // Stage 5: Partial word matching (for compound exercises)
  const queryWords = q.split(' ').filter(w => w.length > 2);
  if (queryWords.length > 1) {
    for (const { alias, id } of aliasToId) {
      const aliasWords = alias.split(' ').filter(w => w.length > 2);
      const wordMatches = queryWords.filter(qw => 
        aliasWords.some(aw => aw.includes(qw) || qw.includes(aw) || similarity(qw, aw) > 0.75)
      ).length;
      
      if (wordMatches >= Math.min(2, queryWords.length)) {
        const wordScore = wordMatches / Math.max(queryWords.length, aliasWords.length);
        const adjustedScore = Math.min(0.85, wordScore * 0.8);
        candidates.push({ id, alias, score: adjustedScore, matchedBy: 'partial' });
      }
    }
  }

  // Remove duplicates and sort by score
  const uniqueCandidates = candidates.reduce((acc, candidate) => {
    const existing = acc.find(c => c.id === candidate.id);
    if (!existing || candidate.score > existing.score) {
      return [...acc.filter(c => c.id !== candidate.id), candidate];
    }
    return acc;
  }, [] as MatchResult[]);

  uniqueCandidates.sort((a, b) => b.score - a.score);
  best = uniqueCandidates[0];

  if (best) {
    console.log('Best match found:', { input: raw, ...best, totalCandidates: uniqueCandidates.length });
    if (uniqueCandidates.length > 1) {
      console.log('Other candidates:', uniqueCandidates.slice(1, 3));
    }
  } else {
    console.log('No match found for:', raw);
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