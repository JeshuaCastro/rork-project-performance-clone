import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';

interface DateSelectorProps {
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function DateSelector({ dates, selectedDate, onSelectDate }: DateSelectorProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateOnly = new Date(dateString);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  // Sort dates in descending order (newest first)
  const sortedDates = [...dates].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {sortedDates.map((date) => (
        <TouchableOpacity
          key={date}
          style={[
            styles.dateItem,
            selectedDate === date && styles.selectedDateItem
          ]}
          onPress={() => onSelectDate(date)}
        >
          <Text style={[
            styles.dayText,
            selectedDate === date && styles.selectedText
          ]}>
            {getDayOfWeek(date)}
          </Text>
          <Text style={[
            styles.dateText,
            selectedDate === date && styles.selectedText
          ]}>
            {formatDate(date)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    minWidth: 80,
  },
  selectedDateItem: {
    backgroundColor: colors.primary,
  },
  dayText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  dateText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.text,
  },
});