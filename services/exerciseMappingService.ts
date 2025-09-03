import { ExerciseDefinition } from '@/types/exercises';
import { getExerciseById, searchExercisesByKeywords } from '@/constants/exerciseDatabase';
import { matchExerciseName, parseWorkoutToExercises } from '@/utils/exerciseParser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for persistent mapping data
const STORAGE_KEYS = {
  USER_MAPPINGS: 'exercise_user_mappings',
  UNMAPPED_EXERCISES: 'exercise_unmapped_cache',
  MAPPING_STATS: 'exercise_mapping_stats'
} as const;

// Interface for user-defined exercise mappings
export interface UserExerciseMapping {
  aiName: string; // The name from AI-generated workout
  exerciseId: string; // Our database exercise ID
  confidence: number; // User confidence in this mapping (0-1)
  createdAt: string;
  usageCount: number;
  lastUsed: string;
  source: 'user_manual' | 'user_correction' | 'auto_learned';
}

// Interface for unmapped exercises that need attention
export interface UnmappedExercise {
  aiName: string;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  context: string[]; // Workout titles/descriptions where this appeared
  suggestedMappings: Array<{
    exerciseId: string;
    confidence: number;
    reason: string;
  }>;
}

// Interface for mapping statistics
export interface MappingStats {
  totalMappingAttempts: number;
  successfulMappings: number;
  userCorrections: number;
  unmappedCount: number;
  lastUpdated: string;
}

// Enhanced exercise mapping result
export interface EnhancedMappingResult {
  exerciseId: string;
  exercise: ExerciseDefinition;
  confidence: number; // 0-1
  matchType: 'exact' | 'fuzzy' | 'user_mapping' | 'fallback' | 'generic';
  matchReason: string;
  alternatives: Array<{
    exerciseId: string;
    exercise: ExerciseDefinition;
    confidence: number;
    reason: string;
  }>;
  needsUserReview: boolean;
}

class ExerciseMappingService {
  private userMappings: Map<string, UserExerciseMapping> = new Map();
  private unmappedExercises: Map<string, UnmappedExercise> = new Map();
  private mappingStats: MappingStats = {
    totalMappingAttempts: 0,
    successfulMappings: 0,
    userCorrections: 0,
    unmappedCount: 0,
    lastUpdated: new Date().toISOString()
  };
  private isInitialized = false;

  /**
   * Initialize the service by loading persistent data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load user mappings
      const userMappingsData = await AsyncStorage.getItem(STORAGE_KEYS.USER_MAPPINGS);
      if (userMappingsData) {
        const mappings: UserExerciseMapping[] = JSON.parse(userMappingsData);
        mappings.forEach(mapping => {
          this.userMappings.set(mapping.aiName.toLowerCase(), mapping);
        });
        console.log(`Loaded ${mappings.length} user exercise mappings`);
      }

      // Load unmapped exercises
      const unmappedData = await AsyncStorage.getItem(STORAGE_KEYS.UNMAPPED_EXERCISES);
      if (unmappedData) {
        const unmapped: UnmappedExercise[] = JSON.parse(unmappedData);
        unmapped.forEach(exercise => {
          this.unmappedExercises.set(exercise.aiName.toLowerCase(), exercise);
        });
        console.log(`Loaded ${unmapped.length} unmapped exercises`);
      }

      // Load mapping statistics
      const statsData = await AsyncStorage.getItem(STORAGE_KEYS.MAPPING_STATS);
      if (statsData) {
        this.mappingStats = JSON.parse(statsData);
        console.log('Loaded mapping statistics:', this.mappingStats);
      }

      this.isInitialized = true;
      console.log('Exercise Mapping Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Exercise Mapping Service:', error);
      this.isInitialized = true; // Continue with empty state
    }
  }

  /**
   * Enhanced exercise mapping with comprehensive fallback strategy
   */
  async mapExerciseName(aiExerciseName: string, context?: string): Promise<EnhancedMappingResult> {
    await this.initialize();
    
    const normalizedName = aiExerciseName.toLowerCase().trim();
    this.mappingStats.totalMappingAttempts++;
    
    console.log(`Mapping exercise: "${aiExerciseName}" with context: "${context || 'none'}"`);

    // Stage 1: Check user-defined mappings first (highest priority)
    const userMapping = this.userMappings.get(normalizedName);
    if (userMapping) {
      const exercise = getExerciseById(userMapping.exerciseId);
      if (exercise) {
        // Update usage statistics
        userMapping.usageCount++;
        userMapping.lastUsed = new Date().toISOString();
        await this.saveUserMappings();
        
        this.mappingStats.successfulMappings++;
        await this.saveMappingStats();
        
        return {
          exerciseId: userMapping.exerciseId,
          exercise,
          confidence: Math.min(0.95, userMapping.confidence + 0.1), // Boost confidence for user mappings
          matchType: 'user_mapping',
          matchReason: `User-defined mapping (used ${userMapping.usageCount} times)`,
          alternatives: [],
          needsUserReview: false
        };
      }
    }

    // Stage 2: Use enhanced fuzzy matching from existing parser
    const fuzzyMatch = matchExerciseName(aiExerciseName);
    if (fuzzyMatch && fuzzyMatch.score > 0.7) {
      const exercise = getExerciseById(fuzzyMatch.id);
      if (exercise) {
        this.mappingStats.successfulMappings++;
        await this.saveMappingStats();
        
        // Generate alternatives for user review
        const alternatives = await this.generateAlternatives(aiExerciseName, fuzzyMatch.id);
        
        return {
          exerciseId: fuzzyMatch.id,
          exercise,
          confidence: fuzzyMatch.score,
          matchType: fuzzyMatch.score > 0.9 ? 'exact' : 'fuzzy',
          matchReason: `${fuzzyMatch.matchedBy} match: "${fuzzyMatch.alias}" (score: ${fuzzyMatch.score.toFixed(2)})`,
          alternatives,
          needsUserReview: fuzzyMatch.score < 0.85
        };
      }
    }

    // Stage 3: Context-aware keyword matching
    if (context) {
      const contextualMatch = await this.findContextualMatch(aiExerciseName, context);
      if (contextualMatch) {
        this.mappingStats.successfulMappings++;
        await this.saveMappingStats();
        
        const alternatives = await this.generateAlternatives(aiExerciseName, contextualMatch.exerciseId);
        
        return {
          exerciseId: contextualMatch.exerciseId,
          exercise: contextualMatch.exercise,
          confidence: contextualMatch.confidence,
          matchType: 'fuzzy',
          matchReason: `Contextual match based on workout context`,
          alternatives,
          needsUserReview: true
        };
      }
    }

    // Stage 4: Semantic similarity matching
    const semanticMatch = await this.findSemanticMatch(aiExerciseName);
    if (semanticMatch) {
      this.mappingStats.successfulMappings++;
      await this.saveMappingStats();
      
      const alternatives = await this.generateAlternatives(aiExerciseName, semanticMatch.exerciseId);
      
      return {
        exerciseId: semanticMatch.exerciseId,
        exercise: semanticMatch.exercise,
        confidence: semanticMatch.confidence,
        matchType: 'fuzzy',
        matchReason: `Semantic similarity match`,
        alternatives,
        needsUserReview: true
      };
    }

    // Stage 5: Fallback to generic exercise with comprehensive alternatives
    const fallbackResult = await this.createFallbackMapping(aiExerciseName, context);
    
    // Track unmapped exercise for future improvement
    await this.trackUnmappedExercise(aiExerciseName, context || '');
    
    return fallbackResult;
  }

  /**
   * Find contextual matches based on workout context
   */
  private async findContextualMatch(aiExerciseName: string, context: string): Promise<{
    exerciseId: string;
    exercise: ExerciseDefinition;
    confidence: number;
  } | null> {
    const contextKeywords = context.toLowerCase().split(/\s+/);
    const exerciseKeywords = aiExerciseName.toLowerCase().split(/\s+/);
    const allKeywords = [...new Set([...contextKeywords, ...exerciseKeywords])];
    
    // Filter out common words
    const meaningfulKeywords = allKeywords.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with', 'set', 'rep', 'reps', 'sets', 'workout', 'exercise'].includes(word)
    );
    
    if (meaningfulKeywords.length === 0) return null;
    
    const matches = searchExercisesByKeywords(meaningfulKeywords);
    if (matches.length > 0) {
      const bestMatch = matches[0];
      return {
        exerciseId: bestMatch.id,
        exercise: bestMatch,
        confidence: 0.6 // Medium confidence for contextual matches
      };
    }
    
    return null;
  }

  /**
   * Find semantic similarity matches using word patterns
   */
  private async findSemanticMatch(aiExerciseName: string): Promise<{
    exerciseId: string;
    exercise: ExerciseDefinition;
    confidence: number;
  } | null> {
    const exerciseWords = aiExerciseName.toLowerCase().split(/\s+/);
    
    // Define semantic groups
    const semanticGroups = {
      pushing: ['push', 'press', 'chest', 'shoulder', 'tricep'],
      pulling: ['pull', 'row', 'lat', 'back', 'bicep'],
      squatting: ['squat', 'leg', 'quad', 'thigh', 'knee'],
      hinging: ['deadlift', 'hip', 'glute', 'hamstring', 'posterior'],
      core: ['plank', 'core', 'ab', 'abdominal', 'stability'],
      cardio: ['run', 'jog', 'cycle', 'bike', 'cardio', 'aerobic']
    };
    
    // Find which semantic group this exercise belongs to
    let bestGroup = '';
    let maxMatches = 0;
    
    for (const [group, keywords] of Object.entries(semanticGroups)) {
      const matches = exerciseWords.filter(word => 
        keywords.some(keyword => word.includes(keyword) || keyword.includes(word))
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestGroup = group;
      }
    }
    
    if (maxMatches === 0) return null;
    
    // Map semantic groups to default exercises
    const groupToExercise = {
      pushing: 'push-up',
      pulling: 'dumbbell-row',
      squatting: 'squat',
      hinging: 'deadlift',
      core: 'plank',
      cardio: 'jumping-jacks'
    };
    
    const exerciseId = groupToExercise[bestGroup as keyof typeof groupToExercise];
    const exercise = getExerciseById(exerciseId);
    
    if (exercise) {
      return {
        exerciseId,
        exercise,
        confidence: 0.5 // Lower confidence for semantic matches
      };
    }
    
    return null;
  }

  /**
   * Create a comprehensive fallback mapping with alternatives
   */
  private async createFallbackMapping(aiExerciseName: string, context?: string): Promise<EnhancedMappingResult> {
    // Default to a basic exercise
    const fallbackExerciseId = 'squat';
    const fallbackExercise = getExerciseById(fallbackExerciseId)!;
    
    // Generate comprehensive alternatives
    const alternatives = await this.generateAlternatives(aiExerciseName, fallbackExerciseId, true);
    
    return {
      exerciseId: fallbackExerciseId,
      exercise: fallbackExercise,
      confidence: 0.2,
      matchType: 'generic',
      matchReason: `No match found. Using generic exercise. Original: "${aiExerciseName}"`,
      alternatives,
      needsUserReview: true
    };
  }

  /**
   * Generate alternative exercise suggestions
   */
  private async generateAlternatives(
    aiExerciseName: string, 
    excludeExerciseId: string,
    includeAll = false
  ): Promise<Array<{
    exerciseId: string;
    exercise: ExerciseDefinition;
    confidence: number;
    reason: string;
  }>> {
    const alternatives: Array<{
      exerciseId: string;
      exercise: ExerciseDefinition;
      confidence: number;
      reason: string;
    }> = [];
    
    // Get fuzzy matches
    const fuzzyMatch = matchExerciseName(aiExerciseName);
    if (fuzzyMatch && fuzzyMatch.id !== excludeExerciseId) {
      const exercise = getExerciseById(fuzzyMatch.id);
      if (exercise) {
        alternatives.push({
          exerciseId: fuzzyMatch.id,
          exercise,
          confidence: fuzzyMatch.score,
          reason: `Fuzzy match: ${fuzzyMatch.alias}`
        });
      }
    }
    
    // Get keyword-based matches
    const keywords = aiExerciseName.toLowerCase().split(/\s+/);
    const keywordMatches = searchExercisesByKeywords(keywords)
      .filter(ex => ex.id !== excludeExerciseId)
      .slice(0, includeAll ? 5 : 2);
    
    keywordMatches.forEach(exercise => {
      if (!alternatives.find(alt => alt.exerciseId === exercise.id)) {
        alternatives.push({
          exerciseId: exercise.id,
          exercise,
          confidence: 0.4,
          reason: 'Keyword match'
        });
      }
    });
    
    // If we need more alternatives (for fallback cases), add popular exercises
    if (includeAll && alternatives.length < 3) {
      const popularExercises = ['push-up', 'squat', 'plank', 'lunge', 'dumbbell-row']
        .filter(id => id !== excludeExerciseId && !alternatives.find(alt => alt.exerciseId === id));
      
      popularExercises.forEach(exerciseId => {
        const exercise = getExerciseById(exerciseId);
        if (exercise && alternatives.length < 5) {
          alternatives.push({
            exerciseId,
            exercise,
            confidence: 0.3,
            reason: 'Popular alternative'
          });
        }
      });
    }
    
    return alternatives.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Allow users to manually map an AI exercise name to a database exercise
   */
  async createUserMapping(
    aiExerciseName: string, 
    exerciseId: string, 
    confidence = 1.0,
    source: UserExerciseMapping['source'] = 'user_manual'
  ): Promise<boolean> {
    await this.initialize();
    
    const exercise = getExerciseById(exerciseId);
    if (!exercise) {
      console.error(`Cannot create mapping: exercise ${exerciseId} not found`);
      return false;
    }
    
    const normalizedName = aiExerciseName.toLowerCase().trim();
    const mapping: UserExerciseMapping = {
      aiName: normalizedName,
      exerciseId,
      confidence: Math.max(0, Math.min(1, confidence)),
      createdAt: new Date().toISOString(),
      usageCount: 0,
      lastUsed: new Date().toISOString(),
      source
    };
    
    this.userMappings.set(normalizedName, mapping);
    
    // Remove from unmapped if it exists
    this.unmappedExercises.delete(normalizedName);
    
    // Update statistics
    if (source === 'user_correction') {
      this.mappingStats.userCorrections++;
    }
    
    await this.saveUserMappings();
    await this.saveUnmappedExercises();
    await this.saveMappingStats();
    
    console.log(`Created user mapping: "${aiExerciseName}" -> ${exerciseId}`);
    return true;
  }

  /**
   * Remove a user-defined mapping
   */
  async removeUserMapping(aiExerciseName: string): Promise<boolean> {
    await this.initialize();
    
    const normalizedName = aiExerciseName.toLowerCase().trim();
    const existed = this.userMappings.delete(normalizedName);
    
    if (existed) {
      await this.saveUserMappings();
      console.log(`Removed user mapping for: "${aiExerciseName}"`);
    }
    
    return existed;
  }

  /**
   * Get all user-defined mappings
   */
  async getUserMappings(): Promise<UserExerciseMapping[]> {
    await this.initialize();
    return Array.from(this.userMappings.values())
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Get all unmapped exercises that need attention
   */
  async getUnmappedExercises(): Promise<UnmappedExercise[]> {
    await this.initialize();
    return Array.from(this.unmappedExercises.values())
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }

  /**
   * Get mapping statistics
   */
  async getMappingStats(): Promise<MappingStats> {
    await this.initialize();
    return { ...this.mappingStats };
  }

  /**
   * Track an unmapped exercise for future improvement
   */
  private async trackUnmappedExercise(aiExerciseName: string, context: string): Promise<void> {
    const normalizedName = aiExerciseName.toLowerCase().trim();
    const now = new Date().toISOString();
    
    let unmapped = this.unmappedExercises.get(normalizedName);
    if (unmapped) {
      unmapped.occurrenceCount++;
      unmapped.lastSeen = now;
      if (!unmapped.context.includes(context)) {
        unmapped.context.push(context);
      }
    } else {
      // Generate suggested mappings
      const suggestedMappings = await this.generateAlternatives(aiExerciseName, '', true);
      
      unmapped = {
        aiName: normalizedName,
        occurrenceCount: 1,
        firstSeen: now,
        lastSeen: now,
        context: context ? [context] : [],
        suggestedMappings: suggestedMappings.map(alt => ({
          exerciseId: alt.exerciseId,
          confidence: alt.confidence,
          reason: alt.reason
        }))
      };
    }
    
    this.unmappedExercises.set(normalizedName, unmapped);
    this.mappingStats.unmappedCount = this.unmappedExercises.size;
    
    await this.saveUnmappedExercises();
    await this.saveMappingStats();
  }

  /**
   * Batch process multiple exercise names (useful for program creation)
   */
  async mapMultipleExercises(
    exerciseNames: string[], 
    context?: string
  ): Promise<EnhancedMappingResult[]> {
    const results: EnhancedMappingResult[] = [];
    
    for (const name of exerciseNames) {
      const result = await this.mapExerciseName(name, context);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Learn from user corrections to improve future mappings
   */
  async learnFromCorrection(
    originalAiName: string,
    correctedExerciseId: string,
    originalMappingId?: string
  ): Promise<void> {
    // Create a new user mapping with high confidence
    await this.createUserMapping(
      originalAiName,
      correctedExerciseId,
      0.9,
      'user_correction'
    );
    
    // If there was an original mapping that was wrong, we could potentially
    // reduce confidence in similar patterns, but for now we'll just track the correction
    console.log(`Learned from correction: "${originalAiName}" -> ${correctedExerciseId}`);
  }

  /**
   * Export user mappings for backup
   */
  async exportUserMappings(): Promise<string> {
    await this.initialize();
    const data = {
      userMappings: Array.from(this.userMappings.values()),
      unmappedExercises: Array.from(this.unmappedExercises.values()),
      mappingStats: this.mappingStats,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import user mappings from backup
   */
  async importUserMappings(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.userMappings) {
        data.userMappings.forEach((mapping: UserExerciseMapping) => {
          this.userMappings.set(mapping.aiName, mapping);
        });
        await this.saveUserMappings();
      }
      
      if (data.unmappedExercises) {
        data.unmappedExercises.forEach((unmapped: UnmappedExercise) => {
          this.unmappedExercises.set(unmapped.aiName, unmapped);
        });
        await this.saveUnmappedExercises();
      }
      
      console.log('Successfully imported user mappings');
      return true;
    } catch (error) {
      console.error('Failed to import user mappings:', error);
      return false;
    }
  }

  // Private methods for persistence
  private async saveUserMappings(): Promise<void> {
    try {
      const mappings = Array.from(this.userMappings.values());
      await AsyncStorage.setItem(STORAGE_KEYS.USER_MAPPINGS, JSON.stringify(mappings));
    } catch (error) {
      console.error('Failed to save user mappings:', error);
    }
  }

  private async saveUnmappedExercises(): Promise<void> {
    try {
      const unmapped = Array.from(this.unmappedExercises.values());
      await AsyncStorage.setItem(STORAGE_KEYS.UNMAPPED_EXERCISES, JSON.stringify(unmapped));
    } catch (error) {
      console.error('Failed to save unmapped exercises:', error);
    }
  }

  private async saveMappingStats(): Promise<void> {
    try {
      this.mappingStats.lastUpdated = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.MAPPING_STATS, JSON.stringify(this.mappingStats));
    } catch (error) {
      console.error('Failed to save mapping stats:', error);
    }
  }

  /**
   * Clear all stored data (for testing or reset)
   */
  async clearAllData(): Promise<void> {
    this.userMappings.clear();
    this.unmappedExercises.clear();
    this.mappingStats = {
      totalMappingAttempts: 0,
      successfulMappings: 0,
      userCorrections: 0,
      unmappedCount: 0,
      lastUpdated: new Date().toISOString()
    };
    
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER_MAPPINGS),
      AsyncStorage.removeItem(STORAGE_KEYS.UNMAPPED_EXERCISES),
      AsyncStorage.removeItem(STORAGE_KEYS.MAPPING_STATS)
    ]);
    
    console.log('Cleared all exercise mapping data');
  }
}

// Export singleton instance
export const exerciseMappingService = new ExerciseMappingService();

// Convenience functions for common operations
export const mapExerciseName = (aiExerciseName: string, context?: string) => 
  exerciseMappingService.mapExerciseName(aiExerciseName, context);

export const createUserMapping = (aiExerciseName: string, exerciseId: string, confidence?: number) => 
  exerciseMappingService.createUserMapping(aiExerciseName, exerciseId, confidence);

export const getUserMappings = () => 
  exerciseMappingService.getUserMappings();

export const getUnmappedExercises = () => 
  exerciseMappingService.getUnmappedExercises();

export const getMappingStats = () => 
  exerciseMappingService.getMappingStats();

export const learnFromCorrection = (originalAiName: string, correctedExerciseId: string) => 
  exerciseMappingService.learnFromCorrection(originalAiName, correctedExerciseId);

// Helper function to integrate with existing workout parsing
export const parseWorkoutWithEnhancedMapping = async (
  workoutTitle: string, 
  workoutDescription: string
): Promise<{
  exercises: any[];
  mappingResults: EnhancedMappingResult[];
  needsReview: boolean;
}> => {
  // Use existing parser to get basic structure
  const basicExercises = parseWorkoutToExercises(workoutTitle, workoutDescription);
  
  // Extract unique exercise names from the workout
  const exerciseNames = new Set<string>();
  const combinedText = `${workoutTitle} ${workoutDescription}`;
  
  // Simple extraction of potential exercise names
  const lines = combinedText.split(/\n|\r|;|\||\u2022|\-|\u2022|\u00b7/);
  lines.forEach(line => {
    const cleaned = line.trim();
    if (cleaned && cleaned.length > 3 && cleaned.length < 100) {
      exerciseNames.add(cleaned);
    }
  });
  
  // Map each potential exercise name
  const mappingResults: EnhancedMappingResult[] = [];
  for (const name of exerciseNames) {
    const result = await exerciseMappingService.mapExerciseName(name, workoutTitle);
    mappingResults.push(result);
  }
  
  const needsReview = mappingResults.some(result => result.needsUserReview);
  
  return {
    exercises: basicExercises,
    mappingResults,
    needsReview
  };
};