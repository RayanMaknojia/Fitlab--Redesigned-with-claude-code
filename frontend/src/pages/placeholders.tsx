import { Link } from "react-router-dom"

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

export function NotFound() {
  return (
    <Shell>
      <h1 className="text-xl font-semibold">404 — page not found</h1>
    </Shell>
  )
}
