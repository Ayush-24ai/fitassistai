import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from './useAuth';

// Sync Pro status from server on every login/load
// Never trust local cache for Pro status - always verify with server

export function useProStatus() {
  const { user } = useAuth();
  const { isPro, proExpiresAt, setPro, clearProStatus } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const hasFetchedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Fetch Pro status from server - this is the source of truth
  const refreshProStatus = useCallback(async (forceRefresh = false) => {
    const userId = user?.id;
    
    if (!userId) {
      // No user - clear Pro status
      clearProStatus();
      setExpirationDate(null);
      setLoading(false);
      hasFetchedRef.current = false;
      currentUserIdRef.current = null;
      return;
    }

    // Skip if we've already fetched for this user (unless forced)
    if (!forceRefresh && hasFetchedRef.current && currentUserIdRef.current === userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro, pro_expires_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching Pro status from server:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const now = new Date();
        const expiresAt = data.pro_expires_at ? new Date(data.pro_expires_at) : null;
        const isProActive = data.is_pro && (!expiresAt || expiresAt > now);

        // Update local state with server data
        setPro(isProActive, expiresAt?.toISOString() || null);
        setExpirationDate(expiresAt);

        // If Pro has expired, update the database
        if (data.is_pro && expiresAt && expiresAt <= now) {
          console.log('Pro subscription expired, updating database...');
          await supabase
            .from('profiles')
            .update({ is_pro: false, pro_expires_at: null })
            .eq('user_id', userId);
          
          setPro(false, null);
          setExpirationDate(null);
        }

        hasFetchedRef.current = true;
        currentUserIdRef.current = userId;
      } else {
        // No profile found - ensure Pro is false
        setPro(false, null);
        setExpirationDate(null);
      }
    } catch (err) {
      console.error('Error in refreshProStatus:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setPro, clearProStatus]);

  // Always fetch from server when user changes or on mount
  useEffect(() => {
    if (user?.id) {
      // User logged in - always verify Pro status from server
      refreshProStatus(true);
    } else {
      // No user - clear everything
      clearProStatus();
      setExpirationDate(null);
      setLoading(false);
      hasFetchedRef.current = false;
      currentUserIdRef.current = null;
    }
  }, [user?.id, refreshProStatus, clearProStatus]);

  // Listen for auth state changes to sync Pro status
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Force refresh Pro status when user signs in or token refreshes
        hasFetchedRef.current = false;
        refreshProStatus(true);
      } else if (event === 'SIGNED_OUT') {
        clearProStatus();
        setExpirationDate(null);
        hasFetchedRef.current = false;
        currentUserIdRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshProStatus, clearProStatus]);

  // Activate Pro subscription for 30 days
  const activatePro = useCallback(async () => {
    if (!user?.id) return false;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtISO = expiresAt.toISOString();

    try {
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

      // Update local state immediately after successful server update
      setPro(true, expiresAtISO);
      setExpirationDate(expiresAt);
      hasFetchedRef.current = true;
      
      return true;
    } catch (err) {
      console.error('Error in activatePro:', err);
      return false;
    }
  }, [user?.id, setPro]);

  // Get Pro expiration date (always from state, which reflects server)
  const getProExpiration = useCallback(() => {
    if (expirationDate) return expirationDate;
    if (proExpiresAt) return new Date(proExpiresAt);
    return null;
  }, [expirationDate, proExpiresAt]);

  return {
    isPro,
    loading,
    activatePro,
    getProExpiration,
    refreshProStatus: () => refreshProStatus(true), // Always force refresh when called manually
    expirationDate: expirationDate || (proExpiresAt ? new Date(proExpiresAt) : null),
  };
}
