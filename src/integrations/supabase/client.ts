import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let client: SupabaseClient<Database> | undefined;

export function getSupabase() {
  if (client) return client;
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Configura l’URL e la chiave pubblicabile Supabase.");
  client = createClient<Database>(url, key);
  return client;
}
