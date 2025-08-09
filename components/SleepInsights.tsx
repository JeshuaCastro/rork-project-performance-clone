import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { useWhoopStore } from '@/store/whoopStore';
import { Moon, BedDouble, AlarmClock, Trophy, TrendingUp, Minus } from 'lucide-react-native';

type Range = '7d' | '30d' | '90d';

interface SleepInsightsProps {
  selectedRange: Range;
}

export default function SleepInsights({ selectedRange }: SleepInsightsProps) {
  const { data } = useWhoopStore();

  const sleepStats = useMemo(() => {
    const all = data?.sleep ?? [];
    if (!all || all.length === 0) return null;

    const now = new Date();
    const daysBack = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const rangeData = all
      .filter(s => new Date(s.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (rangeData.length === 0) return null;

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const durations = rangeData.map(s => s.duration);
    const efficiencies = rangeData.map(s => s.efficiency);
    const quality = rangeData.map(s => s.qualityScore);

    const avgDuration = avg(durations);
    const avgEfficiency = avg(efficiencies);
    const avgQuality = avg(quality);

    const meanDur = avgDuration;
    const sdDuration = Math.sqrt(avg(durations.map(v => Math.pow(v - meanDur, 2)))) || 0;

    const bestQuality = Math.max(...quality);
    const bestDuration = Math.max(...durations);

    let currentStreak = 0;
    let bestStreak = 0;
    for (let i = 0; i < rangeData.length; i++) {
      if (rangeData[i].qualityScore >= 80) {
        currentStreak += 1;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const mid = Math.floor(rangeData.length / 2);
    const firstHalf = rangeData.slice(0, mid);
    const secondHalf = rangeData.slice(mid);
    const trend = avg(secondHalf.map(s => s.qualityScore)) - avg(firstHalf.map(s => s.qualityScore));

    return {
      count: rangeData.length,
      avgDuration,
      avgEfficiency,
      avgQuality,
      sdDuration,
      bestQuality,
      bestDuration,
      bestStreak,
      trend,
      recent: rangeData.slice(-7)
    };
  }, [data?.sleep, selectedRange]);

  if (!sleepStats) {
    return (
      <View style={styles.noData} testID="sleep-no-data">
        <AlarmClock size={40} color={colors.textSecondary} />
        <Text style={styles.noDataTitle}>Not enough sleep data</Text>
        <Text style={styles.noDataText}>Sync WHOOP to see sleep insights here.</Text>
      </View>
    );
  }

  const trendColor = sleepStats.trend > 1
    ? colors.success
    : sleepStats.trend < -1
    ? colors.danger
    : colors.textSecondary;

  return (
    <View>
      <View style={styles.card} testID="sleep-summary">
        <View style={styles.cardHeader}>
          <Moon size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Summary</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Avg Score</Text>
            <Text style={styles.metricValue}>{Math.round(sleepStats.avgQuality)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Avg Duration</Text>
            <Text style={styles.metricValue}>{(sleepStats.avgDuration / 60).toFixed(1)} h</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Avg Efficiency</Text>
            <Text style={styles.metricValue}>{Math.round(sleepStats.avgEfficiency)}%</Text>
          </View>
        </View>
        <View style={styles.trendRow}>
          {sleepStats.trend > 1 ? (
            <TrendingUp size={16} color={trendColor} />
          ) : (
            <Minus size={16} color={trendColor} />
          )}
          <Text style={[styles.trendText, { color: trendColor }]}>
            {Math.abs(sleepStats.trend) < 0.5 ? 'Stable' : (sleepStats.trend > 0 ? `+${sleepStats.trend.toFixed(1)}` : sleepStats.trend.toFixed(1))}
          </Text>
        </View>
      </View>

      <View style={styles.card} testID="sleep-architecture">
        <View style={styles.cardHeader}>
          <BedDouble size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Architecture</Text>
        </View>
        <Text style={styles.helperText}>Approximation based on duration and efficiency</Text>
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Deep/REM (est.)</Text>
            <Text style={styles.metricValue}>
              {Math.round((sleepStats.avgDuration * (sleepStats.avgEfficiency / 100) * 0.45))} min
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Light (est.)</Text>
            <Text style={styles.metricValue}>
              {Math.round((sleepStats.avgDuration * (sleepStats.avgEfficiency / 100) * 0.45))} min
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Awake (est.)</Text>
            <Text style={styles.metricValue}>
              {Math.round((sleepStats.avgDuration * (1 - sleepStats.avgEfficiency / 100)))} min
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card} testID="sleep-consistency">
        <View style={styles.cardHeader}>
          <AlarmClock size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Consistency</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Duration Std Dev</Text>
            <Text style={styles.metricValue}>{sleepStats.sdDuration.toFixed(0)} min</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Best Streak ≥80</Text>
            <Text style={styles.metricValue}>{sleepStats.bestStreak} d</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.banner]} testID="sleep-impact">
        <Text style={styles.bannerTitle}>Performance Impact</Text>
        <Text style={styles.bannerText}>
          Recommended training load: {sleepStats.avgQuality >= 70 ? 'moderate to high' : sleepStats.avgQuality >= 55 ? 'moderate' : 'low'}. Cognitive readiness: {sleepStats.avgEfficiency >= 85 ? 'high' : sleepStats.avgEfficiency >= 75 ? 'moderate' : 'low'}.
        </Text>
      </View>

      <View style={styles.card} testID="sleep-bests">
        <View style={styles.cardHeader}>
          <Trophy size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Personal Bests</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Best Score</Text>
            <Text style={styles.metricValue}>{Math.round(sleepStats.bestQuality)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Longest Sleep</Text>
            <Text style={styles.metricValue}>{(sleepStats.bestDuration / 60).toFixed(1)} h</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  trendText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  banner: {
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.2)',
    backgroundColor: 'rgba(0,122,255,0.12)',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  bannerText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  noData: {
    alignItems: 'center',
    padding: 20,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});