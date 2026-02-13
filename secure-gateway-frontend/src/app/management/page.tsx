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
  const [success, setSuccess] = useState<string | null>(null);

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
    setSuccess(null);

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

      setSuccess(`Tenant '${form.id}' created`);
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

  async function rotateKey(id: string): Promise<string> {
    const res = await adminFetch<{ apiKey: string }>(
      `/control-plane/tenants/${id}/apikey`,
      { method: "POST", adminToken }
    );
    return res.apiKey;
  }

  async function updateRoutes(id: string, routes: AllowedRoute[]) {
    await adminFetch(`/control-plane/tenants/${id}/routes`, {
      method: "PUT",
      adminToken,
      body: JSON.stringify({ allowedRoutes: routes }),
    });
    await loadTenants();
  }

  async function updateUpstream(id: string, upstreamBaseUrl: string) {
    await adminFetch(`/control-plane/tenants/${id}/upstream`, {
      method: "PUT",
      adminToken,
      body: JSON.stringify({ upstreamBaseUrl }),
    });
    setSuccess(`Upstream updated for ${id}`);
    await loadTenants();
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

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-10">
        {/* LEFT */}
        <div className="space-y-6">
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

            <SectionTitle>Rate limiting</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Window (seconds)">
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={form.windowSeconds}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      windowSeconds: Number(e.target.value),
                    }))
                  }
                />
              </Field>

              <Field label="Max requests">
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={form.maxRequests}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxRequests: Number(e.target.value),
                    }))
                  }
                />
              </Field>
            </div>

            <SectionTitle>Optional IdP</SectionTitle>

            <Field label="Issuer">
              <input
                className="input"
                value={form.issuer}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issuer: e.target.value }))
                }
              />
            </Field>

            <Field label="JWKS URI">
              <input
                className="input"
                value={form.jwksUri}
                onChange={(e) =>
                  setForm((f) => ({ ...f, jwksUri: e.target.value }))
                }
              />
            </Field>

            <Field label="Audience">
              <input
                className="input"
                value={form.audience}
                onChange={(e) =>
                  setForm((f) => ({ ...f, audience: e.target.value }))
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
          {success && <Notice kind="success">{success}</Notice>}
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
              onUpdateUpstream={updateUpstream}
            />
          ))}
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
  onUpdateUpstream,
}: {
  tenant: Tenant;
  onRotateKey: (id: string) => Promise<string>;
  onUpdateRoutes: (id: string, routes: AllowedRoute[]) => Promise<void>;
  onUpdateUpstream: (id: string, upstream: string) => Promise<void>;
}) {
  const [routes, setRoutes] = useState(
    tenant.allowedRoutes.map((r) => r.path).join(",")
  );
  const [upstream, setUpstream] = useState(tenant.upstreamBaseUrl);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function saveRoutes() {
    await onUpdateRoutes(
      tenant.id,
      routes.split(",").map((r) => ({ path: r.trim() }))
    );
  }

  async function handleRotate() {
    const key = await onRotateKey(tenant.id);
    setApiKey(key);
    setCopied(false);
  }

  async function copyKey() {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
  }

  return (
    <div className="arch-panel space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <strong>{tenant.name}</strong>
          <div className="text-[11px] text-muted font-mono">
            {tenant.id}
          </div>
        </div>

        <button
          className="btn-ghost text-xs"
          onClick={handleRotate}
        >
          Rotate key
        </button>
      </div>

      {apiKey && (
        <div className="space-y-2">
          <div className="text-[11px] text-red-400">
            ⚠️ This key is shown once. Store it securely.
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] bg-black/40 px-2 py-1 rounded border border-white/10 font-mono">
              {apiKey}
            </code>

            <button
              className="btn-ghost text-xs"
              onClick={copyKey}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <SectionTitle>Upstream</SectionTitle>
        <input
          className="input font-mono"
          value={upstream}
          onChange={(e) => setUpstream(e.target.value)}
        />

        <button
          className="btn-primary text-xs"
          onClick={() =>
            onUpdateUpstream(tenant.id, upstream)
          }
        >
          Save upstream
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
        <button className="btn-primary text-xs" onClick={saveRoutes}>
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
      <span className="text-[11px] text-muted uppercase">
        {label}
      </span>
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
