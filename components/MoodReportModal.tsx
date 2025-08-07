import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '@/constants/colors';
import { X, Heart, Zap, Brain } from 'lucide-react-native';
import contextualAwarenessService from '@/services/contextualAwarenessService';

interface MoodReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

const MoodReportModal: React.FC<MoodReportModalProps> = ({ visible, onClose, onSubmit }) => {
  const [energy, setEnergy] = useState<number>(5);
  const [motivation, setMotivation] = useState<number>(5);
  const [stress, setStress] = useState<number>(5);
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'poor' | 'terrible'>('okay');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moodOptions: { value: 'great' | 'good' | 'okay' | 'poor' | 'terrible'; label: string; emoji: string }[] = [
    { value: 'great', label: 'Great', emoji: '😄' },
    { value: 'good', label: 'Good', emoji: '😊' },
    { value: 'okay', label: 'Okay', emoji: '😐' },
    { value: 'poor', label: 'Poor', emoji: '😔' },
    { value: 'terrible', label: 'Terrible', emoji: '😢' }
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await contextualAwarenessService.reportMood(energy, motivation, stress, mood);
      
      Alert.alert(
        'Mood Reported',
        'Thank you! Your mood data will help us provide better personalized recommendations.',
        [{ text: 'OK' }]
      );
      
      onSubmit?.();
      onClose();
      
      // Reset form
      setEnergy(5);
      setMotivation(5);
      setStress(5);
      setMood('okay');
      
      console.log('Mood reported successfully');
    } catch (error) {
      console.error('Error reporting mood:', error);
      Alert.alert('Error', 'Failed to report mood. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSliderColor = (value: number, type: 'energy' | 'motivation' | 'stress') => {
    if (type === 'stress') {
      // For stress, higher values are worse (red), lower values are better (green)
      return value <= 3 ? colors.success : value <= 6 ? colors.warning : colors.danger;
    } else {
      // For energy and motivation, higher values are better
      return value <= 3 ? colors.danger : value <= 6 ? colors.warning : colors.success;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>How are you feeling?</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Help us personalize your recommendations by sharing how you feel today.
          </Text>

          {/* Energy Level */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderHeader}>
              <Zap size={20} color={getSliderColor(energy, 'energy')} />
              <Text style={styles.sliderLabel}>Energy Level</Text>
              <Text style={[styles.sliderValue, { color: getSliderColor(energy, 'energy') }]}>
                {energy}/10
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={energy}
              onValueChange={setEnergy}
              minimumTrackTintColor={getSliderColor(energy, 'energy')}
              maximumTrackTintColor={colors.ios.separator}
              thumbTintColor={getSliderColor(energy, 'energy')}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Low</Text>
              <Text style={styles.sliderLabelText}>High</Text>
            </View>
          </View>

          {/* Motivation Level */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderHeader}>
              <Heart size={20} color={getSliderColor(motivation, 'motivation')} />
              <Text style={styles.sliderLabel}>Motivation</Text>
              <Text style={[styles.sliderValue, { color: getSliderColor(motivation, 'motivation') }]}>
                {motivation}/10
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={motivation}
              onValueChange={setMotivation}
              minimumTrackTintColor={getSliderColor(motivation, 'motivation')}
              maximumTrackTintColor={colors.ios.separator}
              thumbTintColor={getSliderColor(motivation, 'motivation')}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Low</Text>
              <Text style={styles.sliderLabelText}>High</Text>
            </View>
          </View>

          {/* Stress Level */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderHeader}>
              <Brain size={20} color={getSliderColor(stress, 'stress')} />
              <Text style={styles.sliderLabel}>Stress Level</Text>
              <Text style={[styles.sliderValue, { color: getSliderColor(stress, 'stress') }]}>
                {stress}/10
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={stress}
              onValueChange={setStress}
              minimumTrackTintColor={getSliderColor(stress, 'stress')}
              maximumTrackTintColor={colors.ios.separator}
              thumbTintColor={getSliderColor(stress, 'stress')}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Low</Text>
              <Text style={styles.sliderLabelText}>High</Text>
            </View>
          </View>

          {/* Overall Mood */}
          <View style={styles.moodSection}>
            <Text style={styles.moodLabel}>Overall Mood</Text>
            <View style={styles.moodOptions}>
              {moodOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.moodOption,
                    mood === option.value && styles.selectedMoodOption
                  ]}
                  onPress={() => setMood(option.value)}
                >
                  <Text style={styles.moodEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.moodText,
                    mood === option.value && styles.selectedMoodText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Mood Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ios.secondaryGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.ios.separator,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  sliderSection: {
    marginBottom: 32,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moodSection: {
    marginBottom: 32,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.ios.tertiaryBackground,
    minWidth: 60,
  },
  selectedMoodOption: {
    backgroundColor: colors.primary,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedMoodText: {
    color: colors.text,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default MoodReportModal;