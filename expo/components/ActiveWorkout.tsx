import React from 'react';
import { useWorkoutSession } from '@/store/workoutSessionStore';
import ActiveStrengthWorkout from './ActiveStrengthWorkout';
import ActiveCardioWorkout from './ActiveCardioWorkout';

interface ActiveWorkoutProps {
  workoutTitle: string;
  onComplete?: () => void;
  onCancel?: () => void;
  // Cardio-specific props
  cardioType?: 'running' | 'cycling' | 'rowing' | 'elliptical' | 'other';
  targetDuration?: number; // in minutes
  targetDistance?: number;
  targetHeartRate?: number;
}

export default function ActiveWorkout({
  workoutTitle,
  onComplete,
  onCancel,
  cardioType = 'running',
  targetDuration,
  targetDistance,
  targetHeartRate
}: ActiveWorkoutProps) {
  const { currentSession } = useWorkoutSession();

  if (!currentSession) {
    return null;
  }

  // Conditional rendering based on workout type
  if (currentSession.workoutType === 'cardio') {
    return (
      <ActiveCardioWorkout
        workoutTitle={workoutTitle}
        workoutType={cardioType}
        targetDuration={targetDuration}
        targetDistance={targetDistance}
        targetHeartRate={targetHeartRate}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );
  }

  // Default to strength workout
  return (
    <ActiveStrengthWorkout
      workoutTitle={workoutTitle}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}