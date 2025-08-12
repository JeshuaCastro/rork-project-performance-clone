import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { iosCardShadow, iosBorderRadius, isIOS, iosMargins } from '@/utils/ios-helpers';

interface IOSCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: number;
}

export default function IOSCard({ 
  children, 
  style, 
  variant = 'default',
  padding = iosMargins.cardPadding 
}: IOSCardProps) {
  
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.ios.secondaryGroupedBackground,
      borderRadius: iosBorderRadius.large,
      padding,
    };
    
    switch (variant) {
      case 'elevated':
        if (isIOS) {
          Object.assign(baseStyle, iosCardShadow);
        } else {
          baseStyle.elevation = 4;
        }
        break;
      case 'outlined':
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.ios.separator;
        break;
      default:
        // Apply subtle shadow for default cards
        Object.assign(baseStyle, iosCardShadow);
        break;
    }
    
    return baseStyle;
  };
  
  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
}