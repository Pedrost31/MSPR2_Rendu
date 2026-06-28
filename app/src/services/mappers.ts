import type { ActivityEntry, FoodEntry, User } from "../types";
import { burnGoalStore } from "../storage";

type BackendUser = {
  id: string;
  email: string;
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  activityLevel?: string;
  goal?: "lose" | "maintain" | "gain";
  dailyCalorieTarget?: number;
  createdAt?: string;
  goalSettings?: {
    weeklyWorkoutTarget?: number;
    dailyCalorieTarget?: number;
  } | null;
};

type BackendFoodEntry = {
  id: string;
  name: string;
  calories: number;
  mealType: FoodEntry["mealType"];
  date: string;
  createdAt: string;
};

type BackendActivityEntry = {
  id: string;
  name: string;
  duration: number;
  caloriesBurned: number;
  date: string;
  createdAt: string;
};

// L'objectif de calories brûlées n'existe pas en base : on le stocke côté
// appareil, par utilisateur.
export const getStoredBurnGoal = (userId: string): number | null =>
  burnGoalStore.get(userId);

export const setBurnGoal = (userId: string, value: number) =>
  burnGoalStore.set(userId, value);

type ProfileMetrics = {
  weight?: number;
  height?: number;
  age?: number;
  goal?: string;
};

// Métabolisme de base (Mifflin-St Jeor, moyenne H/F).
const computeBmr = ({ weight, height, age }: ProfileMetrics): number =>
  10 * (weight ?? 70) + 6.25 * (height ?? 170) - 5 * (age ?? 30) - 78;

// Limite d'apport quotidienne cohérente avec l'objectif.
export const estimateIntake = (profile: ProfileMetrics): number => {
  const tdee = computeBmr(profile) * 1.45;
  const modifier =
    profile.goal === "lose" ? 0.85 : profile.goal === "gain" ? 1.15 : 1;
  const intake = Math.round((tdee * modifier) / 10) * 10;
  return Math.min(4500, Math.max(1200, intake));
};

// Objectif de dépense quotidienne raisonnable : une fraction du BMR.
export const burnGoalFromBmr = (bmr: number, goal?: string): number => {
  const pct = goal === "lose" ? 0.3 : goal === "gain" ? 0.15 : 0.22;
  return Math.min(900, Math.max(150, Math.round((bmr * pct) / 10) * 10));
};

export const estimateBurnGoal = (profile: ProfileMetrics): number =>
  burnGoalFromBmr(computeBmr(profile), profile.goal);

export const mapUserFromApi = (
  backendUser: BackendUser,
  token?: string
): NonNullable<User> => ({
  id: backendUser.id,
  email: backendUser.email,
  username: backendUser.name ?? backendUser.email.split("@")[0],
  token: token ?? "",
  age: backendUser.age,
  weight: backendUser.weight,
  height: backendUser.height,
  goal: backendUser.goal,
  dailyCalorieIntake: backendUser.dailyCalorieTarget ?? estimateIntake(backendUser),
  dailyCalorieBurn: getStoredBurnGoal(backendUser.id) ?? estimateBurnGoal(backendUser),
  createdAt: backendUser.createdAt,
});

export const mapFoodEntryFromApi = (entry: BackendFoodEntry): FoodEntry => ({
  id: entry.id,
  documentId: entry.id,
  name: entry.name,
  calories: entry.calories,
  mealType: entry.mealType,
  date: entry.date,
  createdAt: entry.createdAt ?? entry.date,
});

export const mapActivityEntryFromApi = (
  entry: BackendActivityEntry
): ActivityEntry => ({
  id: entry.id,
  documentId: entry.id,
  name: entry.name,
  duration: entry.duration,
  calories: entry.caloriesBurned,
  date: entry.date,
  createdAt: entry.createdAt ?? entry.date,
});
