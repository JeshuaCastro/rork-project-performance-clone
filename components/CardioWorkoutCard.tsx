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
  TrendingUp,
  CheckCircle
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
      {/* Header */}
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
      
      {/* Essential info only */}
      <View style={styles.metaInfoRow}>
        {workout.duration && (
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{workout.duration}</Text>
          </View>
        )}
        
        {workout.distance && (
          <View style={styles.metaItem}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{workout.distance}</Text>
          </View>
        )}
      </View>
      
      {/* Action button */}
      <TouchableOpacity 
        style={[
          styles.startWorkoutButton,
          isCompleted && styles.completedWorkoutButton
        ]}
        onPress={(e) => {
          e.stopPropagation();
          if (!isCompleted) {
            onStart();
          }
        }}
        disabled={isCompleted}
      >
        {isCompleted ? (
          <>
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={[styles.startWorkoutText, { color: '#FFFFFF' }]}>Completed</Text>
          </>
        ) : (
          <>
            <Text style={styles.startWorkoutText}>Start Cardio</Text>
            <ArrowRight size={18} color={colors.text} />
          </>
        )}
      </TouchableOpacity>
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
    borderLeftColor: '#4ECDC4',
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
    alignItems: 'center',
    marginBottom: 16,
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
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  completedWorkoutButton: {
    backgroundColor: '#22C55E',
  },
  startWorkoutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
    marginRight: 4,
  },
});