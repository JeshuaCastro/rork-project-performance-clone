import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useWorkoutSession } from '@/store/workoutSessionStore';
import { TrainingProgram, NutritionPlan, ProgramUpdateRequest, ProgramFeedback, TodaysWorkout } from '@/types/whoop';

import EnhancedWorkoutCard from '@/components/EnhancedWorkoutCard';
import WorkoutPlayer from '@/app/workout/WorkoutPlayer';

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
    getProgramFeedback,
    programIntroductionsShown,
    markProgramIntroductionShown
  } = useWhoopStore();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [programUpdateKey, setProgramUpdateKey] = useState(0);
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Track completed workouts - use a key based on program and date to persist daily completions
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);
  
  // Create a unique key for today's completed workouts
  const todayKey = `${programId}-${today}`;
  
  // Load completed workouts for today from AsyncStorage on component mount
  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      try {
        const currentDate = new Date().toISOString().split('T')[0];
        const currentTodayKey = `${programId}-${currentDate}`;
        console.log('Loading completed workouts from AsyncStorage, key:', `completed-workouts-${currentTodayKey}`);
        const stored = await AsyncStorage.getItem(`completed-workouts-${currentTodayKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('Loaded completed workouts:', parsed);
          setCompletedWorkouts(parsed);
        } else {
          console.log('No stored completed workouts found');
        }
      } catch (error) {
        console.error('Error loading completed workouts:', error);
      }
    };
    
    if (programId) {
      loadCompletedWorkouts();
    }
  }, [programId]);
  
  // Save completed workouts to AsyncStorage whenever they change
  useEffect(() => {
    const saveCompletedWorkouts = async () => {
      try {
        const currentDate = new Date().toISOString().split('T')[0];
        const currentTodayKey = `${programId}-${currentDate}`;
        console.log('Saving completed workouts to AsyncStorage:', completedWorkouts, 'key:', `completed-workouts-${currentTodayKey}`);
        await AsyncStorage.setItem(`completed-workouts-${currentTodayKey}`, JSON.stringify(completedWorkouts));
        console.log('Successfully saved completed workouts');
      } catch (error) {
        console.error('Error saving completed workouts:', error);
      }
    };
    
    if (completedWorkouts.length > 0 && programId) {
      saveCompletedWorkouts();
    }
  }, [completedWorkouts, programId]);
  
  // Workout summary state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<{
    workout: Workout;
    startTime: Date;
    endTime: Date;
    duration: number;
  } | null>(null);
  
  // RPE tracking state
  const [showRPEModal, setShowRPEModal] = useState(false);
  const [selectedRPE, setSelectedRPE] = useState<number>(5);
  const [rpeNotes, setRPENotes] = useState<string>('');
  const [completedWorkoutForRPE, setCompletedWorkoutForRPE] = useState<Workout | null>(null);
  
  // Program personalization state
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [personalizationRequest, setPersonalizationRequest] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [programFeedback, setProgramFeedback] = useState<ProgramFeedback | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Program introduction state
  const [showIntroductionModal, setShowIntroductionModal] = useState(false);
  
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
        
        // Check if we have an AI plan - always update to reflect changes
        if (foundProgram.aiPlan) {
          setAiPlan(foundProgram.aiPlan);
          // Trigger update if the AI plan has changed
          if (JSON.stringify(foundProgram.aiPlan) !== JSON.stringify(aiPlan)) {
            setProgramUpdateKey(prev => prev + 1);
          }
        } else {
          setAiPlan(null);
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
            
            // Show introduction modal if this is a new program (within first 3 days) and hasn't been shown before
            if (diffDays <= 3 && foundProgram.aiPlan && !programIntroductionsShown.includes(foundProgram.id)) {
              setShowIntroductionModal(true);
            }
          } catch (error) {
            console.error("Error calculating current week:", error);
            setCurrentWeek(1); // Default to week 1 if there's an error
          }
        }
        
        setIsLoading(false);
      }
    }
  }, [programId, activePrograms, macroTargets]);
  
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
      timerRef.current = interval;
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current as unknown as number);
          timerRef.current = null;
        }
      };
    } else if (timerRef.current) {
      clearInterval(timerRef.current as unknown as number);
      timerRef.current = null;
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
  
  // Calculate precise mileage for running programs
  const calculateRunningMileage = (week: number, programType: string, experienceLevel: string, goalTime?: string): { 
    longRunMiles: number; 
    weeklyMileage: number; 
    easyRunMiles: number; 
    tempoMiles: number; 
    intervalMiles: number;
    paceGuidance: { easy: string; tempo: string; interval: string; long: string };
  } => {
    const isMarathon = programType === 'marathon';
    const isHalfMarathon = programType === 'half-marathon';
    
    // Base weekly mileage by experience level
    const baseMileage = {
      beginner: isMarathon ? 20 : 15,
      intermediate: isMarathon ? 35 : 25,
      advanced: isMarathon ? 50 : 35
    };
    
    // Peak weekly mileage by experience level
    const peakMileage = {
      beginner: isMarathon ? 45 : 30,
      intermediate: isMarathon ? 65 : 45,
      advanced: isMarathon ? 85 : 60
    };
    
    const base = baseMileage[experienceLevel as keyof typeof baseMileage] || baseMileage.intermediate;
    const peak = peakMileage[experienceLevel as keyof typeof peakMileage] || peakMileage.intermediate;
    
    // Calculate progressive mileage (weeks 1-16 for marathon, 1-12 for half)
    const totalWeeks = isMarathon ? 16 : 12;
    const buildWeeks = Math.floor(totalWeeks * 0.75); // 75% build, 25% taper
    
    let weeklyMileage: number;
    let longRunMiles: number;
    
    if (week <= buildWeeks) {
      // Build phase - progressive increase
      const progressRatio = (week - 1) / (buildWeeks - 1);
      weeklyMileage = Math.round(base + (peak - base) * progressRatio);
      
      // Long run progression (20-25% of weekly mileage)
      const longRunBase = isMarathon ? 8 : 6;
      const longRunPeak = isMarathon ? 20 : 13;
      longRunMiles = Math.round(longRunBase + (longRunPeak - longRunBase) * progressRatio);
      
      // Step-back weeks (every 4th week reduce by 20%)
      if (week % 4 === 0 && week > 4) {
        weeklyMileage = Math.round(weeklyMileage * 0.8);
        longRunMiles = Math.round(longRunMiles * 0.85);
      }
    } else {
      // Taper phase - reduce volume
      const taperWeek = week - buildWeeks;
      const taperWeeks = totalWeeks - buildWeeks;
      const taperRatio = 1 - (taperWeek / taperWeeks) * 0.4; // 40% reduction over taper
      
      weeklyMileage = Math.round(peak * taperRatio);
      longRunMiles = isMarathon ? 
        (taperWeek === 1 ? 12 : taperWeek === 2 ? 8 : 3) : // Marathon taper
        (taperWeek === 1 ? 8 : taperWeek === 2 ? 5 : 3);   // Half marathon taper
    }
    
    // Calculate other run types based on weekly mileage
    const easyRunMiles = Math.round((weeklyMileage - longRunMiles) * 0.6);
    const tempoMiles = Math.round((weeklyMileage - longRunMiles) * 0.25);
    const intervalMiles = Math.round((weeklyMileage - longRunMiles) * 0.15);
    
    // Calculate pace guidance based on goal time
    let paceGuidance = {
      easy: "Conversational pace (Zone 2)",
      tempo: "Comfortably hard pace",
      interval: "5K race pace",
      long: "Easy to moderate pace"
    };
    
    if (goalTime && isMarathon) {
      // Parse marathon goal time (e.g., "3:30:00")
      const timeMatch = goalTime.match(/(\d+):(\d+):(\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseInt(timeMatch[3]);
        const totalMinutes = hours * 60 + minutes + seconds / 60;
        const goalPaceMinPerMile = totalMinutes / 26.2;
        
        const easyPace = goalPaceMinPerMile + 1.5; // 1:30-2:00 slower than goal
        const tempoPace = goalPaceMinPerMile - 0.5; // 30s faster than goal
        const intervalPace = goalPaceMinPerMile - 1.5; // 1:30 faster than goal
        
        paceGuidance = {
          easy: `${Math.floor(easyPace)}:${String(Math.round((easyPace % 1) * 60)).padStart(2, '0')}/mile`,
          tempo: `${Math.floor(tempoPace)}:${String(Math.round((tempoPace % 1) * 60)).padStart(2, '0')}/mile`,
          interval: `${Math.floor(intervalPace)}:${String(Math.round((intervalPace % 1) * 60)).padStart(2, '0')}/mile`,
          long: `${Math.floor(easyPace)}:${String(Math.round((easyPace % 1) * 60)).padStart(2, '0')}/mile`
        };
      }
    } else if (goalTime && isHalfMarathon) {
      // Parse half marathon goal time (e.g., "1:45:00")
      const timeMatch = goalTime.match(/(\d+):(\d+):(\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseInt(timeMatch[3]);
        const totalMinutes = hours * 60 + minutes + seconds / 60;
        const goalPaceMinPerMile = totalMinutes / 13.1;
        
        const easyPace = goalPaceMinPerMile + 1.5;
        const tempoPace = goalPaceMinPerMile - 0.25;
        const intervalPace = goalPaceMinPerMile - 1.0;
        
        paceGuidance = {
          easy: `${Math.floor(easyPace)}:${String(Math.round((easyPace % 1) * 60)).padStart(2, '0')}/mile`,
          tempo: `${Math.floor(tempoPace)}:${String(Math.round((tempoPace % 1) * 60)).padStart(2, '0')}/mile`,
          interval: `${Math.floor(intervalPace)}:${String(Math.round((intervalPace % 1) * 60)).padStart(2, '0')}/mile`,
          long: `${Math.floor(easyPace)}:${String(Math.round((easyPace % 1) * 60)).padStart(2, '0')}/mile`
        };
      }
    }
    
    return {
      longRunMiles,
      weeklyMileage,
      easyRunMiles,
      tempoMiles,
      intervalMiles,
      paceGuidance
    };
  };

  // Generate weekly workout plan based on program type and recovery status
  const generateWorkoutPlan = (): Workout[] => {
    // If we have an AI-generated plan, use that
    if (aiPlan && aiPlan.phases && aiPlan.phases.length > 0) {
      // Find the current phase based on the current week
      let currentPhase = aiPlan.phases[0];
      let weekCounter = 0;
      
      for (const phase of aiPlan.phases) {
        const phaseDuration = parseInt(phase.duration?.split(' ')[0] || '4', 10) || 4;
        if (currentWeek > weekCounter && currentWeek <= weekCounter + phaseDuration) {
          currentPhase = phase;
          break;
        }
        weekCounter += phaseDuration;
      }
      
      // Use the weekly structure from the current phase
      if (currentPhase.weeklyStructure && Array.isArray(currentPhase.weeklyStructure)) {
        // Define day order for sorting
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        // Sort workouts by day of the week and apply recovery adjustments
        const sortedWorkouts = currentPhase.weeklyStructure
          .map((workout: any) => {
            const enhancedWorkout = enhanceWorkoutWithDetails(workout);
            
            // Apply recovery-based adjustments
            if (recoveryStatus === 'low' && workout.intensity === 'High') {
              enhancedWorkout.adjustedForRecovery = "Reduce intensity by 20-30% due to low recovery. Focus on technique and listen to your body.";
            } else if (recoveryStatus === 'low' && workout.type === 'cardio' && workout.intensity === 'Medium') {
              enhancedWorkout.adjustedForRecovery = "Consider reducing duration by 15-20% or lowering intensity due to low recovery.";
            } else if (recoveryStatus === 'high' && workout.intensity === 'Medium') {
              enhancedWorkout.adjustedForRecovery = "You can push slightly harder today if you feel good - your recovery is excellent.";
            }
            
            return enhancedWorkout;
          })
          .sort((a: TodaysWorkout, b: TodaysWorkout) => {
            const dayA = dayOrder.indexOf(a.day);
            const dayB = dayOrder.indexOf(b.day);
            
            // If day is not found in dayOrder, put it at the end
            if (dayA === -1 && dayB === -1) return 0;
            if (dayA === -1) return 1;
            if (dayB === -1) return -1;
            
            return dayA - dayB;
          });
        
        return sortedWorkouts;
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
      // Calculate precise mileage for this week
      const mileageData = calculateRunningMileage(
        currentWeek, 
        program.type, 
        program.experienceLevel, 
        program.targetMetric
      );
      
      // Marathon/Half-Marathon training plan with precise mileage
      
      // Monday - Recovery Run (Cardio)
      const recoveryMiles = Math.round(mileageData.easyRunMiles * 0.4);
      workouts.push(enhanceWorkoutWithDetails({
        day: "Monday",
        title: "Recovery Run",
        description: `${recoveryMiles} miles easy run at ${mileageData.paceGuidance.easy}. Focus on form and recovery.`,
        intensity: "Low",
        adjustedForRecovery: recoveryStatus === 'low' ? `Reduce to ${Math.max(2, recoveryMiles - 1)} miles or take as rest day` : null,
        type: 'cardio'
      }));
      
      // Monday - Core Strength (Strength)
      workouts.push(enhanceWorkoutWithDetails({
        day: "Monday",
        title: "Core & Mobility",
        description: "20-25 minutes: planks, Russian twists, leg raises, hip flexor stretches, and calf stretches",
        intensity: "Low",
        adjustedForRecovery: null,
        type: 'strength'
      }));
      
      // Tuesday - Speed Work (Cardio)
      const intervalDistance = Math.round(mileageData.intervalMiles);
      const intervalCount = program.type === 'marathon' ? 
        Math.min(12, Math.max(6, currentWeek)) : 
        Math.min(10, Math.max(5, currentWeek));
      
      workouts.push(enhanceWorkoutWithDetails({
        day: "Tuesday",
        title: "Speed Work",
        description: `${intervalDistance} miles total: 1.5 mile warm-up, ${intervalCount} x 400m at ${mileageData.paceGuidance.interval} with 200m recovery jog, 1 mile cool-down`,
        intensity: "High",
        adjustedForRecovery: recoveryStatus === 'low' ? `Reduce to ${Math.max(4, intervalCount - 2)} repeats or swap with Thursday` : null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 5) {
        // Wednesday - Easy Run (Cardio)
        const midWeekMiles = Math.round(mileageData.easyRunMiles * 0.6);
        workouts.push(enhanceWorkoutWithDetails({
          day: "Wednesday",
          title: "Easy Run",
          description: `${midWeekMiles} miles at ${mileageData.paceGuidance.easy}. Maintain conversational pace throughout.`,
          intensity: "Low",
          adjustedForRecovery: recoveryStatus === 'low' ? `Reduce to ${Math.max(3, midWeekMiles - 1)} miles` : null,
          type: 'cardio'
        }));
        
        // Wednesday - Upper Body (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Wednesday",
          title: "Upper Body Strength",
          description: "25-30 minutes: push-ups, rows, shoulder exercises, and arm swings to maintain upper body strength for running form",
          intensity: "Medium",
          adjustedForRecovery: recoveryStatus === 'low' ? "Reduce volume by 30%" : null,
          type: 'strength'
        }));
      }
      
      // Thursday - Tempo Run (Cardio)
      const tempoMiles = Math.round(mileageData.tempoMiles);
      const tempoPortionMiles = Math.max(2, Math.round(tempoMiles * 0.6));
      
      workouts.push(enhanceWorkoutWithDetails({
        day: "Thursday",
        title: "Tempo Run",
        description: `${tempoMiles} miles total: 1.5 mile warm-up, ${tempoPortionMiles} miles at ${mileageData.paceGuidance.tempo} (threshold pace), 1 mile cool-down`,
        intensity: "Medium",
        adjustedForRecovery: recoveryStatus === 'low' ? `Reduce tempo portion to ${Math.max(1, tempoPortionMiles - 1)} miles` : null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 6) {
        // Friday - Recovery Run (Cardio)
        const fridayMiles = Math.max(2, Math.round(mileageData.easyRunMiles * 0.3));
        workouts.push(enhanceWorkoutWithDetails({
          day: "Friday",
          title: "Recovery Run",
          description: `${fridayMiles} miles very easy run at ${mileageData.paceGuidance.easy} or cross-training (swimming, cycling)`,
          intensity: "Low",
          adjustedForRecovery: null,
          type: 'cardio'
        }));
        
        // Friday - Lower Body (Strength)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Friday",
          title: "Running Strength",
          description: "20-25 minutes: single-leg squats, lunges, calf raises, glute bridges, and hip strengthening exercises",
          intensity: "Low",
          adjustedForRecovery: null,
          type: 'strength'
        }));
      }
      
      // Saturday - Long Run (Cardio) - The key workout of the week
      workouts.push(enhanceWorkoutWithDetails({
        day: "Saturday",
        title: "Long Run",
        description: `${mileageData.longRunMiles} miles at ${mileageData.paceGuidance.long}. Week ${currentWeek} of ${program.type} training. ${currentWeek <= 4 ? 'Focus on building aerobic base.' : currentWeek <= 8 ? 'Building endurance and mental toughness.' : currentWeek <= 12 ? 'Peak training - maintain goal pace sections.' : 'Taper phase - maintain fitness while recovering.'}`,
        intensity: "Medium",
        adjustedForRecovery: recoveryStatus === 'low' ? `Reduce to ${Math.max(Math.round(mileageData.longRunMiles * 0.8), 6)} miles or postpone to Sunday` : null,
        type: 'cardio'
      }));
      
      if (daysPerWeek >= 4) {
        // Sunday - Rest or Cross-Train (Recovery)
        workouts.push(enhanceWorkoutWithDetails({
          day: "Sunday",
          title: "Rest or Cross-Train",
          description: `Complete rest or 30-45 minutes of light cross-training. Weekly mileage target: ${mileageData.weeklyMileage} miles.`,
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
  
  // Normalize exercises coming from program schedule/AI plan into the modal's shape
  const normalizeScheduleExercises = (raw: any[] | undefined): NonNullable<Workout['exercises']> => {
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((ex: any) => {
      const name = String(ex?.name ?? ex?.title ?? 'Exercise');
      const sets = ex?.sets ?? ex?.targetSets ?? ex?.totalSets;
      const reps = ex?.reps ?? ex?.repRange ?? ex?.targetReps;
      const duration = ex?.duration ?? (ex?.durationMin ? `${ex.durationMin} minutes` : ex?.time ?? undefined);
      const notes = ex?.notes ?? (Array.isArray(ex?.cues) ? ex.cues.join(' • ') : ex?.description ?? undefined);
      return {
        name,
        sets: sets !== undefined && sets !== null ? String(sets) : undefined,
        reps: reps !== undefined && reps !== null ? String(reps) : undefined,
        duration: duration !== undefined && duration !== null ? String(duration) : undefined,
        notes: notes !== undefined && notes !== null ? String(notes) : undefined,
      };
    });
  };

  // Enhance workout strictly from schedule; no generated fallbacks
  const enhanceWorkoutWithDetails = (workout: any): Workout => {
    const providedExercises = normalizeScheduleExercises(workout?.exercises);

    const enhanced: Workout = {
      ...workout,
      duration: typeof workout?.duration === 'string' ? workout.duration : undefined,
      equipment: Array.isArray(workout?.equipment) ? workout.equipment : undefined,
      exercises: providedExercises,
      tips: Array.isArray(workout?.tips) ? workout.tips : undefined,
      modifications: Array.isArray(workout?.modifications) ? workout.modifications : undefined,
      targetHeartRate: typeof workout?.targetHeartRate === 'string' ? workout.targetHeartRate : undefined,
      caloriesBurned: typeof workout?.caloriesBurned === 'string' ? workout.caloriesBurned : undefined,
    } as Workout;

    return enhanced;
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
  
  // Memoize the workout plan to ensure it updates when aiPlan changes
  const workoutPlan = useMemo(() => {
    return generateWorkoutPlan();
  }, [aiPlan, currentWeek, recoveryStatus, program?.type, program?.trainingDaysPerWeek, programUpdateKey]);
  
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
  
  // Get RPE color based on value
  const getRPEColor = (rpe: number) => {
    if (rpe <= 3) return '#4CAF50'; // Green - Easy
    if (rpe <= 5) return '#8BC34A'; // Light Green - Moderate
    if (rpe <= 7) return '#FFC107'; // Yellow - Hard
    if (rpe <= 8) return '#FF9800'; // Orange - Very Hard
    return '#F44336'; // Red - Maximum
  };
  
  // Get RPE description
  const getRPEDescription = (rpe: number) => {
    const descriptions = {
      1: "Very, very easy - No exertion at all",
      2: "Very easy - Minimal exertion",
      3: "Easy - Light exertion",
      4: "Somewhat easy - Light to moderate exertion",
      5: "Moderate - Moderate exertion",
      6: "Somewhat hard - Moderate to vigorous exertion",
      7: "Hard - Vigorous exertion",
      8: "Very hard - Very vigorous exertion",
      9: "Very, very hard - Extremely vigorous exertion",
      10: "Maximum - Highest possible exertion"
    };
    return descriptions[rpe as keyof typeof descriptions] || "Select an RPE value";
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
    // Check if this workout is already completed
    const workoutKey = `${workout.day}-${workout.title}`;
    if (completedWorkouts.includes(workoutKey)) {
      Alert.alert(
        "Workout Already Completed",
        "This workout has already been completed today. Would you like to do it again?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Do Again", 
            onPress: () => {
              // Remove from completed workouts and start again
              setCompletedWorkouts(prev => prev.filter(key => key !== workoutKey));
              startManualWorkout(workout);
            }
          }
        ]
      );
      return;
    }

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
  
  // Get workout session functions
  const { startWorkoutSession, startCardioWorkout, currentSession, isWorkoutActive } = useWorkoutSession();

  // Start manual workout tracking
  const startManualWorkout = (workout: Workout) => {
    console.log('Starting workout:', workout.title, 'Type:', workout.type);
    
    try {
      // Create a unique workout ID
      const workoutId = `${workout.day}-${workout.title}-${Date.now()}`;
      
      if (workout.type === 'cardio') {
        // Start cardio workout session
        const session = startCardioWorkout(
          workoutId,
          'running', // Default to running, could be made dynamic
          programId
        );
        console.log('Started cardio workout session:', session.id);
      } else if (workout.type === 'strength') {
        // For strength workouts, we need to create exercise structure
        // For now, create a basic structure - this will be enhanced later
        const exercises = workout.exercises?.map((exercise, index) => ({
          exerciseId: `${workoutId}-exercise-${index}`,
          name: exercise.name,
          targetSets: parseInt(exercise.sets || '3'),
          targetReps: parseInt(exercise.reps?.split('-')[0] || '8'),
          targetWeight: 0, // Will be set by user
          restTime: '90 seconds', // Default 90 seconds
          sets: Array.from({ length: parseInt(exercise.sets || '3') }, (_, setIndex) => ({
            setNumber: setIndex + 1,
            targetReps: parseInt(exercise.reps?.split('-')[0] || '8'),
            targetWeight: 0,
            actualReps: 0,
            actualWeight: 0,
            actualRPE: 0,
            restTime: 90,
            completed: false,
            startTime: '',
            endTime: '',
            notes: ''
          })),
          totalSets: parseInt(exercise.sets || '3'),
          completedSets: 0,
          isCompleted: false,
          exerciseNotes: exercise.notes || ''
        })) || [];
        
        const session = startWorkoutSession(
          workoutId,
          exercises,
          'strength',
          programId
        );
        console.log('Started strength workout session:', session.id);
      } else {
        // For other workout types, fall back to the old manual tracking
        const now = new Date();
        setActiveWorkout({
          workout,
          startTime: now,
          elapsedTime: 0,
          isRunning: true
        });
        setShowWorkoutModal(true);
        return;
      }
      
      // For strength and cardio workouts, show the workout modal
      // The modal will now use the workout session store
      const now = new Date();
      setActiveWorkout({
        workout,
        startTime: now,
        elapsedTime: 0,
        isRunning: true
      });
      setShowWorkoutModal(true);
      
    } catch (error) {
      console.error('Error starting workout session:', error);
      // Fall back to old manual tracking on error
      const now = new Date();
      setActiveWorkout({
        workout,
        startTime: now,
        elapsedTime: 0,
        isRunning: true
      });
      setShowWorkoutModal(true);
    }
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
    const currentDate = new Date().toISOString().split('T')[0]; // Use current date, not the stored 'today'
    const workoutKey = `${activeWorkout.workout.day}-${activeWorkout.workout.title}`;
    
    // Stop the timer
    setActiveWorkout(prev => prev ? { ...prev, isRunning: false } : null);
    
    // Create workout summary
    setWorkoutSummary({
      workout: activeWorkout.workout,
      startTime: activeWorkout.startTime,
      endTime: endTime,
      duration: durationSeconds
    });
    
    // Mark workout as completed - ensure it's not already in the list
    setCompletedWorkouts(prev => {
      if (!prev.includes(workoutKey)) {
        console.log('Marking workout as completed:', workoutKey);
        console.log('Previous completed workouts:', prev);
        console.log('Using current date for completion:', currentDate);
        const newCompleted = [...prev, workoutKey];
        console.log('New completed workouts:', newCompleted);
        return newCompleted;
      }
      return prev;
    });
    
    // Hide workout modal and show RPE modal first
    setShowWorkoutModal(false);
    setCompletedWorkoutForRPE(activeWorkout.workout);
    setShowRPEModal(true);
    
    // Reset active workout
    setActiveWorkout(null);
  };
  
  // Handle RPE submission
  const handleRPESubmission = () => {
    if (!completedWorkoutForRPE) return;
    
    // Store RPE data (you can extend this to save to your backend)
    console.log('RPE submitted:', {
      workout: completedWorkoutForRPE.title,
      rpe: selectedRPE,
      notes: rpeNotes,
      date: new Date().toISOString()
    });
    
    // Show success message
    Alert.alert(
      "RPE Recorded",
      `Your RPE of ${selectedRPE}/10 has been recorded for ${completedWorkoutForRPE.title}. This will help optimize your future workouts.`,
      [{ text: "OK" }]
    );
    
    // Reset RPE state and show summary
    setShowRPEModal(false);
    setSelectedRPE(5);
    setRPENotes('');
    setCompletedWorkoutForRPE(null);
    setShowSummaryModal(true);
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
    
    // Validate user profile completeness
    if (!userProfile.name || !userProfile.age || !userProfile.weight || !userProfile.height) {
      Alert.alert(
        "Incomplete Profile", 
        "Please complete your profile first to get personalized recommendations. Go to Settings > Profile.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Profile", onPress: () => router.push('/profile') }
        ]
      );
      return;
    }
    
    setIsSubmittingRequest(true);
    
    try {
      // Create update request with comprehensive user data
      const updateRequest: ProgramUpdateRequest = {
        programId: program.id,
        requestText: personalizationRequest.trim(),
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
      
      console.log('Submitting personalization request:', updateRequest);
      
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
        // Force a re-render by updating the program state
        setTimeout(() => {
          const updatedProgram = activePrograms.find(p => p.id === program.id);
          if (updatedProgram) {
            setProgram(updatedProgram);
            if (updatedProgram.aiPlan) {
              setAiPlan(updatedProgram.aiPlan);
            }
            if (updatedProgram.nutritionPlan) {
              setNutritionPlan(updatedProgram.nutritionPlan);
            }
            // Force re-render of workout plan
            setProgramUpdateKey(prev => prev + 1);
          }
        }, 100);
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
          setTimeout(() => {
            const updatedProgram = activePrograms.find(p => p.id === program.id);
            if (updatedProgram) {
              setProgram(updatedProgram);
              if (updatedProgram.aiPlan) {
                setAiPlan(updatedProgram.aiPlan);
              }
              if (updatedProgram.nutritionPlan) {
                setNutritionPlan(updatedProgram.nutritionPlan);
              }
              // Force re-render of workout plan
              setProgramUpdateKey(prev => prev + 1);
            }
          }, 100);
          
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

  // Render a single workout card using enhanced workout cards
  const renderWorkoutCard = (workout: Workout) => {
    const workoutKey = `${workout.day}-${workout.title}`;
    const isCompleted = completedWorkouts.includes(workoutKey);
    
    // Debug log to check completion state
    console.log('Rendering enhanced workout card:', workoutKey, 'isCompleted:', isCompleted, 'completedWorkouts:', completedWorkouts);
    
    // Use enhanced workout card for all workout types
    return (
      <EnhancedWorkoutCard
        key={`${workout.day}-${workout.title}-${isCompleted ? 'completed' : 'pending'}`}
        workout={workout}
        isCompleted={isCompleted}
        onStart={() => handleStartWorkout(workout)}
        onEdit={() => handleEditWorkout(workout)}
        onDetails={() => handleWorkoutCardClick(workout)}
      />
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
              {/* Program Hero Card */}
              <View style={styles.programHero}>
                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle}>{program.name}</Text>
                  {program.targetMetric && (
                    <Text style={styles.heroTarget}>
                      Goal: {program.targetMetric}
                    </Text>
                  )}
                  {program.goalDate && (
                    <Text style={styles.heroDate}>
                      Target Date: {new Date(program.goalDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>Week {currentWeek}</Text>
                    <Text style={styles.heroStatLabel}>Current</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{program.trainingDaysPerWeek}</Text>
                    <Text style={styles.heroStatLabel}>Days/Week</Text>
                  </View>
                </View>
              </View>
              
              {/* Goal Progress */}
              {program.targetMetric && program.goalDate && daysUntilGoal !== null && (
                <View style={styles.goalProgress}>
                  <View style={styles.goalProgressContent}>
                    <Text style={styles.goalProgressTarget}>{program.targetMetric}</Text>
                    <Text style={styles.goalProgressDays}>
                      {daysUntilGoal > 0 ? `${daysUntilGoal} days to go` : 'Goal achieved!'}
                    </Text>
                  </View>
                  <View style={styles.goalProgressBar}>
                    <View 
                      style={[
                        styles.goalProgressFill, 
                        { 
                          width: `${(() => {
                            if (!program.startDate || !program.goalDate) return 0;
                            
                            const startDate = new Date(program.startDate);
                            const goalDate = new Date(program.goalDate);
                            const currentDate = new Date();
                            
                            const totalDuration = goalDate.getTime() - startDate.getTime();
                            const elapsed = currentDate.getTime() - startDate.getTime();
                            
                            const progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                            return progressPercentage;
                          })()}%` 
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}
              
              {/* Weekly Training Plan Summary for Running Programs */}
              {(program?.type === 'marathon' || program?.type === 'half-marathon') && (
                <View style={styles.weeklyTrainingPlanContainer}>
                  <View style={styles.weeklyTrainingPlanHeader}>
                    <MapPin size={20} color={colors.primary} />
                    <Text style={styles.weeklyTrainingPlanTitle}>Week {currentWeek} Training Plan</Text>
                  </View>
                  
                  {(() => {
                    const mileageData = calculateRunningMileage(
                      currentWeek, 
                      program.type, 
                      program.experienceLevel, 
                      program.targetMetric
                    );
                    
                    return (
                      <>
                        <View style={styles.mileageSummaryContainer}>
                          <View style={styles.mileageSummaryItem}>
                            <Text style={styles.mileageSummaryLabel}>Weekly Total</Text>
                            <Text style={styles.mileageSummaryValue}>{mileageData.weeklyMileage} miles</Text>
                          </View>
                          
                          <View style={styles.mileageSummaryItem}>
                            <Text style={styles.mileageSummaryLabel}>Long Run</Text>
                            <Text style={styles.mileageSummaryValue}>{mileageData.longRunMiles} miles</Text>
                          </View>
                          
                          <View style={styles.mileageSummaryItem}>
                            <Text style={styles.mileageSummaryLabel}>Easy Runs</Text>
                            <Text style={styles.mileageSummaryValue}>{mileageData.easyRunMiles} miles</Text>
                          </View>
                        </View>
                        
                        <View style={styles.paceGuidanceContainer}>
                          <Text style={styles.paceGuidanceTitle}>Pace Guidance</Text>
                          <View style={styles.paceGuidanceGrid}>
                            <View style={styles.paceGuidanceItem}>
                              <Text style={styles.paceGuidanceLabel}>Easy</Text>
                              <Text style={styles.paceGuidanceValue}>{mileageData.paceGuidance.easy}</Text>
                            </View>
                            
                            <View style={styles.paceGuidanceItem}>
                              <Text style={styles.paceGuidanceLabel}>Tempo</Text>
                              <Text style={styles.paceGuidanceValue}>{mileageData.paceGuidance.tempo}</Text>
                            </View>
                            
                            <View style={styles.paceGuidanceItem}>
                              <Text style={styles.paceGuidanceLabel}>Intervals</Text>
                              <Text style={styles.paceGuidanceValue}>{mileageData.paceGuidance.interval}</Text>
                            </View>
                            
                            <View style={styles.paceGuidanceItem}>
                              <Text style={styles.paceGuidanceLabel}>Long Run</Text>
                              <Text style={styles.paceGuidanceValue}>{mileageData.paceGuidance.long}</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={styles.trainingPhaseContainer}>
                          <Text style={styles.trainingPhaseTitle}>Training Phase</Text>
                          <Text style={styles.trainingPhaseDescription}>
                            {currentWeek <= 4 ? 
                              'Base Building: Focus on aerobic development and building weekly mileage gradually.' :
                              currentWeek <= 8 ? 
                              'Build Phase: Increasing mileage and introducing more structured workouts.' :
                              currentWeek <= 12 ? 
                              'Peak Training: Highest mileage weeks with race-specific workouts.' :
                              'Taper Phase: Reducing volume while maintaining intensity for race day.'
                            }
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              )}
              
              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.primaryAction}
                  onPress={() => setShowPersonalizeModal(true)}
                >
                  <Edit3 size={18} color={colors.text} />
                  <Text style={styles.primaryActionText}>Customize</Text>
                </TouchableOpacity>
                
                {aiPlan && (
                  <TouchableOpacity 
                    style={styles.secondaryAction}
                    onPress={() => setShowIntroductionModal(true)}
                  >
                    <Eye size={18} color={colors.textSecondary} />
                    <Text style={styles.secondaryActionText}>Overview</Text>
                    {program.updateHistory && program.updateHistory.length > 0 && (
                      <View style={styles.updateDot} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              

              
              {/* Recovery Status */}
              {isConnectedToWhoop && (
                <View style={styles.recoveryBanner}>
                  <View style={styles.recoveryInfo}>
                    <Text style={styles.recoveryScore}>{latestRecovery?.score || '--'}%</Text>
                    <Text style={styles.recoveryLabel}>Recovery</Text>
                  </View>
                  <View style={[styles.recoveryDot, { backgroundColor: colors.recovery[recoveryStatus] }]} />
                  <Text style={styles.recoveryMessage}>
                    {recoveryStatus === 'high' ? "Ready to push hard" 
                      : recoveryStatus === 'medium' ? "Listen to your body"
                      : "Consider reducing intensity"}
                  </Text>
                </View>
              )}
              
              {/* Today's Focus */}
              {todayWorkouts.length > 0 && (
                <View style={styles.todayFocus}>
                  <View style={styles.todayHeader}>
                    <Text style={styles.todayTitle}>Today&apos;s Focus</Text>
                    <Text style={styles.todayDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                  </View>
                  
                  <View style={styles.todayWorkouts}>
                    {todayWorkouts.map((workout, index) => renderWorkoutCard(workout))}
                  </View>
                </View>
              )}
              
              {/* Renaissance Periodization Info */}
              {program && (
                <View style={styles.periodizationSection}>
                  <View style={styles.periodizationHeader}>
                    <Brain size={20} color={colors.primary} />
                    <Text style={styles.periodizationTitle}>Scientific Programming</Text>
                  </View>
                  
                  <View style={styles.periodizationContent}>
                    <View style={styles.periodizationPhase}>
                      <Text style={styles.phaseLabel}>Current Phase</Text>
                      <Text style={styles.phaseValue}>
                        {currentWeek <= 4 ? 'Accumulation' : 
                         currentWeek <= 8 ? 'Intensification' : 
                         currentWeek <= 12 ? 'Realization' : 'Deload'}
                      </Text>
                      <Text style={styles.phaseDescription}>
                        {currentWeek <= 4 ? 'Building volume and work capacity' : 
                         currentWeek <= 8 ? 'Increasing intensity while managing fatigue' : 
                         currentWeek <= 12 ? 'Peak performance and skill refinement' : 'Recovery and adaptation'}
                      </Text>
                    </View>
                    
                    <View style={styles.rpeGuidance}>
                      <Text style={styles.rpeLabel}>Target RPE Range</Text>
                      <Text style={styles.rpeValue}>
                        {currentWeek <= 4 ? '6-7' : 
                         currentWeek <= 8 ? '7-8' : 
                         currentWeek <= 12 ? '8-9' : '5-6'} / 10
                      </Text>
                      <Text style={styles.rpeExplanation}>
                        Rate of Perceived Exertion - how hard the workout feels
                      </Text>
                    </View>
                    
                    <View style={styles.volumeProgression}>
                      <Text style={styles.volumeLabel}>Volume Progression</Text>
                      <View style={styles.volumeBar}>
                        <View 
                          style={[
                            styles.volumeFill,
                            { width: `${Math.min(100, (currentWeek / 16) * 100)}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.volumeText}>
                        Week {currentWeek} of progressive overload cycle
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Weekly Plan */}
              <View style={styles.weeklyPlanSection}>
                <TouchableOpacity 
                  style={styles.weeklyPlanHeader}
                  onPress={() => setWeeklyPlanExpanded(!weeklyPlanExpanded)}
                >
                  <Text style={styles.weeklyPlanTitle}>Week {currentWeek} Schedule</Text>
                  <View style={styles.weeklyPlanToggle}>
                    <Text style={styles.weeklyPlanToggleText}>{weeklyPlanExpanded ? 'Hide' : 'Show'}</Text>
                    {weeklyPlanExpanded ? 
                      <ChevronUp size={18} color={colors.textSecondary} /> : 
                      <ChevronDown size={18} color={colors.textSecondary} />
                    }
                  </View>
                </TouchableOpacity>
                
                {weeklyPlanExpanded && (
                  <View style={styles.sectionContent}>
                    {workoutPlan.map((workout: Workout, index: number) => (
                      <View key={index} style={styles.weeklyWorkout}>
                        <View style={styles.dayContainer}>
                          <Text style={styles.dayText}>{workout.day}</Text>
                          <View style={[
                            styles.intensityDot,
                            { backgroundColor: getIntensityColor(workout.intensity) }
                          ]} />
                        </View>
                        
                        <View style={styles.workoutDetails}>
                          <View style={styles.workoutTitleRow}>
                            <View style={styles.workoutTypeContainer}>
                              {getWorkoutIcon(workout.title, workout.type)}
                              <Text style={styles.weeklyWorkoutTitle} numberOfLines={1} ellipsizeMode="tail">
                                {workout.title}
                              </Text>
                            </View>
                            {workout.day === todayDay && (
                              <View style={styles.todayBadge}>
                                <Text style={styles.todayBadgeText}>TODAY</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.weeklyWorkoutDescription} numberOfLines={2} ellipsizeMode="tail">
                            {workout.description}
                          </Text>
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.editIconButton}
                          onPress={() => handleEditWorkout(workout)}
                        >
                          <Edit3 size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
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
        
        {/* Active Workout Modal - Now using WorkoutPlayer */}
        <Modal
          visible={showWorkoutModal}
          animationType="slide"
          presentationStyle="fullScreen"
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
          {activeWorkout && (
            <WorkoutPlayer
              programId={programId}
              workoutTitle={activeWorkout.workout.title}
              onComplete={handleEndWorkout}
              onCancel={() => {
                Alert.alert(
                  "Cancel Workout?",
                  "Do you want to cancel your current workout?",
                  [
                    { text: "Continue Workout", style: "cancel" },
                    {
                      text: "Cancel Workout",
                      style: "destructive",
                      onPress: () => {
                        setShowWorkoutModal(false);
                        setActiveWorkout(null);
                      }
                    }
                  ]
                );
              }}
            />
          )}
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
                  <Text style={styles.personalizeInfoTitle}>AI-Powered Goal-Focused Personalization</Text>
                  <Text style={styles.personalizeInfoText}>
                    Tell us how you'd like to personalize your program. Our AI coach will adapt your program while keeping your goal "{program?.targetMetric || 'fitness improvement'}" as the top priority and optimizing your strain-recovery balance.
                  </Text>
                  
                  <View style={styles.strainWarningContainer}>
                    <AlertCircle size={16} color={colors.warning} />
                    <Text style={styles.strainWarningText}>
                      If your request increases training strain, we'll analyze your recovery capacity and provide specific optimization strategies for sleep, nutrition, and recovery protocols.
                    </Text>
                  </View>
                  
                  {program?.targetMetric && program?.goalDate && (
                    <View style={styles.goalReminderContainer}>
                      <Target size={16} color={colors.primary} />
                      <Text style={styles.goalReminderText}>
                        Goal: {program.targetMetric} by {new Date(program.goalDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.personalizeLabel}>Your Request</Text>
                <TextInput
                  style={styles.personalizeInput}
                  placeholder="e.g., I want to add more strength training, increase my running volume, focus on speed work, add extra recovery days..."
                  placeholderTextColor={colors.textSecondary}
                  value={personalizationRequest}
                  onChangeText={setPersonalizationRequest}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesTitle}>Example Goal-Focused Requests:</Text>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I need to reduce training volume this week but don't want to compromise my goal progress."
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I want to focus more on the specific skills needed for my goal."
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I can only train 3 days this week - prioritize the most important workouts for my goal."
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I'm feeling behind on my goal timeline - can we intensify the program?"
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I want to add exercises that will directly improve my performance for my target."
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I want to increase my training volume but need help optimizing my recovery."
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.exampleText}>
                      "I'm feeling fatigued - can you adjust my program and tell me how to recover better?"
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
                    
                    {/* Strain Analysis */}
                    {(programFeedback as any).strainAnalysis && (
                      <View style={styles.strainAnalysisContainer}>
                        <Text style={styles.strainAnalysisTitle}>Strain Analysis:</Text>
                        
                        {(programFeedback as any).strainAnalysis.currentStrainLoad && (
                          <View style={styles.strainAnalysisItem}>
                            <Text style={styles.strainAnalysisLabel}>Current Strain Load:</Text>
                            <Text style={styles.strainAnalysisText}>
                              {(programFeedback as any).strainAnalysis.currentStrainLoad}
                            </Text>
                          </View>
                        )}
                        
                        {(programFeedback as any).strainAnalysis.proposedStrainIncrease && (
                          <View style={styles.strainAnalysisItem}>
                            <Text style={styles.strainAnalysisLabel}>Proposed Strain Increase:</Text>
                            <Text style={styles.strainAnalysisText}>
                              {(programFeedback as any).strainAnalysis.proposedStrainIncrease}
                            </Text>
                          </View>
                        )}
                        
                        {(programFeedback as any).strainAnalysis.riskAssessment && (
                          <View style={styles.strainAnalysisItem}>
                            <Text style={styles.strainAnalysisLabel}>Risk Assessment:</Text>
                            <Text style={[
                              styles.strainAnalysisText,
                              (programFeedback as any).strainAnalysis.riskAssessment.toLowerCase().includes('high') && styles.highRiskText,
                              (programFeedback as any).strainAnalysis.riskAssessment.toLowerCase().includes('medium') && styles.mediumRiskText,
                              (programFeedback as any).strainAnalysis.riskAssessment.toLowerCase().includes('low') && styles.lowRiskText
                            ]}>
                              {(programFeedback as any).strainAnalysis.riskAssessment}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Recovery Optimization */}
                    {(programFeedback as any).recoveryOptimization && (
                      <View style={styles.recoveryOptimizationContainer}>
                        <Text style={styles.recoveryOptimizationTitle}>Recovery Optimization Plan:</Text>
                        
                        {(programFeedback as any).recoveryOptimization.sleepRequirements && (
                          <View style={styles.recoverySection}>
                            <Text style={styles.recoverySectionTitle}>Sleep Requirements:</Text>
                            {(programFeedback as any).recoveryOptimization.sleepRequirements.hoursNeeded && (
                              <Text style={styles.recoveryRequirement}>
                                Target: {(programFeedback as any).recoveryOptimization.sleepRequirements.hoursNeeded}
                              </Text>
                            )}
                            {(programFeedback as any).recoveryOptimization.sleepRequirements.sleepHygiene && 
                             (programFeedback as any).recoveryOptimization.sleepRequirements.sleepHygiene.map((tip: string, index: number) => (
                              <View key={index} style={styles.recoveryTip}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.recoveryTipText}>{tip}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        
                        {(programFeedback as any).recoveryOptimization.nutritionRequirements && (
                          <View style={styles.recoverySection}>
                            <Text style={styles.recoverySectionTitle}>Nutrition Requirements:</Text>
                            <View style={styles.nutritionTargetsGrid}>
                              {(programFeedback as any).recoveryOptimization.nutritionRequirements.dailyCalories && (
                                <View style={styles.nutritionTarget}>
                                  <Text style={styles.nutritionTargetLabel}>Calories</Text>
                                  <Text style={styles.nutritionTargetValue}>
                                    {(programFeedback as any).recoveryOptimization.nutritionRequirements.dailyCalories}
                                  </Text>
                                </View>
                              )}
                              {(programFeedback as any).recoveryOptimization.nutritionRequirements.proteinTarget && (
                                <View style={styles.nutritionTarget}>
                                  <Text style={styles.nutritionTargetLabel}>Protein</Text>
                                  <Text style={styles.nutritionTargetValue}>
                                    {(programFeedback as any).recoveryOptimization.nutritionRequirements.proteinTarget}g
                                  </Text>
                                </View>
                              )}
                              {(programFeedback as any).recoveryOptimization.nutritionRequirements.hydrationTarget && (
                                <View style={styles.nutritionTarget}>
                                  <Text style={styles.nutritionTargetLabel}>Water</Text>
                                  <Text style={styles.nutritionTargetValue}>
                                    {(programFeedback as any).recoveryOptimization.nutritionRequirements.hydrationTarget}L
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                        
                        {(programFeedback as any).recoveryOptimization.recoveryProtocols && (
                          <View style={styles.recoverySection}>
                            <Text style={styles.recoverySectionTitle}>Recovery Protocols:</Text>
                            {(programFeedback as any).recoveryOptimization.recoveryProtocols.map((protocol: string, index: number) => (
                              <View key={index} style={styles.recoveryTip}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.recoveryTipText}>{protocol}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Warning Flags */}
                    {(programFeedback as any).warningFlags && (
                      <View style={styles.warningFlagsContainer}>
                        <Text style={styles.warningFlagsTitle}>⚠️ Important Considerations:</Text>
                        
                        {(programFeedback as any).warningFlags.overreachingRisk && (
                          <View style={styles.warningFlag}>
                            <Text style={styles.warningFlagLabel}>Overreaching Risk:</Text>
                            <Text style={styles.warningFlagText}>
                              {(programFeedback as any).warningFlags.overreachingRisk}
                            </Text>
                          </View>
                        )}
                        
                        {(programFeedback as any).warningFlags.recoveryDeficit && (
                          <View style={styles.warningFlag}>
                            <Text style={styles.warningFlagLabel}>Recovery Status:</Text>
                            <Text style={styles.warningFlagText}>
                              {(programFeedback as any).warningFlags.recoveryDeficit}
                            </Text>
                          </View>
                        )}
                        
                        {(programFeedback as any).warningFlags.injuryRisk && (
                          <View style={styles.warningFlag}>
                            <Text style={styles.warningFlagLabel}>Injury Prevention:</Text>
                            <Text style={styles.warningFlagText}>
                              {(programFeedback as any).warningFlags.injuryRisk}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Goal Impact Analysis */}
                    {(programFeedback as any).goalImpactAnalysis && (
                      <View style={styles.goalImpactContainer}>
                        <Text style={styles.goalImpactTitle}>Goal Impact Analysis:</Text>
                        
                        {(programFeedback as any).goalImpactAnalysis.timelineAdjustment && (
                          <View style={styles.goalImpactItem}>
                            <Text style={styles.goalImpactLabel}>Timeline Impact:</Text>
                            <Text style={styles.goalImpactText}>
                              {(programFeedback as any).goalImpactAnalysis.timelineAdjustment}
                            </Text>
                          </View>
                        )}
                        
                        {(programFeedback as any).goalImpactAnalysis.progressOptimization && (
                          <View style={styles.goalImpactItem}>
                            <Text style={styles.goalImpactLabel}>Progress Optimization:</Text>
                            <Text style={styles.goalImpactText}>
                              {(programFeedback as any).goalImpactAnalysis.progressOptimization}
                            </Text>
                          </View>
                        )}
                        
                        {(programFeedback as any).goalImpactAnalysis.riskMitigation && (
                          <View style={styles.goalImpactItem}>
                            <Text style={styles.goalImpactLabel}>Risk Mitigation:</Text>
                            <Text style={styles.goalImpactText}>
                              {(programFeedback as any).goalImpactAnalysis.riskMitigation}
                            </Text>
                          </View>
                        )}
                        
                        {(programFeedback as any).goalImpactAnalysis.sustainabilityAssessment && (
                          <View style={styles.goalImpactItem}>
                            <Text style={styles.goalImpactLabel}>Sustainability:</Text>
                            <Text style={styles.goalImpactText}>
                              {(programFeedback as any).goalImpactAnalysis.sustainabilityAssessment}
                            </Text>
                          </View>
                        )}
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
        
        {/* RPE Modal */}
        <Modal
          visible={showRPEModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRPEModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rate Your Workout</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setShowRPEModal(false);
                    setShowSummaryModal(true);
                  }}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                <View style={styles.rpeContainer}>
                  <Text style={styles.rpeTitle}>How hard did this workout feel?</Text>
                  <Text style={styles.rpeSubtitle}>
                    Rate of Perceived Exertion (RPE) helps optimize your training
                  </Text>
                  
                  {completedWorkoutForRPE && (
                    <View style={styles.workoutReminderCard}>
                      <Text style={styles.workoutReminderTitle}>{completedWorkoutForRPE.title}</Text>
                      <Text style={styles.workoutReminderType}>{completedWorkoutForRPE.type.toUpperCase()}</Text>
                    </View>
                  )}
                  
                  <View style={styles.rpeScale}>
                    <Text style={styles.rpeScaleTitle}>Select your RPE (1-10)</Text>
                    <View style={styles.rpeButtons}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
                        <TouchableOpacity
                          key={rpe}
                          style={[
                            styles.rpeButton,
                            selectedRPE === rpe && styles.selectedRPEButton,
                            { backgroundColor: getRPEColor(rpe) }
                          ]}
                          onPress={() => setSelectedRPE(rpe)}
                        >
                          <Text style={[
                            styles.rpeButtonText,
                            selectedRPE === rpe && styles.selectedRPEButtonText
                          ]}>
                            {rpe}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <View style={styles.rpeDescriptions}>
                      <Text style={styles.rpeDescriptionText}>
                        {getRPEDescription(selectedRPE)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.rpeNotesSection}>
                    <Text style={styles.rpeNotesLabel}>Additional Notes (Optional)</Text>
                    <TextInput
                      style={styles.rpeNotesInput}
                      placeholder="How did you feel? Any issues with form, energy, etc."
                      placeholderTextColor={colors.textSecondary}
                      value={rpeNotes}
                      onChangeText={setRPENotes}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.submitRPEButton}
                    onPress={handleRPESubmission}
                  >
                    <CheckCircle2 size={20} color={colors.text} />
                    <Text style={styles.submitRPEText}>Submit RPE</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        {/* Program Introduction Modal */}
        <Modal
          visible={showIntroductionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowIntroductionModal(false);
            // Mark introduction as shown when modal is closed
            if (program) {
              markProgramIntroductionShown(program.id);
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {program && program.updateHistory && program.updateHistory.length > 0 ? 'Your Program Overview' : 'Welcome to Your Program!'}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setShowIntroductionModal(false);
                    // Mark introduction as shown when X button is clicked
                    if (program) {
                      markProgramIntroductionShown(program.id);
                    }
                  }}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {program && aiPlan && (
                  <View style={styles.introductionContainer}>
                    {/* Program Overview */}
                    <View style={styles.introSection}>
                      <View style={styles.introSectionHeader}>
                        <Target size={20} color={colors.primary} />
                        <Text style={styles.introSectionTitle}>Your Goal</Text>
                      </View>
                      <Text style={styles.introText}>
                        {program.targetMetric ? 
                          `You're working towards ${program.targetMetric} by ${program.goalDate ? new Date(program.goalDate).toLocaleDateString() : 'your target date'}.` :
                          `You've started a ${program.type} program to help you achieve your fitness goals.`
                        }
                      </Text>
                    </View>

                    {/* Program Structure */}
                    {aiPlan.phases && aiPlan.phases.length > 0 && (
                      <View style={styles.introSection}>
                        <View style={styles.introSectionHeader}>
                          <Calendar size={20} color={colors.primary} />
                          <Text style={styles.introSectionTitle}>Program Structure</Text>
                        </View>
                        <Text style={styles.introText}>
                          Your program is divided into {aiPlan.phases.length} phases over {aiPlan.phases.reduce((total: number, phase: any) => {
                            const duration = parseInt(phase.duration?.split(' ')[0] || '4', 10) || 4;
                            return total + duration;
                          }, 0)} weeks:
                        </Text>
                        {aiPlan.phases.map((phase: any, index: number) => (
                          <View key={index} style={styles.phaseOverview}>
                            <Text style={styles.phaseTitle}>
                              Phase {index + 1}: {phase.name} ({phase.duration})
                            </Text>
                            <Text style={styles.phaseFocus}>
                              Focus: {phase.focus}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Current Progress */}
                    <View style={styles.introSection}>
                      <View style={styles.introSectionHeader}>
                        <MapPin size={20} color={colors.primary} />
                        <Text style={styles.introSectionTitle}>Current Progress</Text>
                      </View>
                      <Text style={styles.introText}>
                        You're currently in Week {currentWeek} of your program.
                        {aiPlan.phases && aiPlan.phases.length > 0 && (() => {
                          // Find current phase
                          let weekCounter = 0;
                          let currentPhase = aiPlan.phases[0];
                          
                          for (const phase of aiPlan.phases) {
                            const phaseDuration = parseInt(phase.duration?.split(' ')[0] || '4', 10) || 4;
                            if (currentWeek > weekCounter && currentWeek <= weekCounter + phaseDuration) {
                              currentPhase = phase;
                              break;
                            }
                            weekCounter += phaseDuration;
                          }
                          
                          return ` You're in the "${currentPhase.name}" phase, focusing on ${currentPhase.focus.toLowerCase()}.`;
                        })()}
                      </Text>
                    </View>

                    {/* Training Schedule */}
                    <View style={styles.introSection}>
                      <View style={styles.introSectionHeader}>
                        <Dumbbell size={20} color={colors.primary} />
                        <Text style={styles.introSectionTitle}>Training Schedule</Text>
                      </View>
                      <Text style={styles.introText}>
                        You'll be training {program.trainingDaysPerWeek} days per week. Each workout is designed to progressively build towards your goal while considering your recovery and fitness level.
                      </Text>
                    </View>

                    {/* Recent Program Updates */}
                    {program.updateHistory && program.updateHistory.length > 0 && (
                      <View style={styles.introSection}>
                        <View style={styles.introSectionHeader}>
                          <RefreshCw size={20} color={colors.primary} />
                          <Text style={styles.introSectionTitle}>Recent Updates</Text>
                        </View>
                        <Text style={styles.introText}>
                          Your program has been personalized based on your feedback:
                        </Text>
                        {program.updateHistory.slice(-3).reverse().map((update: any, index: number) => (
                          <View key={index} style={styles.updateOverview}>
                            <Text style={styles.updateDate}>
                              {new Date(update.date).toLocaleDateString()}
                            </Text>
                            <Text style={styles.updateRequest}>
                              "{update.requestText}"
                            </Text>
                            {update.changes && update.changes.length > 0 && (
                              <View style={styles.updateChanges}>
                                {update.changes.slice(0, 2).map((change: string, changeIndex: number) => (
                                  <View key={changeIndex} style={styles.updateChange}>
                                    <View style={styles.bulletPoint} />
                                    <Text style={styles.updateChangeText}>{change}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Key Success Factors */}
                    {aiPlan.keySuccessFactors && (
                      <View style={styles.introSection}>
                        <View style={styles.introSectionHeader}>
                          <Zap size={20} color={colors.primary} />
                          <Text style={styles.introSectionTitle}>Keys to Success</Text>
                        </View>
                        {aiPlan.keySuccessFactors.map((factor: string, index: number) => (
                          <View key={index} style={styles.successFactor}>
                            <View style={styles.bulletPoint} />
                            <Text style={styles.successFactorText}>{factor}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Recovery & Nutrition */}
                    <View style={styles.introSection}>
                      <View style={styles.introSectionHeader}>
                        <Heart size={20} color={colors.primary} />
                        <Text style={styles.introSectionTitle}>Recovery & Nutrition</Text>
                      </View>
                      <Text style={styles.introText}>
                        {isConnectedToWhoop ? 
                          "Your WHOOP data will be used to adjust workout intensity based on your daily recovery. " :
                          "Make sure to prioritize sleep and recovery between workouts. "
                        }
                        {nutritionPlan ? 
                          `Your nutrition plan includes ${nutritionPlan.calories} calories daily with ${nutritionPlan.protein}g protein to support your goals.` :
                          "Complete your profile to get personalized nutrition recommendations."
                        }
                      </Text>
                    </View>

                    {/* Personalization Note */}
                    <View style={styles.introSection}>
                      <View style={styles.introSectionHeader}>
                        <Brain size={20} color={colors.primary} />
                        <Text style={styles.introSectionTitle}>AI-Powered Adaptation</Text>
                      </View>
                      <Text style={styles.introText}>
                        This program is powered by AI and will adapt based on your progress, recovery data, and feedback. Use the "Personalize Your Program" button anytime to request adjustments.
                      </Text>
                    </View>

                    {/* Call to Action */}
                    <View style={styles.introCallToAction}>
                      <Text style={styles.introCallToActionTitle}>Ready to Start?</Text>
                      <Text style={styles.introCallToActionText}>
                        Your first workout is waiting for you. Remember, consistency is key to achieving your goals!
                      </Text>
                      
                      <TouchableOpacity 
                        style={styles.startJourneyButton}
                        onPress={() => {
                          setShowIntroductionModal(false);
                          // Mark introduction as shown when user clicks "Start Your Journey"
                          if (program) {
                            markProgramIntroductionShown(program.id);
                          }
                        }}
                      >
                        <Play size={20} color={colors.text} />
                        <Text style={styles.startJourneyButtonText}>Start Your Journey</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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
  // Program Hero Card
  programHero: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  heroContent: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  heroTarget: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  heroDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
  },
  primaryActionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    position: 'relative',
  },
  secondaryActionText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  updateDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
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
  // Recovery Banner
  recoveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recoveryInfo: {
    alignItems: 'center',
    marginRight: 16,
  },
  recoveryScore: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  recoveryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recoveryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  recoveryMessage: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
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
  // Today's Focus Section
  todayFocus: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  todayDate: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  todayWorkouts: {
    gap: 12,
  },
  todayWorkoutCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  todayWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayWorkoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todayWorkoutText: {
    marginLeft: 12,
    flex: 1,
  },
  todayWorkoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  todayWorkoutType: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayIntensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayIntensityText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  todayWorkoutDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  todayWorkoutActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  todayStartText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  todayDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayDetailsText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
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
  // Weekly Plan Section
  weeklyPlanSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  weeklyPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  weeklyPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  weeklyPlanToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyPlanToggleText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
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
  strainWarningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  strainWarningText: {
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
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
  // Introduction modal styles
  introductionContainer: {
    paddingBottom: 20,
  },
  introSection: {
    marginBottom: 24,
  },
  introSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  introSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  introText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  phaseOverview: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  phaseIntroTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  phaseIntroFocus: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  successFactor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  successFactorText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    flex: 1,
  },
  introCallToAction: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  introCallToActionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  introCallToActionText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  startJourneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
  },
  startJourneyButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Update overview styles
  updateOverview: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  updateDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  updateRequest: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  updateChanges: {
    marginTop: 4,
  },
  updateChange: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  updateChangeText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  // Goal Progress
  goalProgress: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  goalProgressContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  goalProgressTarget: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  goalProgressDays: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  goalStrategyContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  goalStrategyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  goalStrategyText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  // Goal contribution styles
  goalContributionContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  goalContributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 4,
  },
  goalContributionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  // Goal reminder styles
  goalReminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  goalReminderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
    flex: 1,
  },
  // Goal impact analysis styles
  goalImpactContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  goalImpactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 12,
  },
  goalImpactItem: {
    marginBottom: 12,
  },
  goalImpactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  goalImpactText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  // Weekly training plan styles
  weeklyTrainingPlanContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  weeklyTrainingPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeklyTrainingPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  mileageSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
  },
  mileageSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  mileageSummaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  mileageSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  paceGuidanceContainer: {
    marginBottom: 16,
  },
  paceGuidanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  paceGuidanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paceGuidanceItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  paceGuidanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  paceGuidanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  trainingPhaseContainer: {
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  trainingPhaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  trainingPhaseDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  // Renaissance Periodization styles
  periodizationSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  periodizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodizationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  periodizationContent: {
    gap: 16,
  },
  periodizationPhase: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
  },
  phaseLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  phaseValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  phaseDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  rpeGuidance: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
  },
  rpeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rpeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 4,
  },
  rpeExplanation: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  volumeProgression: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
  },
  volumeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  volumeBar: {
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  volumeText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  // RPE Modal styles
  rpeContainer: {
    padding: 10,
  },
  rpeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  rpeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  workoutReminderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  workoutReminderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  workoutReminderType: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  rpeScale: {
    marginBottom: 24,
  },
  rpeScaleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  rpeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  rpeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRPEButton: {
    borderColor: colors.text,
    transform: [{ scale: 1.1 }],
  },
  rpeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  selectedRPEButtonText: {
    color: colors.text,
  },
  rpeDescriptions: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  rpeDescriptionText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  rpeNotesSection: {
    marginBottom: 24,
  },
  rpeNotesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  rpeNotesInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    minHeight: 80,
  },
  submitRPEButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  submitRPEText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Strain Analysis styles
  strainAnalysisContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  strainAnalysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 12,
  },
  strainAnalysisItem: {
    marginBottom: 12,
  },
  strainAnalysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  strainAnalysisText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  highRiskText: {
    color: colors.danger,
    fontWeight: '600',
  },
  mediumRiskText: {
    color: colors.warning,
    fontWeight: '600',
  },
  lowRiskText: {
    color: colors.success,
    fontWeight: '600',
  },
  // Recovery Optimization styles
  recoveryOptimizationContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  recoveryOptimizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 12,
  },
  recoverySection: {
    marginBottom: 16,
  },
  recoverySectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recoveryRequirement: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  recoveryTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  recoveryTipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  nutritionTargetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionTarget: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  nutritionTargetLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nutritionTargetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  // Warning Flags styles
  warningFlagsContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  warningFlagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
    marginBottom: 12,
  },
  warningFlag: {
    marginBottom: 12,
  },
  warningFlagLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  warningFlagText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});