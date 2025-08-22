import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Activity,
  Heart,
  Weight,
  Zap,
  Clock,
  Trophy,
  ChevronRight,
  BarChart3,
  LineChart,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWhoopStore } from '@/store/whoopStore';
import { useProgramStore } from '@/store/programStore';
import ProgressRing from '@/components/ProgressRing';
import IOSSegmentedControl from '@/components/IOSSegmentedControl';
import { DailyMetricsPopup } from '@/components/DailyMetricsPopup';
import { useDailyMetricsPopup } from '@/hooks/useDailyMetricsPopup';

type TimeRange = 'week' | 'month' | 'quarter';

export default function ProgressScreen() {
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('month');
  const { data, activePrograms } = useWhoopStore();
  const { goals, getGoalSummary, getMetricLabel } = useProgramStore();
  const { showPopup, closeDailyPopup, forceShowPopup } = useDailyMetricsPopup();

  // Get current active program
  const currentProgram = activePrograms[0];
  const currentGoal = goals[0];
  const goalSummary = currentGoal ? getGoalSummary(currentGoal.id) : null;

  // Calculate program-relevant metrics based on current program
  const programMetrics = useMemo(() => {
    if (!currentProgram || !data) return [];

    const metrics = [];
    const latestRecovery = data.recovery[0]?.score ?? 0;
    const latestStrain = data.strain[0]?.score ?? 0;
    const latestSleep = data.sleep[0]?.efficiency ?? 0;
    const latestHRV = data.recovery[0]?.hrvMs ?? 0;

    // Always include core metrics
    metrics.push(
      {
        id: 'recovery',
        label: 'Recovery',
        value: Math.round(latestRecovery),
        unit: '%',
        trend: getTrend(data.recovery.slice(0, 7).map(r => r.score)),
        color: latestRecovery > 70 ? colors.success : latestRecovery > 40 ? colors.warning : colors.danger,
        icon: <Heart size={20} color={latestRecovery > 70 ? colors.success : latestRecovery > 40 ? colors.warning : colors.danger} />,
        relevance: 'Essential for all training adaptations',
      },
      {
        id: 'strain',
        label: 'Training Load',
        value: latestStrain.toFixed(1),
        unit: '',
        trend: getTrend(data.strain.slice(0, 7).map(s => s.score)),
        color: colors.primary,
        icon: <Activity size={20} color={colors.primary} />,
        relevance: 'Current training stimulus',
      }
    );

    // Add program-specific metrics
    switch (currentProgram.type) {
      case 'marathon':
      case 'half-marathon':
        metrics.push(
          {
            id: 'hrv',
            label: 'HRV',
            value: Math.round(latestHRV),
            unit: 'ms',
            trend: getTrend(data.recovery.slice(0, 7).map(r => r.hrvMs)),
            color: colors.info,
            icon: <Zap size={20} color={colors.info} />,
            relevance: 'Aerobic adaptation indicator',
          },
          {
            id: 'sleep',
            label: 'Sleep Quality',
            value: Math.round(latestSleep),
            unit: '%',
            trend: getTrend(data.sleep.slice(0, 7).map(s => s.efficiency)),
            color: colors.secondary,
            icon: <Clock size={20} color={colors.secondary} />,
            relevance: 'Critical for endurance recovery',
          }
        );
        break;
      case 'powerlifting':
      case 'hypertrophy':
        metrics.push(
          {
            id: 'sleep',
            label: 'Sleep Quality',
            value: Math.round(latestSleep),
            unit: '%',
            trend: getTrend(data.sleep.slice(0, 7).map(s => s.efficiency)),
            color: colors.secondary,
            icon: <Clock size={20} color={colors.secondary} />,
            relevance: 'Essential for muscle growth',
          },
          {
            id: 'hrv',
            label: 'HRV',
            value: Math.round(latestHRV),
            unit: 'ms',
            trend: getTrend(data.recovery.slice(0, 7).map(r => r.hrvMs)),
            color: colors.info,
            icon: <Zap size={20} color={colors.info} />,
            relevance: 'Nervous system readiness',
          }
        );
        break;
      case 'weight_loss':
        metrics.push(
          {
            id: 'sleep',
            label: 'Sleep Quality',
            value: Math.round(latestSleep),
            unit: '%',
            trend: getTrend(data.sleep.slice(0, 7).map(s => s.efficiency)),
            color: colors.secondary,
            icon: <Clock size={20} color={colors.secondary} />,
            relevance: 'Affects metabolism & hunger',
          }
        );
        break;
    }

    return metrics;
  }, [currentProgram, data]);

  // Helper function to calculate trend
  function getTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    const recent = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const older = values.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
    const diff = recent - older;
    if (Math.abs(diff) < 2) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }

  // Get weekly/monthly summaries
  const getProgressSummary = () => {
    if (!currentProgram || !goalSummary) return null;

    const weeksRemaining = goalSummary.totalWeeks - goalSummary.weeksElapsed;
    const progressRate = goalSummary.percentComplete / goalSummary.weeksElapsed;
    const projectedCompletion = progressRate * goalSummary.totalWeeks;

    return {
      currentProgress: goalSummary.percentComplete,
      weeksElapsed: goalSummary.weeksElapsed,
      weeksRemaining,
      pace: goalSummary.paceVsPlan,
      projectedCompletion: Math.min(100, projectedCompletion),
    };
  };

  const progressSummary = getProgressSummary();

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isSmallDevice = SCREEN_WIDTH < 380;

  if (!currentProgram) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.emptyState}>
          <Trophy size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Active Program</Text>
          <Text style={styles.emptyText}>
            Start a program to track your progress and see detailed metrics relevant to your goals.
          </Text>
          <TouchableOpacity 
            style={styles.startProgramButton}
            onPress={() => router.push('/programs')}
          >
            <Text style={styles.startProgramButtonText}>Browse Programs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Program Goal Progress Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroTitle}>{currentProgram.name}</Text>
              <Text style={styles.heroSubtitle}>
                {currentProgram.targetMetric || 'Your fitness goal'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.heroAction}
              onPress={() => router.push(`/program-detail?id=${currentProgram.id}`)}
            >
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {progressSummary && (
            <View style={styles.progressContainer}>
              <View style={styles.progressRingContainer}>
                <ProgressRing
                  progress={progressSummary.currentProgress}
                  size={120}
                  strokeWidth={8}
                  progressColor={progressSummary.pace === 'ahead' ? colors.success : 
                         progressSummary.pace === 'behind' ? colors.warning : colors.primary}
                />
                <View style={styles.progressCenter}>
                  <Text style={styles.progressPercentage}>
                    {Math.round(progressSummary.currentProgress)}%
                  </Text>
                  <Text style={styles.progressLabel}>Complete</Text>
                </View>
              </View>
              
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>
                    {progressSummary.weeksElapsed}
                  </Text>
                  <Text style={styles.progressStatLabel}>Weeks In</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>
                    {progressSummary.weeksRemaining}
                  </Text>
                  <Text style={styles.progressStatLabel}>Weeks Left</Text>
                </View>
                <View style={styles.progressStat}>
                  <View style={[
                    styles.paceIndicator,
                    { backgroundColor: 
                      progressSummary.pace === 'ahead' ? colors.success :
                      progressSummary.pace === 'behind' ? colors.warning : colors.primary
                    }
                  ]}>
                    {progressSummary.pace === 'ahead' ? 
                      <TrendingUp size={16} color={colors.text} /> :
                      progressSummary.pace === 'behind' ?
                      <TrendingDown size={16} color={colors.text} /> :
                      <Target size={16} color={colors.text} />
                    }
                  </View>
                  <Text style={styles.progressStatLabel}>
                    {progressSummary.pace === 'ahead' ? 'Ahead' :
                     progressSummary.pace === 'behind' ? 'Behind' : 'On Track'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <IOSSegmentedControl
            segments={['Week', 'Month', 'Quarter']}
            selectedIndex={selectedTimeRange === 'week' ? 0 : selectedTimeRange === 'month' ? 1 : 2}
            onSelectionChange={(index: number) => {
              const ranges: TimeRange[] = ['week', 'month', 'quarter'];
              setSelectedTimeRange(ranges[index]);
            }}
          />
        </View>

        {/* Program-Relevant Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Key Metrics for Your Goal</Text>
          <View style={styles.metricsGrid}>
            {programMetrics.map((metric) => (
              <View key={metric.id} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={styles.metricIconContainer}>
                    {metric.icon}
                  </View>
                  <View style={styles.metricTrend}>
                    {metric.trend === 'up' ? (
                      <TrendingUp size={16} color={colors.success} />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown size={16} color={colors.danger} />
                    ) : (
                      <View style={styles.stableTrend} />
                    )}
                  </View>
                </View>
                <Text style={styles.metricValue}>
                  {metric.value}
                  <Text style={styles.metricUnit}>{metric.unit}</Text>
                </Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricRelevance}>{metric.relevance}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Performance Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>This {selectedTimeRange === 'week' ? 'Week' : selectedTimeRange === 'month' ? 'Month' : 'Quarter'}</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/trends')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <BarChart3 size={20} color={colors.primary} />
                <Text style={styles.summaryCardTitle}>Training Load</Text>
              </View>
              <Text style={styles.summaryCardValue}>
                {data.strain.slice(0, 7).reduce((sum, s) => sum + s.score, 0).toFixed(1)}
              </Text>
              <Text style={styles.summaryCardSubtext}>Total strain this week</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Heart size={20} color={colors.success} />
                <Text style={styles.summaryCardTitle}>Avg Recovery</Text>
              </View>
              <Text style={styles.summaryCardValue}>
                {Math.round(data.recovery.slice(0, 7).reduce((sum, r) => sum + r.score, 0) / 7)}%
              </Text>
              <Text style={styles.summaryCardSubtext}>Weekly average</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Track Progress</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/trends')}
            >
              <LineChart size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>View Trends</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/program-detail?id=${currentProgram.id}`)}
            >
              <Target size={24} color={colors.warning} />
              <Text style={styles.actionButtonText}>Update Goal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={forceShowPopup}
            >
              <Activity size={24} color={colors.info} />
              <Text style={styles.actionButtonText}>Daily Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <DailyMetricsPopup
        visible={showPopup}
        onClose={closeDailyPopup}
      />
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 380;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  startProgramButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  startProgramButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Hero Section
  heroSection: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  heroAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Progress Container
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  progressRingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  progressStats: {
    flex: 1,
    gap: 16,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  progressStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  paceIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  // Time Range
  timeRangeContainer: {
    marginBottom: 24,
  },
  
  // Metrics Section
  metricsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    width: (SCREEN_WIDTH - 64) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTrend: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stableTrend: {
    width: 12,
    height: 2,
    backgroundColor: colors.textSecondary,
    borderRadius: 1,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  metricRelevance: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    fontWeight: '500',
  },
  
  // Summary Section
  summarySection: {
    marginBottom: 32,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  summaryCardSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  // Actions Section
  actionsSection: {
    marginBottom: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
});