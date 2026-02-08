import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Secure API Gateway",
  description: "Multi-tenant API gateway platform",
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
          {/* Global background */}
          <div className="pointer-events-none absolute inset-0 bg-noise" />
          <div className="pointer-events-none absolute inset-0 bg-grid" />
          <div className="pointer-events-none absolute inset-0 bg-radial" />

          {/* LEFT NAV */}
          <aside className="relative z-10 w-[260px] shrink-0 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col">
            {/* Brand */}
            <div className="px-6 py-6 border-b border-white/10">
              <h1 className="font-display text-lg tracking-tight">
                Secure API Gateway
              </h1>
              <p className="text-xs text-muted mt-1">
                Multi-tenant edge platform
              </p>
            </div>

            {/* TENANT SECTION */}
            <nav className="px-3 py-6 space-y-1 text-sm">
              <NavSection title="Tenant">
                <NavItem href="/" label="Home" />
                <NavItem href="/gateway" label="Gateway Console" />
                <NavItem href="/tenant" label="Tenant Metrics" />
              </NavSection>
            </nav>

            {/* DIVIDER */}
            <div className="mx-6 my-2 divider-line opacity-30" />
            
            {/* PROJECT LINKS */}
                <div className="px-6 py-4 flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    Project
                  </p>

                  <FooterLink
                    href="https://github.com/ashishalrashid/Secure-API-Gateway----L7-boundary-Security"
                    label="Source Repository"
                  />

                  <FooterLink
                    href="https://github.com/ashishalrashid"
                    label="Author GitHub"
                  />
                </div>

            {/* ADMIN SECTION */}
            <nav className="px-3 py-4 space-y-1 text-sm mt-auto">
              <NavSection title="Admin">
                <NavItem href="/management" label="Tenant Management" admin />
                <NavItem href="/metrics" label="Platform Metrics" admin />
              </NavSection>

              <p className="px-3 pt-3 text-[10px] text-muted">
                Admin access required
              </p>
            </nav>

            {/* ENV FOOTER */}
            <div className="px-6 py-4 border-t border-white/10 text-xs text-muted">
              Environment: <span className="text-acid">local</span>
            </div>
          </aside>

          {/* MAIN AREA */}
          <div className="relative z-10 flex-1 flex flex-col">
            {/* TOP BAR */}
            <header className="h-14 flex items-center justify-between px-8 border-b border-white/10 bg-black/30 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="text-xs tracking-widest text-acid">
                  PLATFORM
                </span>
                <span className="text-sm text-muted">
                  Secure API Gateway
                </span>
              </div>

              <div className="flex items-center gap-6 text-xs text-muted">
                <StatusDot label="MODE" value="development" />
                <StatusDot label="API" value="localhost:3000" />
              </div>
            </header>

            {/* CONTENT */}
            <main className="flex-1 px-10 py-10">
              {children}
            </main>

            {/* FOOTER */}
            <footer className="h-10 flex items-center justify-between px-8 border-t border-white/10 bg-black/30 text-xs text-muted">
              <span>Gateway v0.1.0</span>
              <span>All control-plane actions audited</span>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}

/* ---------------- NAV COMPONENTS ---------------- */

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-[10px] uppercase tracking-widest text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

function NavItem({
  href,
  label,
  admin,
}: {
  href: string;
  label: string;
  admin?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        block rounded-md px-4 py-2
        transition
        ${
          admin
            ? "text-red-300/80 hover:text-red-300 hover:bg-red-500/10"
            : "text-muted hover:text-acid hover:bg-white/5"
        }
      `}
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
      <span className="h-1.5 w-1.5 rounded-full bg-acid" />
      <span>{label}:</span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}


function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        inline-flex items-center gap-2
        text-[11px]
        text-muted
        hover:text-acid
        transition
      "
    >
      <GitHubIcon />
      {label}
    </a>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 fill-current"
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.5 5.74.5 12.04c0 5.1 3.29 9.43 7.86 10.96.58.11.79-.25.79-.56v-2.04c-3.2.7-3.87-1.55-3.87-1.55-.52-1.33-1.27-1.69-1.27-1.69-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.56-.29-5.25-1.29-5.25-5.74 0-1.27.45-2.31 1.18-3.13-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.18 1.2a11 11 0 0 1 5.8 0c2.2-1.51 3.17-1.2 3.17-1.2.63 1.59.24 2.77.12 3.06.74.82 1.18 1.86 1.18 3.13 0 4.46-2.7 5.44-5.27 5.73.41.36.77 1.07.77 2.16v3.2c0 .31.21.68.8.56 4.56-1.53 7.85-5.86 7.85-10.96C23.5 5.74 18.27.5 12 .5z" />
    </svg>
  );
}
