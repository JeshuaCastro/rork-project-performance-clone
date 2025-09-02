import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Switch, ScrollView, Linking } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import type { Workout, Exercise } from '@/src/schemas/program';

type Props = { workout: Workout };

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

function getDisplayExercise(ex: Exercise, useBeginner: boolean): Exercise {
  if (useBeginner && ex.beginnerAlternative?.name) {
    const alt: Exercise = {
      id: `${ex.id}-beginner`,
      name: ex.beginnerAlternative.name,
      type: ex.type,
      description: ex.beginnerAlternative.notes ?? ex.description ?? '',
      primaryMuscles: ex.primaryMuscles ?? [],
      equipment: ex.equipment ?? [],
      mediaUrl: ex.beginnerAlternative.mediaUrl ?? ex.mediaUrl,
      mediaType: ex.mediaType,
      slug: ex.slug,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo,
      restSec: ex.restSec,
      durationMin: ex.durationMin,
      distanceKm: ex.distanceKm,
      targetIntensity: ex.targetIntensity,
      beginnerAlternative: ex.beginnerAlternative,
    };
    return alt;
  }
  return ex;
}

export default function WorkoutPlayer({ workout }: Props) {
  const [index, setIndex] = useState<number>(0);
  const [showBeginner, setShowBeginner] = useState<boolean>(false);
  const preloaderRef = useRef<Video>(null);
  const videoRef = useRef<Video>(null);

  const exercises: Exercise[] = useMemo(() => workout?.exercises ?? [], [workout]);
  const total = exercises.length;
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
      return v;
    });
  }, [total]);

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

  const mediaNode = useMemo(() => {
    if (!current) return (
      <View style={styles.placeholder} testID="media-placeholder">
        <Text style={styles.placeholderText}>No exercise</Text>
      </View>
    );
    const type = decideMediaType(current);
    if (!current.mediaUrl || type === 'none') {
      return (
        <View style={styles.placeholder} testID="media-missing">
          <Text style={styles.placeholderText}>Visual coming soon</Text>
        </View>
      );
    }
    if (type === 'gif') {
      return (
        <Image
          testID="gif-media"
          accessibilityRole="image"
          source={{ uri: current.mediaUrl }}
          style={styles.media}
          resizeMode="cover"
        />
      );
    }
    if (Platform.OS === 'web') {
      return (
        <View style={styles.placeholder} testID="media-web-fallback">
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
      <Video
        ref={videoRef}
        testID="video-media"
        style={styles.media}
        source={{ uri: current.mediaUrl }}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
    );
  }, [current]);

  const muscles = current?.primaryMuscles ?? [];
  const equipment = current?.equipment ?? [];

  return (
    <View style={styles.container} testID="workout-player">
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2} testID="exercise-title">{current?.name ?? 'Exercise'}</Text>
        <Text style={styles.subTitle} testID="exercise-progress">Exercise {Math.min(index + 1, total)} of {total}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} testID="step-progress" />
        </View>
      </View>

      <View style={styles.mediaWrap}>{mediaNode}</View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Beginner option</Text>
          <Switch testID="beginner-toggle" value={showBeginner} onValueChange={setShowBeginner} />
        </View>

        {current?.description ? (
          <Text style={styles.description} testID="form-cues">{current.description}</Text>
        ) : (
          <Text style={styles.descriptionMuted} testID="form-cues-missing">No form cues provided.</Text>
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
          <View style={styles.chipsRow}>
            {equipment.map((e) => (
              <View key={`equip-${e}`} style={[styles.chip, styles.chipAlt]} testID={`chip-equip-${e}`}>
                <Text style={styles.chipText}>{e}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          testID="prev-button"
          style={[styles.navButton, index === 0 && styles.navButtonDisabled]}
          onPress={onPrev}
          disabled={index === 0}
        >
          <Text style={[styles.navText, index === 0 && styles.navTextDisabled]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          testID="next-button"
          style={[styles.navButton, index >= total - 1 && styles.navButtonPrimary]}
          onPress={onNext}
          disabled={index >= total - 1}
        >
          <Text style={styles.navText}>{index >= total - 1 ? 'Done' : 'Next'}</Text>
        </TouchableOpacity>
      </View>

      <Video ref={preloaderRef} style={styles.hidden} source={{ uri: 'about:blank' }} />
    </View>
  );
}

const fontWeightBold = '700' as const;
const fontWeightMedium = '600' as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0c10' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: fontWeightBold },
  subTitle: { color: '#a8b0b9', marginTop: 4 },
  progressTrack: { height: 6, backgroundColor: '#1f232a', borderRadius: 6, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#5eead4' },
  mediaWrap: { paddingHorizontal: 16, paddingTop: 8 },
  media: { width: '100%', height: 260, borderRadius: 16, backgroundColor: '#111317' },
  placeholder: { width: '100%', height: 260, borderRadius: 16, backgroundColor: '#111317', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#a8b0b9' },
  content: { flex: 1, marginTop: 12 },
  contentInner: { paddingHorizontal: 20, paddingBottom: 20 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  toggleLabel: { color: '#ffffff', fontWeight: fontWeightMedium, fontSize: 16 },
  description: { color: '#e5e7eb', lineHeight: 20, marginBottom: 12 },
  descriptionMuted: { color: '#8b949e', lineHeight: 20, marginBottom: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: '#1f232a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipAlt: { backgroundColor: '#23262e' },
  chipText: { color: '#c7d2fe', fontSize: 12 },
  footer: { flexDirection: 'row', gap: 12, padding: 16 },
  navButton: { flex: 1, backgroundColor: '#2a2f39', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  navButtonDisabled: { backgroundColor: '#1d2129' },
  navButtonPrimary: { backgroundColor: '#5eead4' },
  navText: { color: '#ffffff', fontWeight: fontWeightBold },
  navTextDisabled: { color: '#6b7280' },
  hidden: { width: 1, height: 1, position: 'absolute', top: -100, left: -100, opacity: 0 },
});
