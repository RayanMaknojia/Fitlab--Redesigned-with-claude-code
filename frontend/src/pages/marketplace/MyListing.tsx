import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { deleteMyListing, getMyListing, upsertMyListing } from "@/lib/listingsApi"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function MyListing() {
  const { user } = useAuth()
  const [headline, setHeadline] = useState("")
  const [bio, setBio] = useState("")
  const [hasListing, setHasListing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const listing = await getMyListing()
    setHeadline(listing?.headline ?? "")
    setBio(listing?.bio ?? "")
    setHasListing(listing !== null)
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = setTimeout(refresh, 0)
    return () => clearTimeout(id)
  }, [refresh])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await upsertMyListing(headline, bio)
      setHasListing(true)
      setNotice("Your listing is live.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await deleteMyListing()
      setHeadline("")
      setBio("")
      setHasListing(false)
      setNotice("Your listing has been taken down.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const subtitle =
    user?.role === "client"
      ? "Advertise that you're seeking a trainer so trainers can find you."
      : "Advertise your services so clients looking for a trainer can find you."

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My listing<span className="text-lime-400">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? "Loading..." : subtitle}
        </p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      ) : (
        <Card className="border-border/60 bg-card/60 py-5 backdrop-blur">
          <CardHeader className="px-5">
            <CardTitle className="text-sm">
              {hasListing ? "Edit your listing" : "Create your listing"}
            </CardTitle>
            <CardDescription>
              Visible to every {user?.role === "client" ? "trainer" : "client"} browsing the marketplace.
            </CardDescription>
          </CardHeader>
          <form onSubmit={save}>
            <CardContent className="flex flex-col gap-4 px-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  placeholder="e.g. Strength coach, 10 years experience"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={6}
                  placeholder="Tell people a bit about yourself and what you're looking for."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {notice && !error && <p className="text-sm text-lime-600">{notice}</p>}
            </CardContent>
            <CardFooter className="justify-between px-5">
              {hasListing ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={remove}
                >
                  <Trash2 data-icon="inline-start" /> Take down
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="submit"
                disabled={busy || !headline.trim() || !bio.trim()}
                className="bg-lime-400 font-semibold text-black hover:bg-lime-300"
              >
                {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {hasListing ? "Save changes" : "Post listing"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}
