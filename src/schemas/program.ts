import { z } from 'zod';

export const ExerciseSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  name: z.string(),
  type: z.enum(['strength', 'cardio', 'mobility', 'mixed']),
  description: z.string().optional(),
  primaryMuscles: z.array(z.string()).optional(),
  sets: z.number().optional(),
  reps: z.union([z.number(), z.string()]).optional(),
  tempo: z.string().optional(),
  restSec: z.number().optional(),
  durationMin: z.number().optional(),
  distanceKm: z.number().optional(),
  targetIntensity: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['gif', 'mp4']).optional(),
  beginnerAlternative: z
    .object({
      name: z.string(),
      notes: z.string().optional(),
      mediaUrl: z.string().url().optional(),
    })
    .optional(),
});

export const WorkoutSchema = z.object({
  id: z.string(),
  date: z.string().optional(),
  focus: z.string(),
  estimatedDurationMin: z.number().optional(),
  exercises: z.array(ExerciseSchema),
});

export const ProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.union([z.enum(['marathon', 'powerlifting', 'hypertrophy', 'general']), z.string()]),
  phase: z.string().optional(),
  week: z.number().optional(),
  day: z.number().optional(),
  workouts: z.array(WorkoutSchema),
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
export type Program = z.infer<typeof ProgramSchema>;
