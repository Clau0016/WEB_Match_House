import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const db = supabase as unknown as SupabaseClient;
export const euro = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
export const errorText = (error: unknown) => error && typeof error === "object" && "message" in error ? String(error.message) : "Operazione non riuscita. Riprova.";
export const verified = (session: Session | null) => Boolean(session?.user.email_confirmed_at);

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
      const { data } = db.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        setLoading(false);
      });
      return () => data.subscription.unsubscribe();
    } catch {
      setLoading(false);
      return undefined;
    }
  }, []);
  return { session, loading };
}

export async function checked<R extends { error: unknown }>(request: PromiseLike<R>): Promise<R extends { data: infer T } ? T : undefined> {
  const result = await request;
  if (result.error) throw result.error;
  return ("data" in result ? result.data : undefined) as R extends { data: infer T } ? T : undefined;
}

export async function uploadFiles(bucket: string, userId: string, files: File[]) {
  const paths: string[] = [];
  try {
    for (const file of files) {
      const extension = file.name.split(".").at(-1)?.replace(/[^a-z0-9]/gi, "") || "bin";
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      await checked(db.storage.from(bucket).upload(path, file));
      paths.push(path);
    }
    return paths;
  } catch (error) {
    if (paths.length) await db.storage.from(bucket).remove(paths);
    throw error;
  }
}
