import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WhoopData, RecoveryData, StrainData } from '@/types/whoop';

// WHOOP API configuration
const WHOOP_CLIENT_ID = 'acb83b21-9201-481e-8297-acbc6b2a9d25';
const WHOOP_CLIENT_SECRET = 'ec0310e3f5121aee71c8fee99297b9bd6c4bc613059f5475a656adaec60de09c';
// Updated to use deep linking with correct scheme
const WHOOP_REDIRECT_URI = 'myapp://oauth/callback';
const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
// Updated API base URL to match current WHOOP API version
const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v1';

// Required scopes for our app - REMOVED read:strain as it's not allowed for our client
// We'll extract strain data from cycles instead
// Added read:sleep to access user sleep data
const WHOOP_SCOPES = [
  'read:recovery',
  'read:cycles',
  'read:sleep',
  'read:profile',
  'read:body_measurement',
  'offline'
].join(' ');

// Storage keys
export const WHOOP_ACCESS_TOKEN_KEY = 'whoop_access_token';
export const WHOOP_REFRESH_TOKEN_KEY = 'whoop_refresh_token';
export const WHOOP_TOKEN_EXPIRY_KEY = 'whoop_token_expiry';
export const WHOOP_USER_PROFILE_KEY = 'whoop_user_profile';
export const WHOOP_LAST_SYNC_DATA_KEY = 'whoop_last_sync_data';
export const WHOOP_LAST_SYNC_TIME_KEY = 'whoop_last_sync_time';
export const WHOOP_NEXT_SYNC_TIME_KEY = 'whoop_next_sync_time';

export interface WhoopTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generates and returns the full WHOOP authorization URL
 */
export const getWhoopAuthUrl = (): string => {
  // Generate a random state value for security
  const state = Math.random().toString(36).substring(2, 15);
  
  // Construct the authorization URL with the deep link redirect URI
  const authUrl = `${WHOOP_AUTH_URL}?client_id=${WHOOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(WHOOP_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(WHOOP_SCOPES)}&state=${state}`;
  
  console.log('Generated WHOOP Auth URL:', authUrl);
  return authUrl;
};

/**
 * Initiates the WHOOP OAuth flow
 */
export const connectToWhoop = async (): Promise<boolean> => {
  try {
    // Generate the authorization URL
    const authUrl = getWhoopAuthUrl();
    
    console.log('Opening WHOOP Auth URL:', authUrl);
    
    // For iOS and Android, use different approaches
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // On mobile, use WebBrowser with more options for better compatibility
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl, 
        WHOOP_REDIRECT_URI,
        {
          showInRecents: true,
          createTask: true,
          enableDefaultShareMenuItem: false,
          toolbarColor: '#000000', // Match app theme
          dismissButtonStyle: 'cancel', // More intuitive for users
        }
      );
      
      console.log('WebBrowser result:', result);
      
      // Handle the result based on the type
      if (result.type === 'success') {
        // Extract code from URL if present
        try {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          
          if (code) {
            console.log('OAuth code received:', code);
            const tokens = await exchangeCodeForTokens(code);
            
            if (tokens) {
              await storeWhoopTokens(tokens);
              // Set flag for successful connection
              await AsyncStorage.setItem('whoop_connection_successful', 'true');
              return true;
            }
          } else {
            console.error('No code found in redirect URL:', result.url);
          }
        } catch (error) {
          console.error('Error parsing redirect URL:', error);
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled the authentication flow');
      } else {
        console.error('Authentication failed with result type:', result.type);
      }
    } else {
      // For web, open in a new tab
      Linking.openURL(authUrl);
      
      // Set flag to check for successful connection when browser is closed
      await AsyncStorage.setItem('whoop_auth_in_progress', 'true');
      
      // Web flow will be handled by the deep link handler in the app
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error connecting to WHOOP:', error);
    return false;
  }
};

/**
 * Exchanges an authorization code for access and refresh tokens
 */
export const exchangeCodeForTokens = async (code: string): Promise<WhoopTokens | null> => {
  try {
    console.log('Exchanging code for tokens with redirect URI:', WHOOP_REDIRECT_URI);
    
    const tokenRequestBody = new URLSearchParams({
      client_id: WHOOP_CLIENT_ID,
      client_secret: WHOOP_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: WHOOP_REDIRECT_URI,
    }).toString();
    
    console.log('Token request body:', tokenRequestBody);
    
    const response = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenRequestBody,
    });
    
    const responseText = await response.text();
    console.log('Token exchange raw response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse token response as JSON:', e);
      return null;
    }
    
    console.log('Token exchange parsed response:', data);
    
    if (!response.ok) {
      console.error('Token exchange error:', data);
      return null;
    }
    
    if (data.access_token) {
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return null;
  }
};

/**
 * Refreshes the access token using the refresh token
 */
export const refreshWhoopToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await AsyncStorage.getItem(WHOOP_REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      console.log('No refresh token found');
      return false;
    }
    
    console.log('Refreshing token with refresh token:', refreshToken);
    
    const response = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: WHOOP_CLIENT_ID,
        client_secret: WHOOP_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: WHOOP_SCOPES,
      }).toString(),
    });
    
    const responseText = await response.text();
    console.log('Token refresh raw response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse refresh token response as JSON:', e);
      return false;
    }
    
    console.log('Token refresh parsed response:', data);
    
    if (data.access_token) {
      await storeWhoopTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in,
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

/**
 * Stores WHOOP tokens in AsyncStorage
 */
export const storeWhoopTokens = async (tokens: WhoopTokens): Promise<void> => {
  const expiryTime = Date.now() + tokens.expiresIn * 1000;
  
  console.log('Storing tokens with expiry:', new Date(expiryTime).toISOString());
  
  try {
    await AsyncStorage.setItem(WHOOP_ACCESS_TOKEN_KEY, tokens.accessToken);
    await AsyncStorage.setItem(WHOOP_REFRESH_TOKEN_KEY, tokens.refreshToken);
    await AsyncStorage.setItem(WHOOP_TOKEN_EXPIRY_KEY, expiryTime.toString());
    // Set flag for successful connection
    await AsyncStorage.setItem('whoop_connection_successful', 'true');
    console.log('Tokens stored successfully');
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw error; // Re-throw to handle in calling function
  }
};

/**
 * Gets the current WHOOP access token, refreshing if necessary
 */
export const getWhoopAccessToken = async (): Promise<string | null> => {
  try {
    const accessToken = await AsyncStorage.getItem(WHOOP_ACCESS_TOKEN_KEY);
    const expiryTimeStr = await AsyncStorage.getItem(WHOOP_TOKEN_EXPIRY_KEY);
    
    if (!accessToken || !expiryTimeStr) {
      console.log('No access token or expiry time found');
      return null;
    }
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    
    // If token is expired or about to expire (within 5 minutes), refresh it
    if (Date.now() > expiryTime - 5 * 60 * 1000) {
      console.log('Token expired or about to expire, refreshing...');
      const refreshed = await refreshWhoopToken();
      if (refreshed) {
        return await AsyncStorage.getItem(WHOOP_ACCESS_TOKEN_KEY);
      }
      return null;
    }
    
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Checks if the user is connected to WHOOP
 */
export const isConnectedToWhoop = async (): Promise<boolean> => {
  try {
    const token = await getWhoopAccessToken();
    const isConnected = !!token;
    console.log('WHOOP connection status:', isConnected);
    return isConnected;
  } catch (error) {
    console.error('Error checking WHOOP connection:', error);
    return false;
  }
};

/**
 * Disconnects from WHOOP by removing stored tokens
 */
export const disconnectFromWhoop = async (): Promise<void> => {
  console.log('Disconnecting from WHOOP');
  await AsyncStorage.removeItem(WHOOP_ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(WHOOP_REFRESH_TOKEN_KEY);
  await AsyncStorage.removeItem(WHOOP_TOKEN_EXPIRY_KEY);
  await AsyncStorage.removeItem(WHOOP_USER_PROFILE_KEY);
  await AsyncStorage.removeItem(WHOOP_LAST_SYNC_DATA_KEY);
  await AsyncStorage.removeItem(WHOOP_LAST_SYNC_TIME_KEY);
  await AsyncStorage.removeItem(WHOOP_NEXT_SYNC_TIME_KEY);
  await AsyncStorage.removeItem('whoop_connection_successful');
  await AsyncStorage.removeItem('whoop_auth_in_progress');
};

/**
 * Makes an authenticated request to the WHOOP API
 */
const whoopApiRequest = async (endpoint: string, method: string = 'GET', body?: any): Promise<any> => {
  const accessToken = await getWhoopAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token available');
  }
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const url = `${WHOOP_API_BASE}${endpoint}`;
    console.log(`Making WHOOP API request to ${url}`);
    
    if (body) {
      console.log('Request body:', JSON.stringify(body, null, 2));
    }
    
    const response = await fetch(url, options);
    
    // Log the full response for debugging
    console.log(`WHOOP API response status: ${response.status} ${response.statusText}`);
    
    // Handle 404 errors gracefully - return empty data instead of null
    if (response.status === 404) {
      console.log(`WHOOP API 404 for ${endpoint} - returning empty data`);
      return { records: [] };
    }
    
    // For other non-OK responses, log but continue with empty data
    if (!response.ok) {
      console.log(`WHOOP API error: ${response.status} ${response.statusText}`);
      return { records: [] };
    }
    
    const responseText = await response.text();
    
    // If response is empty, return empty data
    if (!responseText.trim()) {
      console.warn(`Empty response from WHOOP API endpoint: ${endpoint}`);
      return { records: [] };
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log(`WHOOP API parsed response from ${endpoint}:`, data);
      return data;
    } catch (e) {
      console.error(`Failed to parse API response from ${endpoint} as JSON:`, e);
      // Return empty data instead of null
      return { records: [] };
    }
  } catch (error) {
    console.error(`Error in WHOOP API request to ${endpoint}:`, error);
    // Return empty data instead of null
    return { records: [] };
  }
};

/**
 * Fetches user profile from WHOOP API
 * Now returns a default profile object if API call fails
 */
export const fetchWhoopProfile = async (): Promise<any> => {
  try {
    console.log('Fetching WHOOP profile');
    
    // Try to get cached profile first
    const cachedProfile = await AsyncStorage.getItem(WHOOP_USER_PROFILE_KEY);
    if (cachedProfile) {
      const profile = JSON.parse(cachedProfile);
      console.log('Using cached WHOOP profile');
      return profile;
    }
    
    // If no cached profile, try to fetch from API
    const profile = await whoopApiRequest('/user/profile');
    
    // Cache the profile if we got a valid response
    if (profile && profile.email) {
      await AsyncStorage.setItem(WHOOP_USER_PROFILE_KEY, JSON.stringify(profile));
      return profile;
    }
    
    // Return a default profile if API call fails
    console.log('Using default WHOOP profile');
    return {
      first_name: "WHOOP",
      last_name: "User",
      email: "user@example.com"
    };
  } catch (error) {
    console.log('Error fetching WHOOP profile, using default profile');
    
    // Return a default profile on error
    return {
      first_name: "WHOOP",
      last_name: "User",
      email: "user@example.com"
    };
  }
};

/**
 * Fetches recovery data from WHOOP API
 */
export const fetchWhoopRecovery = async (startDate: string, endDate: string): Promise<any> => {
  try {
    return await whoopApiRequest(`/recovery?start_date=${startDate}&end_date=${endDate}`);
  } catch (error) {
    console.error('Error fetching WHOOP recovery:', error);
    return { records: [] };
  }
};

/**
 * Fetches cycle data from WHOOP API
 * This endpoint contains strain data
 */
export const fetchWhoopCycles = async (startDate: string, endDate: string): Promise<any> => {
  try {
    return await whoopApiRequest(`/cycle?start_date=${startDate}&end_date=${endDate}`);
  } catch (error) {
    console.error('Error fetching WHOOP cycles:', error);
    return { records: [] };
  }
};

/**
 * Transform WHOOP API data to app format
 */
export const transformWhoopData = async (startDate: string, endDate: string): Promise<WhoopData | null> => {
  try {
    console.log(`Fetching WHOOP data from ${startDate} to ${endDate}`);
    
    // Check if we're connected to WHOOP
    const connected = await isConnectedToWhoop();
    if (!connected) {
      console.error('Cannot transform WHOOP data: Not connected to WHOOP');
      return null;
    }
    
    // Fetch recovery and cycles data in parallel
    const [recoveryData, cyclesData] = await Promise.all([
      fetchWhoopRecovery(startDate, endDate),
      fetchWhoopCycles(startDate, endDate)
    ]);
    
    console.log('API responses received:', {
      recovery: recoveryData ? 'success' : 'failed',
      cycles: cyclesData ? 'success' : 'failed'
    });
    
    // If we're missing critical data, return null
    if (!recoveryData && !cyclesData) {
      console.error('Missing required recovery and cycles WHOOP data');
      return null;
    }
    
    console.log('Transforming WHOOP data:', { 
      recoveryCount: recoveryData?.records?.length || 0,
      cyclesCount: cyclesData?.records?.length || 0
    });
    
    // Transform recovery data
    const transformedRecovery: RecoveryData[] = [];
    
    // Process recovery data from direct endpoint
    if (recoveryData && recoveryData.records && recoveryData.records.length > 0) {
      for (const record of recoveryData.records) {
        // Extract recovery score from the nested score object
        const recoveryScore = record.score?.recovery_score || 0;
        let status: 'low' | 'medium' | 'high' = 'medium';
        
        if (recoveryScore < 34) status = 'low';
        else if (recoveryScore < 67) status = 'medium';
        else status = 'high';
        
        // Format date correctly - use created_at or current date
        const dateObj = record.created_at ? new Date(record.created_at) : new Date();
        const date = dateObj.toISOString().split('T')[0];
        
        transformedRecovery.push({
          id: `recovery-${record.cycle_id || Date.now()}`,
          date,
          score: Math.round(recoveryScore),
          hrvMs: Math.round(record.score?.hrv_rmssd_milli || 0),
          restingHeartRate: Math.round(record.score?.resting_heart_rate || 0),
          status,
        });
      }
    }
    
    // If no recovery data from direct endpoint, try to extract from cycles
    if (transformedRecovery.length === 0 && cyclesData && cyclesData.records) {
      for (const record of cyclesData.records) {
        if (record.score) {
          const recoveryScore = record.score.recovery_score || 0;
          let status: 'low' | 'medium' | 'high' = 'medium';
          
          if (recoveryScore < 34) status = 'low';
          else if (recoveryScore < 67) status = 'medium';
          else status = 'high';
          
          const dateObj = record.created_at ? new Date(record.created_at) : new Date();
          const date = dateObj.toISOString().split('T')[0];
          
          transformedRecovery.push({
            id: `recovery-${record.id || Date.now()}`,
            date,
            score: Math.round(recoveryScore),
            hrvMs: Math.round(record.score.hrv_rmssd_milli || 0),
            restingHeartRate: Math.round(record.score.resting_heart_rate || 0),
            status,
          });
        }
      }
    }
    
    // Transform strain data
    const transformedStrain: StrainData[] = [];
    
    // Extract strain data from cycles
    if (cyclesData && cyclesData.records) {
      for (const record of cyclesData.records) {
        // Get the date from the cycle
        const dateObj = record.created_at ? new Date(record.created_at) : new Date();
        const date = dateObj.toISOString().split('T')[0];
        
        // Process strain data if available
        if (record.score) {
          const strainScore = record.score.strain !== undefined ? 
            Math.round((record.score.strain || 0) * 10) / 10 : 0;
          
          const avgHeartRate = Math.round(record.score.average_heart_rate || 0);
          const maxHeartRate = Math.round(record.score.max_heart_rate || 0);
          const calories = Math.round((record.score.kilojoule || 0) / 4.184); // Convert kJ to calories
          
          // Create a strain entry
          if (strainScore > 0) {
            transformedStrain.push({
              id: `strain-${record.id || Date.now()}`,
              date,
              score: Math.max(1, strainScore), // Ensure minimum strain of 1
              averageHeartRate: avgHeartRate,
              maxHeartRate: maxHeartRate,
              calories: calories
            });
          }
        }
      }
    }
    
    // Sort all data by date (newest first)
    const sortByDate = (a: { date: string }, b: { date: string }): number => 
      new Date(b.date).getTime() - new Date(a.date).getTime();
    
    const result: WhoopData = {
      recovery: transformedRecovery.sort(sortByDate),
      strain: transformedStrain.sort(sortByDate),
      sleep: [] // TODO: Add sleep data transformation when sleep endpoint is implemented
    };
    
    console.log('Transformed WHOOP data:', {
      recoveryCount: result.recovery.length,
      strainCount: result.strain.length
    });
    
    // Cache the transformed data
    await AsyncStorage.setItem(WHOOP_LAST_SYNC_DATA_KEY, JSON.stringify(result));
    await AsyncStorage.setItem(WHOOP_LAST_SYNC_TIME_KEY, Date.now().toString());
    
    // Schedule next sync at midnight
    await scheduleNextMidnightSync();
    
    return result;
  } catch (error) {
    console.error('Error transforming WHOOP data:', error);
    return null;
  }
};

/**
 * Get cached WHOOP data if available
 */
export const getCachedWhoopData = async (): Promise<WhoopData | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(WHOOP_LAST_SYNC_DATA_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error('Error getting cached WHOOP data:', error);
    return null;
  }
};

/**
 * Schedule the next sync at midnight
 */
export const scheduleNextMidnightSync = async (): Promise<void> => {
  try {
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Store the next sync time
    await AsyncStorage.setItem(WHOOP_NEXT_SYNC_TIME_KEY, tomorrow.getTime().toString());
    
    console.log(`Next automatic sync scheduled for midnight (${tomorrow.toISOString()})`);
    
    return;
  } catch (error) {
    console.error('Error scheduling next midnight sync:', error);
  }
};

/**
 * Check if it's time for the scheduled sync
 */
export const checkScheduledSync = async (): Promise<boolean> => {
  try {
    const nextSyncTimeStr = await AsyncStorage.getItem(WHOOP_NEXT_SYNC_TIME_KEY);
    
    if (!nextSyncTimeStr) {
      // If no next sync time is set, schedule one and return false
      await scheduleNextMidnightSync();
      return false;
    }
    
    const nextSyncTime = parseInt(nextSyncTimeStr, 10);
    const now = Date.now();
    
    if (now >= nextSyncTime) {
      console.log('It is time for scheduled sync');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking scheduled sync:', error);
    return false;
  }
};