"use client";

import { useState } from "react";

const BASE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_API_URL ?? "http://localhost:3000";

type TenantInfo = {
  id: string;
  name: string;
  allowedRoutes: string[];
};

type TenantMetrics = {
  tenantId: string;
  requests: {
    total: number;
    authFailures: number;
    routeDenials: number;
    rateLimited: number;
    upstreamErrors: number;
    internalErrors: number;
  };
};

export default function TenantDashboard() {
  const [apiKey, setApiKey] = useState("");
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    setTenant(null);
    setMetrics(null);

    try {
      const headers = { "X-API-Key": apiKey };

      const [tenantRes, metricsRes] = await Promise.all([
        fetch(`${BASE_URL}/tenant/me`, { headers }),
        fetch(`${BASE_URL}/tenant/metrics`, { headers }),
      ]);

      if (!tenantRes.ok || !metricsRes.ok) {
        throw new Error("Invalid API key or gateway error");
      }

      setTenant(await tenantRes.json());
      setMetrics(await metricsRes.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Tenant Dashboard
        </h1>
        <p className="text-slate-400">
          Monitor your gateway usage, health, and access limits.
        </p>
      </div>

      {/* API Key Input Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium text-slate-300">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              placeholder="Paste your tenant API key (sk_...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <button
            onClick={loadDashboard}
            disabled={!apiKey || loading}
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {loading ? <Spinner /> : "Load Data"}
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-md bg-rose-950/30 p-3 text-sm text-rose-400 border border-rose-900/50">
            Error: {error}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="animate-pulse space-y-8">
          <div className="h-48 rounded-xl bg-slate-800/50" />
          <SkeletonGrid />
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && tenant && metrics && (
        <div className="space-y-8">
          {/* Tenant Info Card */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm">
            <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
              <h3 className="font-semibold text-slate-200">Tenant Overview</h3>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Tenant ID
                </p>
                <p className="mt-1 font-mono text-sm text-slate-300">{tenant.id}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Name
                </p>
                <p className="mt-1 text-sm font-medium text-slate-200">{tenant.name}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  Allowed Routes
                </p>
                <div className="flex flex-wrap gap-2">
                  {tenant.allowedRoutes.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-slate-700/50"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-slate-200">
              Usage Metrics
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard label="Total Requests" value={metrics.requests.total} />
              <MetricCard label="Auth Failures" value={metrics.requests.authFailures} danger />
              <MetricCard label="Route Denials" value={metrics.requests.routeDenials} />
              <MetricCard label="Rate Limited" value={metrics.requests.rateLimited} />
              <MetricCard label="Upstream Errors" value={metrics.requests.upstreamErrors} danger />
              <MetricCard label="Internal Errors" value={metrics.requests.internalErrors} danger />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------ UI Components ------------------ */

function MetricCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md ${
        danger
          ? "border-rose-900/50 bg-rose-950/10 hover:border-rose-800/50"
          : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
      }`}
    >
      <dt className="truncate text-sm font-medium text-slate-400">{label}</dt>
      <dd className={`mt-2 text-3xl font-bold tracking-tight ${danger ? "text-rose-400" : "text-slate-100"}`}>
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-xl bg-slate-800/50 animate-pulse"
        />
      ))}
    </div>
  );
}
