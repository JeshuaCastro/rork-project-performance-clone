import { MetricDefinition, GoalTemplate, ExerciseSelection, VolumeLandmarks, AutoregulationConfig } from '@/types/programs';

// Enhanced Program Templates with Renaissance Periodization
export const ENHANCED_GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'tpl-muscle-rp',
    type: 'muscle_gain',
    title: 'Muscle Gain (RP Method)',
    defaultMetricKey: 'muscle_mass',
    description: 'Science-based muscle building using Renaissance Periodization principles',
    suggestedTimeframes: [{ value: 16, unit: 'weeks' }],
    exampleTargets: ['+4-6 kg lean mass in 16 weeks', '+8-12 lb muscle in 4 months'],
    movementPatterns: ['squat', 'hinge', 'push', 'pull', 'lunge'],
    volumeProgression: 'linear',
    scientificRationale: 'Progressive overload through volume landmarks (MEV→MAV→MRV) with RPE-based autoregulation. Emphasizes compound movements with optimal frequency (2-3x/week per muscle group) and hypertrophy rep ranges (6-12 reps at RPE 6-8).'
  },
  {
    id: 'tpl-strength-rp',
    type: 'strength',
    title: 'Strength (RP Method)',
    defaultMetricKey: 'one_rep_max_total',
    description: 'Periodized strength development using block periodization',
    suggestedTimeframes: [{ value: 12, unit: 'weeks' }],
    exampleTargets: ['+50-75 kg total (S/B/D)', '+15-25% strength increase'],
    movementPatterns: ['squat', 'hinge', 'push', 'pull'],
    volumeProgression: 'block',
    scientificRationale: 'Block periodization with accumulation→intensification→realization phases. Lower volume, higher intensity (RPE 7-9), focusing on neurological adaptations and skill acquisition in competition lifts.'
  },
  {
    id: 'tpl-fatloss-rp',
    type: 'fat_loss',
    title: 'Fat Loss (RP Method)',
    defaultMetricKey: 'body_fat_pct',
    description: 'Metabolically demanding training with muscle preservation',
    suggestedTimeframes: [{ value: 12, unit: 'weeks' }],
    exampleTargets: ['-5-8% body fat', '-10-20 lb fat while preserving muscle'],
    movementPatterns: ['squat', 'hinge', 'push', 'pull', 'carry'],
    volumeProgression: 'undulating',
    scientificRationale: 'High-frequency training with metabolic emphasis. Combines strength training for muscle preservation with conditioning work. Higher training density and shorter rest periods to maximize caloric expenditure.'
  },
  {
    id: 'tpl-endurance-rp',
    type: 'endurance',
    title: 'Endurance (RP Method)',
    defaultMetricKey: '5k_time',
    description: 'Polarized training model for aerobic development',
    suggestedTimeframes: [{ value: 16, unit: 'weeks' }],
    exampleTargets: ['Sub-20 5K', '+20W FTP', 'Complete first marathon'],
    movementPatterns: ['carry', 'squat', 'push', 'pull'],
    volumeProgression: 'undulating',
    scientificRationale: 'Polarized training: 80% easy aerobic work (RPE 3-5), 20% high-intensity intervals (RPE 8-9). Minimal strength work to support running economy and injury prevention.'
  }
];

export const PROGRAM_METRICS: MetricDefinition[] = [
  {
    key: 'body_weight',
    label: 'Body Weight',
    unit: 'kg',
    description: 'Total body weight measured under consistent conditions',
    goalTypes: ['fat_loss', 'muscle_gain', 'general_health'],
    direction: 'decrease',
    recommendedRange: { },
  },
  {
    key: 'body_weight_lb',
    label: 'Body Weight',
    unit: 'lb',
    description: 'Imperial unit alternative for body weight',
    goalTypes: ['fat_loss', 'muscle_gain', 'general_health'],
    direction: 'decrease',
  },
  {
    key: 'muscle_mass',
    label: 'Muscle Mass',
    unit: 'kg',
    description: 'Estimated lean muscle mass',
    goalTypes: ['muscle_gain', 'strength'],
    direction: 'increase',
  },
  {
    key: 'body_fat_pct',
    label: 'Body Fat %',
    unit: '%',
    description: 'Estimated body fat percentage',
    goalTypes: ['fat_loss', 'general_health'],
    direction: 'decrease',
    recommendedRange: { min: 8, max: 25 },
  },
  {
    key: 'ftp',
    label: 'Cycling FTP',
    unit: 'W',
    description: 'Functional Threshold Power',
    goalTypes: ['endurance'],
    direction: 'increase',
  },
  {
    key: '5k_time',
    label: '5K Time',
    unit: 'min',
    description: 'Time to complete 5 kilometers',
    goalTypes: ['endurance'],
    direction: 'decrease',
  },
  {
    key: 'marathon_time',
    label: 'Marathon Time',
    unit: 'min',
    description: 'Time to complete marathon distance',
    goalTypes: ['endurance'],
    direction: 'decrease',
  },
  {
    key: 'one_rep_max_total',
    label: 'Total 1RM (S/B/D)',
    unit: 'kg',
    description: 'Sum of single-rep maxes for squat/bench/deadlift',
    goalTypes: ['strength'],
    direction: 'increase',
  },
  {
    key: 'weekly_training_adherence',
    label: 'Plan Adherence',
    unit: '%',
    description: 'Percent of planned sessions completed',
    goalTypes: ['muscle_gain', 'fat_loss', 'endurance', 'strength', 'general_health'],
    direction: 'increase',
  },
];

// Renaissance Periodization Volume Landmarks by Goal Type
export const VOLUME_LANDMARKS: Record<string, VolumeLandmarks> = {
  muscle_gain: {
    MEV: 10, // Minimum Effective Volume (sets per week)
    MAV: 18, // Maximum Adaptive Volume (sets per week)
    MRV: 22, // Maximum Recoverable Volume (sets per week)
    currentVolume: 12,
    targetVolume: 16
  },
  strength: {
    MEV: 6,
    MAV: 12,
    MRV: 16,
    currentVolume: 8,
    targetVolume: 10
  },
  fat_loss: {
    MEV: 8,
    MAV: 16,
    MRV: 20,
    currentVolume: 10,
    targetVolume: 14
  },
  endurance: {
    MEV: 3,
    MAV: 8,
    MRV: 12,
    currentVolume: 4,
    targetVolume: 6
  },
  general_health: {
    MEV: 6,
    MAV: 12,
    MRV: 16,
    currentVolume: 8,
    targetVolume: 10
  }
};

// Default Autoregulation Configuration
export const DEFAULT_AUTOREGULATION: AutoregulationConfig = {
  enabled: true,
  recoveryThreshold: 66, // Whoop recovery score threshold
  strainThreshold: 15, // Whoop strain threshold
  sleepThreshold: 7, // Hours of sleep threshold
  adjustmentRules: [
    {
      condition: 'low_recovery',
      threshold: 50,
      adjustment: {
        volumeChange: -20, // Reduce volume by 20%
        intensityChange: -1, // Reduce RPE by 1
        exerciseSubstitution: true
      }
    },
    {
      condition: 'high_strain',
      threshold: 18,
      adjustment: {
        volumeChange: -15,
        intensityChange: -0.5,
        exerciseSubstitution: false
      }
    },
    {
      condition: 'poor_sleep',
      threshold: 6,
      adjustment: {
        volumeChange: -10,
        intensityChange: -0.5,
        exerciseSubstitution: false
      }
    },
    {
      condition: 'high_rpe',
      threshold: 9,
      adjustment: {
        volumeChange: -25,
        intensityChange: -1.5,
        exerciseSubstitution: true
      }
    }
  ]
};

// Exercise Selection by Movement Pattern and Goal
export const EXERCISE_SELECTION_TEMPLATES: Record<string, ExerciseSelection[]> = {
  muscle_gain: [
    {
      movementPattern: 'squat',
      primaryMuscles: ['legs', 'glutes'],
      exerciseIds: ['squat', 'goblet-squat', 'bulgarian-split-squat'],
      volumeAllocation: 25,
      frequencyPerWeek: 2,
      intensityRange: { min: 6, max: 8 }
    },
    {
      movementPattern: 'hinge',
      primaryMuscles: ['glutes', 'back'],
      exerciseIds: ['deadlift', 'romanian-deadlift', 'hip-thrust'],
      volumeAllocation: 20,
      frequencyPerWeek: 2,
      intensityRange: { min: 6, max: 8 }
    },
    {
      movementPattern: 'push',
      primaryMuscles: ['chest', 'shoulders', 'triceps'],
      exerciseIds: ['push-up', 'bench-press', 'overhead-press'],
      volumeAllocation: 25,
      frequencyPerWeek: 2,
      intensityRange: { min: 6, max: 8 }
    },
    {
      movementPattern: 'pull',
      primaryMuscles: ['back', 'biceps'],
      exerciseIds: ['dumbbell-row', 'pull-up', 'lat-pulldown'],
      volumeAllocation: 25,
      frequencyPerWeek: 2,
      intensityRange: { min: 6, max: 8 }
    },
    {
      movementPattern: 'lunge',
      primaryMuscles: ['legs', 'glutes'],
      exerciseIds: ['lunge', 'reverse-lunge', 'lateral-lunge'],
      volumeAllocation: 5,
      frequencyPerWeek: 1,
      intensityRange: { min: 5, max: 7 }
    }
  ],
  strength: [
    {
      movementPattern: 'squat',
      primaryMuscles: ['legs', 'glutes'],
      exerciseIds: ['squat', 'front-squat', 'box-squat'],
      volumeAllocation: 30,
      frequencyPerWeek: 3,
      intensityRange: { min: 7, max: 9 }
    },
    {
      movementPattern: 'hinge',
      primaryMuscles: ['glutes', 'back'],
      exerciseIds: ['deadlift', 'sumo-deadlift', 'rack-pull'],
      volumeAllocation: 30,
      frequencyPerWeek: 2,
      intensityRange: { min: 7, max: 9 }
    },
    {
      movementPattern: 'push',
      primaryMuscles: ['chest', 'shoulders', 'triceps'],
      exerciseIds: ['bench-press', 'overhead-press', 'close-grip-bench'],
      volumeAllocation: 25,
      frequencyPerWeek: 2,
      intensityRange: { min: 7, max: 9 }
    },
    {
      movementPattern: 'pull',
      primaryMuscles: ['back', 'biceps'],
      exerciseIds: ['dumbbell-row', 'barbell-row', 'weighted-pull-up'],
      volumeAllocation: 15,
      frequencyPerWeek: 2,
      intensityRange: { min: 6, max: 8 }
    }
  ],
  fat_loss: [
    {
      movementPattern: 'squat',
      primaryMuscles: ['legs', 'glutes'],
      exerciseIds: ['squat', 'jump-squat', 'goblet-squat'],
      volumeAllocation: 20,
      frequencyPerWeek: 3,
      intensityRange: { min: 6, max: 8 }
    },
    {
      movementPattern: 'hinge',
      primaryMuscles: ['glutes', 'back'],
      exerciseIds: ['deadlift', 'kettlebell-swing', 'romanian-deadlift'],
      volumeAllocation: 20,
      frequencyPerWeek: 2,
      intensityRange: { min: 6, max: 8 }
    },
    {
      movementPattern: 'push',
      primaryMuscles: ['chest', 'shoulders', 'triceps'],
      exerciseIds: ['push-up', 'burpee', 'mountain-climbers'],
      volumeAllocation: 25,
      frequencyPerWeek: 3,
      intensityRange: { min: 7, max: 9 }
    },
    {
      movementPattern: 'pull',
      primaryMuscles: ['back', 'biceps'],
      exerciseIds: ['dumbbell-row', 'pull-up', 'resistance-band-row'],
      volumeAllocation: 20,
      frequencyPerWeek: 2,
      intensityRange: { min: 6, max: 8 }
    },
    {
      movementPattern: 'carry',
      primaryMuscles: ['full-body', 'core'],
      exerciseIds: ['jumping-jacks', 'high-knees', 'butt-kicks'],
      volumeAllocation: 15,
      frequencyPerWeek: 4,
      intensityRange: { min: 7, max: 9 }
    }
  ],
  endurance: [
    {
      movementPattern: 'carry',
      primaryMuscles: ['cardio', 'legs'],
      exerciseIds: ['easy-run', 'tempo-run', 'long-run'],
      volumeAllocation: 60,
      frequencyPerWeek: 4,
      intensityRange: { min: 4, max: 8 }
    },
    {
      movementPattern: 'squat',
      primaryMuscles: ['legs', 'glutes'],
      exerciseIds: ['squat', 'single-leg-squat', 'jump-squat'],
      volumeAllocation: 15,
      frequencyPerWeek: 2,
      intensityRange: { min: 5, max: 7 }
    },
    {
      movementPattern: 'push',
      primaryMuscles: ['chest', 'shoulders'],
      exerciseIds: ['push-up', 'pike-push-up', 'handstand-push-up'],
      volumeAllocation: 15,
      frequencyPerWeek: 2,
      intensityRange: { min: 5, max: 7 }
    },
    {
      movementPattern: 'pull',
      primaryMuscles: ['back', 'biceps'],
      exerciseIds: ['pull-up', 'inverted-row', 'resistance-band-row'],
      volumeAllocation: 10,
      frequencyPerWeek: 2,
      intensityRange: { min: 5, max: 7 }
    }
  ],
  general_health: [
    {
      movementPattern: 'squat',
      primaryMuscles: ['legs', 'glutes'],
      exerciseIds: ['squat', 'chair-squat', 'wall-sit'],
      volumeAllocation: 25,
      frequencyPerWeek: 2,
      intensityRange: { min: 4, max: 6 }
    },
    {
      movementPattern: 'push',
      primaryMuscles: ['chest', 'shoulders', 'triceps'],
      exerciseIds: ['push-up', 'wall-push-up', 'incline-push-up'],
      volumeAllocation: 25,
      frequencyPerWeek: 2,
      intensityRange: { min: 4, max: 6 }
    },
    {
      movementPattern: 'pull',
      primaryMuscles: ['back', 'biceps'],
      exerciseIds: ['dumbbell-row', 'resistance-band-row', 'seated-row'],
      volumeAllocation: 25,
      frequencyPerWeek: 2,
      intensityRange: { min: 4, max: 6 }
    },
    {
      movementPattern: 'hinge',
      primaryMuscles: ['glutes', 'back'],
      exerciseIds: ['deadlift', 'good-morning', 'glute-bridge'],
      volumeAllocation: 15,
      frequencyPerWeek: 1,
      intensityRange: { min: 4, max: 6 }
    },
    {
      movementPattern: 'carry',
      primaryMuscles: ['cardio', 'full-body'],
      exerciseIds: ['walking', 'light-jogging', 'swimming'],
      volumeAllocation: 10,
      frequencyPerWeek: 3,
      intensityRange: { min: 3, max: 5 }
    }
  ]
};

// RPE Scale with Descriptions
export const RPE_SCALE = {
  1: { description: 'Very Easy', guidance: 'Could do many more reps' },
  2: { description: 'Easy', guidance: 'Could do many more reps' },
  3: { description: 'Moderate', guidance: 'Could do several more reps' },
  4: { description: 'Somewhat Hard', guidance: 'Could do several more reps' },
  5: { description: 'Hard', guidance: 'Could do 4-6 more reps' },
  6: { description: 'Hard+', guidance: 'Could do 3-4 more reps' },
  7: { description: 'Very Hard', guidance: 'Could do 2-3 more reps' },
  8: { description: 'Very Hard+', guidance: 'Could do 1-2 more reps' },
  9: { description: 'Extremely Hard', guidance: 'Could do 1 more rep' },
  10: { description: 'Maximum', guidance: 'Could not do any more reps' }
};

// Mesocycle Phase Characteristics
export const MESOCYCLE_PHASES = {
  accumulation: {
    name: 'Accumulation',
    description: 'Build volume and work capacity',
    volumeMultiplier: 1.0,
    intensityRange: { min: 6, max: 7 },
    duration: '3-4 weeks',
    focus: 'Volume, technique, adaptation'
  },
  intensification: {
    name: 'Intensification', 
    description: 'Increase intensity while maintaining volume',
    volumeMultiplier: 0.9,
    intensityRange: { min: 7, max: 8.5 },
    duration: '2-3 weeks',
    focus: 'Intensity, strength, power'
  },
  realization: {
    name: 'Realization',
    description: 'Peak performance and testing',
    volumeMultiplier: 0.7,
    intensityRange: { min: 8, max: 10 },
    duration: '1-2 weeks',
    focus: 'Peak performance, testing maxes'
  },
  deload: {
    name: 'Deload',
    description: 'Recovery and adaptation',
    volumeMultiplier: 0.5,
    intensityRange: { min: 4, max: 6 },
    duration: '1 week',
    focus: 'Recovery, mobility, light movement'
  }
};
