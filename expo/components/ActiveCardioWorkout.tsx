import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '@/constants/colors';
import { Activity, Play, Pause, Square, Heart, MapPin, Clock, TrendingUp, Zap, Timer, Target, BarChart3 } from 'lucide-react-native';
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
  const [effortLevel, setEffortLevel] = useState<number>(5); // 1-10 scale for cardio effort
  const [intervalTimer, setIntervalTimer] = useState<number>(0);
  const [isIntervalActive, setIsIntervalActive] = useState<boolean>(false);
  const [currentInterval, setCurrentInterval] = useState<number>(1);
  const [totalIntervals, setTotalIntervals] = useState<number>(1);
  const [heartRateZone, setHeartRateZone] = useState<number>(1); // 1-5 zones
  const [structuredWorkout, setStructuredWorkout] = useState<boolean>(false);
  const [workoutPhase, setWorkoutPhase] = useState<'warmup' | 'work' | 'rest' | 'cooldown'>('warmup');
  const [phaseTimer, setPhaseTimer] = useState<number>(0);
  const [workoutPlan, setWorkoutPlan] = useState<Array<{phase: string, duration: number}>>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);

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

  const getHeartRateZone = (heartRate: number): number => {
    // Simplified HR zones (assuming max HR of 190)
    const maxHR = 190;
    const percentage = (heartRate / maxHR) * 100;
    
    if (percentage < 60) return 1; // Recovery
    if (percentage < 70) return 2; // Aerobic Base
    if (percentage < 80) return 3; // Aerobic
    if (percentage < 90) return 4; // Lactate Threshold
    return 5; // VO2 Max
  };

  const getZoneColor = (zone: number): string => {
    const zoneColors = {
      1: '#34C759', // Green - Recovery
      2: '#32D74B', // Light Green - Aerobic Base
      3: '#FFD60A', // Yellow - Aerobic
      4: '#FF9F0A', // Orange - Lactate Threshold
      5: '#FF453A'  // Red - VO2 Max
    };
    return zoneColors[zone as keyof typeof zoneColors] || '#34C759';
  };

  const getZoneName = (zone: number): string => {
    const zoneNames = {
      1: 'Recovery',
      2: 'Base',
      3: 'Aerobic',
      4: 'Threshold',
      5: 'VO2 Max'
    };
    return zoneNames[zone as keyof typeof zoneNames] || 'Recovery';
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
    const zone = getHeartRateZone(heartRate);
    setHeartRateZone(zone);
    
    const newMetrics = {
      avgHeartRate: heartRate,
      maxHeartRate: Math.max(metrics.maxHeartRate || 0, heartRate),
      calories
    };
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
    updateCardioMetrics(newMetrics);
  };

  const startInterval = (duration: number) => {
    setIntervalTimer(duration);
    setIsIntervalActive(true);
  };

  const stopInterval = () => {
    setIsIntervalActive(false);
    setIntervalTimer(0);
  };

  // Interval timer
  useEffect(() => {
    if (!isIntervalActive || intervalTimer <= 0) return;

    const interval = setInterval(() => {
      setIntervalTimer(prev => {
        if (prev <= 1) {
          setIsIntervalActive(false);
          // Auto-advance to next interval
          if (currentInterval < totalIntervals) {
            setCurrentInterval(prev => prev + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isIntervalActive, intervalTimer, currentInterval, totalIntervals]);

  // Structured workout phase timer
  useEffect(() => {
    if (!structuredWorkout || phaseTimer <= 0) return;

    const interval = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) {
          // Auto-advance to next phase
          if (currentPhaseIndex < workoutPlan.length - 1) {
            const nextPhaseIndex = currentPhaseIndex + 1;
            setCurrentPhaseIndex(nextPhaseIndex);
            return workoutPlan[nextPhaseIndex].duration;
          } else {
            // Workout complete
            setStructuredWorkout(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [structuredWorkout, phaseTimer, currentPhaseIndex, workoutPlan]);

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

        {/* Heart Rate Zone Display */}
        {metrics.avgHeartRate && metrics.avgHeartRate > 0 && (
          <View style={styles.heartRateZoneCard}>
            <View style={styles.zoneHeader}>
              <Heart size={20} color={getZoneColor(heartRateZone)} />
              <Text style={styles.zoneTitle}>Heart Rate Zone</Text>
            </View>
            <View style={styles.zoneDisplay}>
              <Text style={[styles.zoneNumber, { color: getZoneColor(heartRateZone) }]}>
                Zone {heartRateZone}
              </Text>
              <Text style={styles.zoneName}>{getZoneName(heartRateZone)}</Text>
              <Text style={styles.zoneHeartRate}>{metrics.avgHeartRate} bpm</Text>
            </View>
            <View style={styles.zoneBar}>
              {[1, 2, 3, 4, 5].map(zone => (
                <View 
                  key={zone}
                  style={[
                    styles.zoneSegment,
                    { 
                      backgroundColor: zone <= heartRateZone ? getZoneColor(zone) : colors.ios.quaternaryBackground,
                      opacity: zone <= heartRateZone ? 1 : 0.3
                    }
                  ]} 
                />
              ))}
            </View>
          </View>
        )}

        {/* Structured Workout Phase */}
        {structuredWorkout && workoutPlan.length > 0 && (
          <View style={styles.structuredWorkoutCard}>
            <View style={styles.structuredWorkoutHeader}>
              <Timer size={20} color={colors.primary} />
              <Text style={styles.structuredWorkoutTitle}>
                {workoutPlan[currentPhaseIndex]?.phase.toUpperCase()} PHASE
              </Text>
              <Text style={styles.structuredWorkoutProgress}>
                {currentPhaseIndex + 1}/{workoutPlan.length}
              </Text>
            </View>
            <Text style={styles.structuredWorkoutTimer}>{formatTime(phaseTimer)}</Text>
            <View style={styles.structuredWorkoutControls}>
              <TouchableOpacity 
                style={styles.skipPhaseButton} 
                onPress={() => {
                  if (currentPhaseIndex < workoutPlan.length - 1) {
                    setCurrentPhaseIndex(prev => prev + 1);
                    setPhaseTimer(workoutPlan[currentPhaseIndex + 1].duration);
                  } else {
                    setStructuredWorkout(false);
                  }
                }}
              >
                <Text style={styles.skipPhaseText}>Next Phase</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopStructuredButton} onPress={() => setStructuredWorkout(false)}>
                <Text style={styles.stopStructuredText}>Stop Structured</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Interval Timer */}
        {isIntervalActive && !structuredWorkout && (
          <View style={styles.intervalCard}>
            <View style={styles.intervalHeader}>
              <Timer size={20} color={colors.primary} />
              <Text style={styles.intervalTitle}>Interval {currentInterval}/{totalIntervals}</Text>
            </View>
            <Text style={styles.intervalTimer}>{formatTime(intervalTimer)}</Text>
            <TouchableOpacity style={styles.stopIntervalButton} onPress={stopInterval}>
              <Text style={styles.stopIntervalText}>Stop Interval</Text>
            </TouchableOpacity>
          </View>
        )}

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
              <Heart size={18} color={getZoneColor(heartRateZone)} />
              <Text style={styles.metricValue}>{metrics.avgHeartRate || '--'}</Text>
              <Text style={styles.metricLabel}>Current HR</Text>
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

          {/* Additional Metrics Row */}
          <View style={styles.additionalMetrics}>
            <View style={styles.additionalMetricItem}>
              <BarChart3 size={16} color={colors.textSecondary} />
              <Text style={styles.additionalMetricLabel}>Max HR</Text>
              <Text style={styles.additionalMetricValue}>{metrics.maxHeartRate || '--'}</Text>
            </View>
            <View style={styles.additionalMetricItem}>
              <Zap size={16} color={colors.textSecondary} />
              <Text style={styles.additionalMetricLabel}>Effort</Text>
              <Text style={styles.additionalMetricValue}>{effortLevel}/10</Text>
            </View>
          </View>
        </View>

        {/* Structured Workout Templates */}
        {!isIntervalActive && !structuredWorkout && (
          <View style={styles.structuredWorkoutTemplatesCard}>
            <Text style={styles.structuredWorkoutTemplatesTitle}>Structured Workouts</Text>
            <View style={styles.structuredWorkoutTemplatesGrid}>
              <TouchableOpacity 
                style={styles.structuredWorkoutTemplate}
                onPress={() => {
                  const plan = [
                    { phase: 'Warm-up', duration: 300 }, // 5 min
                    { phase: 'Work', duration: 1200 }, // 20 min
                    { phase: 'Cool-down', duration: 300 } // 5 min
                  ];
                  setWorkoutPlan(plan);
                  setCurrentPhaseIndex(0);
                  setPhaseTimer(plan[0].duration);
                  setStructuredWorkout(true);
                }}
              >
                <Text style={styles.structuredWorkoutTemplateName}>Easy Run</Text>
                <Text style={styles.structuredWorkoutTemplateDesc}>30min • Steady pace</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.structuredWorkoutTemplate}
                onPress={() => {
                  const plan = [
                    { phase: 'Warm-up', duration: 600 }, // 10 min
                    { phase: 'Work', duration: 240 }, // 4 min
                    { phase: 'Rest', duration: 120 }, // 2 min
                    { phase: 'Work', duration: 240 }, // 4 min
                    { phase: 'Rest', duration: 120 }, // 2 min
                    { phase: 'Work', duration: 240 }, // 4 min
                    { phase: 'Cool-down', duration: 600 } // 10 min
                  ];
                  setWorkoutPlan(plan);
                  setCurrentPhaseIndex(0);
                  setPhaseTimer(plan[0].duration);
                  setStructuredWorkout(true);
                }}
              >
                <Text style={styles.structuredWorkoutTemplateName}>Intervals</Text>
                <Text style={styles.structuredWorkoutTemplateDesc}>32min • 3×4min work</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.structuredWorkoutTemplate}
                onPress={() => {
                  const plan = [
                    { phase: 'Warm-up', duration: 900 }, // 15 min
                    { phase: 'Work', duration: 1200 }, // 20 min threshold
                    { phase: 'Cool-down', duration: 300 } // 5 min
                  ];
                  setWorkoutPlan(plan);
                  setCurrentPhaseIndex(0);
                  setPhaseTimer(plan[0].duration);
                  setStructuredWorkout(true);
                }}
              >
                <Text style={styles.structuredWorkoutTemplateName}>Threshold</Text>
                <Text style={styles.structuredWorkoutTemplateDesc}>40min • Lactate threshold</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.structuredWorkoutTemplate}
                onPress={() => {
                  const plan = [
                    { phase: 'Warm-up', duration: 1200 }, // 20 min
                    { phase: 'Work', duration: 3600 }, // 60 min
                    { phase: 'Cool-down', duration: 600 } // 10 min
                  ];
                  setWorkoutPlan(plan);
                  setCurrentPhaseIndex(0);
                  setPhaseTimer(plan[0].duration);
                  setStructuredWorkout(true);
                }}
              >
                <Text style={styles.structuredWorkoutTemplateName}>Long Run</Text>
                <Text style={styles.structuredWorkoutTemplateDesc}>90min • Endurance</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Interval Controls */}
        {!isIntervalActive && !structuredWorkout && (
          <View style={styles.intervalControlsCard}>
            <Text style={styles.intervalControlsTitle}>Quick Intervals</Text>
            <View style={styles.intervalControlsRow}>
              <TouchableOpacity 
                style={styles.intervalButton}
                onPress={() => startInterval(30)}
              >
                <Text style={styles.intervalButtonText}>30s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.intervalButton}
                onPress={() => startInterval(60)}
              >
                <Text style={styles.intervalButtonText}>1min</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.intervalButton}
                onPress={() => startInterval(120)}
              >
                <Text style={styles.intervalButtonText}>2min</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.intervalButton}
                onPress={() => startInterval(300)}
              >
                <Text style={styles.intervalButtonText}>5min</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

          {/* Effort Level Tracking */}
          <View style={styles.effortContainer}>
            <Text style={styles.inputLabel}>Perceived Effort (1-10)</Text>
            <View style={styles.effortScale}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.effortButton,
                    effortLevel === level && styles.effortButtonSelected
                  ]}
                  onPress={() => setEffortLevel(level)}
                >
                  <Text style={[
                    styles.effortButtonText,
                    effortLevel === level && styles.effortButtonTextSelected
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.effortLabels}>
              <Text style={styles.effortLabelText}>Recovery</Text>
              <Text style={styles.effortLabelText}>Moderate</Text>
              <Text style={styles.effortLabelText}>Hard</Text>
              <Text style={styles.effortLabelText}>All-out</Text>
            </View>
            <View style={styles.effortDescription}>
              <Text style={styles.effortDescriptionText}>
                {effortLevel <= 3 && 'Very easy, can hold conversation easily'}
                {effortLevel >= 4 && effortLevel <= 6 && 'Moderate effort, can talk in short sentences'}
                {effortLevel >= 7 && effortLevel <= 8 && 'Hard effort, difficult to talk'}
                {effortLevel >= 9 && 'Very hard to maximum effort'}
              </Text>
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
  // Heart Rate Zone Styles
  heartRateZoneCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  zoneDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  zoneNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  zoneHeartRate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  zoneBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
  zoneSegment: {
    flex: 1,
    borderRadius: 2,
  },
  // Interval Styles
  intervalCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  intervalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  intervalTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  intervalTimer: {
    fontSize: 36,
    fontWeight: '300' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  stopIntervalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopIntervalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  // Additional Metrics Styles
  additionalMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ios.separator,
  },
  additionalMetricItem: {
    alignItems: 'center',
    gap: 4,
  },
  additionalMetricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  additionalMetricValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  // Structured Workout Styles
  structuredWorkoutCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  structuredWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  structuredWorkoutTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  structuredWorkoutProgress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500' as const,
  },
  structuredWorkoutTimer: {
    fontSize: 42,
    fontWeight: '300' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  structuredWorkoutControls: {
    flexDirection: 'row',
    gap: 12,
  },
  skipPhaseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  skipPhaseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  stopStructuredButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopStructuredText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  structuredWorkoutTemplatesCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  structuredWorkoutTemplatesTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  structuredWorkoutTemplatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  structuredWorkoutTemplate: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: colors.ios.secondaryBackground,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  structuredWorkoutTemplateName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  structuredWorkoutTemplateDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Interval Controls Styles
  intervalControlsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  intervalControlsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  intervalControlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalButton: {
    flex: 1,
    backgroundColor: colors.ios.secondaryBackground,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  intervalButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  effortDescription: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  effortDescriptionText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Effort Level Styles
  effortContainer: {
    marginBottom: 16,
  },
  effortScale: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  effortButton: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.ios.tertiaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effortButtonSelected: {
    backgroundColor: colors.primary,
  },
  effortButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  effortButtonTextSelected: {
    color: '#FFFFFF',
  },
  effortLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  effortLabelText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});