import type { DailyRecommendation, ProgramGoal, GoalTemplate } from '@/types/programs';
import type { WhoopData } from '@/types/whoop';

export class WhoopRecommendationEngine {
  static generateDailyRecommendations(
    goal: ProgramGoal,
    template: GoalTemplate,
    whoopData: WhoopData
  ): DailyRecommendation[] {
    const recommendations: DailyRecommendation[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    const recovery = whoopData.recovery[0];
    const strain = whoopData.strain[0];
    const sleep = whoopData.sleep[0];

    // Recovery-based workout recommendations
    if (recovery) {
      const recoveryScore = recovery.score || 0;
      
      if (recoveryScore >= 67) {
        // High recovery - push harder
        recommendations.push({
          id: `rec-${Date.now()}-workout-high`,
          goalId: goal.id,
          type: 'workout',
          title: 'High Intensity Training',
          description: `Your recovery is excellent (${Math.round(recoveryScore)}%). Perfect day for a challenging workout.`,
          priority: 'high',
          estimatedTime: this.getWorkoutDuration(goal.type, 'high'),
          whoopBased: true,
          completed: false,
        });
      } else if (recoveryScore >= 34) {
        // Medium recovery - moderate training
        recommendations.push({
          id: `rec-${Date.now()}-workout-med`,
          goalId: goal.id,
          type: 'workout',
          title: 'Moderate Training',
          description: `Recovery is moderate (${Math.round(recoveryScore)}%). Focus on technique and steady effort.`,
          priority: 'medium',
          estimatedTime: this.getWorkoutDuration(goal.type, 'medium'),
          whoopBased: true,
          completed: false,
        });
      } else {
        // Low recovery - active recovery or rest
        recommendations.push({
          id: `rec-${Date.now()}-recovery`,
          goalId: goal.id,
          type: 'recovery',
          title: 'Active Recovery',
          description: `Low recovery (${Math.round(recoveryScore)}%). Focus on mobility, light movement, or rest.`,
          priority: 'high',
          estimatedTime: 30,
          whoopBased: true,
          completed: false,
        });
      }
    }

    // Sleep-based recommendations
    if (sleep && sleep.efficiency && sleep.efficiency < 85) {
      recommendations.push({
        id: `rec-${Date.now()}-sleep`,
        goalId: goal.id,
        type: 'recovery',
        title: 'Optimize Sleep Tonight',
        description: `Last night's sleep efficiency was ${Math.round(sleep.efficiency)}%. Focus on better sleep hygiene tonight.`,
        priority: 'medium',
        estimatedTime: 15,
        whoopBased: true,
        completed: false,
      });
    }

    // Goal-specific nutrition recommendations
    recommendations.push({
      id: `rec-${Date.now()}-nutrition`,
      goalId: goal.id,
      type: 'nutrition',
      title: this.getNutritionTitle(goal.type),
      description: this.getNutritionDescription(goal.type),
      priority: 'medium',
      estimatedTime: 10,
      whoopBased: false,
      completed: false,
    });

    // Mindset/motivation recommendations
    if (Math.random() > 0.7) { // 30% chance for variety
      recommendations.push({
        id: `rec-${Date.now()}-mindset`,
        goalId: goal.id,
        type: 'mindset',
        title: 'Visualize Success',
        description: 'Spend 5 minutes visualizing achieving your goal. Mental rehearsal improves performance.',
        priority: 'low',
        estimatedTime: 5,
        whoopBased: false,
        completed: false,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });
  }

  private static getWorkoutDuration(goalType: string, intensity: string): number {
    const baseDurations = {
      muscle_gain: { high: 75, medium: 60, low: 45 },
      fat_loss: { high: 60, medium: 45, low: 30 },
      endurance: { high: 90, medium: 60, low: 45 },
      strength: { high: 90, medium: 75, low: 60 },
      general_fitness: { high: 60, medium: 45, low: 30 }
    };

    const durations = baseDurations[goalType as keyof typeof baseDurations] || baseDurations.general_fitness;
    return durations[intensity as keyof typeof durations] || durations.medium;
  }

  private static getNutritionTitle(goalType: string): string {
    const titles = {
      muscle_gain: 'Fuel for Growth',
      fat_loss: 'Smart Calorie Management',
      endurance: 'Endurance Nutrition',
      strength: 'Power Nutrition',
      general_fitness: 'Balanced Nutrition'
    };
    return titles[goalType as keyof typeof titles] || titles.general_fitness;
  }

  private static getNutritionDescription(goalType: string): string {
    const descriptions = {
      muscle_gain: 'Focus on protein intake (1g per lb bodyweight) and post-workout nutrition within 30 minutes.',
      fat_loss: 'Maintain a moderate calorie deficit while prioritizing protein to preserve muscle mass.',
      endurance: 'Ensure adequate carbohydrate intake and proper hydration before, during, and after training.',
      strength: 'Prioritize protein and creatine. Time carbohydrates around your training sessions.',
      general_fitness: 'Maintain a balanced diet with adequate protein, healthy fats, and complex carbohydrates.'
    };
    return descriptions[goalType as keyof typeof descriptions] || descriptions.general_fitness;
  }
}