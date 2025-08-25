import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROGRAM_METRICS, ENHANCED_GOAL_TEMPLATES, VOLUME_LANDMARKS, DEFAULT_AUTOREGULATION, EXERCISE_SELECTION_TEMPLATES, MESOCYCLE_PHASES } from '@/constants/programMetrics';
import type {
  GoalTemplate,
  ProgramGoal,
  GoalType,
  UserProgress,
  GoalProgressSummary,
  PeriodizationConfig,
  WorkoutTemplate,
  MesocyclePhase,
  ExerciseSelection,
} from '@/types/programs';

interface ProgramState {
  templates: GoalTemplate[];
  goals: ProgramGoal[];
  progress: Record<string, UserProgress>; // key: goalId
  workoutTemplates: WorkoutTemplate[];
  isInitialized: boolean;

  // Core functionality
  addGoal: (goal: Omit<ProgramGoal, 'id' | 'startDate' | 'targetDate'> & { startDate?: string; targetDate?: string }) => string;
  removeGoal: (goalId: string) => void;
  logProgress: (goalId: string, value: number, date?: string) => void;
  getGoalSummary: (goalId: string) => GoalProgressSummary | null;
  getMetricLabel: (metricKey: string) => string;

  // Renaissance Periodization functionality
  generatePeriodizedProgram: (goalId: string) => WorkoutTemplate[];
  getCurrentMesocyclePhase: (goalId: string) => MesocyclePhase | null;
  getVolumeRecommendation: (goalType: GoalType, currentWeek: number) => number;
  applyAutoregulation: (goalId: string, whoopData: { recovery: number; strain: number; sleep: number }) => void;
  getExerciseSelectionForGoal: (goalType: GoalType) => ExerciseSelection[];
  updatePeriodizationConfig: (goalId: string, config: Partial<PeriodizationConfig>) => void;
}

// Helper function to create default periodization config
const createDefaultPeriodization = (goalType: GoalType, totalWeeks: number): PeriodizationConfig => {
  const mesocycleLength = Math.max(4, Math.floor(totalWeeks / 3));
  const totalMesocycles = Math.ceil(totalWeeks / mesocycleLength);
  
  return {
    totalMesocycles,
    currentMesocycle: 1,
    mesocycleLength,
    phaseDistribution: {
      accumulation: Math.floor(mesocycleLength * 0.5),
      intensification: Math.floor(mesocycleLength * 0.3),
      realization: Math.floor(mesocycleLength * 0.15),
      deload: Math.max(1, Math.floor(mesocycleLength * 0.05))
    },
    volumeLandmarks: VOLUME_LANDMARKS[goalType] || VOLUME_LANDMARKS.general_health,
    intensityProgression: {
      method: 'rpe',
      startingIntensity: goalType === 'strength' ? 7 : 6,
      peakIntensity: goalType === 'strength' ? 9 : 8,
      progressionRate: 0.25,
      autoregulationTriggers: [
        {
          metric: 'recovery',
          threshold: 50,
          action: 'reduce_volume',
          magnitude: 0.2
        },
        {
          metric: 'strain',
          threshold: 18,
          action: 'reduce_intensity',
          magnitude: 0.5
        }
      ]
    }
  };
};

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      templates: ENHANCED_GOAL_TEMPLATES as GoalTemplate[],
      goals: [],
      progress: {},
      workoutTemplates: [],
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
          // Add Renaissance Periodization
          periodization: createDefaultPeriodization(goal.type, totalWeeks),
          autoregulation: DEFAULT_AUTOREGULATION,
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

        // Generate initial workout templates
        const workoutTemplates = get().generatePeriodizedProgram(id);
        set((state) => ({ workoutTemplates: [...state.workoutTemplates, ...workoutTemplates] }));

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

      // Renaissance Periodization Methods
      generatePeriodizedProgram: (goalId) => {
        const state = get();
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal || !goal.periodization) return [];

        const { periodization } = goal;
        const exerciseSelections = EXERCISE_SELECTION_TEMPLATES[goal.type] || [];
        const templates: WorkoutTemplate[] = [];

        // Generate templates for each week of the mesocycle
        for (let week = 1; week <= periodization.mesocycleLength; week++) {
          const phase = get().getCurrentMesocyclePhase(goalId);
          if (!phase) continue;

          const phaseConfig = MESOCYCLE_PHASES[phase];
          const baseVolume = periodization.volumeLandmarks.currentVolume;
          const adjustedVolume = Math.round(baseVolume * phaseConfig.volumeMultiplier);

          const template: WorkoutTemplate = {
            id: `${goalId}-week-${week}`,
            name: `Week ${week} - ${phaseConfig.name}`,
            goalType: goal.type,
            mesocyclePhase: phase,
            week,
            exercises: exerciseSelections.map(selection => ({
              exerciseId: selection.exerciseIds[0], // Use primary exercise
              movementPattern: selection.movementPattern,
              sets: Math.round((adjustedVolume * selection.volumeAllocation) / 100),
              reps: goal.type === 'strength' ? '3-5' : goal.type === 'endurance' ? '12-15' : '8-12',
              targetRPE: Math.min(10, Math.max(1, 
                phaseConfig.intensityRange.min + 
                ((phaseConfig.intensityRange.max - phaseConfig.intensityRange.min) * (week - 1) / (periodization.mesocycleLength - 1))
              )),
              restTime: goal.type === 'strength' ? '3-5 min' : goal.type === 'endurance' ? '30-60 sec' : '60-90 sec',
              progressionScheme: {
                type: 'autoregulation',
                parameters: {
                  rpeTargets: [selection.intensityRange.min, selection.intensityRange.max]
                }
              },
              autoregulationGuidelines: [
                `Target RPE: ${Math.round(phaseConfig.intensityRange.min)}-${Math.round(phaseConfig.intensityRange.max)}`,
                'Adjust volume based on recovery metrics',
                'Substitute exercises if form breaks down'
              ]
            })),
            totalVolume: adjustedVolume,
            estimatedDuration: goal.type === 'endurance' ? 60 : 45,
            targetRPE: Math.round((phaseConfig.intensityRange.min + phaseConfig.intensityRange.max) / 2),
            autoregulationNotes: [
              `${phaseConfig.name} Phase: ${phaseConfig.focus}`,
              `Volume: ${adjustedVolume} sets (${Math.round(phaseConfig.volumeMultiplier * 100)}% of baseline)`,
              'Monitor recovery and adjust accordingly'
            ]
          };

          templates.push(template);
        }

        return templates;
      },

      getCurrentMesocyclePhase: (goalId) => {
        const state = get();
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal || !goal.periodization) return null;

        const { periodization } = goal;
        const startDate = new Date(goal.startDate);
        const currentDate = new Date();
        const weeksElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weekInMesocycle = (weeksElapsed % periodization.mesocycleLength) + 1;

        const { phaseDistribution } = periodization;
        if (weekInMesocycle <= phaseDistribution.accumulation) {
          return 'accumulation';
        } else if (weekInMesocycle <= phaseDistribution.accumulation + phaseDistribution.intensification) {
          return 'intensification';
        } else if (weekInMesocycle <= phaseDistribution.accumulation + phaseDistribution.intensification + phaseDistribution.realization) {
          return 'realization';
        } else {
          return 'deload';
        }
      },

      getVolumeRecommendation: (goalType, currentWeek) => {
        const landmarks = VOLUME_LANDMARKS[goalType] || VOLUME_LANDMARKS.general_health;
        const progressionRate = 0.1; // 10% increase per week
        const weeklyIncrease = landmarks.MEV * progressionRate;
        const recommendedVolume = landmarks.MEV + (weeklyIncrease * (currentWeek - 1));
        
        return Math.min(recommendedVolume, landmarks.MRV);
      },

      applyAutoregulation: (goalId, whoopData) => {
        const state = get();
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal || !goal.autoregulation?.enabled) return;

        const { autoregulation } = goal;
        let adjustments = { volumeChange: 0, intensityChange: 0, exerciseSubstitution: false };

        // Check each autoregulation rule
        autoregulation.adjustmentRules.forEach(rule => {
          let shouldApply = false;
          
          switch (rule.condition) {
            case 'low_recovery':
              shouldApply = whoopData.recovery < rule.threshold;
              break;
            case 'high_strain':
              shouldApply = whoopData.strain > rule.threshold;
              break;
            case 'poor_sleep':
              shouldApply = whoopData.sleep < rule.threshold;
              break;
          }

          if (shouldApply) {
            adjustments.volumeChange += rule.adjustment.volumeChange;
            adjustments.intensityChange += rule.adjustment.intensityChange;
            adjustments.exerciseSubstitution = adjustments.exerciseSubstitution || rule.adjustment.exerciseSubstitution || false;
          }
        });

        // Apply adjustments to current workout templates
        if (adjustments.volumeChange !== 0 || adjustments.intensityChange !== 0) {
          console.log(`Autoregulation applied for goal ${goalId}:`, adjustments);
          // Update workout templates with adjustments
          // This would modify the current week's workout based on recovery data
        }
      },

      getExerciseSelectionForGoal: (goalType) => {
        return EXERCISE_SELECTION_TEMPLATES[goalType] || [];
      },

      updatePeriodizationConfig: (goalId, config) => {
        set((state) => ({
          goals: state.goals.map(goal => 
            goal.id === goalId 
              ? { ...goal, periodization: { ...goal.periodization, ...config } as PeriodizationConfig }
              : goal
          )
        }));
      },
    }),
    {
      name: 'program-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        goals: state.goals, 
        progress: state.progress, 
        workoutTemplates: state.workoutTemplates 
      }),
    }
  )
);
