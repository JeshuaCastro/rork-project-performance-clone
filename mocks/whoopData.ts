import { WhoopData } from '@/types/whoop';

// Generate dates for the last 7 days including today
const getDates = (count: number) => {
  const dates = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates.reverse();
};

const dates = getDates(7);
const today = dates[dates.length - 1]; // Today's date

export const mockWhoopData: WhoopData = {
  recovery: dates.map((date, index) => {
    const score = Math.floor(40 + Math.random() * 60);
    let status: 'low' | 'medium' | 'high';
    
    if (score < 50) status = 'low';
    else if (score < 75) status = 'medium';
    else status = 'high';
    
    return {
      id: `recovery-${index}`,
      date,
      score,
      hrvMs: Math.floor(40 + Math.random() * 60),
      restingHeartRate: Math.floor(50 + Math.random() * 15),
      status,
    };
  }),
  
  strain: dates.map((date, index) => {
    return {
      id: `strain-${index}`,
      date,
      score: Math.floor(5 + Math.random() * 15),
      averageHeartRate: Math.floor(70 + Math.random() * 30),
      maxHeartRate: Math.floor(140 + Math.random() * 40),
      calories: Math.floor(1500 + Math.random() * 1000)
    };
  }),
  
  sleep: dates.map((date, index) => {
    return {
      id: `sleep-${index}`,
      date,
      efficiency: Math.floor(75 + Math.random() * 20),
      duration: Math.floor(6.5 + Math.random() * 2) * 60, // in minutes
      disturbances: Math.floor(Math.random() * 5),
      qualityScore: Math.floor(70 + Math.random() * 25)
    };
  }),
};

export const mockAIAnalysis = {
  recoveryInsight: "Your recovery has been trending upward over the past week, indicating your body is adapting well to your training load. Your HRV has increased by 8% and resting heart rate has decreased by 3 bpm.",
  
  trainingRecommendation: "Based on your high recovery score today (87%), you're primed for a high-intensity workout. Consider a threshold run or HIIT session to maximize your fitness gains while your body is in an optimal state.",
  
  longTermTrend: "Over the past month, your fitness markers show steady improvement. Your resting heart rate has decreased from 62 to 58 bpm, and your recovery consistency has improved by 15%, suggesting better overall cardiovascular health."
};