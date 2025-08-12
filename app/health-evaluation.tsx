import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { Activity, Heart, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

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

  const hasWhoopData = data && data.recovery.length > 0 && data.strain.length > 0;


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
          icon: <CheckCircle size={24} color={colors.success} />
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
          icon: <AlertTriangle size={24} color={colors.warning} />
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
          icon: <AlertTriangle size={24} color={colors.danger} />
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
          icon: <CheckCircle size={24} color={colors.success} />
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
          icon: <AlertTriangle size={24} color={colors.warning} />
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
          icon: <AlertTriangle size={24} color={colors.warning} />
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
          icon: <TrendingUp size={24} color={colors.primary} />
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
          icon: <CheckCircle size={24} color={colors.success} />
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
              icon: <Heart size={24} color={colors.success} />
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
              icon: <AlertTriangle size={24} color={colors.warning} />
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

  if (!isConnectedToWhoop) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Health Evaluation', headerShown: true }} />
        <StatusBar style="light" />
        
        <View style={styles.emptyContainer}>
          <Activity size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>WHOOP Connection Required</Text>
          <Text style={styles.emptyText}>
            To get a comprehensive health evaluation, please connect your WHOOP account first.
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => router.push('/connect-whoop')}
          >
            <Text style={styles.connectButtonText}>Connect WHOOP</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasWhoopData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Health Evaluation', headerShown: true }} />
        <StatusBar style="light" />
        
        <View style={styles.emptyContainer}>
          <Activity size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Insufficient Data</Text>
          <Text style={styles.emptyText}>
            We need more WHOOP data to provide a comprehensive health evaluation. Please sync your data first.
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => {
              syncWhoopData();
              router.back();
            }}
          >
            <Text style={styles.connectButtonText}>Sync Data</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Health Evaluation', headerShown: true }} />
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing your health data...</Text>
          </View>
        ) : (
          <>
            {/* Overall Evaluation */}
            <View style={styles.evaluationCard}>
              <Text style={styles.evaluationTitle}>Overall Health Assessment</Text>
              <Text style={styles.evaluationText}>{evaluation}</Text>
            </View>
            
            {/* Insights */}
            <Text style={styles.sectionTitle}>Detailed Insights</Text>
            {insights.map((insight, index) => (
              <View key={index} style={[
                styles.insightCard,
                { backgroundColor: getStatusBackground(insight.status) }
              ]}>
                <View style={styles.insightHeader}>
                  {insight.icon}
                  <View style={styles.insightHeaderText}>
                    <Text style={styles.insightCategory}>{insight.category}</Text>
                    <Text style={[
                      styles.insightTitle,
                      { color: getStatusColor(insight.status) }
                    ]}>
                      {insight.title}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.insightDescription}>{insight.description}</Text>
                
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {insight.recommendations.map((rec, recIndex) => (
                  <Text key={recIndex} style={styles.recommendation}>
                    • {rec}
                  </Text>
                ))}
              </View>
            ))}
            
            {/* Refresh Button */}
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={generateHealthEvaluation}
              disabled={isLoading}
            >
              <Activity size={20} color={colors.text} />
              <Text style={styles.refreshButtonText}>Refresh Evaluation</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  connectButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  evaluationCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  evaluationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  evaluationText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  insightCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  insightCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  insightDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recommendation: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  refreshButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});