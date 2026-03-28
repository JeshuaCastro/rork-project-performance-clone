export interface CanonicalWorkout {
  id: string;
  title: string;
  dayIndex: number;
  exercises: CanonicalExercise[];
}

export interface CanonicalExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  mediaUrl?: string;
}