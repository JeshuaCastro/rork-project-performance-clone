import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { CheckCircle, Circle, Clock, Zap, ChevronRight } from 'lucide-react-native';
import type { DailyRecommendation } from '@/types/programs';

interface DailyRecommendationCardProps {
  recommendation: DailyRecommendation;
  onPress: () => void;
  onComplete: () => void;
}

const DailyRecommendationCard: React.FC<DailyRecommendationCardProps> = ({
  recommendation,
  onPress,
  onComplete
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, recommendation.completed && styles.completedCard]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.checkButton}
          onPress={onComplete}
        >
          {recommendation.completed ? (
            <CheckCircle size={24} color={colors.success} />
          ) : (
            <Circle size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <View style={styles.textContent}>
          <View style={styles.header}>
            <Text style={[styles.title, recommendation.completed && styles.completedText]}>
              {recommendation.title}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(recommendation.priority) }]}>
                {recommendation.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.description}>{recommendation.description}</Text>
          
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{recommendation.estimatedTime} min</Text>
            </View>
            
            {recommendation.whoopBased && (
              <View style={styles.metaItem}>
                <Zap size={14} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.primary }]}>WHOOP Optimized</Text>
              </View>
            )}
          </View>
        </View>
        
        <ChevronRight size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkButton: {
    marginRight: 16,
  },
  textContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default DailyRecommendationCard;