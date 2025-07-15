import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { dailyStatsService, DailyStats } from '@/services/dailyStatsService';
import { colors } from '@/constants/colors';
import { 
  X, 
  Heart, 
  Activity, 
  Moon, 
  Zap, 
  Target, 
  Calendar,
  TrendingUp,
  Clock,
  Dumbbell,
  Play,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  TrendingDown,
  Minus,
  AlertCircle,
  Award
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DailyOverviewProps {
  visible: boolean;
  onClose: () => void;
}

const DAILY_OVERVIEW_SHOWN_KEY = 'daily_overview_shown';

export default function DailyOverview({ visible, onClose }: DailyOverviewProps) {
  const {
    data,
    analysis,
    isConnectedToWhoop,
    getTodaysWorkout,
    activePrograms,
    isWorkoutCompleted,
    syncWhoopData,
    isLoadingWhoopData
  } = useWhoopStore();

  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get today's date
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const todayFormatted = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  // Get today's data
  const todaysRecovery = data.recovery.find(item => item.date === todayString);
  const todaysStrain = data.strain.find(item => item.date === todayString);
  const todaysSleep = data.sleep.find(item => item.date === todayString);

  // Load daily stats when modal becomes visible
  useEffect(() => {
    const loadDailyStats = async () => {
      if (!visible) return;
      
      setIsLoading(true);
      try {
        const stats = await dailyStatsService.getDailyStats();
        setDailyStats(stats);
      } catch (error) {
        console.error('Error loading daily stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyStats();
  }, [visible, data, activePrograms]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!isConnectedToWhoop) return;
    
    setIsRefreshing(true);
    try {
      await syncWhoopData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Refresh Error', 'Failed to refresh WHOOP data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get recovery status color
  const getRecoveryColor = (score: number) => {
    if (score >= 75) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.danger;
  };

  // Get strain color
  const getStrainColor = (score: number) => {
    if (score >= 15) return colors.danger;
    if (score >= 10) return colors.warning;
    return colors.success;
  };

  // Get workout icon
  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case 'cardio':
        return <Activity size={20} color={colors.primary} />;
      case 'strength':
        return <Dumbbell size={20} color={colors.primary} />;
      case 'recovery':
        return <Heart size={20} color={colors.primary} />;
      default:
        return <Clock size={20} color={colors.primary} />;
    }
  };

  // Get intensity color
  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high':
        return colors.danger;
      case 'medium-high':
        return colors.warning;
      case 'medium':
        return colors.primary;
      case 'medium-low':
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
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
              <Calendar size={24} color={colors.primary} />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Daily Overview</Text>
                <Text style={styles.headerDate}>{todayFormatted}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={!isConnectedToWhoop || isRefreshing}
              >
                <RefreshCw 
                  size={20} 
                  color={isConnectedToWhoop ? colors.text : colors.textSecondary} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* WHOOP Metrics Section */}
            {isConnectedToWhoop ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Metrics</Text>
                
                <View style={styles.metricsGrid}>
                  {/* Recovery */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Heart size={18} color={getRecoveryColor(todaysRecovery?.score || 0)} />
                      <Text style={styles.metricLabel}>Recovery</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: getRecoveryColor(todaysRecovery?.score || 0) }]}>
                      {todaysRecovery?.score || '--'}%
                    </Text>
                    <Text style={styles.metricSubtext}>
                      HRV: {todaysRecovery?.hrvMs || '--'}ms
                    </Text>
                  </View>

                  {/* Strain */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Zap size={18} color={getStrainColor(todaysStrain?.score || 0)} />
                      <Text style={styles.metricLabel}>Strain</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: getStrainColor(todaysStrain?.score || 0) }]}>
                      {todaysStrain?.score || '--'}
                    </Text>
                    <Text style={styles.metricSubtext}>
                      {todaysStrain?.calories || '--'} cal
                    </Text>
                  </View>

                  {/* Sleep */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Moon size={18} color={colors.primary} />
                      <Text style={styles.metricLabel}>Sleep</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {todaysSleep?.efficiency || '--'}%
                    </Text>
                    <Text style={styles.metricSubtext}>
                      {todaysSleep ? `${Math.floor(todaysSleep.duration / 60)}h ${todaysSleep.duration % 60}m` : '--'}
                    </Text>
                  </View>
                </View>

                {/* AI Insights */}
                {analysis.recoveryInsight && (
                  <View style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <TrendingUp size={18} color={colors.primary} />
                      <Text style={styles.insightTitle}>Today's Insight</Text>
                    </View>
                    <Text style={styles.insightText}>{analysis.recoveryInsight}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>WHOOP Metrics</Text>
                <View style={styles.noDataCard}>
                  <Heart size={32} color={colors.textSecondary} />
                  <Text style={styles.noDataTitle}>Connect WHOOP</Text>
                  <Text style={styles.noDataText}>
                    Connect your WHOOP band to see your daily recovery, strain, and sleep metrics.
                  </Text>
                </View>
              </View>
            )}

            {/* Today's Workout Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Training</Text>
              
              {todaysWorkout ? (
                <View style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutTitleContainer}>
                      {getWorkoutIcon(todaysWorkout.type)}
                      <Text style={styles.workoutTitle} numberOfLines={1}>
                        {todaysWorkout.title}
                      </Text>
                    </View>
                    <View style={[
                      styles.intensityBadge,
                      { backgroundColor: getIntensityColor(todaysWorkout.intensity) }
                    ]}>
                      <Text style={styles.intensityText}>{todaysWorkout.intensity}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.workoutDescription} numberOfLines={2}>
                    {todaysWorkout.description}
                  </Text>
                  
                  <View style={styles.workoutMeta}>
                    <View style={styles.workoutMetaItem}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.workoutMetaText}>{todaysWorkout.duration}</Text>
                    </View>
                    
                    {isWorkoutCompletedToday && (
                      <View style={styles.completionBadge}>
                        <CheckCircle size={14} color={colors.success} />
                        <Text style={styles.completionText}>Completed</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.workoutActions}>
                    <TouchableOpacity 
                      style={[
                        styles.workoutButton,
                        isWorkoutCompletedToday && styles.completedButton
                      ]}
                      disabled={isWorkoutCompletedToday}
                    >
                      {isWorkoutCompletedToday ? (
                        <>
                          <CheckCircle size={16} color={colors.text} />
                          <Text style={styles.workoutButtonText}>Completed</Text>
                        </>
                      ) : (
                        <>
                          <Play size={16} color={colors.text} />
                          <Text style={styles.workoutButtonText}>Start Workout</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.programButton}>
                      <Text style={styles.programButtonText}>View Program</Text>
                      <ArrowRight size={14} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : activePrograms.length > 0 ? (
                <View style={styles.restDayCard}>
                  <Heart size={24} color={colors.primary} />
                  <Text style={styles.restDayTitle}>Rest Day</Text>
                  <Text style={styles.restDayText}>
                    No scheduled workout today. Focus on recovery and preparation for tomorrow's training.
                  </Text>
                </View>
              ) : (
                <View style={styles.noDataCard}>
                  <Target size={32} color={colors.textSecondary} />
                  <Text style={styles.noDataTitle}>No Active Programs</Text>
                  <Text style={styles.noDataText}>
                    Create a training program to see your daily workouts here.
                  </Text>
                </View>
              )}
            </View>

            {/* Training Recommendation */}
            {analysis.trainingRecommendation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Training Recommendation</Text>
                <View style={styles.recommendationCard}>
                  <Text style={styles.recommendationText}>
                    {analysis.trainingRecommendation}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    minHeight: SCREEN_HEIGHT * 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  insightCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  noDataCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intensityText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  workoutDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  workoutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completionText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  workoutActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  completedButton: {
    backgroundColor: colors.success,
  },
  workoutButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  programButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  programButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  restDayCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  restDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});