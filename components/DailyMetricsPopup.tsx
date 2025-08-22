import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import {
  Activity,
  Heart,
  Moon,
  Zap,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  X,
  AlertTriangle,
  Target
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useWhoopStore } from '@/store/whoopStore';
import { useProgramStore } from '@/store/programStore';
import { useProgramAwareWorkoutAnalysis } from '@/hooks/useProgramAwareWorkoutAnalysis';
import IOSButton from './IOSButton';
import IOSCard from './IOSCard';


interface DailyMetricsPopupProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const DailyMetricsPopup: React.FC<DailyMetricsPopupProps> = ({
  visible,
  onClose
}) => {

  const { data: whoopData, isConnectedToWhoop, getTodaysWorkout } = useWhoopStore();
  const { goals } = useProgramStore();
  const activeGoals = goals.filter(goal => {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    return targetDate >= today;
  });
  const {
    currentAdjustment,
    acceptAdjustment,
    dismissAdjustment,
    hasAdjustment
  } = useProgramAwareWorkoutAnalysis();

  // Get today's metrics
  const today = new Date().toISOString().split('T')[0];
  const todaysRecovery = whoopData.recovery.find(r => r.date === today);
  const todaysStrain = whoopData.strain.find(s => s.date === today);
  const todaysSleep = whoopData.sleep.find(s => s.date === today);
  const todaysWorkout = getTodaysWorkout();

  const getMetricColor = (value: number, type: 'recovery' | 'strain' | 'sleep' | 'hrv') => {
    switch (type) {
      case 'recovery':
        if (value >= 70) return '#4CAF50';
        if (value >= 50) return '#FF9500';
        return '#FF6B35';
      case 'strain':
        if (value <= 8) return '#4CAF50';
        if (value <= 15) return '#FF9500';
        return '#FF6B35';
      case 'sleep':
        if (value >= 85) return '#4CAF50';
        if (value >= 70) return '#FF9500';
        return '#FF6B35';
      case 'hrv':
        if (value >= 50) return '#4CAF50';
        if (value >= 30) return '#FF9500';
        return '#FF6B35';
      default:
        return '#666666';
    }
  };

  const getMetricStatus = (value: number, type: 'recovery' | 'strain' | 'sleep' | 'hrv') => {
    switch (type) {
      case 'recovery':
        if (value >= 70) return 'Excellent';
        if (value >= 50) return 'Good';
        return 'Low';
      case 'strain':
        if (value <= 8) return 'Light';
        if (value <= 15) return 'Moderate';
        return 'High';
      case 'sleep':
        if (value >= 85) return 'Excellent';
        if (value >= 70) return 'Good';
        return 'Poor';
      case 'hrv':
        if (value >= 50) return 'High';
        if (value >= 30) return 'Normal';
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  const handleAcceptAdjustment = () => {
    Alert.alert(
      'Accept Training Adjustment',
      'Your workout has been automatically adjusted based on your recovery metrics. This helps optimize your training while preventing overreaching.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            acceptAdjustment();
            onClose();
          }
        }
      ]
    );
  };

  const handleDismissAdjustment = () => {
    Alert.alert(
      'Keep Original Workout',
      'You can always manually adjust your workout intensity based on how you feel.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Keep Original',
          onPress: () => {
            dismissAdjustment();
            onClose();
          }
        }
      ]
    );
  };

  if (!isConnectedToWhoop || !todaysRecovery) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={styles.blurContainer}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateText}>
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                    <Text style={styles.title}>Daily Health Summary</Text>
                  </View>
                  <IOSButton
                    title=""
                    onPress={onClose}
                    variant="secondary"
                    style={styles.closeButton}
                    icon={<X size={20} color="#666666" />}
                  />
                </View>

                {/* Metrics Overview */}
                <IOSCard style={styles.metricsCard}>
                  <Text style={styles.sectionTitle}>Your Metrics Today</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysRecovery.score, 'recovery') + '20' }]}>
                        <Heart size={20} color={getMetricColor(todaysRecovery.score, 'recovery')} />
                      </View>
                      <Text style={styles.metricLabel}>Recovery</Text>
                      <Text style={[styles.metricValue, { color: getMetricColor(todaysRecovery.score, 'recovery') }]}>
                        {todaysRecovery.score}%
                      </Text>
                      <Text style={styles.metricStatus}>
                        {getMetricStatus(todaysRecovery.score, 'recovery')}
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysRecovery.hrvMs, 'hrv') + '20' }]}>
                        <Activity size={20} color={getMetricColor(todaysRecovery.hrvMs, 'hrv')} />
                      </View>
                      <Text style={styles.metricLabel}>HRV</Text>
                      <Text style={[styles.metricValue, { color: getMetricColor(todaysRecovery.hrvMs, 'hrv') }]}>
                        {todaysRecovery.hrvMs}ms
                      </Text>
                      <Text style={styles.metricStatus}>
                        {getMetricStatus(todaysRecovery.hrvMs, 'hrv')}
                      </Text>
                    </View>

                    {todaysSleep && (
                      <View style={styles.metricItem}>
                        <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysSleep.efficiency || 75, 'sleep') + '20' }]}>
                          <Moon size={20} color={getMetricColor(todaysSleep.efficiency || 75, 'sleep')} />
                        </View>
                        <Text style={styles.metricLabel}>Sleep</Text>
                        <Text style={[styles.metricValue, { color: getMetricColor(todaysSleep.efficiency || 75, 'sleep') }]}>
                          {todaysSleep.efficiency || 75}%
                        </Text>
                        <Text style={styles.metricStatus}>
                          {getMetricStatus(todaysSleep.efficiency || 75, 'sleep')}
                        </Text>
                      </View>
                    )}

                    {todaysStrain && (
                      <View style={styles.metricItem}>
                        <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysStrain.score, 'strain') + '20' }]}>
                          <Zap size={20} color={getMetricColor(todaysStrain.score, 'strain')} />
                        </View>
                        <Text style={styles.metricLabel}>Strain</Text>
                        <Text style={[styles.metricValue, { color: getMetricColor(todaysStrain.score, 'strain') }]}>
                          {todaysStrain.score.toFixed(1)}
                        </Text>
                        <Text style={styles.metricStatus}>
                          {getMetricStatus(todaysStrain.score, 'strain')}
                        </Text>
                      </View>
                    )}
                  </View>
                </IOSCard>

                {/* Training Adjustment */}
                {hasAdjustment && currentAdjustment && (
                  <IOSCard style={styles.adjustmentCard}>
                    <View style={styles.adjustmentHeader}>
                      <View style={styles.adjustmentIcon}>
                        {currentAdjustment.adjustmentType === 'intensity' ? (
                          currentAdjustment.adjustedWorkout.intensity < currentAdjustment.originalWorkout.intensity ? (
                            <TrendingDown size={20} color="#FF6B35" />
                          ) : (
                            <TrendingUp size={20} color="#4CAF50" />
                          )
                        ) : currentAdjustment.adjustmentType === 'skip' ? (
                          <X size={20} color="#FF6B35" />
                        ) : (
                          <AlertTriangle size={20} color="#FF9500" />
                        )}
                      </View>
                      <View style={styles.adjustmentHeaderText}>
                        <Text style={styles.adjustmentTitle}>Training Adjusted</Text>
                        <Text style={styles.adjustmentSubtitle}>
                          Based on your recovery metrics
                        </Text>
                      </View>
                    </View>

                    <View style={styles.adjustmentReason}>
                      <Text style={styles.reasonText}>{currentAdjustment.adjustmentReason}</Text>
                    </View>

                    <View style={styles.workoutComparison}>
                      <View style={styles.workoutBefore}>
                        <Text style={styles.workoutLabel}>Original</Text>
                        <Text style={styles.workoutTitle}>{currentAdjustment.originalWorkout.title}</Text>
                        <Text style={styles.workoutDetails}>
                          {currentAdjustment.originalWorkout.intensity} • {currentAdjustment.originalWorkout.duration}
                        </Text>
                      </View>
                      
                      <View style={styles.arrow}>
                        <Text style={styles.arrowText}>→</Text>
                      </View>
                      
                      <View style={styles.workoutAfter}>
                        <Text style={styles.workoutLabel}>Adjusted</Text>
                        <Text style={styles.workoutTitle}>{currentAdjustment.adjustedWorkout.title}</Text>
                        <Text style={[styles.workoutDetails, { 
                          color: currentAdjustment.adjustmentType === 'intensity' && 
                                 currentAdjustment.adjustedWorkout.intensity < currentAdjustment.originalWorkout.intensity 
                                 ? '#FF6B35' : '#4CAF50' 
                        }]}>
                          {currentAdjustment.adjustedWorkout.intensity} • {currentAdjustment.adjustedWorkout.duration}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.adjustmentActions}>
                      <IOSButton
                        title="Keep Original"
                        onPress={handleDismissAdjustment}
                        variant="secondary"
                        style={styles.adjustmentButton}
                      />
                      <IOSButton
                        title="Accept Adjustment"
                        onPress={handleAcceptAdjustment}
                        variant="primary"
                        style={styles.adjustmentButton}
                      />
                    </View>
                  </IOSCard>
                )}

                {/* Today's Workout */}
                {todaysWorkout && !hasAdjustment && (
                  <IOSCard style={styles.workoutCard}>
                    <View style={styles.workoutHeader}>
                      <View style={styles.workoutIcon}>
                        <Target size={20} color="#007AFF" />
                      </View>
                      <View>
                        <Text style={styles.workoutCardTitle}>Today's Workout</Text>
                        <Text style={styles.workoutCardSubtitle}>No adjustments needed</Text>
                      </View>
                      <View style={styles.checkIcon}>
                        <CheckCircle size={20} color="#4CAF50" />
                      </View>
                    </View>
                    <Text style={styles.workoutName}>{todaysWorkout.title}</Text>
                    <Text style={styles.workoutDescription}>
                      {todaysWorkout.intensity} intensity • {todaysWorkout.duration}
                    </Text>
                  </IOSCard>
                )}

                {/* Program Progress */}
                {activeGoals.length > 0 && (
                  <IOSCard style={styles.progressCard}>
                    <Text style={styles.sectionTitle}>Program Progress</Text>
                    {activeGoals.slice(0, 2).map((goal: any) => (
                      <View key={goal.id} style={styles.goalItem}>
                        <View style={styles.goalHeader}>
                          <Text style={styles.goalTitle}>{goal.title}</Text>
                          <Text style={styles.goalProgress}>{goal.targetValue}</Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View 
                            style={[styles.progressFill, { 
                              width: `${Math.min(100, 50)}%` 
                            }]} 
                          />
                        </View>
                      </View>
                    ))}
                  </IOSCard>
                )}

                <View style={styles.footer}>
                  <IOSButton
                    title="Got it"
                    onPress={onClose}
                    variant="primary"
                    style={styles.footerButton}
                  />
                </View>
              </ScrollView>
            </View>
          </BlurView>
        ) : (
          <View style={styles.androidModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Same content as iOS but without BlurView */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <Text style={styles.title}>Daily Health Summary</Text>
                </View>
                <IOSButton
                  title=""
                  onPress={onClose}
                  variant="secondary"
                  style={styles.closeButton}
                  icon={<X size={20} color="#666666" />}
                />
              </View>

              {/* Rest of the content - same as iOS version */}
              <IOSCard style={styles.metricsCard}>
                <Text style={styles.sectionTitle}>Your Metrics Today</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysRecovery.score, 'recovery') + '20' }]}>
                      <Heart size={20} color={getMetricColor(todaysRecovery.score, 'recovery')} />
                    </View>
                    <Text style={styles.metricLabel}>Recovery</Text>
                    <Text style={[styles.metricValue, { color: getMetricColor(todaysRecovery.score, 'recovery') }]}>
                      {todaysRecovery.score}%
                    </Text>
                    <Text style={styles.metricStatus}>
                      {getMetricStatus(todaysRecovery.score, 'recovery')}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysRecovery.hrvMs, 'hrv') + '20' }]}>
                      <Activity size={20} color={getMetricColor(todaysRecovery.hrvMs, 'hrv')} />
                    </View>
                    <Text style={styles.metricLabel}>HRV</Text>
                    <Text style={[styles.metricValue, { color: getMetricColor(todaysRecovery.hrvMs, 'hrv') }]}>
                      {todaysRecovery.hrvMs}ms
                    </Text>
                    <Text style={styles.metricStatus}>
                      {getMetricStatus(todaysRecovery.hrvMs, 'hrv')}
                    </Text>
                  </View>

                  {todaysSleep && (
                    <View style={styles.metricItem}>
                      <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysSleep.efficiency || 75, 'sleep') + '20' }]}>
                        <Moon size={20} color={getMetricColor(todaysSleep.efficiency || 75, 'sleep')} />
                      </View>
                      <Text style={styles.metricLabel}>Sleep</Text>
                      <Text style={[styles.metricValue, { color: getMetricColor(todaysSleep.efficiency || 75, 'sleep') }]}>
                        {todaysSleep.efficiency || 75}%
                      </Text>
                      <Text style={styles.metricStatus}>
                        {getMetricStatus(todaysSleep.efficiency || 75, 'sleep')}
                      </Text>
                    </View>
                  )}

                  {todaysStrain && (
                    <View style={styles.metricItem}>
                      <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysStrain.score, 'strain') + '20' }]}>
                        <Zap size={20} color={getMetricColor(todaysStrain.score, 'strain')} />
                      </View>
                      <Text style={styles.metricLabel}>Strain</Text>
                      <Text style={[styles.metricValue, { color: getMetricColor(todaysStrain.score, 'strain') }]}>
                        {todaysStrain.score.toFixed(1)}
                      </Text>
                      <Text style={styles.metricStatus}>
                        {getMetricStatus(todaysStrain.score, 'strain')}
                      </Text>
                    </View>
                  )}
                </View>
              </IOSCard>

              {hasAdjustment && currentAdjustment && (
                <IOSCard style={styles.adjustmentCard}>
                  <View style={styles.adjustmentHeader}>
                    <View style={styles.adjustmentIcon}>
                      {currentAdjustment.adjustmentType === 'intensity' ? (
                        currentAdjustment.adjustedWorkout.intensity < currentAdjustment.originalWorkout.intensity ? (
                          <TrendingDown size={20} color="#FF6B35" />
                        ) : (
                          <TrendingUp size={20} color="#4CAF50" />
                        )
                      ) : currentAdjustment.adjustmentType === 'skip' ? (
                        <X size={20} color="#FF6B35" />
                      ) : (
                        <AlertTriangle size={20} color="#FF9500" />
                      )}
                    </View>
                    <View style={styles.adjustmentHeaderText}>
                      <Text style={styles.adjustmentTitle}>Training Adjusted</Text>
                      <Text style={styles.adjustmentSubtitle}>
                        Based on your recovery metrics
                      </Text>
                    </View>
                  </View>

                  <View style={styles.adjustmentReason}>
                    <Text style={styles.reasonText}>{currentAdjustment.adjustmentReason}</Text>
                  </View>

                  <View style={styles.workoutComparison}>
                    <View style={styles.workoutBefore}>
                      <Text style={styles.workoutLabel}>Original</Text>
                      <Text style={styles.workoutTitle}>{currentAdjustment.originalWorkout.title}</Text>
                      <Text style={styles.workoutDetails}>
                        {currentAdjustment.originalWorkout.intensity} • {currentAdjustment.originalWorkout.duration}
                      </Text>
                    </View>
                    
                    <View style={styles.arrow}>
                      <Text style={styles.arrowText}>→</Text>
                    </View>
                    
                    <View style={styles.workoutAfter}>
                      <Text style={styles.workoutLabel}>Adjusted</Text>
                      <Text style={styles.workoutTitle}>{currentAdjustment.adjustedWorkout.title}</Text>
                      <Text style={[styles.workoutDetails, { 
                        color: currentAdjustment.adjustmentType === 'intensity' && 
                               currentAdjustment.adjustedWorkout.intensity < currentAdjustment.originalWorkout.intensity 
                               ? '#FF6B35' : '#4CAF50' 
                      }]}>
                        {currentAdjustment.adjustedWorkout.intensity} • {currentAdjustment.adjustedWorkout.duration}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.adjustmentActions}>
                    <IOSButton
                      title="Keep Original"
                      onPress={handleDismissAdjustment}
                      variant="secondary"
                      style={styles.adjustmentButton}
                    />
                    <IOSButton
                      title="Accept Adjustment"
                      onPress={handleAcceptAdjustment}
                      variant="primary"
                      style={styles.adjustmentButton}
                    />
                  </View>
                </IOSCard>
              )}

              {todaysWorkout && !hasAdjustment && (
                <IOSCard style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutIcon}>
                      <Target size={20} color="#007AFF" />
                    </View>
                    <View>
                      <Text style={styles.workoutCardTitle}>Today's Workout</Text>
                      <Text style={styles.workoutCardSubtitle}>No adjustments needed</Text>
                    </View>
                    <View style={styles.checkIcon}>
                      <CheckCircle size={20} color="#4CAF50" />
                    </View>
                  </View>
                  <Text style={styles.workoutName}>{todaysWorkout.title}</Text>
                  <Text style={styles.workoutDescription}>
                    {todaysWorkout.intensity} intensity • {todaysWorkout.duration}
                  </Text>
                </IOSCard>
              )}

              {activeGoals.length > 0 && (
                <IOSCard style={styles.progressCard}>
                  <Text style={styles.sectionTitle}>Program Progress</Text>
                  {activeGoals.slice(0, 2).map((goal: any) => (
                    <View key={goal.id} style={styles.goalItem}>
                      <View style={styles.goalHeader}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <Text style={styles.goalProgress}>{goal.targetValue}</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View 
                          style={[styles.progressFill, { 
                            width: `${Math.min(100, 50)}%` 
                          }]} 
                        />
                      </View>
                    </View>
                  ))}
                </IOSCard>
              )}

              <View style={styles.footer}>
                <IOSButton
                  title="Got it"
                  onPress={onClose}
                  variant="primary"
                  style={styles.footerButton}
                />
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blurContainer: {
    width: Math.min(screenWidth - 40, 400),
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
  },
  androidModalContent: {
    width: Math.min(screenWidth - 40, 400),
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  dateContainer: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  metricsCard: {
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricStatus: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
  },
  adjustmentCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  adjustmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adjustmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adjustmentHeaderText: {
    flex: 1,
  },
  adjustmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  adjustmentSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  adjustmentReason: {
    backgroundColor: '#FFF8F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  reasonText: {
    fontSize: 14,
    color: '#B8860B',
    lineHeight: 20,
  },
  workoutComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  workoutBefore: {
    flex: 1,
  },
  workoutAfter: {
    flex: 1,
  },
  arrow: {
    paddingHorizontal: 12,
  },
  arrowText: {
    fontSize: 16,
    color: '#666666',
  },
  workoutLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  workoutDetails: {
    fontSize: 12,
    color: '#666666',
  },
  adjustmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  adjustmentButton: {
    flex: 1,
  },
  workoutCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  workoutCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  workoutCardSubtitle: {
    fontSize: 13,
    color: '#4CAF50',
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666666',
  },
  progressCard: {
    marginBottom: 16,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  footer: {
    marginTop: 8,
  },
  footerButton: {
    width: '100%',
  },
});

export default DailyMetricsPopup;