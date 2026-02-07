"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api";

export default function MetricsPage() {
  const [adminToken, setAdminToken] = useState("");
  const [metrics, setMetrics] = useState("");
  const [health, setHealth] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    if (!adminToken) {
      setError("Admin token is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const metricsRes = await fetch(
        (process.env.NEXT_PUBLIC_GATEWAY_API_URL ?? "http://localhost:3000") +
          "/metrics",
        {
          headers: { "X-Admin-Token": adminToken },
        }
      );
      if (!metricsRes.ok) {
        throw new Error(
          `Metrics: ${metricsRes.status} ${metricsRes.statusText}`
        );
      }
      const text = await metricsRes.text();
      setMetrics(text);

      const healthRes = await fetch(
        (process.env.NEXT_PUBLIC_GATEWAY_API_URL ?? "http://localhost:3000") +
          "/api/health"
      );
      setHealth(healthRes.ok ? "OK" : `${healthRes.status} ${healthRes.statusText}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminToken) {
      void loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Observability</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-3">
            <h3 className="text-sm font-medium text-slate-200">
              Admin access
            </h3>
            <label className="text-xs text-slate-400">
              X-Admin-Token
              <input
                type="password"
                className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </label>
            <button
              onClick={loadAll}
              className="mt-2 w-full rounded-md bg-slate-800 px-3 py-1 text-[11px] text-slate-100 hover:bg-slate-700 disabled:opacity-50"
              disabled={loading || !adminToken}
            >
              {loading ? "Refreshing..." : "Refresh metrics"}
            </button>
            {error && (
              <p className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800 rounded-md px-2 py-1">
                {error}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs">
            <h3 className="text-sm font-medium text-slate-200 mb-1">Health</h3>
            <p
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                health === "OK"
                  ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                  : "bg-rose-900/50 text-rose-300 border border-rose-700"
              }`}
            >
              {health ?? "Unknown"}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Uses <code>/api/health</code> from the gateway.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs">
          <h3 className="text-sm font-medium text-slate-200 mb-2">
            Prometheus metrics
          </h3>
          <pre className="max-h-[500px] overflow-auto whitespace-pre font-mono text-[11px] text-slate-200">
            {metrics || "# No metrics loaded yet."}
          </pre>
        </div>
      </div>
    </div>
  );
}
