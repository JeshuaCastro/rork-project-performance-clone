import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import RecoveryCard from '@/components/RecoveryCard';
import StrainCard from '@/components/StrainCard';
import AIInsightCard from '@/components/AIInsightCard';
import { colors } from '@/constants/colors';
import type { RecoveryData, StrainData, AIAnalysis } from '@/types/whoop';

const borderColor = '#4A90E2' as const;

interface SleepData {
  totalHours: number;
  efficiency: number;
  stages: {
    deep: number;
    rem: number;
    light: number;
    awake: number;
  };
}

const SleepCard = memo(function SleepCard({ sleep }: { sleep: SleepData }) {
  return (
    <View style={styles.cardContainer} testID="sleep-card">
      <Text style={styles.cardTitle}>Sleep</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.metricText}>Total</Text>
        <Text style={styles.valueText}>{sleep.totalHours.toFixed(1)} h</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.metricText}>Efficiency</Text>
        <Text style={styles.valueText}>{sleep.efficiency}%</Text>
      </View>
      <View style={styles.stageRow}>
        <Text style={styles.stagePill}>Deep {sleep.stages.deep}h</Text>
        <Text style={styles.stagePill}>REM {sleep.stages.rem}h</Text>
        <Text style={styles.stagePill}>Light {sleep.stages.light}h</Text>
        <Text style={styles.stagePill}>Awake {sleep.stages.awake}h</Text>
      </View>
    </View>
  );
});

function DebugDashboard() {
  console.log('[DebugDashboard] render');

  const mockRecovery: RecoveryData = {
    id: 'rec-1',
    date: new Date().toISOString(),
    score: 72,
    status: 'medium',
    restingHeartRate: 48,
    hrvMs: 62,
  };

  const mockStrain: StrainData = {
    id: 'str-1',
    date: new Date().toISOString(),
    score: 12.7,
    calories: 2450,
    averageHeartRate: 132,
    maxHeartRate: 178,
  };

  const mockAI: AIAnalysis = {
    recoveryInsight: 'Your HRV is trending up this week. Maintain consistent sleep and hydration.',
    trainingRecommendation: 'Moderate intensity session: 45–60m zone 2 cardio or full-body strength RPE 6–7.',
    longTermTrend: 'Strain variability decreasing; consider a planned deload in 10–14 days.',
  };

  const mockSleep: SleepData = {
    totalHours: 7.6,
    efficiency: 92,
    stages: { deep: 1.4, rem: 1.9, light: 3.9, awake: 0.4 },
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="debug-dashboard">
      <Text style={styles.header}>Debug Dashboard</Text>

      <View style={styles.debugBlock} testID="recovery-block">
        <Text style={styles.blockLabel}>RecoveryCard</Text>
        <RecoveryCard recovery={mockRecovery} />
      </View>

      <View style={styles.debugBlock} testID="strain-block">
        <Text style={styles.blockLabel}>StrainCard</Text>
        <StrainCard strain={mockStrain} />
      </View>

      <View style={styles.debugBlock} testID="sleep-block">
        <Text style={styles.blockLabel}>SleepCard</Text>
        <SleepCard sleep={mockSleep} />
      </View>

      <View style={styles.debugBlock} testID="ai-block">
        <Text style={styles.blockLabel}>AIAdviceCard</Text>
        <AIInsightCard analysis={mockAI} />
      </View>
    </ScrollView>
  );
}

export default memo(DebugDashboard);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  debugBlock: {
    borderWidth: 2,
    borderColor,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(74,144,226,0.08)'
  },
  blockLabel: {
    color: borderColor,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardContainer: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricText: {
    color: colors.textSecondary,
  },
  valueText: {
    color: colors.text,
    fontWeight: '600',
  },
  stageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8 as number,
    marginTop: 6,
  },
  stagePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.ios.tertiaryBackground,
    color: colors.text,
    marginRight: 8,
    marginBottom: 8,
  },
});
