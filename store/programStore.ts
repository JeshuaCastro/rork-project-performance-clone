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
} from '@/types/programs';

interface ProgramState {
  templates: GoalTemplate[];
  goals: ProgramGoal[];
  progress: Record<string, UserProgress>; // key: goalId
  isInitialized: boolean;

  addGoal: (goal: Omit<ProgramGoal, 'id' | 'startDate' | 'targetDate'> & { startDate?: string; targetDate?: string }) => string;
  removeGoal: (goalId: string) => void;
  logProgress: (goalId: string, value: number, date?: string) => void;
  getGoalSummary: (goalId: string) => GoalProgressSummary | null;
  getMetricLabel: (metricKey: string) => string;
}

const DEFAULT_TEMPLATES: GoalTemplate[] = [
  {
    id: 'tpl-muscle',
    type: 'muscle_gain',
    title: 'Muscle Gain',
    defaultMetricKey: 'muscle_mass',
    description: 'Build lean muscle with progressive overload and recovery-led cycles',
    suggestedTimeframes: [{ value: 12, unit: 'weeks' }],
    exampleTargets: ['+4 kg in 12 weeks', '+8 lb in 16 weeks'],
  },
  {
    id: 'tpl-fatloss',
    type: 'fat_loss',
    title: 'Fat Loss',
    defaultMetricKey: 'body_fat_pct',
    description: 'Sustainably reduce body fat while preserving lean mass',
    suggestedTimeframes: [{ value: 12, unit: 'weeks' }],
    exampleTargets: ['-5% in 12 weeks', '-10 lb in 10 weeks'],
  },
  {
    id: 'tpl-endurance',
    type: 'endurance',
    title: 'Endurance',
    defaultMetricKey: '5k_time',
    description: 'Improve aerobic performance with polarized training',
    suggestedTimeframes: [{ value: 12, unit: 'weeks' }],
    exampleTargets: ['Sub-20 5K', 'FTP +20W in 12 weeks'],
  },
  {
    id: 'tpl-strength',
    type: 'strength',
    title: 'Strength',
    defaultMetricKey: 'one_rep_max_total',
    description: 'Increase total strength via periodized cycles',
    suggestedTimeframes: [{ value: 12, unit: 'weeks' }],
    exampleTargets: ['+50 kg total in 12 weeks'],
  },
];

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      goals: [],
      progress: {},
      isInitialized: true,

      addGoal: (goal) => {
        const id = `goal-${Date.now()}`;
        const startDate = goal.startDate || new Date().toISOString().split('T')[0];
        const totalWeeks = goal.timeframe.unit === 'weeks' ? goal.timeframe.value : goal.timeframe.value * 4;
        const target = goal.targetDate || new Date(Date.now() + totalWeeks * 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

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

      logProgress: (goalId, value, date) => {
        const entryDate = date || new Date().toISOString().split('T')[0];
        set((state) => {
          const existing = state.progress[goalId];
          if (!existing) return state;
          const history = [...existing.history.filter((h) => h.date !== entryDate), { date: entryDate, value }]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return {
            progress: {
              ...state.progress,
              [goalId]: { ...existing, history, lastUpdated: entryDate },
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
        const weeksElapsed = Math.max(
          1,
          Math.ceil(
            (new Date().getTime() - new Date(goal.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
          )
        );
        const latest = up.history[up.history.length - 1]?.value ?? 0;
        const percentComplete = Math.max(0, Math.min(100, Math.round((latest / goal.targetValue) * 100)));

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
        };
      },

      getMetricLabel: (metricKey) => {
        const m = PROGRAM_METRICS.find((x) => x.key === metricKey);
        return m ? `${m.label} (${m.unit})` : metricKey;
      },
    }),
    {
      name: 'program-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ goals: state.goals, progress: state.progress }),
    }
  )
);
