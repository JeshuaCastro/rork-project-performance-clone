import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  User, 
  ChevronLeft, 
  Save,
  Scale,
  Ruler,
  Percent,
  Calendar,
  Activity,
  Target,
  BarChart
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWhoopStore } from '@/store/whoopStore';
import { UserProfile } from '@/types/whoop';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, updateUserProfile, calculateMacroTargets, macroTargets, addWeightEntry } = useWhoopStore();
  
  const [profile, setProfile] = useState<UserProfile>({...userProfile});
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  useEffect(() => {
    // Initialize with current profile
    setProfile({...userProfile});
  }, [userProfile]);
  
  const handleSave = async () => {
    // Validate inputs
    if (!profile.name) {
      Alert.alert("Missing Information", "Please enter your name");
      return;
    }
    
    if (!profile.age || profile.age < 15 || profile.age > 100) {
      Alert.alert("Invalid Age", "Please enter a valid age between 15 and 100");
      return;
    }
    
    if (!profile.weight || profile.weight < 30 || profile.weight > 300) {
      Alert.alert("Invalid Weight", "Please enter a valid weight between 30 and 300 kg");
      return;
    }
    
    if (!profile.height || profile.height < 100 || profile.height > 250) {
      Alert.alert("Invalid Height", "Please enter a valid height between 100 and 250 cm");
      return;
    }
    
    if (profile.bodyFat !== undefined && (profile.bodyFat < 3 || profile.bodyFat > 50)) {
      Alert.alert("Invalid Body Fat", "Please enter a valid body fat percentage between 3 and 50%");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Check if weight changed to add to weight history
      const weightChanged = profile.weight !== userProfile.weight;
      
      // Update profile in store
      updateUserProfile(profile);
      
      // Calculate new macro targets
      setIsCalculating(true);
      calculateMacroTargets();
      setIsCalculating(false);
      
      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully and your nutrition targets have been recalculated.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert("Error", "There was an error saving your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const activityLevelOptions = [
    { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { id: 'lightlyActive', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { id: 'moderatelyActive', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { id: 'veryActive', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
    { id: 'extremelyActive', label: 'Extremely Active', description: 'Very hard exercise & physical job' }
  ];
  
  const fitnessGoalOptions = [
    { id: 'loseWeight', label: 'Lose Weight', icon: <Scale size={20} color={colors.text} /> },
    { id: 'maintainWeight', label: 'Maintain Weight', icon: <Target size={20} color={colors.text} /> },
    { id: 'gainMuscle', label: 'Gain Muscle', icon: <Activity size={20} color={colors.text} /> },
    { id: 'improvePerformance', label: 'Improve Performance', icon: <BarChart size={20} color={colors.text} /> }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Save size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <User size={40} color={colors.text} />
            </View>
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <Text style={styles.inputLabel}>Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.textSecondary}
                value={profile.name}
                onChangeText={(text) => setProfile({...profile, name: text})}
              />
            </View>
            
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Age</Text>
                <View style={styles.inputContainer}>
                  <Calendar size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Years"
                    placeholderTextColor={colors.textSecondary}
                    value={profile.age?.toString()}
                    onChangeText={(text) => setProfile({...profile, age: parseInt(text) || 0})}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderSelector}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      profile.gender === 'male' && styles.selectedGenderOption
                    ]}
                    onPress={() => setProfile({...profile, gender: 'male'})}
                  >
                    <Text 
                      style={[
                        styles.genderText,
                        profile.gender === 'male' && styles.selectedGenderText
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      profile.gender === 'female' && styles.selectedGenderOption
                    ]}
                    onPress={() => setProfile({...profile, gender: 'female'})}
                  >
                    <Text 
                      style={[
                        styles.genderText,
                        profile.gender === 'female' && styles.selectedGenderText
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      profile.gender === 'other' && styles.selectedGenderOption
                    ]}
                    onPress={() => setProfile({...profile, gender: 'other'})}
                  >
                    <Text 
                      style={[
                        styles.genderText,
                        profile.gender === 'other' && styles.selectedGenderText
                      ]}
                    >
                      Other
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Body Measurements</Text>
            
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <View style={styles.inputContainer}>
                  <Scale size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="kg"
                    placeholderTextColor={colors.textSecondary}
                    value={profile.weight?.toString()}
                    onChangeText={(text) => setProfile({...profile, weight: parseFloat(text) || 0})}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <View style={styles.inputContainer}>
                  <Ruler size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="cm"
                    placeholderTextColor={colors.textSecondary}
                    value={profile.height?.toString()}
                    onChangeText={(text) => setProfile({...profile, height: parseFloat(text) || 0})}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
            
            <Text style={styles.inputLabel}>Body Fat % (optional)</Text>
            <View style={styles.inputContainer}>
              <Percent size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Body fat percentage"
                placeholderTextColor={colors.textSecondary}
                value={profile.bodyFat?.toString()}
                onChangeText={(text) => {
                  const value = text.trim() === '' ? undefined : parseFloat(text);
                  setProfile({...profile, bodyFat: value});
                }}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Activity Level</Text>
            
            {activityLevelOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.activityOption,
                  profile.activityLevel === option.id && styles.selectedActivityOption
                ]}
                onPress={() => setProfile({...profile, activityLevel: option.id as any})}
              >
                <View style={styles.activityOptionContent}>
                  <Text 
                    style={[
                      styles.activityOptionLabel,
                      profile.activityLevel === option.id && styles.selectedActivityOptionText
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.activityOptionDescription}>{option.description}</Text>
                </View>
                
                {profile.activityLevel === option.id && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Fitness Goal</Text>
            
            <View style={styles.fitnessGoalContainer}>
              {fitnessGoalOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.fitnessGoalOption,
                    profile.fitnessGoal === option.id && styles.selectedFitnessGoalOption
                  ]}
                  onPress={() => setProfile({...profile, fitnessGoal: option.id as any})}
                >
                  <View style={styles.fitnessGoalIcon}>
                    {option.icon}
                  </View>
                  <Text 
                    style={[
                      styles.fitnessGoalText,
                      profile.fitnessGoal === option.id && styles.selectedFitnessGoalText
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {isCalculating && (
            <View style={styles.calculatingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.calculatingText}>Calculating your nutrition targets...</Text>
            </View>
          )}
          
          {macroTargets && (
            <View style={styles.macroTargetsContainer}>
              <Text style={styles.macroTargetsTitle}>Your Nutrition Targets</Text>
              
              <View style={styles.macroTargetsGrid}>
                <View style={styles.macroTargetItem}>
                  <Text style={styles.macroTargetValue}>{macroTargets.calories}</Text>
                  <Text style={styles.macroTargetLabel}>Calories</Text>
                </View>
                
                <View style={styles.macroTargetItem}>
                  <Text style={styles.macroTargetValue}>{macroTargets.protein}g</Text>
                  <Text style={styles.macroTargetLabel}>Protein</Text>
                </View>
                
                <View style={styles.macroTargetItem}>
                  <Text style={styles.macroTargetValue}>{macroTargets.carbs}g</Text>
                  <Text style={styles.macroTargetLabel}>Carbs</Text>
                </View>
                
                <View style={styles.macroTargetItem}>
                  <Text style={styles.macroTargetValue}>{macroTargets.fat}g</Text>
                  <Text style={styles.macroTargetLabel}>Fat</Text>
                </View>
              </View>
              
              <Text style={styles.macroTargetsNote}>
                These targets are calculated based on your profile information and fitness goals.
                They will be used to track your nutrition progress.
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.saveProfileButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Save size={20} color={colors.text} />
                <Text style={styles.saveProfileButtonText}>Save Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Get device dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isSmallDevice ? 12 : 16,
    paddingBottom: isSmallDevice ? 24 : 32,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 20 : 24,
  },
  profileImage: {
    width: isSmallDevice ? 80 : 100,
    height: isSmallDevice ? 80 : 100,
    borderRadius: isSmallDevice ? 40 : 50,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  changePhotoText: {
    color: colors.primary,
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: isSmallDevice ? 20 : 24,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: isSmallDevice ? 12 : 16,
  },
  inputLabel: {
    fontSize: isSmallDevice ? 14 : 16,
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
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
    marginLeft: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  genderSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedGenderOption: {
    backgroundColor: colors.primary,
  },
  genderText: {
    color: colors.textSecondary,
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '500',
  },
  selectedGenderText: {
    color: colors.text,
    fontWeight: '600',
  },
  activityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: isSmallDevice ? 12 : 16,
    marginBottom: 8,
  },
  selectedActivityOption: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activityOptionContent: {
    flex: 1,
  },
  activityOptionLabel: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  selectedActivityOptionText: {
    color: colors.primary,
  },
  activityOptionDescription: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
  },
  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  fitnessGoalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fitnessGoalOption: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: isSmallDevice ? 12 : 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedFitnessGoalOption: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  fitnessGoalIcon: {
    width: isSmallDevice ? 40 : 48,
    height: isSmallDevice ? 40 : 48,
    borderRadius: isSmallDevice ? 20 : 24,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  fitnessGoalText: {
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    color: colors.text,
  },
  selectedFitnessGoalText: {
    color: colors.primary,
  },
  saveProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
  },
  saveProfileButtonText: {
    color: colors.text,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  calculatingText: {
    color: colors.textSecondary,
    fontSize: isSmallDevice ? 13 : 14,
    marginLeft: 8,
  },
  macroTargetsContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  macroTargetsTitle: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  macroTargetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroTargetItem: {
    alignItems: 'center',
  },
  macroTargetValue: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  macroTargetLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.textSecondary,
  },
  macroTargetsNote: {
    fontSize: isSmallDevice ? 11 : 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: isSmallDevice ? 16 : 18,
  },
});