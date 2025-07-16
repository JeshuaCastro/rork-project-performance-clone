import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import {
  X,
  Heart,
  Activity,
  Moon,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Info,
  Target,
  Zap
} from 'lucide-react-native';

interface SimpleMetricsAssessmentProps {
  visible: boolean;
  onClose: () => void;
}

export default function SimpleMetricsAssessment({ visible, onClose }: SimpleMetricsAssessmentProps) {
  const { data, isConnectedToWhoop, userProfile } = useWhoopStore();

  // Get latest metrics
  const latestRecovery = data?.recovery?.[0];
  const latestStrain = data?.strain?.[0];
  const latestSleep = data?.sleep?.[0];

  // Calculate simple scores
  const recoveryScore = latestRecovery?.score || 0;
  const strainScore = latestStrain?.score || 0;
  const sleepScore = latestSleep?.efficiency || 0;

  // Calculate overall readiness
  const overallScore = isConnectedToWhoop && data?.recovery?.length > 0 
    ? Math.round((recoveryScore + (100 - strainScore * 4) + sleepScore) / 3)
    : 70;

  // Get status based on score
  const getStatus = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: colors.success, icon: CheckCircle };
    if (score >= 65) return { text: 'Good', color: colors.primary, icon: CheckCircle };
    if (score >= 50) return { text: 'Fair', color: colors.warning, icon: Info };
    return { text: 'Poor', color: colors.danger, icon: AlertCircle };
  };

  const overallStatus = getStatus(overallScore);
  const recoveryStatus = getStatus(recoveryScore);
  const strainStatus = getStatus(strainScore <= 8 ? 90 : strainScore <= 12 ? 75 : strainScore <= 16 ? 60 : 40);
  const sleepStatus = getStatus(sleepScore);

  // Generate recommendations
  const getRecommendations = () => {
    const recommendations = [];
    
    if (!isConnectedToWhoop || !data?.recovery?.length) {
      return [
        'Connect your WHOOP device to get personalized insights',
        'Ensure your WHOOP is charged and syncing properly',
        'Check the WHOOP app for connection status',
        'Return here after connecting for detailed metrics'
      ];
    }

    if (recoveryScore < 60) {
      recommendations.push('Focus on recovery activities and stress management today');
    } else if (recoveryScore >= 75) {
      recommendations.push('Great recovery! You\'re ready for intense training');
    } else {
      recommendations.push('Good recovery - moderate training is recommended');
    }

    if (sleepScore < 70) {
      recommendations.push('Prioritize sleep quality tonight - aim for 7-9 hours');
    } else if (sleepScore >= 85) {
      recommendations.push('Excellent sleep quality! Keep up the routine');
    } else {
      recommendations.push('Maintain your current sleep routine');
    }

    if (strainScore > 15) {
      recommendations.push('Consider reducing training intensity to allow recovery');
    } else if (strainScore < 8) {
      recommendations.push('Low strain - you can increase training intensity');
    } else {
      recommendations.push('Maintain current training load');
    }

    recommendations.push('Stay hydrated and maintain consistent meal timing');

    return recommendations;
  };

  const recommendations = getRecommendations();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <Zap size={24} color={colors.primary} />
              <Text style={styles.modalTitle}>Daily Metrics Assessment</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.assessmentContainer}>
              {/* Overall Score */}
              <View style={styles.overallScoreContainer}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>{overallScore}</Text>
                  <Text style={styles.scoreLabel}>Overall</Text>
                </View>
                <View style={styles.overallInfo}>
                  <View style={styles.statusContainer}>
                    <overallStatus.icon size={16} color={overallStatus.color} />
                    <Text style={[styles.statusText, { color: overallStatus.color }]}>
                      {overallStatus.text}
                    </Text>
                  </View>
                  <Text style={styles.summaryText}>
                    {isConnectedToWhoop && data?.recovery?.length > 0
                      ? `Your overall readiness is ${overallStatus.text.toLowerCase()} based on today's metrics.`
                      : 'Connect your WHOOP device to get personalized daily assessments.'
                    }
                  </Text>
                </View>
              </View>

              {/* Focus Area */}
              <View style={styles.focusAreaContainer}>
                <View style={styles.focusAreaHeader}>
                  <Target size={20} color={colors.primary} />
                  <Text style={styles.focusAreaTitle}>Today's Focus</Text>
                </View>
                <Text style={styles.focusAreaText}>
                  {!isConnectedToWhoop || !data?.recovery?.length 
                    ? 'Data Connection'
                    : recoveryScore < 60 
                      ? 'Recovery' 
                      : sleepScore < 70 
                        ? 'Sleep' 
                        : 'Training'
                  }
                </Text>
              </View>

              {/* Individual Metrics */}
              <View style={styles.metricsContainer}>
                <Text style={styles.sectionTitle}>Metric Breakdown</Text>
                
                {/* Recovery Metric */}
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={styles.metricTitleContainer}>
                      <Heart size={20} color={colors.primary} />
                      <Text style={styles.metricName}>Recovery</Text>
                    </View>
                    <View style={styles.metricValueContainer}>
                      <Text style={styles.metricValue}>
                        {isConnectedToWhoop && data?.recovery?.length > 0 ? `${recoveryScore}%` : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metricStatus}>
                    <recoveryStatus.icon size={16} color={recoveryStatus.color} />
                    <Text style={[styles.metricStatusText, { color: recoveryStatus.color }]}>
                      {recoveryStatus.text}
                    </Text>
                  </View>
                  <Text style={styles.metricRecommendation}>
                    {isConnectedToWhoop && data?.recovery?.length > 0
                      ? recoveryScore >= 75 
                        ? 'Great recovery! You\'re ready for intense training.'
                        : recoveryScore >= 60 
                          ? 'Good recovery. Moderate training is recommended.'
                          : 'Focus on recovery activities and stress management.'
                      : 'Connect WHOOP to track your recovery metrics'
                    }
                  </Text>
                </View>

                {/* Strain Metric */}
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={styles.metricTitleContainer}>
                      <Activity size={20} color={colors.primary} />
                      <Text style={styles.metricName}>Strain</Text>
                    </View>
                    <View style={styles.metricValueContainer}>
                      <Text style={styles.metricValue}>
                        {isConnectedToWhoop && data?.strain?.length > 0 ? strainScore.toFixed(1) : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metricStatus}>
                    <strainStatus.icon size={16} color={strainStatus.color} />
                    <Text style={[styles.metricStatusText, { color: strainStatus.color }]}>
                      {strainStatus.text}
                    </Text>
                  </View>
                  <Text style={styles.metricRecommendation}>
                    {isConnectedToWhoop && data?.strain?.length > 0
                      ? strainScore <= 8 
                        ? 'Low strain - you can increase training intensity.'
                        : strainScore <= 12 
                          ? 'Moderate strain - maintain current training load.'
                          : 'High strain - consider active recovery.'
                      : 'Connect WHOOP to track your daily strain'
                    }
                  </Text>
                </View>

                {/* Sleep Metric */}
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={styles.metricTitleContainer}>
                      <Moon size={20} color={colors.primary} />
                      <Text style={styles.metricName}>Sleep</Text>
                    </View>
                    <View style={styles.metricValueContainer}>
                      <Text style={styles.metricValue}>
                        {isConnectedToWhoop && data?.sleep?.length > 0 ? `${sleepScore}%` : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metricStatus}>
                    <sleepStatus.icon size={16} color={sleepStatus.color} />
                    <Text style={[styles.metricStatusText, { color: sleepStatus.color }]}>
                      {sleepStatus.text}
                    </Text>
                  </View>
                  <Text style={styles.metricRecommendation}>
                    {isConnectedToWhoop && data?.sleep?.length > 0
                      ? sleepScore >= 85 
                        ? 'Excellent sleep quality! Keep up the routine.'
                        : sleepScore >= 75 
                          ? 'Good sleep. Minor optimizations could help.'
                          : 'Focus on sleep hygiene and consistent bedtime.'
                      : 'Connect WHOOP to track your sleep quality'
                    }
                  </Text>
                </View>
              </View>

              {/* Recommendations */}
              <View style={styles.recommendationsContainer}>
                <View style={styles.recommendationsHeader}>
                  <Zap size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Today's Action Plan</Text>
                </View>
                {recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationBullet} />
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
              <Text style={styles.closeFooterButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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