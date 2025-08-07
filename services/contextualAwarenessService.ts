import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContextualData, UserPreferences } from '@/types/whoop';

class ContextualAwarenessService {
  private readonly CONTEXT_KEY = 'contextual_data';
  private readonly MOOD_KEY = 'user_mood_reports';
  private readonly LOCATION_KEY = 'user_location_context';

  // Context Data Management
  async getCurrentContext(): Promise<ContextualData> {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay: 'morning' | 'afternoon' | 'evening' = 
      hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Get stored contextual data
    const storedContext = await this.getStoredContext();
    
    // Get recent activities
    const recentActivities = await this.getRecentActivities();
    
    // Get user reported mood
    const userReportedMood = await this.getLatestMoodReport();
    
    const context: ContextualData = {
      timeOfDay,
      dayOfWeek,
      weather: storedContext?.weather,
      calendarEvents: storedContext?.calendarEvents,
      location: storedContext?.location,
      recentActivities,
      userReportedMood
    };
    
    // Store updated context
    await this.storeContext(context);
    
    return context;
  }

  private async getStoredContext(): Promise<ContextualData | null> {
    try {
      const stored = await AsyncStorage.getItem(this.CONTEXT_KEY);
      if (!stored) return null;
      
      const context = JSON.parse(stored);
      return {
        ...context,
        userReportedMood: context.userReportedMood ? {
          ...context.userReportedMood,
          reportedAt: new Date(context.userReportedMood.reportedAt)
        } : undefined
      };
    } catch (error) {
      console.error('Error getting stored context:', error);
      return null;
    }
  }

  private async storeContext(context: ContextualData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CONTEXT_KEY, JSON.stringify(context));
    } catch (error) {
      console.error('Error storing context:', error);
    }
  }

  // Weather Integration (Mock implementation - in real app would use weather API)
  async updateWeatherContext(temperature: number, condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy', humidity: number): Promise<void> {
    try {
      const currentContext = await this.getCurrentContext();
      const updatedContext: ContextualData = {
        ...currentContext,
        weather: { temperature, condition, humidity }
      };
      
      await this.storeContext(updatedContext);
      console.log('Weather context updated:', { temperature, condition, humidity });
    } catch (error) {
      console.error('Error updating weather context:', error);
    }
  }

  // Calendar Integration (Mock implementation)
  async updateCalendarContext(
    hasWorkout: boolean, 
    hasMeeting: boolean, 
    isBusy: boolean, 
    freeTimeSlots: string[]
  ): Promise<void> {
    try {
      const currentContext = await this.getCurrentContext();
      const updatedContext: ContextualData = {
        ...currentContext,
        calendarEvents: { hasWorkout, hasMeeting, isBusy, freeTimeSlots }
      };
      
      await this.storeContext(updatedContext);
      console.log('Calendar context updated');
    } catch (error) {
      console.error('Error updating calendar context:', error);
    }
  }

  // Location Context
  async updateLocationContext(
    isHome: boolean, 
    isGym: boolean, 
    isOffice: boolean, 
    hasGymAccess: boolean
  ): Promise<void> {
    try {
      const currentContext = await this.getCurrentContext();
      const updatedContext: ContextualData = {
        ...currentContext,
        location: { isHome, isGym, isOffice, hasGymAccess }
      };
      
      await this.storeContext(updatedContext);
      console.log('Location context updated');
    } catch (error) {
      console.error('Error updating location context:', error);
    }
  }

  // Recent Activities Tracking
  private async getRecentActivities(): Promise<ContextualData['recentActivities']> {
    try {
      const stored = await AsyncStorage.getItem('recent_activities');
      if (!stored) return {};
      
      const activities = JSON.parse(stored);
      return {
        lastWorkout: activities.lastWorkout ? new Date(activities.lastWorkout) : undefined,
        lastMeal: activities.lastMeal ? new Date(activities.lastMeal) : undefined,
        lastSleep: activities.lastSleep ? new Date(activities.lastSleep) : undefined,
        stressLevel: activities.stressLevel
      };
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return {};
    }
  }

  async recordActivity(
    type: 'workout' | 'meal' | 'sleep', 
    timestamp: Date = new Date(),
    stressLevel?: 'low' | 'medium' | 'high'
  ): Promise<void> {
    try {
      const activities = await this.getRecentActivities();
      const updatedActivities = {
        ...activities,
        [`last${type.charAt(0).toUpperCase() + type.slice(1)}`]: timestamp,
        ...(stressLevel && { stressLevel })
      };
      
      await AsyncStorage.setItem('recent_activities', JSON.stringify(updatedActivities));
      console.log(`${type} activity recorded:`, timestamp);
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  }

  // User Mood Reporting
  async reportMood(
    energy: number, 
    motivation: number, 
    stress: number, 
    mood: 'great' | 'good' | 'okay' | 'poor' | 'terrible'
  ): Promise<void> {
    try {
      const moodReport = {
        energy,
        motivation,
        stress,
        mood,
        reportedAt: new Date()
      };
      
      // Store latest mood report
      await AsyncStorage.setItem(this.MOOD_KEY, JSON.stringify(moodReport));
      
      // Also store in mood history
      const history = await this.getMoodHistory();
      const updatedHistory = [...history, moodReport].slice(-30); // Keep last 30 reports
      await AsyncStorage.setItem('mood_history', JSON.stringify(updatedHistory));
      
      console.log('Mood reported:', moodReport);
    } catch (error) {
      console.error('Error reporting mood:', error);
    }
  }

  private async getLatestMoodReport(): Promise<ContextualData['userReportedMood']> {
    try {
      const stored = await AsyncStorage.getItem(this.MOOD_KEY);
      if (!stored) return undefined;
      
      const mood = JSON.parse(stored);
      return {
        ...mood,
        reportedAt: new Date(mood.reportedAt)
      };
    } catch (error) {
      console.error('Error getting latest mood report:', error);
      return undefined;
    }
  }

  async getMoodHistory(): Promise<ContextualData['userReportedMood'][]> {
    try {
      const stored = await AsyncStorage.getItem('mood_history');
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return history.map((mood: any) => ({
        ...mood,
        reportedAt: new Date(mood.reportedAt)
      }));
    } catch (error) {
      console.error('Error getting mood history:', error);
      return [];
    }
  }

  // Context Analysis for Recommendations
  async analyzeContextForRecommendations(userPreferences?: UserPreferences): Promise<{
    contextualFactors: string[];
    recommendationAdjustments: string[];
    optimalTiming: string[];
  }> {
    const context = await this.getCurrentContext();
    const contextualFactors: string[] = [];
    const recommendationAdjustments: string[] = [];
    const optimalTiming: string[] = [];

    // Time-based analysis
    if (context.timeOfDay === 'morning') {
      contextualFactors.push('Morning energy levels');
      recommendationAdjustments.push('Prioritize hydration and light movement');
      optimalTiming.push('Good time for workout planning');
    } else if (context.timeOfDay === 'evening') {
      contextualFactors.push('Evening wind-down period');
      recommendationAdjustments.push('Focus on recovery and sleep preparation');
      optimalTiming.push('Ideal for reflection and planning');
    }

    // Weather-based analysis
    if (context.weather) {
      if (context.weather.condition === 'rainy') {
        contextualFactors.push('Rainy weather limiting outdoor activities');
        recommendationAdjustments.push('Suggest indoor workout alternatives');
      } else if (context.weather.condition === 'sunny') {
        contextualFactors.push('Good weather for outdoor activities');
        recommendationAdjustments.push('Encourage outdoor workouts');
      }
    }

    // Calendar-based analysis
    if (context.calendarEvents) {
      if (context.calendarEvents.isBusy) {
        contextualFactors.push('Busy schedule detected');
        recommendationAdjustments.push('Suggest quick, efficient activities');
        optimalTiming.push('Focus on micro-workouts and stress management');
      } else if (context.calendarEvents.freeTimeSlots.length > 0) {
        contextualFactors.push('Free time available');
        optimalTiming.push('Good opportunity for longer activities');
      }
    }

    // Location-based analysis
    if (context.location) {
      if (context.location.isGym) {
        contextualFactors.push('At gym location');
        recommendationAdjustments.push('Prioritize strength training recommendations');
      } else if (context.location.isHome) {
        contextualFactors.push('At home');
        recommendationAdjustments.push('Focus on bodyweight exercises and nutrition');
      }
    }

    // Mood-based analysis
    if (context.userReportedMood) {
      const mood = context.userReportedMood;
      if (mood.energy < 5) {
        contextualFactors.push('Low energy levels reported');
        recommendationAdjustments.push('Suggest gentle activities and recovery focus');
      }
      if (mood.stress > 7) {
        contextualFactors.push('High stress levels reported');
        recommendationAdjustments.push('Prioritize stress management techniques');
      }
      if (mood.motivation < 5) {
        contextualFactors.push('Low motivation reported');
        recommendationAdjustments.push('Suggest easy, achievable goals');
      }
    }

    // User preference integration
    if (userPreferences) {
      if (userPreferences.preferredWorkoutTimes.includes(context.timeOfDay)) {
        optimalTiming.push('Matches preferred workout time');
      }
      
      if (userPreferences.notificationSettings.workoutReminders && context.timeOfDay === 'morning') {
        optimalTiming.push('Good time for workout reminders');
      }
    }

    return {
      contextualFactors,
      recommendationAdjustments,
      optimalTiming
    };
  }

  // Smart Timing Suggestions
  async suggestOptimalTiming(
    activityType: 'workout' | 'meal' | 'recovery',
    userPreferences?: UserPreferences
  ): Promise<{
    suggestedTime: string;
    reasoning: string[];
    alternatives: string[];
  }> {
    const context = await this.getCurrentContext();
    const analysis = await this.analyzeContextForRecommendations(userPreferences);
    
    let suggestedTime = 'now';
    const reasoning: string[] = [];
    const alternatives: string[] = [];

    if (activityType === 'workout') {
      if (context.userReportedMood?.energy && context.userReportedMood.energy > 7) {
        suggestedTime = 'now';
        reasoning.push('High energy levels reported');
      } else if (context.timeOfDay === 'morning' && userPreferences?.preferredWorkoutTimes.includes('morning')) {
        suggestedTime = 'now';
        reasoning.push('Morning preference and good timing');
      } else {
        suggestedTime = 'later today';
        reasoning.push('Consider timing when energy levels are higher');
        alternatives.push('Early morning', 'Late afternoon');
      }
    } else if (activityType === 'meal') {
      if (context.recentActivities.lastMeal) {
        const hoursSinceLastMeal = (Date.now() - context.recentActivities.lastMeal.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastMeal > 3) {
          suggestedTime = 'now';
          reasoning.push('Appropriate time since last meal');
        } else {
          suggestedTime = 'in 1-2 hours';
          reasoning.push('Recent meal detected, allow digestion time');
        }
      }
    } else if (activityType === 'recovery') {
      if (context.timeOfDay === 'evening') {
        suggestedTime = 'now';
        reasoning.push('Evening is optimal for recovery activities');
      } else if (context.userReportedMood?.stress && context.userReportedMood.stress > 6) {
        suggestedTime = 'now';
        reasoning.push('High stress levels indicate need for immediate recovery');
      }
    }

    return {
      suggestedTime,
      reasoning,
      alternatives
    };
  }

  // Utility methods
  async clearContextData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.CONTEXT_KEY,
        this.MOOD_KEY,
        this.LOCATION_KEY,
        'recent_activities',
        'mood_history'
      ]);
      console.log('All contextual data cleared');
    } catch (error) {
      console.error('Error clearing contextual data:', error);
    }
  }

  async exportContextData(): Promise<{
    currentContext: ContextualData;
    moodHistory: ContextualData['userReportedMood'][];
    recentActivities: ContextualData['recentActivities'];
  }> {
    return {
      currentContext: await this.getCurrentContext(),
      moodHistory: await this.getMoodHistory(),
      recentActivities: await this.getRecentActivities()
    };
  }
}

export const contextualAwarenessService = new ContextualAwarenessService();
export default contextualAwarenessService;