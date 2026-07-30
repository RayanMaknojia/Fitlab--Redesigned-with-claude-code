// AI-generated progress recap.
// Owned by: Rayan Maknojia (progress dashboard / client view).
//
// Builds a short summary of the client's real stats/volume trend (from the
// already-merged clientApi.ts, backed by the real backend) and asks the
// shared /api/chat endpoint (Ricky's AI chatbot service) to turn it into a
// natural-language recap.
//
// Falls back to a locally-generated template recap if the chat endpoint
// isn't reachable yet (ai-chatbot-api not merged, GROQ_API_KEY not
// configured, rate limited, etc.) — this lets the feature work end-to-end
// tonight, and automatically switches to the real AI once the backend is in
// place tomorrow, with no code changes needed.

import { getStats, getWeeklyVolume } from "@/lib/clientApi"

const API_BASE = "http://localhost:3000/api"

export interface RecapResult {
  text: string
  source: "ai" | "fallback"
}

function pct(from: number, to: number): number {
  if (from === 0) return to > 0 ? 100 : 0
  return Math.round(((to - from) / from) * 100)
}

async function buildSummary() {
  const [stats, volume] = await Promise.all([getStats(), getWeeklyVolume()])

  const recentVolume = volume.slice(-4) // last ~4 weeks
  const firstVol = recentVolume[0]?.volume ?? 0
  const lastVol = recentVolume[recentVolume.length - 1]?.volume ?? 0

  return {
    total_sessions: stats.total_sessions,
    sessions_this_week: stats.sessions_this_week,
    current_streak_weeks: stats.current_streak_weeks,
    top_personal_bests: stats.personal_bests.slice(0, 3),
    weekly_volume_trend: recentVolume,
    volume_change_pct_last_4_weeks: pct(firstVol, lastVol),
  }
}

function fallbackRecap(summary: Awaited<ReturnType<typeof buildSummary>>): string {
  if (summary.total_sessions === 0) {
    return "No sessions logged yet. Log your first workout to start seeing a progress recap here."
  }

  const lines: string[] = []

  lines.push(
    `You've logged ${summary.total_sessions} session${
      summary.total_sessions === 1 ? "" : "s"
    } so far, with ${summary.sessions_this_week} this week.`
  )

  if (summary.current_streak_weeks > 0) {
    lines.push(
      `You're on a ${summary.current_streak_weeks}-week training streak — keep it going.`
    )
  }

  if (summary.top_personal_bests.length > 0) {
    const best = summary.top_personal_bests[0]
    lines.push(`Your top lift right now is ${best.exercise} at ${best.weight_in_kg} kg.`)
  }

  if (summary.volume_change_pct_last_4_weeks !== 0) {
    const direction = summary.volume_change_pct_last_4_weeks > 0 ? "up" : "down"
    lines.push(
      `Training volume is ${direction} ${Math.abs(
        summary.volume_change_pct_last_4_weeks
      )}% over the last few weeks.`
    )
  }

  return lines.join(" ")
}

export async function generateProgressRecap(): Promise<RecapResult> {
  const summary = await buildSummary()

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content:
              `Here is my current FitLab progress data as JSON:\n${JSON.stringify(
                summary,
                null,
                2
              )}\n\n` +
              "Write a short, encouraging 2-4 sentence progress recap based on this data. Do not invent numbers that aren't in the data.",
          },
        ],
      }),
    })

    if (!res.ok) throw new Error(`chat endpoint returned ${res.status}`)

    const data = await res.json()
    const text = data?.message?.content
    if (!text || typeof text !== "string") throw new Error("empty AI response")

    return { text, source: "ai" }
  } catch {
    // /api/chat isn't reachable yet — use the local fallback so the feature
    // still works end-to-end. No error surfaced to the user; this is
    // expected until Ricky's branch merges.
    return { text: fallbackRecap(summary), source: "fallback" }
  }
}