import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { exchangeCodeForTokens, storeWhoopTokens, fetchWhoopProfile } from '@/services/whoopApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWhoopStore } from '@/store/whoopStore';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const code = params.code as string;
  const error = params.error as string;
  const errorDescription = params.error_description as string;
  const { syncWhoopData, checkWhoopConnection } = useWhoopStore();
  const [status, setStatus] = useState('Processing WHOOP authorization...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      // Check if there's an error in the callback
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        setErrorMsg(errorDescription || "An error occurred during authorization");
        
        // Redirect back to connect screen with error info
        setTimeout(() => {
          router.replace(`/connect-whoop?error=${error}&error_description=${encodeURIComponent(errorDescription || '')}`);
        }, 1500);
        return;
      }
      
      if (!code) {
        console.error('No code provided in callback');
        setErrorMsg('No authorization code received from WHOOP');
        setTimeout(() => router.replace('/connect-whoop?error=no_code'), 1500);
        return;
      }
      
      try {
        console.log('Received code:', code);
        setStatus('Exchanging authorization code for tokens...');
        
        // Process the OAuth callback
        const tokens = await exchangeCodeForTokens(code);
        
        if (!tokens) {
          console.error('Failed to exchange code for tokens');
          setErrorMsg('Failed to authenticate with WHOOP');
          setTimeout(() => router.replace('/connect-whoop?error=token_exchange_failed'), 1500);
          return;
        }
        
        console.log('Tokens received successfully');
        setStatus('Storing authentication tokens...');
        
        // Store the tokens
        await storeWhoopTokens(tokens);
        
        // Store a flag indicating successful connection to handle browser reopening
        await AsyncStorage.setItem('whoop_connection_successful', 'true');
        
        // Update connection status
        await checkWhoopConnection();
        
        // Fetch and store user profile
        setStatus('Fetching WHOOP profile...');
        const profile = await fetchWhoopProfile();
        if (profile) {
          console.log('Profile fetched successfully');
          await AsyncStorage.setItem('whoop_user_profile', JSON.stringify(profile));
        } else {
          console.warn('Failed to fetch WHOOP profile');
        }
        
        // Sync WHOOP data
        setStatus('Syncing WHOOP data...');
        const syncSuccess = await syncWhoopData();
        console.log('WHOOP data sync result:', syncSuccess);
        
        if (!syncSuccess) {
          console.warn('Failed to sync WHOOP data, but continuing with connection');
          
          // Even if sync fails, try to use mock data for development
          if (__DEV__) {
            console.log('Using mock data for development after sync failure');
            await AsyncStorage.setItem('whoop_last_sync_time', Date.now().toString());
          }
        }
        
        setStatus('Connection successful!');
        
        // Redirect to dashboard after successful connection
        setTimeout(() => router.replace('/(tabs)/index'), 1000);
      } catch (error) {
        console.error('Error processing WHOOP callback:', error);
        setErrorMsg('An unexpected error occurred');
        setTimeout(() => router.replace('/connect-whoop?error=unknown'), 1500);
      }
    };
    
    // Handle different scenarios
    if (error) {
      // Already handled in the beginning of handleCallback
      handleCallback();
    } else if (code) {
      // We have a code, process it
      handleCallback();
    } else if (Platform.OS === 'web') {
      // For web, try to extract code from URL directly
      try {
        const url = new URL(window.location.href);
        const urlCode = url.searchParams.get('code');
        const urlError = url.searchParams.get('error');
        const urlErrorDesc = url.searchParams.get('error_description');
        
        if (urlError) {
          console.error('OAuth error from URL:', urlError, urlErrorDesc);
          setErrorMsg(urlErrorDesc || "An error occurred during authorization");
          setTimeout(() => {
            router.replace(`/connect-whoop?error=${urlError}&error_description=${encodeURIComponent(urlErrorDesc || '')}`);
          }, 1500);
        } else if (urlCode) {
          // Manually set the code and handle the callback
          console.log('Extracted code from URL:', urlCode);
          // We can't update params directly, so we'll handle the code here
          handleCallback();
        } else {
          // Don't show error if we're just loading the page without a code
          console.log('No code found in URL, waiting for redirect from WHOOP');
          setStatus('Waiting for WHOOP authorization...');
        }
      } catch (e) {
        console.error('Error parsing URL:', e);
        setErrorMsg('Error processing authorization');
        setTimeout(() => router.replace('/connect-whoop?error=unknown'), 1500);
      }
    } else {
      // No code provided and not on web - don't show error, just wait
      setStatus('Waiting for WHOOP authorization...');
    }
  }, [code, error, errorDescription]);

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Text style={styles.subtext}>Redirecting...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{status}</Text>
      <Text style={styles.subtext}>Please wait while we process your authorization</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.danger,
    marginTop: 20,
    textAlign: 'center',
    marginBottom: 12,
  }
});