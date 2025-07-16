import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import {
  X,
  TrendingUp,
  TrendingDown,
  Heart,
  Activity,
  Moon,
  Zap,
  Target,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyMetricsPopupProps {
  visible: boolean;
  onClose: () => void;
}

interface MetricAssessment {
  metric: string;
  value: number | string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  recommendation: string;
}

interface DailyAssessment {
  overallScore: number;
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
  metrics: MetricAssessment[];
  keyRecommendations: string[];
  focusArea: string;
}

const DAILY_POPUP_KEY = 'daily_metrics_popup_shown';

export default function DailyMetricsPopup({ visible, onClose }: DailyMetricsPopupProps) {
  const [assessment, setAssessment] = useState<DailyAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    isConnectedToWhoop,
    userProfile,
    generateAIAnalysisFromWhoopData,
    markDailyAssessmentShown
  } = useWhoopStore();

  // Generate AI-powered daily assessment
  const generateDailyAssessment = async (): Promise<void> => {
    if (!isConnectedToWhoop || !data || !data.recovery || !data.recovery.length) {
      setError('No WHOOP data available for assessment');
      return;
    }

    if (!userProfile) {
      setError('User profile not available for assessment');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const latestRecovery = data.recovery?.[0] || null;
      const latestStrain = data.strain?.[0] || null;
      const latestSleep = data.sleep?.[0] || null;

      // Calculate 7-day averages for trend analysis with null checks
      const last7Recovery = data.recovery?.slice(0, 7) || [];
      const last7Strain = data.strain?.slice(0, 7) || [];
      const last7Sleep = data.sleep?.slice(0, 7) || [];

      const avgRecovery = last7Recovery.length > 0 ? 
        last7Recovery.reduce((sum, r) => sum + (r?.score || 0), 0) / last7Recovery.length : 0;
      const avgStrain = last7Strain.length > 0 ? 
        last7Strain.reduce((sum, s) => sum + (s?.score || 0), 0) / last7Strain.length : 0;
      const avgSleep = last7Sleep.length > 0 ? 
        last7Sleep.reduce((sum, s) => sum + (s?.efficiency || 0), 0) / last7Sleep.length : 0;

      // Create assessment prompt for AI with safe property access
      const assessmentPrompt = `Analyze today's WHOOP metrics and provide personalized improvement recommendations.

USER PROFILE: ${userProfile?.age || 30}y ${userProfile?.gender || 'unknown'}, ${userProfile?.weight || 70}kg, ${userProfile?.height || 175}cm, ${userProfile?.activityLevel || 'moderate'} activity, goal: ${userProfile?.fitnessGoal || 'general fitness'}

TODAY'S METRICS:
- Recovery: ${latestRecovery?.score || 'N/A'}% (HRV: ${latestRecovery?.hrvMs || 'N/A'}ms, RHR: ${latestRecovery?.restingHeartRate || 'N/A'}bpm)
- Strain: ${latestStrain?.score || 'N/A'} (Avg HR: ${latestStrain?.averageHeartRate || 'N/A'}bpm, Max HR: ${latestStrain?.maxHeartRate || 'N/A'}bpm)
- Sleep: ${latestSleep?.efficiency || 'N/A'}% efficiency, ${latestSleep?.duration ? Math.round(latestSleep.duration / 60) : 'N/A'}h duration, ${latestSleep?.disturbances || 'N/A'} disturbances

7-DAY AVERAGES:
- Recovery: ${avgRecovery > 0 ? avgRecovery.toFixed(1) : 'N/A'}%
- Strain: ${avgStrain > 0 ? avgStrain.toFixed(1) : 'N/A'}
- Sleep: ${avgSleep > 0 ? avgSleep.toFixed(1) : 'N/A'}%

Return JSON with this exact structure:
{
  "overallScore": 85,
  "overallStatus": "good",
  "summary": "Brief overall assessment of today's metrics and readiness",
  "focusArea": "Primary area to focus on today (recovery/training/sleep)",
  "keyRecommendations": [
    "Top 3-4 specific, actionable recommendations for today",
    "Based on current metrics and trends",
    "Personalized for user's profile and goals"
  ],
  "metrics": [
    {
      "metric": "Recovery",
      "value": ${latestRecovery?.score || 0},
      "status": "good",
      "trend": "up",
      "recommendation": "Specific advice for recovery optimization"
    },
    {
      "metric": "Strain",
      "value": ${latestStrain?.score || 0},
      "status": "fair",
      "trend": "stable", 
      "recommendation": "Specific advice for strain management"
    },
    {
      "metric": "Sleep",
      "value": ${latestSleep?.efficiency || 0},
      "status": "excellent",
      "trend": "down",
      "recommendation": "Specific advice for sleep improvement"
    }
  ]
}

Status levels: excellent (90-100), good (70-89), fair (50-69), poor (<50)
Trend: up (improving), down (declining), stable (consistent)`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert WHOOP data analyst and fitness coach. Provide personalized, actionable daily assessments based on recovery, strain, and sleep metrics. Always return valid JSON only.'
            },
            {
              role: 'user',
              content: assessmentPrompt
            }
          ]
        }),
      });

      const result = await response.json();
      
      if (!result.completion) {
        throw new Error('No response from AI service');
      }

      // Parse AI response
      let assessmentData;
      try {
        const responseText = result.completion.trim();
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = responseText.substring(jsonStart, jsonEnd);
          assessmentData = JSON.parse(jsonStr);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback to manual assessment
        assessmentData = generateFallbackAssessment(latestRecovery, latestStrain, latestSleep);
      }

      // Enhance metrics with icons and colors
      const enhancedMetrics = assessmentData.metrics.map((metric: any) => ({
        ...metric,
        icon: getMetricIcon(metric.metric),
        color: getStatusColor(metric.status)
      }));

      setAssessment({
        ...assessmentData,
        metrics: enhancedMetrics
      });

    } catch (error) {
      console.error('Error generating daily assessment:', error);
      setError('Unable to generate assessment. Please try again.');
      
      // Fallback assessment with safe property access
      const latestRecovery = data?.recovery?.[0] || null;
      const latestStrain = data?.strain?.[0] || null;
      const latestSleep = data?.sleep?.[0] || null;
      const fallbackAssessment = generateFallbackAssessment(latestRecovery, latestStrain, latestSleep);
      setAssessment(fallbackAssessment);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate fallback assessment when AI fails
  const generateFallbackAssessment = (recovery: any, strain: any, sleep: any): DailyAssessment => {
    const recoveryScore = (recovery && typeof recovery.score === 'number') ? recovery.score : 50;
    const strainScore = (strain && typeof strain.score === 'number') ? strain.score : 10;
    const sleepScore = (sleep && typeof sleep.efficiency === 'number') ? sleep.efficiency : 75;

    const overallScore = Math.round((recoveryScore + (100 - strainScore * 5) + sleepScore) / 3);
    
    return {
      overallScore,
      overallStatus: overallScore >= 80 ? 'excellent' : overallScore >= 65 ? 'good' : overallScore >= 50 ? 'fair' : 'poor',
      summary: `Your overall readiness is ${overallScore >= 80 ? 'excellent' : overallScore >= 65 ? 'good' : overallScore >= 50 ? 'moderate' : 'low'} based on today's metrics.`,
      focusArea: recoveryScore < 60 ? 'recovery' : sleepScore < 70 ? 'sleep' : 'training',
      keyRecommendations: [
        recoveryScore < 60 ? 'Focus on active recovery and stress management today' : 'Your recovery looks good for moderate training',
        sleepScore < 70 ? 'Prioritize sleep quality tonight - aim for 7-9 hours' : 'Maintain your current sleep routine',
        strainScore > 15 ? 'Consider reducing training intensity to allow recovery' : 'You can handle moderate training load today',
        'Stay hydrated and maintain consistent meal timing'
      ],
      metrics: [
        {
          metric: 'Recovery',
          value: recoveryScore,
          status: recoveryScore >= 75 ? 'excellent' : recoveryScore >= 60 ? 'good' : recoveryScore >= 45 ? 'fair' : 'poor',
          trend: 'stable',
          icon: getMetricIcon('Recovery'),
          color: getStatusColor(recoveryScore >= 75 ? 'excellent' : recoveryScore >= 60 ? 'good' : recoveryScore >= 45 ? 'fair' : 'poor'),
          recommendation: recoveryScore >= 75 ? 'Great recovery! You\'re ready for intense training.' : recoveryScore >= 60 ? 'Good recovery. Moderate training is recommended.' : 'Focus on recovery activities and stress management.'
        },
        {
          metric: 'Strain',
          value: strainScore,
          status: strainScore <= 8 ? 'excellent' : strainScore <= 12 ? 'good' : strainScore <= 16 ? 'fair' : 'poor',
          trend: 'stable',
          icon: getMetricIcon('Strain'),
          color: getStatusColor(strainScore <= 8 ? 'excellent' : strainScore <= 12 ? 'good' : strainScore <= 16 ? 'fair' : 'poor'),
          recommendation: strainScore <= 8 ? 'Low strain - you can increase training intensity.' : strainScore <= 12 ? 'Moderate strain - maintain current training load.' : 'High strain - consider active recovery.'
        },
        {
          metric: 'Sleep',
          value: sleepScore,
          status: sleepScore >= 85 ? 'excellent' : sleepScore >= 75 ? 'good' : sleepScore >= 65 ? 'fair' : 'poor',
          trend: 'stable',
          icon: getMetricIcon('Sleep'),
          color: getStatusColor(sleepScore >= 85 ? 'excellent' : sleepScore >= 75 ? 'good' : sleepScore >= 65 ? 'fair' : 'poor'),
          recommendation: sleepScore >= 85 ? 'Excellent sleep quality! Keep up the routine.' : sleepScore >= 75 ? 'Good sleep. Minor optimizations could help.' : 'Focus on sleep hygiene and consistent bedtime.'
        }
      ]
    };
  };

  // Get icon for metric type
  const getMetricIcon = (metric: string) => {
    switch (metric.toLowerCase()) {
      case 'recovery':
        return <Heart size={20} color={colors.primary} />;
      case 'strain':
        return <Activity size={20} color={colors.primary} />;
      case 'sleep':
        return <Moon size={20} color={colors.primary} />;
      default:
        return <Target size={20} color={colors.primary} />;
    }
  };

  // Get color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return colors.success;
      case 'good':
        return colors.primary;
      case 'fair':
        return colors.warning;
      case 'poor':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} color={colors.success} />;
      case 'down':
        return <TrendingDown size={16} color={colors.danger} />;
      default:
        return <Target size={16} color={colors.textSecondary} />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle size={16} color={colors.success} />;
      case 'good':
        return <CheckCircle size={16} color={colors.primary} />;
      case 'fair':
        return <Info size={16} color={colors.warning} />;
      case 'poor':
        return <AlertCircle size={16} color={colors.danger} />;
      default:
        return <Info size={16} color={colors.textSecondary} />;
    }
  };

  // Generate assessment when popup becomes visible
  useEffect(() => {
    if (visible && !assessment && !isLoading) {
      generateDailyAssessment();
    }
  }, [visible]);

  // Handle close and mark as shown for today
  const handleClose = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(DAILY_POPUP_KEY, today);
    } catch (error) {
      console.error('Error saving popup shown status:', error);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <Zap size={24} color={colors.primary} />
              <Text style={styles.modalTitle}>Daily Metrics Assessment</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Analyzing your metrics...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={48} color={colors.danger} />
                <Text style={styles.errorTitle}>Assessment Unavailable</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={generateDailyAssessment}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : assessment ? (
              <View style={styles.assessmentContainer}>
                {/* Overall Score */}
                <View style={styles.overallScoreContainer}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreNumber}>{assessment.overallScore}</Text>
                    <Text style={styles.scoreLabel}>Overall</Text>
                  </View>
                  <View style={styles.overallInfo}>
                    <View style={styles.statusContainer}>
                      {getStatusIcon(assessment.overallStatus)}
                      <Text style={[styles.statusText, { color: getStatusColor(assessment.overallStatus) }]}>
                        {assessment.overallStatus.charAt(0).toUpperCase() + assessment.overallStatus.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.summaryText}>{assessment.summary}</Text>
                  </View>
                </View>

                {/* Focus Area */}
                <View style={styles.focusAreaContainer}>
                  <View style={styles.focusAreaHeader}>
                    <Target size={20} color={colors.primary} />
                    <Text style={styles.focusAreaTitle}>Today's Focus</Text>
                  </View>
                  <Text style={styles.focusAreaText}>
                    {assessment.focusArea.charAt(0).toUpperCase() + assessment.focusArea.slice(1)}
                  </Text>
                </View>

                {/* Individual Metrics */}
                <View style={styles.metricsContainer}>
                  <Text style={styles.sectionTitle}>Metric Breakdown</Text>
                  {assessment.metrics.map((metric, index) => (
                    <View key={index} style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <View style={styles.metricTitleContainer}>
                          {metric.icon}
                          <Text style={styles.metricName}>{metric.metric}</Text>
                        </View>
                        <View style={styles.metricValueContainer}>
                          <Text style={styles.metricValue}>
                            {typeof metric.value === 'number' ? 
                              (metric.metric === 'Strain' ? metric.value.toFixed(1) : `${metric.value}%`) : 
                              metric.value
                            }
                          </Text>
                          {getTrendIcon(metric.trend)}
                        </View>
                      </View>
                      <View style={styles.metricStatus}>
                        {getStatusIcon(metric.status)}
                        <Text style={[styles.metricStatusText, { color: metric.color }]}>
                          {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.metricRecommendation}>{metric.recommendation}</Text>
                    </View>
                  ))}
                </View>

                {/* Key Recommendations */}
                <View style={styles.recommendationsContainer}>
                  <View style={styles.recommendationsHeader}>
                    <Lightbulb size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Today's Action Plan</Text>
                  </View>
                  {assessment.keyRecommendations.map((recommendation, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <View style={styles.recommendationBullet} />
                      <Text style={styles.recommendationText}>{recommendation}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeFooterButton} onPress={handleClose}>
              <Text style={styles.closeFooterButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Check if popup should be shown today
export const shouldShowDailyPopup = async (): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastShown = await AsyncStorage.getItem(DAILY_POPUP_KEY);
    return lastShown !== today;
  } catch (error) {
    console.error('Error checking popup status:', error);
    return false;
  }
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  assessmentContainer: {
    padding: 20,
  },
  overallScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.text,
    marginTop: 2,
  },
  overallInfo: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  focusAreaContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  focusAreaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  focusAreaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  focusAreaText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  metricsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  metricStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  metricRecommendation: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recommendationsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  closeFooterButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});