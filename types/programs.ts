export type GoalType = 'muscle_gain' | 'fat_loss' | 'endurance' | 'strength' | 'general_health';

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
  suggestedTimeframes: Array<{ value: number; unit: TimeframeUnit }>;
  exampleTargets: string[];
}
