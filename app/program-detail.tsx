import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
  useWindowDimensions,
  TextInput,
  SafeAreaView,
  StatusBar as RNStatusBar
} from 'react-native';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  Calendar, 
  ChevronLeft,
  Trophy,
  Check,
  Clock,
  Dumbbell,
  Heart,
  Activity,
  ArrowRight,
  Brain,
  ChevronDown,
  ChevronUp,
  Info,
  Play,
  Pause,
  StopCircle,
  Timer,
  CheckCircle2,
  Share2,
  X,
  Utensils,
  Flame,
  Scale,
  Edit3,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Target,
  Eye,
  Zap,
  Users,
  MapPin
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useWhoopStore } from '@/store/whoopStore';
import { TrainingProgram, NutritionPlan, ProgramUpdateRequest, ProgramFeedback } from '@/types/whoop';
import NutritionTracker from '@/components/NutritionTracker';

// Define workout type
interface Workout {
  day: string;
  title: string;
  description: string;
  intensity: string;
  adjustedForRecovery: string | null;
  type: 'cardio' | 'strength' | 'recovery' | 'other';
  completed?: boolean;
  duration?: string;
  equipment?: string[];
  exercises?: {
    name: string;
    sets?: string;
    reps?: string;
    duration?: string;
    notes?: string;
  }[];
  tips?: string[];
  modifications?: string[];
  targetHeartRate?: string;
  caloriesBurned?: string;
}

export default function ProgramDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const programId = params.id as string;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const { 
    activePrograms, 
    data, 
    isConnectedToWhoop, 
    userProfile, 
    macroTargets,
    calculateMacroTargets,
    updateProgram,
    requestProgramUpdate,
    getProgramFeedback
  } = useWhoopStore();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [today] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  
  // State for collapsible sections
  const [weeklyPlanExpanded, setWeeklyPlanExpanded] = useState(true);
  const [nutritionExpanded, setNutritionExpanded] = useState(false);
  const [recoveryExpanded, setRecoveryExpanded] = useState(false);
  const [aiPlanExpanded, setAiPlanExpanded] = useState(false);
  const [nutritionTrackerExpanded, setNutritionTrackerExpanded] = useState(false);
  
  // Manual workout tracking state
  const [activeWorkout, setActiveWorkout] = useState<{
    workout: Workout;
    startTime: Date;
    elapsedTime: number;
    isRunning: boolean;
  } | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Track completed workouts
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);
  
  // Workout summary state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<{
    workout: Workout;
    startTime: Date;
    endTime: Date;
    duration: number;
  } | null>(null);
  
  // Program personalization state
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [personalizationRequest, setPersonalizationRequest] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [programFeedback, setProgramFeedback] = useState<ProgramFeedback | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Workout editing state
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false);
  const [selectedWorkoutForEdit, setSelectedWorkoutForEdit] = useState<Workout | null>(null);
  const [editedWorkout, setEditedWorkout] = useState<Partial<Workout>>({});
  
  // Workout detail overview state
  const [showWorkoutDetailModal, setShowWorkoutDetailModal] = useState(false);
  const [selectedWorkoutForDetail, setSelectedWorkoutForDetail] = useState<Workout | null>(null);
  
  // Get the current recovery status to adjust workout recommendations
  const latestRecovery = data.recovery[0] || null;
  const recoveryStatus = latestRecovery?.status || 'medium';
  
  // Calculate column width based on screen size
  const getColumnWidth = () => {
    // For smaller screens, make columns take up more width
    if (screenWidth < 375) {
      return screenWidth * 0.85; // 85% of screen width
    } else if (screenWidth < 768) {
      return screenWidth * 0.75; // 75% of screen width
    } else {
      return 280; // Default width for larger screens
    }
  };
  
  const columnWidth = getColumnWidth();
  
  useEffect(() => {
    if (programId) {
      const foundProgram = activePrograms.find(p => p.id === programId);
      if (foundProgram) {
        setProgram(foundProgram);
        
        // Check if we have an AI plan
        if (foundProgram.aiPlan) {
          setAiPlan(foundProgram.aiPlan);
        }
        
        // Check if we have a nutrition plan
        if (foundProgram.nutritionPlan) {
          setNutritionPlan(foundProgram.nutritionPlan);
        } else if (macroTargets) {
          // If no nutrition plan but we have macro targets, create one from user profile
          setNutritionPlan({
            calories: macroTargets.calories,
            protein: macroTargets.protein,
            carbs: macroTargets.carbs,
            fat: macroTargets.fat,
            recommendations: generateNutritionRecommendations(foundProgram.type, userProfile.fitnessGoal)
          });
        }
        
        // Calculate current week based on start date
        if (foundProgram.startDate) {
          try {
            const startDate = new Date(foundProgram.startDate);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const weekNumber = Math.floor(diffDays / 7) + 1;
            setCurrentWeek(Math.max(1, weekNumber)); // Ensure week is at least 1
          } catch (error) {
            console.error("Error calculating current week:", error);
            setCurrentWeek(1); // Default to week 1 if there's an error
          }
        }
        
        setIsLoading(false);
      }
    }
  }, [programId, activePrograms]);
  
  // Update nutrition plan when macroTargets change
  useEffect(() => {
    if (program && macroTargets && (!nutritionPlan || !nutritionPlan.calories)) {
      setNutritionPlan({
        calories: macroTargets.calories,
        protein: macroTargets.protein,
        carbs: macroTargets.carbs,
        fat: macroTargets.fat,
        recommendations: generateNutritionRecommendations(program.type, userProfile.fitnessGoal)
      });
    }
  }, [macroTargets, program]);
  
  // Timer effect for workout tracking
  useEffect(() => {
    if (activeWorkout && activeWorkout.isRunning) {
      const interval = setInterval(() => {
        setActiveWorkout(prev => {
          if (!prev) return null;
          return {
            ...prev,
            elapsedTime: Math.floor((new Date().getTime() - prev.startTime.getTime()) / 1000)
          };
        });
      }, 1000);
      
      setTimerInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [activeWorkout?.isRunning]);
  
  // Calculate macro targets if not already calculated
  useEffect(() => {
    if (!macroTargets && userProfile.name) {
      calculateMacroTargets();
    }
  }, [userProfile]);
  
  // Generate nutrition recommendations based on program type and fitness goal
  const generateNutritionRecommendations = (programType: string, fitnessGoal: string): string[] => {
    const recommendations: string[] = [];
    
    // General recommendations for all program types
    recommendations.push("Stay hydrated by drinking at least 2-3 liters of water daily.");
    recommendations.push("Aim to eat 3-4 hours before intense training sessions.");
    
    // Program-specific recommendations
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
      // General fitness / heart health
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
  };
  
  // Generate weekly workout plan based on program type and recovery status
  const generateWorkoutPlan = (): Workout[] => {
    // If we have an AI-generated plan, use that
    if (aiPlan && aiPlan.phases && Array.isArray(aiPlan.phases) && aiPlan.phases.length > 0) {
      try {
        // Find the current phase based on the current week
        let currentPhase = aiPlan.phases[0];
        let weekCounter = 0;
        
        for (const phase of aiPlan.phases) {
          if (!phase || !phase.duration) continue;
          
          const durationMatch = phase.duration.match(/\d+/);
          const phaseDuration = durationMatch ? parseInt(durationMatch[0], 10) : 4;
          
          if (currentWeek > weekCounter && currentWeek <= weekCounter + phaseDuration) {
            currentPhase = phase;
            break;
          }
          weekCounter += phaseDuration;
        }
        
        // Use the weekly structure from the current phase
        if (currentPhase && currentPhase.weeklyStructure && Array.isArray(currentPhase.weeklyStructure)) {
          return currentPhase.weeklyStructure
            .filter((workout: any) => workout && typeof workout === 'object')
            .map((workout: any) => {
              try {
                return enhanceWorkoutWithDetails(workout);
              } catch (error) {
                console.error('Error enhancing workout:', error);
                return {
                  day: workout.day || 'Monday',
                  title: workout.title || 'Training Session',
                  description: workout.description || 'Training session',
                  intensity: workout.intensity || 'Medium',
                  type: workout.type || 'other',
                  adjustedForRecovery: null
                };
              }
            });
        }
      } catch (error) {
        console.error('Error processing AI plan:', error);
      }
    }
    
    // Fallback to default workout plan if no AI plan is available
    const workouts: Workout[] = [];
    const daysPerWeek = program?.trainingDaysPerWeek || 4;
    
    // Adjust intensity based on recovery status
    const intensityAdjustment: Record<string, string> = {
      low: "Reduce intensity by 20-30%. Focus on technique and recovery.",
      medium: "Maintain planned intensity. Listen to your body during the session.",
      high: "You can push slightly harder today if you feel good."
    };
    
    if (program?.type === 'marathon' || program?.type === 'half-marathon') {
      // Marathon training plan - explicitly separate cardio and strength
      
      // Monday - Recovery Run (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Monday",
        title: "Recovery Run",
        description: "Easy 30-45 minute run at conversational pace (Zone 2)",
        intensity: "Low",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce to 20-30 minutes or take as rest day" : null,
        type: 'cardio'
      }));
      
      // Monday - Core Strength (Strength)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Monday",
        title: "Core Strength",
        description: "15-20 minutes of core exercises: planks, Russian twists, and leg raises",
        intensity: "Low",
        adjustedForRecovery: null,
        type: 'strength'
      }));
      
      // Tuesday - Speed Work (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Tuesday",
        title: "Speed Work",
        description: "8-10 x 400m repeats at 5K pace with 200m recovery jog",
        intensity: "High",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce to 4-6 repeats or swap with Thursday" : null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 5) {
        // Wednesday - Easy Run (Cardio)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Wednesday",
          title: "Easy Run",
          description: "40-50 minute easy run (Zone 2)",
          intensity: "Low",
          adjustedForRecovery: null,
          type: 'cardio'
        }));
        
        // Wednesday - Upper Body (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Wednesday",
          title: "Upper Body Strength",
          description: "Push-ups, rows, and shoulder exercises to maintain upper body strength",
          intensity: "Medium",
          adjustedForRecovery: recoveryStatus === 'low' ? "Reduce volume by 30%" : null,
          type: 'strength'
        }));
      }
      
      // Thursday - Tempo Run (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Thursday",
        title: "Tempo Run",
        description: "15 minute warm-up, 20 minutes at threshold pace, 10 minute cool-down",
        intensity: "Medium",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce tempo portion to 10-15 minutes" : null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 6) {
        // Friday - Recovery Run (Cardio)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Friday",
          title: "Recovery Run",
          description: "30 minute very easy run or cross-training",
          intensity: "Low",
          adjustedForRecovery: null,
          type: 'cardio'
        }));
        
        // Friday - Lower Body (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Friday",
          title: "Lower Body Strength",
          description: "Bodyweight squats, lunges, and calf raises to support running form",
          intensity: "Low",
          adjustedForRecovery: null,
          type: 'strength'
        }));
      }
      
      // Saturday - Long Run (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Saturday",
        title: "Long Run",
        description: `${8 + currentWeek} miles at easy pace (Zone 2)`,
        intensity: "Medium",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce distance by 20% or postpone to Sunday" : null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 4) {
        // Sunday - Rest or Cross-Train (Recovery)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Sunday",
          title: "Rest or Cross-Train",
          description: "Complete rest or light cross-training (swimming, cycling, yoga)",
          intensity: "Very Low",
          adjustedForRecovery: null,
          type: 'recovery'
        }));
      }
    } else if (program?.type === 'powerlifting' || program?.type === 'hypertrophy') {
      // Strength training plan - explicitly separate cardio and strength
      
      // Monday - Squat Focus (Strength)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Monday",
        title: "Squat Focus",
        description: "Back Squat 5x5, Leg Press 3x8-10, Romanian Deadlift 3x8-10, Core work",
        intensity: "High",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce volume to 3x5 for main lift, reduce weight by 10%" : null,
        type: 'strength'
      }));
      
      // Monday - Light Cardio (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Monday",
        title: "Recovery Cardio",
        description: "15-20 minutes of Zone 2 cardio to improve recovery",
        intensity: "Low",
        adjustedForRecovery: null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 4) {
        // Tuesday - Upper Body Push (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Tuesday",
          title: "Upper Body Push",
          description: "Bench Press 5x5, Incline DB Press 3x8-10, Shoulder Press 3x8-10, Triceps",
          intensity: "Medium-High",
          adjustedForRecovery: recoveryStatus === 'low' ? "Reduce to 3x5 main lift, focus on technique" : null,
          type: 'strength'
        }));
      }
      
      // Wednesday - Rest or Active Recovery (Recovery)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Wednesday",
        title: "Rest or Active Recovery",
        description: "Complete rest or light mobility work",
        intensity: "Very Low",
        adjustedForRecovery: null,
        type: 'recovery'
      }));
      
      if (daysPerWeek >= 5) {
        // Thursday - Deadlift Focus (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Thursday",
          title: "Deadlift Focus",
          description: "Deadlift 4x5, Pull-ups 4x8, Barbell Rows 3x8-10, Core work",
          intensity: "High",
          adjustedForRecovery: recoveryStatus === 'low' ? "Reduce to 3x3 deadlifts, lower intensity" : null,
          type: 'strength'
        }));
        
        // Thursday - HIIT Cardio (Cardio)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Thursday",
          title: "HIIT Session",
          description: "15 minutes of high-intensity intervals (30s on, 30s off)",
          intensity: "Medium",
          adjustedForRecovery: recoveryStatus === 'low' ? "Skip or reduce to light cardio" : null,
          type: 'cardio'
        }));
      }
      
      // Friday - Upper Body Pull (Strength)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Friday",
        title: "Upper Body Pull",
        description: "Weighted Pull-ups 4x6-8, Rows 4x8-10, Face Pulls 3x12-15, Biceps",
        intensity: "Medium",
        adjustedForRecovery: recoveryStatus === 'low' ? "Use lighter weights, focus on mind-muscle connection" : null,
        type: 'strength'
      }));
      
      if (daysPerWeek >= 6) {
        // Saturday - Accessory Day (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Saturday",
          title: "Accessory Day",
          description: "Lunges, Dips, Lateral Raises, Arm work, Core training",
          intensity: "Medium-Low",
          adjustedForRecovery: null,
          type: 'strength'
        }));
        
        // Saturday - Steady State Cardio (Cardio)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Saturday",
          title: "Steady State Cardio",
          description: "30 minutes of Zone 2 cardio for recovery and cardiovascular health",
          intensity: "Low",
          adjustedForRecovery: null,
          type: 'cardio'
        }));
      }
      
      // Sunday - Rest Day (Recovery)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Sunday",
        title: "Rest Day",
        description: "Complete rest, focus on nutrition and recovery",
        intensity: "None",
        adjustedForRecovery: null,
        type: 'recovery'
      }));
    } else if (program?.type === 'weight_loss') {
      // Weight loss plan - explicitly separate cardio and strength
      
      // Monday - Full Body Strength (Strength)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Monday",
        title: "Full Body Strength",
        description: "Circuit: Squats, Push-ups, Rows, Lunges, Planks (3 rounds)",
        intensity: "Medium-High",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce to 2 rounds, longer rest periods" : null,
        type: 'strength'
      }));
      
      // Tuesday - HIIT Cardio (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Tuesday",
        title: "HIIT Cardio",
        description: "30 seconds work, 30 seconds rest x 10 exercises, 3 rounds",
        intensity: "High",
        adjustedForRecovery: recoveryStatus === 'low' ? "Switch to steady-state cardio at moderate intensity" : null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 5) {
        // Wednesday - Active Recovery (Recovery)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Wednesday",
          title: "Active Recovery",
          description: "30-45 minute walk or light yoga",
          intensity: "Low",
          adjustedForRecovery: null,
          type: 'recovery'
        }));
      }
      
      // Thursday - Upper Body Focus (Strength)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Thursday",
        title: "Upper Body Focus",
        description: "Push-ups, Rows, Shoulder Press, Bicep/Tricep work (3-4 sets each)",
        intensity: "Medium",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce volume by 30%, focus on form" : null,
        type: 'strength'
      }));
      
      if (daysPerWeek >= 6) {
        // Friday - Steady-State Cardio (Cardio)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Friday",
          title: "Steady-State Cardio",
          description: "45-60 minutes Zone 2 cardio (jogging, cycling, elliptical)",
          intensity: "Medium-Low",
          adjustedForRecovery: null,
          type: 'cardio'
        }));
      }
      
      // Saturday - Lower Body Focus (Strength)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Saturday",
        title: "Lower Body Focus",
        description: "Squats, Lunges, Deadlifts, Calf Raises (3-4 sets each)",
        intensity: "Medium-High",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce weight by 20%, focus on mobility" : null,
        type: 'strength'
      }));
      
      // Saturday - Cardio Finisher (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Saturday",
        title: "Cardio Finisher",
        description: "20 minutes of moderate intensity cardio after strength training",
        intensity: "Medium",
        adjustedForRecovery: null,
        type: 'cardio'
      }));
      
      // Sunday - Rest Day (Recovery)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Sunday",
        title: "Rest Day",
        description: "Complete rest, focus on meal prep for the week",
        intensity: "None",
        adjustedForRecovery: null,
        type: 'recovery'
      }));
    } else {
      // General fitness / heart health - explicitly separate cardio and strength
      
      // Monday - Zone 2 Cardio (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Monday",
        title: "Zone 2 Cardio",
        description: "45 minutes at 60-70% max heart rate (conversational pace)",
        intensity: "Low-Medium",
        adjustedForRecovery: null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 4) {
        // Tuesday - Strength Circuit (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Tuesday",
          title: "Strength Circuit",
          description: "Full body circuit with minimal rest between exercises",
          intensity: "Medium",
          adjustedForRecovery: recoveryStatus === 'low' ? "Increase rest periods, reduce weight" : null,
          type: 'strength'
        }));
      }
      
      // Wednesday - Interval Training (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Wednesday",
        title: "Interval Training",
        description: "5 x 3 minutes at 80-85% max HR with 2 minute recovery",
        intensity: "High",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce to 3 intervals or swap with Monday" : null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 5) {
        // Thursday - Active Recovery (Recovery)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Thursday",
          title: "Active Recovery",
          description: "30 minute walk, yoga, or light mobility work",
          intensity: "Very Low",
          adjustedForRecovery: null,
          type: 'recovery'
        }));
        
        // Thursday - Core & Mobility (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Thursday",
          title: "Core & Mobility",
          description: "20 minutes of core exercises and mobility drills",
          intensity: "Low",
          adjustedForRecovery: null,
          type: 'strength'
        }));
      }
      
      // Friday - Tempo Session (Cardio)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Friday",
        title: "Tempo Session",
        description: "30 minutes at 70-75% max HR (comfortably hard pace)",
        intensity: "Medium",
        adjustedForRecovery: recoveryStatus === 'low' ? "Reduce to 20 minutes or lower intensity" : null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 6) {
        // Saturday - Long Cardio Session (Cardio)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Saturday",
          title: "Long Cardio Session",
          description: "75-90 minutes at Zone 2 (60-70% max HR)",
          intensity: "Medium-Low",
          adjustedForRecovery: recoveryStatus === 'low' ? "Reduce duration by 30%" : null,
          type: 'cardio'
        }));
        
        // Saturday - Full Body Strength (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Saturday",
          title: "Full Body Strength",
          description: "Compound movements: squats, push-ups, rows, lunges (2-3 sets each)",
          intensity: "Medium",
          adjustedForRecovery: null,
          type: 'strength'
        }));
      }
      
      // Sunday - Rest Day (Recovery)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Sunday",
        title: "Rest Day",
        description: "Complete rest or very light activity",
        intensity: "None",
        adjustedForRecovery: null,
        type: 'recovery'
      }));
    }
    
    return workouts;
  };
  
  // Enhance workout with detailed information
  const enhanceWorkoutWithDetails = (workout: any): Workout => {
    if (!workout || typeof workout !== 'object') {
      return {
        day: 'Monday',
        title: 'Training Session',
        description: 'Training session',
        intensity: 'Medium',
        type: 'other',
        adjustedForRecovery: null
      };
    }
    
    const safeWorkout = {
      day: workout.day || 'Monday',
      title: workout.title || 'Training Session',
      description: workout.description || 'Training session',
      intensity: workout.intensity || 'Medium',
      type: workout.type || 'other',
      adjustedForRecovery: workout.adjustedForRecovery || null
    };
    
    try {
      const enhanced: Workout = {
        ...safeWorkout,
        duration: generateDuration(safeWorkout.type, safeWorkout.intensity),
        equipment: generateEquipment(safeWorkout.title, safeWorkout.type),
        exercises: generateExercises(safeWorkout.title, safeWorkout.type, safeWorkout.description),
        tips: generateTips(safeWorkout.type, safeWorkout.intensity),
        modifications: generateModifications(safeWorkout.type, safeWorkout.intensity),
        targetHeartRate: generateTargetHeartRate(safeWorkout.type, safeWorkout.intensity),
        caloriesBurned: generateCaloriesBurned(safeWorkout.type, safeWorkout.intensity)
      };
      
      return enhanced;
    } catch (error) {
      console.error('Error enhancing workout details:', error);
      return safeWorkout;
    }
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
      } else if (title.toLowerCase().includes('upper body push')) {
        exercises.push(
          { name: 'Bench Press', sets: '5', reps: '5', notes: 'Control the descent' },
          { name: 'Incline Dumbbell Press', sets: '3', reps: '8-10', notes: 'Squeeze at the top' },
          { name: 'Shoulder Press', sets: '3', reps: '8-10', notes: 'Keep core tight' },
          { name: 'Tricep Dips', sets: '3', reps: '8-12', notes: 'Full range of motion' }
        );
      } else if (title.toLowerCase().includes('upper body pull')) {
        exercises.push(
          { name: 'Weighted Pull-ups', sets: '4', reps: '6-8', notes: 'Full hang to chin over bar' },
          { name: 'Barbell Rows', sets: '4', reps: '8-10', notes: 'Squeeze shoulder blades' },
          { name: 'Face Pulls', sets: '3', reps: '12-15', notes: 'Focus on rear delts' },
          { name: 'Bicep Curls', sets: '3', reps: '10-12', notes: 'Control the negative' }
        );
      } else if (title.toLowerCase().includes('deadlift')) {
        exercises.push(
          { name: 'Deadlift', sets: '4', reps: '5', notes: 'Keep bar close to body' },
          { name: 'Pull-ups', sets: '4', reps: '8', notes: 'Use assistance if needed' },
          { name: 'Barbell Rows', sets: '3', reps: '8-10', notes: 'Pull to lower chest' },
          { name: 'Plank Hold', sets: '3', duration: '30-60 seconds', notes: 'Maintain straight line' }
        );
      } else if (title.toLowerCase().includes('full body')) {
        exercises.push(
          { name: 'Squats', sets: '3', reps: '12-15', notes: 'Bodyweight or weighted' },
          { name: 'Push-ups', sets: '3', reps: '10-15', notes: 'Modify on knees if needed' },
          { name: 'Bent-over Rows', sets: '3', reps: '12-15', notes: 'Use dumbbells or resistance band' },
          { name: 'Lunges', sets: '3', reps: '10 each leg', notes: 'Step back or forward' },
          { name: 'Plank', sets: '3', duration: '30-45 seconds', notes: 'Keep hips level' }
        );
      } else if (title.toLowerCase().includes('core')) {
        exercises.push(
          { name: 'Plank', sets: '3', duration: '30-60 seconds', notes: 'Keep body straight' },
          { name: 'Russian Twists', sets: '3', reps: '20', notes: 'Touch floor on each side' },
          { name: 'Leg Raises', sets: '3', reps: '12-15', notes: 'Control the descent' },
          { name: 'Dead Bug', sets: '3', reps: '10 each side', notes: 'Keep lower back pressed down' }
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
      } else if (title.toLowerCase().includes('tempo')) {
        exercises.push(
          { name: 'Warm-up', duration: '15 minutes', notes: 'Easy pace, gradually building' },
          { name: 'Tempo Portion', duration: '20 minutes', notes: 'Comfortably hard pace' },
          { name: 'Cool-down', duration: '10 minutes', notes: 'Easy pace to finish' }
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
  
  const workoutPlan = generateWorkoutPlan();
  
  // Find today's workout
  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  // Find today's workouts - separate cardio and strength
  const todayWorkouts = workoutPlan.filter((workout: Workout) => workout.day === todayDay);
  
  // Categorize workouts by type
  const cardioWorkouts = todayWorkouts.filter((workout: Workout) => workout.type === 'cardio');
  const strengthWorkouts = todayWorkouts.filter((workout: Workout) => workout.type === 'strength');
  const recoveryWorkouts = todayWorkouts.filter((workout: Workout) => workout.type === 'recovery');
  const otherWorkouts = todayWorkouts.filter((workout: Workout) => workout.type === 'other');
  
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
  
  // Get icon based on workout title
  const getWorkoutIcon = (title: string, type: string) => {
    if (type === 'cardio') {
      return <Activity size={20} color={colors.textSecondary} />;
    } else if (type === 'strength') {
      return <Dumbbell size={20} color={colors.textSecondary} />;
    } else if (type === 'recovery') {
      return <Heart size={20} color={colors.textSecondary} />;
    } else {
      return <Clock size={20} color={colors.textSecondary} />;
    }
  };
  
  // Calculate days until goal
  const calculateDaysUntilGoal = () => {
    if (!program?.goalDate) return null;
    
    const goalDate = new Date(program.goalDate);
    const today = new Date();
    
    const diffTime = Math.abs(goalDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const daysUntilGoal = calculateDaysUntilGoal();

  // Format time for display (MM:SS or HH:MM:SS)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle starting a workout
  const handleStartWorkout = async (workout: Workout) => {
    if (activeWorkout) {
      Alert.alert(
        "Workout in Progress",
        "You already have an active workout. Would you like to end it and start a new one?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "End Current & Start New", 
            style: "destructive",
            onPress: () => {
              // End current workout
              handleEndWorkout();
              // Start new workout after a short delay
              setTimeout(() => {
                startManualWorkout(workout);
              }, 500);
            }
          }
        ]
      );
      return;
    }
    
    // Start manual tracking
    startManualWorkout(workout);
  };
  
  // Handle workout card click to show details
  const handleWorkoutCardClick = (workout: Workout) => {
    setSelectedWorkoutForDetail(workout);
    setShowWorkoutDetailModal(true);
  };
  
  // Start manual workout tracking
  const startManualWorkout = (workout: Workout) => {
    const now = new Date();
    setActiveWorkout({
      workout,
      startTime: now,
      elapsedTime: 0,
      isRunning: true
    });
    setShowWorkoutModal(true);
  };
  
  // Pause/resume the workout timer
  const toggleWorkoutTimer = () => {
    if (!activeWorkout) return;
    
    setActiveWorkout(prev => {
      if (!prev) return null;
      
      if (prev.isRunning) {
        // Pausing - store current elapsed time
        return {
          ...prev,
          isRunning: false
        };
      } else {
        // Resuming - adjust start time to account for paused time
        const pausedTime = prev.elapsedTime;
        const newStartTime = new Date(new Date().getTime() - (pausedTime * 1000));
        
        return {
          ...prev,
          startTime: newStartTime,
          isRunning: true
        };
      }
    });
  };
  
  // End the workout
  const handleEndWorkout = () => {
    if (!activeWorkout) return;
    
    const endTime = new Date();
    const durationSeconds = activeWorkout.elapsedTime;
    
    // Stop the timer
    setActiveWorkout(prev => prev ? { ...prev, isRunning: false } : null);
    
    // Create workout summary
    setWorkoutSummary({
      workout: activeWorkout.workout,
      startTime: activeWorkout.startTime,
      endTime: endTime,
      duration: durationSeconds
    });
    
    // Mark workout as completed
    setCompletedWorkouts(prev => [...prev, `${activeWorkout.workout.day}-${activeWorkout.workout.title}`]);
    
    // Hide workout modal and show summary modal
    setShowWorkoutModal(false);
    setShowSummaryModal(true);
    
    // Reset active workout
    setActiveWorkout(null);
  };
  
  // Handle manual logging to WHOOP
  const handleLogToWhoop = () => {
    if (!workoutSummary) return;
    
    Alert.alert(
      "Manual WHOOP Logging",
      "Please open your WHOOP app and manually log this workout with the following details:\n\n" +
      `Workout: ${workoutSummary.workout.title}\n` +
      `Start: ${formatDate(workoutSummary.startTime)}\n` +
      `End: ${formatDate(workoutSummary.endTime)}\n` +
      `Duration: ${formatTime(workoutSummary.duration)}`,
      [{ text: "OK" }]
    );
  };
  
  // Handle personalization request submission
  const handleSubmitPersonalizationRequest = async () => {
    if (!personalizationRequest.trim() || !program) {
      Alert.alert("Missing Information", "Please enter your personalization request");
      return;
    }
    
    setIsSubmittingRequest(true);
    
    try {
      // Create update request
      const updateRequest: ProgramUpdateRequest = {
        programId: program.id,
        requestText: personalizationRequest,
        currentRecovery: latestRecovery?.score || null,
        currentHRV: latestRecovery?.hrvMs || null,
        completedWorkouts: completedWorkouts.length,
        userProfile: {
          age: userProfile.age,
          gender: userProfile.gender,
          weight: userProfile.weight,
          height: userProfile.height,
          activityLevel: userProfile.activityLevel,
          fitnessGoal: userProfile.fitnessGoal
        }
      };
      
      // Submit request
      const feedback = await requestProgramUpdate(updateRequest);
      
      // Set feedback and show feedback modal
      setProgramFeedback(feedback);
      setShowPersonalizeModal(false);
      setShowFeedbackModal(true);
      
      // Reset personalization request
      setPersonalizationRequest('');
      
      // Refresh program data after update
      if (feedback.success) {
        const updatedProgram = activePrograms.find(p => p.id === program.id);
        if (updatedProgram) {
          setProgram(updatedProgram);
          if (updatedProgram.aiPlan) {
            setAiPlan(updatedProgram.aiPlan);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting personalization request:', error);
      Alert.alert(
        "Error",
        "There was an error submitting your personalization request. Please try again."
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };
  
  // Handle workout edit
  const handleEditWorkout = (workout: Workout) => {
    setSelectedWorkoutForEdit(workout);
    setEditedWorkout({
      title: workout.title,
      description: workout.description,
      intensity: workout.intensity
    });
    setShowEditWorkoutModal(true);
  };
  
  // Save edited workout
  const saveEditedWorkout = () => {
    if (!selectedWorkoutForEdit || !program) return;
    
    // Create update request for the specific workout
    const updateRequest: ProgramUpdateRequest = {
      programId: program.id,
      requestText: `Update the "${selectedWorkoutForEdit.title}" workout on ${selectedWorkoutForEdit.day} to: Title: ${editedWorkout.title}, Description: ${editedWorkout.description}, Intensity: ${editedWorkout.intensity}`,
      specificWorkout: {
        day: selectedWorkoutForEdit.day,
        originalTitle: selectedWorkoutForEdit.title,
        newTitle: editedWorkout.title || selectedWorkoutForEdit.title,
        newDescription: editedWorkout.description || selectedWorkoutForEdit.description,
        newIntensity: editedWorkout.intensity || selectedWorkoutForEdit.intensity
      },
      currentRecovery: latestRecovery?.score || null,
      userProfile: {
        age: userProfile.age,
        gender: userProfile.gender,
        weight: userProfile.weight,
        height: userProfile.height,
        activityLevel: userProfile.activityLevel,
        fitnessGoal: userProfile.fitnessGoal
      }
    };
    
    // Submit the update request
    requestProgramUpdate(updateRequest)
      .then(feedback => {
        // If successful, update the local workout plan
        if (feedback.success) {
          // This is a temporary update for the UI - the actual program will be updated in the store
          const updatedWorkout = {
            ...selectedWorkoutForEdit,
            title: editedWorkout.title || selectedWorkoutForEdit.title,
            description: editedWorkout.description || selectedWorkoutForEdit.description,
            intensity: editedWorkout.intensity || selectedWorkoutForEdit.intensity
          };
          
          // Refresh program data after update
          const updatedProgram = activePrograms.find(p => p.id === program.id);
          if (updatedProgram) {
            setProgram(updatedProgram);
            if (updatedProgram.aiPlan) {
              setAiPlan(updatedProgram.aiPlan);
            }
          }
          
          // Show success message
          Alert.alert(
            "Workout Updated",
            "Your workout has been successfully updated.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Update Failed",
            feedback.message || "Failed to update workout. Please try again.",
            [{ text: "OK" }]
          );
        }
      })
      .catch(error => {
        console.error('Error updating workout:', error);
        Alert.alert(
          "Error",
          "There was an error updating the workout. Please try again.",
          [{ text: "OK" }]
        );
      })
      .finally(() => {
        setShowEditWorkoutModal(false);
        setSelectedWorkoutForEdit(null);
        setEditedWorkout({});
      });
  };

  // Render a single workout card
  const renderWorkoutCard = (workout: Workout) => {
    if (!workout || typeof workout !== 'object') {
      return null;
    }
    
    const safeWorkout = {
      day: workout.day || 'Day',
      title: workout.title || 'Training Session',
      description: workout.description || 'Training session',
      intensity: workout.intensity || 'Medium',
      type: workout.type || 'other',
      duration: workout.duration || '30-45 minutes',
      adjustedForRecovery: workout.adjustedForRecovery || null
    };
    
    const isCompleted = completedWorkouts.includes(`${safeWorkout.day}-${safeWorkout.title}`);
    
    return (
      <TouchableOpacity 
        style={styles.workoutCard} 
        key={`${safeWorkout.day}-${safeWorkout.title}-${Date.now()}`}
        onPress={() => handleWorkoutCardClick(safeWorkout as Workout)}
        activeOpacity={0.7}
      >
        <View style={styles.workoutHeader}>
          <View style={styles.workoutTitleContainer}>
            {getWorkoutIcon(safeWorkout.title, safeWorkout.type)}
            <Text style={styles.workoutTitle} numberOfLines={1} ellipsizeMode="tail">
              {safeWorkout.title}
            </Text>
          </View>
          <View style={[
            styles.intensityBadge,
            { backgroundColor: getIntensityColor(safeWorkout.intensity) }
          ]}>
            <Text style={styles.intensityText}>{safeWorkout.intensity}</Text>
          </View>
        </View>
        
        <Text style={styles.workoutDescription} numberOfLines={3} ellipsizeMode="tail">
          {safeWorkout.description}
        </Text>
        
        {safeWorkout.duration && (
          <View style={styles.workoutMetaInfo}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.workoutMetaText}>{safeWorkout.duration}</Text>
          </View>
        )}
        
        {safeWorkout.adjustedForRecovery && (
          <View style={styles.adjustmentContainer}>
            <Text style={styles.adjustmentTitle}>Recovery Adjustment:</Text>
            <Text style={styles.adjustmentText} numberOfLines={2} ellipsizeMode="tail">
              {safeWorkout.adjustedForRecovery}
            </Text>
          </View>
        )}
        
        <View style={styles.workoutButtonsRow}>
          <TouchableOpacity 
            style={[
              styles.startWorkoutButton,
              isCompleted && styles.completedWorkoutButton
            ]}
            onPress={(e) => {
              e.stopPropagation();
              isCompleted ? null : handleStartWorkout(safeWorkout as Workout);
            }}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <>
                <Check size={18} color={colors.text} />
                <Text style={styles.startWorkoutText}>Completed</Text>
              </>
            ) : (
              <>
                <Text style={styles.startWorkoutText}>Start</Text>
                <ArrowRight size={18} color={colors.text} />
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.editWorkoutButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEditWorkout(safeWorkout as Workout);
            }}
          >
            <Edit3 size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.clickHint}>
          <Eye size={14} color={colors.textSecondary} />
          <Text style={styles.clickHintText}>Tap for details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <StatusBar style="light" />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {program?.name || 'Program Details'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading || !program ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading program details...</Text>
            </View>
          ) : (
            <>
              {/* Program Summary Card */}
              <View style={styles.programSummary}>
                <View style={styles.summaryItem}>
                  <Calendar size={20} color={colors.primary} />
                  <Text style={styles.summaryLabel}>Goal Date</Text>
                  <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="tail">
                    {program.goalDate || 'Not set'}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Trophy size={20} color={colors.primary} />
                  <Text style={styles.summaryLabel}>Target</Text>
                  <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="tail">
                    {program.targetMetric || 'Not set'}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Dumbbell size={20} color={colors.primary} />
                  <Text style={styles.summaryLabel}>Experience</Text>
                  <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="tail">
                    {program.experienceLevel.charAt(0).toUpperCase() + program.experienceLevel.slice(1)}
                  </Text>
                </View>
              </View>
              
              {/* Personalization Button */}
              <TouchableOpacity 
                style={styles.personalizeButton}
                onPress={() => setShowPersonalizeModal(true)}
              >
                <Edit3 size={20} color={colors.text} />
                <Text style={styles.personalizeButtonText}>Personalize Your Program</Text>
              </TouchableOpacity>
              
              {/* Goal Countdown */}
              {daysUntilGoal !== null && (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownLabel}>
                    {daysUntilGoal > 0 
                      ? `${daysUntilGoal} days until your goal` 
                      : "Today is your goal day!"}
                  </Text>
                  <View style={styles.countdownBar}>
                    <View 
                      style={[
                        styles.countdownFill, 
                        { 
                          width: `${Math.min(100, Math.max(0, 100 - (daysUntilGoal / 90) * 100))}%` 
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}
              
              {/* Recovery Status */}
              {isConnectedToWhoop && (
                <View style={styles.recoveryStatus}>
                  <Text style={styles.recoveryTitle}>Today&apos;s Recovery: {latestRecovery?.score || '--'}%</Text>
                  <View style={[
                    styles.recoveryIndicator, 
                    { backgroundColor: colors.recovery[recoveryStatus] }
                  ]} />
                  <Text style={styles.recoveryText}>
                    {recoveryStatus === 'high' 
                      ? "Your body is well recovered. You can push harder in today&apos;s workout."
                      : recoveryStatus === 'medium'
                        ? "Moderate recovery. Proceed with the planned workout but listen to your body."
                        : "Low recovery detected. Consider reducing intensity or taking a rest day."
                    }
                  </Text>
                </View>
              )}
              
              {/* Today's Workouts - Horizontal Layout */}
              {todayWorkouts.length > 0 && (
                <View style={styles.todayWorkout}>
                  <Text style={styles.todayTitle}>Today&apos;s Workout</Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScrollContent}
                  >
                    {/* Cardio Workouts */}
                    {cardioWorkouts.length > 0 && (
                      <View style={[styles.workoutColumn, { width: columnWidth }]}>
                        <Text style={styles.columnTitle}>Cardio</Text>
                        {cardioWorkouts.map(renderWorkoutCard)}
                      </View>
                    )}
                    
                    {/* Strength Workouts */}
                    {strengthWorkouts.length > 0 && (
                      <View style={[styles.workoutColumn, { width: columnWidth }]}>
                        <Text style={styles.columnTitle}>Strength</Text>
                        {strengthWorkouts.map(renderWorkoutCard)}
                      </View>
                    )}
                    
                    {/* Recovery Workouts */}
                    {recoveryWorkouts.length > 0 && (
                      <View style={[styles.workoutColumn, { width: columnWidth }]}>
                        <Text style={styles.columnTitle}>Recovery</Text>
                        {recoveryWorkouts.map(renderWorkoutCard)}
                      </View>
                    )}
                    
                    {/* Other Workouts */}
                    {otherWorkouts.length > 0 && (
                      <View style={[styles.workoutColumn, { width: columnWidth }]}>
                        <Text style={styles.columnTitle}>Other</Text>
                        {otherWorkouts.map(renderWorkoutCard)}
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
              
              {/* Weekly Plan - Collapsible */}
              <View style={styles.sectionContainer}>
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => setWeeklyPlanExpanded(!weeklyPlanExpanded)}
                >
                  <View style={styles.sectionTitleContainer}>
                    <Calendar size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Week {currentWeek} Plan</Text>
                  </View>
                  {weeklyPlanExpanded ? 
                    <ChevronUp size={20} color={colors.text} /> : 
                    <ChevronDown size={20} color={colors.text} />
                  }
                </TouchableOpacity>
                
                {weeklyPlanExpanded && (
                  <View style={styles.sectionContent}>
                    {workoutPlan && workoutPlan.length > 0 ? workoutPlan.map((workout: Workout, index: number) => {
                      if (!workout || typeof workout !== 'object') {
                        return null;
                      }
                      
                      return (
                        <View key={`workout-${index}-${workout.day || 'unknown'}`} style={styles.weeklyWorkout}>
                          <View style={styles.dayContainer}>
                            <Text style={styles.dayText}>{workout.day || 'Day'}</Text>
                            <View style={[
                              styles.intensityDot,
                              { backgroundColor: getIntensityColor(workout.intensity || 'Medium') }
                            ]} />
                          </View>
                          
                          <View style={styles.workoutDetails}>
                            <View style={styles.workoutTitleRow}>
                              <View style={styles.workoutTypeContainer}>
                                {getWorkoutIcon(workout.title || 'Workout', workout.type || 'other')}
                                <Text style={styles.weeklyWorkoutTitle} numberOfLines={1} ellipsizeMode="tail">
                                  {workout.title || 'Training Session'}
                                </Text>
                              </View>
                              {workout.day === todayDay && (
                                <View style={styles.todayBadge}>
                                  <Text style={styles.todayBadgeText}>TODAY</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.weeklyWorkoutDescription} numberOfLines={2} ellipsizeMode="tail">
                              {workout.description || 'Training session'}
                            </Text>
                          </View>
                          
                          <TouchableOpacity 
                            style={styles.editIconButton}
                            onPress={() => handleEditWorkout(workout)}
                          >
                            <Edit3 size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      );
                    }).filter(Boolean) : (
                      <View style={styles.noWorkoutsContainer}>
                        <Text style={styles.noWorkoutsText}>No workouts available for this week</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              
              {/* Nutrition Plan - Collapsible */}
              {(nutritionPlan || macroTargets) && (
                <View style={styles.sectionContainer}>
                  <TouchableOpacity 
                    style={styles.sectionHeader}
                    onPress={() => setNutritionExpanded(!nutritionExpanded)}
                  >
                    <View style={styles.sectionTitleContainer}>
                      <Utensils size={20} color={colors.primary} />
                      <Text style={styles.sectionTitle}>Nutrition Plan</Text>
                    </View>
                    {nutritionExpanded ? 
                      <ChevronUp size={20} color={colors.text} /> : 
                      <ChevronDown size={20} color={colors.text} />
                    }
                  </TouchableOpacity>
                  
                  {nutritionExpanded && (
                    <View style={styles.sectionContent}>
                      <View style={styles.nutritionSummary}>
                        <View style={styles.macroContainer}>
                          <View style={styles.macroItem}>
                            <Flame size={20} color={colors.primary} />
                            <Text style={styles.macroLabel}>Calories</Text>
                            <Text style={styles.macroValue}>{nutritionPlan?.calories || macroTargets?.calories || 0}</Text>
                          </View>
                          
                          <View style={styles.macroItem}>
                            <Text style={styles.macroCircle}>P</Text>
                            <Text style={styles.macroLabel}>Protein</Text>
                            <Text style={styles.macroValue}>{nutritionPlan?.protein || macroTargets?.protein || 0}g</Text>
                          </View>
                          
                          <View style={styles.macroItem}>
                            <Text style={styles.macroCircle}>C</Text>
                            <Text style={styles.macroLabel}>Carbs</Text>
                            <Text style={styles.macroValue}>{nutritionPlan?.carbs || macroTargets?.carbs || 0}g</Text>
                          </View>
                          
                          <View style={styles.macroItem}>
                            <Text style={styles.macroCircle}>F</Text>
                            <Text style={styles.macroLabel}>Fat</Text>
                            <Text style={styles.macroValue}>{nutritionPlan?.fat || macroTargets?.fat || 0}g</Text>
                          </View>
                        </View>
                        
                        {nutritionPlan?.recommendations && nutritionPlan.recommendations.length > 0 && (
                          <View style={styles.recommendationsContainer}>
                            <Text style={styles.recommendationsTitle}>Recommendations</Text>
                            
                            {nutritionPlan.recommendations.map((recommendation, index) => (
                              <View key={index} style={styles.recommendationItem}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.recommendationText} numberOfLines={3} ellipsizeMode="tail">
                                  {recommendation}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                        
                        <TouchableOpacity 
                          style={styles.nutritionButton}
                          onPress={() => router.push('/profile')}
                        >
                          <Text style={styles.nutritionButtonText}>
                            {userProfile.name ? "Update Profile & Nutrition Targets" : "Complete Profile for Personalized Targets"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              {/* Nutrition Tracker - Collapsible */}
              <View style={styles.sectionContainer}>
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => setNutritionTrackerExpanded(!nutritionTrackerExpanded)}
                >
                  <View style={styles.sectionTitleContainer}>
                    <Scale size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Nutrition Tracker</Text>
                  </View>
                  {nutritionTrackerExpanded ? 
                    <ChevronUp size={20} color={colors.text} /> : 
                    <ChevronDown size={20} color={colors.text} />
                  }
                </TouchableOpacity>
                
                {nutritionTrackerExpanded && (
                  <View style={styles.sectionContent}>
                    {userProfile && userProfile.name ? (
                      <NutritionTracker />
                    ) : (
                      <View style={styles.completeProfileContainer}>
                        <Text style={styles.completeProfileText}>
                          Complete your profile to access nutrition tracking
                        </Text>
                        <TouchableOpacity 
                          style={styles.completeProfileButton}
                          onPress={() => router.push('/profile')}
                        >
                          <Text style={styles.completeProfileButtonText}>Complete Profile</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
              
              {/* Recovery Strategies - Collapsible */}
              {aiPlan && aiPlan.recoveryStrategies && (
                <View style={styles.sectionContainer}>
                  <TouchableOpacity 
                    style={styles.sectionHeader}
                    onPress={() => setRecoveryExpanded(!recoveryExpanded)}
                  >
                    <View style={styles.sectionTitleContainer}>
                      <Heart size={20} color={colors.primary} />
                      <Text style={styles.sectionTitle}>Recovery Strategies</Text>
                    </View>
                    {recoveryExpanded ? 
                      <ChevronUp size={20} color={colors.text} /> : 
                      <ChevronDown size={20} color={colors.text} />
                    }
                  </TouchableOpacity>
                  
                  {recoveryExpanded && (
                    <View style={styles.sectionContent}>
                      <Text style={styles.sectionText}>{aiPlan.recoveryStrategies}</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Strength Training Configuration */}
              {program.strengthTraining && program.strengthTraining.enabled && (
                <View style={styles.strengthTrainingContainer}>
                  <View style={styles.strengthTrainingHeader}>
                    <Dumbbell size={18} color={colors.primary} />
                    <Text style={styles.strengthTrainingTitle}>Strength Training</Text>
                  </View>
                  <View style={styles.strengthTrainingDetails}>
                    <View style={styles.strengthTrainingDetail}>
                      <Text style={styles.strengthTrainingLabel}>Days per Week</Text>
                      <Text style={styles.strengthTrainingValue}>{program.strengthTraining.daysPerWeek}</Text>
                    </View>
                    <View style={styles.strengthTrainingDetail}>
                      <Text style={styles.strengthTrainingLabel}>Split</Text>
                      <Text style={styles.strengthTrainingValue} numberOfLines={1} ellipsizeMode="tail">
                        {program.strengthTraining.split === 'fullBody' ? 'Full Body' :
                         program.strengthTraining.split === 'upperLower' ? 'Upper/Lower' :
                         program.strengthTraining.split === 'pushPullLegs' ? 'Push/Pull/Legs' :
                         program.strengthTraining.split === 'bodyPart' ? 'Body Part Split' :
                         'Custom'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Nutrition Preferences */}
              {program.nutritionPreferences && (
                <View style={styles.nutritionPreferencesContainer}>
                  <View style={styles.nutritionPreferencesHeader}>
                    <Utensils size={18} color={colors.primary} />
                    <Text style={styles.nutritionPreferencesTitle}>Nutrition Preferences</Text>
                  </View>
                  <View style={styles.nutritionPreferencesDetails}>
                    <View style={styles.nutritionPreferencesDetail}>
                      <Text style={styles.nutritionPreferencesLabel}>Goal</Text>
                      <Text style={styles.nutritionPreferencesValue} numberOfLines={1} ellipsizeMode="tail">
                        {program.nutritionPreferences.goal === 'deficit' ? 'Weight Loss' :
                         program.nutritionPreferences.goal === 'maintain' ? 'Maintenance' :
                         'Muscle Gain'}
                      </Text>
                    </View>
                    {program.nutritionPreferences.dietaryRestrictions && program.nutritionPreferences.dietaryRestrictions.length > 0 && (
                      <View style={styles.nutritionPreferencesDetail}>
                        <Text style={styles.nutritionPreferencesLabel}>Dietary Restrictions</Text>
                        <Text style={styles.nutritionPreferencesValue} numberOfLines={1} ellipsizeMode="tail">
                          {program.nutritionPreferences.dietaryRestrictions.join(', ')}
                        </Text>
                      </View>
                    )}
                    {program.nutritionPreferences.mealFrequency && (
                      <View style={styles.nutritionPreferencesDetail}>
                        <Text style={styles.nutritionPreferencesLabel}>Meals per Day</Text>
                        <Text style={styles.nutritionPreferencesValue}>
                          {program.nutritionPreferences.mealFrequency}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => Alert.alert("Coming Soon", "Full program calendar view will be available in the next update.")}
              >
                <Calendar size={18} color={colors.text} />
                <Text style={styles.viewAllText}>View Full Program Calendar</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
        
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
              
              {selectedWorkoutForDetail && (
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.workoutDetailContainer}>
                    {/* Workout Header */}
                    <View style={styles.workoutDetailHeader}>
                      <View style={styles.workoutDetailTitleContainer}>
                        {getWorkoutIcon(selectedWorkoutForDetail.title, selectedWorkoutForDetail.type)}
                        <Text style={styles.workoutDetailTitle}>{selectedWorkoutForDetail.title}</Text>
                      </View>
                      <View style={[
                        styles.intensityBadge,
                        { backgroundColor: getIntensityColor(selectedWorkoutForDetail.intensity) }
                      ]}>
                        <Text style={styles.intensityText}>{selectedWorkoutForDetail.intensity}</Text>
                      </View>
                    </View>
                    
                    {/* Workout Overview */}
                    <View style={styles.workoutOverviewContainer}>
                      <Text style={styles.workoutDetailDescription}>
                        {selectedWorkoutForDetail.description}
                      </Text>
                      
                      {/* Quick Stats */}
                      <View style={styles.quickStatsContainer}>
                        {selectedWorkoutForDetail.duration && (
                          <View style={styles.quickStat}>
                            <Clock size={16} color={colors.primary} />
                            <Text style={styles.quickStatLabel}>Duration</Text>
                            <Text style={styles.quickStatValue}>{selectedWorkoutForDetail.duration}</Text>
                          </View>
                        )}
                        
                        {selectedWorkoutForDetail.targetHeartRate && (
                          <View style={styles.quickStat}>
                            <Heart size={16} color={colors.primary} />
                            <Text style={styles.quickStatLabel}>Target HR</Text>
                            <Text style={styles.quickStatValue}>{selectedWorkoutForDetail.targetHeartRate}</Text>
                          </View>
                        )}
                        
                        {selectedWorkoutForDetail.caloriesBurned && (
                          <View style={styles.quickStat}>
                            <Flame size={16} color={colors.primary} />
                            <Text style={styles.quickStatLabel}>Calories</Text>
                            <Text style={styles.quickStatValue}>{selectedWorkoutForDetail.caloriesBurned}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    {/* Equipment Needed */}
                    {selectedWorkoutForDetail.equipment && selectedWorkoutForDetail.equipment.length > 0 && (
                      <View style={styles.detailSection}>
                        <View style={styles.detailSectionHeader}>
                          <Dumbbell size={18} color={colors.primary} />
                          <Text style={styles.detailSectionTitle}>Equipment Needed</Text>
                        </View>
                        <View style={styles.equipmentList}>
                          {selectedWorkoutForDetail.equipment.map((item, index) => (
                            <View key={index} style={styles.equipmentItem}>
                              <View style={styles.bulletPoint} />
                              <Text style={styles.equipmentText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* Exercise Breakdown */}
                    {selectedWorkoutForDetail.exercises && selectedWorkoutForDetail.exercises.length > 0 && (
                      <View style={styles.detailSection}>
                        <View style={styles.detailSectionHeader}>
                          <Target size={18} color={colors.primary} />
                          <Text style={styles.detailSectionTitle}>Exercise Breakdown</Text>
                        </View>
                        <View style={styles.exerciseList}>
                          {selectedWorkoutForDetail.exercises.map((exercise, index) => (
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
                    )}
                    
                    {/* Tips */}
                    {selectedWorkoutForDetail.tips && selectedWorkoutForDetail.tips.length > 0 && (
                      <View style={styles.detailSection}>
                        <View style={styles.detailSectionHeader}>
                          <Zap size={18} color={colors.primary} />
                          <Text style={styles.detailSectionTitle}>Tips for Success</Text>
                        </View>
                        <View style={styles.tipsList}>
                          {selectedWorkoutForDetail.tips.map((tip, index) => (
                            <View key={index} style={styles.tipItem}>
                              <View style={styles.bulletPoint} />
                              <Text style={styles.tipText}>{tip}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* Modifications */}
                    {selectedWorkoutForDetail.modifications && selectedWorkoutForDetail.modifications.length > 0 && (
                      <View style={styles.detailSection}>
                        <View style={styles.detailSectionHeader}>
                          <Users size={18} color={colors.primary} />
                          <Text style={styles.detailSectionTitle}>Modifications</Text>
                        </View>
                        <View style={styles.modificationsList}>
                          {selectedWorkoutForDetail.modifications.map((modification, index) => (
                            <View key={index} style={styles.modificationItem}>
                              <View style={styles.bulletPoint} />
                              <Text style={styles.modificationText}>{modification}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* Recovery Adjustment */}
                    {selectedWorkoutForDetail.adjustedForRecovery && (
                      <View style={styles.detailSection}>
                        <View style={styles.detailSectionHeader}>
                          <Heart size={18} color={colors.warning} />
                          <Text style={styles.detailSectionTitle}>Recovery Adjustment</Text>
                        </View>
                        <View style={styles.recoveryAdjustmentContainer}>
                          <Text style={styles.recoveryAdjustmentText}>
                            {selectedWorkoutForDetail.adjustedForRecovery}
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
                          handleStartWorkout(selectedWorkoutForDetail);
                        }}
                      >
                        <Play size={20} color={colors.text} />
                        <Text style={styles.startWorkoutDetailText}>Start Workout</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.editWorkoutDetailButton}
                        onPress={() => {
                          setShowWorkoutDetailModal(false);
                          handleEditWorkout(selectedWorkoutForDetail);
                        }}
                      >
                        <Edit3 size={20} color={colors.text} />
                        <Text style={styles.editWorkoutDetailText}>Edit Workout</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
        
        {/* Active Workout Modal */}
        <Modal
          visible={showWorkoutModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            Alert.alert(
              "Close Workout?",
              "Do you want to end your current workout?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "End Workout", 
                  style: "destructive",
                  onPress: handleEndWorkout
                }
              ]
            );
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">Active Workout</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    Alert.alert(
                      "Close Workout?",
                      "Do you want to end your current workout?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { 
                          text: "End Workout", 
                          style: "destructive",
                          onPress: handleEndWorkout
                        }
                      ]
                    );
                  }}
                >
                  <StopCircle size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
              
              {activeWorkout && (
                <>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutInfoTitle} numberOfLines={1} ellipsizeMode="tail">
                      {activeWorkout.workout.title}
                    </Text>
                    <Text style={styles.workoutInfoDescription} numberOfLines={3} ellipsizeMode="tail">
                      {activeWorkout.workout.description}
                    </Text>
                  </View>
                  
                  <View style={styles.timerContainer}>
                    <Timer size={32} color={colors.primary} />
                    <Text style={styles.timerText}>{formatTime(activeWorkout.elapsedTime)}</Text>
                  </View>
                  
                  <View style={styles.workoutControls}>
                    <TouchableOpacity 
                      style={[styles.workoutControlButton, styles.pauseButton]}
                      onPress={toggleWorkoutTimer}
                    >
                      {activeWorkout.isRunning ? (
                        <>
                          <Pause size={24} color={colors.text} />
                          <Text style={styles.controlButtonText}>Pause</Text>
                        </>
                      ) : (
                        <>
                          <Play size={24} color={colors.text} />
                          <Text style={styles.controlButtonText}>Resume</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.workoutControlButton, styles.endButton]}
                      onPress={handleEndWorkout}
                    >
                      <CheckCircle2 size={24} color={colors.text} />
                      <Text style={styles.controlButtonText}>Finish</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.workoutStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Started</Text>
                      <Text style={styles.statValue}>{activeWorkout.startTime.toLocaleTimeString()}</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Intensity</Text>
                      <View style={[
                        styles.intensityBadge,
                        { backgroundColor: getIntensityColor(activeWorkout.workout.intensity) }
                      ]}>
                        <Text style={styles.intensityText}>{activeWorkout.workout.intensity}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
        
        {/* Workout Summary Modal */}
        <Modal
          visible={showSummaryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSummaryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">Workout Summary</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowSummaryModal(false)}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              {workoutSummary && (
                <>
                  <ScrollView style={styles.summaryScrollView}>
                    <View style={styles.summaryContainer}>
                      <Text style={styles.summaryTitle}>Great job!</Text>
                      <Text style={styles.summaryWorkoutTitle} numberOfLines={1} ellipsizeMode="tail">
                        {workoutSummary.workout.title}
                      </Text>
                      
                      <View style={styles.summaryStats}>
                        <View style={styles.summaryStat}>
                          <Clock size={20} color={colors.primary} />
                          <Text style={styles.summaryStatLabel}>Duration</Text>
                          <Text style={styles.summaryStatValue}>{formatTime(workoutSummary.duration)}</Text>
                        </View>
                        
                        <View style={styles.summaryStat}>
                          <Activity size={20} color={colors.primary} />
                          <Text style={styles.summaryStatLabel}>Type</Text>
                          <Text style={styles.summaryStatValue} numberOfLines={1} ellipsizeMode="tail">
                            {workoutSummary.workout.type.charAt(0).toUpperCase() + workoutSummary.workout.type.slice(1)}
                          </Text>
                        </View>
                        
                        <View style={styles.summaryStat}>
                          <Dumbbell size={20} color={colors.primary} />
                          <Text style={styles.summaryStatLabel}>Intensity</Text>
                          <Text style={styles.summaryStatValue}>{workoutSummary.workout.intensity}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.timeDetails}>
                        <View style={styles.timeDetail}>
                          <Text style={styles.timeDetailLabel}>Started</Text>
                          <Text style={styles.timeDetailValue}>{formatDate(workoutSummary.startTime)}</Text>
                        </View>
                        
                        <View style={styles.timeDetail}>
                          <Text style={styles.timeDetailLabel}>Ended</Text>
                          <Text style={styles.timeDetailValue}>{formatDate(workoutSummary.endTime)}</Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.logToWhoopButton}
                        onPress={handleLogToWhoop}
                      >
                        <Share2 size={20} color={colors.text} />
                        <Text style={styles.logToWhoopText}>Log to WHOOP Manually</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.doneButton}
                        onPress={() => setShowSummaryModal(false)}
                      >
                        <Text style={styles.doneButtonText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
        
        {/* Personalization Modal */}
        <Modal
          visible={showPersonalizeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPersonalizeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">Personalize Your Program</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setShowPersonalizeModal(false);
                    setPersonalizationRequest('');
                  }}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                <View style={styles.personalizeInfo}>
                  <Brain size={24} color={colors.primary} />
                  <Text style={styles.personalizeInfoTitle}>AI-Powered Personalization</Text>
                  <Text style={styles.personalizeInfoText}>
                    Tell us how you would like to personalize your program. Our AI coach will analyze your request and adapt your program accordingly.
                  </Text>
                </View>
                
                <Text style={styles.personalizeLabel}>Your Request</Text>
                <TextInput
                  style={styles.personalizeInput}
                  placeholder="e.g., I need more recovery days, I want to focus more on upper body strength, I would like to increase my running mileage..."
                  placeholderTextColor={colors.textSecondary}
                  value={personalizationRequest}
                  onChangeText={setPersonalizationRequest}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesTitle}>Example Requests:</Text>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I need to reduce my training volume this week due to work stress."
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I want to focus more on strength training and less on cardio."
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I can only train 3 days this week instead of my usual 5."
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I would like to add more core exercises to my routine."
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleSubmitPersonalizationRequest}
                  disabled={isSubmittingRequest || !personalizationRequest.trim()}
                >
                  {isSubmittingRequest ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <RefreshCw size={20} color={colors.text} />
                      <Text style={styles.submitButtonText}>Update My Program</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        {/* Feedback Modal */}
        <Modal
          visible={showFeedbackModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFeedbackModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">AI Coach Feedback</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowFeedbackModal(false)}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {programFeedback && (
                  <View style={styles.feedbackContainer}>
                    <View style={[
                      styles.feedbackStatusContainer,
                      programFeedback.success ? styles.successContainer : styles.errorContainer
                    ]}>
                      {programFeedback.success ? (
                        <CheckCircle size={24} color={colors.success} />
                      ) : (
                        <AlertCircle size={24} color={colors.danger} />
                      )}
                      <Text style={[
                        styles.feedbackStatusText,
                        programFeedback.success ? styles.successText : styles.errorText
                      ]}>
                        {programFeedback.success ? "Program Updated" : "Update Failed"}
                      </Text>
                    </View>
                    
                    <Text style={styles.feedbackMessage}>{programFeedback.message}</Text>
                    
                    {programFeedback.changes && programFeedback.changes.length > 0 && (
                      <View style={styles.changesContainer}>
                        <Text style={styles.changesTitle}>Changes Made:</Text>
                        {programFeedback.changes.map((change, index) => (
                          <View key={index} style={styles.changeItem}>
                            <View style={styles.bulletPoint} />
                            <Text style={styles.changeText}>{change}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {programFeedback.recommendations && programFeedback.recommendations.length > 0 && (
                      <View style={styles.recommendationsContainer}>
                        <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                        {programFeedback.recommendations.map((recommendation, index) => (
                          <View key={index} style={styles.recommendationItem}>
                            <View style={styles.bulletPoint} />
                            <Text style={styles.recommendationText}>{recommendation}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.doneButton}
                      onPress={() => setShowFeedbackModal(false)}
                    >
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        {/* Edit Workout Modal */}
        <Modal
          visible={showEditWorkoutModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditWorkoutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">Edit Workout</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setShowEditWorkoutModal(false);
                    setSelectedWorkoutForEdit(null);
                    setEditedWorkout({});
                  }}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {selectedWorkoutForEdit && (
                  <>
                    <Text style={styles.editLabel}>Workout Title</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editedWorkout.title || selectedWorkoutForEdit.title}
                      onChangeText={(text) => setEditedWorkout({...editedWorkout, title: text})}
                    />
                    
                    <Text style={styles.editLabel}>Description</Text>
                    <TextInput
                      style={[styles.editInput, styles.editTextarea]}
                      value={editedWorkout.description || selectedWorkoutForEdit.description}
                      onChangeText={(text) => setEditedWorkout({...editedWorkout, description: text})}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    
                    <Text style={styles.editLabel}>Intensity</Text>
                    <View style={styles.intensityOptions}>
                      {['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'].map((intensity) => (
                        <TouchableOpacity
                          key={intensity}
                          style={[
                            styles.intensityOption,
                            (editedWorkout.intensity || selectedWorkoutForEdit.intensity) === intensity && 
                              styles.selectedIntensityOption,
                            { borderColor: getIntensityColor(intensity) }
                          ]}
                          onPress={() => setEditedWorkout({...editedWorkout, intensity})}
                        >
                          <Text style={[
                            styles.intensityOptionText,
                            (editedWorkout.intensity || selectedWorkoutForEdit.intensity) === intensity && 
                              styles.selectedIntensityText
                          ]}>
                            {intensity}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.saveButton}
                      onPress={saveEditedWorkout}
                    >
                      <Check size={20} color={colors.text} />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// Get device dimensions for responsive sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
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
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 16,
  },
  programSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  personalizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  personalizeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  countdownContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  countdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  countdownBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  countdownFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  strengthTrainingContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  strengthTrainingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strengthTrainingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  strengthTrainingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthTrainingDetail: {
    flex: 1,
  },
  strengthTrainingLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  strengthTrainingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  nutritionPreferencesContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  nutritionPreferencesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionPreferencesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  nutritionPreferencesDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutritionPreferencesDetail: {
    minWidth: '45%',
    marginRight: 16,
    marginBottom: 8,
  },
  nutritionPreferencesLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nutritionPreferencesValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  whoopWarning: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  whoopWarningText: {
    color: colors.warning,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  recoveryStatus: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  recoveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recoveryIndicator: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  recoveryText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  phaseIndicator: {
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  phaseFocus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  todayWorkout: {
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  // Updated for horizontal scrolling layout with responsive widths
  horizontalScrollContent: {
    paddingRight: 16,
  },
  workoutColumn: {
    marginRight: 16,
    // Width is now set dynamically based on screen size
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  recoveryWorkoutsContainer: {
    marginTop: 8,
  },
  otherWorkoutsContainer: {
    marginTop: 8,
  },
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensityText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  workoutDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  workoutMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  adjustmentContainer: {
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  adjustmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  adjustmentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  workoutButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flex: 1,
    marginRight: 8,
  },
  completedWorkoutButton: {
    backgroundColor: colors.success,
  },
  startWorkoutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    marginLeft: 8,
  },
  editWorkoutButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  clickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  clickHintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  // Collapsible section styles
  sectionContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  sectionContent: {
    padding: 4,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  sectionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    padding: 10,
  },
  weeklyWorkout: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 4,
    position: 'relative',
  },
  dayContainer: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#2A2A2A',
    marginRight: 10,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  workoutDetails: {
    flex: 1,
    marginRight: 30, // Make room for edit button
  },
  workoutTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  weeklyWorkoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  todayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
  },
  weeklyWorkoutDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  editIconButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(42, 42, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  viewAllText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal styles - updated for full screen
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
  editWorkoutDetailButton: {
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
  editWorkoutDetailText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noWorkoutsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noWorkoutsText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  workoutInfo: {
    marginBottom: 24,
  },
  workoutInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  workoutInfoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
    fontVariant: ['tabular-nums'],
  },
  workoutControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  workoutControlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
  },
  pauseButton: {
    backgroundColor: colors.card,
  },
  endButton: {
    backgroundColor: colors.primary,
  },
  controlButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  // Summary modal styles with improved scrolling
  summaryScrollView: {
    flex: 1,
  },
  summaryContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  summaryWorkoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  timeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  timeDetail: {
    alignItems: 'center',
    flex: 1,
  },
  timeDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  logToWhoopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 16,
  },
  logToWhoopText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
  },
  doneButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Nutrition plan styles
  nutritionSummary: {
    padding: 10,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  macroItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: 10,
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  macroCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 24,
  },
  recommendationsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 8,
  },
  nutritionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  nutritionButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Complete profile container
  completeProfileContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeProfileText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  completeProfileButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  completeProfileButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Personalization modal styles
  personalizeInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  personalizeInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  personalizeInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  personalizeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  personalizeInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 16,
  },
  examplesContainer: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  submitButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Feedback modal styles
  feedbackContainer: {
    padding: 10,
  },
  feedbackStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  successContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  feedbackStatusText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  successText: {
    color: colors.success,
  },
  errorText: {
    color: colors.danger,
  },
  feedbackMessage: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  changesContainer: {
    marginBottom: 24,
  },
  changesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  changeText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  // Edit workout modal styles
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  editTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  intensityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  intensityOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#2A2A2A',
  },
  selectedIntensityOption: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
  },
  intensityOptionText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  selectedIntensityText: {
    color: colors.text,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});