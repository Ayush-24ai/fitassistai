import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const { setUser: setStoreUser, setAuthenticated, logout: storeLogout } = useAuthStore();

  const checkProfileCompletion = async (userId: string): Promise<boolean> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking profile:', error);
        return false;
      }

      // Profile is complete if display_name is set
      return !!(profile?.display_name);
    } catch (err) {
      console.error('Profile check error:', err);
      return false;
    }
  };

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
            name: session.user.user_metadata?.display_name ?? session.user.email?.split('@')[0] ?? '',
          });
          setAuthenticated(true);
          
          // Check profile completion
          const isComplete = await checkProfileCompletion(session.user.id);
          setProfileComplete(isComplete);
        } else {
          storeLogout();
          setProfileComplete(false);
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
          name: session.user.user_metadata?.display_name ?? session.user.email?.split('@')[0] ?? '',
        });
        setAuthenticated(true);
        
        // Check profile completion
        const isComplete = await checkProfileCompletion(session.user.id);
        setProfileComplete(isComplete);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setStoreUser, setAuthenticated, storeLogout]);

  const signUp = async (email: string, password: string, displayName?: string) => {
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
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      storeLogout();
      setProfileComplete(false);
    }
    return { error };
  };

  const refreshProfileStatus = async () => {
    if (user) {
      const isComplete = await checkProfileCompletion(user.id);
      setProfileComplete(isComplete);
    }
  };

  return {
    user,
    session,
    loading,
    profileComplete,
    signUp,
    signIn,
    signOut,
    refreshProfileStatus,
  };
}
