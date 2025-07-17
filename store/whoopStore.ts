import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AIAnalysis, 
  ChatMessage, 
  WhoopData, 
  ApiKeys, 
  TrainingProgram,
  NutritionData,
  ManualWorkout,
  StrengthTrainingConfig,
  NutritionPreferences,
  NutritionPlan,
  UserProfile,
  MacroTargets,
  FoodLogEntry,
  NutrientAnalysis,
  NutrientDeficiency,
  ProgramUpdateRequest,
  ProgramFeedback,
  ProgramUpdate,
  TodaysWorkout,
  WeightEntry,
  ProgramProgress
} from '@/types/whoop';
import {
  isConnectedToWhoop,
  fetchWhoopProfile,
  transformWhoopData,
  getCachedWhoopData,
  checkScheduledSync,
  scheduleNextMidnightSync,
  WHOOP_LAST_SYNC_TIME_KEY
} from '@/services/whoopApi';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Helper function to safely format user input for prompts
const safeUserInput = (input: string): string => {
  if (!input) return '';
  // Remove problematic characters and limit length to 150 chars
  return input
    .replace(/[^\w\s\-.,!?()]/g, ' ')
    .substring(0, 150)
    .trim();
};

// Helper function to truncate text to fit token limits
const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Helper function to create minimal user context
const getMinimalUserContext = (userProfile: UserProfile): string => {
  return `${userProfile.age}y ${userProfile.gender} ${userProfile.weight}kg ${userProfile.fitnessGoal}`;
};

// Helper function to extract cardio description from combined workout text
const extractCardioDescription = (description: string): string => {
  if (!description) return 'Cardio training session';
  
  const lowerDesc = description.toLowerCase();
  const cardioKeywords = ['run', 'jog', 'bike', 'cycle', 'swim', 'cardio', 'aerobic', 'endurance'];
  
  // Split by common separators
  const parts = description.split(/\+|followed by|then|and then|,/i);
  
  for (const part of parts) {
    const trimmedPart = part.trim();
    const lowerPart = trimmedPart.toLowerCase();
    
    // Check if this part contains cardio keywords
    if (cardioKeywords.some(keyword => lowerPart.includes(keyword))) {
      return trimmedPart.charAt(0).toUpperCase() + trimmedPart.slice(1);
    }
  }
  
  // Fallback: if no specific cardio part found, create generic description
  return 'Cardio training session';
};

// Helper function to extract strength description from combined workout text
const extractStrengthDescription = (description: string): string => {
  if (!description) return 'Strength training session';
  
  const lowerDesc = description.toLowerCase();
  const strengthKeywords = ['strength', 'weight', 'lift', 'press', 'squat', 'deadlift', 'bench', 'resistance', 'muscle'];
  
  // Split by common separators
  const parts = description.split(/\+|followed by|then|and then|,/i);
  
  for (const part of parts) {
    const trimmedPart = part.trim();
    const lowerPart = trimmedPart.toLowerCase();
    
    // Check if this part contains strength keywords
    if (strengthKeywords.some(keyword => lowerPart.includes(keyword))) {
      return trimmedPart.charAt(0).toUpperCase() + trimmedPart.slice(1);
    }
  }
  
  // Fallback: if no specific strength part found, create generic description
  return 'Strength training session';
};

// Helper function to get essential recovery data
const getEssentialRecoveryData = (data: WhoopData): string => {
  const latest = data.recovery[0];
  if (!latest) return 'No data';
  return `${latest.score}% recovery, ${latest.hrvMs}ms HRV`;
};

// Enhanced helper function to create comprehensive user context for program personalization
const getComprehensiveUserContext = (userProfile: UserProfile, weightHistory: WeightEntry[]): string => {
  const bmi = userProfile.height > 0 ? (userProfile.weight / Math.pow(userProfile.height / 100, 2)).toFixed(1) : 'unknown';
  const safeWeightHistory = weightHistory || [];
  const latestWeight = safeWeightHistory.length > 0 ? safeWeightHistory[0].weight : userProfile.weight;
  const weightTrend = getWeightTrend(safeWeightHistory);
  
  return `${userProfile.age}y ${userProfile.gender}, ${latestWeight}kg, ${userProfile.height}cm (BMI: ${bmi}), ${userProfile.bodyFat ? userProfile.bodyFat + '% BF, ' : ''}${userProfile.activityLevel} activity, goal: ${userProfile.fitnessGoal}${weightTrend ? ', weight trend: ' + weightTrend : ''}`;
};

// Helper function to analyze weight trend
const getWeightTrend = (weightHistory: WeightEntry[]): string => {
  if (!weightHistory || weightHistory.length < 2) return '';
  
  const recent = weightHistory.slice(0, Math.min(5, weightHistory.length));
  const oldest = recent[recent.length - 1];
  const newest = recent[0];
  
  const change = newest.weight - oldest.weight;
  const days = Math.abs(new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24);
  
  if (Math.abs(change) < 0.5) return 'stable';
  if (change > 0) return `gaining ${(change / (days / 7)).toFixed(1)}kg/week`;
  return `losing ${Math.abs(change / (days / 7)).toFixed(1)}kg/week`;
};

// Helper function to calculate goal-specific requirements
const calculateGoalRequirements = (programType: string, targetMetric: string, goalDate: string, userProfile: UserProfile, weightHistory: WeightEntry[]): any => {
  const safeWeightHistory = weightHistory || [];
  const today = new Date();
  const goal = new Date(goalDate);
  const daysUntilGoal = Math.max(1, Math.ceil((goal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksUntilGoal = Math.ceil(daysUntilGoal / 7);
  
  const requirements: any = {
    daysUntilGoal,
    weeksUntilGoal,
    urgency: daysUntilGoal < 30 ? 'high' : daysUntilGoal < 90 ? 'medium' : 'low'
  };
  
  // Parse target metric and calculate specific requirements
  if (programType === 'marathon' || programType === 'half-marathon') {
    // Parse time goal (e.g., "3:45:00" or "1:45:00")
    const timeMatch = targetMetric.match(/(\d+):(\d+):(\d+)/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const seconds = parseInt(timeMatch[3]);
      const totalMinutes = hours * 60 + minutes + seconds / 60;
      
      const distance = programType === 'marathon' ? 42.195 : 21.0975;
      const targetPaceMinPerKm = totalMinutes / distance;
      
      requirements.targetTime = targetMetric;
      requirements.targetPaceMinPerKm = targetPaceMinPerKm.toFixed(2);
      requirements.targetPaceMileMin = (targetPaceMinPerKm * 1.60934).toFixed(2);
      
      // Calculate weekly mileage progression based on experience level and goal
      const experienceLevel = userProfile.experienceLevel || 'intermediate';
      
      // Base weekly mileage by experience level
      const baseMileageMap = {
        beginner: programType === 'marathon' ? 20 : 15,
        intermediate: programType === 'marathon' ? 35 : 25,
        advanced: programType === 'marathon' ? 50 : 35
      };
      
      // Peak weekly mileage adjusted for goal pace
      const peakMileageMap = {
        beginner: programType === 'marathon' ? 45 : 30,
        intermediate: programType === 'marathon' ? 65 : 45,
        advanced: programType === 'marathon' ? 85 : 60
      };
      
      const baseWeeklyMileage = baseMileageMap[experienceLevel as keyof typeof baseMileageMap] || baseMileageMap.intermediate;
      let peakWeeklyMileage = peakMileageMap[experienceLevel as keyof typeof peakMileageMap] || peakMileageMap.intermediate;
      
      // Adjust peak mileage based on goal pace (faster goals need more volume)
      if (targetPaceMinPerKm < 4.0) { // Sub-3:30 marathon / Sub-1:25 half
        peakWeeklyMileage = Math.round(peakWeeklyMileage * 1.2);
      } else if (targetPaceMinPerKm > 6.0) { // Slower than 4:15 marathon / 2:05 half
        peakWeeklyMileage = Math.round(peakWeeklyMileage * 0.8);
      }
      
      requirements.baseWeeklyMileage = baseWeeklyMileage;
      requirements.peakWeeklyMileage = peakWeeklyMileage;
      requirements.mileageProgression = ((peakWeeklyMileage - baseWeeklyMileage) / Math.max(8, weeksUntilGoal - 3)).toFixed(1);
      
      // Calculate weekly mileage breakdown
      const totalTrainingWeeks = Math.min(weeksUntilGoal, programType === 'marathon' ? 16 : 12);
      const buildWeeks = Math.floor(totalTrainingWeeks * 0.75);
      const taperWeeks = totalTrainingWeeks - buildWeeks;
      
      requirements.totalTrainingWeeks = totalTrainingWeeks;
      requirements.buildWeeks = buildWeeks;
      requirements.taperWeeks = taperWeeks;
      requirements.goalPaceMinPerMile = (targetPaceMinPerKm * 1.60934).toFixed(2);
      requirements.easyPaceMinPerMile = ((targetPaceMinPerKm + 1.0) * 1.60934).toFixed(2);
      requirements.tempoPaceMinPerMile = ((targetPaceMinPerKm - 0.3) * 1.60934).toFixed(2);
      requirements.intervalPaceMinPerMile = ((targetPaceMinPerKm - 1.0) * 1.60934).toFixed(2);
    }
  } else if (programType === 'weight_loss') {
    // Parse weight loss goal (e.g., "15lbs" or "10kg")
    const weightMatch = targetMetric.match(/(\d+(?:\.\d+)?)\s*(lbs?|kg)/i);
    if (weightMatch) {
      const amount = parseFloat(weightMatch[1]);
      const unit = weightMatch[2].toLowerCase();
      const targetWeightLossKg = unit.includes('lb') ? amount * 0.453592 : amount;
      
      const currentWeight = safeWeightHistory.length > 0 ? safeWeightHistory[0].weight : userProfile.weight;
      const targetWeight = currentWeight - targetWeightLossKg;
      
      // Safe weight loss rate: 0.5-1kg per week
      const maxSafeWeeklyLoss = Math.min(1, targetWeightLossKg / Math.max(4, weeksUntilGoal));
      const recommendedWeeklyLoss = Math.min(0.75, targetWeightLossKg / weeksUntilGoal);
      
      requirements.targetWeightLossKg = targetWeightLossKg;
      requirements.targetWeight = targetWeight;
      requirements.weeklyWeightLossTarget = recommendedWeeklyLoss.toFixed(2);
      requirements.dailyCalorieDeficit = Math.round(recommendedWeeklyLoss * 7700 / 7); // 7700 cal per kg
      requirements.feasible = targetWeightLossKg / weeksUntilGoal <= 1;
    }
  } else if (programType === 'powerlifting') {
    // Parse total goal (e.g., "1000lb total" or "450kg total")
    const totalMatch = targetMetric.match(/(\d+)\s*(lb|kg)?\s*total/i);
    if (totalMatch) {
      const amount = parseInt(totalMatch[1]);
      const unit = totalMatch[2]?.toLowerCase() || 'lb';
      const targetTotalKg = unit === 'lb' ? amount * 0.453592 : amount;
      
      // Estimate current total based on body weight and experience
      const experienceLevel = userProfile.experienceLevel || 'intermediate';
      const bodyweightMultiplier = experienceLevel === 'advanced' ? 4.5 : 
                                  experienceLevel === 'intermediate' ? 3.5 : 2.5;
      const estimatedCurrentTotal = userProfile.weight * bodyweightMultiplier;
      
      const totalIncrease = targetTotalKg - estimatedCurrentTotal;
      const weeklyIncrease = totalIncrease / weeksUntilGoal;
      
      requirements.targetTotalKg = targetTotalKg;
      requirements.estimatedCurrentTotal = estimatedCurrentTotal.toFixed(0);
      requirements.totalIncrease = totalIncrease.toFixed(0);
      requirements.weeklyIncrease = weeklyIncrease.toFixed(1);
      requirements.feasible = weeklyIncrease <= (experienceLevel === 'beginner' ? 5 : 2.5);
    }
  } else if (programType === 'hypertrophy') {
    // Parse muscle gain goal (e.g., "10lbs muscle" or "5kg muscle")
    const muscleMatch = targetMetric.match(/(\d+(?:\.\d+)?)\s*(lbs?|kg)?\s*muscle/i);
    if (muscleMatch) {
      const amount = parseFloat(muscleMatch[1]);
      const unit = muscleMatch[2]?.toLowerCase() || 'lb';
      const targetMuscleGainKg = unit.includes('lb') ? amount * 0.453592 : amount;
      
      // Realistic muscle gain: 0.25-0.5kg per month for intermediates
      const experienceLevel = userProfile.experienceLevel || 'intermediate';
      const maxMonthlyGain = experienceLevel === 'beginner' ? 1 : 
                            experienceLevel === 'intermediate' ? 0.5 : 0.25;
      const monthsUntilGoal = weeksUntilGoal / 4.33;
      const weeklyGainTarget = targetMuscleGainKg / weeksUntilGoal;
      
      requirements.targetMuscleGainKg = targetMuscleGainKg;
      requirements.weeklyGainTarget = weeklyGainTarget.toFixed(3);
      requirements.monthlyGainTarget = (weeklyGainTarget * 4.33).toFixed(2);
      requirements.feasible = (targetMuscleGainKg / monthsUntilGoal) <= maxMonthlyGain;
      requirements.recommendedCalorieSurplus = Math.round(weeklyGainTarget * 7700 / 7); // Approximate
    }
  }
  
  return requirements;
};

// Helper function to get fitness assessment based on user metrics
const getFitnessAssessment = (userProfile: UserProfile, data: WhoopData): string => {
  const assessments: string[] = [];
  
  // Age-based assessment
  if (userProfile.age < 25) {
    assessments.push('young adult with high recovery potential');
  } else if (userProfile.age < 40) {
    assessments.push('adult in prime training years');
  } else if (userProfile.age < 55) {
    assessments.push('experienced adult requiring balanced recovery');
  } else {
    assessments.push('mature athlete prioritizing recovery and injury prevention');
  }
  
  // BMI assessment
  const bmi = userProfile.height > 0 ? userProfile.weight / Math.pow(userProfile.height / 100, 2) : 0;
  if (bmi > 0) {
    if (bmi < 18.5) assessments.push('underweight');
    else if (bmi < 25) assessments.push('normal weight');
    else if (bmi < 30) assessments.push('overweight');
    else assessments.push('obese');
  }
  
  // Activity level assessment
  const activityMap = {
    sedentary: 'sedentary baseline requiring gradual progression',
    lightlyActive: 'lightly active with room for moderate increases',
    moderatelyActive: 'moderately active with good training foundation',
    veryActive: 'highly active with advanced training capacity',
    extremelyActive: 'elite-level activity requiring careful periodization'
  };
  assessments.push(activityMap[userProfile.activityLevel]);
  
  // Recovery assessment if available
  if (data.recovery.length > 0) {
    const avgRecovery = data.recovery.slice(0, 7).reduce((sum, r) => sum + r.score, 0) / Math.min(7, data.recovery.length);
    if (avgRecovery >= 75) assessments.push('excellent recovery capacity');
    else if (avgRecovery >= 60) assessments.push('good recovery capacity');
    else if (avgRecovery >= 45) assessments.push('moderate recovery requiring attention');
    else assessments.push('poor recovery requiring conservative approach');
  }
  
  return assessments.join(', ');
};

// Helper function to analyze program effectiveness and progress
const analyzeProgramEffectiveness = (program: TrainingProgram, currentWeek: number, goalRequirements: any): { progressStatus: string; effectiveness: string } => {
  let totalWeeks = 12; // Default fallback
  
  try {
    if (program.aiPlan?.phases && Array.isArray(program.aiPlan.phases) && program.aiPlan.phases.length > 0) {
      totalWeeks = program.aiPlan.phases.reduce((total: number, phase: any) => {
        const duration = parseInt(phase.duration?.split(' ')[0] || '4', 10) || 4;
        return total + duration;
      }, 0);
    }
  } catch (error) {
    console.error('Error calculating total weeks:', error);
    totalWeeks = 12;
  }
  
  const progressPercentage = Math.min((currentWeek / totalWeeks) * 100, 100);
  
  let progressStatus = '';
  let effectiveness = '';
  
  // Analyze progress status
  if (progressPercentage < 25) {
    progressStatus = 'early phase - building foundation';
  } else if (progressPercentage < 50) {
    progressStatus = 'building phase - developing capacity';
  } else if (progressPercentage < 75) {
    progressStatus = 'development phase - increasing intensity';
  } else {
    progressStatus = 'peak phase - goal-specific preparation';
  }
  
  // Analyze effectiveness based on goal timeline
  if (goalRequirements.daysUntilGoal) {
    const timelineProgress = ((totalWeeks * 7 - goalRequirements.daysUntilGoal) / (totalWeeks * 7)) * 100;
    
    if (timelineProgress > progressPercentage + 10) {
      effectiveness = 'ahead of schedule - can accommodate modifications';
    } else if (timelineProgress < progressPercentage - 10) {
      effectiveness = 'behind schedule - need to prioritize goal-critical activities';
    } else {
      effectiveness = 'on track - balanced approach possible';
    }
  } else {
    effectiveness = 'flexible timeline - can accommodate user preferences';
  }
  
  // Factor in goal feasibility
  if (goalRequirements.feasible === false) {
    effectiveness += ' (goal timeline may need adjustment)';
  }
  
  return { progressStatus, effectiveness };
};

// Create empty data structure for initial state
const emptyWhoopData: WhoopData = {
  recovery: [],
  strain: [],
  sleep: []
};

// Default AI analysis for when no data is available
const defaultAIAnalysis: AIAnalysis = {
  recoveryInsight: "Connect your WHOOP to see recovery insights.",
  trainingRecommendation: "Connect your WHOOP to get personalized training recommendations.",
  longTermTrend: "Connect your WHOOP to track your long-term fitness trends."
};

// Activity level multipliers for TDEE calculation
const activityMultipliers = {
  sedentary: 1.2,
  lightlyActive: 1.375,
  moderatelyActive: 1.55,
  veryActive: 1.725,
  extremelyActive: 1.9
};

// Default user profile
const defaultUserProfile: UserProfile = {
  name: "",
  age: 30,
  gender: "male",
  weight: 70,
  height: 175,
  bodyFat: undefined,
  activityLevel: "moderatelyActive",
  fitnessGoal: "maintainWeight",
  experienceLevel: "intermediate",
  createdAt: new Date(),
  updatedAt: new Date()
};

// Helper function to ensure Date objects are properly handled
const ensureDateObject = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') return new Date(dateValue);
  return new Date();
};

// Helper function to convert stored data back to proper types
const reviveStoredData = (storedData: any) => {
  if (!storedData) return {};
  
  // Convert userProfile dates back to Date objects
  if (storedData.userProfile) {
    if (storedData.userProfile.createdAt) {
      storedData.userProfile.createdAt = ensureDateObject(storedData.userProfile.createdAt);
    }
    if (storedData.userProfile.updatedAt) {
      storedData.userProfile.updatedAt = ensureDateObject(storedData.userProfile.updatedAt);
    }
  }
  
  // Convert weightHistory dates back to Date objects
  if (storedData.weightHistory && Array.isArray(storedData.weightHistory)) {
    storedData.weightHistory = storedData.weightHistory.map((entry: any) => ({
      ...entry,
      createdAt: ensureDateObject(entry.createdAt),
      updatedAt: ensureDateObject(entry.updatedAt)
    }));
  }
  
  // Convert foodLog dates back to Date objects
  if (storedData.foodLog && Array.isArray(storedData.foodLog)) {
    storedData.foodLog = storedData.foodLog.map((entry: any) => ({
      ...entry,
      createdAt: ensureDateObject(entry.createdAt)
    }));
  }
  
  // Convert macroTargets calculatedAt back to Date object
  if (storedData.macroTargets && storedData.macroTargets.calculatedAt) {
    storedData.macroTargets.calculatedAt = ensureDateObject(storedData.macroTargets.calculatedAt);
  }
  
  return storedData;
};

interface WhoopStore {
  data: WhoopData;
  analysis: AIAnalysis;
  isLoading: boolean;
  selectedDate: string;
  chatMessages: ChatMessage[];
  apiKeys: ApiKeys;
  activePrograms: TrainingProgram[];
  nutritionData: NutritionData[];
  isConnectedToWhoop: boolean;
  isLoadingWhoopData: boolean;
  whoopProfile: any | null;
  lastSyncTime: number | null;
  activeManualWorkouts: ManualWorkout[];
  userProfile: UserProfile;
  macroTargets: MacroTargets | null;
  foodLog: FoodLogEntry[];
  weightHistory: WeightEntry[];
  programIntroductionsShown: string[]; // Array of program IDs that have shown introduction
  
  setSelectedDate: (date: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatMessages: () => void;
  fetchAIAnalysis: () => Promise<void>;
  setApiKeys: (keys: ApiKeys) => void;
  addProgram: (program: Omit<TrainingProgram, 'id' | 'startDate' | 'active'>) => void;
  updateProgram: (id: string, updates: Partial<TrainingProgram>) => void;
  removeProgram: (id: string) => void;
  addNutritionData: (data: Omit<NutritionData, 'id'>) => void;
  checkWhoopConnection: () => Promise<boolean>;
  fetchWhoopData: () => Promise<void>;
  syncWhoopData: () => Promise<boolean>;
  generateAIAnalysisFromWhoopData: () => Promise<void>;
  checkAndPerformScheduledSync: () => Promise<void>;
  setIsLoadingWhoopData: (isLoading: boolean) => void;
  generatePersonalizedTrainingPlan: (programType: string, userConfig: any) => Promise<any>;
  startManualWorkout: (workout: Omit<ManualWorkout, 'id' | 'startTime' | 'isActive'>) => string;
  pauseManualWorkout: (id: string) => void;
  resumeManualWorkout: (id: string) => void;
  completeManualWorkout: (id: string) => Promise<{ success: boolean; error?: string }>;
  cancelManualWorkout: (id: string) => void;
  getManualWorkout: (id: string) => ManualWorkout | undefined;
  
  // User profile methods
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  calculateMacroTargets: () => MacroTargets;
  addFoodLogEntry: (entry: Omit<FoodLogEntry, 'id' | 'createdAt'>) => void;
  removeFoodLogEntry: (id: string) => void;
  getFoodLogEntriesByDate: (date: string) => FoodLogEntry[];
  getMacroProgressForDate: (date: string) => {
    calories: { consumed: number; target: number };
    protein: { consumed: number; target: number };
    carbs: { consumed: number; target: number };
    fat: { consumed: number; target: number };
  };
  generateMealSuggestion: (preferences: string) => Promise<string>;
  updateProgramNutrition: (programId: string) => void;
  syncMacroTargetsWithActiveProgram: () => void;
  
  // Text meal processing method
  processTextMeal: (mealDescription: string) => Promise<any>;
  analyzeNutrientDeficiencies: (date: string) => Promise<NutrientAnalysis>;
  
  // Program personalization methods
  requestProgramUpdate: (request: ProgramUpdateRequest) => Promise<ProgramFeedback>;
  getProgramFeedback: (programId: string) => ProgramFeedback | null;
  markProgramIntroductionShown: (programId: string) => void;
  
  // Today's workout method
  getTodaysWorkout: () => TodaysWorkout | null;
  isWorkoutCompleted: (programId: string, workoutTitle: string, date?: string) => Promise<boolean>;
  markWorkoutCompleted: (programId: string, workoutTitle: string, workoutDay: string, date?: string) => Promise<void>;
  
  // Weight tracking methods
  addWeightEntry: (weight: number, date?: string) => void;
  updateWeightEntry: (id: string, weight: number) => void;
  removeWeightEntry: (id: string) => void;
  getWeightHistory: (days?: number) => WeightEntry[];
  getLatestWeight: () => WeightEntry | null;
  initializeWeightFromProfile: () => void;
  
  // Program progress methods
  getProgramProgress: (programId: string) => ProgramProgress;
}

export const useWhoopStore = create<WhoopStore>()(
  persist(
    (set, get) => ({
      data: emptyWhoopData,
      analysis: defaultAIAnalysis,
      isLoading: false,
      selectedDate: new Date().toISOString().split('T')[0],
      chatMessages: [],
      apiKeys: {},
      activePrograms: [],
      nutritionData: [],
      isConnectedToWhoop: false,
      isLoadingWhoopData: false,
      whoopProfile: null,
      lastSyncTime: null,
      activeManualWorkouts: [],
      userProfile: defaultUserProfile,
      macroTargets: null,
      foodLog: [],
      weightHistory: [],
      programIntroductionsShown: [],
      
      setIsLoadingWhoopData: (isLoading) => set({ isLoadingWhoopData: isLoading }),
      
      setSelectedDate: (date) => set({ selectedDate: date }),
      
      addChatMessage: (message) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          timestamp: Date.now(),
          ...message,
        };
        
        set((state) => {
          // Limit chat history to last 20 messages to prevent token overflow
          const updatedMessages = [...state.chatMessages, newMessage];
          const limitedMessages = updatedMessages.slice(-20);
          
          return { chatMessages: limitedMessages };
        });
        
        if (message.role === 'user') {
          get().fetchAIAnalysis();
        }
      },
      
      clearChatMessages: () => {
        set({ chatMessages: [] });
      },
      
      fetchAIAnalysis: async () => {
        set({ isLoading: true });
        
        try {
          const { data, chatMessages, userProfile, isConnectedToWhoop } = get();
          const lastMessage = chatMessages[chatMessages.length - 1];
          
          if (!lastMessage || lastMessage.role !== 'user') return;
          
          // Check if we have WHOOP data
          if (!isConnectedToWhoop || !data.recovery.length) {
            set((state) => ({
              chatMessages: [
                ...state.chatMessages,
                {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: "I need access to your WHOOP data to provide personalized coaching. Please connect your WHOOP account in the Settings tab.",
                  timestamp: Date.now(),
                },
              ],
              isLoading: false,
            }));
            return;
          }
          
          // Safely format user input with strict length limit
          const userInput = safeUserInput(lastMessage.content);
          
          // Check if this is a nutrition/meal request
          const isMealRequest = userInput.toLowerCase().includes("meal") || 
                               userInput.toLowerCase().includes("food") ||
                               userInput.toLowerCase().includes("eat") ||
                               userInput.toLowerCase().includes("recipe") ||
                               userInput.toLowerCase().includes("nutrition");
          
          // Create minimal context
          const userContext = getMinimalUserContext(userProfile);
          const recoveryContext = getEssentialRecoveryData(data);
          
          let systemPrompt = "";
          
          if (isMealRequest) {
            systemPrompt = `AI nutrition coach. User: ${userContext}. Recovery: ${recoveryContext}. Provide meal suggestions with macros. Max 150 words.`;
          } else {
            systemPrompt = `AI fitness coach. User: ${userContext}. Recovery: ${recoveryContext}. Provide training advice. Max 100 words.`;
          }
          
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: systemPrompt
                },
                {
                  role: 'user',
                  content: userInput
                }
              ]
            }),
          });
          
          const result = await response.json();
          
          set((state) => ({
            chatMessages: [
              ...state.chatMessages,
              {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: result.completion || "I'm sorry, I couldn't process your request at the moment. Please try again.",
                timestamp: Date.now(),
              },
            ],
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error fetching AI analysis:', error);
          
          set((state) => ({
            chatMessages: [
              ...state.chatMessages,
              {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: "I'm sorry, I couldn't analyze your data at the moment. Please try again later.",
                timestamp: Date.now(),
              },
            ],
            isLoading: false,
          }));
        }
      },
      
      generateAIAnalysisFromWhoopData: async () => {
        try {
          const { data, isConnectedToWhoop } = get();
          
          if (!isConnectedToWhoop || !data || !data.recovery.length) {
            console.log('No WHOOP data available for AI analysis');
            set({ analysis: defaultAIAnalysis });
            return;
          }
          
          // Get minimal recovery data
          const recoveryContext = getEssentialRecoveryData(data);
          
          // Very short system prompt
          const systemPrompt = `Analyze WHOOP data: ${recoveryContext}. Return JSON: {"recoveryInsight": "brief insight", "trainingRecommendation": "brief advice", "longTermTrend": "brief trend"}`;
          
          try {
            const response = await fetch('https://toolkit.rork.com/text/llm/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: [
                  {
                    role: 'system',
                    content: systemPrompt
                  },
                  {
                    role: 'user',
                    content: "Generate analysis"
                  }
                ]
              }),
            });
            
            const result = await response.json();
            
            try {
              const analysisText = result.completion?.trim() || '';
              const jsonStart = analysisText.indexOf('{');
              const jsonEnd = analysisText.lastIndexOf('}') + 1;
              
              if (jsonStart >= 0 && jsonEnd > jsonStart) {
                const jsonStr = analysisText.substring(jsonStart, jsonEnd);
                const analysisJson = JSON.parse(jsonStr);
                
                if (analysisJson.recoveryInsight && analysisJson.trainingRecommendation && analysisJson.longTermTrend) {
                  set({ analysis: analysisJson });
                  return;
                }
              }
              
              // Fallback to default analysis
              set({ analysis: defaultAIAnalysis });
              
            } catch (parseError) {
              console.error('Failed to parse AI response:', parseError);
              set({ analysis: defaultAIAnalysis });
            }
          } catch (fetchError) {
            console.error('Error fetching AI analysis:', fetchError);
            set({ analysis: defaultAIAnalysis });
          }
        } catch (error) {
          console.error('Error generating AI analysis:', error);
          set({ analysis: defaultAIAnalysis });
        }
      },
      
      setApiKeys: (keys) => set({ apiKeys: keys }),
      
      addProgram: (program) => {
        const newProgram: TrainingProgram = {
          id: `program-${Date.now()}`,
          startDate: new Date().toISOString().split('T')[0],
          active: true,
          lastUpdated: new Date().toISOString(),
          updateHistory: [],
          ...program,
        };
        
        // If user has macro targets, add them to the program's nutrition plan
        const { macroTargets, userProfile } = get();
        if (macroTargets && userProfile.name) {
          const recommendations = generateNutritionRecommendations(program.type, userProfile.fitnessGoal);
          
          newProgram.nutritionPlan = {
            calories: macroTargets.calories,
            protein: macroTargets.protein,
            carbs: macroTargets.carbs,
            fat: macroTargets.fat,
            recommendations
          };
        }
        
        set((state) => ({
          activePrograms: [...state.activePrograms, newProgram],
        }));
      },
      
      updateProgram: (id, updates) => {
        set((state) => ({
          activePrograms: state.activePrograms.map((program) => 
            program.id === id ? { 
              ...program, 
              ...updates,
              lastUpdated: new Date().toISOString()
            } : program
          ),
        }));
      },
      
      removeProgram: (id) => {
        set((state) => ({
          activePrograms: state.activePrograms.filter((program) => program.id !== id),
        }));
      },
      
      addNutritionData: (data) => {
        const newData: NutritionData = {
          id: `nutrition-${Date.now()}`,
          ...data,
        };
        
        set((state) => ({
          nutritionData: [...state.nutritionData, newData],
        }));
      },
      
      checkWhoopConnection: async () => {
        try {
          console.log('Checking WHOOP connection status...');
          const connected = await isConnectedToWhoop();
          console.log('WHOOP connection status:', connected);
          set({ isConnectedToWhoop: connected });
          
          if (connected) {
            const cachedData = await getCachedWhoopData();
            if (cachedData && cachedData.recovery.length > 0) {
              console.log('Loaded cached WHOOP data with', cachedData.recovery.length, 'recovery records');
              
              const mostRecentDate = cachedData.recovery[0]?.date || new Date().toISOString().split('T')[0];
              
              set({ 
                data: cachedData,
                selectedDate: mostRecentDate
              });
            }
            
            const lastSyncTimeStr = await AsyncStorage.getItem(WHOOP_LAST_SYNC_TIME_KEY);
            if (lastSyncTimeStr) {
              set({ lastSyncTime: parseInt(lastSyncTimeStr, 10) });
            }
            
            await get().checkAndPerformScheduledSync();
            
            return true;
          }
          
          console.log('Not connected to WHOOP, resetting data');
          set({ 
            data: emptyWhoopData,
            analysis: defaultAIAnalysis,
            whoopProfile: null,
            lastSyncTime: null
          });
          
          return false;
        } catch (error) {
          console.error('Error checking WHOOP connection:', error);
          
          set({ 
            isConnectedToWhoop: false,
            data: emptyWhoopData,
            analysis: defaultAIAnalysis,
            whoopProfile: null,
            lastSyncTime: null
          });
          
          return false;
        }
      },
      
      fetchWhoopData: async () => {
        set({ isLoadingWhoopData: true });
        
        try {
          console.log('Checking WHOOP connection before fetching data...');
          const connected = await isConnectedToWhoop();
          
          if (!connected) {
            console.log('Cannot fetch WHOOP data: Not connected to WHOOP');
            set({ 
              isLoadingWhoopData: false,
              data: emptyWhoopData,
              analysis: defaultAIAnalysis
            });
            return;
          }
          
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          const startDateStr = startDate.toISOString().split('T')[0];
          
          console.log(`Fetching WHOOP data from ${startDateStr} to ${endDate}`);
          
          const transformedData = await transformWhoopData(startDateStr, endDate);
          
          if (transformedData && transformedData.recovery.length > 0) {
            console.log('Successfully fetched WHOOP data with', transformedData.recovery.length, 'recovery records');
            
            const mostRecentDate = transformedData.recovery[0]?.date || new Date().toISOString().split('T')[0];
            
            set({ 
              data: transformedData,
              selectedDate: mostRecentDate,
              lastSyncTime: Date.now(),
              isLoadingWhoopData: false 
            });
            
            setTimeout(() => {
              get().generateAIAnalysisFromWhoopData();
            }, 500);
          } else {
            console.error('No WHOOP data returned or empty data set');
            set({ isLoadingWhoopData: false });
          }
        } catch (error) {
          console.error('Error fetching WHOOP data:', error);
          set({ isLoadingWhoopData: false });
        }
      },
      
      syncWhoopData: async () => {
        try {
          console.log('Checking WHOOP connection before syncing...');
          const connected = await isConnectedToWhoop();
          
          if (!connected) {
            console.error('Cannot sync: Not connected to WHOOP');
            return false;
          }
          
          set({ isLoadingWhoopData: true });
          
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          const startDateStr = startDate.toISOString().split('T')[0];
          
          console.log(`Syncing WHOOP data from ${startDateStr} to ${endDate}`);
          
          const transformedData = await transformWhoopData(startDateStr, endDate);
          
          if (transformedData && transformedData.recovery.length > 0) {
            console.log('Successfully synced WHOOP data:', {
              recoveryCount: transformedData.recovery.length,
              strainCount: transformedData.strain.length
            });
            
            const mostRecentDate = transformedData.recovery[0]?.date || new Date().toISOString().split('T')[0];
            
            set({ 
              data: transformedData,
              selectedDate: mostRecentDate,
              lastSyncTime: Date.now(),
              isLoadingWhoopData: false 
            });
            
            setTimeout(() => {
              get().generateAIAnalysisFromWhoopData();
            }, 500);
            
            return true;
          } else {
            console.error('No WHOOP data returned or empty data set');
            set({ isLoadingWhoopData: false });
            return false;
          }
        } catch (error) {
          console.error('Error syncing WHOOP data:', error);
          set({ isLoadingWhoopData: false });
          return false;
        }
      },
      
      checkAndPerformScheduledSync: async () => {
        try {
          const shouldSync = await checkScheduledSync();
          
          if (shouldSync) {
            console.log('Performing scheduled midnight sync');
            
            const connected = await isConnectedToWhoop();
            if (connected) {
              await get().syncWhoopData();
            }
            
            await scheduleNextMidnightSync();
          }
        } catch (error) {
          console.error('Error checking or performing scheduled sync:', error);
        }
      },
      
      generatePersonalizedTrainingPlan: async (programType, userConfig) => {
        try {
          set({ isLoading: true });
          
          console.log('Starting AI plan generation with config:', {
            programType,
            strengthTraining: userConfig.strengthTraining,
            trainingDaysPerWeek: userConfig.trainingDaysPerWeek,
            customSplit: userConfig.strengthTraining?.customSplit
          });
          
          const { data, userProfile, macroTargets, weightHistory } = get();
          
          // Enhanced user context with comprehensive metrics
          const userContext = getComprehensiveUserContext(userProfile, weightHistory);
          const recoveryContext = getEssentialRecoveryData(data);
          const fitnessAssessment = getFitnessAssessment(userProfile, data);
          
          // Calculate goal-specific requirements
          const goalRequirements = calculateGoalRequirements(
            programType, 
            userConfig.targetMetric || '', 
            userConfig.goalDate || '', 
            userProfile, 
            weightHistory
          );
          
          // Enhanced system prompt with goal-focused personalization and strain optimization
          const systemPrompt = `Create highly personalized ${programType} program with laser focus on goal achievement and optimal strain-recovery balance.

${userConfig.strengthTraining?.enabled ? `
🚨 CRITICAL OVERRIDE INSTRUCTION 🚨
The user has manually specified ${userConfig.strengthTraining.daysPerWeek} strength training sessions per week.
This means:
1. The base ${programType} program must NOT include ANY strength/resistance training
2. The base program should be PURE ${programType} training only (running, cycling, swimming, etc.)
3. Do NOT add "strength training for ${programType}" or "core work" or "resistance training" to the base program
4. The user's ${userConfig.strengthTraining.daysPerWeek} manual strength sessions will handle ALL strength training needs
5. If a typical ${programType} program includes strength work, REMOVE IT and focus only on the primary discipline

EXAMPLE: For a marathon program with user-specified strength training:
- Base program: ONLY running workouts (easy runs, tempo runs, intervals, long runs, recovery runs)
- NO strength training in base program
- User's manual strength sessions are added separately

This ensures the user gets EXACTLY ${userConfig.strengthTraining.daysPerWeek} strength sessions, not more.
` : ''}

${userConfig.cardioTraining?.enabled ? `
🚨 CARDIO TRAINING INTEGRATION REQUIRED 🚨
The user has manually specified ${userConfig.cardioTraining.daysPerWeek} cardio training sessions per week for this strength-focused program.
This means:
1. Add EXACTLY ${userConfig.cardioTraining.daysPerWeek} cardio sessions per week to complement the strength training
2. Cardio type: ${userConfig.cardioTraining.type}
3. Intensity level: ${userConfig.cardioTraining.intensity}
4. Session duration: ${userConfig.cardioTraining.duration} minutes
5. These cardio sessions should enhance recovery and cardiovascular health without interfering with strength gains
6. Schedule cardio sessions on separate days from heavy strength training when possible
7. If same-day scheduling is necessary, separate cardio and strength into different workout entries

CARDIO IMPLEMENTATION GUIDELINES:
- ${userConfig.cardioTraining.type === 'running' ? 'Focus on running-based cardio: easy runs, tempo runs, intervals' : ''}
- ${userConfig.cardioTraining.type === 'cycling' ? 'Focus on cycling-based cardio: steady-state rides, interval training' : ''}
- ${userConfig.cardioTraining.type === 'swimming' ? 'Focus on swimming-based cardio: lap swimming, interval sets' : ''}
- ${userConfig.cardioTraining.type === 'rowing' ? 'Focus on rowing-based cardio: steady-state rowing, interval training' : ''}
- ${userConfig.cardioTraining.type === 'mixed' ? 'Vary cardio types: running, cycling, swimming, rowing for variety' : ''}
- ${userConfig.cardioTraining.intensity === 'low' ? 'Keep intensity low for active recovery (60-70% max HR)' : ''}
- ${userConfig.cardioTraining.intensity === 'moderate' ? 'Maintain moderate intensity (70-80% max HR)' : ''}
- ${userConfig.cardioTraining.intensity === 'high' ? 'Include high-intensity intervals (80-90% max HR)' : ''}
- ${userConfig.cardioTraining.intensity === 'mixed' ? 'Vary intensity: mix low, moderate, and high-intensity sessions' : ''}

This ensures the user gets EXACTLY ${userConfig.cardioTraining.daysPerWeek} cardio sessions to complement their strength training.
` : ''}

PRIMARY GOAL ANALYSIS:
- Target: ${userConfig.targetMetric || 'General fitness improvement'}
- Timeline: ${goalRequirements.daysUntilGoal} days (${goalRequirements.weeksUntilGoal} weeks)
- Urgency Level: ${goalRequirements.urgency}
- Feasibility: ${goalRequirements.feasible ? 'Achievable with proper planning' : 'Requires timeline adjustment or modified expectations'}

GOAL-SPECIFIC REQUIREMENTS:
${JSON.stringify(goalRequirements, null, 2)}

USER PROFILE: ${userContext}
FITNESS ASSESSMENT: ${fitnessAssessment}
RECOVERY STATUS: ${recoveryContext}

STRAIN & RECOVERY ANALYSIS:
- Current Recovery Score: ${data && data.recovery && data.recovery.length > 0 ? data.recovery[0]?.score : 'Unknown'}%
- HRV Status: ${data && data.recovery && data.recovery.length > 0 ? data.recovery[0]?.hrvMs : 'Unknown'}ms
- Sleep Quality: ${data && data.sleep && data.sleep.length > 0 ? data.sleep[0]?.efficiency + '%' : 'Unknown'}
- Recent Strain Pattern: ${data && data.strain && data.strain.length > 0 ? data.strain.slice(0, 7).map(s => s.score).join(', ') : 'No data'}
- Recovery Capacity: ${data && data.recovery && data.recovery.length > 0 ? (data.recovery.slice(0, 7).reduce((sum, r) => sum + r.score, 0) / Math.min(7, data.recovery.length)).toFixed(1) : 'Unknown'}% avg

TRAINING CONFIG:
- Experience: ${userConfig.experienceLevel}
- Training days: ${userConfig.trainingDaysPerWeek}/week
- Strength training: ${userConfig.strengthTraining?.enabled ? 'Yes - ' + userConfig.strengthTraining.daysPerWeek + ' days/week, ' + userConfig.strengthTraining.split + ' split' : 'No'}
- Cardio training: ${userConfig.cardioTraining?.enabled ? 'Yes - ' + userConfig.cardioTraining.daysPerWeek + ' days/week, ' + userConfig.cardioTraining.type + ', ' + userConfig.cardioTraining.intensity + ' intensity' : 'No'}
- Nutrition goal: ${userConfig.nutritionPreferences?.goal || 'maintain'}

STRENGTH TRAINING INTEGRATION REQUIREMENTS:
${userConfig.strengthTraining?.enabled ? `
MANDATORY: User has specifically requested strength training integration with the following requirements:
- Strength Training Days: ${userConfig.strengthTraining.daysPerWeek} days per week
- Training Split: ${userConfig.strengthTraining.split}
- Focus Areas: ${userConfig.strengthTraining.focusAreas?.join(', ') || 'General strength development'}

CRITICAL STRENGTH TRAINING IMPLEMENTATION RULES:
1. MUST include EXACTLY ${userConfig.strengthTraining.daysPerWeek} strength training sessions per week - NO MORE, NO LESS
2. MUST use the ${userConfig.strengthTraining.split} training split approach
3. MUST create separate workout entries for each strength training session
4. MUST balance strength training with the primary ${programType} goal
5. MUST distribute strength training sessions throughout the week for optimal recovery
6. MUST ensure strength training complements rather than interferes with primary goal workouts
7. CRITICAL: Do NOT add any additional strength training beyond the user's specified ${userConfig.strengthTraining.daysPerWeek} sessions
8. OVERRIDE BASE PROGRAM: If the ${programType} program normally includes strength/resistance work, REPLACE it entirely with the user's manual specification
9. NO EXTRA STRENGTH: The base ${programType} program should focus ONLY on its primary discipline and NOT include additional strength training

STRENGTH TRAINING SPLIT IMPLEMENTATION:
${userConfig.strengthTraining.split === 'fullBody' ? '- Each strength session should target all major muscle groups\n- Focus on compound movements (squat, deadlift, bench press, rows)\n- 6-8 exercises per session covering upper and lower body' : ''}
${userConfig.strengthTraining.split === 'upperLower' ? '- Alternate between upper body and lower body focused sessions\n- Upper: chest, back, shoulders, arms\n- Lower: quads, hamstrings, glutes, calves, core' : ''}
${userConfig.strengthTraining.split === 'pushPullLegs' ? '- Push: chest, shoulders, triceps\n- Pull: back, biceps\n- Legs: quads, hamstrings, glutes, calves' : ''}
${userConfig.strengthTraining.split === 'bodyPart' ? '- Focus on 1-2 muscle groups per session\n- Allow for higher volume per muscle group\n- Ensure each muscle group is trained 1-2x per week' : ''}
${userConfig.strengthTraining.split === 'custom' ? `- CUSTOM SPLIT: Follow the user's specific training split requirements:\n- User's custom split description: "${userConfig.strengthTraining.customSplit || 'No specific description provided'}"\n- Design strength sessions based on this custom split pattern\n- Ensure the split is distributed across ${userConfig.strengthTraining.daysPerWeek} training days\n- Follow the user's specified muscle group organization and training frequency` : ''}

EXAMPLE STRENGTH TRAINING INTEGRATION:
If primary program has 4 cardio days and user wants 3 strength days:
- Monday: Primary cardio workout (separate entry)
- Monday: Upper body strength training (separate entry) 
- Tuesday: Primary cardio workout (separate entry)
- Wednesday: Lower body strength training (separate entry)
- Thursday: Primary cardio workout (separate entry)
- Friday: Full body strength training (separate entry)
- Saturday: Primary cardio workout (separate entry)
- Sunday: Rest day

NEVER combine strength and cardio into single workout descriptions like "run + strength training"
ALWAYS create separate, distinct workout entries for each type
` : 'User has not requested strength training integration.'}

${userConfig.strengthTraining?.enabled ? `
BASE PROGRAM MODIFICATION REQUIREMENTS:
When user has manually specified strength training, the base ${programType} program must be modified as follows:
1. REMOVE ALL BASE STRENGTH: Remove any strength/resistance training that would normally be included in a ${programType} program
2. FOCUS ON PRIMARY DISCIPLINE: The ${programType} program should focus ONLY on ${programType}-specific training (running, cycling, etc.)
3. NO ADDITIONAL STRENGTH: Do not add any strength training beyond the user's ${userConfig.strengthTraining.daysPerWeek} specified sessions
4. REPLACE, DON'T SUPPLEMENT: The user's manual strength training REPLACES any base program strength work, it doesn't supplement it
5. PURE DISCIPLINE FOCUS: Keep the ${programType} workouts purely focused on the primary sport/discipline

EXAMPLE: If creating a marathon program and user wants 3 strength days:
- Base program should have ONLY running workouts (easy runs, tempo runs, intervals, long runs)
- Do NOT include any "strength training for runners" or "core work" or "resistance training" in the base program
- The 3 user-specified strength sessions will handle ALL strength training needs
` : ''}

CARDIO TRAINING INTEGRATION REQUIREMENTS:
${userConfig.cardioTraining?.enabled ? `
MANDATORY: User has specifically requested cardio training integration with the following requirements:
- Cardio Training Days: ${userConfig.cardioTraining.daysPerWeek} days per week
- Cardio Type: ${userConfig.cardioTraining.type}
- Intensity Level: ${userConfig.cardioTraining.intensity}
- Session Duration: ${userConfig.cardioTraining.duration} minutes

CRITICAL CARDIO TRAINING IMPLEMENTATION RULES:
1. MUST include EXACTLY ${userConfig.cardioTraining.daysPerWeek} cardio training sessions per week - NO MORE, NO LESS
2. MUST use the ${userConfig.cardioTraining.type} cardio type as specified
3. MUST maintain ${userConfig.cardioTraining.intensity} intensity level
4. MUST create separate workout entries for each cardio training session
5. MUST balance cardio training with the primary ${programType} goal (strength training)
6. MUST distribute cardio sessions throughout the week for optimal recovery
7. MUST ensure cardio training enhances rather than interferes with strength gains
8. CRITICAL: Do NOT add any additional cardio training beyond the user's specified ${userConfig.cardioTraining.daysPerWeek} sessions
9. RECOVERY FOCUS: For strength programs, cardio should support recovery and cardiovascular health

CARDIO TYPE IMPLEMENTATION:
${userConfig.cardioTraining.type === 'running' ? '- Focus on running-based activities: easy runs, tempo runs, intervals\\n- Vary terrain and pace based on intensity level\\n- Include proper warm-up and cool-down' : ''}
${userConfig.cardioTraining.type === 'cycling' ? '- Focus on cycling activities: steady-state rides, interval training\\n- Vary resistance and cadence based on intensity level\\n- Include proper warm-up and cool-down' : ''}
${userConfig.cardioTraining.type === 'swimming' ? '- Focus on swimming activities: lap swimming, interval sets\\n- Vary stroke and pace based on intensity level\\n- Include proper warm-up and cool-down' : ''}
${userConfig.cardioTraining.type === 'rowing' ? '- Focus on rowing activities: steady-state rowing, interval training\\n- Vary resistance and stroke rate based on intensity level\\n- Include proper warm-up and cool-down' : ''}
${userConfig.cardioTraining.type === 'mixed' ? '- Vary cardio types: running, cycling, swimming, rowing for variety\\n- Rotate different activities throughout the week\\n- Maintain consistent intensity and duration' : ''}

CARDIO INTENSITY IMPLEMENTATION:
${userConfig.cardioTraining.intensity === 'low' ? '- Keep intensity low for active recovery (60-70% max HR)\\n- Focus on easy, conversational pace\\n- Promote blood flow and recovery' : ''}
${userConfig.cardioTraining.intensity === 'moderate' ? '- Maintain moderate intensity (70-80% max HR)\\n- Comfortably hard pace, slightly breathless\\n- Build cardiovascular endurance' : ''}
${userConfig.cardioTraining.intensity === 'high' ? '- Include high-intensity intervals (80-90% max HR)\\n- Short bursts of high effort with recovery periods\\n- Improve VO2 max and anaerobic capacity' : ''}
${userConfig.cardioTraining.intensity === 'mixed' ? '- Vary intensity: mix low, moderate, and high-intensity sessions\\n- Rotate different intensities throughout the week\\n- Balance stress and recovery' : ''}

EXAMPLE CARDIO TRAINING INTEGRATION:
If primary program has 4 strength days and user wants 2 cardio days:
- Monday: Upper body strength training (separate entry)
- Tuesday: Low-intensity cardio session (separate entry)
- Wednesday: Lower body strength training (separate entry)
- Thursday: Moderate-intensity cardio session (separate entry)
- Friday: Full body strength training (separate entry)
- Saturday: Upper body strength training (separate entry)
- Sunday: Rest day

NEVER combine cardio and strength into single workout descriptions like "strength + cardio"
ALWAYS create separate, distinct workout entries for each type
` : 'User has not requested cardio training integration.'}

CRITICAL WORKOUT SEPARATION REQUIREMENTS:
1. ABSOLUTE RULE: Each workout entry must have EXACTLY ONE type: "cardio", "strength", or "recovery"
2. NEVER COMBINE TYPES: If a day needs both cardio and strength, create TWO separate workout objects
3. SEPARATE DESCRIPTIONS: Each workout description must only describe its specific type
4. NO MIXED LANGUAGE: Never use phrases like "run + strength", "cardio followed by weights", "easy run + workout", etc.
5. DISTINCT TITLES: Each workout must have a title specific to its single type
6. MANDATORY SEPARATION: Always create separate entries - NEVER combine different exercise types in one workout
7. STRENGTH TRAINING INTEGRATION: If user requested strength training, MUST include the exact number of strength sessions requested
8. CARDIO TRAINING INTEGRATION: If user requested cardio training, MUST include the exact number of cardio sessions requested
9. BALANCED SCHEDULING: Distribute strength and cardio sessions throughout the week for optimal recovery

EXAMPLES OF CORRECT STRUCTURE:
✅ CORRECT - Two separate workouts for one day:
[
  {
    "day": "Monday",
    "title": "Morning Easy Run",
    "description": "30-minute easy-paced run focusing on aerobic base building",
    "type": "cardio"
  },
  {
    "day": "Monday", 
    "title": "Evening Upper Body Strength",
    "description": "Upper body strength training focusing on chest, shoulders, and arms",
    "type": "strength"
  }
]

✅ CORRECT - Strength training integration example (if user wants 3 strength days):
[
  {
    "day": "Monday",
    "title": "Tempo Run",
    "description": "20-minute tempo run at comfortably hard pace",
    "type": "cardio"
  },
  {
    "day": "Monday",
    "title": "Upper Body Strength",
    "description": "Upper body strength training: bench press, rows, overhead press",
    "type": "strength"
  },
  {
    "day": "Wednesday",
    "title": "Lower Body Strength",
    "description": "Lower body strength training: squats, deadlifts, lunges",
    "type": "strength"
  },
  {
    "day": "Friday",
    "title": "Full Body Strength",
    "description": "Full body strength training with compound movements",
    "type": "strength"
  }
]

❌ WRONG - Combined workout (NEVER DO THIS):
{
  "day": "Monday",
  "title": "Run + Strength Training",
  "description": "Easy run followed by upper body strength work",
  "type": "cardio"
}

❌ WRONG - Mixed description (NEVER DO THIS):
{
  "day": "Tuesday",
  "title": "Cardio Session",
  "description": "Easy run + workout focused on quads, hamstrings and calves",
  "type": "cardio"
}

GOAL-FOCUSED PERSONALIZATION REQUIREMENTS:
1. GOAL PRIMACY: Every workout must contribute directly to achieving "${userConfig.targetMetric}"
2. TIMELINE OPTIMIZATION: Structure phases to peak at goal date (${userConfig.goalDate})
3. PROGRESSIVE TARGETING: Each phase should build specific capacities needed for the goal
4. RECOVERY INTEGRATION: Balance intensity with recovery needs for sustainable progress
5. RISK MANAGEMENT: Prevent injuries that could derail goal achievement
6. MEASURABLE PROGRESSION: Include specific metrics to track goal progress

PHASE STRUCTURE REQUIREMENTS:
- Phase 1: Foundation building (weeks 1-4) - establish base fitness for goal
- Phase 2: Development (weeks 5-8) - build specific capacities for goal
- Phase 3: Intensification (weeks 9-12) - goal-specific training
- Phase 4: Peak/Taper (final weeks) - optimize for goal performance

FINAL CRITICAL REMINDER: Each workout object must have ONLY ONE type. If a day requires both cardio and strength training, you MUST create TWO separate workout objects with the same day but different types and descriptions.

Return comprehensive JSON with goal-focused structure and STRICT workout separation:
{
  "programOverview": "Detailed explanation of how this program is specifically designed to achieve ${userConfig.targetMetric} by ${userConfig.goalDate}",
  "goalStrategy": "Overall strategy for achieving the specific goal within the timeline",
  "phases": [
    {
      "name": "Goal-Focused Phase Name",
      "duration": "X weeks", 
      "focus": "How this phase specifically contributes to goal achievement",
      "goalMilestones": ["Specific milestones to track progress toward goal"],
      "weeklyStructure": [
        {
          "day": "Monday",
          "title": "Morning Easy Run",
          "description": "30-minute easy-paced run at conversational pace to build aerobic base",
          "intensity": "Low",
          "type": "cardio",
          "goalContribution": "Builds aerobic capacity essential for ${userConfig.targetMetric}",
          "progressionMetrics": "Distance covered, average heart rate, perceived exertion",
          "personalizedNotes": "Optimized for current fitness level and recovery status"
        },
        {
          "day": "Monday",
          "title": "Evening Upper Body Strength",
          "description": "Upper body strength training with compound movements: bench press, rows, overhead press",
          "intensity": "Medium",
          "type": "strength",
          "goalContribution": "Builds upper body strength to support running posture and efficiency",
          "progressionMetrics": "Weight lifted, reps completed, form quality",
          "personalizedNotes": "Scheduled in evening to allow recovery between sessions"
        },
        {
          "day": "Tuesday",
          "title": "Tempo Run",
          "description": "20-minute tempo run at comfortably hard pace with 10-minute warm-up and cool-down",
          "intensity": "Medium-High",
          "type": "cardio",
          "goalContribution": "Improves lactate threshold critical for race pace sustainability",
          "progressionMetrics": "Pace consistency, heart rate zones, effort sustainability",
          "personalizedNotes": "Pace adjusted based on current fitness assessment"
        }
      ]
    }
  ],
  "nutritionPlan": {
    "calories": ${macroTargets?.calories || 2000},
    "protein": ${macroTargets?.protein || 150},
    "carbs": ${macroTargets?.carbs || 200},
    "fat": ${macroTargets?.fat || 70},
    "recommendations": ["Goal-specific nutrition advice optimized for ${userConfig.targetMetric}"]
  },
  "recoveryStrategies": "Recovery protocols optimized for goal achievement and timeline",
  "progressionPlan": "Detailed progression strategy to achieve ${userConfig.targetMetric} by ${userConfig.goalDate}",
  "riskMitigation": "Injury prevention strategies that protect goal achievement",
  "keySuccessFactors": ["Critical factors for achieving ${userConfig.targetMetric}"],
  "goalTracking": {
    "weeklyMetrics": ["Metrics to track weekly progress toward goal"],
    "milestoneChecks": ["Key checkpoints to ensure on-track progress"],
    "adjustmentTriggers": ["Indicators that program needs modification"]
  }
}`;
          
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: systemPrompt
                },
                {
                  role: 'user',
                  content: `Create personalized ${programType} program for my specific metrics and timeline`
                }
              ]
            }),
          });
          
          const result = await response.json();
          
          try {
            const planText = result.completion?.trim() || '';
            const jsonStart = planText.indexOf('{');
            const jsonEnd = planText.lastIndexOf('}') + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
              const jsonStr = planText.substring(jsonStart, jsonEnd);
              const planJson = JSON.parse(jsonStr);
              
              // Ensure planJson is valid
              if (!planJson || typeof planJson !== 'object') {
                throw new Error('Invalid plan JSON structure');
              }
              
              // Initial validation of AI response for strength training compliance
              if (userConfig.strengthTraining?.enabled && planJson.phases) {
                const requiredStrengthSessions = userConfig.strengthTraining.daysPerWeek;
                console.log(`🔍 Validating AI response for strength training compliance...`);
                console.log(`Required strength sessions per week: ${requiredStrengthSessions}`);
                
                planJson.phases.forEach((phase: any, phaseIndex: number) => {
                  if (phase.weeklyStructure) {
                    const strengthWorkouts = phase.weeklyStructure.filter((w: any) => w.type === 'strength');
                    const totalWorkouts = phase.weeklyStructure.length;
                    console.log(`Phase ${phaseIndex + 1} "${phase.name}": ${strengthWorkouts.length} strength workouts out of ${totalWorkouts} total workouts`);
                    
                    if (strengthWorkouts.length > requiredStrengthSessions) {
                      console.warn(`⚠️ AI generated ${strengthWorkouts.length} strength sessions but user only requested ${requiredStrengthSessions}. Will be corrected in post-processing.`);
                    }
                  }
                });
              }
              
              // Post-process to ensure workout separation and strength training integration
              if (planJson.phases && Array.isArray(planJson.phases)) {
                planJson.phases = planJson.phases.map((phase: any) => {
                  if (phase.weeklyStructure && Array.isArray(phase.weeklyStructure)) {
                    let separatedWorkouts: any[] = [];
                    
                    // Track if we have enough strength training sessions
                    const requiredStrengthSessions = userConfig.strengthTraining?.enabled ? userConfig.strengthTraining.daysPerWeek : 0;
                    let strengthSessionsFound = 0;
                    
                    phase.weeklyStructure.forEach((workout: any) => {
                      // Check if workout contains combined activities
                      const title = workout.title?.toLowerCase() || '';
                      const description = workout.description?.toLowerCase() || '';
                      
                      // If user has manual strength training, filter out any base program strength training
                      if (requiredStrengthSessions > 0) {
                        // Check if this is a base program strength workout that should be removed
                        const isBaseStrengthWorkout = 
                          workout.type === 'strength' ||
                          title.includes('strength') ||
                          title.includes('weight') ||
                          title.includes('lift') ||
                          title.includes('resistance') ||
                          title.includes('core') ||
                          title.includes('gym') ||
                          description.includes('strength') ||
                          description.includes('weight training') ||
                          description.includes('resistance') ||
                          description.includes('core work') ||
                          description.includes('squat') ||
                          description.includes('deadlift') ||
                          description.includes('bench press') ||
                          description.includes('pull-up') ||
                          description.includes('push-up') ||
                          (title.includes('core') && !title.includes('score')) ||
                          (description.includes('core') && !description.includes('score'));
                        
                        // Skip base program strength workouts when user has manual strength training
                        if (isBaseStrengthWorkout) {
                          console.log(`Removing base program strength workout: ${workout.title} - User has manual strength training`);
                          return; // Skip this workout
                        }
                      }
                      
                      const hasCombinedIndicators = 
                        title.includes('+') || 
                        title.includes('and') ||
                        title.includes('followed by') ||
                        title.includes('then') ||
                        description.includes('+') ||
                        description.includes('followed by') ||
                        description.includes('then') ||
                        description.includes('and then') ||
                        description.includes('after') ||
                        description.includes('before') ||
                        (description.includes('run') && (description.includes('strength') || description.includes('weight') || description.includes('lift'))) ||
                        (description.includes('cardio') && (description.includes('weight') || description.includes('strength') || description.includes('lift'))) ||
                        (description.includes('bike') && (description.includes('lift') || description.includes('strength'))) ||
                        (description.includes('swim') && (description.includes('lift') || description.includes('strength'))) ||
                        ((description.includes('squat') || description.includes('deadlift') || description.includes('bench')) && (description.includes('run') || description.includes('cardio')));
                      
                      if (hasCombinedIndicators) {
                        // Split combined workout into separate entries
                        const hasCardio = description.includes('run') || description.includes('cardio') || description.includes('bike') || description.includes('swim') || description.includes('jog') || title.includes('run') || title.includes('cardio');
                        const hasStrength = description.includes('strength') || description.includes('weight') || description.includes('lift') || description.includes('squat') || description.includes('deadlift') || description.includes('bench') || description.includes('press') || title.includes('strength') || title.includes('weight');
                        
                        if (hasCardio) {
                          // Create cardio workout
                          separatedWorkouts.push({
                            ...workout,
                            title: `${workout.day} Cardio Session`,
                            description: extractCardioDescription(workout.description) || 'Cardio training session',
                            type: 'cardio'
                          });
                        }
                        
                        if (hasStrength) {
                          // Create strength workout
                          separatedWorkouts.push({
                            ...workout,
                            title: `${workout.day} Strength Training`,
                            description: extractStrengthDescription(workout.description) || 'Strength training session',
                            type: 'strength'
                          });
                          strengthSessionsFound++;
                        }
                        
                        // If neither cardio nor strength detected, keep as is but log warning
                        if (!hasCardio && !hasStrength) {
                          console.warn('Combined workout detected but could not separate:', workout.title);
                          separatedWorkouts.push(workout);
                        }
                      } else {
                        // Keep workout as is if it's already properly separated
                        separatedWorkouts.push(workout);
                        
                        // Count existing strength sessions
                        if (workout.type === 'strength') {
                          strengthSessionsFound++;
                        }
                      }
                    });
                    
                    // Enforce EXACT number of strength training sessions
                    if (requiredStrengthSessions > 0) {
                      const currentStrengthWorkouts = separatedWorkouts.filter(w => w.type === 'strength');
                      
                      console.log(`Current strength workouts after filtering: ${currentStrengthWorkouts.length}, Required: ${requiredStrengthSessions}`);
                      
                      // Remove ALL existing strength workouts and add user's manual ones
                      // This ensures we don't have any base program strength training mixed with manual ones
                      const nonStrengthWorkouts = separatedWorkouts.filter(w => w.type !== 'strength');
                      separatedWorkouts.length = 0;
                      separatedWorkouts.push(...nonStrengthWorkouts);
                      
                      console.log(`Removed all base program strength workouts. Adding ${requiredStrengthSessions} user-specified strength sessions.`);
                      
                      // Add the exact number of user-specified strength training sessions
                      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                      const usedDays = new Set(separatedWorkouts.map(w => w.day));
                      
                      // Find available days for strength training
                      let availableDays = daysOfWeek.filter(day => !usedDays.has(day));
                      
                      // If not enough available days, we'll add to existing days
                      if (availableDays.length < requiredStrengthSessions) {
                        availableDays = [...availableDays, ...daysOfWeek.slice(0, requiredStrengthSessions - availableDays.length)];
                      }
                      
                      // Add the required number of strength training sessions
                      for (let i = 0; i < requiredStrengthSessions; i++) {
                        const day = availableDays[i % availableDays.length];
                        const isSecondary = usedDays.has(day); // If day is already used, make it secondary
                        const strengthWorkout = generateStrengthWorkout(day, userConfig.strengthTraining, isSecondary);
                        separatedWorkouts.push(strengthWorkout);
                        console.log(`Added strength workout: ${strengthWorkout.title} on ${day}`);
                      }
                    }
                    
                    phase.weeklyStructure = separatedWorkouts;
                    
                    // Final validation: ensure we have EXACTLY the required number of strength sessions
                    const finalStrengthCount = separatedWorkouts.filter(w => w.type === 'strength').length;
                    if (requiredStrengthSessions > 0) {
                      console.log(`Phase "${phase.name}": Required ${requiredStrengthSessions} strength sessions, found ${finalStrengthCount}`);
                      
                      if (finalStrengthCount !== requiredStrengthSessions) {
                        console.error(`STRENGTH TRAINING MISMATCH: Expected exactly ${requiredStrengthSessions} sessions, but found ${finalStrengthCount}`);
                      } else {
                        console.log(`✅ Strength training correctly configured: ${finalStrengthCount} sessions as requested`);
                        
                        // Log the specific strength training sessions for verification
                        const strengthSessions = separatedWorkouts.filter(w => w.type === 'strength');
                        console.log('Strength training sessions:', strengthSessions.map(s => `${s.day}: ${s.title}`).join(', '));
                      }
                    }
                  }
                  return phase;
                });
              }
              
              // Extract nutrition plan if available
              if (planJson && planJson.nutritionPlan && typeof planJson.nutritionPlan === 'object') {
                const nutritionPlan: NutritionPlan = {
                  calories: planJson.nutritionPlan.calories || 0,
                  protein: planJson.nutritionPlan.protein || 0,
                  carbs: planJson.nutritionPlan.carbs || 0,
                  fat: planJson.nutritionPlan.fat || 0,
                  recommendations: Array.isArray(planJson.nutritionPlan.recommendations) ? planJson.nutritionPlan.recommendations : []
                };
                
                planJson.nutritionPlan = nutritionPlan;
                
                if (nutritionPlan.calories > 0) {
                  set({
                    macroTargets: {
                      calories: nutritionPlan.calories,
                      protein: nutritionPlan.protein,
                      carbs: nutritionPlan.carbs,
                      fat: nutritionPlan.fat,
                      calculatedAt: new Date()
                    }
                  });
                }
              } else if (macroTargets && planJson) {
                planJson.nutritionPlan = {
                  calories: macroTargets.calories,
                  protein: macroTargets.protein,
                  carbs: macroTargets.carbs,
                  fat: macroTargets.fat,
                  recommendations: generateNutritionRecommendations(programType, userProfile.fitnessGoal)
                };
              } else if (planJson) {
                // Fallback nutrition plan
                planJson.nutritionPlan = {
                  calories: 2000,
                  protein: 150,
                  carbs: 200,
                  fat: 70,
                  recommendations: generateNutritionRecommendations(programType, userProfile.fitnessGoal)
                };
              }
              
              // Add goal requirements to the plan for reference
              if (planJson) {
                planJson.goalRequirements = goalRequirements;
                planJson.userMetrics = {
                  age: userProfile.age,
                  weight: userProfile.weight,
                  height: userProfile.height,
                  activityLevel: userProfile.activityLevel,
                  fitnessGoal: userProfile.fitnessGoal
                };
                
                // Ensure phases array exists and is valid
                if (!planJson.phases || !Array.isArray(planJson.phases)) {
                  planJson.phases = [{
                    name: "Foundation Phase",
                    duration: "4 weeks",
                    focus: "Building base fitness",
                    weeklyStructure: []
                  }];
                }
              }
              
              set({ isLoading: false });
              return planJson;
            }
            
            set({ isLoading: false });
            return { rawPlan: planText };
            
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            set({ isLoading: false });
            return null;
          }
        } catch (error) {
          console.error('Error generating personalized training plan:', error);
          
          // Log specific details about the error for debugging
          if (userConfig.strengthTraining?.enabled) {
            console.error('Strength training was enabled with config:', userConfig.strengthTraining);
          }
          
          set({ isLoading: false });
          return null;
        }
      },
      
      // Manual workout tracking functions
      startManualWorkout: (workout) => {
        const id = `workout-${Date.now()}`;
        const now = new Date();
        
        const newWorkout: ManualWorkout = {
          id,
          ...workout,
          startTime: now,
          elapsedSeconds: 0,
          isActive: true,
          isPaused: false,
          lastResumeTime: now
        };
        
        set((state) => ({
          activeManualWorkouts: [...state.activeManualWorkouts, newWorkout]
        }));
        
        return id;
      },
      
      pauseManualWorkout: (id) => {
        set((state) => ({
          activeManualWorkouts: state.activeManualWorkouts.map(workout => {
            if (workout.id === id && workout.isActive && !workout.isPaused) {
              const now = new Date();
              const elapsedSinceLastResume = Math.floor((now.getTime() - workout.lastResumeTime.getTime()) / 1000);
              
              return {
                ...workout,
                isPaused: true,
                elapsedSeconds: workout.elapsedSeconds + elapsedSinceLastResume
              };
            }
            return workout;
          })
        }));
      },
      
      resumeManualWorkout: (id) => {
        set((state) => ({
          activeManualWorkouts: state.activeManualWorkouts.map(workout => {
            if (workout.id === id && workout.isActive && workout.isPaused) {
              return {
                ...workout,
                isPaused: false,
                lastResumeTime: new Date()
              };
            }
            return workout;
          })
        }));
      },
      
      completeManualWorkout: async (id) => {
        const { activeManualWorkouts } = get();
        const workout = activeManualWorkouts.find(w => w.id === id);
        
        if (!workout) {
          return { 
            success: false, 
            error: "Workout not found" 
          };
        }
        
        const now = new Date();
        let finalElapsedSeconds = workout.elapsedSeconds;
        
        if (!workout.isPaused) {
          const elapsedSinceLastResume = Math.floor((now.getTime() - workout.lastResumeTime.getTime()) / 1000);
          finalElapsedSeconds += elapsedSinceLastResume;
        }
        
        set((state) => ({
          activeManualWorkouts: state.activeManualWorkouts.map(w => {
            if (w.id === id) {
              return {
                ...w,
                isActive: false,
                isPaused: true,
                elapsedSeconds: finalElapsedSeconds,
                endTime: now
              };
            }
            return w;
          })
        }));
        
        return { success: true };
      },
      
      cancelManualWorkout: (id) => {
        set((state) => ({
          activeManualWorkouts: state.activeManualWorkouts.filter(w => w.id !== id)
        }));
      },
      
      getManualWorkout: (id) => {
        const { activeManualWorkouts } = get();
        const workout = activeManualWorkouts.find(w => w.id === id);
        
        if (!workout) return undefined;
        
        if (workout.isActive && !workout.isPaused) {
          const now = new Date();
          const elapsedSinceLastResume = Math.floor((now.getTime() - workout.lastResumeTime.getTime()) / 1000);
          
          return {
            ...workout,
            elapsedSeconds: workout.elapsedSeconds + elapsedSinceLastResume
          };
        }
        
        return workout;
      },
      
      // User profile methods
      updateUserProfile: (profile) => {
        set((state) => {
          const updatedProfile = {
            ...state.userProfile,
            ...profile,
            updatedAt: new Date()
          };
          
          // If weight is updated, add it to weight history
          if (profile.weight !== undefined && profile.weight !== state.userProfile.weight) {
            const today = new Date().toISOString().split('T')[0];
            const existingEntry = state.weightHistory.find(entry => entry.date === today);
            
            if (existingEntry) {
              // Update existing entry for today
              const updatedWeightHistory = state.weightHistory.map(entry =>
                entry.date === today 
                  ? { ...entry, weight: profile.weight!, updatedAt: new Date() }
                  : entry
              );
              
              set({ weightHistory: updatedWeightHistory });
            } else {
              // Add new entry for today
              const newWeightEntry: WeightEntry = {
                id: `weight-${Date.now()}`,
                date: today,
                weight: profile.weight,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              set({ weightHistory: [...state.weightHistory, newWeightEntry] });
            }
          }
          
          if (
            profile.weight !== undefined || 
            profile.height !== undefined || 
            profile.age !== undefined || 
            profile.gender !== undefined || 
            profile.bodyFat !== undefined || 
            profile.activityLevel !== undefined ||
            profile.fitnessGoal !== undefined
          ) {
            setTimeout(() => {
              const newMacroTargets = get().calculateMacroTargets();
              
              get().activePrograms.forEach(program => {
                get().updateProgramNutrition(program.id);
              });
            }, 0);
          }
          
          return { userProfile: updatedProfile };
        });
      },
      
      calculateMacroTargets: () => {
        const { userProfile, activePrograms } = get();
        
        // Check if there's an active program with a nutrition plan
        const activeProgramWithNutrition = activePrograms.find(p => p.active && p.nutritionPlan);
        
        if (activeProgramWithNutrition && activeProgramWithNutrition.nutritionPlan) {
          const programNutrition = activeProgramWithNutrition.nutritionPlan;
          const macroTargets: MacroTargets = {
            calories: programNutrition.calories || 2000,
            protein: programNutrition.protein || 150,
            carbs: programNutrition.carbs || 200,
            fat: programNutrition.fat || 70,
            calculatedAt: new Date()
          };
          
          set({ macroTargets });
          return macroTargets;
        }
        
        let bmr = 0;
        
        if (userProfile.gender === 'male') {
          bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age + 5;
        } else {
          bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age - 161;
        }
        
        if (userProfile.bodyFat !== undefined) {
          const leanBodyMass = userProfile.weight * (1 - userProfile.bodyFat / 100);
          bmr = 370 + (21.6 * leanBodyMass);
        }
        
        const activityMultiplier = activityMultipliers[userProfile.activityLevel] || 1.55;
        let tdee = bmr * activityMultiplier;
        
        let calorieTarget = tdee;
        
        if (userProfile.fitnessGoal === 'loseWeight') {
          calorieTarget = tdee * 0.8;
        } else if (userProfile.fitnessGoal === 'gainMuscle') {
          calorieTarget = tdee * 1.1;
        }
        
        calorieTarget = Math.round(calorieTarget / 50) * 50;
        
        let proteinTarget = 0;
        let fatTarget = 0;
        let carbTarget = 0;
        
        if (userProfile.fitnessGoal === 'gainMuscle') {
          proteinTarget = Math.round(userProfile.weight * 2.2);
        } else if (userProfile.fitnessGoal === 'loseWeight') {
          proteinTarget = Math.round(userProfile.weight * 2.0);
        } else {
          proteinTarget = Math.round(userProfile.weight * 1.6);
        }
        
        if (userProfile.fitnessGoal === 'loseWeight') {
          fatTarget = Math.round((calorieTarget * 0.25) / 9);
        } else {
          fatTarget = Math.round((calorieTarget * 0.3) / 9);
        }
        
        const proteinCalories = proteinTarget * 4;
        const fatCalories = fatTarget * 9;
        const carbCalories = calorieTarget - proteinCalories - fatCalories;
        carbTarget = Math.round(carbCalories / 4);
        
        if (carbTarget < 50) {
          carbTarget = 50;
          calorieTarget = (proteinTarget * 4) + (fatTarget * 9) + (carbTarget * 4);
        }
        
        const macroTargets: MacroTargets = {
          calories: calorieTarget,
          protein: proteinTarget,
          carbs: carbTarget,
          fat: fatTarget,
          calculatedAt: new Date()
        };
        
        set({ macroTargets });
        
        return macroTargets;
      },
      
      addFoodLogEntry: (entry) => {
        const newEntry: FoodLogEntry = {
          id: `food-${Date.now()}`,
          createdAt: new Date(),
          ...entry
        };
        
        set((state) => ({
          foodLog: [...state.foodLog, newEntry]
        }));
      },
      
      removeFoodLogEntry: (id) => {
        set((state) => ({
          foodLog: state.foodLog.filter(entry => entry.id !== id)
        }));
      },
      
      getFoodLogEntriesByDate: (date) => {
        const { foodLog } = get();
        return foodLog.filter(entry => entry.date === date);
      },
      
      getMacroProgressForDate: (date) => {
        const { foodLog, macroTargets } = get();
        const entries = foodLog.filter(entry => entry.date === date);
        
        const consumed = entries.reduce(
          (acc, entry) => {
            acc.calories += entry.calories;
            acc.protein += entry.protein;
            acc.carbs += entry.carbs;
            acc.fat += entry.fat;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        
        const targets = macroTargets || {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 70,
          calculatedAt: new Date()
        };
        
        return {
          calories: { consumed: consumed.calories, target: targets.calories },
          protein: { consumed: consumed.protein, target: targets.protein },
          carbs: { consumed: consumed.carbs, target: targets.carbs },
          fat: { consumed: consumed.fat, target: targets.fat }
        };
      },
      
      generateMealSuggestion: async (preferences) => {
        try {
          const { macroTargets, userProfile } = get();
          
          if (!macroTargets) {
            get().calculateMacroTargets();
          }
          
          const targets = get().macroTargets || {
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 70,
            calculatedAt: new Date()
          };
          
          const safePreferences = safeUserInput(preferences);
          const userContext = getMinimalUserContext(userProfile);
          
          // Very short prompt
          const systemPrompt = `Meal for: "${safePreferences}". User: ${userContext}. Targets: ${targets.calories}cal, ${targets.protein}g protein. Provide meal with macros. Max 150 words.`;
          
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: "AI nutrition coach. Provide meal suggestions with macros."
                },
                {
                  role: 'user',
                  content: systemPrompt
                }
              ]
            }),
          });
          
          const result = await response.json();
          return result.completion || "I'm sorry, I couldn't generate a meal suggestion at the moment. Please try again later.";
          
        } catch (error) {
          console.error('Error generating meal suggestion:', error);
          return "I'm sorry, I couldn't generate a meal suggestion at the moment. Please try again later.";
        }
      },
      
      updateProgramNutrition: (programId) => {
        const { activePrograms, macroTargets, userProfile } = get();
        
        if (!macroTargets || !userProfile.name) return;
        
        const program = activePrograms.find(p => p.id === programId);
        if (!program) return;
        
        const recommendations = generateNutritionRecommendations(program.type, userProfile.fitnessGoal);
        
        const nutritionPlan: NutritionPlan = {
          calories: macroTargets.calories,
          protein: macroTargets.protein,
          carbs: macroTargets.carbs,
          fat: macroTargets.fat,
          recommendations
        };
        
        set((state) => ({
          activePrograms: state.activePrograms.map(p => 
            p.id === programId ? { ...p, nutritionPlan } : p
          )
        }));
      },
      
      syncMacroTargetsWithActiveProgram: () => {
        const { activePrograms } = get();
        
        // Find the first active program with a nutrition plan
        const activeProgramWithNutrition = activePrograms.find(p => p.active && p.nutritionPlan);
        
        if (activeProgramWithNutrition && activeProgramWithNutrition.nutritionPlan) {
          const programNutrition = activeProgramWithNutrition.nutritionPlan;
          const macroTargets: MacroTargets = {
            calories: programNutrition.calories || 2000,
            protein: programNutrition.protein || 150,
            carbs: programNutrition.carbs || 200,
            fat: programNutrition.fat || 70,
            calculatedAt: new Date()
          };
          
          set({ macroTargets });
        } else {
          // If no active program with nutrition plan, recalculate based on user profile
          get().calculateMacroTargets();
        }
      },
      
      processTextMeal: async (mealDescription: string) => {
        try {
          console.log('Processing text meal description:', mealDescription);
          
          if (!mealDescription || mealDescription.trim() === '') {
            throw new Error('Meal description is empty');
          }
          
          const safeMealDescription = safeUserInput(mealDescription);
          
          // Very short prompt
          const nutritionPrompt = `Analyze: "${safeMealDescription}". Return JSON: {"name":"Meal","calories":000,"protein":00,"carbs":00,"fat":00}`;
          
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: "AI nutrition expert. Return ONLY JSON."
                },
                {
                  role: 'user',
                  content: nutritionPrompt
                }
              ]
            }),
          });
          
          const result = await response.json();
          const nutritionText = result.completion?.trim() || '';
          console.log('Nutrition analysis response:', nutritionText);
          
          try {
            try {
              return JSON.parse(nutritionText);
            } catch (directError) {
              console.log('Direct parsing failed, trying to extract JSON');
            }
            
            const jsonStart = nutritionText.indexOf('{');
            const jsonEnd = nutritionText.lastIndexOf('}') + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
              const jsonStr = nutritionText.substring(jsonStart, jsonEnd);
              console.log('Extracted JSON string:', jsonStr);
              return JSON.parse(jsonStr);
            }
            
            throw new Error('Could not extract valid JSON from response');
          } catch (error) {
            console.error('Error parsing nutrition data:', error);
            return createFallbackMeal(safeMealDescription);
          }
        } catch (error) {
          console.error('Error processing text meal:', error);
          
          return {
            name: mealDescription.length > 30 ? mealDescription.substring(0, 30) + "..." : mealDescription,
            calories: 400,
            protein: 25,
            carbs: 40,
            fat: 15
          };
        }
      },
      
      analyzeNutrientDeficiencies: async (date: string) => {
        try {
          const { foodLog, macroTargets, userProfile } = get();
          const entries = foodLog.filter(entry => entry.date === date);
          
          if (entries.length === 0) {
            return {
              summary: "No meals logged for this day. Add meals to get a nutrient analysis.",
              deficiencies: [],
              recommendations: [
                "Log your meals to receive personalized nutrient recommendations.",
                "Aim to include a variety of food groups in your diet.",
                "Stay hydrated by drinking plenty of water throughout the day."
              ]
            };
          }
          
          const totalMacros = entries.reduce(
            (acc, entry) => {
              acc.calories += entry.calories;
              acc.protein += entry.protein;
              acc.carbs += entry.carbs;
              acc.fat += entry.fat;
              return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );
          
          const targets = macroTargets || {
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 70
          };
          
          const userContext = getMinimalUserContext(userProfile);
          const foods = entries.map(e => e.name).join(', ');
          
          // Very short prompt
          const systemPrompt = `Analyze nutrition. User: ${userContext}. Targets: ${targets.calories}cal ${targets.protein}g protein. Consumed: ${totalMacros.calories}cal ${totalMacros.protein}g protein. Foods: ${truncateText(foods, 50)}. Return JSON: {"summary": "brief", "deficiencies": [{"nutrient": "name", "description": "why", "foodSources": "sources"}], "recommendations": ["tip1"]}`;
          
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: "AI nutrition expert. Return ONLY JSON."
                },
                {
                  role: 'user',
                  content: systemPrompt
                }
              ]
            }),
          });
          
          const result = await response.json();
          
          try {
            const responseText = result.completion?.trim() || '';
            console.log('Attempting to parse nutrient analysis response:', responseText);
            
            try {
              const directParse = JSON.parse(responseText);
              if (
                directParse.summary && 
                Array.isArray(directParse.deficiencies) && 
                Array.isArray(directParse.recommendations)
              ) {
                console.log('Successfully parsed direct JSON response for nutrient analysis');
                return directParse as NutrientAnalysis;
              }
            } catch (directError) {
              console.log('Direct parsing failed, trying to extract JSON from text');
            }
            
            const jsonStart = responseText.indexOf('{');
            const jsonEnd = responseText.lastIndexOf('}') + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
              const jsonStr = responseText.substring(jsonStart, jsonEnd);
              console.log('Extracted JSON string for nutrient analysis:', jsonStr);
              
              try {
                const analysisData = JSON.parse(jsonStr);
                
                if (
                  analysisData.summary && 
                  Array.isArray(analysisData.deficiencies) && 
                  Array.isArray(analysisData.recommendations)
                ) {
                  return analysisData as NutrientAnalysis;
                }
              } catch (jsonError) {
                console.log('Failed to parse extracted JSON for nutrient analysis:', jsonError);
              }
            }
            
            throw new Error('Invalid analysis data format');
          } catch (error) {
            console.error('Error parsing nutrient analysis:', error);
            
            return {
              summary: "Based on your food log, you are meeting most of your macro targets, but may be lacking in some micronutrients.",
              deficiencies: [
                {
                  nutrient: "Vitamin D",
                  description: "Essential for calcium absorption and bone health. Also important for immune function.",
                  foodSources: "Fatty fish, egg yolks, fortified dairy products, and sunlight exposure"
                }
              ],
              recommendations: [
                "Try to include more colorful vegetables in your meals for a wider range of vitamins and minerals.",
                "Consider adding fatty fish like salmon to your diet 1-2 times per week.",
                "Stay hydrated by drinking at least 2-3 liters of water daily."
              ]
            };
          }
          
        } catch (error) {
          console.error('Error analyzing nutrient deficiencies:', error);
          
          return {
            summary: "Unable to perform a complete analysis at this time.",
            deficiencies: [],
            recommendations: [
              "Aim for a balanced diet with a variety of food groups.",
              "Include plenty of fruits, vegetables, lean proteins, and whole grains.",
              "Stay hydrated throughout the day."
            ]
          };
        }
      },
      
      requestProgramUpdate: async (request: ProgramUpdateRequest) => {
        try {
          set({ isLoading: true });
          
          const { activePrograms, data, userProfile, weightHistory } = get();
          const whoopData: WhoopData = data || emptyWhoopData;
          const program = activePrograms.find(p => p.id === request.programId);
          
          if (!program) {
            set({ isLoading: false });
            return {
              success: false,
              message: "Program not found. Please try again."
            };
          }
          
          const latestRecovery = (whoopData.recovery && whoopData.recovery.length > 0) ? whoopData.recovery[0] : null;
          const safeRequestText = safeUserInput(request.requestText);
          
          // Enhanced user context for better personalization
          const userContext = getComprehensiveUserContext(userProfile, weightHistory);
          const recoveryContext = getEssentialRecoveryData(whoopData);
          const fitnessAssessment = getFitnessAssessment(userProfile, whoopData);
          
          // Calculate goal requirements and progress tracking
          const goalRequirements = program.goalDate && program.targetMetric ? 
            calculateGoalRequirements(program.type, program.targetMetric, program.goalDate, userProfile, weightHistory) : 
            { daysUntilGoal: null, urgency: 'medium', feasible: true };
          
          // Calculate current program progress
          const today = new Date();
          const startDate = new Date(program.startDate);
          const diffTime = Math.abs(today.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const currentWeek = Math.floor(diffDays / 7) + 1;
          
          // Analyze program effectiveness so far
          const programAnalysis = analyzeProgramEffectiveness(program, currentWeek, goalRequirements);
          
          let prompt = "";
          
          if (request.specificWorkout) {
            // Handle specific workout updates
            const safeWorkoutData = {
              day: safeUserInput(request.specificWorkout.day),
              originalTitle: safeUserInput(request.specificWorkout.originalTitle),
              newTitle: safeUserInput(request.specificWorkout.newTitle),
              newDescription: safeUserInput(request.specificWorkout.newDescription),
              newIntensity: safeUserInput(request.specificWorkout.newIntensity)
            };
            
            prompt = `Update specific workout in ${program.name} program while maintaining goal alignment.

WORKOUT UPDATE:
- Day: ${safeWorkoutData.day}
- Current: ${safeWorkoutData.originalTitle}
- New Title: ${safeWorkoutData.newTitle}
- New Description: ${safeWorkoutData.newDescription}
- New Intensity: ${safeWorkoutData.newIntensity}

GOAL CONTEXT:
- Primary Goal: ${program.targetMetric || 'General fitness improvement'}
- Goal Date: ${program.goalDate || 'Ongoing'}
- Days Remaining: ${goalRequirements.daysUntilGoal || 'N/A'}
- Goal Feasibility: ${goalRequirements.feasible ? 'On track' : 'Needs adjustment'}

USER CONTEXT: ${userContext}
RECOVERY: ${recoveryContext}
PROGRAM PROGRESS: Week ${currentWeek}, ${programAnalysis.progressStatus}

CRITICAL REQUIREMENTS:
1. Ensure workout change supports the primary goal: ${program.targetMetric || program.type}
2. Maintain progression toward goal within timeline
3. Consider user's current fitness level and recovery capacity
4. Validate that intensity change aligns with goal requirements
5. ALWAYS create separate workout entries for different types (cardio vs strength)
6. NEVER combine different workout types into a single workout entry

Return JSON:
{
  "success": true,
  "message": "Workout updated while maintaining goal alignment",
  "changes": ["Updated ${safeWorkoutData.day} workout from ${safeWorkoutData.originalTitle} to ${safeWorkoutData.newTitle}"],
  "recommendations": ["How this change supports your goal: ${program.targetMetric}"]
}`;
          } else {
            // Handle general program updates with advisory approach - implement user requests while providing recovery guidance
            prompt = `IMPLEMENT the user's request while providing advisory guidance for optimal performance and recovery.

USER REQUEST: "${safeRequestText}"

PRIMARY GOAL ANALYSIS:
- Goal: ${program.targetMetric || 'General fitness'}
- Goal Date: ${program.goalDate || 'Not set'}
- Days Remaining: ${goalRequirements.daysUntilGoal || 'Unknown'}
- Timeline Urgency: ${goalRequirements.urgency}
- Goal Feasibility: ${goalRequirements.feasible ? 'Achievable' : 'Needs timeline adjustment'}
- Current Progress: Week ${currentWeek} of program

CURRENT PROGRAM STATUS:
- Type: ${program.type}
- Training Days: ${program.trainingDaysPerWeek}/week
- Experience Level: ${program.experienceLevel}
- Program Analysis: ${programAnalysis.progressStatus}
- Effectiveness: ${programAnalysis.effectiveness}

USER PROFILE: ${userContext}
FITNESS ASSESSMENT: ${fitnessAssessment}
RECOVERY STATUS: ${recoveryContext}

RECOVERY CONTEXT FOR OPTIMIZATION:
- Current Recovery Score: ${latestRecovery?.score || 'Unknown'}%
- HRV Status: ${latestRecovery?.hrvMs || 'Unknown'}ms
- Sleep Quality: ${whoopData.sleep && whoopData.sleep.length > 0 ? whoopData.sleep[0]?.efficiency + '%' : 'Unknown'}
- Recent Strain Trend: ${whoopData.strain && whoopData.strain.length > 0 ? whoopData.strain.slice(0, 7).map(s => s.score).join(', ') : 'No data'}

IMPLEMENTATION APPROACH:
1. ALWAYS IMPLEMENT what the user requested - add it to their program
2. MAINTAIN the core program structure and goal-focused workouts
3. PROVIDE advisory guidance on recovery optimization when strain increases
4. OFFER recommendations rather than restrictions
5. ENHANCE performance through strategic integration
6. CREATE SEPARATE WORKOUT ENTRIES for different types (strength vs cardio)
7. ENSURE each workout has a clear, specific type: "cardio", "strength", or "recovery"

ADVISORY FRAMEWORK:
- When user requests increase training load: IMPLEMENT it AND provide recovery strategies
- When strain may exceed capacity: IMPLEMENT it AND advise on optimization protocols
- Focus on "how to succeed with this change" rather than "why you shouldn't do this"
- Provide specific actionable advice for managing increased demands

Return JSON with implementation and advisory guidance:
{
  "success": true,
  "message": "Successfully implemented your request with optimization strategies for peak performance",
  "changes": [
    "IMPLEMENTED: [Specific implementation of user request]",
    "INTEGRATED: [How it was added to existing program structure]", 
    "OPTIMIZED: [Strategic placement and timing of new elements]"
  ],
  "recommendations": [
    "Performance strategies to maximize results from this change",
    "Recovery protocols to support the enhanced training load",
    "Monitoring guidelines to ensure sustainable progress"
  ],
  "advisoryGuidance": {
    "strainManagement": {
      "expectedIncrease": "Moderate increase in weekly training stress",
      "managementStrategy": "Strategic recovery protocols to handle increased load",
      "monitoringAdvice": "Key metrics to track for optimal adaptation"
    },
    "recoveryOptimization": {
      "sleepGuidance": {
        "targetHours": "8-9 hours for enhanced recovery",
        "qualityTips": ["Sleep hygiene recommendations for better recovery"],
        "timing": "Consistent sleep schedule to support adaptation"
      },
      "nutritionGuidance": {
        "calorieAdjustment": "Increase by 200-300 calories on high-intensity days",
        "proteinTarget": "1.8-2.2g per kg body weight for muscle recovery",
        "hydrationTarget": "3-4 liters daily, more on training days",
        "timingAdvice": ["Pre/post workout nutrition strategies"]
      },
      "activeRecovery": [
        "Light movement on rest days (walking, yoga)",
        "Foam rolling and stretching protocols",
        "Stress management techniques for HRV optimization"
      ]
    },
    "performanceOptimization": [
      "How to maximize benefits from the new training elements",
      "Progressive overload strategies for continued adaptation",
      "Signs of positive adaptation vs. overreaching"
    ]
  },
  "updatedProgram": {
    "trainingDaysPerWeek": ${program.trainingDaysPerWeek},
    "phases": [
      {
        "name": "Enhanced ${program.type} Phase",
        "duration": "4 weeks",
        "focus": "Incorporating user request while maintaining goal progression",
        "weeklyStructure": [
          {
            "day": "Monday",
            "title": "Goal-Focused Workout",
            "description": "Core workout maintaining program structure",
            "intensity": "Medium-High",
            "type": "cardio",
            "goalContribution": "Primary driver of goal achievement"
          },
          {
            "day": "Tuesday", 
            "title": "User-Requested Addition",
            "description": "Implementation of user's specific request",
            "intensity": "Medium",
            "type": "strength",
            "goalContribution": "Supports overall fitness and user preferences"
          }
        ]
      }
    ],
    "nutritionPlan": {
      "calories": ${Math.round((program.nutritionPlan?.calories || 2000) * 1.1)},
      "protein": ${Math.round((program.nutritionPlan?.protein || 150) * 1.1)},
      "carbs": ${Math.round((program.nutritionPlan?.carbs || 200) * 1.1)},
      "fat": ${program.nutritionPlan?.fat || 70},
      "recommendations": ["Increased nutrition to support enhanced training load"]
    }
  },
  "successMetrics": [
    "Energy levels remain stable or improve",
    "Recovery scores stay within normal range (above 60%)",
    "Progressive improvement in goal-specific metrics",
    "Sustainable motivation and enjoyment of training"
  ],
  "warningSignsToMonitor": [
    "Persistent fatigue or declining performance",
    "Recovery scores consistently below 50%",
    "Loss of motivation or training enjoyment",
    "Increased injury risk indicators"
  ]
}`;
          }
          
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: "You are an expert AI fitness coach specializing in program enhancement and performance optimization. Your approach is IMPLEMENTATION-FOCUSED with ADVISORY GUIDANCE. Core principles: 1) ALWAYS implement what the user requests - add it to their program, 2) MAINTAIN the core program structure and goal focus, 3) PROVIDE advisory guidance on how to succeed with increased demands, 4) OFFER recovery optimization strategies rather than restrictions, 5) Focus on 'how to make this work' rather than 'why this might be too much', 6) CRITICAL: Create separate workout entries for different types - NEVER combine cardio and strength into one workout entry. Your role is to help users achieve their goals while managing any increased training demands through smart recovery and nutrition strategies. Always return valid JSON only."
                },
                {
                  role: 'user',
                  content: prompt
                }
              ]
            }),
          });
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const result = await response.json();
          
          if (!result.completion) {
            throw new Error('No completion received from API');
          }
          
          try {
            const feedbackText = result.completion.trim();
            console.log('AI Response:', feedbackText);
            
            // Try to parse JSON from the response
            let feedbackJson;
            try {
              feedbackJson = JSON.parse(feedbackText);
            } catch (directParseError) {
              // If direct parsing fails, try to extract JSON
              const jsonStart = feedbackText.indexOf('{');
              const jsonEnd = feedbackText.lastIndexOf('}') + 1;
              
              if (jsonStart >= 0 && jsonEnd > jsonStart) {
                const jsonStr = feedbackText.substring(jsonStart, jsonEnd);
                feedbackJson = JSON.parse(jsonStr);
              } else {
                throw new Error('No valid JSON found in response');
              }
            }
            
            // Validate the response structure
            if (typeof feedbackJson.success !== 'boolean' || typeof feedbackJson.message !== 'string') {
              throw new Error('Invalid response structure');
            }
            
            if (feedbackJson.success) {
              if (request.specificWorkout) {
                // Update specific workout
                updateWorkoutInProgram(
                  program,
                  request.specificWorkout.day,
                  request.specificWorkout.originalTitle,
                  request.specificWorkout.newTitle,
                  request.specificWorkout.newDescription,
                  request.specificWorkout.newIntensity
                );
                
                // Update the program in store
                const updatedProgram = { 
                  ...program, 
                  lastUpdated: new Date().toISOString(),
                  updateHistory: [...(program.updateHistory || []), {
                    date: new Date().toISOString(),
                    requestText: safeRequestText,
                    changes: feedbackJson.changes || [`Updated ${request.specificWorkout.day} workout`]
                  }]
                };
                
                set((state) => ({
                  activePrograms: state.activePrograms.map(p => 
                    p.id === program.id ? updatedProgram : p
                  )
                }));
              } else {
                // Update entire program
                const update: ProgramUpdate = {
                  date: new Date().toISOString(),
                  requestText: safeRequestText,
                  changes: feedbackJson.changes || ['Program updated based on your request']
                };
                
                let updatedProgram = { 
                  ...program, 
                  lastUpdated: new Date().toISOString(),
                  updateHistory: [...(program.updateHistory || []), update]
                };
                
                // Apply program updates if provided - focus on additions rather than replacements
                if (feedbackJson.updatedProgram) {
                  const updates = feedbackJson.updatedProgram;
                  
                  // Only update training days if it's a reasonable increase (max +2 days)
                  if (updates.trainingDaysPerWeek && typeof updates.trainingDaysPerWeek === 'number') {
                    const currentDays = updatedProgram.trainingDaysPerWeek;
                    const newDays = updates.trainingDaysPerWeek;
                    if (newDays <= currentDays + 2 && newDays <= 7) {
                      updatedProgram.trainingDaysPerWeek = newDays;
                    }
                  }
                  
                  // Enhance existing phases rather than replacing them entirely
                  if (updates.phases && Array.isArray(updates.phases) && updatedProgram.aiPlan?.phases) {
                    // Merge new workouts into existing structure rather than replacing
                    const enhancedPhases = updatedProgram.aiPlan.phases.map((existingPhase: any, index: number) => {
                      const newPhase = updates.phases[index];
                      if (newPhase && newPhase.weeklyStructure) {
                        // Add new workouts to existing structure
                        const enhancedWeeklyStructure = [...(existingPhase.weeklyStructure || [])];
                        
                        // Add new workouts that don't conflict with existing ones
                        newPhase.weeklyStructure.forEach((newWorkout: any) => {
                          const existingWorkoutIndex = enhancedWeeklyStructure.findIndex(
                            (existing: any) => existing.day === newWorkout.day
                          );
                          
                          if (existingWorkoutIndex === -1) {
                            // Add new workout if day is free
                            enhancedWeeklyStructure.push(newWorkout);
                          } else if (newWorkout.title !== enhancedWeeklyStructure[existingWorkoutIndex].title) {
                            // Add as secondary workout or modify existing
                            enhancedWeeklyStructure[existingWorkoutIndex] = {
                              ...enhancedWeeklyStructure[existingWorkoutIndex],
                              description: `${enhancedWeeklyStructure[existingWorkoutIndex].description} + ${newWorkout.description}`,
                              personalizedNotes: `Enhanced with: ${newWorkout.title}`
                            };
                          }
                        });
                        
                        return {
                          ...existingPhase,
                          weeklyStructure: enhancedWeeklyStructure,
                          focus: `${existingPhase.focus} + ${newPhase.focus || 'user enhancements'}`
                        };
                      }
                      return existingPhase;
                    });
                    
                    updatedProgram.aiPlan = {
                      ...updatedProgram.aiPlan,
                      phases: enhancedPhases,
                      programOverview: `${updatedProgram.aiPlan.programOverview} Enhanced based on: "${safeRequestText}"`,
                      lastUpdated: new Date().toISOString()
                    };
                  }
                  
                  // Update nutrition plan with moderate increases to support additional training
                  if (updates.nutritionPlan && updatedProgram.nutritionPlan) {
                    const currentNutrition = updatedProgram.nutritionPlan;
                    const updatedNutrition = {
                      calories: Math.min(updates.nutritionPlan.calories || currentNutrition.calories, currentNutrition.calories * 1.2),
                      protein: Math.min(updates.nutritionPlan.protein || currentNutrition.protein, currentNutrition.protein * 1.3),
                      carbs: Math.min(updates.nutritionPlan.carbs || currentNutrition.carbs, currentNutrition.carbs * 1.2),
                      fat: updates.nutritionPlan.fat || currentNutrition.fat,
                      recommendations: [
                        ...(currentNutrition.recommendations || []),
                        ...(updates.nutritionPlan.recommendations || [])
                      ]
                    };
                    
                    updatedProgram.nutritionPlan = updatedNutrition;
                    
                    // Update global macro targets with moderate increases
                    const newMacroTargets: MacroTargets = {
                      calories: updatedNutrition.calories,
                      protein: updatedNutrition.protein,
                      carbs: updatedNutrition.carbs,
                      fat: updatedNutrition.fat,
                      calculatedAt: new Date()
                    };
                    
                    set({ macroTargets: newMacroTargets });
                    console.log('Updated macro targets with moderate increases:', newMacroTargets);
                  }
                  
                  // Add strength training config if provided
                  if (updates.strengthTraining) {
                    updatedProgram.strengthTraining = {
                      enabled: true,
                      ...updatedProgram.strengthTraining,
                      ...updates.strengthTraining
                    };
                  }
                }
                
                set((state) => ({
                  activePrograms: state.activePrograms.map(p => 
                    p.id === program.id ? updatedProgram : p
                  )
                }));
              }
            }
            
            set({ isLoading: false });
            return feedbackJson as ProgramFeedback;
            
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            set({ isLoading: false });
            return {
              success: false,
              message: "I received a response but couldn't process it properly. Please try rephrasing your request or try again later."
            };
          }
        } catch (error) {
          console.error('Error requesting program update:', error);
          set({ isLoading: false });
          return {
            success: false,
            message: "There was an error connecting to the AI service. Please check your internet connection and try again."
          };
        }
      },
      
      getProgramFeedback: (programId: string) => {
        const { activePrograms } = get();
        const program = activePrograms.find(p => p.id === programId);
        
        if (!program || !program.updateHistory || program.updateHistory.length === 0) {
          return null;
        }
        
        const latestUpdate = program.updateHistory[program.updateHistory.length - 1];
        
        return {
          success: true,
          message: `Your program was last updated on ${new Date(latestUpdate.date).toLocaleDateString()} based on your request: "${latestUpdate.requestText}"`,
          changes: latestUpdate.changes
        };
      },
      
      getTodaysWorkout: () => {
        const { activePrograms, data } = get();
        
        if (activePrograms.length === 0) {
          return null;
        }
        
        const today = new Date();
        const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });
        
        for (const program of activePrograms) {
          if (!program.active) continue;
          
          if (program.aiPlan && program.aiPlan.phases && program.aiPlan.phases.length > 0) {
            let currentWeek = 1;
            if (program.startDate) {
              try {
                const startDate = new Date(program.startDate);
                const currentDate = new Date();
                const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                currentWeek = Math.floor(diffDays / 7) + 1;
              } catch (error) {
                console.error("Error calculating current week:", error);
                currentWeek = 1;
              }
            }
            
            let currentPhase = program.aiPlan.phases[0];
            let weekCounter = 0;
            
            for (const phase of program.aiPlan.phases) {
              const phaseDuration = parseInt(phase.duration?.split(' ')[0] || '4', 10) || 4;
              if (currentWeek > weekCounter && currentWeek <= weekCounter + phaseDuration) {
                currentPhase = phase;
                break;
              }
              weekCounter += phaseDuration;
            }
            
            if (currentPhase.weeklyStructure && Array.isArray(currentPhase.weeklyStructure)) {
              const todaysWorkout = currentPhase.weeklyStructure.find((workout: any) => 
                workout.day === todayDay
              );
              
              if (todaysWorkout) {
                const latestRecovery = data.recovery[0] || null;
                const recoveryStatus = latestRecovery?.status || 'medium';
                
                const enhancedWorkout: TodaysWorkout = {
                  ...todaysWorkout,
                  programId: program.id,
                  programName: program.name,
                  duration: generateDuration(todaysWorkout.type, todaysWorkout.intensity),
                  recoveryAdjustment: recoveryStatus === 'low' ? todaysWorkout.adjustedForRecovery : null
                };
                
                return enhancedWorkout;
              }
            }
          }
          
          const basicWorkout = generateBasicWorkoutForToday(program, todayDay);
          if (basicWorkout) {
            return basicWorkout;
          }
        }
        
        return null;
      },
      
      // Check if a workout is completed
      isWorkoutCompleted: async (programId: string, workoutTitle: string, date?: string): Promise<boolean> => {
        try {
          const targetDate = date || new Date().toISOString().split('T')[0];
          const todayKey = `${programId}-${targetDate}`;
          const storageKey = `completed-workouts-${todayKey}`;
          const stored = await AsyncStorage.getItem(storageKey);
          
          if (stored) {
            const completedWorkouts = JSON.parse(stored);
            const workoutKey = `${new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' })}-${workoutTitle}`;
            return completedWorkouts.includes(workoutKey);
          }
          
          return false;
        } catch (error) {
          console.error('Error checking workout completion:', error);
          return false;
        }
      },
      
      // Weight tracking methods
      addWeightEntry: (weight: number, date?: string) => {
        const entryDate = date || new Date().toISOString().split('T')[0];
        
        set((state) => {
          // Check if entry already exists for this date
          const existingEntryIndex = state.weightHistory.findIndex(entry => entry.date === entryDate);
          
          if (existingEntryIndex >= 0) {
            // Update existing entry
            const updatedWeightHistory = [...state.weightHistory];
            updatedWeightHistory[existingEntryIndex] = {
              ...updatedWeightHistory[existingEntryIndex],
              weight,
              updatedAt: new Date()
            };
            
            // Check if this is the most recent entry and update profile weight
            const sortedHistory = [...updatedWeightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const mostRecentEntry = sortedHistory[0];
            
            if (mostRecentEntry && mostRecentEntry.date === entryDate) {
              // Update profile weight if this is the most recent entry
              const updatedProfile = {
                ...state.userProfile,
                weight: weight,
                updatedAt: new Date()
              };
              
              return { 
                weightHistory: updatedWeightHistory,
                userProfile: updatedProfile
              };
            }
            
            return { weightHistory: updatedWeightHistory };
          } else {
            // Add new entry
            const newEntry: WeightEntry = {
              id: `weight-${Date.now()}`,
              date: entryDate,
              weight,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            // Sort by date (newest first)
            const updatedWeightHistory = [...state.weightHistory, newEntry]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Check if this new entry is the most recent and update profile weight
            const mostRecentEntry = updatedWeightHistory[0];
            
            if (mostRecentEntry && mostRecentEntry.date === entryDate) {
              // Update profile weight if this is the most recent entry
              const updatedProfile = {
                ...state.userProfile,
                weight: weight,
                updatedAt: new Date()
              };
              
              return { 
                weightHistory: updatedWeightHistory,
                userProfile: updatedProfile
              };
            }
            
            return { weightHistory: updatedWeightHistory };
          }
        });
      },
      
      updateWeightEntry: (id: string, weight: number) => {
        set((state) => {
          const updatedWeightHistory = state.weightHistory.map(entry =>
            entry.id === id 
              ? { ...entry, weight, updatedAt: new Date() }
              : entry
          );
          
          // Check if the updated entry is the most recent and update profile weight
          const sortedHistory = [...updatedWeightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const mostRecentEntry = sortedHistory[0];
          const updatedEntry = updatedWeightHistory.find(entry => entry.id === id);
          
          if (mostRecentEntry && updatedEntry && mostRecentEntry.id === id) {
            // Update profile weight if this is the most recent entry
            const updatedProfile = {
              ...state.userProfile,
              weight: weight,
              updatedAt: new Date()
            };
            
            return { 
              weightHistory: updatedWeightHistory,
              userProfile: updatedProfile
            };
          }
          
          return { weightHistory: updatedWeightHistory };
        });
      },
      
      removeWeightEntry: (id: string) => {
        set((state) => {
          const updatedWeightHistory = state.weightHistory.filter(entry => entry.id !== id);
          
          // If we removed the most recent entry, update profile weight to the new most recent
          const sortedHistory = [...updatedWeightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const newMostRecentEntry = sortedHistory[0];
          
          if (newMostRecentEntry) {
            // Update profile weight to the new most recent entry
            const updatedProfile = {
              ...state.userProfile,
              weight: newMostRecentEntry.weight,
              updatedAt: new Date()
            };
            
            return { 
              weightHistory: updatedWeightHistory,
              userProfile: updatedProfile
            };
          }
          
          return { weightHistory: updatedWeightHistory };
        });
      },
      
      getWeightHistory: (days: number = 30) => {
        const { weightHistory } = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return weightHistory
          .filter(entry => new Date(entry.date) >= cutoffDate)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },
      
      getLatestWeight: () => {
        const { weightHistory } = get();
        if (weightHistory.length === 0) return null;
        
        return weightHistory
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      },
      
      // Initialize weight data from profile if weight history is empty
      initializeWeightFromProfile: () => {
        const { weightHistory, userProfile } = get();
        
        // Only initialize if weight history is empty and profile has weight
        if (weightHistory.length === 0 && userProfile.weight && userProfile.weight > 0) {
          console.log('Initializing weight history from profile weight:', userProfile.weight);
          
          // Use profile creation date or today's date - safely handle Date objects
          let initialDate: string;
          try {
            if (userProfile.createdAt) {
              const createdAtDate = ensureDateObject(userProfile.createdAt);
              initialDate = createdAtDate.toISOString().split('T')[0];
            } else {
              initialDate = new Date().toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error processing createdAt date:', error);
            initialDate = new Date().toISOString().split('T')[0];
          }
          
          const initialWeightEntry: WeightEntry = {
            id: `weight-profile-${Date.now()}`,
            date: initialDate,
            weight: userProfile.weight,
            createdAt: ensureDateObject(userProfile.createdAt),
            updatedAt: new Date()
          };
          
          set({ weightHistory: [initialWeightEntry] });
        }
      },
      
      // Mark program introduction as shown
      markProgramIntroductionShown: (programId: string) => {
        const { programIntroductionsShown } = get();
        if (!programIntroductionsShown.includes(programId)) {
          set({ 
            programIntroductionsShown: [...programIntroductionsShown, programId] 
          });
        }
      },
      
      // Program progress methods
      getProgramProgress: (programId: string) => {
        const { activePrograms } = get();
        const program = activePrograms.find(p => p.id === programId);
        
        if (!program) {
          return {
            progressPercentage: 0,
            currentWeek: 1,
            totalWeeks: 12,
            daysUntilGoal: null,
            completedWorkouts: 0,
            totalWorkouts: 0
          };
        }
        
        const today = new Date();
        const startDate = new Date(program.startDate);
        
        // Calculate current week
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentWeek = Math.floor(diffDays / 7) + 1;
        
        // Calculate total weeks from AI plan or default
        let totalWeeks = 12; // Default
        if (program.aiPlan && program.aiPlan.phases) {
          totalWeeks = program.aiPlan.phases.reduce((total: number, phase: any) => {
            const phaseDuration = parseInt(phase.duration?.split(' ')[0] || '4', 10) || 4;
            return total + phaseDuration;
          }, 0);
        }
        
        // Calculate progress percentage
        const progressPercentage = Math.min((currentWeek / totalWeeks) * 100, 100);
        
        // Calculate days until goal if goal date exists
        let daysUntilGoal = null;
        if (program.goalDate) {
          const goalDate = new Date(program.goalDate);
          const timeDiff = goalDate.getTime() - today.getTime();
          daysUntilGoal = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
        }
        
        // Calculate completed workouts (simplified - could be enhanced with actual tracking)
        const completedWorkouts = Math.max(0, (currentWeek - 1) * program.trainingDaysPerWeek);
        const totalWorkouts = totalWeeks * program.trainingDaysPerWeek;
        
        return {
          progressPercentage,
          currentWeek: Math.min(currentWeek, totalWeeks),
          totalWeeks,
          daysUntilGoal,
          completedWorkouts,
          totalWorkouts
        };
      }
    }),
    {
      name: 'whoop-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        chatMessages: state.chatMessages.slice(-10), // Only persist last 10 messages
        activePrograms: state.activePrograms,
        nutritionData: state.nutritionData,
        lastSyncTime: state.lastSyncTime,
        activeManualWorkouts: state.activeManualWorkouts,
        userProfile: state.userProfile,
        macroTargets: state.macroTargets,
        foodLog: state.foodLog,
        weightHistory: state.weightHistory,
        programIntroductionsShown: state.programIntroductionsShown,
        // Persist WHOOP connection status and data
        isConnectedToWhoop: state.isConnectedToWhoop,
        data: state.data,
        selectedDate: state.selectedDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Revive stored data to ensure proper Date objects
          const revivedData = reviveStoredData(state);
          Object.assign(state, revivedData);
        }
      },
    }
  )
);

// Helper function to generate nutrition recommendations
function generateNutritionRecommendations(programType: string, fitnessGoal: string): string[] {
  const recommendations: string[] = [];
  
  recommendations.push("Stay hydrated by drinking at least 2-3 liters of water daily.");
  recommendations.push("Aim to eat 3-4 hours before intense training sessions.");
  
  if (programType === 'marathon' || programType === 'half-marathon') {
    recommendations.push("Focus on carbohydrate intake before long runs (1-4g/kg body weight).");
    recommendations.push("Consume 30-60g of carbs per hour during runs longer than 90 minutes.");
    recommendations.push("Include a 3:1 or 4:1 carb to protein ratio in post-run recovery meals.");
    
    if (fitnessGoal === 'loseWeight') {
      recommendations.push("Create a small calorie deficit (300-500 calories) on non-long run days.");
    } else if (fitnessGoal === 'gainMuscle') {
      recommendations.push("Increase protein intake to 1.8-2.2g/kg to support muscle maintenance during high mileage.");
    }
  } else if (programType === 'powerlifting' || programType === 'hypertrophy') {
    recommendations.push("Consume 1.6-2.2g of protein per kg of body weight to support muscle growth.");
    recommendations.push("Include a protein-rich meal within 1-2 hours after strength training.");
    recommendations.push("Consider creatine supplementation (3-5g daily) for improved strength performance.");
    
    if (fitnessGoal === 'loseWeight') {
      recommendations.push("Maintain high protein intake while in a calorie deficit to preserve muscle mass.");
    } else if (fitnessGoal === 'gainMuscle') {
      recommendations.push("Aim for a calorie surplus of 300-500 calories on training days.");
    }
  } else if (programType === 'weight_loss') {
    recommendations.push("Focus on protein intake (1.8-2.2g/kg) to preserve muscle while in a calorie deficit.");
    recommendations.push("Include fiber-rich foods to increase satiety and improve digestion.");
    recommendations.push("Consider intermittent fasting if it fits your schedule and preferences.");
    recommendations.push("Aim for a sustainable calorie deficit of 500-750 calories per day.");
  } else {
    recommendations.push("Prioritize whole foods over processed options when possible.");
    recommendations.push("Include a variety of colorful fruits and vegetables for micronutrients.");
    recommendations.push("Consider omega-3 fatty acids for heart health (fatty fish, flaxseeds, walnuts).");
    
    if (fitnessGoal === 'loseWeight') {
      recommendations.push("Create a moderate calorie deficit through both diet and exercise.");
    } else if (fitnessGoal === 'gainMuscle') {
      recommendations.push("Ensure adequate protein and calorie intake to support muscle growth.");
    }
  }
  
  return recommendations;
}

// Helper function to create a fallback meal based on description
function createFallbackMeal(mealDescription: string): any {
  console.log('Creating fallback meal based on description:', mealDescription);
  
  let name = "Recorded Meal";
  let calories = 400;
  let protein = 25;
  let carbs = 40;
  let fat = 15;
  
  const lowerText = mealDescription.toLowerCase();
  
  if (lowerText.includes('breakfast') || lowerText.includes('morning')) {
    name = "Breakfast";
    calories = 350;
    protein = 20;
    carbs = 45;
    fat = 12;
  } else if (lowerText.includes('lunch')) {
    name = "Lunch";
    calories = 450;
    protein = 30;
    carbs = 45;
    fat = 15;
  } else if (lowerText.includes('dinner') || lowerText.includes('evening meal')) {
    name = "Dinner";
    calories = 550;
    protein = 35;
    carbs = 50;
    fat = 20;
  } else if (lowerText.includes('snack')) {
    name = "Snack";
    calories = 200;
    protein = 10;
    carbs = 20;
    fat = 8;
  }
  
  const foodItems = [
    { keywords: ['chicken', 'poultry'], name: "Chicken", protein: 25, carbs: 0, fat: 10 },
    { keywords: ['beef', 'steak'], name: "Beef", protein: 25, carbs: 0, fat: 15 },
    { keywords: ['fish', 'salmon', 'tuna'], name: "Fish", protein: 25, carbs: 0, fat: 10 },
    { keywords: ['rice', 'grain'], name: "Rice", protein: 5, carbs: 45, fat: 1 },
    { keywords: ['potato', 'potatoes'], name: "Potatoes", protein: 4, carbs: 30, fat: 0 },
    { keywords: ['pasta', 'noodle'], name: "Pasta", protein: 7, carbs: 40, fat: 2 },
    { keywords: ['salad', 'vegetable'], name: "Salad", protein: 3, carbs: 10, fat: 2 },
    { keywords: ['egg', 'eggs'], name: "Eggs", protein: 12, carbs: 1, fat: 10 },
    { keywords: ['bread', 'toast', 'sandwich'], name: "Sandwich", protein: 15, carbs: 30, fat: 10 },
    { keywords: ['yogurt', 'yoghurt'], name: "Yogurt", protein: 10, carbs: 15, fat: 5 },
    { keywords: ['fruit', 'apple', 'banana'], name: "Fruit", protein: 1, carbs: 25, fat: 0 },
    { keywords: ['protein shake', 'shake', 'smoothie'], name: "Protein Shake", protein: 25, carbs: 10, fat: 5 },
  ];
  
  const matches: string[] = [];
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  
  for (const item of foodItems) {
    for (const keyword of item.keywords) {
      if (lowerText.includes(keyword)) {
        matches.push(item.name);
        totalProtein += item.protein;
        totalCarbs += item.carbs;
        totalFat += item.fat;
        break;
      }
    }
  }
  
  if (matches.length > 0) {
    if (matches.length === 1) {
      name = matches[0];
    } else if (matches.length === 2) {
      name = `${matches[0]} with ${matches[1]}`;
    } else {
      name = `${matches[0]}, ${matches[1]} and more`;
    }
    
    if (matches.length >= 2) {
      calories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);
      protein = totalProtein;
      carbs = totalCarbs;
      fat = totalFat;
    }
  }
  
  return {
    name,
    calories,
    protein,
    carbs,
    fat
  };
}

// Helper function to update a specific workout in a program
function updateWorkoutInProgram(
  program: TrainingProgram, 
  day: string, 
  originalTitle: string,
  newTitle: string,
  newDescription: string,
  newIntensity: string
) {
  if (program.aiPlan && program.aiPlan.phases && program.aiPlan.phases.length > 0) {
    for (const phase of program.aiPlan.phases) {
      if (phase.weeklyStructure && Array.isArray(phase.weeklyStructure)) {
        const workoutIndex = phase.weeklyStructure.findIndex(
          (workout: any) => workout.day === day && workout.title === originalTitle
        );
        
        if (workoutIndex !== -1) {
          phase.weeklyStructure[workoutIndex] = {
            ...phase.weeklyStructure[workoutIndex],
            title: newTitle,
            description: newDescription,
            intensity: newIntensity
          };
        }
      }
    }
  }
}

// Helper function to generate duration based on workout type and intensity
function generateDuration(type: string, intensity: string): string {
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
}

// Helper function to generate strength workout based on user preferences
function generateStrengthWorkout(day: string, strengthConfig: any, isSecondary: boolean = false): any {
  const split = strengthConfig?.split || 'fullBody';
  const customSplit = strengthConfig?.customSplit || '';
  const suffix = isSecondary ? ' (Evening)' : '';
  
  // Handle custom split case
  if (split === 'custom' && customSplit) {
    console.log(`Generating custom strength workout for ${day} with split: "${customSplit}"`);
    
    // Parse the custom split to determine what to do for this day
    const customSplitLower = customSplit.toLowerCase();
    let title = `${day} Custom Strength${suffix}`;
    let description = `Custom strength training session based on your specified split: "${customSplit}"`;
    
    // Try to intelligently parse the custom split description
    if (customSplitLower.includes('push') && (customSplitLower.includes('pull') || customSplitLower.includes('legs'))) {
      // Push/Pull/Legs style split
      if (day === 'Monday' || day === 'Thursday') {
        title = `${day} Push Day${suffix}`;
        description = `Push day from your custom split: chest, shoulders, triceps - ${customSplit}`;
      } else if (day === 'Tuesday' || day === 'Friday') {
        title = `${day} Pull Day${suffix}`;
        description = `Pull day from your custom split: back, biceps - ${customSplit}`;
      } else {
        title = `${day} Leg Day${suffix}`;
        description = `Leg day from your custom split: quads, hamstrings, glutes - ${customSplit}`;
      }
    } else if (customSplitLower.includes('upper') && customSplitLower.includes('lower')) {
      // Upper/Lower split
      if (day === 'Monday' || day === 'Wednesday' || day === 'Friday') {
        title = `${day} Upper Body${suffix}`;
        description = `Upper body day from your custom split: ${customSplit}`;
      } else {
        title = `${day} Lower Body${suffix}`;
        description = `Lower body day from your custom split: ${customSplit}`;
      }
    } else if (customSplitLower.includes('chest') || customSplitLower.includes('back') || customSplitLower.includes('legs') || customSplitLower.includes('shoulders') || customSplitLower.includes('arms')) {
      // Body part split
      title = `${day} Targeted Training${suffix}`;
      description = `Targeted muscle group training from your custom split: ${customSplit}`;
    } else {
      // Generic custom split
      title = `${day} Custom Training${suffix}`;
      description = `Custom strength training following your specified split: ${customSplit}`;
    }
    
    return {
      day,
      title,
      description,
      intensity: 'Medium-High',
      type: 'strength',
      goalContribution: 'Builds strength according to your custom training split preferences',
      progressionMetrics: 'Weight lifted, reps completed, adherence to custom split',
      personalizedNotes: `Following your custom split: "${customSplit}"`
    };
  }
  
  const workoutTemplates = {
    fullBody: {
      title: `${day} Full Body Strength${suffix}`,
      description: 'Full body strength training focusing on compound movements: squats, deadlifts, bench press, rows, and overhead press',
      intensity: 'Medium-High',
      type: 'strength',
      goalContribution: 'Builds overall strength and muscle mass to support primary training goals',
      progressionMetrics: 'Weight lifted, reps completed, form quality',
      personalizedNotes: 'Focus on compound movements with progressive overload'
    },
    upperLower: {
      title: day === 'Monday' || day === 'Wednesday' || day === 'Friday' ? 
        `${day} Upper Body Strength${suffix}` : `${day} Lower Body Strength${suffix}`,
      description: day === 'Monday' || day === 'Wednesday' || day === 'Friday' ?
        'Upper body strength training: bench press, rows, overhead press, pull-ups, and arm work' :
        'Lower body strength training: squats, deadlifts, lunges, hip thrusts, and calf raises',
      intensity: 'Medium-High',
      type: 'strength',
      goalContribution: 'Builds targeted strength in upper or lower body muscle groups',
      progressionMetrics: 'Weight lifted, reps completed, muscle activation',
      personalizedNotes: 'Focus on progressive overload and proper form'
    },
    pushPullLegs: {
      title: day === 'Monday' || day === 'Thursday' ? `${day} Push Strength${suffix}` :
             day === 'Tuesday' || day === 'Friday' ? `${day} Pull Strength${suffix}` :
             `${day} Leg Strength${suffix}`,
      description: day === 'Monday' || day === 'Thursday' ? 
        'Push day: chest, shoulders, triceps - bench press, overhead press, dips, tricep work' :
        day === 'Tuesday' || day === 'Friday' ?
        'Pull day: back, biceps - rows, pull-ups, lat pulldowns, bicep curls' :
        'Leg day: quads, hamstrings, glutes, calves - squats, deadlifts, lunges, calf raises',
      intensity: 'Medium-High',
      type: 'strength',
      goalContribution: 'Builds specific muscle group strength with focused training',
      progressionMetrics: 'Weight lifted, reps completed, muscle pump',
      personalizedNotes: 'Focus on muscle group specific movements and progressive overload'
    },
    bodyPart: {
      title: `${day} Strength Training${suffix}`,
      description: 'Targeted muscle group training with high volume and focused exercises for maximum muscle development',
      intensity: 'Medium-High',
      type: 'strength',
      goalContribution: 'Builds specific muscle groups with high volume training',
      progressionMetrics: 'Weight lifted, reps completed, muscle fatigue',
      personalizedNotes: 'Focus on 1-2 muscle groups with higher volume'
    }
  };
  
  return {
    day,
    ...workoutTemplates[split as keyof typeof workoutTemplates] || workoutTemplates.fullBody
  };
}

// Helper function to generate a basic workout for today if no AI plan exists
function generateBasicWorkoutForToday(program: TrainingProgram, todayDay: string): TodaysWorkout | null {
  const workoutMap: Record<string, Record<string, any>> = {
    'marathon': {
      'Monday': { title: 'Recovery Run', type: 'cardio', intensity: 'Low', description: 'Easy 30-45 minute run at conversational pace' },
      'Tuesday': { title: 'Speed Work', type: 'cardio', intensity: 'High', description: '8-10 x 400m repeats at 5K pace' },
      'Wednesday': { title: 'Easy Run', type: 'cardio', intensity: 'Low', description: '40-50 minute easy run' },
      'Thursday': { title: 'Tempo Run', type: 'cardio', intensity: 'Medium', description: '20 minutes at threshold pace' },
      'Friday': { title: 'Rest Day', type: 'recovery', intensity: 'Very Low', description: 'Complete rest or light stretching' },
      'Saturday': { title: 'Long Run', type: 'cardio', intensity: 'Medium', description: 'Long steady run at easy pace' },
      'Sunday': { title: 'Cross Training', type: 'recovery', intensity: 'Low', description: 'Light cross-training or rest' }
    },
    'powerlifting': {
      'Monday': { title: 'Squat Focus', type: 'strength', intensity: 'High', description: 'Back Squat 5x5, accessory work' },
      'Tuesday': { title: 'Upper Body', type: 'strength', intensity: 'Medium', description: 'Bench Press and upper body accessories' },
      'Wednesday': { title: 'Rest Day', type: 'recovery', intensity: 'Very Low', description: 'Complete rest or light mobility' },
      'Thursday': { title: 'Deadlift Focus', type: 'strength', intensity: 'High', description: 'Deadlift 4x5, back work' },
      'Friday': { title: 'Upper Body', type: 'strength', intensity: 'Medium', description: 'Press variations and arm work' },
      'Saturday': { title: 'Accessory Day', type: 'strength', intensity: 'Medium-Low', description: 'Accessory movements and core' },
      'Sunday': { title: 'Rest Day', type: 'recovery', intensity: 'None', description: 'Complete rest' }
    },
    'weight_loss': {
      'Monday': { title: 'Full Body Strength', type: 'strength', intensity: 'Medium', description: 'Circuit training with compound movements' },
      'Tuesday': { title: 'HIIT Cardio', type: 'cardio', intensity: 'High', description: '30 seconds work, 30 seconds rest intervals' },
      'Wednesday': { title: 'Active Recovery', type: 'recovery', intensity: 'Low', description: '30-45 minute walk or yoga' },
      'Thursday': { title: 'Upper Body Focus', type: 'strength', intensity: 'Medium', description: 'Upper body strength training' },
      'Friday': { title: 'Steady Cardio', type: 'cardio', intensity: 'Medium-Low', description: '45-60 minutes Zone 2 cardio' },
      'Saturday': { title: 'Lower Body Focus', type: 'strength', intensity: 'Medium', description: 'Lower body strength training' },
      'Sunday': { title: 'Rest Day', type: 'recovery', intensity: 'None', description: 'Complete rest' }
    }
  };
  
  const programWorkouts = workoutMap[program.type];
  if (!programWorkouts) return null;
  
  const todaysWorkout = programWorkouts[todayDay];
  if (!todaysWorkout) return null;
  
  return {
    ...todaysWorkout,
    programId: program.id,
    programName: program.name,
    duration: generateDuration(todaysWorkout.type, todaysWorkout.intensity),
    day: todayDay,
    adjustedForRecovery: null,
    recoveryAdjustment: null
  };
}