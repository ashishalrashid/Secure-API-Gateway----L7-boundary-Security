"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api";

type IdPConfig = {
  issuer: string;
  jwksUri: string;
  audience: string;
};

type RateLimit = {
  windowSeconds: number;
  maxRequests: number;
};

type Tenant = {
  id: string;
  name: string;
  idp: IdPConfig;
  allowedRoutes: string[];
  rateLimit?: RateLimit;
};

export default function TenantsPage() {
  const [adminToken, setAdminToken] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for create tenant
  const [form, setForm] = useState({
    id: "",
    name: "",
    issuer: "",
    jwksUri: "",
    audience: "",
    allowedRoutes: "/api/service-a,/api/service-b",
    windowSeconds: 60,
    maxRequests: 100,
  });

  async function loadTenants() {
    if (!adminToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<Tenant[]>("/control-plane/tenants", {
        method: "GET",
        adminToken,
      });
      setTenants(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // optionally auto-load when admin token changes
    if (adminToken) {
      void loadTenants();
    }
  }, [adminToken]);

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken) {
      setError("Admin token is required");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await adminFetch<unknown>("/control-plane/tenants", {
        method: "POST",
        adminToken,
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          idp: {
            issuer: form.issuer,
            jwksUri: form.jwksUri,
            audience: form.audience,
          },
          allowedRoutes: form.allowedRoutes
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean),
          rateLimit: {
            windowSeconds: Number(form.windowSeconds),
            maxRequests: Number(form.maxRequests),
          },
        }),
      });
      setSuccess("Tenant created");
      setForm({
        id: "",
        name: "",
        issuer: "",
        jwksUri: "",
        audience: "",
        allowedRoutes: "/api/service-a,/api/service-b",
        windowSeconds: 60,
        maxRequests: 100,
      });
      await loadTenants();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleRotateKey(id: string) {
    if (!adminToken) {
      setError("Admin token is required");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const data = await adminFetch<{ apiKey: string; warning?: string }>(
        `/control-plane/tenants/${id}/apikey`,
        {
          method: "POST",
          adminToken,
        }
      );
      setSuccess(`New API key for ${id}: ${data.apiKey}`);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleUpdateRoutes(id: string, routes: string) {
    if (!adminToken) {
      setError("Admin token is required");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await adminFetch<unknown>(`/control-plane/tenants/${id}/routes`, {
        method: "PUT",
        adminToken,
        body: JSON.stringify({
          allowedRoutes: routes
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean),
        }),
      });
      setSuccess("Routes updated");
      await loadTenants();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tenants</h2>
        <button
          className="rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
          onClick={loadTenants}
          disabled={loading || !adminToken}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Admin token + create form */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-200">
              Admin authentication
            </h3>
            <label className="text-xs text-slate-400">
              X-Admin-Token
              <input
                type="password"
                className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-xs"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="paste admin token"
              />
            </label>
            <p className="text-[11px] text-slate-500">
              This token is sent as the <code>X-Admin-Token</code> header to all
              control-plane endpoints.
            </p>
          </div>

          <form
            onSubmit={handleCreateTenant}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3"
          >
            <h3 className="text-sm font-medium text-slate-200">
              Create tenant
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="col-span-1">
                ID
                <input
                  className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
                  value={form.id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, id: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="col-span-1">
                Name
                <input
                  className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="col-span-2">
                Allowed routes (comma-separated)
                <input
                  className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
                  value={form.allowedRoutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      allowedRoutes: e.target.value,
                    }))
                  }
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="col-span-2">
                IdP issuer
                <input
                  className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
                  value={form.issuer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, issuer: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="col-span-2">
                JWKS URI
                <input
                  className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
                  value={form.jwksUri}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, jwksUri: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="col-span-2">
                Audience
                <input
                  className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
                  value={form.audience}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, audience: e.target.value }))
                  }
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label>
                Window (s)
                <input
                  type="number"
                  className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
                  value={form.windowSeconds}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      windowSeconds: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Max requests
                <input
                  type="number"
                  className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
                  value={form.maxRequests}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxRequests: Number(e.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              disabled={!adminToken}
            >
              Create tenant
            </button>
          </form>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800 rounded-md px-3 py-2 break-words">
              {success}
            </div>
          )}
        </div>

        {/* Tenants list */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-200">
              Existing tenants
            </h3>
            <p className="text-[11px] text-slate-500">
              {tenants.length} tenant(s)
            </p>
          </div>
          <div className="space-y-3">
            {tenants.map((t) => (
              <TenantCard
                key={t.id}
                tenant={t}
                onRotateKey={handleRotateKey}
                onUpdateRoutes={handleUpdateRoutes}
              />
            ))}
            {tenants.length === 0 && (
              <p className="text-xs text-slate-500">
                No tenants yet. Create one using the form on the left.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TenantCard({
  tenant,
  onRotateKey,
  onUpdateRoutes,
}: {
  tenant: Tenant;
  onRotateKey: (id: string) => void;
  onUpdateRoutes: (id: string, routes: string) => void;
}) {
  const [routes, setRoutes] = useState(tenant.allowedRoutes.join(","));
  const [updating, setUpdating] = useState(false);

  async function handleUpdate() {
    setUpdating(true);
    try {
      await onUpdateRoutes(tenant.id, routes);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-sm font-semibold text-slate-100">
              {tenant.name}
            </h4>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
              {tenant.id}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Routes: {tenant.allowedRoutes.length} · Rate limit:{" "}
            {tenant.rateLimit
              ? `${tenant.rateLimit.maxRequests}/${tenant.rateLimit.windowSeconds}s`
              : "not set"}
          </p>
        </div>
        <button
          onClick={() => onRotateKey(tenant.id)}
          className="rounded-md bg-slate-800 px-3 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
        >
          Rotate API key
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-3">
          Allowed routes (comma-separated)
          <input
            className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
            value={routes}
            onChange={(e) => setRoutes(e.target.value)}
          />
        </label>
        <div className="col-span-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            IdP: {tenant.idp.issuer}
          </div>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="rounded-md bg-slate-800 px-3 py-1 text-[11px] text-slate-100 hover:bg-slate-700 disabled:opacity-50"
          >
            {updating ? "Saving..." : "Save routes"}
          </button>
        </div>
      </div>
    </div>
  );
}
