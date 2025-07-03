import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image
} from 'react-native';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  ChevronLeft, 
  Clock, 
  Heart, 
  Flame, 
  TrendingUp,
  BarChart,
  Share2
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWhoopStore } from '@/store/whoopStore';
import { Activity } from '@/types/whoop';

export default function ActivityDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const activityId = params.id as string;
  
  const { data } = useWhoopStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  
  // Find the activity in the strain data
  React.useEffect(() => {
    if (activityId) {
      // Search through all strain records to find the activity
      for (const strain of data.strain) {
        const foundActivity = strain.activities.find(a => a.id === activityId);
        if (foundActivity) {
          setActivity(foundActivity);
          break;
        }
      }
    }
  }, [activityId, data]);
  
  if (!activity) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Activity not found</Text>
        </View>
      </View>
    );
  }
  
  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  // Format time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Get activity image based on type
  const getActivityImage = (type: string) => {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('run') || lowerType.includes('jog')) {
      return 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
    } else if (lowerType.includes('weight') || lowerType.includes('strength') || lowerType.includes('gym')) {
      return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
    } else if (lowerType.includes('yoga') || lowerType.includes('stretch') || lowerType.includes('mobility')) {
      return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
    } else if (lowerType.includes('bike') || lowerType.includes('cycling')) {
      return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
    } else {
      return 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
    }
  };
  
  // Get heart rate zone description
  const getHeartRateZoneDescription = (avgHR: number) => {
    // These are approximate zones - would be better with max HR from user profile
    if (avgHR >= 170) return "Zone 5 - Maximum";
    if (avgHR >= 160) return "Zone 4 - Threshold";
    if (avgHR >= 140) return "Zone 3 - Tempo";
    if (avgHR >= 120) return "Zone 2 - Endurance";
    return "Zone 1 - Recovery";
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activity.type}</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image 
          source={{ uri: getActivityImage(activity.type) }}
          style={styles.activityImage}
          resizeMode="cover"
        />
        
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{formatDate(activity.startTime)}</Text>
          <Text style={styles.timeText}>
            {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
          </Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.metricLabel}>Strain</Text>
            <Text style={styles.metricValue}>{activity.strain.toFixed(1)}</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.metricLabel}>Duration</Text>
            <Text style={styles.metricValue}>{formatDuration(activity.duration)}</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Flame size={20} color={colors.primary} />
            <Text style={styles.metricLabel}>Calories</Text>
            <Text style={styles.metricValue}>{activity.calories}</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Heart size={20} color={colors.primary} />
            <Text style={styles.metricLabel}>Avg HR</Text>
            <Text style={styles.metricValue}>{activity.averageHeartRate} bpm</Text>
          </View>
        </View>
        
        <View style={styles.heartRateContainer}>
          <Text style={styles.sectionTitle}>Heart Rate</Text>
          
          <View style={styles.heartRateZone}>
            <View style={styles.zoneHeader}>
              <Text style={styles.zoneTitle}>Average</Text>
              <Text style={styles.zoneValue}>{activity.averageHeartRate} bpm</Text>
            </View>
            <Text style={styles.zoneDescription}>
              {getHeartRateZoneDescription(activity.averageHeartRate)}
            </Text>
          </View>
          
          <View style={styles.heartRateZone}>
            <View style={styles.zoneHeader}>
              <Text style={styles.zoneTitle}>Maximum</Text>
              <Text style={styles.zoneValue}>{activity.maxHeartRate} bpm</Text>
            </View>
          </View>
          
          <View style={styles.hrGraph}>
            <BarChart size={24} color={colors.textSecondary} />
            <Text style={styles.graphPlaceholder}>Heart rate graph visualization</Text>
          </View>
        </View>
        
        <View style={styles.analysisContainer}>
          <Text style={styles.sectionTitle}>AI Analysis</Text>
          
          <Text style={styles.analysisText}>
            This {activity.type.toLowerCase()} session generated a strain of {activity.strain.toFixed(1)}, 
            which is {activity.strain > 14 ? "high" : activity.strain > 9 ? "moderate" : "light"} intensity. 
            Your average heart rate of {activity.averageHeartRate} bpm indicates you were working in 
            {getHeartRateZoneDescription(activity.averageHeartRate).toLowerCase()}.
          </Text>
          
          <Text style={styles.analysisText}>
            Based on your recent recovery scores, this workout was 
            {activity.strain > 14 ? " challenging but manageable" : " well within your capacity"}. 
            For optimal recovery, focus on proper nutrition and hydration in the next 24 hours.
          </Text>
        </View>
        
        <TouchableOpacity style={styles.compareButton}>
          <BarChart size={18} color={colors.text} />
          <Text style={styles.compareButtonText}>Compare to Previous Activities</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  shareButton: {
    padding: 4,
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
  activityImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },
  dateTimeContainer: {
    marginBottom: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  heartRateContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  heartRateZone: {
    marginBottom: 16,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  zoneValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  zoneDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  hrGraph: {
    height: 120,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphPlaceholder: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  analysisContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 12,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
  },
  compareButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});