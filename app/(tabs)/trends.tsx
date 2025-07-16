import React, { useEffect, useState } from 'react';
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
import { BarChart2, TrendingUp, Link, Plus, Scale, X, Calendar, Target, Activity } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function TrendsScreen() {
  const router = useRouter();
  const { 
    data, 
    isConnectedToWhoop, 
    syncWhoopData, 
    isLoadingWhoopData,
    weightHistory,
    addWeightEntry,
    updateWeightEntry,
    getWeightHistory,
    userProfile,
    initializeWeightFromProfile,
    activePrograms,
    getProgramProgress
  } = useWhoopStore();
  
  const [showAddWeightModal, setShowAddWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [selectedWeightEntry, setSelectedWeightEntry] = useState<any>(null);
  
  useEffect(() => {
    // Initialize weight data from profile if needed
    initializeWeightFromProfile();
    
    // If connected but no data, try to sync
    if (isConnectedToWhoop && data.recovery.length === 0 && !isLoadingWhoopData) {
      syncWhoopData();
    }
  }, [isConnectedToWhoop]);
  
  // Get weight data for the chart (last 30 days)
  const weightData = getWeightHistory(30);
  
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
  
  const handleSaveWeight = () => {
    const weight = parseFloat(newWeight);
    
    if (isNaN(weight) || weight <= 0 || weight > 500) {
      Alert.alert("Invalid Weight", "Please enter a valid weight between 1 and 500 kg");
      return;
    }
    
    if (selectedWeightEntry) {
      // Update existing entry
      updateWeightEntry(selectedWeightEntry.id, weight);
    } else {
      // Add new entry
      addWeightEntry(weight);
    }
    
    setShowAddWeightModal(false);
    setNewWeight('');
    setSelectedWeightEntry(null);
  };
  
  const renderNoDataView = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataTitle}>No WHOOP Data Available</Text>
      <Text style={styles.noDataText}>
        Connect your WHOOP account to see your recovery and strain trends.
      </Text>
      <TouchableOpacity 
        style={styles.connectButton}
        onPress={() => router.push('/connect-whoop')}
      >
        <Link size={20} color={colors.text} />
        <Text style={styles.connectButtonText}>Connect WHOOP Account</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (isLoadingWhoopData) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading WHOOP data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Weekly Trends</Text>
        
        {/* Program Progression Card - Always show */}
        {renderProgramProgressionCard()}
        
        {/* Weight Chart - Always show */}
        {renderWeightChart()}
        
        {/* WHOOP Data Charts - Only show if connected */}
        {isConnectedToWhoop && data.recovery.length > 0 ? (
          <>
            {renderBarChart(
              'Recovery Scores', 
              data.recovery.map(item => item.score), 
              100, 
              colors.primary,
              <TrendingUp size={20} color={colors.textSecondary} />,
              data.recovery.map(item => item.date)
            )}
            
            {renderBarChart(
              'Daily Strain', 
              data.strain.map(item => item.score), 
              21, 
              colors.warning,
              <BarChart2 size={20} color={colors.textSecondary} />,
              data.strain.map(item => item.date)
            )}
            
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Weekly Stats</Text>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg Recovery</Text>
                <Text style={styles.statValue}>
                  {Math.round(data.recovery.reduce((sum, item) => sum + item.score, 0) / data.recovery.length)}%
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg Strain</Text>
                <Text style={styles.statValue}>
                  {Math.round(data.strain.reduce((sum, item) => sum + item.score, 0) / data.strain.length * 10) / 10}
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Calories</Text>
                <Text style={styles.statValue}>
                  {data.strain.reduce((sum, item) => sum + item.calories, 0).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg Resting HR</Text>
                <Text style={styles.statValue}>
                  {Math.round(data.recovery.reduce((sum, item) => sum + item.restingHeartRate, 0) / data.recovery.length)} bpm
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg HRV</Text>
                <Text style={styles.statValue}>
                  {Math.round(data.recovery.reduce((sum, item) => sum + item.hrvMs, 0) / data.recovery.length)} ms
                </Text>
              </View>
            </View>
          </>
        ) : !isConnectedToWhoop ? (
          renderNoDataView()
        ) : null}
      </ScrollView>
      
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
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
});