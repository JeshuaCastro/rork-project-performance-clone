import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity
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

  Calendar
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useWhoopStore } from '@/store/whoopStore';
import { useProgramStore } from '@/store/programStore';
import { useProgramAwareWorkoutAnalysis } from '@/hooks/useProgramAwareWorkoutAnalysis';
import { colors } from '@/constants/colors';
import { iosTypography, iosBorderRadius, iosSpacing, iosMargins } from '@/utils/ios-helpers';

interface DailyMetricsPopupProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
        if (value >= 70) return colors.success;
        if (value >= 50) return colors.warning;
        return colors.danger;
      case 'strain':
        if (value <= 8) return colors.success;
        if (value <= 15) return colors.warning;
        return colors.danger;
      case 'sleep':
        if (value >= 85) return colors.success;
        if (value >= 70) return colors.warning;
        return colors.danger;
      case 'hrv':
        if (value >= 50) return colors.success;
        if (value >= 30) return colors.warning;
        return colors.danger;
      default:
        return colors.textSecondary;
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
    acceptAdjustment();
    onClose();
  };

  const handleDismissAdjustment = () => {
    dismissAdjustment();
    onClose();
  };

  if (!isConnectedToWhoop || !todaysRecovery) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header with drag indicator */}
                <View style={styles.dragIndicator} />
                
                <View style={styles.header}>
                  <View style={styles.headerContent}>
                    <View style={styles.dateContainer}>
                      <Calendar size={16} color={colors.primary} />
                      <Text style={styles.dateText}>
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                    <Text style={styles.title}>Daily Health Summary</Text>
                    <Text style={styles.subtitle}>Your metrics and training adjustments</Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Metrics Overview */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Metrics Today</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysRecovery.score, 'recovery') + '20' }]}>
                        <Heart size={18} color={getMetricColor(todaysRecovery.score, 'recovery')} />
                      </View>
                      <Text style={styles.metricLabel}>Recovery</Text>
                      <Text style={[styles.metricValue, { color: getMetricColor(todaysRecovery.score, 'recovery') }]}>
                        {todaysRecovery.score}%
                      </Text>
                      <Text style={styles.metricStatus}>
                        {getMetricStatus(todaysRecovery.score, 'recovery')}
                      </Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysRecovery.hrvMs, 'hrv') + '20' }]}>
                        <Activity size={18} color={getMetricColor(todaysRecovery.hrvMs, 'hrv')} />
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
                      <View style={styles.metricCard}>
                        <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysSleep.efficiency || 75, 'sleep') + '20' }]}>
                          <Moon size={18} color={getMetricColor(todaysSleep.efficiency || 75, 'sleep')} />
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
                      <View style={styles.metricCard}>
                        <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysStrain.score, 'strain') + '20' }]}>
                          <Zap size={18} color={getMetricColor(todaysStrain.score, 'strain')} />
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
                </View>

                {/* Training Adjustment */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Training Analysis</Text>
                  {hasAdjustment && currentAdjustment ? (
                    <View style={styles.adjustmentCard}>
                      <View style={styles.adjustmentHeader}>
                        <View style={styles.adjustmentIcon}>
                          {currentAdjustment.adjustmentType === 'intensity' ? (
                            currentAdjustment.adjustedWorkout.intensity < currentAdjustment.originalWorkout.intensity ? (
                              <TrendingDown size={20} color={colors.danger} />
                            ) : (
                              <TrendingUp size={20} color={colors.success} />
                            )
                          ) : currentAdjustment.adjustmentType === 'skip' ? (
                            <X size={20} color={colors.danger} />
                          ) : (
                            <AlertTriangle size={20} color={colors.warning} />
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
                                   ? colors.danger : colors.success 
                          }]}>
                            {currentAdjustment.adjustedWorkout.intensity} • {currentAdjustment.adjustedWorkout.duration}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.adjustmentActions}>
                        <TouchableOpacity
                          style={[styles.adjustmentButton, styles.secondaryButton]}
                          onPress={handleDismissAdjustment}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.secondaryButtonText}>Keep Original</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.adjustmentButton, styles.primaryButton]}
                          onPress={handleAcceptAdjustment}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.primaryButtonText}>Accept Adjustment</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noAdjustmentCard}>
                      <View style={styles.noAdjustmentHeader}>
                        <View style={styles.noAdjustmentIcon}>
                          <CheckCircle size={20} color={colors.success} />
                        </View>
                        <View style={styles.adjustmentHeaderText}>
                          <Text style={styles.adjustmentTitle}>Training Optimized</Text>
                          <Text style={styles.adjustmentSubtitle}>
                            Your workout is well-matched to your recovery
                          </Text>
                        </View>
                      </View>

                      <View style={styles.analysisDetails}>
                        <Text style={styles.analysisText}>
                          Based on your recovery score of {todaysRecovery.score}% and HRV of {todaysRecovery.hrvMs}ms, 
                          your planned workout intensity is appropriate for today.
                        </Text>
                      </View>

                      {todaysWorkout && (
                        <View style={styles.plannedWorkout}>
                          <Text style={styles.workoutLabel}>Today&apos;s Workout</Text>
                          <Text style={styles.workoutTitle}>{todaysWorkout.title}</Text>
                          <Text style={styles.workoutDetails}>
                            {todaysWorkout.intensity} intensity • {todaysWorkout.duration}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>



                {/* Program Progress */}
                {activeGoals.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.progressCard}>
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
                    </View>
                  </View>
                )}

                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.footerButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerButtonText}>Got it</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </BlurView>
        ) : (
          <View style={styles.androidModalContent}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Same content as iOS but without BlurView */}
              <View style={styles.dragIndicator} />
              
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <View style={styles.dateContainer}>
                    <Calendar size={16} color={colors.primary} />
                    <Text style={styles.dateText}>
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <Text style={styles.title}>Daily Health Summary</Text>
                  <Text style={styles.subtitle}>Your metrics and training adjustments</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Rest of the content - same as iOS version */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Metrics Today</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysRecovery.score, 'recovery') + '20' }]}>
                      <Heart size={18} color={getMetricColor(todaysRecovery.score, 'recovery')} />
                    </View>
                    <Text style={styles.metricLabel}>Recovery</Text>
                    <Text style={[styles.metricValue, { color: getMetricColor(todaysRecovery.score, 'recovery') }]}>
                      {todaysRecovery.score}%
                    </Text>
                    <Text style={styles.metricStatus}>
                      {getMetricStatus(todaysRecovery.score, 'recovery')}
                    </Text>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysRecovery.hrvMs, 'hrv') + '20' }]}>
                      <Activity size={18} color={getMetricColor(todaysRecovery.hrvMs, 'hrv')} />
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
                    <View style={styles.metricCard}>
                      <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysSleep.efficiency || 75, 'sleep') + '20' }]}>
                        <Moon size={18} color={getMetricColor(todaysSleep.efficiency || 75, 'sleep')} />
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
                    <View style={styles.metricCard}>
                      <View style={[styles.metricIcon, { backgroundColor: getMetricColor(todaysStrain.score, 'strain') + '20' }]}>
                        <Zap size={18} color={getMetricColor(todaysStrain.score, 'strain')} />
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
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Training Analysis</Text>
                {hasAdjustment && currentAdjustment ? (
                  <View style={styles.adjustmentCard}>
                    <View style={styles.adjustmentHeader}>
                      <View style={styles.adjustmentIcon}>
                        {currentAdjustment.adjustmentType === 'intensity' ? (
                          currentAdjustment.adjustedWorkout.intensity < currentAdjustment.originalWorkout.intensity ? (
                            <TrendingDown size={20} color={colors.danger} />
                          ) : (
                            <TrendingUp size={20} color={colors.success} />
                          )
                        ) : currentAdjustment.adjustmentType === 'skip' ? (
                          <X size={20} color={colors.danger} />
                        ) : (
                          <AlertTriangle size={20} color={colors.warning} />
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
                                 ? colors.danger : colors.success 
                        }]}>
                          {currentAdjustment.adjustedWorkout.intensity} • {currentAdjustment.adjustedWorkout.duration}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.adjustmentActions}>
                      <TouchableOpacity
                        style={[styles.adjustmentButton, styles.secondaryButton]}
                        onPress={handleDismissAdjustment}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.secondaryButtonText}>Keep Original</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.adjustmentButton, styles.primaryButton]}
                        onPress={handleAcceptAdjustment}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.primaryButtonText}>Accept Adjustment</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noAdjustmentCard}>
                    <View style={styles.noAdjustmentHeader}>
                      <View style={styles.noAdjustmentIcon}>
                        <CheckCircle size={20} color={colors.success} />
                      </View>
                      <View style={styles.adjustmentHeaderText}>
                        <Text style={styles.adjustmentTitle}>Training Optimized</Text>
                        <Text style={styles.adjustmentSubtitle}>
                          Your workout is well-matched to your recovery
                        </Text>
                      </View>
                    </View>

                    <View style={styles.analysisDetails}>
                      <Text style={styles.analysisText}>
                        Based on your recovery score of {todaysRecovery.score}% and HRV of {todaysRecovery.hrvMs}ms, your planned workout intensity is appropriate for today.
                      </Text>
                    </View>

                    {todaysWorkout && (
                      <View style={styles.plannedWorkout}>
                        <Text style={styles.workoutLabel}>Today&apos;s Workout</Text>
                        <Text style={styles.workoutTitle}>{todaysWorkout.title}</Text>
                        <Text style={styles.workoutDetails}>
                          {todaysWorkout.intensity} intensity • {todaysWorkout.duration}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>



              {activeGoals.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.progressCard}>
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
                  </View>
                </View>
              )}

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.footerButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerButtonText}>Got it</Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  blurContainer: {
    width: '100%',
    maxHeight: screenHeight * 0.9,
    borderTopLeftRadius: iosBorderRadius.xlarge,
    borderTopRightRadius: iosBorderRadius.xlarge,
    overflow: 'hidden',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: iosBorderRadius.xlarge,
    borderTopRightRadius: iosBorderRadius.xlarge,
    minHeight: screenHeight * 0.5,
  },
  androidModalContent: {
    width: '100%',
    maxHeight: screenHeight * 0.9,
    backgroundColor: colors.background,
    borderTopLeftRadius: iosBorderRadius.xlarge,
    borderTopRightRadius: iosBorderRadius.xlarge,
    minHeight: screenHeight * 0.5,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: iosMargins.screen,
    marginBottom: iosSpacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: iosBorderRadius.medium,
    alignSelf: 'flex-start',
    marginBottom: iosSpacing.sm,
    gap: 6,
  },
  dateText: {
    ...iosTypography.caption1,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...iosTypography.title2,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...iosTypography.subhead,
    color: colors.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: iosMargins.screen,
    marginBottom: iosSpacing.xl,
  },
  sectionTitle: {
    ...iosTypography.headline,
    color: colors.text,
    marginBottom: iosSpacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: iosSpacing.md,
  },
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: iosBorderRadius.large,
    padding: iosMargins.cardPadding,
    width: (screenWidth - (iosMargins.screen * 2) - iosSpacing.md) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: iosSpacing.sm,
  },
  metricLabel: {
    ...iosTypography.caption1,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    ...iosTypography.title3,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricStatus: {
    ...iosTypography.caption2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  adjustmentCard: {
    backgroundColor: colors.card,
    borderRadius: iosBorderRadius.large,
    padding: iosMargins.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  adjustmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: iosSpacing.md,
  },
  adjustmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ios.quaternaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: iosSpacing.md,
  },
  adjustmentHeaderText: {
    flex: 1,
  },
  adjustmentTitle: {
    ...iosTypography.headline,
    color: colors.text,
  },
  adjustmentSubtitle: {
    ...iosTypography.subhead,
    color: colors.textSecondary,
  },
  adjustmentReason: {
    backgroundColor: colors.warning + '20',
    padding: iosSpacing.md,
    borderRadius: iosBorderRadius.medium,
    marginBottom: iosSpacing.md,
  },
  reasonText: {
    ...iosTypography.callout,
    color: colors.warning,
    lineHeight: 20,
  },
  workoutComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: iosBorderRadius.medium,
    padding: iosSpacing.md,
    marginBottom: iosSpacing.md,
  },
  workoutBefore: {
    flex: 1,
  },
  workoutAfter: {
    flex: 1,
  },
  arrow: {
    paddingHorizontal: iosSpacing.md,
  },
  arrowText: {
    ...iosTypography.callout,
    color: colors.textSecondary,
  },
  workoutLabel: {
    ...iosTypography.caption2,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  workoutTitle: {
    ...iosTypography.callout,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  workoutDetails: {
    ...iosTypography.caption1,
    color: colors.textSecondary,
  },
  adjustmentActions: {
    flexDirection: 'row',
    gap: iosSpacing.md,
  },
  adjustmentButton: {
    flex: 1,
    paddingVertical: iosSpacing.md,
    borderRadius: iosBorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ios.separator,
  },
  primaryButtonText: {
    ...iosTypography.callout,
    fontWeight: '600',
    color: colors.text,
  },
  secondaryButtonText: {
    ...iosTypography.callout,
    fontWeight: '600',
    color: colors.text,
  },
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: iosBorderRadius.large,
    padding: iosMargins.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: iosSpacing.md,
  },
  workoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: iosSpacing.md,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  workoutCardTitle: {
    ...iosTypography.headline,
    color: colors.text,
  },
  workoutCardSubtitle: {
    ...iosTypography.subhead,
    color: colors.success,
  },
  workoutName: {
    ...iosTypography.callout,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  workoutDescription: {
    ...iosTypography.subhead,
    color: colors.textSecondary,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: iosBorderRadius.large,
    padding: iosMargins.cardPadding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalItem: {
    marginBottom: iosSpacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: iosSpacing.sm,
  },
  goalTitle: {
    ...iosTypography.callout,
    fontWeight: '600',
    color: colors.text,
  },
  goalProgress: {
    ...iosTypography.callout,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.ios.quaternaryBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  footer: {
    paddingHorizontal: iosMargins.screen,
    paddingTop: iosSpacing.md,
  },
  footerButton: {
    backgroundColor: colors.primary,
    borderRadius: iosBorderRadius.medium,
    paddingVertical: iosSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  footerButtonText: {
    ...iosTypography.headline,
    color: colors.text,
    fontWeight: '600',
  },
  noAdjustmentCard: {
    backgroundColor: colors.card,
    borderRadius: iosBorderRadius.large,
    padding: iosMargins.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noAdjustmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: iosSpacing.md,
  },
  noAdjustmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: iosSpacing.md,
  },
  analysisDetails: {
    backgroundColor: colors.ios.tertiaryBackground,
    padding: iosSpacing.md,
    borderRadius: iosBorderRadius.medium,
    marginBottom: iosSpacing.md,
  },
  analysisText: {
    ...iosTypography.callout,
    color: colors.text,
    lineHeight: 20,
  },
  plannedWorkout: {
    backgroundColor: colors.ios.quaternaryBackground,
    padding: iosSpacing.md,
    borderRadius: iosBorderRadius.medium,
  },
});

export default DailyMetricsPopup;