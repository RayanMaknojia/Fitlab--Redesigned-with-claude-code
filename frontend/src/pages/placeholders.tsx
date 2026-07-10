// ── PLACEHOLDER PAGES ──────────────────────────────────────────────────────
// with your real pages — the trainer side only navigates to these paths.


import { Link, useParams } from "react-router-dom"

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center text-foreground">
      {children}
      <Link to="/trainer" className="mt-2 text-sm underline underline-offset-4">
        ← Back to trainer dashboard
      </Link>
    </div>
  )
}

/** TODO: replace with the login page. */
export function LoginPlaceholder() {
  return (
    <Shell>
      <h1 className="text-xl font-semibold">Login page</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Placeholder — (user authentication & role management).
      </p>
    </Shell>
  )
}

/** TODO: replace with the client page. */
export function ClientPagePlaceholder() {
  const { clientId } = useParams()
  return (
    <Shell>
      <h1 className="text-xl font-semibold">Client page</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Placeholder for client <code className="font-mono">{clientId}</code> —
        the trainer dashboard routes here when a linked client is clicked.
        Replace this with the real client view (workout logs, progress
        dashboard, etc.).
      </p>
    </Shell>
  )
}

export function NotFound() {
  return (
    <Shell>
      <h1 className="text-xl font-semibold">404 — page not found</h1>
    </Shell>
  )
}
