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
      const text = await res.text();
      setResponseText(text);
    } catch (err: any) {
      setResponseText(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gateway Console</h2>
        <p className="text-[11px] text-slate-500">
          Sends requests to /api/&lt;proxyPath&gt; with X-API-Key.
        </p>
      </div>

      <form
        onSubmit={handleSend}
        className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs"
      >
        <div className="grid grid-cols-4 gap-3">
          <label className="col-span-2">
            X-API-Key
            <input
              type="password"
              className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </label>
          <label className="col-span-1">
            Method
            <select
              className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
              value={method}
              onChange={(e) => setMethod(e.target.value as "GET" | "POST")}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </label>
          <label className="col-span-1">
            Proxy path
            <input
              className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1"
              value={proxyPath}
              onChange={(e) => setProxyPath(e.target.value)}
              placeholder="api/service-a/foo"
              required
            />
          </label>
        </div>

        {method === "POST" && (
          <label className="block">
            JSON body
            <textarea
              className="mt-1 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 font-mono text-[11px] min-h-[100px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
        )}

        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send request"}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-200">Status</h3>
            <span className="text-[11px] text-slate-400">
              {status ?? "—"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Typical codes: 200 OK, 401 Unauthorized, 403 Forbidden, 429 Too
            Many Requests.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs">
          <h3 className="text-sm font-medium text-slate-200 mb-2">Response</h3>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-slate-200">
            {responseText || "No response yet."}
          </pre>
        </div>
      </div>
    </div>
  );
}
