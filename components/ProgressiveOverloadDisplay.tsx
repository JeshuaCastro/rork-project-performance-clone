import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { TrendingUp, TrendingDown, Minus, Target, Calendar, Award } from 'lucide-react-native';
import { WorkoutPerformance } from '@/types/exercises';

interface ProgressiveOverloadDisplayProps {
  exerciseId: string;
  exerciseName: string;
  history: WorkoutPerformance[];
  currentTargets?: {
    reps: number | string;
    weight?: number;
    rpe?: number;
  };
}

export default function ProgressiveOverloadDisplay({
  exerciseId,
  exerciseName,
  history,
  currentTargets
}: ProgressiveOverloadDisplayProps) {
  
  // Get last 3 performances for trend analysis
  const recentHistory = history.slice(-3);
  const lastPerformance = history[history.length - 1];
  
  const getTrendIcon = () => {
    if (recentHistory.length < 2) return <Minus size={16} color={colors.textSecondary} />;
    
    const firstVolume = recentHistory[0].totalVolume;
    const lastVolume = recentHistory[recentHistory.length - 1].totalVolume;
    
    if (lastVolume > firstVolume) {
      return <TrendingUp size={16} color={colors.success} />;
    } else if (lastVolume < firstVolume) {
      return <TrendingDown size={16} color={colors.danger} />;
    }
    return <Minus size={16} color={colors.textSecondary} />;
  };
  
  const getTrendText = () => {
    if (recentHistory.length < 2) return 'No trend data';
    
    const firstVolume = recentHistory[0].totalVolume;
    const lastVolume = recentHistory[recentHistory.length - 1].totalVolume;
    const change = ((lastVolume - firstVolume) / firstVolume * 100);
    
    if (Math.abs(change) < 5) return 'Maintaining';
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };
  
  const getPersonalBest = () => {
    if (history.length === 0) return null;
    
    const bestVolume = Math.max(...history.map(h => h.totalVolume));
    const bestPerformance = history.find(h => h.totalVolume === bestVolume);
    
    if (!bestPerformance) return null;
    
    const bestSet = bestPerformance.sets.reduce((best, current) => {
      const bestWeight = (best.actualWeight || 0) * (best.actualReps || 0);
      const currentWeight = (current.actualWeight || 0) * (current.actualReps || 0);
      return currentWeight > bestWeight ? current : best;
    });
    
    return {
      weight: bestSet.actualWeight,
      reps: bestSet.actualReps,
      date: bestPerformance.date
    };
  };
  
  const personalBest = getPersonalBest();
  
  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Target size={18} color={colors.primary} />
          <Text style={styles.title}>First Time Doing This Exercise</Text>
        </View>
        
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No previous data available</Text>
          <Text style={styles.noDataSubtext}>Focus on proper form and listen to your body</Text>
        </View>
        
        {currentTargets && (
          <View style={styles.targetsContainer}>
            <Text style={styles.targetsTitle}>Today&apos;s Targets</Text>
            <View style={styles.targetRow}>
              <Text style={styles.targetText}>
                {typeof currentTargets.reps === 'string' ? currentTargets.reps : `${currentTargets.reps} reps`}
              </Text>
              {currentTargets.weight && (
                <Text style={styles.targetText}>{currentTargets.weight} lbs</Text>
              )}
              {currentTargets.rpe && (
                <Text style={styles.targetText}>RPE {currentTargets.rpe}</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Target size={18} color={colors.primary} />
        <Text style={styles.title}>Progressive Overload</Text>
        <View style={styles.trendContainer}>
          {getTrendIcon()}
          <Text style={styles.trendText}>{getTrendText()}</Text>
        </View>
      </View>
      
      {/* Last Performance */}
      <View style={styles.lastPerformanceContainer}>
        <View style={styles.sectionHeader}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text style={styles.sectionTitle}>Last Session</Text>
          <Text style={styles.dateText}>{new Date(lastPerformance.date).toLocaleDateString()}</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.setsScroll}>
          {lastPerformance.sets.map((set, index) => (
            <View key={index} style={styles.setCard}>
              <Text style={styles.setNumber}>Set {set.setNumber}</Text>
              <Text style={styles.setDetails}>
                {set.actualReps} × {set.actualWeight || 'BW'}
              </Text>
              {set.actualRPE && (
                <Text style={styles.setRPE}>RPE {set.actualRPE}</Text>
              )}
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.performanceStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Volume</Text>
            <Text style={styles.statValue}>{lastPerformance.totalVolume.toLocaleString()} lbs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg RPE</Text>
            <Text style={styles.statValue}>{lastPerformance.averageRPE.toFixed(1)}/10</Text>
          </View>
        </View>
      </View>
      
      {/* Personal Best */}
      {personalBest && (
        <View style={styles.personalBestContainer}>
          <View style={styles.sectionHeader}>
            <Award size={14} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.warning }]}>Personal Best</Text>
          </View>
          
          <View style={styles.personalBestContent}>
            <Text style={styles.personalBestText}>
              {personalBest.reps} reps × {personalBest.weight || 'bodyweight'} lbs
            </Text>
            <Text style={styles.personalBestDate}>
              {new Date(personalBest.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}
      
      {/* Current Targets */}
      {currentTargets && (
        <View style={styles.targetsContainer}>
          <Text style={styles.targetsTitle}>Today&apos;s Targets</Text>
          <View style={styles.targetRow}>
            <Text style={styles.targetText}>
              {typeof currentTargets.reps === 'string' ? currentTargets.reps : `${currentTargets.reps} reps`}
            </Text>
            {currentTargets.weight && (
              <Text style={styles.targetText}>{currentTargets.weight} lbs</Text>
            )}
            {currentTargets.rpe && (
              <Text style={styles.targetText}>RPE {currentTargets.rpe}</Text>
            )}
          </View>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
    marginLeft: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
  },
  lastPerformanceContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  setsScroll: {
    marginBottom: 12,
  },
  setCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  setNumber: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  setDetails: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  setRPE: {
    fontSize: 10,
    color: colors.primary,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  personalBestContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  personalBestContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personalBestText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  personalBestDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  targetsContainer: {
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  targetsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: 8,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  targetText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});