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

  return (
    <div className="space-y-10">
      <h2 className="font-display text-xl">Tenants</h2>

      <form onSubmit={handleCreateTenant} className="arch-panel space-y-4">
        <Field label="Admin token">
          <input
            type="password"
            className="input"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
          />
        </Field>

        <Field label="Tenant ID">
          <input
            className="input"
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
          />
        </Field>

        <Field label="Name">
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>

        <Field label="Upstream Base URL">
          <input
            className="input font-mono"
            value={form.upstreamBaseUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, upstreamBaseUrl: e.target.value }))
            }
          />
        </Field>

        <Field label="Allowed routes (comma-separated)">
          <input
            className="input font-mono"
            value={form.allowedRoutes}
            onChange={(e) =>
              setForm((f) => ({ ...f, allowedRoutes: e.target.value }))
            }
          />
        </Field>

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

        <button className="btn-primary" disabled={!adminToken}>
          Create tenant
        </button>
      </form>

      {error && <Notice kind="error">{error}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}

      <SectionTitle>Registered tenants</SectionTitle>

      {tenants.map((t) => (
        <TenantRow
          key={t.id}
          tenant={t}
          onRotateKey={rotateKey}
          onUpdateRoutes={updateRoutes}
        />
      ))}
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
    <div className="arch-panel space-y-2">
      <strong>{tenant.name}</strong>
      <div className="text-xs text-muted">{tenant.id}</div>

      <Field label="Allowed routes">
        <input
          className="input font-mono"
          value={routes}
          onChange={(e) => setRoutes(e.target.value)}
        />
      </Field>

      <button className="btn-ghost text-xs" onClick={() => onRotateKey(tenant.id)}>
        Rotate API key
      </button>

      <button className="btn-primary text-xs" onClick={save}>
        Save routes
      </button>
    </div>
  );
}

/* ---------------- UI ---------------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs uppercase tracking-widest text-muted">{children}</h3>
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
