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
      }\n    }\n\n    // Sleep-based recommendations\n    if (sleep && sleep.efficiency && sleep.efficiency < 85) {\n      recommendations.push({\n        id: `rec-${Date.now()}-sleep`,\n        goalId: goal.id,\n        type: 'recovery',\n        title: 'Optimize Sleep Tonight',\n        description: `Last night's sleep efficiency was ${Math.round(sleep.efficiency)}%. Focus on better sleep hygiene tonight.`,\n        priority: 'medium',\n        estimatedTime: 15,\n        whoopBased: true,\n        completed: false,\n      });\n    }\n\n    // Goal-specific nutrition recommendations\n    recommendations.push({\n      id: `rec-${Date.now()}-nutrition`,\n      goalId: goal.id,\n      type: 'nutrition',\n      title: this.getNutritionTitle(goal.type),\n      description: this.getNutritionDescription(goal.type),\n      priority: 'medium',\n      estimatedTime: 10,\n      whoopBased: false,\n      completed: false,\n    });\n\n    // Mindset/motivation recommendations\n    if (Math.random() > 0.7) { // 30% chance for variety\n      recommendations.push({\n        id: `rec-${Date.now()}-mindset`,\n        goalId: goal.id,\n        type: 'mindset',\n        title: 'Visualize Success',\n        description: 'Spend 5 minutes visualizing achieving your goal. Mental rehearsal improves performance.',\n        priority: 'low',\n        estimatedTime: 5,\n        whoopBased: false,\n        completed: false,\n      });\n    }\n\n    return recommendations.sort((a, b) => {\n      const priorityOrder = { high: 3, medium: 2, low: 1 };\n      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];\n    });\n  }\n\n  private static getWorkoutDuration(goalType: string, intensity: string): number {\n    const baseDurations = {\n      muscle_gain: { high: 75, medium: 60, low: 45 },\n      fat_loss: { high: 60, medium: 45, low: 30 },\n      endurance: { high: 90, medium: 60, low: 45 },\n      strength: { high: 90, medium: 75, low: 60 },\n      general_health: { high: 45, medium: 30, low: 20 },\n    };\n\n    return baseDurations[goalType as keyof typeof baseDurations]?.[intensity as keyof typeof baseDurations.muscle_gain] || 45;\n  }\n\n  private static getNutritionTitle(goalType: string): string {\n    switch (goalType) {\n      case 'muscle_gain': return 'Protein Focus';\n      case 'fat_loss': return 'Calorie Tracking';\n      case 'endurance': return 'Carb Timing';\n      case 'strength': return 'Pre/Post Workout Nutrition';\n      default: return 'Balanced Nutrition';\n    }\n  }\n\n  private static getNutritionDescription(goalType: string): string {\n    switch (goalType) {\n      case 'muscle_gain': return 'Aim for 1.6-2.2g protein per kg body weight. Log your meals to track progress.';\n      case 'fat_loss': return 'Maintain your caloric deficit while getting adequate protein. Track your intake.';\n      case 'endurance': return 'Focus on carb timing around workouts. Log pre and post-workout meals.';\n      case 'strength': return 'Optimize protein timing around workouts. Track your pre/post workout nutrition.';\n      default: return 'Maintain balanced macronutrients. Log your meals for awareness.';\n    }\n  }\n}\n\nexport default WhoopRecommendationEngine;