// AI-generated progress recap card.
// Owned by: Rayan Maknojia (progress dashboard / client view).

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"

import { generateProgressRecap } from "@/lib/recapApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProgressRecapCard() {
  const [recap, setRecap] = useState<string | null>(null)
  const [source, setSource] = useState<"ai" | "fallback" | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateProgressRecap()
      setRecap(result.text)
      setSource(result.source)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)] py-5">
      <CardHeader className="flex-row items-center justify-between gap-4 px-5">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-primary" />
          AI progress recap
        </CardTitle>
        {source === "fallback" && (
          <Badge variant="secondary" className="text-[10px]">
            offline summary
          </Badge>
        )}
      </CardHeader>
      <CardContent className="px-5">
        {!recap && !loading && !error && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Get a quick AI-written summary of how your training is going.
            </p>
            <Button
              size="sm"
              className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={generate}
            >
              Generate recap
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Thinking through your recent training…
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {recap && !loading && (
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed">{recap}</p>
            <Button size="sm" variant="outline" onClick={generate} className="self-start">
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}