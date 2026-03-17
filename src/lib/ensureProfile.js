
import { supabase } from './supabase/client';

  export async function getProfile(userid) {
    try{
      const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userid)
      .maybeSingle();

      if (error) {
        return{error};
      }
  
      if (!data) {
        return { notFound: true };
      }
      return { profile: data };
  } catch (err) {
    return { error: err };
  }

  }
