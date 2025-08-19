import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { colors } from '@/constants/colors';
import { AIRecommendation, SmartInsightsData } from '@/types/whoop';
import { useWhoopStore } from '@/store/whoopStore';
import aiRecommendationEngine from '@/services/aiRecommendationEngine';
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
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] = useState(0);
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

  const selectRecommendation = (index: number) => {
    setSelectedRecommendationIndex(index);
  };

  const dismissRecommendation = async (id: string, feedback?: 'helpful' | 'not-helpful') => {
    try {
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
      
      console.log('Recommendation dismissed and feedback recorded');
    } catch (error) {
      console.error('Error recording dismissal feedback:', error);
      setDismissedRecommendations(prev => [
        ...prev,
        { id, dismissedAt: new Date(), feedback }
      ]);
    }
  };

  const followRecommendation = async (id: string) => {
    try {
      await aiRecommendationEngine.recordRecommendationOutcome(
        id,
        userProfile.id || 'default_user',
        'followed'
      );
      
      setFollowedRecommendations(prev => [...prev, id]);
      
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
    let confidence = 0.7;
    
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

  const activeRecommendations = insightsData.recommendations
    .filter(recommendation => !dismissedRecommendations.find(d => d.id === recommendation.id));

  const renderRecommendationTabs = () => {
    if (activeRecommendations.length === 0) {
      return (
        <View style={styles.noRecommendationsContainer}>
          <CheckCircle size={48} color={colors.success} />
          <Text style={styles.noRecommendationsTitle}>All caught up!</Text>
          <Text style={styles.noRecommendationsText}>
            You've addressed all current recommendations. Keep up the great work!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContainer}>
        {/* Tab Headers */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
          contentContainerStyle={styles.tabScrollContent}
        >
          {activeRecommendations.map((recommendation, index) => {
            const isSelected = selectedRecommendationIndex === index;
            const isFollowed = followedRecommendations.includes(recommendation.id);
            
            return (
              <TouchableOpacity
                key={recommendation.id}
                style={[
                  styles.tabHeader,
                  isSelected && styles.selectedTabHeader,
                  isFollowed && styles.followedTabHeader
                ]}
                onPress={() => selectRecommendation(index)}
              >
                <View style={styles.tabIconContainer}>
                  {getRecommendationIcon(
                    recommendation.icon, 
                    16, 
                    isSelected ? colors.text : getCategoryColor(recommendation.category)
                  )}
                  {isFollowed && (
                    <View style={styles.tabFollowedBadge}>
                      <CheckCircle size={8} color={colors.success} />
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.tabHeaderText,
                  isSelected && styles.selectedTabHeaderText,
                  isFollowed && styles.followedTabHeaderText
                ]} numberOfLines={2}>
                  {recommendation.title}
                </Text>
                <View style={[
                  styles.tabPriorityIndicator,
                  { backgroundColor: getPriorityColor(recommendation.priority) }
                ]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Tab Content */}
        {renderTabContent()}
      </View>
    );
  };

  const renderTabContent = () => {
    const selectedRecommendation = activeRecommendations[selectedRecommendationIndex];
    if (!selectedRecommendation) return null;
    
    const confidence = getConfidenceIndicator(selectedRecommendation);
    const isFollowed = followedRecommendations.includes(selectedRecommendation.id);
    const actions = getRecommendationActions(selectedRecommendation);
    
    return (
      <View style={[
        styles.tabContent,
        isFollowed && styles.followedTabContent
      ]}>
        {/* Header */}
        <View style={styles.tabContentHeader}>
          <View style={styles.tabContentTitleRow}>
            <View style={styles.tabContentIconContainer}>
              {getRecommendationIcon(
                selectedRecommendation.icon, 
                24, 
                getCategoryColor(selectedRecommendation.category)
              )}
              {isFollowed && (
                <View style={styles.contentFollowedBadge}>
                  <CheckCircle size={12} color={colors.success} />
                </View>
              )}
            </View>
            
            <View style={styles.tabContentTitleContainer}>
              <Text style={[
                styles.tabContentTitle,
                isFollowed && styles.followedContentTitle
              ]}>
                {selectedRecommendation.title}
              </Text>
              
              <View style={styles.tabContentMeta}>
                <Text style={styles.tabContentCategory}>
                  {selectedRecommendation.category.charAt(0).toUpperCase() + selectedRecommendation.category.slice(1)}
                </Text>
                
                <View style={[
                  styles.contentPriorityBadge,
                  { backgroundColor: getPriorityColor(selectedRecommendation.priority) }
                ]}>
                  <Text style={styles.contentPriorityText}>
                    {selectedRecommendation.priority.toUpperCase()}
                  </Text>
                </View>
                
                {selectedRecommendation.actionable && (
                  <View style={styles.contentActionableBadge}>
                    <Text style={styles.contentActionableBadgeText}>Actionable</Text>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              onPress={() => dismissRecommendation(selectedRecommendation.id)}
              style={styles.contentDismissButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Description */}
        <Text style={styles.tabContentDescription}>
          {selectedRecommendation.description}
        </Text>
        
        {/* Why This Recommendation */}
        <View style={styles.tabWhySection}>
          <View style={styles.tabWhySectionHeader}>
            <Info size={16} color={colors.primary} />
            <Text style={styles.tabWhySectionTitle}>Why this recommendation?</Text>
          </View>
          <Text style={styles.tabWhyText}>
            Based on your current recovery score and recent trends, this recommendation 
            is tailored to optimize your {selectedRecommendation.category} performance.
          </Text>
        </View>
        
        {/* Impact Metrics */}
        <View style={styles.tabImpactContainer}>
          <View style={styles.tabImpactItem}>
            <TrendingUp size={16} color={colors.success} />
            <View style={styles.tabImpactContent}>
              <Text style={styles.tabImpactLabel}>Expected Impact</Text>
              <Text style={styles.tabImpactValue}>{selectedRecommendation.estimatedImpact}</Text>
            </View>
          </View>
          
          <View style={styles.tabImpactItem}>
            <Clock size={16} color={colors.textSecondary} />
            <View style={styles.tabImpactContent}>
              <Text style={styles.tabImpactLabel}>Timeframe</Text>
              <Text style={styles.tabImpactValue}>{selectedRecommendation.timeframe}</Text>
            </View>
          </View>
          
          <View style={styles.tabImpactItem}>
            <Star size={16} color={confidence > 0.8 ? colors.warning : colors.textSecondary} />
            <View style={styles.tabImpactContent}>
              <Text style={styles.tabImpactLabel}>Confidence</Text>
              <Text style={styles.tabImpactValue}>{Math.round(confidence * 100)}%</Text>
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.tabActionButtonsContainer}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.tabActionButton,
                action.type === 'primary' ? styles.tabPrimaryActionButton : styles.tabSecondaryActionButton
              ]}
              onPress={action.onPress}
            >
              {action.icon && getActionIcon(action.icon, 18, 
                action.type === 'primary' ? colors.text : colors.primary
              )}
              <Text style={[
                styles.tabActionButtonText,
                action.type === 'primary' ? styles.tabPrimaryActionText : styles.tabSecondaryActionText
              ]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Feedback */}
        <View style={styles.tabFeedbackContainer}>
          <Text style={styles.tabFeedbackTitle}>Was this helpful?</Text>
          <View style={styles.tabFeedbackButtons}>
            <TouchableOpacity
              style={styles.tabFeedbackButton}
              onPress={() => dismissRecommendation(selectedRecommendation.id, 'helpful')}
            >
              <ThumbsUp size={16} color={colors.success} />
              <Text style={styles.tabFeedbackButtonText}>Yes, helpful</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabFeedbackButton}
              onPress={() => dismissRecommendation(selectedRecommendation.id, 'not-helpful')}
            >
              <ThumbsDown size={16} color={colors.danger} />
              <Text style={styles.tabFeedbackButtonText}>Not helpful</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

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
                {activeRecommendations.length} active
              </Text>
            </View>
          </View>
          
          {renderRecommendationTabs()}
          
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
  progressSection: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
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
  // Tab-based recommendation styles
  noRecommendationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noRecommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noRecommendationsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabContainer: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabScrollView: {
    maxHeight: 120,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabHeader: {
    width: 100,
    minHeight: 90,
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTabHeader: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  followedTabHeader: {
    borderColor: colors.success,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ios.tertiaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabFollowedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 6,
    padding: 1,
  },
  tabHeaderText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
  },
  selectedTabHeaderText: {
    color: colors.text,
    fontWeight: '600',
  },
  followedTabHeaderText: {
    color: colors.success,
  },
  tabPriorityIndicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  tabContent: {
    padding: 20,
    backgroundColor: colors.ios.secondaryBackground,
  },
  followedTabContent: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  tabContentHeader: {
    marginBottom: 16,
  },
  tabContentTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabContentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.ios.tertiaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  contentFollowedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 8,
    padding: 2,
  },
  tabContentTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  tabContentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    flexWrap: 'wrap',
  },
  followedContentTitle: {
    color: colors.success,
  },
  tabContentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tabContentCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  contentPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contentPriorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  contentActionableBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contentActionableBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  contentDismissButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabContentDescription: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  tabWhySection: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tabWhySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tabWhySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  tabWhyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  tabImpactContainer: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  tabImpactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabImpactContent: {
    flex: 1,
    minWidth: 0,
  },
  tabImpactLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  tabImpactValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  tabActionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tabActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  tabPrimaryActionButton: {
    backgroundColor: colors.primary,
  },
  tabSecondaryActionButton: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tabActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  tabPrimaryActionText: {
    color: colors.text,
  },
  tabSecondaryActionText: {
    color: colors.primary,
  },
  tabFeedbackContainer: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 16,
  },
  tabFeedbackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  tabFeedbackButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tabFeedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.ios.secondaryBackground,
    gap: 6,
  },
  tabFeedbackButtonText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
});

export default SmartInsightsPanel;