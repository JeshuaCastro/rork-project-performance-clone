export type MediaType = "gif" | "mp4";

export interface BeginnerAlternative {
  name: string;
  notes?: string;
  mediaUrl?: string;
}

export interface ExerciseDictEntry {
  slug: string;
  name: string;
  primaryMuscles: string[];
  equipment?: string[];
  mediaUrl: string;
  mediaType: MediaType;
  beginnerAlternative?: BeginnerAlternative;
  synonyms?: string[];
}

export const EXERCISE_DICTIONARY: Record<string, ExerciseDictEntry> = {
  "barbell-squat": {
    slug: "barbell-squat",
    name: "Barbell Squat",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings", "core"],
    equipment: ["barbell", "rack"],
    mediaUrl: "assets/exercises/barbell-squat.mp4",
    mediaType: "mp4",
    synonyms: [
      "back squat", "squat", "barbell back squat", "high bar squat", "low bar squat", 
      "bb squat", "squats", "air squat", "bodyweight squat", "box squat", 
      "overhead squat", "zercher squat", "hack squat", "bulgarian split squat", 
      "pistol squat", "jump squat", "sqt", "quad", "leg"
    ],
    beginnerAlternative: {
      name: "Goblet Squat",
      notes: "Use a light dumbbell or kettlebell; focus on depth and posture.",
      mediaUrl: "assets/exercises/goblet-squat.mp4",
    },
  },
  "bench-press": {
    slug: "bench-press",
    name: "Bench Press",
    primaryMuscles: ["chest", "triceps", "front delts"],
    equipment: ["barbell", "bench"],
    mediaUrl: "assets/exercises/bench-press.mp4",
    mediaType: "mp4",
    synonyms: [
      "barbell bench", "chest press", "flat bench press", "incline bench press", 
      "decline bench press", "dumbbell bench press", "barbell bench press", 
      "db bench", "bb bench", "horizontal press", "press", "chest", "pec", "pectoral"
    ],
    beginnerAlternative: {
      name: "Push-Up",
      notes: "Elevate hands on a box if needed.",
      mediaUrl: "assets/exercises/push-up.mp4",
    },
  },
  deadlift: {
    slug: "deadlift",
    name: "Deadlift",
    primaryMuscles: ["hamstrings", "glutes", "erectors", "lats", "grip"],
    equipment: ["barbell"],
    mediaUrl: "assets/exercises/deadlift.mp4",
    mediaType: "mp4",
    synonyms: [
      "conventional deadlift", "deadlifts", "sumo deadlift", "stiff leg deadlift", 
      "trap bar deadlift", "hex bar deadlift", "single leg deadlift", 
      "deficit deadlift", "rack pull", "rdl", "dl", "dead lift", 
      "posterior chain", "hamstring", "glute", "hip hinge"
    ],
    beginnerAlternative: {
      name: "Kettlebell Deadlift",
      notes: "Start from blocks to reduce range.",
      mediaUrl: "assets/exercises/kb-deadlift.mp4",
    },
  },
  "overhead-press": {
    slug: "overhead-press",
    name: "Overhead Press",
    primaryMuscles: ["shoulders", "triceps", "upper chest", "core"],
    equipment: ["barbell"],
    mediaUrl: "assets/exercises/overhead-press.mp4",
    mediaType: "mp4",
    synonyms: [
      "ohp", "shoulder press", "press", "military press", "standing press", 
      "strict press", "barbell press", "dumbbell shoulder press", "vertical press", 
      "seated press", "arnold press", "push press", "jerk", "clean and press", 
      "shoulder", "delt", "deltoid"
    ],
    beginnerAlternative: {
      name: "Seated Dumbbell Press",
      mediaUrl: "assets/exercises/db-shoulder-press.mp4",
    },
  },
  "bent-over-row": {
    slug: "bent-over-row",
    name: "Bent-Over Row",
    primaryMuscles: ["lats", "upper back", "rear delts", "biceps"],
    equipment: ["barbell"],
    mediaUrl: "assets/exercises/bent-over-row.mp4",
    mediaType: "mp4",
    synonyms: [
      "barbell row", "dumbbell row", "one arm row", "single-arm row", 
      "cable row", "rowing", "bent row", "pendlay row", "chest supported row", 
      "seated row", "inverted row", "db row", "bb row", "row", "pull", 
      "lat", "latissimus", "rhomboid", "rear delt"
    ],
    beginnerAlternative: {
      name: "Chest-Supported Row",
      mediaUrl: "assets/exercises/chest-supported-row.mp4",
    },
  },
  "pull-up": {
    slug: "pull-up",
    name: "Pull-Up",
    primaryMuscles: ["lats", "biceps", "upper back", "core"],
    equipment: ["bar"],
    mediaUrl: "assets/exercises/pull-up.mp4",
    mediaType: "mp4",
    synonyms: ["chin-up"],
    beginnerAlternative: {
      name: "Band-Assisted Pull-Up",
      mediaUrl: "assets/exercises/assisted-pull-up.mp4",
    },
  },
  "lat-pulldown": {
    slug: "lat-pulldown",
    name: "Lat Pulldown",
    primaryMuscles: ["lats", "biceps", "upper back"],
    equipment: ["cable machine"],
    mediaUrl: "assets/exercises/lat-pulldown.mp4",
    mediaType: "mp4",
    synonyms: ["pulldown"],
  },
  "romanian-deadlift": {
    slug: "romanian-deadlift",
    name: "Romanian Deadlift",
    primaryMuscles: ["hamstrings", "glutes", "erectors"],
    equipment: ["barbell"],
    mediaUrl: "assets/exercises/romanian-deadlift.mp4",
    mediaType: "mp4",
    synonyms: ["RDL"],
    beginnerAlternative: {
      name: "Dumbbell RDL",
      mediaUrl: "assets/exercises/db-rdl.mp4",
    },
  },
  lunge: {
    slug: "lunge",
    name: "Lunge",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings", "adductors"],
    equipment: ["bodyweight", "dumbbells"],
    mediaUrl: "assets/exercises/lunge.mp4",
    mediaType: "mp4",
    synonyms: [
      "forward lunge", "walking lunge", "lunges", "reverse lunge", "stationary lunge", 
      "lateral lunge", "side lunge", "curtsy lunge", "jumping lunge", "alternating lunge", 
      "split lunge", "step up", "step-up", "single leg", "unilateral"
    ],
    beginnerAlternative: {
      name: "Static Split Squat",
      mediaUrl: "assets/exercises/split-squat.mp4",
    },
  },
  "split-squat": {
    slug: "split-squat",
    name: "Split Squat",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings"],
    equipment: ["bodyweight", "dumbbells"],
    mediaUrl: "assets/exercises/split-squat.mp4",
    mediaType: "mp4",
    synonyms: ["stationary lunge"],
  },
  "hip-thrust": {
    slug: "hip-thrust",
    name: "Hip Thrust",
    primaryMuscles: ["glutes", "hamstrings"],
    equipment: ["barbell", "bench"],
    mediaUrl: "assets/exercises/hip-thrust.mp4",
    mediaType: "mp4",
    synonyms: ["barbell hip thrust"],
    beginnerAlternative: {
      name: "Glute Bridge",
      mediaUrl: "assets/exercises/glute-bridge.mp4",
    },
  },
  "glute-bridge": {
    slug: "glute-bridge",
    name: "Glute Bridge",
    primaryMuscles: ["glutes", "hamstrings", "core"],
    equipment: ["bodyweight"],
    mediaUrl: "assets/exercises/glute-bridge.mp4",
    mediaType: "mp4",
    synonyms: ["bridge"],
  },
  "leg-press": {
    slug: "leg-press",
    name: "Leg Press",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings"],
    equipment: ["machine"],
    mediaUrl: "assets/exercises/leg-press.mp4",
    mediaType: "mp4",
    synonyms: ["sled press"],
  },
  "hamstring-curl": {
    slug: "hamstring-curl",
    name: "Hamstring Curl",
    primaryMuscles: ["hamstrings"],
    equipment: ["machine"],
    mediaUrl: "assets/exercises/hamstring-curl.mp4",
    mediaType: "mp4",
    synonyms: ["leg curl"],
  },
  "calf-raise": {
    slug: "calf-raise",
    name: "Calf Raise",
    primaryMuscles: ["calves"],
    equipment: ["machine", "dumbbells", "bodyweight"],
    mediaUrl: "assets/exercises/calf-raise.mp4",
    mediaType: "mp4",
    synonyms: ["standing calf raise"],
  },
  "push-up": {
    slug: "push-up",
    name: "Push-Up",
    primaryMuscles: ["chest", "triceps", "front delts", "core"],
    equipment: ["bodyweight"],
    mediaUrl: "assets/exercises/push-up.mp4",
    mediaType: "mp4",
    synonyms: [
      "press-up", "push up", "pushup", "push ups", "bodyweight push", 
      "diamond pushup", "wide pushup", "decline pushup", "incline pushup", 
      "knee pushup", "hindu pushup", "archer pushup", "plyometric pushup", "clap pushup"
    ],
    beginnerAlternative: {
      name: "Incline Push-Up",
      mediaUrl: "assets/exercises/incline-push-up.mp4",
    },
  },
  plank: {
    slug: "plank",
    name: "Plank",
    primaryMuscles: ["core", "abs", "obliques"],
    equipment: ["bodyweight"],
    mediaUrl: "assets/exercises/plank.mp4",
    mediaType: "mp4",
    synonyms: [
      "front plank", "forearm plank", "high plank", "low plank", "side plank", 
      "plank hold", "isometric hold", "core hold", "ab hold", "stability"
    ],
  },
  "side-plank": {
    slug: "side-plank",
    name: "Side Plank",
    primaryMuscles: ["obliques", "core"],
    equipment: ["bodyweight"],
    mediaUrl: "assets/exercises/side-plank.mp4",
    mediaType: "mp4",
  },
  "bicep-curl": {
    slug: "bicep-curl",
    name: "Bicep Curl",
    primaryMuscles: ["biceps"],
    equipment: ["dumbbells", "barbell", "cable"],
    mediaUrl: "assets/exercises/bicep-curl.mp4",
    mediaType: "mp4",
    synonyms: ["curl"],
  },
  "tricep-extension": {
    slug: "tricep-extension",
    name: "Tricep Extension",
    primaryMuscles: ["triceps"],
    equipment: ["cable", "dumbbells"],
    mediaUrl: "assets/exercises/tricep-extension.mp4",
    mediaType: "mp4",
    synonyms: ["triceps extension", "pressdown", "pushdown"],
  },
  "treadmill-easy": {
    slug: "treadmill-easy",
    name: "Treadmill Easy Run",
    primaryMuscles: ["cardio", "legs"],
    equipment: ["treadmill"],
    mediaUrl: "assets/exercises/treadmill-easy.mp4",
    mediaType: "mp4",
    synonyms: [
      "easy run", "z2 treadmill", "jog", "jogging", "light run", "recovery run", 
      "base run", "aerobic run", "conversational pace", "zone 2", "easy pace", "steady run"
    ],
  },
  "treadmill-tempo": {
    slug: "treadmill-tempo",
    name: "Treadmill Tempo Run",
    primaryMuscles: ["cardio", "legs"],
    equipment: ["treadmill"],
    mediaUrl: "assets/exercises/treadmill-tempo.mp4",
    mediaType: "mp4",
    synonyms: [
      "tempo run", "threshold treadmill", "tempo", "threshold run", "lactate threshold", 
      "comfortably hard", "sustained effort", "race pace", "tempo pace"
    ],
  },
  "outdoor-base-run": {
    slug: "outdoor-base-run",
    name: "Outdoor Base Run",
    primaryMuscles: ["cardio", "legs"],
    mediaUrl: "assets/exercises/outdoor-base-run.mp4",
    mediaType: "mp4",
    synonyms: [
      "base run", "easy outdoor run", "running", "run", "outdoor run", "road run", "trail run"
    ],
  },
  // Additional cardio and HIIT exercises
  "jumping-jacks": {
    slug: "jumping-jacks",
    name: "Jumping Jacks",
    primaryMuscles: ["cardio", "full-body"],
    equipment: ["bodyweight"],
    mediaUrl: "assets/exercises/jumping-jacks.mp4",
    mediaType: "mp4",
    synonyms: [
      "jumping jack", "star jumps", "side straddle hop", "jacks", 
      "cardio", "warm up", "warmup", "conditioning"
    ],
  },
  "mountain-climbers": {
    slug: "mountain-climbers",
    name: "Mountain Climbers",
    primaryMuscles: ["cardio", "core"],
    equipment: ["bodyweight"],
    mediaUrl: "assets/exercises/mountain-climbers.mp4",
    mediaType: "mp4",
    synonyms: [
      "mountain climber", "cross-body mountain climbers", "mt climbers", 
      "climbers", "running plank", "plank runs", "cardio core"
    ],
  },
  "burpee": {
    slug: "burpee",
    name: "Burpee",
    primaryMuscles: ["full-body", "cardio"],
    equipment: ["bodyweight"],
    mediaUrl: "assets/exercises/burpee.mp4",
    mediaType: "mp4",
    synonyms: [
      "burpees", "squat thrust", "full body", "compound movement", "hiit", "metabolic"
    ],
  },
  // Cycling exercises
  "stationary-bike": {
    slug: "stationary-bike",
    name: "Stationary Bike",
    primaryMuscles: ["cardio", "legs"],
    equipment: ["bike", "stationary bike"],
    mediaUrl: "assets/exercises/stationary-bike.mp4",
    mediaType: "mp4",
    synonyms: [
      "cycling", "bike", "bicycle", "steady state", "endurance cycling", "road cycling", 
      "indoor cycling", "spin", "cardio bike", "cycle", "bike intervals", "cycling hiit", "power intervals"
    ],
  },
  // Interval training
  "interval-training": {
    slug: "interval-training",
    name: "Interval Training",
    primaryMuscles: ["cardio", "legs"],
    equipment: ["bodyweight"],
    mediaUrl: "assets/exercises/interval-training.mp4",
    mediaType: "mp4",
    synonyms: [
      "intervals", "interval training", "speed work", "track work", "fartlek", "repeats", 
      "high intensity", "vo2 max", "anaerobic", "sprint"
    ],
  },
  // Long run
  "long-run": {
    slug: "long-run",
    name: "Long Run",
    primaryMuscles: ["cardio", "legs"],
    equipment: ["bodyweight"],
    mediaUrl: "assets/exercises/long-run.mp4",
    mediaType: "mp4",
    synonyms: [
      "long run", "long slow distance", "lsd", "endurance run", "distance run", "marathon pace"
    ],
  },
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

export function lookupByName(name: string): ExerciseDictEntry | null {
  try {
    const query = normalize(name);

    // Direct slug match
    if (EXERCISE_DICTIONARY[query]) return EXERCISE_DICTIONARY[query];

    // Build search index of name and synonyms
    for (const key of Object.keys(EXERCISE_DICTIONARY)) {
      const entry = EXERCISE_DICTIONARY[key];
      const namesToCheck: string[] = [entry.slug, entry.name, ...(entry.synonyms ?? [])];
      for (const candidate of namesToCheck) {
        if (normalize(candidate) === query) {
          return entry;
        }
        // loose contains check for minor phrasing differences
        if (query.includes(normalize(candidate)) || normalize(candidate).includes(query)) {
          return entry;
        }
      }
    }
    return null;
  } catch (err) {
    console.log("lookupByName error", err);
    return null;
  }
}
