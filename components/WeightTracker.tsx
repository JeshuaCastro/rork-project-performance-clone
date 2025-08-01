import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Scale, Plus, X, TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWhoopStore } from '@/store/whoopStore';

interface WeightTrackerProps {
  onPress?: () => void;
}

export default function WeightTracker({ onPress }: WeightTrackerProps) {
  const {
    weightHistory,
    addWeightEntry,
    updateWeightEntry,
    getWeightHistory,
    userProfile,
    initializeWeightFromProfile
  } = useWhoopStore();

  const [showAddWeightModal, setShowAddWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [selectedWeightEntry, setSelectedWeightEntry] = useState<any>(null);

  useEffect(() => {
    initializeWeightFromProfile();
  }, []);

  // Get weight data for the last 30 days
  const weightData = getWeightHistory(30);
  
  // Calculate weight change
  const getWeightChange = () => {
    if (weightData.length < 2) return null;
    
    const latest = weightData[weightData.length - 1].weight;
    const previous = weightData[weightData.length - 2].weight;
    const change = latest - previous;
    
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
      percentage: previous > 0 ? Math.abs((change / previous) * 100) : 0
    };
  };

  const weightChange = getWeightChange();
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : userProfile.weight;

  const handleSaveWeight = () => {
    const weight = parseFloat(newWeight);
    
    if (isNaN(weight) || weight <= 0 || weight > 500) {
      Alert.alert("Invalid Weight", "Please enter a valid weight between 1 and 500 kg");
      return;
    }
    
    if (selectedWeightEntry) {
      updateWeightEntry(selectedWeightEntry.id, weight);
    } else {
      addWeightEntry(weight);
    }
    
    setShowAddWeightModal(false);
    setNewWeight('');
    setSelectedWeightEntry(null);
  };

  const renderWeightChart = () => {
    if (weightData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Scale size={32} color={colors.textSecondary} />
          <Text style={styles.noDataText}>No weight data yet</Text>
        </View>
      );
    }

    const weights = weightData.map(entry => entry.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight || 1;

    return (
      <View style={styles.chartContainer}>
        {weightData.slice(-7).map((entry, index) => {
          const heightPercentage = weightRange > 0 
            ? ((entry.weight - minWeight) / weightRange) * 100 
            : 50;
          
          return (
            <TouchableOpacity
              key={entry.id}
              style={styles.chartPoint}
              onPress={() => {
                setSelectedWeightEntry(entry);
                setNewWeight(entry.weight.toString());
                setShowAddWeightModal(true);
              }}
            >
              <View 
                style={[
                  styles.chartBar,
                  { height: `${Math.max(heightPercentage, 10)}%` }
                ]} 
              />
              <Text style={styles.chartValue}>{entry.weight.toFixed(1)}</Text>
              <Text style={styles.chartDate}>
                {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Scale size={20} color={colors.primary} />
          <Text style={styles.title}>Weight Tracking</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddWeightModal(true)}
        >
          <Plus size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.currentWeightContainer}>
          <Text style={styles.currentWeightLabel}>Current Weight</Text>
          <Text style={styles.currentWeightValue}>
            {currentWeight ? `${currentWeight.toFixed(1)} kg` : 'Not set'}
          </Text>
        </View>

        {weightChange && (
          <View style={styles.changeContainer}>
            <View style={styles.changeIcon}>
              {weightChange.direction === 'up' ? (
                <TrendingUp size={16} color={colors.warning} />
              ) : weightChange.direction === 'down' ? (
                <TrendingDown size={16} color={colors.success} />
              ) : null}
            </View>
            <Text style={[
              styles.changeText,
              {
                color: weightChange.direction === 'up' 
                  ? colors.warning 
                  : weightChange.direction === 'down' 
                    ? colors.success 
                    : colors.textSecondary
              }
            ]}>
              {weightChange.direction === 'same' 
                ? 'No change' 
                : `${weightChange.direction === 'up' ? '+' : '-'}${weightChange.value.toFixed(1)} kg`
              }
            </Text>
          </View>
        )}
      </View>

      {renderWeightChart()}

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentWeightContainer: {
    flex: 1,
  },
  currentWeightLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  currentWeightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeIcon: {
    marginRight: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 4,
  },
  chartPoint: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  chartBar: {
    width: 12,
    backgroundColor: colors.primary,
    borderRadius: 6,
    marginBottom: 6,
    minHeight: 10,
  },
  chartValue: {
    fontSize: 9,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  chartDate: {
    fontSize: 8,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
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