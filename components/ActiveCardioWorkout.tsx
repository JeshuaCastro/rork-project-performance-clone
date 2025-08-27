import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '@/constants/colors';
import { Activity, Play, Pause, Square, Heart, MapPin, Clock, TrendingUp } from 'lucide-react-native';
import { useWorkoutSession } from '@/store/workoutSessionStore';
import ActiveWorkoutBase from './ActiveWorkoutBase';

interface CardioMetrics {
  duration: number; // in seconds
  distance: number; // in miles/km
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  pace?: number; // minutes per mile/km
  zones?: {
    zone1: number; // seconds in each zone
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
}

interface ActiveCardioWorkoutProps {
  workoutTitle: string;
  workoutType?: 'running' | 'cycling' | 'rowing' | 'elliptical' | 'other';
  targetDuration?: number; // in minutes
  targetDistance?: number;
  targetHeartRate?: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function ActiveCardioWorkout({
  workoutTitle,
  workoutType = 'running',
  targetDuration,
  targetDistance,
  targetHeartRate,
  onComplete,
  onCancel
}: ActiveCardioWorkoutProps) {
  const { currentSession, completeWorkoutSession, updateCardioMetrics } = useWorkoutSession();

  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const [workoutDuration, setWorkoutDuration] = useState<number>(0); // in seconds
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Cardio-specific metrics
  const [metrics, setMetrics] = useState<CardioMetrics>({
    duration: 0,
    distance: 0,
    avgHeartRate: 0,
    maxHeartRate: 0,
    calories: 0,
    pace: 0
  });

  // Manual input fields
  const [currentDistance, setCurrentDistance] = useState<string>('');
  const [currentHeartRate, setCurrentHeartRate] = useState<string>('');

  const [workoutNotes, setWorkoutNotes] = useState<string>('');

  // Timer for workout duration
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      const startTime = new Date(currentSession.startTime).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  // Cardio workout timer
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setWorkoutDuration(prev => {
        const newDuration = prev + 1;
        
        // Update metrics
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          duration: newDuration
        }));

        return newDuration;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number): string => {
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePace = (distance: number, duration: number): number => {
    if (distance === 0) return 0;
    return duration / 60 / distance; // minutes per mile/km
  };

  const calculateCalories = (duration: number, heartRate: number): number => {
    // Simplified calorie calculation
    const baseRate = 10; // calories per minute base rate
    const hrMultiplier = heartRate > 0 ? heartRate / 150 : 1;
    return Math.round((duration / 60) * baseRate * hrMultiplier);
  };

  const handleStartPause = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    
    // Update final metrics
    const distance = parseFloat(currentDistance) || 0;
    const heartRate = parseInt(currentHeartRate) || 0;
    const finalPace = calculatePace(distance, workoutDuration);
    const finalCalories = calculateCalories(workoutDuration, heartRate);

    setMetrics(prev => ({
      ...prev,
      distance,
      avgHeartRate: heartRate,
      pace: finalPace,
      calories: finalCalories
    }));

    // Complete workout
    setTimeout(() => {
      completeWorkoutSession();
      onComplete?.();
    }, 1000);
  };

  const updateDistance = (distance: string) => {
    setCurrentDistance(distance);
    const distanceNum = parseFloat(distance) || 0;
    const pace = calculatePace(distanceNum, workoutDuration);
    const newMetrics = {
      distance: distanceNum,
      pace
    };
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
    updateCardioMetrics(newMetrics);
  };

  const updateHeartRate = (hr: string) => {
    setCurrentHeartRate(hr);
    const heartRate = parseInt(hr) || 0;
    const calories = calculateCalories(workoutDuration, heartRate);
    const newMetrics = {
      avgHeartRate: heartRate,
      calories
    };
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
    updateCardioMetrics(newMetrics);
  };

  if (!currentSession) {
    return (
      <ActiveWorkoutBase
        workoutTitle={workoutTitle}
        workoutType="cardio"
        elapsedTime={elapsedTime}
        onCancel={onCancel}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No active workout session</Text>
        </View>
      </ActiveWorkoutBase>
    );
  }

  const progressHeader = (
    <View style={styles.progressHeader}>
      <View style={styles.targetInfo}>
        {targetDuration && (
          <View style={styles.targetItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.targetText}>Target: {targetDuration} min</Text>
          </View>
        )}
        {targetDistance && (
          <View style={styles.targetItem}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.targetText}>Target: {targetDistance} mi</Text>
          </View>
        )}
        {targetHeartRate && (
          <View style={styles.targetItem}>
            <Heart size={14} color={colors.textSecondary} />
            <Text style={styles.targetText}>Target HR: {targetHeartRate} bpm</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ActiveWorkoutBase
      workoutTitle={workoutTitle}
      workoutType="cardio"
      elapsedTime={elapsedTime}
      customHeader={progressHeader}
      onCancel={onCancel}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Main Timer Display */}
        <View style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <Activity size={24} color={colors.primary} />
            <Text style={styles.workoutTypeText}>{workoutType.toUpperCase()}</Text>
          </View>
          
          <Text style={styles.mainTimer}>{formatTime(workoutDuration)}</Text>
          
          <View style={styles.timerControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.startPauseButton]}
              onPress={handleStartPause}
            >
              {!isActive ? (
                <Play size={24} color="#FFFFFF" />
              ) : isPaused ? (
                <Play size={24} color="#FFFFFF" />
              ) : (
                <Pause size={24} color="#FFFFFF" />
              )}
              <Text style={styles.controlButtonText}>
                {!isActive ? 'Start' : isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
            
            {isActive && (
              <TouchableOpacity 
                style={[styles.controlButton, styles.stopButton]}
                onPress={handleStop}
              >
                <Square size={20} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Finish</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Live Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Live Metrics</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <MapPin size={18} color={colors.primary} />
              <Text style={styles.metricValue}>{metrics.distance.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Miles</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Heart size={18} color={colors.danger} />
              <Text style={styles.metricValue}>{metrics.avgHeartRate || '--'}</Text>
              <Text style={styles.metricLabel}>Avg HR</Text>
            </View>
            
            <View style={styles.metricItem}>
              <TrendingUp size={18} color={colors.success} />
              <Text style={styles.metricValue}>
                {metrics.pace && metrics.pace > 0 ? formatPace(metrics.pace) : '--:--'}
              </Text>
              <Text style={styles.metricLabel}>Pace</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Activity size={18} color={colors.warning} />
              <Text style={styles.metricValue}>{metrics.calories || 0}</Text>
              <Text style={styles.metricLabel}>Calories</Text>
            </View>
          </View>
        </View>

        {/* Manual Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Update Metrics</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Distance (mi)</Text>
              <TextInput
                style={styles.input}
                value={currentDistance}
                onChangeText={updateDistance}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Heart Rate</Text>
              <TextInput
                style={styles.input}
                value={currentHeartRate}
                onChangeText={updateHeartRate}
                keyboardType="numeric"
                placeholder="--"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              placeholder="How are you feeling? Any observations?"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Progress Indicators */}
        {(targetDuration || targetDistance) && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Progress</Text>
            
            {targetDuration && (
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Duration</Text>
                  <Text style={styles.progressValue}>
                    {Math.floor(workoutDuration / 60)} / {targetDuration} min
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, (workoutDuration / 60 / targetDuration) * 100)}%` }
                    ]} 
                  />
                </View>
              </View>
            )}
            
            {targetDistance && (
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Distance</Text>
                  <Text style={styles.progressValue}>
                    {metrics.distance.toFixed(1)} / {targetDistance} mi
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, (metrics.distance / targetDistance) * 100)}%` }
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ActiveWorkoutBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressHeader: {
    padding: 16,
  },
  targetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timerCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  workoutTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
    letterSpacing: 1,
  },
  mainTimer: {
    fontSize: 48,
    fontWeight: '300' as const,
    color: colors.text,
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  startPauseButton: {
    backgroundColor: colors.success,
  },
  stopButton: {
    backgroundColor: colors.danger,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  metricsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inputCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.ios.quaternaryBackground,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});