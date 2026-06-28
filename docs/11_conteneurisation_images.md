# 11 — Conteneurisation & images Docker

Documentation des images conteneurs : **contenu, configuration et bonnes
pratiques**. Tous les services de HealthAI Coach sont conteneurisables et
orchestrés via Docker Compose.

## 1. Inventaire des images

| Image | Base | Dockerfile | Port | Rôle |
|-------|------|-----------|------|------|
| `healthai-backend` | `node:20-alpine` | [`backend/Dockerfile`](../backend/Dockerfile) | 5000 | API REST Express + Prisma |
| `healthai-client` | `node:20-alpine` → `nginx:1.27-alpine` | [`client/Dockerfile`](../client/Dockerfile) | 80 | Frontend React (statique, servi par Nginx) |
| `healthai-ai-food-recognition` | `python:3.12-slim` | [`ai_services/api1_food_recognition/Dockerfile`](../ai_services/api1_food_recognition/Dockerfile) | 8001 | Reconnaissance d'image (LLaVA) |
| `healthai-ai-recipe-suggestions` | `python:3.12-slim` | api2 | 8002 | Suggestions de recettes (Llama 3.2) |
| `healthai-ai-diet-plan` | `python:3.12-slim` | api3 | 8003 | Plans diététiques |
| `healthai-ai-training-program` | `python:3.12-slim` | api4 | 8004 | Programmes d'entraînement |
| `postgres:16` | officielle | — | 55432→5432 | Base relationnelle (métier) |
| `mongo:7` | officielle | — | 27017 | Base NoSQL (recommandations + logs IA) |
| `ollama/ollama` | officielle | — | 11434 | Moteur de modèles IA local |

## 2. Contenu & configuration des images

### Backend (`backend/Dockerfile`)
- **Multi-stage** : étape *builder* (compilation TypeScript + `prisma generate`)
  puis image de *production* allégée (`npm ci --omit=dev`).
- Au démarrage : `prisma migrate deploy` (applique les migrations) puis
  `node dist/server.js`.
- Variables d'environnement : `DATABASE_URL`, `MONGODB_URI`, `JWT_SECRET`,
  `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `AI_*_SERVICE_URL`, `RATE_LIMIT_*`.

### Frontend (`client/Dockerfile`)
- **Multi-stage** : build Vite (Node) → service des fichiers statiques par **Nginx**.
- `ARG VITE_API_URL` injecté au build (Vite remplace `import.meta.env` à la
  compilation). Configuration Nginx ([`client/nginx.conf`](../client/nginx.conf)) :
  fallback SPA `try_files … /index.html`, gzip, cache long sur `/assets`.

### Microservices IA (`ai_services/apiN/Dockerfile`)
- `python:3.12-slim`, installation des `requirements.txt`, copie du code +
  module commun `shared/`, lancement via `uvicorn`.
- Tous exposent désormais `/metrics` (Prometheus) en plus de `/health` et `/docs`.

## 3. Orchestration (Docker Compose)

Trois stacks composables :

| Stack | Fichier | Contenu |
|-------|---------|---------|
| Données + API | [`backend/docker-compose.yml`](../backend/docker-compose.yml) | PostgreSQL, MongoDB, backend |
| IA | [`ai_services/docker-compose.yml`](../ai_services/docker-compose.yml) | Ollama + 4 microservices |
| Observabilité | [`docker-compose.monitoring.yml`](../docker-compose.monitoring.yml) | Prometheus, Grafana, Loki, Promtail, cAdvisor, Alertmanager |

**Démarrage complet :**
```bash
# Bases de données + backend
cd backend && docker compose up -d

# IA : Ollama + microservices
cd ../ai_services && docker compose up -d --build
docker exec healthai-ollama ollama pull llava
docker exec healthai-ollama ollama pull llama3.2

# Observabilité
cd .. && docker compose -f docker-compose.monitoring.yml up -d
```

## 4. Bonnes pratiques appliquées

- **Multi-stage builds** → images finales légères, sans outils de compilation.
- **Images de base *slim*/*alpine*** → surface d'attaque et taille réduites.
- **Épinglage de versions** (`node:20-alpine`, `postgres:16`, `mongo:7`…) →
  builds reproductibles.
- **Séparation build/runtime** : aucune dépendance de dev dans l'image de prod.
- **`.dockerignore`** (frontend) pour exclure `node_modules`, `dist`, `.env`.
- **Variables d'environnement** plutôt que valeurs en dur ; secrets jamais commités.
- **`restart: unless-stopped`** + **healthchecks** sur les services critiques.
- **Volumes nommés** pour la persistance (`pgdata`, `mongodata`, `ollama_data`,
  `prometheus_data`, `grafana_data`, `loki_data`).
- **Publication CI** vers GHCR avec tags traçables (`sha`, version) — voir
  [`10_cicd_pipeline.md`](./10_cicd_pipeline.md).

## 5. Récupération des images publiées

```bash
docker pull ghcr.io/pedrost31/healthai-backend:latest
docker pull ghcr.io/pedrost31/healthai-client:latest
docker pull ghcr.io/pedrost31/healthai-ai-diet-plan:latest
```
