import { Platform, Dimensions, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';

// Device detection utilities
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device size categories
export const isSmallDevice = SCREEN_WIDTH < 375; // iPhone SE, etc.
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414; // iPhone 12/13/14
export const isLargeDevice = SCREEN_WIDTH >= 414; // iPhone 12/13/14 Pro Max, etc.

// Device type detection
export const hasNotch = SCREEN_HEIGHT >= 812; // Devices with notch/Dynamic Island
export const hasHomeIndicator = hasNotch; // Same as notch for our purposes
export const isIPhoneX = SCREEN_HEIGHT === 812 && SCREEN_WIDTH === 375;
export const isIPhoneXR = SCREEN_HEIGHT === 896 && SCREEN_WIDTH === 414;
export const isIPhoneXSMax = SCREEN_HEIGHT === 896 && SCREEN_WIDTH === 414;
export const isIPhone12Mini = SCREEN_HEIGHT === 812 && SCREEN_WIDTH === 375;
export const isIPhone12 = SCREEN_HEIGHT === 844 && SCREEN_WIDTH === 390;
export const isIPhone12ProMax = SCREEN_HEIGHT === 926 && SCREEN_WIDTH === 428;

// Safe area calculations
export const getStatusBarHeight = () => {
  if (!isIOS) return 0;
  
  if (hasNotch) {
    return 44; // Devices with notch
  } else {
    return 20; // Older devices
  }
};

export const getBottomSafeArea = () => {
  if (!isIOS) return 0;
  
  if (hasHomeIndicator) {
    return 34; // Devices with home indicator
  } else {
    return 0; // Devices with home button
  }
};

// Responsive spacing
export const getResponsivePadding = (base: number) => {
  if (isSmallDevice) return base * 0.8;
  if (isLargeDevice) return base * 1.2;
  return base;
};

export const getResponsiveFontSize = (base: number) => {
  if (isSmallDevice) return base - 1;
  if (isLargeDevice) return base + 1;
  return base;
};

// iOS-style haptic feedback
export const hapticFeedback = {
  light: () => {
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  medium: () => {
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  heavy: () => {
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  success: () => {
    if (isIOS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  warning: () => {
    if (isIOS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  error: () => {
    if (isIOS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
  selection: () => {
    if (isIOS) {
      Haptics.selectionAsync();
    }
  }
};

// iOS-style animations
export const iosAnimationConfig = {
  duration: 300,
  useNativeDriver: true,
  tension: 100,
  friction: 8,
};

// iOS-style shadow
export const iosShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 0, // Disable Android elevation
};

// iOS-style card shadow
export const iosCardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 0,
};

// iOS-style border radius
export const iosBorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
};

// Apple-standard spacing (iOS Human Interface Guidelines)
export const iosSpacing = {
  xs: 4,
  sm: 8,
  md: 12,   // Between cards
  lg: 16,   // Card padding
  xl: 20,   // Screen margins
  xxl: 24,  // Section spacing
  xxxl: 32, // Large section spacing
};

// Apple-standard margins
export const iosMargins = {
  screen: 20,        // Standard screen edge margin
  cardPadding: 16,   // Inside card padding
  sectionSpacing: 16, // Between sections
  cardSpacing: 12,   // Between cards in same section
};

// iOS-style typography
export const iosTypography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
  },
};