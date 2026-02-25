
import { supabase } from './supabase/client';

export async function ensureProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) 
    return;

  // Check if a profile row already exists
  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (selErr) {
    console.error('select profiles error:', selErr);
    return;
  }

  // If missing, create it from Auth metadata
  if (!existing) {
    const md = user.user_metadata || {};
    const { error: insErr } = await supabase.from('profiles').insert({
      id: user.id,
      first_name: md.first_name ?? null,
      last_name:  md.last_name  ?? null,
      updated_at: new Date().toISOString(),
    });
    if (insErr) console.error('insert profiles error:', insErr);
  }
}