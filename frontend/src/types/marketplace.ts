// Marketplace types, matching listingController/notificationController's
// JSON response shapes on the backend.

export interface Listing {
  listing_id: string;
  user_id: string;
  role: "client" | "trainer";
  name: string;
  headline: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  | "link_request_received"
  | "link_request_accepted"
  | "link_request_declined";

export interface Notification {
  notification_id: string;
  type: NotificationType;
  link_request_id: string;
  message: string;
  read: boolean;
  created_at: string;
}
