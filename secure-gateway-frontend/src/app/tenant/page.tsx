"use client";

import { useState } from "react";

const BASE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_API_URL ?? "http://localhost:3000";

/* ---------------- TYPES ---------------- */

type AllowedRoute = {
  path: string;
  auth?: {
    jwt?: boolean;
  };
};

type TenantInfo = {
  id: string;
  name: string;
  allowedRoutes: AllowedRoute[];
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

/* ---------------- PAGE ---------------- */

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
    <div className="space-y-10 max-w-7xl">
      {/* HEADER */}
      <div>
        <h2 className="font-display text-xl">Tenant Dashboard</h2>
        <p className="text-xs text-muted mt-1">
          Tenant-scoped usage and access metrics
        </p>
      </div>

      {/* AUTH */}
      <div className="arch-panel space-y-4 max-w-2xl">
        <SectionTitle>Authentication</SectionTitle>

        <Field label="X-API-Key">
          <input
            type="password"
            className="input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk_live_••••••••"
          />
        </Field>

        <div className="flex justify-between items-center">
          <p className="text-[11px] text-muted">
            Used to scope all tenant requests
          </p>

          <button
            onClick={loadDashboard}
            disabled={!apiKey || loading}
            className="btn-primary text-sm"
          >
            {loading ? "Loading…" : "Load dashboard"}
          </button>
        </div>

        {error && <Notice kind="error">{error}</Notice>}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="space-y-4">
          <SkeletonPanel />
          <SkeletonGrid />
        </div>
      )}

      {/* CONTENT */}
      {!loading && tenant && metrics && (
        <div className="space-y-10">
          {/* TENANT INFO */}
          <div className="arch-panel space-y-6">
            <SectionTitle>Tenant</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Info label="Tenant ID" mono>
                {tenant.id}
              </Info>
              <Info label="Name">{tenant.name}</Info>
            </div>

            <div>
              <p className="text-[11px] text-muted uppercase tracking-wide mb-2">
                Allowed routes
              </p>

              <div className="flex flex-wrap gap-2">
                {tenant.allowedRoutes.map((r) => (
                  <span
                    key={r.path}
                    className="px-2 py-0.5 text-[11px] rounded bg-white/5 text-muted font-mono"
                  >
                    {r.path}
                    {r.auth?.jwt === false && (
                      <span className="ml-1 text-[10px] text-acid">
                        (no-jwt)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* METRICS */}
          <div className="space-y-4">
            <SectionTitle>Usage metrics</SectionTitle>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <Metric label="Total" value={metrics.requests.total} />
              <Metric
                label="Auth failures"
                value={metrics.requests.authFailures}
                danger
              />
              <Metric
                label="Route denied"
                value={metrics.requests.routeDenials}
              />
              <Metric
                label="Rate limited"
                value={metrics.requests.rateLimited}
              />
              <Metric
                label="Upstream errors"
                value={metrics.requests.upstreamErrors}
                danger
              />
              <Metric
                label="Internal errors"
                value={metrics.requests.internalErrors}
                danger
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs uppercase tracking-widest text-muted">
      {children}
    </h3>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[11px] text-muted uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  );
}

function Info({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted uppercase tracking-wide">
        {label}
      </p>
      <p className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}>
        {children}
      </p>
    </div>
  );
}

function Metric({
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
      className={`arch-panel text-center ${
        danger ? "text-red-400" : ""
      }`}
    >
      <p className="text-[11px] text-muted uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 text-2xl font-display">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Notice({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: React.ReactNode;
}) {
  const color =
    kind === "error" ? "text-red-400" : "text-acid";

  return (
    <div
      className={`text-xs ${color} border border-white/10 rounded-md px-3 py-2`}
    >
      {children}
    </div>
  );
}

function SkeletonPanel() {
  return <div className="arch-panel h-32 animate-pulse" />;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="arch-panel h-24 animate-pulse"
        />
      ))}
    </div>
  );
}
