import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from './useAuth';

// Pro status is ALWAYS fetched from the server - never trust local state
// This ensures consistent Pro status across all devices

export function useProStatus() {
  const { user } = useAuth();
  const { isPro, proExpiresAt, setPro, clearProStatus, markProSynced } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // Fetch Pro status from server - this is the ONLY source of truth
  const refreshProStatus = useCallback(async (forceRefresh = false): Promise<boolean> => {
    const userId = user?.id;
    
    if (!userId) {
      // No user - clear Pro status
      clearProStatus();
      setExpirationDate(null);
      setLoading(false);
      setLastSyncError(null);
      hasFetchedRef.current = false;
      currentUserIdRef.current = null;
      return false;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current && !forceRefresh) {
      return isPro;
    }

    // Skip if we've already fetched for this user (unless forced)
    if (!forceRefresh && hasFetchedRef.current && currentUserIdRef.current === userId) {
      setLoading(false);
      return isPro;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setLastSyncError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro, pro_expires_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching Pro status from server:', error);
        setLastSyncError('Failed to sync subscription status');
        setLoading(false);
        isFetchingRef.current = false;
        return false;
      }

      if (data) {
        const now = new Date();
        const expiresAt = data.pro_expires_at ? new Date(data.pro_expires_at) : null;
        const isProActive = data.is_pro === true && (!expiresAt || expiresAt > now);

        // Update local state with server data
        setPro(isProActive, expiresAt?.toISOString() || null);
        setExpirationDate(expiresAt);
        markProSynced();

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
        isFetchingRef.current = false;
        setLoading(false);
        
        return isProActive;
      } else {
        // No profile found - ensure Pro is false
        setPro(false, null);
        setExpirationDate(null);
        hasFetchedRef.current = true;
        currentUserIdRef.current = userId;
        isFetchingRef.current = false;
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Error in refreshProStatus:', err);
      setLastSyncError('Failed to sync subscription status');
      isFetchingRef.current = false;
      setLoading(false);
      return false;
    }
  }, [user?.id, isPro, setPro, clearProStatus, markProSynced]);

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

  // Activate Pro subscription for 30 days - ALWAYS update server first
  // Uses UPSERT to handle cases where profile doesn't exist yet
  const activatePro = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      console.error('activatePro: No user ID available');
      return false;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtISO = expiresAt.toISOString();

    try {
      console.log('Activating Pro for user:', user.id);
      
      // Use UPSERT to create or update the profile
      // This handles both new users (no profile) and existing users
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id,
          is_pro: true, 
          pro_expires_at: expiresAtISO,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Error upserting Pro status:', upsertError);
        return false;
      }

      // Verify the upsert by re-fetching from server
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('is_pro, pro_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (verifyError) {
        console.error('Pro activation verification error:', verifyError);
        return false;
      }

      if (!verifyData?.is_pro) {
        console.error('Pro activation verification failed - is_pro not set');
        return false;
      }

      console.log('Pro activation verified successfully:', verifyData);

      // Only update local state after server confirmation
      setPro(true, expiresAtISO);
      setExpirationDate(expiresAt);
      markProSynced();
      hasFetchedRef.current = true;
      
      return true;
    } catch (err) {
      console.error('Error in activatePro:', err);
      return false;
    }
  }, [user?.id, setPro, markProSynced]);

  // Get Pro expiration date (always from state, which reflects server)
  const getProExpiration = useCallback(() => {
    if (expirationDate) return expirationDate;
    if (proExpiresAt) return new Date(proExpiresAt);
    return null;
  }, [expirationDate, proExpiresAt]);

  return {
    isPro,
    loading,
    lastSyncError,
    activatePro,
    getProExpiration,
    refreshProStatus: () => refreshProStatus(true), // Always force refresh when called manually
    expirationDate: expirationDate || (proExpiresAt ? new Date(proExpiresAt) : null),
  };
}
