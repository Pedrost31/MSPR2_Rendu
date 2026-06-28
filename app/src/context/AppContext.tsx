import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  ActivityEntry,
  AppContextType,
  Credentials,
  FoodEntry,
  User,
} from "../types";
import { api } from "../services/api";
import { mapUserFromApi, setBurnGoal } from "../services/mappers";
import { foodService } from "../services/foodService";
import { activityService } from "../services/activityService";
import { userService } from "../services/userService";
import { tokens, burnGoalStore } from "../storage";
import { toast } from "../ui/toast";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [isUserFetched, setIsUserFetched] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [allFoodLogs, setAllFoodLogs] = useState<FoodEntry[]>([]);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityEntry[]>([]);

  const signup = async (credentials: Credentials) => {
    try {
      const { data } = await api.post("/auth/register", {
        name: credentials.username,
        email: credentials.email,
        password: credentials.password,
      });
      const authData = data.data;
      await tokens.set(authData.accessToken, authData.refreshToken);
      setUser(mapUserFromApi(authData.user, authData.accessToken));
      const apiUser = authData.user;
      if (apiUser?.age && apiUser?.weight && apiUser?.goal) {
        setOnboardingCompleted(true);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de l'inscription");
      throw error;
    }
  };

  const login = async (credentials: Credentials) => {
    try {
      const { data } = await api.post("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });
      const authData = data.data;
      await tokens.set(authData.accessToken, authData.refreshToken);
      setUser(mapUserFromApi(authData.user, authData.accessToken));
      const apiUser = authData.user;
      if (apiUser?.age && apiUser?.weight && apiUser?.goal) {
        setOnboardingCompleted(true);
      }
      await refreshLogs();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de la connexion");
      throw error;
    }
  };

  const fetchUser = async (token: string) => {
    const fetchedUser = await userService.getMe(token);
    setUser(fetchedUser);
    if (fetchedUser?.age && fetchedUser?.weight && fetchedUser?.goal) {
      setOnboardingCompleted(true);
    }
    setIsUserFetched(true);
  };

  const refreshLogs = async () => {
    const [food, activities] = await Promise.all([
      foodService.list(),
      activityService.list(),
    ]);
    setAllFoodLogs(food);
    setAllActivityLogs(activities);
  };

  const updateCalorieGoals = async ({
    intake,
    burn,
  }: {
    intake?: number;
    burn?: number;
  }) => {
    if (!user) return;
    if (burn != null) {
      await setBurnGoal(user.id, Math.round(burn));
    }
    if (intake != null) {
      await userService.updateProfile({ dailyCalorieTarget: Math.round(intake) });
    }
    await fetchUser(user.token);
  };

  const clearSession = async () => {
    await tokens.clear();
    setUser(null);
    setOnboardingCompleted(false);
    setAllFoodLogs([]);
    setAllActivityLogs([]);
  };

  const logout = async () => {
    const refreshToken = tokens.getRefresh();
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // On vide la session locale même si la requête échoue.
    }
    await clearSession();
  };

  const deleteAccount = async () => {
    await userService.deleteAccount();
    if (user) await burnGoalStore.remove(user.id);
    await clearSession();
  };

  useEffect(() => {
    const token = tokens.getAccess();
    if (token) {
      (async () => {
        try {
          await fetchUser(token);
          await refreshLogs();
        } catch {
          await tokens.clear();
          setIsUserFetched(true);
        }
      })();
    } else {
      setIsUserFetched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AppContextType = {
    user,
    setUser,
    login,
    signup,
    fetchUser,
    isUserFetched,
    logout,
    onboardingCompleted,
    setOnboardingCompleted,
    allFoodLogs,
    setAllFoodLogs,
    allActivityLogs,
    setAllActivityLogs,
    updateCalorieGoals,
    deleteAccount,
    refreshLogs,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
};
