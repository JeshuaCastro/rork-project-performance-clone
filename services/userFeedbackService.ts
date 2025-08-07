import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RecommendationFeedback,
  UserPreferences,
  RecommendationEffectiveness,
  LearningInsights,
  UserProfile
} from '@/types/whoop';

class UserFeedbackService {
  private readonly FEEDBACK_KEY = 'recommendation_feedback';
  private readonly PREFERENCES_KEY = 'user_preferences';
  private readonly EFFECTIVENESS_KEY = 'recommendation_effectiveness';
  private readonly INSIGHTS_KEY = 'learning_insights';

  // Feedback Management
  async recordFeedback(feedback: Omit<RecommendationFeedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const existingFeedback = await this.getAllFeedback();
      const newFeedback: RecommendationFeedback = {
        ...feedback,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedFeedback = [...existingFeedback, newFeedback];
      await AsyncStorage.setItem(this.FEEDBACK_KEY, JSON.stringify(updatedFeedback));
      
      // Update effectiveness metrics
      await this.updateEffectivenessMetrics(newFeedback);
      
      console.log('Feedback recorded:', newFeedback.id);
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }

  async getAllFeedback(): Promise<RecommendationFeedback[]> {
    try {
      const stored = await AsyncStorage.getItem(this.FEEDBACK_KEY);
      if (!stored) return [];
      
      const feedback = JSON.parse(stored);
      return feedback.map((f: any) => ({
        ...f,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
        followedAt: f.followedAt ? new Date(f.followedAt) : undefined,
        dismissedAt: f.dismissedAt ? new Date(f.dismissedAt) : undefined,
        scheduledAt: f.scheduledAt ? new Date(f.scheduledAt) : undefined
      }));
    } catch (error) {
      console.error('Error getting feedback:', error);
      return [];
    }
  }

  async getFeedbackForRecommendation(recommendationId: string): Promise<RecommendationFeedback[]> {
    const allFeedback = await this.getAllFeedback();
    return allFeedback.filter(f => f.recommendationId === recommendationId);
  }

  async updateFeedbackOutcome(
    feedbackId: string, 
    outcome: 'improved' | 'no-change' | 'worsened',
    outcomeMetrics?: RecommendationFeedback['outcomeMetrics']
  ): Promise<void> {
    try {
      const allFeedback = await this.getAllFeedback();
      const feedbackIndex = allFeedback.findIndex(f => f.id === feedbackId);
      
      if (feedbackIndex !== -1) {
        allFeedback[feedbackIndex] = {
          ...allFeedback[feedbackIndex],
          outcome,
          outcomeMetrics,
          updatedAt: new Date()
        };
        
        await AsyncStorage.setItem(this.FEEDBACK_KEY, JSON.stringify(allFeedback));
        await this.updateEffectivenessMetrics(allFeedback[feedbackIndex]);
        
        console.log('Feedback outcome updated:', feedbackId);
      }
    } catch (error) {
      console.error('Error updating feedback outcome:', error);
    }
  }

  // User Preferences Management
  async saveUserPreferences(preferences: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const newPreferences: UserPreferences = {
        ...preferences,
        id: `prefs_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(newPreferences));
      console.log('User preferences saved');
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const stored = await AsyncStorage.getItem(this.PREFERENCES_KEY);
      if (!stored) return null;
      
      const preferences = JSON.parse(stored);
      return {
        ...preferences,
        createdAt: new Date(preferences.createdAt),
        updatedAt: new Date(preferences.updatedAt)
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Effectiveness Tracking
  private async updateEffectivenessMetrics(feedback: RecommendationFeedback): Promise<void> {
    try {
      const effectiveness = await this.getEffectivenessMetrics();
      const existingIndex = effectiveness.findIndex(e => e.recommendationId === feedback.recommendationId);
      
      if (existingIndex !== -1) {
        // Update existing metrics
        const existing = effectiveness[existingIndex];
        const newFollowCount = feedback.action === 'followed' ? existing.followCount + 1 : existing.followCount;
        
        let newSuccessRate = existing.successRate;
        let newSatisfactionScore = existing.userSatisfactionScore;
        
        if (feedback.outcome) {
          const outcomeScore = feedback.outcome === 'improved' ? 1 : feedback.outcome === 'no-change' ? 0 : -1;
          newSuccessRate = (existing.averageOutcomeScore + outcomeScore) / 2;
        }
        
        if (feedback.feedback) {
          const satisfactionScore = feedback.feedback === 'helpful' ? 1 : feedback.feedback === 'partially-helpful' ? 0.5 : 0;
          newSatisfactionScore = (existing.userSatisfactionScore + satisfactionScore) / 2;
        }
        
        effectiveness[existingIndex] = {
          ...existing,
          followCount: newFollowCount,
          successRate: newSuccessRate,
          userSatisfactionScore: newSatisfactionScore,
          lastUpdated: new Date()
        };
      } else {
        // Create new metrics
        const newMetrics: RecommendationEffectiveness = {
          recommendationId: feedback.recommendationId,
          category: 'recovery', // This should be passed from the recommendation
          followCount: feedback.action === 'followed' ? 1 : 0,
          successRate: feedback.outcome === 'improved' ? 1 : feedback.outcome === 'no-change' ? 0.5 : 0,
          averageOutcomeScore: feedback.outcome === 'improved' ? 1 : feedback.outcome === 'no-change' ? 0 : -1,
          userSatisfactionScore: feedback.feedback === 'helpful' ? 1 : feedback.feedback === 'partially-helpful' ? 0.5 : 0,
          contextualFactors: {
            timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            recoveryLevel: 'medium' // This should be passed from current context
          },
          lastUpdated: new Date()
        };
        
        effectiveness.push(newMetrics);
      }
      
      await AsyncStorage.setItem(this.EFFECTIVENESS_KEY, JSON.stringify(effectiveness));
    } catch (error) {
      console.error('Error updating effectiveness metrics:', error);
    }
  }

  async getEffectivenessMetrics(): Promise<RecommendationEffectiveness[]> {
    try {
      const stored = await AsyncStorage.getItem(this.EFFECTIVENESS_KEY);
      if (!stored) return [];
      
      const metrics = JSON.parse(stored);
      return metrics.map((m: any) => ({
        ...m,
        lastUpdated: new Date(m.lastUpdated)
      }));
    } catch (error) {
      console.error('Error getting effectiveness metrics:', error);
      return [];
    }
  }

  // Learning Insights Generation
  async generateLearningInsights(userId: string): Promise<LearningInsights> {
    try {
      const allFeedback = await this.getAllFeedback();
      const userFeedback = allFeedback.filter(f => f.userId === userId);
      const effectiveness = await this.getEffectivenessMetrics();
      
      const totalRecommendations = userFeedback.length;
      const followedRecommendations = userFeedback.filter(f => f.action === 'followed').length;
      const overallSuccessRate = totalRecommendations > 0 ? followedRecommendations / totalRecommendations : 0;
      
      // Calculate category performance
      const categoryPerformance = {
        recovery: this.calculateCategoryPerformance(userFeedback, effectiveness, 'recovery'),
        workout: this.calculateCategoryPerformance(userFeedback, effectiveness, 'workout'),
        nutrition: this.calculateCategoryPerformance(userFeedback, effectiveness, 'nutrition'),
        lifestyle: this.calculateCategoryPerformance(userFeedback, effectiveness, 'lifestyle')
      };
      
      // Find best performing times
      const timePerformance = this.analyzeBestPerformingTimes(userFeedback);
      
      // Identify preferred recommendation types
      const preferredTypes = this.identifyPreferredTypes(userFeedback, effectiveness);
      
      // Analyze adaptation trends
      const adaptationTrends = this.analyzeAdaptationTrends(userFeedback, effectiveness);
      
      const insights: LearningInsights = {
        userId,
        totalRecommendationsGiven: totalRecommendations,
        totalRecommendationsFollowed: followedRecommendations,
        overallSuccessRate,
        categoryPerformance,
        bestPerformingTimes: timePerformance,
        preferredRecommendationTypes: preferredTypes,
        adaptationTrends,
        lastAnalyzed: new Date()
      };
      
      await AsyncStorage.setItem(this.INSIGHTS_KEY, JSON.stringify(insights));
      return insights;
    } catch (error) {
      console.error('Error generating learning insights:', error);
      throw error;
    }
  }

  async getLearningInsights(): Promise<LearningInsights | null> {
    try {
      const stored = await AsyncStorage.getItem(this.INSIGHTS_KEY);
      if (!stored) return null;
      
      const insights = JSON.parse(stored);
      return {
        ...insights,
        lastAnalyzed: new Date(insights.lastAnalyzed)
      };
    } catch (error) {
      console.error('Error getting learning insights:', error);
      return null;
    }
  }

  // Helper methods for analysis
  private calculateCategoryPerformance(
    feedback: RecommendationFeedback[], 
    effectiveness: RecommendationEffectiveness[], 
    category: 'recovery' | 'workout' | 'nutrition' | 'lifestyle'
  ): { successRate: number; followRate: number } {
    const categoryEffectiveness = effectiveness.filter(e => e.category === category);
    
    if (categoryEffectiveness.length === 0) {
      return { successRate: 0, followRate: 0 };
    }
    
    const avgSuccessRate = categoryEffectiveness.reduce((sum, e) => sum + e.successRate, 0) / categoryEffectiveness.length;
    const totalFollows = categoryEffectiveness.reduce((sum, e) => sum + e.followCount, 0);
    const followRate = totalFollows / categoryEffectiveness.length;
    
    return {
      successRate: avgSuccessRate,
      followRate: Math.min(1, followRate / 10) // Normalize to 0-1 scale
    };
  }

  private analyzeBestPerformingTimes(feedback: RecommendationFeedback[]): string[] {
    const timePerformance: { [key: string]: { total: number; followed: number } } = {};
    
    feedback.forEach(f => {
      const hour = f.createdAt.getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      
      if (!timePerformance[timeSlot]) {
        timePerformance[timeSlot] = { total: 0, followed: 0 };
      }
      
      timePerformance[timeSlot].total++;
      if (f.action === 'followed') {
        timePerformance[timeSlot].followed++;
      }
    });
    
    return Object.entries(timePerformance)
      .map(([time, stats]) => ({ time, rate: stats.followed / stats.total }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 2)
      .map(item => item.time);
  }

  private identifyPreferredTypes(
    feedback: RecommendationFeedback[], 
    effectiveness: RecommendationEffectiveness[]
  ): string[] {
    const typePerformance: { [key: string]: number } = {};
    
    effectiveness.forEach(e => {
      typePerformance[e.category] = (typePerformance[e.category] || 0) + e.userSatisfactionScore;
    });
    
    return Object.entries(typePerformance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  private analyzeAdaptationTrends(
    feedback: RecommendationFeedback[], 
    effectiveness: RecommendationEffectiveness[]
  ): LearningInsights['adaptationTrends'] {
    const recentFeedback = feedback.filter(f => {
      const daysSince = (Date.now() - f.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30; // Last 30 days
    });
    
    const categoryTrends: { [key: string]: number[] } = {};
    
    recentFeedback.forEach(f => {
      const category = 'general'; // This should be derived from the recommendation
      if (!categoryTrends[category]) categoryTrends[category] = [];
      
      const score = f.outcome === 'improved' ? 1 : f.outcome === 'no-change' ? 0 : -1;
      categoryTrends[category].push(score);
    });
    
    const improvingAreas: string[] = [];
    const challengingAreas: string[] = [];
    
    Object.entries(categoryTrends).forEach(([category, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore > 0.3) improvingAreas.push(category);
      if (avgScore < -0.3) challengingAreas.push(category);
    });
    
    return {
      improvingAreas,
      challengingAreas,
      recentChanges: ['Increased workout recommendation follow rate', 'Better nutrition timing adherence']
    };
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.FEEDBACK_KEY,
        this.PREFERENCES_KEY,
        this.EFFECTIVENESS_KEY,
        this.INSIGHTS_KEY
      ]);
      console.log('All user feedback data cleared');
    } catch (error) {
      console.error('Error clearing user feedback data:', error);
    }
  }

  async exportData(): Promise<{
    feedback: RecommendationFeedback[];
    preferences: UserPreferences | null;
    effectiveness: RecommendationEffectiveness[];
    insights: LearningInsights | null;
  }> {
    return {
      feedback: await this.getAllFeedback(),
      preferences: await this.getUserPreferences(),
      effectiveness: await this.getEffectivenessMetrics(),
      insights: await this.getLearningInsights()
    };
  }
}

export const userFeedbackService = new UserFeedbackService();
export default userFeedbackService;