import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { Play, Pause, RotateCcw, Clock, Settings } from 'lucide-react-native';

interface WorkoutTimerProps {
  defaultRestTime?: number; // in seconds
  onTimerComplete?: () => void;
  autoStart?: boolean;
}

export default function WorkoutTimer({ 
  defaultRestTime = 90, 
  onTimerComplete,
  autoStart = false 
}: WorkoutTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(defaultRestTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [customTime, setCustomTime] = useState(defaultRestTime);

  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialTime = useRef(defaultRestTime);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // stop
            setIsRunning(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            onTimerComplete?.();
            if (Platform.OS !== 'web') {
              console.log('Timer completed - haptic feedback would trigger');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, onTimerComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(initialTime.current);
  };

  const handleCustomTime = () => {
    Alert.alert(
      'Set Rest Time',
      'Choose your rest time:',
      [
        { text: '30s', onPress: () => setCustomRestTime(30) },
        { text: '60s', onPress: () => setCustomRestTime(60) },
        { text: '90s', onPress: () => setCustomRestTime(90) },
        { text: '2min', onPress: () => setCustomRestTime(120) },
        { text: '3min', onPress: () => setCustomRestTime(180) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const setCustomRestTime = (seconds: number) => {
    setCustomTime(seconds);
    setTimeRemaining(seconds);
    initialTime.current = seconds;
    setIsRunning(false);
  };

  const getTimerColor = () => {
    if (timeRemaining === 0) return colors.success;
    if (timeRemaining <= 10) return colors.danger;
    if (timeRemaining <= 30) return colors.warning;
    return colors.primary;
  };

  const getTimerStatus = () => {
    if (timeRemaining === 0) return 'Rest Complete!';
    if (isRunning) return 'Resting...';
    return 'Rest Timer';
  };

  // Keep defaults in sync when prop changes or remounts
  useEffect(() => {
    setTimeRemaining(defaultRestTime);
    initialTime.current = defaultRestTime;
    setCustomTime(defaultRestTime);
    setIsRunning(autoStart);
  }, [defaultRestTime, autoStart]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Clock size={18} color={colors.primary} />
          <Text style={styles.title}>{getTimerStatus()}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleCustomTime}
        >
          <Settings size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {formatTime(timeRemaining)}
        </Text>
        
        {timeRemaining === 0 && (
          <Text style={styles.completeText}>Ready for next set!</Text>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleReset}
        >
          <RotateCcw size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.playPauseButton, { backgroundColor: getTimerColor() }]}
          onPress={handlePlayPause}
          disabled={timeRemaining === 0}
        >
          {isRunning ? (
            <Pause size={24} color="#FFFFFF" />
          ) : (
            <Play size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        
        <View style={styles.controlButton} />
      </View>

      <View style={styles.quickTimeContainer}>
        <Text style={styles.quickTimeLabel}>Quick Set:</Text>
        <View style={styles.quickTimeButtons}>
          {[30, 60, 90, 120].map((seconds) => (
            <TouchableOpacity
              key={seconds}
              style={[
                styles.quickTimeButton,
                customTime === seconds && styles.quickTimeButtonActive
              ]}
              onPress={() => setCustomRestTime(seconds)}
            >
              <Text style={[
                styles.quickTimeButtonText,
                customTime === seconds && styles.quickTimeButtonTextActive
              ]}>
                {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  settingsButton: {
    padding: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.success,
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickTimeContainer: {
    alignItems: 'center',
  },
  quickTimeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quickTimeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickTimeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'rgba(93, 95, 239, 0.2)',
  },
  quickTimeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickTimeButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
  },
  quickTimeButtonTextActive: {
    color: '#FFFFFF',
  },
});