import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors } from '@/constants/colors';
import { Pause, Play, X, Clock } from 'lucide-react-native';
import { useWorkoutSession } from '@/store/workoutSessionStore';

interface ActiveWorkoutBaseProps {
  children: React.ReactNode;
  workoutTitle: string;
  workoutType: 'strength' | 'cardio';
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  customHeader?: React.ReactNode;
  showTimer?: boolean;
  elapsedTime?: string;
}

export default function ActiveWorkoutBase({
  children,
  workoutTitle,
  workoutType,
  onPause,
  onResume,
  onCancel,
  customHeader,
  showTimer = true,
  elapsedTime = '00:00'
}: ActiveWorkoutBaseProps) {
  const { isWorkoutPaused, pauseWorkoutSession, resumeWorkoutSession, cancelWorkoutSession } = useWorkoutSession();

  const handlePauseResume = () => {
    if (isWorkoutPaused) {
      resumeWorkoutSession();
      onResume?.();
    } else {
      pauseWorkoutSession();
      onPause?.();
    }
  };

  const handleCancel = () => {
    cancelWorkoutSession();
    onCancel?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.workoutTypeIndicator}>
            <Text style={styles.workoutTypeText}>{workoutType.toUpperCase()}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.workoutTitle} numberOfLines={1}>{workoutTitle}</Text>
            {showTimer && (
              <View style={styles.timerContainer}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={styles.timerText}>{elapsedTime}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.pauseButton]}
            onPress={handlePauseResume}
          >
            {isWorkoutPaused ? (
              <Play size={20} color="#FFFFFF" />
            ) : (
              <Pause size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancel}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Header Content */}
      {customHeader && (
        <View style={styles.customHeaderContainer}>
          {customHeader}
        </View>
      )}

      {/* Pause Overlay */}
      {isWorkoutPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseContent}>
            <Pause size={48} color={colors.primary} />
            <Text style={styles.pauseTitle}>Workout Paused</Text>
            <Text style={styles.pauseSubtitle}>Tap play to continue</Text>
          </View>
        </View>
      )}

      {/* Main Content */}
      <View style={[styles.content, isWorkoutPaused && styles.contentPaused]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.ios.separator,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutTypeIndicator: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  workoutTypeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  titleContainer: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  cancelButton: {
    backgroundColor: colors.danger,
  },
  customHeaderContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.ios.separator,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseContent: {
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 32,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pauseTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  pauseSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentPaused: {
    opacity: 0.3,
  },
});