import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { StrainData } from '@/types/whoop';
import { Dumbbell, Flame } from 'lucide-react-native';

interface StrainCardProps {
  strain: StrainData;
}

export default function StrainCard({ strain }: StrainCardProps) {
  // Get strain level description
  const getStrainDescription = (score: number) => {
    if (score >= 18) return "All Out";
    if (score >= 14) return "Strenuous";
    if (score >= 10) return "Moderate";
    if (score >= 6) return "Light";
    return "Minimal";
  };
  
  // Get strain color based on level
  const getStrainColor = (score: number) => {
    if (score >= 18) return colors.danger;
    if (score >= 14) return '#FF9800'; // Orange
    if (score >= 10) return colors.warning;
    if (score >= 6) return colors.primary;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Strain</Text>
        <Dumbbell size={20} color={colors.textSecondary} />
      </View>
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreText}>{strain.score.toFixed(1)}</Text>
          <View style={[
            styles.strainBadge, 
            { backgroundColor: getStrainColor(strain.score) }
          ]}>
            <Text style={styles.strainBadgeText}>{getStrainDescription(strain.score)}</Text>
          </View>
        </View>
        <View style={styles.scoreBarContainer}>
          <View 
            style={[
              styles.scoreIndicator, 
              { 
                width: `${(strain.score / 21) * 100}%`,
                backgroundColor: getStrainColor(strain.score)
              }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.totalMetrics}>
        <View style={styles.totalMetricItem}>
          <Flame size={18} color={colors.textSecondary} />
          <Text style={styles.totalMetricValue}>{strain.calories} cal</Text>
        </View>
        
        <View style={styles.totalMetricItem}>
          <Text style={styles.metricLabel}>Avg HR</Text>
          <Text style={styles.totalMetricValue}>{strain.averageHeartRate} bpm</Text>
        </View>
        
        <View style={styles.totalMetricItem}>
          <Text style={styles.metricLabel}>Max HR</Text>
          <Text style={styles.totalMetricValue}>{strain.maxHeartRate} bpm</Text>
        </View>
      </View>
      
      <View style={styles.workoutSuggestionContainer}>
        <Text style={styles.workoutSuggestionTitle}>Workout Suggestions</Text>
        <Text style={styles.workoutSuggestionText}>
          {strain.score >= 18 
            ? "Your strain is very high. Focus on recovery today with light stretching or yoga."
            : strain.score >= 14
            ? "Your strain is high. Consider a light to moderate workout or active recovery."
            : strain.score >= 10
            ? "Your strain is moderate. You can handle a normal training session today."
            : "Your strain is low. You're well-positioned for a challenging workout today."}
        </Text>
        
        <View style={styles.workoutTips}>
          <View style={styles.workoutTip}>
            <View style={styles.tipBullet} />
            <Text style={styles.workoutTipText}>
              {strain.score >= 14
                ? "Keep intensity low and focus on technique and mobility"
                : "Focus on progressive overload with proper form"}
            </Text>
          </View>
          <View style={styles.workoutTip}>
            <View style={styles.tipBullet} />
            <Text style={styles.workoutTipText}>
              {strain.score >= 14
                ? "Stay hydrated and prioritize protein intake for recovery"
                : "Ensure adequate warm-up and cool-down periods"}
            </Text>
          </View>
        </View>
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
  scoreContainer: {
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
  },
  strainBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strainBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  scoreBarContainer: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreIndicator: {
    height: 8,
    borderRadius: 4,
  },
  totalMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  totalMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginRight: 4,
  },
  totalMetricValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  workoutSuggestionContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
  },
  workoutSuggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  workoutSuggestionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  workoutTips: {
    marginTop: 8,
  },
  workoutTip: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 8,
  },
  workoutTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});