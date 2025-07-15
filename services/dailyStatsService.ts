import { useWhoopStore } from '@/store/whoopStore';
import { WhoopData, RecoveryData, StrainData, SleepData, TodaysWorkout } from '@/types/whoop';

export interface DailyStats {
  date: string;
  dateFormatted: string;
  recovery: RecoveryData | null;
  strain: StrainData | null;
  sleep: SleepData | null;
  todaysWorkout: TodaysWorkout | null;
  isWorkoutCompleted: boolean;
  insights: {
    recoveryTrend: 'improving' | 'stable' | 'declining';
    strainBalance: 'low' | 'optimal' | 'high';
    sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
    readinessScore: number; // 0-100
  };
  recommendations: string[];
}

export class DailyStatsService {
  private static instance: DailyStatsService;
  
  public static getInstance(): DailyStatsService {
    if (!DailyStatsService.instance) {
      DailyStatsService.instance = new DailyStatsService();
    }
    return DailyStatsService.instance;
  }

  /**
   * Get comprehensive daily stats for a specific date
   */
  public async getDailyStats(date?: string): Promise<DailyStats> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const store = useWhoopStore.getState();
    
    // Get today's data
    const recovery = store.data.recovery.find(item => item.date === targetDate) || null;
    const strain = store.data.strain.find(item => item.date === targetDate) || null;
    const sleep = store.data.sleep.find(item => item.date === targetDate) || null;
    
    // Get today's workout
    const todaysWorkout = store.getTodaysWorkout();
    
    // Check if workout is completed
    let isWorkoutCompleted = false;
    if (todaysWorkout && todaysWorkout.programId) {
      try {
        isWorkoutCompleted = await store.isWorkoutCompleted(
          todaysWorkout.programId, 
          todaysWorkout.title, 
          targetDate
        );
      } catch (error) {
        console.error('Error checking workout completion:', error);
      }
    }

    // Calculate insights
    const insights = this.calculateInsights(store.data, recovery, strain, sleep);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(recovery, strain, sleep, todaysWorkout, isWorkoutCompleted);

    return {
      date: targetDate,
      dateFormatted: new Date(targetDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      }),
      recovery,
      strain,
      sleep,
      todaysWorkout,
      isWorkoutCompleted,
      insights,
      recommendations
    };
  }

  /**
   * Calculate daily insights based on current and historical data
   */
  private calculateInsights(
    data: WhoopData, 
    recovery: RecoveryData | null, 
    strain: StrainData | null, 
    sleep: SleepData | null
  ) {
    // Recovery trend analysis
    const recoveryTrend = this.analyzeRecoveryTrend(data.recovery);
    
    // Strain balance analysis
    const strainBalance = this.analyzeStrainBalance(strain, recovery);
    
    // Sleep quality analysis
    const sleepQuality = this.analyzeSleepQuality(sleep);
    
    // Overall readiness score (0-100)
    const readinessScore = this.calculateReadinessScore(recovery, strain, sleep);

    return {
      recoveryTrend,
      strainBalance,
      sleepQuality,
      readinessScore
    };
  }

  /**
   * Analyze recovery trend over the past week
   */
  private analyzeRecoveryTrend(recoveryData: RecoveryData[]): 'improving' | 'stable' | 'declining' {
    if (recoveryData.length < 3) return 'stable';
    
    const recent = recoveryData.slice(0, 3);
    const older = recoveryData.slice(3, 6);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.score, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  /**
   * Analyze strain balance relative to recovery
   */
  private analyzeStrainBalance(strain: StrainData | null, recovery: RecoveryData | null): 'low' | 'optimal' | 'high' {
    if (!strain || !recovery) return 'optimal';
    
    // High recovery can handle higher strain
    if (recovery.score >= 75) {
      if (strain.score < 10) return 'low';
      if (strain.score > 18) return 'high';
      return 'optimal';
    }
    
    // Medium recovery needs moderate strain
    if (recovery.score >= 50) {
      if (strain.score < 8) return 'low';
      if (strain.score > 15) return 'high';
      return 'optimal';
    }
    
    // Low recovery needs low strain
    if (strain.score < 6) return 'low';
    if (strain.score > 12) return 'high';
    return 'optimal';
  }

  /**
   * Analyze sleep quality
   */
  private analyzeSleepQuality(sleep: SleepData | null): 'poor' | 'fair' | 'good' | 'excellent' {
    if (!sleep) return 'fair';
    
    const efficiency = sleep.efficiency;
    const duration = sleep.duration / 60; // Convert to hours
    const disturbances = sleep.disturbances;
    
    // Calculate composite score
    let score = 0;
    
    // Efficiency scoring (40% weight)
    if (efficiency >= 90) score += 40;
    else if (efficiency >= 80) score += 30;
    else if (efficiency >= 70) score += 20;
    else score += 10;
    
    // Duration scoring (40% weight)
    if (duration >= 8) score += 40;
    else if (duration >= 7) score += 30;
    else if (duration >= 6) score += 20;
    else score += 10;
    
    // Disturbances scoring (20% weight)
    if (disturbances <= 1) score += 20;
    else if (disturbances <= 2) score += 15;
    else if (disturbances <= 3) score += 10;
    else score += 5;
    
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Calculate overall readiness score
   */
  private calculateReadinessScore(
    recovery: RecoveryData | null, 
    strain: StrainData | null, 
    sleep: SleepData | null
  ): number {
    if (!recovery && !strain && !sleep) return 50; // Default neutral score
    
    let totalScore = 0;
    let factors = 0;
    
    // Recovery contributes 50%
    if (recovery) {
      totalScore += recovery.score * 0.5;
      factors += 0.5;
    }
    
    // Sleep contributes 30%
    if (sleep) {
      const sleepScore = Math.min(100, (sleep.efficiency + (sleep.duration / 60 / 8 * 100)) / 2);
      totalScore += sleepScore * 0.3;
      factors += 0.3;
    }
    
    // Strain contributes 20% (inversely - lower strain when recovery is low is better)
    if (strain && recovery) {
      const strainScore = this.calculateStrainScore(strain.score, recovery.score);
      totalScore += strainScore * 0.2;
      factors += 0.2;
    }
    
    return factors > 0 ? Math.round(totalScore / factors) : 50;
  }

  /**
   * Calculate strain score based on recovery capacity
   */
  private calculateStrainScore(strainValue: number, recoveryScore: number): number {
    // Optimal strain ranges based on recovery
    let optimalMin: number, optimalMax: number;
    
    if (recoveryScore >= 75) {
      optimalMin = 12;
      optimalMax = 18;
    } else if (recoveryScore >= 50) {
      optimalMin = 8;
      optimalMax = 15;
    } else {
      optimalMin = 4;
      optimalMax = 12;
    }
    
    if (strainValue >= optimalMin && strainValue <= optimalMax) {
      return 100; // Optimal strain
    } else if (strainValue < optimalMin) {
      // Too low strain
      return Math.max(50, 100 - (optimalMin - strainValue) * 10);
    } else {
      // Too high strain
      return Math.max(20, 100 - (strainValue - optimalMax) * 8);
    }
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    recovery: RecoveryData | null,
    strain: StrainData | null,
    sleep: SleepData | null,
    todaysWorkout: TodaysWorkout | null,
    isWorkoutCompleted: boolean
  ): string[] {
    const recommendations: string[] = [];
    
    // Recovery-based recommendations
    if (recovery) {
      if (recovery.score >= 75) {
        recommendations.push("🟢 High recovery - perfect day for intense training");
        if (todaysWorkout && !isWorkoutCompleted) {
          recommendations.push(`💪 Your body is ready for today's ${todaysWorkout.type} workout`);
        }
      } else if (recovery.score >= 50) {
        recommendations.push("🟡 Moderate recovery - maintain steady training intensity");
        if (todaysWorkout && todaysWorkout.intensity === 'High') {
          recommendations.push("⚠️ Consider reducing intensity slightly for today's workout");
        }
      } else {
        recommendations.push("🔴 Low recovery - prioritize rest and light activity");
        if (todaysWorkout && !isWorkoutCompleted) {
          recommendations.push("🧘 Consider a recovery session instead of intense training");
        }
      }
    }
    
    // Sleep-based recommendations
    if (sleep) {
      if (sleep.efficiency < 80) {
        recommendations.push("😴 Focus on sleep hygiene - aim for consistent bedtime routine");
      }
      if (sleep.duration < 420) { // Less than 7 hours
        recommendations.push("⏰ Aim for 7-9 hours of sleep for optimal recovery");
      }
      if (sleep.disturbances > 3) {
        recommendations.push("🌙 Minimize sleep disruptions - check room temperature and noise levels");
      }
    }
    
    // Workout-specific recommendations
    if (todaysWorkout && !isWorkoutCompleted) {
      recommendations.push(`🎯 Today's focus: ${todaysWorkout.title} (${todaysWorkout.duration})`);
      
      if (todaysWorkout.type === 'strength') {
        recommendations.push("🏋️ Remember to warm up properly before lifting");
      } else if (todaysWorkout.type === 'cardio') {
        recommendations.push("🏃 Stay hydrated and monitor your heart rate zones");
      }
    } else if (isWorkoutCompleted) {
      recommendations.push("✅ Great job completing today's workout!");
      recommendations.push("🧊 Focus on recovery - hydration, nutrition, and rest");
    }
    
    // General wellness recommendations
    if (recommendations.length < 3) {
      recommendations.push("💧 Stay hydrated throughout the day");
      recommendations.push("🥗 Fuel your body with nutritious whole foods");
      recommendations.push("🧘 Take breaks to manage stress and maintain focus");
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Get weekly summary stats
   */
  public getWeeklyStats(data: WhoopData) {
    const weekData = data.recovery.slice(0, 7);
    
    if (weekData.length === 0) {
      return {
        avgRecovery: 0,
        avgStrain: 0,
        avgSleep: 0,
        trend: 'stable' as const
      };
    }
    
    const avgRecovery = weekData.reduce((sum, r) => sum + r.score, 0) / weekData.length;
    const avgStrain = data.strain.slice(0, 7).reduce((sum, s) => sum + s.score, 0) / Math.min(7, data.strain.length);
    const avgSleep = data.sleep.slice(0, 7).reduce((sum, s) => sum + s.efficiency, 0) / Math.min(7, data.sleep.length);
    
    return {
      avgRecovery: Math.round(avgRecovery),
      avgStrain: Math.round(avgStrain * 10) / 10,
      avgSleep: Math.round(avgSleep),
      trend: this.analyzeRecoveryTrend(data.recovery)
    };
  }
}

export const dailyStatsService = DailyStatsService.getInstance();