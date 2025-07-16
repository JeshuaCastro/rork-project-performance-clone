import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { colors } from '@/constants/colors';
import { useWhoopStore } from '@/store/whoopStore';
import { 
  X,
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Battery, 
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Zap,
  Moon,
  Flame,
  Utensils,
  Pill
} from 'lucide-react-native';

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

interface DetailedEvaluationModalProps {
  visible: boolean;
  onClose: () => void;
  evaluation?: AIEvaluation;
}

export default function DetailedEvaluationModal({ visible, onClose, evaluation }: DetailedEvaluationModalProps) {
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

  // Calculate trends
  const last7DaysRecovery = data?.recovery?.slice(0, 7) || [];
  const last7DaysStrain = data?.strain?.slice(0, 7) || [];
  const last7DaysSleep = data?.sleep?.slice(0, 7) || [];

  const getRecoveryTrend = () => {
    if (last7DaysRecovery.length < 7) return { trend: 'stable', change: 0 };
    
    const recent3Days = last7DaysRecovery.slice(0, 3).reduce((sum, r) => sum + r.score, 0) / 3;
    const previous4Days = last7DaysRecovery.slice(3, 7).reduce((sum, r) => sum + r.score, 0) / 4;
    
    const change = recent3Days - previous4Days;
    
    if (change > 5) return { trend: 'improving', change };
    if (change < -5) return { trend: 'declining', change };
    return { trend: 'stable', change };
  };

  const getStrainTrend = () => {
    if (last7DaysStrain.length < 7) return { trend: 'stable', change: 0 };
    
    const recent3Days = last7DaysStrain.slice(0, 3).reduce((sum, s) => sum + s.score, 0) / 3;
    const previous4Days = last7DaysStrain.slice(3, 7).reduce((sum, s) => sum + s.score, 0) / 4;
    
    const change = recent3Days - previous4Days;
    
    if (change > 1) return { trend: 'increasing', change };
    if (change < -1) return { trend: 'decreasing', change };
    return { trend: 'stable', change };
  };

  const getSleepTrend = () => {
    if (last7DaysSleep.length < 7) return { trend: 'stable', change: 0 };
    
    const recent3Days = last7DaysSleep.slice(0, 3).reduce((sum, s) => sum + s.efficiency, 0) / 3;
    const previous4Days = last7DaysSleep.slice(3, 7).reduce((sum, s) => sum + s.efficiency, 0) / 4;
    
    const change = recent3Days - previous4Days;
    
    if (change > 3) return { trend: 'improving', change };
    if (change < -3) return { trend: 'declining', change };
    return { trend: 'stable', change };
  };

  const recoveryTrend = getRecoveryTrend();
  const strainTrend = getStrainTrend();
  const sleepTrend = getSleepTrend();

  // Generate detailed recommendations
  const generateRecommendations = () => {
    const recommendations: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }> = [];

    if (!todaysRecovery) return recommendations;

    const recoveryScore = todaysRecovery.score;
    
    // Recovery-based recommendations
    if (recoveryScore < 50) {
      recommendations.push({
        title: 'Prioritize Sleep Quality',
        description: 'Aim for 8-9 hours of sleep tonight. Consider going to bed 30 minutes earlier.',
        priority: 'high'
      });
      
      if (todaysWorkout && todaysWorkout.intensity === 'High') {
        recommendations.push({
          title: 'Modify Training Intensity',
          description: 'Consider reducing today\'s workout intensity by 20-30% or switching to active recovery.',
          priority: 'high'
        });
      }
    } else if (recoveryScore >= 75) {
      recommendations.push({
        title: 'Optimize Training Opportunity',
        description: 'Your body is ready for high-intensity training. Consider adding extra volume if planned.',
        priority: 'medium'
      });
    }

    // HRV-based recommendations
    if (todaysRecovery.hrvMs < 30) {
      recommendations.push({
        title: 'Stress Management',
        description: 'Low HRV indicates high stress. Try meditation, deep breathing, or light yoga.',
        priority: 'high'
      });
    }

    // Sleep-based recommendations
    if (todaysSleep && todaysSleep.efficiency < 80) {
      recommendations.push({
        title: 'Improve Sleep Environment',
        description: 'Poor sleep efficiency detected. Check room temperature, darkness, and noise levels.',
        priority: 'medium'
      });
    }

    // Strain-based recommendations
    if (todaysStrain && todaysStrain.score > 15) {
      recommendations.push({
        title: 'Enhanced Recovery Protocol',
        description: 'High strain detected. Focus on hydration, nutrition, and gentle stretching.',
        priority: 'medium'
      });
    }

    // Trend-based recommendations
    if (recoveryTrend.trend === 'declining') {
      recommendations.push({
        title: 'Recovery Trend Alert',
        description: 'Your recovery has been declining. Consider reducing training load for 2-3 days.',
        priority: 'high'
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();
  const activeProgram = activePrograms.find(p => p.active);
  const programProgress = activeProgram ? getProgramProgress(activeProgram.id) : null;

  if (!isConnectedToWhoop) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Evaluation</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.noDataContainer}>
              <Activity size={48} color={colors.textSecondary} />
              <Text style={styles.noDataTitle}>Connect WHOOP for Insights</Text>
              <Text style={styles.noDataText}>
                Connect your WHOOP band to get detailed daily evaluations and personalized recommendations.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Daily Evaluation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Today's Metrics */}
            {todaysRecovery && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Metrics</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Battery size={20} color={colors.success} />
                    <Text style={styles.metricLabel}>Recovery</Text>
                    <Text style={[styles.metricValue, { color: getRecoveryColor(todaysRecovery.score) }]}>
                      {todaysRecovery.score}%
                    </Text>
                    <Text style={styles.metricStatus}>{getRecoveryStatus(todaysRecovery.score)}</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Heart size={20} color={colors.primary} />
                    <Text style={styles.metricLabel}>HRV</Text>
                    <Text style={styles.metricValue}>{todaysRecovery.hrvMs}ms</Text>
                    <Text style={styles.metricStatus}>
                      {todaysRecovery.hrvMs > 50 ? 'Good' : todaysRecovery.hrvMs > 30 ? 'Fair' : 'Low'}
                    </Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Activity size={20} color={colors.warning} />
                    <Text style={styles.metricLabel}>Strain</Text>
                    <Text style={styles.metricValue}>
                      {todaysStrain?.score.toFixed(1) || '0.0'}
                    </Text>
                    <Text style={styles.metricStatus}>
                      {(todaysStrain?.score || 0) > 15 ? 'High' : (todaysStrain?.score || 0) > 10 ? 'Moderate' : 'Low'}
                    </Text>
                  </View>

                  {todaysSleep && (
                    <View style={styles.metricCard}>
                      <Moon size={20} color={colors.textSecondary} />
                      <Text style={styles.metricLabel}>Sleep</Text>
                      <Text style={styles.metricValue}>{todaysSleep.efficiency}%</Text>
                      <Text style={styles.metricStatus}>
                        {todaysSleep.efficiency > 85 ? 'Excellent' : todaysSleep.efficiency > 75 ? 'Good' : 'Poor'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 7-Day Trends */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7-Day Trends</Text>
              <View style={styles.trendsContainer}>
                <View style={styles.trendItem}>
                  <View style={styles.trendHeader}>
                    <Battery size={16} color={colors.success} />
                    <Text style={styles.trendLabel}>Recovery</Text>
                    {recoveryTrend.trend === 'improving' && <TrendingUp size={16} color={colors.success} />}
                    {recoveryTrend.trend === 'declining' && <TrendingDown size={16} color={colors.danger} />}
                  </View>
                  <Text style={styles.trendDescription}>
                    {recoveryTrend.trend === 'improving' ? 'Improving' : 
                     recoveryTrend.trend === 'declining' ? 'Declining' : 'Stable'} 
                    {recoveryTrend.change !== 0 && ` (${recoveryTrend.change > 0 ? '+' : ''}${recoveryTrend.change.toFixed(1)}%)`}
                  </Text>
                </View>

                <View style={styles.trendItem}>
                  <View style={styles.trendHeader}>
                    <Activity size={16} color={colors.warning} />
                    <Text style={styles.trendLabel}>Strain</Text>
                    {strainTrend.trend === 'increasing' && <TrendingUp size={16} color={colors.warning} />}
                    {strainTrend.trend === 'decreasing' && <TrendingDown size={16} color={colors.success} />}
                  </View>
                  <Text style={styles.trendDescription}>
                    {strainTrend.trend === 'increasing' ? 'Increasing' : 
                     strainTrend.trend === 'decreasing' ? 'Decreasing' : 'Stable'}
                    {strainTrend.change !== 0 && ` (${strainTrend.change > 0 ? '+' : ''}${strainTrend.change.toFixed(1)})`}
                  </Text>
                </View>

                {todaysSleep && (
                  <View style={styles.trendItem}>
                    <View style={styles.trendHeader}>
                      <Moon size={16} color={colors.textSecondary} />
                      <Text style={styles.trendLabel}>Sleep</Text>
                      {sleepTrend.trend === 'improving' && <TrendingUp size={16} color={colors.success} />}
                      {sleepTrend.trend === 'declining' && <TrendingDown size={16} color={colors.danger} />}
                    </View>
                    <Text style={styles.trendDescription}>
                      {sleepTrend.trend === 'improving' ? 'Improving' : 
                       sleepTrend.trend === 'declining' ? 'Declining' : 'Stable'}
                      {sleepTrend.change !== 0 && ` (${sleepTrend.change > 0 ? '+' : ''}${sleepTrend.change.toFixed(1)}%)`}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Program Integration */}
            {todaysWorkout && activeProgram && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Training Alignment</Text>
                <View style={styles.workoutAlignment}>
                  <View style={styles.workoutInfo}>
                    <Target size={20} color={colors.primary} />
                    <View style={styles.workoutDetails}>
                      <Text style={styles.workoutTitle}>{todaysWorkout.title}</Text>
                      <Text style={styles.workoutIntensity}>
                        {todaysWorkout.intensity} intensity • {todaysWorkout.duration}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.alignmentStatus}>
                    {getAlignmentStatus(todaysRecovery?.score || 0, todaysWorkout.intensity)}
                  </View>
                </View>

                {programProgress && (
                  <View style={styles.programProgressDetail}>
                    <Text style={styles.programName}>{activeProgram.name}</Text>
                    <Text style={styles.progressDetail}>
                      Week {programProgress.currentWeek} of {programProgress.totalWeeks} • 
                      {programProgress.progressPercentage.toFixed(0)}% complete
                    </Text>
                    {programProgress.daysUntilGoal && (
                      <Text style={styles.goalCountdown}>
                        {programProgress.daysUntilGoal} days until goal
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* AI Evaluation Details */}
            {evaluation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI Analysis</Text>
                <View style={styles.evaluationCard}>
                  <View style={styles.evaluationHeader}>
                    <evaluation.icon size={20} color={evaluation.color} />
                    <Text style={[styles.evaluationTitle, { color: evaluation.color }]}>
                      {evaluation.title}
                    </Text>
                    {evaluation.confidenceScore && (
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>{evaluation.confidenceScore}%</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.evaluationMessage}>{evaluation.message}</Text>
                  
                  {evaluation.trendAnalysis && (
                    <View style={styles.trendAnalysisContainer}>
                      <TrendingUp size={14} color={colors.primary} />
                      <Text style={styles.trendAnalysisText}>{evaluation.trendAnalysis}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Actionable Steps */}
            {evaluation?.actionableSteps && evaluation.actionableSteps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Action Plan</Text>
                {evaluation.actionableSteps.map((step, index) => (
                  <View key={index} style={[styles.actionStepCard, { 
                    borderLeftColor: step.priority === 'high' ? colors.danger : 
                                   step.priority === 'medium' ? colors.warning : colors.success 
                  }]}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepCategory}>{step.category.toUpperCase()}</Text>
                      <View style={[styles.priorityBadge, { 
                        backgroundColor: step.priority === 'high' ? 'rgba(244, 67, 54, 0.2)' : 
                                       step.priority === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(76, 175, 80, 0.2)' 
                      }]}>
                        <Text style={[styles.priorityText, { 
                          color: step.priority === 'high' ? colors.danger : 
                               step.priority === 'medium' ? colors.warning : colors.success 
                        }]}>
                          {step.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.stepAction}>{step.action}</Text>
                    <Text style={styles.stepReason}>{step.reason}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Nutrition Advice */}
            {evaluation?.nutritionAdvice && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nutrition Guidance</Text>
                <View style={styles.nutritionCard}>
                  {evaluation.nutritionAdvice.calorieGuidance && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                      <Text style={styles.nutritionText}>{evaluation.nutritionAdvice.calorieGuidance}</Text>
                    </View>
                  )}
                  {evaluation.nutritionAdvice.proteinFocus && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                      <Text style={styles.nutritionText}>{evaluation.nutritionAdvice.proteinFocus}</Text>
                    </View>
                  )}
                  {evaluation.nutritionAdvice.hydrationTarget && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Hydration</Text>
                      <Text style={styles.nutritionText}>{evaluation.nutritionAdvice.hydrationTarget}</Text>
                    </View>
                  )}
                  {evaluation.nutritionAdvice.mealTiming && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Meal Timing</Text>
                      <Text style={styles.nutritionText}>{evaluation.nutritionAdvice.mealTiming}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Supplement Suggestions */}
            {evaluation?.supplementSuggestions && evaluation.supplementSuggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Supplement Support</Text>
                <View style={styles.supplementCard}>
                  {evaluation.supplementSuggestions.map((supplement, index) => (
                    <View key={index} style={styles.supplementItem}>
                      <View style={styles.supplementDot} />
                      <Text style={styles.supplementText}>{supplement}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Program Insight */}
            {evaluation?.programInsight && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Training Program Insight</Text>
                <View style={styles.programInsightCard}>
                  <Text style={styles.programInsightText}>{evaluation.programInsight}</Text>
                </View>
              </View>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Recommendations</Text>
                {recommendations.map((rec, index) => (
                  <View key={index} style={[styles.recommendationCard, { 
                    borderLeftColor: rec.priority === 'high' ? colors.danger : 
                                   rec.priority === 'medium' ? colors.warning : colors.success 
                  }]}>
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Helper functions
const getRecoveryColor = (score: number): string => {
  if (score >= 75) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
};

const getRecoveryStatus = (score: number): string => {
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Good';
  return 'Poor';
};

const getAlignmentStatus = (recoveryScore: number, intensity: string) => {
  const isHighIntensity = intensity === 'High' || intensity === 'Medium-High';
  
  if (recoveryScore >= 75 && isHighIntensity) {
    return (
      <View style={[styles.alignmentBadge, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
        <CheckCircle size={16} color={colors.success} />
        <Text style={[styles.alignmentText, { color: colors.success }]}>Perfect Match</Text>
      </View>
    );
  } else if (recoveryScore < 50 && isHighIntensity) {
    return (
      <View style={[styles.alignmentBadge, { backgroundColor: 'rgba(244, 67, 54, 0.2)' }]}>
        <AlertTriangle size={16} color={colors.danger} />
        <Text style={[styles.alignmentText, { color: colors.danger }]}>Misaligned</Text>
      </View>
    );
  } else {
    return (
      <View style={[styles.alignmentBadge, { backgroundColor: 'rgba(93, 95, 239, 0.2)' }]}>
        <Target size={16} color={colors.primary} />
        <Text style={[styles.alignmentText, { color: colors.primary }]}>Good Match</Text>
      </View>
    );
  }
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  metricStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  trendsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendItem: {
    marginBottom: 16,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    marginRight: 8,
  },
  trendDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 24,
  },
  workoutAlignment: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutDetails: {
    marginLeft: 12,
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  workoutIntensity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  alignmentStatus: {
    alignItems: 'flex-end',
  },
  alignmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  alignmentText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  programProgressDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  programName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  progressDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  goalCountdown: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  recommendationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // AI Evaluation Styles
  evaluationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evaluationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  evaluationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
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
  confidenceBadge: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  // Action Steps Styles
  actionStepCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  stepAction: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  stepReason: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // Nutrition Styles
  nutritionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionItem: {
    marginBottom: 12,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  // Supplement Styles
  supplementCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  supplementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
    marginTop: 6,
    marginRight: 12,
  },
  supplementText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  // Program Insight Styles
  programInsightCard: {
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(93, 95, 239, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  programInsightText: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});