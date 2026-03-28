import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Heart,
  Dumbbell,
  Calendar,
  BarChart3,
  Activity,
  Minus
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

type TimeRange = '7d' | '30d' | '90d';

export default function TrendsScreen() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d');
  const { data } = useWhoopStore();

  // Calculate trends data
  const trendsData = useMemo(() => {
    if (!data?.recovery || !data?.strain) {
      return null;
    }

    const now = new Date();
    const daysBack = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    // Filter data for selected range
    const recoveryData = data.recovery.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const strainData = data.strain.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recoveryData.length === 0 || strainData.length === 0) {
      return null;
    }

    // Calculate averages
    const avgRecovery = recoveryData.reduce((sum, item) => sum + item.score, 0) / recoveryData.length;
    const avgStrain = strainData.reduce((sum, item) => sum + item.score, 0) / strainData.length;
    const avgHRV = recoveryData.reduce((sum, item) => sum + item.hrvMs, 0) / recoveryData.length;
    const avgRestingHR = recoveryData.reduce((sum, item) => sum + item.restingHeartRate, 0) / recoveryData.length;
    
    // Calculate trends (compare first half vs second half)
    const midPoint = Math.floor(recoveryData.length / 2);
    const firstHalfRecovery = recoveryData.slice(0, midPoint);
    const secondHalfRecovery = recoveryData.slice(midPoint);
    const firstHalfStrain = strainData.slice(0, midPoint);
    const secondHalfStrain = strainData.slice(midPoint);
    
    const firstHalfAvgRecovery = firstHalfRecovery.reduce((sum, item) => sum + item.score, 0) / firstHalfRecovery.length;
    const secondHalfAvgRecovery = secondHalfRecovery.reduce((sum, item) => sum + item.score, 0) / secondHalfRecovery.length;
    const recoveryTrend = secondHalfAvgRecovery - firstHalfAvgRecovery;
    
    const firstHalfAvgStrain = firstHalfStrain.reduce((sum, item) => sum + item.score, 0) / firstHalfStrain.length;
    const secondHalfAvgStrain = secondHalfStrain.reduce((sum, item) => sum + item.score, 0) / secondHalfStrain.length;
    const strainTrend = secondHalfAvgStrain - firstHalfAvgStrain;
    
    // Get recent data points for mini charts
    const recentRecovery = recoveryData.slice(-7); // Last 7 days
    const recentStrain = strainData.slice(-7);
    
    return {
      avgRecovery: Math.round(avgRecovery),
      avgStrain: avgStrain.toFixed(1),
      avgHRV: Math.round(avgHRV),
      avgRestingHR: Math.round(avgRestingHR),
      recoveryTrend,
      strainTrend,
      recentRecovery,
      recentStrain,
      totalDays: recoveryData.length
    };
  }, [data, selectedRange]);

  const getTrendIcon = (trend: number) => {
    if (trend > 2) return <TrendingUp size={16} color={colors.success} />;
    if (trend < -2) return <TrendingDown size={16} color={colors.danger} />;
    return <Minus size={16} color={colors.textSecondary} />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 2) return colors.success;
    if (trend < -2) return colors.danger;
    return colors.textSecondary;
  };

  const getTrendText = (trend: number) => {
    if (Math.abs(trend) < 1) return 'Stable';
    return trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1);
  };

  const renderMiniChart = (data: any[], type: 'recovery' | 'strain') => {
    if (data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(item => type === 'recovery' ? item.score : item.score));
    const minValue = Math.min(...data.map(item => type === 'recovery' ? item.score : item.score));
    const range = maxValue - minValue || 1;
    
    return (
      <View style={styles.miniChart}>
        {data.map((item, index) => {
          const value = type === 'recovery' ? item.score : item.score;
          const height = ((value - minValue) / range) * 30 + 5;
          return (
            <View
              key={index}
              style={[
                styles.chartBar,
                {
                  height,
                  backgroundColor: type === 'recovery' ? colors.recovery.high : colors.warning
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const getRecoveryStatus = (score: number) => {
    if (score >= 67) return { status: 'High', color: colors.recovery.high };
    if (score >= 34) return { status: 'Medium', color: colors.recovery.medium };
    return { status: 'Low', color: colors.recovery.low };
  };

  const getStrainDescription = (score: number) => {
    if (score >= 18) return "All Out";
    if (score >= 14) return "Strenuous";
    if (score >= 10) return "Moderate";
    if (score >= 6) return "Light";
    return "Minimal";
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Trends & Analytics',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
          },
        }} 
      />
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <View style={styles.timeRangeButtons}>
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  selectedRange === range && styles.timeRangeButtonActive
                ]}
                onPress={() => setSelectedRange(range)}
              >
                <Text style={[
                  styles.timeRangeButtonText,
                  selectedRange === range && styles.timeRangeButtonTextActive
                ]}>
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {trendsData ? (
          <>
            {/* Overview Cards */}
            <View style={styles.overviewSection}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.overviewGrid}>
                <View style={styles.overviewCard}>
                  <View style={styles.overviewHeader}>
                    <Heart size={20} color={colors.recovery.high} />
                    <Text style={styles.overviewLabel}>Avg Recovery</Text>
                  </View>
                  <Text style={styles.overviewValue}>{trendsData.avgRecovery}%</Text>
                  <View style={styles.overviewTrend}>
                    {getTrendIcon(trendsData.recoveryTrend)}
                    <Text style={[styles.overviewTrendText, { color: getTrendColor(trendsData.recoveryTrend) }]}>
                      {getTrendText(trendsData.recoveryTrend)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.overviewStatus,
                    { color: getRecoveryStatus(trendsData.avgRecovery).color }
                  ]}>
                    {getRecoveryStatus(trendsData.avgRecovery).status}
                  </Text>
                </View>

                <View style={styles.overviewCard}>
                  <View style={styles.overviewHeader}>
                    <Dumbbell size={20} color={colors.warning} />
                    <Text style={styles.overviewLabel}>Avg Strain</Text>
                  </View>
                  <Text style={styles.overviewValue}>{trendsData.avgStrain}</Text>
                  <View style={styles.overviewTrend}>
                    {getTrendIcon(trendsData.strainTrend)}
                    <Text style={[styles.overviewTrendText, { color: getTrendColor(trendsData.strainTrend) }]}>
                      {getTrendText(trendsData.strainTrend)}
                    </Text>
                  </View>
                  <Text style={styles.overviewStatus}>
                    {getStrainDescription(parseFloat(trendsData.avgStrain))}
                  </Text>
                </View>
              </View>
            </View>

            {/* Detailed Metrics */}
            <View style={styles.metricsSection}>
              <Text style={styles.sectionTitle}>Detailed Metrics</Text>
              
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={styles.metricTitleContainer}>
                    <Heart size={18} color={colors.primary} />
                    <Text style={styles.metricTitle}>Recovery Trends</Text>
                  </View>
                  {renderMiniChart(trendsData.recentRecovery, 'recovery')}
                </View>
                <View style={styles.metricStats}>
                  <View style={styles.metricStat}>
                    <Text style={styles.metricStatLabel}>Average</Text>
                    <Text style={styles.metricStatValue}>{trendsData.avgRecovery}%</Text>
                  </View>
                  <View style={styles.metricStat}>
                    <Text style={styles.metricStatLabel}>Trend</Text>
                    <View style={styles.metricStatTrend}>
                      {getTrendIcon(trendsData.recoveryTrend)}
                      <Text style={[styles.metricStatValue, { color: getTrendColor(trendsData.recoveryTrend) }]}>
                        {getTrendText(trendsData.recoveryTrend)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={styles.metricTitleContainer}>
                    <Activity size={18} color={colors.warning} />
                    <Text style={styles.metricTitle}>Strain Trends</Text>
                  </View>
                  {renderMiniChart(trendsData.recentStrain, 'strain')}
                </View>
                <View style={styles.metricStats}>
                  <View style={styles.metricStat}>
                    <Text style={styles.metricStatLabel}>Average</Text>
                    <Text style={styles.metricStatValue}>{trendsData.avgStrain}</Text>
                  </View>
                  <View style={styles.metricStat}>
                    <Text style={styles.metricStatLabel}>Trend</Text>
                    <View style={styles.metricStatTrend}>
                      {getTrendIcon(trendsData.strainTrend)}
                      <Text style={[styles.metricStatValue, { color: getTrendColor(trendsData.strainTrend) }]}>
                        {getTrendText(trendsData.strainTrend)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.additionalMetricsGrid}>
                <View style={styles.additionalMetricCard}>
                  <Text style={styles.additionalMetricLabel}>Avg HRV</Text>
                  <Text style={styles.additionalMetricValue}>{trendsData.avgHRV} ms</Text>
                </View>
                <View style={styles.additionalMetricCard}>
                  <Text style={styles.additionalMetricLabel}>Avg Resting HR</Text>
                  <Text style={styles.additionalMetricValue}>{trendsData.avgRestingHR} bpm</Text>
                </View>
              </View>
            </View>

            {/* Insights */}
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Insights</Text>
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <BarChart3 size={18} color={colors.primary} />
                  <Text style={styles.insightTitle}>Performance Summary</Text>
                </View>
                <Text style={styles.insightText}>
                  Over the past {selectedRange === '7d' ? '7 days' : selectedRange === '30d' ? '30 days' : '90 days'}, 
                  your average recovery has been {trendsData.avgRecovery}% ({getRecoveryStatus(trendsData.avgRecovery).status.toLowerCase()}) 
                  with an average strain of {trendsData.avgStrain} ({getStrainDescription(parseFloat(trendsData.avgStrain)).toLowerCase()}).
                </Text>
                
                {trendsData.recoveryTrend > 2 && (
                  <View style={styles.insightHighlight}>
                    <TrendingUp size={16} color={colors.success} />
                    <Text style={[styles.insightHighlightText, { color: colors.success }]}>
                      Your recovery is trending upward! Keep up the good work with your current routine.
                    </Text>
                  </View>
                )}
                
                {trendsData.recoveryTrend < -2 && (
                  <View style={styles.insightHighlight}>
                    <TrendingDown size={16} color={colors.danger} />
                    <Text style={[styles.insightHighlightText, { color: colors.danger }]}>
                      Your recovery is declining. Consider focusing on sleep, nutrition, and stress management.
                    </Text>
                  </View>
                )}
                
                {Math.abs(trendsData.recoveryTrend) <= 2 && (
                  <View style={styles.insightHighlight}>
                    <Minus size={16} color={colors.textSecondary} />
                    <Text style={[styles.insightHighlightText, { color: colors.textSecondary }]}>
                      Your recovery is stable. Maintain your current habits for consistent performance.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Calendar size={48} color={colors.textSecondary} />
            <Text style={styles.noDataTitle}>Not Enough Data</Text>
            <Text style={styles.noDataText}>
              We need at least a few days of WHOOP data to show meaningful trends. 
              Keep syncing your data to see insights here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  // Time Range Selector
  timeRangeContainer: {
    marginBottom: 24,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeRangeButtonTextActive: {
    color: colors.text,
  },
  // Overview Section
  overviewSection: {
    marginBottom: 24,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  overviewValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  overviewTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  overviewTrendText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  overviewStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Metrics Section
  metricsSection: {
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  metricStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricStat: {
    alignItems: 'center',
  },
  metricStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  metricStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Mini Chart
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 35,
    gap: 2,
  },
  chartBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 5,
  },
  // Additional Metrics
  additionalMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  additionalMetricCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  additionalMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  additionalMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  // Insights Section
  insightsSection: {
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  insightHighlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  insightHighlightText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  // No Data
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});