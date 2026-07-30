import { Request, Response, NextFunction } from "express"

/* simple in-memory rate limiter
Current rate-limit behavior:
10 chatbot requests per 60 seconds
keyed by logged-in user id if available, otherwise IP*/

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 10

type Entry = {
  count: number
  resetAt: number
}

const requestsByActor = new Map<string, Entry>()

function getActorKey(req: Request) {
  return req.session.user?.id ?? req.ip ?? "unknown"
}

export function chatRateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now()
  const key = getActorKey(req)
  const current = requestsByActor.get(key)

  if (!current || now > current.resetAt) {
    requestsByActor.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
    next()
    return
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: "Too many requests. Please wait a moment and try again.",
    })
    return
  }

  current.count += 1
  requestsByActor.set(key, current)
  next()
}
