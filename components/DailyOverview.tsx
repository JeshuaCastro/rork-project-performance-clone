import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Calendar, 
  Clock, 
  Target, 
  Activity, 
  CheckCircle, 
  Play,
  TrendingUp,
  Heart,
  Zap
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWhoopStore } from '@/store/whoopStore';
import { useRouter } from 'expo-router';

interface DailyOverviewProps {
  onStartWorkout?: (workout: any) => void;
}

export default function DailyOverview({ onStartWorkout }: DailyOverviewProps) {
  const router = useRouter();
  const { 
    getTodaysWorkout, 
    activePrograms, 
    data, 
    isWorkoutCompleted,
    userProfile 
  } = useWhoopStore();

  const todaysWorkout = getTodaysWorkout();
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = today.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  });

  // Get today's recovery data
  const todaysRecovery = data.recovery.find(r => r.date === todayString);
  const todaysStrain = data.strain.find(s => s.date === todayString);

  // Check workout completion
  const [isCompleted, setIsCompleted] = React.useState(false);
  
  React.useEffect(() => {
    const checkCompletion = async () => {
      if (todaysWorkout && todaysWorkout.programId) {
        const completed = await isWorkoutCompleted(todaysWorkout.programId, todaysWorkout.title);
        setIsCompleted(completed);
      }
    };
    checkCompletion();
  }, [todaysWorkout, isWorkoutCompleted]);

  // Get workout icon based on type
  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case 'cardio':
        return <Activity size={20} color={colors.primary} />;
      case 'strength':
        return <Target size={20} color={colors.primary} />;
      case 'recovery':
        return <Heart size={20} color={colors.primary} />;
      default:
        return <Clock size={20} color={colors.primary} />;
    }
  };

  // Get intensity color
  const getIntensityColor = (intensity: string) => {
    switch (intensity?.toLowerCase()) {
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

  // Get recovery status color
  const getRecoveryColor = (score: number) => {
    if (score >= 75) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.danger;
  };

  const handleStartWorkout = () => {
    if (todaysWorkout && onStartWorkout) {
      onStartWorkout(todaysWorkout);
    } else if (todaysWorkout?.programId) {
      router.push(`/program-detail?id=${todaysWorkout.programId}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Calendar size={20} color={colors.primary} />
          <View style={styles.dateInfo}>
            <Text style={styles.dayName}>{dayName}</Text>
            <Text style={styles.dateString}>{dateString}</Text>
          </View>
        </View>
        
        {/* Recovery Score */}
        {todaysRecovery && (
          <View style={styles.recoveryContainer}>
            <View style={[
              styles.recoveryScore,
              { backgroundColor: getRecoveryColor(todaysRecovery.score) }
            ]}>
              <Text style={styles.recoveryScoreText}>{todaysRecovery.score}%</Text>
            </View>
            <Text style={styles.recoveryLabel}>Recovery</Text>
          </View>
        )}
      </View>

      {/* Today's Workout */}
      {todaysWorkout ? (
        <View style={styles.workoutSection}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
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
            
            {/* Workout Meta Info */}
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{todaysWorkout.duration}</Text>
              </View>
              
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <CheckCircle size={14} color={colors.success} />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              )}
            </View>
            
            {/* Action Button */}
            <TouchableOpacity 
              style={[
                styles.actionButton,
                isCompleted && styles.completedButton
              ]}
              onPress={handleStartWorkout}
              disabled={isCompleted}
            >
              {isCompleted ? (
                <>
                  <CheckCircle size={18} color={colors.text} />
                  <Text style={styles.actionButtonText}>Completed</Text>
                </>
              ) : (
                <>
                  <Play size={18} color={colors.text} />
                  <Text style={styles.actionButtonText}>Start Workout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : activePrograms.length > 0 ? (
        <View style={styles.restDaySection}>
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          <View style={styles.restDayCard}>
            <Heart size={24} color={colors.primary} />
            <Text style={styles.restDayTitle}>Rest Day</Text>
            <Text style={styles.restDayText}>
              No scheduled workout today. Focus on recovery and preparation for tomorrow.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noProgramSection}>
          <Text style={styles.sectionTitle}>Ready to Start?</Text>
          <View style={styles.noProgramCard}>
            <Target size={24} color={colors.primary} />
            <Text style={styles.noProgramTitle}>No Active Programs</Text>
            <Text style={styles.noProgramText}>
              Create a training program to get personalized daily workouts.
            </Text>
            <TouchableOpacity 
              style={styles.createProgramButton}
              onPress={() => router.push('/programs')}
            >
              <Text style={styles.createProgramText}>Create Program</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Daily Stats */}
      {(todaysRecovery || todaysStrain) && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Stats</Text>
          <View style={styles.statsGrid}>
            {todaysRecovery && (
              <>
                <View style={styles.statCard}>
                  <Heart size={16} color={colors.primary} />
                  <Text style={styles.statValue}>{todaysRecovery.hrvMs}ms</Text>
                  <Text style={styles.statLabel}>HRV</Text>
                </View>
                <View style={styles.statCard}>
                  <Activity size={16} color={colors.primary} />
                  <Text style={styles.statValue}>{todaysRecovery.restingHeartRate}</Text>
                  <Text style={styles.statLabel}>RHR</Text>
                </View>
              </>
            )}
            {todaysStrain && (
              <>
                <View style={styles.statCard}>
                  <Zap size={16} color={colors.primary} />
                  <Text style={styles.statValue}>{todaysStrain.score.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Strain</Text>
                </View>
                <View style={styles.statCard}>
                  <TrendingUp size={16} color={colors.primary} />
                  <Text style={styles.statValue}>{todaysStrain.calories}</Text>
                  <Text style={styles.statLabel}>Calories</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInfo: {
    marginLeft: 8,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dateString: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recoveryContainer: {
    alignItems: 'center',
  },
  recoveryScore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  recoveryScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  recoveryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  workoutSection: {
    marginBottom: 20,
  },
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    borderRadius: 12,
  },
  intensityText: {
    color: colors.text,
    fontSize: 12,
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
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  completedButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  restDaySection: {
    marginBottom: 20,
  },
  restDayCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  restDayTitle: {
    fontSize: 18,
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
  noProgramSection: {
    marginBottom: 20,
  },
  noProgramCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  noProgramTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  noProgramText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  createProgramButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createProgramText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});