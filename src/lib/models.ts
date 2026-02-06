export type ExerciseTemplate = {
  id: string;
  name: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: ExerciseTemplate[];
};

export type WorkoutSet = {
  reps: number;
  weight: number;
};

export type WorkoutEntry = {
  exerciseId: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  date: string;
  templateId: string;
  entries: WorkoutEntry[];
  notes?: string;
};

export type Meal = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DietDay = {
  date: string;
  caloriesTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  meals: Meal[];
  verdict: "OK" | "DA_RIVEDERE";
  notes?: string;
};

export type WeighIn = {
  date: string;
  weightKg: number;
  notes?: string;
};

export type GymcutData = {
  workoutTemplates: WorkoutTemplate[];
  workoutSessions: WorkoutSession[];
  dietDays: DietDay[];
  weighIns: WeighIn[];
};
