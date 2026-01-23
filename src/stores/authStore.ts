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
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  guestUsage: GuestUsage;
  setAuthenticated: (value: boolean) => void;
  setPro: (value: boolean, expiresAt?: string | null) => void;
  setUser: (user: AuthState['user']) => void;
  setGuestUsage: (feature: string) => void;
  resetGuestUsage: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isPro: false,
      proExpiresAt: null,
      user: null,
      guestUsage: {
        hasUsedFeature: false,
        featureUsed: null,
      },
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setPro: (value, expiresAt = null) => set({ isPro: value, proExpiresAt: expiresAt }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setGuestUsage: (feature) => set({ 
        guestUsage: { hasUsedFeature: true, featureUsed: feature } 
      }),
      resetGuestUsage: () => set({ 
        guestUsage: { hasUsedFeature: false, featureUsed: null } 
      }),
      logout: () => set({ 
        isAuthenticated: false, 
        // Keep isPro and proExpiresAt on logout - will be verified on next login
        user: null,
        guestUsage: { hasUsedFeature: false, featureUsed: null }
      }),
    }),
    {
      name: 'fitness-assist-auth',
      partialize: (state) => ({
        isPro: state.isPro,
        proExpiresAt: state.proExpiresAt,
        guestUsage: state.guestUsage,
      }),
    }
  )
);
