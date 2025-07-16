import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
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
  BarChart3,
  Target,
  ChefHat,
  Zap,
  Award,
  Activity
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { FoodLogEntry, NutrientAnalysis } from '@/types/whoop';
import { BlurView } from 'expo-blur';

export default function NutritionScreen() {
  const router = useRouter();
  const { 
    userProfile, 
    macroTargets, 
    calculateMacroTargets,
    syncMacroTargetsWithActiveProgram,
    addFoodLogEntry, 
    removeFoodLogEntry, 
    getFoodLogEntriesByDate, 
    getMacroProgressForDate,
    generateMealSuggestion,
    processTextMeal,
    analyzeNutrientDeficiencies,
    weightHistory,
    addWeightEntry,
    updateWeightEntry,
    getWeightHistory,
    initializeWeightFromProfile,
    activePrograms,
    getProgramProgress
  } = useWhoopStore();
  
  // Nutrition tracking states
  const [modalVisible, setModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGeneratingMeal, setIsGeneratingMeal] = useState(false);
  
  // Text meal logging states
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [mealDescription, setMealDescription] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [textProcessResult, setTextProcessResult] = useState<any>(null);
  
  // Nutrient analysis states
  const [nutrientAnalysisVisible, setNutrientAnalysisVisible] = useState(false);
  const [nutrientAnalysis, setNutrientAnalysis] = useState<NutrientAnalysis | null>(null);
  const [isAnalyzingNutrients, setIsAnalyzingNutrients] = useState(false);
  
  // Weight tracking states
  const [showAddWeightModal, setShowAddWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [selectedWeightEntry, setSelectedWeightEntry] = useState<any>(null);
  
  // Date selection
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // View mode
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const [newFood, setNewFood] = useState<Partial<FoodLogEntry>>({
    date: selectedDate,
    mealType: 'breakfast',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  
  const [todayEntries, setTodayEntries] = useState<FoodLogEntry[]>([]);
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
    // Initialize weight data from profile if needed
    initializeWeightFromProfile();
    
    // Always recalculate macro targets when component loads to ensure they're up-to-date with any program changes
    if (isProfileComplete) {
      calculateMacroTargets();
      loadSelectedDateEntries();
    }
  }, [isProfileComplete, selectedDate]);
  
  // Recalculate macro targets when they change to ensure UI updates
  useEffect(() => {
    if (isProfileComplete) {
      loadSelectedDateEntries();
    }
  }, [macroTargets]);
  
  const loadSelectedDateEntries = () => {
    const entries = getFoodLogEntriesByDate(selectedDate);
    setTodayEntries(entries);
    
    const progress = getMacroProgressForDate(selectedDate);
    setMacroProgress(progress);
  };
  
  // Get weight data for the chart (last 30 days)
  const weightData = getWeightHistory(30);
  
  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', icon: <Coffee size={20} color={colors.text} /> },
    { id: 'lunch', label: 'Lunch', icon: <Utensils size={20} color={colors.text} /> },
    { id: 'dinner', label: 'Dinner', icon: <Pizza size={20} color={colors.text} /> },
    { id: 'snack', label: 'Snack', icon: <Apple size={20} color={colors.text} /> },
  ];
  
  // Helper function to create a simple bar chart
  const renderBarChart = (
    title: string, 
    data: number[], 
    maxValue: number, 
    color: string,
    icon: React.ReactNode,
    dates: string[]
  ) => (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        {icon}
      </View>
      
      <View style={styles.chartContainer}>
        {data.map((value, index) => (
          <View key={index} style={styles.barContainer}>
            <Text style={styles.barValue}>{value}</Text>
            <View 
              style={[
                styles.bar, 
                { 
                  height: `${(value / maxValue) * 100}%`,
                  backgroundColor: color
                }
              ]} 
            />
            <Text style={styles.barLabel}>
              {new Date(dates[index]).toLocaleDateString(undefined, { weekday: 'short' })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
  
  // Helper function to create weight chart with clickable points
  const renderWeightChart = () => {
    if (weightData.length === 0) {
      return (
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weight Progress</Text>
            <TouchableOpacity 
              style={styles.addWeightButton}
              onPress={() => setShowAddWeightModal(true)}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.noWeightDataContainer}>
            <Scale size={48} color={colors.textSecondary} />
            <Text style={styles.noWeightDataText}>No weight data yet</Text>
            <Text style={styles.noWeightDataSubtext}>
              Start tracking your weight to see progress over time
            </Text>
            <TouchableOpacity 
              style={styles.addFirstWeightButton}
              onPress={() => setShowAddWeightModal(true)}
            >
              <Plus size={16} color={colors.text} />
              <Text style={styles.addFirstWeightButtonText}>Add Weight</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    const weights = weightData.map(entry => entry.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight || 1; // Avoid division by zero
    
    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Weight Progress</Text>
          <TouchableOpacity 
            style={styles.addWeightButton}
            onPress={() => setShowAddWeightModal(true)}
          >
            <Plus size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weightChartContainer}>
          <View style={styles.weightChartYAxis}>
            <Text style={styles.weightAxisLabel}>{Math.round(maxWeight)}kg</Text>
            <Text style={styles.weightAxisLabel}>{Math.round((maxWeight + minWeight) / 2)}kg</Text>
            <Text style={styles.weightAxisLabel}>{Math.round(minWeight)}kg</Text>
          </View>
          
          <View style={styles.weightChartArea}>
            {weightData.map((entry, index) => {
              const heightPercentage = weightRange > 0 
                ? ((entry.weight - minWeight) / weightRange) * 100 
                : 50;
              
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.weightPoint,
                    { bottom: `${heightPercentage}%` }
                  ]}
                  onPress={() => {
                    setSelectedWeightEntry(entry);
                    setNewWeight(entry.weight.toString());
                    setShowAddWeightModal(true);
                  }}
                >
                  <View style={styles.weightPointDot} />
                  <Text style={styles.weightPointLabel}>
                    {entry.weight.toFixed(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        <View style={styles.weightChartXAxis}>
          {weightData.length > 0 && (
            <>
              <Text style={styles.weightDateLabel}>
                {new Date(weightData[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.weightDateLabel}>
                {new Date(weightData[weightData.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </>
          )}
        </View>
        
        {weightData.length >= 2 && (
          <View style={styles.weightStatsContainer}>
            <View style={styles.weightStat}>
              <Text style={styles.weightStatLabel}>Change</Text>
              <Text style={[
                styles.weightStatValue,
                {
                  color: weightData[weightData.length - 1].weight > weightData[0].weight 
                    ? colors.warning 
                    : colors.primary
                }
              ]}>
                {(weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)}kg
              </Text>
            </View>
            
            <View style={styles.weightStat}>
              <Text style={styles.weightStatLabel}>Current</Text>
              <Text style={styles.weightStatValue}>
                {weightData[weightData.length - 1].weight.toFixed(1)}kg
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };
  
  // Helper function to render program progression card
  const renderProgramProgressionCard = () => {
    if (activePrograms.length === 0) {
      return (
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Program Progress</Text>
            <Target size={20} color={colors.textSecondary} />
          </View>
          
          <View style={styles.noProgramDataContainer}>
            <Activity size={48} color={colors.textSecondary} />
            <Text style={styles.noProgramDataText}>No active programs</Text>
            <Text style={styles.noProgramDataSubtext}>
              Create a training program to track your progress
            </Text>
            <TouchableOpacity 
              style={styles.addFirstProgramButton}
              onPress={() => router.push('/(tabs)/programs')}
            >
              <Plus size={16} color={colors.text} />
              <Text style={styles.addFirstProgramButtonText}>Create Program</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Program Progress</Text>
          <TouchableOpacity 
            style={styles.viewAllProgramsButton}
            onPress={() => router.push('/(tabs)/programs')}
          >
            <Target size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.programsContainer}>
          {activePrograms.slice(0, 2).map((program) => {
            const progress = getProgramProgress(program.id);
            
            return (
              <TouchableOpacity
                key={program.id}
                style={styles.programProgressItem}
                onPress={() => router.push(`/program-detail?id=${program.id}`)}
              >
                <View style={styles.programProgressHeader}>
                  <Text style={styles.programProgressName}>{program.name}</Text>
                  <Text style={styles.programProgressPercentage}>
                    {Math.round(progress.progressPercentage)}%
                  </Text>
                </View>
                
                <View style={styles.programProgressBar}>
                  <View 
                    style={[
                      styles.programProgressFill,
                      { width: `${progress.progressPercentage}%` }
                    ]} 
                  />
                </View>
                
                <View style={styles.programProgressStats}>
                  <View style={styles.programProgressStat}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={styles.programProgressStatText}>
                      Week {progress.currentWeek} of {progress.totalWeeks}
                    </Text>
                  </View>
                  
                  <Text style={styles.programProgressType}>
                    {program.type.charAt(0).toUpperCase() + program.type.slice(1)}
                  </Text>
                </View>
                
                {progress.daysUntilGoal && (
                  <Text style={styles.programProgressGoal}>
                    {progress.daysUntilGoal} days until goal
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {activePrograms.length > 2 && (
          <TouchableOpacity 
            style={styles.viewMoreProgramsButton}
            onPress={() => router.push('/(tabs)/programs')}
          >
            <Text style={styles.viewMoreProgramsText}>
              View {activePrograms.length - 2} more programs
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
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
    setNewFood({\n      date: selectedDate,\n      mealType: 'breakfast',\n      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),\n    });\n    \n    // Reload entries\n    loadSelectedDateEntries();\n  };\n  \n  const handleDeleteEntry = (id: string) => {\n    Alert.alert(\n      \"Delete Food Entry\",\n      \"Are you sure you want to delete this food entry?\",\n      [\n        { text: \"Cancel\", style: \"cancel\" },\n        { \n          text: \"Delete\", \n          style: \"destructive\",\n          onPress: () => {\n            removeFoodLogEntry(id);\n            loadSelectedDateEntries();\n          }\n        }\n      ]\n    );\n  };\n  \n  const handleGenerateMealSuggestion = async () => {\n    if (!aiPrompt.trim()) {\n      Alert.alert(\"Missing Information\", \"Please enter what kind of meal you'd like suggestions for\");\n      return;\n    }\n    \n    setIsGeneratingMeal(true);\n    \n    try {\n      const suggestion = await generateMealSuggestion(aiPrompt);\n      setAiResponse(suggestion);\n    } catch (error) {\n      console.error('Error generating meal suggestion:', error);\n      setAiResponse(\"Sorry, I couldn't generate a meal suggestion at the moment. Please try again later.\");\n    } finally {\n      setIsGeneratingMeal(false);\n    }\n  };\n  \n  // Process text meal description\n  const handleProcessTextMeal = async () => {\n    if (!mealDescription.trim()) {\n      Alert.alert(\"Missing Information\", \"Please enter what you ate\");\n      return;\n    }\n    \n    setIsProcessingText(true);\n    \n    try {\n      const result = await processTextMeal(mealDescription);\n      \n      if (result) {\n        setTextProcessResult(result);\n        \n        // Pre-fill the food form with the AI result\n        setNewFood({\n          ...newFood,\n          name: result.name,\n          calories: result.calories,\n          protein: result.protein,\n          carbs: result.carbs,\n          fat: result.fat,\n        });\n      } else {\n        Alert.alert('Processing Error', 'Could not process the meal description. Please try again or enter the information manually.');\n      }\n    } catch (error) {\n      console.error('Error processing text meal:', error);\n      Alert.alert('Error', 'Failed to process meal description. Please try again or enter the information manually.');\n    } finally {\n      setIsProcessingText(false);\n    }\n  };\n  \n  const addFoodFromText = () => {\n    if (!textProcessResult) return;\n    \n    const entry: Omit<FoodLogEntry, 'id' | 'createdAt'> = {\n      date: selectedDate,\n      name: textProcessResult.name,\n      calories: textProcessResult.calories,\n      protein: textProcessResult.protein,\n      carbs: textProcessResult.carbs,\n      fat: textProcessResult.fat,\n      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),\n      mealType: newFood.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',\n    };\n    \n    addFoodLogEntry(entry);\n    setTextModalVisible(false);\n    setTextProcessResult(null);\n    setMealDescription('');\n    \n    // Reset form\n    setNewFood({\n      date: selectedDate,\n      mealType: 'breakfast',\n      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),\n    });\n    \n    // Reload entries\n    loadSelectedDateEntries();\n  };\n  \n  // Nutrient analysis function\n  const handleAnalyzeNutrients = async () => {\n    setIsAnalyzingNutrients(true);\n    \n    try {\n      const analysis = await analyzeNutrientDeficiencies(selectedDate);\n      setNutrientAnalysis(analysis);\n      setNutrientAnalysisVisible(true);\n    } catch (error) {\n      console.error('Error analyzing nutrients:', error);\n      Alert.alert('Error', 'Failed to analyze nutrients. Please try again later.');\n    } finally {\n      setIsAnalyzingNutrients(false);\n    }\n  };\n  \n  const handleSaveWeight = () => {\n    const weight = parseFloat(newWeight);\n    \n    if (isNaN(weight) || weight <= 0 || weight > 500) {\n      Alert.alert("Invalid Weight", "Please enter a valid weight between 1 and 500 kg");\n      return;\n    }\n    \n    if (selectedWeightEntry) {\n      // Update existing entry\n      updateWeightEntry(selectedWeightEntry.id, weight);\n    } else {\n      // Add new entry\n      addWeightEntry(weight);\n    }\n    \n    setShowAddWeightModal(false);\n    setNewWeight('');\n    setSelectedWeightEntry(null);\n  };\n  \n  const navigateToProfile = () => {\n    router.push('/profile');\n  };\n  \n  // Calculate progress percentages\n  const caloriePercentage = Math.min(100, (macroProgress.calories.consumed / macroProgress.calories.target) * 100 || 0);\n  const proteinPercentage = Math.min(100, (macroProgress.protein.consumed / macroProgress.protein.target) * 100 || 0);\n  const carbsPercentage = Math.min(100, (macroProgress.carbs.consumed / macroProgress.carbs.target) * 100 || 0);\n  const fatPercentage = Math.min(100, (macroProgress.fat.consumed / macroProgress.fat.target) * 100 || 0);\n  \n  // Get weekly/monthly data for trends\n  const getWeeklyNutritionData = () => {\n    const weekData = [];\n    const today = new Date();\n    \n    for (let i = 6; i >= 0; i--) {\n      const date = new Date(today);\n      date.setDate(date.getDate() - i);\n      const dateStr = date.toISOString().split('T')[0];\n      \n      const entries = getFoodLogEntriesByDate(dateStr);\n      const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);\n      const totalProtein = entries.reduce((sum, entry) => sum + entry.protein, 0);\n      \n      weekData.push({\n        date: dateStr,\n        day: date.toLocaleDateString(undefined, { weekday: 'short' }),\n        calories: totalCalories,\n        protein: totalProtein,\n        entries: entries.length\n      });\n    }\n    \n    return weekData;\n  };\n  \n  const weeklyData = getWeeklyNutritionData();"
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Nutrition Tracker</Text>
          {isProfileComplete && (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.aiButton}
                onPress={() => setAiModalVisible(true)}
              >
                <ChefHat size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.describeMealButton}
                onPress={() => setTextModalVisible(true)}
              >
                <Text style={styles.describeMealText}>Describe meal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
              >
                <Plus size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => {
              const yesterday = new Date();\n              yesterday.setDate(yesterday.getDate() - 1);\n              setSelectedDate(yesterday.toISOString().split('T')[0]);\n            }}\n          >\n            <Text style={styles.dateButtonText}>Yesterday</Text>\n          </TouchableOpacity>\n          \n          <TouchableOpacity \n            style={[styles.dateButton, selectedDate === new Date().toISOString().split('T')[0] && styles.selectedDateButton]}\n            onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}\n          >\n            <Text style={[styles.dateButtonText, selectedDate === new Date().toISOString().split('T')[0] && styles.selectedDateButtonText]}>Today</Text>\n          </TouchableOpacity>\n          \n          <TouchableOpacity \n            style={styles.dateButton}\n            onPress={() => setShowDatePicker(true)}\n          >\n            <Calendar size={16} color={colors.text} />\n            <Text style={styles.dateButtonText}>Pick Date</Text>\n          </TouchableOpacity>\n        </View>\n        \n        {!isProfileComplete ? (\n          <View style={styles.incompleteProfileContainer}>\n            {Platform.OS === 'web' ? (\n              <View style={styles.blurOverlay}>\n                <View style={styles.macroSummaryContainer}>\n                  <View style={[styles.calorieContainer, styles.blurred]}>\n                    <View style={styles.calorieHeader}>\n                      <Flame size={20} color={colors.primary} />\n                      <Text style={styles.calorieLabel}>Calories</Text>\n                    </View>\n                    <Text style={styles.calorieValue}>\n                      0 / 0\n                    </Text>\n                    <View style={styles.progressBar}>\n                      <View style={[styles.progressFill, { width: '0%' }]} />\n                    </View>\n                  </View>\n                  \n                  <View style={styles.macroGrid}>\n                    <View style={[styles.macroItem, styles.blurred]}>\n                      <View style={styles.macroHeader}>\n                        <Egg size={16} color={colors.primary} />\n                        <Text style={styles.macroLabel}>Protein</Text>\n                      </View>\n                      <Text style={styles.macroValue}>\n                        0g / 0g\n                      </Text>\n                      <View style={styles.progressBar}>\n                        <View style={[styles.progressFill, { width: '0%' }]} />\n                      </View>\n                    </View>\n                    \n                    <View style={[styles.macroItem, styles.blurred]}>\n                      <View style={styles.macroHeader}>\n                        <Cookie size={16} color={colors.primary} />\n                        <Text style={styles.macroLabel}>Carbs</Text>\n                      </View>\n                      <Text style={styles.macroValue}>\n                        0g / 0g\n                      </Text>\n                      <View style={styles.progressBar}>\n                        <View style={[styles.progressFill, { width: '0%' }]} />\n                      </View>\n                    </View>\n                    \n                    <View style={[styles.macroItem, styles.blurred]}>\n                      <View style={styles.macroHeader}>\n                        <Droplets size={16} color={colors.primary} />\n                        <Text style={styles.macroLabel}>Fat</Text>\n                      </View>\n                      <Text style={styles.macroValue}>\n                        0g / 0g\n                      </Text>\n                      <View style={styles.progressBar}>\n                        <View style={[styles.progressFill, { width: '0%' }]} />\n                      </View>\n                    </View>\n                  </View>\n                </View>\n              </View>\n            ) : (\n              <BlurView intensity={8} tint=\"dark\" style={styles.blurView}>\n                <View style={styles.macroSummaryContainer}>\n                  <View style={styles.calorieContainer}>\n                    <View style={styles.calorieHeader}>\n                      <Flame size={20} color={colors.primary} />\n                      <Text style={styles.calorieLabel}>Calories</Text>\n                    </View>\n                    <Text style={styles.calorieValue}>\n                      0 / 0\n                    </Text>\n                    <View style={styles.progressBar}>\n                      <View style={[styles.progressFill, { width: '0%' }]} />\n                    </View>\n                  </View>\n                  \n                  <View style={styles.macroGrid}>\n                    <View style={styles.macroItem}>\n                      <View style={styles.macroHeader}>\n                        <Egg size={16} color={colors.primary} />\n                        <Text style={styles.macroLabel}>Protein</Text>\n                      </View>\n                      <Text style={styles.macroValue}>\n                        0g / 0g\n                      </Text>\n                      <View style={styles.progressBar}>\n                        <View style={[styles.progressFill, { width: '0%' }]} />\n                      </View>\n                    </View>\n                    \n                    <View style={styles.macroItem}>\n                      <View style={styles.macroHeader}>\n                        <Cookie size={16} color={colors.primary} />\n                        <Text style={styles.macroLabel}>Carbs</Text>\n                      </View>\n                      <Text style={styles.macroValue}>\n                        0g / 0g\n                      </Text>\n                      <View style={styles.progressBar}>\n                        <View style={[styles.progressFill, { width: '0%' }]} />\n                      </View>\n                    </View>\n                    \n                    <View style={styles.macroItem}>\n                      <View style={styles.macroHeader}>\n                        <Droplets size={16} color={colors.primary} />\n                        <Text style={styles.macroLabel}>Fat</Text>\n                      </View>\n                      <Text style={styles.macroValue}>\n                        0g / 0g\n                      </Text>\n                      <View style={styles.progressBar}>\n                        <View style={[styles.progressFill, { width: '0%' }]} />\n                      </View>\n                    </View>\n                  </View>\n                </View>\n              </BlurView>\n            )}\n            \n            <TouchableOpacity \n              style={styles.completeProfileButton}\n              onPress={navigateToProfile}\n            >\n              <UserCircle size={20} color={colors.text} />\n              <Text style={styles.completeProfileText}>Complete Profile</Text>\n            </TouchableOpacity>\n          </View>\n        ) : (\n          <>\n            {/* Macro Summary */}\n            <View style={styles.macroSummaryContainer}>\n              <View style={styles.calorieContainer}>\n                <View style={styles.calorieHeader}>\n                  <Flame size={20} color={colors.primary} />\n                  <Text style={styles.calorieLabel}>Calories</Text>\n                  <TouchableOpacity \n                    style={styles.analyzeButton}\n                    onPress={handleAnalyzeNutrients}\n                    disabled={isAnalyzingNutrients}\n                  >\n                    {isAnalyzingNutrients ? (\n                      <ActivityIndicator size=\"small\" color={colors.text} />\n                    ) : (\n                      <Zap size={16} color={colors.text} />\n                    )}\n                  </TouchableOpacity>\n                </View>\n                <Text style={styles.calorieValue}>\n                  {macroProgress.calories.consumed} / {macroProgress.calories.target}\n                </Text>\n                <View style={styles.progressBar}>\n                  <View \n                    style={[\n                      styles.progressFill, \n                      { width: `${caloriePercentage}%` },\n                      caloriePercentage > 100 ? styles.progressOverage : null\n                    ]} \n                  />\n                </View>\n              </View>\n              \n              <View style={styles.macroGrid}>\n                <View style={styles.macroItem}>\n                  <View style={styles.macroHeader}>\n                    <Egg size={16} color={colors.primary} />\n                    <Text style={styles.macroLabel}>Protein</Text>\n                  </View>\n                  <Text style={styles.macroValue}>\n                    {macroProgress.protein.consumed}g / {macroProgress.protein.target}g\n                  </Text>\n                  <View style={styles.progressBar}>\n                    <View \n                      style={[\n                        styles.progressFill, \n                        { width: `${proteinPercentage}%` },\n                        proteinPercentage > 100 ? styles.progressOverage : null\n                      ]} \n                    />\n                  </View>\n                </View>\n                \n                <View style={styles.macroItem}>\n                  <View style={styles.macroHeader}>\n                    <Cookie size={16} color={colors.primary} />\n                    <Text style={styles.macroLabel}>Carbs</Text>\n                  </View>\n                  <Text style={styles.macroValue}>\n                    {macroProgress.carbs.consumed}g / {macroProgress.carbs.target}g\n                  </Text>\n                  <View style={styles.progressBar}>\n                    <View \n                      style={[\n                        styles.progressFill, \n                        { width: `${carbsPercentage}%` },\n                        carbsPercentage > 100 ? styles.progressOverage : null\n                      ]} \n                    />\n                  </View>\n                </View>\n                \n                <View style={styles.macroItem}>\n                  <View style={styles.macroHeader}>\n                    <Droplets size={16} color={colors.primary} />\n                    <Text style={styles.macroLabel}>Fat</Text>\n                  </View>\n                  <Text style={styles.macroValue}>\n                    {macroProgress.fat.consumed}g / {macroProgress.fat.target}g\n                  </Text>\n                  <View style={styles.progressBar}>\n                    <View \n                      style={[\n                        styles.progressFill, \n                        { width: `${fatPercentage}%` },\n                        fatPercentage > 100 ? styles.progressOverage : null\n                      ]} \n                    />\n                  </View>\n                </View>\n              </View>\n            </View>\n            \n            {/* Weekly Trends Chart */}\n            <View style={styles.chartCard}>\n              <View style={styles.chartHeader}>\n                <Text style={styles.chartTitle}>Weekly Nutrition Trends</Text>\n                <BarChart3 size={20} color={colors.textSecondary} />\n              </View>\n              \n              <View style={styles.chartContainer}>\n                {weeklyData.map((day, index) => (\n                  <View key={index} style={styles.barContainer}>\n                    <Text style={styles.barValue}>{Math.round(day.calories / 100)}</Text>\n                    <View \n                      style={[\n                        styles.bar, \n                        { \n                          height: `${Math.min(100, (day.calories / 2500) * 100)}%`,\n                          backgroundColor: day.date === selectedDate ? colors.primary : colors.textSecondary\n                        }\n                      ]} \n                    />\n                    <Text style={styles.barLabel}>{day.day}</Text>\n                  </View>\n                ))}\n              </View>\n              \n              <View style={styles.chartLegend}>\n                <Text style={styles.chartLegendText}>Calories (hundreds)</Text>\n              </View>\n            </View>\n            \n            {/* Weight Chart - Always show */}\n            {renderWeightChart()}\n            \n            {/* Food Log */}\n            {todayEntries.length === 0 ? (\n              <View style={styles.emptyState}>\n                <Text style={styles.emptyText}>No foods logged for {selectedDate === new Date().toISOString().split('T')[0] ? 'today' : 'this date'}</Text>\n                <Text style={styles.emptySubtext}>Tap + to add your first food</Text>\n              </View>\n            ) : (\n              <View style={styles.foodLogContainer}>\n                <View style={styles.foodLogHeader}>\n                  <Text style={styles.foodLogTitle}>Food Log</Text>\n                  <View style={styles.foodLogStats}>\n                    <View style={styles.foodLogStat}>\n                      <Utensils size={16} color={colors.textSecondary} />\n                      <Text style={styles.foodLogStatText}>{todayEntries.length} items</Text>\n                    </View>\n                  </View>\n                </View>\n                \n                <ScrollView style={styles.foodsList}>\n                  {todayEntries.map((entry) => (\n                    <View key={entry.id} style={styles.foodItem}>\n                      <View style={styles.foodHeader}>\n                        <View style={styles.foodTypeContainer}>\n                          {mealTypes.find(type => type.id === entry.mealType)?.icon}\n                          <Text style={styles.foodType}>\n                            {mealTypes.find(type => type.id === entry.mealType)?.label}\n                          </Text>\n                        </View>\n                        <Text style={styles.foodTime}>\n                          <Clock size={14} color={colors.textSecondary} /> {entry.time}\n                        </Text>\n                      </View>\n                      \n                      <Text style={styles.foodName}>{entry.name}</Text>\n                      \n                      <View style={styles.foodNutrition}>\n                        <Text style={styles.foodCalories}>{entry.calories} cal</Text>\n                        <Text style={styles.foodMacros}>\n                          P: {entry.protein}g • C: {entry.carbs}g • F: {entry.fat}g\n                        </Text>\n                      </View>\n                      \n                      <TouchableOpacity \n                        style={styles.deleteButton}\n                        onPress={() => handleDeleteEntry(entry.id)}\n                      >\n                        <X size={16} color={colors.danger} />\n                      </TouchableOpacity>\n                    </View>\n                  ))}\n                </ScrollView>\n              </View>\n            )}\n          </>\n        )}\n      </ScrollView>
      
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
      
      {/* Add/Edit Weight Modal */}
      <Modal
        visible={showAddWeightModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddWeightModal(false);
          setNewWeight('');
          setSelectedWeightEntry(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedWeightEntry ? 'Update Weight' : 'Add Weight'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowAddWeightModal(false);
                  setNewWeight('');
                  setSelectedWeightEntry(null);
                }}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <View style={styles.weightInputContainer}>
                <Scale size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.weightInput}
                  placeholder={userProfile.weight?.toString() || "70.0"}
                  placeholderTextColor={colors.textSecondary}
                  value={newWeight}
                  onChangeText={setNewWeight}
                  keyboardType="decimal-pad"
                  autoFocus={true}
                />
                <Text style={styles.weightUnit}>kg</Text>
              </View>
              
              {selectedWeightEntry && (
                <Text style={styles.weightDateInfo}>
                  Date: {new Date(selectedWeightEntry.date).toLocaleDateString()}
                </Text>
              )}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAddWeightModal(false);
                  setNewWeight('');
                  setSelectedWeightEntry(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveWeight}
              >
                <Text style={styles.modalSaveButtonText}>
                  {selectedWeightEntry ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: bottomPadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  describeMealButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  describeMealText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectedDateButton: {
    backgroundColor: colors.primary,
  },
  dateButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  selectedDateButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  macroSummaryContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  calorieContainer: {
    marginBottom: 16,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calorieLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  analyzeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
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
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#3A3A3A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressOverage: {
    backgroundColor: colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  foodLogContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  foodLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  foodLogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  foodLogStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodLogStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodLogStatText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  foodsList: {
    maxHeight: 300,
  },
  foodItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLegend: {
    alignItems: 'center',
    marginTop: 8,
  },
  chartLegendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // New styles for incomplete profile overlay
  incompleteProfileContainer: {
    position: 'relative',
  },
  blurView: {
    borderRadius: 12,
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
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  barValue: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  barLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 16,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Weight chart specific styles
  addWeightButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noWeightDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noWeightDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noWeightDataSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addFirstWeightButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  weightChartContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 16,
  },
  weightChartYAxis: {
    width: 50,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  weightAxisLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  weightChartArea: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 16,
  },
  weightPoint: {
    position: 'absolute',
    alignItems: 'center',
    width: 40,
  },
  weightPointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginBottom: 4,
  },
  weightPointLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  weightChartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 66,
    marginBottom: 16,
  },
  weightDateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  weightStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  weightStat: {
    alignItems: 'center',
  },
  weightStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  weightStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  
  // Program progression styles
  viewAllProgramsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noProgramDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProgramDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noProgramDataSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addFirstProgramButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  programsContainer: {
    gap: 16,
  },
  programProgressItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  programProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  programProgressName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  programProgressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  programProgressBar: {
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    marginBottom: 12,
  },
  programProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  programProgressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  programProgressStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  programProgressStatText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  programProgressType: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  programProgressGoal: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  viewMoreProgramsButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewMoreProgramsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  weightInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    marginLeft: 12,
    marginRight: 8,
  },
  weightUnit: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  weightDateInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal styles for nutrition tracker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 16,
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
  // Text meal logging styles
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
  // Nutrient analysis styles
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
});