import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { colors } from '@/constants/colors';
import { AIRecommendation, SmartInsightsData } from '@/types/whoop';
import { useWhoopStore } from '@/store/whoopStore';
import aiRecommendationEngine from '@/services/aiRecommendationEngine';
import {
  Brain,
  Heart,
  Zap,
  Apple,
  Droplets,
  Moon,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sunrise,
  GlassWater,
  Beef,
  Footprints,
  Trees,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react-native';

interface SmartInsightsPanelProps {
  style?: any;
}

const SmartInsightsPanel: React.FC<SmartInsightsPanelProps> = ({ style }) => {
  const [insightsData, setInsightsData] = useState<SmartInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  const {
    data,
    userProfile,
    activePrograms,
    isConnectedToWhoop
  } = useWhoopStore();

  const getRecommendationIcon = (iconName: string, size: number = 20, color: string = colors.primary) => {
    const iconProps = { size, color };
    
    switch (iconName) {
      case 'brain': return <Brain {...iconProps} />;
      case 'heart': return <Heart {...iconProps} />;
      case 'zap': return <Zap {...iconProps} />;
      case 'apple': return <Apple {...iconProps} />;
      case 'droplets': return <Droplets {...iconProps} />;
      case 'moon': return <Moon {...iconProps} />;
      case 'activity': return <Activity {...iconProps} />;
      case 'trending-up': return <TrendingUp {...iconProps} />;
      case 'trending-down': return <TrendingDown {...iconProps} />;
      case 'calendar': return <Calendar {...iconProps} />;
      case 'sunrise': return <Sunrise {...iconProps} />;
      case 'glass-water': return <GlassWater {...iconProps} />;
      case 'beef': return <Beef {...iconProps} />;
      case 'footprints': return <Footprints {...iconProps} />;
      case 'trees': return <Trees {...iconProps} />;
      default: return <Brain {...iconProps} />;
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getCategoryColor = (category: 'recovery' | 'workout' | 'nutrition' | 'lifestyle') => {
    switch (category) {
      case 'recovery': return colors.recovery.high;
      case 'workout': return colors.primary;
      case 'nutrition': return colors.success;
      case 'lifestyle': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const generateInsights = useMemo(() => {
    if (!data?.recovery || !data?.strain || !data?.sleep || !userProfile.name) {
      return null;
    }

    try {
      const context = aiRecommendationEngine.createRecommendationContext(
        data.recovery,
        data.strain,
        data.sleep,
        userProfile,
        activePrograms
      );

      return aiRecommendationEngine.generateRecommendations(context);
    } catch (error) {
      console.error('Error generating insights:', error);
      return null;
    }
  }, [data, userProfile, activePrograms]);

  useEffect(() => {
    if (generateInsights) {
      setInsightsData(generateInsights);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [generateInsights]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      if (generateInsights) {
        setInsightsData(generateInsights);
      }
      setRefreshing(false);
    }, 1000);
  };

  const toggleRecommendation = (id: string) => {
    setExpandedRecommendation(expandedRecommendation === id ? null : id);
  };

  if (!isConnectedToWhoop) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Brain size={24} color={colors.primary} />
          <Text style={styles.title}>Smart Insights</Text>
        </View>
        <View style={styles.noDataContainer}>
          <AlertCircle size={48} color={colors.textSecondary} />
          <Text style={styles.noDataTitle}>Connect WHOOP for AI Insights</Text>
          <Text style={styles.noDataText}>
            Get personalized recommendations based on your recovery, strain, and sleep data.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Brain size={24} color={colors.primary} />
          <Text style={styles.title}>Smart Insights</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generating AI insights...</Text>
        </View>
      </View>
    );
  }

  if (!insightsData) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Brain size={24} color={colors.primary} />
          <Text style={styles.title}>Smart Insights</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <RefreshCw size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.noDataContainer}>
          <AlertCircle size={48} color={colors.textSecondary} />
          <Text style={styles.noDataTitle}>Unable to Generate Insights</Text>
          <Text style={styles.noDataText}>
            We need more data to provide personalized recommendations. Keep syncing your WHOOP data.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Brain size={24} color={colors.primary} />
          <Text style={styles.title}>Smart Insights</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <RefreshCw size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Daily Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <Text style={styles.summaryText}>{insightsData.dailySummary}</Text>
          
          {/* Key Metrics */}
          <View style={styles.keyMetricsContainer}>
            <View style={styles.keyMetric}>
              <Text style={styles.keyMetricLabel}>Recovery Status</Text>
              <Text style={[
                styles.keyMetricValue,
                { color: getCategoryColor('recovery') }
              ]}>
                {insightsData.keyMetrics.recoveryStatus}
              </Text>
            </View>
            
            <View style={styles.keyMetric}>
              <Text style={styles.keyMetricLabel}>Readiness Score</Text>
              <Text style={styles.keyMetricValue}>
                {insightsData.keyMetrics.readinessScore}%
              </Text>
            </View>
            
            <View style={styles.keyMetric}>
              <Text style={styles.keyMetricLabel}>Recommended Intensity</Text>
              <Text style={[
                styles.keyMetricValue,
                { color: getPriorityColor(
                  insightsData.keyMetrics.recommendedIntensity === 'high' ? 'high' :
                  insightsData.keyMetrics.recommendedIntensity === 'low' ? 'low' : 'medium'
                )}
              ]}>
                {insightsData.keyMetrics.recommendedIntensity.charAt(0).toUpperCase() + 
                 insightsData.keyMetrics.recommendedIntensity.slice(1)}
              </Text>
            </View>
          </View>

          {insightsData.keyMetrics.hydrationReminder && (
            <View style={styles.hydrationReminder}>
              <Droplets size={16} color={colors.primary} />
              <Text style={styles.hydrationText}>Hydration reminder active</Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
          
          {insightsData.recommendations.map((recommendation) => (
            <TouchableOpacity
              key={recommendation.id}
              style={styles.recommendationCard}
              onPress={() => toggleRecommendation(recommendation.id)}
              activeOpacity={0.7}
            >
              <View style={styles.recommendationHeader}>
                <View style={styles.recommendationIconContainer}>
                  {getRecommendationIcon(recommendation.icon, 20, getCategoryColor(recommendation.category))}
                </View>
                
                <View style={styles.recommendationContent}>
                  <View style={styles.recommendationTitleRow}>
                    <Text style={styles.recommendationTitle} numberOfLines={1}>
                      {recommendation.title}
                    </Text>
                    <View style={styles.recommendationMeta}>
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(recommendation.priority) }
                      ]}>
                        <Text style={styles.priorityText}>
                          {recommendation.priority.toUpperCase()}
                        </Text>
                      </View>
                      <ChevronRight 
                        size={16} 
                        color={colors.textSecondary}
                        style={{
                          transform: [{ 
                            rotate: expandedRecommendation === recommendation.id ? '90deg' : '0deg' 
                          }]
                        }}
                      />
                    </View>
                  </View>
                  
                  <Text style={styles.recommendationCategory}>
                    {recommendation.category.charAt(0).toUpperCase() + recommendation.category.slice(1)}
                  </Text>
                  
                  <Text style={styles.recommendationDescription} numberOfLines={2}>
                    {recommendation.description}
                  </Text>
                </View>
              </View>

              {expandedRecommendation === recommendation.id && (
                <View style={styles.expandedContent}>
                  <View style={styles.impactContainer}>
                    <View style={styles.impactItem}>
                      <TrendingUp size={14} color={colors.success} />
                      <Text style={styles.impactLabel}>Impact:</Text>
                      <Text style={styles.impactValue}>{recommendation.estimatedImpact}</Text>
                    </View>
                    
                    <View style={styles.impactItem}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.impactLabel}>Timeframe:</Text>
                      <Text style={styles.impactValue}>{recommendation.timeframe}</Text>
                    </View>
                  </View>
                  
                  {recommendation.actionable && (
                    <View style={styles.actionableContainer}>
                      <CheckCircle size={14} color={colors.success} />
                      <Text style={styles.actionableText}>This recommendation is actionable now</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Last Updated */}
        <View style={styles.lastUpdatedContainer}>
          <Text style={styles.lastUpdatedText}>
            Last updated: {insightsData.lastUpdated.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  keyMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keyMetric: {
    alignItems: 'center',
    flex: 1,
  },
  keyMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  keyMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  hydrationReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  hydrationText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  recommendationsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ios.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  recommendationCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  recommendationDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.ios.separator,
  },
  impactContainer: {
    marginBottom: 12,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  impactLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    marginRight: 4,
  },
  impactValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  actionableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 6,
    padding: 8,
  },
  actionableText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 6,
    fontWeight: '500',
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.ios.separator,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default SmartInsightsPanel;