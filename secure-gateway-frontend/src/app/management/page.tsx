"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api";

/* ---------------- TYPES ---------------- */

type IdPConfig = {
  issuer: string;
  jwksUri: string;
  audience: string;
};

type RateLimit = {
  windowSeconds: number;
  maxRequests: number;
};

type AllowedRoute = {
  path: string;
  auth?: {
    jwt?: boolean;
  };
};

type Tenant = {
  id: string;
  name: string;
  upstreamBaseUrl: string;
  idp?: IdPConfig;
  allowedRoutes: AllowedRoute[];
  rateLimit: RateLimit;
};

/* ---------------- PAGE ---------------- */

export default function TenantsPage() {
  const [adminToken, setAdminToken] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rotatedKey, setRotatedKey] = useState<{
    tenantId: string;
    apiKey: string;
  } | null>(null);

  const [form, setForm] = useState({
    id: "",
    name: "",
    upstreamBaseUrl: "http://localhost:3000",
    issuer: "",
    jwksUri: "",
    audience: "",
    allowedRoutes: "/health,/service",
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
    if (adminToken) void loadTenants();
  }, [adminToken]);

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const routes: AllowedRoute[] = form.allowedRoutes
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)
      .map((path) => ({ path }));

    const idp =
      form.issuer && form.jwksUri && form.audience
        ? {
            issuer: form.issuer,
            jwksUri: form.jwksUri,
            audience: form.audience,
          }
        : undefined;

    try {
      await adminFetch("/control-plane/tenants", {
        method: "POST",
        adminToken,
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          upstreamBaseUrl: form.upstreamBaseUrl,
          idp,
          allowedRoutes: routes,
          rateLimit: {
            windowSeconds: form.windowSeconds,
            maxRequests: form.maxRequests,
          },
        }),
      });

      setForm({
        id: "",
        name: "",
        upstreamBaseUrl: "http://localhost:3000",
        issuer: "",
        jwksUri: "",
        audience: "",
        allowedRoutes: "/health,/service",
        windowSeconds: 60,
        maxRequests: 100,
      });
      await loadTenants();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function rotateKey(id: string) {
    setError(null);
    try {
      const res = await adminFetch<{ apiKey: string }>(
        `/control-plane/tenants/${id}/apikey`,
        { method: "POST", adminToken }
      );

      setRotatedKey({
        tenantId: id,
        apiKey: res.apiKey,
      });
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function updateRoutes(id: string, routes: AllowedRoute[]) {
    await adminFetch(`/control-plane/tenants/${id}/routes`, {
      method: "PUT",
      adminToken,
      body: JSON.stringify({ allowedRoutes: routes }),
    });
    await loadTenants();
  }

  function copyKey() {
    if (!rotatedKey) return;
    navigator.clipboard.writeText(rotatedKey.apiKey);
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl">Tenants</h2>
          <p className="text-xs text-muted mt-1">
            Control-plane tenant provisioning
          </p>
        </div>

        <button
          onClick={loadTenants}
          disabled={!adminToken || loading}
          className="btn-ghost text-xs"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ROTATED KEY PANEL */}
      {rotatedKey && (
        <div className="arch-panel space-y-3 border border-acid/30">
          <div className="flex items-center justify-between">
            <strong className="text-sm">
              New API key for <span className="font-mono">{rotatedKey.tenantId}</span>
            </strong>
            <button
              onClick={copyKey}
              className="btn-ghost text-xs"
            >
              Copy
            </button>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-md p-3 font-mono text-xs break-all">
            {rotatedKey.apiKey}
          </div>

          <p className="text-[11px] text-muted">
            ⚠️ This key is shown only once. Store it securely. It cannot be recovered later.
          </p>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-10">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="arch-panel space-y-4">
            <Field label="X-Admin-Token">
              <input
                type="password"
                className="input"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </Field>
          </div>

          <form onSubmit={handleCreateTenant} className="arch-panel space-y-5">
            <SectionTitle>Create tenant</SectionTitle>

            <Field label="Tenant ID">
              <input
                className="input"
                value={form.id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, id: e.target.value }))
                }
              />
            </Field>

            <Field label="Name">
              <input
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </Field>

            <Field label="Upstream base URL">
              <input
                className="input font-mono"
                value={form.upstreamBaseUrl}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    upstreamBaseUrl: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Allowed routes">
              <input
                className="input font-mono"
                value={form.allowedRoutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    allowedRoutes: e.target.value,
                  }))
                }
              />
            </Field>

            <button
              className="btn-primary w-full text-sm"
              disabled={!adminToken}
            >
              Create tenant
            </button>
          </form>

          {error && <Notice kind="error">{error}</Notice>}
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <SectionTitle>Registered tenants</SectionTitle>

          {tenants.map((t) => (
            <TenantRow
              key={t.id}
              tenant={t}
              onRotateKey={rotateKey}
              onUpdateRoutes={updateRoutes}
            />
          ))}

          {tenants.length === 0 && (
            <p className="text-xs text-muted">No tenants provisioned</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function TenantRow({
  tenant,
  onRotateKey,
  onUpdateRoutes,
}: {
  tenant: Tenant;
  onRotateKey: (id: string) => void;
  onUpdateRoutes: (id: string, routes: AllowedRoute[]) => Promise<void>;
}) {
  const [routes, setRoutes] = useState(
    tenant.allowedRoutes.map((r) => r.path).join(",")
  );

  async function save() {
    await onUpdateRoutes(
      tenant.id,
      routes.split(",").map((r) => ({ path: r.trim() }))
    );
  }

  return (
    <div className="arch-panel space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <strong>{tenant.name}</strong>
          <div className="text-[11px] text-muted font-mono">{tenant.id}</div>
        </div>

        <button
          className="btn-ghost text-xs"
          onClick={() => onRotateKey(tenant.id)}
        >
          Rotate key
        </button>
      </div>

      <Field label="Allowed routes">
        <input
          className="input font-mono"
          value={routes}
          onChange={(e) => setRoutes(e.target.value)}
        />
      </Field>

      <div className="flex justify-end">
        <button className="btn-primary text-xs" onClick={save}>
          Save routes
        </button>
      </div>
    </div>
  );
}

/* ---------------- UI ---------------- */

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
      <span className="text-[11px] text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

function Notice({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`text-xs ${
        kind === "error" ? "text-red-400" : "text-acid"
      }`}
    >
      {children}
    </div>
  );
}
