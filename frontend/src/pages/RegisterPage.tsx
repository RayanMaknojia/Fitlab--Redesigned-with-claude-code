import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Dumbbell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/lib/authApi"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"client" | "trainer">("client")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await api.register({ name, email, password, role })
      navigate("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
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
          <CardTitle className="mt-2 text-lg">Create your account</CardTitle>
          <CardDescription>Join FitLab as a client or trainer.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as "client" | "trainer")}
              className="flex gap-4"
            >
              <Label className="flex items-center gap-2 font-normal">
                <RadioGroupItem
                  value="client"
                  className="data-checked:border-lime-400 data-checked:bg-lime-400 data-checked:text-black"
                />
                Client
              </Label>
              <Label className="flex items-center gap-2 font-normal">
                <RadioGroupItem
                  value="trainer"
                  className="data-checked:border-lime-400 data-checked:bg-lime-400 data-checked:text-black"
                />
                Trainer
              </Label>
            </RadioGroup>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-lime-400 font-semibold text-black hover:bg-lime-300">
              Register
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-lime-400 underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
