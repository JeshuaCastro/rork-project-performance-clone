import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  ArrowRight
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import DetailedEvaluationModal from './DetailedEvaluationModal';

interface DailyEvaluationCardProps {
  onPress?: () => void;
}

export default function DailyEvaluationCard({ onPress }: DailyEvaluationCardProps) {
  const router = useRouter();
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const { 
    data, 
    activePrograms, 
    getTodaysWorkout, 
    getProgramProgress,
    isConnectedToWhoop 
  } = useWhoopStore();

  // Get today's data
  const today = new Date().toISOString().split('T')[0];
  const todaysRecovery = data.recovery.find(item => item.date === today);
  const todaysStrain = data.strain.find(item => item.date === today);
  const todaysSleep = data.sleep.find(item => item.date === today);
  const todaysWorkout = getTodaysWorkout();

  // Calculate 7-day trends
  const last7DaysRecovery = data.recovery.slice(0, 7);
  const last7DaysStrain = data.strain.slice(0, 7);
  
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

  // Generate evaluation insights
  const generateEvaluation = () => {
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
    const strainScore = todaysStrain?.score || 0;
    const recoveryTrend = getRecoveryTrend();
    
    // High recovery (75+)
    if (recoveryScore >= 75) {
      if (todaysWorkout && todaysWorkout.intensity === 'High') {
        return {
          status: 'optimal',
          title: 'Perfect Training Day',
          message: `${recoveryScore}% recovery - ideal for high-intensity training`,
          color: colors.success,
          icon: CheckCircle,
          programInsight: 'Your body is primed for today\'s challenging workout'
        };
      } else {
        return {
          status: 'opportunity',
          title: 'High Recovery Opportunity',
          message: `${recoveryScore}% recovery - consider increasing training intensity`,
          color: colors.primary,
          icon: TrendingUp,
          programInsight: 'You could handle more training load today'
        };
      }
    }
    
    // Moderate recovery (50-74)
    else if (recoveryScore >= 50) {
      if (todaysWorkout && todaysWorkout.intensity === 'High') {
        return {
          status: 'caution',
          title: 'Moderate Recovery',
          message: `${recoveryScore}% recovery - proceed with planned training but monitor closely`,
          color: colors.warning,
          icon: Target,
          programInsight: 'Stick to your plan but listen to your body'
        };
      } else {
        return {
          status: 'balanced',
          title: 'Balanced Training Day',
          message: `${recoveryScore}% recovery - good for moderate training`,
          color: colors.primary,
          icon: Activity,
          programInsight: 'Perfect match between recovery and training intensity'
        };
      }
    }
    
    // Low recovery (<50)
    else {
      if (todaysWorkout && (todaysWorkout.intensity === 'High' || todaysWorkout.intensity === 'Medium-High')) {
        return {
          status: 'warning',
          title: 'Recovery Priority',
          message: `${recoveryScore}% recovery - consider reducing intensity or taking rest`,
          color: colors.danger,
          icon: AlertTriangle,
          programInsight: 'Your program may need adjustment for better recovery'
        };
      } else {
        return {
          status: 'recovery',
          title: 'Active Recovery Day',
          message: `${recoveryScore}% recovery - focus on light movement and recovery`,
          color: colors.warning,
          icon: Heart,
          programInsight: 'Light training aligns well with your recovery needs'
        };
      }
    }
  };

  const evaluation = generateEvaluation();
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

  return (
    <>
      <TouchableOpacity 
        style={styles.card} 
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <IconComponent size={20} color={evaluation.color} />
          <Text style={styles.title}>Daily Evaluation</Text>
        </View>
        <ArrowRight size={16} color={colors.textSecondary} />
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusTitle, { color: evaluation.color }]}>
          {evaluation.title}
        </Text>
        <Text style={styles.statusMessage}>
          {evaluation.message}
        </Text>
      </View>

      {/* Metrics Row */}
      {isConnectedToWhoop && todaysRecovery && (
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
      {isConnectedToWhoop && last7DaysRecovery.length > 0 && (
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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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