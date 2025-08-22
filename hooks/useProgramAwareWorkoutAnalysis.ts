import { useEffect, useState } from 'react';
import { useWhoopStore } from '@/store/whoopStore';
import { useProgramStore } from '@/store/programStore';
import programAwareDataAnalysisService, { WorkoutAdjustment, AutoAdjustmentSettings } from '@/services/programAwareDataAnalysis';

export const useProgramAwareWorkoutAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAdjustment, setCurrentAdjustment] = useState<WorkoutAdjustment | null>(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState<WorkoutAdjustment[]>([]);
  const [settings, setSettings] = useState<AutoAdjustmentSettings>(
    programAwareDataAnalysisService.getDefaultSettings()
  );

  // Whoop store
  const {
    data: whoopData,
    userProfile,
    activePrograms,
    getTodaysWorkout,
    isConnectedToWhoop
  } = useWhoopStore();

  // Program store
  const {
    goals: programGoals,
    getGoalSummary
  } = useProgramStore();

  const analyzeAndAdjustTodaysWorkout = async (): Promise<WorkoutAdjustment | null> => {
    if (!settings.enabled || !isConnectedToWhoop) {
      console.log('Auto-adjustment disabled or not connected to Whoop');
      return null;
    }

    const todaysWorkout = getTodaysWorkout();
    if (!todaysWorkout) {
      console.log('No workout found for today');
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      const adjustment = await programAwareDataAnalysisService.analyzeAndAdjustTodaysWorkout(
        todaysWorkout,
        whoopData,
        userProfile,
        activePrograms,
        programGoals,
        getGoalSummary,
        settings
      );

      if (adjustment) {
        console.log('Workout adjustment generated:', {
          type: adjustment.adjustmentType,
          reason: adjustment.adjustmentReason,
          confidence: adjustment.confidenceScore
        });

        setCurrentAdjustment(adjustment);
        setAdjustmentHistory(prev => [adjustment, ...prev.slice(0, 9)]);
      }

      return adjustment;
    } catch (error) {
      console.error('Error analyzing workout:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateSettings = (newSettings: Partial<AutoAdjustmentSettings>) => {
    const validatedSettings = programAwareDataAnalysisService.validateSettings({
      ...settings,
      ...newSettings
    });
    setSettings(validatedSettings);
    console.log('Auto-adjustment settings updated:', validatedSettings);
  };

  const acceptAdjustment = () => {
    if (currentAdjustment) {
      console.log('Workout adjustment accepted:', currentAdjustment.adjustmentReason);
      setCurrentAdjustment(null);
    }
  };

  const dismissAdjustment = () => {
    if (currentAdjustment) {
      console.log('Workout adjustment dismissed');
      setCurrentAdjustment(null);
    }
  };

  const getAdjustedTodaysWorkout = () => {
    const originalWorkout = getTodaysWorkout();
    if (currentAdjustment && originalWorkout) {
      return currentAdjustment.adjustedWorkout;
    }
    return originalWorkout;
  };

  // Auto-analyze when conditions change
  useEffect(() => {
    if (settings.enabled && isConnectedToWhoop && whoopData.recovery.length > 0) {
      const timer = setTimeout(() => {
        analyzeAndAdjustTodaysWorkout();
      }, 1000); // Delay to avoid rapid re-analysis

      return () => clearTimeout(timer);
    }
  }, [whoopData.recovery, settings.enabled, isConnectedToWhoop]);

  return {
    // State
    isAnalyzing,
    currentAdjustment,
    adjustmentHistory,
    settings,
    
    // Actions
    analyzeAndAdjustTodaysWorkout,
    updateSettings,
    acceptAdjustment,
    dismissAdjustment,
    getAdjustedTodaysWorkout,
    
    // Computed
    hasAdjustment: !!currentAdjustment,
    isEnabled: settings.enabled && isConnectedToWhoop
  };
};

export default useProgramAwareWorkoutAnalysis;