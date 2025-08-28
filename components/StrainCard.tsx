import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { StrainData } from '@/types/whoop';
import { Dumbbell, Flame } from 'lucide-react-native';
import { iosSpacing, iosMargins, iosTypography, iosCardShadow } from '@/utils/ios-helpers';

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
    if (score >= 14) return colors.warning;
    if (score >= 10) return colors.info;
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