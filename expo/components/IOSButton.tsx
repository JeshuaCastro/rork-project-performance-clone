import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { hapticFeedback, iosShadow, iosBorderRadius, isIOS } from '@/utils/ios-helpers';

interface IOSButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function IOSButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon
}: IOSButtonProps) {
  
  const handlePress = () => {
    if (disabled || loading) return;
    
    // iOS haptic feedback
    if (variant === 'destructive') {
      hapticFeedback.warning();
    } else {
      hapticFeedback.light();
    }
    
    onPress();
  };
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: iosBorderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };
    
    // Size variations
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = 8;
        baseStyle.paddingHorizontal = 16;
        baseStyle.minHeight = 32;
        break;
      case 'large':
        baseStyle.paddingVertical = 16;
        baseStyle.paddingHorizontal = 24;
        baseStyle.minHeight = 50;
        break;
      default: // medium
        baseStyle.paddingVertical = 12;
        baseStyle.paddingHorizontal = 20;
        baseStyle.minHeight = 44; // iOS standard touch target
        break;
    }
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = colors.primary;
        if (isIOS) {
          Object.assign(baseStyle, iosShadow);
        }
        break;
      case 'secondary':
        baseStyle.backgroundColor = colors.card;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.ios.separator;
        break;
      case 'destructive':
        baseStyle.backgroundColor = colors.danger;
        if (isIOS) {
          Object.assign(baseStyle, iosShadow);
        }
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
    }
    
    // Disabled state
    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }
    
    return baseStyle;
  };
  
  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };
    
    // Size variations
    switch (size) {
      case 'small':
        baseTextStyle.fontSize = 14;
        break;
      case 'large':
        baseTextStyle.fontSize = 18;
        break;
      default: // medium
        baseTextStyle.fontSize = 16;
        break;
    }
    
    // Variant text colors
    switch (variant) {
      case 'primary':
      case 'destructive':
        baseTextStyle.color = colors.text;
        break;
      case 'secondary':
        baseTextStyle.color = colors.text;
        break;
      case 'ghost':
        baseTextStyle.color = colors.primary;
        break;
    }
    
    return baseTextStyle;
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'ghost' ? colors.primary : colors.text} 
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyle(), textStyle, icon && { marginLeft: 8 }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}