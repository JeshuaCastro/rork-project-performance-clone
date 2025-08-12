import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useWhoopStore } from '@/store/whoopStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  const { checkWhoopConnection, isConnectedToWhoop, syncWhoopData } = useWhoopStore();
  
  useEffect(() => {
    // Check if we need to redirect after a successful WHOOP connection
    const checkPreviousConnection = async () => {
      try {
        const connectionSuccessful = await AsyncStorage.getItem('whoop_connection_successful');
        
        if (connectionSuccessful === 'true') {
          console.log('Previous connection was successful, redirecting to dashboard');
          // Clear the flag to prevent future automatic redirects
          await AsyncStorage.removeItem('whoop_connection_successful');
          
          // Check connection status
          const isConnected = await checkWhoopConnection();
          
          if (isConnected) {
            // Sync data if needed
            await syncWhoopData();
            // Redirect to dashboard
            router.replace('/');
          }
        }
      } catch (error) {
        console.error('Error checking previous connection:', error);
      }
    };
    
    // Run this check on app startup
    checkPreviousConnection();
    
    // Set up a listener for app becoming active (coming from background)
    const handleAppStateChange = () => {
      checkPreviousConnection();
    };
    
    // Add event listener for app state changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleAppStateChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleAppStateChange);
      };
    }
  }, []);
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#121212" />
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { 
          backgroundColor: '#121212',
        },
        // iOS-specific navigation options
        ...(Platform.OS === 'ios' && {
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animationTypeForReplace: 'push',
        })
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            ...(Platform.OS === 'ios' && {
              gestureEnabled: true,
              gestureDirection: 'vertical',
            })
          }} 
        />
        <Stack.Screen name="connect-whoop" options={{ headerShown: false }} />
        <Stack.Screen name="oauth/callback" options={{ headerShown: false }} />
        <Stack.Screen 
          name="program-detail" 
          options={{ 
            headerShown: false,
            ...(Platform.OS === 'ios' && {
              presentation: 'card',
              gestureEnabled: true,
            })
          }} 
        />
        <Stack.Screen 
          name="activity-detail" 
          options={{ 
            headerShown: false,
            ...(Platform.OS === 'ios' && {
              presentation: 'card',
              gestureEnabled: true,
            })
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            headerShown: false,
            ...(Platform.OS === 'ios' && {
              presentation: 'card',
              gestureEnabled: true,
            })
          }} 
        />
        <Stack.Screen 
          name="privacy" 
          options={{ 
            headerShown: false,
            ...(Platform.OS === 'ios' && {
              presentation: 'card',
              gestureEnabled: true,
            })
          }} 
        />
        <Stack.Screen 
          name="help" 
          options={{ 
            headerShown: false,
            ...(Platform.OS === 'ios' && {
              presentation: 'card',
              gestureEnabled: true,
            })
          }} 
        />
        <Stack.Screen 
          name="health-evaluation" 
          options={{ 
            headerShown: false,
            ...(Platform.OS === 'ios' && {
              presentation: 'card',
              gestureEnabled: true,
            })
          }} 
        />
        <Stack.Screen 
          name="trends" 
          options={{ 
            headerShown: false,
            ...(Platform.OS === 'ios' && {
              presentation: 'card',
              gestureEnabled: true,
            })
          }} 
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  }
});