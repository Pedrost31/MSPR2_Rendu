import type React from "react";

export type User = {
  id: string;
  email: string;
  username: string;
  token: string;
  documentId?: string;
  age?: number;
  weight?: number;
  height?: number;
  goal?: "lose" | "maintain" | "gain";
  dailyCalorieIntake?: number;
  dailyCalorieBurn?: number;
  createdAt?: string;
} | null;

export type Credentials = {
  username?: string;
  email: string;
  password: string;
};

export interface FoodFormData {
  name: string;
  calories: number;
  mealType: string;
}

export interface FoodEntry {
  id: number | string;
  name: string;
  calories: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  date: string;
  createdAt?: string;
  documentId?: string;
}

export interface ActivityEntry {
  id: number | string;
  name: string;
  duration: number;
  calories: number;
  date: string;
  documentId: string;
  createdAt?: string;
}

export type AppContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  login: (credentials: Credentials) => Promise<void>;
  signup: (credentials: Credentials) => Promise<void>;
  fetchUser: (token: string) => Promise<void>;
  isUserFetched: boolean;
  logout: () => void | Promise<void>;
  onboardingCompleted: boolean;
  setOnboardingCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  allFoodLogs: FoodEntry[];
  setAllFoodLogs: React.Dispatch<React.SetStateAction<FoodEntry[]>>;
  allActivityLogs: ActivityEntry[];
  setAllActivityLogs: React.Dispatch<React.SetStateAction<ActivityEntry[]>>;
  updateCalorieGoals: (goals: { intake?: number; burn?: number }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshLogs: () => Promise<void>;
};
