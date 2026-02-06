import localforage from "localforage";
import type {
  DietDay,
  GymcutData,
  WeighIn,
  WorkoutSession,
  WorkoutTemplate
} from "./models";

const store = localforage.createInstance({
  name: "gymcut-companion"
});

const KEYS = {
  workoutTemplates: "workoutTemplates",
  workoutSessions: "workoutSessions",
  dietDays: "dietDays",
  weighIns: "weighIns"
} as const;

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getArray = async <T>(key: string): Promise<T[]> => {
  const data = await store.getItem<T[]>(key);
  return Array.isArray(data) ? data : [];
};

const setArray = async <T>(key: string, value: T[]): Promise<void> => {
  await store.setItem(key, value);
};

export const listWorkoutTemplates = () =>
  getArray<WorkoutTemplate>(KEYS.workoutTemplates);

export const getWorkoutTemplate = async (id: string) => {
  const templates = await listWorkoutTemplates();
  return templates.find((template) => template.id === id) ?? null;
};

export const createWorkoutTemplate = async (
  template: Omit<WorkoutTemplate, "id">
) => {
  const templates = await listWorkoutTemplates();
  const newTemplate: WorkoutTemplate = { ...template, id: createId() };
  const next = [...templates, newTemplate];
  await setArray(KEYS.workoutTemplates, next);
  return newTemplate;
};

export const updateWorkoutTemplate = async (template: WorkoutTemplate) => {
  const templates = await listWorkoutTemplates();
  const next = templates.map((item) =>
    item.id === template.id ? template : item
  );
  await setArray(KEYS.workoutTemplates, next);
  return template;
};

export const deleteWorkoutTemplate = async (id: string) => {
  const templates = await listWorkoutTemplates();
  const next = templates.filter((item) => item.id !== id);
  await setArray(KEYS.workoutTemplates, next);
};

export const listWorkoutSessions = () =>
  getArray<WorkoutSession>(KEYS.workoutSessions);

export const getWorkoutSession = async (id: string) => {
  const sessions = await listWorkoutSessions();
  return sessions.find((session) => session.id === id) ?? null;
};

export const createWorkoutSession = async (
  session: Omit<WorkoutSession, "id">
) => {
  const sessions = await listWorkoutSessions();
  const newSession: WorkoutSession = { ...session, id: createId() };
  const next = [...sessions, newSession];
  await setArray(KEYS.workoutSessions, next);
  return newSession;
};

export const updateWorkoutSession = async (session: WorkoutSession) => {
  const sessions = await listWorkoutSessions();
  const next = sessions.map((item) => (item.id === session.id ? session : item));
  await setArray(KEYS.workoutSessions, next);
  return session;
};

export const deleteWorkoutSession = async (id: string) => {
  const sessions = await listWorkoutSessions();
  const next = sessions.filter((item) => item.id !== id);
  await setArray(KEYS.workoutSessions, next);
};

export const listDietDays = () => getArray<DietDay>(KEYS.dietDays);

export const getDietDay = async (date: string) => {
  const dietDays = await listDietDays();
  return dietDays.find((day) => day.date === date) ?? null;
};

export const upsertDietDay = async (day: DietDay) => {
  const dietDays = await listDietDays();
  const next = dietDays.some((item) => item.date === day.date)
    ? dietDays.map((item) => (item.date === day.date ? day : item))
    : [...dietDays, day];
  await setArray(KEYS.dietDays, next);
  return day;
};

export const deleteDietDay = async (date: string) => {
  const dietDays = await listDietDays();
  const next = dietDays.filter((item) => item.date !== date);
  await setArray(KEYS.dietDays, next);
};

export const listWeighIns = () => getArray<WeighIn>(KEYS.weighIns);

export const getWeighIn = async (date: string) => {
  const weighIns = await listWeighIns();
  return weighIns.find((item) => item.date === date) ?? null;
};

export const upsertWeighIn = async (weighIn: WeighIn) => {
  const weighIns = await listWeighIns();
  const next = weighIns.some((item) => item.date === weighIn.date)
    ? weighIns.map((item) => (item.date === weighIn.date ? weighIn : item))
    : [...weighIns, weighIn];
  await setArray(KEYS.weighIns, next);
  return weighIn;
};

export const deleteWeighIn = async (date: string) => {
  const weighIns = await listWeighIns();
  const next = weighIns.filter((item) => item.date !== date);
  await setArray(KEYS.weighIns, next);
};

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && !Number.isNaN(value);
const isArray = Array.isArray;

const isWorkoutTemplate = (value: unknown): value is WorkoutTemplate => {
  if (!value || typeof value !== "object") return false;
  const template = value as WorkoutTemplate;
  return (
    isString(template.id) &&
    isString(template.name) &&
    isArray(template.exercises) &&
    template.exercises.every(
      (exercise) =>
        exercise &&
        typeof exercise === "object" &&
        isString(exercise.id) &&
        isString(exercise.name)
    )
  );
};

const isWorkoutSession = (value: unknown): value is WorkoutSession => {
  if (!value || typeof value !== "object") return false;
  const session = value as WorkoutSession;
  return (
    isString(session.id) &&
    isString(session.date) &&
    isString(session.templateId) &&
    isArray(session.entries) &&
    session.entries.every(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        isString(entry.exerciseId) &&
        isArray(entry.sets) &&
        entry.sets.every(
          (set) =>
            set &&
            typeof set === "object" &&
            isNumber(set.reps) &&
            isNumber(set.weight)
        )
    )
  );
};

const isDietDay = (value: unknown): value is DietDay => {
  if (!value || typeof value !== "object") return false;
  const day = value as DietDay;
  return (
    isString(day.date) &&
    isNumber(day.caloriesTarget) &&
    isNumber(day.proteinTarget) &&
    isNumber(day.carbsTarget) &&
    isNumber(day.fatTarget) &&
    isArray(day.meals) &&
    day.meals.every(
      (meal) =>
        meal &&
        typeof meal === "object" &&
        isString(meal.name) &&
        isNumber(meal.calories) &&
        isNumber(meal.protein) &&
        isNumber(meal.carbs) &&
        isNumber(meal.fat)
    ) &&
    (day.verdict === "OK" || day.verdict === "DA_RIVEDERE")
  );
};

const isWeighIn = (value: unknown): value is WeighIn => {
  if (!value || typeof value !== "object") return false;
  const weighIn = value as WeighIn;
  return isString(weighIn.date) && isNumber(weighIn.weightKg);
};

const normalizeImport = (data: Partial<GymcutData> | null) => ({
  workoutTemplates: isArray(data?.workoutTemplates)
    ? data?.workoutTemplates.filter(isWorkoutTemplate)
    : [],
  workoutSessions: isArray(data?.workoutSessions)
    ? data?.workoutSessions.filter(isWorkoutSession)
    : [],
  dietDays: isArray(data?.dietDays)
    ? data?.dietDays.filter(isDietDay)
    : [],
  weighIns: isArray(data?.weighIns) ? data?.weighIns.filter(isWeighIn) : []
});

const mergeByKey = <T extends { id: string }>(
  current: T[],
  incoming: T[]
) => {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
};

const mergeByDate = <T extends { date: string }>(
  current: T[],
  incoming: T[]
) => {
  const map = new Map(current.map((item) => [item.date, item]));
  for (const item of incoming) {
    map.set(item.date, item);
  }
  return Array.from(map.values());
};

export const exportGymcutData = async (): Promise<string> => {
  const data: GymcutData = {
    workoutTemplates: await listWorkoutTemplates(),
    workoutSessions: await listWorkoutSessions(),
    dietDays: await listDietDays(),
    weighIns: await listWeighIns()
  };
  return JSON.stringify(data, null, 2);
};

export const exportWeighInsCsv = async () => {
  const weighIns = await listWeighIns();
  const header = "date,weightKg,notes";
  const rows = weighIns.map((entry) => {
    const notes = entry.notes ? entry.notes.replaceAll("\"", "\"\"") : "";
    return `${entry.date},${entry.weightKg},\"${notes}\"`;
  });
  return [header, ...rows].join("\n");
};

export const importGymcutData = async (json: string) => {
  let parsed: Partial<GymcutData> | null = null;
  try {
    parsed = JSON.parse(json) as Partial<GymcutData>;
  } catch {
    throw new Error("JSON non valido per l'importazione");
  }

  const sanitized = normalizeImport(parsed);

  const currentTemplates = await listWorkoutTemplates();
  const currentSessions = await listWorkoutSessions();
  const currentDietDays = await listDietDays();
  const currentWeighIns = await listWeighIns();

  const merged: GymcutData = {
    workoutTemplates: mergeByKey(currentTemplates, sanitized.workoutTemplates),
    workoutSessions: mergeByKey(currentSessions, sanitized.workoutSessions),
    dietDays: mergeByDate(currentDietDays, sanitized.dietDays),
    weighIns: mergeByDate(currentWeighIns, sanitized.weighIns)
  };

  await setArray(KEYS.workoutTemplates, merged.workoutTemplates);
  await setArray(KEYS.workoutSessions, merged.workoutSessions);
  await setArray(KEYS.dietDays, merged.dietDays);
  await setArray(KEYS.weighIns, merged.weighIns);

  return merged;
};

export const clearGymcutData = async () => {
  await Promise.all([
    store.removeItem(KEYS.workoutTemplates),
    store.removeItem(KEYS.workoutSessions),
    store.removeItem(KEYS.dietDays),
    store.removeItem(KEYS.weighIns)
  ]);
};
