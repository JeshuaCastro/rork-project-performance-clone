import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { useWhoopStore } from '@/store/whoopStore';
import { Moon, BedDouble, AlarmClock, Trophy, TrendingUp, Minus, Activity, Zap, Heart } from 'lucide-react-native';

type Range = '7d' | '30d' | '90d';

interface SleepInsightsProps {
  selectedRange: Range;
}

export default function SleepInsights({ selectedRange }: SleepInsightsProps) {
  const { data } = useWhoopStore();

  const sleepStats = useMemo(() => {
    console.log('Processing sleep data:', data?.sleep?.length || 0, 'entries');
    const all = data?.sleep ?? [];
    if (!all || all.length === 0) {
      console.log('No sleep data available');
      return null;
    }

    const now = new Date();
    const daysBack = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    console.log(`Filtering sleep data for ${selectedRange} (${daysBack} days back from ${now.toISOString()})`);
    
    const rangeData = all
      .filter(s => {
        const sleepDate = new Date(s.date);
        const isInRange = sleepDate >= cutoff;
        console.log(`Sleep entry ${s.date}: ${isInRange ? 'included' : 'excluded'}`);
        return isInRange;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort newest first

    console.log(`Found ${rangeData.length} sleep entries in range`);
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

    const stats = {
      count: rangeData.length,
      avgDuration,
      avgEfficiency,
      avgQuality,
      sdDuration,
      bestQuality,
      bestDuration,
      bestStreak,
      trend,
      recent: rangeData.slice(0, 7), // Take first 7 (most recent)
      totalSleepHours: (avgDuration * rangeData.length) / 60,
      sleepDebt: Math.max(0, (8 * rangeData.length) - ((avgDuration * rangeData.length) / 60))
    };
    
    console.log('Calculated sleep stats:', stats);
    return stats;
  }, [data?.sleep, selectedRange]);

  if (!sleepStats) {
    return (
      <View style={styles.container}>
        <View style={styles.noData} testID="sleep-no-data">
          <Moon size={48} color={colors.textSecondary} />
          <Text style={styles.noDataTitle}>Building Your Sleep Profile</Text>
          <Text style={styles.noDataText}>
            We need a few more nights of sleep data to provide meaningful insights. 
            Keep syncing your WHOOP data and check back soon!
          </Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Why Sleep Matters for Athletes</Text>
          </View>
          <Text style={styles.helperText}>
            Quality sleep is when your body repairs muscle tissue, consolidates memories, and optimizes hormone production. 
            Elite athletes prioritize 8-9 hours of sleep for peak performance.
          </Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Zap size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Sleep & Performance Connection</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Recovery</Text>
              <Text style={styles.metricValue}>+25%</Text>
              <Text style={styles.metricSubtext}>with 8+ hours</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Reaction Time</Text>
              <Text style={styles.metricValue}>-15%</Text>
              <Text style={styles.metricSubtext}>when sleep deprived</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Injury Risk</Text>
              <Text style={styles.metricValue}>+70%</Text>
              <Text style={styles.metricSubtext}>with &lt;6 hours</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Heart size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Sleep Optimization Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Keep a consistent sleep schedule, even on weekends</Text>
            <Text style={styles.tipItem}>• Create a cool, dark sleeping environment (65-68°F)</Text>
            <Text style={styles.tipItem}>• Avoid screens 1 hour before bedtime</Text>
            <Text style={styles.tipItem}>• Limit caffeine after 2 PM</Text>
            <Text style={styles.tipItem}>• Use relaxation techniques like deep breathing</Text>
          </View>
        </View>
      </View>
    );
  }

  const trendColor = sleepStats.trend > 1
    ? colors.success
    : sleepStats.trend < -1
    ? colors.danger
    : colors.textSecondary;

  return (
    <View style={styles.container}>
      {/* Sleep Quality Overview */}
      <View style={styles.card} testID="sleep-summary">
        <View style={styles.cardHeader}>
          <Moon size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Sleep Quality Overview</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Sleep Score</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(sleepStats.avgQuality) }]}>
              {Math.round(sleepStats.avgQuality)}
            </Text>
            <Text style={styles.metricSubtext}>{getScoreDescription(sleepStats.avgQuality)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Avg Duration</Text>
            <Text style={styles.metricValue}>{(sleepStats.avgDuration / 60).toFixed(1)}h</Text>
            <Text style={styles.metricSubtext}>
              {sleepStats.avgDuration >= 480 ? 'Optimal' : sleepStats.avgDuration >= 420 ? 'Good' : 'Too Short'}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Efficiency</Text>
            <Text style={styles.metricValue}>{Math.round(sleepStats.avgEfficiency)}%</Text>
            <Text style={styles.metricSubtext}>
              {sleepStats.avgEfficiency >= 85 ? 'Excellent' : sleepStats.avgEfficiency >= 75 ? 'Good' : 'Needs Work'}
            </Text>
          </View>
        </View>
        <View style={styles.trendRow}>
          {sleepStats.trend > 1 ? (
            <TrendingUp size={16} color={trendColor} />
          ) : sleepStats.trend < -1 ? (
            <TrendingUp size={16} color={trendColor} style={{ transform: [{ rotate: '180deg' }] }} />
          ) : (
            <Minus size={16} color={trendColor} />
          )}
          <Text style={[styles.trendText, { color: trendColor }]}>
            {Math.abs(sleepStats.trend) < 0.5 ? 'Stable trend' : 
             sleepStats.trend > 0 ? `Improving (+${sleepStats.trend.toFixed(1)})` : 
             `Declining (${sleepStats.trend.toFixed(1)})`}
          </Text>
        </View>
      </View>
      
      {/* Sleep Debt & Recovery */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Activity size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Recovery Impact</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Sleep Debt</Text>
            <Text style={[styles.metricValue, { color: sleepStats.sleepDebt > 5 ? colors.danger : sleepStats.sleepDebt > 2 ? colors.warning : colors.success }]}>
              {sleepStats.sleepDebt.toFixed(1)}h
            </Text>
            <Text style={styles.metricSubtext}>Last {sleepStats.count} nights</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Training Readiness</Text>
            <Text style={[styles.metricValue, { color: getReadinessColor(sleepStats.avgQuality, sleepStats.avgEfficiency) }]}>
              {getReadinessLevel(sleepStats.avgQuality, sleepStats.avgEfficiency)}
            </Text>
            <Text style={styles.metricSubtext}>Based on sleep quality</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Consistency</Text>
            <Text style={styles.metricValue}>
              {sleepStats.sdDuration < 30 ? 'High' : sleepStats.sdDuration < 60 ? 'Medium' : 'Low'}
            </Text>
            <Text style={styles.metricSubtext}>±{sleepStats.sdDuration.toFixed(0)} min</Text>
          </View>
        </View>
      </View>

      {/* Sleep Architecture */}
      <View style={styles.card} testID="sleep-architecture">
        <View style={styles.cardHeader}>
          <BedDouble size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Sleep Architecture</Text>
        </View>
        <Text style={styles.helperText}>Estimated breakdown based on duration and efficiency</Text>
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Deep Sleep</Text>
            <Text style={styles.metricValue}>
              {Math.round((sleepStats.avgDuration * (sleepStats.avgEfficiency / 100) * 0.25))} min
            </Text>
            <Text style={styles.metricSubtext}>Muscle recovery</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>REM Sleep</Text>
            <Text style={styles.metricValue}>
              {Math.round((sleepStats.avgDuration * (sleepStats.avgEfficiency / 100) * 0.25))} min
            </Text>
            <Text style={styles.metricSubtext}>Mental recovery</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Light Sleep</Text>
            <Text style={styles.metricValue}>
              {Math.round((sleepStats.avgDuration * (sleepStats.avgEfficiency / 100) * 0.50))} min
            </Text>
            <Text style={styles.metricSubtext}>Transition phases</Text>
          </View>
        </View>
        <View style={styles.architectureBar}>
          <View style={[styles.architectureSegment, { 
            flex: 0.25, 
            backgroundColor: '#4A90E2' 
          }]} />
          <View style={[styles.architectureSegment, { 
            flex: 0.25, 
            backgroundColor: '#7B68EE' 
          }]} />
          <View style={[styles.architectureSegment, { 
            flex: 0.50, 
            backgroundColor: '#87CEEB' 
          }]} />
        </View>
        <View style={styles.architectureLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4A90E2' }]} />
            <Text style={styles.legendText}>Deep</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#7B68EE' }]} />
            <Text style={styles.legendText}>REM</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#87CEEB' }]} />
            <Text style={styles.legendText}>Light</Text>
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

      {/* Performance Impact */}
      <View style={[styles.card, styles.banner]} testID="sleep-impact">
        <View style={styles.cardHeader}>
          <Zap size={18} color={colors.text} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Training Recommendations</Text>
        </View>
        <View style={styles.recommendationGrid}>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationLabel}>Training Intensity</Text>
            <Text style={styles.recommendationValue}>
              {sleepStats.avgQuality >= 75 ? 'High intensity OK' : 
               sleepStats.avgQuality >= 60 ? 'Moderate intensity' : 
               'Focus on recovery'}
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationLabel}>Cognitive Load</Text>
            <Text style={styles.recommendationValue}>
              {sleepStats.avgEfficiency >= 85 ? 'Complex skills OK' : 
               sleepStats.avgEfficiency >= 75 ? 'Moderate complexity' : 
               'Simple movements'}
            </Text>
          </View>
        </View>
        <Text style={styles.bannerText}>
          {sleepStats.avgQuality >= 75 && sleepStats.avgEfficiency >= 85 ? 
            '🚀 Your sleep quality supports high-performance training. Push your limits!' :
           sleepStats.avgQuality >= 60 && sleepStats.avgEfficiency >= 75 ?
            '⚖️ Good sleep foundation. Balance intensity with recovery.' :
            '🛡️ Prioritize sleep optimization. Consider lighter training loads.'}
        </Text>
      </View>

      {/* Personal Bests & Streaks */}
      <View style={styles.card} testID="sleep-bests">
        <View style={styles.cardHeader}>
          <Trophy size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Achievements & Streaks</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Best Score</Text>
            <Text style={[styles.metricValue, { color: colors.success }]}>{Math.round(sleepStats.bestQuality)}</Text>
            <Text style={styles.metricSubtext}>Personal record</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Longest Sleep</Text>
            <Text style={[styles.metricValue, { color: colors.success }]}>{(sleepStats.bestDuration / 60).toFixed(1)}h</Text>
            <Text style={styles.metricSubtext}>Single night</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Quality Streak</Text>
            <Text style={[styles.metricValue, { color: colors.primary }]}>{sleepStats.bestStreak}</Text>
            <Text style={styles.metricSubtext}>Nights ≥80 score</Text>
          </View>
        </View>
      </View>
      
      {/* Sleep Optimization Tips */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Heart size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Personalized Sleep Tips</Text>
        </View>
        <View style={styles.tipsList}>
          {sleepStats.avgDuration < 420 && (
            <Text style={styles.tipItem}>• Aim for 7+ hours of sleep - you&apos;re averaging {(sleepStats.avgDuration / 60).toFixed(1)} hours</Text>
          )}
          {sleepStats.avgEfficiency < 85 && (
            <Text style={styles.tipItem}>• Improve sleep efficiency - try limiting screen time before bed</Text>
          )}
          {sleepStats.sdDuration > 60 && (
            <Text style={styles.tipItem}>• Keep a consistent bedtime - your sleep duration varies by ±{sleepStats.sdDuration.toFixed(0)} minutes</Text>
          )}
          {sleepStats.sleepDebt > 3 && (
            <Text style={styles.tipItem}>• Address sleep debt of {sleepStats.sleepDebt.toFixed(1)} hours with earlier bedtimes</Text>
          )}
          <Text style={styles.tipItem}>• Create a cool, dark environment (65-68°F optimal)</Text>
          <Text style={styles.tipItem}>• Consider magnesium supplementation for deeper sleep</Text>
        </View>
      </View>
    </View>
  );
}

// Helper functions for sleep insights
function getScoreColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.danger;
}

function getScoreDescription(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Poor';
}

function getReadinessColor(quality: number, efficiency: number): string {
  const combined = (quality + efficiency) / 2;
  if (combined >= 80) return colors.success;
  if (combined >= 65) return colors.warning;
  return colors.danger;
}

function getReadinessLevel(quality: number, efficiency: number): string {
  const combined = (quality + efficiency) / 2;
  if (combined >= 80) return 'High';
  if (combined >= 65) return 'Medium';
  return 'Low';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  metricSubtext: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
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
    lineHeight: 20,
    marginBottom: 20,
  },
  architectureBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  architectureSegment: {
    height: '100%',
  },
  architectureLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recommendationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recommendationItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  recommendationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  recommendationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});