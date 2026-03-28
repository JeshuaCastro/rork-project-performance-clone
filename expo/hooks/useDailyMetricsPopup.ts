import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWhoopStore } from '@/store/whoopStore';

const DAILY_POPUP_KEY = 'daily_metrics_popup_shown';
const POPUP_COOLDOWN_HOURS = 8; // Show popup at most every 8 hours

export const useDailyMetricsPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { isConnectedToWhoop, data: whoopData } = useWhoopStore();

  const checkShouldShowPopup = useCallback(async (): Promise<boolean> => {
    try {
      if (!isConnectedToWhoop) {
        console.log('Not connected to Whoop, skipping daily popup');
        return false;
      }

      // Check if we have today's recovery data
      const today = new Date().toISOString().split('T')[0];
      const todaysRecovery = whoopData.recovery.find(r => r.date === today);
      
      if (!todaysRecovery) {
        console.log('No recovery data for today, skipping daily popup');
        return false;
      }

      // Check when we last showed the popup
      const lastShownStr = await AsyncStorage.getItem(DAILY_POPUP_KEY);
      const now = new Date();
      
      if (lastShownStr) {
        const lastShown = new Date(lastShownStr);
        const hoursSinceLastShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastShown < POPUP_COOLDOWN_HOURS) {
          console.log(`Daily popup shown ${hoursSinceLastShown.toFixed(1)} hours ago, waiting for cooldown`);
          return false;
        }
      }

      // Show popup if:
      // 1. We have recovery data
      // 2. It's been more than cooldown period since last shown
      // 3. It's the first time today
      const shouldShow = !lastShownStr || 
        new Date(lastShownStr).toDateString() !== now.toDateString();

      console.log('Daily popup check:', {
        hasRecoveryData: !!todaysRecovery,
        shouldShow,
        lastShown: lastShownStr
      });

      return shouldShow;
    } catch (error) {
      console.error('Error checking if should show daily popup:', error);
      return false;
    }
  }, [isConnectedToWhoop, whoopData.recovery]);

  const showDailyPopup = useCallback(async () => {
    const shouldShow = await checkShouldShowPopup();
    if (shouldShow) {
      console.log('Showing daily metrics popup');
      setShowPopup(true);
    }
  }, [checkShouldShowPopup]);

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
    console.log('Manually triggering daily metrics popup');
    setShowPopup(true);
  };

  const forceShowPopup = () => {
    console.log('Force showing daily metrics popup for testing');
    setShowPopup(true);
  };

  // Initialize and check if we should show popup
  useEffect(() => {
    if (!isInitialized && isConnectedToWhoop && whoopData.recovery.length > 0) {
      setIsInitialized(true);
      
      // Delay to avoid showing immediately on app start
      const timer = setTimeout(() => {
        showDailyPopup();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isConnectedToWhoop, whoopData.recovery.length, isInitialized, showDailyPopup]);

  return {
    showPopup,
    closeDailyPopup,
    triggerPopupManually,
    forceShowPopup,
    isConnectedToWhoop
  };
};

export default useDailyMetricsPopup;