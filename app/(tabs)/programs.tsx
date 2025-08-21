import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Switch,
  Dimensions
} from 'react-native';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  Timer, 
  Dumbbell, 
  Activity, 
  Heart, 
  Bike, 
  Trophy, 
  Weight, 
  Plus,
  X,
  Calendar,
  Target,
  Clock,
  Brain,
  Edit3,
  ChevronDown,
  ChevronUp,
  Utensils,
  Flame,
  Scale,
  Salad,
  User as UserIcon,
  ChevronRight as ChevronRightIcon
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWhoopStore } from '@/store/whoopStore';
import { 
  TrainingProgram, 
  StrengthTrainingConfig, 
  CardioTrainingConfig,
  NutritionPreferences 
} from '@/types/whoop';
import DateTimePicker from '@react-native-community/datetimepicker';
import HeroProgress from '@/components/HeroProgress';

// Training program templates with evidence-based approaches
const programTemplates = [
  {
    id: 'marathon',
    name: 'Marathon Training',
    type: 'marathon',
    description: 'Personalized training plan based on your race date and current fitness level',
    icon: <Activity size={24} color={colors.text} />,
    image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    details: {
      overview: 'This 16-week marathon training program follows periodization principles with a focus on progressive overload and recovery optimization. The plan adapts to your WHOOP recovery scores to ensure optimal training stimulus.',
      benefits: [
        'Personalized training based on recovery metrics',
        'Progressive long run buildup (10% rule)',
        'Polarized training approach (80/20 principle)',
        'Tapering strategy for race day peak performance'
      ],
      science: 'Research shows that polarized training (80% easy, 20% hard) leads to greater endurance gains than threshold training. This program incorporates recovery-based training adjustments, which studies have shown reduces injury risk by up to 30%.',
      weeklyStructure: [
        '1-2 quality workouts (intervals/tempo)',
        '1 long run (building progressively)',
        '2-3 easy recovery runs',
        '1-2 complete rest or cross-training days'
      ]
    },
    metricExample: 'e.g., 3:45:00 marathon time'
  },
  {
    id: 'half-marathon',
    name: 'Half Marathon',
    type: 'half-marathon',
    description: '12-week program with recovery-optimized training schedule',
    icon: <Activity size={24} color={colors.text} />,
    image: 'https://images.unsplash.com/photo-1486218119243-13883505764c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    details: {
      overview: 'This 12-week half marathon program balances endurance building with speed development, all while monitoring recovery to prevent overtraining. The plan is ideal for runners looking to improve their half marathon performance.',
      benefits: [
        'Recovery-based training adjustments',
        'Structured speed and tempo workouts',
        'Gradual long run progression',
        'Cross-training options for injury prevention'
      ],
      science: 'Research published in the Journal of Strength and Conditioning Research shows that varying training intensities leads to greater performance gains than steady-state training alone. This program incorporates both high-intensity intervals and longer steady-state runs.',
      weeklyStructure: [
        '1 interval session (VO2max development)',
        '1 tempo run (lactate threshold improvement)',
        '1 long run (endurance building)',
        '2-3 easy recovery runs',
        '1-2 rest or cross-training days'
      ]
    },
    metricExample: 'e.g., 1:45:00 half marathon time'
  },
  {
    id: 'cycling',
    name: 'Cycling Performance',
    type: 'cycling',
    description: 'Structured training to improve FTP and endurance',
    icon: <Bike size={24} color={colors.text} />,
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    details: {
      overview: 'This cycling program focuses on improving Functional Threshold Power (FTP) through structured intervals and endurance rides. Training is adjusted based on recovery metrics to ensure optimal adaptation.',
      benefits: [
        'FTP-focused interval sessions',
        'Recovery-based training adjustments',
        'Periodized training blocks',
        'Zone-based training approach'
      ],
      science: 'Studies show that sweet spot training (88-94% of FTP) provides an optimal balance of training stimulus and recovery cost. This program incorporates sweet spot work with polarized training principles for maximum adaptation.',
      weeklyStructure: [
        '2 high-intensity interval sessions',
        '1 sweet spot or threshold workout',
        '1 long endurance ride',
        '2-3 recovery/zone 2 rides',
        '1 complete rest day'
      ]
    },
    metricExample: 'e.g., 250W FTP or 100km ride time'
  },
  {
    id: 'powerlifting',
    name: 'Powerlifting Meet Prep',
    type: 'powerlifting',
    description: 'Periodized strength program optimized for your competition date',
    icon: <Dumbbell size={24} color={colors.text} />,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    details: {
      overview: 'This 16-week powerlifting program follows a scientific periodization model with volume, intensity, and taper phases. Training is adjusted based on recovery metrics to maximize strength gains while minimizing injury risk.',
      benefits: [
        'Periodized training blocks (volume → intensity → taper)',
        'Recovery-based autoregulation',
        'Technique refinement for competition lifts',
        'Accessory work for injury prevention'
      ],
      science: 'Research in the Journal of Strength and Conditioning Research shows that undulating periodization leads to greater strength gains than linear periodization. This program incorporates daily undulating periodization (DUP) with recovery-based autoregulation.',
      weeklyStructure: [
        '3-4 main lifting days (squat, bench, deadlift)',
        '1-2 accessory/hypertrophy days',
        '1-2 complete rest days',
        'Intensity and volume adjusted based on recovery metrics'
      ]
    },
    metricExample: 'e.g., 1000lb total (350/250/400)'
  },
  {
    id: 'hypertrophy',
    name: 'Hypertrophy Focus',
    type: 'hypertrophy',
    description: 'Build muscle mass with recovery-optimized training splits',
    icon: <Weight size={24} color={colors.text} />,
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    details: {
      overview: 'This hypertrophy program focuses on optimal muscle growth through evidence-based training volume, frequency, and intensity. Recovery metrics guide training adjustments to ensure maximum adaptation.',
      benefits: [
        'Optimal training volume (10-20 sets per muscle group weekly)',
        'Recovery-based training adjustments',
        'Progressive overload framework',
        'Nutrition guidance for muscle growth'
      ],
      science: 'Meta-analyses show that muscle hypertrophy is maximized with 10-20 weekly sets per muscle group at 60-80% 1RM, with exercises performed to near failure (1-3 RIR). This program implements these evidence-based parameters while adjusting based on recovery status.',
      weeklyStructure: [
        'Upper/Lower or Push/Pull/Legs split',
        'Each muscle group trained 2-3x weekly',
        'Training volume adjusted based on recovery',
        '1-2 complete rest days'
      ]
    },
    metricExample: 'e.g., 10lbs of muscle gain'
  },
  {
    id: 'weight-loss',
    name: 'Weight Loss',
    type: 'weight_loss',
    description: 'Combined nutrition and training program for sustainable fat loss',
    icon: <Weight size={24} color={colors.text} />,
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    details: {
      overview: 'This comprehensive weight loss program combines resistance training, cardio, and nutrition guidance for sustainable fat loss. Recovery metrics guide training intensity to ensure optimal results.',
      benefits: [
        'Combined resistance and cardio training',
        'Recovery-based training adjustments',
        'Nutrition guidance with caloric deficit',
        'Habit-building approach for long-term success'
      ],
      science: 'Research shows that combining resistance training with cardio leads to greater fat loss while preserving lean muscle mass compared to cardio alone. This program implements a moderate caloric deficit (15-20%) with adequate protein intake (1.6-2.2g/kg) for optimal body composition changes.',
      weeklyStructure: [
        '3-4 resistance training sessions',
        '2-3 cardio sessions (mix of HIIT and steady-state)',
        '1-2 complete rest days',
        'Daily caloric deficit of 300-500 calories'
      ]
    },
    metricExample: 'e.g., 15lbs of weight loss'
  },
  {
    id: 'heart-health',
    name: 'Heart Health',
    type: 'general',
    description: 'Cardiovascular fitness program with heart rate zone training',
    icon: <Heart size={24} color={colors.text} />,
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    details: {
      overview: 'This heart health program focuses on improving cardiovascular fitness through zone-based training. The program adapts to your recovery metrics to ensure optimal heart rate adaptations.',
      benefits: [
        'Heart rate zone-based training',
        'Recovery-based training adjustments',
        'Improved resting heart rate and HRV',
        'Reduced cardiovascular disease risk factors'
      ],
      science: 'Research in the Journal of the American Heart Association shows that regular zone 2 cardio training (60-70% max HR) for 150+ minutes weekly reduces cardiovascular disease risk by up to 40%. This program implements zone-based training with recovery monitoring for optimal adaptations.',
      weeklyStructure: [
        '3-4 zone 2 cardio sessions (60-70% max HR)',
        '1-2 higher intensity interval sessions',
        '1-2 active recovery or rest days',
        'Training adjusted based on HRV and recovery metrics'
      ]
    },
    metricExample: 'e.g., lower resting HR by 10bpm'
  }
];

// Training split options
const trainingSplitOptions = [
  { id: 'fullBody', name: 'Full Body', description: 'Train all major muscle groups in each session' },
  { id: 'upperLower', name: 'Upper/Lower', description: 'Alternate between upper and lower body days' },
  { id: 'pushPullLegs', name: 'Push/Pull/Legs', description: 'Separate pushing, pulling, and leg movements' },
  { id: 'bodyPart', name: 'Body Part Split', description: 'Focus on 1-2 muscle groups per session' },
  { id: 'custom', name: 'Custom', description: 'Design your own split based on preferences' }
];

// Dietary restriction options
const dietaryRestrictionOptions = [
  { id: 'none', name: 'None' },
  { id: 'vegetarian', name: 'Vegetarian' },
  { id: 'vegan', name: 'Vegan' },
  { id: 'glutenFree', name: 'Gluten-Free' },
  { id: 'dairyFree', name: 'Dairy-Free' },
  { id: 'keto', name: 'Ketogenic' },
  { id: 'paleo', name: 'Paleo' }
];

export default function ProgramsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('active');
  const { 
    activePrograms, 
    addProgram, 
    updateProgram, 
    removeProgram, 
    isLoading,
    generatePersonalizedTrainingPlan,
    data,
    isConnectedToWhoop,
    userProfile,
    macroTargets,
    calculateMacroTargets,
    updateProgramNutrition
  } = useWhoopStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [programConfig, setProgramConfig] = useState({
    goalDate: '',
    targetMetric: '',
    experienceLevel: 'intermediate',
    trainingDaysPerWeek: 4,
    notifications: true
  });
  
  // New state for strength training configuration
  const [strengthTraining, setStrengthTraining] = useState<StrengthTrainingConfig>({
    enabled: false,
    daysPerWeek: 3,
    split: 'fullBody',
    focusAreas: []
  });
  
  // State for custom training split
  const [customSplit, setCustomSplit] = useState('');
  
  // New state for cardio training configuration
  const [cardioTraining, setCardioTraining] = useState<CardioTrainingConfig>({
    enabled: false,
    daysPerWeek: 2,
    type: 'running',
    intensity: 'moderate',
    duration: 30
  });
  
  // New state for nutrition preferences
  const [nutritionPreferences, setNutritionPreferences] = useState<NutritionPreferences>({
    goal: 'maintain',
    dietaryRestrictions: [],
    mealFrequency: 3
  });
  
  // State for expanded sections
  const [strengthSectionExpanded, setStrengthSectionExpanded] = useState(false);
  const [cardioSectionExpanded, setCardioSectionExpanded] = useState(false);
  const [nutritionSectionExpanded, setNutritionSectionExpanded] = useState(false);
  
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [programDetails, setProgramDetails] = useState<any>(null);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [aiGeneratingPlan, setAiGeneratingPlan] = useState(false);
  const [aiPlanResult, setAiPlanResult] = useState<any>(null);
  
  // Check if user profile is complete
  const isProfileComplete = userProfile.name && userProfile.weight && userProfile.height && userProfile.age;
  
  useEffect(() => {
    // If user profile is complete but no macro targets, calculate them
    if (isProfileComplete && !macroTargets) {
      calculateMacroTargets();
    }
    
    // Update nutrition plans in all active programs if profile changes
    if (isProfileComplete && macroTargets) {
      activePrograms.forEach(program => {
        updateProgramNutrition(program.id);
      });
    }
  }, [isProfileComplete, macroTargets, userProfile]);
  
  const handleViewProgramDetails = (program: any) => {
    setProgramDetails(program);
    setDetailsModalVisible(true);
  };
  
  const handleStartProgram = (program: any) => {
    setSelectedProgram(program);
    
    // Set default goal date to 12 weeks from now for marathon, 8 weeks for others
    const defaultGoalDate = new Date();
    if (program.type === 'marathon' || program.type === 'half-marathon') {
      defaultGoalDate.setDate(defaultGoalDate.getDate() + 84); // 12 weeks
    } else {
      defaultGoalDate.setDate(defaultGoalDate.getDate() + 56); // 8 weeks
    }
    setDatePickerValue(defaultGoalDate);
    
    // Format date for display
    const formattedDate = defaultGoalDate.toISOString().split('T')[0];
    
    // Reset configuration
    setProgramConfig({
      goalDate: formattedDate,
      targetMetric: '',
      experienceLevel: 'intermediate',
      trainingDaysPerWeek: 4,
      notifications: true
    });
    
    // Reset strength training config
    setStrengthTraining({
      enabled: false,
      daysPerWeek: 3,
      split: 'fullBody',
      focusAreas: []
    });
    
    // Reset custom split
    setCustomSplit('');
    
    // Reset cardio training config
    setCardioTraining({
      enabled: false,
      daysPerWeek: 2,
      type: 'running',
      intensity: 'moderate',
      duration: 30
    });
    
    // Set nutrition preferences based on user profile if available
    if (isProfileComplete) {
      let goal: 'surplus' | 'maintain' | 'deficit' = 'maintain';
      if (userProfile.fitnessGoal === 'loseWeight') {
        goal = 'deficit';
      } else if (userProfile.fitnessGoal === 'gainMuscle') {
        goal = 'surplus';
      }
      
      setNutritionPreferences({
        goal,
        dietaryRestrictions: [],
        mealFrequency: 3
      });
    } else {
      // Default nutrition preferences
      setNutritionPreferences({
        goal: 'maintain',
        dietaryRestrictions: [],
        mealFrequency: 3
      });
    }
    
    // Reset expanded sections
    setStrengthSectionExpanded(false);
    setCardioSectionExpanded(false);
    setNutritionSectionExpanded(false);
    
    setModalVisible(true);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setDatePickerValue(selectedDate);
      // Format date for display
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setProgramConfig({...programConfig, goalDate: formattedDate});
    }
  };
  
  const handleSaveProgram = async () => {
    if (!selectedProgram) return;
    
    // Check if user profile is complete
    if (!isProfileComplete) {
      Alert.alert(
        "Complete Your Profile",
        "For the best personalized training experience, we recommend completing your profile first. This will help us create a nutrition plan tailored to your needs.",
        [
          { 
            text: "Complete Profile", 
            onPress: () => {
              setModalVisible(false);
              router.push('/profile');
            }
          },
          { 
            text: "Continue Without Profile", 
            onPress: () => generateProgram() 
          },
          { 
            text: "Cancel", 
            style: "cancel" 
          }
        ]
      );
      return;
    }
    
    // Check if WHOOP is connected
    if (!isConnectedToWhoop) {
      Alert.alert(
        "WHOOP Connection Recommended",
        "For the best personalized training experience, we recommend connecting your WHOOP. Would you like to connect now?",
        [
          { 
            text: "Connect WHOOP", 
            onPress: () => {
              setModalVisible(false);
              router.push('/connect-whoop');
            }
          },
          { 
            text: "Continue Without WHOOP", 
            onPress: () => generateProgram() 
          },
          { 
            text: "Cancel", 
            style: "cancel" 
          }
        ]
      );
      return;
    }
    
    generateProgram();
  };
  
  const generateProgram = async () => {
    setAiGeneratingPlan(true);
    
    try {
      console.log('Generating program with config:', {
        programType: selectedProgram.type,
        strengthTraining: strengthTraining.enabled ? strengthTraining : undefined,
        cardioTraining: cardioTraining.enabled ? cardioTraining : undefined,
        nutritionPreferences: nutritionPreferences,
        programConfig,
        customSplit: customSplit
      });
      
      // Generate AI-tailored program with strength/cardio training and nutrition preferences
      const strengthConfig = strengthTraining.enabled ? {
        ...strengthTraining,
        customSplit: strengthTraining.split === 'custom' ? customSplit : undefined
      } : undefined;
      
      console.log('Strength config being sent to AI:', strengthConfig);
      
      const aiPlan = await generatePersonalizedTrainingPlan(
        selectedProgram.type, 
        {
          ...programConfig,
          strengthTraining: strengthConfig,
          cardioTraining: cardioTraining.enabled ? cardioTraining : undefined,
          nutritionPreferences: nutritionPreferences
        }
      );
      
      setAiPlanResult(aiPlan);
      
      console.log('AI Plan generated:', aiPlan);
      
      // Validate strength training integration
      if (strengthTraining.enabled && aiPlan?.phases) {
        const strengthWorkouts = aiPlan.phases.flatMap((phase: any) => 
          phase.weeklyStructure?.filter((w: any) => w.type === 'strength') || []
        );
        console.log(`Strength training requested: ${strengthTraining.daysPerWeek} days/week`);
        console.log(`Strength workouts found in AI plan: ${strengthWorkouts.length}`);
        
        if (strengthWorkouts.length === 0) {
          console.warn('No strength training workouts found in AI plan despite being requested!');
        }
      }
      
      // Validate cardio training integration
      if (cardioTraining.enabled && aiPlan?.phases) {
        const cardioWorkouts = aiPlan.phases.flatMap((phase: any) => 
          phase.weeklyStructure?.filter((w: any) => w.type === 'cardio') || []
        );
        console.log(`Cardio training requested: ${cardioTraining.daysPerWeek} days/week`);
        console.log(`Cardio workouts found in AI plan: ${cardioWorkouts.length}`);
        
        if (cardioWorkouts.length === 0) {
          console.warn('No cardio training workouts found in AI plan despite being requested!');
        }
      }
      
      // Create the program with AI-generated plan
      const newProgram: Omit<TrainingProgram, 'id' | 'startDate' | 'active'> = {
        name: selectedProgram.name,
        type: selectedProgram.type,
        goalDate: programConfig.goalDate,
        targetMetric: programConfig.targetMetric,
        trainingDaysPerWeek: programConfig.trainingDaysPerWeek,
        experienceLevel: programConfig.experienceLevel as 'beginner' | 'intermediate' | 'advanced',
        strengthTraining: strengthTraining.enabled ? {
          ...strengthTraining,
          customSplit: strengthTraining.split === 'custom' ? customSplit : undefined
        } : undefined,
        cardioTraining: cardioTraining.enabled ? cardioTraining : undefined,
        nutritionPreferences: nutritionPreferences,
        nutritionPlan: aiPlan?.nutritionPlan,
        aiPlan: aiPlan
      };
      
      addProgram(newProgram);
      setModalVisible(false);
      setAiGeneratingPlan(false);
      
      // Show success message with training confirmation
      let successMessage = `Your personalized ${selectedProgram.name} program has been created based on your profile data and goals.`;
      if (strengthTraining.enabled) {
        successMessage += ` Strength training (${strengthTraining.daysPerWeek} days/week) has been integrated into your program.`;
      }
      if (cardioTraining.enabled) {
        successMessage += ` Cardio training (${cardioTraining.daysPerWeek} days/week, ${cardioTraining.type}) has been integrated into your program.`;
      }
      
      Alert.alert(
        "Program Created",
        successMessage,
        [{ text: "Great!" }]
      );
      
      // Switch to active tab
      setActiveTab('active');
      
    } catch (error) {
      console.error('Error generating AI plan:', error);
      setAiGeneratingPlan(false);
      
      let errorMessage = "There was an error creating your personalized program. Please try again.";
      if (strengthTraining.enabled || cardioTraining.enabled) {
        errorMessage += " If the issue persists, try creating the program without additional training first, then add it later through program customization.";
      }
      
      Alert.alert(
        "Error Creating Program",
        errorMessage,
        [{ text: "OK" }]
      );
    }
  };
  
  const handleDeleteProgram = (id: string) => {
    Alert.alert(
      "Delete Program",
      "Are you sure you want to delete this program?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            removeProgram(id);
          }
        }
      ]
    );
  };
  
  const renderActivePrograms = () => {
    if (activePrograms.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Active Programs</Text>
          <Text style={styles.emptyText}>
            Select a training program below to get started with AI-powered coaching tailored to your goals.
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => setActiveTab('browse')}
          >
            <Text style={styles.browseButtonText}>Browse Programs</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View>
        {/* Hero Section: Goal progress as hero element */}
        <View style={styles.heroSection} testID="programs-hero">
          <HeroProgress
            title={activePrograms[0]?.name ?? 'Your Program'}
            percentComplete={(() => {
              const p = activePrograms[0];
              if (!p?.startDate || !p?.goalDate) return 0;
              const start = new Date(p.startDate).getTime();
              const goal = new Date(p.goalDate).getTime();
              const now = Date.now();
              if (goal <= start) return 0;
              return Math.min(100, Math.max(0, Math.round(((now - start) / (goal - start)) * 100)));
            })()}
            milestoneLabel={activePrograms[0]?.targetMetric ?? undefined}
            nextMilestone={activePrograms[0]?.goalDate ? `Goal ${activePrograms[0]?.goalDate}` : undefined}
            primaryActionLabel={'Open Program'}
            onPrimaryAction={() => router.push(`/program-detail?id=${activePrograms[0]?.id}`)}
            secondaryActionLabel={activePrograms.length > 1 ? 'Switch' : undefined}
            onSecondaryAction={activePrograms.length > 1 ? () => setActiveTab('browse') : undefined}
          />
        </View>
        {activePrograms.map(program => {
          // Find the template for this program to get the image
          const template = programTemplates.find(t => t.type === program.type);
          
          // Calculate progress based on start date and goal date
          let progressPercentage = 0;
          if (program.startDate && program.goalDate) {
            const startDate = new Date(program.startDate).getTime();
            const goalDate = new Date(program.goalDate).getTime();
            const currentDate = Date.now();
            
            if (goalDate > startDate) {
              progressPercentage = Math.min(
                100, 
                Math.round(((currentDate - startDate) / (goalDate - startDate)) * 100)
              );
            }
          }
          
          return (
            <TouchableOpacity 
              key={program.id}
              style={styles.activeProgram}
              onPress={() => router.push(`/program-detail?id=${program.id}`)}
            >
              {template?.image && (
                <Image 
                  source={{ uri: template.image }} 
                  style={styles.activeProgramImage} 
                  resizeMode="cover"
                />
              )}
              <View style={styles.activeProgramOverlay} />
              
              <View style={styles.programHeader}>
                <Text style={styles.programName}>{program.name}</Text>
                <View style={styles.programBadge}>
                  <Text style={styles.programBadgeText}>ACTIVE</Text>
                </View>
              </View>
              
              <View style={styles.programDetails}>
                <View style={styles.programDetail}>
                  <Text style={styles.detailLabel}>Goal Date</Text>
                  <Text style={styles.detailValue}>{program.goalDate || 'Not set'}</Text>
                </View>
                
                <View style={styles.programDetail}>
                  <Text style={styles.detailLabel}>Target</Text>
                  <Text style={styles.detailValue}>{program.targetMetric || 'Not set'}</Text>
                </View>
                
                <View style={styles.programDetail}>
                  <Text style={styles.detailLabel}>Training Days</Text>
                  <Text style={styles.detailValue}>{program.trainingDaysPerWeek} days/week</Text>
                </View>
              </View>
              
              <View style={styles.programProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                </View>
                <Text style={styles.progressText}>{progressPercentage}% Complete</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteProgram(program.id)}
              >
                <X size={16} color={colors.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderProgramCard = (program: any) => (
    <TouchableOpacity 
      key={program.id}
      style={styles.programCard}
      onPress={() => handleViewProgramDetails(program)}
    >
      <Image 
        source={{ uri: program.image }} 
        style={styles.programImage} 
        resizeMode="cover"
      />
      <View style={styles.programOverlay} />
      <View style={styles.programContent}>
        <View style={styles.iconContainer}>
          {program.icon}
        </View>
        <View style={styles.programInfo}>
          <Text style={styles.programTitle}>{program.name}</Text>
          <Text style={styles.programDescription}>{program.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Toggle dietary restriction selection
  const toggleDietaryRestriction = (restrictionId: string) => {
    setNutritionPreferences(prev => {
      const currentRestrictions = prev.dietaryRestrictions || [];
      
      if (restrictionId === 'none') {
        // If "None" is selected, clear all other restrictions
        return {
          ...prev,
          dietaryRestrictions: []
        };
      } else {
        // If any other restriction is selected, remove "None" if present
        let newRestrictions = [...currentRestrictions];
        
        // Remove "none" if it exists
        newRestrictions = newRestrictions.filter(r => r !== 'none');
        
        // Toggle the selected restriction
        if (newRestrictions.includes(restrictionId)) {
          newRestrictions = newRestrictions.filter(r => r !== restrictionId);
        } else {
          newRestrictions.push(restrictionId);
        }
        
        return {
          ...prev,
          dietaryRestrictions: newRestrictions
        };
      }
    });
  };

  // Get the appropriate metric example based on program type
  const getMetricPlaceholder = (programType: string) => {
    const program = programTemplates.find(p => p.type === programType);
    return program?.metricExample || "e.g., specific goal";
  };

  // Get device dimensions for responsive sizing
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isSmallDevice = SCREEN_WIDTH < 375;
  const bottomPadding = Platform.OS === 'ios' ? (isSmallDevice ? 80 : 100) : 32;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active Programs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
            Browse Programs
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'active' ? (
          renderActivePrograms()
        ) : (
          <>
            {!isProfileComplete && (
              <TouchableOpacity 
                style={styles.profilePrompt}
                onPress={() => router.push('/profile')}
              >
                <View style={styles.profilePromptIcon}>
                  <UserIcon size={24} color={colors.text} />
                </View>
                <View style={styles.profilePromptContent}>
                  <Text style={styles.profilePromptTitle}>Complete Your Profile</Text>
                  <Text style={styles.profilePromptText}>
                    Set up your profile to get personalized nutrition recommendations and training plans
                  </Text>
                </View>
                <ChevronRightIcon size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            
            <Text style={styles.sectionTitle}>Endurance</Text>
            {programTemplates.filter(p => p.type === 'marathon' || p.type === 'cycling' || p.type === 'half-marathon').map(renderProgramCard)}
            
            <Text style={styles.sectionTitle}>Strength</Text>
            {programTemplates.filter(p => p.type === 'powerlifting' || p.type === 'hypertrophy').map(renderProgramCard)}
            
            <Text style={styles.sectionTitle}>General Fitness</Text>
            {programTemplates.filter(p => p.type === 'weight_loss' || p.type === 'general').map(renderProgramCard)}
            
            <TouchableOpacity style={styles.customProgramButton}>
              <Plus size={20} color={colors.text} />
              <Text style={styles.customProgramText}>Create Custom Program</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      
      {/* Program Configuration Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Configure {selectedProgram?.name}</Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                  disabled={aiGeneratingPlan}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              {aiGeneratingPlan ? (
                <View style={styles.aiGeneratingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.aiGeneratingTitle}>Creating Your Personalized Plan</Text>
                  <Text style={styles.aiGeneratingText}>
                    Our AI coach is analyzing your profile data and goals to create a completely 
                    tailored training program just for you. This may take a moment...
                  </Text>
                  <View style={styles.aiGeneratingSteps}>
                    <View style={styles.aiGeneratingStep}>
                      <Brain size={18} color={colors.primary} />
                      <Text style={styles.aiGeneratingStepText}>Analyzing your recovery patterns</Text>
                    </View>
                    <View style={styles.aiGeneratingStep}>
                      <Activity size={18} color={colors.primary} />
                      <Text style={styles.aiGeneratingStepText}>Evaluating your training capacity</Text>
                    </View>
                    <View style={styles.aiGeneratingStep}>
                      <Calendar size={18} color={colors.primary} />
                      <Text style={styles.aiGeneratingStepText}>Building periodized training blocks</Text>
                    </View>
                    <View style={styles.aiGeneratingStep}>
                      <Trophy size={18} color={colors.primary} />
                      <Text style={styles.aiGeneratingStepText}>Optimizing for your goal date</Text>
                    </View>
                    <View style={styles.aiGeneratingStep}>
                      <Utensils size={18} color={colors.primary} />
                      <Text style={styles.aiGeneratingStepText}>Creating personalized nutrition plan</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <ScrollView 
                  style={styles.modalScroll}
                  contentContainerStyle={Platform.OS === 'ios' ? { paddingBottom: 40 } : undefined}
                >
                  {!isProfileComplete && (
                    <TouchableOpacity 
                      style={styles.profilePromptModal}
                      onPress={() => {
                        setModalVisible(false);
                        router.push('/profile');
                      }}
                    >
                      <View style={styles.profilePromptIcon}>
                        <UserIcon size={24} color={colors.text} />
                      </View>
                      <View style={styles.profilePromptContent}>
                        <Text style={styles.profilePromptTitle}>Complete Your Profile</Text>
                        <Text style={styles.profilePromptText}>
                          Set up your profile to get personalized nutrition recommendations based on your body metrics
                        </Text>
                      </View>
                      <ChevronRightIcon size={20} color={colors.text} />
                    </TouchableOpacity>
                  )}
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Goal Date</Text>
                    <TouchableOpacity 
                      style={styles.inputContainer}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Calendar size={20} color={colors.textSecondary} />
                      <Text style={[styles.input, !programConfig.goalDate && styles.inputPlaceholder]}>
                        {programConfig.goalDate || "Select a date"}
                      </Text>
                    </TouchableOpacity>
                    
                    {showDatePicker && (
                      <DateTimePicker
                        value={datePickerValue}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                      />
                    )}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Target Metric</Text>
                    <View style={styles.inputContainer}>
                      <Target size={20} color={colors.textSecondary} />
                      <TextInput
                        style={styles.input}
                        placeholder={selectedProgram ? getMetricPlaceholder(selectedProgram.type) : "Enter your goal"}
                        placeholderTextColor={colors.textSecondary}
                        value={programConfig.targetMetric}
                        onChangeText={(text) => setProgramConfig({...programConfig, targetMetric: text})}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Experience Level</Text>
                    <View style={styles.pillContainer}>
                      {['beginner', 'intermediate', 'advanced'].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.pill,
                            programConfig.experienceLevel === level && styles.activePill
                          ]}
                          onPress={() => setProgramConfig({...programConfig, experienceLevel: level})}
                        >
                          <Text 
                            style={[
                              styles.pillText,
                              programConfig.experienceLevel === level && styles.activePillText
                            ]}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Training Days Per Week</Text>
                    <View style={styles.pillContainer}>
                      {[3, 4, 5, 6].map((days) => (
                        <TouchableOpacity
                          key={days}
                          style={[
                            styles.pill,
                            programConfig.trainingDaysPerWeek === days && styles.activePill
                          ]}
                          onPress={() => setProgramConfig({...programConfig, trainingDaysPerWeek: days})}
                        >
                          <Text 
                            style={[
                              styles.pillText,
                              programConfig.trainingDaysPerWeek === days && styles.activePillText
                            ]}
                          >
                            {days} days
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  {/* Strength Training Section - Only show for non-strength programs */}
                  {selectedProgram?.type !== 'powerlifting' && selectedProgram?.type !== 'hypertrophy' && (
                    <View style={styles.sectionContainer}>
                      <TouchableOpacity 
                        style={styles.sectionHeader}
                        onPress={() => setStrengthSectionExpanded(!strengthSectionExpanded)}
                      >
                        <View style={styles.sectionHeaderLeft}>
                          <Dumbbell size={20} color={colors.primary} />
                          <Text style={styles.sectionHeaderTitle}>Strength Training</Text>
                        </View>
                        <View style={styles.sectionHeaderRight}>
                          <Switch
                            value={strengthTraining.enabled}
                            onValueChange={(value) => {
                              setStrengthTraining(prev => ({...prev, enabled: value}));
                              if (value && !strengthSectionExpanded) {
                                setStrengthSectionExpanded(true);
                              }
                            }}
                            trackColor={{ false: '#2A2A2A', true: colors.primary }}
                            thumbColor={colors.text}
                          />
                          {strengthSectionExpanded ? 
                            <ChevronUp size={20} color={colors.text} style={{marginLeft: 8}} /> : 
                            <ChevronDown size={20} color={colors.text} style={{marginLeft: 8}} />
                          }
                        </View>
                      </TouchableOpacity>
                      
                      {strengthSectionExpanded && strengthTraining.enabled && (
                        <View style={styles.sectionContent}>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Strength Training Days</Text>
                            <View style={styles.pillContainer}>
                              {[2, 3, 4, 5].map((days) => (
                                <TouchableOpacity
                                  key={days}
                                  style={[
                                    styles.pill,
                                    strengthTraining.daysPerWeek === days && styles.activePill
                                  ]}
                                  onPress={() => setStrengthTraining({...strengthTraining, daysPerWeek: days})}
                                >
                                  <Text 
                                    style={[
                                      styles.pillText,
                                      strengthTraining.daysPerWeek === days && styles.activePillText
                                    ]}
                                  >
                                    {days} days
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                          
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Training Split</Text>
                            {trainingSplitOptions.map((split) => (
                              <TouchableOpacity
                                key={split.id}
                                style={[
                                  styles.splitOption,
                                  strengthTraining.split === split.id && styles.activeSplitOption
                                ]}
                                onPress={() => setStrengthTraining({...strengthTraining, split: split.id as any})}
                              >
                                <View style={styles.splitOptionHeader}>
                                  <Text 
                                    style={[
                                      styles.splitOptionName,
                                      strengthTraining.split === split.id && styles.activeSplitOptionText
                                    ]}
                                  >
                                    {split.name}
                                  </Text>
                                  {strengthTraining.split === split.id && (
                                    <View style={styles.checkmarkContainer}>
                                      <Dumbbell size={16} color={colors.text} />
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.splitOptionDescription}>{split.description}</Text>
                              </TouchableOpacity>
                            ))}
                            
                            {strengthTraining.split === 'custom' && (
                              <View style={styles.customSplitContainer}>
                                <Text style={styles.customSplitLabel}>Describe your custom split:</Text>
                                <View style={styles.inputContainer}>
                                  <Edit3 size={20} color={colors.textSecondary} />
                                  <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Chest/Triceps, Back/Biceps, Legs/Shoulders, Rest, Repeat"
                                    placeholderTextColor={colors.textSecondary}
                                    value={customSplit}
                                    onChangeText={setCustomSplit}
                                    multiline={true}
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                  />
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Cardio Training Section - Only show for strength programs */}
                  {(selectedProgram?.type === 'powerlifting' || selectedProgram?.type === 'hypertrophy') && (
                    <View style={styles.sectionContainer}>
                      <TouchableOpacity 
                        style={styles.sectionHeader}
                        onPress={() => setCardioSectionExpanded(!cardioSectionExpanded)}
                      >
                        <View style={styles.sectionHeaderLeft}>
                          <Heart size={20} color={colors.primary} />
                          <Text style={styles.sectionHeaderTitle}>Optional Cardio</Text>
                        </View>
                        <View style={styles.sectionHeaderRight}>
                          <Switch
                            value={cardioTraining.enabled}
                            onValueChange={(value) => {
                              setCardioTraining(prev => ({...prev, enabled: value}));
                              if (value && !cardioSectionExpanded) {
                                setCardioSectionExpanded(true);
                              }
                            }}
                            trackColor={{ false: '#2A2A2A', true: colors.primary }}
                            thumbColor={colors.text}
                          />
                          {cardioSectionExpanded ? 
                            <ChevronUp size={20} color={colors.text} style={{marginLeft: 8}} /> : 
                            <ChevronDown size={20} color={colors.text} style={{marginLeft: 8}} />
                          }
                        </View>
                      </TouchableOpacity>
                      
                      {cardioSectionExpanded && cardioTraining.enabled && (
                        <View style={styles.sectionContent}>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Cardio Days Per Week</Text>
                            <View style={styles.pillContainer}>
                              {[1, 2, 3, 4].map((days) => (
                                <TouchableOpacity
                                  key={days}
                                  style={[
                                    styles.pill,
                                    cardioTraining.daysPerWeek === days && styles.activePill
                                  ]}
                                  onPress={() => setCardioTraining({...cardioTraining, daysPerWeek: days})}
                                >
                                  <Text 
                                    style={[
                                      styles.pillText,
                                      cardioTraining.daysPerWeek === days && styles.activePillText
                                    ]}
                                  >
                                    {days} days
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                          
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Cardio Type</Text>
                            <View style={styles.cardioTypeContainer}>
                              {[
                                { id: 'running', name: 'Running', icon: <Activity size={20} color={cardioTraining.type === 'running' ? colors.text : colors.textSecondary} /> },
                                { id: 'cycling', name: 'Cycling', icon: <Bike size={20} color={cardioTraining.type === 'cycling' ? colors.text : colors.textSecondary} /> },
                                { id: 'swimming', name: 'Swimming', icon: <Activity size={20} color={cardioTraining.type === 'swimming' ? colors.text : colors.textSecondary} /> },
                                { id: 'rowing', name: 'Rowing', icon: <Activity size={20} color={cardioTraining.type === 'rowing' ? colors.text : colors.textSecondary} /> },
                                { id: 'mixed', name: 'Mixed', icon: <Heart size={20} color={cardioTraining.type === 'mixed' ? colors.text : colors.textSecondary} /> }
                              ].map((type) => (
                                <TouchableOpacity
                                  key={type.id}
                                  style={[
                                    styles.cardioTypeOption,
                                    cardioTraining.type === type.id && styles.activeCardioTypeOption
                                  ]}
                                  onPress={() => setCardioTraining({...cardioTraining, type: type.id as any})}
                                >
                                  {type.icon}
                                  <Text 
                                    style={[
                                      styles.cardioTypeText,
                                      cardioTraining.type === type.id && styles.activeCardioTypeText
                                    ]}
                                  >
                                    {type.name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                          
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Intensity Level</Text>
                            <View style={styles.pillContainer}>
                              {[
                                { id: 'low', name: 'Low (Recovery)' },
                                { id: 'moderate', name: 'Moderate' },
                                { id: 'high', name: 'High (HIIT)' },
                                { id: 'mixed', name: 'Mixed' }
                              ].map((intensity) => (
                                <TouchableOpacity
                                  key={intensity.id}
                                  style={[
                                    styles.pill,
                                    cardioTraining.intensity === intensity.id && styles.activePill
                                  ]}
                                  onPress={() => setCardioTraining({...cardioTraining, intensity: intensity.id as any})}
                                >
                                  <Text 
                                    style={[
                                      styles.pillText,
                                      cardioTraining.intensity === intensity.id && styles.activePillText
                                    ]}
                                  >
                                    {intensity.name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                          
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Session Duration (minutes)</Text>
                            <View style={styles.pillContainer}>
                              {[20, 30, 45, 60].map((duration) => (
                                <TouchableOpacity
                                  key={duration}
                                  style={[
                                    styles.pill,
                                    cardioTraining.duration === duration && styles.activePill
                                  ]}
                                  onPress={() => setCardioTraining({...cardioTraining, duration})}
                                >
                                  <Text 
                                    style={[
                                      styles.pillText,
                                      cardioTraining.duration === duration && styles.activePillText
                                    ]}
                                  >
                                    {duration} min
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Nutrition Section */}
                  <View style={styles.sectionContainer}>
                    <TouchableOpacity 
                      style={styles.sectionHeader}
                      onPress={() => setNutritionSectionExpanded(!nutritionSectionExpanded)}
                    >
                      <View style={styles.sectionHeaderLeft}>
                        <Utensils size={20} color={colors.primary} />
                        <Text style={styles.sectionHeaderTitle}>Nutrition Preferences</Text>
                      </View>
                      <View style={styles.sectionHeaderRight}>
                        {nutritionSectionExpanded ? 
                          <ChevronUp size={20} color={colors.text} /> : 
                          <ChevronDown size={20} color={colors.text} />
                        }
                      </View>
                    </TouchableOpacity>
                    
                    {nutritionSectionExpanded && (
                      <View style={styles.sectionContent}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Calorie Goal</Text>
                          <View style={styles.nutritionGoalContainer}>
                            <TouchableOpacity
                              style={[
                                styles.nutritionGoalOption,
                                nutritionPreferences.goal === 'deficit' && styles.activeNutritionGoalOption
                              ]}
                              onPress={() => setNutritionPreferences({...nutritionPreferences, goal: 'deficit'})}
                            >
                              <Weight size={24} color={nutritionPreferences.goal === 'deficit' ? colors.text : colors.textSecondary} />
                              <Text 
                                style={[
                                  styles.nutritionGoalText,
                                  nutritionPreferences.goal === 'deficit' && styles.activeNutritionGoalText
                                ]}
                              >
                                Weight Loss
                              </Text>
                              <Text style={styles.nutritionGoalDescription}>Calorie deficit</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={[
                                styles.nutritionGoalOption,
                                nutritionPreferences.goal === 'maintain' && styles.activeNutritionGoalOption
                              ]}
                              onPress={() => setNutritionPreferences({...nutritionPreferences, goal: 'maintain'})}
                            >
                              <Scale size={24} color={nutritionPreferences.goal === 'maintain' ? colors.text : colors.textSecondary} />
                              <Text 
                                style={[
                                  styles.nutritionGoalText,
                                  nutritionPreferences.goal === 'maintain' && styles.activeNutritionGoalText
                                ]}
                              >
                                Maintain
                              </Text>
                              <Text style={styles.nutritionGoalDescription}>Calorie balance</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={[
                                styles.nutritionGoalOption,
                                nutritionPreferences.goal === 'surplus' && styles.activeNutritionGoalOption
                              ]}
                              onPress={() => setNutritionPreferences({...nutritionPreferences, goal: 'surplus'})}
                            >
                              <Flame size={24} color={nutritionPreferences.goal === 'surplus' ? colors.text : colors.textSecondary} />
                              <Text 
                                style={[
                                  styles.nutritionGoalText,
                                  nutritionPreferences.goal === 'surplus' && styles.activeNutritionGoalText
                                ]}
                              >
                                Muscle Gain
                              </Text>
                              <Text style={styles.nutritionGoalDescription}>Calorie surplus</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Dietary Restrictions</Text>
                          <View style={styles.dietaryRestrictionsContainer}>
                            {dietaryRestrictionOptions.map((restriction) => (
                              <TouchableOpacity
                                key={restriction.id}
                                style={[
                                  styles.dietaryRestrictionOption,
                                  (nutritionPreferences.dietaryRestrictions || []).includes(restriction.id) && 
                                    styles.activeDietaryRestrictionOption
                                ]}
                                onPress={() => toggleDietaryRestriction(restriction.id)}
                              >
                                <Text 
                                  style={[
                                    styles.dietaryRestrictionText,
                                    (nutritionPreferences.dietaryRestrictions || []).includes(restriction.id) && 
                                      styles.activeDietaryRestrictionText
                                  ]}
                                >
                                  {restriction.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                        
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Meals Per Day</Text>
                          <View style={styles.pillContainer}>
                            {[2, 3, 4, 5, 6].map((meals) => (
                              <TouchableOpacity
                                key={meals}
                                style={[
                                  styles.pill,
                                  nutritionPreferences.mealFrequency === meals && styles.activePill
                                ]}
                                onPress={() => setNutritionPreferences({...nutritionPreferences, mealFrequency: meals})}
                              >
                                <Text 
                                  style={[
                                    styles.pillText,
                                    nutritionPreferences.mealFrequency === meals && styles.activePillText
                                  ]}
                                >
                                  {meals} meals
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.aiInfoContainer}>
                    <Brain size={20} color={colors.primary} />
                    <Text style={styles.aiInfoText}>
                      Our AI coach will analyze your profile data and create a completely personalized 
                      training program based on your current fitness level, body metrics, and goals.
                      {selectedProgram?.type !== 'powerlifting' && selectedProgram?.type !== 'hypertrophy' && strengthTraining.enabled ? ` Strength training (${strengthTraining.daysPerWeek} days/week, ${strengthTraining.split === 'custom' ? 'custom' : strengthTraining.split} split${strengthTraining.split === 'custom' && customSplit ? ` - ${customSplit}` : ''}) will be integrated into your program.` : ""}
                      {(selectedProgram?.type === 'powerlifting' || selectedProgram?.type === 'hypertrophy') && cardioTraining.enabled ? ` Optional cardio training (${cardioTraining.daysPerWeek} days/week, ${cardioTraining.type}, ${cardioTraining.intensity} intensity) will be added to complement your strength training.` : ""}
                      {selectedProgram?.type === 'powerlifting' || selectedProgram?.type === 'hypertrophy' ? " This strength-focused program is already optimized for your training goals." : ""}
                      {" A personalized nutrition plan will be created to support your goals."}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={handleSaveProgram}
                  >
                    <Trophy size={20} color={colors.text} />
                    <Text style={styles.startButtonText}>Create Personalized Program</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Program Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{programDetails?.name}</Text>
              <TouchableOpacity 
                onPress={() => setDetailsModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={Platform.OS === 'ios' ? { paddingBottom: 40 } : undefined}
            >
              {programDetails?.image && (
                <Image 
                  source={{ uri: programDetails.image }} 
                  style={styles.detailsImage} 
                  resizeMode="cover"
                />
              )}
              
              <Text style={styles.detailsOverview}>{programDetails?.details.overview}</Text>
              
              <Text style={styles.detailsSubtitle}>Key Benefits</Text>
              {programDetails?.details.benefits.map((benefit: string, index: number) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
              
              <Text style={styles.detailsSubtitle}>The Science</Text>
              <Text style={styles.detailsText}>{programDetails?.details.science}</Text>
              
              <Text style={styles.detailsSubtitle}>Weekly Structure</Text>
              {programDetails?.details.weeklyStructure.map((item: string, index: number) => (
                <View key={index} style={styles.structureItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.structureText}>{item}</Text>
                </View>
              ))}
              
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => {
                  setDetailsModalVisible(false);
                  handleStartProgram(programDetails);
                }}
              >
                <Trophy size={20} color={colors.text} />
                <Text style={styles.startButtonText}>Start This Program</Text>
              </TouchableOpacity>
            </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: bottomPadding, // Consistent padding for iOS
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  programCard: {
    height: 160,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  programImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  programOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  programContent: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(93, 95, 239, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  browseButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  customProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginBottom: bottomPadding - 16, // Adjusted for consistent bottom padding
  },
  heroSection: {
    marginBottom: 20,
  },
  customProgramText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeProgram: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeProgramImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  activeProgramOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  programName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  programBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  programBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  programDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    zIndex: 1,
  },
  programDetail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  programProgress: {
    marginTop: 10,
    zIndex: 1,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
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
    maxHeight: '90%',
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
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
    fontSize: 16,
    marginLeft: 12,
  },
  inputPlaceholder: {
    color: colors.textSecondary,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  activePill: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  activePillText: {
    color: colors.text,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  startButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailsOverview: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 20,
  },
  detailsSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  structureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  structureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  aiGeneratingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  aiGeneratingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  aiGeneratingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  aiGeneratingSteps: {
    width: '100%',
    marginTop: 16,
  },
  aiGeneratingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiGeneratingStepText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
  },
  aiInfoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  aiInfoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  // New styles for strength training and nutrition sections
  sectionContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  sectionContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  splitOption: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activeSplitOption: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  splitOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  splitOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  activeSplitOptionText: {
    color: colors.primary,
  },
  splitOptionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionGoalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionGoalOption: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeNutritionGoalOption: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  nutritionGoalText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  activeNutritionGoalText: {
    color: colors.primary,
  },
  nutritionGoalDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dietaryRestrictionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dietaryRestrictionOption: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  activeDietaryRestrictionOption: {
    backgroundColor: colors.primary,
  },
  dietaryRestrictionText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  activeDietaryRestrictionText: {
    color: colors.text,
    fontWeight: '600',
  },
  // Profile prompt styles
  profilePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  profilePromptModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  profilePromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profilePromptContent: {
    flex: 1,
  },
  profilePromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  profilePromptText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Cardio training styles
  cardioTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardioTypeOption: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 2,
    marginBottom: 8,
    minWidth: '18%',
  },
  activeCardioTypeOption: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cardioTypeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  activeCardioTypeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Custom split styles
  customSplitContainer: {
    marginTop: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  customSplitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
});