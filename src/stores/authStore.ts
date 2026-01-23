import { create } from 'zustand';

interface GuestUsage {
  hasUsedFeature: boolean;
  featureUsed: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isPro: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  guestUsage: GuestUsage;
  setAuthenticated: (value: boolean) => void;
  setPro: (value: boolean) => void;
  setUser: (user: AuthState['user']) => void;
  setGuestUsage: (feature: string) => void;
  resetGuestUsage: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isPro: false,
  user: null,
  guestUsage: {
    hasUsedFeature: false,
    featureUsed: null,
  },
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setPro: (value) => set({ isPro: value }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setGuestUsage: (feature) => set({ 
    guestUsage: { hasUsedFeature: true, featureUsed: feature } 
  }),
  resetGuestUsage: () => set({ 
    guestUsage: { hasUsedFeature: false, featureUsed: null } 
  }),
  logout: () => set({ 
    isAuthenticated: false, 
    isPro: false, 
    user: null,
    guestUsage: { hasUsedFeature: false, featureUsed: null }
  }),
}));
