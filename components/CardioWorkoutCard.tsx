import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { 
  Activity, 
  Clock, 
  Heart, 
  ArrowRight, 
  Check, 
  Edit3, 
  Eye,
  MapPin,
  Zap,
  Target,
  Timer,
  TrendingUp
} from 'lucide-react-native';

interface CardioWorkout {
  day: string;
  title: string;
  description: string;
  intensity: string;
  adjustedForRecovery: string | null;
  type: 'cardio';
  completed?: boolean;
  duration?: string;
  distance?: string;
  targetHeartRate?: string;
  caloriesBurned?: string;
  pace?: string;
  elevation?: string;
  location?: string;
  intervals?: {
    warmup?: string;
    work?: string;
    rest?: string;
    cooldown?: string;
  };
}

interface CardioWorkoutCardProps {
  workout: CardioWorkout;
  isCompleted: boolean;
  onPress: () => void;
  onStart: () => void;
  onEdit: () => void;
}

export default function CardioWorkoutCard({ 
  workout, 
  isCompleted, 
  onPress, 
  onStart, 
  onEdit 
}: CardioWorkoutCardProps) {
  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high':
        return '#FF6B6B';
      case 'medium-high':
        return '#FFB347';
      case 'medium':
        return colors.primary;
      case 'medium-low':
      case 'low':
        return '#4ECDC4';
      default:
        return colors.textSecondary;
    }
  };

  const getIntensityIcon = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high':
        return <Zap size={14} color="#FF6B6B" />;
      case 'medium-high':
        return <TrendingUp size={14} color="#FFB347" />;
      case 'medium':
        return <Heart size={14} color={colors.primary} />;
      case 'medium-low':
      case 'low':
        return <Target size={14} color="#4ECDC4" />;
      default:
        return <Heart size={14} color={colors.textSecondary} />;
    }
  };

  const getCardioIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('run') || lowerTitle.includes('jog')) {
      return <Activity size={18} color={colors.text} />;
    } else if (lowerTitle.includes('bike') || lowerTitle.includes('cycle')) {
      return <Timer size={18} color={colors.text} />;
    } else if (lowerTitle.includes('swim')) {
      return <Activity size={18} color={colors.text} />;
    } else {
      return <Heart size={18} color={colors.text} />;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.workoutCard, isCompleted && styles.completedCard]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with cardio-specific styling */}
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTitleContainer}>
          <View style={styles.cardioIconContainer}>
            {getCardioIcon(workout.title)}
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.workoutTitle} numberOfLines={1} ellipsizeMode="tail">
              {workout.title}
            </Text>
            <Text style={styles.workoutType}>Cardio Training</Text>
          </View>
        </View>
        <View style={[
          styles.intensityBadge,
          { backgroundColor: getIntensityColor(workout.intensity) }
        ]}>
          {getIntensityIcon(workout.intensity)}
          <Text style={styles.intensityText}>{workout.intensity}</Text>
        </View>
      </View>
      
      {/* Cardio-specific metrics */}
      <View style={styles.cardioMetrics}>
        <View style={styles.metricsRow}>
          {workout.duration && (
            <View style={styles.metricItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.metricText}>{workout.duration}</Text>
            </View>
          )}
          
          {workout.distance && (
            <View style={styles.metricItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.metricText}>{workout.distance}</Text>
            </View>
          )}
          
          {workout.pace && (
            <View style={styles.metricItem}>
              <TrendingUp size={14} color={colors.textSecondary} />
              <Text style={styles.metricText}>{workout.pace}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.metricsRow}>
          {workout.targetHeartRate && (
            <View style={styles.metricItem}>
              <Heart size={14} color={colors.textSecondary} />
              <Text style={styles.metricText}>{workout.targetHeartRate} bpm</Text>
            </View>
          )}
          
          {workout.caloriesBurned && (
            <View style={styles.metricItem}>
              <Zap size={14} color={colors.textSecondary} />
              <Text style={styles.metricText}>{workout.caloriesBurned} cal</Text>
            </View>
          )}
        </View>
      </View>
      
      <Text style={styles.workoutDescription} numberOfLines={2} ellipsizeMode="tail">
        {workout.description}
      </Text>
      
      {/* Interval structure if available */}
      {workout.intervals && (
        <View style={styles.intervalsContainer}>
          <Text style={styles.intervalsTitle}>Structure:</Text>
          <View style={styles.intervalsRow}>
            {workout.intervals.warmup && (
              <Text style={styles.intervalText}>Warmup: {workout.intervals.warmup}</Text>
            )}
            {workout.intervals.work && (
              <Text style={styles.intervalText}>Work: {workout.intervals.work}</Text>
            )}
            {workout.intervals.rest && (
              <Text style={styles.intervalText}>Rest: {workout.intervals.rest}</Text>
            )}
            {workout.intervals.cooldown && (
              <Text style={styles.intervalText}>Cooldown: {workout.intervals.cooldown}</Text>
            )}
          </View>
        </View>
      )}
      
      {workout.location && (
        <View style={styles.locationContainer}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={styles.locationText}>{workout.location}</Text>
        </View>
      )}
      
      {workout.adjustedForRecovery && (
        <View style={styles.adjustmentContainer}>
          <Text style={styles.adjustmentTitle}>Recovery Adjustment:</Text>
          <Text style={styles.adjustmentText} numberOfLines={2} ellipsizeMode="tail">
            {workout.adjustedForRecovery}
          </Text>
        </View>
      )}
      
      {/* Action buttons */}
      <View style={styles.workoutButtonsRow}>
        <TouchableOpacity 
          style={[
            styles.startWorkoutButton,
            isCompleted && styles.completedWorkoutButton
          ]}
          onPress={(e) => {
            e.stopPropagation();
            isCompleted ? null : onStart();
          }}
          disabled={isCompleted}
        >
          {isCompleted ? (
            <>
              <Check size={18} color={colors.text} />
              <Text style={styles.startWorkoutText}>Completed</Text>
            </>
          ) : (
            <>
              <Text style={styles.startWorkoutText}>Start Cardio</Text>
              <ArrowRight size={18} color={colors.text} />
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.editWorkoutButton}
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit3 size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.clickHint}>
        <Eye size={14} color={colors.textSecondary} />
        <Text style={styles.clickHintText}>Tap for workout details</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4', // Cardio-specific color
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedCard: {
    opacity: 0.7,
    borderLeftColor: colors.success,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  cardioIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  workoutType: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600' as const,
  },
  intensityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  intensityText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  cardioMetrics: {
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metricText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  workoutDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  intervalsContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  intervalsTitle: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  intervalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  intervalText: {
    fontSize: 11,
    color: colors.text,
    marginRight: 12,
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  adjustmentContainer: {
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  adjustmentTitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  adjustmentText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  workoutButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  completedWorkoutButton: {
    backgroundColor: colors.success,
  },
  startWorkoutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
    marginRight: 4,
  },
  editWorkoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickHintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});