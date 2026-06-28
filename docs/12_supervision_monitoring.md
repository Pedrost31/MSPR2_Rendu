# 12 — Supervision & observabilité (monitoring)

Documentation du système de supervision de HealthAI Coach, **incluant la liste
exhaustive des données collectées**. La stack couvre les trois piliers de
l'observabilité : **métriques**, **logs** et **alertes**, avec des tableaux de
bord de visualisation.

## 1. Architecture de la supervision

```
┌─────────────┐   /metrics   ┌──────────────┐   PromQL   ┌──────────────┐
│  Backend    │ ───────────▶ │              │ ◀────────  │              │
│  4 µservices│ ───────────▶ │  Prometheus  │            │   Grafana    │
│  cAdvisor   │ ───────────▶ │  (métriques) │ ─────────▶ │ (dashboards) │
└─────────────┘              └──────┬───────┘            └──────┬───────┘
                                    │ règles                    │ LogQL
                                    ▼                           │
                             ┌──────────────┐            ┌──────┴───────┐
                             │ Alertmanager │            │     Loki     │
                             │  (alertes)   │            │   (logs)     │
                             └──────────────┘            └──────▲───────┘
                                                                │ push
                                                         ┌──────┴───────┐
                                                         │   Promtail   │
                                                         │ (logs Docker)│
                                                         └──────────────┘
```

Stack définie dans [`docker-compose.monitoring.yml`](../docker-compose.monitoring.yml)
et configurée dans [`monitoring/`](../monitoring).

| Outil | Version | Rôle | URL locale |
|-------|---------|------|-----------|
| Prometheus | 2.55 | Collecte & stockage des métriques | http://localhost:9090 |
| Grafana | 11.4 | Tableaux de bord & visualisation | http://localhost:3001 (admin/admin) |
| Loki | 3.3 | Agrégation des logs | http://localhost:3100 |
| Promtail | 3.3 | Expédition des logs conteneurs → Loki | — |
| cAdvisor | 0.49 | Métriques des conteneurs (CPU/RAM/I/O) | http://localhost:8088 |
| Alertmanager | 0.27 | Gestion & routage des alertes | http://localhost:9093 |

## 2. Démarrage

```bash
docker compose -f docker-compose.monitoring.yml up -d
```
Ouvrir Grafana (http://localhost:3001) → dashboard **« HealthAI Coach – Vue
d'ensemble »** (provisionné automatiquement).

> Les applications exposent `/metrics` et sont scrapées via
> `host.docker.internal` (elles tournent dans leurs propres stacks Compose).

## 3. Instrumentation des applications

| Service | Bibliothèque | Endpoint |
|---------|--------------|----------|
| Backend Express | `prom-client` ([`metrics.middleware.ts`](../backend/src/middlewares/metrics.middleware.ts)) | `GET /metrics` |
| 4 microservices IA | `prometheus-fastapi-instrumentator` | `GET /metrics` |

## 4. Liste exhaustive des données collectées

### 4.1 Métriques applicatives — Backend (`prom-client`)
| Métrique | Type | Labels | Description |
|----------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `route`, `status_code`, `service` | Nombre total de requêtes HTTP |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code`, `service` | Durée des requêtes (buckets 0.05→5 s) |
| `process_cpu_user_seconds_total` | Counter | `service` | Temps CPU utilisateur du process Node |
| `process_cpu_system_seconds_total` | Counter | `service` | Temps CPU système |
| `process_resident_memory_bytes` | Gauge | `service` | Mémoire résidente (RSS) |
| `nodejs_heap_size_used_bytes` | Gauge | `service` | Tas V8 utilisé |
| `nodejs_heap_size_total_bytes` | Gauge | `service` | Tas V8 total |
| `nodejs_eventloop_lag_seconds` | Gauge | `service` | Latence de l'event loop |
| `nodejs_active_handles` / `_requests` | Gauge | `service` | Handles/requêtes actifs |
| `nodejs_gc_duration_seconds` | Histogram | `service`, `kind` | Durée des cycles de garbage collection |

> Ces métriques par défaut sont fournies par `collectDefaultMetrics()`.

### 4.2 Métriques applicatives — Microservices IA (FastAPI)
| Métrique | Type | Labels | Description |
|----------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `handler`, `status` | Requêtes HTTP par endpoint |
| `http_request_duration_seconds` | Histogram | `method`, `handler` | Latence des requêtes |
| `http_request_size_bytes` / `http_response_size_bytes` | Summary | `handler` | Tailles requête/réponse |
| `python_gc_objects_collected_total` | Counter | `generation` | Objets collectés par le GC Python |
| `process_resident_memory_bytes` | Gauge | — | Mémoire résidente du process |
| `process_cpu_seconds_total` | Counter | — | Temps CPU cumulé |

### 4.3 Métriques conteneurs (cAdvisor)
| Métrique | Type | Description |
|----------|------|-------------|
| `container_cpu_usage_seconds_total` | Counter | CPU consommé par conteneur |
| `container_memory_usage_bytes` | Gauge | Mémoire utilisée par conteneur |
| `container_spec_memory_limit_bytes` | Gauge | Limite mémoire configurée |
| `container_network_receive_bytes_total` | Counter | Octets réseau reçus |
| `container_network_transmit_bytes_total` | Counter | Octets réseau émis |
| `container_fs_usage_bytes` | Gauge | Espace disque utilisé (FS conteneur) |

### 4.4 Métriques de la plateforme de supervision
| Métrique | Source | Description |
|----------|--------|-------------|
| `up` | Prometheus | Disponibilité de chaque cible scrapée (1=UP, 0=DOWN) |
| `scrape_duration_seconds` | Prometheus | Durée de chaque scrape |

### 4.5 Logs (Loki + Promtail)
Promtail collecte les **logs `stdout`/`stderr` de tous les conteneurs Docker** et
les pousse vers Loki. Données associées à chaque entrée :
| Champ | Description |
|-------|-------------|
| `container` | Nom du conteneur source |
| `stream` | `stdout` ou `stderr` |
| `job` | `docker` (étiquette commune) |
| horodatage | Timestamp de la ligne |
| message | Contenu brut (ex. logs Morgan du backend : méthode, URL, statut, durée) |

## 5. Tableau de bord Grafana

Dashboard provisionné [`healthai-overview.json`](../monitoring/grafana/dashboards/healthai-overview.json) :
1. **Disponibilité des services** (`up`) — backend + 4 IA.
2. **Débit requêtes backend** (req/s par code de statut).
3. **Latence backend p50/p95**.
4. **Taux d'erreurs 5xx**.
5. **CPU par conteneur** (cAdvisor).
6. **Mémoire par conteneur** (cAdvisor).
7. **Logs des conteneurs** (panneau Loki).

## 6. Alertes (Alertmanager)

Règles définies dans [`monitoring/prometheus/alerts.yml`](../monitoring/prometheus/alerts.yml) :
| Alerte | Condition | Sévérité |
|--------|-----------|----------|
| `ServiceDown` | `up == 0` pendant > 1 min | critical |
| `BackendHighErrorRate` | > 5 % d'erreurs 5xx sur 5 min | warning |
| `BackendHighLatency` | p95 > 2 s sur 5 min | warning |
| `ContainerHighMemory` | conteneur > 90 % de sa limite mémoire sur 5 min | warning |

Les alertes sont visibles dans l'UI Alertmanager (http://localhost:9093). Un
receiver Slack/e-mail peut être activé en décommentant la configuration dans
[`monitoring/alertmanager/alertmanager.yml`](../monitoring/alertmanager/alertmanager.yml).

## 7. Maintenance

- **Rétention** : 15 j pour Prometheus, 7 j pour Loki (paramétrable).
- **Ajout d'une cible** : éditer `scrape_configs` dans
  [`monitoring/prometheus/prometheus.yml`](../monitoring/prometheus/prometheus.yml).
- **Ajout d'un dashboard** : déposer un JSON dans `monitoring/grafana/dashboards/`
  (provisionnement automatique).
- **Identifiants Grafana** : modifiables via `GF_ADMIN_USER`/`GF_ADMIN_PASSWORD`.
