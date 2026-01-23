import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from './useAuth';

export function useProStatus() {
  const { user } = useAuth();
  const { isPro, setPro } = useAuthStore();

  // Load Pro status from database on mount
  useEffect(() => {
    if (!user?.id) {
      setPro(false);
      return;
    }

    const loadProStatus = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro, pro_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading Pro status:', error);
        return;
      }

      if (data) {
        // Check if Pro is active and not expired
        const isProActive = data.is_pro && 
          (!data.pro_expires_at || new Date(data.pro_expires_at) > new Date());
        
        setPro(isProActive);

        // If Pro expired, update the database
        if (data.is_pro && data.pro_expires_at && new Date(data.pro_expires_at) <= new Date()) {
          await supabase
            .from('profiles')
            .update({ is_pro: false, pro_expires_at: null })
            .eq('user_id', user.id);
        }
      }
    };

    loadProStatus();
  }, [user?.id, setPro]);

  // Activate Pro subscription for 1 month
  const activatePro = useCallback(async () => {
    if (!user?.id) return false;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_pro: true, 
        pro_expires_at: expiresAt.toISOString() 
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error activating Pro:', error);
      return false;
    }

    setPro(true);
    return true;
  }, [user?.id, setPro]);

  // Get Pro expiration date
  const getProExpiration = useCallback(async () => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('pro_expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data?.pro_expires_at) return null;
    return new Date(data.pro_expires_at);
  }, [user?.id]);

  return {
    isPro,
    activatePro,
    getProExpiration,
  };
}
