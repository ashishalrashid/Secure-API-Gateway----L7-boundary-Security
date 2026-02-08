"use client";

import { useEffect, useState } from "react";

export default function MetricsPage() {
  const [adminToken, setAdminToken] = useState("");
  const [metrics, setMetrics] = useState("");
  const [health, setHealth] = useState<"OK" | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBackendUrl = (path: string) => {
    const base =
      process.env.NEXT_PUBLIC_GATEWAY_API_URL ??
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  };

  async function loadAll() {
    if (!adminToken) {
      setError("Admin token required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const metricsRes = await fetch(getBackendUrl("metrics"), {
        headers: { "X-Admin-Token": adminToken },
      });

      if (!metricsRes.ok) {
        throw new Error(
          `Metrics: ${metricsRes.status} ${metricsRes.statusText}`
        );
      }

      setMetrics(await metricsRes.text());

      const healthRes = await fetch(getBackendUrl("api/health"));
      setHealth(
        healthRes.ok
          ? "OK"
          : `${healthRes.status} ${healthRes.statusText}`
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminToken) void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl">
            Observability
          </h2>
          <p className="text-xs text-muted mt-1">
            Gateway health and Prometheus metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-10">
        {/* LEFT: ACCESS + STATUS */}
        <div className="space-y-6">
          {/* Admin access */}
          <div className="arch-panel space-y-4">
            <SectionTitle>Admin access</SectionTitle>

            <Field label="X-Admin-Token">
              <input
                type="password"
                className="input"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </Field>

            <button
              onClick={loadAll}
              disabled={loading || !adminToken}
              className="btn-primary text-sm w-full"
            >
              {loading ? "Refreshing…" : "Refresh metrics"}
            </button>

            {error && (
              <Notice kind="error">{error}</Notice>
            )}
          </div>

          {/* Health */}
          <div className="arch-panel space-y-3">
            <SectionTitle>Gateway health</SectionTitle>

            <HealthIndicator status={health} />

            <p className="text-[11px] text-muted">
              Sourced from <code>/api/health</code>
            </p>
          </div>

          {/* Docs */}
          <div className="arch-panel space-y-2">
            <SectionTitle>References</SectionTitle>
            <ul className="text-[11px] space-y-1">
              <li>
                <a
                  href="https://prometheus.io/docs/concepts/metric_types/"
                  target="_blank"
                  className="link"
                >
                  Prometheus metric types
                </a>
              </li>
              <li>
                <a
                  href="https://prometheus.io/docs/practices/naming/"
                  target="_blank"
                  className="link"
                >
                  Prometheus naming conventions
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT: METRICS */}
        <div className="arch-panel flex flex-col">
          <SectionTitle>Raw Prometheus metrics</SectionTitle>

          <div className="mt-3 flex-1 rounded-md border border-white/10 bg-black/50 overflow-auto">
            <pre className="p-4 text-[11px] font-mono text-slate-200 whitespace-pre">
              {metrics || "# Metrics not loaded"}
            </pre>
          </div>

          <p className="mt-3 text-[11px] text-muted">
            Exposed for scraping by Prometheus-compatible collectors
          </p>
        </div>
      </div>
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
    <label className="space-y-1">
      <span className="text-[11px] text-muted uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  );
}

function HealthIndicator({
  status,
}: {
  status: string | null;
}) {
  if (!status) {
    return (
      <span className="text-xs text-muted">
        Unknown
      </span>
    );
  }

  const ok = status === "OK";

  return (
    <div
      className={`
        inline-flex items-center gap-2
        px-3 py-1 rounded-full text-xs
        border border-white/10
        ${ok ? "text-acid" : "text-red-400"}
      `}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ok ? "bg-acid" : "bg-red-400"
        }`}
      />
      {status}
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
