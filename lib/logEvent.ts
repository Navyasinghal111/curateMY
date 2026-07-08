import type { SupabaseClient } from '@supabase/supabase-js'

export type EventType =
  | 'homepage_visit'
  | 'signup_start'
  | 'signup_complete'
  | 'email_confirmed'
  | 'storefront_view'
  | 'redirect_click'
  | 'dashboard_product_add'

// Fire-and-forget analytics log — a logging failure must never block the
// real flow it's attached to. Never pass email, name, phone, or any other
// personal info in metadata; this table is meant to stay fully anonymous.
export async function logEvent(
  supabase: SupabaseClient,
  eventType: EventType,
  opts?: { creatorId?: string | null; productId?: string | null; metadata?: Record<string, unknown> }
) {
  try {
    await supabase.from('events').insert({
      event_type: eventType,
      creator_id: opts?.creatorId ?? null,
      product_id: opts?.productId ?? null,
      metadata: opts?.metadata ?? null,
    })
  } catch {}
}
