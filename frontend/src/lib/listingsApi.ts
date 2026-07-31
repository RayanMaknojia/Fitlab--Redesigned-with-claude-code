import { request } from "@/lib/request";
import type { Listing } from "@/types/marketplace";
import type { LinkRequest } from "@/types";

export async function upsertMyListing(
  headline: string,
  bio: string,
): Promise<Listing> {
  return request<Listing>("/me/listing", {
    method: "PUT",
    body: JSON.stringify({ headline, bio }),
  });
}

export async function getMyListing(): Promise<Listing | null> {
  const { listing } = await request<{ listing: Listing | null }>("/me/listing");
  return listing;
}

export async function deleteMyListing(): Promise<void> {
  await request<void>("/me/listing", { method: "DELETE" });
}

export async function browseListings(): Promise<Listing[]> {
  return request<Listing[]>("/listings/browse");
}

export async function getListing(listingId: string): Promise<Listing> {
  return request<Listing>(`/listings/${listingId}`);
}

export async function getListingByUser(userId: string): Promise<Listing> {
  return request<Listing>(`/listings/by-user/${userId}`);
}

export async function connectToListing(listingId: string): Promise<LinkRequest> {
  return request<LinkRequest>(`/listings/${listingId}/connect`, {
    method: "POST",
  });
}
