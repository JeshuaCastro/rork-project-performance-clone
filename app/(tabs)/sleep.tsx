import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform
} from 'react-native';
import { useWhoopStore } from '@/store/whoopStore';
import SleepInsights from '@/components/SleepInsights';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { RefreshCw, Moon, Clock, Zap, TrendingUp } from 'lucide-react-native';

type Range = '7d' | '30d' | '90d';

export default function SleepScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<Range>('7d');
  
  const { 
    data,
    isConnectedToWhoop,
    syncWhoopData,
    isLoadingWhoopData
  } = useWhoopStore();
  
  const onRefresh = async () => {
    setRefreshing(true);
    await syncWhoopData();
    setRefreshing(false);
  };
  
  // Get today's sleep data for daily metrics
  const todaysSleepData = useMemo(() => {
    if (!data?.sleep || data.sleep.length === 0) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const todaysData = data.sleep.find(sleep => sleep.date === today);
    
    // If no data for today, get the most recent data
    return todaysData || data.sleep[0] || null;
  }, [data?.sleep]);
  
  const todaysRecoveryData = useMemo(() => {
    if (!data?.recovery || data.recovery.length === 0) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const todaysData = data.recovery.find(recovery => recovery.date === today);
    
    // If no data for today, get the most recent data
    return todaysData || data.recovery[0] || null;
  }, [data?.recovery]);
  
  const renderDailySleepMetrics = () => {
    if (!isConnectedToWhoop || !todaysSleepData) {
      return (
        <View style={styles.dailyMetricsContainer}>
          <Text style={styles.dailyMetricsTitle}>Today&apos;s Sleep</Text>
          <View style={styles.noDataCard}>
            <Moon size={24} color={colors.textSecondary} />
            <Text style={styles.noDataCardText}>No sleep data available</Text>
            <Text style={styles.noDataCardSubtext}>Sync your WHOOP to see today&apos;s metrics</Text>
          </View>
        </View>
      );
    }
    
    const sleepScore = todaysSleepData.qualityScore || 0;
    const sleepDuration = todaysSleepData.duration || 0;
    const sleepEfficiency = todaysSleepData.efficiency || 0;
    // const disturbances = todaysSleepData.disturbances || 0; // Unused for now
    
    // Calculate sleep debt (assuming 8 hours is optimal)
    const optimalSleep = 8 * 60; // 8 hours in minutes
    const sleepDebt = Math.max(0, optimalSleep - sleepDuration);
    
    // Get training readiness from recovery data
    const recoveryScore = todaysRecoveryData?.score || 0;
    const trainingReadiness = recoveryScore >= 70 ? 'High' : recoveryScore >= 50 ? 'Medium' : 'Low';
    
    const formatDuration = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };
    
    return (
      <View style={styles.dailyMetricsContainer}>
        <Text style={styles.dailyMetricsTitle}>Today&apos;s Sleep</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Moon size={20} color={colors.primary} />
              <Text style={styles.metricLabel}>Sleep Score</Text>
            </View>
            <Text style={styles.metricValue}>{sleepScore}%</Text>
            <Text style={styles.metricSubtext}>
              {sleepScore >= 80 ? 'Excellent' : sleepScore >= 60 ? 'Good' : sleepScore >= 40 ? 'Fair' : 'Poor'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Clock size={20} color={colors.primary} />
              <Text style={styles.metricLabel}>Duration</Text>
            </View>
            <Text style={styles.metricValue}>{formatDuration(sleepDuration)}</Text>
            <Text style={styles.metricSubtext}>
              {sleepDebt > 0 ? `${Math.round(sleepDebt / 60 * 10) / 10}h debt` : 'Well rested'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={styles.metricLabel}>Efficiency</Text>
            </View>
            <Text style={styles.metricValue}>{sleepEfficiency}%</Text>
            <Text style={styles.metricSubtext}>
              {sleepEfficiency >= 85 ? 'Excellent' : sleepEfficiency >= 75 ? 'Good' : 'Needs work'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Zap size={20} color={colors.primary} />
              <Text style={styles.metricLabel}>Readiness</Text>
            </View>
            <Text style={styles.metricValue}>{trainingReadiness}</Text>
            <Text style={styles.metricSubtext}>
              {recoveryScore}% recovery
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderNoDataView = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataTitle}>No Sleep Data Available</Text>
      <Text style={styles.noDataText}>
        Connect your WHOOP account and sync your data to see detailed sleep insights.
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Sleep Analysis</Text>
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={onRefresh}
          disabled={isLoadingWhoopData || !isConnectedToWhoop}
        >
          <RefreshCw 
            size={18} 
            color={colors.text} 
            style={{
              transform: [{ rotate: isLoadingWhoopData ? '180deg' : '0deg' }]
            }}
          />
        </TouchableOpacity>
      </View>
      
      {/* Daily Sleep Metrics */}
      {renderDailySleepMetrics()}
      
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <Text style={styles.sectionTitle}>Time Range</Text>
        <View style={styles.timeRangeButtons}>
          {(['7d', '30d', '90d'] as Range[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedRange === range && styles.timeRangeButtonActive
              ]}
              onPress={() => setSelectedRange(range)}
              testID={`sleep-range-${range}`}
            >
              <Text style={[
                styles.timeRangeButtonText,
                selectedRange === range && styles.timeRangeButtonTextActive
              ]}>
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isConnectedToWhoop && data?.sleep && data.sleep.length > 0 ? (
          <SleepInsights selectedRange={selectedRange} />
        ) : (
          renderNoDataView()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ios.groupedBackground,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.ios.groupedBackground,
    borderBottomWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderBottomColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#2A2A2A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
  },
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ios.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  timeRangeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeRangeButtonTextActive: {
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dailyMetricsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderBottomColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : '#2A2A2A',
  },
  dailyMetricsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  metricSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  noDataCard: {
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  noDataCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  noDataCardSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});