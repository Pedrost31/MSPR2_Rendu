import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Registre dédié + métriques système par défaut (CPU, mémoire, event loop, GC…).
export const register = new client.Registry();
register.setDefaultLabels({ service: 'healthai-backend' });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP traitées',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/** Mesure la durée et compte chaque requête HTTP (hors endpoint /metrics). */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path === '/metrics') return next();
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = (req.route?.path as string) ?? req.path;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
};

/** Expose les métriques au format Prometheus. */
export const metricsHandler = async (_req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
