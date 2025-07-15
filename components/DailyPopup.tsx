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

  // Ensure we have safe defaults for all required data
  const safeData = data || { recovery: [], sleep: [], strain: [] };
  const safeUserProfile = userProfile || { 
    age: 30, 
    gender: 'male' as const, 
    fitnessGoal: 'maintainWeight' as const,
    weight: 70,
    height: 175,
    activityLevel: 'moderatelyActive' as const,
    name: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const safeActivePrograms = activePrograms || [];
  
  // Check if we have meaningful data to show
  const hasWhoopData = isConnectedToWhoop && safeData && safeData.recovery && safeData.recovery.length > 0;
  const hasActiveProgramsData = safeActivePrograms && safeActivePrograms.length > 0;
  const hasCompleteProfile = Boolean(
    safeUserProfile && 
    safeUserProfile.name && 
    safeUserProfile.age && 
    safeUserProfile.gender && 
    safeUserProfile.weight && 
    safeUserProfile.height && 
    safeUserProfile.activityLevel && 
    safeUserProfile.fitnessGoal
  );
  
  // Only show popup if there's meaningful data
  const shouldShowPopup = hasWhoopData || hasActiveProgramsData || hasCompleteProfile;

  useEffect(() => {
    if (visible) {
      generateDailyInsights();
    }
  }, [visible, safeData, safeUserProfile, safeActivePrograms]);

  const generateDailyInsights = async () => {
    setIsLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaysWorkout = getTodaysWorkout ? getTodaysWorkout() : null;
      const macroProgress = getMacroProgressForDate ? getMacroProgressForDate(today) : null;
      const latestRecovery = safeData.recovery && safeData.recovery.length > 0 ? safeData.recovery[0] : null;
      const latestSleep = safeData.sleep && safeData.sleep.length > 0 ? safeData.sleep[0] : null;
      const latestStrain = safeData.strain && safeData.strain.length > 0 ? safeData.strain[0] : null;
      
      const newInsights: DailyInsight[] = [];
      
      // Recovery Insight - only if we have WHOOP data
      if (hasWhoopData && latestRecovery) {
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

      // Workout Insight - only if we have active programs or workouts
      if (todaysWorkout && hasActiveProgramsData) {
        const programProgress = getProgramProgress ? getProgramProgress(todaysWorkout.programId) : null;
        const workoutDescription = todaysWorkout.description || 'Workout session';
        const progressPercentage = programProgress?.progressPercentage || 0;
        
        const workoutInsight: DailyInsight = {
          type: 'workout',
          title: `Today's Focus: ${todaysWorkout.title}`,
          message: `${workoutDescription.substring(0, 80)}${workoutDescription.length > 80 ? '...' : ''} You're ${progressPercentage.toFixed(0)}% through your program!`,
          priority: 'high',
          actionable: true,
          icon: <Target size={20} color={colors.primary} />
        };
        newInsights.push(workoutInsight);
      } else if (hasActiveProgramsData) {
        newInsights.push({
          type: 'workout',
          title: 'Rest Day',
          message: 'No scheduled workout today. Perfect time for recovery, mobility work, or light activity.',
          priority: 'medium',
          actionable: false,
          icon: <Heart size={20} color={colors.primary} />
        });
      }

      // Sleep Insight - only if we have WHOOP data
      if (hasWhoopData && latestSleep) {
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

      // Nutrition Insight - safely handle undefined macroProgress
      let calorieProgress = 0;
      let proteinProgress = 0;
      let hasNutritionData = false;
      
      try {
        if (macroProgress?.calories?.target && macroProgress?.calories?.consumed !== undefined) {
          calorieProgress = (macroProgress.calories.consumed / macroProgress.calories.target) * 100;
          hasNutritionData = true;
        }
        if (macroProgress?.protein?.target && macroProgress?.protein?.consumed !== undefined) {
          proteinProgress = (macroProgress.protein.consumed / macroProgress.protein.target) * 100;
          hasNutritionData = true;
        }
      } catch (nutritionError) {
        console.error('Error calculating nutrition progress:', nutritionError);
        calorieProgress = 0;
        proteinProgress = 0;
        hasNutritionData = false;
      }
      
      if (hasNutritionData) {
        if (calorieProgress > 0 && calorieProgress < 30 && new Date().getHours() > 14) {
          newInsights.push({
            type: 'nutrition',
            title: 'Low Calorie Intake',
            message: `You've only consumed ${Math.round(calorieProgress)}% of your daily calories. Make sure to fuel properly for your activities.`,
            priority: 'medium',
            actionable: true,
            icon: <Flame size={20} color={colors.warning} />
          });
        } else if (proteinProgress > 0 && proteinProgress < 50 && new Date().getHours() > 16) {
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
      } else {
        // Add nutrition reminder if no data is being tracked
        newInsights.push({
          type: 'nutrition',
          title: 'Nutrition Tracking',
          message: 'Consider tracking your meals to optimize your nutrition and support your fitness goals.',
          priority: 'low',
          actionable: true,
          icon: <Flame size={20} color={colors.primary} />
        });
      }

      // Strain/Activity Insight - only if we have WHOOP data
      if (hasWhoopData && latestStrain) {
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

      // Add motivational insights if we don't have many insights
      if (newInsights.length < 2) {
        // Add multiple insights to ensure we have good content
        const shuffledInsights = [...motivationalInsights].sort(() => Math.random() - 0.5);
        const insightsToAdd = shuffledInsights.slice(0, 3 - newInsights.length);
        newInsights.push(...insightsToAdd);
      }
      
      // Ensure we always have at least one insight
      if (newInsights.length === 0) {
        newInsights.push({
          type: 'general',
          title: 'Good Morning!',
          message: 'Ready to make today count? Stay consistent with your goals and listen to your body.',
          priority: 'medium',
          actionable: true,
          icon: <Sun size={20} color={colors.primary} />
        });
      }

      // Generate AI-powered daily summary only if we have meaningful data
      try {
        if (hasWhoopData || hasActiveProgramsData) {
          await generateDailySummary(newInsights, todaysWorkout, latestRecovery);
        } else {
          // Set a simple summary for users with limited data
          setTodaysSummary('Welcome! Complete your profile and connect your WHOOP or create a training program to get personalized daily insights.');
        }
      } catch (summaryError) {
        console.error('Error generating daily summary:', summaryError);
        // Create a more personalized fallback summary based on available data
        const hasWorkout = todaysWorkout ? true : false;
        const recoveryScore = latestRecovery?.score;
        let fallbackSummary = 'Ready to make today count? ';
        
        if (hasWhoopData && hasWorkout && recoveryScore) {
          if (recoveryScore >= 75) {
            fallbackSummary += `With ${recoveryScore}% recovery, you're primed for today's ${todaysWorkout?.title}. Give it your all!`;
          } else if (recoveryScore >= 50) {
            fallbackSummary += `Your recovery is at ${recoveryScore}%. Listen to your body during today's ${todaysWorkout?.title}.`;
          } else {
            fallbackSummary += `Recovery is low at ${recoveryScore}%. Consider taking it easier today or focusing on recovery.`;
          }
        } else if (hasWorkout && hasActiveProgramsData) {
          fallbackSummary += `Today's focus is ${todaysWorkout?.title}. Stay consistent and trust the process.`;
        } else if (hasActiveProgramsData) {
          fallbackSummary += 'Rest day today - perfect time for recovery and preparation for tomorrow.';
        } else if (hasCompleteProfile) {
          fallbackSummary += 'Your profile is set up! Consider creating a training program to get personalized daily guidance.';
        } else {
          fallbackSummary += 'Complete your profile and connect your WHOOP for personalized insights.';
        }
        
        setTodaysSummary(fallbackSummary);
      }

      // Sort insights by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      newInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setInsights(newInsights);
    } catch (error) {
      console.error('Error generating daily insights:', error);
      // Comprehensive fallback insights based on available data
      const fallbackInsights: DailyInsight[] = [];
      
      if (hasCompleteProfile || hasActivePrograms || hasWhoopData) {
        fallbackInsights.push({
          type: 'general',
          title: 'Good Morning!',
          message: 'Ready to make today count? Check your workout plan and stay hydrated throughout the day.',
          priority: 'high',
          actionable: true,
          icon: <Sun size={20} color={colors.primary} />
        });
      }
      
      if (hasActivePrograms) {
        fallbackInsights.push({
          type: 'workout',
          title: 'Training Focus',
          message: 'Stay consistent with your training program. Every workout brings you closer to your goals.',
          priority: 'medium',
          actionable: true,
          icon: <Target size={20} color={colors.primary} />
        });
      } else if (hasCompleteProfile) {
        fallbackInsights.push({
          type: 'workout',
          title: 'Start Your Journey',
          message: 'Your profile is complete! Consider creating a training program to get structured, personalized workouts.',
          priority: 'medium',
          actionable: true,
          icon: <Target size={20} color={colors.primary} />
        });
      }
      
      if (hasCompleteProfile || hasActivePrograms || hasWhoopData) {
        fallbackInsights.push({
          type: 'general',
          title: 'Hydration Reminder',
          message: 'Start your day with water and aim for 2-3 liters throughout the day for optimal performance.',
          priority: 'low',
          actionable: true,
          icon: <Activity size={20} color={colors.primary} />
        });
      }
      
      setInsights(fallbackInsights);
      
      // Set appropriate fallback summary
      if (hasWhoopData && hasActivePrograms) {
        setTodaysSummary('Ready to make today count? Stay focused on your goals, listen to your body, and remember that consistency is key to success.');
      } else if (hasActivePrograms) {
        setTodaysSummary('Stay consistent with your training program. Every workout brings you closer to your goals.');
      } else if (hasCompleteProfile) {
        setTodaysSummary('Your profile is set up! Consider creating a training program and connecting your WHOOP for personalized insights.');
      } else {
        setTodaysSummary('Welcome! Complete your profile and connect your WHOOP or create a training program to get personalized daily insights.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailySummary = async (insights: DailyInsight[], todaysWorkout: any, latestRecovery: any) => {
    try {
      const highPriorityInsights = insights.filter(i => i.priority === 'high');
      const hasWorkout = !!todaysWorkout;
      const recoveryScore = latestRecovery?.score || 'unknown';
      
      // Safely access userProfile properties with fallbacks
      const userAge = safeUserProfile.age;
      const userGender = safeUserProfile.gender;
      const userGoal = safeUserProfile.fitnessGoal;
      
      const contextPrompt = `Generate a brief, motivational daily summary (max 60 words) based on:
- Recovery: ${recoveryScore}%
- Workout planned: ${hasWorkout ? todaysWorkout?.title || 'Training session' : 'Rest day'}
- Key concerns: ${highPriorityInsights.map(i => i.title).join(', ') || 'None'}
- User: ${userAge}y ${userGender}, goal: ${userGoal}

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

  // Don't render the popup if there's no meaningful data
  if (!shouldShowPopup) {
    return null;
  }

  return (
    <Modal
      visible={visible && shouldShowPopup}
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

            {/* Quick Stats - only show if we have meaningful data */}
            {!isLoading && (hasWhoopData || hasActivePrograms || hasCompleteProfile) && (
              <View style={styles.quickStatsContainer}>
                <Text style={styles.sectionTitle}>Quick Stats</Text>
                <View style={styles.statsGrid}>
                  {hasWhoopData && safeData.recovery && safeData.recovery.length > 0 && (
                    <View style={styles.statCard}>
                      <Heart size={16} color={colors.primary} />
                      <Text style={styles.statLabel}>Recovery</Text>
                      <Text style={styles.statValue}>{safeData.recovery[0].score}%</Text>
                    </View>
                  )}
                  
                  {hasActivePrograms && (
                    <View style={styles.statCard}>
                      <Target size={16} color={colors.primary} />
                      <Text style={styles.statLabel}>Programs</Text>
                      <Text style={styles.statValue}>{safeActivePrograms.length}</Text>
                    </View>
                  )}
                  
                  {hasCompleteProfile && (
                    <View style={styles.statCard}>
                      <Flame size={16} color={colors.primary} />
                      <Text style={styles.statLabel}>Calories</Text>
                      <Text style={styles.statValue}>
                        {(() => {
                          try {
                            if (!getMacroProgressForDate) return '0%';
                            const todayMacros = getMacroProgressForDate(new Date().toISOString().split('T')[0]);
                            if (todayMacros?.calories?.target && todayMacros?.calories?.consumed !== undefined) {
                              return Math.round((todayMacros.calories.consumed / todayMacros.calories.target) * 100) + '%';
                            }
                            return '0%';
                          } catch (error) {
                            console.error('Error calculating calorie progress:', error);
                            return '0%';
                          }
                        })()}
                      </Text>
                    </View>
                  )}
                  
                  {!hasWhoopData && hasCompleteProfile && (
                    <View style={styles.statCard}>
                      <Activity size={16} color={colors.textSecondary} />
                      <Text style={styles.statLabel}>WHOOP</Text>
                      <Text style={[styles.statValue, { color: colors.textSecondary, fontSize: 12 }]}>Connect</Text>
                    </View>
                  )}
                  
                  {/* Show user profile stats if available */}
                  {hasCompleteProfile && safeUserProfile.weight > 0 && (
                    <View style={styles.statCard}>
                      <Target size={16} color={colors.primary} />
                      <Text style={styles.statLabel}>Weight</Text>
                      <Text style={styles.statValue}>{safeUserProfile.weight}kg</Text>
                    </View>
                  )}
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