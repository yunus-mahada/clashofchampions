import { createClient } from '@supabase/supabase-js';

export const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In AI Studio preview or local development, use same-origin proxy
    // to prevent browser CORS and iframe sandbox fetch restrictions
    if (
      window.location.hostname.includes('run.app') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return `${window.location.origin}/supabase-proxy`;
    }
  }
  return (
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    'https://ofznazmfrstcrtiwgsrm.supabase.co'
  );
};

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mem5hem1mcnN0Y3J0aXdnc3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NzIzOTksImV4cCI6MjEwNjM0ODM5OX0.2Y1a-OP7too3qHdiuBEGmwtu0ZhcMW6DPx8GNRScsxg';

/**
 * Global Supabase Client with Realtime WebSocket support
 */
export const supabase = createClient(getSupabaseUrl(), SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});
