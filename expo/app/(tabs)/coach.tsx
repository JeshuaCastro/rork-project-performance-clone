import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWhoopStore } from '@/store/whoopStore';
import { useProgramStore } from '@/store/programStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  Send, 
  Link, 
  Utensils, 
  Trash2, 
  MoreHorizontal, 
  Activity, 
  Heart, 
  Brain,
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  X,
  Moon,
  Zap,
  Shield,
  Target,
  Sparkles
} from 'lucide-react-native';
import ChatMessage from '@/components/ChatMessage';
import { useRouter } from 'expo-router';

interface HealthInsight {
  category: string;
  status: 'good' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  icon: React.ReactNode;
}

export default function CoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    chatMessages, 
    addChatMessage, 
    isLoading, 
    isConnectedToWhoop,
    data,
    syncWhoopData,
    userProfile,
    clearChatMessages
  } = useWhoopStore();
  
  // Program-aware coaching context
  const { goals, getGoalSummary, getMetricLabel } = useProgramStore();
  const activeGoal = goals.find(goal => {
    const summary = getGoalSummary(goal.id);
    return summary && summary.percentComplete < 100;
  });
  const goalSummary = activeGoal ? getGoalSummary(activeGoal.id) : null;
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showHealthEvaluation, setShowHealthEvaluation] = useState(false);
  const [healthEvaluation, setHealthEvaluation] = useState<string>('');
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [actionableSteps, setActionableSteps] = useState<Array<{
    category: 'recovery' | 'nutrition' | 'training' | 'sleep' | 'supplements';
    action: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    completed?: boolean;
  }>>([]);
  const [nutritionAdvice, setNutritionAdvice] = useState<{
    calorieGuidance?: string;
    proteinFocus?: string;
    hydrationTarget?: string;
    mealTiming?: string;
  }>({});
  const [avgRecovery, setAvgRecovery] = useState<number>(0);
  const [avgStrain, setAvgStrain] = useState<number>(0);
  const [smartInsights, setSmartInsights] = useState<{
    workoutPlan?: string;
    nutritionPlan?: string;
    recoveryPlan?: string;
    sleepPlan?: string;
  }>({});

  // Check if we have WHOOP data to provide coaching
  const hasWhoopData = data && data.recovery.length > 0 && data.strain.length > 0;
  // Check if we have user profile data
  const hasProfileData = userProfile && userProfile.name && userProfile.weight > 0 && userProfile.height > 0;

  useEffect(() => {
    // If connected but no data, try to sync
    if (isConnectedToWhoop && !hasWhoopData) {
      syncWhoopData();
    }
  }, [isConnectedToWhoop]);

  // Show typing indicator when loading
  useEffect(() => {
    if (isLoading) {
      setShowTypingIndicator(true);
    } else {
      // Keep the typing indicator visible for a short time after loading completes
      // to make the transition smoother
      const timer = setTimeout(() => {
        setShowTypingIndicator(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSend = () => {
    if (message.trim() === '') return;
    
    if (!isConnectedToWhoop) {
      Alert.alert(
        "WHOOP Connection Recommended",
        "For the best personalized coaching, we recommend connecting your WHOOP account. Would you like to connect now?",
        [
          { text: "Not Now", style: "cancel" },
          { 
            text: "Connect WHOOP", 
            onPress: () => router.push('/connect-whoop')
          }
        ]
      );
    }
    
    if (!hasProfileData) {
      Alert.alert(
        "Complete Your Profile",
        "To get personalized nutrition advice, please complete your profile first.",
        [
          { text: "Later", style: "cancel" },
          { 
            text: "Complete Profile", 
            onPress: () => router.push('/profile')
          }
        ]
      );
    }
    
    // Send message even if no WHOOP data or profile
    addChatMessage({
      role: 'user',
      content: message,
    });
    
    setMessage('');
  };

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all chat messages?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => clearChatMessages()
        }
      ]
    );
  };

  const handleHealthEvaluation = () => {
    router.push('/health-evaluation');
  };

  const closeHealthEvaluation = () => {
    setShowHealthEvaluation(false);
  };

  const generateHealthEvaluation = useCallback(async () => {
    if (!hasWhoopData) return;

    setIsLoadingHealth(true);
    
    try {
      // Get latest data points
      const latestRecovery = data.recovery[data.recovery.length - 1];
      
      // Calculate averages for the last 7 days
      const recentRecovery = data.recovery.slice(-7);
      const recentStrain = data.strain.slice(-7);
      const recentSleep = data.sleep.slice(-7);
      
      const calculatedAvgRecovery = recentRecovery.reduce((sum, r) => sum + r.score, 0) / recentRecovery.length;
      const calculatedAvgStrain = recentStrain.reduce((sum, s) => sum + s.score, 0) / recentStrain.length;
      
      setAvgRecovery(calculatedAvgRecovery);
      setAvgStrain(calculatedAvgStrain);
      const avgSleepScore = recentSleep.reduce((sum, s) => sum + s.qualityScore, 0) / recentSleep.length;
      const avgSleepHours = recentSleep.reduce((sum, s) => sum + s.duration, 0) / recentSleep.length / 60; // Convert to hours
      
      // Generate insights based on data
      const generatedInsights: HealthInsight[] = [];
      
      // Recovery Analysis
      if (calculatedAvgRecovery >= 67) {
        generatedInsights.push({
          category: 'Recovery',
          status: 'good',
          title: 'Excellent Recovery',
          description: `Your average recovery score of ${calculatedAvgRecovery.toFixed(0)}% indicates your body is adapting well to training stress.`,
          recommendations: [
            'Maintain your current recovery routine',
            'Consider gradually increasing training intensity',
            'Continue prioritizing sleep and nutrition'
          ],
          icon: <Shield size={28} color={colors.success} />
        });
      } else if (calculatedAvgRecovery >= 34) {
        generatedInsights.push({
          category: 'Recovery',
          status: 'warning',
          title: 'Moderate Recovery',
          description: `Your average recovery score of ${calculatedAvgRecovery.toFixed(0)}% suggests room for improvement in your recovery practices.`,
          recommendations: [
            'Focus on getting 7-9 hours of quality sleep',
            'Consider reducing training intensity temporarily',
            'Incorporate more active recovery sessions',
            'Evaluate stress management techniques'
          ],
          icon: <Target size={28} color={colors.warning} />
        });
      } else {
        generatedInsights.push({
          category: 'Recovery',
          status: 'critical',
          title: 'Low Recovery',
          description: `Your average recovery score of ${calculatedAvgRecovery.toFixed(0)}% indicates significant recovery debt that needs attention.`,
          recommendations: [
            'Prioritize sleep - aim for 8-9 hours nightly',
            'Reduce training intensity and volume',
            'Consider taking 1-2 complete rest days',
            'Focus on stress reduction and relaxation',
            'Evaluate nutrition and hydration habits'
          ],
          icon: <AlertTriangle size={28} color={colors.danger} />
        });
      }
      
      // Sleep Analysis
      if (avgSleepScore >= 85 && avgSleepHours >= 7) {
        generatedInsights.push({
          category: 'Sleep',
          status: 'good',
          title: 'Quality Sleep',
          description: `Excellent sleep quality with ${avgSleepHours.toFixed(1)} hours average and ${avgSleepScore.toFixed(0)}% sleep score.`,
          recommendations: [
            'Maintain your current sleep schedule',
            'Continue your bedtime routine',
            'Keep your sleep environment optimized'
          ],
          icon: <Moon size={28} color={colors.success} />
        });
      } else if (avgSleepHours < 7 || avgSleepScore < 70) {
        generatedInsights.push({
          category: 'Sleep',
          status: 'warning',
          title: 'Sleep Optimization Needed',
          description: `Average sleep: ${avgSleepHours.toFixed(1)} hours with ${avgSleepScore.toFixed(0)}% quality score. This may be impacting your recovery.`,
          recommendations: [
            'Aim for 7-9 hours of sleep nightly',
            'Establish a consistent bedtime routine',
            'Limit screen time 1 hour before bed',
            'Keep bedroom cool (65-68°F) and dark',
            'Avoid caffeine after 2 PM'
          ],
          icon: <Moon size={28} color={colors.warning} />
        });
      }
      
      // Strain Analysis
      if (calculatedAvgStrain > 18) {
        generatedInsights.push({
          category: 'Training',
          status: 'warning',
          title: 'High Training Load',
          description: `Your average strain of ${calculatedAvgStrain.toFixed(1)} indicates very high training stress. Monitor recovery closely.`,
          recommendations: [
            'Ensure adequate recovery between sessions',
            'Consider periodizing your training',
            'Include more low-intensity activities',
            'Monitor recovery scores daily'
          ],
          icon: <Zap size={28} color={colors.warning} />
        });
      } else if (calculatedAvgStrain < 8) {
        generatedInsights.push({
          category: 'Training',
          status: 'warning',
          title: 'Low Activity Level',
          description: `Your average strain of ${calculatedAvgStrain.toFixed(1)} suggests you might benefit from increased activity.`,
          recommendations: [
            'Gradually increase daily activity',
            'Add 2-3 structured workouts per week',
            'Include both cardio and strength training',
            'Start with low-intensity activities'
          ],
          icon: <TrendingUp size={28} color={colors.primary} />
        });
      } else {
        generatedInsights.push({
          category: 'Training',
          status: 'good',
          title: 'Balanced Training Load',
          description: `Your average strain of ${calculatedAvgStrain.toFixed(1)} indicates a well-balanced training approach.`,
          recommendations: [
            'Continue your current training approach',
            'Vary intensity throughout the week',
            'Listen to your body and adjust as needed'
          ],
          icon: <Sparkles size={28} color={colors.success} />
        });
      }
      
      // Heart Rate Variability Analysis
      if (latestRecovery.hrvMs) {
        const recentHRV = recentRecovery.map(r => r.hrvMs).filter(Boolean);
        if (recentHRV.length > 0) {
          const avgHRV = recentHRV.reduce((sum, hrv) => sum + hrv, 0) / recentHRV.length;
          const hrvTrend = recentHRV.length > 3 ? 
            (recentHRV.slice(-3).reduce((sum, hrv) => sum + hrv, 0) / 3) - 
            (recentHRV.slice(0, 3).reduce((sum, hrv) => sum + hrv, 0) / 3) : 0;
          
          if (hrvTrend > 2) {
            generatedInsights.push({
              category: 'Heart Rate Variability',
              status: 'good',
              title: 'Improving HRV Trend',
              description: `Your HRV is trending upward (avg: ${avgHRV.toFixed(1)}ms), indicating improving autonomic nervous system balance.`,
              recommendations: [
                'Continue current recovery practices',
                'Maintain consistent sleep schedule',
                'Keep stress management techniques'
              ],
              icon: <Heart size={28} color={colors.success} />
            });
          } else if (hrvTrend < -2) {
            generatedInsights.push({
              category: 'Heart Rate Variability',
              status: 'warning',
              title: 'Declining HRV Trend',
              description: `Your HRV is trending downward (avg: ${avgHRV.toFixed(1)}ms), which may indicate accumulated stress or fatigue.`,
              recommendations: [
                'Prioritize stress management',
                'Consider reducing training intensity',
                'Focus on relaxation techniques',
                'Ensure adequate sleep quality'
              ],
              icon: <Brain size={28} color={colors.warning} />
            });
          }
        }
      }
      
      setHealthInsights(generatedInsights);
      
      // Generate actionable steps based on insights
      const steps: Array<{
        category: 'recovery' | 'nutrition' | 'training' | 'sleep' | 'supplements';
        action: string;
        reason: string;
        priority: 'high' | 'medium' | 'low';
      }> = [];
      
      // Recovery-based actions
      if (calculatedAvgRecovery < 50) {
        steps.push({
          category: 'sleep',
          action: 'Get 8+ hours of sleep tonight',
          reason: 'Low recovery needs immediate sleep prioritization',
          priority: 'high'
        });
        steps.push({
          category: 'training',
          action: 'Reduce workout intensity by 30%',
          reason: 'Allow body to recover from accumulated stress',
          priority: 'high'
        });
        steps.push({
          category: 'nutrition',
          action: 'Increase protein to 2.0g per kg body weight',
          reason: 'Support muscle recovery and repair',
          priority: 'medium'
        });
      } else if (calculatedAvgRecovery >= 75) {
        steps.push({
          category: 'training',
          action: 'Take advantage with high-intensity session',
          reason: 'Excellent recovery allows for performance gains',
          priority: 'high'
        });
        steps.push({
          category: 'nutrition',
          action: 'Fuel properly 2-3 hours before training',
          reason: 'Optimize energy for high-intensity work',
          priority: 'medium'
        });
      }
      
      // Sleep-based actions
      if (avgSleepHours < 7 || avgSleepScore < 70) {
        steps.push({
          category: 'sleep',
          action: 'Set consistent bedtime 30 minutes earlier',
          reason: 'Improve sleep duration and quality',
          priority: 'high'
        });
        steps.push({
          category: 'supplements',
          action: 'Consider magnesium 1-2 hours before bed',
          reason: 'Support sleep quality and muscle relaxation',
          priority: 'low'
        });
      }
      
      // Strain-based actions
      if (calculatedAvgStrain > 18) {
        steps.push({
          category: 'recovery',
          action: 'Add 10-minute meditation or breathing',
          reason: 'High strain requires active stress management',
          priority: 'medium'
        });
        steps.push({
          category: 'nutrition',
          action: 'Increase water intake to 3-4L today',
          reason: 'Support recovery from high training load',
          priority: 'medium'
        });
      } else if (calculatedAvgStrain < 8) {
        steps.push({
          category: 'training',
          action: 'Add 20-minute walk or light activity',
          reason: 'Increase daily movement for better health',
          priority: 'medium'
        });
      }
      
      // HRV-based actions
      if (latestRecovery.hrvMs && latestRecovery.hrvMs < 30) {
        steps.push({
          category: 'recovery',
          action: 'Practice 5-minute deep breathing',
          reason: 'Low HRV indicates need for stress reduction',
          priority: 'high'
        });
        steps.push({
          category: 'supplements',
          action: 'Consider omega-3 supplement',
          reason: 'Support heart rate variability and recovery',
          priority: 'low'
        });
      }
      
      setActionableSteps(steps);
      
      // Generate nutrition advice
      const nutrition = {
        calorieGuidance: calculatedAvgRecovery < 50 ? 'Maintain calorie intake - don\'t restrict during recovery' : 
                        calculatedAvgRecovery >= 75 ? 'Increase calories by 200-300 for high-intensity training' :
                        'Stay consistent with current calorie targets',
        proteinFocus: calculatedAvgRecovery < 50 ? '2.0-2.2g per kg body weight for repair' :
                     calculatedAvgStrain > 15 ? '1.8-2.0g per kg body weight for recovery' :
                     '1.6-1.8g per kg body weight for maintenance',
        hydrationTarget: calculatedAvgStrain > 15 ? '3.5-4L water today' :
                        calculatedAvgRecovery < 50 ? '3-3.5L water for recovery' :
                        '2.5-3L water daily',
        mealTiming: calculatedAvgRecovery >= 75 ? 'Eat 2-3 hours before high-intensity training' :
                   calculatedAvgRecovery < 50 ? 'Frequent small meals to support recovery' :
                   'Regular meal timing supports consistent energy'
      };
      
      setNutritionAdvice(nutrition);
      
      // Generate overall evaluation summary
      const overallStatus = generatedInsights.some(i => i.status === 'critical') ? 'critical' :
                           generatedInsights.some(i => i.status === 'warning') ? 'warning' : 'good';
      
      let evaluationText = '';
      if (overallStatus === 'good') {
        evaluationText = `Excellent health status! Your body is ready for performance. Focus on the ${steps.length} action items below to maintain this momentum.`;
      } else if (overallStatus === 'warning') {
        evaluationText = `Good progress with room for improvement. Complete the ${steps.filter(s => s.priority === 'high').length} high-priority actions below to optimize your recovery.`;
      } else {
        evaluationText = `Your body needs immediate attention. Focus on the ${steps.filter(s => s.priority === 'high').length} critical actions below before your next training session.`;
      }
      
      setHealthEvaluation(evaluationText);
      
    } catch (error) {
      console.error('Error generating health evaluation:', error);
      Alert.alert('Error', 'Failed to generate health evaluation. Please try again.');
    } finally {
      setIsLoadingHealth(false);
    }
  }, [hasWhoopData, data]);

  // Program-aware smart coach insight generator with progress analysis
  const getSmartCoachInsight = (insights: HealthInsight[], steps: any[], recovery: number, strain: number): string => {
    if (insights.length === 0) {
      if (activeGoal) {
        const paceStatus = goalSummary?.paceVsPlan || 'on_track';
        const weeksLeft = goalSummary ? goalSummary.totalWeeks - goalSummary.weeksElapsed : 0;
        return `You're working toward ${activeGoal.title} and currently ${paceStatus} with ${weeksLeft} weeks remaining. Complete your health analysis to get personalized insights for your program.`;
      }
      return 'Complete your health analysis to get personalized insights.';
    }
    
    const criticalInsights = insights.filter(i => i.status === 'critical');
    const warningInsights = insights.filter(i => i.status === 'warning');
    const goodInsights = insights.filter(i => i.status === 'good');
    
    let baseInsight = '';
    if (criticalInsights.length > 0) {
      baseInsight = `Your body is showing signs of stress. Focus on ${criticalInsights[0].category.toLowerCase()} - specifically ${criticalInsights[0].recommendations[0].toLowerCase()}.`;
    } else if (warningInsights.length > 0) {
      baseInsight = `You're making good progress! Your ${warningInsights[0].category.toLowerCase()} needs attention. Try ${warningInsights[0].recommendations[0].toLowerCase()} to optimize your performance.`;
    } else {
      baseInsight = `Excellent work! Your health metrics are strong. With recovery at ${recovery.toFixed(0)}% and balanced strain, you're ready to push your limits.`;
    }
    
    // Enhanced program context with progress analysis
    if (activeGoal && goalSummary) {
      const paceStatus = goalSummary.paceVsPlan;
      const weeksLeft = goalSummary.totalWeeks - goalSummary.weeksElapsed;
      const progressPercent = goalSummary.percentComplete;
      const weeksElapsed = goalSummary.weeksElapsed;
      const expectedProgress = (weeksElapsed / goalSummary.totalWeeks) * 100;
      const progressDelta = progressPercent - expectedProgress;
      
      let programContext = '';
      let programAdjustment = '';
      
      // Analyze progress vs expectations
      if (paceStatus === 'behind') {
        const weeksToRecover = Math.ceil(Math.abs(progressDelta) / (100 / goalSummary.totalWeeks));
        programContext = ` Your ${activeGoal.title} goal is ${Math.abs(progressDelta).toFixed(0)}% behind schedule (${progressPercent}% complete vs ${expectedProgress.toFixed(0)}% expected).`;
        
        if (criticalInsights.length > 0) {
          programAdjustment = ` Recovery issues are likely impacting your progress. Address these first before intensifying training.`;
        } else if (recovery >= 70) {
          programAdjustment = ` With good recovery, consider increasing training frequency by 1-2 sessions per week to catch up.`;
        } else {
          programAdjustment = ` Focus on consistency rather than intensity - you need ${weeksToRecover} weeks of steady progress to get back on track.`;
        }
      } else if (paceStatus === 'ahead') {
        programContext = ` Excellent! You're ${progressDelta.toFixed(0)}% ahead of schedule on your ${activeGoal.title} goal (${progressPercent}% complete vs ${expectedProgress.toFixed(0)}% expected).`;
        
        if (recovery >= 75) {
          programAdjustment = ` Your body is handling the program well. Consider progressing to the next phase or increasing targets by 10-15%.`;
        } else if (recovery < 60) {
          programAdjustment = ` Great progress, but your recovery suggests scaling back slightly to maintain this pace sustainably.`;
        } else {
          programAdjustment = ` Maintain your current approach - you're in the optimal zone for continued progress.`;
        }
      } else {
        programContext = ` You're perfectly on track with your ${activeGoal.title} goal (${progressPercent}% complete, ${weeksLeft} weeks remaining).`;
        
        if (recovery >= 75 && strain < 12) {
          programAdjustment = ` Your body can handle more - consider adding 1 extra training session or increasing intensity by 10%.`;
        } else if (recovery < 55) {
          programAdjustment = ` Your progress is good but recovery is declining. Maintain current volume but focus on sleep and nutrition.`;
        } else {
          programAdjustment = ` Perfect balance - continue your current program structure.`;
        }
      }
      
      return baseInsight + programContext + programAdjustment;
    }
    
    return baseInsight;
  };

  // Enhanced program-aware workout recommendations with progress analysis
  const generateWorkoutRecommendation = () => {
    let baseRecommendation = '';
    
    if (avgRecovery >= 75) {
      baseRecommendation = 'High-intensity training recommended. Your body is ready for performance gains.';
    } else if (avgRecovery >= 50) {
      baseRecommendation = 'Moderate intensity training. Focus on technique and form.';
    } else {
      baseRecommendation = 'Active recovery recommended. Light walking, gentle stretching, or restorative yoga.';
    }
    
    // Enhanced program-specific guidance with progress analysis
    let programGuidance = '';
    if (activeGoal && goalSummary) {
      const weeksRemaining = goalSummary.totalWeeks - goalSummary.weeksElapsed;
      const paceStatus = goalSummary.paceVsPlan;
      const progressPercent = goalSummary.percentComplete;
      const expectedProgress = (goalSummary.weeksElapsed / goalSummary.totalWeeks) * 100;
      const progressDelta = progressPercent - expectedProgress;
      
      // Calculate program modifications based on progress
      let intensityModifier = 1.0;
      let volumeModifier = 1.0;
      
      if (paceStatus === 'behind' && avgRecovery >= 70) {
        intensityModifier = 1.1; // 10% increase
        volumeModifier = 1.15; // 15% increase
      } else if (paceStatus === 'ahead' && avgRecovery < 60) {
        intensityModifier = 0.9; // 10% decrease
        volumeModifier = 0.95; // 5% decrease
      }
      
      switch (activeGoal.type) {
        case 'muscle_gain':
          if (avgRecovery >= 75) {
            if (paceStatus === 'behind') {
              programGuidance = ` PROGRAM ADJUSTMENT: Increase training volume by ${Math.round((volumeModifier - 1) * 100)}% with compound movements. Add an extra set to major lifts to catch up (${Math.abs(progressDelta).toFixed(0)}% behind, ${weeksRemaining} weeks left).`;
            } else if (paceStatus === 'ahead') {
              programGuidance = ` PROGRAM SUCCESS: You're ${progressDelta.toFixed(0)}% ahead! Consider progressive overload or adding advanced techniques like drop sets.`;
            } else {
              programGuidance = ` Perfect for muscle-building compound lifts. Maintain current program structure - you're on track.`;
            }
          } else if (avgRecovery >= 50) {
            programGuidance = paceStatus === 'behind' 
              ? ` Focus on form and consistency rather than intensity. Your muscle gain progress needs steady training even when behind schedule.`
              : ` Light resistance training with focus on form. Maintain program consistency for muscle gain.`;
          } else {
            programGuidance = ` RECOVERY PRIORITY: Skip heavy lifting today. Your muscle gain progress depends on recovery - this rest will help you catch up later.`;
          }
          break;
          
        case 'fat_loss':
          if (avgRecovery >= 75) {
            if (paceStatus === 'behind') {
              programGuidance = ` PROGRAM ADJUSTMENT: Add ${Math.round((volumeModifier - 1) * 100)}% more cardio volume. Consider HIIT 4x/week instead of 3x to accelerate fat loss (${Math.abs(progressDelta).toFixed(0)}% behind target).`;
            } else if (paceStatus === 'ahead') {
              programGuidance = ` EXCELLENT PROGRESS: ${progressDelta.toFixed(0)}% ahead of schedule! Maintain current approach or add strength training to preserve muscle.`;
            } else {
              programGuidance = ` Great day for HIIT or circuit training. Your fat loss program is on track.`;
            }
          } else if (avgRecovery >= 50) {
            programGuidance = paceStatus === 'behind'
              ? ` Steady-state cardio focus. Consistency over intensity will help you catch up on your fat loss goal.`
              : ` Steady-state cardio or light strength training. Consistency is key for fat loss.`;
          } else {
            programGuidance = ` Low-intensity movement only. Fat loss happens in recovery too - don't compromise long-term progress for short-term gains.`;
          }
          break;
          
        case 'strength':
          if (avgRecovery >= 75) {
            if (paceStatus === 'behind') {
              programGuidance = ` PROGRAM ADJUSTMENT: Increase training intensity by ${Math.round((intensityModifier - 1) * 100)}%. Focus on heavy compound lifts at 85-95% 1RM to catch up (${Math.abs(progressDelta).toFixed(0)}% behind, ${weeksRemaining} weeks left).`;
            } else if (paceStatus === 'ahead') {
              programGuidance = ` STRENGTH GAINS AHEAD OF SCHEDULE: ${progressDelta.toFixed(0)}% ahead! Perfect day for testing new PRs or attempting heavier singles.`;
            } else {
              programGuidance = ` Ideal for heavy compound lifts. Your strength program is progressing perfectly.`;
            }
          } else if (avgRecovery >= 50) {
            programGuidance = paceStatus === 'behind'
              ? ` Technique work at 75-85% max. Focus on movement quality to build strength foundation even when behind schedule.`
              : ` Technique work at 70-80% max. Quality training builds strength consistently.`;
          } else {
            programGuidance = ` RECOVERY PRIORITY: Skip heavy lifting. Strength gains require full recovery - this rest will enable bigger gains later.`;
          }
          break;
          
        case 'endurance':
          if (avgRecovery >= 75) {
            if (paceStatus === 'behind') {
              programGuidance = ` PROGRAM ADJUSTMENT: Add ${Math.round((volumeModifier - 1) * 100)}% more training volume. Focus on tempo runs and intervals to catch up on endurance goals (${Math.abs(progressDelta).toFixed(0)}% behind).`;
            } else if (paceStatus === 'ahead') {
              programGuidance = ` ENDURANCE AHEAD OF SCHEDULE: ${progressDelta.toFixed(0)}% ahead! Perfect for challenging interval sessions or race pace work.`;
            } else {
              programGuidance = ` Perfect for interval training or tempo runs. Your endurance program is on track.`;
            }
          } else if (avgRecovery >= 50) {
            programGuidance = paceStatus === 'behind'
              ? ` Easy aerobic pace with slightly longer duration. Build your base consistently to catch up on endurance goals.`
              : ` Easy aerobic pace training. Build your aerobic base consistently.`;
          } else {
            programGuidance = ` Easy walk or complete rest. Endurance improvements happen during recovery - this rest will help your next quality session.`;
          }
          break;
          
        default:
          programGuidance = ` Consider how today's training aligns with your ${activeGoal.title} goal (${progressPercent}% complete, ${paceStatus}).`;
      }
    }
    
    setSmartInsights(prev => ({
      ...prev,
      workoutPlan: baseRecommendation + programGuidance
    }));
  };

  const generateNutritionPlan = () => {
    let basePlan = '';
    
    if (avgRecovery < 50) {
      basePlan = 'Focus on anti-inflammatory foods: salmon, berries, leafy greens. Increase protein to 2.0g/kg body weight for recovery.';
    } else if (avgRecovery >= 75) {
      basePlan = 'Fuel for performance: complex carbs 2-3 hours before training, protein within 30 minutes after. Stay hydrated.';
    } else {
      basePlan = 'Balanced nutrition: lean proteins, complex carbs, healthy fats. Time meals around your training schedule.';
    }
    
    // Enhanced program-specific nutrition guidance with progress analysis
    let programNutrition = '';
    if (activeGoal && goalSummary) {
      const paceStatus = goalSummary.paceVsPlan;
      const progressPercent = goalSummary.percentComplete;
      const expectedProgress = (goalSummary.weeksElapsed / goalSummary.totalWeeks) * 100;
      const progressDelta = progressPercent - expectedProgress;
      const weeksRemaining = goalSummary.totalWeeks - goalSummary.weeksElapsed;
      
      switch (activeGoal.type) {
        case 'muscle_gain':
          if (paceStatus === 'behind') {
            programNutrition = ` NUTRITION ADJUSTMENT: Increase calories by ${Math.round(200 + (Math.abs(progressDelta) * 10))} and protein to 2.2-2.4g/kg to accelerate muscle gain. You're ${Math.abs(progressDelta).toFixed(0)}% behind with ${weeksRemaining} weeks left.`;
          } else if (paceStatus === 'ahead') {
            programNutrition = ` EXCELLENT PROGRESS: ${progressDelta.toFixed(0)}% ahead! Maintain current surplus or slightly reduce calories to optimize body composition while continuing gains.`;
          } else {
            programNutrition = ' Maintain slight caloric surplus with 1.8-2.0g/kg protein for steady muscle growth.';
          }
          break;
          
        case 'fat_loss':
          if (paceStatus === 'behind') {
            programNutrition = ` NUTRITION ADJUSTMENT: Increase deficit by ${Math.round(100 + (Math.abs(progressDelta) * 20))} calories while maintaining protein at 2.2g/kg. Consider intermittent fasting to accelerate progress (${Math.abs(progressDelta).toFixed(0)}% behind target).`;
          } else if (paceStatus === 'ahead') {
            programNutrition = ` GREAT PROGRESS: ${progressDelta.toFixed(0)}% ahead of schedule! Consider a diet break or reduce deficit slightly to preserve muscle and metabolic health.`;
          } else {
            programNutrition = ' Stay consistent with your current caloric deficit and high protein intake.';
          }
          break;
          
        case 'strength':
          if (paceStatus === 'behind') {
            programNutrition = ` NUTRITION FOCUS: Increase pre-workout carbs by 20-30g and post-workout protein to 40-50g. Strength gains need optimal fueling (${Math.abs(progressDelta).toFixed(0)}% behind target).`;
          } else if (paceStatus === 'ahead') {
            programNutrition = ` STRENGTH GAINS ON TRACK: ${progressDelta.toFixed(0)}% ahead! Maintain current nutrition or add creatine supplementation for continued gains.`;
          } else {
            programNutrition = ' Fuel strength gains with adequate carbs pre-workout and protein post-workout. Don\'t restrict calories.';
          }
          break;
          
        case 'endurance':
          if (paceStatus === 'behind') {
            programNutrition = ` ENDURANCE NUTRITION: Increase training day carbs by ${Math.round(50 + (Math.abs(progressDelta) * 5))}g and focus on glycogen replenishment. Consider sports drinks during longer sessions (${Math.abs(progressDelta).toFixed(0)}% behind).`;
          } else if (paceStatus === 'ahead') {
            programNutrition = ` ENDURANCE AHEAD: ${progressDelta.toFixed(0)}% ahead of schedule! Maintain current carb periodization or experiment with fat adaptation techniques.`;
          } else {
            programNutrition = ' Focus on carb periodization - higher carbs on training days, moderate on rest days.';
          }
          break;
          
        default:
          programNutrition = ` Align nutrition with your ${activeGoal.title} goal progress (${progressPercent}% complete, ${paceStatus}).`;
      }
    }
    
    setSmartInsights(prev => ({ ...prev, nutritionPlan: basePlan + programNutrition }));
  };

  const generateRecoveryPlan = () => {
    const plan = avgStrain > 15 ? 
      'Active recovery focus: 10-minute meditation, gentle stretching, cold shower. Prioritize sleep quality tonight.' :
      avgRecovery < 50 ?
      'Deep recovery needed: 8+ hours sleep, magnesium supplement, avoid screens 1 hour before bed. Consider massage.' :
      'Maintain recovery: consistent sleep schedule, light stretching, stay hydrated. You\'re doing great!';
    
    setSmartInsights(prev => ({ ...prev, recoveryPlan: plan }));
  };

  const generateSleepPlan = () => {
    const plan = avgRecovery < 50 ?
      'Sleep optimization critical: Go to bed 30 minutes earlier, keep room at 65-68°F, blackout curtains, no caffeine after 2 PM.' :
      'Sleep maintenance: Stick to your current schedule, consider blue light blocking glasses, keep bedroom cool and dark.';
    
    setSmartInsights(prev => ({ ...prev, sleepPlan: plan }));
  };

  const renderEmptyChat = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Ask Your AI Coach</Text>
      <Text style={styles.emptyText}>
        Get personalized advice based on your data. Ask about:
      </Text>
      
      {!isConnectedToWhoop ? (
        <View style={styles.connectContainer}>
          <Text style={styles.connectText}>
            Connect your WHOOP account to get personalized coaching
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => router.push('/connect-whoop')}
          >
            <Link size={18} color={colors.text} />
            <Text style={styles.connectButtonText}>Connect WHOOP</Text>
          </TouchableOpacity>
        </View>
      ) : !hasWhoopData ? (
        <View style={styles.connectContainer}>
          <Text style={styles.connectText}>
            We need to sync your WHOOP data before providing coaching
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => syncWhoopData()}
          >
            <Link size={18} color={colors.text} />
            <Text style={styles.connectButtonText}>Sync WHOOP Data</Text>
          </TouchableOpacity>
        </View>
      ) : !hasProfileData ? (
        <View style={styles.connectContainer}>
          <Text style={styles.connectText}>
            Complete your profile to get personalized nutrition advice
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => router.push('/profile')}
          >
            <Link size={18} color={colors.text} />
            <Text style={styles.connectButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.suggestionsScrollView}
          contentContainerStyle={styles.suggestionsScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.suggestionContainer}>
            <View style={styles.suggestionCategory}>
              <Text style={styles.categoryTitle}>Training</Text>
              {[
                activeGoal ? `How should I train today for my ${activeGoal.title} goal?` : "How should I train today based on my recovery?",
                "Should I take a rest day?",
                activeGoal ? `What workout will help me reach my ${activeGoal.title} target?` : "What's the best workout for my current state?",
                activeGoal && goalSummary?.paceVsPlan === 'behind' ? "How can I catch up on my program goals?" : "How can I improve my performance?",
                "What's a good workout for low recovery days?"
              ].map((suggestion, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => {
                    addChatMessage({
                      role: 'user',
                      content: suggestion,
                    });
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.suggestionCategory}>
              <Text style={styles.categoryTitle}>Nutrition</Text>
              {[
                activeGoal ? `What should I eat to support my ${activeGoal.title} goal?` : "What should I eat after my workout?",
                activeGoal?.type === 'muscle_gain' ? "Suggest a muscle-building breakfast" : "Suggest a high-protein breakfast",
                "How can I hit my protein target today?",
                "What should I eat before a morning workout?",
                activeGoal ? `How should I adjust my diet for my ${activeGoal.title} program?` : "How should I adjust my diet on rest days?",
                "What foods help with recovery?"
              ].map((suggestion, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.suggestionButton, styles.nutritionSuggestion]}
                  onPress={() => {
                    addChatMessage({
                      role: 'user',
                      content: suggestion,
                    });
                  }}
                >
                  <Utensils size={16} color={colors.text} style={styles.suggestionIcon} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.suggestionCategory}>
              <Text style={styles.categoryTitle}>Recovery</Text>
              {[
                "What's causing my low recovery scores?",
                activeGoal ? `How can I optimize recovery for my ${activeGoal.title} program?` : "How can I improve my recovery?",
                "How can I reduce my resting heart rate?",
                "What's the best way to recover after a hard workout?",
                activeGoal ? `How does sleep impact my ${activeGoal.title} progress?` : "How does sleep affect my recovery?",
                "What recovery techniques should I try?"
              ].map((suggestion, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => {
                    addChatMessage({
                      role: 'user',
                      content: suggestion,
                    });
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!showTypingIndicator) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, styles.typingDotMiddle]} />
          <View style={styles.typingDot} />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="light" />
      
      <View style={styles.headerContainer}>
        {/* Health Evaluation Button */}
        <TouchableOpacity 
          style={styles.healthEvaluationButton}
          onPress={handleHealthEvaluation}
        >
          <Activity size={18} color={colors.text} />
          <Text style={styles.healthEvaluationButtonText}>Health Evaluation</Text>
        </TouchableOpacity>
        
        {chatMessages.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearChat}
          >
            <Trash2 size={18} color={colors.textSecondary} />
            <Text style={styles.clearButtonText}>Clear Chat</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {chatMessages.length === 0 ? (
        renderEmptyChat()
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={({ item }) => <ChatMessage message={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.chatList,
            Platform.OS === 'ios' && { paddingBottom: 80 } // Extra padding for iOS
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderTypingIndicator}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask your AI coach..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          editable={!isLoading}
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            (isLoading || message.trim() === '') && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={isLoading || message.trim() === ''}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Send size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Health Evaluation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHealthEvaluation}
        onRequestClose={closeHealthEvaluation}
        statusBarTranslucent={true}
      >
        <View style={[healthStyles.modalOverlay, { paddingTop: insets.top }]}>
          <StatusBar style="light" />
          <View style={[healthStyles.modalContainer, { paddingBottom: insets.bottom }]}>
            <View style={healthStyles.modalContent}>
              {/* Close Button */}
              <TouchableOpacity style={healthStyles.closeButton} onPress={closeHealthEvaluation}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <ScrollView 
                style={healthStyles.modalScrollView}
                contentContainerStyle={healthStyles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {!isConnectedToWhoop ? (
                  <View style={healthStyles.emptyStateContainer}>
                    <View style={healthStyles.emptyStateIcon}>
                      <Activity size={48} color={colors.primary} />
                    </View>
                    <Text style={healthStyles.emptyStateTitle}>WHOOP Connection Required</Text>
                    <Text style={healthStyles.emptyStateDescription}>
                      To get a comprehensive health evaluation, please connect your WHOOP account first.
                    </Text>
                    <TouchableOpacity 
                      style={healthStyles.emptyStateButton} 
                      onPress={() => {
                        closeHealthEvaluation();
                        router.push('/connect-whoop');
                      }}
                    >
                      <Text style={healthStyles.emptyStateButtonText}>Connect WHOOP</Text>
                    </TouchableOpacity>
                  </View>
                ) : !hasWhoopData ? (
                  <View style={healthStyles.emptyStateContainer}>
                    <View style={healthStyles.emptyStateIcon}>
                      <RefreshCw size={48} color={colors.primary} />
                    </View>
                    <Text style={healthStyles.emptyStateTitle}>Insufficient Data</Text>
                    <Text style={healthStyles.emptyStateDescription}>
                      We need more WHOOP data to provide a comprehensive health evaluation. Please sync your data first.
                    </Text>
                    <TouchableOpacity 
                      style={healthStyles.emptyStateButton} 
                      onPress={() => {
                        syncWhoopData();
                        closeHealthEvaluation();
                      }}
                    >
                      <Text style={healthStyles.emptyStateButtonText}>Sync Data</Text>
                    </TouchableOpacity>
                  </View>
                ) : isLoadingHealth ? (
                  <View style={healthStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={healthStyles.loadingText}>Analyzing your health data...</Text>
                  </View>
                ) : (
                  <>
                    {/* Header */}
                    <View style={healthStyles.modalHeader}>
                      <View style={healthStyles.headerIconContainer}>
                        <Activity size={32} color={colors.primary} />
                      </View>
                      <Text style={healthStyles.modalTitle}>Health Analysis</Text>
                      <Text style={healthStyles.modalSubtitle}>Comprehensive wellness overview</Text>
                    </View>

                    {/* Overall Status */}
                    <View style={healthStyles.overallStatusContainer}>
                      <View style={[
                        healthStyles.overallStatusBadge,
                        { backgroundColor: getStatusBackground(healthInsights.some(i => i.status === 'critical') ? 'critical' : healthInsights.some(i => i.status === 'warning') ? 'warning' : 'good') }
                      ]}>
                        <Text style={[
                          healthStyles.overallStatusText,
                          { color: getStatusColor(healthInsights.some(i => i.status === 'critical') ? 'critical' : healthInsights.some(i => i.status === 'warning') ? 'warning' : 'good') }
                        ]}>
                          {healthInsights.some(i => i.status === 'critical') ? 'Needs Attention' : healthInsights.some(i => i.status === 'warning') ? 'Good Progress' : 'Excellent Health'}
                        </Text>
                      </View>
                      <Text style={healthStyles.evaluationSummary}>{healthEvaluation}</Text>
                    </View>

                    {/* Today's Action Plan */}
                    {actionableSteps.length > 0 && (
                      <View style={healthStyles.actionPlanContainer}>
                        <View style={healthStyles.actionPlanHeader}>
                          <Target size={20} color={colors.primary} />
                          <Text style={healthStyles.actionPlanTitle}>Today's Action Plan</Text>
                          <Text style={healthStyles.actionPlanSubtitle}>
                            {actionableSteps.filter(s => s.priority === 'high').length} high priority
                          </Text>
                        </View>
                        
                        {actionableSteps.map((step, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={[
                              healthStyles.actionItem,
                              step.completed && healthStyles.actionItemCompleted
                            ]}
                            onPress={() => {
                              const updatedSteps = [...actionableSteps];
                              updatedSteps[index].completed = !updatedSteps[index].completed;
                              setActionableSteps(updatedSteps);
                            }}
                          >
                            <View style={[
                              healthStyles.priorityDot,
                              { backgroundColor: step.priority === 'high' ? colors.danger : 
                                               step.priority === 'medium' ? colors.warning : colors.success }
                            ]} />
                            
                            <View style={healthStyles.actionContent}>
                              <View style={healthStyles.actionHeader}>
                                <Text style={[
                                  healthStyles.actionCategory,
                                  { color: step.priority === 'high' ? colors.danger : 
                                          step.priority === 'medium' ? colors.warning : colors.success }
                                ]}>
                                  {step.category.toUpperCase()}
                                </Text>
                                <View style={[
                                  healthStyles.checkBox,
                                  step.completed && healthStyles.checkBoxCompleted
                                ]}>
                                  {step.completed && (
                                    <Text style={healthStyles.checkMark}>✓</Text>
                                  )}
                                </View>
                              </View>
                              
                              <Text style={[
                                healthStyles.actionText,
                                step.completed && healthStyles.actionTextCompleted
                              ]}>
                                {step.action}
                              </Text>
                              
                              <Text style={healthStyles.actionReason}>
                                {step.reason}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    {/* Nutrition Focus */}
                    {Object.keys(nutritionAdvice).length > 0 && (
                      <View style={healthStyles.nutritionContainer}>
                        <View style={healthStyles.nutritionHeader}>
                          <Utensils size={20} color={colors.success} />
                          <Text style={healthStyles.nutritionTitle}>Nutrition Focus</Text>
                        </View>
                        
                        <View style={healthStyles.nutritionGrid}>
                          {nutritionAdvice.calorieGuidance && (
                            <View style={healthStyles.nutritionItem}>
                              <Text style={healthStyles.nutritionLabel}>Calories</Text>
                              <Text style={healthStyles.nutritionText}>{nutritionAdvice.calorieGuidance}</Text>
                            </View>
                          )}
                          
                          {nutritionAdvice.proteinFocus && (
                            <View style={healthStyles.nutritionItem}>
                              <Text style={healthStyles.nutritionLabel}>Protein</Text>
                              <Text style={healthStyles.nutritionText}>{nutritionAdvice.proteinFocus}</Text>
                            </View>
                          )}
                          
                          {nutritionAdvice.hydrationTarget && (
                            <View style={healthStyles.nutritionItem}>
                              <Text style={healthStyles.nutritionLabel}>Hydration</Text>
                              <Text style={healthStyles.nutritionText}>{nutritionAdvice.hydrationTarget}</Text>
                            </View>
                          )}
                          
                          {nutritionAdvice.mealTiming && (
                            <View style={healthStyles.nutritionItem}>
                              <Text style={healthStyles.nutritionLabel}>Timing</Text>
                              <Text style={healthStyles.nutritionText}>{nutritionAdvice.mealTiming}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                    
                    {/* Quick Insights Summary */}
                    <View style={healthStyles.insightsSummary}>
                      <Text style={healthStyles.insightsSummaryTitle}>Key Insights</Text>
                      {healthInsights.slice(0, 3).map((insight, index) => (
                        <View key={index} style={healthStyles.insightSummaryItem}>
                          <View style={[
                            healthStyles.insightSummaryIcon,
                            { backgroundColor: getStatusBackground(insight.status) }
                          ]}>
                            {insight.icon}
                          </View>
                          <View style={healthStyles.insightSummaryContent}>
                            <Text style={healthStyles.insightSummaryTitle}>{insight.title}</Text>
                            <Text style={healthStyles.insightSummaryDescription}>
                              {insight.description.length > 80 ? 
                                insight.description.substring(0, 80) + '...' : 
                                insight.description
                              }
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Smart Recommendations */}
                    <View style={healthStyles.smartRecommendationsContainer}>
                      <View style={healthStyles.smartRecommendationsHeader}>
                        <Brain size={20} color={colors.primary} />
                        <Text style={healthStyles.smartRecommendationsTitle}>AI Coach Insights</Text>
                      </View>
                      
                      <View style={healthStyles.coachInsightCard}>
                        <Text style={healthStyles.coachInsightText}>
                          {getSmartCoachInsight(healthInsights, actionableSteps, avgRecovery, avgStrain)}
                        </Text>
                      </View>
                      
                      <View style={healthStyles.quickActionsGrid}>
                        <TouchableOpacity 
                          style={healthStyles.quickActionButton}
                          onPress={() => generateWorkoutRecommendation()}
                        >
                          <Zap size={16} color={colors.warning} />
                          <Text style={healthStyles.quickActionText}>Workout Plan</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={healthStyles.quickActionButton}
                          onPress={() => generateNutritionPlan()}
                        >
                          <Utensils size={16} color={colors.success} />
                          <Text style={healthStyles.quickActionText}>Meal Plan</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={healthStyles.quickActionButton}
                          onPress={() => generateRecoveryPlan()}
                        >
                          <Moon size={16} color={colors.textSecondary} />
                          <Text style={healthStyles.quickActionText}>Recovery</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={healthStyles.quickActionButton}
                          onPress={() => generateSleepPlan()}
                        >
                          <Shield size={16} color={colors.primary} />
                          <Text style={healthStyles.quickActionText}>Sleep Plan</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Display Generated Insights */}
                      {(smartInsights.workoutPlan || smartInsights.nutritionPlan || smartInsights.recoveryPlan || smartInsights.sleepPlan) && (
                        <View style={healthStyles.generatedInsightsContainer}>
                          {smartInsights.workoutPlan && (
                            <View style={healthStyles.generatedInsightItem}>
                              <View style={healthStyles.generatedInsightHeader}>
                                <Zap size={16} color={colors.warning} />
                                <Text style={healthStyles.generatedInsightTitle}>Workout Plan</Text>
                              </View>
                              <Text style={healthStyles.generatedInsightText}>{smartInsights.workoutPlan}</Text>
                            </View>
                          )}
                          
                          {smartInsights.nutritionPlan && (
                            <View style={healthStyles.generatedInsightItem}>
                              <View style={healthStyles.generatedInsightHeader}>
                                <Utensils size={16} color={colors.success} />
                                <Text style={healthStyles.generatedInsightTitle}>Nutrition Plan</Text>
                              </View>
                              <Text style={healthStyles.generatedInsightText}>{smartInsights.nutritionPlan}</Text>
                            </View>
                          )}
                          
                          {smartInsights.recoveryPlan && (
                            <View style={healthStyles.generatedInsightItem}>
                              <View style={healthStyles.generatedInsightHeader}>
                                <Moon size={16} color={colors.textSecondary} />
                                <Text style={healthStyles.generatedInsightTitle}>Recovery Plan</Text>
                              </View>
                              <Text style={healthStyles.generatedInsightText}>{smartInsights.recoveryPlan}</Text>
                            </View>
                          )}
                          
                          {smartInsights.sleepPlan && (
                            <View style={healthStyles.generatedInsightItem}>
                              <View style={healthStyles.generatedInsightHeader}>
                                <Shield size={16} color={colors.primary} />
                                <Text style={healthStyles.generatedInsightTitle}>Sleep Plan</Text>
                              </View>
                              <Text style={healthStyles.generatedInsightText}>{smartInsights.sleepPlan}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    
                    {/* Action Buttons */}
                    <View style={healthStyles.actionButtons}>
                      <TouchableOpacity 
                        style={healthStyles.refreshButton} 
                        onPress={generateHealthEvaluation}
                        disabled={isLoadingHealth}
                      >
                        <RefreshCw size={18} color={colors.primary} />
                        <Text style={healthStyles.refreshButtonText}>Refresh Analysis</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'good': return colors.success;
    case 'warning': return colors.warning;
    case 'critical': return colors.danger;
    default: return colors.textSecondary;
  }
};

const getStatusBackground = (status: string) => {
  switch (status) {
    case 'good': return 'rgba(34, 197, 94, 0.1)';
    case 'warning': return 'rgba(251, 191, 36, 0.1)';
    case 'critical': return 'rgba(239, 68, 68, 0.1)';
    default: return 'rgba(156, 163, 175, 0.1)';
  }
};

// Get device dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const bottomPadding = Platform.OS === 'ios' ? (isSmallDevice ? 80 : 100) : 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatList: {
    padding: 16,
    paddingBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 12, // Extra padding for iOS
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#3A3A3A',
  },
  emptyContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  suggestionsScrollView: {
    flex: 1,
    width: '100%',
  },
  suggestionsScrollContent: {
    paddingBottom: bottomPadding, // Consistent padding for iOS
  },
  suggestionContainer: {
    width: '100%',
  },
  suggestionCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  nutritionSuggestion: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    color: colors.text,
    fontSize: 14,
  },
  connectContainer: {
    width: '100%',
    alignItems: 'center',
  },
  connectText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  connectButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  healthEvaluationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  healthEvaluationButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: 6,
  },
  typingContainer: {
    padding: 16,
    alignItems: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
    marginHorizontal: 2,
    opacity: 0.6,
    transform: [{ scale: 1 }],
    animationName: 'bounce',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
  typingDotMiddle: {
    animationDelay: '0.2s',
    opacity: 0.8,
  },
});

const healthStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ios?.quaternaryBackground || '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ios?.systemFill || '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overallStatusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  overallStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  overallStatusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  evaluationSummary: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  insightsGrid: {
    gap: 16,
  },
  insightItem: {
    backgroundColor: colors.ios?.secondaryBackground || '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  insightItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightItemContent: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  insightItemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  insightItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  insightItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  recommendationsContainer: {
    backgroundColor: colors.ios?.tertiaryBackground || '#1A1A1A',
    borderRadius: 12,
    padding: 12,
  },
  recommendationsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  moreRecommendations: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ios?.separator || '#2A2A2A',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ios?.systemFill || '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  // Empty States
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.ios?.systemFill || '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  // Action Plan Styles
  actionPlanContainer: {
    backgroundColor: colors.ios?.secondaryBackground || '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  actionPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  actionPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  actionPlanSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.ios?.systemFill || '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.ios?.tertiaryBackground || '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  actionItemCompleted: {
    opacity: 0.6,
  },
  priorityDot: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    minHeight: 50,
  },
  actionContent: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  actionCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkMark: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  actionTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  actionReason: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  // Nutrition Styles
  nutritionContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    marginBottom: 12,
  },
  nutritionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  // Insights Summary Styles
  insightsSummary: {
    backgroundColor: colors.ios?.secondaryBackground || '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  insightsSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  insightSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightSummaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightSummaryContent: {
    flex: 1,
  },
  insightSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  insightSummaryDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  // Coach Button
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  coachButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  // Smart Recommendations Styles
  smartRecommendationsContainer: {
    backgroundColor: colors.ios?.secondaryBackground || '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  smartRecommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  smartRecommendationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  coachInsightCard: {
    backgroundColor: colors.ios?.tertiaryBackground || '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  coachInsightText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: colors.ios?.tertiaryBackground || '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.ios?.separator || '#2A2A2A',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  // Generated Insights Styles
  generatedInsightsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ios?.separator || '#2A2A2A',
  },
  generatedInsightItem: {
    backgroundColor: colors.ios?.tertiaryBackground || '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  generatedInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  generatedInsightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  generatedInsightText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});