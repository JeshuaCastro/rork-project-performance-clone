import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import ProgressRing from '@/components/ProgressRing';
import { Trophy, Target, ChevronRight } from 'lucide-react-native';

export interface HeroProgressProps {
  title: string;
  percentComplete: number; // 0-100
  milestoneLabel?: string;
  nextMilestone?: string;
  goalDescription?: string; // e.g., "Gain 10lbs Muscle - Week 3/12"
  daysUntilGoal?: number;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  testID?: string;
}

const HeroProgress = React.memo(function HeroProgress({
  title,
  percentComplete,
  milestoneLabel,
  nextMilestone,
  goalDescription,
  daysUntilGoal,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  testID,
}: HeroProgressProps) {
  const clamped = useMemo(() => Math.max(0, Math.min(100, percentComplete)), [percentComplete]);

  return (
    <View style={styles.container} testID={testID ?? 'hero-progress'}>
      <View style={styles.left}>
        <ProgressRing
          size={130}
          strokeWidth={16}
          progress={clamped}
          label="Progress"
          sublabel={milestoneLabel}
          testID="hero-progress-ring"
        />
      </View>
      <View style={styles.right}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {!!goalDescription && (
          <Text style={styles.goalDescription} numberOfLines={1}>{goalDescription}</Text>
        )}
        <View style={styles.metricsRow}>
          {!!nextMilestone && (
            <View style={styles.milestoneContainer}>
              <Target size={14} color={colors.primary} />
              <Text style={styles.milestoneText} numberOfLines={1}>{nextMilestone}</Text>
            </View>
          )}
          {!!daysUntilGoal && daysUntilGoal > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownNumber}>{daysUntilGoal}</Text>
              <Text style={styles.countdownLabel}>days left</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onPrimaryAction} testID="hero-primary-action">
            <Trophy size={18} color={colors.text} />
            <Text style={styles.primaryText}>{primaryActionLabel}</Text>
            <ChevronRight size={16} color={colors.text} />
          </TouchableOpacity>
          {!!secondaryActionLabel && !!onSecondaryAction && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondaryAction} testID="hero-secondary-action">
              <Text style={styles.secondaryText}>{secondaryActionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  left: {
    marginRight: 20,
  },
  right: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  goalDescription: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  milestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  milestoneText: {
    color: colors.textSecondary,
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  countdownContainer: {
    alignItems: 'flex-end',
  },
  countdownNumber: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  countdownLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 10,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default HeroProgress;
