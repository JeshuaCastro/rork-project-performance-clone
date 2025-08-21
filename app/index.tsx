import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProgramStore } from '@/store/programStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

export default function IndexScreen() {
  const router = useRouter();
  const { hasCompletedOnboarding, getActiveGoals } = useProgramStore();

  useEffect(() => {
    const activeGoals = getActiveGoals();
    
    if (!hasCompletedOnboarding || activeGoals.length === 0) {
      router.replace('/programs');
    } else {
      router.replace('/programs');
    }
  }, [hasCompletedOnboarding, getActiveGoals, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});