import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** null when the env vars are missing, so the site still works (demo mode) without a backend. */
export const supabase = url && key ? createClient(url, key) : null;

export type BookingRow = {
  id: string;
  created_at: string;
  check_in: string;
  check_out: string;
  guests: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  notes: string | null;
  total: number | null;
  status: "pending" | "confirmed" | "declined" | "blocked";
};
