// Client-side schedule API, backed by the existing schedule routes:
//   GET    /api/clients/me/schedules                          (own schedule)
//   POST   /api/clients/:clientId/schedules                   (book for self)
//   DELETE /api/schedules/:scheduleId                         (cancel)
//   POST   /api/clients/me/schedules/:id/reschedule-response  (accept/decline)

import type { RescheduleRequest } from "@/types"
import { request } from "@/lib/request"

/** One row from GET /api/clients/me/schedules (scheduleService.ClientScheduleEntry). */
export interface ClientScheduleEntry {
  schedule_id: string
  trainer_id: string | null
  trainer_name: string | null
  start_time: string // ISO datetime
  duration_in_minutes: number
  reschedule_request: RescheduleRequest | null
}

export function getMySchedules(): Promise<ClientScheduleEntry[]> {
  return request("/clients/me/schedules")
}

export async function bookSession(
  clientId: string,
  input: { start_time: string; duration_in_minutes: number },
): Promise<void> {
  await request(`/clients/${clientId}/schedules`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function cancelSession(scheduleId: string): Promise<void> {
  return request(`/schedules/${scheduleId}`, { method: "DELETE" })
}

export async function respondToReschedule(
  scheduleId: string,
  action: "accept" | "decline",
): Promise<void> {
  await request(`/clients/me/schedules/${scheduleId}/reschedule-response`, {
    method: "POST",
    body: JSON.stringify({ action }),
  })
}
