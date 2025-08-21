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
          size={110}
          strokeWidth={12}
          progress={clamped}
          label="Progress"
          sublabel={milestoneLabel}
          testID="hero-progress-ring"
        />
      </View>
      <View style={styles.right}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {!!nextMilestone && (
          <View style={styles.milestoneRow}>
            <Target size={16} color={colors.primary} />
            <Text style={styles.milestoneText} numberOfLines={1}>{nextMilestone}</Text>
          </View>
        )}
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
    borderRadius: 20,
    padding: 16,
  },
  left: {
    marginRight: 16,
  },
  right: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneText: {
    color: colors.textSecondary,
    marginLeft: 8,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  primaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  secondaryBtn: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
  },
  secondaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default HeroProgress;
