import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { 
  MessageSquare, 
  Dumbbell, 
  Apple,
  Settings as SettingsIcon,
  TrendingUp
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWhoopStore } from '@/store/whoopStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Platform, View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { checkWhoopConnection, syncWhoopData } = useWhoopStore();
  
  useEffect(() => {
    const checkPreviousConnection = async () => {
      try {
        const connectionSuccessful = await AsyncStorage.getItem('whoop_connection_successful');
        if (connectionSuccessful === 'true') {
          console.log('Previous connection was successful, already in tabs layout');
          await AsyncStorage.removeItem('whoop_connection_successful');
          const isConnected = await checkWhoopConnection();
          if (isConnected) {
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
  
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const isSmallDevice = SCREEN_WIDTH < 375;
  const hasNotch = SCREEN_HEIGHT >= 812;
  
  const getTabBarHeight = () => {
    if (Platform.OS === 'ios') {
      if (hasNotch) {
        return isSmallDevice ? 85 : 90;
      } else {
        return isSmallDevice ? 70 : 80;
      }
    }
    return 60;
  };
  
  const tabBarHeight = getTabBarHeight();
  
  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? 0 : insets.bottom }]}>      
      <Tabs
        initialRouteName="programs"
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#2A2A2A',
            borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
            height: tabBarHeight,
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
          ...(Platform.OS === 'ios' && {
            tabBarItemStyle: {
              paddingVertical: 4,
            },
          }),
        }}
      >
        <Tabs.Screen
          name="programs"
          options={{
            title: 'Programs',
            tabBarIcon: ({ color, focused }) => (
              <Dumbbell 
                size={isSmallDevice ? 20 : 24} 
                color={color}
                strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, focused }) => (
              <TrendingUp 
                size={isSmallDevice ? 20 : 24} 
                color={color}
                strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Coach',
            tabBarIcon: ({ color, focused }) => (
              <MessageSquare 
                size={isSmallDevice ? 20 : 24} 
                color={color}
                strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color, focused }) => (
              <Apple 
                size={isSmallDevice ? 20 : 24} 
                color={color}
                strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <SettingsIcon 
                size={isSmallDevice ? 20 : 24} 
                color={color}
                strokeWidth={focused && Platform.OS === 'ios' ? 2.5 : 2}
              />
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
  }
});