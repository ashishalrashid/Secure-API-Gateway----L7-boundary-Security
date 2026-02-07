import client from 'prom-client';

export const register = new client.Registry();

// Node / process metrics
client.collectDefaultMetrics({ register });

/* -----------------------
   GATEWAY METRICS
----------------------- */

export const gatewayRequestsTotal = new client.Counter({
  name: 'gateway_requests_total',
  help: 'Total requests through gateway',
  labelNames: ['tenantId', 'status'],
});

export const gatewayAuthFailuresTotal = new client.Counter({
  name: 'gateway_auth_failures_total',
  help: 'Authentication failures',
  labelNames: ['tenantId', 'reason'],
});

export const gatewayRouteDenialsTotal = new client.Counter({
  name: 'gateway_route_denials_total',
  help: 'Route access denials',
  labelNames: ['tenantId'],
});

export const gatewayRateLimitedTotal = new client.Counter({
  name: 'gateway_rate_limited_total',
  help: 'Rate limited requests',
  labelNames: ['tenantId'],
});

export const gatewayUpstreamErrorsTotal = new client.Counter({
  name: 'gateway_upstream_errors_total',
  help: 'Upstream service errors',
  labelNames: ['tenantId'],
});

export const gatewayInternalErrorsTotal = new client.Counter({
  name: 'gateway_internal_errors_total',
  help: 'Internal gateway errors',
  labelNames: ['type'],
});

export const gatewayLatencyMs = new client.Histogram({
  name: 'gateway_latency_ms',
  help: 'End-to-end request latency',
  labelNames: ['tenantId', 'status'],
  buckets: [50, 100, 200, 400, 800, 1500, 3000],
});

export const gatewayUpstreamLatencyMs = new client.Histogram({
  name: 'gateway_upstream_latency_ms',
  help: 'Latency of upstream calls',
  labelNames: ['tenantId', 'upstream'],
  buckets: [50, 100, 200, 400, 800, 1500, 3000],
});

export const gatewayInflightRequests = new client.Gauge({
  name: 'gateway_inflight_requests',
  help: 'Current in-flight requests',
});

/* -----------------------
   CONTROL PLANE METRICS
----------------------- */

export const controlRequestsTotal = new client.Counter({
  name: 'control_requests_total',
  help: 'Control plane requests',
  labelNames: ['endpoint', 'status'],
});

export const controlMutationsTotal = new client.Counter({
  name: 'control_mutations_total',
  help: 'Control plane state mutations',
  labelNames: ['action'],
});

export const controlErrorsTotal = new client.Counter({
  name: 'control_errors_total',
  help: 'Control plane errors',
});

export const controlLatencyMs = new client.Histogram({
  name: 'control_latency_ms',
  help: 'Control plane latency',
  labelNames: ['endpoint'],
  buckets: [50, 100, 200, 400, 800, 1500],
});

/* -----------------------
   REGISTER ALL
----------------------- */

const metrics = [
  gatewayRequestsTotal,
  gatewayAuthFailuresTotal,
  gatewayRouteDenialsTotal,
  gatewayRateLimitedTotal,
  gatewayUpstreamErrorsTotal,
  gatewayInternalErrorsTotal,
  gatewayLatencyMs,
  gatewayUpstreamLatencyMs,
  gatewayInflightRequests,
  controlRequestsTotal,
  controlMutationsTotal,
  controlErrorsTotal,
  controlLatencyMs,
] as client.Metric<string>[];

metrics.forEach(m => register.registerMetric(m));