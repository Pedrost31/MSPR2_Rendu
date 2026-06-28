import { Coffee, Cookie, Moon, Sun } from "lucide-react-native";

export const quickActivities = [
  { name: "Marche", emoji: "🚶", rate: 5 },
  { name: "Course", emoji: "🏃", rate: 11 },
  { name: "Vélo", emoji: "🚴", rate: 8 },
  { name: "Natation", emoji: "🏊", rate: 10 },
  { name: "Yoga", emoji: "🧘", rate: 4 },
  { name: "Musculation", emoji: "🏋️", rate: 6 },
];

export const mealTypeOptions = [
  { value: "breakfast", label: "🌅 Petit-déjeuner" },
  { value: "lunch", label: "☀️ Déjeuner" },
  { value: "dinner", label: "🌙 Dîner" },
  { value: "snack", label: "🍪 Collation" },
];

export type MealKey = "breakfast" | "lunch" | "dinner" | "snack";

export const mealLabels: Record<MealKey, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
  snack: "Collation",
};

export const quickActivitiesFoodLog: { name: MealKey; label: string; emoji: string }[] = [
  { name: "breakfast", label: "Petit-déjeuner", emoji: "🌮" },
  { name: "lunch", label: "Déjeuner", emoji: "🌅" },
  { name: "dinner", label: "Dîner", emoji: "🌙" },
  { name: "snack", label: "Collation", emoji: "🍪" },
];

export const mealColors: Record<MealKey, { bg: string; fg: string }> = {
  breakfast: { bg: "#fef3c7", fg: "#d97706" },
  lunch: { bg: "#ffedd5", fg: "#ea580c" },
  dinner: { bg: "#e0e7ff", fg: "#4f46e5" },
  snack: { bg: "#fce7f3", fg: "#db2777" },
};

export const mealIcons: Record<MealKey, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

export const goalOptions = [
  { value: "lose", label: "Perdre du poids" },
  { value: "maintain", label: "Maintenir le poids" },
  { value: "gain", label: "Prendre du muscle" },
];

export const goalLabels: Record<string, string> = {
  lose: "Perdre du poids",
  maintain: "Maintenir le poids",
  gain: "Prendre du muscle",
};

export const goalEmoji: Record<string, string> = {
  lose: "🔥",
  maintain: "⚖️",
  gain: "💪",
};

export const getMotivationalMessage = (
  caloriesConsumed: number,
  activeMinutes: number,
  dailyCalorieLimit: number
) => {
  const percentage = (caloriesConsumed / dailyCalorieLimit) * 100;

  if (caloriesConsumed === 0 && activeMinutes === 0) {
    return {
      text: "Prêt à tout déchirer aujourd'hui ? Commencez à enregistrer !",
      emoji: "💪",
    };
  }
  if (percentage > 100) {
    return {
      text: "Limite dépassée, mais demain est un nouveau jour !",
      emoji: "🌅",
    };
  }
  if (percentage >= 80) {
    return { text: "Presque à votre limite, restez attentif !", emoji: "⚡" };
  }
  if (activeMinutes >= 30) {
    return { text: "Belle séance aujourd'hui ! Continuez comme ça !", emoji: "🔥" };
  }
  if (percentage >= 50) {
    return { text: "Vous vous débrouillez très bien, continuez !", emoji: "✨" };
  }
  return { text: "Chaque pas compte. Vous allez y arriver !", emoji: "🚀" };
};
