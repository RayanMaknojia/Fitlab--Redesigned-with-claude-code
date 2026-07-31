// Admin types, matching adminController/authController's JSON response
// shapes on the backend.

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "client" | "trainer" | "admin";
  blocked?: boolean;
}

export interface AdminListing {
  listing_id: string;
  user_id: string;
  role: "client" | "trainer";
  name: string;
  headline: string;
  bio: string;
  status: "active" | "removed";
  removed_reason: string | null;
  created_at: string;
  updated_at: string;
}
