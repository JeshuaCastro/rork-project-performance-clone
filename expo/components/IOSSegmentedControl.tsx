import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { hapticFeedback, iosBorderRadius, isIOS } from '@/utils/ios-helpers';

interface IOSSegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
  style?: ViewStyle;
  tintColor?: string;
  backgroundColor?: string;
  textColor?: string;
  selectedTextColor?: string;
}

export default function IOSSegmentedControl({
  segments,
  selectedIndex,
  onSelectionChange,
  style,
  tintColor = colors.primary,
  backgroundColor = colors.ios.secondaryBackground,
  textColor = colors.textSecondary,
  selectedTextColor = colors.text
}: IOSSegmentedControlProps) {
  
  const handlePress = (index: number) => {
    if (index === selectedIndex) return;
    
    // iOS haptic feedback
    hapticFeedback.selection();
    onSelectionChange(index);
  };

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            index === selectedIndex && [
              styles.selectedSegment,
              { backgroundColor: tintColor }
            ]
          ]}
          onPress={() => handlePress(index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              { color: textColor },
              index === selectedIndex && [
                styles.selectedSegmentText,
                { color: selectedTextColor }
              ]
            ]}
          >
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: iosBorderRadius.medium,
    padding: 2,
    ...(isIOS && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 0,
    }),
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: iosBorderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  selectedSegment: {
    ...(isIOS && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 0,
    }),
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  selectedSegmentText: {
    fontWeight: '600',
  },
});