import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* HERO */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-14 pb-24">
        <div className="max-w-3xl space-y-8">
          <p className="text-xs tracking-[0.3em] text-acid">
            SECURE INFRASTRUCTURE LAYER
          </p>

          <h1 className="text-6xl leading-[1.05] font-display">
            Multi tenant API
            <br />
            <span className="text-acid glow">
              Gateway Platform
            </span>
          </h1>

          <p className="text-lg text-muted max-w-xl">
            A production grade edge layer enforcing isolation, authentication,
            rate limits and observability, without trusting clients or leaking
            control.
          </p>

          <div className="flex gap-6 pt-4">
            <Link href="/gateway" className="btn-primary">
              Enter Gateway
            </Link>
            <Link href="/tenant" className="btn-ghost">
              Tenant Console
            </Link>
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
<section className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-14">
    <Stat
      value="Secure"
      label="Asymmetric JWT validation"
      description="Public key verification via JWKS; no shared signing secrets."
    />
    <Stat
      value="Stateless"
      label="data plane"
      description="No request affinity or in memory state; due to Redis backed externalization."
    />
    <Stat
      value="Scalable"
      label="Horizontally"
      description="Multiple gatway instances can be added without coordination"
    />
    <Stat
      value="Structured"
      label="observability"
      description="Per tenant metrics, latency histograms, and error attribution."
    />
    
    
  </div>
</section>


      {/* DIVIDER */}
      <SectionDivider label="FAILURE MODES" />

      {/* FAILURE MODES */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-28 grid grid-cols-1 md:grid-cols-3 gap-16">
        <Failure
          index="01"
          title="No isolation"
          body="Shared credentials and weak attribution cause cross tenant data exposure."
        />
        <Failure
          index="02"
          title="Unbounded clients"
          body="One noisy consumer can degrade upstream services for everyone."
        />
        <Failure
          index="03"
          title="Blind operations"
          body="Without tenant level metrics, failures cannot be explained or debugged."
        />
      </section>

      {/* DIVIDER */}
      <SectionDivider label="ARCHITECTURE" />

      {/* ARCHITECTURE */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-32 grid md:grid-cols-2 gap-20">
        <Architecture
          title="Control Plane"
          accent="acid"
          items={[
            "Tenant provisioning",
            "Key rotation",
            "Route allow lists",
            "Admin only mutation",
          ]}
        />
        <Architecture
          title="Data Plane"
          accent="cyan"
          items={[
            "High throughput proxying",
            "JWT & API key enforcement",
            "Rate limiting",
            "Metrics & structured logs",
          ]}
        />
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-40">
        <div className="cta-panel">
          <h3 className="text-2xl font-display">
            Designed like real infrastructure
          </h3>
          <p className="text-muted max-w-xl">
            This project prioritizes correctness, blast radius containment,
            and observability — the things that matter after your first outage.
          </p>

          <div className="flex gap-6 pt-6">
            <Link href="/metrics" className="btn-ghost">
              View Metrics
            </Link>
            <Link href="/gateway" className="btn-primary">
              Explore Platform
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Stat({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <div className="text-5xl font-display text-acid glow">
        {value}
      </div>
      <div className="text-sm tracking-wide uppercase">
        {label}
      </div>
      <p className="text-muted text-sm">
        {description}
      </p>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-8">
      <div className="divider-line" />
      <span className="divider-label">{label}</span>
    </div>
  );
}

function Failure({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-4">
      <span className="text-acid text-xs">{index}</span>
      <h4 className="text-xl font-display">{title}</h4>
      <p className="text-muted">{body}</p>
    </div>
  );
}

function Architecture({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "acid" | "cyan";
}) {
  return (
    <div className={`arch-panel arch-${accent}`}>
      <h4 className="font-display text-2xl">{title}</h4>
      <ul className="space-y-3 text-muted">
        {items.map((i) => (
          <li key={i}>— {i}</li>
        ))}
      </ul>
    </div>
  );
}
