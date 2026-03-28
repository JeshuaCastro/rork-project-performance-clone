export type GoalType = 'muscle_gain' | 'fat_loss' | 'endurance' | 'strength' | 'general_health';

export type MesocyclePhase = 'accumulation' | 'intensification' | 'realization' | 'deload';
export type MovementPattern = 'squat' | 'hinge' | 'push' | 'pull' | 'carry' | 'lunge' | 'rotate';
export type VolumeProgression = 'linear' | 'undulating' | 'block' | 'conjugate';
export type IntensityMethod = 'percentage' | 'rpe' | 'autoregulation';

export type TimeframeUnit = 'weeks' | 'months';

export interface GoalMetric {
  key: string;
  label: string;
  unit: string;
  description?: string;
}

export interface MetricDefinition extends GoalMetric {
  goalTypes: GoalType[];
  direction: 'increase' | 'decrease';
  recommendedRange?: { min?: number; max?: number };
}

export interface ProgramGoal {
  id: string;
  type: GoalType;
  title: string;
  targetValue: number;
  metricKey: string;
  timeframe: { value: number; unit: TimeframeUnit };
  startDate: string;
  targetDate: string;
  notes?: string;
  // Renaissance Periodization Integration
  periodization?: PeriodizationConfig;
  autoregulation?: AutoregulationConfig;
}

export interface PeriodizationConfig {
  totalMesocycles: number;
  currentMesocycle: number;
  mesocycleLength: number; // weeks
  phaseDistribution: {
    accumulation: number; // weeks
    intensification: number; // weeks
    realization: number; // weeks
    deload: number; // weeks
  };
  volumeLandmarks: VolumeLandmarks;
  intensityProgression: IntensityProgression;
}

export interface VolumeLandmarks {
  MEV: number; // Minimum Effective Volume (sets per week)
  MAV: number; // Maximum Adaptive Volume (sets per week)
  MRV: number; // Maximum Recoverable Volume (sets per week)
  currentVolume: number;
  targetVolume: number;
}

export interface IntensityProgression {
  method: IntensityMethod;
  startingIntensity: number; // RPE or %1RM
  peakIntensity: number;
  progressionRate: number; // per week
  autoregulationTriggers: AutoregulationTrigger[];
}

export interface AutoregulationConfig {
  enabled: boolean;
  recoveryThreshold: number; // Whoop recovery score threshold
  strainThreshold: number; // Whoop strain threshold
  sleepThreshold: number; // Hours of sleep threshold
  adjustmentRules: AutoregulationRule[];
}

export interface AutoregulationRule {
  condition: 'low_recovery' | 'high_strain' | 'poor_sleep' | 'high_rpe';
  threshold: number;
  adjustment: {
    volumeChange: number; // percentage change
    intensityChange: number; // RPE or % change
    exerciseSubstitution?: boolean;
  };
}

export interface AutoregulationTrigger {
  metric: 'recovery' | 'strain' | 'sleep' | 'rpe';
  threshold: number;
  action: 'reduce_volume' | 'reduce_intensity' | 'add_rest_day' | 'substitute_exercise';
  magnitude: number;
}

export interface ProgressEntry {
  date: string;
  value: number;
}

export interface UserProgress {
  goalId: string;
  metricKey: string;
  history: ProgressEntry[];
  lastUpdated: string;
}

export interface GoalProgressSummary {
  goalId: string;
  percentComplete: number; // 0-100
  weeksElapsed: number;
  totalWeeks: number;
  paceVsPlan: 'ahead' | 'on_track' | 'behind';
}

export interface GoalTemplate {
  id: string;
  type: GoalType;
  title: string;
  defaultMetricKey: string;
  description: string;
  suggestedTimeframes: { value: number; unit: TimeframeUnit }[];
  exampleTargets: string[];
  // Renaissance Periodization Templates
  defaultPeriodization?: Partial<PeriodizationConfig>;
  movementPatterns: MovementPattern[];
  volumeProgression: VolumeProgression;
  scientificRationale: string;
}

export interface ExerciseSelection {
  movementPattern: MovementPattern;
  primaryMuscles: string[];
  exerciseIds: string[];
  volumeAllocation: number; // percentage of total volume
  frequencyPerWeek: number;
  intensityRange: { min: number; max: number }; // RPE range
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  goalType: GoalType;
  mesocyclePhase: MesocyclePhase;
  week: number;
  exercises: ProgramExercise[];
  totalVolume: number; // total sets
  estimatedDuration: number; // minutes
  targetRPE: number;
  autoregulationNotes: string[];
}

export interface ProgramExercise {
  exerciseId: string;
  movementPattern: MovementPattern;
  sets: number;
  reps: string; // "8-12", "AMRAP", "3-5"
  targetRPE: number;
  restTime: string;
  progressionScheme: ProgressionScheme;
  autoregulationGuidelines: string[];
}

export interface ProgressionScheme {
  type: 'linear' | 'double_progression' | 'wave_loading' | 'autoregulation';
  parameters: {
    weeklyIncrease?: number; // for linear
    repRange?: { min: number; max: number }; // for double progression
    wavePattern?: number[]; // for wave loading
    rpeTargets?: number[]; // for autoregulation
  };
}
