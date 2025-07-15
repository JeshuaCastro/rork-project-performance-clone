import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { 
  X, 
  Sun, 
  Heart, 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Zap,
  Target,
  Calendar,
  Clock,
  Flame
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWhoopStore } from '@/store/whoopStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DailyInsight {
  type: 'recovery' | 'workout' | 'nutrition' | 'sleep' | 'general';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: boolean;
  icon: React.ReactNode;
}

interface DailyPopupProps {
  visible: boolean;
  onClose: () => void;
}

const DailyPopup: React.FC<DailyPopupProps> = ({ visible, onClose }) => {
  const [insights, setInsights] = useState<DailyInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todaysSummary, setTodaysSummary] = useState<string>('');
  
  const {
    data,
    userProfile,
    getTodaysWorkout,
    getMacroProgressForDate,
    isConnectedToWhoop,
    activePrograms,
    getProgramProgress
  } = useWhoopStore();

  useEffect(() => {
    if (visible) {
      generateDailyInsights();
    }
  }, [visible, data, userProfile, activePrograms]);

  const generateDailyInsights = async () => {
    setIsLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaysWorkout = getTodaysWorkout();
      const macroProgress = getMacroProgressForDate(today);
      const latestRecovery = data.recovery[0];
      const latestSleep = data.sleep[0];
      const latestStrain = data.strain[0];
      
      const newInsights: DailyInsight[] = [];
      
      // Recovery Insight
      if (isConnectedToWhoop && latestRecovery) {
        const recoveryScore = latestRecovery.score;
        let recoveryInsight: DailyInsight;
        
        if (recoveryScore >= 75) {
          recoveryInsight = {
            type: 'recovery',
            title: 'Excellent Recovery',
            message: `Your recovery is at ${recoveryScore}% - perfect for high-intensity training today!`,
            priority: 'high',
            actionable: true,
            icon: <CheckCircle size={20} color={colors.success} />
          };
        } else if (recoveryScore >= 50) {
          recoveryInsight = {
            type: 'recovery',
            title: 'Moderate Recovery',
            message: `Recovery at ${recoveryScore}%. Consider moderate intensity training with extra rest between sets.`,
            priority: 'medium',
            actionable: true,
            icon: <Heart size={20} color={colors.warning} />
          };
        } else {
          recoveryInsight = {
            type: 'recovery',
            title: 'Low Recovery',
            message: `Recovery is ${recoveryScore}%. Focus on light movement, hydration, and sleep tonight.`,
            priority: 'high',
            actionable: true,
            icon: <AlertCircle size={20} color={colors.danger} />
          };
        }
        
        newInsights.push(recoveryInsight);
      }

      // Workout Insight
      if (todaysWorkout) {
        const programProgress = getProgramProgress(todaysWorkout.programId);
        const workoutInsight: DailyInsight = {
          type: 'workout',
          title: `Today's Focus: ${todaysWorkout.title}`,
          message: `${todaysWorkout.description.substring(0, 80)}... You're ${programProgress.progressPercentage.toFixed(0)}% through your program!`,
          priority: 'high',
          actionable: true,
          icon: <Target size={20} color={colors.primary} />
        };
        newInsights.push(workoutInsight);
      } else if (activePrograms.length > 0) {
        newInsights.push({
          type: 'workout',
          title: 'Rest Day',
          message: 'No scheduled workout today. Perfect time for recovery, mobility work, or light activity.',
          priority: 'medium',
          actionable: false,
          icon: <Heart size={20} color={colors.primary} />
        });
      }

      // Sleep Insight
      if (isConnectedToWhoop && latestSleep) {
        const sleepEfficiency = latestSleep.efficiency;
        const sleepDuration = Math.round(latestSleep.duration / 60); // Convert to hours
        
        let sleepInsight: DailyInsight;
        if (sleepEfficiency >= 85 && sleepDuration >= 7) {
          sleepInsight = {
            type: 'sleep',
            title: 'Great Sleep Quality',
            message: `${sleepDuration}h sleep with ${sleepEfficiency}% efficiency. Your body is well-rested for today's activities.`,
            priority: 'low',
            actionable: false,
            icon: <CheckCircle size={20} color={colors.success} />
          };
        } else if (sleepDuration < 6) {
          sleepInsight = {
            type: 'sleep',
            title: 'Short Sleep Duration',
            message: `Only ${sleepDuration}h of sleep. Consider an earlier bedtime tonight and avoid intense training today.`,
            priority: 'high',
            actionable: true,
            icon: <AlertCircle size={20} color={colors.danger} />
          };
        } else {
          sleepInsight = {
            type: 'sleep',
            title: 'Moderate Sleep',
            message: `${sleepDuration}h sleep with ${sleepEfficiency}% efficiency. Aim for 7-9 hours tonight for better recovery.`,
            priority: 'medium',
            actionable: true,
            icon: <Clock size={20} color={colors.warning} />
          };
        }
        
        newInsights.push(sleepInsight);
      }

      // Nutrition Insight
      const calorieProgress = (macroProgress.calories.consumed / macroProgress.calories.target) * 100;
      const proteinProgress = (macroProgress.protein.consumed / macroProgress.protein.target) * 100;
      
      if (calorieProgress < 30 && new Date().getHours() > 14) {
        newInsights.push({
          type: 'nutrition',
          title: 'Low Calorie Intake',
          message: `You've only consumed ${Math.round(calorieProgress)}% of your daily calories. Make sure to fuel properly for your activities.`,
          priority: 'medium',
          actionable: true,
          icon: <Flame size={20} color={colors.warning} />
        });
      } else if (proteinProgress < 50 && new Date().getHours() > 16) {
        newInsights.push({
          type: 'nutrition',
          title: 'Protein Goal Behind',
          message: `You're at ${Math.round(proteinProgress)}% of your protein target. Consider a protein-rich snack or meal.`,
          priority: 'medium',
          actionable: true,
          icon: <Zap size={20} color={colors.primary} />
        });
      } else if (calorieProgress > 80 && proteinProgress > 80) {
        newInsights.push({
          type: 'nutrition',
          title: 'Nutrition On Track',
          message: `Great job! You're meeting your calorie and protein goals for today.`,
          priority: 'low',
          actionable: false,
          icon: <CheckCircle size={20} color={colors.success} />
        });
      }

      // Strain/Activity Insight
      if (isConnectedToWhoop && latestStrain) {
        const strainScore = latestStrain.score;
        if (strainScore > 15 && latestRecovery && latestRecovery.score < 50) {
          newInsights.push({
            type: 'general',
            title: 'High Strain, Low Recovery',
            message: 'Yesterday was demanding and recovery is low. Consider active recovery or reducing today\'s intensity.',
            priority: 'high',
            actionable: true,
            icon: <TrendingUp size={20} color={colors.danger} />
          });
        }
      }

      // General Motivation/Tip
      const motivationalInsights = [
        {
          type: 'general' as const,
          title: 'Hydration Reminder',
          message: 'Start your day with a large glass of water. Aim for 2-3 liters throughout the day.',
          priority: 'low' as const,
          actionable: true,
          icon: <Activity size={20} color={colors.primary} />
        },
        {
          type: 'general' as const,
          title: 'Movement Matters',
          message: 'Even on rest days, light movement like walking or stretching can boost recovery.',
          priority: 'low' as const,
          actionable: true,
          icon: <Heart size={20} color={colors.primary} />
        },
        {
          type: 'general' as const,
          title: 'Consistency Wins',
          message: 'Small, consistent actions compound over time. Focus on showing up today.',
          priority: 'low' as const,
          actionable: false,
          icon: <Target size={20} color={colors.primary} />
        }
      ];

      // Add a random motivational insight if we don't have many insights
      if (newInsights.length < 3) {
        const randomInsight = motivationalInsights[Math.floor(Math.random() * motivationalInsights.length)];
        newInsights.push(randomInsight);
      }

      // Generate AI-powered daily summary
      await generateDailySummary(newInsights, todaysWorkout, latestRecovery);

      // Sort insights by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      newInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setInsights(newInsights);
    } catch (error) {
      console.error('Error generating daily insights:', error);
      // Fallback insights
      setInsights([
        {
          type: 'general',
          title: 'Good Morning!',
          message: 'Ready to make today count? Check your workout plan and stay hydrated.',
          priority: 'medium',
          actionable: true,
          icon: <Sun size={20} color={colors.primary} />
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailySummary = async (insights: DailyInsight[], todaysWorkout: any, latestRecovery: any) => {
    try {
      const highPriorityInsights = insights.filter(i => i.priority === 'high');
      const hasWorkout = !!todaysWorkout;
      const recoveryScore = latestRecovery?.score || 'unknown';
      
      const contextPrompt = `Generate a brief, motivational daily summary (max 60 words) based on:
- Recovery: ${recoveryScore}%
- Workout planned: ${hasWorkout ? todaysWorkout.title : 'Rest day'}
- Key concerns: ${highPriorityInsights.map(i => i.title).join(', ') || 'None'}
- User: ${userProfile.age}y ${userProfile.gender}, goal: ${userProfile.fitnessGoal}

Make it personal, actionable, and encouraging.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a motivational fitness coach. Create brief, personal daily summaries.'
            },
            {
              role: 'user',
              content: contextPrompt
            }
          ]
        }),
      });

      const result = await response.json();
      setTodaysSummary(result.completion || 'Ready to make today count? Stay focused on your goals and listen to your body.');
    } catch (error) {
      console.error('Error generating daily summary:', error);
      setTodaysSummary('Ready to make today count? Stay focused on your goals and listen to your body.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'HIGH';
      case 'medium': return 'MED';
      case 'low': return 'INFO';
      default: return '';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Sun size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>Daily Briefing</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.dateContainer}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Daily Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Today's Overview</Text>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Analyzing your metrics...</Text>
                </View>
              ) : (
                <Text style={styles.summaryText}>{todaysSummary}</Text>
              )}
            </View>

            {/* Insights */}
            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Key Insights</Text>
              
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                insights.map((insight, index) => (
                  <View key={index} style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <View style={styles.insightTitleContainer}>
                        {insight.icon}
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                      </View>
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(insight.priority) + '20' }
                      ]}>
                        <Text style={[
                          styles.priorityText,
                          { color: getPriorityColor(insight.priority) }
                        ]}>
                          {getPriorityBadge(insight.priority)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.insightMessage}>{insight.message}</Text>
                    {insight.actionable && (
                      <View style={styles.actionableIndicator}>
                        <CheckCircle size={12} color={colors.primary} />
                        <Text style={styles.actionableText}>Actionable</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* Quick Stats */}
            {!isLoading && (
              <View style={styles.quickStatsContainer}>
                <Text style={styles.sectionTitle}>Quick Stats</Text>
                <View style={styles.statsGrid}>
                  {isConnectedToWhoop && data.recovery[0] && (
                    <View style={styles.statCard}>
                      <Heart size={16} color={colors.primary} />
                      <Text style={styles.statLabel}>Recovery</Text>
                      <Text style={styles.statValue}>{data.recovery[0].score}%</Text>
                    </View>
                  )}
                  
                  {activePrograms.length > 0 && (
                    <View style={styles.statCard}>
                      <Target size={16} color={colors.primary} />
                      <Text style={styles.statLabel}>Programs</Text>
                      <Text style={styles.statValue}>{activePrograms.length}</Text>
                    </View>
                  )}
                  
                  <View style={styles.statCard}>
                    <Flame size={16} color={colors.primary} />
                    <Text style={styles.statLabel}>Calories</Text>
                    <Text style={styles.statValue}>
                      {Math.round((getMacroProgressForDate(new Date().toISOString().split('T')[0]).calories.consumed / getMacroProgressForDate(new Date().toISOString().split('T')[0]).calories.target) * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.gotItButton} onPress={onClose}>
              <Text style={styles.gotItButtonText}>Got it, let's go!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.85,
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: colors.card,
    margin: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  insightsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  insightMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionableText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  quickStatsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
  },
  gotItButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  gotItButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default DailyPopup;