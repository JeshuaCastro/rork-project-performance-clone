import { AIRecommendation, RecommendationContext, SmartInsightsData } from '@/types/whoop';

class AIRecommendationEngine {
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private getDayOfWeek(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  private generateRecoveryRecommendations(context: RecommendationContext): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const { currentRecovery, recentRecoveryTrend, avgHRV, avgRestingHR, sleepQuality } = context;

    // Sleep optimization recommendations
    if (sleepQuality < 75) {
      recommendations.push({
        id: `sleep-${Date.now()}`,
        category: 'recovery',
        title: 'Optimize Sleep Quality',
        description: `Your sleep quality is at ${sleepQuality}%. Try going to bed 30 minutes earlier and avoid screens 1 hour before bedtime.`,
        priority: 'high',
        actionable: true,
        estimatedImpact: '+15% recovery score',
        timeframe: '3-7 days',
        icon: 'moon',
        createdAt: new Date()
      });
    }

    // HRV-based stress management
    if (avgHRV < 40) {
      recommendations.push({
        id: `hrv-${Date.now()}`,
        category: 'recovery',
        title: 'Stress Management Focus',
        description: 'Your HRV indicates elevated stress. Consider 10 minutes of deep breathing or meditation today.',
        priority: 'medium',
        actionable: true,
        estimatedImpact: '+8% HRV improvement',
        timeframe: '1-3 days',
        icon: 'heart',
        createdAt: new Date()
      });
    }

    // Recovery trend analysis
    if (recentRecoveryTrend < -5) {
      recommendations.push({
        id: `trend-${Date.now()}`,
        category: 'recovery',
        title: 'Recovery Declining',
        description: 'Your recovery has dropped by 5+ points recently. Consider reducing training intensity and prioritizing sleep.',
        priority: 'high',
        actionable: true,
        estimatedImpact: 'Prevent overtraining',
        timeframe: '1-2 weeks',
        icon: 'trending-down',
        createdAt: new Date()
      });
    }

    return recommendations;
  }

  private generateWorkoutRecommendations(context: RecommendationContext): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const { currentRecovery, currentStrain, activePrograms, timeOfDay, dayOfWeek } = context;

    // Intensity recommendations based on recovery
    if (currentRecovery >= 75) {
      recommendations.push({
        id: `workout-high-${Date.now()}`,
        category: 'workout',
        title: 'High-Intensity Training Ready',
        description: `With ${currentRecovery}% recovery, you're primed for a challenging workout. Consider HIIT or strength training.`,
        priority: 'medium',
        actionable: true,
        estimatedImpact: 'Maximize fitness gains',
        timeframe: 'Today',
        icon: 'zap',
        createdAt: new Date()
      });
    } else if (currentRecovery < 50) {
      recommendations.push({
        id: `workout-low-${Date.now()}`,
        category: 'workout',
        title: 'Active Recovery Recommended',
        description: `Recovery at ${currentRecovery}% suggests light activity. Try yoga, walking, or gentle stretching.`,
        priority: 'high',
        actionable: true,
        estimatedImpact: 'Prevent overtraining',
        timeframe: 'Today',
        icon: 'activity',
        createdAt: new Date()
      });
    }

    // Time-based workout suggestions
    if (timeOfDay === 'morning' && currentRecovery > 60) {
      recommendations.push({
        id: `morning-workout-${Date.now()}`,
        category: 'workout',
        title: 'Morning Training Window',
        description: 'Your recovery supports morning training. This timing can boost metabolism and energy for the day.',
        priority: 'low',
        actionable: true,
        estimatedImpact: 'Better daily energy',
        timeframe: 'Next 2 hours',
        icon: 'sunrise',
        createdAt: new Date()
      });
    }

    // Weekly periodization
    if (dayOfWeek === 'Monday' && activePrograms.length > 0) {
      recommendations.push({
        id: `weekly-plan-${Date.now()}`,
        category: 'workout',
        title: 'Week Planning',
        description: 'Start your week strong with a structured workout. Your body is typically most recovered on Mondays.',
        priority: 'low',
        actionable: true,
        estimatedImpact: 'Better weekly consistency',
        timeframe: 'This week',
        icon: 'calendar',
        createdAt: new Date()
      });
    }

    return recommendations;
  }

  private generateNutritionRecommendations(context: RecommendationContext): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const { currentRecovery, currentStrain, timeOfDay, userProfile } = context;

    // Pre-workout nutrition
    if (timeOfDay === 'morning' && currentRecovery > 65) {
      recommendations.push({
        id: `pre-workout-${Date.now()}`,
        category: 'nutrition',
        title: 'Pre-Workout Fuel',
        description: 'Have a light snack with carbs 30-60 minutes before your workout. Try banana with almond butter.',
        priority: 'medium',
        actionable: true,
        estimatedImpact: '+10% workout performance',
        timeframe: '30-60 minutes',
        icon: 'apple',
        createdAt: new Date()
      });
    }

    // Post-workout recovery nutrition
    if (currentStrain > 12) {
      recommendations.push({
        id: `post-workout-${Date.now()}`,
        category: 'nutrition',
        title: 'Recovery Nutrition',
        description: 'Your high strain workout requires protein and carbs within 30 minutes. Try chocolate milk or protein shake.',
        priority: 'high',
        actionable: true,
        estimatedImpact: '+20% recovery speed',
        timeframe: '30 minutes post-workout',
        icon: 'glass-water',
        createdAt: new Date()
      });
    }

    // Hydration based on recovery
    if (currentRecovery < 60) {
      recommendations.push({
        id: `hydration-${Date.now()}`,
        category: 'nutrition',
        title: 'Hydration Focus',
        description: 'Low recovery may indicate dehydration. Aim for 500ml of water in the next hour.',
        priority: 'medium',
        actionable: true,
        estimatedImpact: '+5% recovery boost',
        timeframe: '1 hour',
        icon: 'droplets',
        createdAt: new Date()
      });
    }

    // Goal-specific nutrition
    if (userProfile.fitnessGoal === 'gainMuscle') {
      recommendations.push({
        id: `muscle-nutrition-${Date.now()}`,
        category: 'nutrition',
        title: 'Muscle Building Nutrition',
        description: `Aim for ${Math.round(userProfile.weight * 2.2)}g protein today to support muscle growth and recovery.`,
        priority: 'medium',
        actionable: true,
        estimatedImpact: 'Better muscle synthesis',
        timeframe: 'Throughout the day',
        icon: 'beef',
        createdAt: new Date()
      });
    }

    return recommendations;
  }

  private generateLifestyleRecommendations(context: RecommendationContext): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const { currentRecovery, avgRestingHR, timeOfDay, dayOfWeek } = context;

    // Hydration reminders
    if (timeOfDay === 'morning') {
      recommendations.push({
        id: `morning-hydration-${Date.now()}`,
        category: 'lifestyle',
        title: 'Morning Hydration',
        description: 'Start your day with 16-20oz of water to kickstart hydration and metabolism.',
        priority: 'low',
        actionable: true,
        estimatedImpact: 'Better daily energy',
        timeframe: 'Next 30 minutes',
        icon: 'glass-water',
        createdAt: new Date()
      });
    }

    // Activity timing
    if (currentRecovery < 55 && timeOfDay === 'afternoon') {
      recommendations.push({
        id: `activity-timing-${Date.now()}`,
        category: 'lifestyle',
        title: 'Light Movement Break',
        description: 'Take a 5-10 minute walk to boost circulation and energy without adding strain.',
        priority: 'low',
        actionable: true,
        estimatedImpact: 'Improved circulation',
        timeframe: 'Next hour',
        icon: 'footprints',
        createdAt: new Date()
      });
    }

    // Stress management
    if (avgRestingHR > 65) {
      recommendations.push({
        id: `stress-management-${Date.now()}`,
        category: 'lifestyle',
        title: 'Stress Reduction',
        description: 'Elevated resting HR suggests stress. Try 5 minutes of deep breathing or meditation.',
        priority: 'medium',
        actionable: true,
        estimatedImpact: 'Lower stress levels',
        timeframe: '5-10 minutes',
        icon: 'brain',
        createdAt: new Date()
      });
    }

    // Weekend recovery
    if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
      recommendations.push({
        id: `weekend-recovery-${Date.now()}`,
        category: 'lifestyle',
        title: 'Weekend Recovery',
        description: 'Use weekends for active recovery and stress reduction. Consider nature walks or gentle activities.',
        priority: 'low',
        actionable: true,
        estimatedImpact: 'Better weekly recovery',
        timeframe: 'This weekend',
        icon: 'trees',
        createdAt: new Date()
      });
    }

    return recommendations;
  }

  private generateDailySummary(context: RecommendationContext): string {
    const { currentRecovery, currentStrain, timeOfDay } = context;
    
    let summary = '';
    
    if (currentRecovery >= 75) {
      summary = `Excellent recovery at ${currentRecovery}%! You're ready for high-intensity training. `;
    } else if (currentRecovery >= 50) {
      summary = `Moderate recovery at ${currentRecovery}%. Consider moderate intensity workouts. `;
    } else {
      summary = `Low recovery at ${currentRecovery}%. Focus on active recovery and stress management. `;
    }

    if (timeOfDay === 'morning') {
      summary += 'Start your day with hydration and light movement.';
    } else if (timeOfDay === 'afternoon') {
      summary += 'Maintain energy with proper nutrition and hydration.';
    } else {
      summary += 'Wind down with relaxation and prepare for quality sleep.';
    }

    return summary;
  }

  private calculateReadinessScore(context: RecommendationContext): number {
    const { currentRecovery, avgHRV, avgRestingHR, sleepQuality } = context;
    
    // Weighted calculation
    const recoveryWeight = 0.4;
    const hrvWeight = 0.3;
    const restingHRWeight = 0.2;
    const sleepWeight = 0.1;
    
    // Normalize values to 0-100 scale
    const normalizedHRV = Math.min(100, (avgHRV / 60) * 100);
    const normalizedRestingHR = Math.max(0, 100 - ((avgRestingHR - 50) / 30) * 100);
    
    const readinessScore = 
      (currentRecovery * recoveryWeight) +
      (normalizedHRV * hrvWeight) +
      (normalizedRestingHR * restingHRWeight) +
      (sleepQuality * sleepWeight);
    
    return Math.round(Math.max(0, Math.min(100, readinessScore)));
  }

  public generateRecommendations(context: RecommendationContext): SmartInsightsData {
    const recoveryRecs = this.generateRecoveryRecommendations(context);
    const workoutRecs = this.generateWorkoutRecommendations(context);
    const nutritionRecs = this.generateNutritionRecommendations(context);
    const lifestyleRecs = this.generateLifestyleRecommendations(context);

    const allRecommendations = [
      ...recoveryRecs,
      ...workoutRecs,
      ...nutritionRecs,
      ...lifestyleRecs
    ];

    // Sort by priority (high -> medium -> low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    allRecommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    const readinessScore = this.calculateReadinessScore(context);
    let recommendedIntensity: 'low' | 'moderate' | 'high' = 'moderate';
    
    if (readinessScore >= 75) recommendedIntensity = 'high';
    else if (readinessScore < 50) recommendedIntensity = 'low';

    return {
      recommendations: allRecommendations.slice(0, 6), // Limit to top 6 recommendations
      dailySummary: this.generateDailySummary(context),
      keyMetrics: {
        recoveryStatus: context.currentRecovery >= 67 ? 'High' : context.currentRecovery >= 34 ? 'Medium' : 'Low',
        readinessScore,
        recommendedIntensity,
        hydrationReminder: context.currentRecovery < 60 || context.timeOfDay === 'morning'
      },
      lastUpdated: new Date()
    };
  }

  public createRecommendationContext(
    recoveryData: any[],
    strainData: any[],
    sleepData: any[],
    userProfile: any,
    activePrograms: any[]
  ): RecommendationContext {
    const today = new Date().toISOString().split('T')[0];
    const currentRecovery = recoveryData.find(r => r.date === today)?.score || 50;
    const currentStrain = strainData.find(s => s.date === today)?.score || 8;
    
    // Calculate trends (last 3 days vs previous 3 days)
    const recent = recoveryData.slice(-3);
    const previous = recoveryData.slice(-6, -3);
    const recentAvg = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
    const previousAvg = previous.reduce((sum, r) => sum + r.score, 0) / previous.length;
    const recentRecoveryTrend = recentAvg - previousAvg;
    
    const recentStrainData = strainData.slice(-3);
    const previousStrainData = strainData.slice(-6, -3);
    const recentStrainAvg = recentStrainData.reduce((sum, s) => sum + s.score, 0) / recentStrainData.length;
    const previousStrainAvg = previousStrainData.reduce((sum, s) => sum + s.score, 0) / previousStrainData.length;
    const recentStrainTrend = recentStrainAvg - previousStrainAvg;
    
    const avgHRV = recoveryData.slice(-7).reduce((sum, r) => sum + r.hrvMs, 0) / Math.min(7, recoveryData.length);
    const avgRestingHR = recoveryData.slice(-7).reduce((sum, r) => sum + r.restingHeartRate, 0) / Math.min(7, recoveryData.length);
    const sleepQuality = sleepData.find(s => s.date === today)?.qualityScore || 75;
    
    return {
      currentRecovery,
      recentRecoveryTrend,
      currentStrain,
      recentStrainTrend,
      avgHRV,
      avgRestingHR,
      sleepQuality,
      userProfile,
      activePrograms,
      recentWorkouts: activePrograms.length,
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: this.getDayOfWeek()
    };
  }
}

export const aiRecommendationEngine = new AIRecommendationEngine();
export default aiRecommendationEngine;