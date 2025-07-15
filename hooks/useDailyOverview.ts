import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

const DAILY_OVERVIEW_SHOWN_KEY = 'daily_overview_shown';
const LAST_OVERVIEW_DATE_KEY = 'last_overview_date';

export function useDailyOverview() {
  const [showDailyOverview, setShowDailyOverview] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);

  // Get today's date string
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Check if we should show the daily overview
  const checkShouldShowOverview = async () => {
    try {
      const today = getTodayString();
      const lastShownDate = await AsyncStorage.getItem(LAST_OVERVIEW_DATE_KEY);
      
      // Show if we haven't shown it today
      const shouldShow = lastShownDate !== today;
      
      if (shouldShow) {
        setShowDailyOverview(true);
        setHasShownToday(false);
      } else {
        setHasShownToday(true);
      }
      
      return shouldShow;
    } catch (error) {
      console.error('Error checking daily overview status:', error);
      return false;
    }
  };

  // Mark daily overview as shown for today
  const markOverviewShown = async () => {
    try {
      const today = getTodayString();
      await AsyncStorage.setItem(LAST_OVERVIEW_DATE_KEY, today);
      setHasShownToday(true);
      setShowDailyOverview(false);
    } catch (error) {
      console.error('Error marking daily overview as shown:', error);
    }
  };

  // Manually show the daily overview
  const showOverview = () => {
    setShowDailyOverview(true);
  };

  // Hide the daily overview
  const hideOverview = () => {
    setShowDailyOverview(false);
  };

  // Handle app state changes to check for new day
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Check if we should show overview when app becomes active
        checkShouldShowOverview();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Initial check when hook mounts
    checkShouldShowOverview();

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    showDailyOverview,
    hasShownToday,
    showOverview,
    hideOverview,
    markOverviewShown,
    checkShouldShowOverview
  };
}