import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
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
  UserCircle
} from 'lucide-react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { FoodLogEntry, NutrientAnalysis } from '@/types/whoop';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

export default function NutritionTracker() {
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
  
  const [newFood, setNewFood] = useState<Partial<FoodLogEntry>>({
    date: new Date().toISOString().split('T')[0],
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
  
  const today = new Date().toISOString().split('T')[0];
  
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
    // Calculate macro targets if not already calculated and profile is complete
    if (!macroTargets && isProfileComplete) {
      calculateMacroTargets();
    }
    
    // Load today's food entries if profile is complete
    if (isProfileComplete) {
      loadTodayEntries();
    }
  }, [isProfileComplete]);
  
  const loadTodayEntries = () => {
    const entries = getFoodLogEntriesByDate(today);
    setTodayEntries(entries);
    
    const progress = getMacroProgressForDate(today);
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
      date: today,
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
      date: today,
      mealType: 'breakfast',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    
    // Reload entries
    loadTodayEntries();
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
            loadTodayEntries();
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
  
  const navigateToProfile = () => {
    router.push('/profile');
  };
  
  // Process text meal description
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
        
        // Pre-fill the food form with the AI result
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
      date: today,
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
    
    // Reset form
    setNewFood({
      date: today,
      mealType: 'breakfast',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    
    // Reload entries
    loadTodayEntries();
  };
  
  // Nutrient analysis function
  const handleAnalyzeNutrients = async () => {
    setIsAnalyzingNutrients(true);
    
    try {
      const analysis = await analyzeNutrientDeficiencies(today);
      setNutrientAnalysis(analysis);
      setNutrientAnalysisVisible(true);
    } catch (error) {
      console.error('Error analyzing nutrients:', error);
      Alert.alert('Error', 'Failed to analyze nutrients. Please try again later.');
    } finally {
      setIsAnalyzingNutrients(false);
    }
  };
  
  // Calculate progress percentages
  const caloriePercentage = Math.min(100, (macroProgress.calories.consumed / macroProgress.calories.target) * 100 || 0);
  const proteinPercentage = Math.min(100, (macroProgress.protein.consumed / macroProgress.protein.target) * 100 || 0);
  const carbsPercentage = Math.min(100, (macroProgress.carbs.consumed / macroProgress.carbs.target) * 100 || 0);
  const fatPercentage = Math.min(100, (macroProgress.fat.consumed / macroProgress.fat.target) * 100 || 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition Tracker</Text>
        {isProfileComplete && (
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={() => setAiModalVisible(true)}
            >
              <Utensils size={18} color={colors.text} />
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
                  <Text style={styles.calorieValue}>
                    0 / 0
                  </Text>
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
                    <Text style={styles.macroValue}>
                      0g / 0g
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  </View>
                  
                  <View style={[styles.macroItem, styles.blurred]}>
                    <View style={styles.macroHeader}>
                      <Cookie size={16} color={colors.primary} />
                      <Text style={styles.macroLabel}>Carbs</Text>
                    </View>
                    <Text style={styles.macroValue}>
                      0g / 0g
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  </View>
                  
                  <View style={[styles.macroItem, styles.blurred]}>
                    <View style={styles.macroHeader}>
                      <Droplets size={16} color={colors.primary} />
                      <Text style={styles.macroLabel}>Fat</Text>
                    </View>
                    <Text style={styles.macroValue}>
                      0g / 0g
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No foods logged today</Text>
                <Text style={styles.emptySubtext}>Tap + to add your first food</Text>
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
                  <Text style={styles.calorieValue}>
                    0 / 0
                  </Text>
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
                    <Text style={styles.macroValue}>
                      0g / 0g
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  </View>
                  
                  <View style={styles.macroItem}>
                    <View style={styles.macroHeader}>
                      <Cookie size={16} color={colors.primary} />
                      <Text style={styles.macroLabel}>Carbs</Text>
                    </View>
                    <Text style={styles.macroValue}>
                      0g / 0g
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  </View>
                  
                  <View style={styles.macroItem}>
                    <View style={styles.macroHeader}>
                      <Droplets size={16} color={colors.primary} />
                      <Text style={styles.macroLabel}>Fat</Text>
                    </View>
                    <Text style={styles.macroValue}>
                      0g / 0g
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No foods logged today</Text>
                <Text style={styles.emptySubtext}>Tap + to add your first food</Text>
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
          
          {todayEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No foods logged today</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first food</Text>
            </View>
          ) : (
            <ScrollView style={styles.foodsList}>
              {todayEntries.map((entry) => (
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
            </ScrollView>
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
                        date: today,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
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
  macroSummaryContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  calorieContainer: {
    marginBottom: 16,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  calorieLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
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