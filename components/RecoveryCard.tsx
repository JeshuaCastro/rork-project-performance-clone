import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { RecoveryData } from '@/types/whoop';
import { Activity, Heart } from 'lucide-react-native';
import { iosSpacing, iosTypography } from '@/utils/ios-helpers';

export interface MinimalCardData {
  score?: number;
  hrv?: number;
  rhr?: number;
  sleepHours?: number;
  text?: string;
}

interface RecoveryCardProps {
  data?: MinimalCardData;
  recovery?: RecoveryData;
  isLoading?: boolean;
  loadingPromise?: Promise<unknown>;
  onRetry?: () => void;
  hasCachedData?: boolean;
  onContinueWithCache?: () => void;
}

export default function RecoveryCard({ data, recovery, isLoading: isLoadingProp, loadingPromise, onRetry, hasCachedData, onContinueWithCache }: RecoveryCardProps) {
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

  const [internalLoading, setInternalLoading] = useState<boolean>(Boolean(isLoadingProp));
  const [timedOut, setTimedOut] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (loadingPromise) {
      setInternalLoading(true);
      setTimedOut(false);
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled && isMounted) {
          console.log('[RecoveryCard] Loading timed out after 5s');
          setTimedOut(true);
          setInternalLoading(false);
        }
      }, 5000);
      loadingPromise.finally(() => {
        settled = true;
        clearTimeout(timer);
        if (isMounted) {
          setInternalLoading(false);
          setTimedOut(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }
    if (isLoadingProp) {
      setInternalLoading(true);
      setTimedOut(false);
      const t = setTimeout(() => {
        if (isMounted) {
          console.log('[RecoveryCard] isLoading timed out after 5s');
          setTimedOut(true);
          setInternalLoading(false);
        }
      }, 5000);
      return () => {
        isMounted = false;
        clearTimeout(t);
      };
    }
    setInternalLoading(false);
    setTimedOut(false);
    return () => {
      isMounted = false;
    };
  }, [loadingPromise, isLoadingProp]);

  const score = recovery?.score ?? data?.score;
  const statusDerived = recovery?.status ?? (score != null ? (score >= 67 ? 'high' : score >= 34 ? 'medium' : 'low') : 'unknown');
  const rhr = recovery?.restingHeartRate ?? data?.rhr;
  const hrv = recovery?.hrvMs ?? data?.hrv;

  if (internalLoading || timedOut) {
    const showCache = Boolean(hasCachedData || onContinueWithCache);
    return (
      <View style={[styles.container]} testID="RecoveryCard.Skeleton">
        <View style={styles.skeletonBlock} />
        <View style={styles.skeletonControls}>
          <TouchableOpacity
            testID="RecoveryCard.Retry"
            accessibilityRole="button"
            onPress={() => {
              console.log('[RecoveryCard] Retry pressed');
              onRetry?.();
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          {showCache && (
            <TouchableOpacity
              testID="RecoveryCard.ContinueWithCache"
              accessibilityRole="button"
              onPress={() => {
                console.log('[RecoveryCard] Continue with cached data pressed');
                onContinueWithCache?.();
              }}
              style={styles.cacheButton}
            >
              <Text style={styles.cacheText}>Continue with cached data</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="RecoveryCard">
      <View style={styles.header}>
        <Text style={styles.title}>Recovery</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(statusDerived) }]}>
          <Text style={styles.badgeText}>{recovery?.status?.toUpperCase() ?? (score != null ? statusDerived.toUpperCase() : 'NO DATA')}</Text>
        </View>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{score != null ? `${Math.round(score)}%` : '—'}</Text>
        <View style={styles.scoreBarContainer}>
          <View style={[styles.scoreIndicator, { width: `${score != null ? score : 0}%`, backgroundColor: getStatusColor(statusDerived) }]} />
        </View>
      </View>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Heart size={20} color={colors.textSecondary} />
          <Text style={styles.metricLabel}>Resting HR</Text>
          <Text style={styles.metricValue}>{rhr != null ? `${rhr} bpm` : '—'}</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Activity size={20} color={colors.textSecondary} />
          <Text style={styles.metricLabel}>HRV</Text>
          <Text style={styles.metricValue}>{hrv != null ? `${hrv} ms` : '—'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 12,
    padding: 16,
    borderRadius: 12,
    alignSelf: 'stretch',
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
  scoreBarContainer: {
    height: 8,
    backgroundColor: colors.ios.quaternaryBackground,
    borderRadius: 4,
    overflow: 'hidden',
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
    backgroundColor: colors.ios.quaternaryBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  skeletonBlock: {
    height: 120,
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    marginBottom: iosSpacing.md,
  },
  skeletonControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 as unknown as number,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  retryText: {
    color: colors.background,
    fontWeight: '600',
  },
  cacheButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.ios.tertiaryBackground,
  },
  cacheText: {
    color: colors.text,
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    ...iosTypography.subhead,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  metricValue: {
    ...iosTypography.callout,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
});