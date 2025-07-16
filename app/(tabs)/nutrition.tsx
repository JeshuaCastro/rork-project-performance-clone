import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { colors } from '@/constants/colors';
import {
  Plus,
  X,
  Clock,
  Coffee,
  Utensils,
  Pizza,
  Apple,
  Flame,
  Egg,
  Cookie,
  Droplets,
  UserCircle,
  Calendar,
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  Heart,
  Brain,
  Shield,
  Sparkles,
  ChefHat,
  Search,
  Camera,
  Scan,
  Settings
} from 'lucide-react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { FoodLogEntry, NutrientAnalysis } from '@/types/whoop';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NutritionScreen() {
  const router = useRouter();
  const {
    userProfile,
    macroTargets,
    calculateMacroTargets,
    addFoodLogEntry,
    removeFoodLogEntry,
    getFoodLogEntriesByDate,
    getMacroProgressForDate,
    generateMealSuggestion,
    processTextMeal,
    analyzeNutrientDeficiencies
  } = useWhoopStore();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [nutrientAnalysisVisible, setNutrientAnalysisVisible] = useState(false);
  const [weeklyStatsVisible, setWeeklyStatsVisible] = useState(false);
  const [mealPlannerVisible, setMealPlannerVisible] = useState(false);

  // AI states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGeneratingMeal, setIsGeneratingMeal] = useState(false);

  // Text meal logging states
  const [mealDescription, setMealDescription] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [textProcessResult, setTextProcessResult] = useState<any>(null);

  // Nutrient analysis states
  const [nutrientAnalysis, setNutrientAnalysis] = useState<NutrientAnalysis | null>(null);
  const [isAnalyzingNutrients, setIsAnalyzingNutrients] = useState(false);

  // Weekly stats states
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [isLoadingWeeklyStats, setIsLoadingWeeklyStats] = useState(false);

  // Meal planner states
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
  const [mealPlanPreferencesVisible, setMealPlanPreferencesVisible] = useState(false);
  const [mealPlanPreferences, setMealPlanPreferences] = useState({
    favoriteFoods: '',
    dietaryRestrictions: '',
    allergies: '',
    cuisinePreferences: '',
    mealPrepTime: '',
    cookingSkill: 'intermediate',
    budgetRange: '',
    specificGoals: '',
    dislikedFoods: '',
    mealTypes: ['breakfast', 'lunch', 'dinner', 'snacks']
  });

  const [newFood, setNewFood] = useState<Partial<FoodLogEntry>>({
    date: selectedDate,
    mealType: 'breakfast',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [dayEntries, setDayEntries] = useState<FoodLogEntry[]>([]);
  const [macroProgress, setMacroProgress] = useState({
    calories: { consumed: 0, target: 0 },
    protein: { consumed: 0, target: 0 },
    carbs: { consumed: 0, target: 0 },
    fat: { consumed: 0, target: 0 }
  });

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

  useEffect(() => {
    if (isProfileComplete) {
      calculateMacroTargets();
      loadDayEntries();
    }
  }, [isProfileComplete, selectedDate]);

  useEffect(() => {
    if (isProfileComplete) {
      loadDayEntries();
    }
  }, [macroTargets]);

  const loadDayEntries = () => {
    const entries = getFoodLogEntriesByDate(selectedDate);
    setDayEntries(entries);

    const progress = getMacroProgressForDate(selectedDate);
    setMacroProgress(progress);
  };

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', icon: <Coffee size={20} color={colors.text} /> },
    { id: 'lunch', label: 'Lunch', icon: <Utensils size={20} color={colors.text} /> },
    { id: 'dinner', label: 'Dinner', icon: <Pizza size={20} color={colors.text} /> },
    { id: 'snack', label: 'Snack', icon: <Apple size={20} color={colors.text} /> },
  ];

  const addFood = () => {
    if (!newFood.name || !newFood.calories) {
      Alert.alert("Missing Information", "Please enter at least a food name and calories");
      return;
    }

    const entry: Omit<FoodLogEntry, 'id' | 'createdAt'> = {
      date: selectedDate,
      name: newFood.name || '',
      calories: Number(newFood.calories) || 0,
      protein: Number(newFood.protein) || 0,
      carbs: Number(newFood.carbs) || 0,
      fat: Number(newFood.fat) || 0,
      time: newFood.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealType: newFood.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    };

    addFoodLogEntry(entry);
    setModalVisible(false);

    // Reset form
    setNewFood({
      date: selectedDate,
      mealType: 'breakfast',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    loadDayEntries();
  };

  const handleDeleteEntry = (id: string) => {
    Alert.alert(
      "Delete Food Entry",
      "Are you sure you want to delete this food entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeFoodLogEntry(id);
            loadDayEntries();
          }
        }
      ]
    );
  };

  const handleGenerateMealSuggestion = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Missing Information", "Please enter what kind of meal you'd like suggestions for");
      return;
    }

    setIsGeneratingMeal(true);

    try {
      const suggestion = await generateMealSuggestion(aiPrompt);
      setAiResponse(suggestion);
    } catch (error) {
      console.error('Error generating meal suggestion:', error);
      setAiResponse("Sorry, I couldn't generate a meal suggestion at the moment. Please try again later.");
    } finally {
      setIsGeneratingMeal(false);
    }
  };

  const handleProcessTextMeal = async () => {
    if (!mealDescription.trim()) {
      Alert.alert("Missing Information", "Please enter what you ate");
      return;
    }

    setIsProcessingText(true);

    try {
      const result = await processTextMeal(mealDescription);

      if (result) {
        setTextProcessResult(result);
        setNewFood({
          ...newFood,
          name: result.name,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
        });
      } else {
        Alert.alert('Processing Error', 'Could not process the meal description. Please try again or enter the information manually.');
      }
    } catch (error) {
      console.error('Error processing text meal:', error);
      Alert.alert('Error', 'Failed to process meal description. Please try again or enter the information manually.');
    } finally {
      setIsProcessingText(false);
    }
  };

  const addFoodFromText = () => {
    if (!textProcessResult) return;

    const entry: Omit<FoodLogEntry, 'id' | 'createdAt'> = {
      date: selectedDate,
      name: textProcessResult.name,
      calories: textProcessResult.calories,
      protein: textProcessResult.protein,
      carbs: textProcessResult.carbs,
      fat: textProcessResult.fat,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealType: newFood.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    };

    addFoodLogEntry(entry);
    setTextModalVisible(false);
    setTextProcessResult(null);
    setMealDescription('');

    setNewFood({
      date: selectedDate,
      mealType: 'breakfast',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    loadDayEntries();
  };

  const handleAnalyzeNutrients = async () => {
    setIsAnalyzingNutrients(true);

    try {
      const analysis = await analyzeNutrientDeficiencies(selectedDate);
      setNutrientAnalysis(analysis);
      setNutrientAnalysisVisible(true);
    } catch (error) {
      console.error('Error analyzing nutrients:', error);
      Alert.alert('Error', 'Failed to analyze nutrients. Please try again later.');
    } finally {
      setIsAnalyzingNutrients(false);
    }
  };

  const generateWeeklyStats = async () => {
    setIsLoadingWeeklyStats(true);
    
    try {
      // Generate weekly nutrition statistics
      const endDate = new Date(selectedDate);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      
      const weekData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const progress = getMacroProgressForDate(dateStr);
        weekData.push({
          date: dateStr,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          ...progress
        });
      }
      
      setWeeklyStats(weekData);
      setWeeklyStatsVisible(true);
    } catch (error) {
      console.error('Error generating weekly stats:', error);
      Alert.alert('Error', 'Failed to generate weekly statistics.');
    } finally {
      setIsLoadingWeeklyStats(false);
    }
  };

  const generateMealPlan = async (preferences?: any) => {
    setIsGeneratingMealPlan(true);
    
    try {
      const prefs = preferences || mealPlanPreferences;
      
      let prompt = `Create a personalized meal plan for tomorrow based on my profile:
      - Age: ${userProfile.age}
      - Gender: ${userProfile.gender}
      - Weight: ${userProfile.weight}kg
      - Height: ${userProfile.height}cm
      - Activity Level: ${userProfile.activityLevel}
      - Fitness Goal: ${userProfile.fitnessGoal}
      - Daily Calorie Target: ${macroTargets?.calories || 2000}
      - Protein Target: ${macroTargets?.protein || 150}g
      - Carb Target: ${macroTargets?.carbs || 200}g
      - Fat Target: ${macroTargets?.fat || 70}g`;

      // Add preferences to the prompt
      if (prefs.favoriteFoods) {
        prompt += `\n- Favorite Foods: ${prefs.favoriteFoods}`;
      }
      if (prefs.dietaryRestrictions) {
        prompt += `\n- Dietary Restrictions: ${prefs.dietaryRestrictions}`;
      }
      if (prefs.allergies) {
        prompt += `\n- Allergies: ${prefs.allergies}`;
      }
      if (prefs.cuisinePreferences) {
        prompt += `\n- Cuisine Preferences: ${prefs.cuisinePreferences}`;
      }
      if (prefs.mealPrepTime) {
        prompt += `\n- Available Meal Prep Time: ${prefs.mealPrepTime}`;
      }
      if (prefs.cookingSkill) {
        prompt += `\n- Cooking Skill Level: ${prefs.cookingSkill}`;
      }
      if (prefs.budgetRange) {
        prompt += `\n- Budget Range: ${prefs.budgetRange}`;
      }
      if (prefs.specificGoals) {
        prompt += `\n- Specific Goals: ${prefs.specificGoals}`;
      }
      if (prefs.dislikedFoods) {
        prompt += `\n- Foods to Avoid: ${prefs.dislikedFoods}`;
      }

      prompt += `\n\nPlease provide a complete meal plan with ${prefs.mealTypes.join(', ')}. Include specific foods, portions, and approximate macros for each meal. Make sure to consider all my preferences and restrictions mentioned above.`;
      
      const plan = await generateMealSuggestion(prompt);
      setMealPlan(plan);
      setMealPlannerVisible(true);
      setMealPlanPreferencesVisible(false);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate meal plan.');
    } finally {
      setIsGeneratingMealPlan(false);
    }
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  // Calculate progress percentages
  const caloriePercentage = Math.min(100, (macroProgress.calories.consumed / macroProgress.calories.target) * 100 || 0);
  const proteinPercentage = Math.min(100, (macroProgress.protein.consumed / macroProgress.protein.target) * 100 || 0);
  const carbsPercentage = Math.min(100, (macroProgress.carbs.consumed / macroProgress.carbs.target) * 100 || 0);
  const fatPercentage = Math.min(100, (macroProgress.fat.consumed / macroProgress.fat.target) * 100 || 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const changeDateBy = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Nutrition Tracker' }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity 
            style={styles.dateArrow}
            onPress={() => changeDateBy(-1)}
          >
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dateContainer}>
            <Calendar size={16} color={colors.primary} />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dateArrow}
            onPress={() => changeDateBy(1)}
          >
            <Text style={styles.dateArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setTextModalVisible(true)}
            disabled={!isProfileComplete}
          >
            <ChefHat size={20} color={colors.text} />
            <Text style={styles.quickActionText}>Describe Meal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setModalVisible(true)}
            disabled={!isProfileComplete}
          >
            <Plus size={20} color={colors.text} />
            <Text style={styles.quickActionText}>Add Food</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setAiModalVisible(true)}
            disabled={!isProfileComplete}
          >
            <Sparkles size={20} color={colors.text} />
            <Text style={styles.quickActionText}>AI Suggest</Text>
          </TouchableOpacity>
        </View>

        {!isProfileComplete ? (
          <View style={styles.incompleteProfileContainer}>
            {Platform.OS === 'web' ? (
              <View style={styles.blurOverlay}>
                <View style={styles.macroSummaryContainer}>
                  <View style={[styles.calorieContainer, styles.blurred]}>
                    <View style={styles.calorieHeader}>
                      <Flame size={20} color={colors.primary} />
                      <Text style={styles.calorieLabel}>Calories</Text>
                    </View>
                    <Text style={styles.calorieValue}>0 / 0</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  </View>
                  
                  <View style={styles.macroGrid}>
                    <View style={[styles.macroItem, styles.blurred]}>
                      <View style={styles.macroHeader}>
                        <Egg size={16} color={colors.primary} />
                        <Text style={styles.macroLabel}>Protein</Text>
                      </View>
                      <Text style={styles.macroValue}>0g / 0g</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                    </View>
                    
                    <View style={[styles.macroItem, styles.blurred]}>
                      <View style={styles.macroHeader}>
                        <Cookie size={16} color={colors.primary} />
                        <Text style={styles.macroLabel}>Carbs</Text>
                      </View>
                      <Text style={styles.macroValue}>0g / 0g</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                    </View>
                    
                    <View style={[styles.macroItem, styles.blurred]}>
                      <View style={styles.macroHeader}>
                        <Droplets size={16} color={colors.primary} />
                        <Text style={styles.macroLabel}>Fat</Text>
                      </View>
                      <Text style={styles.macroValue}>0g / 0g</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <BlurView intensity={8} tint="dark" style={styles.blurView}>
                <View style={styles.macroSummaryContainer}>
                  <View style={styles.calorieContainer}>
                    <View style={styles.calorieHeader}>
                      <Flame size={20} color={colors.primary} />
                      <Text style={styles.calorieLabel}>Calories</Text>
                    </View>
                    <Text style={styles.calorieValue}>0 / 0</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  </View>
                  
                  <View style={styles.macroGrid}>
                    <View style={styles.macroItem}>
                      <View style={styles.macroHeader}>
                        <Egg size={16} color={colors.primary} />
                        <Text style={styles.macroLabel}>Protein</Text>
                      </View>
                      <Text style={styles.macroValue}>0g / 0g</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                    </View>
                    
                    <View style={styles.macroItem}>
                      <View style={styles.macroHeader}>
                        <Cookie size={16} color={colors.primary} />
                        <Text style={styles.macroLabel}>Carbs</Text>
                      </View>
                      <Text style={styles.macroValue}>0g / 0g</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                    </View>
                    
                    <View style={styles.macroItem}>
                      <View style={styles.macroHeader}>
                        <Droplets size={16} color={colors.primary} />
                        <Text style={styles.macroLabel}>Fat</Text>
                      </View>
                      <Text style={styles.macroValue}>0g / 0g</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              </BlurView>
            )}
            
            <TouchableOpacity 
              style={styles.completeProfileButton}
              onPress={navigateToProfile}
            >
              <UserCircle size={20} color={colors.text} />
              <Text style={styles.completeProfileText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Macro Summary */}
            <View style={styles.macroSummaryContainer}>
              <View style={styles.calorieContainer}>
                <View style={styles.calorieHeader}>
                  <Flame size={20} color={colors.primary} />
                  <Text style={styles.calorieLabel}>Calories</Text>
                </View>
                <Text style={styles.calorieValue}>
                  {macroProgress.calories.consumed} / {macroProgress.calories.target}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${caloriePercentage}%` },
                      caloriePercentage > 100 ? styles.progressOverage : null
                    ]} 
                  />
                </View>
                <Text style={styles.remainingText}>
                  {macroProgress.calories.target - macroProgress.calories.consumed > 0 
                    ? `${macroProgress.calories.target - macroProgress.calories.consumed} remaining`
                    : `${macroProgress.calories.consumed - macroProgress.calories.target} over`
                  }
                </Text>
              </View>
              
              <View style={styles.macroGrid}>
                <View style={styles.macroItem}>
                  <View style={styles.macroHeader}>
                    <Egg size={16} color={colors.primary} />
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <Text style={styles.macroValue}>
                    {macroProgress.protein.consumed}g / {macroProgress.protein.target}g
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${proteinPercentage}%` },
                        proteinPercentage > 100 ? styles.progressOverage : null
                      ]} 
                    />
                  </View>
                </View>
                
                <View style={styles.macroItem}>
                  <View style={styles.macroHeader}>
                    <Cookie size={16} color={colors.primary} />
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <Text style={styles.macroValue}>
                    {macroProgress.carbs.consumed}g / {macroProgress.carbs.target}g
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${carbsPercentage}%` },
                        carbsPercentage > 100 ? styles.progressOverage : null
                      ]} 
                    />
                  </View>
                </View>
                
                <View style={styles.macroItem}>
                  <View style={styles.macroHeader}>
                    <Droplets size={16} color={colors.primary} />
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                  <Text style={styles.macroValue}>
                    {macroProgress.fat.consumed}g / {macroProgress.fat.target}g
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${fatPercentage}%` },
                        fatPercentage > 100 ? styles.progressOverage : null
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Analysis Tools */}
            <View style={styles.analysisTools}>
              <TouchableOpacity 
                style={styles.analysisRowButton}
                onPress={handleAnalyzeNutrients}
                disabled={isAnalyzingNutrients || dayEntries.length === 0}
              >
                <View style={styles.analysisRowContent}>
                  <View style={styles.analysisRowLeft}>
                    {isAnalyzingNutrients ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Brain size={20} color={colors.primary} />
                    )}
                    <View style={styles.analysisRowTextContainer}>
                      <Text style={styles.analysisRowTitle}>Nutrient Analysis</Text>
                      <Text style={styles.analysisRowSubtitle}>Analyze your daily nutrition intake</Text>
                    </View>
                  </View>
                  <Text style={styles.analysisRowArrow}>›</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.analysisRowButton}
                onPress={generateWeeklyStats}
                disabled={isLoadingWeeklyStats}
              >
                <View style={styles.analysisRowContent}>
                  <View style={styles.analysisRowLeft}>
                    {isLoadingWeeklyStats ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <BarChart3 size={20} color={colors.primary} />
                    )}
                    <View style={styles.analysisRowTextContainer}>
                      <Text style={styles.analysisRowTitle}>Weekly Stats</Text>
                      <Text style={styles.analysisRowSubtitle}>View your weekly nutrition trends</Text>
                    </View>
                  </View>
                  <Text style={styles.analysisRowArrow}>›</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.analysisRowButton}
                onPress={() => setMealPlanPreferencesVisible(true)}
                disabled={isGeneratingMealPlan}
              >
                <View style={styles.analysisRowContent}>
                  <View style={styles.analysisRowLeft}>
                    {isGeneratingMealPlan ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Target size={20} color={colors.primary} />
                    )}
                    <View style={styles.analysisRowTextContainer}>
                      <Text style={styles.analysisRowTitle}>AI Meal Plan</Text>
                      <Text style={styles.analysisRowSubtitle}>Customizable personalized meal suggestions</Text>
                    </View>
                  </View>
                  <Text style={styles.analysisRowArrow}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Food Log */}
            {dayEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Apple size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No foods logged for {formatDate(selectedDate)}</Text>
                <Text style={styles.emptySubtext}>Start tracking your nutrition by adding your first meal</Text>
              </View>
            ) : (
              <View style={styles.foodsList}>
                <Text style={styles.sectionTitle}>Today's Meals</Text>
                {dayEntries.map((entry) => (
                  <View key={entry.id} style={styles.foodItem}>
                    <View style={styles.foodHeader}>
                      <View style={styles.foodTypeContainer}>
                        {mealTypes.find(type => type.id === entry.mealType)?.icon}
                        <Text style={styles.foodType}>
                          {mealTypes.find(type => type.id === entry.mealType)?.label}
                        </Text>
                      </View>
                      <Text style={styles.foodTime}>
                        <Clock size={14} color={colors.textSecondary} /> {entry.time}
                      </Text>
                    </View>
                    
                    <Text style={styles.foodName}>{entry.name}</Text>
                    
                    <View style={styles.foodNutrition}>
                      <Text style={styles.foodCalories}>{entry.calories} cal</Text>
                      <Text style={styles.foodMacros}>
                        P: {entry.protein}g • C: {entry.carbs}g • F: {entry.fat}g
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEntry(entry.id)}
                    >
                      <X size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Add Food Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Food</Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.inputLabel}>Meal Type</Text>
                <View style={styles.mealTypeSelector}>
                  {mealTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.mealTypeOption,
                        newFood.mealType === type.id && styles.selectedMealType
                      ]}
                      onPress={() => setNewFood({ ...newFood, mealType: type.id as any })}
                    >
                      {type.icon}
                      <Text 
                        style={[
                          styles.mealTypeText,
                          newFood.mealType === type.id && styles.selectedMealTypeText
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={styles.inputLabel}>Food Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Grilled Chicken Salad"
                  placeholderTextColor={colors.textSecondary}
                  value={newFood.name}
                  onChangeText={(text) => setNewFood({ ...newFood, name: text })}
                />
                
                <Text style={styles.inputLabel}>Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Time"
                  placeholderTextColor={colors.textSecondary}
                  value={newFood.time}
                  onChangeText={(text) => setNewFood({ ...newFood, time: text })}
                />
                
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Calories"
                  placeholderTextColor={colors.textSecondary}
                  value={newFood.calories?.toString()}
                  onChangeText={(text) => setNewFood({ ...newFood, calories: parseInt(text) || 0 })}
                  keyboardType="number-pad"
                />
                
                <View style={styles.macroInputs}>
                  <View style={styles.macroInputGroup}>
                    <Text style={styles.inputLabel}>Protein (g)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      value={newFood.protein?.toString()}
                      onChangeText={(text) => setNewFood({ ...newFood, protein: parseInt(text) || 0 })}
                      keyboardType="number-pad"
                    />
                  </View>
                  
                  <View style={styles.macroInputGroup}>
                    <Text style={styles.inputLabel}>Carbs (g)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      value={newFood.carbs?.toString()}
                      onChangeText={(text) => setNewFood({ ...newFood, carbs: parseInt(text) || 0 })}
                      keyboardType="number-pad"
                    />
                  </View>
                  
                  <View style={styles.macroInputGroup}>
                    <Text style={styles.inputLabel}>Fat (g)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      value={newFood.fat?.toString()}
                      onChangeText={(text) => setNewFood({ ...newFood, fat: parseInt(text) || 0 })}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.addFoodButton}
                  onPress={addFood}
                >
                  <Text style={styles.addFoodButtonText}>Add Food</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* AI Meal Suggestion Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={aiModalVisible}
          onRequestClose={() => setAiModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>AI Meal Suggestions</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setAiModalVisible(false);
                    setAiPrompt('');
                    setAiResponse('');
                  }}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.aiPromptLabel}>What would you like to eat?</Text>
                <TextInput
                  style={styles.aiPromptInput}
                  placeholder="e.g., a high protein breakfast that's quick to make"
                  placeholderTextColor={colors.textSecondary}
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  multiline
                  numberOfLines={3}
                />
                
                <TouchableOpacity 
                  style={styles.generateButton}
                  onPress={handleGenerateMealSuggestion}
                  disabled={isGeneratingMeal}
                >
                  {isGeneratingMeal ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={styles.generateButtonText}>Generate Suggestion</Text>
                  )}
                </TouchableOpacity>
                
                {aiResponse ? (
                  <View style={styles.aiResponseContainer}>
                    <Text style={styles.aiResponseTitle}>Suggestion</Text>
                    <Text style={styles.aiResponseText}>{aiResponse}</Text>
                  </View>
                ) : (
                  <View style={styles.aiSuggestionExamples}>
                    <Text style={styles.aiExamplesTitle}>Try asking for:</Text>
                    {[
                      "A high protein breakfast under 500 calories",
                      "A quick post-workout meal with 30g protein",
                      "A vegetarian dinner rich in iron",
                      "A keto-friendly lunch I can meal prep",
                      "A smoothie recipe that fits my macros"
                    ].map((example, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={styles.aiExampleItem}
                        onPress={() => setAiPrompt(example)}
                      >
                        <Text style={styles.aiExampleText}>{example}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Text Meal Logging Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={textModalVisible}
          onRequestClose={() => {
            setTextModalVisible(false);
            setMealDescription('');
            setTextProcessResult(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {textProcessResult ? 'Confirm Food' : 'Describe Your Meal'}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setTextModalVisible(false);
                    setMealDescription('');
                    setTextProcessResult(null);
                  }}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {!textProcessResult ? (
                  <>
                    <Text style={styles.textInstructions}>
                      Describe what you ate and we'll calculate the nutrition information
                    </Text>
                    
                    <TextInput
                      style={styles.mealDescriptionInput}
                      placeholder="e.g., Grilled chicken breast with brown rice and steamed broccoli"
                      placeholderTextColor={colors.textSecondary}
                      value={mealDescription}
                      onChangeText={setMealDescription}
                      multiline
                      numberOfLines={4}
                    />
                    
                    <TouchableOpacity 
                      style={styles.analyzeButton}
                      onPress={handleProcessTextMeal}
                      disabled={isProcessingText || !mealDescription.trim()}
                    >
                      {isProcessingText ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <Text style={styles.analyzeButtonText}>Analyze Meal</Text>
                      )}
                    </TouchableOpacity>
                    
                    <View style={styles.textExamples}>
                      <Text style={styles.textExamplesTitle}>Example descriptions:</Text>
                      <Text style={styles.textExampleItem}>
                        "Grilled chicken salad with olive oil dressing"
                      </Text>
                      <Text style={styles.textExampleItem}>
                        "Two eggs, toast with butter, and a cup of coffee"
                      </Text>
                      <Text style={styles.textExampleItem}>
                        "Protein shake with one scoop of whey and a banana"
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.textResultContainer}>
                    <Text style={styles.inputLabel}>Meal Type</Text>
                    <View style={styles.mealTypeSelector}>
                      {mealTypes.map((type) => (
                        <TouchableOpacity
                          key={type.id}
                          style={[
                            styles.mealTypeOption,
                            newFood.mealType === type.id && styles.selectedMealType
                          ]}
                          onPress={() => setNewFood({ ...newFood, mealType: type.id as any })}
                        >
                          {type.icon}
                          <Text 
                            style={[
                              styles.mealTypeText,
                              newFood.mealType === type.id && styles.selectedMealTypeText
                            ]}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <View style={styles.textResultItem}>
                      <Text style={styles.textResultLabel}>Food:</Text>
                      <Text style={styles.textResultValue}>{textProcessResult.name}</Text>
                    </View>
                    
                    <View style={styles.textResultItem}>
                      <Text style={styles.textResultLabel}>Calories:</Text>
                      <Text style={styles.textResultValue}>{textProcessResult.calories} cal</Text>
                    </View>
                    
                    <View style={styles.textResultMacros}>
                      <View style={styles.textResultMacroItem}>
                        <Text style={styles.textResultMacroLabel}>Protein:</Text>
                        <Text style={styles.textResultMacroValue}>{textProcessResult.protein}g</Text>
                      </View>
                      
                      <View style={styles.textResultMacroItem}>
                        <Text style={styles.textResultMacroLabel}>Carbs:</Text>
                        <Text style={styles.textResultMacroValue}>{textProcessResult.carbs}g</Text>
                      </View>
                      
                      <View style={styles.textResultMacroItem}>
                        <Text style={styles.textResultMacroLabel}>Fat:</Text>
                        <Text style={styles.textResultMacroValue}>{textProcessResult.fat}g</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.addFoodButton}
                      onPress={addFoodFromText}
                    >
                      <Text style={styles.addFoodButtonText}>Add Food</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.tryAgainButton}
                      onPress={() => {
                        setTextProcessResult(null);
                        setNewFood({
                          date: selectedDate,
                          mealType: 'breakfast',
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        });
                      }}
                    >
                      <Text style={styles.tryAgainButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Nutrient Analysis Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={nutrientAnalysisVisible}
          onRequestClose={() => setNutrientAnalysisVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nutrient Analysis</Text>
                <TouchableOpacity 
                  onPress={() => setNutrientAnalysisVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {nutrientAnalysis ? (
                  <>
                    <View style={styles.nutrientSummary}>
                      <Text style={styles.nutrientSummaryTitle}>Daily Summary</Text>
                      <Text style={styles.nutrientSummaryText}>{nutrientAnalysis.summary}</Text>
                    </View>
                    
                    {nutrientAnalysis.deficiencies.length > 0 ? (
                      <View style={styles.deficienciesContainer}>
                        <Text style={styles.deficienciesTitle}>Potential Deficiencies</Text>
                        {nutrientAnalysis.deficiencies.map((deficiency, index) => (
                          <View key={index} style={styles.deficiencyItem}>
                            <Text style={styles.deficiencyName}>{deficiency.nutrient}</Text>
                            <Text style={styles.deficiencyDescription}>{deficiency.description}</Text>
                            <View style={styles.foodSourcesContainer}>
                              <Text style={styles.foodSourcesTitle}>Food Sources:</Text>
                              <Text style={styles.foodSourcesList}>{deficiency.foodSources}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.noDeficienciesContainer}>
                        <Text style={styles.noDeficienciesText}>
                          No significant nutrient deficiencies detected based on today's meals.
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.recommendationsContainer}>
                      <Text style={styles.recommendationsTitle}>Recommendations</Text>
                      {nutrientAnalysis.recommendations.map((recommendation, index) => (
                        <Text key={index} style={styles.recommendationItem}>
                          • {recommendation}
                        </Text>
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Analyzing your nutrition...</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Weekly Stats Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={weeklyStatsVisible}
          onRequestClose={() => setWeeklyStatsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Weekly Nutrition Stats</Text>
                <TouchableOpacity 
                  onPress={() => setWeeklyStatsVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {weeklyStats ? (
                  <View style={styles.weeklyStatsContainer}>
                    {weeklyStats.map((day: any, index: number) => (
                      <View key={index} style={styles.weeklyStatItem}>
                        <Text style={styles.weeklyStatDay}>{day.dayName}</Text>
                        <View style={styles.weeklyStatBars}>
                          <View style={styles.weeklyStatBar}>
                            <Text style={styles.weeklyStatLabel}>Cal</Text>
                            <View style={styles.weeklyProgressBar}>
                              <View 
                                style={[
                                  styles.weeklyProgressFill,
                                  { width: `${Math.min(100, (day.calories.consumed / day.calories.target) * 100)}%` }
                                ]}
                              />
                            </View>
                            <Text style={styles.weeklyStatValue}>{day.calories.consumed}</Text>
                          </View>
                          <View style={styles.weeklyStatBar}>
                            <Text style={styles.weeklyStatLabel}>Pro</Text>
                            <View style={styles.weeklyProgressBar}>
                              <View 
                                style={[
                                  styles.weeklyProgressFill,
                                  { width: `${Math.min(100, (day.protein.consumed / day.protein.target) * 100)}%` }
                                ]}
                              />
                            </View>
                            <Text style={styles.weeklyStatValue}>{day.protein.consumed}g</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading weekly stats...</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Meal Plan Preferences Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={mealPlanPreferencesVisible}
          onRequestClose={() => setMealPlanPreferencesVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Customize Your Meal Plan</Text>
                <TouchableOpacity 
                  onPress={() => setMealPlanPreferencesVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.preferencesDescription}>
                  Tell us about your preferences to create a personalized meal plan just for you.
                </Text>

                <Text style={styles.inputLabel}>Favorite Foods</Text>
                <TextInput
                  style={styles.preferencesInput}
                  placeholder="e.g., chicken, salmon, avocado, quinoa, Greek yogurt..."
                  placeholderTextColor={colors.textSecondary}
                  value={mealPlanPreferences.favoriteFoods}
                  onChangeText={(text) => setMealPlanPreferences({...mealPlanPreferences, favoriteFoods: text})}
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputLabel}>Dietary Restrictions</Text>
                <TextInput
                  style={styles.preferencesInput}
                  placeholder="e.g., vegetarian, vegan, keto, paleo, low-carb..."
                  placeholderTextColor={colors.textSecondary}
                  value={mealPlanPreferences.dietaryRestrictions}
                  onChangeText={(text) => setMealPlanPreferences({...mealPlanPreferences, dietaryRestrictions: text})}
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputLabel}>Allergies & Intolerances</Text>
                <TextInput
                  style={styles.preferencesInput}
                  placeholder="e.g., nuts, dairy, gluten, shellfish..."
                  placeholderTextColor={colors.textSecondary}
                  value={mealPlanPreferences.allergies}
                  onChangeText={(text) => setMealPlanPreferences({...mealPlanPreferences, allergies: text})}
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputLabel}>Cuisine Preferences</Text>
                <TextInput
                  style={styles.preferencesInput}
                  placeholder="e.g., Mediterranean, Asian, Mexican, Italian..."
                  placeholderTextColor={colors.textSecondary}
                  value={mealPlanPreferences.cuisinePreferences}
                  onChangeText={(text) => setMealPlanPreferences({...mealPlanPreferences, cuisinePreferences: text})}
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputLabel}>Available Meal Prep Time</Text>
                <TextInput
                  style={styles.preferencesInput}
                  placeholder="e.g., 30 minutes per meal, quick meals only, batch cooking on weekends..."
                  placeholderTextColor={colors.textSecondary}
                  value={mealPlanPreferences.mealPrepTime}
                  onChangeText={(text) => setMealPlanPreferences({...mealPlanPreferences, mealPrepTime: text})}
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputLabel}>Cooking Skill Level</Text>
                <View style={styles.skillLevelSelector}>
                  {['beginner', 'intermediate', 'advanced'].map((skill) => (
                    <TouchableOpacity
                      key={skill}
                      style={[
                        styles.skillOption,
                        mealPlanPreferences.cookingSkill === skill && styles.selectedSkillOption
                      ]}
                      onPress={() => setMealPlanPreferences({...mealPlanPreferences, cookingSkill: skill})}
                    >
                      <Text 
                        style={[
                          styles.skillOptionText,
                          mealPlanPreferences.cookingSkill === skill && styles.selectedSkillOptionText
                        ]}
                      >
                        {skill.charAt(0).toUpperCase() + skill.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Budget Range</Text>
                <TextInput
                  style={styles.preferencesInput}
                  placeholder="e.g., budget-friendly, moderate, premium ingredients..."
                  placeholderTextColor={colors.textSecondary}
                  value={mealPlanPreferences.budgetRange}
                  onChangeText={(text) => setMealPlanPreferences({...mealPlanPreferences, budgetRange: text})}
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputLabel}>Specific Goals</Text>
                <TextInput
                  style={styles.preferencesInput}
                  placeholder="e.g., muscle gain, weight loss, energy boost, better digestion..."
                  placeholderTextColor={colors.textSecondary}
                  value={mealPlanPreferences.specificGoals}
                  onChangeText={(text) => setMealPlanPreferences({...mealPlanPreferences, specificGoals: text})}
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputLabel}>Foods to Avoid</Text>
                <TextInput
                  style={styles.preferencesInput}
                  placeholder="e.g., processed foods, red meat, spicy foods..."
                  placeholderTextColor={colors.textSecondary}
                  value={mealPlanPreferences.dislikedFoods}
                  onChangeText={(text) => setMealPlanPreferences({...mealPlanPreferences, dislikedFoods: text})}
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputLabel}>Meal Types to Include</Text>
                <View style={styles.mealTypesSelector}>
                  {[
                    { id: 'breakfast', label: 'Breakfast' },
                    { id: 'lunch', label: 'Lunch' },
                    { id: 'dinner', label: 'Dinner' },
                    { id: 'snacks', label: 'Snacks' }
                  ].map((mealType) => (
                    <TouchableOpacity
                      key={mealType.id}
                      style={[
                        styles.mealTypeCheckbox,
                        mealPlanPreferences.mealTypes.includes(mealType.id) && styles.selectedMealTypeCheckbox
                      ]}
                      onPress={() => {
                        const updatedMealTypes = mealPlanPreferences.mealTypes.includes(mealType.id)
                          ? mealPlanPreferences.mealTypes.filter(type => type !== mealType.id)
                          : [...mealPlanPreferences.mealTypes, mealType.id];
                        setMealPlanPreferences({...mealPlanPreferences, mealTypes: updatedMealTypes});
                      }}
                    >
                      <Text 
                        style={[
                          styles.mealTypeCheckboxText,
                          mealPlanPreferences.mealTypes.includes(mealType.id) && styles.selectedMealTypeCheckboxText
                        ]}
                      >
                        {mealType.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={styles.generateMealPlanButton}
                  onPress={() => generateMealPlan(mealPlanPreferences)}
                  disabled={isGeneratingMealPlan}
                >
                  {isGeneratingMealPlan ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={styles.generateMealPlanButtonText}>Generate My Meal Plan</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.skipPreferencesButton}
                  onPress={() => generateMealPlan()}
                  disabled={isGeneratingMealPlan}
                >
                  <Text style={styles.skipPreferencesButtonText}>Skip & Use Basic Plan</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Meal Planner Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={mealPlannerVisible}
          onRequestClose={() => setMealPlannerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>AI Meal Plan</Text>
                <TouchableOpacity 
                  onPress={() => setMealPlannerVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {mealPlan ? (
                  <View style={styles.mealPlanContainer}>
                    <Text style={styles.mealPlanTitle}>Tomorrow's Meal Plan</Text>
                    <Text style={styles.mealPlanText}>{mealPlan}</Text>
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Generating your meal plan...</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  dateArrow: {
    padding: 12,
  },
  dateArrowText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  macroSummaryContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  calorieContainer: {
    marginBottom: 20,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calorieLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressOverage: {
    backgroundColor: colors.danger,
  },
  analysisTools: {
    marginBottom: 20,
  },
  analysisButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  analysisButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  analysisRowButton: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  analysisRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analysisRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  analysisRowTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  analysisRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  analysisRowSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  analysisRowArrow: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  foodsList: {
    marginBottom: 20,
  },
  foodItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  foodTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  foodNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  foodMacros: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incompleteProfileContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  blurView: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurOverlay: {
    opacity: 0.5,
  },
  blurred: {
    opacity: 0.5,
  },
  completeProfileButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -25 }],
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  completeProfileText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  mealTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  mealTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedMealType: {
    backgroundColor: colors.primary,
  },
  mealTypeText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: 8,
  },
  selectedMealTypeText: {
    color: colors.text,
    fontWeight: '600',
  },
  macroInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroInputGroup: {
    flex: 1,
    marginRight: 8,
  },
  addFoodButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addFoodButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  aiPromptLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  aiPromptInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  generateButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  aiResponseContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  aiResponseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  aiResponseText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  aiSuggestionExamples: {
    marginTop: 8,
  },
  aiExamplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  aiExampleItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  aiExampleText: {
    fontSize: 14,
    color: colors.text,
  },
  textInstructions: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  mealDescriptionInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  analyzeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  textExamples: {
    marginTop: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  textExamplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  textExampleItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  textResultContainer: {
    padding: 8,
  },
  textResultItem: {
    marginBottom: 16,
  },
  textResultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  textResultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  textResultMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  textResultMacroItem: {
    flex: 1,
  },
  textResultMacroLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  textResultMacroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tryAgainButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  tryAgainButtonText: {
    color: colors.text,
    fontSize: 16,
  },
  nutrientSummary: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nutrientSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  nutrientSummaryText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  deficienciesContainer: {
    marginBottom: 16,
  },
  deficienciesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  deficiencyItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  deficiencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
    marginBottom: 4,
  },
  deficiencyDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  foodSourcesContainer: {
    marginTop: 8,
  },
  foodSourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  foodSourcesList: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  noDeficienciesContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  noDeficienciesText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  recommendationsContainer: {
    marginBottom: 24,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  recommendationItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
  },
  weeklyStatsContainer: {
    paddingBottom: 20,
  },
  weeklyStatItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  weeklyStatDay: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  weeklyStatBars: {
    gap: 8,
  },
  weeklyStatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 30,
  },
  weeklyProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#3A3A3A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weeklyProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  weeklyStatValue: {
    fontSize: 12,
    color: colors.text,
    width: 40,
    textAlign: 'right',
  },
  mealPlanContainer: {
    paddingBottom: 20,
  },
  mealPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  mealPlanText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  preferencesDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  preferencesInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  skillLevelSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  skillOption: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedSkillOption: {
    backgroundColor: colors.primary,
  },
  skillOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedSkillOptionText: {
    color: colors.text,
    fontWeight: '600',
  },
  mealTypesSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  mealTypeCheckbox: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedMealTypeCheckbox: {
    backgroundColor: colors.primary,
  },
  mealTypeCheckboxText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedMealTypeCheckboxText: {
    color: colors.text,
    fontWeight: '600',
  },
  generateMealPlanButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  generateMealPlanButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  skipPreferencesButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  skipPreferencesButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});