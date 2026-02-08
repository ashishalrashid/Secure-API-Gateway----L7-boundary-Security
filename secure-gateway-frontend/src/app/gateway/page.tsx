"use client";

import { useState } from "react";
import { apiKeyFetch } from "@/lib/api";

export default function GatewayConsolePage() {
  const [apiKey, setApiKey] = useState("");
  const [proxyPath, setProxyPath] = useState("api/health");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [body, setBody] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setResponseText("");

    try {
      const res = await apiKeyFetch(`/${proxyPath}`, {
        apiKey,
        method,
        body: method === "POST" ? body : undefined,
        headers:
          method === "POST"
            ? { "Content-Type": "application/json" }
            : undefined,
      });

      setStatus(res.status);
      setResponseText(await res.text());
    } catch (err: any) {
      setResponseText(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-xl">
            Gateway Console
          </h2>
          <p className="text-xs text-muted">
            Send authenticated requests through the data plane
          </p>
        </div>

        <span className="text-[11px] text-muted">
          Target: <span className="text-acid">/api/&lt;proxyPath&gt;</span>
        </span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8">
        {/* REQUEST */}
        <form
          onSubmit={handleSend}
          className="arch-panel space-y-5"
        >
          <SectionTitle>Request</SectionTitle>

          <Field label="X-API-Key">
            <input
              type="password"
              className="input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Method">
              <select
                className="input select"
                value={method}
                onChange={(e) =>
                  setMethod(e.target.value as "GET" | "POST")
                }
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </Field>

            <Field label="Proxy path" className="col-span-2">
              <input
                className="input font-mono"
                value={proxyPath}
                onChange={(e) => setProxyPath(e.target.value)}
                required
              />
            </Field>
          </div>

          {method === "POST" && (
            <Field label="JSON body">
              <textarea
                className="textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted">
              Uses <code>X-API-Key</code> header
            </span>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-sm"
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>
        </form>

        {/* RESPONSE */}
        <div className="arch-panel flex flex-col gap-4">
          <SectionTitle>Response</SectionTitle>

          {/* Status row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              HTTP Status - Note : Render Free tier may take upto a minute for first request
            </span>
            <StatusBadge status={status} />
          </div>

          {/* Body */}
          <div className="flex-1 rounded-md border border-white/10 bg-black/40 p-3 overflow-auto">
            <pre className="text-[11px] font-mono text-slate-200 whitespace-pre-wrap break-words">
              {responseText || "// no response yet"}
            </pre>
          </div>

          {/* Docs */}
          <div className="pt-2 border-t border-white/10 space-y-1">
            <p className="text-[11px] text-muted">
              HTTP status code references:
            </p>
            <ul className="text-[11px] space-y-0.5">
              <li>
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200"
                  target="_blank"
                  className="link"
                >
                  200 OK — MDN
                </a>
              </li>
              <li>
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401"
                  target="_blank"
                  className="link"
                >
                  401 Unauthorized — MDN
                </a>
              </li>
              <li>
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403"
                  target="_blank"
                  className="link"
                >
                  403 Forbidden — MDN
                </a>
              </li>
              <li>
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429"
                  target="_blank"
                  className="link"
                >
                  429 Too Many Requests — MDN
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- PRIMITIVES ---------------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">
      {children}
    </h3>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-1 ${className}`}>
      <span className="text-[11px] text-muted uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: number | null }) {
  if (!status) {
    return <span className="text-xs text-muted">—</span>;
  }

  const ok = status >= 200 && status < 300;

  return (
    <span
      className={`
        px-2 py-0.5 rounded text-xs font-mono
        border border-white/10
        ${ok ? "text-acid" : "text-red-400"}
      `}
    >
      {status}
    </span>
  );
}
