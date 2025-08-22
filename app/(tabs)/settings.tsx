import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { useWhoopStore } from '@/store/whoopStore';
import { useDailyMetricsPopup } from '@/hooks/useDailyMetricsPopup';
import { 
  Key, 
  Link, 
  User, 
  Bell, 
  Shield, 
  HelpCircle,
  ChevronRight,
  LogOut,
  CheckCircle,
  RefreshCw,
  Clock,
  AlertCircle,
  UserCircle,
  BarChart3
} from 'lucide-react-native';
import { disconnectFromWhoop } from '@/services/whoopApi';

export default function SettingsScreen() {
  const router = useRouter();
  const [openAIKey, setOpenAIKey] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { 
    apiKeys, 
    setApiKeys, 
    isConnectedToWhoop, 
    checkWhoopConnection,
    whoopProfile,
    syncWhoopData,
    isLoadingWhoopData,
    lastSyncTime,
    generateAIAnalysisFromWhoopData,
    data,
    setIsLoadingWhoopData,
    userProfile
  } = useWhoopStore();
  
  const { triggerPopupManually } = useDailyMetricsPopup();
  
  useEffect(() => {
    // Check WHOOP connection status when the screen loads
    checkWhoopConnection();
  }, []);
  
  useEffect(() => {
    // Set OpenAI key from store if available
    if (apiKeys.openAIApiKey) {
      setOpenAIKey(apiKeys.openAIApiKey);
    }
  }, [apiKeys]);
  
  const handleSaveKeys = () => {
    setApiKeys({ openAIApiKey: openAIKey });
    
    Alert.alert(
      "API Key Saved",
      "Your OpenAI API key has been securely stored.",
      [{ text: "OK" }]
    );
  };
  
  const handleConnectWhoop = () => {
    router.push('/connect-whoop');
  };
  
  const handleDisconnectWhoop = async () => {
    Alert.alert(
      "Disconnect WHOOP",
      "Are you sure you want to disconnect your WHOOP account? This will remove all your WHOOP data from the app.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await disconnectFromWhoop();
            await checkWhoopConnection();
            Alert.alert(
              "Disconnected",
              "Your WHOOP account has been disconnected.",
              [{ text: "OK" }]
            );
          }
        }
      ]
    );
  };
  
  const handleSyncWhoopData = async () => {
    setIsSyncing(true);
    
    try {
      const success = await syncWhoopData();
      
      if (success) {
        // Generate new AI insights based on the synced data
        await generateAIAnalysisFromWhoopData();
        
        Alert.alert(
          "Sync Complete",
          "Your WHOOP data has been successfully synchronized and analyzed.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Sync Failed",
          "There was an error synchronizing your WHOOP data. Please try again later.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert(
        "Sync Error",
        "An unexpected error occurred while syncing your data.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSyncing(false);
    }
  };
  
  const formatLastSyncTime = () => {
    if (!lastSyncTime) return "Never";
    
    const date = new Date(lastSyncTime);
    return date.toLocaleString();
  };
  
  const handleShowDailyPopup = () => {
    triggerPopupManually();
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color={colors.textSecondary} />)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => router.push('/profile')}
        >
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <UserCircle size={40} color={colors.text} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.name || "Set Up Your Profile"}</Text>
            {userProfile.name ? (
              <Text style={styles.profileDetails}>
                {userProfile.age} years • {userProfile.weight} kg • {userProfile.height} cm
              </Text>
            ) : (
              <Text style={styles.profilePrompt}>
                Complete your profile to get personalized nutrition targets
              </Text>
            )}
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHOOP Integration</Text>
          
          {isConnectedToWhoop ? (
            <View style={styles.whoopConnectedContainer}>
              <View style={styles.whoopConnectedHeader}>
                <View style={styles.whoopConnectedStatus}>
                  <CheckCircle size={20} color={colors.success} />
                  <Text style={styles.whoopConnectedText}>Connected to WHOOP</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={handleSyncWhoopData}
                  disabled={isSyncing || isLoadingWhoopData}
                >
                  {isSyncing || isLoadingWhoopData ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <RefreshCw size={18} color={colors.text} />
                  )}
                </TouchableOpacity>
              </View>
              
              {whoopProfile && (
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {whoopProfile.first_name} {whoopProfile.last_name}
                  </Text>
                  <Text style={styles.profileEmail}>{whoopProfile.email}</Text>
                </View>
              )}
              
              <View style={styles.syncInfo}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.syncText}>
                  Last synced: {formatLastSyncTime()}
                </Text>
              </View>
              
              {data.recovery.length === 0 && (
                <View style={styles.warningContainer}>
                  <AlertCircle size={18} color={colors.warning} />
                  <Text style={styles.warningText}>
                    No WHOOP data found. Please sync your data to use the app.
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={handleDisconnectWhoop}
              >
                <Text style={styles.disconnectText}>Disconnect WHOOP Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.connectWhoopButton}
              onPress={handleConnectWhoop}
            >
              <Link size={20} color={colors.text} />
              <Text style={styles.connectWhoopText}>Connect WHOOP Account</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Integration</Text>
          
          <View style={styles.apiContainer}>
            <Text style={styles.apiLabel}>OpenAI API Key</Text>
            <View style={styles.inputContainer}>
              <Key size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your OpenAI API key"
                placeholderTextColor={colors.textSecondary}
                value={openAIKey}
                onChangeText={setOpenAIKey}
                secureTextEntry
              />
            </View>
            
            <Text style={styles.apiHelp}>
              Required for advanced AI coaching features.
              <TouchableOpacity>
                <Text style={styles.apiLink}> Get a key</Text>
              </TouchableOpacity>
            </Text>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveKeys}
            >
              <Text style={styles.saveButtonText}>Save API Key</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          {renderSettingItem(
            <Bell size={20} color={colors.textSecondary} />,
            "Notifications",
            "Workout reminders and insights",
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#3A3A3A', true: colors.primary }}
              thumbColor={colors.text}
            />
          )}
          
          {renderSettingItem(
            <User size={20} color={colors.textSecondary} />,
            "Profile",
            "Edit your personal information",
            undefined,
            () => router.push('/profile')
          )}
          
          {renderSettingItem(
            <Shield size={20} color={colors.textSecondary} />,
            "Privacy",
            "Manage data sharing and permissions",
            undefined,
            () => router.push('/privacy')
          )}
          
          {renderSettingItem(
            <BarChart3 size={20} color={colors.textSecondary} />,
            "Daily Health Summary",
            "View your metrics and training adjustments",
            undefined,
            handleShowDailyPopup
          )}
          
          {renderSettingItem(
            <HelpCircle size={20} color={colors.textSecondary} />,
            "Help & Support",
            "FAQs and contact information",
            undefined,
            () => router.push('/help')
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Tracking</Text>
          
          {renderSettingItem(
            <Link size={20} color={colors.textSecondary} />,
            "Connect MyFitnessPal",
            "Import nutrition data automatically"
          )}
          
          {renderSettingItem(
            <Link size={20} color={colors.textSecondary} />,
            "Connect Cronometer",
            "Import nutrition data automatically"
          )}
        </View>
        
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// Get device dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const bottomPadding = Platform.OS === 'ios' ? (isSmallDevice ? 80 : 100) : 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: bottomPadding, // Consistent padding for iOS
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: isSmallDevice ? 12 : 16,
    marginBottom: isSmallDevice ? 20 : 24,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: isSmallDevice ? 50 : 60,
    height: isSmallDevice ? 50 : 60,
    borderRadius: isSmallDevice ? 25 : 30,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
  },
  profilePrompt: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.primary,
  },
  section: {
    marginBottom: isSmallDevice ? 20 : 24,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: isSmallDevice ? 12 : 16,
  },
  apiContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: isSmallDevice ? 12 : 16,
  },
  apiLabel: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
    marginLeft: 12,
  },
  apiHelp: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  apiLink: {
    color: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: isSmallDevice ? 12 : 16,
    marginBottom: 8,
  },
  settingIcon: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: isSmallDevice ? 18 : 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  logoutText: {
    color: colors.danger,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    color: colors.textSecondary,
    fontSize: isSmallDevice ? 13 : 14,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: bottomPadding - 8, // Adjusted for bottom padding
  },
  connectWhoopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
  },
  connectWhoopText: {
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  whoopConnectedContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: isSmallDevice ? 12 : 16,
  },
  whoopConnectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  whoopConnectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whoopConnectedText: {
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: isSmallDevice ? 13 : 14,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncText: {
    color: colors.textSecondary,
    fontSize: isSmallDevice ? 13 : 14,
    marginLeft: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  warningText: {
    color: colors.warning,
    fontSize: isSmallDevice ? 13 : 14,
    marginLeft: 8,
    flex: 1,
  },
  disconnectButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disconnectText: {
    color: colors.danger,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
  },
});