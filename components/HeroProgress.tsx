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
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneText: {
    color: colors.textSecondary,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
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
