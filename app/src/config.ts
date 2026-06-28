import Constants from "expo-constants";

/**
 * URL de base de l'API backend.
 *
 * Ordre de résolution :
 *  1. Variable d'environnement EXPO_PUBLIC_API_URL (ex. http://192.168.1.10:5000/api)
 *  2. extra.apiUrl dans app.json
 *  3. Déduction automatique depuis l'hôte Metro (Expo Go) : on réutilise l'IP de
 *     la machine de dev et on cible le port 5000 du backend.
 *  4. Repli sur localhost (émulateur / web).
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExtra) return fromExtra;

  const c = Constants as any;
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ||
    c.manifest2?.extra?.expoGo?.debuggerHost ||
    c.manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host) return `http://${host}:5000/api`;
  }

  return "http://localhost:5000/api";
}

export const API_URL = resolveApiUrl();
