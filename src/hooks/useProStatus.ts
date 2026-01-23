import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from './useAuth';

export function useProStatus() {
  const { user } = useAuth();
  const { isPro, setPro } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  // Load Pro status from database on mount and when user changes
  const refreshProStatus = useCallback(async () => {
    if (!user?.id) {
      setPro(false);
      setLoading(false);
      setExpirationDate(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro, pro_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading Pro status:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Check if Pro is active and not expired
        const isProActive = data.is_pro && 
          (!data.pro_expires_at || new Date(data.pro_expires_at) > new Date());
        
        setPro(isProActive);
        
        if (data.pro_expires_at) {
          setExpirationDate(new Date(data.pro_expires_at));
        }

        // If Pro expired, update the database
        if (data.is_pro && data.pro_expires_at && new Date(data.pro_expires_at) <= new Date()) {
          await supabase
            .from('profiles')
            .update({ is_pro: false, pro_expires_at: null })
            .eq('user_id', user.id);
          setPro(false);
          setExpirationDate(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, setPro]);

  useEffect(() => {
    refreshProStatus();
  }, [refreshProStatus]);

  // Activate Pro subscription for 30 days
  const activatePro = useCallback(async () => {
    if (!user?.id) return false;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

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

    // Immediately update local state
    setPro(true);
    setExpirationDate(expiresAt);
    
    return true;
  }, [user?.id, setPro]);

  // Get Pro expiration date
  const getProExpiration = useCallback(async () => {
    if (!user?.id) return null;
    
    // Return cached value if available
    if (expirationDate) return expirationDate;

    const { data, error } = await supabase
      .from('profiles')
      .select('pro_expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data?.pro_expires_at) return null;
    const date = new Date(data.pro_expires_at);
    setExpirationDate(date);
    return date;
  }, [user?.id, expirationDate]);

  return {
    isPro,
    loading,
    activatePro,
    getProExpiration,
    refreshProStatus,
    expirationDate,
  };
}
