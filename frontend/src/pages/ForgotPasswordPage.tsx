import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await api.forgotPassword({ email })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm gap-6 border-0 bg-transparent py-0 shadow-none ring-0">
        <CardHeader className="px-0">
          <CardTitle className="font-display text-3xl font-bold tracking-tight">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        {submitted ? (
          <CardContent className="px-0 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              If an account exists for that email, we've sent a link to reset your password.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <CardContent className="px-0 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="border-0 bg-transparent px-0 flex flex-col gap-4">
              <Button type="submit" className="w-full press h-10 bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                Send reset link
              </Button>
            </CardFooter>
          </form>
        )}
        <CardFooter className="border-0 bg-transparent px-0 flex flex-col gap-4 pt-0">
          <p className="text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  )
}
