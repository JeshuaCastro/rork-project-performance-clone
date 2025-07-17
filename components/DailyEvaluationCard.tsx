import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { useWhoopStore } from '@/store/whoopStore';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Battery, 
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Brain,
  Zap,
  RefreshCw
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import DetailedEvaluationModal from './DetailedEvaluationModal';

interface DailyEvaluationCardProps {
  onPress?: () => void;
}

interface ActionableStep {
  category: 'recovery' | 'nutrition' | 'training' | 'supplements' | 'sleep';
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface NutritionAdvice {
  calorieGuidance?: string;
  proteinFocus?: string;
  hydrationTarget?: string;
  mealTiming?: string;
}

interface AIEvaluation {
  status: string;
  title: string;
  message: string;
  color: string;
  icon: any;
  programInsight?: string;
  trendAnalysis?: string;
  recommendations?: string[];
  actionableSteps?: ActionableStep[];
  nutritionAdvice?: NutritionAdvice;
  supplementSuggestions?: string[];
  confidenceScore?: number;
}

export default function DailyEvaluationCard({ onPress }: DailyEvaluationCardProps) {
  const router = useRouter();
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [lastEvaluationDate, setLastEvaluationDate] = useState<string | null>(null);
  
  const { 
    data, 
    activePrograms, 
    getTodaysWorkout, 
    getProgramProgress,
    isConnectedToWhoop,
    lastSyncTime
  } = useWhoopStore();

  // Get today's data with null checks - use most recent available data
  const today = new Date().toISOString().split('T')[0];
  const todaysRecovery = data?.recovery?.find(item => item.date === today);
  const todaysStrain = data?.strain?.find(item => item.date === today);
  const todaysSleep = data?.sleep?.find(item => item.date === today);
  const todaysWorkout = getTodaysWorkout();
  
  // Use most recent available data if today's data isn't available yet
  const latestRecovery = data?.recovery?.[0];
  const latestStrain = data?.strain?.[0];
  const latestSleep = data?.sleep?.[0];

  // Calculate 7-day trends with null checks
  const last7DaysRecovery = data?.recovery?.slice(0, 7) || [];
  const last7DaysStrain = data?.strain?.slice(0, 7) || [];



  // Calculate recovery trend (comparing last 3 days to previous 4 days)
  const getRecoveryTrend = () => {
    if (last7DaysRecovery.length < 7) return 'stable';
    
    const recent3Days = last7DaysRecovery.slice(0, 3).reduce((sum, r) => sum + r.score, 0) / 3;
    const previous4Days = last7DaysRecovery.slice(3, 7).reduce((sum, r) => sum + r.score, 0) / 4;
    
    const difference = recent3Days - previous4Days;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  };

  // Generate AI-powered evaluation with nutrition integration
  const generateAIEvaluation = async () => {
    // Use the same connection and data state as the dashboard
    if (!isConnectedToWhoop || !data?.recovery || data.recovery.length === 0) {
      return {
        status: 'no-data',
        title: 'Connect WHOOP for AI Insights',
        message: 'Connect your WHOOP to get AI-powered daily evaluations',
        color: colors.textSecondary,
        icon: Activity
      };
    }

    // Use the first available recovery data (most recent)
    const latestRecovery = data.recovery[0];
    if (!latestRecovery) {
      return {
        status: 'no-data',
        title: 'No Recovery Data',
        message: 'Waiting for WHOOP recovery data',
        color: colors.textSecondary,
        icon: Activity
      };
    }

    setIsLoadingAI(true);
    
    try {
      // Get nutrition data from store
      const { getFoodLogEntriesByDate, getMacroProgressForDate, userProfile } = useWhoopStore.getState();
      const todaysFoodEntries = getFoodLogEntriesByDate(today);
      const macroProgress = getMacroProgressForDate(today);
      
      // Calculate nutrition metrics
      const calorieProgress = macroProgress.calories.consumed / macroProgress.calories.target;
      const proteinProgress = macroProgress.protein.consumed / macroProgress.protein.target;
      const nutritionQuality = todaysFoodEntries.length > 0 ? 'logged' : 'not-logged';
      
      // Prepare data for AI analysis using available data
      const last7DaysData = {
        recovery: data.recovery.slice(0, 7),
        strain: data.strain?.slice(0, 7) || [],
        sleep: data.sleep?.slice(0, 7) || []
      };

      // Use the latest recovery data we have
      const currentMetrics = {
        recovery: latestRecovery.score,
        strain: todaysStrain?.score || (data.strain && data.strain.length > 0 ? data.strain[0].score : 0),
        hrv: latestRecovery.hrvMs,
        rhr: latestRecovery.restingHeartRate,
        sleep: todaysSleep?.efficiency || (data.sleep && data.sleep.length > 0 ? data.sleep[0].efficiency : 0)
      };

      // Get program progress for active programs
      const activeProgram = activePrograms.find(p => p.active);
      const programProgress = activeProgram ? getProgramProgress(activeProgram.id) : null;
      
      const programContext = activeProgram ? {
        name: activeProgram.name,
        type: activeProgram.type,
        progress: programProgress,
        todaysWorkout: todaysWorkout
      } : null;

      // Calculate trends
      const recoveryTrend = getRecoveryTrend();
      const avgRecovery = last7DaysRecovery.length > 0 
        ? last7DaysRecovery.reduce((sum, r) => sum + r.score, 0) / last7DaysRecovery.length 
        : 0;
      const avgStrain = last7DaysStrain.length > 0 
        ? last7DaysStrain.reduce((sum, s) => sum + s.score, 0) / last7DaysStrain.length 
        : 0;

      const prompt = `As a fitness and recovery expert, analyze this athlete's data and provide actionable daily recommendations:

CURRENT METRICS (Today):
- Recovery: ${currentMetrics.recovery}%
- Strain: ${currentMetrics.strain}
- HRV: ${currentMetrics.hrv}ms
- Resting HR: ${currentMetrics.rhr}bpm
- Sleep Efficiency: ${currentMetrics.sleep}%

NUTRITION STATUS (Today):
- Calories: ${macroProgress.calories.consumed}/${macroProgress.calories.target} (${(calorieProgress * 100).toFixed(0)}%)
- Protein: ${macroProgress.protein.consumed}g/${macroProgress.protein.target}g (${(proteinProgress * 100).toFixed(0)}%)
- Meals Logged: ${todaysFoodEntries.length}
- Nutrition Quality: ${nutritionQuality}

7-DAY TRENDS:
- Average Recovery: ${avgRecovery.toFixed(1)}%
- Average Strain: ${avgStrain.toFixed(1)}
- Recovery Trend: ${recoveryTrend}

${programContext ? `TRAINING PROGRAM:
- Program: ${programContext.name} (${programContext.type})
- Today's Workout: ${todaysWorkout?.title || 'Rest Day'}
- Intensity: ${todaysWorkout?.intensity || 'N/A'}
- Progress: ${programContext.progress?.progressPercentage || 0}%` : 'No active training program'}

USER PROFILE:
- Age: ${userProfile.age}, Gender: ${userProfile.gender}
- Weight: ${userProfile.weight}kg, Activity: ${userProfile.activityLevel}
- Goal: ${userProfile.fitnessGoal}

Provide a JSON response with ACTIONABLE recommendations:
{
  "status": "optimal|good|caution|warning|recovery",
  "title": "Brief status title (max 25 chars)",
  "message": "Main insight (max 80 chars)",
  "trendAnalysis": "Analysis of 7-day trends (max 120 chars)",
  "actionableSteps": [
    {
      "category": "recovery|nutrition|training|supplements|sleep",
      "action": "Specific actionable step",
      "reason": "Why this helps today",
      "priority": "high|medium|low"
    }
  ],
  "nutritionAdvice": {
    "calorieGuidance": "Specific calorie advice based on current intake",
    "proteinFocus": "Protein recommendations for recovery/goals",
    "hydrationTarget": "Water intake recommendation",
    "mealTiming": "When to eat for optimal performance/recovery"
  },
  "supplementSuggestions": ["Specific supplements based on recovery/nutrition gaps"],
  "programInsight": "How this relates to training program (max 80 chars)",
  "confidenceScore": 85
}

Focus on ACTIONABLE steps the user can take TODAY to improve recovery, performance, and progress toward their goals. Consider their nutrition status, training program, and current recovery state.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert fitness and recovery analyst. Provide concise, actionable insights based on biometric data trends.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI evaluation');
      }

      const result = await response.json();
      let aiData;
      
      try {
        // Try to parse JSON from the completion
        const jsonMatch = result.completion.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback to basic evaluation if AI parsing fails
        console.warn('AI parsing failed, using fallback:', parseError);
        return generateBasicEvaluation();
      }

      // Map status to colors and icons
      const statusConfig = {
        optimal: { color: colors.success, icon: CheckCircle },
        good: { color: colors.primary, icon: TrendingUp },
        caution: { color: colors.warning, icon: Target },
        warning: { color: colors.danger, icon: AlertTriangle },
        recovery: { color: colors.warning, icon: Heart }
      };

      const config = statusConfig[aiData.status as keyof typeof statusConfig] || statusConfig.good;

      return {
        ...aiData,
        color: config.color,
        icon: config.icon
      };

    } catch (error) {
      console.error('AI evaluation error:', error);
      return generateBasicEvaluation();
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Fallback basic evaluation with actionable steps
  const generateBasicEvaluation = () => {
    if (!isConnectedToWhoop || !data?.recovery || data.recovery.length === 0) {
      return {
        status: 'no-data',
        title: 'Connect WHOOP for Insights',
        message: 'Connect your WHOOP to get daily evaluations',
        color: colors.textSecondary,
        icon: Activity
      };
    }

    // Use the most recent recovery data available
    const mostRecentRecovery = data.recovery[0];
    const recoveryScore = mostRecentRecovery.score;
    const recoveryTrend = getRecoveryTrend();
    
    // Get nutrition data for basic recommendations
    const { getFoodLogEntriesByDate, getMacroProgressForDate } = useWhoopStore.getState();
    const todaysFoodEntries = getFoodLogEntriesByDate(today);
    const macroProgress = getMacroProgressForDate(today);
    const calorieProgress = macroProgress.calories.consumed / macroProgress.calories.target;
    
    if (recoveryScore >= 75) {
      return {
        status: 'optimal',
        title: 'Excellent Recovery',
        message: `${recoveryScore}% recovery - ready for high intensity`,
        color: colors.success,
        icon: CheckCircle,
        trendAnalysis: `Recovery trending ${recoveryTrend} over past week`,
        actionableSteps: [
          {
            category: 'training' as const,
            action: 'Take advantage of high recovery with intense training',
            reason: 'Your body is primed for performance',
            priority: 'high' as const
          },
          {
            category: 'nutrition' as const,
            action: calorieProgress < 0.8 ? 'Fuel properly for high-intensity session' : 'Maintain current nutrition',
            reason: 'Support energy demands and recovery',
            priority: 'medium' as const
          },
          {
            category: 'recovery' as const,
            action: 'Maintain current sleep and recovery habits',
            reason: 'Keep what\'s working well',
            priority: 'low' as const
          }
        ],
        nutritionAdvice: {
          calorieGuidance: calorieProgress < 0.8 ? 'Increase intake to support training' : 'On track with calories',
          proteinFocus: 'Aim for 25-30g protein post-workout',
          hydrationTarget: '3-4L water today',
          mealTiming: 'Eat 2-3 hours before training'
        },
        supplementSuggestions: ['Consider creatine for power output', 'Electrolytes during training'],
        programInsight: todaysWorkout ? 'Perfect alignment with training plan' : 'Great day to push harder'
      };
    } else if (recoveryScore >= 50) {
      return {
        status: 'good',
        title: 'Moderate Recovery',
        message: `${recoveryScore}% recovery - proceed with planned training`,
        color: colors.primary,
        icon: Activity,
        trendAnalysis: `Recovery trending ${recoveryTrend} over past week`,
        actionableSteps: [
          {
            category: 'training' as const,
            action: 'Stick to planned workout intensity',
            reason: 'Balanced recovery supports moderate training',
            priority: 'high' as const
          },
          {
            category: 'sleep' as const,
            action: 'Prioritize 8+ hours sleep tonight',
            reason: 'Support tomorrow\'s recovery',
            priority: 'medium' as const
          },
          {
            category: 'nutrition' as const,
            action: todaysFoodEntries.length < 3 ? 'Log meals to track nutrition' : 'Maintain balanced nutrition',
            reason: 'Proper fueling supports recovery',
            priority: 'medium' as const
          }
        ],
        nutritionAdvice: {
          calorieGuidance: 'Stay consistent with calorie targets',
          proteinFocus: '1.6-2.0g per kg body weight',
          hydrationTarget: '2.5-3L water today',
          mealTiming: 'Regular meal timing supports recovery'
        },
        supplementSuggestions: ['Magnesium for sleep quality', 'Omega-3 for inflammation'],
        programInsight: 'Good balance between recovery and training'
      };
    } else {
      return {
        status: 'recovery',
        title: 'Low Recovery',
        message: `${recoveryScore}% recovery - prioritize rest and recovery`,
        color: colors.warning,
        icon: Heart,
        trendAnalysis: `Recovery trending ${recoveryTrend} - needs attention`,
        actionableSteps: [
          {
            category: 'recovery' as const,
            action: 'Reduce training intensity by 30-50%',
            reason: 'Allow body to recover and adapt',
            priority: 'high' as const
          },
          {
            category: 'sleep' as const,
            action: 'Aim for 9+ hours sleep tonight',
            reason: 'Sleep is critical for recovery',
            priority: 'high' as const
          },
          {
            category: 'nutrition' as const,
            action: 'Focus on anti-inflammatory foods',
            reason: 'Support recovery and reduce stress',
            priority: 'medium' as const
          }
        ],
        nutritionAdvice: {
          calorieGuidance: 'Don\'t restrict calories during recovery',
          proteinFocus: 'Increase to 2.0-2.2g per kg for repair',
          hydrationTarget: '3-4L water for recovery',
          mealTiming: 'Frequent small meals to support healing'
        },
        supplementSuggestions: ['Vitamin D for immune function', 'Tart cherry for sleep and inflammation'],
        programInsight: 'Consider adjusting training plan'
      };
    }
  };

  // Initialize with basic evaluation and trigger AI analysis for connected users
  useEffect(() => {
    console.log('🔄 DailyEvaluationCard: Connection state changed', {
      isConnected: isConnectedToWhoop,
      hasData: !!(data?.recovery && data.recovery.length > 0),
      recoveryCount: data?.recovery?.length || 0,
      latestRecoveryDate: data?.recovery?.[0]?.date || 'none'
    });
    
    // Always generate a basic evaluation first
    const evaluation = generateBasicEvaluation();
    setAiEvaluation(evaluation);
    
    // Auto-generate AI analysis for connected users if we have data and haven't done it today
    if (isConnectedToWhoop && data?.recovery && data.recovery.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      if (!lastEvaluationDate || lastEvaluationDate !== today) {
        console.log('🔄 Auto-generating AI evaluation for connected WHOOP user');
        console.log('📊 Recovery data available:', data.recovery[0].score + '%');
        setTimeout(() => {
          handleRefreshEvaluation();
        }, 1000); // Small delay to avoid race conditions
      } else {
        console.log('✅ AI evaluation already generated for today');
      }
    } else {
      console.log('⚠️ Conditions not met for auto AI evaluation:', {
        isConnected: isConnectedToWhoop,
        hasData: !!(data?.recovery && data.recovery.length > 0)
      });
    }
  }, [isConnectedToWhoop, data]);

  // Listen for data changes and regenerate AI evaluation when data is updated
  useEffect(() => {
    if (isConnectedToWhoop && data?.recovery && data.recovery.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      // If we have an evaluation from a previous day, or no evaluation yet, regenerate
      if (!lastEvaluationDate || lastEvaluationDate !== today) {
        console.log('📈 Data updated, regenerating AI evaluation');
        setTimeout(() => {
          handleRefreshEvaluation();
        }, 2000); // Longer delay for data update scenarios
      }
    }
  }, [data?.recovery?.[0]?.date, data?.recovery?.[0]?.score]); // Listen to the latest recovery data

  // Also listen for lastSyncTime changes to detect fresh data syncs
  useEffect(() => {
    if (isConnectedToWhoop && lastSyncTime && data?.recovery && data.recovery.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const syncDate = new Date(lastSyncTime).toISOString().split('T')[0];
      
      // If data was synced today and we don't have today's evaluation, generate it
      if (syncDate === today && (!lastEvaluationDate || lastEvaluationDate !== today)) {
        console.log('🔄 Fresh data sync detected, generating AI evaluation');
        console.log('📅 Sync date:', syncDate, 'Today:', today);
        setTimeout(() => {
          handleRefreshEvaluation();
        }, 3000); // Wait a bit longer for sync to fully complete
      }
    }
  }, [lastSyncTime]);

  // Listen for connection state changes and force refresh when connected
  useEffect(() => {
    if (isConnectedToWhoop && data?.recovery && data.recovery.length > 0) {
      console.log('🔗 WHOOP connection detected with data, forcing evaluation refresh');
      // Clear the last evaluation date to force a new evaluation
      setLastEvaluationDate(null);
      setTimeout(() => {
        handleRefreshEvaluation();
      }, 1500);
    }
  }, [isConnectedToWhoop]); // Only listen to connection state changes

  const evaluation = aiEvaluation || generateBasicEvaluation();
  const IconComponent = evaluation.icon;



  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      // Show detailed evaluation modal
      setShowDetailedModal(true);
    }
  };

  const handleRefreshEvaluation = async () => {
    if (isLoadingAI) return;
    
    console.log('🤖 Generating AI evaluation...');
    const evaluation = await generateAIEvaluation();
    setAiEvaluation(evaluation);
    setLastEvaluationDate(new Date().toISOString().split('T')[0]);
    console.log('✅ AI evaluation completed');
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.card} 
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Brain size={20} color={colors.primary} />
          <Text style={styles.title}>AI Daily Evaluation</Text>
          {isLoadingAI && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
        </View>
        <View style={styles.headerActions}>
          {isConnectedToWhoop && (
            <TouchableOpacity 
              onPress={handleRefreshEvaluation}
              disabled={isLoadingAI}
              style={[styles.refreshButton, isLoadingAI && styles.refreshButtonDisabled]}
            >
              <RefreshCw 
                size={16} 
                color={isLoadingAI ? colors.textSecondary : colors.primary} 
              />
              <Text style={[styles.refreshButtonText, isLoadingAI && styles.refreshButtonTextDisabled]}>
                {isLoadingAI ? 'Analyzing...' : 'AI Analysis'}
              </Text>
            </TouchableOpacity>
          )}
          <ArrowRight size={16} color={colors.textSecondary} />
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          <IconComponent size={18} color={evaluation.color} />
          <Text style={[styles.statusTitle, { color: evaluation.color }]}>
            {evaluation.title}
          </Text>
          {'confidenceScore' in evaluation && evaluation.confidenceScore && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{evaluation.confidenceScore}%</Text>
            </View>
          )}
        </View>
        <Text style={styles.statusMessage}>
          {evaluation.message}
        </Text>
        
        {/* AI Trend Analysis */}
        {evaluation.trendAnalysis && (
          <View style={styles.trendAnalysisContainer}>
            <TrendingUp size={14} color={colors.primary} />
            <Text style={styles.trendAnalysisText}>
              {evaluation.trendAnalysis}
            </Text>
          </View>
        )}
        
        {/* AI Analysis Prompt */}
        {isConnectedToWhoop && !evaluation.trendAnalysis && !isLoadingAI && (
          <View style={styles.aiPromptContainer}>
            <Brain size={14} color={colors.textSecondary} />
            <Text style={styles.aiPromptText}>
              Tap "AI Analysis" for personalized insights and recommendations
            </Text>
          </View>
        )}
      </View>

      {/* Quick Metrics - Only show if connected and have data */}
      {isConnectedToWhoop && data?.recovery && data.recovery.length > 0 && (
        <View style={styles.quickMetrics}>
          <View style={styles.quickMetric}>
            <Text style={styles.quickMetricValue}>
              {data.recovery[0].score}%
            </Text>
            <Text style={styles.quickMetricLabel}>Recovery</Text>
          </View>
          
          <View style={styles.quickMetric}>
            <Text style={styles.quickMetricValue}>
              {data.strain && data.strain.length > 0 ? data.strain[0].score.toFixed(1) : '0.0'}
            </Text>
            <Text style={styles.quickMetricLabel}>Strain</Text>
          </View>
          
          <View style={styles.quickMetric}>
            <Text style={styles.quickMetricValue}>
              {data.recovery[0].hrvMs}ms
            </Text>
            <Text style={styles.quickMetricLabel}>HRV</Text>
          </View>
        </View>
      )}

      {/* Top Priority Action - Only show the most important one */}
      {evaluation.actionableSteps && evaluation.actionableSteps.length > 0 && (
        <View style={styles.topActionContainer}>
          <View style={styles.topActionHeader}>
            <Zap size={14} color={colors.primary} />
            <Text style={styles.topActionTitle}>Priority Action</Text>
          </View>
          <View style={styles.topActionItem}>
            <View style={[styles.priorityDot, { 
              backgroundColor: evaluation.actionableSteps[0].priority === 'high' ? colors.danger : 
                             evaluation.actionableSteps[0].priority === 'medium' ? colors.warning : colors.success 
            }]} />
            <Text style={styles.topActionText}>{evaluation.actionableSteps[0].action}</Text>
          </View>
        </View>
      )}

      {/* View Details Prompt */}
      <View style={styles.viewDetailsPrompt}>
        <Text style={styles.viewDetailsText}>Tap for detailed analysis, trends & recommendations</Text>
        <ArrowRight size={14} color={colors.textSecondary} />
      </View>
      </TouchableOpacity>

      <DetailedEvaluationModal 
        visible={showDetailedModal}
        onClose={() => setShowDetailedModal(false)}
        evaluation={evaluation}
      />
    </>
  );
}

// Helper function to get recovery color based on score
const getRecoveryColor = (score: number): string => {
  if (score >= 75) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(93, 95, 239, 0.2)',
  },
  refreshButtonDisabled: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  refreshButtonTextDisabled: {
    color: colors.textSecondary,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  trendAnalysisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  trendAnalysisText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
  quickMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(93, 95, 239, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(93, 95, 239, 0.1)',
  },
  quickMetric: {
    alignItems: 'center',
  },
  quickMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  quickMetricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Top Action Styles
  topActionContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.1)',
  },
  topActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topActionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  topActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  topActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  // View Details Prompt
  viewDetailsPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 6,
    fontStyle: 'italic',
  },
  // AI Prompt Styles
  aiPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  aiPromptText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
});