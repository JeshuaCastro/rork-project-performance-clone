import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/colors';

export interface ProgressRingProps {
  size: number;
  strokeWidth?: number;
  progress: number; // 0-100
  label?: string;
  sublabel?: string;
  trackColor?: string;
  progressColor?: string;
  testID?: string;
}

const ProgressRing = React.memo(function ProgressRing({
  size,
  strokeWidth = 10,
  progress,
  label,
  sublabel,
  trackColor = 'rgba(255,255,255,0.15)',
  progressColor = colors.primary,
  testID,
}: ProgressRingProps) {
  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const clamped = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = useMemo(
    () => circumference - (clamped / 100) * circumference,
    [circumference, clamped]
  );

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID ?? 'progress-ring'}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerContent}>
        {!!label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.value} testID="progress-ring-value">{Math.round(clamped)}%</Text>
        {!!sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  sublabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ProgressRing;
