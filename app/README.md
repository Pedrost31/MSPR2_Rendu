# HealthAI Coach — Application mobile (Expo / React Native)

Version mobile native de la webapp HealthAI Coach, exécutable sur iOS et Android
via **Expo Go**. Elle reprend l'intégralité des fonctionnalités :

- Authentification (connexion / inscription) + onboarding en 3 étapes
- Tableau de bord (calories, IMC, minutes actives, graphe hebdomadaire)
- Journal alimentaire + **Photo repas IA** (appareil photo / galerie)
- Journal d'activité
- Coach IA (recettes, diète, entraînement, historique structuré)
- Profil (édition, calcul IA des objectifs, thème clair/sombre, suppression de compte)

Le tout en français, avec gestion du thème sombre/clair et navigation par onglets.

## Stack

- Expo SDK 54, React Native 0.81, React 19, TypeScript
  (SDK 54 = dernière version supportée par l'app **Expo Go** du App Store / Play Store)
- React Navigation (bottom tabs)
- Axios + AsyncStorage (session JWT + refresh token)
- expo-image-picker / expo-image-manipulator (analyse photo)
- lucide-react-native (icônes), react-native-toast-message (notifications)

## Prérequis

1. Node.js 18+
2. L'application **Expo Go** installée sur votre téléphone (App Store / Play Store)
3. Le **backend** HealthAI démarré (port `5000`) et accessible — voir `../backend`
4. Les **microservices IA** (Ollama + FastAPI) démarrés si vous utilisez le Coach
   et la Photo repas IA — voir `../ai_services`

> Le téléphone et l'ordinateur de développement doivent être sur le **même réseau Wi-Fi**.

## Démarrage

```bash
cd app
npm install        # si ce n'est pas déjà fait
npx expo start
```

Scannez le QR code affiché avec Expo Go (Android) ou l'appareil photo (iOS).

## Configuration de l'URL de l'API

L'app doit joindre le backend sur le réseau local. La résolution se fait dans cet ordre
(`src/config.ts`) :

1. **Variable d'environnement** `EXPO_PUBLIC_API_URL` (prioritaire) :

   ```bash
   # Windows PowerShell
   $env:EXPO_PUBLIC_API_URL="http://192.168.1.20:5000/api"; npx expo start

   # macOS / Linux
   EXPO_PUBLIC_API_URL=http://192.168.1.20:5000/api npx expo start
   ```

2. `extra.apiUrl` dans `app.json`
3. **Détection automatique** : l'app réutilise l'IP de la machine Metro (celle du QR
   code) et cible le port `5000`. Dans la plupart des cas, **aucune configuration n'est
   nécessaire** : il suffit que le backend tourne sur le même PC qu'Expo.
4. Repli sur `http://localhost:5000/api` (émulateur / web).

> Remplacez `192.168.1.20` par l'IP locale de votre machine (`ipconfig` sur Windows,
> `ifconfig` / `ip a` sur macOS/Linux).

## Notes

- L'analyse de photo et les requêtes Coach IA peuvent prendre 30 s à 2 min (inférence
  locale via Ollama). Un overlay de chargement est affiché pendant ce temps.
- Le thème (clair/sombre) et la session sont persistés sur l'appareil (AsyncStorage).
- L'objectif de calories brûlées est stocké localement par utilisateur (comme sur le web).

## Structure

```
app/
├── App.tsx                  # Providers + navigation + toasts
└── src/
    ├── config.ts            # Résolution de l'URL API
    ├── storage.ts           # Token / thème / objectifs (AsyncStorage + cache mémoire)
    ├── theme.ts             # Palettes clair/sombre
    ├── constants.ts         # Libellés, activités, repas, objectifs (FR)
    ├── context/             # ThemeContext, AppContext
    ├── services/            # api, mappers, food, activity, user, ai
    ├── components/          # Screen, PageHeader, CaloriesChart, ui/*
    ├── navigation/          # RootNavigator, Tabs
    └── screens/             # Login, Onboarding, Dashboard, FoodLog, ActivityLog, Coach, Profile
```
