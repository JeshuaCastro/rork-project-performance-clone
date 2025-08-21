import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROGRAM_METRICS } from '@/constants/programMetrics';
import type {
  GoalTemplate,
  ProgramGoal,
  GoalType,
  UserProgress,
  GoalProgressSummary,
  DailyRecommendation,
  WeeklyInsight,
} from '@/types/programs';

interface ProgramState {
  templates: GoalTemplate[];
  goals: ProgramGoal[];
  progress: Record<string, UserProgress>;
  dailyRecommendations: DailyRecommendation[];
  weeklyInsights: WeeklyInsight[];
  isInitialized: boolean;
  hasCompletedOnboarding: boolean;

  addGoal: (goal: Omit<ProgramGoal, 'id' | 'startDate' | 'targetDate'> & { startDate?: string; targetDate?: string }) => string;
  removeGoal: (goalId: string) => void;
  updateGoal: (goalId: string, updates: Partial<ProgramGoal>) => void;
  logProgress: (goalId: string, value: number, date?: string, notes?: string) => void;
  getGoalSummary: (goalId: string) => GoalProgressSummary | null;
  getMetricLabel: (metricKey: string) => string;
  getPrimaryGoal: () => ProgramGoal | null;
  getActiveGoals: () => ProgramGoal[];
  generateDailyRecommendations: (goalId: string) => void;
  completeRecommendation: (recommendationId: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const DEFAULT_TEMPLATES: GoalTemplate[] = [
  {
    id: 'tpl-marathon',
    type: 'endurance',
    title: 'Marathon Training',
    defaultMetricKey: 'marathon_time',
    description: 'Complete 26.2-mile marathon training program with progressive mileage buildup',
    suggestedTimeframes: [{ value: 16, unit: 'weeks' }, { value: 20, unit: 'weeks' }],
    exampleTargets: ['Sub-4:00 marathon', 'Sub-3:30 marathon', 'Finish first marathon'],
    icon: 'activity',
    color: '#45B7D1',
    benefits: ['Cardiovascular endurance', 'Mental toughness', 'Weight management', 'Life achievement'],
    whoopIntegration: {
      recoveryWeight: 0.9,
      strainTarget: 14,
      sleepImportance: 'high',
    },
  },
  {
    id: 'tpl-hypertrophy',
    type: 'muscle_gain',
    title: 'Hypertrophy Program',
    defaultMetricKey: 'muscle_mass',
    description: 'Maximize muscle growth with high-volume training and optimal recovery',
    suggestedTimeframes: [{ value: 12, unit: 'weeks' }, { value: 16, unit: 'weeks' }],
    exampleTargets: ['+5 lbs muscle', '+10 lbs muscle', '+2 kg lean mass'],
    icon: 'dumbbell',
    color: '#FF6B6B',
    benefits: ['Increased muscle size', 'Enhanced strength', 'Better physique', 'Improved metabolism'],
    whoopIntegration: {
      recoveryWeight: 0.8,
      strainTarget: 15,
      sleepImportance: 'high',
    },
  },
  {
    id: 'tpl-powerlifting',
    type: 'strength',
    title: 'Powerlifting Program',
    defaultMetricKey: 'one_rep_max_total',
    description: 'Maximize strength in squat, bench press, and deadlift with periodized training',
    suggestedTimeframes: [{ value: 12, unit: 'weeks' }, { value: 16, unit: 'weeks' }],
    exampleTargets: ['+50 lbs total', '+100 lbs total', '1000 lb club'],
    icon: 'trophy',
    color: '#F7DC6F',
    benefits: ['Maximum strength', 'Power development', 'Competition readiness', 'Mental fortitude'],
    whoopIntegration: {
      recoveryWeight: 0.8,
      strainTarget: 16,
      sleepImportance: 'high',
    },
  },
  {
    id: 'tpl-fat-loss',
    type: 'fat_loss',
    title: 'Fat Loss Program',
    defaultMetricKey: 'body_fat_pct',
    description: 'Sustainable fat loss while preserving muscle mass through smart training and nutrition',
    suggestedTimeframes: [{ value: 8, unit: 'weeks' }, { value: 12, unit: 'weeks' }, { value: 16, unit: 'weeks' }],
    exampleTargets: ['-10 lbs', '-20 lbs', '-5% body fat'],
    icon: 'scale',
    color: '#4ECDC4',
    benefits: ['Improved body composition', 'Better health markers', 'Increased energy', 'Enhanced confidence'],
    whoopIntegration: {
      recoveryWeight: 0.7,
      strainTarget: 12,
      sleepImportance: 'high',
    },
  },
  {
    id: 'tpl-5k-training',
    type: 'endurance',
    title: '5K Training Program',
    defaultMetricKey: '5k_time',
    description: 'Improve your 5K running time with structured speed and endurance work',
    suggestedTimeframes: [{ value: 8, unit: 'weeks' }, { value: 12, unit: 'weeks' }],
    exampleTargets: ['Sub-25:00 5K', 'Sub-20:00 5K', 'PR your 5K time'],
    icon: 'activity',
    color: '#96CEB4',
    benefits: ['Cardiovascular fitness', 'Speed development', 'Racing confidence', 'Quick results'],
    whoopIntegration: {
      recoveryWeight: 0.8,
      strainTarget: 13,
      sleepImportance: 'medium',
    },
  },
  {
    id: 'tpl-calisthenics',
    type: 'strength',
    title: 'Calisthenics Mastery',
    defaultMetricKey: 'bodyweight_skills',
    description: 'Master bodyweight movements like pull-ups, muscle-ups, and handstand push-ups',
    suggestedTimeframes: [{ value: 12, unit: 'weeks' }, { value: 16, unit: 'weeks' }],
    exampleTargets: ['20 pull-ups', 'First muscle-up', '10 handstand push-ups'],
    icon: 'dumbbell',
    color: '#A8E6CF',
    benefits: ['Functional strength', 'Body control', 'Minimal equipment needed', 'Impressive skills'],
    whoopIntegration: {
      recoveryWeight: 0.7,
      strainTarget: 14,
      sleepImportance: 'medium',
    },
  },
];

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      goals: [],
      progress: {},
      dailyRecommendations: [],
      weeklyInsights: [],
      isInitialized: true,
      hasCompletedOnboarding: false,

      addGoal: (goal) => {
        const id = `goal-${Date.now()}`;
        const startDate = goal.startDate || new Date().toISOString().split('T')[0];
        const totalWeeks = goal.timeframe.unit === 'weeks' ? goal.timeframe.value : goal.timeframe.value * 4;
        const target = goal.targetDate || new Date(Date.now() + totalWeeks * 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const state = get();
        const isPrimary = state.goals.length === 0 || goal.priority === 'primary';

        const newGoal: ProgramGoal = {
          id,
          type: goal.type,
          title: goal.title,
          targetValue: goal.targetValue,
          metricKey: goal.metricKey,
          timeframe: goal.timeframe,
          startDate,
          targetDate: target,
          notes: goal.notes,
          isActive: true,
          priority: isPrimary ? 'primary' : 'secondary',
        };

        set((state) => ({ goals: [...state.goals, newGoal] }));

        set((state) => ({
          progress: {
            ...state.progress,
            [id]: {
              goalId: id,
              metricKey: newGoal.metricKey,
              history: [{ date: startDate, value: 0 }],
              lastUpdated: startDate,
              currentValue: 0,
              startingValue: 0,
            },
          },
        }));

        return id;
      },

      removeGoal: (goalId) => {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== goalId) }));
        set((state) => {
          const next = { ...state.progress };
          delete next[goalId];
          return { progress: next };
        });
      },

      updateGoal: (goalId, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => g.id === goalId ? { ...g, ...updates } : g),
        }));
      },

      logProgress: (goalId, value, date, notes) => {
        const entryDate = date || new Date().toISOString().split('T')[0];
        set((state) => {
          const existing = state.progress[goalId];
          if (!existing) return state;
          const history = [...existing.history.filter((h) => h.date !== entryDate), { date: entryDate, value, notes }]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return {
            progress: {
              ...state.progress,
              [goalId]: { 
                ...existing, 
                history, 
                lastUpdated: entryDate,
                currentValue: value,
              },
            },
          };
        });
      },

      getGoalSummary: (goalId) => {
        const state = get();
        const goal = state.goals.find((g) => g.id === goalId);
        const up = state.progress[goalId];
        if (!goal || !up) return null;

        const weeksTotal = goal.timeframe.unit === 'weeks' ? goal.timeframe.value : goal.timeframe.value * 4;
        const startTime = new Date(goal.startDate).getTime();
        const targetTime = new Date(goal.targetDate).getTime();
        const currentTime = Date.now();
        
        const weeksElapsed = Math.max(
          1,
          Math.ceil((currentTime - startTime) / (7 * 24 * 60 * 60 * 1000))
        );
        
        const daysRemaining = Math.max(0, Math.ceil((targetTime - currentTime) / (24 * 60 * 60 * 1000)));
        const latest = up.currentValue;
        const percentComplete = Math.max(0, Math.min(100, Math.round((latest / goal.targetValue) * 100)));
        const weeklyTarget = goal.targetValue / weeksTotal;

        const plannedPerWeek = goal.targetValue / weeksTotal;
        const expectedByNow = plannedPerWeek * weeksElapsed;
        const paceVsPlan: GoalProgressSummary['paceVsPlan'] = latest > expectedByNow + plannedPerWeek * 0.5
          ? 'ahead'
          : latest < expectedByNow - plannedPerWeek * 0.5
          ? 'behind'
          : 'on_track';

        return {
          goalId,
          percentComplete,
          weeksElapsed: Math.min(weeksElapsed, weeksTotal),
          totalWeeks: weeksTotal,
          paceVsPlan,
          currentValue: latest,
          targetValue: goal.targetValue,
          weeklyTarget,
          daysRemaining,
        };
      },

      getMetricLabel: (metricKey) => {
        const m = PROGRAM_METRICS.find((x) => x.key === metricKey);
        return m ? `${m.label} (${m.unit})` : metricKey;
      },

      getPrimaryGoal: () => {
        const state = get();
        return state.goals.find((g) => g.priority === 'primary' && g.isActive) || null;
      },

      getActiveGoals: () => {
        const state = get();
        return state.goals.filter((g) => g.isActive);
      },

      generateDailyRecommendations: (goalId) => {
        const state = get();
        const goal = state.goals.find((g) => g.id === goalId);
        if (!goal) return;

        const recommendations: DailyRecommendation[] = [
          {
            id: `rec-${Date.now()}-1`,
            goalId,
            type: 'workout',
            title: 'Complete today\'s training',
            description: 'Follow your personalized workout plan',
            priority: 'high',
            estimatedTime: 45,
            whoopBased: true,
            completed: false,
          },
          {
            id: `rec-${Date.now()}-2`,
            goalId,
            type: 'nutrition',
            title: 'Log your meals',
            description: 'Track your nutrition to stay on target',
            priority: 'medium',
            estimatedTime: 10,
            whoopBased: false,
            completed: false,
          },
        ];

        set((state) => ({ dailyRecommendations: recommendations }));
      },

      completeRecommendation: (recommendationId) => {
        set((state) => ({
          dailyRecommendations: state.dailyRecommendations.map((r) =>
            r.id === recommendationId ? { ...r, completed: true } : r
          ),
        }));
      },

      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },

      resetOnboarding: () => {
        set({ hasCompletedOnboarding: false });
      },
    }),
    {
      name: 'program-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        goals: state.goals, 
        progress: state.progress, 
        hasCompletedOnboarding: state.hasCompletedOnboarding 
      }),
    }
  )
);
