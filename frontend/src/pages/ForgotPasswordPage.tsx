import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
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
import { api } from "@/lib/api"

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
          <CardTitle className="mt-2 text-lg">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        {submitted ? (
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              If an account exists for that email, we've sent a link to reset your password.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <CardContent className="flex flex-col gap-4">
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
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-lime-400 font-semibold text-black hover:bg-lime-300">
                Send reset link
              </Button>
            </CardFooter>
          </form>
        )}
        <CardFooter className="flex flex-col gap-4 pt-0">
          <p className="text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="text-lime-400 underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
