import { supabase } from './supabase/client';

export async function logAction({
  actorId,
  targetUserId = null,
  action,
  entityType,
  entityId = null,
  oldValue = null,
  newValue = null,
  notes = null,
}) {
  try {
    const { error } = await supabase
      .from('audit_log')
      .insert({
        actor_id: actorId,
        target_user_id: targetUserId,
        action,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        old_value: oldValue,
        new_value: newValue,
        notes,
      });

    if (error) {
      console.error('Audit log error:', error.message);
    }
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}