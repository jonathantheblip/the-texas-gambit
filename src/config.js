/**
 * Shared-backend config. Same Supabase project the legacy app used.
 * The anon key is public by design (RLS-gated, 2-person family tool) — safe to
 * ship in the static build, same as the legacy index.html did. Override per-env
 * with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY if ever needed.
 */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://mxxymneemuofksoulxwp.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eHltbmVlbXVvZmtzb3VseHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2ODYwNzAsImV4cCI6MjA5MzI2MjA3MH0.2ph9Agj9XPGgqbRCQ7HKp0UfsTmdfxZFbohdH9n-V1E';

export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
