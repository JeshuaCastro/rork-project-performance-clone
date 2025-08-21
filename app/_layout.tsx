import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, StyleSheet } from 'react-native';

export default function RootLayout() {
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