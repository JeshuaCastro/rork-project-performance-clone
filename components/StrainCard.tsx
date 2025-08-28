import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { StrainData } from '@/types/whoop';
import { Dumbbell, Flame } from 'lucide-react-native';
import { iosSpacing, iosTypography } from '@/utils/ios-helpers';

export interface MinimalCardData {
  score?: number;
  hrv?: number;
  rhr?: number;
  sleepHours?: number;
  text?: string;
}

interface StrainCardProps {
  data?: MinimalCardData;
  strain?: StrainData;
  isLoading?: boolean;
  loadingPromise?: Promise<unknown>;
  onRetry?: () => void;
  hasCachedData?: boolean;
  onContinueWithCache?: () => void;
}

export default function StrainCard({ data, strain, isLoading: isLoadingProp, loadingPromise, onRetry, hasCachedData, onContinueWithCache }: StrainCardProps) {
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
          console.log('[StrainCard] Loading timed out after 5s');
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
          console.log('[StrainCard] isLoading timed out after 5s');
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

  const score = strain?.score ?? data?.score;
  const calories = strain?.calories;
  const avgHr = strain?.averageHeartRate;
  const maxHr = strain?.maxHeartRate;

  const getStrainDescription = (val: number) => {
    if (val >= 18) return 'All Out';
    if (val >= 14) return 'Strenuous';
    if (val >= 10) return 'Moderate';
    if (val >= 6) return 'Light';
    return 'Minimal';
  };
  
  const getStrainColor = (val: number) => {
    if (val >= 18) return colors.danger;
    if (val >= 14) return colors.warning;
    if (val >= 10) return colors.info;
    if (val >= 6) return colors.primary;
    return colors.success;
  };

  const badgeText = score != null ? getStrainDescription(score) : 'NO DATA';
  const barPct = score != null ? (score / 21) * 100 : 0;
  const badgeColor = getStrainColor(score ?? 0);

  if (internalLoading || timedOut) {
    const showCache = Boolean(hasCachedData || onContinueWithCache);
    return (
      <View style={[styles.container]} testID="StrainCard.Skeleton">
        <View style={styles.skeletonBlock} />
        <View style={styles.skeletonControls}>
          <TouchableOpacity
            testID="StrainCard.Retry"
            accessibilityRole="button"
            onPress={() => {
              console.log('[StrainCard] Retry pressed');
              onRetry?.();
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          {showCache && (
            <TouchableOpacity
              testID="StrainCard.ContinueWithCache"
              accessibilityRole="button"
              onPress={() => {
                console.log('[StrainCard] Continue with cached data pressed');
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
    <View style={styles.container} testID="StrainCard">
      <View style={styles.header}>
        <Text style={styles.title}>Daily Strain</Text>
        <Dumbbell size={20} color={colors.textSecondary} />
      </View>
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreText}>{score != null ? score.toFixed(1) : '—'}</Text>
          <View style={[styles.strainBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.strainBadgeText}>{badgeText}</Text>
          </View>
        </View>
        <View style={styles.scoreBarContainer}>
          <View style={[styles.scoreIndicator, { width: `${barPct}%`, backgroundColor: badgeColor }]} />
        </View>
      </View>
      
      <View style={styles.totalMetrics}>
        <View style={styles.totalMetricItem}>
          <Flame size={18} color={colors.textSecondary} />
          <Text style={styles.totalMetricValue}>{calories != null ? `${calories} cal` : '—'}</Text>
        </View>
        
        <View style={styles.totalMetricItem}>
          <Text style={styles.metricLabel}>Avg HR</Text>
          <Text style={styles.totalMetricValue}>{avgHr != null ? `${avgHr} bpm` : '—'}</Text>
        </View>
        
        <View style={styles.totalMetricItem}>
          <Text style={styles.metricLabel}>Max HR</Text>
          <Text style={styles.totalMetricValue}>{maxHr != null ? `${maxHr} bpm` : '—'}</Text>
        </View>
      </View>
      
      <View style={styles.workoutSuggestionContainer}>
        <Text style={styles.workoutSuggestionTitle}>Workout Suggestions</Text>
        <Text style={styles.workoutSuggestionText}>
          {score != null && score >= 18
            ? 'Your strain is very high. Focus on recovery today with light stretching or yoga.'
            : score != null && score >= 14
            ? 'Your strain is high. Consider a light to moderate workout or active recovery.'
            : score != null && score >= 10
            ? 'Your strain is moderate. You can handle a normal training session today.'
            : 'Your strain is low. You\'re well-positioned for a challenging workout today.'}
        </Text>
        
        <View style={styles.workoutTips}>
          <View style={styles.workoutTip}>
            <View style={styles.tipBullet} />
            <Text style={styles.workoutTipText}>
              {score != null && score >= 14
                ? 'Keep intensity low and focus on technique and mobility'
                : 'Focus on progressive overload with proper form'}
            </Text>
          </View>
          <View style={styles.workoutTip}>
            <View style={styles.tipBullet} />
            <Text style={styles.workoutTipText}>
              {score != null && score >= 14
                ? 'Stay hydrated and prioritize protein intake for recovery'
                : 'Ensure adequate warm-up and cool-down periods'}
            </Text>
          </View>
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
  scoreContainer: {
    marginBottom: iosSpacing.lg,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: iosSpacing.sm,
  },
  scoreText: {
    ...iosTypography.largeTitle,
    color: colors.text,
    letterSpacing: -0.8,
  },
  strainBadge: {
    paddingHorizontal: iosSpacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strainBadgeText: {
    ...iosTypography.caption1,
    color: colors.text,
    fontWeight: '600',
  },
  scoreBarContainer: {
    height: 8,
    backgroundColor: colors.ios.quaternaryBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreIndicator: {
    height: 8,
    borderRadius: 4,
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
  totalMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: iosSpacing.lg,
    paddingBottom: iosSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ios.separator,
  },
  totalMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    ...iosTypography.subhead,
    color: colors.textSecondary,
    marginRight: 4,
    flexWrap: 'wrap',
  },
  totalMetricValue: {
    ...iosTypography.callout,
    color: colors.text,
    fontWeight: '500',
    marginLeft: 4,
    flexWrap: 'wrap',
  },
  workoutSuggestionContainer: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: iosSpacing.md,
  },
  workoutSuggestionTitle: {
    ...iosTypography.subhead,
    fontWeight: '600',
    color: colors.text,
    marginBottom: iosSpacing.sm,
  },
  workoutSuggestionText: {
    ...iosTypography.subhead,
    color: colors.textSecondary,
    marginBottom: iosSpacing.md,
    flexWrap: 'wrap',
  },
  workoutTips: {
    marginTop: iosSpacing.sm,
  },
  workoutTip: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: iosSpacing.sm,
  },
  workoutTipText: {
    flex: 1,
    ...iosTypography.caption1,
    color: colors.textSecondary,
    flexWrap: 'wrap',
  },
});