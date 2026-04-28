import { supabase } from './supabase/client';

export async function createNotification({
  userId,
  title,
  message,
  type,
  entityType = null,
  entityId = null,
}) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
      });

    if (error) {
      console.error('Notification error:', error.message);
    }
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
}