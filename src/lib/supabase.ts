import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Falso mientras no estén cargadas las variables de entorno. */
export const supabaseListo = Boolean(url && anonKey);

// Los valores de reserva evitan que el build falle si todavía no hay claves.
export const supabase = createClient(
  url || "https://sin-configurar.supabase.co",
  anonKey || "sin-configurar",
  { auth: { persistSession: true, autoRefreshToken: true } },
);
