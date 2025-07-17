import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Link as LinkIcon, Shield, CheckCircle, AlertCircle } from 'lucide-react-native';
import { connectToWhoop, getWhoopAuthUrl, exchangeCodeForTokens, storeWhoopTokens } from '@/services/whoopApi';
import { useWhoopStore } from '@/store/whoopStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ConnectWhoopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const error = params.error as string | undefined;
  const errorDescription = params.error_description as string | undefined;
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');
  const { checkWhoopConnection, isConnectedToWhoop, syncWhoopData } = useWhoopStore();
  
  useEffect(() => {
    // Check if connection was successful but browser was closed
    const checkPreviousConnection = async () => {
      try {
        const connectionSuccessful = await AsyncStorage.getItem('whoop_connection_successful');
        const isConnected = await checkWhoopConnection();
        
        if (connectionSuccessful === 'true' && isConnected) {
          console.log('Previous connection was successful, redirecting to dashboard');
          // Clear the flag to prevent future automatic redirects
          await AsyncStorage.removeItem('whoop_connection_successful');
          // Redirect to dashboard
          router.replace('/(tabs)/index');
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error checking previous connection:', error);
        return false;
      }
    };
    
    // Check if already connected
    const initializeScreen = async () => {
      const previouslyConnected = await checkPreviousConnection();
      if (previouslyConnected) return;
      
      const connected = await checkWhoopConnection();
      if (connected) {
        Alert.alert(
          "Already Connected",
          "Your WHOOP account is already connected. Would you like to go to the dashboard?",
          [
            { text: "Stay Here", style: "cancel" },
            { text: "Go to Dashboard", onPress: () => router.replace('/(tabs)/index') }
          ]
        );
      }
      
      // Generate auth URL
      setAuthUrl(getWhoopAuthUrl());
    };
    
    initializeScreen();
    
    // Set up deep link handler
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      
      try {
        // Parse the URL to extract the code
        const url = new URL(event.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setIsConnecting(false);
          
          // Show error message
          Alert.alert(
            "Connection Error",
            errorDescription || "An error occurred while connecting to WHOOP.",
            [{ text: "OK" }]
          );
          
          return;
        }
        
        if (code) {
          console.log('OAuth code received:', code);
          setIsConnecting(true);
          
          // Exchange code for tokens directly here
          const tokens = await exchangeCodeForTokens(code);
          
          if (tokens) {
            await storeWhoopTokens(tokens);
            await AsyncStorage.setItem('whoop_connection_successful', 'true');
            
            // Force update the connection state in the store
            await checkWhoopConnection();
            
            // Sync data immediately after connecting
            await syncWhoopData();
            
            setIsConnecting(false);
            
            // Show success notification and redirect to dashboard
            Alert.alert(
              "Connection Successful",
              "Your WHOOP account has been connected successfully. Your data is now being synced.",
              [{ 
                text: "OK", 
                onPress: () => router.replace('/(tabs)/index') 
              }]
            );
          } else {
            setIsConnecting(false);
            Alert.alert(
              "Connection Error",
              "Failed to exchange authorization code for tokens.",
              [{ text: "OK" }]
            );
          }
        }
      } catch (error) {
        console.error('Error processing deep link:', error);
        setIsConnecting(false);
      }
    };
    
    // Add the event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if the app was opened with a URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      console.log('Connecting to WHOOP with auth URL:', authUrl);
      const success = await connectToWhoop();
      
      if (!success && Platform.OS !== 'web') {
        // Connection failed or was cancelled
        setIsConnecting(false);
        Alert.alert(
          "Connection Cancelled",
          "The WHOOP connection process was cancelled or failed. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error connecting to WHOOP:', error);
      setIsConnecting(false);
      Alert.alert(
        "Connection Error",
        "An error occurred while connecting to WHOOP. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Alternative direct browser open method for troubleshooting
  const handleDirectBrowserOpen = () => {
    const url = getWhoopAuthUrl();
    Linking.openURL(url);
    Alert.alert(
      "Browser Opened",
      "We've opened the WHOOP authorization page in your browser. After authorizing, you'll be redirected back to the app.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isConnecting}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect WHOOP</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Only show error if it came from a redirect with error params */}
        {(error || errorDescription) && (
          <View style={styles.errorContainer}>
            <AlertCircle size={24} color={colors.danger} />
            <Text style={styles.errorText}>
              {error === 'invalid_scope' 
                ? "The WHOOP API configuration has been updated. Please try connecting again." 
                : error === 'token_exchange_failed' 
                  ? "Failed to connect to WHOOP. Please try again." 
                  : error === 'no_code' 
                    ? "No authorization code received from WHOOP." 
                    : errorDescription || "An error occurred while connecting to WHOOP."}
            </Text>
          </View>
        )}
        
        <Text style={styles.title}>Connect Your WHOOP Account</Text>
        
        <Text style={styles.description}>
          Link your WHOOP account to get personalized AI coaching based on your actual recovery, 
          strain, and sleep data. This will enable the app to provide tailored recommendations 
          for your training and recovery.
        </Text>
        
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <CheckCircle size={24} color={colors.success} />
            <Text style={styles.benefitText}>Real-time recovery analysis</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <CheckCircle size={24} color={colors.success} />
            <Text style={styles.benefitText}>Personalized training recommendations</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <CheckCircle size={24} color={colors.success} />
            <Text style={styles.benefitText}>Sleep quality insights</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <CheckCircle size={24} color={colors.success} />
            <Text style={styles.benefitText}>Optimized workout scheduling</Text>
          </View>
        </View>
        
        <View style={styles.privacyContainer}>
          <Shield size={20} color={colors.textSecondary} />
          <Text style={styles.privacyText}>
            Your WHOOP data is securely stored and only used to provide personalized recommendations.
            We never share your data with third parties.
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.connectButton, isConnecting && styles.connectingButton]}
          onPress={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <LinkIcon size={20} color={colors.text} />
              <Text style={styles.connectButtonText}>Connect WHOOP Account</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Alternative direct browser open button for troubleshooting */}
        <TouchableOpacity 
          style={styles.alternativeButton}
          onPress={handleDirectBrowserOpen}
          disabled={isConnecting}
        >
          <Text style={styles.alternativeButtonText}>
            Try Alternative Connection Method
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => Linking.openURL('https://developer.whoop.com')}
        >
          <Text style={styles.learnMoreText}>
            Learn more about WHOOP API
          </Text>
        </TouchableOpacity>
        
        {/* Extra padding at the bottom for iOS */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 80 : 40, // Increased padding for iOS
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 14,
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  privacyContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  privacyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
  },
  connectingButton: {
    backgroundColor: '#3A3A3A',
  },
  connectButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  alternativeButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
  },
  alternativeButtonText: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
  },
  learnMoreText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 60 : 30, // Increased padding at the bottom for iOS
  },
});