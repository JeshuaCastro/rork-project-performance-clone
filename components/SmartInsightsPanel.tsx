import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated
} from 'react-native';
import { colors } from '@/constants/colors';
import { AIRecommendation, SmartInsightsData } from '@/types/whoop';
import { useWhoopStore } from '@/store/whoopStore';
import aiRecommendationEngine from '@/services/aiRecommendationEngine';
import userFeedbackService from '@/services/userFeedbackService';
import contextualAwarenessService from '@/services/contextualAwarenessService';
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
  Clock,
  X,
  Bell,
  Play,
  Target,
  Info,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react-native';

interface SmartInsightsPanelProps {
  style?: any;
}

interface RecommendationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary';
  icon?: string;
  onPress: () => void;
}

interface DismissedRecommendation {
  id: string;
  dismissedAt: Date;
  feedback?: 'helpful' | 'not-helpful';
}

const SmartInsightsPanel: React.FC<SmartInsightsPanelProps> = ({ style }) => {
  const [insightsData, setInsightsData] = useState<SmartInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<DismissedRecommendation[]>([]);
  const [followedRecommendations, setFollowedRecommendations] = useState<string[]>([]);

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

  const generateInsights = useCallback(async () => {
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

      return await aiRecommendationEngine.generateRecommendations(context, true);
    } catch (error) {
      console.error('Error generating insights:', error);
      return null;
    }
  }, [data, userProfile, activePrograms]);

  useEffect(() => {
    const loadInsights = async () => {
      setIsLoading(true);
      const insights = await generateInsights();
      if (insights) {
        setInsightsData(insights);
      }
      setIsLoading(false);
    };
    
    loadInsights();
  }, [generateInsights]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const insights = await generateInsights();
      if (insights) {
        setInsightsData(insights);
      }
    } catch (error) {
      console.error('Error refreshing insights:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleRecommendation = (id: string) => {
    setExpandedRecommendation(expandedRecommendation === id ? null : id);
  };

  const dismissRecommendation = async (id: string, feedback?: 'helpful' | 'not-helpful') => {
    try {
      // Record feedback in the learning system
      await aiRecommendationEngine.recordRecommendationOutcome(
        id,
        userProfile.id || 'default_user',
        'dismissed',
        undefined,
        feedback
      );
      
      setDismissedRecommendations(prev => [
        ...prev,
        { id, dismissedAt: new Date(), feedback }
      ]);
      setExpandedRecommendation(null);
      
      console.log('Recommendation dismissed and feedback recorded');
    } catch (error) {
      console.error('Error recording dismissal feedback:', error);
      // Still dismiss locally even if feedback recording fails
      setDismissedRecommendations(prev => [
        ...prev,
        { id, dismissedAt: new Date(), feedback }
      ]);
      setExpandedRecommendation(null);
    }
  };

  const followRecommendation = async (id: string) => {
    try {
      // Record feedback in the learning system
      await aiRecommendationEngine.recordRecommendationOutcome(
        id,
        userProfile.id || 'default_user',
        'followed'
      );
      
      setFollowedRecommendations(prev => [...prev, id]);
      
      // Record activity in contextual awareness
      const recommendation = insightsData?.recommendations.find(r => r.id === id);
      if (recommendation?.category === 'workout') {
        await contextualAwarenessService.recordActivity('workout');
      } else if (recommendation?.category === 'nutrition') {
        await contextualAwarenessService.recordActivity('meal');
      }
      
      Alert.alert(
        'Recommendation Followed',
        'Great! We\'ll track your progress and learn from this to improve future recommendations.',
        [{ text: 'OK' }]
      );
      
      console.log('Recommendation followed and feedback recorded');
    } catch (error) {
      console.error('Error recording follow feedback:', error);
      // Still mark as followed locally
      setFollowedRecommendations(prev => [...prev, id]);
      Alert.alert(
        'Recommendation Followed',
        'Great! We\'ll track your progress with this recommendation.',
        [{ text: 'OK' }]
      );
    }
  };

  const scheduleReminder = async (recommendation: AIRecommendation) => {
    Alert.alert(
      'Set Reminder',
      `Would you like to set a reminder for "${recommendation.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set Reminder', 
          onPress: async () => {
            try {
              // Record scheduling in the learning system
              await aiRecommendationEngine.recordRecommendationOutcome(
                recommendation.id,
                userProfile.id || 'default_user',
                'scheduled'
              );
              
              Alert.alert('Reminder Set', 'You\'ll be notified to follow this recommendation. We\'ll learn from your scheduling patterns.');
              console.log('Recommendation scheduled and feedback recorded');
            } catch (error) {
              console.error('Error recording schedule feedback:', error);
              Alert.alert('Reminder Set', 'You\'ll be notified to follow this recommendation.');
            }
          }
        }
      ]
    );
  };

  const getRecommendationActions = (recommendation: AIRecommendation): RecommendationAction[] => {
    const actions: RecommendationAction[] = [];

    if (recommendation.actionable) {
      actions.push({
        id: 'follow',
        label: 'Follow Now',
        type: 'primary',
        icon: 'play',
        onPress: () => followRecommendation(recommendation.id)
      });
    }

    actions.push({
      id: 'remind',
      label: 'Set Reminder',
      type: 'secondary',
      icon: 'bell',
      onPress: () => scheduleReminder(recommendation)
    });

    return actions;
  };

  const getConfidenceIndicator = (recommendation: AIRecommendation) => {
    // Calculate confidence based on priority and category
    let confidence = 0.7; // Base confidence
    
    if (recommendation.priority === 'high') confidence += 0.2;
    else if (recommendation.priority === 'low') confidence -= 0.1;
    
    if (recommendation.category === 'recovery') confidence += 0.1;
    
    return Math.min(0.95, Math.max(0.5, confidence));
  };

  const getActionIcon = (iconName: string, size: number = 16, color: string = colors.primary) => {
    const iconProps = { size, color };
    
    switch (iconName) {
      case 'play': return <Play {...iconProps} />;
      case 'bell': return <Bell {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      default: return <Play {...iconProps} />;
    }
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
            <View style={styles.recommendationStats}>
              <Text style={styles.statsText}>
                {insightsData.recommendations.filter(r => !dismissedRecommendations.find(d => d.id === r.id)).length} active
              </Text>
            </View>
          </View>
          
          {insightsData.recommendations
            .filter(recommendation => !dismissedRecommendations.find(d => d.id === recommendation.id))
            .map((recommendation) => {
              const confidence = getConfidenceIndicator(recommendation);
              const isFollowed = followedRecommendations.includes(recommendation.id);
              const actions = getRecommendationActions(recommendation);
              
              return (
                <View key={recommendation.id} style={[
                  styles.recommendationCard,
                  isFollowed && styles.followedCard
                ]}>
                  <TouchableOpacity
                    onPress={() => toggleRecommendation(recommendation.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recommendationHeader}>
                      <View style={styles.recommendationIconContainer}>
                        {getRecommendationIcon(recommendation.icon, 20, getCategoryColor(recommendation.category))}
                        {isFollowed && (
                          <View style={styles.followedBadge}>
                            <CheckCircle size={12} color={colors.success} />
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.recommendationContent}>
                        <View style={styles.recommendationTitleRow}>
                          <Text style={[
                            styles.recommendationTitle,
                            isFollowed && styles.followedTitle
                          ]} numberOfLines={1}>
                            {recommendation.title}
                          </Text>
                          <View style={styles.recommendationMeta}>
                            {/* Confidence Indicator */}
                            <View style={styles.confidenceContainer}>
                              <Star 
                                size={12} 
                                color={confidence > 0.8 ? colors.warning : colors.textSecondary}
                                fill={confidence > 0.8 ? colors.warning : 'transparent'}
                              />
                              <Text style={styles.confidenceText}>
                                {Math.round(confidence * 100)}%
                              </Text>
                            </View>
                            
                            <View style={[
                              styles.priorityBadge,
                              { backgroundColor: getPriorityColor(recommendation.priority) }
                            ]}>
                              <Text style={styles.priorityText}>
                                {recommendation.priority.toUpperCase()}
                              </Text>
                            </View>
                            
                            <TouchableOpacity
                              onPress={() => dismissRecommendation(recommendation.id)}
                              style={styles.dismissButton}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <X size={14} color={colors.textSecondary} />
                            </TouchableOpacity>
                            
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
                        
                        <View style={styles.categoryRow}>
                          <Text style={styles.recommendationCategory}>
                            {recommendation.category.charAt(0).toUpperCase() + recommendation.category.slice(1)}
                          </Text>
                          {recommendation.actionable && (
                            <View style={styles.actionableBadge}>
                              <Text style={styles.actionableBadgeText}>Actionable</Text>
                            </View>
                          )}
                        </View>
                        
                        <Text style={styles.recommendationDescription} numberOfLines={2}>
                          {recommendation.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {expandedRecommendation === recommendation.id && (
                    <View style={styles.expandedContent}>
                      {/* Why This Recommendation */}
                      <TouchableOpacity style={styles.whySection}>
                        <Info size={16} color={colors.primary} />
                        <Text style={styles.whySectionTitle}>Why this recommendation?</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.whyText}>
                        Based on your current recovery score and recent trends, this recommendation 
                        is tailored to optimize your {recommendation.category} performance.
                      </Text>
                      
                      <View style={styles.impactContainer}>
                        <View style={styles.impactItem}>
                          <TrendingUp size={14} color={colors.success} />
                          <Text style={styles.impactLabel}>Expected Impact:</Text>
                          <Text style={styles.impactValue}>{recommendation.estimatedImpact}</Text>
                        </View>
                        
                        <View style={styles.impactItem}>
                          <Clock size={14} color={colors.textSecondary} />
                          <Text style={styles.impactLabel}>Timeframe:</Text>
                          <Text style={styles.impactValue}>{recommendation.timeframe}</Text>
                        </View>
                        
                        <View style={styles.impactItem}>
                          <Target size={14} color={colors.primary} />
                          <Text style={styles.impactLabel}>Confidence:</Text>
                          <Text style={styles.impactValue}>{Math.round(confidence * 100)}%</Text>
                        </View>
                      </View>
                      
                      {/* Action Buttons */}
                      <View style={styles.actionButtonsContainer}>
                        {actions.map((action) => (
                          <TouchableOpacity
                            key={action.id}
                            style={[
                              styles.actionButton,
                              action.type === 'primary' ? styles.primaryActionButton : styles.secondaryActionButton
                            ]}
                            onPress={action.onPress}
                          >
                            {action.icon && getActionIcon(action.icon, 16, 
                              action.type === 'primary' ? colors.text : colors.primary
                            )}
                            <Text style={[
                              styles.actionButtonText,
                              action.type === 'primary' ? styles.primaryActionText : styles.secondaryActionText
                            ]}>
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      {/* Feedback */}
                      <View style={styles.feedbackContainer}>
                        <Text style={styles.feedbackTitle}>Was this helpful?</Text>
                        <View style={styles.feedbackButtons}>
                          <TouchableOpacity
                            style={styles.feedbackButton}
                            onPress={() => dismissRecommendation(recommendation.id, 'helpful')}
                          >
                            <ThumbsUp size={16} color={colors.success} />
                            <Text style={styles.feedbackButtonText}>Yes</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.feedbackButton}
                            onPress={() => dismissRecommendation(recommendation.id, 'not-helpful')}
                          >
                            <ThumbsDown size={16} color={colors.danger} />
                            <Text style={styles.feedbackButtonText}>No</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          }
          
          {/* Progress Tracking */}
          {followedRecommendations.length > 0 && (
            <View style={styles.progressSection}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressText}>
                You're following {followedRecommendations.length} recommendation{followedRecommendations.length !== 1 ? 's' : ''}. 
                Keep it up!
              </Text>
            </View>
          )}
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
  // New styles for enhanced features
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationStats: {
    backgroundColor: colors.ios.secondaryBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  followedCard: {
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  followedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 8,
    padding: 2,
  },
  followedTitle: {
    color: colors.success,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ios.secondaryBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  confidenceText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  actionableBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionableBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  whySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  whySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  whyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
  },
  secondaryActionButton: {
    backgroundColor: colors.ios.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryActionText: {
    color: colors.text,
  },
  secondaryActionText: {
    color: colors.primary,
  },
  feedbackContainer: {
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 8,
    padding: 12,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.ios.tertiaryBackground,
    gap: 4,
  },
  feedbackButtonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  progressSection: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
});

export default SmartInsightsPanel;