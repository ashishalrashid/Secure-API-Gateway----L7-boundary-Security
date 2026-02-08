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

type Tenant = {
  id: string;
  name: string;
  idp: IdPConfig;
  allowedRoutes: string[];
  rateLimit?: RateLimit;
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
    if (adminToken) void loadTenants();
  }, [adminToken]);

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await adminFetch("/control-plane/tenants", {
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
            windowSeconds: form.windowSeconds,
            maxRequests: form.maxRequests,
          },
        }),
      });

      setSuccess(`Tenant '${form.id}' created`);
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

  async function updateRoutes(id: string, routes: string[]) {
    await adminFetch(`/control-plane/tenants/${id}/routes`, {
      method: "PUT",
      adminToken,
      body: JSON.stringify({ allowedRoutes: routes }),
    });
    await loadTenants();
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl">Tenants</h2>
          <p className="text-xs text-muted mt-1">
            Control-plane tenant provisioning and isolation
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
        {/* LEFT: ADMIN + CREATE */}
        <div className="space-y-6">
          <div className="arch-panel space-y-4">
            <SectionTitle>Admin authentication</SectionTitle>

            <Field label="X-Admin-Token">
              <input
                type="password"
                className="input"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </Field>

            <p className="text-[11px] text-muted">
              Required for all control-plane mutations
            </p>
          </div>

          <form
            onSubmit={handleCreateTenant}
            className="arch-panel space-y-5"
          >
            <SectionTitle>Create tenant</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tenant ID">
                <input
                  className="input"
                  value={form.id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, id: e.target.value }))
                  }
                  required
                />
              </Field>

              <Field label="Name">
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>

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

            <Field label="OIDC issuer">
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

            <div className="grid grid-cols-2 gap-3">
              <Field label="Window (s)">
                <input
                  type="number"
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

            <button
              type="submit"
              className="btn-primary w-full text-sm"
              disabled={!adminToken}
            >
              Create tenant
            </button>
          </form>

          {error && <Notice kind="error">{error}</Notice>}
          {success && <Notice kind="success">{success}</Notice>}
        </div>

        {/* RIGHT: TENANT LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Registered tenants</SectionTitle>
            <span className="text-xs text-muted">
              {tenants.length} total
            </span>
          </div>

          <div className="space-y-2">
            {tenants.map((t) => (
              <TenantRow
                key={t.id}
                tenant={t}
                onRotateKey={rotateKey}
                onUpdateRoutes={updateRoutes}
              />
            ))}

            {tenants.length === 0 && (
              <p className="text-xs text-muted">
                No tenants provisioned
              </p>
            )}
          </div>
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
  onUpdateRoutes: (id: string, routes: string[]) => Promise<void>;
}) {
  const [routes, setRoutes] = useState(tenant.allowedRoutes.join(","));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onUpdateRoutes(
      tenant.id,
      routes.split(",").map((r) => r.trim())
    );
    setSaving(false);
  }

  return (
    <div className="arch-panel space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{tenant.name}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-muted font-mono">
              {tenant.id}
            </span>
          </div>

          <p className="text-[11px] text-muted">
            Routes: {tenant.allowedRoutes.length} ·{" "}
            {tenant.rateLimit
              ? `${tenant.rateLimit.maxRequests}/${tenant.rateLimit.windowSeconds}s`
              : "No rate limit"}
          </p>
        </div>

        <button
          onClick={() => onRotateKey(tenant.id)}
          className="btn-ghost text-xs"
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
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary text-xs"
        >
          {saving ? "Saving…" : "Save routes"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- UI PRIMITIVES ---------------- */

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
    <div className={`text-xs ${color} border border-white/10 rounded-md px-3 py-2`}>
      {children}
    </div>
  );
}
