import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { colors } from '@/constants/colors';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useWhoopStore } from '@/store/whoopStore';

interface CalendarViewProps {
  onSelectDate: (date: string) => void;
  selectedDate: string;
  highlightedDates?: string[]; // Dates with data
}

export default function CalendarView({ onSelectDate, selectedDate, highlightedDates = [] }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Array<{ date: Date | null, isCurrentMonth: boolean }>>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  
  // Generate calendar days for the current month
  useEffect(() => {
    const days = generateCalendarDays(currentMonth);
    setCalendarDays(days);
  }, [currentMonth]);
  
  // Animate calendar expansion/collapse
  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, animatedHeight]);
  
  // Generate array of calendar days for the specified month
  const generateCalendarDays = (month: Date) => {
    const days: Array<{ date: Date | null, isCurrentMonth: boolean }> = [];
    
    // Create a new date object for the first day of the month
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Add days from previous month to fill the first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDate = new Date(month.getFullYear(), month.getMonth(), -i);
      days.unshift({ date: prevMonthDate, isCurrentMonth: false });
    }
    
    // Add days of the current month
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        date: new Date(month.getFullYear(), month.getMonth(), i), 
        isCurrentMonth: true 
      });
    }
    
    // Add days from next month to complete the last week
    const lastDayOfWeek = days[days.length - 1].date!.getDay();
    const daysToAdd = 6 - lastDayOfWeek;
    
    for (let i = 1; i <= daysToAdd; i++) {
      days.push({ 
        date: new Date(month.getFullYear(), month.getMonth() + 1, i), 
        isCurrentMonth: false 
      });
    }
    
    return days;
  };
  
  // Format date as YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    // Ensure we're working with the date in local timezone without time component
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Go to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };
  
  // Check if a date has data
  const hasData = (date: Date): boolean => {
    const dateString = formatDateString(date);
    return highlightedDates.includes(dateString);
  };
  
  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  // Check if a date is selected
  const isSelected = (date: Date): boolean => {
    // Compare the formatted date strings to determine if this date is selected
    const formattedDate = formatDateString(date);
    return formattedDate === selectedDate;
  };
  
  // Format month and year for display
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };
  
  // Render day of week headers
  const renderDayHeaders = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.weekdayHeader}>
        {dayNames.map((day, index) => (
          <Text key={index} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>
    );
  };
  
  // Get current week days
  const getCurrentWeekDays = () => {
    // Create a proper Date object from the selectedDate string
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay(); // 0 = Sunday, 6 = Saturday
    
    const weekDays = [];
    
    // Add days from Sunday to the selected date
    for (let i = 0; i <= dayOfWeek; i++) {
      const date = new Date(selectedDateObj);
      date.setDate(selectedDateObj.getDate() - (dayOfWeek - i));
      weekDays.push({ 
        date, 
        isCurrentMonth: date.getMonth() === currentMonth.getMonth() 
      });
    }
    
    // Add days after the selected date until Saturday
    for (let i = 1; i <= 6 - dayOfWeek; i++) {
      const date = new Date(selectedDateObj);
      date.setDate(selectedDateObj.getDate() + i);
      weekDays.push({ 
        date, 
        isCurrentMonth: date.getMonth() === currentMonth.getMonth() 
      });
    }
    
    return weekDays;
  };
  
  // Toggle calendar expansion
  const toggleCalendarExpansion = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Render a day cell
  const renderDayCell = (day: { date: Date | null, isCurrentMonth: boolean }, index: number) => {
    if (!day.date) return <View key={index} style={styles.emptyDay} />;
    
    const dateString = formatDateString(day.date);
    const hasDataForDate = hasData(day.date);
    const isTodayDate = isToday(day.date);
    const isSelectedDate = isSelected(day.date);
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.day,
          !day.isCurrentMonth && styles.otherMonthDay,
          // Apply today style only if it's today AND not selected
          isTodayDate && !isSelectedDate && styles.today,
          // Always apply selected style if the date is selected (takes precedence)
          isSelectedDate && styles.selectedDay,
          hasDataForDate && styles.dataDay
        ]}
        onPress={() => hasDataForDate && onSelectDate(dateString)}
        disabled={!hasDataForDate}
      >
        <Text 
          style={[
            styles.dayText,
            !day.isCurrentMonth && styles.otherMonthDayText,
            isTodayDate && !isSelectedDate && styles.todayText,
            isSelectedDate && styles.selectedDayText,
            hasDataForDate && styles.dataDayText
          ]}
        >
          {day.date.getDate()}
        </Text>
        
        {hasDataForDate && <View style={styles.dataIndicator} />}
      </TouchableOpacity>
    );
  };

  // Get device dimensions for responsive sizing
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isSmallDevice = SCREEN_WIDTH < 375;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToCurrentMonth} style={styles.monthYearContainer}>
          <Text style={styles.monthYearText}>{formatMonthYear(currentMonth)}</Text>
          <CalendarIcon size={16} color={colors.textSecondary} style={styles.calendarIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.expandButton}
        onPress={toggleCalendarExpansion}
      >
        {isExpanded ? (
          <ChevronUp size={20} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
      
      {/* Always show current week */}
      <View style={styles.weekContainer}>
        {renderDayHeaders()}
        
        <View style={styles.calendarGrid}>
          {getCurrentWeekDays().map((day, index) => renderDayCell(day, index))}
        </View>
      </View>
      
      {/* Full month calendar (animated) */}
      <Animated.View 
        style={[
          styles.fullCalendarContainer,
          {
            height: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 220] // Adjust based on your calendar height
            }),
            opacity: animatedHeight,
            overflow: 'hidden'
          }
        ]}
      >
        {renderDayHeaders()}
        
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => renderDayCell(day, index))}
        </View>
      </Animated.View>
    </View>
  );
}

// Get device dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: isSmallDevice ? 8 : 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
  },
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  calendarIcon: {
    marginLeft: 6,
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  weekContainer: {
    marginBottom: 8,
  },
  fullCalendarContainer: {
    marginTop: 8,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: isSmallDevice ? 11 : 12,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%', // 7 days per row
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.text,
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  otherMonthDayText: {
    color: colors.textSecondary,
  },
  today: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    borderRadius: 20,
  },
  todayText: {
    fontWeight: '700',
    color: colors.primary,
  },
  selectedDay: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  selectedDayText: {
    color: colors.text,
    fontWeight: '700',
  },
  dataDay: {
    // Style for days that have data
  },
  dataDayText: {
    fontWeight: '500',
  },
  dataIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});