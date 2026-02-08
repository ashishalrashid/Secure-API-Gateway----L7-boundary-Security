import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Secure API Gateway",
  description: "Multi-tenant API gateway control plane UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen flex overflow-hidden">
        {/* Global ambient background */}
        <div className="pointer-events-none absolute inset-0 bg-noise" />
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="pointer-events-none absolute inset-0 bg-radial" />

          {/* LEFT RAIL */}
          <aside className="relative z-10 w-[260px] shrink-0 border-r border-white/10 bg-black/40 backdrop-blur-xl">
            {/* Brand */}
            <div className="px-6 py-6 border-b border-white/10">
              <h1 className="font-display text-lg tracking-tight">
                Secure API Gateway
              </h1>
              <p className="text-xs text-muted mt-1">
                Control & Data Plane
              </p>
            </div>

            {/* Nav */}
            <nav className="px-3 py-6 space-y-1 text-sm">
              <NavItem href="/" label="Tenants" />
              <NavItem href="/gateway" label="Gateway Console" />
              <NavItem href="/metrics" label="Metrics" />
            </nav>

            {/* Rail footer */}
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-white/10 text-xs text-muted">
              Environment: <span className="text-acid">local</span>
            </div>
          </aside>

          {/* MAIN AREA */}
          <div className="relative z-10 flex-1 flex flex-col">
            {/* TOP BAR */}
            <header className="h-14 flex items-center justify-between px-8 border-b border-white/10 bg-black/30 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="text-xs tracking-widest text-acid">
                  ADMIN
                </span>
                <span className="text-sm text-muted">
                  Secure Gateway Platform
                </span>
              </div>

              <div className="flex items-center gap-6 text-xs text-muted">
                <StatusDot label="API" value="localhost:3000" />
                <StatusDot label="MODE" value="development" />
              </div>
            </header>

            {/* CONTENT */}
            <main className="flex-1 px-10 py-10">
              {children}
            </main>

            {/* FOOTER / STATUS BAR */}
            <footer className="h-10 flex items-center justify-between px-8 border-t border-white/10 bg-black/30 text-xs text-muted">
              <span>Gateway v0.1.0</span>
              <span>All actions audited</span>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}

/* ---------------- COMPONENTS ---------------- */

function NavItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="
        block rounded-md px-4 py-2
        text-muted
        hover:text-acid
        hover:bg-white/5
        transition
      "
    >
      {label}
    </Link>
  );
}

function StatusDot({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-acid shadow-[0_0_8px_rgba(28,255,154,0.6)]" />
      <span>{label}:</span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}
