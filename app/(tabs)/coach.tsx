import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  Send, 
  Link, 
  Utensils, 
  Trash2, 
  MoreHorizontal, 
  Activity, 
  Heart, 
  Brain,
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  X,
  Moon,
  Zap,
  Shield,
  Target,
  Sparkles
} from 'lucide-react-native';
import ChatMessage from '@/components/ChatMessage';
import { useRouter } from 'expo-router';

interface HealthInsight {
  category: string;
  status: 'good' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  icon: React.ReactNode;
}

export default function CoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    chatMessages, 
    addChatMessage, 
    isLoading, 
    isConnectedToWhoop,
    data,
    syncWhoopData,
    userProfile,
    clearChatMessages
  } = useWhoopStore();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showHealthEvaluation, setShowHealthEvaluation] = useState(false);
  const [healthEvaluation, setHealthEvaluation] = useState<string>('');
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  // Check if we have WHOOP data to provide coaching
  const hasWhoopData = data && data.recovery.length > 0 && data.strain.length > 0;
  // Check if we have user profile data
  const hasProfileData = userProfile && userProfile.name && userProfile.weight > 0 && userProfile.height > 0;

  useEffect(() => {
    // If connected but no data, try to sync
    if (isConnectedToWhoop && !hasWhoopData) {
      syncWhoopData();
    }
  }, [isConnectedToWhoop]);

  // Show typing indicator when loading
  useEffect(() => {
    if (isLoading) {
      setShowTypingIndicator(true);
    } else {
      // Keep the typing indicator visible for a short time after loading completes
      // to make the transition smoother
      const timer = setTimeout(() => {
        setShowTypingIndicator(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSend = () => {
    if (message.trim() === '') return;
    
    if (!isConnectedToWhoop) {
      Alert.alert(
        "WHOOP Connection Recommended",
        "For the best personalized coaching, we recommend connecting your WHOOP account. Would you like to connect now?",
        [
          { text: "Not Now", style: "cancel" },
          { 
            text: "Connect WHOOP", 
            onPress: () => router.push('/connect-whoop')
          }
        ]
      );
    }
    
    if (!hasProfileData) {
      Alert.alert(
        "Complete Your Profile",
        "To get personalized nutrition advice, please complete your profile first.",
        [
          { text: "Later", style: "cancel" },
          { 
            text: "Complete Profile", 
            onPress: () => router.push('/profile')
          }
        ]
      );
    }
    
    // Send message even if no WHOOP data or profile
    addChatMessage({
      role: 'user',
      content: message,
    });
    
    setMessage('');
  };

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all chat messages?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => clearChatMessages()
        }
      ]
    );
  };

  const handleHealthEvaluation = () => {
    setShowHealthEvaluation(true);
    if (isConnectedToWhoop && hasWhoopData) {
      generateHealthEvaluation();
    }
  };

  const closeHealthEvaluation = () => {
    setShowHealthEvaluation(false);
  };

  const generateHealthEvaluation = useCallback(async () => {
    if (!hasWhoopData) return;

    setIsLoadingHealth(true);
    
    try {
      // Get latest data points
      const latestRecovery = data.recovery[data.recovery.length - 1];
      
      // Calculate averages for the last 7 days
      const recentRecovery = data.recovery.slice(-7);
      const recentStrain = data.strain.slice(-7);
      const recentSleep = data.sleep.slice(-7);
      
      const avgRecovery = recentRecovery.reduce((sum, r) => sum + r.score, 0) / recentRecovery.length;
      const avgStrain = recentStrain.reduce((sum, s) => sum + s.score, 0) / recentStrain.length;
      const avgSleepScore = recentSleep.reduce((sum, s) => sum + s.qualityScore, 0) / recentSleep.length;
      const avgSleepHours = recentSleep.reduce((sum, s) => sum + s.duration, 0) / recentSleep.length / 60; // Convert to hours
      
      // Generate insights based on data
      const generatedInsights: HealthInsight[] = [];
      
      // Recovery Analysis
      if (avgRecovery >= 67) {
        generatedInsights.push({
          category: 'Recovery',
          status: 'good',
          title: 'Excellent Recovery',
          description: `Your average recovery score of ${avgRecovery.toFixed(0)}% indicates your body is adapting well to training stress.`,
          recommendations: [
            'Maintain your current recovery routine',
            'Consider gradually increasing training intensity',
            'Continue prioritizing sleep and nutrition'
          ],
          icon: <Shield size={28} color={colors.success} />
        });
      } else if (avgRecovery >= 34) {
        generatedInsights.push({
          category: 'Recovery',
          status: 'warning',
          title: 'Moderate Recovery',
          description: `Your average recovery score of ${avgRecovery.toFixed(0)}% suggests room for improvement in your recovery practices.`,
          recommendations: [
            'Focus on getting 7-9 hours of quality sleep',
            'Consider reducing training intensity temporarily',
            'Incorporate more active recovery sessions',
            'Evaluate stress management techniques'
          ],
          icon: <Target size={28} color={colors.warning} />
        });
      } else {
        generatedInsights.push({
          category: 'Recovery',
          status: 'critical',
          title: 'Low Recovery',
          description: `Your average recovery score of ${avgRecovery.toFixed(0)}% indicates significant recovery debt that needs attention.`,
          recommendations: [
            'Prioritize sleep - aim for 8-9 hours nightly',
            'Reduce training intensity and volume',
            'Consider taking 1-2 complete rest days',
            'Focus on stress reduction and relaxation',
            'Evaluate nutrition and hydration habits'
          ],
          icon: <AlertTriangle size={28} color={colors.danger} />
        });
      }
      
      // Sleep Analysis
      if (avgSleepScore >= 85 && avgSleepHours >= 7) {
        generatedInsights.push({
          category: 'Sleep',
          status: 'good',
          title: 'Quality Sleep',
          description: `Excellent sleep quality with ${avgSleepHours.toFixed(1)} hours average and ${avgSleepScore.toFixed(0)}% sleep score.`,
          recommendations: [
            'Maintain your current sleep schedule',
            'Continue your bedtime routine',
            'Keep your sleep environment optimized'
          ],
          icon: <Moon size={28} color={colors.success} />
        });
      } else if (avgSleepHours < 7 || avgSleepScore < 70) {
        generatedInsights.push({
          category: 'Sleep',
          status: 'warning',
          title: 'Sleep Optimization Needed',
          description: `Average sleep: ${avgSleepHours.toFixed(1)} hours with ${avgSleepScore.toFixed(0)}% quality score. This may be impacting your recovery.`,
          recommendations: [
            'Aim for 7-9 hours of sleep nightly',
            'Establish a consistent bedtime routine',
            'Limit screen time 1 hour before bed',
            'Keep bedroom cool (65-68°F) and dark',
            'Avoid caffeine after 2 PM'
          ],
          icon: <Moon size={28} color={colors.warning} />
        });
      }
      
      // Strain Analysis
      if (avgStrain > 18) {
        generatedInsights.push({
          category: 'Training',
          status: 'warning',
          title: 'High Training Load',
          description: `Your average strain of ${avgStrain.toFixed(1)} indicates very high training stress. Monitor recovery closely.`,
          recommendations: [
            'Ensure adequate recovery between sessions',
            'Consider periodizing your training',
            'Include more low-intensity activities',
            'Monitor recovery scores daily'
          ],
          icon: <Zap size={28} color={colors.warning} />
        });
      } else if (avgStrain < 8) {
        generatedInsights.push({
          category: 'Training',
          status: 'warning',
          title: 'Low Activity Level',
          description: `Your average strain of ${avgStrain.toFixed(1)} suggests you might benefit from increased activity.`,
          recommendations: [
            'Gradually increase daily activity',
            'Add 2-3 structured workouts per week',
            'Include both cardio and strength training',
            'Start with low-intensity activities'
          ],
          icon: <TrendingUp size={28} color={colors.primary} />
        });
      } else {
        generatedInsights.push({
          category: 'Training',
          status: 'good',
          title: 'Balanced Training Load',
          description: `Your average strain of ${avgStrain.toFixed(1)} indicates a well-balanced training approach.`,
          recommendations: [
            'Continue your current training approach',
            'Vary intensity throughout the week',
            'Listen to your body and adjust as needed'
          ],
          icon: <Sparkles size={28} color={colors.success} />
        });
      }
      
      // Heart Rate Variability Analysis
      if (latestRecovery.hrvMs) {
        const recentHRV = recentRecovery.map(r => r.hrvMs).filter(Boolean);
        if (recentHRV.length > 0) {
          const avgHRV = recentHRV.reduce((sum, hrv) => sum + hrv, 0) / recentHRV.length;
          const hrvTrend = recentHRV.length > 3 ? 
            (recentHRV.slice(-3).reduce((sum, hrv) => sum + hrv, 0) / 3) - 
            (recentHRV.slice(0, 3).reduce((sum, hrv) => sum + hrv, 0) / 3) : 0;
          
          if (hrvTrend > 2) {
            generatedInsights.push({
              category: 'Heart Rate Variability',
              status: 'good',
              title: 'Improving HRV Trend',
              description: `Your HRV is trending upward (avg: ${avgHRV.toFixed(1)}ms), indicating improving autonomic nervous system balance.`,
              recommendations: [
                'Continue current recovery practices',
                'Maintain consistent sleep schedule',
                'Keep stress management techniques'
              ],
              icon: <Heart size={28} color={colors.success} />
            });
          } else if (hrvTrend < -2) {
            generatedInsights.push({
              category: 'Heart Rate Variability',
              status: 'warning',
              title: 'Declining HRV Trend',
              description: `Your HRV is trending downward (avg: ${avgHRV.toFixed(1)}ms), which may indicate accumulated stress or fatigue.`,
              recommendations: [
                'Prioritize stress management',
                'Consider reducing training intensity',
                'Focus on relaxation techniques',
                'Ensure adequate sleep quality'
              ],
              icon: <Brain size={28} color={colors.warning} />
            });
          }
        }
      }
      
      setHealthInsights(generatedInsights);
      
      // Generate overall evaluation summary
      const overallStatus = generatedInsights.some(i => i.status === 'critical') ? 'critical' :
                           generatedInsights.some(i => i.status === 'warning') ? 'warning' : 'good';
      
      let evaluationText = '';
      if (overallStatus === 'good') {
        evaluationText = 'Your health metrics show excellent balance and recovery. You\'re managing training stress well and maintaining good sleep quality. Continue your current approach while staying mindful of your body\'s signals.';
      } else if (overallStatus === 'warning') {
        evaluationText = 'Your health metrics indicate some areas for improvement. Focus on the recommendations below to optimize your recovery and performance. Small adjustments to sleep, training, or stress management can make a significant difference.';
      } else {
        evaluationText = 'Your health metrics suggest you need to prioritize recovery immediately. Your body is showing signs of significant stress or fatigue. Consider reducing training intensity and focusing heavily on sleep and stress management.';
      }
      
      setHealthEvaluation(evaluationText);
      
    } catch (error) {
      console.error('Error generating health evaluation:', error);
      Alert.alert('Error', 'Failed to generate health evaluation. Please try again.');
    } finally {
      setIsLoadingHealth(false);
    }
  }, [hasWhoopData, data]);

  const renderEmptyChat = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Ask Your AI Coach</Text>
      <Text style={styles.emptyText}>
        Get personalized advice based on your data. Ask about:
      </Text>
      
      {!isConnectedToWhoop ? (
        <View style={styles.connectContainer}>
          <Text style={styles.connectText}>
            Connect your WHOOP account to get personalized coaching
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => router.push('/connect-whoop')}
          >
            <Link size={18} color={colors.text} />
            <Text style={styles.connectButtonText}>Connect WHOOP</Text>
          </TouchableOpacity>
        </View>
      ) : !hasWhoopData ? (
        <View style={styles.connectContainer}>
          <Text style={styles.connectText}>
            We need to sync your WHOOP data before providing coaching
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => syncWhoopData()}
          >
            <Link size={18} color={colors.text} />
            <Text style={styles.connectButtonText}>Sync WHOOP Data</Text>
          </TouchableOpacity>
        </View>
      ) : !hasProfileData ? (
        <View style={styles.connectContainer}>
          <Text style={styles.connectText}>
            Complete your profile to get personalized nutrition advice
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => router.push('/profile')}
          >
            <Link size={18} color={colors.text} />
            <Text style={styles.connectButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.suggestionsScrollView}
          contentContainerStyle={styles.suggestionsScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.suggestionContainer}>
            <View style={styles.suggestionCategory}>
              <Text style={styles.categoryTitle}>Training</Text>
              {[
                "How should I train today based on my recovery?",
                "Should I take a rest day?",
                "What's the best workout for my current state?",
                "How can I improve my performance?",
                "What's a good workout for low recovery days?"
              ].map((suggestion, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => {
                    addChatMessage({
                      role: 'user',
                      content: suggestion,
                    });
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.suggestionCategory}>
              <Text style={styles.categoryTitle}>Nutrition</Text>
              {[
                "What should I eat after my workout?",
                "Suggest a high-protein breakfast",
                "How can I hit my protein target today?",
                "What should I eat before a morning workout?",
                "How should I adjust my diet on rest days?",
                "What foods help with recovery?"
              ].map((suggestion, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.suggestionButton, styles.nutritionSuggestion]}
                  onPress={() => {
                    addChatMessage({
                      role: 'user',
                      content: suggestion,
                    });
                  }}
                >
                  <Utensils size={16} color={colors.text} style={styles.suggestionIcon} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.suggestionCategory}>
              <Text style={styles.categoryTitle}>Recovery</Text>
              {[
                "What's causing my low recovery scores?",
                "How can I improve my recovery?",
                "How can I reduce my resting heart rate?",
                "What's the best way to recover after a hard workout?",
                "How does sleep affect my recovery?",
                "What recovery techniques should I try?"
              ].map((suggestion, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => {
                    addChatMessage({
                      role: 'user',
                      content: suggestion,
                    });
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!showTypingIndicator) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, styles.typingDotMiddle]} />
          <View style={styles.typingDot} />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="light" />
      
      <View style={styles.headerContainer}>
        {/* Health Evaluation Button */}
        <TouchableOpacity 
          style={styles.healthEvaluationButton}
          onPress={handleHealthEvaluation}
        >
          <Activity size={18} color={colors.text} />
          <Text style={styles.healthEvaluationButtonText}>Health Evaluation</Text>
        </TouchableOpacity>
        
        {chatMessages.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearChat}
          >
            <Trash2 size={18} color={colors.textSecondary} />
            <Text style={styles.clearButtonText}>Clear Chat</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {chatMessages.length === 0 ? (
        renderEmptyChat()
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={({ item }) => <ChatMessage message={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.chatList,
            Platform.OS === 'ios' && { paddingBottom: 80 } // Extra padding for iOS
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderTypingIndicator}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask your AI coach..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          editable={!isLoading}
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            (isLoading || message.trim() === '') && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={isLoading || message.trim() === ''}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Send size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Health Evaluation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHealthEvaluation}
        onRequestClose={closeHealthEvaluation}
        statusBarTranslucent={true}
      >
        <View style={[healthStyles.modalOverlay, { paddingTop: insets.top }]}>
          <StatusBar style="light" />
          <View style={[healthStyles.modalContainer, { paddingBottom: insets.bottom }]}>
            <View style={healthStyles.modalContent}>
              {/* Close Button */}
              <TouchableOpacity style={healthStyles.closeButton} onPress={closeHealthEvaluation}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <ScrollView 
                style={healthStyles.modalScrollView}
                contentContainerStyle={healthStyles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {!isConnectedToWhoop ? (
                  <View style={healthStyles.emptyStateContainer}>
                    <View style={healthStyles.emptyStateIcon}>
                      <Activity size={48} color={colors.primary} />
                    </View>
                    <Text style={healthStyles.emptyStateTitle}>WHOOP Connection Required</Text>
                    <Text style={healthStyles.emptyStateDescription}>
                      To get a comprehensive health evaluation, please connect your WHOOP account first.
                    </Text>
                    <TouchableOpacity 
                      style={healthStyles.emptyStateButton} 
                      onPress={() => {
                        closeHealthEvaluation();
                        router.push('/connect-whoop');
                      }}
                    >
                      <Text style={healthStyles.emptyStateButtonText}>Connect WHOOP</Text>
                    </TouchableOpacity>
                  </View>
                ) : !hasWhoopData ? (
                  <View style={healthStyles.emptyStateContainer}>
                    <View style={healthStyles.emptyStateIcon}>
                      <RefreshCw size={48} color={colors.primary} />
                    </View>
                    <Text style={healthStyles.emptyStateTitle}>Insufficient Data</Text>
                    <Text style={healthStyles.emptyStateDescription}>
                      We need more WHOOP data to provide a comprehensive health evaluation. Please sync your data first.
                    </Text>
                    <TouchableOpacity 
                      style={healthStyles.emptyStateButton} 
                      onPress={() => {
                        syncWhoopData();
                        closeHealthEvaluation();
                      }}
                    >
                      <Text style={healthStyles.emptyStateButtonText}>Sync Data</Text>
                    </TouchableOpacity>
                  </View>
                ) : isLoadingHealth ? (
                  <View style={healthStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={healthStyles.loadingText}>Analyzing your health data...</Text>
                  </View>
                ) : (
                  <>
                    {/* Header */}
                    <View style={healthStyles.modalHeader}>
                      <View style={healthStyles.headerIconContainer}>
                        <Activity size={32} color={colors.primary} />
                      </View>
                      <Text style={healthStyles.modalTitle}>Health Analysis</Text>
                      <Text style={healthStyles.modalSubtitle}>Comprehensive wellness overview</Text>
                    </View>

                    {/* Overall Status */}
                    <View style={healthStyles.overallStatusContainer}>
                      <View style={[
                        healthStyles.overallStatusBadge,
                        { backgroundColor: getStatusBackground(healthInsights.some(i => i.status === 'critical') ? 'critical' : healthInsights.some(i => i.status === 'warning') ? 'warning' : 'good') }
                      ]}>
                        <Text style={[
                          healthStyles.overallStatusText,
                          { color: getStatusColor(healthInsights.some(i => i.status === 'critical') ? 'critical' : healthInsights.some(i => i.status === 'warning') ? 'warning' : 'good') }
                        ]}>
                          {healthInsights.some(i => i.status === 'critical') ? 'Needs Attention' : healthInsights.some(i => i.status === 'warning') ? 'Good Progress' : 'Excellent Health'}
                        </Text>
                      </View>
                      <Text style={healthStyles.evaluationSummary}>{healthEvaluation}</Text>
                    </View>

                    {/* Insights Grid */}
                    <View style={healthStyles.insightsGrid}>
                      {healthInsights.map((insight, index) => (
                        <View key={index} style={[
                          healthStyles.insightItem,
                          { borderLeftColor: getStatusColor(insight.status) }
                        ]}>
                          <View style={healthStyles.insightItemHeader}>
                            <View style={[
                              healthStyles.insightIconContainer,
                              { backgroundColor: getStatusBackground(insight.status) }
                            ]}>
                              {insight.icon}
                            </View>
                            <View style={healthStyles.insightItemContent}>
                              <Text style={healthStyles.insightItemCategory}>{insight.category}</Text>
                              <Text style={healthStyles.insightItemTitle}>{insight.title}</Text>
                            </View>
                          </View>
                          <Text style={healthStyles.insightItemDescription}>{insight.description}</Text>
                          
                          {insight.recommendations.length > 0 && (
                            <View style={healthStyles.recommendationsContainer}>
                              <Text style={healthStyles.recommendationsHeader}>Key Actions:</Text>
                              {insight.recommendations.slice(0, 2).map((rec, recIndex) => (
                                <Text key={recIndex} style={healthStyles.recommendationItem}>
                                  • {rec}
                                </Text>
                              ))}
                              {insight.recommendations.length > 2 && (
                                <Text style={healthStyles.moreRecommendations}>
                                  +{insight.recommendations.length - 2} more recommendations
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={healthStyles.actionButtons}>
                      <TouchableOpacity 
                        style={healthStyles.refreshButton} 
                        onPress={generateHealthEvaluation}
                        disabled={isLoadingHealth}
                      >
                        <RefreshCw size={18} color={colors.primary} />
                        <Text style={healthStyles.refreshButtonText}>Refresh Analysis</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'good': return colors.success;
    case 'warning': return colors.warning;
    case 'critical': return colors.danger;
    default: return colors.textSecondary;
  }
};

const getStatusBackground = (status: string) => {
  switch (status) {
    case 'good': return 'rgba(34, 197, 94, 0.1)';
    case 'warning': return 'rgba(251, 191, 36, 0.1)';
    case 'critical': return 'rgba(239, 68, 68, 0.1)';
    default: return 'rgba(156, 163, 175, 0.1)';
  }
};

// Get device dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const bottomPadding = Platform.OS === 'ios' ? (isSmallDevice ? 80 : 100) : 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatList: {
    padding: 16,
    paddingBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 12, // Extra padding for iOS
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#3A3A3A',
  },
  emptyContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  suggestionsScrollView: {
    flex: 1,
    width: '100%',
  },
  suggestionsScrollContent: {
    paddingBottom: bottomPadding, // Consistent padding for iOS
  },
  suggestionContainer: {
    width: '100%',
  },
  suggestionCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  nutritionSuggestion: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    color: colors.text,
    fontSize: 14,
  },
  connectContainer: {
    width: '100%',
    alignItems: 'center',
  },
  connectText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  connectButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  healthEvaluationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  healthEvaluationButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: 6,
  },
  typingContainer: {
    padding: 16,
    alignItems: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
    marginHorizontal: 2,
    opacity: 0.6,
    transform: [{ scale: 1 }],
    animationName: 'bounce',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
  typingDotMiddle: {
    animationDelay: '0.2s',
    opacity: 0.8,
  },
});

const healthStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ios?.quaternaryBackground || '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ios?.systemFill || '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overallStatusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  overallStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  overallStatusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  evaluationSummary: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  insightsGrid: {
    gap: 16,
  },
  insightItem: {
    backgroundColor: colors.ios?.secondaryBackground || '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  insightItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightItemContent: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  insightItemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  insightItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  insightItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  recommendationsContainer: {
    backgroundColor: colors.ios?.tertiaryBackground || '#1A1A1A',
    borderRadius: 12,
    padding: 12,
  },
  recommendationsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  moreRecommendations: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ios?.separator || '#2A2A2A',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ios?.systemFill || '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  // Empty States
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.ios?.systemFill || '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});