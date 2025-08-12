import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { RecoveryData } from '@/types/whoop';
import { Activity, Heart } from 'lucide-react-native';
import { iosSpacing, iosMargins, iosTypography, iosCardShadow } from '@/utils/ios-helpers';

interface RecoveryCardProps {
  recovery: RecoveryData;
}

export default function RecoveryCard({ recovery }: RecoveryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
        return colors.recovery.high;
      case 'medium':
        return colors.recovery.medium;
      case 'low':
        return colors.recovery.low;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recovery</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(recovery.status) }]}>
          <Text style={styles.badgeText}>{recovery.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{recovery.score}%</Text>
        <View style={[styles.scoreIndicator, { width: `${recovery.score}%`, backgroundColor: getStatusColor(recovery.status) }]} />
      </View>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Heart size={20} color={colors.textSecondary} />
          <Text style={styles.metricLabel}>Resting HR</Text>
          <Text style={styles.metricValue}>{recovery.restingHeartRate} bpm</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Activity size={20} color={colors.textSecondary} />
          <Text style={styles.metricLabel}>HRV</Text>
          <Text style={styles.metricValue}>{recovery.hrvMs} ms</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: iosMargins.cardPadding,
    marginBottom: iosMargins.sectionSpacing,
    ...iosCardShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: iosSpacing.lg,
  },
  title: {
    ...iosTypography.headline,
    color: colors.text,
  },
  badge: {
    paddingHorizontal: iosSpacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    ...iosTypography.caption1,
    color: colors.text,
    fontWeight: '600',
  },
  scoreContainer: {
    marginBottom: iosSpacing.lg,
  },
  scoreText: {
    ...iosTypography.largeTitle,
    color: colors.text,
    marginBottom: iosSpacing.sm,
    letterSpacing: -0.8,
  },
  scoreIndicator: {
    height: 8,
    borderRadius: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    ...iosTypography.subhead,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metricValue: {
    ...iosTypography.callout,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
});