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
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
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
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
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
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
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
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
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
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
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
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
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
  },
  // ADDITIONAL STRENGTH EXERCISES
  {
    id: 'bench-press',
    name: 'Bench Press',
    description: 'A fundamental upper body pressing exercise that targets the chest, shoulders, and triceps.',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    difficulty: 'intermediate',
    equipment: ['barbell', 'bench'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Lie flat on bench with feet firmly on the ground.',
        tip: 'Keep your shoulder blades pulled back and down.',
        commonMistake: 'Arching back excessively'
      },
      {
        stepNumber: 2,
        instruction: 'Grip the barbell with hands slightly wider than shoulder-width.',
        tip: 'Use a full grip, not thumbless grip.',
        commonMistake: 'Gripping too wide or too narrow'
      },
      {
        stepNumber: 3,
        instruction: 'Lower the bar to your chest with control.',
        tip: 'Touch your chest lightly, don\'t bounce.',
        commonMistake: 'Lowering too fast or not touching chest'
      },
      {
        stepNumber: 4,
        instruction: 'Press the bar back up to starting position.',
        tip: 'Drive through your chest and maintain tight core.',
        commonMistake: 'Pressing unevenly or losing shoulder position'
      }
    ],
    formTips: [
      'Keep your feet flat on the ground',
      'Maintain natural arch in your back',
      'Keep your core tight throughout',
      'Control the weight on both up and down phases'
    ],
    commonMistakes: [
      'Bouncing the bar off chest',
      'Lifting feet off the ground',
      'Flaring elbows too wide',
      'Not using full range of motion'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Dumbbell Bench Press',
        instruction: 'Use dumbbells instead of barbell for better control and range of motion.'
      },
      {
        level: 'easier',
        description: 'Incline Bench Press',
        instruction: 'Use an inclined bench to reduce the load and target upper chest.'
      },
      {
        level: 'harder',
        description: 'Close-Grip Bench Press',
        instruction: 'Use a narrower grip to emphasize triceps more.'
      }
    ],
    safetyNotes: [
      'Always use a spotter when lifting heavy',
      'Start with lighter weights to master form',
      'Keep the bar path straight up and down'
    ],
    estimatedDuration: '60 seconds',
    caloriesPerMinute: 8
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    description: 'A compound exercise that works the entire posterior chain, including glutes, hamstrings, and back.',
    primaryMuscles: ['back', 'glutes', 'legs'],
    secondaryMuscles: ['core', 'shoulders'],
    difficulty: 'intermediate',
    equipment: ['barbell'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Stand with feet hip-width apart, bar over mid-foot.',
        tip: 'Keep the bar close to your shins.',
        commonMistake: 'Standing too far from the bar'
      },
      {
        stepNumber: 2,
        instruction: 'Hinge at hips and bend knees to grip the bar.',
        tip: 'Keep your chest up and back straight.',
        commonMistake: 'Rounding the back'
      },
      {
        stepNumber: 3,
        instruction: 'Drive through your heels and extend hips and knees.',
        tip: 'Keep the bar close to your body throughout.',
        commonMistake: 'Bar drifting away from body'
      },
      {
        stepNumber: 4,
        instruction: 'Stand tall with shoulders back, then lower with control.',
        tip: 'Reverse the movement pattern to lower the weight.',
        commonMistake: 'Dropping the weight or losing control'
      }
    ],
    formTips: [
      'Keep your core braced throughout',
      'Maintain neutral spine position',
      'Drive through your heels, not toes',
      'Keep the bar path straight'
    ],
    commonMistakes: [
      'Rounding the back',
      'Bar drifting away from body',
      'Not engaging glutes at the top',
      'Looking up instead of keeping neutral neck'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Romanian Deadlift',
        instruction: 'Start from standing position and only lower to mid-shin level.'
      },
      {
        level: 'easier',
        description: 'Trap Bar Deadlift',
        instruction: 'Use a trap bar for more natural hand position and easier form.'
      },
      {
        level: 'harder',
        description: 'Single-Leg Deadlift',
        instruction: 'Perform the movement on one leg for increased balance challenge.'
      }
    ],
    safetyNotes: [
      'Start with very light weight to learn proper form',
      'Never round your back under load',
      'Consider using lifting straps for grip if needed'
    ],
    estimatedDuration: '90 seconds',
    caloriesPerMinute: 10
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    description: 'A vertical pressing movement that builds shoulder strength and stability.',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    difficulty: 'intermediate',
    equipment: ['barbell'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Stand with feet shoulder-width apart, bar at shoulder level.',
        tip: 'Keep your core tight and glutes engaged.',
        commonMistake: 'Leaning back too much'
      },
      {
        stepNumber: 2,
        instruction: 'Press the bar straight up overhead.',
        tip: 'Keep the bar path straight and close to your face.',
        commonMistake: 'Pressing the bar forward instead of up'
      },
      {
        stepNumber: 3,
        instruction: 'Lock out arms fully overhead.',
        tip: 'Shrug shoulders up slightly at the top.',
        commonMistake: 'Not achieving full lockout'
      },
      {
        stepNumber: 4,
        instruction: 'Lower the bar back to starting position with control.',
        tip: 'Control the descent, don\'t let it drop.',
        commonMistake: 'Lowering too quickly'
      }
    ],
    formTips: [
      'Keep your core braced throughout',
      'Don\'t lean back excessively',
      'Keep your wrists straight',
      'Maintain tight glutes to protect lower back'
    ],
    commonMistakes: [
      'Pressing the bar forward',
      'Excessive back arch',
      'Not achieving full range of motion',
      'Using legs to help (unless doing push press)'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Seated Overhead Press',
        instruction: 'Perform the movement seated to reduce core stability demands.'
      },
      {
        level: 'easier',
        description: 'Dumbbell Shoulder Press',
        instruction: 'Use dumbbells for independent arm movement and easier form.'
      },
      {
        level: 'harder',
        description: 'Single-Arm Overhead Press',
        instruction: 'Press one arm at a time for increased core challenge.'
      }
    ],
    safetyNotes: [
      'Start with lighter weights to master form',
      'Don\'t press behind the neck',
      'Stop if you feel shoulder impingement'
    ],
    estimatedDuration: '60 seconds',
    caloriesPerMinute: 7
  },
  // CARDIO/RUNNING EXERCISES
  {
    id: 'easy-run',
    name: 'Easy Run',
    description: 'A comfortable, conversational pace run that builds aerobic base and promotes recovery.',
    primaryMuscles: ['cardio', 'legs'],
    secondaryMuscles: ['core'],
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Start with a gentle warm-up walk or light jog for 5-10 minutes.',
        tip: 'Gradually increase your pace to a comfortable running speed.',
        commonMistake: 'Starting too fast'
      },
      {
        stepNumber: 2,
        instruction: 'Maintain a conversational pace throughout the run.',
        tip: 'You should be able to speak in full sentences while running.',
        commonMistake: 'Running too fast for the intended effort'
      },
      {
        stepNumber: 3,
        instruction: 'Focus on relaxed, efficient form with a midfoot strike.',
        tip: 'Keep your shoulders relaxed and arms swinging naturally.',
        commonMistake: 'Tensing up or overstriding'
      }
    ],
    formTips: [
      'Maintain a conversational pace throughout',
      'Land with a midfoot strike, not on your heels',
      'Keep your cadence around 170-180 steps per minute',
      'Breathe naturally and rhythmically'
    ],
    commonMistakes: [
      'Running too fast for an easy effort',
      'Overstriding and heel striking',
      'Holding tension in shoulders and arms',
      'Not staying hydrated on longer runs'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Walk-Run Intervals',
        instruction: 'Alternate between walking and easy running to build endurance gradually.'
      },
      {
        level: 'easier',
        description: 'Treadmill Easy Run',
        instruction: 'Use a treadmill to control pace and reduce impact.'
      },
      {
        level: 'harder',
        description: 'Progressive Easy Run',
        instruction: 'Gradually increase pace in the final third of the run.'
      }
    ],
    safetyNotes: [
      'Start with shorter distances and build gradually',
      'Pay attention to any pain or discomfort',
      'Stay hydrated, especially on longer runs'
    ],
    estimatedDuration: '30-60 minutes',
    caloriesPerMinute: 10
  },
  {
    id: 'tempo-run',
    name: 'Tempo Run',
    description: 'A sustained effort run at comfortably hard pace that improves lactate threshold and race pace endurance.',
    primaryMuscles: ['cardio', 'legs'],
    secondaryMuscles: ['core'],
    difficulty: 'intermediate',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Warm up with 10-15 minutes of easy running.',
        tip: 'Gradually build to your tempo pace during the warm-up.',
        commonMistake: 'Insufficient warm-up before tempo effort'
      },
      {
        stepNumber: 2,
        instruction: 'Run at a comfortably hard pace for the prescribed duration.',
        tip: 'This should feel like a pace you could sustain for about an hour.',
        commonMistake: 'Starting too fast and fading'
      },
      {
        stepNumber: 3,
        instruction: 'Cool down with 10-15 minutes of easy running.',
        tip: 'Gradually reduce pace to help your body recover.',
        commonMistake: 'Stopping abruptly after the tempo effort'
      }
    ],
    formTips: [
      'Maintain steady, controlled breathing',
      'Focus on efficient, relaxed form',
      'Keep a consistent pace throughout the tempo portion',
      'Stay mentally focused and engaged'
    ],
    commonMistakes: [
      'Starting the tempo portion too fast',
      'Not warming up adequately',
      'Letting pace drift during the effort',
      'Skipping the cool-down'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Tempo Intervals',
        instruction: 'Break the tempo effort into shorter intervals with brief recovery.'
      },
      {
        level: 'easier',
        description: 'Cruise Intervals',
        instruction: 'Run slightly faster than tempo pace for shorter durations.'
      },
      {
        level: 'harder',
        description: 'Progressive Tempo',
        instruction: 'Start at tempo pace and gradually increase throughout the effort.'
      }
    ],
    safetyNotes: [
      'Ensure adequate warm-up before tempo effort',
      'Don\'t attempt if feeling fatigued or unwell',
      'Monitor effort level and adjust if needed'
    ],
    estimatedDuration: '20-40 minutes',
    caloriesPerMinute: 15
  },
  {
    id: 'interval-training',
    name: 'Interval Training',
    description: 'High-intensity running intervals with recovery periods that improve VO2 max and speed.',
    primaryMuscles: ['cardio', 'legs'],
    secondaryMuscles: ['core'],
    difficulty: 'advanced',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Complete a thorough 15-20 minute warm-up with dynamic movements.',
        tip: 'Include some strides or accelerations to prepare for high intensity.',
        commonMistake: 'Inadequate warm-up for high-intensity work'
      },
      {
        stepNumber: 2,
        instruction: 'Run the prescribed intervals at high intensity with recovery between.',
        tip: 'Focus on maintaining good form even when fatigued.',
        commonMistake: 'Going too hard on early intervals'
      },
      {
        stepNumber: 3,
        instruction: 'Cool down with 10-15 minutes of easy running and stretching.',
        tip: 'Allow your heart rate to return to normal gradually.',
        commonMistake: 'Stopping immediately after the last interval'
      }
    ],
    formTips: [
      'Maintain good running form throughout',
      'Focus on quick turnover and efficient stride',
      'Use recovery periods to prepare for the next interval',
      'Stay relaxed despite the high intensity'
    ],
    commonMistakes: [
      'Starting intervals too fast',
      'Not taking adequate recovery between intervals',
      'Poor pacing across the workout',
      'Compromising form when fatigued'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Longer Recovery',
        instruction: 'Increase recovery time between intervals to ensure quality.'
      },
      {
        level: 'easier',
        description: 'Shorter Intervals',
        instruction: 'Reduce interval duration while maintaining intensity.'
      },
      {
        level: 'harder',
        description: 'Shorter Recovery',
        instruction: 'Reduce recovery time to increase workout difficulty.'
      }
    ],
    safetyNotes: [
      'Ensure you\'re well-rested before interval sessions',
      'Stop if you experience any pain or dizziness',
      'Build up interval volume gradually'
    ],
    estimatedDuration: '30-45 minutes',
    caloriesPerMinute: 18
  },
  {
    id: 'long-run',
    name: 'Long Run',
    description: 'Extended duration run that builds endurance, mental toughness, and aerobic capacity.',
    primaryMuscles: ['cardio', 'legs'],
    secondaryMuscles: ['core'],
    difficulty: 'intermediate',
    equipment: ['bodyweight'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Start at an easy, comfortable pace that you can maintain.',
        tip: 'The first half should feel very easy and controlled.',
        commonMistake: 'Starting too fast for a long effort'
      },
      {
        stepNumber: 2,
        instruction: 'Maintain steady effort throughout, focusing on time rather than pace.',
        tip: 'Listen to your body and adjust effort based on how you feel.',
        commonMistake: 'Obsessing over pace instead of effort'
      },
      {
        stepNumber: 3,
        instruction: 'Finish strong but not exhausted, with energy left over.',
        tip: 'You should feel like you could continue for a bit longer.',
        commonMistake: 'Running too hard and finishing completely depleted'
      }
    ],
    formTips: [
      'Focus on efficient, relaxed running form',
      'Practice your race-day fueling and hydration',
      'Stay mentally engaged and positive',
      'Adjust effort based on terrain and conditions'
    ],
    commonMistakes: [
      'Running too fast for the intended effort',
      'Not fueling or hydrating properly',
      'Ignoring early signs of fatigue or discomfort',
      'Comparing pace to shorter runs'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Walk Breaks',
        instruction: 'Include planned walk breaks to build endurance gradually.'
      },
      {
        level: 'easier',
        description: 'Time-Based',
        instruction: 'Focus on time rather than distance to reduce pressure.'
      },
      {
        level: 'harder',
        description: 'Progressive Long Run',
        instruction: 'Gradually increase pace in the final portion of the run.'
      }
    ],
    safetyNotes: [
      'Carry water and fuel for runs over 90 minutes',
      'Tell someone your planned route and return time',
      'Build long run distance gradually (10% rule)'
    ],
    estimatedDuration: '60-180 minutes',
    caloriesPerMinute: 12
  },
  // CYCLING EXERCISES
  {
    id: 'steady-state-cycling',
    name: 'Steady State Cycling',
    description: 'Sustained cycling effort at moderate intensity to build aerobic endurance and cycling efficiency.',
    primaryMuscles: ['cardio', 'legs'],
    secondaryMuscles: ['core'],
    difficulty: 'beginner',
    equipment: ['cardio-equipment'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Start with a 10-15 minute warm-up at easy effort.',
        tip: 'Gradually increase intensity to prepare for the main effort.',
        commonMistake: 'Starting the main effort too quickly'
      },
      {
        stepNumber: 2,
        instruction: 'Maintain steady power/effort for the prescribed duration.',
        tip: 'Focus on smooth, consistent pedaling and breathing.',
        commonMistake: 'Letting power/effort fluctuate too much'
      },
      {
        stepNumber: 3,
        instruction: 'Cool down with 10-15 minutes of easy spinning.',
        tip: 'Gradually reduce intensity to help recovery.',
        commonMistake: 'Stopping abruptly after the main effort'
      }
    ],
    formTips: [
      'Maintain smooth, circular pedaling motion',
      'Keep upper body relaxed and stable',
      'Focus on consistent power output',
      'Breathe rhythmically and deeply'
    ],
    commonMistakes: [
      'Gripping handlebars too tightly',
      'Bouncing in the saddle',
      'Inconsistent pacing throughout the effort',
      'Poor bike fit causing discomfort'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Shorter Duration',
        instruction: 'Reduce the duration of the steady effort while maintaining intensity.'
      },
      {
        level: 'easier',
        description: 'Lower Intensity',
        instruction: 'Reduce the target power/heart rate for the steady effort.'
      },
      {
        level: 'harder',
        description: 'Progressive Effort',
        instruction: 'Gradually increase intensity throughout the steady effort.'
      }
    ],
    safetyNotes: [
      'Ensure proper bike fit to prevent injury',
      'Stay hydrated throughout longer sessions',
      'Check equipment before each ride'
    ],
    estimatedDuration: '30-90 minutes',
    caloriesPerMinute: 12
  },
  {
    id: 'cycling-intervals',
    name: 'Cycling Intervals',
    description: 'High-intensity cycling intervals with recovery periods to improve power and VO2 max.',
    primaryMuscles: ['cardio', 'legs'],
    secondaryMuscles: ['core'],
    difficulty: 'advanced',
    equipment: ['cardio-equipment'],
    demonstrationImageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
    instructions: [
      {
        stepNumber: 1,
        instruction: 'Complete a thorough 15-20 minute warm-up with progressive efforts.',
        tip: 'Include some short accelerations to prepare for high intensity.',
        commonMistake: 'Inadequate warm-up before intervals'
      },
      {
        stepNumber: 2,
        instruction: 'Execute intervals at prescribed intensity with full recovery between.',
        tip: 'Focus on maintaining target power/heart rate throughout each interval.',
        commonMistake: 'Starting intervals too hard'
      },
      {
        stepNumber: 3,
        instruction: 'Cool down with 10-15 minutes of easy spinning.',
        tip: 'Allow heart rate and breathing to return to normal.',
        commonMistake: 'Stopping immediately after the last interval'
      }
    ],
    formTips: [
      'Maintain efficient pedaling technique under load',
      'Keep core engaged for power transfer',
      'Use recovery periods to prepare for next interval',
      'Stay relaxed despite high intensity'
    ],
    commonMistakes: [
      'Going too hard on early intervals',
      'Not taking adequate recovery between efforts',
      'Poor pacing across the workout',
      'Compromising technique when fatigued'
    ],
    modifications: [
      {
        level: 'easier',
        description: 'Longer Recovery',
        instruction: 'Increase recovery time between intervals to ensure quality.'
      },
      {
        level: 'easier',
        description: 'Lower Intensity',
        instruction: 'Reduce target power/heart rate for the intervals.'
      },
      {
        level: 'harder',
        description: 'Shorter Recovery',
        instruction: 'Reduce recovery time to increase workout difficulty.'
      }
    ],
    safetyNotes: [
      'Ensure you\'re well-rested before interval sessions',
      'Stop if you experience any unusual symptoms',
      'Build interval intensity gradually over time'
    ],
    estimatedDuration: '45-75 minutes',
    caloriesPerMinute: 16
  }
];

// Helper function to get exercise by ID
export const getExerciseById = (id: string): ExerciseDefinition | undefined => {
  const exercise = exerciseDatabase.find(exercise => exercise.id === id);
  if (!exercise) {
    console.warn(`Exercise with id '${id}' not found in database`);
  }
  return exercise;
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

// Helper function to search exercises by keywords (for better AI matching)
export const searchExercisesByKeywords = (keywords: string[]): ExerciseDefinition[] => {
  const results: ExerciseDefinition[] = [];
  
  exerciseDatabase.forEach(exercise => {
    const exerciseText = `${exercise.name} ${exercise.description} ${exercise.primaryMuscles.join(' ')} ${exercise.secondaryMuscles.join(' ')}`.toLowerCase();
    
    // Check if any keyword matches
    const hasMatch = keywords.some(keyword => 
      exerciseText.includes(keyword.toLowerCase()) ||
      exercise.id.includes(keyword.toLowerCase())
    );
    
    if (hasMatch && !results.find(r => r.id === exercise.id)) {
      results.push(exercise);
    }
  });
  
  return results;
};

// Helper function to get a fallback exercise for cardio activities
export const getCardioFallbackExercise = (activityType: string): ExerciseDefinition | undefined => {
  const activityMap: Record<string, string> = {
    'running': 'easy-run',
    'run': 'easy-run',
    'jog': 'easy-run',
    'tempo': 'tempo-run',
    'interval': 'interval-training',
    'long': 'long-run',
    'cycling': 'steady-state-cycling',
    'bike': 'steady-state-cycling',
    'cycle': 'steady-state-cycling',
    'cardio': 'jumping-jacks',
    'hiit': 'burpee'
  };
  
  const exerciseId = activityMap[activityType.toLowerCase()];
  return exerciseId ? getExerciseById(exerciseId) : undefined;
};