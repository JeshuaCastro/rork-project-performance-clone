import { ExerciseDefinition } from '@/types/exercises';

export const exerciseDatabase: ExerciseDefinition[] = [
  // STRENGTH EXERCISES
  {
    id: 'push-up',
    name: 'Push-Up',
    description: 'A fundamental upper body exercise that builds chest, shoulder, and tricep strength while engaging the core.',
    primaryMuscles: ['chest', 'shoulders', 'triceps'],
    secondaryMuscles: ['core'],
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Start in a plank position with hands slightly wider than shoulder-width apart.',
        tip: 'Keep your body in a straight line from head to heels.',
        commonMistake: 'Letting hips sag or pike up'
      },
      {
        stepNumber: 2,
        instruction: 'Lower your chest toward the ground by bending your elbows.',
        tip: 'Keep elbows at about 45-degree angle from your body.',
        commonMistake: 'Flaring elbows too wide'
      },
      {
        stepNumber: 3,
        instruction: 'Push back up to starting position.',
        tip: 'Exhale as you push up, maintain straight body line.',
        commonMistake: 'Not going through full range of motion'
      }
    ],
    formTips: [
      'Keep your core tight throughout the movement',
      'Look slightly ahead, not straight down',
      'Control both the lowering and pushing phases',
      'Keep your body rigid like a plank'
    ],
    commonMistakes: [
      'Letting hips sag or rise too high',
      'Not going low enough',
      'Flaring elbows too wide',
      'Holding breath during the movement'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Knee Push-Up',
        instruction: 'Perform the push-up from your knees instead of toes, maintaining straight line from knees to head.'
      },
      {
        level: 'easier',
        description: 'Incline Push-Up',
        instruction: 'Place hands on an elevated surface like a bench or step to reduce the load.'
      },
      {
        level: 'harder',
        description: 'Diamond Push-Up',
        instruction: 'Form a diamond shape with your hands to target triceps more intensely.'
      },
      {
        level: 'harder',
        description: 'Single-Arm Push-Up',
        instruction: 'Perform push-ups with one arm behind your back for advanced practitioners.'
      }
    ],
    safetyNotes: [
      'Stop if you feel pain in wrists, shoulders, or lower back',
      'Start with easier modifications if you cannot maintain proper form',
      'Warm up shoulders and wrists before performing'
    ],
    estimatedDuration: '30 seconds',
    caloriesPerMinute: 7
  },
  {
    id: 'squat',
    name: 'Bodyweight Squat',
    description: 'A fundamental lower body exercise that targets the quadriceps, glutes, and hamstrings while improving mobility.',
    primaryMuscles: ['legs', 'glutes'],
    secondaryMuscles: ['core'],
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Stand with feet shoulder-width apart, toes slightly turned out.',
        tip: 'Keep your chest up and core engaged.',
        commonMistake: 'Standing with feet too narrow or too wide'
      },
      {
        stepNumber: 2,
        instruction: 'Lower your body by pushing your hips back and bending your knees.',
        tip: 'Imagine sitting back into a chair.',
        commonMistake: 'Knees caving inward'
      },
      {
        stepNumber: 3,
        instruction: 'Descend until your thighs are parallel to the ground.',
        tip: 'Keep your weight on your heels and mid-foot.',
        commonMistake: 'Not going deep enough or going too deep'
      },
      {
        stepNumber: 4,
        instruction: 'Drive through your heels to return to starting position.',
        tip: 'Squeeze your glutes at the top.',
        commonMistake: 'Coming up on toes instead of driving through heels'
      }
    ],
    formTips: [
      'Keep your knees tracking over your toes',
      'Maintain a neutral spine throughout',
      'Keep your chest up and shoulders back',
      'Distribute weight evenly across your feet'
    ],
    commonMistakes: [
      'Knees caving inward (valgus collapse)',
      'Leaning too far forward',
      'Not going deep enough',
      'Rising up on toes'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Chair-Assisted Squat',
        instruction: 'Use a chair behind you for support and guidance on depth.'
      },
      {
        level: 'easier',
        description: 'Partial Range Squat',
        instruction: 'Only squat down as far as comfortable while maintaining good form.'
      },
      {
        level: 'harder',
        description: 'Jump Squat',
        instruction: 'Add an explosive jump at the top of each squat.'
      },
      {
        level: 'harder',
        description: 'Single-Leg Squat (Pistol)',
        instruction: 'Perform squats on one leg for advanced practitioners.'
      }
    ],
    safetyNotes: [
      'Stop if you feel knee or back pain',
      'Start with partial range if you have mobility limitations',
      'Focus on form over depth initially'
    ],
    estimatedDuration: '45 seconds',
    caloriesPerMinute: 8
  },
  {
    id: 'plank',
    name: 'Plank',
    description: 'An isometric core exercise that builds stability and strength throughout the entire core and shoulders.',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders', 'back'],
    difficulty: 'beginner',
    equipment: ['yoga-mat'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Start in a push-up position with forearms on the ground.',
        tip: 'Elbows should be directly under your shoulders.',
        commonMistake: 'Placing elbows too far forward or back'
      },
      {
        stepNumber: 2,
        instruction: 'Keep your body in a straight line from head to heels.',
        tip: 'Engage your core and squeeze your glutes.',
        commonMistake: 'Letting hips sag or pike up'
      },
      {
        stepNumber: 3,
        instruction: 'Hold this position while breathing normally.',
        tip: 'Focus on keeping everything tight and aligned.',
        commonMistake: 'Holding breath or losing tension'
      }
    ],
    formTips: [
      'Keep your neck in neutral position',
      'Breathe steadily throughout the hold',
      'Engage your entire core, not just abs',
      'Keep your legs straight and strong'
    ],
    commonMistakes: [
      'Sagging hips',
      'Piking hips too high',
      'Holding breath',
      'Looking up instead of down'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Knee Plank',
        instruction: 'Perform the plank from your knees instead of toes.'
      },
      {
        level: 'easier',
        description: 'Incline Plank',
        instruction: 'Place forearms on an elevated surface to reduce difficulty.'
      },
      {
        level: 'harder',
        description: 'Single-Arm Plank',
        instruction: 'Lift one arm off the ground while maintaining plank position.'
      },
      {
        level: 'harder',
        description: 'Plank with Leg Lift',
        instruction: 'Lift one leg off the ground while holding plank position.'
      }
    ],
    safetyNotes: [
      'Stop if you feel lower back pain',
      'Start with shorter holds and build up gradually',
      'Focus on quality over duration'
    ],
    estimatedDuration: '30-60 seconds',
    caloriesPerMinute: 5
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    description: 'A pulling exercise that targets the back muscles, particularly the lats and rhomboids, while engaging the biceps.',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'shoulders'],
    difficulty: 'beginner',
    equipment: ['dumbbells', 'bench'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Place one knee and hand on a bench, other foot on the floor.',
        tip: 'Keep your back flat and parallel to the ground.',
        commonMistake: 'Rounding the back'
      },
      {
        stepNumber: 2,
        instruction: 'Hold a dumbbell in your free hand, arm extended toward the floor.',
        tip: 'Let the weight stretch your lat muscle.',
        commonMistake: 'Starting with arm already bent'
      },
      {
        stepNumber: 3,
        instruction: 'Pull the dumbbell up to your ribcage, leading with your elbow.',
        tip: 'Squeeze your shoulder blade toward your spine.',
        commonMistake: 'Using too much arm instead of back'
      },
      {
        stepNumber: 4,
        instruction: 'Lower the weight back to starting position with control.',
        tip: 'Feel the stretch in your back muscles.',
        commonMistake: 'Dropping the weight too quickly'
      }
    ],
    formTips: [
      'Keep your core engaged throughout',
      'Pull with your back muscles, not just your arm',
      'Keep your shoulder blade pulled back',
      'Maintain a neutral spine'
    ],
    commonMistakes: [
      'Using momentum instead of muscle control',
      'Rotating the torso during the movement',
      'Not pulling high enough',
      'Using too heavy weight initially'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Resistance Band Row',
        instruction: 'Use a resistance band instead of dumbbells for lighter resistance.'
      },
      {
        level: 'easier',
        description: 'Two-Arm Bent-Over Row',
        instruction: 'Use both arms simultaneously with lighter weights for stability.'
      },
      {
        level: 'harder',
        description: 'Single-Arm Row without Support',
        instruction: 'Perform the row in a bent-over position without bench support.'
      }
    ],
    safetyNotes: [
      'Start with lighter weights to master the form',
      'Stop if you feel lower back pain',
      'Keep your core engaged to protect your spine'
    ],
    estimatedDuration: '45 seconds',
    caloriesPerMinute: 6
  },
  {
    id: 'lunge',
    name: 'Forward Lunge',
    description: 'A unilateral leg exercise that improves balance, coordination, and strength in the legs and glutes.',
    primaryMuscles: ['legs', 'glutes'],
    secondaryMuscles: ['core'],
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Stand tall with feet hip-width apart.',
        tip: 'Keep your core engaged and chest up.',
        commonMistake: 'Starting with poor posture'
      },
      {
        stepNumber: 2,
        instruction: 'Step forward with one leg, lowering your hips.',
        tip: 'Take a large enough step to allow proper form.',
        commonMistake: 'Taking too small or too large a step'
      },
      {
        stepNumber: 3,
        instruction: 'Lower until both knees are at 90-degree angles.',
        tip: 'Keep your front knee over your ankle.',
        commonMistake: 'Letting front knee drift over toes'
      },
      {
        stepNumber: 4,
        instruction: 'Push back to starting position.',
        tip: 'Drive through your front heel to return.',
        commonMistake: 'Pushing off the back foot instead'
      }
    ],
    formTips: [
      'Keep most of your weight on your front leg',
      'Maintain an upright torso throughout',
      'Control the descent and ascent',
      'Keep your core engaged for stability'
    ],
    commonMistakes: [
      'Leaning too far forward',
      'Letting the front knee cave inward',
      'Not going deep enough',
      'Using the back leg to push off'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Stationary Lunge',
        instruction: 'Stay in lunge position and just go up and down without stepping.'
      },
      {
        level: 'easier',
        description: 'Assisted Lunge',
        instruction: 'Hold onto a wall or chair for balance support.'
      },
      {
        level: 'harder',
        description: 'Reverse Lunge',
        instruction: 'Step backward instead of forward for increased difficulty.'
      },
      {
        level: 'harder',
        description: 'Jump Lunge',
        instruction: 'Add an explosive jump to switch legs in mid-air.'
      }
    ],
    safetyNotes: [
      'Start with bodyweight before adding resistance',
      'Focus on balance and control',
      'Stop if you feel knee pain'
    ],
    estimatedDuration: '60 seconds',
    caloriesPerMinute: 8
  },
  // CARDIO EXERCISES
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    description: 'A full-body cardiovascular exercise that increases heart rate while improving coordination.',
    primaryMuscles: ['cardio', 'full-body'],
    secondaryMuscles: ['legs', 'shoulders'],
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Stand with feet together and arms at your sides.',
        tip: 'Keep your core engaged and posture upright.',
        commonMistake: 'Starting with poor posture'
      },
      {
        stepNumber: 2,
        instruction: 'Jump while spreading your legs shoulder-width apart.',
        tip: 'Land softly on the balls of your feet.',
        commonMistake: 'Landing hard on heels'
      },
      {
        stepNumber: 3,
        instruction: 'Simultaneously raise your arms overhead.',
        tip: 'Keep arms straight but not locked.',
        commonMistake: 'Bending arms too much'
      },
      {
        stepNumber: 4,
        instruction: 'Jump back to starting position.',
        tip: 'Maintain rhythm and control.',
        commonMistake: 'Going too fast and losing form'
      }
    ],
    formTips: [
      'Land softly to protect your joints',
      'Keep your core engaged throughout',
      'Maintain a steady rhythm',
      'Breathe regularly during the exercise'
    ],
    commonMistakes: [
      'Landing too hard',
      'Going too fast and losing control',
      'Not fully extending arms overhead',
      'Holding breath'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Step Touch',
        instruction: 'Step side to side while raising arms instead of jumping.'
      },
      {
        level: 'easier',
        description: 'Half Jacks',
        instruction: 'Only raise arms to shoulder height instead of overhead.'
      },
      {
        level: 'harder',
        description: 'Star Jumps',
        instruction: 'Jump higher and spread arms and legs wider for more intensity.'
      }
    ],
    safetyNotes: [
      'Land softly to protect knees and ankles',
      'Start slowly and build up speed',
      'Stop if you feel joint pain'
    ],
    estimatedDuration: '30 seconds',
    caloriesPerMinute: 10
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    description: 'A dynamic exercise that combines cardio with core strengthening, mimicking a climbing motion.',
    primaryMuscles: ['cardio', 'core'],
    secondaryMuscles: ['shoulders', 'legs'],
    difficulty: 'intermediate',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Start in a plank position with hands under shoulders.',
        tip: 'Keep your body in a straight line.',
        commonMistake: 'Starting with hips too high or low'
      },
      {
        stepNumber: 2,
        instruction: 'Bring one knee toward your chest.',
        tip: 'Keep your core tight and hips level.',
        commonMistake: 'Letting hips bounce up and down'
      },
      {
        stepNumber: 3,
        instruction: 'Quickly switch legs, extending one back while bringing the other forward.',
        tip: 'Maintain plank position throughout.',
        commonMistake: 'Losing plank form during the movement'
      },
      {
        stepNumber: 4,
        instruction: 'Continue alternating legs in a running motion.',
        tip: 'Keep the movement controlled and rhythmic.',
        commonMistake: 'Going too fast and losing form'
      }
    ],
    formTips: [
      'Keep your hands firmly planted',
      'Maintain straight line from head to heels',
      'Keep your core engaged throughout',
      'Land softly on the balls of your feet'
    ],
    commonMistakes: [
      'Bouncing hips up and down',
      'Placing hands too far forward',
      'Going too fast and losing control',
      'Not bringing knees close enough to chest'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Slow Mountain Climbers',
        instruction: 'Perform the movement slowly with more control.'
      },
      {
        level: 'easier',
        description: 'Incline Mountain Climbers',
        instruction: 'Place hands on an elevated surface to reduce difficulty.'
      },
      {
        level: 'harder',
        description: 'Cross-Body Mountain Climbers',
        instruction: 'Bring knee toward opposite elbow for added core challenge.'
      }
    ],
    safetyNotes: [
      'Start slowly to master the form',
      'Stop if you feel wrist or shoulder pain',
      'Keep movements controlled to avoid injury'
    ],
    estimatedDuration: '30 seconds',
    caloriesPerMinute: 12
  },
  {
    id: 'burpee',
    name: 'Burpee',
    description: 'A full-body exercise that combines a squat, plank, push-up, and jump for maximum cardiovascular benefit.',
    primaryMuscles: ['full-body', 'cardio'],
    secondaryMuscles: ['chest', 'legs', 'core'],
    difficulty: 'intermediate',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Start standing with feet shoulder-width apart.',
        tip: 'Keep your core engaged and ready to move.',
        commonMistake: 'Starting with poor posture'
      },
      {
        stepNumber: 2,
        instruction: 'Squat down and place hands on the floor.',
        tip: 'Keep your chest up as you lower down.',
        commonMistake: 'Placing hands too far from feet'
      },
      {
        stepNumber: 3,
        instruction: 'Jump or step your feet back into plank position.',
        tip: 'Land softly and maintain straight body line.',
        commonMistake: 'Landing too hard or with poor plank form'
      },
      {
        stepNumber: 4,
        instruction: 'Perform a push-up (optional).',
        tip: 'Keep proper push-up form if including this.',
        commonMistake: 'Doing a sloppy push-up'
      },
      {
        stepNumber: 5,
        instruction: 'Jump or step feet back to squat position.',
        tip: 'Land with feet close to hands.',
        commonMistake: 'Landing too far from hands'
      },
      {
        stepNumber: 6,
        instruction: 'Explode up into a jump with arms overhead.',
        tip: 'Use your legs to power the jump.',
        commonMistake: 'Not jumping high enough or using arms'
      }
    ],
    formTips: [
      'Move with control, not just speed',
      'Maintain good form in each position',
      'Land softly on all transitions',
      'Breathe throughout the movement'
    ],
    commonMistakes: [
      'Rushing through the movement',
      'Poor plank position',
      'Not jumping high enough',
      'Landing too hard'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Step-Back Burpee',
        instruction: 'Step back into plank instead of jumping.'
      },
      {
        level: 'easier',
        description: 'No Push-Up Burpee',
        instruction: 'Skip the push-up portion of the movement.'
      },
      {
        level: 'easier',
        description: 'No Jump Burpee',
        instruction: 'Stand up instead of jumping at the end.'
      },
      {
        level: 'harder',
        description: 'Burpee Box Jump',
        instruction: 'Jump onto a box or platform instead of just jumping up.'
      }
    ],
    safetyNotes: [
      'Start with easier modifications',
      'Focus on form over speed',
      'Stop if you feel dizzy or overly fatigued'
    ],
    estimatedDuration: '45 seconds',
    caloriesPerMinute: 15
  }
];

// Helper function to get exercise by ID
export const getExerciseById = (id: string): ExerciseDefinition | undefined => {
  return exerciseDatabase.find(exercise => exercise.id === id);
};

// Helper function to get exercises by muscle group
export const getExercisesByMuscleGroup = (muscleGroup: string): ExerciseDefinition[] => {
  return exerciseDatabase.filter(exercise => 
    exercise.primaryMuscles.includes(muscleGroup as any) || 
    exercise.secondaryMuscles.includes(muscleGroup as any)
  );
};

// Helper function to get exercises by difficulty
export const getExercisesByDifficulty = (difficulty: string): ExerciseDefinition[] => {
  return exerciseDatabase.filter(exercise => exercise.difficulty === difficulty);
};

// Helper function to get exercises by equipment
export const getExercisesByEquipment = (equipment: string): ExerciseDefinition[] => {
  return exerciseDatabase.filter(exercise => 
    exercise.equipment.includes(equipment as any)
  );
};