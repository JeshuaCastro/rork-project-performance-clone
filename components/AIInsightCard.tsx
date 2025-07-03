import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { AIAnalysis } from '@/types/whoop';
import { Brain } from 'lucide-react-native';

interface AIInsightCardProps {
  analysis: AIAnalysis;
}

export default function AIInsightCard({ analysis }: AIInsightCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Coach Insights</Text>
        <Brain size={20} color={colors.primary} />
      </View>
      
      <View style={styles.insightSection}>
        <Text style={styles.sectionTitle}>Recovery Analysis</Text>
        <Text style={styles.insightText}>{analysis.recoveryInsight}</Text>
      </View>
      
      <View style={styles.insightSection}>
        <Text style={styles.sectionTitle}>Training Recommendation</Text>
        <Text style={styles.insightText}>{analysis.trainingRecommendation}</Text>
      </View>
      
      <View style={styles.insightSection}>
        <Text style={styles.sectionTitle}>Long-term Trend</Text>
        <Text style={styles.insightText}>{analysis.longTermTrend}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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