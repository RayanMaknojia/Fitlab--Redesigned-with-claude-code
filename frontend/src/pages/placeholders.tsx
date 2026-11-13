import { Link } from "react-router-dom"

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center text-foreground">
      {children}
      <Link to="/" className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline">
        ← Back to FitLab
      </Link>
    </div>
  )
}

export function NotFound() {
  return (
    <Shell>
      <h1 className="font-display text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">The page you were looking for doesn&apos;t exist or has moved.</p>
    </Shell>
  )
}
