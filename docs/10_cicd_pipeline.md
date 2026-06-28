# 10 — Pipeline CI/CD (intégration & déploiement continus)

Ce document décrit le pipeline CI/CD du projet HealthAI Coach : son contenu,
son installation, son utilisation et sa maintenance. Le pipeline est implémenté
avec **GitHub Actions** (le dépôt est hébergé sur GitHub).

## 1. Vue d'ensemble

Deux workflows sont fournis dans [`.github/workflows/`](../.github/workflows) :

| Workflow | Fichier | Rôle | Déclencheurs |
|----------|---------|------|--------------|
| **CI** | `ci.yml` | Lint, tests, couverture, build, analyse de code | `push` & `pull_request` sur `master`/`main`/`develop`, manuel |
| **CD** | `docker-publish.yml` | Build & publication des images Docker sur GHCR | `push` sur `master`/`main`, tags `v*`, manuel |

Le pipeline couvre les **4 exigences du cahier des charges** : *build, tests,
analyse de code et déploiement*.

```
 push / PR
    │
    ▼
┌──────────────────────── CI (ci.yml) ────────────────────────┐
│  backend        ai-services (x4)     frontend     sonarcloud │
│  PG+Mongo       pytest               eslint+build  (optionnel)│
│  prisma         matrix               vite                     │
│  tsc + jest                                                   │
│  couverture                                                   │
└──────────────────────────────────────────────────────────────┘
    │ (sur master / tag)
    ▼
┌──────────────── CD (docker-publish.yml) ────────────────┐
│  Build & push de 6 images Docker → ghcr.io              │
│  backend · client · 4 microservices IA                  │
└──────────────────────────────────────────────────────────┘
```

## 2. Détail de la CI (`ci.yml`)

### Job `backend` — tests d'intégration + couverture
- **Services éphémères** : `postgres:16-alpine` (avec *healthcheck*) et `mongo:7`.
- Étapes : `npm ci` → `prisma generate` → `prisma migrate deploy` →
  `tsc --noEmit` (vérification de types) → `npm run test:coverage` (Jest + Supertest).
- Le rapport de couverture (`backend/coverage`) est publié comme **artefact**.
- Variables d'environnement injectées : `DATABASE_URL`, `MONGODB_URI`,
  `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` (valeurs de test).

### Job `ai-services` — tests des microservices IA
- **Matrice** sur les 4 services (`api1`…`api4`) exécutés en parallèle.
- `pip install -r requirements.txt` puis `pytest -q`.
- Les tests utilisent `respx`/`pytest-mock` : **aucun appel réseau réel** (Ollama,
  Open Food Facts… sont mockés), ce qui rend la CI rapide et déterministe.

### Job `frontend` — qualité + build
- `npm ci` → `npm run lint` (ESLint) → `npm run build` (Vite + `tsc`).
- Le build (`client/dist`) est publié comme artefact.

### Job `sonarcloud` — analyse de qualité (optionnel)
- S'exécute après `backend` et `frontend`, récupère la couverture, et lance
  l'analyse **uniquement si le secret `SONAR_TOKEN` est défini** (sinon l'étape
  est ignorée sans faire échouer le pipeline).

## 3. Détail de la CD (`docker-publish.yml`)

- **Matrice** de 6 images : `healthai-backend`, `healthai-client`,
  `healthai-ai-food-recognition`, `healthai-ai-recipe-suggestions`,
  `healthai-ai-diet-plan`, `healthai-ai-training-program`.
- Connexion à **GHCR** (`ghcr.io`) via le `GITHUB_TOKEN` (aucun secret à créer).
- Tags générés automatiquement (`docker/metadata-action`) :
  nom de branche, tag Git, `sha-<court>`, et `latest` sur la branche par défaut.
- Cache de build GitHub Actions (`cache-from/to: type=gha`) pour accélérer les builds.

Images publiées (exemple) :
```
ghcr.io/pedrost31/healthai-backend:latest
ghcr.io/pedrost31/healthai-client:sha-1a2b3c4
ghcr.io/pedrost31/healthai-ai-diet-plan:master
```

## 4. Installation / mise en route

Aucune installation : les workflows s'activent dès leur présence dans
`.github/workflows/` sur le dépôt GitHub.

**Configuration optionnelle (Settings → Secrets and variables → Actions)** :
- `SONAR_TOKEN` — pour activer l'analyse SonarCloud.
- Les **packages GHCR** doivent être autorisés en écriture : *Settings → Actions →
  General → Workflow permissions → Read and write permissions*.

## 5. Utilisation au quotidien

- **Sur chaque PR** : la CI valide automatiquement lint + tests + build. Une PR ne
  doit être fusionnée que si tous les jobs sont verts (recommandé : *branch
  protection rule* exigeant le statut `CI`).
- **Sur `master`** : la CI rejoue, puis la CD construit et publie les images.
- **Release** : créer un tag `vX.Y.Z` (`git tag v1.0.0 && git push --tags`) publie
  des images taggées avec la version.
- **Manuel** : onglet *Actions* → choisir le workflow → *Run workflow*.

## 6. Maintenance

- **Versions d'actions** : épinglées par version majeure (`@v4`, `@v6`). Vérifier
  périodiquement les mises à jour (Dependabot recommandé).
- **Versions de services** : `postgres:16`, `mongo:7`, `node 20`, `python 3.12`
  alignées sur les environnements de dev/prod. Mettre à jour de concert.
- **Nouveau test** : aucun changement de pipeline nécessaire (Jest/Pytest les
  détectent automatiquement).
- **Nouveau microservice IA** : ajouter une entrée dans la matrice `ai-services`
  (CI) et dans la matrice de `docker-publish.yml` (CD).
- **Débogage** : les logs de chaque job sont consultables dans l'onglet *Actions* ;
  les artefacts (couverture, build) y sont téléchargeables.

## 7. Indicateurs de qualité produits

- **Couverture de tests** backend (artefact `backend-coverage`, format lcov/HTML).
- **Statut des tests** Pytest pour les 4 microservices.
- **Lint** ESLint (frontend) + vérification de types `tsc` (backend & frontend).
- **Qualité de code** SonarCloud (bugs, vulnérabilités, code smells, duplication)
  lorsqu'il est activé.
