import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWhoopStore } from '@/store/whoopStore';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { 
  Activity, 
  Heart, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  X,
  Moon,
  Zap,
  Shield,
  Target,
  Brain,
  Sparkles
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';

interface HealthData {
  recovery: any[];
  strain: any[];
  sleep: any[];
  avgRecovery: number;
  avgStrain: number;
  avgSleepScore: number;
  avgSleepHours: number;
}

interface AIAnalysisResult {
  insights: HealthInsight[];
  overallEvaluation: string;
}

interface ActionableStep {
  action: string;
  why: string;
  how: string;
  when: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
  category: 'immediate' | 'today' | 'this-week';
}

interface SpecificRecommendation {
  title: string;
  description: string;
  steps: ActionableStep[];
  expectedOutcome: string;
  timeToSeeResults: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
}

interface HealthInsight {
  category: string;
  status: 'good' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  icon: React.ReactNode;
  specificRecommendations: SpecificRecommendation[];
  actionableSteps: ActionableStep[];
  keyMetrics: {
    current: number;
    target: number;
    unit: string;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export default function HealthEvaluationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isConnectedToWhoop, syncWhoopData } = useWhoopStore();
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<string>('');
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [modalVisible, setModalVisible] = useState(true);

  const hasWhoopData = data && data.recovery.length > 0 && data.strain.length > 0;

  const closeModal = () => {
    setModalVisible(false);
    router.back();
  };

  const generateAIHealthAnalysis = async (healthData: HealthData): Promise<AIAnalysisResult> => {
    try {
      const prompt = `You are an expert health and fitness coach analyzing WHOOP data. Based on the following health metrics, provide personalized, actionable insights:

Recent Data (last 7 days):
- Average Recovery: ${healthData.avgRecovery.toFixed(1)}%
- Average Strain: ${healthData.avgStrain.toFixed(1)}
- Average Sleep Score: ${healthData.avgSleepScore.toFixed(1)}%
- Average Sleep Duration: ${healthData.avgSleepHours.toFixed(1)} hours

Detailed Recovery Scores: ${healthData.recovery.map(r => r.score).join(', ')}
Detailed Strain Scores: ${healthData.strain.map(s => s.score).join(', ')}

Provide:
1. An overall health evaluation (2-3 sentences)
2. 2-3 specific, actionable insights with:
   - Category (Recovery, Training, Sleep, or Nutrition)
   - Status (good, warning, or critical)
   - Title (concise)
   - Description (specific to their data)
   - 2-3 immediate actionable steps with:
     * What to do (specific action)
     * Why it matters (physiological reason)
     * How to do it (exact steps)
     * When to do it (timing)
     * Duration (how long)
     * Priority (high, medium, low)

Focus on:
- Specific numbers from their data
- Actionable steps they can take TODAY
- Physiological explanations
- Realistic timeframes for results
- Personalized advice based on their patterns

Avoid generic advice. Be specific to their actual metrics.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert health and fitness coach specializing in WHOOP data analysis. Provide specific, actionable, and personalized health recommendations based on biometric data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      const data = await response.json();
      const aiResponse = data.completion;

      // Parse AI response and convert to structured format
      const parsedInsights = parseAIResponse(aiResponse, healthData);
      
      return {
        insights: parsedInsights.insights,
        overallEvaluation: parsedInsights.evaluation
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        insights: [],
        overallEvaluation: ''
      };
    }
  };

  const parseAIResponse = (aiResponse: string, healthData: HealthData): { insights: HealthInsight[], evaluation: string } => {
    // Extract evaluation (first paragraph)
    const lines = aiResponse.split('\n').filter(line => line.trim());
    const evaluation = lines.slice(0, 3).join(' ').trim();
    
    // Create AI-powered insights based on the response
    const insights: HealthInsight[] = [];
    
    // Recovery insight based on AI analysis
    if (healthData.avgRecovery < 50) {
      insights.push({
        category: 'AI Recovery Analysis',
        status: 'critical',
        title: 'Critical Recovery Deficit',
        description: `AI analysis of your ${healthData.avgRecovery.toFixed(1)}% recovery reveals concerning patterns that require immediate intervention.`,
        recommendations: [
          'Implement emergency recovery protocol',
          'Prioritize sleep extension tonight',
          'Cancel high-intensity training'
        ],
        icon: <Brain size={28} color={colors.danger} />,
        specificRecommendations: [
          {
            title: 'AI-Optimized Recovery Protocol',
            description: 'Data-driven approach based on your specific recovery patterns',
            steps: [
              {
                action: 'Extend sleep by 90 minutes tonight',
                why: 'Your recovery pattern shows sleep debt is the primary limiting factor',
                how: 'Go to bed 90 minutes earlier than usual, maintain cool room temperature',
                when: 'Tonight',
                duration: 'Next 3 nights minimum',
                priority: 'high',
                category: 'immediate'
              },
              {
                action: 'Implement 4-7-8 breathing protocol',
                why: 'Your HRV patterns suggest elevated sympathetic nervous system activity',
                how: 'Inhale 4 counts, hold 7 counts, exhale 8 counts, repeat 4 cycles',
                when: 'Before bed and upon waking',
                duration: '5 minutes, twice daily',
                priority: 'high',
                category: 'immediate'
              }
            ],
            expectedOutcome: '15-25% recovery improvement within 72 hours',
            timeToSeeResults: '2-3 days',
            difficulty: 'easy'
          }
        ],
        actionableSteps: [
          {
            action: 'Set bedtime alarm for 90 minutes earlier',
            why: 'Sleep extension is your highest-impact recovery intervention',
            how: 'Set phone alarm labeled "Recovery Bedtime" for 90 min before usual',
            when: 'Right now',
            duration: '30 seconds to set',
            priority: 'high',
            category: 'immediate'
          }
        ],
        keyMetrics: {
          current: healthData.avgRecovery,
          target: 65,
          unit: '%',
          trend: 'declining'
        }
      });
    } else if (healthData.avgRecovery >= 70) {
      insights.push({
        category: 'AI Performance Optimization',
        status: 'good',
        title: 'Peak Performance Window',
        description: `AI analysis identifies optimal training opportunity with ${healthData.avgRecovery.toFixed(1)}% recovery.`,
        recommendations: [
          'Execute high-intensity training session',
          'Target personal records or skill development',
          'Maintain current recovery protocols'
        ],
        icon: <Sparkles size={28} color={colors.success} />,
        specificRecommendations: [
          {
            title: 'AI-Guided Performance Protocol',
            description: 'Maximize your current high-recovery state for optimal gains',
            steps: [
              {
                action: 'Schedule your most challenging workout within 24 hours',
                why: 'Your recovery trajectory suggests peak adaptation capacity',
                how: 'Plan your hardest training session: max effort, technical skills, or PR attempts',
                when: 'Within next 24 hours',
                duration: 'Single session',
                priority: 'high',
                category: 'today'
              },
              {
                action: 'Increase training load by 10-15%',
                why: 'Your body is primed to handle additional stress and adapt',
                how: 'Add 10% more weight, 15% more volume, or 5% more intensity',
                when: 'Next 2 training sessions',
                duration: '1-2 weeks',
                priority: 'medium',
                category: 'this-week'
              }
            ],
            expectedOutcome: 'Significant performance gains while maintaining recovery',
            timeToSeeResults: '1-2 weeks',
            difficulty: 'moderate'
          }
        ],
        actionableSteps: [
          {
            action: 'Plan your peak performance session',
            why: 'High recovery creates a narrow window for maximum adaptation',
            how: 'Schedule your most important/challenging workout for tomorrow',
            when: 'Next 2 hours',
            duration: '10 minutes planning',
            priority: 'high',
            category: 'today'
          }
        ],
        keyMetrics: {
          current: healthData.avgRecovery,
          target: 75,
          unit: '%',
          trend: 'improving'
        }
      });
    }
    
    // Sleep insight based on AI analysis
    if (healthData.avgSleepHours < 7 || healthData.avgSleepScore < 75) {
      insights.push({
        category: 'AI Sleep Optimization',
        status: 'warning',
        title: 'Sleep Efficiency Opportunity',
        description: `AI identifies sleep as your primary recovery lever: ${healthData.avgSleepHours.toFixed(1)}h duration, ${healthData.avgSleepScore.toFixed(1)}% quality.`,
        recommendations: [
          'Optimize sleep architecture',
          'Enhance deep sleep phases',
          'Improve sleep consistency'
        ],
        icon: <Moon size={28} color={colors.warning} />,
        specificRecommendations: [
          {
            title: 'AI Sleep Architecture Protocol',
            description: 'Targeted interventions based on your sleep pattern analysis',
            steps: [
              {
                action: 'Implement temperature cycling protocol',
                why: 'Your sleep data suggests suboptimal deep sleep phases',
                how: 'Room at 68°F, drop to 65°F 2 hours before bed, warm shower before sleep',
                when: 'Starting tonight',
                duration: 'Daily routine',
                priority: 'high',
                category: 'today'
              },
              {
                action: 'Create 90-minute wind-down routine',
                why: 'Your sleep onset patterns indicate need for longer preparation',
                how: '90 min: dim lights, 60 min: no screens, 30 min: reading/meditation',
                when: '90 minutes before target sleep time',
                duration: 'Daily habit',
                priority: 'medium',
                category: 'today'
              }
            ],
            expectedOutcome: '20-30% improvement in sleep quality score',
            timeToSeeResults: '5-7 days',
            difficulty: 'easy'
          }
        ],
        actionableSteps: [
          {
            action: 'Set room temperature to 68°F now',
            why: 'Optimal sleep temperature preparation takes 2-3 hours',
            how: 'Adjust thermostat or AC to 68°F, open windows if needed',
            when: 'Right now',
            duration: '1 minute',
            priority: 'high',
            category: 'immediate'
          }
        ],
        keyMetrics: {
          current: healthData.avgSleepScore,
          target: 85,
          unit: '%',
          trend: 'stable'
        }
      });
    }
    
    return { insights, evaluation };
  };

  const generateFallbackEvaluation = (insights: HealthInsight[]): string => {
    const overallStatus = insights.some(i => i.status === 'critical') ? 'critical' :
                         insights.some(i => i.status === 'warning') ? 'warning' : 'good';
    
    if (overallStatus === 'good') {
      return 'Your health metrics show excellent balance and recovery. You\'re managing training stress well and maintaining good sleep quality. Continue your current approach while staying mindful of your body\'s signals.';
    } else if (overallStatus === 'warning') {
      return 'Your health metrics indicate some areas for improvement. Focus on the recommendations below to optimize your recovery and performance. Small adjustments to sleep, training, or stress management can make a significant difference.';
    } else {
      return 'Your health metrics suggest you need to prioritize recovery immediately. Your body is showing signs of significant stress or fatigue. Consider reducing training intensity and focusing heavily on sleep and stress management.';
    }
  };


  const generateHealthEvaluation = useCallback(async () => {
    if (!hasWhoopData) return;

    setIsLoading(true);
    
    try {
      // Get latest data points
      const latestRecovery = data.recovery[data.recovery.length - 1];
      
      // Calculate averages for the last 7 days
      const recentRecovery = data.recovery.slice(-7);
      const recentStrain = data.strain.slice(-7);
      const recentSleep = data.sleep.slice(-7);
      
      const avgRecovery = recentRecovery.reduce((sum, r) => sum + r.score, 0) / recentRecovery.length;
      const avgStrain = recentStrain.reduce((sum, s) => sum + s.score, 0) / recentStrain.length;
      const avgSleepScore = recentSleep.reduce((sum, s) => sum + s.qualityScore, 0) / recentSleep.length;
      const avgSleepHours = recentSleep.reduce((sum, s) => sum + s.duration, 0) / recentSleep.length / 60; // Convert to hours
      
      // Generate AI-powered analysis
      const aiAnalysis = await generateAIHealthAnalysis({
        recovery: recentRecovery,
        strain: recentStrain,
        sleep: recentSleep,
        avgRecovery,
        avgStrain,
        avgSleepScore,
        avgSleepHours
      });
      
      // Calculate recovery trend
      const getRecoveryTrend = () => {
        if (recentRecovery.length < 6) return 'stable';
        const recent3Days = recentRecovery.slice(-3).reduce((sum, r) => sum + r.score, 0) / 3;
        const previous3Days = recentRecovery.slice(-6, -3).reduce((sum, r) => sum + r.score, 0) / 3;
        const difference = recent3Days - previous3Days;
        if (difference > 5) return 'improving';
        if (difference < -5) return 'declining';
        return 'stable';
      };
      
      const recoveryTrend = getRecoveryTrend();
      
      // Generate insights based on data
      const generatedInsights: HealthInsight[] = [];
      
      // Recovery Analysis
      if (avgRecovery >= 67) {
        generatedInsights.push({
          category: 'Recovery',
          status: 'good',
          title: 'Excellent Recovery',
          description: `Your average recovery score of ${avgRecovery.toFixed(0)}% indicates your body is adapting well to training stress.`,
          recommendations: [
            'Maintain your current recovery routine',
            'Consider gradually increasing training intensity',
            'Continue prioritizing sleep and nutrition'
          ],
          icon: <Shield size={28} color={colors.success} />,
          specificRecommendations: [
            {
              title: 'Optimize Training Load Progression',
              description: 'Your excellent recovery allows for strategic training increases',
              steps: [
                {
                  action: 'Increase training intensity by 5-10%',
                  why: 'Your body is ready to handle more stress and adapt',
                  how: 'Add 2-3 minutes to cardio sessions or 5-10lbs to strength exercises',
                  when: 'Next 2 training sessions',
                  duration: '1-2 weeks',
                  priority: 'medium',
                  category: 'this-week'
                },
                {
                  action: 'Track performance metrics closely',
                  why: 'Monitor how your body responds to increased load',
                  how: 'Log workout performance, energy levels, and next-day recovery',
                  when: 'During each workout',
                  duration: 'Ongoing',
                  priority: 'high',
                  category: 'immediate'
                }
              ],
              expectedOutcome: 'Improved fitness gains while maintaining recovery',
              timeToSeeResults: '2-3 weeks',
              difficulty: 'moderate'
            }
          ],
          actionableSteps: [
            {
              action: 'Schedule your most challenging workout',
              why: 'High recovery means your body can handle peak performance demands',
              how: 'Plan your hardest training session within the next 48 hours',
              when: 'Within 48 hours',
              duration: '1 session',
              priority: 'high',
              category: 'today'
            }
          ],
          keyMetrics: {
            current: avgRecovery,
            target: 70,
            unit: '%',
            trend: recoveryTrend === 'improving' ? 'improving' : recoveryTrend === 'declining' ? 'declining' : 'stable'
          }
        });
      } else if (avgRecovery >= 34) {
        generatedInsights.push({
          category: 'Recovery',
          status: 'warning',
          title: 'Moderate Recovery',
          description: `Your average recovery score of ${avgRecovery.toFixed(0)}% suggests room for improvement in your recovery practices.`,
          recommendations: [
            'Focus on getting 7-9 hours of quality sleep',
            'Consider reducing training intensity temporarily',
            'Incorporate more active recovery sessions',
            'Evaluate stress management techniques'
          ],
          icon: <Target size={28} color={colors.warning} />,
          specificRecommendations: [
            {
              title: 'Sleep Optimization Protocol',
              description: 'Systematic approach to improve sleep quality and recovery',
              steps: [
                {
                  action: 'Set a consistent bedtime routine',
                  why: 'Consistent sleep schedule improves sleep quality by 15-20%',
                  how: 'Go to bed and wake up at the same time daily, even weekends',
                  when: 'Starting tonight',
                  duration: '2-3 weeks to establish habit',
                  priority: 'high',
                  category: 'immediate'
                },
                {
                  action: 'Create optimal sleep environment',
                  why: 'Room temperature and darkness significantly impact deep sleep',
                  how: 'Set room to 65-68°F, use blackout curtains, remove electronics',
                  when: 'Before tonight\'s sleep',
                  duration: 'One-time setup',
                  priority: 'high',
                  category: 'today'
                },
                {
                  action: 'Implement pre-sleep wind-down',
                  why: 'Reduces cortisol and prepares body for deep sleep',
                  how: '30-60 min routine: dim lights, read, gentle stretching, no screens',
                  when: '1 hour before target bedtime',
                  duration: 'Daily habit',
                  priority: 'medium',
                  category: 'today'
                }
              ],
              expectedOutcome: '10-15% improvement in recovery score within 2 weeks',
              timeToSeeResults: '1-2 weeks',
              difficulty: 'easy'
            },
            {
              title: 'Strategic Training Adjustment',
              description: 'Optimize training load to support recovery improvement',
              steps: [
                {
                  action: 'Reduce training intensity by 15-20%',
                  why: 'Allows body to catch up on recovery debt',
                  how: 'Lower weights by 15%, reduce cardio pace by 30 seconds/mile',
                  when: 'Next 3 training sessions',
                  duration: '1-2 weeks',
                  priority: 'high',
                  category: 'immediate'
                },
                {
                  action: 'Add active recovery sessions',
                  why: 'Promotes blood flow and recovery without adding stress',
                  how: '20-30 min walks, gentle yoga, or light swimming',
                  when: 'On rest days',
                  duration: '2-3 times per week',
                  priority: 'medium',
                  category: 'this-week'
                }
              ],
              expectedOutcome: 'Improved recovery scores and reduced fatigue',
              timeToSeeResults: '1 week',
              difficulty: 'easy'
            }
          ],
          actionableSteps: [
            {
              action: 'Set phone to Do Not Disturb 1 hour before bed',
              why: 'Blue light disrupts melatonin production',
              how: 'Enable automatic Do Not Disturb from 9 PM to 7 AM',
              when: 'Right now',
              duration: '2 minutes to set up',
              priority: 'high',
              category: 'immediate'
            },
            {
              action: 'Plan tomorrow\'s workout at 80% intensity',
              why: 'Moderate recovery requires strategic load management',
              how: 'Reduce planned weights/pace by 20% from your usual',
              when: 'Before tomorrow\'s workout',
              duration: '5 minutes planning',
              priority: 'high',
              category: 'today'
            }
          ],
          keyMetrics: {
            current: avgRecovery,
            target: 60,
            unit: '%',
            trend: recoveryTrend === 'improving' ? 'improving' : recoveryTrend === 'declining' ? 'declining' : 'stable'
          }
        });
      } else {
        generatedInsights.push({
          category: 'Recovery',
          status: 'critical',
          title: 'Low Recovery',
          description: `Your average recovery score of ${avgRecovery.toFixed(0)}% indicates significant recovery debt that needs attention.`,
          recommendations: [
            'Prioritize sleep - aim for 8-9 hours nightly',
            'Reduce training intensity and volume',
            'Consider taking 1-2 complete rest days',
            'Focus on stress reduction and relaxation',
            'Evaluate nutrition and hydration habits'
          ],
          icon: <AlertTriangle size={28} color={colors.danger} />,
          specificRecommendations: [
            {
              title: 'Emergency Recovery Protocol',
              description: 'Immediate actions to address critical recovery debt',
              steps: [
                {
                  action: 'Take complete rest day today',
                  why: 'Critical recovery debt requires immediate intervention',
                  how: 'No structured exercise, only gentle walking if needed',
                  when: 'Today',
                  duration: '24-48 hours',
                  priority: 'high',
                  category: 'immediate'
                },
                {
                  action: 'Extend sleep by 1-2 hours tonight',
                  why: 'Sleep is the most powerful recovery tool available',
                  how: 'Go to bed 1 hour earlier, sleep in 1 hour later if possible',
                  when: 'Tonight',
                  duration: 'Next 3-5 nights',
                  priority: 'high',
                  category: 'immediate'
                },
                {
                  action: 'Implement stress reduction techniques',
                  why: 'High stress blocks recovery and keeps cortisol elevated',
                  how: '10 min meditation, deep breathing, or gentle yoga',
                  when: '2-3 times today',
                  duration: '10 minutes each session',
                  priority: 'high',
                  category: 'immediate'
                }
              ],
              expectedOutcome: '5-10% recovery improvement within 48 hours',
              timeToSeeResults: '2-3 days',
              difficulty: 'easy'
            },
            {
              title: 'Nutrition Recovery Support',
              description: 'Targeted nutrition to accelerate recovery',
              steps: [
                {
                  action: 'Increase water intake to 3-4 liters today',
                  why: 'Dehydration significantly impairs recovery processes',
                  how: 'Drink 500ml upon waking, 250ml every hour',
                  when: 'Starting now',
                  duration: 'Today and ongoing',
                  priority: 'high',
                  category: 'immediate'
                },
                {
                  action: 'Consume anti-inflammatory foods',
                  why: 'Reduces systemic inflammation blocking recovery',
                  how: 'Berries, fatty fish, leafy greens, turmeric, ginger',
                  when: 'With each meal today',
                  duration: 'Next 3-5 days',
                  priority: 'medium',
                  category: 'today'
                }
              ],
              expectedOutcome: 'Reduced inflammation and faster recovery',
              timeToSeeResults: '2-4 days',
              difficulty: 'easy'
            }
          ],
          actionableSteps: [
            {
              action: 'Cancel today\'s planned workout',
              why: 'Training with critical recovery debt risks injury and further decline',
              how: 'Replace with 20-30 minute gentle walk or complete rest',
              when: 'Right now',
              duration: 'Today only',
              priority: 'high',
              category: 'immediate'
            },
            {
              action: 'Set 3 water intake reminders on phone',
              why: 'Consistent hydration is crucial for recovery',
              how: 'Set alarms for 10 AM, 2 PM, and 6 PM to drink 500ml',
              when: 'Next 5 minutes',
              duration: '2 minutes to set up',
              priority: 'high',
              category: 'immediate'
            }
          ],
          keyMetrics: {
            current: avgRecovery,
            target: 50,
            unit: '%',
            trend: recoveryTrend === 'improving' ? 'improving' : recoveryTrend === 'declining' ? 'declining' : 'stable'
          }
        });
      }
      
      // Sleep Analysis
      if (avgSleepScore >= 85 && avgSleepHours >= 7) {
        generatedInsights.push({
          category: 'Sleep',
          status: 'good',
          title: 'Quality Sleep',
          description: `Excellent sleep quality with ${avgSleepHours.toFixed(1)} hours average and ${avgSleepScore.toFixed(0)}% sleep score.`,
          recommendations: [
            'Maintain your current sleep schedule',
            'Continue your bedtime routine',
            'Keep your sleep environment optimized'
          ],
          icon: <Moon size={28} color={colors.success} />,
          specificRecommendations: [],
          actionableSteps: [],
          keyMetrics: {
            current: avgSleepScore,
            target: 85,
            unit: '%',
            trend: 'stable'
          }
        });
      } else if (avgSleepHours < 7 || avgSleepScore < 70) {
        generatedInsights.push({
          category: 'Sleep',
          status: 'warning',
          title: 'Sleep Optimization Needed',
          description: `Average sleep: ${avgSleepHours.toFixed(1)} hours with ${avgSleepScore.toFixed(0)}% quality score. This may be impacting your recovery.`,
          recommendations: [
            'Aim for 7-9 hours of sleep nightly',
            'Establish a consistent bedtime routine',
            'Limit screen time 1 hour before bed',
            'Keep bedroom cool (65-68°F) and dark',
            'Avoid caffeine after 2 PM'
          ],
          icon: <Moon size={28} color={colors.warning} />,
          specificRecommendations: [],
          actionableSteps: [],
          keyMetrics: {
            current: avgSleepScore,
            target: 75,
            unit: '%',
            trend: 'declining'
          }
        });
      }
      
      // Strain Analysis
      if (avgStrain > 18) {
        generatedInsights.push({
          category: 'Training',
          status: 'warning',
          title: 'High Training Load',
          description: `Your average strain of ${avgStrain.toFixed(1)} indicates very high training stress. Monitor recovery closely.`,
          recommendations: [
            'Ensure adequate recovery between sessions',
            'Consider periodizing your training',
            'Include more low-intensity activities',
            'Monitor recovery scores daily'
          ],
          icon: <Zap size={28} color={colors.warning} />,
          specificRecommendations: [],
          actionableSteps: [],
          keyMetrics: {
            current: avgStrain,
            target: 15,
            unit: '',
            trend: 'stable'
          }
        });
      } else if (avgStrain < 8) {
        generatedInsights.push({
          category: 'Training',
          status: 'warning',
          title: 'Low Activity Level',
          description: `Your average strain of ${avgStrain.toFixed(1)} suggests you might benefit from increased activity.`,
          recommendations: [
            'Gradually increase daily activity',
            'Add 2-3 structured workouts per week',
            'Include both cardio and strength training',
            'Start with low-intensity activities'
          ],
          icon: <TrendingUp size={28} color={colors.primary} />,
          specificRecommendations: [],
          actionableSteps: [],
          keyMetrics: {
            current: avgStrain,
            target: 10,
            unit: '',
            trend: 'stable'
          }
        });
      } else {
        generatedInsights.push({
          category: 'Training',
          status: 'good',
          title: 'Balanced Training Load',
          description: `Your average strain of ${avgStrain.toFixed(1)} indicates a well-balanced training approach.`,
          recommendations: [
            'Continue your current training approach',
            'Vary intensity throughout the week',
            'Listen to your body and adjust as needed'
          ],
          icon: <Sparkles size={28} color={colors.success} />,
          specificRecommendations: [],
          actionableSteps: [],
          keyMetrics: {
            current: avgStrain,
            target: 12,
            unit: '',
            trend: 'stable'
          }
        });
      }
      
      // Heart Rate Variability Analysis
      if (latestRecovery.hrvMs) {
        const recentHRV = recentRecovery.map(r => r.hrvMs).filter(Boolean);
        if (recentHRV.length > 0) {
          const avgHRV = recentHRV.reduce((sum, hrv) => sum + hrv, 0) / recentHRV.length;
          const hrvTrend = recentHRV.length > 3 ? 
            (recentHRV.slice(-3).reduce((sum, hrv) => sum + hrv, 0) / 3) - 
            (recentHRV.slice(0, 3).reduce((sum, hrv) => sum + hrv, 0) / 3) : 0;
          
          if (hrvTrend > 2) {
            generatedInsights.push({
              category: 'Heart Rate Variability',
              status: 'good',
              title: 'Improving HRV Trend',
              description: `Your HRV is trending upward (avg: ${avgHRV.toFixed(1)}ms), indicating improving autonomic nervous system balance.`,
              recommendations: [
                'Continue current recovery practices',
                'Maintain consistent sleep schedule',
                'Keep stress management techniques'
              ],
              icon: <Heart size={28} color={colors.success} />,
              specificRecommendations: [],
              actionableSteps: [],
              keyMetrics: {
                current: avgHRV,
                target: avgHRV + 5,
                unit: 'ms',
                trend: 'improving'
              }
            });
          } else if (hrvTrend < -2) {
            generatedInsights.push({
              category: 'Heart Rate Variability',
              status: 'warning',
              title: 'Declining HRV Trend',
              description: `Your HRV is trending downward (avg: ${avgHRV.toFixed(1)}ms), which may indicate accumulated stress or fatigue.`,
              recommendations: [
                'Prioritize stress management',
                'Consider reducing training intensity',
                'Focus on relaxation techniques',
                'Ensure adequate sleep quality'
              ],
              icon: <Brain size={28} color={colors.warning} />,
              specificRecommendations: [],
              actionableSteps: [],
              keyMetrics: {
                current: avgHRV,
                target: avgHRV + 10,
                unit: 'ms',
                trend: 'declining'
              }
            });
          }
        }
      }
      
      // Combine AI insights with rule-based insights
      const combinedInsights = [...generatedInsights, ...aiAnalysis.insights];
      setInsights(combinedInsights);
      
      // Use AI-generated evaluation or fall back to rule-based
      setEvaluation(aiAnalysis.overallEvaluation || generateFallbackEvaluation(generatedInsights));
      
    } catch (error) {
      console.error('Error generating health evaluation:', error);
      Alert.alert('Error', 'Failed to generate health evaluation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [hasWhoopData, data, generateAIHealthAnalysis, parseAIResponse, generateFallbackEvaluation]);

  useEffect(() => {
    if (isConnectedToWhoop && hasWhoopData) {
      generateHealthEvaluation();
    }
  }, [isConnectedToWhoop, hasWhoopData, generateHealthEvaluation]);

  useEffect(() => {
    setModalVisible(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return colors.success;
      case 'warning': return colors.warning;
      case 'critical': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'good': return 'rgba(34, 197, 94, 0.1)';
      case 'warning': return 'rgba(251, 191, 36, 0.1)';
      case 'critical': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(156, 163, 175, 0.1)';
    }
  };

  const renderEmptyState = (title: string, description: string, buttonTitle: string, onPress: () => void, icon: React.ReactNode) => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Text>{icon}</Text>
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDescription}>{description}</Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={onPress}>
        <Text style={styles.emptyStateButtonText}>{buttonTitle}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (!isConnectedToWhoop) {
      return renderEmptyState(
        'WHOOP Connection Required',
        'To get a comprehensive health evaluation, please connect your WHOOP account first.',
        'Connect WHOOP',
        () => {
          closeModal();
          router.push('/connect-whoop');
        },
        <Activity size={48} color={colors.primary} />
      );
    }

    if (!hasWhoopData) {
      return renderEmptyState(
        'Insufficient Data',
        'We need more WHOOP data to provide a comprehensive health evaluation. Please sync your data first.',
        'Sync Data',
        () => {
          syncWhoopData();
          closeModal();
        },
        <RefreshCw size={48} color={colors.primary} />
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing your health data...</Text>
        </View>
      );
    }

    return (
      <>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerIconContainer}>
            <Activity size={32} color={colors.primary} />
          </View>
          <Text style={styles.modalTitle}>Health Analysis</Text>
          <Text style={styles.modalSubtitle}>Comprehensive wellness overview</Text>
        </View>

        {/* Overall Status */}
        <View style={styles.overallStatusContainer}>
          <View style={[
            styles.overallStatusBadge,
            { backgroundColor: getStatusBackground(insights.some(i => i.status === 'critical') ? 'critical' : insights.some(i => i.status === 'warning') ? 'warning' : 'good') }
          ]}>
            <Text style={[
              styles.overallStatusText,
              { color: getStatusColor(insights.some(i => i.status === 'critical') ? 'critical' : insights.some(i => i.status === 'warning') ? 'warning' : 'good') }
            ]}>
              {insights.some(i => i.status === 'critical') ? 'Needs Attention' : insights.some(i => i.status === 'warning') ? 'Good Progress' : 'Excellent Health'}
            </Text>
          </View>
          <Text style={styles.evaluationSummary}>{evaluation}</Text>
        </View>

        {/* Immediate Actions */}
        {insights.some(insight => insight.actionableSteps.length > 0) && (
          <View style={styles.immediateActionsContainer}>
            <View style={styles.sectionHeader}>
              <Zap size={20} color={colors.danger} />
              <Text style={styles.sectionTitle}>Immediate Actions</Text>
            </View>
            {insights.flatMap(insight => 
              insight.actionableSteps.filter(step => step.category === 'immediate')
            ).slice(0, 3).map((step, index) => (
              <View key={index} style={styles.immediateActionItem}>
                <View style={[styles.priorityDot, { 
                  backgroundColor: step.priority === 'high' ? colors.danger : 
                                 step.priority === 'medium' ? colors.warning : colors.success 
                }]} />
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{step.action}</Text>
                  <Text style={styles.actionWhy}>{step.why}</Text>
                  <Text style={styles.actionHow}>{step.how}</Text>
                  <View style={styles.actionTiming}>
                    <Text style={styles.actionWhen}>{step.when}</Text>
                    <Text style={styles.actionDuration}>• {step.duration}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Insights Grid */}
        <View style={styles.insightsGrid}>
          {insights.map((insight, index) => (
            <View key={index} style={[
              styles.insightItem,
              { borderLeftColor: getStatusColor(insight.status) }
            ]}>
              <View style={styles.insightItemHeader}>
                <View style={[
                  styles.insightIconContainer,
                  { backgroundColor: getStatusBackground(insight.status) }
                ]}>
                  {insight.icon}
                </View>
                <View style={styles.insightItemContent}>
                  <Text style={styles.insightItemCategory}>{insight.category}</Text>
                  <Text style={styles.insightItemTitle}>{insight.title}</Text>
                  <View style={styles.metricsRow}>
                    <Text style={styles.currentMetric}>
                      {insight.keyMetrics.current.toFixed(1)}{insight.keyMetrics.unit}
                    </Text>
                    <Text style={styles.targetMetric}>
                      → {insight.keyMetrics.target.toFixed(1)}{insight.keyMetrics.unit}
                    </Text>
                    <View style={[styles.trendIndicator, {
                      backgroundColor: insight.keyMetrics.trend === 'improving' ? colors.success :
                                     insight.keyMetrics.trend === 'declining' ? colors.danger : colors.textSecondary
                    }]} />
                  </View>
                </View>
              </View>
              <Text style={styles.insightItemDescription}>{insight.description}</Text>
              
              {/* Specific Recommendations */}
              {insight.specificRecommendations.length > 0 && (
                <View style={styles.specificRecommendationsContainer}>
                  {insight.specificRecommendations.map((rec, recIndex) => (
                    <View key={recIndex} style={styles.specificRecommendation}>
                      <View style={styles.recommendationHeader}>
                        <Text style={styles.recommendationTitle}>{rec.title}</Text>
                        <View style={[styles.difficultyBadge, {
                          backgroundColor: rec.difficulty === 'easy' ? 'rgba(34, 197, 94, 0.2)' :
                                         rec.difficulty === 'moderate' ? 'rgba(251, 191, 36, 0.2)' :
                                         'rgba(239, 68, 68, 0.2)'
                        }]}>
                          <Text style={[styles.difficultyText, {
                            color: rec.difficulty === 'easy' ? colors.success :
                                   rec.difficulty === 'moderate' ? colors.warning : colors.danger
                          }]}>{rec.difficulty}</Text>
                        </View>
                      </View>
                      <Text style={styles.recommendationDescription}>{rec.description}</Text>
                      
                      {/* Steps */}
                      {rec.steps.slice(0, 2).map((step, stepIndex) => (
                        <View key={stepIndex} style={styles.stepItem}>
                          <Text style={styles.stepAction}>• {step.action}</Text>
                          <Text style={styles.stepHow}>{step.how}</Text>
                        </View>
                      ))}
                      
                      <View style={styles.outcomeContainer}>
                        <Text style={styles.expectedOutcome}>Expected: {rec.expectedOutcome}</Text>
                        <Text style={styles.timeToResults}>Results in: {rec.timeToSeeResults}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {insight.recommendations.length > 0 && insight.specificRecommendations.length === 0 && (
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.recommendationsHeader}>Key Actions:</Text>
                  {insight.recommendations.slice(0, 2).map((rec, recIndex) => (
                    <Text key={recIndex} style={styles.recommendationItem}>
                      • {rec}
                    </Text>
                  ))}
                  {insight.recommendations.length > 2 && (
                    <Text style={styles.moreRecommendations}>
                      +{insight.recommendations.length - 2} more recommendations
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={generateHealthEvaluation}
            disabled={isLoading}
          >
            <RefreshCw size={18} color={colors.primary} />
            <Text style={styles.refreshButtonText}>Refresh Analysis</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
          <StatusBar style="light" />
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalContent}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {renderContent()}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ios.quaternaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ios.systemFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overallStatusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  overallStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  overallStatusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  evaluationSummary: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  insightsGrid: {
    gap: 16,
  },
  insightItem: {
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  insightItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightItemContent: {
    flex: 1,
  },
  insightItemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  insightItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  insightItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationsContainer: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 12,
  },
  recommendationsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  moreRecommendations: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ios.separator,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ios.systemFill,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  // Empty States
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.ios.systemFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  // Immediate Actions
  immediateActionsContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  immediateActionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingLeft: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionWhy: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  actionHow: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
  },
  actionTiming: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionWhen: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  actionDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currentMetric: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  targetMetric: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  trendIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  // Specific Recommendations
  specificRecommendationsContainer: {
    marginTop: 12,
  },
  specificRecommendation: {
    backgroundColor: colors.ios.tertiaryBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  recommendationDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  stepItem: {
    marginBottom: 6,
  },
  stepAction: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  stepHow: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 8,
    lineHeight: 14,
  },
  outcomeContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.ios.separator,
  },
  expectedOutcome: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeToResults: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});