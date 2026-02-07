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
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="flex min-h-screen">
          <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur">
            <div className="px-6 py-4 border-b border-slate-800">
              <h1 className="text-lg font-semibold tracking-tight">
                Secure API Gateway
              </h1>
              <p className="text-xs text-slate-400">
                Control plane & data plane
              </p>
            </div>
            <nav className="px-3 py-4 space-y-1 text-sm">
              <Link
                href="/"
                className="block rounded-md px-3 py-2 hover:bg-slate-800"
              >
                Tenants
              </Link>
              <Link
                href="/gateway"
                className="block rounded-md px-3 py-2 hover:bg-slate-800"
              >
                Gateway Console
              </Link>
              <Link
                href="/metrics"
                className="block rounded-md px-3 py-2 hover:bg-slate-800"
              >
                Metrics
              </Link>
            </nav>
          </aside>
          <main className="flex-1">
            <header className="border-b border-slate-800 bg-slate-900/40 px-8 py-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">
                Admin Dashboard
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Backend: http://localhost:3000</span>
              </div>
            </header>
            <section className="p-8">{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
