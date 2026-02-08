import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative space-y-32">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 cyber-grid opacity-[0.06]" />

      {/* Hero */}
      <section className="relative max-w-4xl space-y-8">
        <span className="inline-block text-xs tracking-widest text-emerald-400/80 uppercase">
          Secure Infrastructure Layer
        </span>

        <h1 className="text-5xl font-semibold tracking-tight leading-tight">
          Secure, observable,
          <br />
          <span className="text-emerald-400 glow-emerald">
            multi-tenant API Gateway
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl">
          A production-grade gateway designed for isolation, correctness,
          and visibility — protecting upstream services without exposing
          control surfaces.
        </p>

        <div className="flex gap-4 pt-4">
          <Link
            href="/gateway"
            className="relative rounded-md bg-emerald-500/90 px-6 py-2.5 text-sm font-medium text-black
                       hover:bg-emerald-400 transition
                       shadow-[0_0_20px_rgba(16,185,129,0.35)]"
          >
            Try Gateway
          </Link>
          <Link
            href="/tenant"
            className="rounded-md border border-slate-700/80 px-6 py-2.5 text-sm
                       hover:border-emerald-400/60 hover:text-emerald-400 transition"
          >
            Tenant Dashboard
          </Link>
        </div>
      </section>

      {/* Failure modes */}
      <section className="space-y-12">
        <h2 className="text-2xl font-semibold">
          Why gateways fail in practice
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <ProblemCard
            index="01"
            title="Uncontrolled access"
            description="Weak authentication and shared credentials lead to abuse, data leakage, and cascading outages."
          />
          <ProblemCard
            index="02"
            title="Shared blast radius"
            description="Without tenant isolation, one noisy client can degrade the entire platform."
          />
          <ProblemCard
            index="03"
            title="Zero attribution"
            description="Failures without tenant-level metrics are impossible to debug or explain."
          />
        </div>
      </section>

      {/* Protection */}
      <section className="space-y-12">
        <h2 className="text-2xl font-semibold">
          What this gateway protects you from
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Tenant isolation"
            description="Every request is cryptographically attributed. No cross-tenant access paths."
          />
          <FeatureCard
            title="Layered authentication"
            description="API keys, JWT validation, and strict route allow-listing enforced at the edge."
          />
          <FeatureCard
            title="Rate limiting"
            description="Per-tenant limits contain abuse and protect upstream services."
          />
          <FeatureCard
            title="Upstream protection"
            description="Clear separation of gateway faults vs upstream failures."
          />
          <FeatureCard
            title="Observability built-in"
            description="Latency, error rates, and traffic metrics with tenant attribution."
          />
          <FeatureCard
            title="Strict control plane"
            description="Only administrators mutate state. Tenants never touch gateway internals."
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="space-y-12">
        <h2 className="text-2xl font-semibold">
          Designed like real infrastructure
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <ArchitectureCard
            title="Control plane"
            accent="emerald"
            points={[
              "Tenant provisioning",
              "Key rotation",
              "Route & IdP configuration",
              "Admin-only mutation",
            ]}
          />
          <ArchitectureCard
            title="Data plane"
            accent="cyan"
            points={[
              "High-throughput proxying",
              "Authentication & authorization",
              "Rate limiting",
              "Metrics & structured logs",
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-12 text-center space-y-5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />

        <h3 className="relative text-xl font-semibold">
          Built for learning — structured like production
        </h3>
        <p className="relative text-slate-400 max-w-xl mx-auto">
          This project focuses on isolation, observability, and correctness —
          the concerns that matter once real users exist.
        </p>
        <div className="relative flex justify-center gap-4 pt-2">
          <Link
            href="/metrics"
            className="rounded-md border border-slate-700 px-5 py-2 text-sm
                       hover:border-emerald-400/60 hover:text-emerald-400 transition"
          >
            View Metrics
          </Link>
          <Link
            href="/gateway"
            className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-medium text-black
                       hover:bg-emerald-400 transition"
          >
            Explore Gateway
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Components ---------------- */

function ProblemCard({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-lg border border-slate-800 bg-slate-900/60 p-6 space-y-3">
      <span className="absolute top-4 right-4 text-xs text-emerald-400/40">
        {index}
      </span>
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 space-y-2
                    hover:border-emerald-400/40 transition">
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

function ArchitectureCard({
  title,
  points,
  accent,
}: {
  title: string;
  points: string[];
  accent: "emerald" | "cyan";
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-7 space-y-4">
      <h4 className={`font-medium text-${accent}-400`}>
        {title}
      </h4>
      <ul className="list-disc ml-4 text-sm text-slate-400 space-y-1">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
