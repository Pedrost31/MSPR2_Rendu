import * as ImageManipulator from "expo-image-manipulator";
import { api } from "./api";

export interface FoodImageAnalysis {
  food_name?: string;
  ingredients?: string[];
  portion_size?: string;
  nutrition?: {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
  };
  confidence?: string;
  notes?: string;
}

interface AnalyzeImageResponse {
  request_id?: string;
  analysis: FoodImageAnalysis;
  latency_ms?: number;
}

export interface Recipe {
  name?: string;
  prep_time_min?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients?: string[];
  instructions?: string[];
  benefits?: string;
}

export interface RecipeSuggestions {
  suggestions?: Recipe[];
  tip?: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Macros {
  bmr?: number;
  tdee?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface DietPlan {
  weekly_plan?: Record<string, Record<string, string>>;
  shopping_list?: string[];
  key_principles?: string[];
  hydration_tip?: string;
}

export interface Exercise {
  name?: string;
  sets?: number;
  reps?: string | number | null;
  rest_sec?: number;
  duration_min?: number;
  duration_sec?: number | null;
  notes?: string;
}

export interface TrainingDay {
  type?: string;
  name?: string;
  duration_min?: number;
  exercises?: Exercise[];
}

export interface WorkoutPhase {
  phase?: string;
  duration_min?: number;
  exercises?: Exercise[];
}

export interface TrainingProgram {
  program_name?: string;
  difficulty?: string;
  weekly_sessions?: number;
  weekly_plan?: Record<string, TrainingDay>;
  warm_up?: string[];
  cool_down?: string[];
  progression?: string;
  coach_tip?: string;
  workout_name?: string;
  type?: string;
  duration_min?: number;
  calories_estimated?: number;
  phases?: WorkoutPhase[];
}

export interface HistoryItem {
  _id: string;
  userId: string;
  type: "nutrition" | "activity" | "general";
  prompt: string;
  content: string;
  aiModel: string;
  createdAt: string;
}

const LONG = { timeout: 5 * 60 * 1000 } as const;

export const aiService = {
  async analyzeFoodImage(imageBase64: string): Promise<FoodImageAnalysis> {
    const { data } = await api.post<{ data: AnalyzeImageResponse }>(
      "/ai/analyze-food-image",
      { imageBase64 },
      LONG
    );
    return data.data.analysis;
  },

  async suggestRecipes(mealType: MealType): Promise<RecipeSuggestions> {
    const { data } = await api.get<{ data: { recipes: RecipeSuggestions } }>(
      "/ai/recipes/suggest",
      { params: { mealType }, ...LONG }
    );
    return data.data.recipes;
  },

  async generateRecipe(ingredients: string[], goal?: string): Promise<Recipe> {
    const { data } = await api.post<{ data: { recipe: Recipe } }>(
      "/ai/recipes/generate",
      { ingredients, goal },
      LONG
    );
    return data.data.recipe;
  },

  async getMacros(): Promise<Macros> {
    const { data } = await api.get<{ data: { macros: Macros } }>(
      "/ai/diet/macros",
      LONG
    );
    return data.data.macros;
  },

  async getDietPlan(): Promise<{ plan: DietPlan; macros: Macros }> {
    const { data } = await api.get<{ data: { plan: DietPlan; macros: Macros } }>(
      "/ai/diet/plan",
      LONG
    );
    return { plan: data.data.plan, macros: data.data.macros };
  },

  async getTrainingProgram(): Promise<TrainingProgram> {
    const { data } = await api.get<{ data: { program: TrainingProgram } }>(
      "/ai/training/program",
      LONG
    );
    return data.data.program;
  },

  async getQuickWorkout(
    workoutType: string,
    durationMin: number,
    equipment: string[] = []
  ): Promise<TrainingProgram> {
    const { data } = await api.post<{ data: { workout: TrainingProgram } }>(
      "/ai/training/quick-workout",
      { workoutType, durationMin, equipment },
      LONG
    );
    return data.data.workout;
  },

  async getHistory(limit = 30): Promise<HistoryItem[]> {
    const { data } = await api.get<{ data: HistoryItem[] }>("/ai/history", {
      params: { limit },
    });
    return data.data;
  },
};

/**
 * Redimensionne (max 1024px de large) et compresse une image en JPEG, puis
 * renvoie le base64 PUR (sans préfixe data:) attendu par le microservice.
 */
export const uriToCompressedBase64 = async (
  uri: string,
  width?: number,
  maxSize = 1024,
  quality = 0.8
): Promise<string> => {
  const actions =
    width && width > maxSize ? [{ resize: { width: maxSize } }] : [];
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  return result.base64 ?? "";
};
