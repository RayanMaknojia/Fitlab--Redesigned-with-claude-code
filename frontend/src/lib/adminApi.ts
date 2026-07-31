import { request } from "@/lib/request";
import type { AdminListing, AdminUser } from "@/types/admin";

export async function getAllUsers(): Promise<AdminUser[]> {
  return request<AdminUser[]>("/users");
}

export async function blockUser(userId: string): Promise<void> {
  await request<void>(`/admin/users/${userId}/block`, { method: "PATCH" });
}

export async function unblockUser(userId: string): Promise<void> {
  await request<void>(`/admin/users/${userId}/unblock`, { method: "PATCH" });
}

export async function getAllListings(): Promise<AdminListing[]> {
  return request<AdminListing[]>("/admin/listings");
}

export async function removeListing(
  listingId: string,
  reason?: string,
): Promise<void> {
  await request<void>(`/admin/listings/${listingId}/remove`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
