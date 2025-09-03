import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Switch, ScrollView, Linking, SafeAreaView, Modal, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ChevronLeft, ChevronRight, Play, Pause, X, Maximize2, Info, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import type { Exercise } from '@/src/schemas/program';
import { resolveExercise } from '@/src/services/workoutNormalizer';
import { useWhoopStore } from '@/store/whoopStore';
import type { CanonicalWorkout } from '@/types/workout';

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  type: 'strength' | 'cardio' | 'mobility' | 'mixed';
  targetRPE?: number;
  notes?: string;
  equipment?: string[];
  primaryMuscles?: string[];
}

interface WorkoutPlayerProps {
  programId?: string;
  workoutTitle?: string;
  canonicalWorkout?: CanonicalWorkout;
  onComplete?: () => void;
  onCancel?: () => void;
}

function getExt(url?: string | null): string | null {
  if (!url) return null;
  try {
    const cleaned = url.split('?')[0];
    const parts = cleaned.split('.');
    const ext = parts[parts.length - 1]?.toLowerCase();
    return ext || null;
  } catch {
    return null;
  }
}

function decideMediaType(ex: Exercise): 'gif' | 'mp4' | 'none' {
  const explicit = ex.mediaType;
  if (explicit === 'gif' || explicit === 'mp4') return explicit;
  const ext = getExt(ex.mediaUrl ?? undefined);
  if (ext === 'gif') return 'gif';
  if (ext === 'mp4' || ext === 'mov' || ext === 'webm') return 'mp4';
  return 'none';
}

function parseRestTime(restStr: string): number {
  if (!restStr) return 90;
  const lowerStr = restStr.toLowerCase();
  const match = lowerStr.match(/(\d+)/);
  if (!match) return 90;
  const value = parseInt(match[1]);
  if (lowerStr.includes('min')) {
    return value * 60;
  }
  return value;
}

function getDisplayExercise(ex: Exercise, useBeginner: boolean): Exercise {
  const normalizedEx = resolveExercise(ex);
  if (useBeginner && normalizedEx.beginnerAlternative?.name) {
    const alt: Exercise = {
      id: `${normalizedEx.id}-beginner`,
      name: normalizedEx.beginnerAlternative.name,
      type: normalizedEx.type,
      description: normalizedEx.beginnerAlternative.notes ?? normalizedEx.description ?? 'Focus on proper form and controlled movement.',
      primaryMuscles: normalizedEx.primaryMuscles ?? [],
      equipment: normalizedEx.equipment ?? [],
      mediaUrl: normalizedEx.beginnerAlternative.mediaUrl ?? normalizedEx.mediaUrl,
      mediaType: normalizedEx.mediaType,
      slug: normalizedEx.slug,
      sets: normalizedEx.sets,
      reps: normalizedEx.reps,
      tempo: normalizedEx.tempo,
      restSec: normalizedEx.restSec,
      durationMin: normalizedEx.durationMin,
      distanceKm: normalizedEx.distanceKm,
      targetIntensity: normalizedEx.targetIntensity,
      beginnerAlternative: normalizedEx.beginnerAlternative,
    };
    return alt;
  }
  return normalizedEx;
}

export default function WorkoutPlayer({ programId, workoutTitle, canonicalWorkout, onComplete, onCancel }: WorkoutPlayerProps) {
  const [index, setIndex] = useState<number>(0);
  const [showBeginner, setShowBeginner] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showFullScreenForm, setShowFullScreenForm] = useState<boolean>(false);
  const preloaderRef = useRef<Video>(null);
  const videoRef = useRef<Video>(null);
  const modalVideoRef = useRef<Video>(null);

  const whoop = useWhoopStore();

  const workoutData = useMemo(() => {
    if (canonicalWorkout && canonicalWorkout.exercises) {
      try {
        const mapped: WorkoutExercise[] = canonicalWorkout.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: `${ex.rest ?? 90} sec`,
          type: 'strength',
        }));
        console.log('[WorkoutPlayer] Using provided CanonicalWorkout', { title: canonicalWorkout.title, count: mapped.length });
        return { title: canonicalWorkout.title, exercises: mapped };
      } catch (e) {
        console.warn('[WorkoutPlayer] Failed to use CanonicalWorkout, falling back', e);
      }
    }

    if (!programId || !whoop?.activePrograms?.length) {
      console.warn('[WorkoutPlayer] Missing programId or no active programs');
      return { title: workoutTitle || 'Workout', exercises: [] as WorkoutExercise[] };
    }

    const program = whoop.activePrograms.find(p => p.id === programId);
    if (!program) {
      console.warn('[WorkoutPlayer] Program not found for id', programId);
      return { title: workoutTitle || 'Workout', exercises: [] as WorkoutExercise[] };
    }

    const phases: any[] = Array.isArray(program.aiPlan?.phases) ? program.aiPlan.phases : [];
    if (!phases.length) {
      console.warn('[WorkoutPlayer] Program missing aiPlan.phases');
      return { title: workoutTitle || 'Workout', exercises: [] as WorkoutExercise[] };
    }

    try {
      const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const lcToday = todayDay.toLowerCase();

      const normalizeDay = (d: any): string => {
        const str = String(d ?? '').toLowerCase();
        const map: Record<string, string> = { mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday' };
        if (str in map) return map[str];
        return str;
      };

      let currentPhase = phases[0];
      if (program.startDate) {
        const start = new Date(program.startDate);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        let weekCounter = 0;
        for (const phase of phases) {
          const phaseDuration = parseInt(phase.duration?.split(' ')[0] || '4', 10) || 4;
          if (diffDays / 7 + 1 <= weekCounter + phaseDuration) { currentPhase = phase; break; }
          weekCounter += phaseDuration;
        }
      }

      const weekly: any[] = Array.isArray(currentPhase.weeklyStructure) ? currentPhase.weeklyStructure : [];

      const matchByTitle = (entries: any[], title: string) => {
        const lcTitle = title.toLowerCase();
        let found = entries.find(w => normalizeDay(w?.day) === lcToday && String(w?.title ?? w?.name ?? '').toLowerCase() === lcTitle);
        if (!found) found = entries.find(w => String(w?.title ?? w?.name ?? '').toLowerCase() === lcTitle);
        if (!found) found = entries.find(w => String(w?.title ?? w?.name ?? '').toLowerCase().includes(lcTitle));
        return found || null;
      };

      let primary: any | null = null;

      if (workoutTitle) {
        primary = matchByTitle(weekly, workoutTitle);
        if (!primary) {
          console.warn('[WorkoutPlayer] Not found in current phase by title, searching all phases');
          for (const phase of phases) {
            const ws: any[] = Array.isArray(phase.weeklyStructure) ? phase.weeklyStructure : [];
            const maybe = matchByTitle(ws, workoutTitle);
            if (maybe) { primary = maybe; break; }
          }
        }
      }

      if (!primary) {
        const todays = weekly.filter(w => normalizeDay(w?.day) === lcToday);
        primary = todays.find(w => w?.type === 'strength') || todays.find(w => w?.type === 'cardio') || todays[0] || null;
      }

      if (!primary) {
        console.warn('[WorkoutPlayer] No matching schedule entry for today or title', { today: todayDay, workoutTitle });
        return { title: workoutTitle || 'Workout', exercises: [] as WorkoutExercise[] };
      }

      const exs = Array.isArray(primary.exercises) ? primary.exercises : [];
      const mapped: WorkoutExercise[] = exs.map((ex: any) => ({
        name: String(ex?.name ?? ex?.title ?? 'Exercise'),
        sets: Number.parseInt(String(ex?.sets ?? ex?.targetSets ?? ex?.totalSets ?? '3'), 10) || 3,
        reps: String(ex?.reps ?? ex?.repRange ?? ex?.targetReps ?? (ex?.durationMin ? `${ex.durationMin} min` : ex?.duration ? `${ex.duration}` : '8-12')),
        rest: String(ex?.rest ?? ex?.restTime ?? '90 sec'),
        type: (primary?.type === 'cardio' ? 'cardio' : primary?.type === 'recovery' ? 'mobility' : 'strength'),
        notes: String(ex?.notes ?? (Array.isArray(ex?.cues) ? ex.cues.join('. ') : '')),
        equipment: Array.isArray(ex?.equipment) ? ex.equipment : [],
        primaryMuscles: Array.isArray(ex?.primaryMuscles) ? ex.primaryMuscles : []
      }));

      console.log('[WorkoutPlayer] Loaded schedule workout', { title: primary?.title ?? primary?.name, count: mapped.length, day: primary?.day });
      return { title: String(primary?.title ?? primary?.name ?? workoutTitle ?? 'Workout'), exercises: mapped };
    } catch (e) {
      console.log('[WorkoutPlayer] Failed to derive from program schedule', e);
      return { title: workoutTitle || 'Workout', exercises: [] as WorkoutExercise[] };
    }
  }, [programId, workoutTitle, canonicalWorkout, whoop.activePrograms]);

  const exercises: Exercise[] = useMemo(() => {
    try {
      return workoutData.exercises.map((ex, idx) => {
        const baseExercise: Exercise = {
          id: `exercise-${idx}`,
          name: ex.name,
          type: ex.type,
          description: ex.notes,
          sets: ex.sets,
          reps: ex.reps,
          restSec: parseRestTime(ex.rest),
          targetIntensity: ex.targetRPE ? `RPE ${ex.targetRPE}` : undefined,
          equipment: ex.equipment || [],
          primaryMuscles: ex.primaryMuscles || []
        };
        try {
          return resolveExercise(baseExercise);
        } catch (error) {
          console.warn('[WorkoutPlayer] Failed to resolve exercise, using base:', error);
          return baseExercise;
        }
      });
    } catch (error) {
      console.warn('[WorkoutPlayer] Failed to process exercises:', error);
      return [];
    }
  }, [workoutData]);

  const total = exercises.length;

  useEffect(() => {
    if (workoutData?.title) {
      console.log('[WorkoutPlayer] Workout loaded', { title: workoutData.title, totalExercises: exercises.length });
    }
    if (exercises.length === 0) {
      console.warn('[WorkoutPlayer] No exercises to display. Check schedule data for the selected workout.');
    }
  }, [workoutData?.title, exercises.length]);

  const rawCurrent: Exercise | undefined = exercises[index];
  const current: Exercise | undefined = useMemo(() => (rawCurrent ? getDisplayExercise(rawCurrent, showBeginner) : undefined), [rawCurrent, showBeginner]);

  const onPrev = useCallback(() => {
    setIndex((i) => {
      const v = Math.max(0, i - 1);
      console.log('[WorkoutPlayer] Prev pressed', { from: i, to: v });
      return v;
    });
  }, []);

  const onNext = useCallback(() => {
    setIndex((i) => {
      const v = Math.min(total - 1, i + 1);
      console.log('[WorkoutPlayer] Next pressed', { from: i, to: v });
      if (i === total - 1) {
        onComplete?.();
      }
      return v;
    });
  }, [total, onComplete]);

  useEffect(() => {
    const next = exercises[index + 1];
    const resolvedNext = next ? getDisplayExercise(next, showBeginner) : undefined;
    const type = resolvedNext ? decideMediaType(resolvedNext) : 'none';
    const preloader = preloaderRef.current;
    async function preload() {
      try {
        if (Platform.OS !== 'web' && type === 'mp4' && resolvedNext?.mediaUrl && preloader) {
          console.log('[WorkoutPlayer] Preloading next mp4', { index: index + 1, url: resolvedNext.mediaUrl });
          await preloader.loadAsync({ uri: resolvedNext.mediaUrl }, { shouldPlay: false, isMuted: true }, false);
        } else if (type === 'gif') {
          console.log('[WorkoutPlayer] GIF will be handled by Image cache');
        }
      } catch (e) {
        console.log('[WorkoutPlayer] Preload error', e);
      }
    }
    preload();
    return () => {
      if (preloader) {
        preloader.unloadAsync().catch(() => undefined);
      }
    };
  }, [index, exercises, showBeginner]);

  const progress = total > 0 ? (index + 1) / total : 0;

  const handlePauseResume = useCallback(() => {
    setIsPaused(!isPaused);
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isPaused]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleOpenFullScreenForm = useCallback(() => {
    setShowFullScreenForm(true);
  }, []);

  const handleCloseFullScreenForm = useCallback(() => {
    setShowFullScreenForm(false);
  }, []);

  const getFormCues = useCallback((exercise: Exercise): string[] => {
    if (!exercise.description) {
      return ['Focus on proper form', 'Control the movement', 'Breathe steadily'];
    }
    if (exercise.description.includes('Unverified exercise')) {
      return [
        'Exercise not found in database',
        'Research proper form before starting',
        'Consider substituting with a known exercise',
        'Focus on controlled movement',
        'Stop if form breaks down'
      ];
    }
    const sentences = exercise.description
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length > 10)
      .slice(0, 5);
    if (sentences.length === 0) {
      return [
        'Maintain proper posture throughout',
        'Control the movement tempo',
        'Focus on the target muscles',
        'Breathe consistently',
        'Use full range of motion'
      ];
    }
    return sentences;
  }, []);

  const renderMedia = useCallback(() => {
    if (!current) return (
      <View style={styles.placeholder} testID="media-placeholder">
        <Text style={styles.placeholderText}>No exercise</Text>
      </View>
    );

    const type = decideMediaType(current);
    const isUnverified = current.description?.includes('Unverified exercise');

    if (!current.mediaUrl || type === 'none') {
      return (
        <View style={styles.placeholder} testID="media-missing">
          {isUnverified && (
            <View style={styles.warningBadge}>
              <AlertTriangle size={16} color={colors.ios.systemOrange} />
              <Text style={styles.warningText}>Check Form</Text>
            </View>
          )}
          <Text style={styles.placeholderText}>
            {isUnverified ? 'Exercise not recognized' : 'Visual coming soon'}
          </Text>
          <Text style={styles.placeholderSubtext}>
            {isUnverified ? 'Please verify proper form' : 'Follow the form cues below'}
          </Text>
        </View>
      );
    }

    if (type === 'gif') {
      return (
        <View style={styles.mediaContainer}>
          {isUnverified && (
            <View style={styles.warningOverlay}>
              <AlertTriangle size={16} color={colors.ios.systemOrange} />
              <Text style={styles.warningOverlayText}>Verify Form</Text>
            </View>
          )}
          <Image
            testID="gif-media"
            accessibilityRole="image"
            source={{ uri: current.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <View style={styles.placeholder} testID="media-web-fallback">
          {isUnverified && (
            <View style={styles.warningBadge}>
              <AlertTriangle size={16} color={colors.ios.systemOrange} />
              <Text style={styles.warningText}>Check Form</Text>
            </View>
          )}
          <Text style={styles.placeholderText}>Video preview unavailable on web</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => current.mediaUrl ? Linking.openURL(current.mediaUrl) : undefined}
            style={[styles.navButton, { marginTop: 8, alignSelf: 'center', width: 160 }]}
          >
            <Text style={styles.navText}>Open Video</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.mediaContainer}>
        {isUnverified && (
          <View style={styles.warningOverlay}>
            <AlertTriangle size={16} color={colors.ios.systemOrange} />
            <Text style={styles.warningOverlayText}>Verify Form</Text>
          </View>
        )}
        <Video
          ref={videoRef}
          testID="video-media"
          style={styles.media}
          source={{ uri: current.mediaUrl }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={!isPaused}
          isLooping
          isMuted
        />
      </View>
    );
  }, [current, isPaused]);

  const renderModalMedia = useCallback(() => {
    if (!current) return null;

    const type = decideMediaType(current);
    const { height: screenHeight } = Dimensions.get('window');
    const mediaHeight = Math.min(screenHeight * 0.4, 400);

    if (!current.mediaUrl || type === 'none') {
      return (
        <View style={[styles.modalMediaPlaceholder, { height: mediaHeight }]}>
          <Text style={styles.placeholderText}>Visual coming soon</Text>
        </View>
      );
    }

    if (type === 'gif') {
      return (
        <Image
          source={{ uri: current.mediaUrl }}
          style={[styles.modalMedia, { height: mediaHeight }]}
          resizeMode="cover"
        />
      );
    }

    if (Platform.OS === 'web') {
      return (
        <View style={[styles.modalMediaPlaceholder, { height: mediaHeight }]}>
          <Text style={styles.placeholderText}>Video preview unavailable on web</Text>
          <TouchableOpacity
            onPress={() => current.mediaUrl ? Linking.openURL(current.mediaUrl) : undefined}
            style={[styles.navButton, { marginTop: 8, alignSelf: 'center', width: 160 }]}
          >
            <Text style={styles.navText}>Open Video</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <Video
        ref={modalVideoRef}
        style={[styles.modalMedia, { height: mediaHeight }]}
        source={{ uri: current.mediaUrl }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={showFullScreenForm}
        isLooping
        isMuted
      />
    );
  }, [current, showFullScreenForm]);

  const muscles = current?.primaryMuscles ?? [];
  const equipment = current?.equipment ?? [];

  return (
    <SafeAreaView style={styles.container} testID="workout-player">
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCancel}
          testID="cancel-button"
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle} numberOfLines={1}>
            {workoutData.title}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handlePauseResume}
          testID="pause-resume-button"
        >
          {isPaused ? (
            <Play size={24} color={colors.text} />
          ) : (
            <Pause size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2} testID="exercise-title">{current?.name ?? (total === 0 ? 'No exercises found' : 'Exercise')}</Text>
        <Text style={styles.subTitle} testID="exercise-progress">Exercise {Math.min(index + 1, total)} of {total}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} testID="step-progress" />
        </View>
      </View>

      <View style={styles.mediaWrap}>
        {renderMedia()}
        {current && (
          <TouchableOpacity
            style={styles.fullScreenButton}
            onPress={handleOpenFullScreenForm}
            testID="full-screen-form-button"
          >
            <Maximize2 size={20} color={colors.text} />
            <Text style={styles.fullScreenButtonText}>Form View</Text>
          </TouchableOpacity>
        )}
        {!current && (
          <View style={{ paddingTop: 8 }}>
            <Text style={styles.placeholderSubtext}>No workout found for today or the selected title. Please verify your program schedule.</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {current?.beginnerAlternative && (
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelContainer}>
              <Text style={styles.toggleLabel}>Beginner option</Text>
              {showBeginner && (
                <Text style={styles.toggleSubLabel}>Showing: {current.beginnerAlternative.name}</Text>
              )}
            </View>
            <Switch testID="beginner-toggle" value={showBeginner} onValueChange={setShowBeginner} />
          </View>
        )}

        {current && (
          <View style={styles.formCuesSection}>
            <View style={styles.formCuesHeader}>
              <Info size={18} color={colors.primary} />
              <Text style={styles.formCuesTitle}>Form Cues</Text>
            </View>
            {getFormCues(current).map((cue, idx) => (
              <View key={idx} style={styles.formCueItem} testID={`form-cue-${idx}`}>
                <Text style={styles.formCueBullet}>•</Text>
                <Text style={styles.formCueText}>{cue}</Text>
              </View>
            ))}
          </View>
        )}

        {muscles.length > 0 && (
          <View style={styles.chipsRow}>
            {muscles.map((m) => (
              <View key={`muscle-${m}`} style={styles.chip} testID={`chip-muscle-${m}`}>
                <Text style={styles.chipText}>{m}</Text>
              </View>
            ))}
          </View>
        )}

        {equipment.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment</Text>
            <View style={styles.chipsRow}>
              {equipment.map((e) => (
                <View key={`equip-${e}`} style={[styles.chip, styles.chipEquipment]} testID={`chip-equip-${e}`}>
                  <Text style={styles.chipText}>{e}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          testID="prev-button"
          style={[styles.navButton, styles.navButtonSecondary, index === 0 && styles.navButtonDisabled]}
          onPress={onPrev}
          disabled={index === 0}
        >
          <ChevronLeft size={20} color={index === 0 ? colors.textSecondary : colors.text} />
          <Text style={[styles.navText, index === 0 && styles.navTextDisabled]}>Previous Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          testID="next-button"
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={onNext}
        >
          <Text style={styles.navTextPrimary}>{index >= total - 1 ? 'Complete Workout' : 'Next Exercise'}</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Video ref={preloaderRef} style={styles.hidden} source={{ uri: 'about:blank' }} />

      <Modal
        visible={showFullScreenForm}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleCloseFullScreenForm}
              testID="close-modal-button"
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {current?.name || 'Exercise Form'}
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <View style={styles.modalMediaContainer}>
            {current && renderModalMedia()}
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentInner}>
            <Text style={styles.modalFormTitle}>Proper Form</Text>
            {current && getFormCues(current).map((cue, idx) => (
              <View key={idx} style={styles.modalFormCueItem} testID={`modal-form-cue-${idx}`}>
                <View style={styles.modalFormCueNumber}>
                  <Text style={styles.modalFormCueNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.modalFormCueText}>{cue}</Text>
              </View>
            ))}

            {current?.primaryMuscles && current.primaryMuscles.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Target Muscles</Text>
                <View style={styles.chipsRow}>
                  {current.primaryMuscles.map((muscle) => (
                    <View key={muscle} style={styles.chip}>
                      <Text style={styles.chipText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ios.separator,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ios.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  workoutTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.card,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  subTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500' as const,
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.ios.quaternaryBackground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  mediaWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  media: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    backgroundColor: colors.ios.secondaryBackground,
  },
  placeholder: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    backgroundColor: colors.ios.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ios.separator,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 12,
  },
  toggleLabelContainer: {
    flex: 1,
  },
  toggleLabel: {
    color: colors.text,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  toggleSubLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  descriptionMuted: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipEquipment: {
    backgroundColor: colors.ios.systemOrange,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.ios.separator,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  navButtonSecondary: {
    flex: 1,
    backgroundColor: colors.ios.secondaryBackground,
  },
  navButtonPrimary: {
    flex: 2,
    backgroundColor: colors.primary,
  },
  navButtonDisabled: {
    backgroundColor: colors.ios.quaternaryBackground,
  },
  navText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  navTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  navTextDisabled: {
    color: colors.textSecondary,
  },
  hidden: {
    width: 1,
    height: 1,
    position: 'absolute',
    top: -100,
    left: -100,
    opacity: 0,
  },
  fullScreenButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  fullScreenButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  formCuesSection: {
    marginBottom: 20,
  },
  formCuesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  formCuesTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  formCueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 4,
  },
  formCueBullet: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginRight: 12,
    marginTop: 2,
  },
  formCueText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ios.separator,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ios.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    paddingHorizontal: 16,
  },
  modalHeaderSpacer: {
    width: 44,
  },
  modalMediaContainer: {
    backgroundColor: colors.ios.secondaryBackground,
  },
  modalMedia: {
    width: '100%',
    backgroundColor: colors.ios.secondaryBackground,
  },
  modalMediaPlaceholder: {
    width: '100%',
    backgroundColor: colors.ios.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ios.separator,
    borderStyle: 'dashed',
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 20,
  },
  modalFormTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 20,
  },
  modalFormCueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: colors.ios.secondaryBackground,
    padding: 16,
    borderRadius: 12,
  },
  modalFormCueNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  modalFormCueNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  modalFormCueText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  modalSection: {
    marginTop: 24,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  mediaContainer: {
    position: 'relative',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'center',
    gap: 4,
  },
  warningText: {
    color: colors.ios.systemOrange,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  warningOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    gap: 4,
  },
  warningOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  placeholderSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
