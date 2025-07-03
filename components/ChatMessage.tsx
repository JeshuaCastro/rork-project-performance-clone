import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { ChatMessage as ChatMessageType } from '@/types/whoop';
import { User, Bot } from 'lucide-react-native';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      <View style={styles.avatarContainer}>
        {isUser ? (
          <User size={20} color={colors.text} />
        ) : (
          <Bot size={20} color={colors.primary} />
        )}
      </View>
      
      <View style={[
        styles.messageContent,
        isUser ? styles.userContent : styles.assistantContent
      ]}>
        <Text style={styles.messageText}>{message.content}</Text>
        <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '90%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  messageContent: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '80%',
  },
  userContent: {
    backgroundColor: colors.primary,
  },
  assistantContent: {
    backgroundColor: '#2A2A2A',
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});