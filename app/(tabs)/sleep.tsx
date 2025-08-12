import React, { useState } from 'react';
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
import { RefreshCw } from 'lucide-react-native';

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

});