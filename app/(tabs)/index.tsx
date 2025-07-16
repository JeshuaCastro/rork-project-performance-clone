import React, { useEffect, useState } from 'react';
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
import AIInsightCard from '@/components/AIInsightCard';
import CalendarView from '@/components/CalendarView';
import NutritionTracker from '@/components/NutritionTracker';
import DailyOverview from '@/components/DailyOverview';
import { colors } from '@/constants/colors';
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
  Info
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [showWorkoutDetailModal, setShowWorkoutDetailModal] = useState(false);
  
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
            if (!lastSyncTime || Date.now() - lastSyncTime > 60 * 60 * 1000 || data.recovery.length === 0) {
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
  const dates = data.recovery.map(item => item.date);
  
  // Find the selected data items
  const selectedRecovery = data.recovery.find(item => item.date === selectedDate);
  const selectedStrain = data.strain.find(item => item.date === selectedDate);
  
  // Get today's workout from active programs
  const todaysWorkout = getTodaysWorkout();
  

  

  
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
      <Text style={styles.noDataTitle}>No WHOOP Data Available</Text>
      <Text style={styles.noDataText}>
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
      
      {isConnectedToWhoop && data.recovery.length === 0 && isLoadingWhoopData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading WHOOP data...</Text>
        </View>
      ) : isConnectedToWhoop && data.recovery.length === 0 && syncAttempted ? (
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
      ) : isConnectedToWhoop && data.recovery.length === 0 ? (
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
          {/* Daily Overview */}
          <DailyOverview onStartWorkout={handleStartWorkout} />
          
          {/* Calendar View */}
          <CalendarView 
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            highlightedDates={dates}
          />
          
          {selectedRecovery && <RecoveryCard recovery={selectedRecovery} />}
          {selectedStrain && <StrainCard strain={selectedStrain} />}
          <NutritionTracker />
          
          {selectedDate === dates[0] && (
            <AIInsightCard analysis={analysis} />
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
                        <Text style={styles.quickStatLabel}>Duration</Text>
                        <Text style={styles.quickStatValue}>{todaysWorkout.duration}</Text>
                      </View>
                      
                      <View style={styles.quickStat}>
                        <Heart size={16} color={colors.primary} />
                        <Text style={styles.quickStatLabel}>Target HR</Text>
                        <Text style={styles.quickStatValue}>
                          {generateTargetHeartRate(todaysWorkout.type, todaysWorkout.intensity)}
                        </Text>
                      </View>
                      
                      <View style={styles.quickStat}>
                        <Flame size={16} color={colors.primary} />
                        <Text style={styles.quickStatLabel}>Calories</Text>
                        <Text style={styles.quickStatValue}>
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
    backgroundColor: colors.background,
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
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
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
  noDataTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  noDataText: {
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 20,
    margin: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    minHeight: SCREEN_HEIGHT * 0.7,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  quickStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  detailSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 8,
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
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 1,
    marginLeft: 8,
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
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});