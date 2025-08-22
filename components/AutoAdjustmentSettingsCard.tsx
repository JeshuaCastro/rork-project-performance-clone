import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Settings, Zap, Shield, TrendingUp } from 'lucide-react-native';
import { AutoAdjustmentSettings } from '@/services/programAwareDataAnalysis';
import IOSCard from './IOSCard';
import IOSSegmentedControl from './IOSSegmentedControl';

interface AutoAdjustmentSettingsCardProps {
  settings: AutoAdjustmentSettings;
  onSettingsChange: (settings: Partial<AutoAdjustmentSettings>) => void;
  isConnectedToWhoop: boolean;
}

export const AutoAdjustmentSettingsCard: React.FC<AutoAdjustmentSettingsCardProps> = ({
  settings,
  onSettingsChange,
  isConnectedToWhoop
}) => {
  const aggressivenessOptions = ['Conservative', 'Moderate', 'Aggressive'];
  const aggressivenessValues = ['conservative', 'moderate', 'aggressive'] as const;

  const getAggressivenessDescription = () => {
    switch (settings.aggressiveness) {
      case 'conservative':
        return 'Minimal adjustments, prioritizes program adherence';
      case 'moderate':
        return 'Balanced approach between recovery and program goals';
      case 'aggressive':
        return 'Prioritizes recovery metrics over program schedule';
      default:
        return '';
    }
  };

  const getAggressivenessIcon = () => {
    switch (settings.aggressiveness) {
      case 'conservative':
        return <Shield size={16} color="#4CAF50" />;
      case 'moderate':
        return <TrendingUp size={16} color="#FF9500" />;
      case 'aggressive':
        return <Zap size={16} color="#FF6B35" />;
      default:
        return null;
    }
  };

  if (!isConnectedToWhoop) {
    return (
      <IOSCard style={styles.container}>
        <View style={styles.disabledHeader}>
          <Settings size={24} color="#999999" />
          <Text style={styles.disabledTitle}>Auto-Adjustment Settings</Text>
        </View>
        <Text style={styles.disabledText}>
          Connect your WHOOP device to enable automatic workout adjustments based on your recovery data.
        </Text>
      </IOSCard>
    );
  }

  return (
    <IOSCard style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color="#007AFF" />
        <Text style={styles.title}>Auto-Adjustment Settings</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Auto-Adjustments</Text>
            <Text style={styles.settingDescription}>
              Automatically modify workouts based on your recovery metrics
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(enabled) => onSettingsChange({ enabled })}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {settings.enabled && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adjustment Style</Text>
            <View style={styles.aggressivenessContainer}>
              <IOSSegmentedControl
                segments={aggressivenessOptions}
                selectedIndex={aggressivenessValues.indexOf(settings.aggressiveness)}
                onSelectionChange={(index: number) => onSettingsChange({ aggressiveness: aggressivenessValues[index] })}
              />
              <View style={styles.aggressivenessInfo}>
                {getAggressivenessIcon()}
                <Text style={styles.aggressivenessDescription}>
                  {getAggressivenessDescription()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recovery Thresholds</Text>
            
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Min Recovery for High Intensity</Text>
              <Text style={styles.thresholdValue}>{settings.minRecoveryForIntense}%</Text>
            </View>
            
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Max Strain Threshold</Text>
              <Text style={styles.thresholdValue}>{settings.maxStrainThreshold}</Text>
            </View>
            
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Sleep Quality Threshold</Text>
              <Text style={styles.thresholdValue}>{settings.sleepQualityThreshold}%</Text>
            </View>
            
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>HRV Threshold</Text>
              <Text style={styles.thresholdValue}>{settings.hrvThreshold}ms</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adjustment Options</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Allow Workout Skipping</Text>
                <Text style={styles.settingDescription}>
                  Skip workouts when recovery is very low
                </Text>
              </View>
              <Switch
                value={settings.allowSkipWorkouts}
                onValueChange={(allowSkipWorkouts) => onSettingsChange({ allowSkipWorkouts })}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Allow Intensity Increases</Text>
                <Text style={styles.settingDescription}>
                  Increase intensity when recovery is excellent
                </Text>
              </View>
              <Switch
                value={settings.allowIntensityIncrease}
                onValueChange={(allowIntensityIncrease) => onSettingsChange({ allowIntensityIncrease })}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Respect Program Goals</Text>
                <Text style={styles.settingDescription}>
                  Consider program timeline when making adjustments
                </Text>
              </View>
              <Switch
                value={settings.respectProgramGoals}
                onValueChange={(respectProgramGoals) => onSettingsChange({ respectProgramGoals })}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </>
      )}
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  disabledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999999',
    marginLeft: 12,
  },
  disabledText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  aggressivenessContainer: {
    gap: 12,
  },
  aggressivenessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  aggressivenessDescription: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  thresholdValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});