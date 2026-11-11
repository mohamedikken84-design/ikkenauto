import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseBrowserConfig } from "@/lib/supabase/env";

export async function createSupabaseServer() {
  const config = supabaseBrowserConfig();
  if (!config) throw new Error("Supabase is niet geconfigureerd.");
  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(items) {
        try {
          for (const item of items) cookieStore.set(item.name, item.value, item.options);
        } catch {
          // Server Components cannot set cookies. Server Actions and route handlers can.
          // An authenticated page must be refreshed through a route handler after expiry.
        }
      },
    },
  });
}