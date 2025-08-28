import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { AIAnalysis } from '@/types/whoop';
import { Brain } from 'lucide-react-native';

export interface MinimalCardData {
  score?: number;
  hrv?: number;
  rhr?: number;
  sleepHours?: number;
  text?: string;
}

interface AIInsightCardProps {
  data?: MinimalCardData;
  analysis?: AIAnalysis;
  isLoading?: boolean;
  loadingPromise?: Promise<unknown>;
  onRetry?: () => void;
  hasCachedData?: boolean;
  onContinueWithCache?: () => void;
}

export default function AIInsightCard({ data, analysis, isLoading: isLoadingProp, loadingPromise, onRetry, hasCachedData, onContinueWithCache }: AIInsightCardProps) {
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
          console.log('[AIInsightCard] Loading timed out after 5s');
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
          console.log('[AIInsightCard] isLoading timed out after 5s');
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

  const recoveryText = analysis?.recoveryInsight ?? data?.text ?? 'No data';
  const trainingText = analysis?.trainingRecommendation ?? data?.text ?? 'No data';
  const trendText = analysis?.longTermTrend ?? data?.text ?? 'No data';

  if (internalLoading || timedOut) {
    const showCache = Boolean(hasCachedData || onContinueWithCache);
    return (
      <View style={styles.container} testID="AIInsightCard.Skeleton">
        <View style={styles.skeletonBlock} />
        <View style={styles.skeletonControls}>
          <TouchableOpacity
            testID="AIInsightCard.Retry"
            accessibilityRole="button"
            onPress={() => {
              console.log('[AIInsightCard] Retry pressed');
              onRetry?.();
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          {showCache && (
            <TouchableOpacity
              testID="AIInsightCard.ContinueWithCache"
              accessibilityRole="button"
              onPress={() => {
                console.log('[AIInsightCard] Continue with cached data pressed');
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
    <View style={styles.container} testID="AIInsightCard">
      <View style={styles.header}>
        <Text style={styles.title}>AI Coach Insights</Text>
        <Brain size={20} color={colors.primary} />
      </View>
      
      <View style={styles.insightSection}>
        <Text style={styles.sectionTitle}>Recovery Analysis</Text>
        <Text style={styles.insightText}>{recoveryText}</Text>
      </View>
      
      <View style={styles.insightSection}>
        <Text style={styles.sectionTitle}>Training Recommendation</Text>
        <Text style={styles.insightText}>{trainingText}</Text>
      </View>
      
      <View style={styles.insightSection}>
        <Text style={styles.sectionTitle}>Long-term Trend</Text>
        <Text style={styles.insightText}>{trendText}</Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  insightSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  insightText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  skeletonBlock: {
    height: 120,
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    marginBottom: 12,
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
});