import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput,
  Platform,
  SafeAreaView
} from 'react-native';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  Dumbbell, 
  Activity, 
  Trophy, 
  Scale, 
  Plus,
  X,
  Target,
  ChevronRight,
  Clock,
  CheckCircle,
  Circle,
  Zap,
  Heart
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWhoopStore } from '@/store/whoopStore';
import { useProgramStore } from '@/store/programStore';
import HeroProgress from '@/components/HeroProgress';
import ProgressRing from '@/components/ProgressRing';
import type { GoalTemplate, ProgramGoal, DailyRecommendation } from '@/types/programs';

const getIconForGoalType = (iconName: string, size: number = 24, color: string = colors.text) => {
  switch (iconName) {
    case 'dumbbell':
      return <Dumbbell size={size} color={color} />;
    case 'activity':
      return <Activity size={size} color={color} />;
    case 'trophy':
      return <Trophy size={size} color={color} />;
    case 'scale':
      return <Scale size={size} color={color} />;
    default:
      return <Target size={size} color={color} />;
  }
};

export default function ProgramsScreen() {
  const router = useRouter();
  const { data: whoopData, isConnectedToWhoop } = useWhoopStore();
  const { 
    templates,
    goals,
    progress,
    dailyRecommendations,
    hasCompletedOnboarding,
    addGoal,
    removeGoal,
    updateGoal,
    logProgress,
    getGoalSummary,
    getPrimaryGoal,
    getActiveGoals,
    generateDailyRecommendations,
    completeRecommendation,
    completeOnboarding
  } = useProgramStore();

  const primaryGoal = getPrimaryGoal();
  const activeGoals = getActiveGoals();
  
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding && activeGoals.length === 0);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [goalConfig, setGoalConfig] = useState<{
    title: string;
    targetValue: string;
    timeframe: { value: number; unit: 'weeks' | 'months' };
    notes: string;
  }>({
    title: '',
    targetValue: '',
    timeframe: { value: 12, unit: 'weeks' },
    notes: ''
  });
  const primarySummary = primaryGoal ? getGoalSummary(primaryGoal.id) : null;

  useEffect(() => {
    if (primaryGoal && dailyRecommendations.length === 0) {
      generateDailyRecommendations(primaryGoal.id);
    }
  }, [primaryGoal]);

  const handleStartGoal = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setGoalConfig({
      title: template.title,
      targetValue: '',
      timeframe: template.suggestedTimeframes[0] || { value: 12, unit: 'weeks' as const },
      notes: ''
    });
  };

  const handleSaveGoal = () => {
    if (!selectedTemplate || !goalConfig.targetValue) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const goalId = addGoal({
      type: selectedTemplate.type,
      title: goalConfig.title,
      targetValue: parseFloat(goalConfig.targetValue),
      metricKey: selectedTemplate.defaultMetricKey,
      timeframe: goalConfig.timeframe,
      notes: goalConfig.notes,
      isActive: true,
      priority: activeGoals.length === 0 ? 'primary' : 'secondary'
    });

    setSelectedTemplate(null);
    setShowOnboarding(false);
    completeOnboarding();

    Alert.alert(
      'Goal Created!',
      `Your ${selectedTemplate.title} goal has been set. Let's start tracking your progress!`,
      [{ text: 'Get Started', onPress: () => generateDailyRecommendations(goalId) }]
    );
  };

  const renderOnboarding = () => (
    <SafeAreaView style={styles.onboardingContainer}>
      <StatusBar style="light" />
      
      {!selectedTemplate ? (
        <ScrollView style={styles.onboardingScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.onboardingHeader}>
            <Text style={styles.onboardingTitle}>Choose Your Program</Text>
            <Text style={styles.onboardingSubtitle}>
              Select a specialized training program designed by experts to help you achieve your goals
            </Text>
          </View>

          <View style={styles.templatesGrid}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[styles.templateCard, { borderColor: template.color }]}
                onPress={() => handleStartGoal(template)}
              >
                <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
                  {getIconForGoalType(template.icon, 32, template.color)}
                </View>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
                
                <View style={styles.templateBenefits}>
                  {template.benefits.slice(0, 2).map((benefit, index) => (
                    <View key={index} style={styles.benefitRow}>
                      <View style={[styles.benefitDot, { backgroundColor: template.color }]} />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.configScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.configHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setSelectedTemplate(null)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.configTitle}>Set Your {selectedTemplate.title} Goal</Text>
          </View>

          <View style={styles.configContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Title</Text>
              <TextInput
                style={styles.textInput}
                value={goalConfig.title}
                onChangeText={(text) => setGoalConfig({...goalConfig, title: text})}
                placeholder={`My ${selectedTemplate.title} Goal`}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Value</Text>
              <TextInput
                style={styles.textInput}
                value={goalConfig.targetValue}
                onChangeText={(text) => setGoalConfig({...goalConfig, targetValue: text})}
                placeholder={selectedTemplate.exampleTargets[0]}
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Timeframe</Text>
              <View style={styles.timeframeContainer}>
                {selectedTemplate.suggestedTimeframes.map((timeframe, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeframePill,
                      goalConfig.timeframe.value === timeframe.value && 
                      goalConfig.timeframe.unit === timeframe.unit && styles.activeTimeframePill
                    ]}
                    onPress={() => setGoalConfig({...goalConfig, timeframe})}
                  >
                    <Text style={[
                      styles.timeframeText,
                      goalConfig.timeframe.value === timeframe.value && 
                      goalConfig.timeframe.unit === timeframe.unit && styles.activeTimeframeText
                    ]}>
                      {timeframe.value} {timeframe.unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={goalConfig.notes}
                onChangeText={(text) => setGoalConfig({...goalConfig, notes: text})}
                placeholder="Any specific notes about your goal..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.createGoalButton} onPress={handleSaveGoal}>
              <Trophy size={20} color={colors.text} />
              <Text style={styles.createGoalText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );

  const renderDashboard = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Progress Section */}
        {primaryGoal && primarySummary && (
          <View style={styles.heroSection}>
            <HeroProgress
              title={primaryGoal.title}
              percentComplete={primarySummary.percentComplete}
              milestoneLabel={`${primarySummary.currentValue}/${primarySummary.targetValue}`}
              nextMilestone={`${primarySummary.daysRemaining} days remaining`}
              primaryActionLabel="View Details"
              onPrimaryAction={() => router.push(`/program-detail?id=${primaryGoal.id}`)}
              secondaryActionLabel="Add Goal"
              onSecondaryAction={() => setShowOnboarding(true)}
            />
          </View>
        )}

        {/* WHOOP Integration Cards */}
        {isConnectedToWhoop && (
          <View style={styles.whoopSection}>
            <Text style={styles.sectionTitle}>Today's Metrics</Text>
            <View style={styles.whoopGrid}>
              <View style={styles.whoopCard}>
                <Text style={styles.whoopCardTitle}>Recovery</Text>
                <ProgressRing
                  size={80}
                  strokeWidth={8}
                  progress={whoopData.recovery[0]?.score || 0}
                  label="Today"
                  testID="recovery-ring"
                />
                <Text style={styles.whoopCardValue}>
                  {Math.round(whoopData.recovery[0]?.score || 0)}%
                </Text>
              </View>
              
              <View style={styles.whoopCard}>
                <Text style={styles.whoopCardTitle}>Strain</Text>
                <ProgressRing
                  size={80}
                  strokeWidth={8}
                  progress={(whoopData.strain[0]?.score || 0) * 10}
                  label="Today"
                  testID="strain-ring"
                />
                <Text style={styles.whoopCardValue}>
                  {(whoopData.strain[0]?.score || 0).toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Daily Recommendations */}
        {dailyRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>Today's Focus</Text>
            {dailyRecommendations.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={[styles.recommendationCard, rec.completed && styles.completedRecommendation]}
                onPress={() => completeRecommendation(rec.id)}
              >
                <View style={styles.recommendationLeft}>
                  {rec.completed ? (
                    <CheckCircle size={24} color={colors.success} />
                  ) : (
                    <Circle size={24} color={colors.primary} />
                  )}
                  <View style={styles.recommendationContent}>
                    <Text style={[styles.recommendationTitle, rec.completed && styles.completedText]}>
                      {rec.title}
                    </Text>
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                    <View style={styles.recommendationMeta}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.recommendationTime}>{rec.estimatedTime} min</Text>
                      {rec.whoopBased && (
                        <>
                          <Zap size={14} color={colors.primary} />
                          <Text style={styles.whoopBasedText}>WHOOP Optimized</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* All Goals Overview */}
        {activeGoals.length > 0 && (
          <View style={styles.goalsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Goals</Text>
              <TouchableOpacity 
                style={styles.addGoalButton}
                onPress={() => setShowOnboarding(true)}
              >
                <Plus size={20} color={colors.primary} />
                <Text style={styles.addGoalText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
            
            {activeGoals.map((goal) => {
              const summary = getGoalSummary(goal.id);
              if (!summary) return null;
              
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalCard}
                  onPress={() => router.push(`/program-detail?id=${goal.id}`)}
                >
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <View style={[styles.goalBadge, { backgroundColor: goal.priority === 'primary' ? colors.primary : colors.textSecondary }]}>
                      <Text style={styles.goalBadgeText}>
                        {goal.priority === 'primary' ? 'PRIMARY' : 'SECONDARY'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.goalProgress}>
                    <View style={styles.goalProgressLeft}>
                      <Text style={styles.goalProgressValue}>
                        {summary.currentValue}/{summary.targetValue}
                      </Text>
                      <Text style={styles.goalProgressLabel}>
                        {summary.percentComplete}% Complete
                      </Text>
                    </View>
                    
                    <View style={styles.goalProgressRight}>
                      <ProgressRing
                        size={60}
                        strokeWidth={6}
                        progress={summary.percentComplete}
                        testID={`goal-progress-${goal.id}`}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.goalMeta}>
                    <Text style={styles.goalMetaText}>
                      Week {summary.weeksElapsed} of {summary.totalWeeks}
                    </Text>
                    <Text style={[
                      styles.goalPaceText,
                      summary.paceVsPlan === 'ahead' && styles.aheadText,
                      summary.paceVsPlan === 'behind' && styles.behindText
                    ]}>
                      {summary.paceVsPlan === 'ahead' ? '🚀 Ahead of pace' : 
                       summary.paceVsPlan === 'behind' ? '⚠️ Behind pace' : '✅ On track'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {activeGoals.length === 0 && !showOnboarding && (
          <View style={styles.emptyState}>
            <Trophy size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Ready to Start?</Text>
            <Text style={styles.emptyText}>
              Set your first fitness goal and let our AI coach create a personalized program for you.
            </Text>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setShowOnboarding(true)}
            >
              <Text style={styles.startButtonText}>Set Your First Goal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Goal Configuration Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedTemplate}
        onRequestClose={() => setSelectedTemplate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure {selectedTemplate?.title} Goal</Text>
              <TouchableOpacity 
                onPress={() => setSelectedTemplate(null)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Goal Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={goalConfig.title}
                  onChangeText={(text) => setGoalConfig({...goalConfig, title: text})}
                  placeholder={`My ${selectedTemplate?.title} Goal`}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Value</Text>
                <TextInput
                  style={styles.textInput}
                  value={goalConfig.targetValue}
                  onChangeText={(text) => setGoalConfig({...goalConfig, targetValue: text})}
                  placeholder={selectedTemplate?.exampleTargets[0] || "Enter target"}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Timeframe</Text>
                <View style={styles.timeframeContainer}>
                  {selectedTemplate?.suggestedTimeframes.map((timeframe, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeframePill,
                        goalConfig.timeframe.value === timeframe.value && 
                        goalConfig.timeframe.unit === timeframe.unit && styles.activeTimeframePill
                      ]}
                      onPress={() => setGoalConfig({...goalConfig, timeframe: { ...timeframe }})}
                    >
                      <Text style={[
                        styles.timeframeText,
                        goalConfig.timeframe.value === timeframe.value && 
                        goalConfig.timeframe.unit === timeframe.unit && styles.activeTimeframeText
                      ]}>
                        {timeframe.value} {timeframe.unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.createGoalButton} onPress={handleSaveGoal}>
                <Trophy size={20} color={colors.text} />
                <Text style={styles.createGoalText}>Create Goal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  if (showOnboarding || activeGoals.length === 0) {
    return renderOnboarding();
  }

  return renderDashboard();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  onboardingScroll: {
    flex: 1,
  },
  onboardingHeader: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  templatesGrid: {
    padding: 20,
    gap: 24,
  },
  templateCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 28,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  templateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  templateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  templateBenefits: {
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  benefitText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  configScroll: {
    flex: 1,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  configTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  configContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeframeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timeframePill: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  activeTimeframePill: {
    backgroundColor: colors.primary,
  },
  timeframeText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTimeframeText: {
    color: colors.text,
    fontWeight: '600',
  },
  createGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: 32,
    gap: 12,
  },
  createGoalText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 32,
  },
  whoopSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  whoopGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  whoopCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  whoopCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  whoopCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  recommendationsSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  completedRecommendation: {
    opacity: 0.6,
  },
  recommendationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  recommendationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  whoopBasedText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  goalsSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addGoalText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  goalCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  goalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalProgressLeft: {
    flex: 1,
  },
  goalProgressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  goalProgressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  goalProgressRight: {
    marginLeft: 20,
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalMetaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  goalPaceText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  aheadText: {
    color: colors.success,
  },
  behindText: {
    color: colors.warning,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    maxWidth: 300,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
});