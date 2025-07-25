import React, { useState, useRef, useEffect } from 'react';
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
  Dimensions
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { Send, Link, Utensils, Trash2, MoreHorizontal, Brain, Zap, CheckCircle, TrendingUp, Target, AlertTriangle, Heart, Activity } from 'lucide-react-native';
import ChatMessage from '@/components/ChatMessage';
import { useRouter } from 'expo-router';

interface AIEvaluation {
  status: string;
  title: string;
  message: string;
  color: string;
  icon: any;
  programInsight?: string;
  trendAnalysis?: string;
  recommendations?: string[];
  actionableSteps?: {
    category: 'recovery' | 'nutrition' | 'training' | 'supplements' | 'sleep';
    action: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  nutritionAdvice?: {
    calorieGuidance?: string;
    proteinFocus?: string;
    hydrationTarget?: string;
    mealTiming?: string;
  };
  supplementSuggestions?: string[];
  confidenceScore?: number;
}

export default function CoachScreen() {
  const router = useRouter();
  const { 
    chatMessages, 
    addChatMessage, 
    isLoading, 
    isConnectedToWhoop,
    data,
    syncWhoopData,
    userProfile,
    clearChatMessages,
    activePrograms,
    getTodaysWorkout,
    getProgramProgress
  } = useWhoopStore();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);

  // Check if we have WHOOP data to provide coaching
  const hasWhoopData = data && data.recovery.length > 0 && data.strain.length > 0;
  // Check if we have user profile data
  const hasProfileData = userProfile && userProfile.name && userProfile.weight > 0 && userProfile.height > 0;
  
  // Get today's data
  const today = new Date().toISOString().split('T')[0];
  const todaysRecovery = data?.recovery?.find(item => item.date === today);
  const todaysStrain = data?.strain?.find(item => item.date === today);
  const todaysSleep = data?.sleep?.find(item => item.date === today);
  const todaysWorkout = getTodaysWorkout();
  
  // Use most recent available data if today's data isn't available yet
  const latestRecovery = data?.recovery?.[0];
  const latestStrain = data?.strain?.[0];
  const latestSleep = data?.sleep?.[0];

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

  // Generate AI-powered daily evaluation
  const generateDailyEvaluation = async () => {
    if (!isConnectedToWhoop || !data?.recovery || data.recovery.length === 0) {
      Alert.alert(
        "WHOOP Connection Required",
        "Please connect your WHOOP account to get AI daily evaluations.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Connect WHOOP", onPress: () => router.push('/connect-whoop') }
        ]
      );
      return;
    }

    setIsLoadingEvaluation(true);
    
    try {
      // Get nutrition data from store
      const { getFoodLogEntriesByDate, getMacroProgressForDate } = useWhoopStore.getState();
      const todaysFoodEntries = getFoodLogEntriesByDate(today);
      const macroProgress = getMacroProgressForDate(today);
      
      // Calculate nutrition metrics
      const calorieProgress = macroProgress.calories.consumed / macroProgress.calories.target;
      const proteinProgress = macroProgress.protein.consumed / macroProgress.protein.target;
      const nutritionQuality = todaysFoodEntries.length > 0 ? 'logged' : 'not-logged';
      
      // Prepare data for AI analysis
      const last7DaysData = {
        recovery: data.recovery.slice(0, 7),
        strain: data.strain?.slice(0, 7) || [],
        sleep: data.sleep?.slice(0, 7) || []
      };

      const currentMetrics = {
        recovery: latestRecovery?.score || 0,
        strain: todaysStrain?.score || (data.strain && data.strain.length > 0 ? data.strain[0].score : 0),
        hrv: latestRecovery?.hrvMs || 0,
        rhr: latestRecovery?.restingHeartRate || 0,
        sleep: todaysSleep?.efficiency || (data.sleep && data.sleep.length > 0 ? data.sleep[0].efficiency : 0)
      };

      // Get program progress for active programs
      const activeProgram = activePrograms.find(p => p.active);
      const programProgress = activeProgram ? getProgramProgress(activeProgram.id) : null;
      
      const programContext = activeProgram ? {
        name: activeProgram.name,
        type: activeProgram.type,
        progress: programProgress,
        todaysWorkout: todaysWorkout
      } : null;

      // Calculate trends
      const last7DaysRecovery = data.recovery.slice(0, 7);
      const avgRecovery = last7DaysRecovery.length > 0 
        ? last7DaysRecovery.reduce((sum, r) => sum + r.score, 0) / last7DaysRecovery.length 
        : 0;
      const avgStrain = (data.strain?.slice(0, 7) || []).length > 0 
        ? (data.strain?.slice(0, 7) || []).reduce((sum, s) => sum + s.score, 0) / (data.strain?.slice(0, 7) || []).length 
        : 0;

      const prompt = `As a fitness and recovery expert, analyze this athlete's data and provide actionable daily recommendations:

CURRENT METRICS (Today):
- Recovery: ${currentMetrics.recovery}%
- Strain: ${currentMetrics.strain}
- HRV: ${currentMetrics.hrv}ms
- Resting HR: ${currentMetrics.rhr}bpm
- Sleep Efficiency: ${currentMetrics.sleep}%

NUTRITION STATUS (Today):
- Calories: ${macroProgress.calories.consumed}/${macroProgress.calories.target} (${(calorieProgress * 100).toFixed(0)}%)
- Protein: ${macroProgress.protein.consumed}g/${macroProgress.protein.target}g (${(proteinProgress * 100).toFixed(0)}%)
- Meals Logged: ${todaysFoodEntries.length}
- Nutrition Quality: ${nutritionQuality}

7-DAY TRENDS:
- Average Recovery: ${avgRecovery.toFixed(1)}%
- Average Strain: ${avgStrain.toFixed(1)}

${programContext ? `TRAINING PROGRAM:
- Program: ${programContext.name} (${programContext.type})
- Today's Workout: ${todaysWorkout?.title || 'Rest Day'}
- Intensity: ${todaysWorkout?.intensity || 'N/A'}
- Progress: ${programContext.progress?.progressPercentage || 0}%` : 'No active training program'}

USER PROFILE:
- Age: ${userProfile.age}, Gender: ${userProfile.gender}
- Weight: ${userProfile.weight}kg, Activity: ${userProfile.activityLevel}
- Goal: ${userProfile.fitnessGoal}

Provide a JSON response with ACTIONABLE recommendations:
{
  "status": "optimal|good|caution|warning|recovery",
  "title": "Brief status title (max 25 chars)",
  "message": "Main insight (max 80 chars)",
  "trendAnalysis": "Analysis of 7-day trends (max 120 chars)",
  "actionableSteps": [
    {
      "category": "recovery|nutrition|training|supplements|sleep",
      "action": "Specific actionable step",
      "reason": "Why this helps today",
      "priority": "high|medium|low"
    }
  ],
  "nutritionAdvice": {
    "calorieGuidance": "Specific calorie advice based on current intake",
    "proteinFocus": "Protein recommendations for recovery/goals",
    "hydrationTarget": "Water intake recommendation",
    "mealTiming": "When to eat for optimal performance/recovery"
  },
  "supplementSuggestions": ["Specific supplements based on recovery/nutrition gaps"],
  "programInsight": "How this relates to training program (max 80 chars)",
  "confidenceScore": 85
}

Focus on ACTIONABLE steps the user can take TODAY to improve recovery, performance, and progress toward their goals.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert fitness and recovery analyst. Provide concise, actionable insights based on biometric data trends.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI evaluation');
      }

      const result = await response.json();
      let aiData;
      
      try {
        const jsonMatch = result.completion.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('AI parsing failed, using fallback:', parseError);
        aiData = generateBasicEvaluation();
      }

      // Map status to colors and icons
      const statusConfig = {
        optimal: { color: colors.success, icon: CheckCircle },
        good: { color: colors.primary, icon: TrendingUp },
        caution: { color: colors.warning, icon: Target },
        warning: { color: colors.danger, icon: AlertTriangle },
        recovery: { color: colors.warning, icon: Heart }
      };

      const config = statusConfig[aiData.status as keyof typeof statusConfig] || statusConfig.good;

      setAiEvaluation({
        ...aiData,
        color: config.color,
        icon: config.icon
      });

    } catch (error) {
      console.error('AI evaluation error:', error);
      Alert.alert(
        "Evaluation Error",
        "Unable to generate AI evaluation. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoadingEvaluation(false);
    }
  };

  // Generate basic evaluation fallback
  const generateBasicEvaluation = () => {
    if (!latestRecovery) return null;
    
    const recoveryScore = latestRecovery.score;
    
    if (recoveryScore >= 75) {
      return {
        status: 'optimal',
        title: 'Excellent Recovery',
        message: `${recoveryScore}% recovery - ready for high intensity`,
        trendAnalysis: 'Your body is primed for performance today',
        actionableSteps: [
          {
            category: 'training' as const,
            action: 'Take advantage of high recovery with intense training',
            reason: 'Your body is primed for performance',
            priority: 'high' as const
          }
        ]
      };
    } else if (recoveryScore >= 50) {
      return {
        status: 'good',
        title: 'Moderate Recovery',
        message: `${recoveryScore}% recovery - proceed with planned training`,
        trendAnalysis: 'Balanced recovery supports moderate training',
        actionableSteps: [
          {
            category: 'training' as const,
            action: 'Stick to planned workout intensity',
            reason: 'Balanced recovery supports moderate training',
            priority: 'high' as const
          }
        ]
      };
    } else {
      return {
        status: 'recovery',
        title: 'Low Recovery',
        message: `${recoveryScore}% recovery - prioritize rest and recovery`,
        trendAnalysis: 'Your body needs more recovery time',
        actionableSteps: [
          {
            category: 'recovery' as const,
            action: 'Reduce training intensity by 30-50%',
            reason: 'Allow body to recover and adapt',
            priority: 'high' as const
          }
        ]
      };
    }
  };

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
      
      {/* AI Daily Evaluation Section */}
      <View style={styles.evaluationSection}>
        <View style={styles.evaluationHeader}>
          <View style={styles.evaluationTitleContainer}>
            <Brain size={20} color={colors.primary} />
            <Text style={styles.evaluationTitle}>AI Daily Evaluation</Text>
          </View>
          <TouchableOpacity 
            style={[styles.evaluateButton, isLoadingEvaluation && styles.evaluateButtonDisabled]}
            onPress={generateDailyEvaluation}
            disabled={isLoadingEvaluation}
          >
            {isLoadingEvaluation ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Zap size={16} color={colors.text} />
            )}
            <Text style={styles.evaluateButtonText}>
              {isLoadingEvaluation ? 'Analyzing...' : 'Get Evaluation'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {aiEvaluation && (
          <View style={styles.evaluationResult}>
            <View style={styles.evaluationStatus}>
              <aiEvaluation.icon size={18} color={aiEvaluation.color} />
              <Text style={[styles.evaluationStatusTitle, { color: aiEvaluation.color }]}>
                {aiEvaluation.title}
              </Text>
              {aiEvaluation.confidenceScore && (
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{aiEvaluation.confidenceScore}%</Text>
                </View>
              )}
            </View>
            <Text style={styles.evaluationMessage}>
              {aiEvaluation.message}
            </Text>
            
            {aiEvaluation.trendAnalysis && (
              <View style={styles.trendContainer}>
                <TrendingUp size={14} color={colors.primary} />
                <Text style={styles.trendText}>{aiEvaluation.trendAnalysis}</Text>
              </View>
            )}
            
            {aiEvaluation.actionableSteps && aiEvaluation.actionableSteps.length > 0 && (
              <View style={styles.actionsContainer}>
                <Text style={styles.actionsTitle}>Priority Actions:</Text>
                {aiEvaluation.actionableSteps.slice(0, 3).map((step, index) => (
                  <View key={index} style={styles.actionItem}>
                    <View style={[styles.priorityDot, { 
                      backgroundColor: step.priority === 'high' ? colors.danger : 
                                     step.priority === 'medium' ? colors.warning : colors.success 
                    }]} />
                    <Text style={styles.actionText}>{step.action}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
      
      {chatMessages.length > 0 && (
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearChat}
          >
            <Trash2 size={18} color={colors.textSecondary} />
            <Text style={styles.clearButtonText}>Clear Chat</Text>
          </TouchableOpacity>
        </View>
      )}
      
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
    </KeyboardAvoidingView>
  );
}

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
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
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
  
  // AI Evaluation Styles
  evaluationSection: {
    backgroundColor: colors.card,
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  evaluationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  evaluationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  evaluateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  evaluateButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  evaluateButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  evaluationResult: {
    marginTop: 12,
  },
  evaluationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  evaluationStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  evaluationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  trendText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
  actionsContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.1)',
  },
  actionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
});