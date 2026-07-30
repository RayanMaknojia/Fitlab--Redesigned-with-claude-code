import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Dumbbell } from "lucide-react"

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
    <div className="dark relative flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_15%_-10%,oklch(0.85_0.21_128/0.13),transparent),radial-gradient(ellipse_50%_35%_at_90%_110%,oklch(0.7_0.15_200/0.1),transparent)]"
      />

      <Card className="relative w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="flex size-9 items-center justify-center rounded-xl bg-lime-400 text-black shadow-[0_0_24px_-4px] shadow-lime-400/60">
            <Dumbbell className="size-5" />
          </div>
          <CardTitle className="mt-2 text-lg">Set a new password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        {!token ? (
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-destructive">
              This reset link is invalid or missing. Request a new one from the login page.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <CardContent className="flex flex-col gap-4">
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
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-lime-400 font-semibold text-black hover:bg-lime-300">
                Reset password
              </Button>
            </CardFooter>
          </form>
        )}
        <CardFooter className="flex flex-col gap-4 pt-0">
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-lime-400 underline-offset-4 hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
