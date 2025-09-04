import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Search, Database, Trash2, RefreshCw } from 'lucide-react-native';
import { useWhoopStore } from '@/store/whoopStore';
import { ExerciseDefinition } from '@/types/exercises';

export default function ExerciseDatabaseScreen() {
  const {
    getExtractedExercises,
    searchExtractedExercises,
    clearExtractedExercises,
    activePrograms
  } = useWhoopStore();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);
  
  const allExtractedExercises = getExtractedExercises();
  const displayedExercises = searchQuery.trim() 
    ? searchExtractedExercises(searchQuery.trim())
    : allExtractedExercises;
  
  const handleClearDatabase = () => {
    Alert.alert(
      'Clear Exercise Database',
      'Are you sure you want to clear all extracted exercises? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearExtractedExercises();
            setSelectedExercise(null);
          }
        }
      ]
    );
  };
  
  const handleReextractExercises = () => {
    Alert.alert(
      'Re-extract Exercises',
      'This will re-extract exercises from all active programs. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-extract',
          onPress: async () => {
            clearExtractedExercises();
            
            // Re-extract from all active programs
            for (const program of activePrograms) {
              if (program.active) {
                await useWhoopStore.getState().extractAndLogExercisesFromProgram(program);
              }
            }
          }
        }
      ]
    );
  };
  
  const renderExerciseCard = (exercise: ExerciseDefinition) => (
    <TouchableOpacity
      key={exercise.id}
      style={styles.exerciseCard}
      onPress={() => setSelectedExercise(selectedExercise?.id === exercise.id ? null : exercise)}
    >
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseMetadata}>
          <Text style={styles.difficultyBadge}>{exercise.difficulty}</Text>
          <Text style={styles.muscleGroups}>
            {exercise.primaryMuscles.join(', ')}
          </Text>
        </View>
      </View>
      
      <Text style={styles.exerciseDescription} numberOfLines={2}>
        {exercise.description}
      </Text>
      
      <View style={styles.exerciseFooter}>
        <Text style={styles.equipment}>
          Equipment: {exercise.equipment.join(', ')}
        </Text>
        {exercise.estimatedDuration && (
          <Text style={styles.duration}>
            Duration: {exercise.estimatedDuration}
          </Text>
        )}
      </View>
      
      {selectedExercise?.id === exercise.id && (
        <View style={styles.exerciseDetails}>
          <Text style={styles.detailsTitle}>Form Tips:</Text>
          {exercise.formTips.map((tip, index) => (
            <Text key={index} style={styles.detailsText}>• {tip}</Text>
          ))}
          
          <Text style={styles.detailsTitle}>Safety Notes:</Text>
          {exercise.safetyNotes.map((note, index) => (
            <Text key={index} style={styles.detailsText}>• {note}</Text>
          ))}
          
          {exercise.modifications.length > 0 && (
            <>
              <Text style={styles.detailsTitle}>Modifications:</Text>
              {exercise.modifications.map((mod, index) => (
                <Text key={index} style={styles.detailsText}>
                  • {mod.level}: {mod.description}
                </Text>
              ))}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Exercise Database',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' }
        }} 
      />
      
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Database size={20} color="#007AFF" />
            <Text style={styles.statNumber}>{allExtractedExercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statItem}>
            <RefreshCw size={20} color="#34C759" />
            <Text style={styles.statNumber}>{activePrograms.filter(p => p.active).length}</Text>
            <Text style={styles.statLabel}>Active Programs</Text>
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleReextractExercises}
          >
            <RefreshCw size={16} color="#007AFF" />
            <Text style={styles.actionButtonText}>Re-extract</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearDatabase}
          >
            <Trash2 size={16} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.clearButtonText]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
        {displayedExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Database size={48} color="#8E8E93" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery.trim() ? 'No exercises found' : 'No exercises extracted yet'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery.trim() 
                ? 'Try a different search term'
                : 'Create a training program to automatically extract exercises'
              }
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsHeader}>
              {searchQuery.trim() 
                ? `${displayedExercises.length} exercises found for "${searchQuery}"`
                : `${displayedExercises.length} exercises extracted from programs`
              }
            </Text>
            
            {displayedExercises.map(renderExerciseCard)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16
  },
  searchIcon: {
    marginRight: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    flex: 1
  },
  clearButton: {
    backgroundColor: '#2C1C1C'
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF'
  },
  clearButtonText: {
    color: '#FF3B30'
  },
  exercisesList: {
    flex: 1,
    padding: 20
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center'
  },
  exerciseCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  exerciseHeader: {
    marginBottom: 8
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4
  },
  exerciseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  difficultyBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#1A2332',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'capitalize'
  },
  muscleGroups: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'capitalize'
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#AEAEB2',
    lineHeight: 20,
    marginBottom: 12
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  equipment: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'capitalize'
  },
  duration: {
    fontSize: 12,
    color: '#8E8E93'
  },
  exerciseDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E'
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8
  },
  detailsText: {
    fontSize: 13,
    color: '#AEAEB2',
    lineHeight: 18,
    marginBottom: 4
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20
  }
});