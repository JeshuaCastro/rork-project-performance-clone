export interface RecoveryData {
  id: string;
  date: string;
  score: number;
  hrvMs: number;
  restingHeartRate: number;
  status: 'low' | 'medium' | 'high';
}

export interface StrainData {
  id: string;
  date: string;
  score: number;
  averageHeartRate: number;
  maxHeartRate: number;
  calories: number;
}

export interface SleepData {
  id: string;
  date: string;
  efficiency: number;
  duration: number;
  disturbances: number;
  qualityScore: number;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number; // in kg
  createdAt: Date;
  updatedAt: Date;
}

export interface WhoopData {
  recovery: RecoveryData[];
  strain: StrainData[];
  sleep: SleepData[];
}

export interface AIAnalysis {
  recoveryInsight: string;
  trainingRecommendation: string;
  longTermTrend: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ApiKeys {
  openAIApiKey?: string;
}

export interface StrengthTrainingConfig {
  enabled: boolean;
  daysPerWeek: number;
  split: 'fullBody' | 'upperLower' | 'pushPullLegs' | 'bodyPart' | 'custom';
  focusAreas?: string[];
  customSplit?: string;
}

export interface CardioTrainingConfig {
  enabled: boolean;
  daysPerWeek: number;
  type: 'running' | 'cycling' | 'swimming' | 'rowing' | 'mixed';
  intensity: 'low' | 'moderate' | 'high' | 'mixed';
  duration?: number; // in minutes
}

export interface NutritionPreferences {
  goal: 'surplus' | 'maintain' | 'deficit';
  dietaryRestrictions?: string[];
  mealFrequency?: number;
}

export interface NutritionPlan {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  mealPlan?: {
    meal: string;
    time: string;
    description: string;
    calories: number;
  }[];
  recommendations: string[];
}

export interface TrainingProgram {
  id: string;
  name: string;
  type: string;
  startDate: string;
  goalDate?: string;
  targetMetric?: string;
  trainingDaysPerWeek: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  active: boolean;
  strengthTraining?: StrengthTrainingConfig;
  cardioTraining?: CardioTrainingConfig;
  nutritionPreferences?: NutritionPreferences;
  nutritionPlan?: NutritionPlan;
  customRequirements?: string; // Added field for custom training requirements
  aiPlan?: any; // Store the AI-generated plan
  lastUpdated?: string; // Track when the program was last updated
  updateHistory?: ProgramUpdate[]; // Track update history
}

export interface ProgramUpdate {
  date: string;
  requestText: string;
  changes: string[];
}

export interface ProgramUpdateRequest {
  programId: string;
  requestText: string;
  specificWorkout?: {
    day: string;
    originalTitle: string;
    newTitle: string;
    newDescription: string;
    newIntensity: string;
  };
  currentRecovery: number | null;
  currentHRV?: number | null;
  completedWorkouts?: number;
  userProfile: {
    age: number;
    gender: string;
    weight: number;
    height: number;
    activityLevel: string;
    fitnessGoal: string;
  };
}

export interface ProgramFeedback {
  success: boolean;
  message: string;
  changes?: string[];
  recommendations?: string[];
  updatedProgram?: Partial<TrainingProgram>;
}

export interface NutritionData {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  meals: {
    name: string;
    calories: number;
    time: string;
  }[];
}

// Manual workout tracking
export interface ManualWorkout {
  id: string;
  title: string;
  description: string;
  sportType: string;
  intensity: string;
  startTime: Date;
  endTime?: Date;
  elapsedSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  lastResumeTime: Date;
}

// User Profile
export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // in kg
  height: number; // in cm
  bodyFat?: number; // percentage
  activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'extremelyActive';
  fitnessGoal: 'loseWeight' | 'maintainWeight' | 'gainMuscle' | 'improvePerformance';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  createdAt?: Date;
  updatedAt?: Date;
}

// Food log entry
export interface FoodLogEntry {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  createdAt: Date;
}

// Macro targets based on user profile
export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calculatedAt: Date;
}

// Nutrient deficiency analysis
export interface NutrientDeficiency {
  nutrient: string;
  description: string;
  foodSources: string;
}

// Nutrient analysis result
export interface NutrientAnalysis {
  summary: string;
  deficiencies: NutrientDeficiency[];
  recommendations: string[];
}

// Today's workout interface for dashboard
export interface TodaysWorkout {
  title: string;
  description: string;
  type: 'cardio' | 'strength' | 'recovery' | 'other';
  intensity: string;
  duration: string;
  day: string;
  programId: string;
  programName: string;
  adjustedForRecovery?: string | null;
  recoveryAdjustment?: string | null;
}

// Program progress interface
export interface ProgramProgress {
  progressPercentage: number;
  currentWeek: number;
  totalWeeks: number;
  daysUntilGoal: number | null;
  completedWorkouts: number;
  totalWorkouts: number;
}

// Add to constants/colors.ts
declare module '@/constants/colors' {
  interface Colors {
    recovery: {
      low: string;
      medium: string;
      high: string;
    };
  }
}