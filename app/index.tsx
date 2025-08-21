import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const router = useRouter();

  const { checkWhoopConnection, syncWhoopData } = useWhoopStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if we need to redirect after a successful WHOOP connection
        const connectionSuccessful = await AsyncStorage.getItem('whoop_connection_successful');
        
        if (connectionSuccessful === 'true') {
          console.log('Previous connection was successful, syncing data');
          // Clear the flag to prevent future automatic redirects
          await AsyncStorage.removeItem('whoop_connection_successful');
          
          // Check connection status and sync data
          const isConnected = await checkWhoopConnection();
          if (isConnected) {
            await syncWhoopData();
          }
        }
        
        // Small delay to ensure stores are initialized
        setTimeout(() => {
          router.replace('/programs');
        }, 100);
        
      } catch (error) {
        console.error('Error initializing app:', error);
        // Fallback to programs page
        router.replace('/programs');
      }
    };
    
    initializeApp();
  }, [checkWhoopConnection, syncWhoopData, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});