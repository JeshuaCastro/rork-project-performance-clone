import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  Activity, 
  Heart, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  X,
  Moon,
  Zap,
  Shield,
  Target,
  Brain,
  Sparkles
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';

const { height: screenHeight } = Dimensions.get('window');

interface HealthInsight {
  category: string;
  status: 'good' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  icon: React.ReactNode;
}

export default function HealthEvaluationScreen() {
  const router = useRouter();
  const { data, isConnectedToWhoop, syncWhoopData } = useWhoopStore();
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<string>('');
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [modalVisible, setModalVisible] = useState(true);

  const hasWhoopData = data && data.recovery.length > 0 && data.strain.length > 0;

  const closeModal = () => {
    setModalVisible(false);
    router.back();
  };


  const generateHealthEvaluation = useCallback(async () => {
    if (!hasWhoopData) return;

    setIsLoading(true);
    
    try {
      // Get latest data points
      const latestRecovery = data.recovery[data.recovery.length - 1];
      
      // Calculate averages for the last 7 days
      const recentRecovery = data.recovery.slice(-7);
      const recentStrain = data.strain.slice(-7);
      const recentSleep = data.sleep.slice(-7);
      
      const avgRecovery = recentRecovery.reduce((sum, r) => sum + r.score, 0) / recentRecovery.length;
      const avgStrain = recentStrain.reduce((sum, s) => sum + s.score, 0) / recentStrain.length;
      const avgSleepScore = recentSleep.reduce((sum, s) => sum + s.qualityScore, 0) / recentSleep.length;
      const avgSleepHours = recentSleep.reduce((sum, s) => sum + s.duration, 0) / recentSleep.length / 60; // Convert to hours
      
      // Generate insights based on data
      const generatedInsights: HealthInsight[] = [];
      
      // Recovery Analysis
      if (avgRecovery >= 67) {
        generatedInsights.push({
          category: 'Recovery',
          status: 'good',
          title: 'Excellent Recovery',
          description: `Your average recovery score of ${avgRecovery.toFixed(0)}% indicates your body is adapting well to training stress.`,
          recommendations: [
            'Maintain your current recovery routine',
            'Consider gradually increasing training intensity',
            'Continue prioritizing sleep and nutrition'
          ],
          icon: <Shield size={28} color={colors.success} />
        });
      } else if (avgRecovery >= 34) {
        generatedInsights.push({
          category: 'Recovery',
          status: 'warning',
          title: 'Moderate Recovery',
          description: `Your average recovery score of ${avgRecovery.toFixed(0)}% suggests room for improvement in your recovery practices.`,
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
          description: `Your average recovery score of ${avgRecovery.toFixed(0)}% indicates significant recovery debt that needs attention.`,
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
      if (avgStrain > 18) {
        generatedInsights.push({
          category: 'Training',
          status: 'warning',
          title: 'High Training Load',
          description: `Your average strain of ${avgStrain.toFixed(1)} indicates very high training stress. Monitor recovery closely.`,
          recommendations: [
            'Ensure adequate recovery between sessions',
            'Consider periodizing your training',
            'Include more low-intensity activities',
            'Monitor recovery scores daily'
          ],
          icon: <Zap size={28} color={colors.warning} />
        });
      } else if (avgStrain < 8) {
        generatedInsights.push({
          category: 'Training',
          status: 'warning',
          title: 'Low Activity Level',
          description: `Your average strain of ${avgStrain.toFixed(1)} suggests you might benefit from increased activity.`,
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
          description: `Your average strain of ${avgStrain.toFixed(1)} indicates a well-balanced training approach.`,
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
      
      setInsights(generatedInsights);
      
      // Generate overall evaluation summary
      const overallStatus = generatedInsights.some(i => i.status === 'critical') ? 'critical' :
                           generatedInsights.some(i => i.status === 'warning') ? 'warning' : 'good';
      
      let evaluationText = '';
      if (overallStatus === 'good') {
        evaluationText = 'Your health metrics show excellent balance and recovery. You\'re managing training stress well and maintaining good sleep quality. Continue your current approach while staying mindful of your body\'s signals.';
      } else if (overallStatus === 'warning') {
        evaluationText = 'Your health metrics indicate some areas for improvement. Focus on the recommendations below to optimize your recovery and performance. Small adjustments to sleep, training, or stress management can make a significant difference.';
      } else {
        evaluationText = 'Your health metrics suggest you need to prioritize recovery immediately. Your body is showing signs of significant stress or fatigue. Consider reducing training intensity and focusing heavily on sleep and stress management.';
      }
      
      setEvaluation(evaluationText);
      
    } catch (error) {
      console.error('Error generating health evaluation:', error);
      Alert.alert('Error', 'Failed to generate health evaluation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [hasWhoopData, data]);

  useEffect(() => {
    if (isConnectedToWhoop && hasWhoopData) {
      generateHealthEvaluation();
    }
  }, [isConnectedToWhoop, hasWhoopData, generateHealthEvaluation]);

  useEffect(() => {
    setModalVisible(true);
  }, []);

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

  const renderEmptyState = (title: string, description: string, buttonTitle: string, onPress: () => void, icon: React.ReactNode) => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Text>{icon}</Text>
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDescription}>{description}</Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={onPress}>
        <Text style={styles.emptyStateButtonText}>{buttonTitle}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (!isConnectedToWhoop) {
      return renderEmptyState(
        'WHOOP Connection Required',
        'To get a comprehensive health evaluation, please connect your WHOOP account first.',
        'Connect WHOOP',
        () => {
          closeModal();
          router.push('/connect-whoop');
        },
        <Activity size={48} color={colors.primary} />
      );
    }

    if (!hasWhoopData) {
      return renderEmptyState(
        'Insufficient Data',
        'We need more WHOOP data to provide a comprehensive health evaluation. Please sync your data first.',
        'Sync Data',
        () => {
          syncWhoopData();
          closeModal();
        },
        <RefreshCw size={48} color={colors.primary} />
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing your health data...</Text>
        </View>
      );
    }

    return (
      <>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerIconContainer}>
            <Activity size={32} color={colors.primary} />
          </View>
          <Text style={styles.modalTitle}>Health Analysis</Text>
          <Text style={styles.modalSubtitle}>Comprehensive wellness overview</Text>
        </View>

        {/* Overall Status */}
        <View style={styles.overallStatusContainer}>
          <View style={[
            styles.overallStatusBadge,
            { backgroundColor: getStatusBackground(insights.some(i => i.status === 'critical') ? 'critical' : insights.some(i => i.status === 'warning') ? 'warning' : 'good') }
          ]}>
            <Text style={[
              styles.overallStatusText,
              { color: getStatusColor(insights.some(i => i.status === 'critical') ? 'critical' : insights.some(i => i.status === 'warning') ? 'warning' : 'good') }
            ]}>
              {insights.some(i => i.status === 'critical') ? 'Needs Attention' : insights.some(i => i.status === 'warning') ? 'Good Progress' : 'Excellent Health'}
            </Text>
          </View>
          <Text style={styles.evaluationSummary}>{evaluation}</Text>
        </View>

        {/* Insights Grid */}
        <View style={styles.insightsGrid}>
          {insights.map((insight, index) => (
            <View key={index} style={[
              styles.insightItem,
              { borderLeftColor: getStatusColor(insight.status) }
            ]}>
              <View style={styles.insightItemHeader}>
                <View style={[
                  styles.insightIconContainer,
                  { backgroundColor: getStatusBackground(insight.status) }
                ]}>
                  {insight.icon}
                </View>
                <View style={styles.insightItemContent}>
                  <Text style={styles.insightItemCategory}>{insight.category}</Text>
                  <Text style={styles.insightItemTitle}>{insight.title}</Text>
                </View>
              </View>
              <Text style={styles.insightItemDescription}>{insight.description}</Text>
              
              {insight.recommendations.length > 0 && (
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.recommendationsHeader}>Key Actions:</Text>
                  {insight.recommendations.slice(0, 2).map((rec, recIndex) => (
                    <Text key={recIndex} style={styles.recommendationItem}>
                      • {rec}
                    </Text>
                  ))}
                  {insight.recommendations.length > 2 && (
                    <Text style={styles.moreRecommendations}>
                      +{insight.recommendations.length - 2} more recommendations
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={generateHealthEvaluation}
            disabled={isLoading}
          >
            <RefreshCw size={18} color={colors.primary} />
            <Text style={styles.refreshButtonText}>Refresh Analysis</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <StatusBar style="light" />
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {renderContent()}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 60 : 40,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: screenHeight * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ios.quaternaryBackground,
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
    backgroundColor: colors.ios.systemFill,
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
  },
  insightsGrid: {
    gap: 16,
  },
  insightItem: {
    backgroundColor: colors.ios.secondaryBackground,
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
  },
  insightItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationsContainer: {
    backgroundColor: colors.ios.tertiaryBackground,
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
    borderTopColor: colors.ios.separator,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ios.systemFill,
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
    backgroundColor: colors.ios.systemFill,
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
});