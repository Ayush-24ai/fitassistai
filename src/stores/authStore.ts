import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GuestUsage {
  hasUsedFeature: boolean;
  featureUsed: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isPro: boolean;
  proExpiresAt: string | null;
  proLastSynced: number | null; // Timestamp of last server sync
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  guestUsage: GuestUsage;
  setAuthenticated: (value: boolean) => void;
  setPro: (value: boolean, expiresAt?: string | null) => void;
  markProSynced: () => void;
  setUser: (user: AuthState['user']) => void;
  setGuestUsage: (feature: string) => void;
  resetGuestUsage: () => void;
  logout: () => void;
  clearProStatus: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isPro: false,
      proExpiresAt: null,
      proLastSynced: null,
      user: null,
      guestUsage: {
        hasUsedFeature: false,
        featureUsed: null,
      },
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setPro: (value, expiresAt = null) => set({ 
        isPro: value, 
        proExpiresAt: expiresAt,
        proLastSynced: Date.now()
      }),
      markProSynced: () => set({ proLastSynced: Date.now() }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setGuestUsage: (feature) => set({ 
        guestUsage: { hasUsedFeature: true, featureUsed: feature } 
      }),
      resetGuestUsage: () => set({ 
        guestUsage: { hasUsedFeature: false, featureUsed: null } 
      }),
      logout: () => set({ 
        isAuthenticated: false, 
        // Clear Pro status on logout - will be re-fetched from server on next login
        isPro: false,
        proExpiresAt: null,
        proLastSynced: null,
        user: null,
        guestUsage: { hasUsedFeature: false, featureUsed: null }
      }),
      clearProStatus: () => set({
        isPro: false,
        proExpiresAt: null,
        proLastSynced: null
      }),
    }),
    {
      name: 'fitness-assist-auth',
      partialize: (state) => ({
        // Only persist guest usage - Pro status should always come from server
        guestUsage: state.guestUsage,
      }),
    }
  )
);
