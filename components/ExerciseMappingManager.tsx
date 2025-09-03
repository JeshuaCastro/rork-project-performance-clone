import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Search, Plus, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react-native';
import {
  exerciseMappingService,
  UserExerciseMapping,
  UnmappedExercise,
  MappingStats
} from '@/services/exerciseMappingService';
import { getExerciseById, exerciseDatabase } from '@/constants/exerciseDatabase';
import { ExerciseDefinition } from '@/types/exercises';

interface ExerciseMappingManagerProps {
  onClose?: () => void;
}

export default function ExerciseMappingManager({ onClose }: ExerciseMappingManagerProps) {
  const [activeTab, setActiveTab] = useState<'unmapped' | 'mappings' | 'stats'>('unmapped');
  const [userMappings, setUserMappings] = useState<UserExerciseMapping[]>([]);
  const [unmappedExercises, setUnmappedExercises] = useState<UnmappedExercise[]>([]);
  const [mappingStats, setMappingStats] = useState<MappingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showCreateMapping, setShowCreateMapping] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  const [newMappingName, setNewMappingName] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mappings, unmapped, stats] = await Promise.all([
        exerciseMappingService.getUserMappings(),
        exerciseMappingService.getUnmappedExercises(),
        exerciseMappingService.getMappingStats()
      ]);
      
      setUserMappings(mappings);
      setUnmappedExercises(unmapped);
      setMappingStats(stats);
    } catch (error) {
      console.error('Failed to load mapping data:', error);
      Alert.alert('Error', 'Failed to load exercise mapping data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = async () => {
    if (!newMappingName.trim() || !selectedExercise) {
      Alert.alert('Error', 'Please enter an exercise name and select a database exercise');
      return;
    }

    try {
      const success = await exerciseMappingService.createUserMapping(
        newMappingName.trim(),
        selectedExercise.id,
        1.0,
        'user_manual'
      );

      if (success) {
        setNewMappingName('');
        setSelectedExercise(null);
        setShowCreateMapping(false);
        await loadData();
        Alert.alert('Success', 'Exercise mapping created successfully');
      } else {
        Alert.alert('Error', 'Failed to create exercise mapping');
      }
    } catch (error) {
      console.error('Failed to create mapping:', error);
      Alert.alert('Error', 'Failed to create exercise mapping');
    }
  };

  const handleMapUnmappedExercise = async (unmapped: UnmappedExercise, exerciseId: string) => {
    try {
      const success = await exerciseMappingService.createUserMapping(
        unmapped.aiName,
        exerciseId,
        0.9,
        'user_manual'
      );

      if (success) {
        await loadData();
        Alert.alert('Success', `Mapped "${unmapped.aiName}" to exercise successfully`);
      } else {
        Alert.alert('Error', 'Failed to create exercise mapping');
      }
    } catch (error) {
      console.error('Failed to map exercise:', error);
      Alert.alert('Error', 'Failed to create exercise mapping');
    }
  };

  const handleDeleteMapping = async (mapping: UserExerciseMapping) => {
    Alert.alert(
      'Delete Mapping',
      `Are you sure you want to delete the mapping for "${mapping.aiName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await exerciseMappingService.removeUserMapping(mapping.aiName);
              await loadData();
            } catch (error) {
              console.error('Failed to delete mapping:', error);
              Alert.alert('Error', 'Failed to delete mapping');
            }
          }
        }
      ]
    );
  };

  const filteredMappings = userMappings.filter(mapping =>
    mapping.aiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getExerciseById(mapping.exerciseId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUnmapped = unmappedExercises.filter(unmapped =>
    unmapped.aiName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExercises = exerciseDatabase.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUnmappedItem = ({ item }: { item: UnmappedExercise }) => (
    <View style={styles.unmappedCard}>
      <View style={styles.unmappedHeader}>
        <View style={styles.unmappedInfo}>
          <Text style={styles.unmappedName}>{item.aiName}</Text>
          <Text style={styles.unmappedMeta}>
            Seen {item.occurrenceCount} times • Last: {new Date(item.lastSeen).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.unmappedBadge}>
          <AlertCircle size={16} color="#f59e0b" />
          <Text style={styles.unmappedBadgeText}>Needs Mapping</Text>
        </View>
      </View>
      
      {item.context.length > 0 && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Context:</Text>
          <Text style={styles.contextText} numberOfLines={2}>
            {item.context.join(', ')}
          </Text>
        </View>
      )}
      
      {item.suggestedMappings.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>Suggested Mappings:</Text>
          {item.suggestedMappings.slice(0, 3).map((suggestion, index) => {
            const exercise = getExerciseById(suggestion.exerciseId);
            if (!exercise) return null;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleMapUnmappedExercise(item, suggestion.exerciseId)}
              >
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{exercise.name}</Text>
                  <Text style={styles.suggestionReason}>
                    {suggestion.reason} • {Math.round(suggestion.confidence * 100)}% confidence
                  </Text>
                </View>
                <Plus size={20} color="#10b981" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderMappingItem = ({ item }: { item: UserExerciseMapping }) => {
    const exercise = getExerciseById(item.exerciseId);
    if (!exercise) return null;

    return (
      <View style={styles.mappingCard}>
        <View style={styles.mappingHeader}>
          <View style={styles.mappingInfo}>
            <Text style={styles.mappingAiName}>&quot;{item.aiName}&quot;</Text>
            <Text style={styles.mappingArrow}>→</Text>
            <Text style={styles.mappingExerciseName}>{exercise.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMapping(item)}
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.mappingMeta}>
          <Text style={styles.mappingMetaText}>
            Used {item.usageCount} times • {item.source.replace('_', ' ')} • 
            {Math.round(item.confidence * 100)}% confidence
          </Text>
          <Text style={styles.mappingDate}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  const renderExerciseItem = ({ item }: { item: ExerciseDefinition }) => (
    <TouchableOpacity
      style={[
        styles.exerciseItem,
        selectedExercise?.id === item.id && styles.exerciseItemSelected
      ]}
      onPress={() => setSelectedExercise(item)}
    >
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.exerciseMuscles}>
          {item.primaryMuscles.join(', ')} • {item.difficulty}
        </Text>
      </View>
      {selectedExercise?.id === item.id && (
        <CheckCircle size={20} color="#10b981" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Exercise Mapping Manager' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading mapping data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Exercise Mapping Manager',
          headerRight: onClose ? () => (
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          ) : undefined
        }} 
      />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unmapped' && styles.activeTab]}
          onPress={() => setActiveTab('unmapped')}
        >
          <AlertCircle size={20} color={activeTab === 'unmapped' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'unmapped' && styles.activeTabText]}>
            Unmapped ({unmappedExercises.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mappings' && styles.activeTab]}
          onPress={() => setActiveTab('mappings')}
        >
          <CheckCircle size={20} color={activeTab === 'mappings' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'mappings' && styles.activeTabText]}>
            Mappings ({userMappings.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {activeTab !== 'stats' && (
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'unmapped' ? 'Search unmapped exercises...' : 'Search mappings...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'unmapped' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Unmapped Exercises</Text>
              <Text style={styles.sectionSubtitle}>
                These exercises from AI-generated workouts need to be mapped to your database
              </Text>
            </View>
            
            {filteredUnmapped.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle size={48} color="#10b981" />
                <Text style={styles.emptyStateTitle}>All exercises mapped!</Text>
                <Text style={styles.emptyStateText}>
                  No unmapped exercises found. Great job keeping your database organized!
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUnmapped}
                renderItem={renderUnmappedItem}
                keyExtractor={(item) => item.aiName}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {activeTab === 'mappings' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>User-Defined Mappings</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowCreateMapping(true)}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.addButtonText}>Add Mapping</Text>
              </TouchableOpacity>
            </View>
            
            {filteredMappings.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No mappings found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No mappings match your search.' : 'Create your first exercise mapping to get started.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredMappings}
                renderItem={renderMappingItem}
                keyExtractor={(item) => item.aiName}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {activeTab === 'stats' && mappingStats && (
          <View>
            <Text style={styles.sectionTitle}>Mapping Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mappingStats.totalMappingAttempts}</Text>
                <Text style={styles.statLabel}>Total Attempts</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mappingStats.successfulMappings}</Text>
                <Text style={styles.statLabel}>Successful</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mappingStats.userCorrections}</Text>
                <Text style={styles.statLabel}>User Corrections</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mappingStats.unmappedCount}</Text>
                <Text style={styles.statLabel}>Unmapped</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Success Rate</Text>
              <Text style={styles.statValue}>
                {mappingStats.totalMappingAttempts > 0 
                  ? Math.round((mappingStats.successfulMappings / mappingStats.totalMappingAttempts) * 100)
                  : 0}%
              </Text>
            </View>
            
            <Text style={styles.lastUpdated}>
              Last updated: {new Date(mappingStats.lastUpdated).toLocaleString()}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Mapping Modal */}
      <Modal
        visible={showCreateMapping}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Exercise Mapping</Text>
            <TouchableOpacity onPress={() => setShowCreateMapping(false)}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>AI Exercise Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter the exercise name from AI workout..."
              value={newMappingName}
              onChangeText={setNewMappingName}
            />
            
            <Text style={styles.inputLabel}>Database Exercise</Text>
            <TouchableOpacity
              style={styles.exerciseSelector}
              onPress={() => setShowExerciseSelector(true)}
            >
              <Text style={[styles.exerciseSelectorText, !selectedExercise && styles.placeholder]}>
                {selectedExercise ? selectedExercise.name : 'Select an exercise from database...'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.createButton, (!newMappingName.trim() || !selectedExercise) && styles.createButtonDisabled]}
              onPress={handleCreateMapping}
              disabled={!newMappingName.trim() || !selectedExercise}
            >
              <Text style={styles.createButtonText}>Create Mapping</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Exercise Selector Modal */}
      <Modal
        visible={showExerciseSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Exercise</Text>
            <TouchableOpacity onPress={() => setShowExerciseSelector(false)}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            style={styles.exerciseList}
          />
          
          {selectedExercise && (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowExerciseSelector(false)}
            >
              <Text style={styles.selectButtonText}>
                Select {selectedExercise.name}
              </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  unmappedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unmappedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  unmappedInfo: {
    flex: 1,
  },
  unmappedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  unmappedMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  unmappedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  unmappedBadgeText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  contextContainer: {
    marginBottom: 12,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 12,
    color: '#6b7280',
  },
  suggestionsContainer: {
    gap: 8,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  suggestionReason: {
    fontSize: 12,
    color: '#6b7280',
  },
  mappingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mappingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mappingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  mappingAiName: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  mappingArrow: {
    fontSize: 16,
    color: '#9ca3af',
  },
  mappingExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  mappingMeta: {
    gap: 4,
  },
  mappingMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  mappingDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    padding: 16,
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  exerciseSelector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  exerciseSelectorText: {
    fontSize: 16,
    color: '#374151',
  },
  placeholder: {
    color: '#9ca3af',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseList: {
    flex: 1,
    padding: 16,
  },
  exerciseItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  exerciseMuscles: {
    fontSize: 12,
    color: '#9ca3af',
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    margin: 16,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});