import { WhoopData, TrainingProgram, TodaysWorkout, UserProfile } from '@/types/whoop';
import { ProgramGoal, GoalProgressSummary, MesocyclePhase } from '@/types/programs';
import { MESOCYCLE_PHASES, RPE_SCALE } from '@/constants/programMetrics';

export interface ProgramAwareAnalysis {
  currentPhase: MesocyclePhase;
  volumeRecommendation: 'maintain' | 'increase' | 'decrease';
  intensityAdjustment: number; // -2 to +2 RPE adjustment
  exerciseSubstitutions: string[];
  restDayRecommendation: boolean;
  notes: string[];
  autoregulationTriggers: string[];
}

export interface RPEGuidance {
  targetRPE: number;
  description: string;
  guidance: string;
  adjustedRPE: number;
  autoregulationNotes: string[];
}

export interface WorkoutAdjustment {
  originalWorkout: TodaysWorkout;
  adjustedWorkout: TodaysWorkout;
  adjustmentReason: string;
  adjustmentType: 'intensity' | 'duration' | 'type' | 'skip' | 'add_recovery';
  confidenceScore: number; // 0-1
  whoopMetrics: {
    recovery: number;
    strain: number;
    hrv: number;
    sleepQuality: number;
  };
  // Renaissance Periodization additions
  renaissanceAnalysis?: ProgramAwareAnalysis;
  rpeGuidance?: RPEGuidance;
}

export interface ProgramAdjustment {
  programId: string;
  adjustmentDate: string;
  adjustments: WorkoutAdjustment[];
  overallReason: string;
  programProgress: {
    currentWeek: number;
    totalWeeks: number;
    goalProgress: number; // 0-100
    paceVsPlan: 'ahead' | 'on_track' | 'behind';
  };
}

export interface AutoAdjustmentSettings {
  enabled: boolean;
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  minRecoveryForIntense: number; // 0-100
  maxStrainThreshold: number; // 0-20
  sleepQualityThreshold: number; // 0-100
  hrvThreshold: number; // ms
  allowSkipWorkouts: boolean;
  allowIntensityIncrease: boolean;
  respectProgramGoals: boolean;
}

/**
 * Renaissance Periodization Service
 * Implements scientific training principles with autoregulation
 */
export class RenaissancePeriodizationService {
  /**
   * Analyzes Whoop data and provides Renaissance Periodization recommendations
   */
  static analyzeRecoveryForProgram(
    whoopData: WhoopData,
    programGoal: ProgramGoal,
    currentWeek: number
  ): ProgramAwareAnalysis {
    const recovery = whoopData.recovery?.find(r => r.date === new Date().toISOString().split('T')[0])?.score || 50;
    const strain = whoopData.strain?.find(s => s.date === new Date().toISOString().split('T')[0])?.score || 10;
    const sleep = whoopData.sleep?.find(s => s.date === new Date().toISOString().split('T')[0])?.efficiency || 80;
    
    // Determine current mesocycle phase
    const currentPhase = this.getCurrentMesocyclePhase(programGoal, currentWeek);
    const phaseConfig = MESOCYCLE_PHASES[currentPhase];
    
    // Initialize recommendations
    let volumeRecommendation: ProgramAwareAnalysis['volumeRecommendation'] = 'maintain';
    let intensityAdjustment = 0;
    let exerciseSubstitutions: string[] = [];
    let restDayRecommendation = false;
    const notes: string[] = [];
    const autoregulationTriggers: string[] = [];

    // Apply autoregulation rules based on recovery metrics
    if (recovery < 33) {
      volumeRecommendation = 'decrease';
      intensityAdjustment = -2;
      restDayRecommendation = true;
      exerciseSubstitutions = [
        'Replace compound movements with isolation exercises',
        'Substitute high-impact cardio with walking or swimming',
        'Use machine exercises instead of free weights for safety'
      ];
      notes.push('🔴 Very low recovery (< 33%). Significant training modifications needed.');
      autoregulationTriggers.push('CRITICAL_RECOVERY');
    } else if (recovery < 50) {
      volumeRecommendation = 'decrease';
      intensityAdjustment = -1;
      exerciseSubstitutions = [
        'Reduce range of motion if joints feel stiff',
        'Use lighter weights with focus on form'
      ];
      notes.push('🟡 Low recovery (33-50%). Reduce training load.');
      autoregulationTriggers.push('LOW_RECOVERY');
    } else if (recovery < 66) {
      if (currentPhase === 'intensification' || currentPhase === 'realization') {
        intensityAdjustment = -0.5;
      }
      notes.push('🟡 Moderate recovery (50-66%). Proceed with caution.');
    } else {
      if (currentPhase === 'accumulation' && recovery > 80) {
        volumeRecommendation = 'increase';
        notes.push('🟢 Excellent recovery (> 80%). Consider volume progression.');
      } else {
        notes.push('🟢 Good recovery (66-80%). Proceed with planned training.');
      }
    }

    // High strain adjustments (overreaching prevention)
    if (strain > 18) {
      if (volumeRecommendation === 'increase') {
        volumeRecommendation = 'maintain';
      }
      intensityAdjustment = Math.min(intensityAdjustment - 1, -2);
      notes.push('⚠️ High strain (> 18). Risk of overreaching - reduce intensity.');
      autoregulationTriggers.push('HIGH_STRAIN');
    } else if (strain > 15) {
      notes.push('🟡 Elevated strain (15-18). Monitor fatigue closely.');
    }

    // Sleep quality adjustments
    if (sleep < 70) {
      intensityAdjustment = Math.min(intensityAdjustment - 0.5, -2);
      notes.push('😴 Poor sleep quality (< 70%). Reduce intensity for safety.');
      autoregulationTriggers.push('POOR_SLEEP');
    } else if (sleep < 80) {
      notes.push('🟡 Moderate sleep quality (70-80%). Monitor energy levels.');
    }

    // Phase-specific guidance
    notes.push(`📊 Current Phase: ${phaseConfig.name} - ${phaseConfig.focus}`);
    
    switch (currentPhase) {
      case 'accumulation':
        notes.push('🎯 Focus: Build volume progressively, perfect technique, adapt to training stress.');
        break;
      case 'intensification':
        notes.push('🎯 Focus: Increase intensity while managing fatigue accumulation.');
        if (recovery < 50) {
          notes.push('⚠️ Consider extending accumulation phase if recovery is consistently low.');
        }
        break;
      case 'realization':
        notes.push('🎯 Focus: Peak performance, test maxes, demonstrate adaptations.');
        if (recovery < 66) {
          notes.push('⚠️ Sub-optimal recovery for peak performance. Consider light deload.');
        }
        break;
      case 'deload':
        volumeRecommendation = 'decrease';
        intensityAdjustment = Math.min(intensityAdjustment - 1, -2);
        notes.push('🎯 Focus: Active recovery, mobility, prepare for next mesocycle.');
        break;
    }

    return {
      currentPhase,
      volumeRecommendation,
      intensityAdjustment,
      exerciseSubstitutions,
      restDayRecommendation,
      notes,
      autoregulationTriggers
    };
  }

  /**
   * Determines current mesocycle phase based on program timeline
   */
  static getCurrentMesocyclePhase(programGoal: ProgramGoal, currentWeek: number): MesocyclePhase {
    if (!programGoal.periodization) {
      // Default phase distribution for programs without explicit periodization
      const totalWeeks = programGoal.timeframe.unit === 'weeks' 
        ? programGoal.timeframe.value 
        : programGoal.timeframe.value * 4;
      
      const phaseProgress = currentWeek / totalWeeks;
      
      if (phaseProgress < 0.5) return 'accumulation';
      if (phaseProgress < 0.75) return 'intensification';
      if (phaseProgress < 0.95) return 'realization';
      return 'deload';
    }

    const { mesocycleLength, phaseDistribution } = programGoal.periodization;
    const weekInMesocycle = ((currentWeek - 1) % mesocycleLength) + 1;

    if (weekInMesocycle <= phaseDistribution.accumulation) {
      return 'accumulation';
    } else if (weekInMesocycle <= phaseDistribution.accumulation + phaseDistribution.intensification) {
      return 'intensification';
    } else if (weekInMesocycle <= phaseDistribution.accumulation + phaseDistribution.intensification + phaseDistribution.realization) {
      return 'realization';
    } else {
      return 'deload';
    }
  }

  /**
   * Generates RPE guidance with autoregulation
   */
  static generateRPEGuidance(
    baseRPE: number,
    analysis: ProgramAwareAnalysis
  ): RPEGuidance {
    const adjustedRPE = Math.max(1, Math.min(10, baseRPE + analysis.intensityAdjustment));
    const rpeData = RPE_SCALE[adjustedRPE as keyof typeof RPE_SCALE];
    
    const autoregulationNotes: string[] = [];
    
    if (analysis.intensityAdjustment < 0) {
      autoregulationNotes.push(`Reduced from RPE ${baseRPE} due to recovery metrics`);
    } else if (analysis.intensityAdjustment > 0) {
      autoregulationNotes.push(`Increased from RPE ${baseRPE} due to excellent recovery`);
    }
    
    if (analysis.autoregulationTriggers.length > 0) {
      autoregulationNotes.push(`Triggers: ${analysis.autoregulationTriggers.join(', ')}`);
    }

    return {
      targetRPE: baseRPE,
      description: rpeData.description,
      guidance: rpeData.guidance,
      adjustedRPE,
      autoregulationNotes
    };
  }

  /**
   * Gets volume adjustment multiplier based on recommendation
   */
  static getVolumeAdjustmentMultiplier(recommendation: ProgramAwareAnalysis['volumeRecommendation']): number {
    switch (recommendation) {
      case 'increase': return 1.15; // 15% increase
      case 'decrease': return 0.75; // 25% decrease
      case 'maintain': return 1.0;
      default: return 1.0;
    }
  }

  /**
   * Determines if workout should be skipped entirely
   */
  static shouldSkipWorkout(analysis: ProgramAwareAnalysis): boolean {
    return analysis.restDayRecommendation && 
           analysis.autoregulationTriggers.includes('CRITICAL_RECOVERY');
  }
}

class ProgramAwareDataAnalysisService {
  private defaultSettings: AutoAdjustmentSettings = {
    enabled: true,
    aggressiveness: 'moderate',
    minRecoveryForIntense: 70,
    maxStrainThreshold: 15,
    sleepQualityThreshold: 70,
    hrvThreshold: 40,
    allowSkipWorkouts: true,
    allowIntensityIncrease: true,
    respectProgramGoals: true
  };

  /**
   * Analyzes current Whoop data and automatically adjusts today's workout
   * Now includes Renaissance Periodization principles
   */
  public async analyzeAndAdjustTodaysWorkout(
    todaysWorkout: TodaysWorkout | null,
    whoopData: WhoopData,
    userProfile: UserProfile,
    activePrograms: TrainingProgram[],
    programGoals: ProgramGoal[],
    getGoalSummary: (goalId: string) => GoalProgressSummary | null,
    settings: Partial<AutoAdjustmentSettings> = {}
  ): Promise<WorkoutAdjustment | null> {
    if (!todaysWorkout || !settings.enabled) {
      return null;
    }

    const adjustmentSettings = { ...this.defaultSettings, ...settings };
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's metrics
    const todaysRecovery = whoopData.recovery.find(r => r.date === today);
    const todaysStrain = whoopData.strain.find(s => s.date === today);
    const todaysSleep = whoopData.sleep.find(s => s.date === today);
    
    if (!todaysRecovery) {
      console.log('No recovery data available for workout adjustment');
      return null;
    }

    const whoopMetrics = {
      recovery: todaysRecovery.score,
      strain: todaysStrain?.score || 0,
      hrv: todaysRecovery.hrvMs,
      sleepQuality: todaysSleep?.efficiency || 75
    };

    // Analyze if adjustment is needed
    const adjustmentNeeded = this.shouldAdjustWorkout(
      whoopMetrics,
      todaysWorkout,
      adjustmentSettings
    );

    if (!adjustmentNeeded.shouldAdjust) {
      return null;
    }

    // Get program context for goal-aware adjustments
    const programContext = this.getProgramContext(
      todaysWorkout.programId,
      activePrograms,
      programGoals,
      getGoalSummary
    );

    // Get Renaissance Periodization analysis
    const currentWeek = this.getCurrentWeekOfProgram(todaysWorkout.programId, activePrograms, programGoals);
    const associatedGoal = programGoals.find(goal => {
      const summary = getGoalSummary(goal.id);
      return summary && summary.percentComplete < 100;
    });
    
    let renaissanceAnalysis: ProgramAwareAnalysis | undefined;
    let rpeGuidance: RPEGuidance | undefined;
    
    if (associatedGoal) {
      renaissanceAnalysis = RenaissancePeriodizationService.analyzeRecoveryForProgram(
        whoopData,
        associatedGoal,
        currentWeek
      );
      
      // Generate RPE guidance if workout has intensity information
      const baseRPE = this.extractRPEFromWorkout(todaysWorkout);
      if (baseRPE > 0) {
        rpeGuidance = RenaissancePeriodizationService.generateRPEGuidance(baseRPE, renaissanceAnalysis);
      }
    }

    // Generate adjusted workout
    const adjustedWorkout = await this.generateAdjustedWorkout(
      todaysWorkout,
      whoopMetrics,
      adjustmentNeeded,
      programContext,
      adjustmentSettings,
      renaissanceAnalysis
    );

    return {
      originalWorkout: todaysWorkout,
      adjustedWorkout,
      adjustmentReason: adjustmentNeeded.reason,
      adjustmentType: adjustmentNeeded.type,
      confidenceScore: adjustmentNeeded.confidence,
      whoopMetrics,
      renaissanceAnalysis,
      rpeGuidance
    };
  }

  /**
   * Analyzes weekly program performance and suggests program-level adjustments
   */
  public async analyzeWeeklyProgramPerformance(
    program: TrainingProgram,
    whoopData: WhoopData,
    programGoals: ProgramGoal[],
    getGoalSummary: (goalId: string) => GoalProgressSummary | null,
    settings: Partial<AutoAdjustmentSettings> = {}
  ): Promise<ProgramAdjustment | null> {
    const adjustmentSettings = { ...this.defaultSettings, ...settings };
    
    if (!adjustmentSettings.enabled) {
      return null;
    }

    // Get last 7 days of data
    const last7Days = this.getLast7DaysData(whoopData);
    
    // Calculate weekly averages
    const weeklyAverages = {
      recovery: last7Days.recovery.reduce((sum, r) => sum + r.score, 0) / last7Days.recovery.length,
      strain: last7Days.strain.reduce((sum, s) => sum + s.score, 0) / last7Days.strain.length,
      hrv: last7Days.recovery.reduce((sum, r) => sum + r.hrvMs, 0) / last7Days.recovery.length,
      sleepQuality: last7Days.sleep.reduce((sum, s) => sum + (s.efficiency || 75), 0) / last7Days.sleep.length
    };

    // Get program context
    const programContext = this.getProgramContext(
      program.id,
      [program],
      programGoals,
      getGoalSummary
    );

    // Analyze if program adjustments are needed
    const needsAdjustment = this.analyzeProgramPerformance(
      weeklyAverages,
      programContext,
      adjustmentSettings
    );

    if (!needsAdjustment.shouldAdjust) {
      return null;
    }

    // Generate program-level adjustments
    return await this.generateProgramAdjustments(
      program,
      weeklyAverages,
      programContext,
      needsAdjustment,
      adjustmentSettings
    );
  }

  /**
   * Determines if a workout should be adjusted based on Whoop metrics
   */
  private shouldAdjustWorkout(
    metrics: { recovery: number; strain: number; hrv: number; sleepQuality: number },
    workout: TodaysWorkout,
    settings: AutoAdjustmentSettings
  ): { shouldAdjust: boolean; reason: string; type: WorkoutAdjustment['adjustmentType']; confidence: number } {
    const { recovery, strain, hrv, sleepQuality } = metrics;
    const { aggressiveness, maxStrainThreshold, sleepQualityThreshold, hrvThreshold } = settings;
    
    let confidence = 0.5;
    let reasons: string[] = [];
    let adjustmentType: WorkoutAdjustment['adjustmentType'] = 'intensity';

    // Recovery-based adjustments
    if (recovery < 40) {
      reasons.push(`Very low recovery (${recovery}%)`);
      adjustmentType = settings.allowSkipWorkouts ? 'skip' : 'add_recovery';
      confidence += 0.3;
    } else if (recovery < 60 && workout.intensity === 'High') {
      reasons.push(`Low recovery (${recovery}%) for high-intensity workout`);
      adjustmentType = 'intensity';
      confidence += 0.2;
    } else if (recovery > 85 && workout.intensity === 'Low' && settings.allowIntensityIncrease) {
      reasons.push(`Excellent recovery (${recovery}%) - can increase intensity`);
      adjustmentType = 'intensity';
      confidence += 0.2;
    }

    // HRV-based adjustments
    if (hrv < hrvThreshold && workout.intensity === 'High') {
      reasons.push(`Low HRV (${hrv}ms) indicates high stress`);
      adjustmentType = 'intensity';
      confidence += 0.15;
    }

    // Sleep quality adjustments
    if (sleepQuality < sleepQualityThreshold && workout.intensity !== 'Low') {
      reasons.push(`Poor sleep quality (${sleepQuality}%)`);
      adjustmentType = 'intensity';
      confidence += 0.15;
    }

    // Strain accumulation
    if (strain > maxStrainThreshold) {
      reasons.push(`High accumulated strain (${strain})`);
      adjustmentType = 'add_recovery';
      confidence += 0.2;
    }

    // Aggressiveness modifier
    const aggressivenessMultiplier = {
      conservative: 0.7,
      moderate: 1.0,
      aggressive: 1.3
    }[aggressiveness];
    
    confidence *= aggressivenessMultiplier;
    confidence = Math.min(1, confidence);

    const shouldAdjust = reasons.length > 0 && confidence > 0.4;
    const reason = reasons.join(', ');

    return {
      shouldAdjust,
      reason,
      type: adjustmentType,
      confidence
    };
  }

  /**
   * Generates an adjusted workout based on Whoop metrics and program context
   * Enhanced with Renaissance Periodization principles
   */
  private async generateAdjustedWorkout(
    originalWorkout: TodaysWorkout,
    metrics: { recovery: number; strain: number; hrv: number; sleepQuality: number },
    adjustmentNeeded: { type: WorkoutAdjustment['adjustmentType']; reason: string; confidence: number },
    programContext: any,
    settings: AutoAdjustmentSettings,
    renaissanceAnalysis?: ProgramAwareAnalysis
  ): Promise<TodaysWorkout> {
    const adjustedWorkout = { ...originalWorkout };
    const { recovery, strain, hrv, sleepQuality } = metrics;

    switch (adjustmentNeeded.type) {
      case 'intensity':
        adjustedWorkout.intensity = this.adjustIntensity(
          originalWorkout.intensity,
          recovery,
          hrv,
          sleepQuality,
          settings
        );
        adjustedWorkout.description = this.adjustWorkoutDescription(
          originalWorkout.description,
          adjustedWorkout.intensity,
          'intensity'
        );
        break;

      case 'duration':
        adjustedWorkout.duration = this.adjustDuration(
          originalWorkout.duration,
          recovery,
          strain,
          settings
        );
        adjustedWorkout.description = this.adjustWorkoutDescription(
          originalWorkout.description,
          adjustedWorkout.duration,
          'duration'
        );
        break;

      case 'type':
        if (recovery < 50) {
          adjustedWorkout.type = 'recovery';
          adjustedWorkout.title = `Recovery Session (${originalWorkout.day})`;
          adjustedWorkout.description = 'Light movement, stretching, or yoga to promote recovery';
          adjustedWorkout.intensity = 'Low';
          adjustedWorkout.duration = '20-30 minutes';
        }
        break;

      case 'skip':
        adjustedWorkout.title = `Rest Day (${originalWorkout.day})`;
        adjustedWorkout.description = 'Complete rest recommended based on low recovery metrics';
        adjustedWorkout.type = 'recovery';
        adjustedWorkout.intensity = 'Very Low';
        adjustedWorkout.duration = 'Full day rest';
        break;

      case 'add_recovery':
        adjustedWorkout.description += ' + 10-15 minutes of cool-down and stretching';
        adjustedWorkout.duration = this.extendDurationForRecovery(adjustedWorkout.duration);
        break;
    }

    // Add Renaissance Periodization adjustments
    if (renaissanceAnalysis) {
      const volumeMultiplier = RenaissancePeriodizationService.getVolumeAdjustmentMultiplier(
        renaissanceAnalysis.volumeRecommendation
      );
      
      // Apply volume adjustments to description
      if (volumeMultiplier !== 1.0) {
        const volumeChange = Math.round((volumeMultiplier - 1) * 100);
        adjustedWorkout.description += ` Volume adjusted: ${volumeChange > 0 ? '+' : ''}${volumeChange}% based on recovery metrics.`;
      }
      
      // Add exercise substitutions
      if (renaissanceAnalysis.exerciseSubstitutions.length > 0) {
        adjustedWorkout.description += ` Exercise modifications: ${renaissanceAnalysis.exerciseSubstitutions.join(', ')}.`;
      }
      
      // Add phase-specific notes
      adjustedWorkout.description += ` Current training phase: ${renaissanceAnalysis.currentPhase}.`;
      
      // Add autoregulation notes
      if (renaissanceAnalysis.notes.length > 0) {
        adjustedWorkout.description += ` RP Notes: ${renaissanceAnalysis.notes.join(' ')}`;
      }
    }

    // Add program-aware adjustments
    if (programContext && settings.respectProgramGoals) {
      adjustedWorkout.description += this.addProgramContextToDescription(
        programContext,
        adjustmentNeeded.type,
        recovery
      );
    }

    // Add adjustment note
    adjustedWorkout.adjustedForRecovery = `Auto-adjusted: ${adjustmentNeeded.reason}`;
    adjustedWorkout.recoveryAdjustment = adjustmentNeeded.reason;

    return adjustedWorkout;
  }

  /**
   * Adjusts workout intensity based on recovery metrics
   */
  private adjustIntensity(
    originalIntensity: string,
    recovery: number,
    hrv: number,
    sleepQuality: number,
    settings: AutoAdjustmentSettings
  ): string {
    const intensityLevels = ['Very Low', 'Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'];
    const currentIndex = intensityLevels.indexOf(originalIntensity);
    
    if (currentIndex === -1) return originalIntensity;

    let adjustment = 0;

    // Recovery-based adjustment
    if (recovery < 40) adjustment -= 3;
    else if (recovery < 60) adjustment -= 1;
    else if (recovery > 85 && settings.allowIntensityIncrease) adjustment += 1;
    else if (recovery > 95 && settings.allowIntensityIncrease) adjustment += 2;

    // HRV-based adjustment
    if (hrv < settings.hrvThreshold) adjustment -= 1;
    else if (hrv > settings.hrvThreshold * 1.5) adjustment += 1;

    // Sleep quality adjustment
    if (sleepQuality < settings.sleepQualityThreshold) adjustment -= 1;
    else if (sleepQuality > 90) adjustment += 1;

    const newIndex = Math.max(0, Math.min(intensityLevels.length - 1, currentIndex + adjustment));
    return intensityLevels[newIndex];
  }

  /**
   * Adjusts workout duration based on metrics
   */
  private adjustDuration(originalDuration: string, recovery: number, strain: number, settings: AutoAdjustmentSettings): string {
    // Extract minutes from duration string
    const durationMatch = originalDuration.match(/(\d+)(?:-(\d+))?\s*minutes?/);
    if (!durationMatch) return originalDuration;

    const minDuration = parseInt(durationMatch[1]);
    const maxDuration = durationMatch[2] ? parseInt(durationMatch[2]) : minDuration;
    
    let adjustment = 1.0;

    if (recovery < 50) adjustment *= 0.7;
    else if (recovery > 80) adjustment *= 1.2;

    if (strain > settings.maxStrainThreshold) adjustment *= 0.8;

    const newMinDuration = Math.round(minDuration * adjustment);
    const newMaxDuration = Math.round(maxDuration * adjustment);

    if (newMinDuration === newMaxDuration) {
      return `${newMinDuration} minutes`;
    } else {
      return `${newMinDuration}-${newMaxDuration} minutes`;
    }
  }

  /**
   * Adjusts workout description based on the type of adjustment
   */
  private adjustWorkoutDescription(originalDescription: string, newValue: string, adjustmentType: 'intensity' | 'duration'): string {
    if (adjustmentType === 'intensity') {
      // Replace intensity-related words
      let adjusted = originalDescription
        .replace(/high[- ]intensity|intense|challenging|hard/gi, newValue.toLowerCase())
        .replace(/moderate|medium/gi, newValue.toLowerCase())
        .replace(/light|easy|gentle/gi, newValue.toLowerCase());
      
      if (newValue === 'Low' || newValue === 'Very Low') {
        adjusted = adjusted.replace(/intervals|sprints|heavy/gi, 'easy pace');
      }
      
      return adjusted;
    } else if (adjustmentType === 'duration') {
      return originalDescription.replace(/\d+(?:-\d+)?\s*minutes?/gi, newValue);
    }
    
    return originalDescription;
  }

  /**
   * Extends duration to include recovery time
   */
  private extendDurationForRecovery(originalDuration: string): string {
    const durationMatch = originalDuration.match(/(\d+)(?:-(\d+))?\s*minutes?/);
    if (!durationMatch) return originalDuration + ' + recovery time';

    const minDuration = parseInt(durationMatch[1]);
    const maxDuration = durationMatch[2] ? parseInt(durationMatch[2]) : minDuration;
    
    const newMinDuration = minDuration + 15;
    const newMaxDuration = maxDuration + 15;

    if (newMinDuration === newMaxDuration) {
      return `${newMinDuration} minutes`;
    } else {
      return `${newMinDuration}-${newMaxDuration} minutes`;
    }
  }

  /**
   * Gets program context for goal-aware adjustments
   */
  private getProgramContext(
    programId: string,
    activePrograms: TrainingProgram[],
    programGoals: ProgramGoal[],
    getGoalSummary: (goalId: string) => GoalProgressSummary | null
  ) {
    const program = activePrograms.find(p => p.id === programId);
    if (!program) return null;

    // Find associated program goal
    const programGoal = programGoals.find(goal => {
      const summary = getGoalSummary(goal.id);
      return summary && summary.percentComplete < 100;
    });

    if (!programGoal) return { program };

    const goalSummary = getGoalSummary(programGoal.id);
    if (!goalSummary) return { program, programGoal };

    const expectedProgress = (goalSummary.weeksElapsed / goalSummary.totalWeeks) * 100;
    const progressDelta = goalSummary.percentComplete - expectedProgress;

    return {
      program,
      programGoal,
      goalSummary,
      progressDelta,
      isAheadOfSchedule: goalSummary.paceVsPlan === 'ahead',
      isBehindSchedule: goalSummary.paceVsPlan === 'behind',
      weeksRemaining: goalSummary.totalWeeks - goalSummary.weeksElapsed
    };
  }

  /**
   * Adds program context information to workout description
   */
  private addProgramContextToDescription(
    programContext: any,
    adjustmentType: WorkoutAdjustment['adjustmentType'],
    recovery: number
  ): string {
    if (!programContext.programGoal) return '';

    const { programGoal, isBehindSchedule, isAheadOfSchedule, progressDelta } = programContext;
    let contextNote = '';

    if (isBehindSchedule && recovery > 70 && adjustmentType !== 'skip') {
      contextNote = ` Note: You're ${Math.abs(progressDelta).toFixed(0)}% behind on your ${programGoal.title} goal - good recovery allows for focused effort.`;
    } else if (isAheadOfSchedule && adjustmentType === 'intensity') {
      contextNote = ` Note: You're ${progressDelta.toFixed(0)}% ahead of schedule on your ${programGoal.title} goal - can afford to prioritize recovery.`;
    } else if (adjustmentType === 'skip' && isBehindSchedule) {
      contextNote = ` Note: Despite being behind on your ${programGoal.title} goal, recovery is prioritized for long-term success.`;
    }

    return contextNote;
  }

  /**
   * Gets last 7 days of Whoop data
   */
  private getLast7DaysData(whoopData: WhoopData) {
    return {
      recovery: whoopData.recovery.slice(0, 7),
      strain: whoopData.strain.slice(0, 7),
      sleep: whoopData.sleep.slice(0, 7)
    };
  }

  /**
   * Analyzes weekly program performance
   */
  private analyzeProgramPerformance(
    weeklyAverages: { recovery: number; strain: number; hrv: number; sleepQuality: number },
    programContext: any,
    settings: AutoAdjustmentSettings
  ): { shouldAdjust: boolean; reason: string; adjustmentType: 'reduce_intensity' | 'increase_recovery' | 'modify_schedule' } {
    const { recovery, strain, hrv, sleepQuality } = weeklyAverages;
    let reasons: string[] = [];
    let adjustmentType: 'reduce_intensity' | 'increase_recovery' | 'modify_schedule' = 'reduce_intensity';

    // Check for overreaching
    if (recovery < 55 && strain > 12) {
      reasons.push('Signs of overreaching detected');
      adjustmentType = 'increase_recovery';
    }

    // Check for undertraining (if ahead of schedule)
    if (programContext?.isAheadOfSchedule && recovery > 80 && strain < 8) {
      reasons.push('Potential for increased training load');
      adjustmentType = 'reduce_intensity'; // Actually increase, but we'll handle in implementation
    }

    // Check for poor sleep patterns
    if (sleepQuality < 70) {
      reasons.push('Consistently poor sleep quality');
      adjustmentType = 'modify_schedule';
    }

    // Check for HRV trends
    if (hrv < settings.hrvThreshold) {
      reasons.push('Elevated stress levels');
      adjustmentType = 'increase_recovery';
    }

    return {
      shouldAdjust: reasons.length > 0,
      reason: reasons.join(', '),
      adjustmentType
    };
  }

  /**
   * Generates program-level adjustments
   */
  private async generateProgramAdjustments(
    program: TrainingProgram,
    weeklyAverages: { recovery: number; strain: number; hrv: number; sleepQuality: number },
    programContext: any,
    needsAdjustment: { shouldAdjust: boolean; reason: string; adjustmentType: string },
    settings: AutoAdjustmentSettings
  ): Promise<ProgramAdjustment> {
    // This would generate comprehensive program adjustments
    // For now, return a basic structure
    return {
      programId: program.id,
      adjustmentDate: new Date().toISOString().split('T')[0],
      adjustments: [], // Would contain specific workout adjustments
      overallReason: needsAdjustment.reason,
      programProgress: {
        currentWeek: programContext?.goalSummary?.weeksElapsed || 1,
        totalWeeks: programContext?.goalSummary?.totalWeeks || 12,
        goalProgress: programContext?.goalSummary?.percentComplete || 0,
        paceVsPlan: programContext?.goalSummary?.paceVsPlan || 'on_track'
      }
    };
  }

  /**
   * Gets current week of program for periodization calculations
   */
  private getCurrentWeekOfProgram(
    programId: string,
    activePrograms: TrainingProgram[],
    programGoals: ProgramGoal[]
  ): number {
    const program = activePrograms.find(p => p.id === programId);
    if (!program) return 1;
    
    // Find associated goal to get start date
    const associatedGoal = programGoals.find(goal => {
      // This is a simplified association - in practice you'd have a more robust way to link programs to goals
      return goal.type === program.type;
    });
    
    if (!associatedGoal) return 1;
    
    const startDate = new Date(associatedGoal.startDate);
    const currentDate = new Date();
    const weeksDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    return Math.max(1, weeksDiff + 1);
  }
  
  /**
   * Extracts RPE from workout description or intensity
   */
  private extractRPEFromWorkout(workout: TodaysWorkout): number {
    // Try to extract RPE from description
    const rpeMatch = workout.description.match(/RPE\s*(\d+)/i);
    if (rpeMatch) {
      return parseInt(rpeMatch[1]);
    }
    
    // Map intensity to RPE
    const intensityToRPE: Record<string, number> = {
      'Very Low': 3,
      'Low': 4,
      'Medium-Low': 5,
      'Medium': 6,
      'Medium-High': 7,
      'High': 8,
      'Very High': 9
    };
    
    return intensityToRPE[workout.intensity] || 6;
  }

  /**
   * Gets default auto-adjustment settings
   */
  public getDefaultSettings(): AutoAdjustmentSettings {
    return { ...this.defaultSettings };
  }

  /**
   * Validates and sanitizes adjustment settings
   */
  public validateSettings(settings: Partial<AutoAdjustmentSettings>): AutoAdjustmentSettings {
    return {
      enabled: settings.enabled ?? this.defaultSettings.enabled,
      aggressiveness: settings.aggressiveness ?? this.defaultSettings.aggressiveness,
      minRecoveryForIntense: Math.max(0, Math.min(100, settings.minRecoveryForIntense ?? this.defaultSettings.minRecoveryForIntense)),
      maxStrainThreshold: Math.max(0, Math.min(20, settings.maxStrainThreshold ?? this.defaultSettings.maxStrainThreshold)),
      sleepQualityThreshold: Math.max(0, Math.min(100, settings.sleepQualityThreshold ?? this.defaultSettings.sleepQualityThreshold)),
      hrvThreshold: Math.max(10, Math.min(100, settings.hrvThreshold ?? this.defaultSettings.hrvThreshold)),
      allowSkipWorkouts: settings.allowSkipWorkouts ?? this.defaultSettings.allowSkipWorkouts,
      allowIntensityIncrease: settings.allowIntensityIncrease ?? this.defaultSettings.allowIntensityIncrease,
      respectProgramGoals: settings.respectProgramGoals ?? this.defaultSettings.respectProgramGoals
    };
  }
}

export const programAwareDataAnalysisService = new ProgramAwareDataAnalysisService();
export default programAwareDataAnalysisService;