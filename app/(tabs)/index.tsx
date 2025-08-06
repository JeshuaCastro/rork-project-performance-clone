import React, { useEffect, useState, useMemo } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  AppState,
  AppStateStatus,
  Platform,
  SafeAreaView,
  Dimensions,
  Modal
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import RecoveryCard from '@/components/RecoveryCard';
import StrainCard from '@/components/StrainCard';

import CalendarView from '@/components/CalendarView';


import WeightTracker from '@/components/WeightTracker';
import { colors } from '@/constants/colors';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { 
  Link, 
  RefreshCw, 
  UserCircle, 
  Play, 
  Clock, 
  Dumbbell, 
  Activity, 
  Heart, 
  ArrowRight,
  X,
  Target,
  Zap,
  Users,
  Flame,
  Eye,
  Check,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Minus
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [showWorkoutDetailModal, setShowWorkoutDetailModal] = useState(false);
  const [isWorkoutCompletedToday, setIsWorkoutCompletedToday] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subpage'>('dashboard');
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d'>('7d');
  
  const { 
    data, 
    analysis, 
    selectedDate, 
    setSelectedDate, 
    isConnectedToWhoop,
    checkWhoopConnection,
    syncWhoopData,
    isLoadingWhoopData,
    lastSyncTime,
    generateAIAnalysisFromWhoopData,
    checkAndPerformScheduledSync,
    setIsLoadingWhoopData,
    userProfile,
    activePrograms,
    getTodaysWorkout,
    startManualWorkout,
    isWorkoutCompleted
  } = useWhoopStore();
  
  // Check if profile is complete
  const isProfileComplete = Boolean(
    userProfile.name && 
    userProfile.age && 
    userProfile.gender && 
    userProfile.weight && 
    userProfile.height && 
    userProfile.activityLevel && 
    userProfile.fitnessGoal
  );
  
  // Handle app state changes to check for scheduled syncs
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);
  
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState && typeof appState === 'string' && (appState === 'inactive' || appState === 'background') && nextAppState === 'active') {
      console.log('App has come to the foreground, checking for scheduled syncs');
      await checkAndPerformScheduledSync();
    }
    setAppState(nextAppState);
  };
  
  // Check connection status and sync data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const initializeApp = async () => {
        console.log('Dashboard in focus, checking connection status...');
        setIsInitializing(true);
        
        try {
          const connected = await checkWhoopConnection();
          
          // If connected to WHOOP and we haven't synced in the last hour, sync data
          if (connected) {
            if (!lastSyncTime || Date.now() - lastSyncTime > 60 * 60 * 1000 || !data?.recovery || data.recovery.length === 0) {
              console.log('Auto-syncing WHOOP data...');
              setSyncAttempted(true);
              await syncWhoopData();
            }
          }
        } catch (error) {
          console.error('Error initializing dashboard:', error);
        } finally {
          setIsInitializing(false);
        }
      };
      
      initializeApp();
      
      return () => {
        // Cleanup if needed
      };
    }, [])
  );
  
  // Get available dates from the data
  const dates = data?.recovery?.map(item => item.date) || [];
  
  // Find the selected data items
  const selectedRecovery = data?.recovery?.find(item => item.date === selectedDate);
  const selectedStrain = data?.strain?.find(item => item.date === selectedDate);
  
  // Get today's workout from active programs
  const todaysWorkout = getTodaysWorkout();
  
  // Calculate trends data for subpage
  const trendsData = useMemo(() => {
    if (!data?.recovery || !data?.strain) {
      return null;
    }

    const now = new Date();
    const daysBack = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    // Filter data for selected range
    const recoveryData = data.recovery.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const strainData = data.strain.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recoveryData.length === 0 || strainData.length === 0) {
      return null;
    }

    // Calculate averages
    const avgRecovery = recoveryData.reduce((sum, item) => sum + item.score, 0) / recoveryData.length;
    const avgStrain = strainData.reduce((sum, item) => sum + item.score, 0) / strainData.length;
    const avgHRV = recoveryData.reduce((sum, item) => sum + item.hrvMs, 0) / recoveryData.length;
    const avgRestingHR = recoveryData.reduce((sum, item) => sum + item.restingHeartRate, 0) / recoveryData.length;
    
    // Calculate trends (compare first half vs second half)
    const midPoint = Math.floor(recoveryData.length / 2);
    const firstHalfRecovery = recoveryData.slice(0, midPoint);
    const secondHalfRecovery = recoveryData.slice(midPoint);
    const firstHalfStrain = strainData.slice(0, midPoint);
    const secondHalfStrain = strainData.slice(midPoint);
    
    const firstHalfAvgRecovery = firstHalfRecovery.reduce((sum, item) => sum + item.score, 0) / firstHalfRecovery.length;
    const secondHalfAvgRecovery = secondHalfRecovery.reduce((sum, item) => sum + item.score, 0) / secondHalfRecovery.length;
    const recoveryTrend = secondHalfAvgRecovery - firstHalfAvgRecovery;
    
    const firstHalfAvgStrain = firstHalfStrain.reduce((sum, item) => sum + item.score, 0) / firstHalfStrain.length;
    const secondHalfAvgStrain = secondHalfStrain.reduce((sum, item) => sum + item.score, 0) / secondHalfStrain.length;
    const strainTrend = secondHalfAvgStrain - firstHalfAvgStrain;
    
    // Get recent data points for mini charts
    const recentRecovery = recoveryData.slice(-7); // Last 7 days
    const recentStrain = strainData.slice(-7);
    
    return {
      avgRecovery: Math.round(avgRecovery),
      avgStrain: avgStrain.toFixed(1),
      avgHRV: Math.round(avgHRV),
      avgRestingHR: Math.round(avgRestingHR),
      recoveryTrend,
      strainTrend,
      recentRecovery,
      recentStrain,
      totalDays: recoveryData.length
    };
  }, [data, selectedRange]);
  

  
  // Check if today's workout is completed
  const checkWorkoutCompletion = React.useCallback(async () => {
    if (todaysWorkout && todaysWorkout.programId) {
      try {
        console.log('Dashboard: Checking workout completion for:', todaysWorkout.title, 'programId:', todaysWorkout.programId);
        const completed = await isWorkoutCompleted(todaysWorkout.programId, todaysWorkout.title);
        console.log('Dashboard: Workout completion result:', completed);
        setIsWorkoutCompletedToday(completed);
      } catch (error) {
        console.error('Error checking workout completion:', error);
        setIsWorkoutCompletedToday(false);
      }
    } else {
      setIsWorkoutCompletedToday(false);
    }
  }, [todaysWorkout, isWorkoutCompleted]);

  useEffect(() => {
    checkWorkoutCompletion();
  }, [checkWorkoutCompletion]);

  // Re-check workout completion when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Add a small delay to ensure AsyncStorage has been updated
      const timeoutId = setTimeout(() => {
        checkWorkoutCompletion();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }, [checkWorkoutCompletion])
  );

  // Also check workout completion when activePrograms change (in case completion was updated elsewhere)
  useEffect(() => {
    checkWorkoutCompletion();
  }, [activePrograms, checkWorkoutCompletion]);

  // Set up periodic checking for workout completion while dashboard is active
  useEffect(() => {
    const interval = setInterval(() => {
      checkWorkoutCompletion();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [checkWorkoutCompletion]);
  
  const handleSyncData = async () => {
    setSyncAttempted(true);
    setIsLoadingWhoopData(true); // Set loading state manually
    
    try {
      const success = await syncWhoopData();
      
      if (success) {
        // Generate new AI insights based on the synced data
        await generateAIAnalysisFromWhoopData();
        
        Alert.alert(
          "Data Synced",
          "Your WHOOP data has been successfully synced and analyzed.",
          [{ text: "Great!" }]
        );
      } else {
        Alert.alert(
          "Sync Failed",
          "There was an issue syncing your WHOOP data. Please try again later.",
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
      setIsLoadingWhoopData(false); // Ensure loading state is reset
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    setSyncAttempted(true);
    await syncWhoopData();
    setRefreshing(false);
  };
  
  const renderNoDataView = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataTitleMain}>No WHOOP Data Available</Text>
      <Text style={styles.noDataTextMain}>
        Connect your WHOOP account to see your recovery and strain metrics.
      </Text>
      <TouchableOpacity 
        style={styles.connectButton}
        onPress={() => router.push('/connect-whoop')}
      >
        <Link size={20} color={colors.text} />
        <Text style={styles.connectButtonText}>Connect WHOOP Account</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Get workout icon based on type
  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case 'cardio':
        return <Activity size={20} color={colors.primary} />;
      case 'strength':
        return <Dumbbell size={20} color={colors.primary} />;
      case 'recovery':
        return <Heart size={20} color={colors.primary} />;
      default:
        return <Clock size={20} color={colors.primary} />;
    }
  };
  
  // Get intensity color
  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high':
        return colors.danger;
      case 'medium-high':
        return colors.warning;
      case 'medium':
        return colors.primary;
      case 'medium-low':
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };
  
  // Get status color for recovery
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
        return colors.recovery.high;
      case 'medium':
        return colors.recovery.medium;
      case 'low':
        return colors.recovery.low;
      default:
        return colors.textSecondary;
    }
  };
  
  // Get strain level description
  const getStrainDescription = (score: number) => {
    if (score >= 18) return "All Out";
    if (score >= 14) return "Strenuous";
    if (score >= 10) return "Moderate";
    if (score >= 6) return "Light";
    return "Minimal";
  };
  
  // Handle starting a workout from dashboard
  const handleStartWorkout = (workout: any) => {
    if (!workout.programId) {
      Alert.alert(
        "Error",
        "Unable to start workout. Please try from the program details page.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Navigate to program detail page to start the workout
    router.push(`/program-detail?id=${workout.programId}`);
  };
  
  // Handle workout card click to show details
  const handleWorkoutCardClick = () => {
    if (todaysWorkout) {
      setShowWorkoutDetailModal(true);
    }
  };
  
  // Generate detailed workout information
  const generateWorkoutDetails = (workout: any) => {
    const details = {
      duration: generateDuration(workout.type, workout.intensity),
      equipment: generateEquipment(workout.title, workout.type),
      exercises: generateExercises(workout.title, workout.type, workout.description),
      tips: generateTips(workout.type, workout.intensity),
      modifications: generateModifications(workout.type, workout.intensity),
      targetHeartRate: generateTargetHeartRate(workout.type, workout.intensity),
      caloriesBurned: generateCaloriesBurned(workout.type, workout.intensity)
    };
    
    return details;
  };
  
  // Generate duration based on workout type and intensity
  const generateDuration = (type: string, intensity: string): string => {
    if (type === 'cardio') {
      if (intensity === 'High') return '45-60 minutes';
      if (intensity === 'Medium' || intensity === 'Medium-High') return '30-45 minutes';
      return '20-30 minutes';
    } else if (type === 'strength') {
      if (intensity === 'High') return '60-75 minutes';
      if (intensity === 'Medium' || intensity === 'Medium-High') return '45-60 minutes';
      return '30-45 minutes';
    } else if (type === 'recovery') {
      return '20-45 minutes';
    }
    return '30-45 minutes';
  };
  
  // Generate equipment list based on workout
  const generateEquipment = (title: string, type: string): string[] => {
    const equipment: string[] = [];
    
    if (type === 'cardio') {
      if (title.toLowerCase().includes('run')) {
        equipment.push('Running shoes', 'Water bottle', 'Heart rate monitor (optional)');
      } else if (title.toLowerCase().includes('bike') || title.toLowerCase().includes('cycling')) {
        equipment.push('Bike', 'Helmet', 'Water bottle');
      } else if (title.toLowerCase().includes('hiit')) {
        equipment.push('Exercise mat', 'Water bottle', 'Towel');
      } else {
        equipment.push('Cardio machine (treadmill/bike/elliptical)', 'Water bottle');
      }
    } else if (type === 'strength') {
      if (title.toLowerCase().includes('squat') || title.toLowerCase().includes('deadlift')) {
        equipment.push('Barbell', 'Weight plates', 'Squat rack', 'Safety bars');
      } else if (title.toLowerCase().includes('bench')) {
        equipment.push('Barbell', 'Weight plates', 'Bench', 'Safety bars');
      } else if (title.toLowerCase().includes('bodyweight') || title.toLowerCase().includes('core')) {
        equipment.push('Exercise mat', 'Water bottle');
      } else {
        equipment.push('Dumbbells', 'Barbell', 'Weight plates', 'Bench');
      }
    } else if (type === 'recovery') {
      equipment.push('Yoga mat', 'Foam roller', 'Comfortable clothing');
    }
    
    return equipment;
  };
  
  // Generate exercise breakdown
  const generateExercises = (title: string, type: string, description: string): any[] => {
    const exercises: any[] = [];
    
    if (type === 'strength') {
      if (title.toLowerCase().includes('squat')) {
        exercises.push(
          { name: 'Back Squat', sets: '5', reps: '5', notes: 'Focus on depth and control' },
          { name: 'Leg Press', sets: '3', reps: '8-10', notes: 'Full range of motion' },
          { name: 'Romanian Deadlift', sets: '3', reps: '8-10', notes: 'Feel the stretch in hamstrings' },
          { name: 'Core Circuit', sets: '2', reps: '10-15 each', notes: 'Planks, Russian twists, leg raises' }
        );
      } else if (title.toLowerCase().includes('upper body')) {
        exercises.push(
          { name: 'Bench Press', sets: '5', reps: '5', notes: 'Control the descent' },
          { name: 'Incline Dumbbell Press', sets: '3', reps: '8-10', notes: 'Squeeze at the top' },
          { name: 'Shoulder Press', sets: '3', reps: '8-10', notes: 'Keep core tight' },
          { name: 'Tricep Dips', sets: '3', reps: '8-12', notes: 'Full range of motion' }
        );
      } else if (title.toLowerCase().includes('full body')) {
        exercises.push(
          { name: 'Squats', sets: '3', reps: '12-15', notes: 'Bodyweight or weighted' },
          { name: 'Push-ups', sets: '3', reps: '10-15', notes: 'Modify on knees if needed' },
          { name: 'Bent-over Rows', sets: '3', reps: '12-15', notes: 'Use dumbbells or resistance band' },
          { name: 'Lunges', sets: '3', reps: '10 each leg', notes: 'Step back or forward' },
          { name: 'Plank', sets: '3', duration: '30-45 seconds', notes: 'Keep hips level' }
        );
      } else {
        exercises.push(
          { name: 'Compound Movement', sets: '3-5', reps: '5-8', notes: 'Focus on form and progression' },
          { name: 'Accessory Exercise 1', sets: '3', reps: '8-12', notes: 'Target specific muscle groups' },
          { name: 'Accessory Exercise 2', sets: '3', reps: '8-12', notes: 'Maintain good form' },
          { name: 'Core Finisher', sets: '2-3', reps: '10-15', notes: 'End with core strengthening' }
        );
      }
    } else if (type === 'cardio') {
      if (title.toLowerCase().includes('run')) {
        exercises.push(
          { name: 'Warm-up Walk', duration: '5 minutes', notes: 'Gradually increase pace' },
          { name: 'Main Run', duration: '20-40 minutes', notes: 'Maintain conversational pace' },
          { name: 'Cool-down Walk', duration: '5 minutes', notes: 'Gradually decrease pace' },
          { name: 'Stretching', duration: '5-10 minutes', notes: 'Focus on legs and hips' }
        );
      } else if (title.toLowerCase().includes('hiit')) {
        exercises.push(
          { name: 'Warm-up', duration: '5 minutes', notes: 'Light cardio and dynamic stretching' },
          { name: 'High-Intensity Intervals', sets: '8-12', duration: '30 seconds on, 30 seconds off', notes: 'Give maximum effort during work periods' },
          { name: 'Cool-down', duration: '5 minutes', notes: 'Light walking and stretching' }
        );
      } else {
        exercises.push(
          { name: 'Warm-up', duration: '5-10 minutes', notes: 'Start slowly and build intensity' },
          { name: 'Main Cardio', duration: '20-40 minutes', notes: 'Maintain target heart rate' },
          { name: 'Cool-down', duration: '5-10 minutes', notes: 'Gradually reduce intensity' }
        );
      }
    } else if (type === 'recovery') {
      exercises.push(
        { name: 'Light Movement', duration: '10-15 minutes', notes: 'Walking or gentle stretching' },
        { name: 'Foam Rolling', duration: '10-15 minutes', notes: 'Focus on tight areas' },
        { name: 'Meditation/Breathing', duration: '5-10 minutes', notes: 'Deep breathing exercises' }
      );
    }
    
    return exercises;
  };
  
  // Generate tips based on workout type and intensity
  const generateTips = (type: string, intensity: string): string[] => {
    const tips: string[] = [];
    
    if (type === 'cardio') {
      tips.push('Start with a proper warm-up to prepare your body');
      tips.push('Stay hydrated throughout the workout');
      if (intensity === 'High') {
        tips.push('Push yourself during high-intensity intervals but maintain good form');
        tips.push('Take adequate rest between intervals to maintain quality');
      } else {
        tips.push('Maintain a conversational pace - you should be able to talk');
        tips.push('Focus on consistent effort rather than speed');
      }
      tips.push('Cool down properly with light movement and stretching');
    } else if (type === 'strength') {
      tips.push('Warm up with light cardio and dynamic stretching');
      tips.push('Focus on proper form over heavy weight');
      if (intensity === 'High') {
        tips.push('Use a spotter for heavy compound movements');
        tips.push('Take 2-3 minutes rest between heavy sets');
      } else {
        tips.push('Control both the lifting and lowering phases');
        tips.push('Rest 60-90 seconds between sets');
      }
      tips.push('Breathe properly - exhale on exertion, inhale on release');
    } else if (type === 'recovery') {
      tips.push('Listen to your body and move gently');
      tips.push('Focus on areas that feel tight or sore');
      tips.push('Use this time for mental relaxation as well');
      tips.push('Stay hydrated and consider light nutrition');
    }
    
    return tips;
  };
  
  // Generate modifications based on workout type and intensity
  const generateModifications = (type: string, intensity: string): string[] => {
    const modifications: string[] = [];
    
    if (type === 'cardio') {
      modifications.push('Reduce duration if feeling fatigued');
      modifications.push('Lower intensity if heart rate gets too high');
      if (intensity === 'High') {
        modifications.push('Extend rest periods between intervals if needed');
        modifications.push('Reduce number of intervals if struggling to maintain quality');
      } else {
        modifications.push('Walk instead of run if needed');
        modifications.push('Use incline walking as an alternative');
      }
    } else if (type === 'strength') {
      modifications.push('Reduce weight if form starts to break down');
      modifications.push('Decrease reps or sets if feeling overly fatigued');
      if (intensity === 'High') {
        modifications.push('Use lighter weight and focus on technique');
        modifications.push('Add extra rest between sets');
      } else {
        modifications.push('Use bodyweight variations if no equipment available');
        modifications.push('Perform exercises seated if balance is an issue');
      }
    } else if (type === 'recovery') {
      modifications.push('Shorten duration if feeling tired');
      modifications.push('Focus only on gentle movements');
      modifications.push('Skip if feeling unwell or overly sore');
    }
    
    return modifications;
  };
  
  // Generate target heart rate based on workout type and intensity
  const generateTargetHeartRate = (type: string, intensity: string): string => {
    if (type === 'cardio') {
      if (intensity === 'High') return '85-95% of max HR';
      if (intensity === 'Medium' || intensity === 'Medium-High') return '70-85% of max HR';
      return '60-70% of max HR (Zone 2)';
    } else if (type === 'strength') {
      if (intensity === 'High') return '70-85% of max HR';
      return '60-75% of max HR';
    } else if (type === 'recovery') {
      return '50-60% of max HR';
    }
    return '60-75% of max HR';
  };
  
  // Generate estimated calories burned
  const generateCaloriesBurned = (type: string, intensity: string): string => {
    if (type === 'cardio') {
      if (intensity === 'High') return '400-600 calories';
      if (intensity === 'Medium' || intensity === 'Medium-High') return '300-450 calories';
      return '200-350 calories';
    } else if (type === 'strength') {
      if (intensity === 'High') return '300-450 calories';
      return '200-350 calories';
    } else if (type === 'recovery') {
      return '100-200 calories';
    }
    return '250-400 calories';
  };
  
  // Trends helper functions
  const getTrendIcon = (trend: number) => {
    if (trend > 2) return <TrendingUp size={16} color={colors.success} />;
    if (trend < -2) return <TrendingDown size={16} color={colors.danger} />;
    return <Minus size={16} color={colors.textSecondary} />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 2) return colors.success;
    if (trend < -2) return colors.danger;
    return colors.textSecondary;
  };

  const getTrendText = (trend: number) => {
    if (Math.abs(trend) < 1) return 'Stable';
    return trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1);
  };

  const renderMiniChart = (data: any[], type: 'recovery' | 'strain') => {
    if (data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(item => type === 'recovery' ? item.score : item.score));
    const minValue = Math.min(...data.map(item => type === 'recovery' ? item.score : item.score));
    const range = maxValue - minValue || 1;
    
    return (
      <View style={styles.miniChart}>
        {data.map((item, index) => {
          const value = type === 'recovery' ? item.score : item.score;
          const height = ((value - minValue) / range) * 30 + 5;
          return (
            <View
              key={index}
              style={[
                styles.chartBar,
                {
                  height,
                  backgroundColor: type === 'recovery' ? colors.recovery.high : colors.warning
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const getRecoveryStatus = (score: number) => {
    if (score >= 67) return { status: 'High', color: colors.recovery.high };
    if (score >= 34) return { status: 'Medium', color: colors.recovery.medium };
    return { status: 'Low', color: colors.recovery.low };
  };
  
  // Show loading indicator during initialization
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing WHOOP AI Coach...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {!isConnectedToWhoop && (
        <TouchableOpacity 
          style={styles.connectBanner}
          onPress={() => router.push('/connect-whoop')}
        >
          <Link size={18} color={colors.text} />
          <Text style={styles.connectBannerText}>
            Connect your WHOOP band for personalized coaching
          </Text>
          <Text style={styles.connectBannerAction}>Connect</Text>
        </TouchableOpacity>
      )}
      
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'dashboard' && styles.activeTabButtonText]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'subpage' && styles.activeTabButton]}
          onPress={() => setActiveTab('subpage')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'subpage' && styles.activeTabButtonText]}>
            Trends
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerContainer}>
        {!isProfileComplete && (
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <UserCircle size={18} color={colors.text} />
            <Text style={styles.profileButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleSyncData}
          disabled={isLoadingWhoopData || !isConnectedToWhoop}
        >
          {isLoadingWhoopData ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <RefreshCw size={18} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>
      
      {isConnectedToWhoop && (!data?.recovery || data.recovery.length === 0) && isLoadingWhoopData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading WHOOP data...</Text>
        </View>
      ) : isConnectedToWhoop && (!data?.recovery || data.recovery.length === 0) && syncAttempted ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to Load WHOOP Data</Text>
            <Text style={styles.errorText}>
              We encountered an issue retrieving your WHOOP data. This could be due to:
            </Text>
            <View style={styles.errorList}>
              <Text style={styles.errorListItem}>• Your WHOOP account may not have enough data</Text>
              <Text style={styles.errorListItem}>• There might be a temporary API issue</Text>
              <Text style={styles.errorListItem}>• Your authorization may need to be refreshed</Text>
            </View>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleSyncData}
            >
              <RefreshCw size={18} color={colors.text} />
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.reconnectButton}
              onPress={() => router.push('/connect-whoop')}
            >
              <Link size={18} color={colors.text} />
              <Text style={styles.reconnectButtonText}>Reconnect WHOOP Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : isConnectedToWhoop && (!data?.recovery || data.recovery.length === 0) ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {renderNoDataView()}
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {activeTab === 'dashboard' ? (
            <>
          {/* Today's Workout Section */}
          {todaysWorkout && (
            <View style={styles.todaysWorkoutSection}>
              <Text style={styles.sectionTitle}>Today&apos;s Workout</Text>
              <TouchableOpacity 
                style={styles.workoutCard}
                onPress={handleWorkoutCardClick}
                activeOpacity={0.7}
              >
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutTitleContainer}>
                    {getWorkoutIcon(todaysWorkout.type)}
                    <Text style={styles.workoutTitle} numberOfLines={1} ellipsizeMode="tail">
                      {todaysWorkout.title}
                    </Text>
                  </View>
                  <View style={styles.headerActions}>
                    <View style={[
                      styles.intensityBadge,
                      { backgroundColor: getIntensityColor(todaysWorkout.intensity) }
                    ]}>
                      <Text style={styles.intensityText}>{todaysWorkout.intensity}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.detailsButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleWorkoutCardClick();
                      }}
                    >
                      <Info size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.workoutDescription} numberOfLines={2} ellipsizeMode="tail">
                  {todaysWorkout.description}
                </Text>
                
                {/* Completion Status & Meta Info */}
                <View style={styles.workoutMetaRow}>
                  {todaysWorkout.duration && (
                    <View style={styles.workoutMetaInfo}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.workoutMetaText}>{todaysWorkout.duration}</Text>
                    </View>
                  )}
                  
                  {isWorkoutCompletedToday && (
                    <View style={styles.completionBadge}>
                      <CheckCircle size={14} color={colors.success} />
                      <Text style={styles.completionText}>Completed Today</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.workoutActions}>
                  <TouchableOpacity 
                    style={[
                      styles.startWorkoutButton,
                      isWorkoutCompletedToday && styles.completedWorkoutButton
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (!isWorkoutCompletedToday) {
                        handleStartWorkout(todaysWorkout);
                      }
                    }}
                    disabled={isWorkoutCompletedToday}
                  >
                    {isWorkoutCompletedToday ? (
                      <>
                        <Check size={18} color={colors.text} />
                        <Text style={styles.startWorkoutText}>Completed</Text>
                      </>
                    ) : (
                      <>
                        <Play size={18} color={colors.text} />
                        <Text style={styles.startWorkoutText}>Start Workout</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.viewProgramButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/program-detail?id=${todaysWorkout.programId}`);
                    }}
                  >
                    <Text style={styles.viewProgramText}>View Program</Text>
                    <ArrowRight size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )}
          
          {/* No Active Program Message */}
          {!todaysWorkout && activePrograms.length === 0 && (
            <View style={styles.noProgramSection}>
              <Text style={styles.sectionTitle}>Ready to Start Training?</Text>
              <View style={styles.noProgramCard}>
                <Text style={styles.noProgramTitle}>No Active Programs</Text>
                <Text style={styles.noProgramText}>
                  Create a personalized training program to get started with your fitness journey.
                </Text>
                <TouchableOpacity 
                  style={styles.createProgramButton}
                  onPress={() => router.push('/programs')}
                >
                  <Text style={styles.createProgramText}>Create Program</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Rest Day Message */}
          {!todaysWorkout && activePrograms.length > 0 && (
            <View style={styles.restDaySection}>
              <Text style={styles.sectionTitle}>Today&apos;s Plan</Text>
              <View style={styles.restDayCard}>
                <Heart size={24} color={colors.primary} />
                <Text style={styles.restDayTitle}>Rest Day</Text>
                <Text style={styles.restDayText}>
                  No scheduled workout today. Focus on recovery, hydration, and nutrition.
                </Text>
                <TouchableOpacity 
                  style={styles.viewProgramsButton}
                  onPress={() => router.push('/programs')}
                >
                  <Text style={styles.viewProgramsText}>View Programs</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          

          

          
          {/* Weight Tracking */}
          <WeightTracker />
          
          {/* Detailed Cards */}
          {selectedRecovery && (
            <View style={styles.detailedCardsSection}>
              <Text style={styles.sectionTitle}>Detailed Metrics</Text>
              <RecoveryCard recovery={selectedRecovery} />
            </View>
          )}
          {selectedStrain && <StrainCard strain={selectedStrain} />}
          
            </>
          ) : (
            <View style={styles.trendsContainer}>
              {/* Time Range Selector */}
              <View style={styles.timeRangeContainer}>
                <Text style={styles.sectionTitle}>Time Range</Text>
                <View style={styles.timeRangeButtons}>
                  {(['7d', '30d', '90d'] as ('7d' | '30d' | '90d')[]).map((range) => (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.timeRangeButton,
                        selectedRange === range && styles.timeRangeButtonActive
                      ]}
                      onPress={() => setSelectedRange(range)}
                    >
                      <Text style={[
                        styles.timeRangeButtonText,
                        selectedRange === range && styles.timeRangeButtonTextActive
                      ]}>
                        {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {trendsData ? (
                <>
                  {/* Overview Cards */}
                  <View style={styles.overviewSection}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.overviewGrid}>
                      <View style={styles.overviewCard}>
                        <View style={styles.overviewHeader}>
                          <Heart size={20} color={colors.recovery.high} />
                          <Text style={styles.overviewLabel}>Avg Recovery</Text>
                        </View>
                        <Text style={styles.overviewValue}>{trendsData.avgRecovery}%</Text>
                        <View style={styles.overviewTrend}>
                          {getTrendIcon(trendsData.recoveryTrend)}
                          <Text style={[styles.overviewTrendText, { color: getTrendColor(trendsData.recoveryTrend) }]}>
                            {getTrendText(trendsData.recoveryTrend)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.overviewStatus,
                          { color: getRecoveryStatus(trendsData.avgRecovery).color }
                        ]}>
                          {getRecoveryStatus(trendsData.avgRecovery).status}
                        </Text>
                      </View>

                      <View style={styles.overviewCard}>
                        <View style={styles.overviewHeader}>
                          <Dumbbell size={20} color={colors.warning} />
                          <Text style={styles.overviewLabel}>Avg Strain</Text>
                        </View>
                        <Text style={styles.overviewValue}>{trendsData.avgStrain}</Text>
                        <View style={styles.overviewTrend}>
                          {getTrendIcon(trendsData.strainTrend)}
                          <Text style={[styles.overviewTrendText, { color: getTrendColor(trendsData.strainTrend) }]}>
                            {getTrendText(trendsData.strainTrend)}
                          </Text>
                        </View>
                        <Text style={styles.overviewStatus}>
                          {getStrainDescription(parseFloat(trendsData.avgStrain))}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Detailed Metrics */}
                  <View style={styles.metricsSection}>
                    <Text style={styles.sectionTitle}>Detailed Metrics</Text>
                    
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <View style={styles.metricTitleContainer}>
                          <Heart size={18} color={colors.primary} />
                          <Text style={styles.metricTitle}>Recovery Trends</Text>
                        </View>
                        {renderMiniChart(trendsData.recentRecovery, 'recovery')}
                      </View>
                      <View style={styles.metricStats}>
                        <View style={styles.metricStat}>
                          <Text style={styles.metricStatLabel}>Average</Text>
                          <Text style={styles.metricStatValue}>{trendsData.avgRecovery}%</Text>
                        </View>
                        <View style={styles.metricStat}>
                          <Text style={styles.metricStatLabel}>Trend</Text>
                          <View style={styles.metricStatTrend}>
                            {getTrendIcon(trendsData.recoveryTrend)}
                            <Text style={[styles.metricStatValue, { color: getTrendColor(trendsData.recoveryTrend) }]}>
                              {getTrendText(trendsData.recoveryTrend)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <View style={styles.metricTitleContainer}>
                          <Activity size={18} color={colors.warning} />
                          <Text style={styles.metricTitle}>Strain Trends</Text>
                        </View>
                        {renderMiniChart(trendsData.recentStrain, 'strain')}
                      </View>
                      <View style={styles.metricStats}>
                        <View style={styles.metricStat}>
                          <Text style={styles.metricStatLabel}>Average</Text>
                          <Text style={styles.metricStatValue}>{trendsData.avgStrain}</Text>
                        </View>
                        <View style={styles.metricStat}>
                          <Text style={styles.metricStatLabel}>Trend</Text>
                          <View style={styles.metricStatTrend}>
                            {getTrendIcon(trendsData.strainTrend)}
                            <Text style={[styles.metricStatValue, { color: getTrendColor(trendsData.strainTrend) }]}>
                              {getTrendText(trendsData.strainTrend)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.additionalMetricsGrid}>
                      <View style={styles.additionalMetricCard}>
                        <Text style={styles.additionalMetricLabel}>Avg HRV</Text>
                        <Text style={styles.additionalMetricValue}>{trendsData.avgHRV} ms</Text>
                      </View>
                      <View style={styles.additionalMetricCard}>
                        <Text style={styles.additionalMetricLabel}>Avg Resting HR</Text>
                        <Text style={styles.additionalMetricValue}>{trendsData.avgRestingHR} bpm</Text>
                      </View>
                    </View>
                  </View>

                  {/* Insights */}
                  <View style={styles.insightsSection}>
                    <Text style={styles.sectionTitle}>Insights</Text>
                    <View style={styles.insightCard}>
                      <View style={styles.insightHeader}>
                        <BarChart3 size={18} color={colors.primary} />
                        <Text style={styles.insightTitle}>Performance Summary</Text>
                      </View>
                      <Text style={styles.insightText}>
                        Over the past {selectedRange === '7d' ? '7 days' : selectedRange === '30d' ? '30 days' : '90 days'}, 
                        your average recovery has been {trendsData.avgRecovery}% ({getRecoveryStatus(trendsData.avgRecovery).status.toLowerCase()}) 
                        with an average strain of {trendsData.avgStrain} ({getStrainDescription(parseFloat(trendsData.avgStrain)).toLowerCase()}).
                      </Text>
                      
                      {trendsData.recoveryTrend > 2 && (
                        <View style={styles.insightHighlight}>
                          <TrendingUp size={16} color={colors.success} />
                          <Text style={[styles.insightHighlightText, { color: colors.success }]}>
                            Your recovery is trending upward! Keep up the good work with your current routine.
                          </Text>
                        </View>
                      )}
                      
                      {trendsData.recoveryTrend < -2 && (
                        <View style={styles.insightHighlight}>
                          <TrendingDown size={16} color={colors.danger} />
                          <Text style={[styles.insightHighlightText, { color: colors.danger }]}>
                            Your recovery is declining. Consider focusing on sleep, nutrition, and stress management.
                          </Text>
                        </View>
                      )}
                      
                      {Math.abs(trendsData.recoveryTrend) <= 2 && (
                        <View style={styles.insightHighlight}>
                          <Minus size={16} color={colors.textSecondary} />
                          <Text style={[styles.insightHighlightText, { color: colors.textSecondary }]}>
                            Your recovery is stable. Maintain your current habits for consistent performance.
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Calendar size={48} color={colors.textSecondary} />
                  <Text style={styles.noDataTitle}>Not Enough Data</Text>
                  <Text style={styles.noDataText}>
                    We need at least a few days of WHOOP data to show meaningful trends. 
                    Keep syncing your data to see insights here.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Workout Detail Modal */}
      <Modal
        visible={showWorkoutDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkoutDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">Workout Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowWorkoutDetailModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {todaysWorkout && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.workoutDetailContainer}>
                  {/* Workout Header */}
                  <View style={styles.workoutDetailHeader}>
                    <View style={styles.workoutDetailTitleContainer}>
                      {getWorkoutIcon(todaysWorkout.type)}
                      <Text style={styles.workoutDetailTitle}>{todaysWorkout.title}</Text>
                    </View>
                    <View style={[
                      styles.intensityBadge,
                      { backgroundColor: getIntensityColor(todaysWorkout.intensity) }
                    ]}>
                      <Text style={styles.intensityText}>{todaysWorkout.intensity}</Text>
                    </View>
                  </View>
                  
                  {/* Workout Overview */}
                  <View style={styles.workoutOverviewContainer}>
                    <Text style={styles.workoutDetailDescription}>
                      {todaysWorkout.description}
                    </Text>
                    
                    {/* Quick Stats */}
                    <View style={styles.quickStatsContainer}>
                      <View style={styles.quickStat}>
                        <Clock size={16} color={colors.primary} />
                        <Text style={styles.quickStatLabelModal}>Duration</Text>
                        <Text style={styles.quickStatValueModal}>{todaysWorkout.duration}</Text>
                      </View>
                      
                      <View style={styles.quickStat}>
                        <Heart size={16} color={colors.primary} />
                        <Text style={styles.quickStatLabelModal}>Target HR</Text>
                        <Text style={styles.quickStatValueModal}>
                          {generateTargetHeartRate(todaysWorkout.type, todaysWorkout.intensity)}
                        </Text>
                      </View>
                      
                      <View style={styles.quickStat}>
                        <Flame size={16} color={colors.primary} />
                        <Text style={styles.quickStatLabelModal}>Calories</Text>
                        <Text style={styles.quickStatValueModal}>
                          {generateCaloriesBurned(todaysWorkout.type, todaysWorkout.intensity)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Equipment Needed */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeader}>
                      <Dumbbell size={18} color={colors.primary} />
                      <Text style={styles.detailSectionTitle}>Equipment Needed</Text>
                    </View>
                    <View style={styles.equipmentList}>
                      {generateEquipment(todaysWorkout.title, todaysWorkout.type).map((item, index) => (
                        <View key={index} style={styles.equipmentItem}>
                          <View style={styles.bulletPoint} />
                          <Text style={styles.equipmentText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  {/* Exercise Breakdown */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeader}>
                      <Target size={18} color={colors.primary} />
                      <Text style={styles.detailSectionTitle}>Exercise Breakdown</Text>
                    </View>
                    <View style={styles.exerciseList}>
                      {generateExercises(todaysWorkout.title, todaysWorkout.type, todaysWorkout.description).map((exercise, index) => (
                        <View key={index} style={styles.exerciseItem}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <View style={styles.exerciseDetails}>
                            {exercise.sets && (
                              <Text style={styles.exerciseDetail}>Sets: {exercise.sets}</Text>
                            )}
                            {exercise.reps && (
                              <Text style={styles.exerciseDetail}>Reps: {exercise.reps}</Text>
                            )}
                            {exercise.duration && (
                              <Text style={styles.exerciseDetail}>Duration: {exercise.duration}</Text>
                            )}
                          </View>
                          {exercise.notes && (
                            <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  {/* Tips */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeader}>
                      <Zap size={18} color={colors.primary} />
                      <Text style={styles.detailSectionTitle}>Tips for Success</Text>
                    </View>
                    <View style={styles.tipsList}>
                      {generateTips(todaysWorkout.type, todaysWorkout.intensity).map((tip, index) => (
                        <View key={index} style={styles.tipItem}>
                          <View style={styles.bulletPoint} />
                          <Text style={styles.tipText}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  {/* Modifications */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeader}>
                      <Users size={18} color={colors.primary} />
                      <Text style={styles.detailSectionTitle}>Modifications</Text>
                    </View>
                    <View style={styles.modificationsList}>
                      {generateModifications(todaysWorkout.type, todaysWorkout.intensity).map((modification, index) => (
                        <View key={index} style={styles.modificationItem}>
                          <View style={styles.bulletPoint} />
                          <Text style={styles.modificationText}>{modification}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  {/* Recovery Adjustment */}
                  {todaysWorkout.recoveryAdjustment && (
                    <View style={styles.detailSection}>
                      <View style={styles.detailSectionHeader}>
                        <Heart size={18} color={colors.warning} />
                        <Text style={styles.detailSectionTitle}>Recovery Adjustment</Text>
                      </View>
                      <View style={styles.recoveryAdjustmentContainer}>
                        <Text style={styles.recoveryAdjustmentText}>
                          {todaysWorkout.recoveryAdjustment}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Action Buttons */}
                  <View style={styles.workoutDetailActions}>
                    <TouchableOpacity 
                      style={styles.startWorkoutDetailButton}
                      onPress={() => {
                        setShowWorkoutDetailModal(false);
                        handleStartWorkout(todaysWorkout);
                      }}
                    >
                      <Play size={20} color={colors.text} />
                      <Text style={styles.startWorkoutDetailText}>Start Workout</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.viewProgramDetailButton}
                      onPress={() => {
                        setShowWorkoutDetailModal(false);
                        router.push(`/program-detail?id=${todaysWorkout.programId}`);
                      }}
                    >
                      <ArrowRight size={20} color={colors.text} />
                      <Text style={styles.viewProgramDetailText}>View Program</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Get device dimensions for responsive sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const bottomPadding = Platform.OS === 'ios' ? (isSmallDevice ? 80 : 100) : 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ios.groupedBackground,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 16,
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: bottomPadding,
    backgroundColor: colors.ios.groupedBackground,
  },
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  connectBannerText: {
    flex: 1,
    color: colors.text,
    fontSize: isSmallDevice ? 13 : 14,
    marginLeft: 8,
  },
  connectBannerAction: {
    color: colors.text,
    fontWeight: '600',
    fontSize: isSmallDevice ? 13 : 14,
    textDecorationLine: 'underline',
  },
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ios.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  profileButtonText: {
    color: colors.text,
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
    marginTop: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  noDataTitleMain: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  noDataTextMain: {
    fontSize: isSmallDevice ? 15 : 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  connectButtonText: {
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
  },
  errorTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  errorText: {
    fontSize: isSmallDevice ? 15 : 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  errorList: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  errorListItem: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
    width: '100%',
  },
  retryButtonText: {
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  reconnectButtonText: {
    color: colors.primary,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Today's Workout Section Styles
  todaysWorkoutSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  workoutCard: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  workoutTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    letterSpacing: -0.2,
  },
  intensityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  intensityText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  workoutDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  workoutMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutMetaText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  clickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 8,
  },
  clickHintText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  workoutActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  completedWorkoutButton: {
    backgroundColor: colors.ios.systemGreen,
    shadowColor: colors.ios.systemGreen,
  },
  startWorkoutText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  viewProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewProgramText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  // No Program Section Styles
  noProgramSection: {
    marginBottom: 20,
  },
  noProgramCard: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noProgramTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  noProgramText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  createProgramButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  createProgramText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Rest Day Section Styles
  restDaySection: {
    marginBottom: 20,
  },
  restDayCard: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  restDayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  viewProgramsButton: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewProgramsText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.ios.groupedBackground,
    borderRadius: 24,
    padding: 24,
    margin: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    minHeight: SCREEN_HEIGHT * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  // Workout Detail Modal Styles
  workoutDetailContainer: {
    paddingBottom: 20,
  },
  workoutDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  workoutDetailTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  workoutDetailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  workoutOverviewContainer: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  workoutDetailDescription: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatLabelModal: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  quickStatValueModal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  detailSection: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  equipmentList: {
    marginTop: 8,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  equipmentText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  exerciseList: {
    marginTop: 8,
  },
  exerciseItem: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  exerciseDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 16,
    marginBottom: 4,
  },
  exerciseNotes: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  tipsList: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  modificationsList: {
    marginTop: 8,
  },
  modificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modificationText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  recoveryAdjustmentContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  recoveryAdjustmentText: {
    fontSize: 14,
    color: colors.warning,
    lineHeight: 20,
  },
  workoutDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  startWorkoutDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  startWorkoutDetailText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewProgramDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewProgramDetailText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 8,
  },
  // Quick Stats Section
  quickStatsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  trendsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickStatLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  quickStatValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.6,
  },
  quickStatStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Calendar Section
  calendarSection: {
    marginBottom: 24,
  },
  calendarViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  calendarViewButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Detailed Cards Section
  detailedCardsSection: {
    marginBottom: 16,
  },
  // Tab Switcher Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.ios.secondaryBackground,
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  activeTabButtonText: {
    color: colors.text,
  },
  // Trends Subpage Styles
  trendsContainer: {
    flex: 1,
  },
  // Time Range Selector
  timeRangeContainer: {
    marginBottom: 24,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeRangeButtonTextActive: {
    color: colors.text,
  },
  // Overview Section
  overviewSection: {
    marginBottom: 24,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  overviewValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  overviewTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  overviewTrendText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  overviewStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Metrics Section
  metricsSection: {
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  metricStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricStat: {
    alignItems: 'center',
  },
  metricStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  metricStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Mini Chart
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 35,
    gap: 2,
  },
  chartBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 5,
  },
  // Additional Metrics
  additionalMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  additionalMetricCard: {
    flex: 1,
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  additionalMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  additionalMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  // Insights Section
  insightsSection: {
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: colors.ios.secondaryGroupedBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  insightHighlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  insightHighlightText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  // No Data
  noDataTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});