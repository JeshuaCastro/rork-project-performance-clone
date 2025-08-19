import React, { useEffect, useRef, useState } from 'react';
import { Tabs } from 'expo-router';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Dumbbell, 
  Apple,
  Settings
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWhoopStore } from '@/store/whoopStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Platform, View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { checkWhoopConnection, syncWhoopData } = useWhoopStore();
  
  // Animation refs for smooth tab transitions
  const tabAnimations = useRef({
    index: new Animated.Value(1),
    coach: new Animated.Value(0.8),
    programs: new Animated.Value(0.8),
    nutrition: new Animated.Value(0.8),
    settings: new Animated.Value(0.8),
  }).current;
  
  const [activeTab, setActiveTab] = useState('index');
  
  // Spring animation configuration for native feel
  const springConfig = {
    tension: 300,
    friction: 20,
    useNativeDriver: Platform.OS !== 'web',
  };
  
  // Ease-out timing configuration for web fallback
  const timingConfig = {
    duration: 250,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: Platform.OS !== 'web',
  };
  
  const animateTabTransition = (newTab: string) => {
    if (newTab === activeTab) return;
    
    const animations: Animated.CompositeAnimation[] = [];
    
    // Animate all tabs
    Object.keys(tabAnimations).forEach((tab) => {
      const targetValue = tab === newTab ? 1 : 0.8;
      
      if (Platform.OS === 'web') {
        // Use timing animation for web compatibility
        animations.push(
          Animated.timing(tabAnimations[tab as keyof typeof tabAnimations], {
            toValue: targetValue,
            ...timingConfig,
          })
        );
      } else {
        // Use spring animation for native platforms
        animations.push(
          Animated.spring(tabAnimations[tab as keyof typeof tabAnimations], {
            toValue: targetValue,
            ...springConfig,
          })
        );
      }
    });
    
    // Run all animations in parallel
    Animated.parallel(animations).start();
    setActiveTab(newTab);
  };
  
  // Custom tab bar icon wrapper with animation
  const AnimatedTabIcon = ({ 
    children, 
    tabName, 
    focused 
  }: { 
    children: React.ReactNode; 
    tabName: string; 
    focused: boolean;
  }) => {
    const scaleAnim = tabAnimations[tabName as keyof typeof tabAnimations];
    
    React.useEffect(() => {
      if (focused) {
        animateTabTransition(tabName);
      }
    }, [focused, tabName]);
    
    return (
      <Animated.View
        style={[
          styles.tabIconContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  };
  
  useEffect(() => {
    // Check if we need to redirect after a successful WHOOP connection
    const checkPreviousConnection = async () => {
      try {
        const connectionSuccessful = await AsyncStorage.getItem('whoop_connection_successful');
        
        if (connectionSuccessful === 'true') {
          console.log('Previous connection was successful, already in tabs layout');
          // Clear the flag to prevent future automatic redirects
          await AsyncStorage.removeItem('whoop_connection_successful');
          
          // Check connection status
          const isConnected = await checkWhoopConnection();
          
          if (isConnected) {
            // Sync data if needed
            await syncWhoopData();
            console.log('Already in tabs layout, data synced');
          }
        }
      } catch (error) {
        console.error('Error checking previous connection in tabs layout:', error);
      }
    };
    
    checkPreviousConnection();
  }, []);
  
  // Get device dimensions for responsive sizing
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const isSmallDevice = SCREEN_WIDTH < 375;
  const isLargeDevice = SCREEN_WIDTH >= 414; // iPhone 11 Pro Max and larger
  const hasNotch = SCREEN_HEIGHT >= 812; // Devices with notch/Dynamic Island
  
  // Calculate tab bar height based on device
  const getTabBarHeight = () => {
    if (Platform.OS === 'ios') {
      if (hasNotch) {
        return isSmallDevice ? 85 : 90; // Devices with notch
      } else {
        return isSmallDevice ? 70 : 80; // Older devices without notch
      }
    }
    return 60; // Android
  };
  
  const tabBarHeight = getTabBarHeight();
  
  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? 0 : insets.bottom }]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#2A2A2A',
            borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
            height: tabBarHeight,
            // iOS-specific styling
            ...(Platform.OS === 'ios' && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 0,
            }),
          },
          tabBarLabelStyle: {
            fontSize: isSmallDevice ? 10 : 12,
            marginBottom: Platform.OS === 'ios' ? 2 : 4,
            fontWeight: Platform.OS === 'ios' ? '600' : '500',
          },
          tabBarIconStyle: {
            marginTop: Platform.OS === 'ios' ? 4 : 0,
          },
          headerStyle: {
            backgroundColor: colors.background,
            borderBottomColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#2A2A2A',
            borderBottomWidth: Platform.OS === 'ios' ? 0.5 : 1,
            // iOS-specific header styling
            ...(Platform.OS === 'ios' && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 0,
            }),
          },
          headerTitleStyle: {
            color: colors.text,
            fontSize: isSmallDevice ? 16 : 18,
            fontWeight: Platform.OS === 'ios' ? '700' : '600',
          },
          headerTintColor: colors.text,
          // iOS-specific tab styling
          ...(Platform.OS === 'ios' && {
            tabBarItemStyle: {
              paddingVertical: 4,
            },
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon tabName="index" focused={focused}>
                <LayoutDashboard 
                  size={isSmallDevice ? 20 : 24} 
                  color={color}
                  strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
                />
              </AnimatedTabIcon>
            ),
            headerTitle: 'WHOOP AI Coach',
          }}
        />

        <Tabs.Screen
          name="coach"
          options={{
            title: 'Coach',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon tabName="coach" focused={focused}>
                <MessageSquare 
                  size={isSmallDevice ? 20 : 24} 
                  color={color}
                  strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
                />
              </AnimatedTabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="programs"
          options={{
            title: 'Programs',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon tabName="programs" focused={focused}>
                <Dumbbell 
                  size={isSmallDevice ? 20 : 24} 
                  color={color}
                  strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
                />
              </AnimatedTabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon tabName="nutrition" focused={focused}>
                <Apple 
                  size={isSmallDevice ? 20 : 24} 
                  color={color}
                  strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
                />
              </AnimatedTabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon tabName="settings" focused={focused}>
                <Settings 
                  size={isSmallDevice ? 20 : 24} 
                  color={color}
                  strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
                />
              </AnimatedTabIcon>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});