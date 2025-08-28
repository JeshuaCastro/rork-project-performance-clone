import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
}

export default function AIInsightCard({ data, analysis }: AIInsightCardProps) {
  const recoveryText = analysis?.recoveryInsight ?? data?.text ?? 'No data';
  const trainingText = analysis?.trainingRecommendation ?? data?.text ?? 'No data';
  const trendText = analysis?.longTermTrend ?? data?.text ?? 'No data';

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
});