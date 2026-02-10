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

  async function rotateKey(id: string) {
    setError(null);
    setSuccess(null);
    try {
      const res = await adminFetch<{ apiKey: string }>(
        `/control-plane/tenants/${id}/apikey`,
        { method: "POST", adminToken }
      );
      setSuccess(`New API key for ${id}: ${res.apiKey}`);
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

  // 🔴 UPSTREAM EDIT (NEW)
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

      {/* MAIN GRID */}
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
              onUpdateUpstream={updateUpstream} // 🔴 NEW
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
  onRotateKey: (id: string) => void;
  onUpdateRoutes: (id: string, routes: AllowedRoute[]) => Promise<void>;
  onUpdateUpstream: (id: string, upstream: string) => Promise<void>;
}) {
  const [routes, setRoutes] = useState(
    tenant.allowedRoutes.map((r) => r.path).join(",")
  );

  // 🔴 UPSTREAM STATE (NEW)
  const [editingUpstream, setEditingUpstream] = useState(false);
  const [upstreamDraft, setUpstreamDraft] = useState(tenant.upstreamBaseUrl);
  const [savingUpstream, setSavingUpstream] = useState(false);

  async function saveRoutes() {
    await onUpdateRoutes(
      tenant.id,
      routes.split(",").map((r) => ({ path: r.trim() }))
    );
  }

  // 🔴 UPSTREAM SAVE (NEW)
  async function saveUpstream() {
    setSavingUpstream(true);
    await onUpdateUpstream(tenant.id, upstreamDraft);
    setSavingUpstream(false);
    setEditingUpstream(false);
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
          onClick={() => onRotateKey(tenant.id)}
        >
          Rotate key
        </button>
      </div>

      {/* 🔴 UPSTREAM EDIT (NEW) */}
      <div className="space-y-2">
        <SectionTitle>Upstream (live traffic)</SectionTitle>

        {!editingUpstream ? (
          <div className="flex items-center justify-between gap-3">
            <code className="text-[11px] bg-black/40 px-2 py-1 rounded border border-white/10">
              {tenant.upstreamBaseUrl}
            </code>

            <button
              className="btn-ghost text-xs text-red-400"
              onClick={() => setEditingUpstream(true)}
            >
              Edit upstream
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              className="input font-mono"
              value={upstreamDraft}
              onChange={(e) => setUpstreamDraft(e.target.value)}
            />

            <div className="text-[11px] text-red-400">
              ⚠️ Changing this affects live traffic immediately
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="btn-ghost text-xs"
                onClick={() => {
                  setUpstreamDraft(tenant.upstreamBaseUrl);
                  setEditingUpstream(false);
                }}
              >
                Cancel
              </button>

              <button
                className="btn-primary text-xs"
                disabled={savingUpstream}
                onClick={saveUpstream}
              >
                {savingUpstream ? "Saving…" : "Save upstream"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ROUTES */}
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
