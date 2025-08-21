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
  isActive: boolean;
  priority: 'primary' | 'secondary';
}

export interface ProgressEntry {
  date: string;
  value: number;
  notes?: string;
}

export interface UserProgress {
  goalId: string;
  metricKey: string;
  history: ProgressEntry[];
  lastUpdated: string;
  currentValue: number;
  startingValue: number;
}

export interface GoalProgressSummary {
  goalId: string;
  percentComplete: number; // 0-100
  weeksElapsed: number;
  totalWeeks: number;
  paceVsPlan: 'ahead' | 'on_track' | 'behind';
  currentValue: number;
  targetValue: number;
  weeklyTarget: number;
  daysRemaining: number;
}

export interface GoalTemplate {
  id: string;
  type: GoalType;
  title: string;
  defaultMetricKey: string;
  description: string;
  suggestedTimeframes: { value: number; unit: TimeframeUnit }[];
  exampleTargets: string[];
  icon: string;
  color: string;
  benefits: string[];
  whoopIntegration: {
    recoveryWeight: number;
    strainTarget: number;
    sleepImportance: 'high' | 'medium' | 'low';
  };
}

export interface DailyRecommendation {
  id: string;
  goalId: string;
  type: 'workout' | 'nutrition' | 'recovery' | 'mindset';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  whoopBased: boolean;
  completed: boolean;
}

export interface WeeklyInsight {
  goalId: string;
  week: number;
  progressRate: number;
  recoveryTrend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
  adjustments: string[];
}
