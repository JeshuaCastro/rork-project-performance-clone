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
import { Send, Link, Utensils, Trash2, MoreHorizontal, Activity, Heart, Brain } from 'lucide-react-native';
import ChatMessage from '@/components/ChatMessage';
import { useRouter } from 'expo-router';

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
    clearChatMessages
  } = useWhoopStore();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

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

  const handleHealthEvaluation = async () => {
    if (!isConnectedToWhoop) {
      Alert.alert(
        "WHOOP Connection Required",
        "To get a comprehensive health evaluation, please connect your WHOOP account first.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Connect WHOOP", 
            onPress: () => router.push('/connect-whoop')
          }
        ]
      );
      return;
    }

    if (!hasWhoopData) {
      Alert.alert(
        "Insufficient Data",
        "We need more WHOOP data to provide a comprehensive health evaluation. Please sync your data first.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Sync Data", 
            onPress: () => syncWhoopData()
          }
        ]
      );
      return;
    }

    // Add health evaluation message to chat
    addChatMessage({
      role: 'user',
      content: 'Please provide a comprehensive health evaluation based on my WHOOP data, including recovery patterns, sleep quality, strain levels, and personalized recommendations for improvement.',
    });
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