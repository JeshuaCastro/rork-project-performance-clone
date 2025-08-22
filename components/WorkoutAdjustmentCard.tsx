import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { AlertTriangle, X, TrendingDown, TrendingUp, Activity } from 'lucide-react-native';
import { WorkoutAdjustment } from '@/services/programAwareDataAnalysis';
import IOSCard from './IOSCard';
import IOSButton from './IOSButton';

interface WorkoutAdjustmentCardProps {
  adjustment: WorkoutAdjustment;
  onAccept: () => void;
  onDismiss: () => void;
}

export const WorkoutAdjustmentCard: React.FC<WorkoutAdjustmentCardProps> = ({
  adjustment,
  onAccept,
  onDismiss
}) => {
  const getAdjustmentIcon = () => {
    switch (adjustment.adjustmentType) {
      case 'intensity':
        return adjustment.adjustedWorkout.intensity < adjustment.originalWorkout.intensity 
          ? <TrendingDown size={20} color="#FF6B35" />
          : <TrendingUp size={20} color="#4CAF50" />;
      case 'skip':
        return <X size={20} color="#FF6B35" />;
      case 'add_recovery':
        return <Activity size={20} color="#2196F3" />;
      default:
        return <AlertTriangle size={20} color="#FF9500" />;
    }
  };

  const getAdjustmentColor = () => {
    switch (adjustment.adjustmentType) {
      case 'intensity':
        return adjustment.adjustedWorkout.intensity < adjustment.originalWorkout.intensity 
          ? '#FF6B35' : '#4CAF50';
      case 'skip':
        return '#FF6B35';
      case 'add_recovery':
        return '#2196F3';
      default:
        return '#FF9500';
    }
  };

  const getConfidenceText = () => {
    if (adjustment.confidenceScore >= 0.8) return 'High confidence';
    if (adjustment.confidenceScore >= 0.6) return 'Medium confidence';
    return 'Low confidence';
  };

  const getConfidenceColor = () => {
    if (adjustment.confidenceScore >= 0.8) return '#4CAF50';
    if (adjustment.confidenceScore >= 0.6) return '#FF9500';
    return '#FF6B35';
  };

  const handleAccept = () => {
    Alert.alert(
      'Accept Workout Adjustment',
      'This will apply the suggested changes to your workout. You can always modify it manually later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: onAccept, style: 'default' }
      ]
    );
  };

  const handleDismiss = () => {
    Alert.alert(
      'Dismiss Adjustment',
      'This will keep your original workout unchanged.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Dismiss', onPress: onDismiss, style: 'destructive' }
      ]
    );
  };

  return (
    <IOSCard style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {getAdjustmentIcon()}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Workout Adjustment Suggested</Text>
          <View style={styles.confidenceContainer}>
            <View style={[styles.confidenceDot, { backgroundColor: getConfidenceColor() }]} />
            <Text style={[styles.confidence, { color: getConfidenceColor() }]}>
              {getConfidenceText()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.reasonContainer}>
        <Text style={styles.reasonTitle}>Why this adjustment?</Text>
        <Text style={styles.reason}>{adjustment.adjustmentReason}</Text>
      </View>

      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Your Current Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Recovery</Text>
            <Text style={[styles.metricValue, { 
              color: adjustment.whoopMetrics.recovery >= 70 ? '#4CAF50' : 
                     adjustment.whoopMetrics.recovery >= 50 ? '#FF9500' : '#FF6B35' 
            }]}>
              {adjustment.whoopMetrics.recovery}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>HRV</Text>
            <Text style={styles.metricValue}>{adjustment.whoopMetrics.hrv}ms</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Sleep</Text>
            <Text style={styles.metricValue}>{adjustment.whoopMetrics.sleepQuality}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Strain</Text>
            <Text style={styles.metricValue}>{adjustment.whoopMetrics.strain.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.comparisonContainer}>
        <View style={styles.workoutComparison}>
          <View style={styles.originalWorkout}>
            <Text style={styles.workoutLabel}>Original</Text>
            <Text style={styles.workoutTitle}>{adjustment.originalWorkout.title}</Text>
            <Text style={styles.workoutIntensity}>
              {adjustment.originalWorkout.intensity} • {adjustment.originalWorkout.duration}
            </Text>
          </View>
          
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          
          <View style={styles.adjustedWorkout}>
            <Text style={styles.workoutLabel}>Suggested</Text>
            <Text style={styles.workoutTitle}>{adjustment.adjustedWorkout.title}</Text>
            <Text style={[styles.workoutIntensity, { color: getAdjustmentColor() }]}>
              {adjustment.adjustedWorkout.intensity} • {adjustment.adjustedWorkout.duration}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <IOSButton
          title="Dismiss"
          onPress={handleDismiss}
          variant="secondary"
          style={styles.actionButton}
        />
        <IOSButton
          title="Accept Adjustment"
          onPress={handleAccept}
          variant="primary"
          style={styles.actionButton}
        />
      </View>
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  confidence: {
    fontSize: 13,
    fontWeight: '500',
  },
  reasonContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  reason: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  comparisonContainer: {
    marginBottom: 20,
  },
  workoutComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  originalWorkout: {
    flex: 1,
  },
  adjustedWorkout: {
    flex: 1,
  },
  arrow: {
    paddingHorizontal: 12,
  },
  arrowText: {
    fontSize: 18,
    color: '#666666',
  },
  workoutLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  workoutIntensity: {
    fontSize: 12,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});