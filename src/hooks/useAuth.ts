import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use selectors to avoid destructuring issues with hydration
  const setStoreUser = useAuthStore((state) => state.setUser);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const storeLogout = useAuthStore((state) => state.logout);

  // Update or create profile for OAuth users
  const updateProfileForOAuth = useCallback(async (authUser: User) => {
    try {
      const provider = authUser.app_metadata?.provider || 'email';
      const isOAuth = provider !== 'email';
      
      if (!isOAuth) return;

      // Get user metadata from OAuth provider
      const metadata = authUser.user_metadata || {};
      const displayName = metadata.full_name || metadata.name || authUser.email?.split('@')[0] || '';
      const avatarUrl = metadata.avatar_url || metadata.picture || null;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        await supabase
          .from('profiles')
          .update({
            display_name: displayName,
            avatar_url: avatarUrl,
            auth_provider: provider,
          })
          .eq('user_id', authUser.id);
      } else {
        // Create new profile
        await supabase
          .from('profiles')
          .insert({
            user_id: authUser.id,
            display_name: displayName,
            avatar_url: avatarUrl,
            auth_provider: provider,
            is_pro: false,
          });
      }
    } catch (error) {
      console.error('Error updating OAuth profile:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setStoreUser({
            id: session.user.id,
            email: session.user.email ?? '',
            name: session.user.user_metadata?.display_name ?? 
                  session.user.user_metadata?.full_name ?? 
                  session.user.user_metadata?.name ?? 
                  session.user.email?.split('@')[0] ?? '',
          });
          setAuthenticated(true);
          
          // Handle OAuth profile creation/update
          if (event === 'SIGNED_IN') {
            // Use setTimeout to avoid blocking and potential deadlock with Supabase client
            setTimeout(() => updateProfileForOAuth(session.user), 0);
          }
        } else {
          storeLogout();
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setStoreUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.display_name ?? 
                session.user.user_metadata?.full_name ?? 
                session.user.user_metadata?.name ?? 
                session.user.email?.split('@')[0] ?? '',
        });
        setAuthenticated(true);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setStoreUser, setAuthenticated, storeLogout, updateProfileForOAuth]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    
    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      storeLogout();
    }
    return { error };
  }, [storeLogout]);

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}