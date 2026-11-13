import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import AuthShell from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/lib/authApi"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await api.resetPassword({ token: token!, password })
      navigate("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    }
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm gap-6 border-0 bg-transparent py-0 shadow-none ring-0">
        <CardHeader className="px-0">
          <CardTitle className="font-display text-3xl font-bold tracking-tight">Set a new password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        {!token ? (
          <CardContent className="px-0 flex flex-col gap-4">
            <p className="text-sm text-destructive">
              This reset link is invalid or missing. Request a new one from the login page.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <CardContent className="px-0 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="border-0 bg-transparent px-0 flex flex-col gap-4">
              <Button type="submit" className="w-full press h-10 bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                Reset password
              </Button>
            </CardFooter>
          </form>
        )}
        <CardFooter className="border-0 bg-transparent px-0 flex flex-col gap-4 pt-0">
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  )
}
