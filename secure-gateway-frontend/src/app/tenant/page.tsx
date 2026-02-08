"use client";

import { useEffect, useState } from "react";

type TenantInfo = {
  id: string;
  name: string;
  allowedRoutes: string[];
  idp: {
    issuer: string;
    audience: string;
    jwksUri: string;
  };
};

type TenantMetrics = {
  tenantId: string;
  requests: {
    total: number;
    rateLimited: number;
    authFailures: number;
    routeDenials: number;
    upstreamErrors: number;
    internalErrors: number;
  };
};

const BASE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_API_URL ?? "http://localhost:3000";

export default function TenantDashboard() {
  const [apiKey, setApiKey] = useState("");
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    try {
      const headers = { "X-API-Key": apiKey };

      const [tenantRes, metricsRes] = await Promise.all([
        fetch(`${BASE_URL}/tenant/me`, { headers }),
        fetch(`${BASE_URL}/tenant/metrics`, { headers }),
      ]);

      if (!tenantRes.ok || !metricsRes.ok) {
        throw new Error("Invalid API key or backend error");
      }

      setTenant(await tenantRes.json());
      setMetrics(await metricsRes.json());
    } catch (e: any) {
      setError(e.message);
      setTenant(null);
      setMetrics(null);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Tenant Dashboard</h2>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs">
        <label>
          X-API-Key
          <input
            type="password"
            className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>

        <button
          onClick={load}
          className="rounded-md bg-emerald-600 px-3 py-1 text-white text-xs hover:bg-emerald-500"
        >
          Load Dashboard
        </button>

        {error && (
          <p className="text-rose-400">{error}</p>
        )}
      </div>

      {tenant && metrics && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2">
            <h3 className="text-sm font-medium">Tenant Info</h3>
            <p><b>ID:</b> {tenant.id}</p>
            <p><b>Name:</b> {tenant.name}</p>
            <p><b>Allowed routes:</b></p>
            <ul className="list-disc ml-4">
              {tenant.allowedRoutes.map(r => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2">
            <h3 className="text-sm font-medium">Usage Metrics</h3>
            <p>Total requests: {metrics.requests.total}</p>
            <p>Auth failures: {metrics.requests.authFailures}</p>
            <p>Route denials: {metrics.requests.routeDenials}</p>
            <p>Rate limited: {metrics.requests.rateLimited}</p>
            <p>Upstream errors: {metrics.requests.upstreamErrors}</p>
            <p>Internal errors: {metrics.requests.internalErrors}</p>
          </div>
        </div>
      )}
    </div>
  );
}
