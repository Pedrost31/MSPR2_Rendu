import AsyncStorage from "@react-native-async-storage/async-storage";

// Caches en mémoire pour un accès synchrone (les intercepteurs axios et le mapping
// utilisateur ne peuvent pas attendre une lecture asynchrone d'AsyncStorage).
let accessToken: string | null = null;
let refreshToken: string | null = null;
const burnGoals: Record<string, number> = {};
let themePref: "light" | "dark" | null = null;

const BURN_PREFIX = "burnGoal_";

export const tokens = {
  getAccess: () => accessToken,
  getRefresh: () => refreshToken,
  async set(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;
    await AsyncStorage.multiSet([
      ["token", access],
      ["refreshToken", refresh],
    ]);
  },
  async setAccess(access: string) {
    accessToken = access;
    await AsyncStorage.setItem("token", access);
  },
  async clear() {
    accessToken = null;
    refreshToken = null;
    await AsyncStorage.multiRemove(["token", "refreshToken"]);
  },
};

export const burnGoalStore = {
  get: (userId: string): number | null =>
    userId in burnGoals ? burnGoals[userId] : null,
  async set(userId: string, value: number) {
    burnGoals[userId] = value;
    await AsyncStorage.setItem(BURN_PREFIX + userId, String(value));
  },
  async remove(userId: string) {
    delete burnGoals[userId];
    await AsyncStorage.removeItem(BURN_PREFIX + userId);
  },
};

export const themeStore = {
  get: () => themePref,
  async set(value: "light" | "dark") {
    themePref = value;
    await AsyncStorage.setItem("theme", value);
  },
};

export async function hydrate(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);
    for (const [key, value] of entries) {
      if (!value) continue;
      if (key === "token") accessToken = value;
      else if (key === "refreshToken") refreshToken = value;
      else if (key === "theme") themePref = value === "dark" ? "dark" : "light";
      else if (key.startsWith(BURN_PREFIX))
        burnGoals[key.slice(BURN_PREFIX.length)] = Number(value);
    }
  } catch {
    // Démarrage best-effort : en cas d'échec, on repart d'une session vide.
  }
}
