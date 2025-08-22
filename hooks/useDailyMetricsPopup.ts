import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWhoopStore } from '@/store/whoopStore';
import { useProgramAwareWorkoutAnalysis } from './useProgramAwareWorkoutAnalysis';

const DAILY_POPUP_KEY = 'daily_metrics_popup_shown';
const POPUP_COOLDOWN_HOURS = 8; // Show popup at most every 8 hours

export const useDailyMetricsPopup = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { isConnectedToWhoop, data: whoopData } = useWhoopStore();
  const { hasAdjustment, currentAdjustment } = useProgramAwareWorkoutAnalysis();

  const checkShouldShowPopup = async (): Promise<boolean> => {
    // Always show popup for UI testing
    return true;
  };

  const showDailyPopup = async () => {
    const shouldShow = await checkShouldShowPopup();
    if (shouldShow) {
      console.log('Showing daily metrics popup');
      setShowPopup(true);
    }
  };

  const closeDailyPopup = async () => {
    try {
      // Record that we showed the popup
      await AsyncStorage.setItem(DAILY_POPUP_KEY, new Date().toISOString());
      setShowPopup(false);
      console.log('Daily metrics popup closed and recorded');
    } catch (error) {
      console.error('Error recording daily popup close:', error);
      setShowPopup(false);
    }
  };

  const triggerPopupManually = () => {
    if (isConnectedToWhoop) {
      setShowPopup(true);
    }
  };

  // Initialize and always show popup for UI testing
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      setShowPopup(true);
    }
  }, [isInitialized]);

  // Always keep popup visible for UI testing
  useEffect(() => {
    if (isInitialized) {
      setShowPopup(true);
    }
  }, [isInitialized]);

  return {
    showPopup,
    closeDailyPopup,
    triggerPopupManually,
    hasAdjustment,
    isConnectedToWhoop
  };
};

export default useDailyMetricsPopup;