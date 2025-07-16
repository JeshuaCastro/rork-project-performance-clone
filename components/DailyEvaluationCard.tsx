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
  Zap
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import DetailedEvaluationModal from './DetailedEvaluationModal';

interface DailyEvaluationCardProps {
  onPress?: () => void;
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
    isConnectedToWhoop 
  } = useWhoopStore();

  // Get today's data with null checks
  const today = new Date().toISOString().split('T')[0];
  const todaysRecovery = data?.recovery?.find(item => item.date === today);
  const todaysStrain = data?.strain?.find(item => item.date === today);
  const todaysSleep = data?.sleep?.find(item => item.date === today);
  const todaysWorkout = getTodaysWorkout();

  // Calculate 7-day trends with null checks
  const last7DaysRecovery = data?.recovery?.slice(0, 7) || [];
  const last7DaysStrain = data?.strain?.slice(0, 7) || [];
  
  const avgRecovery = last7DaysRecovery.length > 0 
    ? last7DaysRecovery.reduce((sum, r) => sum + r.score, 0) / last7DaysRecovery.length 
    : 0;
  
  const avgStrain = last7DaysStrain.length > 0 
    ? last7DaysStrain.reduce((sum, s) => sum + s.score, 0) / last7DaysStrain.length 
    : 0;

  // Get program progress for active programs
  const activeProgram = activePrograms.find(p => p.active);
  const programProgress = activeProgram ? getProgramProgress(activeProgram.id) : null;

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

  // Generate AI-powered evaluation
  const generateAIEvaluation = async () => {
    if (!isConnectedToWhoop || !todaysRecovery || !data?.recovery || !data?.strain) {
      return {
        status: 'no-data',
        title: 'Connect WHOOP for AI Insights',
        message: 'Connect your WHOOP to get AI-powered daily evaluations',
        color: colors.textSecondary,
        icon: Activity
      };
    }

    setIsLoadingAI(true);
    
    try {
      // Prepare data for AI analysis
      const last7DaysData = {
        recovery: data.recovery.slice(0, 7),
        strain: data.strain.slice(0, 7),
        sleep: data.sleep?.slice(0, 7) || []
      };

      const currentMetrics = {
        recovery: todaysRecovery.score,
        strain: todaysStrain?.score || 0,
        hrv: todaysRecovery.hrvMs,
        rhr: todaysRecovery.restingHeartRate,
        sleep: todaysSleep?.efficiency || 0
      };

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

      const prompt = `As a fitness and recovery expert, analyze this athlete's data and provide a comprehensive daily evaluation:

CURRENT METRICS (Today):
- Recovery: ${currentMetrics.recovery}%
- Strain: ${currentMetrics.strain}
- HRV: ${currentMetrics.hrv}ms
- Resting HR: ${currentMetrics.rhr}bpm
- Sleep Efficiency: ${currentMetrics.sleep}%

7-DAY TRENDS:
- Average Recovery: ${avgRecovery.toFixed(1)}%
- Average Strain: ${avgStrain.toFixed(1)}
- Recovery Trend: ${recoveryTrend}
- Recovery Data: ${JSON.stringify(last7DaysData.recovery.map(r => ({ date: r.date, score: r.score, hrv: r.hrvMs })))}
- Strain Data: ${JSON.stringify(last7DaysData.strain.map(s => ({ date: s.date, score: s.score })))}

${programContext ? `TRAINING PROGRAM:
- Program: ${programContext.name} (${programContext.type})
- Today's Workout: ${todaysWorkout?.title || 'Rest Day'}
- Intensity: ${todaysWorkout?.intensity || 'N/A'}
- Progress: ${programContext.progress?.progressPercentage || 0}%` : 'No active training program'}

Provide a JSON response with:
{
  "status": "optimal|good|caution|warning|recovery",
  "title": "Brief status title (max 25 chars)",
  "message": "Main insight (max 80 chars)",
  "trendAnalysis": "Analysis of 7-day trends (max 120 chars)",
  "recommendations": ["3 specific actionable recommendations"],
  "programInsight": "How this relates to training program (max 80 chars)",
  "confidenceScore": 85
}

Focus on:
1. Trend analysis over the past week
2. Current state vs historical patterns
3. Training program alignment
4. Specific actionable recommendations
5. Recovery optimization strategies`;

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

  // Fallback basic evaluation
  const generateBasicEvaluation = () => {
    if (!isConnectedToWhoop || !todaysRecovery) {
      return {
        status: 'no-data',
        title: 'Connect WHOOP for Insights',
        message: 'Connect your WHOOP to get daily evaluations',
        color: colors.textSecondary,
        icon: Activity
      };
    }

    const recoveryScore = todaysRecovery.score;
    const recoveryTrend = getRecoveryTrend();
    
    if (recoveryScore >= 75) {
      return {
        status: 'optimal',
        title: 'Excellent Recovery',
        message: `${recoveryScore}% recovery - ready for high intensity`,
        color: colors.success,
        icon: CheckCircle,
        trendAnalysis: `Recovery trending ${recoveryTrend} over past week`,
        recommendations: ['Consider high-intensity training', 'Maintain current recovery habits', 'Monitor strain accumulation'],
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
        recommendations: ['Stick to planned intensity', 'Monitor how you feel', 'Focus on sleep quality'],
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
        recommendations: ['Reduce training intensity', 'Focus on sleep and nutrition', 'Consider active recovery'],
        programInsight: 'Consider adjusting training plan'
      };
    }
  };

  // Load AI evaluation on component mount and when data changes
  useEffect(() => {
    const loadEvaluation = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Only generate new evaluation if we haven't done it today
      if (lastEvaluationDate !== today && isConnectedToWhoop && todaysRecovery) {
        const evaluation = await generateAIEvaluation();
        setAiEvaluation(evaluation);
        setLastEvaluationDate(today);
      } else if (!aiEvaluation) {
        // Use basic evaluation as fallback
        const evaluation = generateBasicEvaluation();
        setAiEvaluation(evaluation);
      }
    };

    loadEvaluation();
  }, [isConnectedToWhoop, todaysRecovery, data]);

  const evaluation = aiEvaluation || generateBasicEvaluation();
  const IconComponent = evaluation.icon;

  // Program progress insights
  const getProgramProgressInsight = () => {
    if (!programProgress || !activeProgram) return null;
    
    const { progressPercentage, currentWeek, totalWeeks, daysUntilGoal } = programProgress;
    
    if (daysUntilGoal && daysUntilGoal < 14) {
      return `${daysUntilGoal} days until goal - final preparation phase`;
    } else if (progressPercentage > 75) {
      return `Week ${currentWeek}/${totalWeeks} - peak training phase`;
    } else if (progressPercentage > 50) {
      return `Week ${currentWeek}/${totalWeeks} - building intensity`;
    } else {
      return `Week ${currentWeek}/${totalWeeks} - foundation building`;
    }
  };

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
    
    const evaluation = await generateAIEvaluation();
    setAiEvaluation(evaluation);
    setLastEvaluationDate(new Date().toISOString().split('T')[0]);
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
              style={styles.refreshButton}
            >
              <TrendingUp size={14} color={colors.primary} />
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
          {evaluation.confidenceScore && (
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
      </View>

      {/* Metrics Row */}
      {isConnectedToWhoop && data?.recovery && todaysRecovery && (
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Battery size={14} color={colors.success} />
            <Text style={styles.metricLabel}>Recovery</Text>
            <Text style={[styles.metricValue, { color: getRecoveryColor(todaysRecovery.score) }]}>
              {todaysRecovery.score}%
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Activity size={14} color={colors.warning} />
            <Text style={styles.metricLabel}>Strain</Text>
            <Text style={styles.metricValue}>
              {todaysStrain?.score.toFixed(1) || '0.0'}
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Heart size={14} color={colors.primary} />
            <Text style={styles.metricLabel}>HRV</Text>
            <Text style={styles.metricValue}>
              {todaysRecovery.hrvMs}ms
            </Text>
          </View>
        </View>
      )}

      {/* AI Recommendations */}
      {evaluation.recommendations && evaluation.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <View style={styles.recommendationsHeader}>
            <Zap size={14} color={colors.primary} />
            <Text style={styles.recommendationsTitle}>AI Recommendations</Text>
          </View>
          {evaluation.recommendations.slice(0, 2).map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationDot} />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Program Integration */}
      {evaluation.programInsight && (
        <View style={styles.programInsight}>
          <Text style={styles.programInsightText}>
            {evaluation.programInsight}
          </Text>
        </View>
      )}

      {/* Program Progress */}
      {programProgress && activeProgram && (
        <View style={styles.programProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.programName}>{activeProgram.name}</Text>
            <Text style={styles.progressText}>
              {getProgramProgressInsight()}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(programProgress.progressPercentage, 100)}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Weekly Trends */}
      {isConnectedToWhoop && data?.recovery && last7DaysRecovery.length > 0 && (
        <View style={styles.trendsContainer}>
          <Text style={styles.trendsTitle}>7-Day Trends</Text>
          <View style={styles.trendsRow}>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Avg Recovery</Text>
              <View style={styles.trendValue}>
                <Text style={[styles.trendNumber, { color: getRecoveryColor(avgRecovery) }]}>
                  {avgRecovery.toFixed(0)}%
                </Text>
                {getRecoveryTrend() === 'improving' && <TrendingUp size={12} color={colors.success} />}
                {getRecoveryTrend() === 'declining' && <TrendingDown size={12} color={colors.danger} />}
              </View>
            </View>
            
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Avg Strain</Text>
              <Text style={styles.trendNumber}>
                {avgStrain.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      )}
      </TouchableOpacity>

      <DetailedEvaluationModal 
        visible={showDetailedModal}
        onClose={() => setShowDetailedModal(false)}
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
    padding: 4,
    marginRight: 8,
    borderRadius: 4,
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
  recommendationsContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  recommendationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 8,
  },
  recommendationText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  programInsight: {
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  programInsightText: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  programProgress: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  programName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  trendsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 16,
  },
  trendsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  trendsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trendItem: {
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  trendValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 4,
  },
});