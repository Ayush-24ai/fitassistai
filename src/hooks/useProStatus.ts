import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from './useAuth';

export function useProStatus() {
  const { user } = useAuth();
  const { isPro, proExpiresAt, setPro } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [expirationDate, setExpirationDate] = useState<Date | null>(
    proExpiresAt ? new Date(proExpiresAt) : null
  );

  // Load Pro status from database on mount and when user changes
  const refreshProStatus = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
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
        const now = new Date();
        const expiresAt = data.pro_expires_at ? new Date(data.pro_expires_at) : null;
        const isProActive = data.is_pro && (!expiresAt || expiresAt > now);
        
        // Update store with expiration date
        setPro(isProActive, expiresAt?.toISOString() || null);
        setExpirationDate(expiresAt);

        // If Pro expired, update the database
        if (data.is_pro && expiresAt && expiresAt <= now) {
          await supabase
            .from('profiles')
            .update({ is_pro: false, pro_expires_at: null })
            .eq('user_id', user.id);
          setPro(false, null);
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

  // Validate cached Pro status on mount (check if still valid)
  useEffect(() => {
    if (isPro && proExpiresAt) {
      const expiresAt = new Date(proExpiresAt);
      if (expiresAt <= new Date()) {
        // Pro has expired, clear it
        setPro(false, null);
        setExpirationDate(null);
      }
    }
  }, [isPro, proExpiresAt, setPro]);

  // Activate Pro subscription for 30 days
  const activatePro = useCallback(async () => {
    if (!user?.id) return false;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    const expiresAtISO = expiresAt.toISOString();

    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_pro: true, 
        pro_expires_at: expiresAtISO 
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error activating Pro:', error);
      return false;
    }

    // Immediately update local state AND persisted store
    setPro(true, expiresAtISO);
    setExpirationDate(expiresAt);
    
    return true;
  }, [user?.id, setPro]);

  // Get Pro expiration date
  const getProExpiration = useCallback(async () => {
    // Return cached value first
    if (expirationDate) return expirationDate;
    if (proExpiresAt) return new Date(proExpiresAt);
    
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('pro_expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data?.pro_expires_at) return null;
    const date = new Date(data.pro_expires_at);
    setExpirationDate(date);
    return date;
  }, [user?.id, expirationDate, proExpiresAt]);

  return {
    isPro,
    loading,
    activatePro,
    getProExpiration,
    refreshProStatus,
    expirationDate: expirationDate || (proExpiresAt ? new Date(proExpiresAt) : null),
  };
}
